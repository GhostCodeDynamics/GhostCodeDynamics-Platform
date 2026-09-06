import nodemailer from "nodemailer";
import smtpEnv from "../config/smtpEnv.js";

/**
 * Centralized email service.
 *
 * Architecture:
 * - The transporter is created lazily on first use, not at import time,
 *   so the app starts normally even if SMTP is unconfigured.
 * - All send operations are fire-and-forget by default: failures are
 *   logged server-side but never thrown to the caller, so a broken SMTP
 *   config never breaks the public API (contact/newsletter).
 * - Credentials are never logged, exposed in API responses, or included
 *   in error messages.
 */

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!smtpEnv.isConfigured) return null;
  transporter = nodemailer.createTransport(smtpEnv.transporterOptions());
  return transporter;
}

/**
 * Verify SMTP connectivity. Called once at startup (non-blocking) and
 * available for manual health checks. Never throws — returns a boolean.
 */
export async function verifySmtpConnection() {
  const transport = getTransporter();
  if (!transport) return false;
  try {
    await transport.verify();
    console.log("[email] SMTP connection verified");
    return true;
  } catch (err) {
    console.warn("[email] SMTP verification failed:", err.message);
    return false;
  }
}

/**
 * Send an email. Returns { sent: true } on success or { sent: false, error }
 * on failure. Never throws — callers should not need to handle email failures.
 *
 * @param {Object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text    - Plain-text body
 * @param {string} options.html    - HTML body
 * @param {string} [options.from]  - Override sender (restricted; see below)
 */
export async function sendEmail({ to, subject, text, html, from }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP not configured — skipping send to:", to);
    return { sent: false, reason: "unconfigured" };
  }

  // Only allow from override if it matches the configured sender domain
  // to prevent user-controlled input from becoming an unsafe sender.
  const allowedFrom = smtpEnv.from;
  const safeFrom = from && allowedFrom && from === allowedFrom
    ? from
    : allowedFrom;

  try {
    await transport.sendMail({
      from: safeFrom,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Send failed:", err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Reset the transporter (used by tests to avoid stale connections).
 * Not exported in production builds.
 */
export function _resetTransporter() {
  if (transporter) {
    transporter = null;
  }
}
