import { apiClient } from "./apiClient";

/**
 * Admin comments service — authenticated /api/admin/comments namespace.
 *
 * GET    /admin/comments?page&limit&postSlug&search -> { data: Comment[], meta }
 * GET    /admin/comments/stats                      -> { totalComments, postsWithComments }
 * GET    /admin/comments/:id                        -> single comment
 * DELETE /admin/comments/:id                        -> { deleted, id, postSlug }
 */

export function listAllComments({ page = 1, limit = 50, postSlug, search } = {}, signal) {
  return apiClient.get("/admin/comments", {
    query: { page, limit, postSlug, search },
    signal,
  });
}

export function getCommentStats(signal) {
  return apiClient.get("/admin/comments/stats", { signal });
}

export function deleteComment(id) {
  return apiClient.del(`/admin/comments/${encodeURIComponent(id)}`);
}
