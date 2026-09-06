import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Interaction from "../models/Interaction.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../validators/common.js";
import { slugFromTitle } from "../validators/adminPosts.validator.js";

/**
 * Admin post management for /api/admin/posts.
 *
 * Differences from the public service (intentional):
 * - Lists include drafts (no publishedAt filter).
 * - List responses omit the heavy `body` field; editors load it by id.
 * - Counters are never written here; deletion also cascades to that
 *   post's comments and their interactions.
 *   document (comments/interactions reference posts by slug and have no
 *   established cascade policy, so they are retained deliberately).
 */

const ADMIN_SORT_MAP = {
  newest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  views: { views: -1, _id: -1 },
  likes: { likes: -1, _id: -1 },
  comments: { commentsCount: -1, _id: -1 },
};

function buildFilter({ category, tag, search, featured, trending, editorsPick }) {
  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
    ];
  }
  if (featured !== undefined) filter.featured = featured;
  if (trending !== undefined) filter.trending = trending;
  if (editorsPick !== undefined) filter.editorsPick = editorsPick;
  return filter;
}

export async function listAdminPosts(query) {
  const {
    category,
    tag,
    search,
    sort = "newest",
    page = 1,
    limit = 10,
    featured,
    trending,
    editorsPick,
  } = query;

  const filter = buildFilter({ category, tag, search, featured, trending, editorsPick });

  const [items, total] = await Promise.all([
    Post.find(filter)
      .sort(ADMIN_SORT_MAP[sort] || ADMIN_SORT_MAP.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v -body")
      .lean(),
    Post.countDocuments(filter),
  ]);

  return { items, total };
}

function assertValidId(id) {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, "Invalid post id", [
      { field: "id", message: "id must be a valid post id" },
    ]);
  }
}

export async function getAdminPostById(id) {
  assertValidId(id);
  const post = await Post.findById(id).select("-__v").lean();
  if (!post) throw new ApiError(404, "Post not found");
  return post;
}

async function assertSlugAvailable(slug, excludeId) {
  const clash = await Post.findOne({ slug }).select("_id").lean();
  if (clash && String(clash._id) !== String(excludeId)) {
    throw new ApiError(409, "Slug already in use", [
      { field: "slug", message: "another post already uses this slug" },
    ]);
  }
}

export async function createAdminPost(data) {
  // Slug: explicit > generated from title. Empty title-derived slugs fail
  // validation upstream (title required), so this only guards oddities
  // like a punctuation-only title.
  let slug = data.slug ?? slugFromTitle(data.title);
  if (!slug) {
    throw new ApiError(400, "Could not derive a slug from the title", [
      { field: "slug", message: "provide an explicit slug" },
    ]);
  }
  await assertSlugAvailable(slug);

  try {
    const doc = await Post.create({
      ...data,
      ...(data.publishedAt === undefined && { publishedAt: null }), // default draft
      slug,
    });
    return doc.toObject();
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.slug) {
      throw new ApiError(409, "Slug already in use", [
        { field: "slug", message: "another post already uses this slug" },
      ]);
    }
    throw err;
  }
}

export async function updateAdminPost(id, patch) {
  assertValidId(id);
  if (patch.slug) await assertSlugAvailable(patch.slug, id);

  try {
    const updated = await Post.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, "Post not found");
    return updated;
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.slug) {
      throw new ApiError(409, "Slug already in use", [
        { field: "slug", message: "another post already uses this slug" },
      ]);
    }
    throw err;
  }
}

export async function deleteAdminPost(id) {
  assertValidId(id);
  const existing = await Post.findById(id).select("slug title").lean();
  if (!existing) throw new ApiError(404, "Post not found");

  // Cascade: hard-deleting a post also removes its comments and any
  // interactions tied to those comments, so /admin/comments keeps no
  // orphaned rows and stale like/bookmark counts disappear with the post.
  const commentIds = await Comment.find({ postSlug: existing.slug }).distinct("_id");
  await Comment.deleteMany({ postSlug: existing.slug });
  if (commentIds.length > 0) {
    await Interaction.deleteMany({ postSlug: existing.slug, commentId: { $in: commentIds } });
  }
  await Post.deleteOne({ _id: id });
  return {
    deleted: true,
    id: String(existing._id),
    slug: existing.slug,
    title: existing.title,
  };
}
