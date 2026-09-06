import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationMeta } from "../utils/paginate.js";
import { validatePostQuery, validatePostSlugParam } from "../validators/posts.validator.js";
import {
  listPosts,
  getPostBySlug,
  getFeaturedPost,
  getEditorsPicks,
  getTrending,
  getRelated,
  getPrevNext,
} from "../services/posts.service.js";

export const getPosts = asyncHandler(async (req, res) => {
  const query = validatePostQuery(req.query);
  const { items, total } = await listPosts(query);
  res.json({
    success: true,
    data: items,
    meta: paginationMeta({ page: query.page, limit: query.limit, total }),
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const slug = validatePostSlugParam(req.params.slug);
  const post = await getPostBySlug(slug);
  const [related, prevNext] = await Promise.all([
    getRelated(post),
    getPrevNext(post),
  ]);
  res.json({
    success: true,
    data: { ...post, related, ...prevNext },
  });
});

export const getPostSection = (section) =>
  asyncHandler(async (req, res) => {
    let data;
    if (section === "featured") {
      data = await getFeaturedPost();
    } else if (section === "editors-picks") {
      data = await getEditorsPicks();
    } else {
      data = await getTrending();
    }
    res.json({ success: true, data });
  });
