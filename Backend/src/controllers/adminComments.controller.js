import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationMeta } from "../utils/paginate.js";
import { parsePagination } from "../validators/common.js";
import {
  listAllComments,
  getCommentById,
  deleteComment,
  commentStats,
} from "../services/adminComments.service.js";

export const adminListCommentsRoute = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const postSlug = req.query.postSlug || undefined;
  const search = req.query.search || undefined;
  const { items, total } = await listAllComments({ page, limit, postSlug, search });
  res.json({
    success: true,
    data: items,
    meta: paginationMeta({ page, limit, total }),
  });
});

export const adminGetCommentRoute = asyncHandler(async (req, res) => {
  const comment = await getCommentById(req.params.id);
  res.json({ success: true, data: comment });
});

export const adminDeleteCommentRoute = asyncHandler(async (req, res) => {
  const result = await deleteComment(req.params.id);
  res.json({ success: true, data: result });
});

export const adminCommentStatsRoute = asyncHandler(async (req, res) => {
  const stats = await commentStats();
  res.json({ success: true, data: stats });
});
