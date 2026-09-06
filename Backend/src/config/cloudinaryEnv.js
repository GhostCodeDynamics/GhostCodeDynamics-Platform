import dotenv from "dotenv";

dotenv.config();

/**
 * Isolated configuration for Cloudinary (admin image uploads).
 *
 * Deliberately separate from config/env.js so existing configuration is
 * untouched and nothing Cloudinary-related leaks into the public API.
 *
 * Fail-closed: if any credential is missing the admin upload endpoint
 * refuses to operate (503) while the public API keeps working. The API
 * secret is only ever read server-side and is never serialized into any
 * response, log, or error message.
 */

const raw = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  apiKey: process.env.CLOUDINARY_API_KEY || "",
  apiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

const cloudinaryEnv = {
  cloudName: raw.cloudName,
  apiKey: raw.apiKey,
  apiSecret: raw.apiSecret,
  rootFolder: "ghostcode-dynamics",
  isConfigured: Boolean(raw.cloudName && raw.apiKey && raw.apiSecret),

  /** Throws unless Cloudinary is fully configured. */
  assertConfigured() {
    if (!this.isConfigured) {
      const err = new Error(
        "Cloudinary is not configured: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
      );
      err.status = 503;
      throw err;
    }
  },
};

export default cloudinaryEnv;