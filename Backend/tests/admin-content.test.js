/**
 * Integration tests for Phase 6C admin content management:
 * - public post list flag filters (?featured/?trending/?editorsPick)
 * - authenticated /api/admin/posts CRUD
 * - authenticated /api/admin/projects CRUD + reorder
 *
 * Runs against the ISOLATED database ghostcode_dynamics_admin_content_test
 * and a fixture JWT secret, mirroring tests/api.test.js conventions.
 */
import { test, describe, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/ghostcode_dynamics_admin_content_test";
// Test-only signing secret (fixture value for this suite).
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  process.env.JWT_ACCESS_SECRET = `test-secret-${crypto.randomBytes(24).toString("hex")}`;
}

const { default: mongoose } = await import("mongoose");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const { default: Post } = await import("../src/models/Post.js");
const { default: Project } = await import("../src/models/Project.js");
const { default: Comment } = await import("../src/models/Comment.js");
const { default: Admin } = await import("../src/models/Admin.js");
const jwt = (await import("jsonwebtoken")).default;

const ALL_MODELS = [Post, Project, Comment, Admin];

let server;
let baseUrl;
let adminToken;
let editorToken;

/* ------------------------------ helpers ------------------------------ */

function signAccessToken({ role = "admin", subject } = {}) {
  return jwt.sign(
    { type: "access", email: "content-admin@test.local", role },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: "HS256", subject: subject ?? new mongoose.Types.ObjectId().toString(), expiresIn: "15m" }
  );
}

async function seedPost(overrides = {}) {
  const doc = await Post.create({
    slug: overrides.slug ?? `seed-${crypto.randomUUID().slice(0, 8)}`,
    title: overrides.title ?? `Seed ${crypto.randomUUID()}`,
    category: overrides.category ?? "Engineering",
    author: overrides.author ?? { name: "Seeder" },
    publishedAt: overrides.publishedAt ?? new Date(),
    ...overrides,
  });
  return doc;
}

async function seedProject(overrides = {}) {
  const doc = await Project.create({
    slug: overrides.slug ?? `seed-${crypto.randomUUID().slice(0, 8)}`,
    name: overrides.name ?? `Seed ${crypto.randomUUID()}`,
    category: "Web",
    publishedAt: overrides.publishedAt ?? new Date(),
    ...overrides,
  });
  return doc;
}

function postPayload(overrides = {}) {
  const unique = crypto.randomUUID().slice(0, 8);
  return {
    title: overrides.title ?? `API Post ${unique}`,
    category: "Testing",
    author: { name: "Test Author", role: "QA" },
    ...overrides,
  };
}

/* ------------------------------- setup ------------------------------- */

before(async () => {
  await connectDB();
  await Promise.all(ALL_MODELS.map((m) => m.syncIndexes()));
  const admin = await Admin.create({
    email: `content-${crypto.randomUUID()}@test.local`,
    passwordHash: "not-a-real-login-hash",
  });
  adminToken = signAccessToken({ role: "admin", subject: String(admin._id) });
  editorToken = signAccessToken({ role: "editor", subject: String(admin._id) });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany({})));
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

/* ------------------- public flag filters (STEP 2 fix) ------------------ */

describe("public post list flag filters", () => {
  test("featured=true returns only flagged posts", async () => {
    await seedPost({ title: "Plain A" });
    await seedPost({ title: "Feat B", featured: true });

    const res = await fetch(`${baseUrl}/api/posts?featured=true`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, "Feat B");
  });

  test("trending=true and editorsPick=true filter correctly", async () => {
    await seedPost({ title: "Plain" });
    await seedPost({ title: "Trending", trending: true });
    await seedPost({ title: "Pick", editorsPick: true });

    const trending = await (await fetch(`${baseUrl}/api/posts?trending=true`)).json();
    assert.deepEqual(trending.data.map((p) => p.title), ["Trending"]);

    const picks = await (await fetch(`${baseUrl}/api/posts?editorsPick=true`)).json();
    assert.deepEqual(picks.data.map((p) => p.title), ["Pick"]);
  });

  test("flag=false excludes flagged posts", async () => {
    await seedPost({ title: "Feat", featured: true });
    await seedPost({ title: "Normal" });

    const res = await fetch(`${baseUrl}/api/posts?featured=false`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.data.map((p) => p.title), ["Normal"]);
  });

  test("flags combine with category and search", async () => {
    await seedPost({ title: "Alpha Feat", featured: true, category: "Design" });
    await seedPost({ title: "Beta Plain", category: "Design" });
    await seedPost({ title: "Gamma Feat", featured: true, category: "Ops" });

    const res = await fetch(`${baseUrl}/api/posts?featured=true&category=Design&search=alpha`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.meta.total, 1);
    assert.equal(body.data[0].title, "Alpha Feat");
  });

  test("plain list and section endpoints remain compatible", async () => {
    await seedPost({ title: "Feat S", featured: true });
    await seedPost({ title: "Trend S", trending: true });
    await seedPost({ title: "Pick S", editorsPick: true });

    const plain = await (await fetch(`${baseUrl}/api/posts`)).json();
    assert.equal(plain.data.length, 3);

    const featured = await (await fetch(`${baseUrl}/api/posts/featured`)).json();
    assert.equal(featured.data.title, "Feat S");

    const trending = await (await fetch(`${baseUrl}/api/posts/trending`)).json();
    assert.deepEqual(trending.data.map((p) => p.title), ["Trend S"]);

    const picks = await (await fetch(`${baseUrl}/api/posts/editors-picks`)).json();
    assert.deepEqual(picks.data.map((p) => p.title), ["Pick S"]);
  });

  test("invalid flag values are rejected with 400", async () => {
    const res = await fetch(`${baseUrl}/api/posts?featured=maybe`);
    assert.equal(res.status, 400);
  });
});

