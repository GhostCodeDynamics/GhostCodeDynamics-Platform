/**
 * Base HTML email wrapper.
 * Provides GhostCode Dynamics branding with clean, responsive typography.
 *
 * @param {Object} options
 * @param {string} options.title   - Email heading
 * @param {string} options.body    - Inner HTML content
 * @param {string} [options.footer] - Optional footer text
 * @returns {string} Complete HTML email string
 */
export function baseTemplate({ title, body, footer }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#111118;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;">
              <h1 style="margin:0;font-size:20px;font-weight:600;color:#e4e4e7;letter-spacing:-0.02em;">
                GhostCode Dynamics
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:16px 32px 0;">
              <div style="border-top:1px solid rgba(255,255,255,0.08);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#e4e4e7;letter-spacing:-0.01em;">
                ${escapeHtml(title)}
              </h2>
              <div style="font-size:15px;line-height:1.65;color:#a1a1aa;">
                ${body}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#52525b;">
                  ${footer || "GhostCode Dynamics &mdash; Building the future of web development."}
                </p>
                <p style="margin:8px 0 0;font-size:12px;color:#3f3f46;">
                  This is a transactional email. If you didn't expect this, you can safely ignore it.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
