import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import {
  adminListProjectsRoute,
  adminGetProjectRoute,
  adminCreateProjectRoute,
  adminUpdateProjectRoute,
  adminDeleteProjectRoute,
  adminReorderProjectsRoute,
} from "../controllers/adminProjects.controller.js";

const router = Router();

// Every admin project route requires a valid access token AND the admin role.
router.use(requireAuth, requireRole("admin"));

// Literal route MUST be registered before /:id.
router.patch("/reorder", adminWriteLimiter, adminReorderProjectsRoute);

router.get("/", adminListProjectsRoute);
router.get("/:id", adminGetProjectRoute);
router.post("/", adminWriteLimiter, adminCreateProjectRoute);
router.put("/:id", adminWriteLimiter, adminUpdateProjectRoute);
router.delete("/:id", adminWriteLimiter, adminDeleteProjectRoute);

export default router;
