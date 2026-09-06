import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId, isValidSlug } from "./common.js";
import { normalizeSlug } from "./adminPosts.validator.js";

/** Deterministic slug generated from a project name (slug omitted). */
export function slugFromName(name) {
  return normalizeSlug(name);
}

/**
 * Validators for the authenticated /api/admin/projects namespace.
 * Constraints mirror the Project model. URLs must be valid http(s) when
 * provided; empty optional URLs remain allowed (rendered as "coming
 * soon" on the public site).
 */

const PROTECTED_FIELDS = ["_id", "createdAt", "updatedAt"];

const MAX = {
  slug: 120,
  name: 120,
  category: 60,
  problem: 2000,
  solution: 2000,
  techItem: 40,
  techItems: 16,
  url: 500,
  order: 10_000,
};

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
  const v = cleanString(value, { field, max: MAX.url, errors });
  if (v === undefined || v === "") return v ?? "";
  if (!/^https?:\/\/\S+$/i.test(v)) {
    errors.push({ field, message: `${field} must be a valid http(s) URL` });
    return undefined;
  }
  return v;
}

function cleanDate(value, { field, errors }) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    errors.push({ field, message: `${field} must be an ISO date or null` });
    return undefined;
  }
  return date;
}

export function validateProjectPayload(payload, { mode }) {
  const errors = [];
  rejectProtected(payload, errors);

  const data = {};

  const name = cleanString(payload.name, { field: "name", max: MAX.name, required: mode === "create", errors });
  if (name !== undefined) data.name = name;

  let category = cleanString(payload.category, { field: "category", max: MAX.category, required: mode === "create", errors });
  if (category !== undefined) data.category = category;

  const image = cleanUrl(payload.image, { field: "image", errors });
  if (image !== undefined) data.image = image;

  const imagePublicId = cleanString(payload.imagePublicId, { field: "imagePublicId", max: 200, errors });
  if (imagePublicId !== undefined) data.imagePublicId = imagePublicId;

  for (const [field, max] of [["problem", MAX.problem], ["solution", MAX.solution]]) {
    const value = cleanString(payload[field], { field, max, errors });
    if (value !== undefined) data[field] = value;
  }

  for (const field of ["liveUrl", "repoUrl"]) {
    const value = cleanUrl(payload[field], { field, errors });
    if (value !== undefined) data[field] = value;
  }

  const featured = payload.featured;
  if (featured !== undefined) {
    if (typeof featured !== "boolean") {
      errors.push({ field: "featured", message: "featured must be true or false" });
    } else {
      data.featured = featured;
    }
  }

  const publishedAt = cleanDate(payload.publishedAt, { field: "publishedAt", errors });
  if (publishedAt !== undefined) data.publishedAt = publishedAt;

  const tech = payload.tech;
  if (tech !== undefined) {
    if (tech === null) {
      data.tech = [];
    } else if (!Array.isArray(tech)) {
      errors.push({ field: "tech", message: "tech must be an array of strings" });
    } else {
      const cleaned = [];
      const seen = new Set();
      let bad = false;
      for (const raw of tech.slice(0, MAX.techItems)) {
        if (typeof raw !== "string") {
          errors.push({ field: "tech", message: "each tech item must be a string" });
          bad = true;
          break;
        }
        const item = raw.trim().slice(0, MAX.techItem);
        if (!item) continue;
        const key = item.toLowerCase();
        if (seen.has(key)) continue; // case-insensitive dedupe
        seen.add(key);
        cleaned.push(item);
      }
      if (!bad) data.tech = cleaned;
    }
  }

  const order = payload.order;
  if (order !== undefined) {
    const num = Number(order);
    if (!Number.isInteger(num) || num < 0 || num > MAX.order) {
      errors.push({
        field: "order",
        message: `order must be an integer between 0 and ${MAX.order}`,
      });
    } else {
      data.order = num;
    }
  }

  // ---- Slug ----
  if (payload.slug !== undefined && payload.slug !== null && payload.slug !== "") {
    const normalized = normalizeSlug(payload.slug);
    if (!normalized || !isValidSlug(normalized)) {
      errors.push({ field: "slug", message: "slug must contain only letters, numbers and dashes" });
    } else {
      data.slug = normalized;
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid project payload", errors);
  }

  return data;
}

export function validateCreateProjectPayload(payload = {}) {
  return validateProjectPayload(payload, { mode: "create" });
}

export function validateUpdateProjectPayload(payload = {}) {
  const data = validateProjectPayload(payload, { mode: "update" });
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No editable fields provided", [
      { field: "payload", message: "provide at least one editable field" },
    ]);
  }
  return data;
}

/**
 * Reorder payload: { items: [{ id, order }, ...] }.
 * The list must cover every project exactly once with unique integer
 * orders — partial reorderings are rejected so the public ordering can
 * never become inconsistent.
 */
export function validateReorderPayload(payload = {}) {
  const errors = [];
  const items = payload?.items;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Invalid reorder payload", [
      { field: "items", message: "items must be a non-empty array of { id, order }" },
    ]);
  }

  const seenIds = new Set();
  const seenOrders = new Set();

  items.forEach((item, index) => {
    const label = `items[${index}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push({ field: label, message: "must be an object { id, order }" });
      return;
    }
    if (!isValidObjectId(item.id)) {
      errors.push({ field: `${label}.id`, message: "id must be a valid project id" });
    } else if (seenIds.has(item.id)) {
      errors.push({ field: `${label}.id`, message: `duplicate project id ${item.id}` });
    } else {
      seenIds.add(item.id);
    }
    const num = Number(item.order);
    if (!Number.isInteger(num) || num < 0 || num > MAX.order) {
      errors.push({
        field: `${label}.order`,
        message: `order must be an integer between 0 and ${MAX.order}`,
      });
    } else if (seenOrders.has(num)) {
      errors.push({ field: `${label}.order`, message: `duplicate order value ${num}` });
    } else {
      seenOrders.add(num);
    }
  });

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid reorder payload", errors);
  }

  return { items: items.map((i) => ({ id: i.id, order: i.order })) };
}
