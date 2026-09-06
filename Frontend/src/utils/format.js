export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractHeadings(md) {
  const lines = md.split("\n");
  const out = [];
  for (const raw of lines) {
    const m2 = /^##\s+(.+)$/.exec(raw);
    const m3 = /^###\s+(.+)$/.exec(raw);
    if (m2) out.push({ id: slugify(m2[1]), text: m2[1], level: 2 });
    else if (m3) out.push({ id: slugify(m3[1]), text: m3[1], level: 3 });
  }
  return out;
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(iso);
}
