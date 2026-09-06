import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postSlug: { type: String, required: true, index: true },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    body: { type: String, required: true, maxlength: 1000 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ postSlug: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
