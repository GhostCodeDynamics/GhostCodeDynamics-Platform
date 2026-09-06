import mongoose from "mongoose";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { ApiError } from "../utils/ApiError.js";

export async function listComments(postSlug) {
  return Comment.find({ postSlug })
    .select("postSlug parentId author body likes createdAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}

export async function createComment({ postSlug, body, parentId = null, author = "Anonymous" }) {
  const post = await Post.findOne({ slug: postSlug }).select("_id").lean();
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  if (parentId) {
    const parent = await Comment.findOne({
      _id: new mongoose.Types.ObjectId(parentId),
    })
      .select("postSlug")
      .lean();

    if (!parent) {
      throw new ApiError(400, "parentId does not reference an existing comment", [
        { field: "parentId", message: "parentId does not reference an existing comment" },
      ]);
    }

    if (parent.postSlug !== postSlug) {
      throw new ApiError(400, "parentId belongs to a different post", [
        { field: "parentId", message: "parentId belongs to a different post" },
      ]);
    }
  }

  const comment = await Comment.create({
    postSlug,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
    author,
    body,
  });

  await Post.updateOne({ slug: postSlug }, { $inc: { commentsCount: 1 } });

  return Comment.findOne({ _id: comment._id })
    .select("postSlug parentId author body likes createdAt")
    .lean();
}
