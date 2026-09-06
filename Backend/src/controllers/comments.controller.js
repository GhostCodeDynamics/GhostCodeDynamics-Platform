import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePostSlugParam } from "../validators/posts.validator.js";
import { validateCreateComment } from "../validators/comments.validator.js";
import { listComments, createComment } from "../services/comments.service.js";

export const getComments = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const comments = await listComments(slug);
  res.json({ success: true, data: comments });
});

export const postComment = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const payload = validateCreateComment(req.body);
  const comment = await createComment({ postSlug: slug, ...payload });
  res.status(201).json({ success: true, data: comment });
});
