import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "mongo-sanitize";

import env from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import interactionsRoutes from "./routes/interactions.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminPostsRoutes from "./routes/adminPosts.routes.js";
import adminProjectsRoutes from "./routes/adminProjects.routes.js";
import adminContactsRoutes from "./routes/adminContacts.routes.js";
import adminNewsletterRoutes from "./routes/adminNewsletter.routes.js";
import adminCommentsRoutes from "./routes/adminComments.routes.js";
import adminUploadsRoutes from "./routes/adminUploads.routes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    // Comma-separated CORS_ORIGIN values add extra origins (e.g. the admin
    // panel). A single value behaves exactly as before. credentials: true is
    // required for cross-origin production calls so the httpOnly admin refresh
    // cookie is sent and stored; the explicit allow-list (never a wildcard)
    // keeps credential-aware CORS safe.
    origin: env.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
// Strip MongoDB operator keys ($gt, $where, …) from parsed input to block
// query-injection payloads before they reach any route handler.
app.use((req, _res, next) => {
  if (req.body) mongoSanitize(req.body);
  if (req.query) mongoSanitize(req.query);
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use("/api", healthRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/posts/:slug/comments", commentsRoutes);
app.use("/api", interactionsRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/admin", adminRoutes);
// Content management (authenticated; registered after /api/admin so the
// literal /api/admin/* auth routes keep priority).
app.use("/api/admin/posts", adminPostsRoutes);
app.use("/api/admin/projects", adminProjectsRoutes);
app.use("/api/admin/contacts", adminContactsRoutes);
app.use("/api/admin/newsletter", adminNewsletterRoutes);
app.use("/api/admin/comments", adminCommentsRoutes);
app.use("/api/admin/uploads", adminUploadsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
