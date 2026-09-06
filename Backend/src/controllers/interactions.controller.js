import { asyncHandler } from "../utils/asyncHandler.js";
import { validatePostSlugParam } from "../validators/posts.validator.js";
import { validateActorId, validateCommentIdParam } from "../validators/interactions.validator.js";
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost,
  likeComment,
  unlikeComment,
} from "../services/interactions.service.js";

export const like = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const actorId = validateActorId(req.body);
  const data = await likePost(slug, actorId);
  res.json({ success: true, data });
});

export const unlike = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const actorId = validateActorId(req.body);
  const data = await unlikePost(slug, actorId);
  res.json({ success: true, data });
});

export const bookmark = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const actorId = validateActorId(req.body);
  const data = await bookmarkPost(slug, actorId);
  res.json({ success: true, data });
});

export const unbookmark = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const actorId = validateActorId(req.body);
  const data = await unbookmarkPost(slug, actorId);
  res.json({ success: true, data });
});

export const likeCommentRoute = asyncHandler(async (req, res) => {
  const commentId = validateCommentIdParam(req.params.id);
  const actorId = validateActorId(req.body);
  const data = await likeComment(commentId, actorId);
  res.json({ success: true, data });
});

export const unlikeCommentRoute = asyncHandler(async (req, res) => {
  const commentId = validateCommentIdParam(req.params.id);
  const actorId = validateActorId(req.body);
  const data = await unlikeComment(commentId, actorId);
  res.json({ success: true, data });
});
