import env from "./env.js";
import smtpEnv from "./smtpEnv.js";
import cloudinaryEnv from "./cloudinaryEnv.js";

/**
 * validateEnv — production-startup environment guard.
 *
 * Fails fast with clear, actionable messages when a variable the API cannot
 * operate without is missing in a production build, and prints warnings for
 * providers that degrade gracefully when absent (SMTP, Cloudinary).
 *
 * Only invoked from server.js so app-level tests (which import app.js) are
 * not affected. Development builds are deliberately lenient.
 */
export function validateEnv() {
  if (env.nodeEnv !== "production") {
    return { ok: true, errors: [], warnings: [] };
  }

  const errors = [];
  if (!env.mongoUri) {
    errors.push("MONGO_URI is required in production. Set it to your MongoDB Atlas connection string.");
  }
  if (!env.corsOrigin) {
    errors.push("CORS_ORIGIN is required in production (comma-separated browser origins, no wildcards).");
  }
  if (!process.env.JWT_ACCESS_SECRET) {
    errors.push("JWT_ACCESS_SECRET is required in production (>= 32 random characters).");
  }
  if (!env.adminEmail) {
    errors.push("ADMIN_EMAIL is required in production (used for admin notifications).");
  }

  const warnings = [];
  if (!smtpEnv.isConfigured) {
    warnings.push("SMTP is not configured. Email features (contact, newsletter) will fail to send.");
  }
  if (!cloudinaryEnv.isConfigured) {
    warnings.push("Cloudinary is not configured. Admin image uploads will return 503.");
  }

  if (errors.length > 0) {
    console.error("[env] Production configuration is incomplete — refusing to start:");
    for (const err of errors) console.error(`  - ${err}`);
    return { ok: false, errors, warnings };
  }

  if (warnings.length > 0) {
    console.warn("[env] Production configuration warnings:");
    for (const warn of warnings) console.warn(`  - ${warn}`);
    console.warn("[env] The API still starts; the affected features degrade gracefully.");
  }

  return { ok: true, errors, warnings };
}

export default validateEnv;