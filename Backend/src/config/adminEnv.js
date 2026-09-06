import dotenv from "dotenv";

dotenv.config();

/**
 * Isolated configuration for the /api/admin namespace.
 *
 * Deliberately separate from config/env.js so existing public-API
 * configuration remains untouched. Everything here is consumed only by
 * admin auth code (and scripts/create-admin.mjs for provisioning).
 *
 * Fail-closed: if JWT_ACCESS_SECRET is missing or too short, the admin
 * auth routes refuse to operate (503) while the public API keeps working.
 */

function readSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

const raw = {
  accessSecret: readSecret(),
  accessTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
  cookieSameSite: (process.env.COOKIE_SAMESITE || "strict").toLowerCase(),
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production",
  // Provisioning-only values (read by scripts/create-admin.mjs).
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME || "Administrator",
};

const env = {
  ...raw,
  isConfigured: Boolean(raw.accessSecret),
  refreshTtlMs: raw.refreshTtlDays * 24 * 60 * 60 * 1000,

  /** Throws unless the admin namespace has a usable secret. */
  assertConfigured() {
    if (!this.isConfigured) {
      const err = new Error(
        "Admin auth is not configured: set JWT_ACCESS_SECRET (>= 32 chars)."
      );
      err.status = 503;
      throw err;
    }
    return this.accessSecret;
  },

  cookieOptions() {
    const sameSite =
      this.cookieSameSite === "lax"
        ? "lax"
        : this.cookieSameSite === "none"
          ? "none"
          : "strict";
    if (sameSite === "none" && !this.cookieSecure) {
      // Browsers reject SameSite=None without Secure; fail closed instead
      // of silently issuing a cookie that will never be sent back.
      const err = new Error(
        'COOKIE_SAMESITE=none requires COOKIE_SECURE=true (HTTPS deployment).'
      );
      err.status = 503;
      throw err;
    }
    return {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite,
      path: "/api/admin/auth",
      maxAge: this.refreshTtlMs,
    };
  },
};

export default env;
