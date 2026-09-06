import rateLimit from "express-rate-limit";

export const RATE_LIMITS = {
  comments: { windowMs: 15 * 60 * 1000, limit: 20 },
  interactions: { windowMs: 15 * 60 * 1000, limit: 60 },
  newsletter: { windowMs: 60 * 60 * 1000, limit: 10 },
  contact: { windowMs: 60 * 60 * 1000, limit: 5 },
  // Authenticated admin content mutations (posts/projects CRUD + reorder).
  adminWrite: { windowMs: 15 * 60 * 1000, limit: 100 },
};

export function createRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const commentsLimiter = createRateLimiter(RATE_LIMITS.comments);
export const interactionsLimiter = createRateLimiter(RATE_LIMITS.interactions);
export const newsletterLimiter = createRateLimiter(RATE_LIMITS.newsletter);
export const contactLimiter = createRateLimiter(RATE_LIMITS.contact);
export const adminWriteLimiter = createRateLimiter(RATE_LIMITS.adminWrite);
