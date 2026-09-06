import { apiClient } from "./apiClient";

/**
 * Posts service — public read endpoints only (admin CRUD arrives with a
 * future backend phase). Query contract verified against the backend:
 *
 * GET /api/posts?page&limit&sort&category&tag&search
 *     sort: newest | oldest | views | likes | comments
 *     NOTE: the backend validator also accepts featured/trending/
 *     editorsPick but currently IGNORES them server-side, so this client
 *     deliberately does not send them (sending them would return
 *     unfiltered results).
 * GET /api/posts/featured       -> single post or null (increments nothing)
 * GET /api/posts/trending       -> up to 4 posts
 * GET /api/posts/editors-picks  -> up to 3 posts
 *
 * GET /api/posts/:slug is intentionally NOT exposed here for admin use:
 * it increments view counters.
 */

export const POST_SORTS = ["newest", "oldest", "views", "likes", "comments"];

export async function listPosts({ page = 1, limit = 10, sort = "newest", category, tag, search } = {}) {
  return apiClient.get("/posts", {
    query: { page, limit, sort, category, tag, search },
  });
}

export function getFeaturedPost() {
  return apiClient.get("/posts/featured");
}

export function getTrendingPosts() {
  return apiClient.get("/posts/trending");
}

export function getEditorsPicks() {
  return apiClient.get("/posts/editors-picks");
}

export async function listPostComments(slug, { signal } = {}) {
  const { data } = await apiClient.get(`/posts/${encodeURIComponent(slug)}/comments`, { signal });
  return data;
}
