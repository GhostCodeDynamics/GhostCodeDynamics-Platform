/**
 * blogService — thin async wrapper around the GhostCode Dynamics API.
 * Components await these functions and never touch the data source
 * directly. All functions are API-backed; no mock fallback is used.
 */
import { apiClient } from "./apiClient";

export async function listPosts(params = {}, options = {}) {
  const { category, tag, search, sort, page, limit } = params;
  const { data, meta } = await apiClient.get("/posts", {
    query: { category, tag, search, sort, page, limit },
    signal: options.signal,
  });
  return { posts: Array.isArray(data) ? data : [], meta };
}

export async function getPostBySlug(slug, options = {}) {
  const { data } = await apiClient.get(`/posts/${encodeURIComponent(slug)}`, {
    signal: options.signal,
  });
  // Detail response: { ...post, related, prev, next }
  return data;
}

export async function getFeaturedPost(options = {}) {
  const { data } = await apiClient.get("/posts/featured", {
    signal: options.signal,
  });
  return data ?? null;
}

export async function getEditorsPicks(limit = 3, options = {}) {
  const { data } = await apiClient.get("/posts/editors-picks", {
    signal: options.signal,
  });
  return Array.isArray(data) ? data.slice(0, limit) : [];
}

export async function getTrending(limit = 4, options = {}) {
  const { data } = await apiClient.get("/posts/trending", {
    signal: options.signal,
  });
  return Array.isArray(data) ? data.slice(0, limit) : [];
}
