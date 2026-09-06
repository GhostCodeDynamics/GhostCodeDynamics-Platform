import { apiClient } from "./apiClient";

/**
 * Admin contacts service — authenticated /api/admin/contacts namespace.
 *
 * GET    /admin/contacts?page&limit&status&search -> { data: Contact[], meta }
 * GET    /admin/contacts/stats                    -> { total, new, read, replied, archived }
 * GET    /admin/contacts/:id                      -> single contact
 * PATCH  /admin/contacts/:id/status { status }    -> updated contact
 * DELETE /admin/contacts/:id                      -> { deleted, id, name, email }
 */

export function listContacts({ page = 1, limit = 50, status, search } = {}, signal) {
  return apiClient.get("/admin/contacts", {
    query: { page, limit, status, search },
    signal,
  });
}

export function getContactStats(signal) {
  return apiClient.get("/admin/contacts/stats", { signal });
}

export function updateContactStatus(id, status) {
  return apiClient.patch(`/admin/contacts/${encodeURIComponent(id)}/status`, { status });
}

export function deleteContact(id) {
  return apiClient.del(`/admin/contacts/${encodeURIComponent(id)}`);
}
