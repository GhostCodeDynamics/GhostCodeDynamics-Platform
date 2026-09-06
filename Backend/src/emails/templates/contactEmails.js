import { baseTemplate } from "./base.js";

const TOPIC_LABELS = {
  project: "Project Inquiry",
  mentorship: "Mentorship",
  collab: "Collaboration",
  other: "General",
};

/**
 * Contact form acknowledgement email sent to the visitor.
 *
 * @param {Object} options
 * @param {string} options.name   - Visitor's name
 * @param {string} options.topic  - Contact topic (project|mentorship|collab|other)
 * @returns {{ subject: string, text: string, html: string }}
 */
export function contactAcknowledgement({ name, topic }) {
  const topicLabel = TOPIC_LABELS[topic] || "General";

  const text = [
    `Hi ${name},`,
    "",
    "Thank you for reaching out to GhostCode Dynamics! We've received your message regarding " +
      `${topicLabel} and will get back to you within 1-2 business days.`,
    "",
    "In the meantime, feel free to explore our work at ghostcodedynamics.github.io",
    "",
    "Best regards,",
    "GhostCode Dynamics Team",
  ].join("\n");

  const html = baseTemplate({
    title: "We received your message",
    body: `
      <p style="margin:0 0 12px;">Hi <strong>${escapeHtml(name)}</strong>,</p>
      <p style="margin:0 0 12px;">
        Thank you for reaching out to GhostCode Dynamics! We've received your
        message regarding <strong>${escapeHtml(topicLabel)}</strong> and will
        get back to you within <strong>1-2 business days</strong>.
      </p>
      <p style="margin:0;">
        In the meantime, feel free to explore our work at
        <a href="https://ghostcodedynamics.github.io" style="color:#8b5cf6;text-decoration:none;">
          ghostcodedynamics.github.io
        </a>.
      </p>
    `,
    footer: "Best regards,<br/>GhostCode Dynamics Team",
  });

  return { subject: `We received your message — GhostCode Dynamics`, text, html };
}

/**
 * Contact form notification email sent to the business admin.
 *
 * @param {Object} options
 * @param {string} options.name    - Visitor's name
 * @param {string} options.email   - Visitor's email
 * @param {string} options.phone   - Visitor's phone
 * @param {string} options.topic   - Contact topic
 * @param {string} options.message - Visitor's message
 * @returns {{ subject: string, text: string, html: string }}
 */
export function contactNotification({ name, email, phone, topic, message }) {
  const topicLabel = TOPIC_LABELS[topic] || "General";

  const text = [
    "New contact submission",
    "",
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Phone:   ${phone || "Not provided"}`,
    `Topic:   ${topicLabel}`,
    "",
    "Message:",
    message,
    "",
    "---",
    "Manage this submission in the admin panel.",
  ].join("\n");

  const html = baseTemplate({
    title: "New Contact Submission",
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#71717a;width:80px;vertical-align:top;">Name</td>
          <td style="padding:6px 0;font-size:14px;color:#e4e4e7;font-weight:500;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#71717a;vertical-align:top;">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#e4e4e7;"><a href="mailto:${escapeHtml(email)}" style="color:#8b5cf6;text-decoration:none;">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#71717a;vertical-align:top;">Phone</td>
          <td style="padding:6px 0;font-size:14px;color:#e4e4e7;">${escapeHtml(phone || "Not provided")}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#71717a;vertical-align:top;">Topic</td>
          <td style="padding:6px 0;"><span style="display:inline-block;font-size:12px;padding:2px 10px;border-radius:9999px;background:rgba(139,92,246,0.15);color:#a78bfa;">${escapeHtml(topicLabel)}</span></td>
        </tr>
      </table>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">
        <p style="margin:0 0 8px;font-size:13px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
    footer: "Manage this submission in the admin panel.",
  });

  return { subject: `[Contact] ${topicLabel} — ${name}`, text, html };
}

/**
 * Minimal HTML escaping for template interpolation.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
