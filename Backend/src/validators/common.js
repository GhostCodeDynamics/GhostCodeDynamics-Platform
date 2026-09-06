import { ApiError } from "../utils/ApiError.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
export const MAX_EMAIL = 160;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

export function isValidEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= MAX_EMAIL &&
    EMAIL_REGEX.test(value.trim())
  );
}

export function isValidSlug(value) {
  return typeof value === "string" && SLUG_REGEX.test(value);
}

export function isValidObjectId(value) {
  return typeof value === "string" && OBJECT_ID_REGEX.test(value);
}

export function parseBoolean(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return undefined;
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parsePagination(query = {}) {
  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);
  const safePage = Number.isNaN(page) || page < 1 ? 1 : page;
  const safeLimit =
    Number.isNaN(limit) || limit < 1
      ? DEFAULT_LIMIT
      : Math.min(MAX_LIMIT, limit);
  return { page: safePage, limit: safeLimit };
}

export function validateSlugParam(value, label = "slug") {
  if (!isValidSlug(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return value;
}
