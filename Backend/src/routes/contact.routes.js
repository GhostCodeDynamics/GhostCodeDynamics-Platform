import { Router } from "express";
import { contactLimiter } from "../middleware/rateLimits.js";
import { submitContactRoute } from "../controllers/contact.controller.js";

const router = Router();

router.post("/", contactLimiter, submitContactRoute);

export default router;
