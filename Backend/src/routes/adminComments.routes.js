import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import {
  adminListCommentsRoute,
  adminGetCommentRoute,
  adminDeleteCommentRoute,
  adminCommentStatsRoute,
} from "../controllers/adminComments.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", adminCommentStatsRoute);
router.get("/", adminListCommentsRoute);
router.get("/:id", adminGetCommentRoute);
router.delete("/:id", adminWriteLimiter, adminDeleteCommentRoute);

export default router;
