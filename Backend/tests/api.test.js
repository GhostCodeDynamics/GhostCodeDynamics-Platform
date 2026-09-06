import { test, before, after, afterEach, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const TEST_DB = "ghostcode_dynamics_test";

function buildTestUri() {
  const real = process.env.MONGO_URI;
  if (!real) return null;
  const url = new URL(real);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

const testUri = buildTestUri();
if (testUri) process.env.MONGO_URI = testUri;

const { default: mongoose } = await import("mongoose");
const { connectDB, disconnectDB } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");
const env = (await import("../src/config/env.js")).default;
const { default: Post } = await import("../src/models/Post.js");
const { default: Comment } = await import("../src/models/Comment.js");
const { default: Interaction } = await import("../src/models/Interaction.js");
const { default: Subscriber } = await import("../src/models/Subscriber.js");
const { default: Contact } = await import("../src/models/Contact.js");
const { default: Project } = await import("../src/models/Project.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const { ApiError } = await import("../src/utils/ApiError.js");
const {
  createRateLimiter,
  RATE_LIMITS,
} = await import("../src/middleware/rateLimits.js");

const ALL_MODELS = [Post, Comment, Interaction, Subscriber, Contact, Project];

let server;
let baseUrl;

function jsonFetch(path, method, body) {
  return fetch(baseUrl + path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const get = (path) => fetch(baseUrl + path);
const post = (path, body) => jsonFetch(path, "POST", body);
const del = (path, body) => jsonFetch(path, "DELETE", body);

async function seedPost(overrides = {}) {
  const doc = await Post.create({
    slug: `test-${crypto.randomUUID()}`,
    title: "Test Post Title",
    subtitle: "A subtitle",
    excerpt: "An excerpt used for search matching.",
    cover: "",
    category: "dev",
    tags: ["node"],
    author: { name: "Tester", role: "QA" },
    publishedAt: new Date("2024-01-01T00:00:00.000Z"),
    readingMinutes: 3,
    views: 0,
    likes: 0,
    commentsCount: 0,
    featured: false,
    trending: false,
    editorsPick: false,
    body: "Full body content for the post detail view.",
    ...overrides,
  });
  return doc;
}

async function withServer(target, fn) {
  const srv = target.listen(0);
  await new Promise((resolve) => srv.once("listening", resolve));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
}

async function assertLimiter(config) {
  const limiter = createRateLimiter(config);
  const target = express();
  target.post("/", limiter, (req, res) => res.json({ ok: true }));
  await withServer(target, async (base) => {
    for (let i = 0; i < config.limit; i += 1) {
      const res = await fetch(base + "/", { method: "POST" });
      assert.equal(res.status, 200, `request ${i + 1} should pass the limiter`);
    }
    const blocked = await fetch(base + "/", { method: "POST" });
    assert.equal(blocked.status, 429);
  });
}

before(async () => {
  if (!testUri) {
    throw new Error("MONGO_URI is not set; cannot run integration tests.");
  }
  const ok = await connectDB();
  if (!ok) {
    throw new Error("Failed to connect to the test database.");
  }
  assert.equal(
    mongooseName(),
    TEST_DB,
    `Refusing to run tests against ${mongooseName()}`
  );
  await mongooseDrop();
  await Promise.all(ALL_MODELS.map((m) => m.syncIndexes()));

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
});

afterEach(async () => {
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany({})));
});

function mongooseName() {
  return mongoose.connection.name;
}
async function mongooseDrop() {
  return mongoose.connection.dropDatabase();
}

describe("health & routing", () => {
  test("GET /api/health returns ok with smtp field", async () => {
    const res = await get("/api/health");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal("db" in body, false);
    assert.ok("smtp" in body, "health should include smtp status");
    assert.ok(
      body.smtp === "configured" || body.smtp === "unconfigured",
      "smtp field should be 'configured' or 'unconfigured'"
    );
  });

  test("unknown route returns 404 JSON", async () => {
    const res = await get("/api/does-not-exist");
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Route not found");
  });

  test("CORS allows the configured origin", async () => {
    const allowed = env.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean);
    const res = await fetch(baseUrl + "/api/health", {
      headers: { origin: allowed[0] },
    });
    assert.equal(res.headers.get("access-control-allow-origin"), allowed[0]);
  });
});

describe("posts", () => {
  test("lists published posts with meta and no body", async () => {
    await seedPost({ title: "Alpha Post" });
    const res = await get("/api/posts");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].title, "Alpha Post");
    assert.equal(body.data[0].body, undefined);
    assert.deepEqual(body.meta, {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    });
  });

  test("filters by category, tag and search", async () => {
    await seedPost({ slug: `test-${crypto.randomUUID()}`, category: "dev", tags: ["node", "api"], title: "Alpha Router" });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, category: "dev", tags: ["node"], title: "Beta Server" });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, category: "design", tags: ["css"], title: "Gamma Style" });

    const byCategory = await (await get("/api/posts?category=design")).json();
    assert.deepEqual(byCategory.data.map((p) => p.title), ["Gamma Style"]);

    const byTag = await (await get("/api/posts?tag=api")).json();
    assert.deepEqual(byTag.data.map((p) => p.title), ["Alpha Router"]);

    const bySearch = await (await get("/api/posts?search=beta")).json();
    assert.deepEqual(bySearch.data.map((p) => p.title), ["Beta Server"]);
  });

  test("escapes regex metacharacters in search", async () => {
    await seedPost({ title: "Alpha [x]" });
    const res = await get("/api/posts?search=a%5B");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 0);
  });

  test("sorts by views, likes and comments", async () => {
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "A", views: 10, likes: 5, commentsCount: 3, publishedAt: new Date("2024-01-01") });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "B", views: 30, likes: 2, commentsCount: 8, publishedAt: new Date("2024-01-03") });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "C", views: 20, likes: 9, commentsCount: 1, publishedAt: new Date("2024-01-02") });

    const views = await (await get("/api/posts?sort=views")).json();
    assert.deepEqual(views.data.map((p) => p.title), ["B", "C", "A"]);

    const likes = await (await get("/api/posts?sort=likes")).json();
    assert.deepEqual(likes.data.map((p) => p.title), ["C", "A", "B"]);

    const comments = await (await get("/api/posts?sort=comments")).json();
    assert.deepEqual(comments.data.map((p) => p.title), ["B", "A", "C"]);

    const oldest = await (await get("/api/posts?sort=oldest")).json();
    assert.deepEqual(oldest.data.map((p) => p.title), ["A", "C", "B"]);
  });

  test("paginates", async () => {
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "A" });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "B" });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "C" });

    const res = await (await get("/api/posts?limit=2&page=2")).json();
    assert.equal(res.data.length, 1);
    assert.equal(res.meta.total, 3);
    assert.equal(res.meta.totalPages, 2);
    assert.equal(res.meta.page, 2);
    assert.equal(res.meta.limit, 2);
  });

  test("invalid sort returns 400 with errors", async () => {
    const res = await get("/api/posts?sort=bogus");
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
  });

  test("returns detail with body, increments views, related and prev/next", async () => {
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Oldest", publishedAt: new Date("2024-01-01") });
    const mid = await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Middle", publishedAt: new Date("2024-01-02"), category: "solo" });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Newest", publishedAt: new Date("2024-01-03"), category: "solo" });

    const first = await get(`/api/posts/${mid.slug}`);
    assert.equal(first.status, 200);
    const detail = await first.json();
    assert.equal(detail.data.body, "Full body content for the post detail view.");
    assert.equal(detail.data.views, 1);
    assert.ok(Array.isArray(detail.data.related));
    assert.ok(detail.data.prev && detail.data.prev.title === "Oldest");
    assert.ok(detail.data.next && detail.data.next.title === "Newest");

    await get(`/api/posts/${mid.slug}`);
    const afterTwo = await (await get(`/api/posts/${mid.slug}`)).json();
    assert.equal(afterTwo.data.views, 3);
  });

  test("detail 404 for unknown slug and 400 for invalid slug", async () => {
    const notFound = await get("/api/posts/never-existed");
    assert.equal(notFound.status, 404);
    const invalid = await get("/api/posts/UpperCase");
    assert.equal(invalid.status, 400);
  });

  test("featured, editors-picks and trending sections", async () => {
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Featured One", featured: true });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Featured Two", featured: true, publishedAt: new Date("2024-02-01") });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Pick One", editorsPick: true });
    await seedPost({ slug: `test-${crypto.randomUUID()}`, title: "Trend One", trending: true });

    const featured = await (await get("/api/posts/featured")).json();
    assert.equal(featured.data.title, "Featured Two");

    const picks = await (await get("/api/posts/editors-picks")).json();
    assert.deepEqual(picks.data.map((p) => p.title), ["Pick One"]);

    const trending = await (await get("/api/posts/trending")).json();
    assert.deepEqual(trending.data.map((p) => p.title), ["Trend One"]);
  });
});

