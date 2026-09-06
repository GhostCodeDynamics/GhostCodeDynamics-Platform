/**
 * Integration tests for the /api/admin auth namespace.
 * Runs against an ISOLATED database (ghostcode_dynamics_admin_test) so it
 * never touches application data. Follows the conventions of api.test.js.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

const TEST_DB = "ghostcode_dynamics_admin_test";

function buildTestUri() {
  const real = process.env.MONGO_URI;
  if (!real) return null;
  const url = new URL(real);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

const testUri = buildTestUri();
if (testUri) process.env.MONGO_URI = testUri;
// Test-only signing secret (fixture value, not a real credential).
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  process.env.JWT_ACCESS_SECRET = "test-only-secret-".concat(
    crypto.randomBytes(24).toString("hex")
  );
}

const { default: mongoose } = await import("mongoose");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const { default: Admin } = await import("../src/models/Admin.js");
const bcrypt = (await import("bcryptjs")).default;

let server;
let baseUrl;

const ADMIN_EMAIL = `admin-${crypto.randomUUID()}@ghostcode.test`;
const ADMIN_PASSWORD = "correct-horse-battery-staple";

async function startServer() {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function createTestAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  return Admin.create({
    email: ADMIN_EMAIL,
    name: "Test Admin",
    role: "admin",
    passwordHash,
    sessions: [],
  });
}

function extractCookie(res) {
  const setCookie = res.headers.getSetCookie
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  const raw = setCookie.find((c) => c.startsWith("gcd_admin_refresh="));
  if (!raw) return null;
  // Pair for Cookie request headers; raw kept for attribute assertions.
  return { pair: raw.split(";")[0], raw };
}

before(async () => {
  if (!testUri) {
    throw new Error("MONGO_URI is not set; cannot run integration tests.");
  }
  await connectDB();
  assert.equal(
    mongoose.connection.name,
    TEST_DB,
    `Refusing to run tests against ${mongoose.connection.name}`
  );
  await Admin.deleteMany({});
  await startServer();
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

test("me without token -> 401", async () => {
  const res = await fetch(`${baseUrl}/api/admin/auth/me`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.success, false);
});

test("me with garbage token -> 401", async () => {
  const res = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { authorization: "Bearer not-a-real-token" },
  });
  assert.equal(res.status, 401);
});

test("login with invalid payload -> 400", async () => {
  const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(Array.isArray(body.errors));
});

test("login with unknown email -> 401", async () => {
  const res = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "nobody@ghostcode.test", password: "whatever-long-enough" }),
  });
  assert.equal(res.status, 401);
});

test("full session lifecycle: login -> me -> refresh rotation -> logout", async () => {
  await createTestAdmin();

  // --- login ---
  const loginRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.equal(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.equal(loginBody.success, true);
  assert.equal(loginBody.data.admin.email, ADMIN_EMAIL);
  assert.equal(typeof loginBody.data.accessToken, "string");
  const cookie1 = extractCookie(loginRes);
  assert.ok(cookie1, "refresh cookie must be set");
  assert.match(cookie1.raw, /HttpOnly/i);

  // --- wrong password still rejected after provisioning ---
  const badRes = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "definitely-wrong-pass" }),
  });
  assert.equal(badRes.status, 401, "bad-password should be 401");

  // --- me with access token ---
  const meRes = await fetch(`${baseUrl}/api/admin/auth/me`, {
    headers: { authorization: `Bearer ${loginBody.data.accessToken}` },
  });
  assert.equal(meRes.status, 200);
  const meBody = await meRes.json();
  assert.equal(meBody.data.email, ADMIN_EMAIL);
  assert.equal(meBody.data.role, "admin");

  // --- refresh rotates the refresh token ---
  const refreshRes = await fetch(`${baseUrl}/api/admin/auth/refresh`, {
    method: "POST",
    headers: { cookie: cookie1.pair },
  });
  assert.equal(refreshRes.status, 200);
  const refreshBody = await refreshRes.json();
  assert.equal(typeof refreshBody.data.accessToken, "string");
  const cookie2 = extractCookie(refreshRes);
  assert.ok(cookie2, "rotated refresh cookie must be set");
  assert.notEqual(cookie2.pair, cookie1.pair, "refresh token must rotate");

  // --- old refresh token is single-use -> rejected ---
  const reuseRes = await fetch(`${baseUrl}/api/admin/auth/refresh`, {
    method: "POST",
    headers: { cookie: cookie1.pair },
  });
  assert.equal(reuseRes.status, 401, "old refresh token must be rejected");

  // --- logout invalidates the current session ---
  const logoutRes = await fetch(`${baseUrl}/api/admin/auth/logout`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${refreshBody.data.accessToken}`,
      cookie: cookie2.pair,
    },
  });
  assert.equal(logoutRes.status, 200);

  const afterLogout = await fetch(`${baseUrl}/api/admin/auth/refresh`, {
    method: "POST",
    headers: { cookie: cookie2.pair },
  });
  assert.equal(afterLogout.status, 401, "refresh after logout must be rejected");
});
