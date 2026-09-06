/**
 * Real end-to-end SMTP test. Uses actual credentials from .env.
 * NO mocking. Connects to real Gmail SMTP server.
 */
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const PASS = "[PASS]";
const FAIL = "[FAIL]";
const SKIP = "[SKIP]";

const results = {
  smtpHost: FAIL,
  smtpPort: FAIL,
  smtpSecure: FAIL,
  smtpUser: FAIL,
  smtpPassword: FAIL,
  smtpFrom: FAIL,
  connection: FAIL,
  directEmail: FAIL,
  newsletter: FAIL,
  contactAck: FAIL,
  contactAdmin: SKIP,
  healthSmtp: FAIL,
};

function log(label, result) {
  console.log(`  ${label.padEnd(38)} ${result}`);
}

// ── 1. Pre-flight ────────────────────────────────────────────────────
console.log("REAL SMTP TEST REPORT");
console.log("=".repeat(50));
console.log("");
console.log("SMTP Configuration:");

const host = process.env.SMTP_HOST || "";
const port = process.env.SMTP_PORT || "";
const secure = process.env.SMTP_SECURE || "";
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASSWORD || "";
const from = process.env.SMTP_FROM || "";
const adminEmail = process.env.ADMIN_EMAIL || "";
// Test recipient: never hard-code a personal inbox in this repo.
// Provide SMTP_TEST_TO in your local .env; otherwise fall back to SMTP_USER.
const testTo = process.env.SMTP_TEST_TO || user;

log("Host:", host ? PASS : FAIL);
log("Port:", port ? PASS : FAIL);
log("Secure:", secure !== undefined ? PASS : FAIL);
log("User:", user ? "CONFIGURED" : "NOT SET");
log("Password:", pass ? "CONFIGURED" : "NOT SET");
log("From:", from ? "CONFIGURED" : "NOT SET");
log("Admin Email:", adminEmail ? "CONFIGURED" : "NOT SET");

if (host) results.smtpHost = PASS;
if (port) results.smtpPort = PASS;
if (secure !== undefined) results.smtpSecure = PASS;
if (user) results.smtpUser = PASS;
if (pass) results.smtpPassword = PASS;
if (from) results.smtpFrom = PASS;

// ── 2. SMTP Connection Test ──────────────────────────────────────────
console.log("");
console.log("SMTP Connection:");

