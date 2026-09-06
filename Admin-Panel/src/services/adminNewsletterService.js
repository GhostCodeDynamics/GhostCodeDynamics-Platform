import { apiClient } from "./apiClient";

/**
 * Admin newsletter service — authenticated /api/admin/newsletter namespace.
 *
 * GET    /admin/newsletter?page&limit&status&search -> { data: Subscriber[], meta }
 * GET    /admin/newsletter/stats                    -> { total, active, unsubscribed }
 * GET    /admin/newsletter/:id                      -> single subscriber
 * PATCH  /admin/newsletter/:id/unsubscribe          -> updated subscriber
 * DELETE /admin/newsletter/:id                      -> { deleted, id, email }
 */

export function listSubscribers({ page = 1, limit = 50, status, search } = {}, signal) {
  return apiClient.get("/admin/newsletter", {
    query: { page, limit, status, search },
    signal,
  });
}

export function getSubscriberStats(signal) {
  return apiClient.get("/admin/newsletter/stats", { signal });
}

export function unsubscribeSubscriber(id) {
  return apiClient.patch(`/admin/newsletter/${encodeURIComponent(id)}/unsubscribe`);
}

export function deleteSubscriber(id) {
  return apiClient.del(`/admin/newsletter/${encodeURIComponent(id)}`);
}
