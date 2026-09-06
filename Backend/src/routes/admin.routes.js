import { Router } from "express";
import rateLimit from "express-rate-limit";
import { parseCookies } from "../utils/parseCookies.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  loginRoute,
  refreshRoute,
  meRoute,
  logoutRoute,
  changePasswordRoute,
} from "../controllers/adminAuth.controller.js";

const router = Router();

/** Attach parsed cookies for this namespace only. */
router.use((req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

/**
 * Stricter-than-global limiter for credential guessing. Deliberately defined
 * here so middleware/rateLimits.js (public API) stays untouched.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

router.post("/auth/login", authLimiter, loginRoute);
router.post("/auth/refresh", authLimiter, refreshRoute);
router.post("/auth/logout", requireAuth, logoutRoute);
router.post("/auth/change-password", requireAuth, changePasswordRoute);
router.get("/auth/me", requireAuth, requireRole("admin"), meRoute);

export default router;
