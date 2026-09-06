import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import {
  adminListContactsRoute,
  adminGetContactRoute,
  adminUpdateContactStatusRoute,
  adminDeleteContactRoute,
  adminContactStatsRoute,
} from "../controllers/adminContacts.controller.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", adminContactStatsRoute);
router.get("/", adminListContactsRoute);
router.get("/:id", adminGetContactRoute);
router.patch("/:id/status", adminWriteLimiter, adminUpdateContactStatusRoute);
router.delete("/:id", adminWriteLimiter, adminDeleteContactRoute);

export default router;
