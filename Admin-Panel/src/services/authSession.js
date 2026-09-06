import { API_BASE_URL } from "./apiClient";

/**
 * In-memory access-token store for the admin panel.
 *
 * SECURITY: the access token never touches localStorage/sessionStorage.
 * It lives only in this module-scoped variable for the lifetime of the
 * tab. Session persistence across reloads relies exclusively on the
 * backend's httpOnly `gcd_admin_refresh` cookie (path=/api/admin/auth).
 *
 * Also owns the single-flight session refresh used by both AuthContext
 * (startup restoration) and apiClient (transparent 401 recovery), so
 * concurrent requests share one refresh call instead of racing.
 */

let accessToken = null;
const listeners = new Set();
let refreshPromise = null;

export function getAccessToken() {
  return accessToken;
}

/** Store a freshly issued access token (login / refresh flows). */
export function setAccessToken(token) {
  accessToken = token || null;
}

function setSession(token, admin) {
  accessToken = token || null;
  listeners.forEach((cb) => cb(accessToken ? { admin } : null));
}

export function clearSession() {
  if (accessToken !== null) {
    accessToken = null;
    listeners.forEach((cb) => cb(null));
  }
}

/** Subscribe to session changes. Returns an unsubscribe function. */
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

async function doRefresh(signal) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
      signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") throw err;
    const error = new Error("Network error while restoring session");
    error.isNetworkError = true;
    throw error;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success !== true || !payload.data?.accessToken) {
    setSession(null, null);
    const error = new Error(
      payload && typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : "No active session"
    );
    error.status = response.status;
    throw error;
  }

  setSession(payload.data.accessToken, payload.data.admin);
  return payload.data;
}

/**
 * Refresh the session (rotates the httpOnly refresh cookie and returns a
 * fresh access token + admin). Concurrent callers share a single request.
 */
export function refreshSession(signal) {
  if (!refreshPromise) {
    refreshPromise = doRefresh(signal).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
