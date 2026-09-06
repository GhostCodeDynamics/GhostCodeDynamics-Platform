import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../validators/common.js";

function assertValidId(id) {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, "Invalid comment id", [
      { field: "id", message: "id must be a valid comment id" },
    ]);
  }
}

export async function listAllComments({ page = 1, limit = 20, postSlug, search } = {}) {
  const filter = {};
  if (postSlug) filter.postSlug = postSlug;
  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ author: re }, { body: re }];
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getCommentById(id) {
  assertValidId(id);
  const comment = await Comment.findById(id).select("-__v").lean();
  if (!comment) throw new ApiError(404, "Comment not found");
  return comment;
}

export async function deleteComment(id) {
  assertValidId(id);
  const existing = await Comment.findById(id).select("_id postSlug").lean();
  if (!existing) throw new ApiError(404, "Comment not found");

  await Comment.deleteOne({ _id: id });

  // Decrement commentsCount on the parent post
  if (existing.postSlug) {
    await Post.updateOne(
      { slug: existing.postSlug, commentsCount: { $gt: 0 } },
      { $inc: { commentsCount: -1 } }
    );
  }

  return { deleted: true, id: String(existing._id), postSlug: existing.postSlug };
}

export async function commentStats() {
  const [total, totalPosts] = await Promise.all([
    Comment.countDocuments(),
    Comment.distinct("postSlug").then((slugs) => slugs.length),
  ]);
  return { totalComments: total, postsWithComments: totalPosts };
}
