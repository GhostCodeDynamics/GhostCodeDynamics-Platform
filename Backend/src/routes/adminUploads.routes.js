import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { adminWriteLimiter } from "../middleware/rateLimits.js";
import { uploadSingleImage } from "../middleware/imageUpload.js";
import {
  adminUploadImageRoute,
  adminDeleteImageRoute,
} from "../controllers/adminUploads.controller.js";

const router = Router();

// Every upload route requires a valid access token AND the admin role —
// the Cloudinary API secret used upstream is never exposed to the browser.
router.use(requireAuth, requireRole("admin"));

router.post("/image", adminWriteLimiter, uploadSingleImage, adminUploadImageRoute);
router.delete("/image", adminWriteLimiter, adminDeleteImageRoute);

export default router;