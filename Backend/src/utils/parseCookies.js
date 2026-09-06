/**
 * Minimal cookie-header parser for the admin auth routes. Avoids adding a
 * cookie-parser dependency for one narrow use case.
 */
export function parseCookies(header) {
  const cookies = {};
  if (typeof header !== "string" || !header) return cookies;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    let value = part.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }
  return cookies;
}

export default parseCookies;
