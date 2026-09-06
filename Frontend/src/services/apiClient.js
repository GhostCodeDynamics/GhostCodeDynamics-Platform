/**
 * apiClient — tiny native-fetch wrapper around the GhostCode Dynamics API.
 *
 * Responsibilities:
 * - base URL normalization (no double slashes, no /api/api)
 * - GET / POST / DELETE with optional AbortSignal
 * - JSON parsing + success-envelope handling ({ success, data, meta })
 * - normalized ApiError for failures (network, 4xx, 429, 5xx, malformed)
 *
 * Only public VITE_* configuration lives here. No secrets, no credentials,
 * no backend environment access.
 */

// Relative base URL. In local development the Vite dev server proxies /api to
// the backend (see vite.config.js), so the browser stays same-origin and CORS
// is avoided. Deployments must set VITE_API_BASE_URL to an absolute API URL.
const DEFAULT_BASE_URL = "/api";

function resolveBaseUrl() {
  const fromEnv =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL;
  const base = String(fromEnv || DEFAULT_BASE_URL).trim();
  return base.replace(/\/+$/, "");
}

const BASE_URL = resolveBaseUrl();

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
      return "You're sending too many requests. Please wait a moment and then try again.";
    }
    return err.message || fallback;
  }
  return fallback;
}

function buildUrl(path, query) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${BASE_URL}${cleanPath}`;
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

async function request(path, { method = "GET", query, body, signal } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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

  if (response.ok) {
    if (payload && typeof payload === "object" && payload.success === true) {
      return { data: payload.data, meta: payload.meta };
    }
    return { data: payload, meta: undefined };
  }

  const status = response.status;
  const message =
    payload && typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : "Something went wrong. Please try again.";
  const errors = payload && Array.isArray(payload.errors) ? payload.errors : undefined;

  if (status === 429) {
    throw new ApiError({
      message: "You're sending too many requests. Please wait a moment and then try again.",
      status,
      errors,
      isRateLimited: true,
    });
  }

  throw new ApiError({ message, status, errors });
}

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
  del: (path, body, options = {}) => request(path, { ...options, method: "DELETE", body }),
};

export default apiClient;
