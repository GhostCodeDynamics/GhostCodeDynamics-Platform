import { apiClient } from "./apiClient";
import { clearSession, refreshSession, setAccessToken } from "./authSession";

/**
 * Admin authentication service — implements the real backend contract:
 *
 * POST /api/admin/auth/login   { email, password }
 *   -> { accessToken, admin: { id, email, name, role, createdAt } }
 *   -> sets httpOnly gcd_admin_refresh cookie (path=/api/admin/auth)
 * POST /api/admin/auth/refresh -> same shape; rotates the cookie
 * GET  /api/admin/auth/me      -> admin (requires Bearer access token)
 * POST /api/admin/auth/logout  -> revokes session (requires Bearer token)
 */

export async function login({ email, password }) {
  const { data } = await apiClient.post("/admin/auth/login", { email, password });
  // Keep the access token in memory only; the refresh cookie was already
  // set by the response as an httpOnly cookie scoped to /api/admin/auth.
  setAccessToken(data.accessToken);
  return data; // { accessToken, admin }
}

export async function fetchCurrentAdmin() {
  const { data } = await apiClient.get("/admin/auth/me");
  return data; // admin
}

export async function restoreSession() {
  // Uses the httpOnly refresh cookie. Throws on failure (no session /
  // expired / revoked). The shared single-flight promise prevents
  // duplicate refresh calls across concurrent consumers.
  return refreshSession();
}

export async function logout() {
  try {
    await apiClient.post("/admin/auth/logout", {});
  } finally {
    // Local state is cleared even if the network call fails — the
    // backend session will simply expire naturally.
    clearSession();
  }
}
