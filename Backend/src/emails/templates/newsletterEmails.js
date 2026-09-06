import { baseTemplate } from "./base.js";

/**
 * Newsletter welcome email sent to new subscribers.
 *
 * @param {Object} options
 * @param {string} options.email - Subscriber's email
 * @returns {{ subject: string, text: string, html: string }}
 */
export function newsletterWelcome({ email }) {
  const text = [
    "Welcome to the GhostCode Dynamics newsletter!",
    "",
    "You're now subscribed to receive updates on:",
    "- New blog posts and technical articles",
    "- Project launches and case studies",
    "- Workshops, events, and mentorship opportunities",
    "",
    "We respect your inbox — expect no more than 2-4 emails per month.",
    "",
    "To unsubscribe at any time, visit our website or use the unsubscribe link in any newsletter email.",
    "",
    "Best regards,",
    "GhostCode Dynamics Team",
  ].join("\n");

  const html = baseTemplate({
    title: "Welcome to the newsletter",
    body: `
      <p style="margin:0 0 16px;">
        You're now subscribed to receive updates from GhostCode Dynamics.
        We're excited to have you!
      </p>
      <p style="margin:0 0 12px;color:#a1a1aa;">You'll receive:</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#a1a1aa;font-size:14px;line-height:1.8;">
        <li>New blog posts and technical articles</li>
        <li>Project launches and case studies</li>
        <li>Workshops, events, and mentorship opportunities</li>
      </ul>
      <p style="margin:0;font-size:13px;color:#71717a;">
        We respect your inbox &mdash; expect no more than 2-4 emails per month.
        You can unsubscribe at any time from the link in any newsletter email.
      </p>
    `,
    footer: "Best regards,<br/>GhostCode Dynamics Team",
  });

  return { subject: "Welcome to GhostCode Dynamics", text, html };
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
