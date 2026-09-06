import jwt from "jsonwebtoken";
import adminEnv from "../config/adminEnv.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Verifies the Bearer access token and attaches { id, email, role } to
 * req.admin. Applies to /api/admin/* routes only; public API is untouched.
 */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Authentication required"));
  }

  let payload;
  try {
    payload = jwt.verify(token, adminEnv.assertConfigured(), {
      algorithms: ["HS256"],
    });
  } catch {
    return next(new ApiError(401, "Session expired or invalid"));
  }

  if (!payload || payload.type !== "access" || !payload.sub) {
    return next(new ApiError(401, "Session expired or invalid"));
  }

  req.admin = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  return next();
}

export default requireAuth;
