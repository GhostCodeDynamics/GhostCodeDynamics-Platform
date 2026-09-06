import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import {
  adminListSubscribersRoute,
  adminGetSubscriberRoute,
  adminUnsubscribeRoute,
  adminDeleteSubscriberRoute,
  adminSubscriberStatsRoute,
} from "../controllers/adminNewsletter.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", adminSubscriberStatsRoute);
router.get("/", adminListSubscribersRoute);
router.get("/:id", adminGetSubscriberRoute);
router.patch("/:id/unsubscribe", adminWriteLimiter, adminUnsubscribeRoute);
router.delete("/:id", adminWriteLimiter, adminDeleteSubscriberRoute);

export default router;
