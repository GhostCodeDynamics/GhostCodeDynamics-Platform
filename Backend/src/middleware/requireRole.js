import { ApiError } from "../utils/ApiError.js";

/**
 * Role guard factory, used after requireAuth. Currently only "admin"
 * exists, but this keeps the namespace ready for least-privilege roles.
 */
export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    return next();
  };
}

export default requireRole;