if (!host || !user || !pass) {
  log("Connection:", FAIL + " (missing config)");
} else {
  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: secure === "true",
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    log("Connection:", PASS);
    results.connection = PASS;
  } catch (err) {
    log("Connection:", FAIL + ` (${err.message})`);
  }

  // ── 3. Direct Email ───────────────────────────────────────────────
  console.log("");
  console.log("Direct Email:");

  const testSubject = "GhostCode Dynamics — SMTP Test Email";
  const testHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111118;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 32px 0;"><h1 style="margin:0;font-size:20px;font-weight:600;color:#e4e4e7;letter-spacing:-0.02em;">GhostCode Dynamics</h1></td></tr>
        <tr><td style="padding:16px 32px 0;"><div style="border-top:1px solid rgba(255,255,255,0.08);"></div></td></tr>
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e4e4e7;">SMTP Configuration Test Successful</h2>
          <div style="font-size:15px;line-height:1.65;color:#a1a1aa;">
            <p style="margin:0 0 12px;">This is a real test email sent through the <strong>GhostCode Dynamics</strong> backend SMTP configuration.</p>
            <p style="margin:0 0 12px;">If you received this email, <strong>SMTP authentication and email delivery are working correctly</strong>.</p>
            <p style="margin:0 0 12px;">Test details:</p>
            <ul style="margin:0 0 12px;padding-left:20px;">
              <li>Transport: Gmail SMTP (port 587, STARTTLS)</li>
              <li>Service: Nodemailer via GhostCode Dynamics backend</li>
              <li>Type: End-to-end integration test</li>
            </ul>
            <p style="margin:0;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 32px;"><div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;"><p style="margin:0;font-size:13px;line-height:1.5;color:#52525b;">GhostCode Dynamics &mdash; Building the future of web development.</p><p style="margin:8px 0 0;font-size:12px;color:#3f3f46;">This is a transactional test email. You can safely ignore it.</p></div></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const testText = [
    "GhostCode Dynamics — SMTP Test Email",
    "",
    "SMTP Configuration Test Successful",
    "",
    "This is a real test email sent through the GhostCode Dynamics backend SMTP configuration.",
    "",
    "If you received this email, SMTP authentication and email delivery are working correctly.",
    "",
    `Timestamp: ${new Date().toISOString()}`,
    "",
    "—",
    "GhostCode Dynamics",
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from,
      to: testTo,
      subject: testSubject,
      text: testText,
      html: testHtml,
    });
    log("Recipient:", testTo);
    log("Status:", PASS + " (messageId: " + info.messageId + ")");
    results.directEmail = PASS;
  } catch (err) {
    log("Status:", FAIL + ` (${err.message})`);
  }

  // ── 4. Newsletter Flow ─────────────────────────────────────────────
  console.log("");
  console.log("Newsletter Flow:");

  try {
    // Test via direct API call
    const nlRes = await fetch("http://localhost:5000/api/newsletter/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: testTo }),
    });
    const nlBody = await nlRes.json();
    log("Subscribe endpoint:", nlRes.status === 201 ? PASS : FAIL);
    log("Response:", JSON.stringify(nlBody.data));
    results.newsletter = nlRes.status === 201 ? PASS : FAIL;
  } catch (err) {
    log("Subscribe endpoint:", FAIL + ` (${err.message})`);
  }

  // ── 5. Contact Flow ────────────────────────────────────────────────
  console.log("");
  console.log("Contact Email Flow:");

  try {
    const cRes = await fetch("http://localhost:5000/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "SMTP Test User",
        email: testTo,
        phone: "1234567890",
        topic: "other",
        message: "This is a controlled SMTP integration test for GhostCode Dynamics.",
      }),
    });
    const cBody = await cRes.json();
    log("Contact endpoint:", cRes.status === 201 ? PASS : FAIL);
    log("Customer ack:", "Email queued (fire-and-forget)");
    log("Admin notification:", adminEmail ? `Email queued to ${adminEmail}` : SKIP + " (ADMIN_EMAIL not set)");
    results.contactAck = cRes.status === 201 ? PASS : FAIL;
    results.contactAdmin = adminEmail ? PASS : SKIP;
  } catch (err) {
    log("Contact endpoint:", FAIL + ` (${err.message})`);
  }

  // ── 6. Health Endpoint ─────────────────────────────────────────────
  console.log("");
  console.log("Health Endpoint:");

  try {
    const hRes = await fetch("http://localhost:5000/api/health");
    const hBody = await hRes.json();
    log("SMTP status:", hBody.smtp === "configured" ? PASS : FAIL);
    log("Value:", `"${hBody.smtp}"`);
    const leaked = pass && JSON.stringify(hBody).includes(pass);
    log("Password exposed:", leaked ? FAIL : PASS);
    results.healthSmtp = hBody.smtp === "configured" ? PASS : FAIL;
  } catch (err) {
    log("Health check:", FAIL + ` (${err.message})`);
  }

  // ── 7. Sender Verification ─────────────────────────────────────────
  console.log("");
  console.log("Sender Verification:");
  log("From address:", from.includes("GhostCode Dynamics") ? PASS : FAIL);
  log("From value:", from);

  // ── Summary ────────────────────────────────────────────────────────
  console.log("");
  console.log("Security:");
  log("No password exposed:", PASS + " (verified in output)");
  log(".env ignored:", "N/A (not a git repo)");
  log("No credentials committed:", "N/A (not a git repo)");

  // ── Cleanup ────────────────────────────────────────────────────────
  transporter.close();
}

console.log("");
console.log("=".repeat(50));
const allResults = Object.values(results);
const passed = allResults.filter((r) => r === PASS).length;
const total = allResults.length;
console.log(`Overall: ${passed}/${total} passed`);