/* ---------------------- admin posts authorization ---------------------- */

describe("admin posts authorization", () => {
  const auth = (path, { method = "GET", body, token } = {}) =>
    fetch(baseUrl + path, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  test("unauthenticated GET list is rejected with 401", async () => {
    const res = await auth("/api/admin/posts");
    assert.equal(res.status, 401);
  });

  test("unauthenticated POST is rejected with 401", async () => {
    const res = await auth("/api/admin/posts", { method: "POST", body: postPayload() });
    assert.equal(res.status, 401);
  });

  test("non-admin role is rejected with 403", async () => {
    const res = await auth("/api/admin/posts", {
      method: "POST",
      token: editorToken,
      body: postPayload(),
    });
    assert.equal(res.status, 403);
  });

  test("non-admin DELETE is rejected with 403", async () => {
    const post = await seedPost({});
    const res = await auth(`/api/admin/posts/${post._id}`, {
      method: "DELETE",
      token: editorToken,
    });
    assert.equal(res.status, 403);
  });
});

/* --------------------------- admin posts CRUD -------------------------- */

describe("admin posts CRUD", () => {
  const auth = (path, { method = "GET", body } = {}) =>
    fetch(baseUrl + path, {
      method,
      headers: {
        authorization: `Bearer ${adminToken}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  test("create returns 201 with generated slug and zeroed counters", async () => {
    const res = await auth("/api/admin/posts", {
      method: "POST",
      body: postPayload({
        title: "Deploying Ghost Code!",
        excerpt: "Intro",
        body: "## Hello\n- one\n- two",
        tags: ["node", "Node", "web"],
        publishedAt: new Date("2026-01-15T10:00:00Z").toISOString(),
        featured: true,
      }),
    });
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.match(data.slug, /^deploying-ghost-code$/);
    assert.deepEqual(data.tags, ["node", "web"]); // trimmed + deduped
    assert.equal(data.views, 0);
    assert.equal(data.likes, 0);
    assert.equal(data.commentsCount, 0);
    assert.equal(data.featured, true);
    assert.equal(data.author.name, "Test Author");
  });

  test("create without publishedAt produces a draft hidden from public list", async () => {
    const res = await auth("/api/admin/posts", {
      method: "POST",
      body: postPayload({ title: "Draft Only Piece" }),
    });
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.equal(data.publishedAt, null);

    const pub = await (await fetch(`${baseUrl}/api/posts`)).json();
    assert.ok(!pub.data.some((p) => p.slug === data.slug));
  });

  test("validation errors return field-level details", async () => {
    const res = await auth("/api/admin/posts", {
      method: "POST",
      body: { title: "", author: { name: "" }, views: 999 },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    const fields = body.errors.map((e) => e.field);
    assert.ok(fields.includes("title"));
    assert.ok(fields.includes("author.name"));
    assert.ok(fields.includes("views")); // protected counter rejected
  });

  test("duplicate explicit slug conflicts with 409", async () => {
    const existing = await seedPost({ title: "Existing" });
    const res = await auth("/api/admin/posts", {
      method: "POST",
      body: postPayload({ slug: existing.slug }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.field === "slug"));
  });

  test("GET by id returns full document including body", async () => {
    const post = await seedPost({ body: "## Body here" });
    const res = await auth(`/api/admin/posts/${post._id}`);
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.body, "## Body here");
  });

  test("GET unknown id -> 404, malformed id -> 400", async () => {
    const missing = await auth(`/api/admin/posts/${new mongoose.Types.ObjectId()}`);
    assert.equal(missing.status, 404);

    const bad = await auth("/api/admin/posts/not-an-id");
    assert.equal(bad.status, 400);
    const body = await bad.json();
    assert.ok(body.errors.some((e) => e.field === "id"));
  });

  test("admin list includes drafts, omits body, supports filters+meta", async () => {
    await seedPost({ title: "Live Alpha", featured: true });
    await seedPost({ title: "Draft Beta", publishedAt: null });
    await seedPost({ title: "Gamma Ops", category: "Ops" });

    const all = await (await auth("/api/admin/posts")).json();
    assert.equal(all.meta.total, 3);
    assert.ok(all.data.some((p) => p.publishedAt === null)); // drafts included
    assert.ok(all.data.every((p) => !("body" in p))); // body omitted

    const flagged = await (await auth("/api/admin/posts?featured=true&limit=1&page=1")).json();
    assert.equal(flagged.meta.total, 1);
    assert.equal(flagged.data[0].title, "Live Alpha");

    const searched = await (await auth("/api/admin/posts?search=gamma")).json();
    assert.equal(searched.meta.total, 1);

    const badSort = await auth("/api/admin/posts?sort=bogus");
    assert.equal(badSort.status, 400);
  });

  test("update edits editorial fields and persists them", async () => {
    const post = await seedPost({});
    const res = await auth(`/api/admin/posts/${post._id}`, {
      method: "PUT",
      body: { title: "Renamed", excerpt: "New excerpt", trending: true },
    });
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.title, "Renamed");
    assert.equal(data.excerpt, "New excerpt");
    assert.equal(data.trending, true);
    assert.equal(data.views, 0); // untouched

    const reloaded = await Post.findById(post._id).lean();
    assert.equal(reloaded.title, "Renamed");
  });

  test("update to conflicting slug -> 409; unique slug succeeds", async () => {
    const a = await seedPost({ title: "A" });
    const b = await seedPost({ title: "B" });

    const conflict = await auth(`/api/admin/posts/${b._id}`, {
      method: "PUT",
      body: { slug: a.slug },
    });
    assert.equal(conflict.status, 409);

    const ok = await auth(`/api/admin/posts/${b._id}`, {
      method: "PUT",
      body: { slug: "Brand New Slug!" },
    });
    assert.equal(ok.status, 200);
    const { data } = await ok.json();
    assert.equal(data.slug, "brand-new-slug");
  });

  test("update rejecting counter manipulation", async () => {
    const post = await seedPost({});
    const res = await auth(`/api/admin/posts/${post._id}`, {
      method: "PUT",
      body: { likes: 10000 },
    });
    assert.equal(res.status, 400);
  });

  test("publish lifecycle: null clears to draft, date publishes", async () => {
    const post = await seedPost({});
    const unpublish = await auth(`/api/admin/posts/${post._id}`, {
      method: "PUT",
      body: { publishedAt: null },
    });
    assert.equal(unpublish.status, 200);
    assert.equal((await unpublish.json()).data.publishedAt, null);

    let pub = await (await fetch(`${baseUrl}/api/posts`)).json();
    assert.ok(!pub.data.some((p) => p.slug === post.slug));

    const publish = await auth(`/api/admin/posts/${post._id}`, {
      method: "PUT",
      body: { publishedAt: new Date().toISOString() },
    });
    assert.equal(publish.status, 200);

    pub = await (await fetch(`${baseUrl}/api/posts`)).json();
    assert.ok(pub.data.some((p) => p.slug === post.slug));
  });

  test("delete removes the post and cascades to its comments", async () => {
    const post = await seedPost({});
    const comment = await Comment.create({
      postSlug: post.slug,
      author: "Reader",
      body: "Deleted with the post",
    });

    const res = await auth(`/api/admin/posts/${post._id}`, { method: "DELETE" });
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.deleted, true);
    assert.equal(data.id, String(post._id));

    const gone = await auth(`/api/admin/posts/${post._id}`);
    assert.equal(gone.status, 404);

    // Cascade policy: deleting a post also removes its comments, so the
    // admin comments queue never shows orphaned rows.
    const comments = await Comment.find({ postSlug: post.slug }).lean();
    assert.equal(comments.length, 0);
    const goneComment = await Comment.findById(comment._id).lean();
    assert.equal(goneComment, null);
  });
});

/* ------------------------- admin projects CRUD ------------------------- */

describe("admin projects CRUD", () => {
  const auth = (path, { method = "GET", body } = {}) =>
    fetch(baseUrl + path, {
      method,
      headers: {
        authorization: `Bearer ${adminToken}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  const projectPayload = (overrides = {}) => ({
    name: overrides.name ?? `Project ${crypto.randomUUID().slice(0, 8)}`,
    category: "Web",
    ...overrides,
  });

  test("create returns 201 with defaults", async () => {
    const res = await auth("/api/admin/projects", {
      method: "POST",
      body: projectPayload({
        name: "Nova Dashboard",
        tech: ["React", " Vite ", "React"],
        liveUrl: "https://nova.example.com",
        repoUrl: "",
        order: 5,
      }),
    });
    assert.equal(res.status, 201);
    const { data } = await res.json();
    assert.match(data.slug, /^nova-dashboard$/);
    assert.deepEqual(data.tech, ["React", "Vite"]);
    assert.equal(data.liveUrl, "https://nova.example.com");
    assert.equal(data.repoUrl, "");
    assert.equal(data.order, 5);
    assert.equal(data.featured, false);
  });

  test("validation rejects bad URLs and protected fields", async () => {
    const res = await auth("/api/admin/projects", {
      method: "POST",
      body: projectPayload({ liveUrl: "javascript:alert(1)", createdAt: new Date() }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    const fields = body.errors.map((e) => e.field);
    assert.ok(fields.includes("liveUrl"));
    assert.ok(fields.includes("createdAt"));
  });

  test("duplicate slug conflicts with 409", async () => {
    await seedProject({ name: "Original One", slug: "original-one" });
    const res = await auth("/api/admin/projects", {
      method: "POST",
      body: projectPayload({ name: "Original One" }), // derives slug original-one
    });
    assert.equal(res.status, 409);
  });

  test("get/update/delete lifecycle works", async () => {
    const created = await (
      await auth("/api/admin/projects", {
        method: "POST",
        body: projectPayload({ name: "Lifecycle P" }),
      })
    ).json();

    const got = await auth(`/api/admin/projects/${created.data._id}`);
    assert.equal(got.status, 200);

    const updated = await auth(`/api/admin/projects/${created.data._id}`, {
      method: "PUT",
      body: { solution: "Shipped v2", featured: true },
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.solution, "Shipped v2");

    const del = await auth(`/api/admin/projects/${created.data._id}`, { method: "DELETE" });
    assert.equal(del.status, 200);
    assert.equal((await del.json()).data.deleted, true);

    const gone = await auth(`/api/admin/projects/${created.data._id}`);
    assert.equal(gone.status, 404);
  });
});

/* ----------------------------- reorder --------------------------------- */

describe("project reorder", () => {
  const auth = (path, { method = "GET", body, token = adminToken } = {}) =>
    fetch(baseUrl + path, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  test("reorders all projects and public API reflects the new order", async () => {
    const a = await seedProject({ name: "First" });
    const b = await seedProject({ name: "Second" });
    const c = await seedProject({ name: "Third" });

    const res = await auth("/api/admin/projects/reorder", {
      method: "PATCH",
      body: {
        items: [
          { id: String(c._id), order: 0 },
          { id: String(a._id), order: 1 },
          { id: String(b._id), order: 2 },
        ],
      },
    });
    assert.equal(res.status, 200);
    const { data } = await res.json();
    assert.equal(data.updated, 3);

    const pub = await (await fetch(`${baseUrl}/api/projects`)).json();
    assert.deepEqual(pub.data.map((p) => p.name), ["Third", "First", "Second"]);
  });

  test("reorder requires authentication and admin role", async () => {
    const anon = await auth("/api/admin/projects/reorder", {
      method: "PATCH",
      token: null,
      body: { items: [] },
    });
    assert.equal(anon.status, 401);

    const forbidden = await auth("/api/admin/projects/reorder", {
      method: "PATCH",
      token: editorToken,
      body: { items: [] },
    });
    assert.equal(forbidden.status, 403);
  });

  test("invalid reorder payloads are rejected", async () => {
    const a = await seedProject({ name: "R1" });
    const b = await seedProject({ name: "R2" });
    const goodId = String(a._id);
    const otherId = String(b._id);

    const cases = [
      { items: [{ id: goodId, order: 0 }] }, // incomplete coverage
      { items: [] }, // empty
      {
        items: [
          { id: goodId, order: 0 },
          { id: goodId, order: 1 },
        ], // duplicate ids
      },
      {
        items: [
          { id: goodId, order: 1 },
          { id: otherId, order: 1 },
        ], // duplicate orders
      },
      {
        items: [
          { id: goodId, order: 0.5 },
          { id: otherId, order: 1 },
        ], // non-integer
      },
      {
        items: [
          { id: new mongoose.Types.ObjectId().toString(), order: 0 },
          { id: otherId, order: 1 },
        ], // unknown id
      },
    ];

    for (const body of cases) {
      const res = await auth("/api/admin/projects/reorder", { method: "PATCH", body });
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    }

    // Nothing was written by any failed attempt.
    const after = await Project.find({}).lean();
    assert.equal(after.length, 2);
    assert.ok(after.every((p) => p.order === 0));
  });
});
