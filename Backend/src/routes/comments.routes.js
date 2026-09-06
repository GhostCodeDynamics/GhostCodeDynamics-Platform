import { Router } from "express";
import { commentsLimiter } from "../middleware/rateLimits.js";
import { getComments, postComment } from "../controllers/comments.controller.js";

const router = Router({ mergeParams: true });

router.get("/", getComments);
router.post("/", commentsLimiter, postComment);

export default router;
