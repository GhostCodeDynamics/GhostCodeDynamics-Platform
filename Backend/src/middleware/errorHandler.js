import env from "../config/env.js";

export function errorHandler(err, req, res, _next) {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON payload" });
  }

  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ success: false, message: "Request payload too large" });
  }

  const status = err.status ?? err.statusCode ?? 500;
  const message = status === 500 ? "Internal server error" : err.message;

  if (status === 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  const body = { success: false, message };

  if (Array.isArray(err.errors) && err.errors.length > 0) {
    body.errors = err.errors;
  }

  if (env.nodeEnv !== "production" && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
