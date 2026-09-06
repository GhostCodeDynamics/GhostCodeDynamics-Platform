/**
 * Integration tests for /api/admin/uploads/image (Cloudinary image uploads).
 *
 * Cloudinary is MOCKED at the SDK level (cloudinary.uploader.upload_stream /
 * destroy) so no real credentials or network traffic are used. Verification
 * focuses on: auth guards, multipart validation, size/type limits, safe
 * responses (secrets never leak) and safe replace-cleanup semantics.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const FAKE_SECRET = `test-api-secret-${crypto.randomBytes(12).toString("hex")}`;

if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  process.env.JWT_ACCESS_SECRET = `test-secret-${crypto.randomBytes(24).toString("hex")}`;
}
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = FAKE_SECRET;
// Assert production behavior: the error handler must not attach stack
// traces or internal details to responses.
process.env.NODE_ENV = "production";

const { default: app } = await import("../src/app.js");
const jwt = (await import("jsonwebtoken")).default;
const cloudinary = (await import("cloudinary")).v2;

let server;
let baseUrl;
let adminToken;
let editorToken;

/** Records destroy() calls so replace-cleanup can be asserted. */
const destroyedPublicIds = [];

function mockUploadStreamResult(overrides = {}) {
  return {
    secure_url: "https://res.cloudinary.com/test-cloud/image/upload/v1/ghostcode-dynamics/projects/sample.jpg",
    public_id: "ghostcode-dynamics/projects/sample",
    width: 1200,
    height: 800,
    format: "jpg",
    ...overrides,
  };
}

function stubCloudinary({ fail = false, result = mockUploadStreamResult() } = {}) {
  destroyedPublicIds.length = 0;
  cloudinary.uploader.upload_stream = (_options, cb) => ({
    on() {},
    end(_buf) {
      if (fail) cb(new Error("cloudinary rejected the upload"));
      else cb(null, result);
    },
  });
  cloudinary.uploader.destroy = async (publicId) => {
    destroyedPublicIds.push(publicId);
    return { result: "ok", public_id: publicId };
  };
}

function signAccessToken({ role = "admin", subject } = {}) {
  return jwt.sign(
    { type: "access", email: "uploads-admin@test.local", role },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: "HS256", subject: subject ?? crypto.randomUUID(), expiresIn: "15m" }
  );
}

function uploadForm({ buffer, mime, name, folder = "projects", replacePublicId } = {}) {
  const form = new FormData();
  form.append(
    "image",
    new Blob([buffer ?? Buffer.from("fake-jpeg-bytes")], { type: mime ?? "image/jpeg" }),
    name ?? "sample.jpg"
  );
  if (folder) form.append("folder", folder);
  if (replacePublicId) form.append("replacePublicId", replacePublicId);
  return form;
}

const uploadRequest = (form, token) =>
  fetch(`${baseUrl}/api/admin/uploads/image`, {
    method: "POST",
    body: form,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

before(async () => {
  stubCloudinary();
  adminToken = signAccessToken({ role: "admin" });
  editorToken = signAccessToken({ role: "editor" });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("admin uploads authorization", () => {
  test("unauthenticated upload is rejected with 401", async () => {
    const res = await uploadRequest(uploadForm(), null);
    assert.equal(res.status, 401);
  });

  test("non-admin role is rejected with 403", async () => {
    const res = await uploadRequest(uploadForm(), editorToken);
    assert.equal(res.status, 403);
  });
});

describe("admin upload validation", () => {
  test("authorized admin upload is accepted and returns safe metadata", async () => {
    stubCloudinary();
    const res = await uploadRequest(uploadForm(), adminToken);
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.url, "https://res.cloudinary.com/test-cloud/image/upload/v1/ghostcode-dynamics/projects/sample.jpg");
    assert.equal(body.data.publicId, "ghostcode-dynamics/projects/sample");
    assert.equal(body.data.width, 1200);
    assert.equal(body.data.height, 800);
    assert.equal(body.data.format, "jpg");
  });

  test("invalid MIME type is rejected with 415", async () => {
    const res = await uploadRequest(uploadForm({ mime: "text/plain", name: "evil.txt" }), adminToken);
    assert.equal(res.status, 415);
    const body = await res.json();
    assert.match(body.message, /Unsupported image type/i);
  });

  test("oversized file is rejected with 413", async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 0x61);
    const res = await uploadRequest(uploadForm({ mime: "image/jpeg", buffer: big }), adminToken);
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.match(body.message, /less than 5 MB/i);
  });

  test("invalid folder is rejected with 400", async () => {
    const res = await uploadRequest(uploadForm({ folder: "../../etc" }), adminToken);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.field === "folder"));
  });

  test("missing file is rejected with 400", async () => {
    const form = new FormData();
    form.append("folder", "projects");
    const res = await uploadRequest(form, adminToken);
    assert.equal(res.status, 400);
  });

  test("replacePublicId triggers deletion of the old asset only after success", async () => {
    stubCloudinary();
    const oldId = "ghostcode-dynamics/projects/old";
    const res = await uploadRequest(
      uploadForm({ replacePublicId: oldId }),
      adminToken
    );
    assert.equal(res.status, 201);
    assert.deepEqual(destroyedPublicIds, [oldId]);
  });

  test("invalid replacePublicId is rejected and no delete happens", async () => {
    stubCloudinary();
    const res = await uploadRequest(
      uploadForm({ replacePublicId: "some-other-folder/asset" }),
      adminToken
    );
    assert.equal(res.status, 400);
    assert.deepEqual(destroyedPublicIds, []);
  });
});

describe("cloudinary failure handling", () => {
  test("cloudinary failure returns a generic 500 with no secrets or stack leak of credentials", async () => {
    stubCloudinary({ fail: true });
    const res = await uploadRequest(uploadForm(), adminToken);
    assert.equal(res.status, 500);
    const raw = await res.text();
    assert.ok(!raw.includes(FAKE_SECRET));
    assert.ok(!raw.includes("cloudinary rejected the upload"));
    const body = JSON.parse(raw);
    assert.equal(body.message, "Internal server error");
  });

  test("success responses never include the API secret or key", async () => {
    stubCloudinary();
    const res = await uploadRequest(uploadForm(), adminToken);
    const raw = await res.text();
    assert.ok(!raw.includes(FAKE_SECRET));
    assert.ok(!raw.includes("test-api-key"));
  });
});

describe("delete endpoint", () => {
  const del = (publicId, token = adminToken) =>
    fetch(`${baseUrl}/api/admin/uploads/image`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ publicId }),
    });

  test("requires authentication", async () => {
    const res = await del("ghostcode-dynamics/projects/sample", null);
    assert.equal(res.status, 401);
  });

  test("rejects public ids outside our namespace", async () => {
    const res = await del("../etc/passwd");
    assert.equal(res.status, 400);
  });

  test("deletes an owned asset successfully", async () => {
    stubCloudinary();
    const res = await del("ghostcode-dynamics/projects/sample");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.deleted, true);
    assert.deepEqual(destroyedPublicIds, ["ghostcode-dynamics/projects/sample"]);
  });
});