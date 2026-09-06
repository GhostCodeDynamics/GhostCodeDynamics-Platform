import { ApiError } from "../utils/ApiError.js";
import { OBJECT_ID_REGEX } from "./common.js";

export const MIN_BODY = 2;
export const MAX_BODY = 1000;
export const MAX_AUTHOR = 80;
export const DEFAULT_AUTHOR = "Anonymous";

export function validateCreateComment(payload = {}) {
  const errors = [];

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body) {
    errors.push({ field: "body", message: "body is required" });
  } else if (body.length < MIN_BODY) {
    errors.push({
      field: "body",
      message: `body must be at least ${MIN_BODY} characters`,
    });
  } else if (body.length > MAX_BODY) {
    errors.push({
      field: "body",
      message: `body must be at most ${MAX_BODY} characters`,
    });
  }

  let parentId = null;
  if (
    payload.parentId !== undefined &&
    payload.parentId !== null &&
    payload.parentId !== ""
  ) {
    if (typeof payload.parentId === "string" && OBJECT_ID_REGEX.test(payload.parentId)) {
      parentId = payload.parentId;
    } else {
      errors.push({
        field: "parentId",
        message: "parentId must be a valid ObjectId",
      });
    }
  }

  let author = DEFAULT_AUTHOR;
  if (payload.author !== undefined && payload.author !== null) {
    const value =
      typeof payload.author === "string" ? payload.author.trim() : "";
    if (!value) {
      errors.push({
        field: "author",
        message: "author must not be empty when provided",
      });
    } else if (value.length > MAX_AUTHOR) {
      errors.push({
        field: "author",
        message: `author must be at most ${MAX_AUTHOR} characters`,
      });
    } else {
      author = value;
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid comment", errors);
  }

  return { body, parentId, author };
}
