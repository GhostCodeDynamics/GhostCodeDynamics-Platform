import { apiClient } from "./apiClient";

/**
 * Admin projects service — authenticated /api/admin/projects namespace.
 *
 * Contract (verified against backend tests):
 * GET    /admin/projects         -> { data: Project[] } (public display order)
 * GET    /admin/projects/:id     -> full project
 * POST   /admin/projects         -> 201 | 400 errors[] | 409 slug conflict
 * PUT    /admin/projects/:id     -> 200 (partial payload allowed)
 * DELETE /admin/projects/:id     -> { deleted, id, slug, name }
 * PATCH  /admin/projects/reorder -> { items: [{ id, order }] } covering every
 *                                  project exactly once; returns { updated }.
 */

export function listAdminProjects({ signal } = {}) {
  return apiClient.get("/admin/projects", { signal });
}

export function getAdminProject(id, { signal } = {}) {
  return apiClient.get(`/admin/projects/${encodeURIComponent(id)}`, { signal });
}

export function createAdminProject(payload) {
  return apiClient.post("/admin/projects", payload);
}

export function updateAdminProject(id, payload) {
  return apiClient.put(`/admin/projects/${encodeURIComponent(id)}`, payload);
}

export function deleteAdminProject(id) {
  return apiClient.del(`/admin/projects/${encodeURIComponent(id)}`);
}

export function reorderAdminProjects(items) {
  return apiClient.patch("/admin/projects/reorder", { items });
}
