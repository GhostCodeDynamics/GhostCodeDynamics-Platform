import Post from "../models/Post.js";
import { ApiError } from "../utils/ApiError.js";

const LIST_PROJECTION = { body: 0 };
const CARD_PROJECTION = {
  slug: 1,
  title: 1,
  subtitle: 1,
  excerpt: 1,
  cover: 1,
  category: 1,
  tags: 1,
  author: 1,
  publishedAt: 1,
  readingMinutes: 1,
  views: 1,
  likes: 1,
  commentsCount: 1,
  featured: 1,
  trending: 1,
  editorsPick: 1,
};

const PUBLISHED_FILTER = { publishedAt: { $ne: null } };

const SORT_MAP = {
  newest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  views: { views: -1, _id: -1 },
  likes: { likes: -1, _id: -1 },
  comments: { commentsCount: -1, _id: -1 },
};

function buildFilter({ category, tag, search, featured, trending, editorsPick }) {
  const filter = { ...PUBLISHED_FILTER };

  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [{ title: { $regex: search, $options: "i" } }, { excerpt: { $regex: search, $options: "i" } }];
  }
  if (featured !== undefined) filter.featured = featured;
  if (trending !== undefined) filter.trending = trending;
  if (editorsPick !== undefined) filter.editorsPick = editorsPick;

  return filter;
}

export async function listPosts({
  category,
  tag,
  search,
  sort = "newest",
  page = 1,
  limit = 50,
  featured,
  trending,
  editorsPick,
}) {
  const filter = buildFilter({ category, tag, search, featured, trending, editorsPick });
  const [items, total] = await Promise.all([
    Post.find(filter)
      .select(LIST_PROJECTION)
      .sort(SORT_MAP[sort] || SORT_MAP.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getPostBySlug(slug) {
  const post = await Post.findOneAndUpdate(
    { slug, ...PUBLISHED_FILTER },
    { $inc: { views: 1 } },
    { returnDocument: "after" }
  )
    .select("-__v")
    .lean();

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return post;
}

export async function getFeaturedPost() {
  return Post.findOne({ featured: true, ...PUBLISHED_FILTER })
    .select(CARD_PROJECTION)
    .sort({ publishedAt: -1, _id: -1 })
    .lean();
}

export async function getEditorsPicks(limit = 3) {
  return Post.find({ editorsPick: true, ...PUBLISHED_FILTER })
    .select(CARD_PROJECTION)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

export async function getTrending(limit = 4) {
  return Post.find({ trending: true, ...PUBLISHED_FILTER })
    .select(CARD_PROJECTION)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

export async function getRelated(post, limit = 3) {
  const filter = {
    ...PUBLISHED_FILTER,
    _id: { $ne: post._id },
  };

  if (post.category) {
    filter.category = post.category;
  }

  return Post.find(filter)
    .select(CARD_PROJECTION)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(limit)
    .lean();
}

export async function getPrevNext(post) {
  const [prev, next] = await Promise.all([
    Post.findOne({ ...PUBLISHED_FILTER, _id: { $ne: post._id }, publishedAt: { $lte: post.publishedAt } })
      .select("slug title")
      .sort({ publishedAt: -1, _id: -1 })
      .lean(),
    Post.findOne({ ...PUBLISHED_FILTER, _id: { $ne: post._id }, publishedAt: { $gte: post.publishedAt } })
      .select("slug title")
      .sort({ publishedAt: 1, _id: 1 })
      .lean(),
  ]);

  return {
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}
