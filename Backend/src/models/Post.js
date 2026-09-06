import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    cover: { type: String, default: "" },
    coverPublicId: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    author: {
      name: { type: String, required: true },
      role: { type: String, default: "" },
    },
    publishedAt: { type: Date, index: true },
    updatedAt: { type: Date },
    readingMinutes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    editorsPick: { type: Boolean, default: false, index: true },
    body: { type: String, default: "" },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "modifiedAt",
    },
  }
);

postSchema.index({ category: 1, publishedAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
