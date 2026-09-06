/**
 * apiClient — tiny native-fetch wrapper around the GhostCode Dynamics API
 * (admin flavor). Follows the proven customer-site client principles:
 *
 * - base URL resolution (VITE_ADMIN_API_BASE_URL, default "/api" so the
 *   Vite dev proxy keeps the browser same-origin — required for the
 *   httpOnly refresh cookie)
 * - GET / POST / DELETE with optional AbortSignal
 * - JSON parsing + success-envelope handling ({ success, data, meta })
 * - normalized ApiError for failures (network, 4xx, 429, 5xx, malformed)
 * - credentials: "include" so the auth refresh cookie flows
 * - Bearer access token attached from the in-memory session store, with a
 *   single transparent refresh+retry on 401 for authenticated endpoints
 */

import { getAccessToken, clearSession, refreshSession } from "./authSession";

export const API_BASE_URL = resolveBaseUrl();

function resolveBaseUrl() {
  const fromEnv =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_ADMIN_API_BASE_URL;
  const base = String(fromEnv || "/api").trim();
  return base.replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor({ message, status, errors, isNetworkError = false, isRateLimited = false }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
    this.isRateLimited = isRateLimited;
  }
}

export function apiErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError) {
    if (err.isNetworkError) {
      return "Network error. Please check your connection and try again.";
    }
    if (err.isRateLimited) {
      return "Too many requests. Please wait a moment and try again.";
    }
    return err.message || fallback;
  }
  return fallback;
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${API_BASE_URL}${cleanPath}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

/**
 * Endpoints that may recover via refresh when they answer 401.
 * Login/refresh themselves must never trigger the retry loop.
 */
function canRetryAfterRefresh(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return !p.startsWith("/admin/auth/login") && !p.startsWith("/admin/auth/refresh");
}

async function execute(url, { method, headers, body, signal }) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...headers,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") throw err;
    throw new ApiError({
      message: "Network error. Please check your connection and try again.",
      isNetworkError: true,
    });
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

async function parseFailure(response, payload) {
  const status = response.status;
  const message =
    payload && typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : "Something went wrong. Please try again.";
  const errors =
    payload && Array.isArray(payload.errors) ? payload.errors : undefined;

  if (status === 429) {
    throw new ApiError({
      message: "Too many requests. Please wait a moment and try again.",
      status,
      errors,
      isRateLimited: true,
    });
  }

  throw new ApiError({ message, status, errors });
}

async function request(path, { method = "GET", query, body, signal } = {}) {
  const url = buildUrl(path, query);

  const send = () =>
    execute(url, {
      method,
      signal,
      body,
      headers: getAccessToken()
        ? { authorization: `Bearer ${getAccessToken()}` }
        : undefined,
    });

  let { response, payload } = await send();

  // Transparent single retry after one refresh when an authenticated
  // endpoint reports the access token expired/invalid.
  if (
    response.status === 401 &&
    getAccessToken() !== null &&
    canRetryAfterRefresh(path)
  ) {
    try {
      await refreshSession(signal);
      ({ response, payload } = await send());
    } catch (err) {
      if (err && err.name === "AbortError") throw err;
      clearSession();
      // Fall through: the original 401 is normalized below.
    }
  }

  if (response.ok) {
    if (payload && typeof payload === "object" && payload.success === true) {
      return { data: payload.data, meta: payload.meta };
    }
    return { data: payload, meta: undefined };
  }

  await parseFailure(response, payload);
}

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
  /** Update (admin content editors use PUT /admin/{posts|projects}/:id). */
  put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
  /** Partial update — used by admin reorder. */
  patch: (path, body, options = {}) => request(path, { ...options, method: "PATCH", body }),
  del: (path, body, options = {}) => request(path, { ...options, method: "DELETE", body }),
};

export default apiClient;
