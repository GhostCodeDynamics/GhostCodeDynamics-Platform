import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationMeta } from "../utils/paginate.js";
import { escapeRegex, parsePagination } from "../validators/common.js";
import {
  validateCreatePostPayload,
  validateUpdatePostPayload,
} from "../validators/adminPosts.validator.js";
import {
  listAdminPosts,
  getAdminPostById,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
} from "../services/adminPosts.service.js";

const SORT_KEYS = new Set(["newest", "oldest", "views", "likes", "comments"]);

function queryError(message, errors) {
  const err = new Error(message);
  err.statusCode = 400;
  err.errors = errors;
  return err;
}

/** Admin list query: same surface as public minus published-only filter. */
export function validateAdminPostQuery(query = {}) {
  const errors = [];

  const { page, limit } = parsePagination(query);

  let sort = "newest";
  if (query.sort !== undefined) {
    if (SORT_KEYS.has(query.sort)) sort = query.sort;
    else {
      errors.push({
        field: "sort",
        message: "sort must be one of newest|oldest|views|likes|comments",
      });
    }
  }

  const text = (key) => {
    const value = query[key];
    if (value === undefined) return undefined;
    const str = String(value).trim();
    return str || undefined;
  };

  const category = text("category");
  const tag = text("tag");
  let search = text("search");
  if (search) search = escapeRegex(search);

  // featured/trending/editorsPick accept "true"/"false" (case-insensitive).
  const flag = (key) => {
    const raw = query[key];
    if (raw === undefined) return undefined;
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    errors.push({ field: key, message: `${key} must be true or false` });
    return undefined;
  };

  const featured = flag("featured");
  const trending = flag("trending");
  const editorsPick = flag("editorsPick");

  if (errors.length > 0) throw queryError("Invalid query parameters", errors);

  return { page, limit, sort, category, tag, search, featured, trending, editorsPick };
}

export const adminListPostsRoute = asyncHandler(async (req, res) => {
  const query = validateAdminPostQuery(req.query);
  const { items, total } = await listAdminPosts(query);
  res.json({
    success: true,
    data: items,
    meta: paginationMeta({ page: query.page, limit: query.limit, total }),
  });
});

export const adminGetPostRoute = asyncHandler(async (req, res) => {
  const post = await getAdminPostById(req.params.id);
  res.json({ success: true, data: post });
});

export const adminCreatePostRoute = asyncHandler(async (req, res) => {
  const data = validateCreatePostPayload(req.body);
  const post = await createAdminPost(data);
  res.status(201).json({ success: true, data: post });
});

export const adminUpdatePostRoute = asyncHandler(async (req, res) => {
  const patch = validateUpdatePostPayload(req.body);
  const post = await updateAdminPost(req.params.id, patch);
  res.json({ success: true, data: post });
});

export const adminDeletePostRoute = asyncHandler(async (req, res) => {
  const result = await deleteAdminPost(req.params.id);
  res.json({ success: true, data: result });
});
