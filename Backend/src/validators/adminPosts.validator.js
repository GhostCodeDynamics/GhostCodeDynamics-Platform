import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId, isValidSlug } from "./common.js";

/**
 * Validators for the authenticated /api/admin/posts namespace.
 * Field constraints mirror the Post model exactly; server-owned counters
 * (views / likes / commentsCount) are rejected outright so a client can
 * never inflate engagement numbers through the CMS.
 */

const PROTECTED_FIELDS = ["_id", "views", "likes", "commentsCount", "createdAt", "modifiedAt"];

const MAX = {
  slug: 120,
  title: 200,
  subtitle: 300,
  excerpt: 600,
  cover: 500,
  category: 60,
  tag: 40,
  tags: 12,
  authorName: 80,
  authorRole: 80,
  readingMinutes: 500,
  body: 100_000,
};

export function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX.slug)
    .replace(/^-+|-+$/g, "");
}

/** Deterministic slug generated from a title (used when slug omitted). */
export function slugFromTitle(title) {
  return normalizeSlug(title);
}

function rejectProtected(payload, errors) {
  for (const field of PROTECTED_FIELDS) {
    if (payload[field] !== undefined) {
      errors.push({ field, message: `${field} is server-owned and cannot be set` });
    }
  }
}

function cleanString(value, { field, max, required = false, errors }) {
  if (value === undefined || value === null) {
    if (required) errors.push({ field, message: `${field} is required` });
    return undefined;
  }
  if (typeof value !== "string") {
    errors.push({ field, message: `${field} must be a string` });
    return undefined;
  }
  const trimmed = value.trim();
  if (required && !trimmed) {
    errors.push({ field, message: `${field} is required` });
    return undefined;
  }
  if (trimmed.length > max) {
    errors.push({ field, message: `${field} must be at most ${max} characters` });
    return undefined;
  }
  return trimmed;
}

function cleanUrl(value, { field, errors }) {
  const v = cleanString(value, { field, max: MAX.cover, errors });
  if (v === undefined || v === "") return v ?? "";
  if (!/^https?:\/\/\S+$/i.test(v)) {
    errors.push({ field, message: `${field} must be a valid http(s) URL` });
    return undefined;
  }
  return v;
}

function cleanDate(value, { field, errors }) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null; // null clears -> draft
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push({ field, message: `${field} must be an ISO date or null` });
    return undefined;
  }
  return date;
}

function cleanBoolean(value, { field, errors }) {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    errors.push({ field, message: `${field} must be true or false` });
    return undefined;
  }
  return value;
}

function cleanTags(value, { errors }) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    errors.push({ field: "tags", message: "tags must be an array of strings" });
    return undefined;
  }
  const cleaned = [];
  const seen = new Set();
  for (const raw of value.slice(0, MAX.tags)) {
    if (typeof raw !== "string") {
      errors.push({ field: "tags", message: "each tag must be a string" });
      return undefined;
    }
    const tag = raw.trim().slice(0, MAX.tag);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue; // case-insensitive dedupe, first casing wins
    seen.add(key);
    cleaned.push(tag);
  }
  return cleaned;
}

function cleanAuthor(value, { field = "author", required = false, errors }) {
  if (value === undefined || value === null) {
    if (required) errors.push({ field: `${field}.name`, message: "author name is required" });
    return undefined;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    errors.push({ field, message: `${field} must be an object` });
    return undefined;
  }
  const name = cleanString(value.name, {
    field: `${field}.name`,
    max: MAX.authorName,
    required,
    errors,
  });
  const role = cleanString(value.role, { field: `${field}.role`, max: MAX.authorRole, errors });
  if (errors.some((e) => e.field.startsWith(field))) return undefined;
  return { ...(name !== undefined && { name }), ...(role !== undefined && { role }) };
}

function validatePostPayload(payload, { mode }) {
  const errors = [];
  rejectProtected(payload, errors);

  const data = {};

  // ---- Required on create only ----
  const title = cleanString(payload.title, { field: "title", max: MAX.title, required: mode === "create", errors });
  if (title !== undefined) data.title = title;

  let category = cleanString(payload.category, { field: "category", max: MAX.category, required: mode === "create", errors });
  if (category !== undefined) data.category = category;

  const author = cleanAuthor(payload.author, { required: mode === "create", errors });
  if (author !== undefined) data.author = author;

  // ---- Optional editorial fields ----
  const subtitle = cleanString(payload.subtitle, { field: "subtitle", max: MAX.subtitle, errors });
  if (subtitle !== undefined) data.subtitle = subtitle;

  const excerpt = cleanString(payload.excerpt, { field: "excerpt", max: MAX.excerpt, errors });
  if (excerpt !== undefined) data.excerpt = excerpt;

  const cover = cleanUrl(payload.cover, { field: "cover", errors });
  if (cover !== undefined) data.cover = cover;

  const coverPublicId = cleanString(payload.coverPublicId, { field: "coverPublicId", max: 200, errors });
  if (coverPublicId !== undefined) data.coverPublicId = coverPublicId;

  const body = payload.body;
  if (body !== undefined) {
    if (body === null) {
      data.body = "";
    } else if (typeof body !== "string") {
      errors.push({ field: "body", message: "body must be a string" });
    } else if (body.length > MAX.body) {
      errors.push({ field: "body", message: `body must be at most ${MAX.body} characters` });
    } else {
      data.body = body;
    }
  }

  const tags = cleanTags(payload.tags, { errors });
  if (tags !== undefined) data.tags = tags;

  // ---- Publishing ----
  const publishedAt = cleanDate(payload.publishedAt, { field: "publishedAt", errors });
  if (publishedAt !== undefined) data.publishedAt = publishedAt;

  const updatedAt = cleanDate(payload.updatedAt, { field: "updatedAt", errors });
  if (updatedAt !== undefined) data.updatedAt = updatedAt;

  for (const flag of ["featured", "trending", "editorsPick"]) {
    const value = cleanBoolean(payload[flag], { field: flag, errors });
    if (value !== undefined) data[flag] = value;
  }

  const readingMinutes = payload.readingMinutes;
  if (readingMinutes !== undefined) {
    const num = Number(readingMinutes);
    if (!Number.isInteger(num) || num < 0 || num > MAX.readingMinutes) {
      errors.push({
        field: "readingMinutes",
        message: `readingMinutes must be an integer between 0 and ${MAX.readingMinutes}`,
      });
    } else {
      data.readingMinutes = num;
    }
  }

  // ---- Slug (normalized). Absent/empty on update = keep current slug.
  if (payload.slug !== undefined && payload.slug !== null && payload.slug !== "") {
    const normalized = normalizeSlug(payload.slug);
    if (!normalized || !isValidSlug(normalized)) {
      errors.push({ field: "slug", message: "slug must contain only letters, numbers and dashes" });
    } else {
      data.slug = normalized;
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid post payload", errors);
  }

  return data;
}

export function validateCreatePostPayload(payload = {}) {
  return validatePostPayload(payload, { mode: "create" });
}

export function validateUpdatePostPayload(payload = {}) {
  const data = validatePostPayload(payload, { mode: "update" });
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No editable fields provided", [
      { field: "payload", message: "provide at least one editable field" },
    ]);
  }
  return data;
}

export { isValidObjectId };
