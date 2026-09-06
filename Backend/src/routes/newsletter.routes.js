import { Router } from "express";
import { newsletterLimiter } from "../middleware/rateLimits.js";
import {
  subscribeRoute,
  unsubscribeRoute,
} from "../controllers/newsletter.controller.js";

const router = Router();

router.post("/subscribe", newsletterLimiter, subscribeRoute);
router.post("/unsubscribe", newsletterLimiter, unsubscribeRoute);

export default router;
