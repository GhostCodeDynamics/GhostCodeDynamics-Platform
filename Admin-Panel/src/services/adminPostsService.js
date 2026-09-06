import { apiClient } from "./apiClient";

/**
 * Admin posts service — authenticated /api/admin/posts namespace.
 * Uses the central apiClient (Bearer attach + transparent 401 refresh).
 *
 * Contract (verified against backend tests):
 * GET    /admin/posts?page&limit&sort&category&tag&search&featured&trending&editorsPick
 *        -> { data: Post[] (no body field), meta }
 * GET    /admin/posts/:id   -> full post incl. body
 * POST   /admin/posts       -> 201 post | 400 errors[] | 409 slug conflict
 * PUT    /admin/posts/:id   -> 200 post (partial payload allowed)
 * DELETE /admin/posts/:id   -> { deleted, id, slug, title }
 *
 * Counters (views/likes/commentsCount) are server-owned and rejected by
 * the API; they are never included in payloads here.
 */

export const ADMIN_POST_SORTS = ["newest", "oldest", "views", "likes", "comments"];

export function listAdminPosts(params = {}, signal) {
  return apiClient.get("/admin/posts", { query: params, signal });
}

export function getAdminPost(id, signal) {
  return apiClient.get(`/admin/posts/${encodeURIComponent(id)}`, { signal });
}

export function createAdminPost(payload) {
  return apiClient.post("/admin/posts", payload);
}

export function updateAdminPost(id, payload) {
  return apiClient.put(`/admin/posts/${encodeURIComponent(id)}`, payload);
}

export function deleteAdminPost(id) {
  return apiClient.del(`/admin/posts/${encodeURIComponent(id)}`);
}
