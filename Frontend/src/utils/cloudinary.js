const CLOUDINARY_RE = /^https:\/\/(?:res\.cloudinary\.com|.+\.cloudinary\.com)\/([^/]+)\/image\/upload\/(.+)$/;

export function isCloudinaryUrl(url) {
  return typeof url === "string" && CLOUDINARY_RE.test(url);
}

export function cloudinaryUrl(url, options = {}) {
  if (!isCloudinaryUrl(url)) return url;

  const match = url.match(CLOUDINARY_RE);
  const cloudName = match[1];
  const path = match[2];

  const segments = [];
  const { w, h, fit = "fill", q = "auto", f = "auto", dpr } = options || {};
  if (w) segments.push(`w_${w}`);
  if (h) segments.push(`h_${h}`);
  if (fit) segments.push(`c_${fit}`);
  if (q) segments.push(`q_${q}`);
  if (f) segments.push(`f_${f}`);
  if (dpr) segments.push(`dpr_${dpr}`);

  const transformed = segments.length ? `${segments.join(",")}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformed}${path}`;
}

export function postCoverSrc(url) {
  return cloudinaryUrl(typeof url === "string" ? url : url?.cover, { w: 800, h: 500, fit: "fill" });
}

export function projectImageSrc(url) {
  return cloudinaryUrl(typeof url === "string" ? url : url?.image, { w: 960, h: 600, fit: "fill" });
}