import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import {
  adminListPostsRoute,
  adminGetPostRoute,
  adminCreatePostRoute,
  adminUpdatePostRoute,
  adminDeletePostRoute,
} from "../controllers/adminPosts.controller.js";

const router = Router();

// Every admin post route requires a valid access token AND the admin role.
router.use(requireAuth, requireRole("admin"));

router.get("/", adminListPostsRoute);
router.get("/:id", adminGetPostRoute);
router.post("/", adminWriteLimiter, adminCreatePostRoute);
router.put("/:id", adminWriteLimiter, adminUpdatePostRoute);
router.delete("/:id", adminWriteLimiter, adminDeletePostRoute);

export default router;