describe("comments", () => {
  test("lists comments flat and ascending", async () => {
    const postDoc = await seedPost();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await post(`/api/posts/${postDoc.slug}/comments`, {
      body: "First comment",
      author: "Ada",
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await post(`/api/posts/${postDoc.slug}/comments`, {
      body: "Second comment",
      author: "Bob",
    });

    const res = await get(`/api/posts/${postDoc.slug}/comments`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.length, 2);
    assert.equal(body.data[0].body, "First comment");
    assert.equal(body.data[1].body, "Second comment");
    assert.equal(body.data[0].likes, 0);
  });

  test("creates a comment and increments the post counter", async () => {
    const postDoc = await seedPost();
    const res = await post(`/api/posts/${postDoc.slug}/comments`, {
      body: "A useful comment",
      author: "Ada",
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.body, "A useful comment");
    assert.equal(body.data.author, "Ada");

    const updated = await Post.findById(postDoc._id).lean();
    assert.equal(updated.commentsCount, 1);
  });

  test("rejects too-short body with 400 and errors", async () => {
    const postDoc = await seedPost();
    const res = await post(`/api/posts/${postDoc.slug}/comments`, { body: "x" });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
  });

  test("rejects a parent from another post", async () => {
    const postA = await seedPost({ slug: `test-${crypto.randomUUID()}` });
    const postB = await seedPost({ slug: `test-${crypto.randomUUID()}` });
    const created = await (
      await post(`/api/posts/${postA.slug}/comments`, { body: "Parent comment" })
    ).json();

    const res = await post(`/api/posts/${postB.slug}/comments`, {
      body: "Child comment",
      parentId: created.data._id,
    });
    assert.equal(res.status, 400);
  });

  test("rejects a nonexistent parent id", async () => {
    const postDoc = await seedPost();
    const res = await post(`/api/posts/${postDoc.slug}/comments`, {
      body: "Child comment",
      parentId: "000000000000000000000000",
    });
    assert.equal(res.status, 400);
  });

  test("404 when commenting on an unknown post", async () => {
    const res = await post("/api/posts/never-existed/comments", {
      body: "A comment",
    });
    assert.equal(res.status, 404);
  });
});

describe("interactions", () => {
  test("requires a valid actorId", async () => {
    const postDoc = await seedPost();
    const missing = await post(`/api/posts/${postDoc.slug}/like`, {});
    assert.equal(missing.status, 400);
    const short = await post(`/api/posts/${postDoc.slug}/like`, {
      actorId: "short",
    });
    assert.equal(short.status, 400);
  });

  test("like/unlike post is idempotent and server-counted", async () => {
    const postDoc = await seedPost();
    const actorId = "test-actor-0001";

    const liked = await post(`/api/posts/${postDoc.slug}/like`, { actorId });
    assert.equal(liked.status, 200);
    assert.deepEqual(await liked.json(), { success: true, data: { liked: true } });

    await post(`/api/posts/${postDoc.slug}/like`, { actorId });
    let updated = await Post.findById(postDoc._id).lean();
    assert.equal(updated.likes, 1);

    const unliked = await del(`/api/posts/${postDoc.slug}/like`, { actorId });
    assert.equal(unliked.status, 200);
    updated = await Post.findById(postDoc._id).lean();
    assert.equal(updated.likes, 0);

    await del(`/api/posts/${postDoc.slug}/like`, { actorId });
    updated = await Post.findById(postDoc._id).lean();
    assert.equal(updated.likes, 0);
  });

  test("bookmark/unbookmark does not touch like counters", async () => {
    const postDoc = await seedPost();
    const actorId = "test-actor-0002";

    const bookmarked = await post(`/api/posts/${postDoc.slug}/bookmark`, { actorId });
    assert.deepEqual(await bookmarked.json(), { success: true, data: { bookmarked: true } });
    await post(`/api/posts/${postDoc.slug}/bookmark`, { actorId });

    let updated = await Post.findById(postDoc._id).lean();
    assert.equal(updated.likes, 0);

    const unbookmarked = await del(`/api/posts/${postDoc.slug}/bookmark`, { actorId });
    assert.deepEqual(await unbookmarked.json(), { success: true, data: { bookmarked: false } });
  });

  test("like/unlike comment is idempotent and guarded", async () => {
    const postDoc = await seedPost();
    const comment = await Comment.create({
      postSlug: postDoc.slug,
      author: "Ada",
      body: "A comment to like",
    });
    const actorId = "test-actor-0003";

    await post(`/api/comments/${comment._id}/like`, { actorId });
    await post(`/api/comments/${comment._id}/like`, { actorId });
    let updated = await Comment.findById(comment._id).lean();
    assert.equal(updated.likes, 1);

    await del(`/api/comments/${comment._id}/like`, { actorId });
    updated = await Comment.findById(comment._id).lean();
    assert.equal(updated.likes, 0);

    await del(`/api/comments/${comment._id}/like`, { actorId });
    updated = await Comment.findById(comment._id).lean();
    assert.equal(updated.likes, 0);
  });

  test("404 when liking an unknown comment", async () => {
    const res = await post("/api/comments/000000000000000000000000/like", {
      actorId: "test-actor-0004",
    });
    assert.equal(res.status, 404);
  });

  test("404 when liking an unknown post", async () => {
    const res = await post("/api/posts/never-existed/like", {
      actorId: "test-actor-0005",
    });
    assert.equal(res.status, 404);
  });
});

describe("newsletter", () => {
  test("subscribe is idempotent and stores a single active subscriber", async () => {
    const res = await post("/api/newsletter/subscribe", {
      email: "TEST+1@Example.com",
    });
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { success: true, data: { subscribed: true } });

    await post("/api/newsletter/subscribe", { email: "test+1@example.com" });
    assert.equal(await Subscriber.countDocuments({ email: "test+1@example.com" }), 1);

    const doc = await Subscriber.findOne({ email: "test+1@example.com" }).lean();
    assert.equal(doc.status, "active");
  });

  test("unsubscribe is idempotent and re-subscribe reactivates", async () => {
    const email = "test+2@example.com";
    await post("/api/newsletter/subscribe", { email });

    const res = await post("/api/newsletter/unsubscribe", { email });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { success: true, data: { unsubscribed: true } });

    let doc = await Subscriber.findOne({ email }).lean();
    assert.equal(doc.status, "unsubscribed");
    assert.ok(doc.unsubscribedAt);

    await post("/api/newsletter/unsubscribe", { email });
    doc = await Subscriber.findOne({ email }).lean();
    assert.equal(doc.status, "unsubscribed");

    await post("/api/newsletter/subscribe", { email });
    doc = await Subscriber.findOne({ email }).lean();
    assert.equal(doc.status, "active");
    assert.equal(doc.unsubscribedAt, null);
  });

  test("rejects an invalid email", async () => {
    const res = await post("/api/newsletter/subscribe", { email: "not-an-email" });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(Array.isArray(body.errors) && body.errors.length > 0);
  });
});

describe("contact", () => {
  test("submits contact with default status new", async () => {
    const res = await post("/api/contact", {
      name: "Ada Test",
      email: "ada@example.com",
      phone: "1234567890",
      topic: "project",
      message: "I need a new website for my bakery.",
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.topic, "project");
    assert.ok(body.data.id);
    assert.ok(body.data.createdAt);

    const doc = await Contact.findById(body.data.id).lean();
    assert.equal(doc.status, "new");
  });

  test("rejects missing name", async () => {
    const res = await post("/api/contact", {
      email: "ada@example.com",
      phone: "1234567890",
      topic: "project",
      message: "A sufficiently long message here.",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.field === "name"));
  });

  test("rejects invalid email", async () => {
    const res = await post("/api/contact", {
      name: "Ada Test",
      email: "nope",
      phone: "1234567890",
      topic: "project",
      message: "A sufficiently long message here.",
    });
    assert.equal(res.status, 400);
  });

  test("rejects too-short message and invalid topic", async () => {
    const res = await post("/api/contact", {
      name: "Ada Test",
      email: "ada@example.com",
      phone: "1234567890",
      topic: "weird",
      message: "short",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.some((e) => e.field === "topic"));
    assert.ok(body.errors.some((e) => e.field === "message"));
  });
});

describe("projects", () => {
  test("lists projects ordered and returns detail", async () => {
    await Project.create([
      { name: "Second", slug: `test-${crypto.randomUUID()}`, category: "web", order: 2, publishedAt: new Date("2024-01-01T00:00:00.000Z") },
      { name: "First", slug: `test-${crypto.randomUUID()}`, category: "api", order: 1, publishedAt: new Date("2024-01-01T00:00:00.000Z") },
    ]);

    const list = await (await get("/api/projects")).json();
    assert.equal(list.success, true);
    assert.equal(list.data.length, 2);
    assert.equal(list.data[0].name, "First");
    assert.equal(list.data[1].name, "Second");

    const detail = await (await get(`/api/projects/${list.data[0].slug}`)).json();
    assert.equal(detail.data.name, "First");
  });

  test("404 for unknown project slug", async () => {
    const res = await get("/api/projects/never-existed");
    assert.equal(res.status, 404);
  });
});

describe("security", () => {
  test("malformed JSON returns 400 Invalid JSON payload", async () => {
    const res = await fetch(baseUrl + "/api/newsletter/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid JSON payload");
  });

  test("payload over the 100kb limit returns 413", async () => {
    const res = await fetch(baseUrl + "/api/newsletter/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ big: "x".repeat(200 * 1024) }),
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test("500 errors are generic and never leak credentials in production", () => {
    const req = { method: "POST", originalUrl: "/api/x" };
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    const originalNodeEnv = env.nodeEnv;
    env.nodeEnv = "production";
    try {
      errorHandler(
        new Error("failed with password=supersecretvalue123"),
        req,
        res,
        () => {}
      );
    } finally {
      env.nodeEnv = originalNodeEnv;
    }
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Internal server error");
    assert.equal(res.body.stack, undefined);
    assert.ok(!JSON.stringify(res.body).includes("supersecretvalue123"));
  });

  test("ApiError 400 passes through errors array", () => {
    const req = { method: "POST", originalUrl: "/api/contact" };
    const res = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };
    errorHandler(
      new ApiError(400, "Invalid contact submission", [
        { field: "email", message: "Invalid email address" },
      ]),
      req,
      res,
      () => {}
    );
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Invalid contact submission");
    assert.equal(res.body.errors[0].field, "email");
  });
});

describe("rate limits", () => {
  test("newsletter limiter blocks the 11th request", async () => {
    await assertLimiter(RATE_LIMITS.newsletter);
  });

  test("comments limiter blocks the 21st request", async () => {
    await assertLimiter(RATE_LIMITS.comments);
  });

  test("interactions limiter blocks the 61st request", async () => {
    await assertLimiter(RATE_LIMITS.interactions);
  });

  test("contact limiter blocks the 6th request", async () => {
    await assertLimiter(RATE_LIMITS.contact);
  });
});
