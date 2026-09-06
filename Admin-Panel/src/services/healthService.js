import { apiClient } from "./apiClient";

/**
 * Health check. Returns the raw payload ({ status, service, uptime,
 * timestamp }) — this endpoint does not use the success envelope.
 */
export async function getHealth(signal) {
  const { data } = await apiClient.get("/health", { signal });
  return data;
}
