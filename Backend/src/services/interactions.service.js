import mongoose from "mongoose";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Interaction from "../models/Interaction.js";
import { ApiError } from "../utils/ApiError.js";

const DUPLICATE_KEY = 11000;

function isDuplicateKeyError(err) {
  return err && err.name === "MongoServerError" && err.code === DUPLICATE_KEY;
}

async function assertPostExists(postSlug) {
  const post = await Post.findOne({ slug: postSlug }).select("_id").lean();
  if (!post) {
    throw new ApiError(404, "Post not found");
  }
}

async function assertCommentExists(commentId) {
  const comment = await Comment.findById(commentId).select("postSlug").lean();
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  return comment;
}

export async function likePost(postSlug, actorId) {
  await assertPostExists(postSlug);
  const interaction = {
    kind: "like",
    postSlug,
    commentId: null,
    actorId,
  };
  try {
    await Interaction.create(interaction);
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    return { liked: true };
  }
  await Post.updateOne({ slug: postSlug }, { $inc: { likes: 1 } });
  return { liked: true };
}

export async function unlikePost(postSlug, actorId) {
  const { deletedCount } = await Interaction.deleteOne({
    kind: "like",
    postSlug,
    commentId: null,
    actorId,
  });
  if (deletedCount > 0) {
    await Post.updateOne(
      { slug: postSlug, likes: { $gt: 0 } },
      { $inc: { likes: -1 } }
    );
  }
  return { liked: false };
}

export async function bookmarkPost(postSlug, actorId) {
  await assertPostExists(postSlug);
  try {
    await Interaction.create({
      kind: "bookmark",
      postSlug,
      commentId: null,
      actorId,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
  return { bookmarked: true };
}

export async function unbookmarkPost(postSlug, actorId) {
  await Interaction.deleteOne({
    kind: "bookmark",
    postSlug,
    commentId: null,
    actorId,
  });
  return { bookmarked: false };
}

export async function likeComment(commentId, actorId) {
  const comment = await assertCommentExists(commentId);
  try {
    await Interaction.create({
      kind: "like",
      postSlug: comment.postSlug,
      commentId: new mongoose.Types.ObjectId(commentId),
      actorId,
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    return { liked: true };
  }
  await Comment.updateOne({ _id: commentId }, { $inc: { likes: 1 } });
  return { liked: true };
}

export async function unlikeComment(commentId, actorId) {
  const comment = await assertCommentExists(commentId);
  const { deletedCount } = await Interaction.deleteOne({
    kind: "like",
    postSlug: comment.postSlug,
    commentId: new mongoose.Types.ObjectId(commentId),
    actorId,
  });
  if (deletedCount > 0) {
    await Comment.updateOne(
      { _id: commentId, likes: { $gt: 0 } },
      { $inc: { likes: -1 } }
    );
  }
  return { liked: false };
}
