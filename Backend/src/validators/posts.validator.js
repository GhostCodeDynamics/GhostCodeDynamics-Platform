import { ApiError } from "../utils/ApiError.js";
import {
  parseBoolean,
  parsePagination,
  escapeRegex,
  validateSlugParam,
} from "./common.js";

export const POST_SORTS = new Set([
  "newest",
  "oldest",
  "views",
  "likes",
  "comments",
]);

const BOOLEAN_QUERY_KEYS = ["featured", "trending", "editorsPick"];

export function validatePostQuery(query = {}) {
  const errors = [];
  const { page, limit } = parsePagination(query);

  let sort = "newest";
  if (query.sort !== undefined) {
    if (POST_SORTS.has(query.sort)) {
      sort = query.sort;
    } else {
      errors.push({
        field: "sort",
        message: "sort must be one of: newest, oldest, views, likes, comments",
      });
    }
  }

  let category;
  if (query.category !== undefined) {
    category = String(query.category).trim();
    if (!category) {
      errors.push({ field: "category", message: "category must not be empty" });
    }
  }

  let tag;
  if (query.tag !== undefined) {
    tag = String(query.tag).trim();
    if (!tag) {
      errors.push({ field: "tag", message: "tag must not be empty" });
    }
  }

  let search;
  if (query.search !== undefined) {
    search = String(query.search).trim();
    if (!search) {
      errors.push({ field: "search", message: "search must not be empty" });
    } else if (search.length > 200) {
      errors.push({
        field: "search",
        message: "search must be at most 200 characters",
      });
    }
  }

  for (const key of BOOLEAN_QUERY_KEYS) {
    if (query[key] !== undefined && parseBoolean(query[key]) === undefined) {
      errors.push({ field: key, message: `${key} must be true or false` });
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid query parameters", errors);
  }

  return {
    page,
    limit,
    category,
    tag,
    search: search ? escapeRegex(search) : undefined,
    featured: parseBoolean(query.featured),
    trending: parseBoolean(query.trending),
    editorsPick: parseBoolean(query.editorsPick),
    sort,
  };
}

export function validatePostSlugParam(slug) {
  return validateSlugParam(slug, "post slug");
}
