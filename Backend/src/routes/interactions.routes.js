import { Router } from "express";
import { interactionsLimiter } from "../middleware/rateLimits.js";
import {
  like,
  unlike,
  bookmark,
  unbookmark,
  likeCommentRoute,
  unlikeCommentRoute,
} from "../controllers/interactions.controller.js";

const router = Router();

router.post("/posts/:slug/like", interactionsLimiter, like);
router.delete("/posts/:slug/like", interactionsLimiter, unlike);
router.post("/posts/:slug/bookmark", interactionsLimiter, bookmark);
router.delete("/posts/:slug/bookmark", interactionsLimiter, unbookmark);
router.post("/comments/:id/like", interactionsLimiter, likeCommentRoute);
router.delete("/comments/:id/like", interactionsLimiter, unlikeCommentRoute);

export default router;
