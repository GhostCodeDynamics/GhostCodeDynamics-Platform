import dotenv from "dotenv";

dotenv.config();

/**
 * Isolated configuration for the SMTP / email subsystem.
 *
 * Follows the same pattern as config/adminEnv.js: a self-contained module
 * that reads process.env once and exposes a frozen config object.
 *
 * SMTP is intentionally non-blocking at startup — if credentials are not
 * configured, the app continues without email. Errors surface only when an
 * email operation is actually attempted.
 */

const raw = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  password: process.env.SMTP_PASSWORD || "",
  from: process.env.SMTP_FROM || "",
};

const smtpEnv = {
  host: raw.host,
  port: raw.port,
  secure: raw.secure,
  user: raw.user,
  password: raw.password,
  from: raw.from,

  /** true when the minimum required fields are present. */
  isConfigured: Boolean(raw.host && raw.port && raw.user && raw.password),

  /**
   * Throws a clear error if SMTP is not configured, but never exposes
   * the actual credential values.
   */
  assertConfigured() {
    if (!this.isConfigured) {
      const err = new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in your .env file."
      );
      err.status = 503;
      throw err;
    }
  },

  /**
   * Returns a safe, non-sensitive summary for logging / health checks.
   * Never includes password or user credentials.
   */
  status() {
    if (!this.isConfigured) return "unconfigured";
    return "configured";
  },

  /**
   * Returns the nodemailer transporter options. Exposed as a function
   * (not a getter) so callers explicitly opt in to receiving config that
   * contains the password — never log the return value.
   */
  transporterOptions() {
    return {
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: this.password,
      },
    };
  },
};

export default smtpEnv;
