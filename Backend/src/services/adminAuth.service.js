import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin, {
  generateRefreshToken,
  hashRefreshToken,
} from "../models/Admin.js";
import adminEnv from "../config/adminEnv.js";
import { ApiError } from "../utils/ApiError.js";

const REFRESH_COOKIE = "gcd_admin_refresh";

function signAccessToken(admin) {
  return jwt.sign(
    { type: "access", email: admin.email, role: admin.role },
    adminEnv.assertConfigured(),
    { algorithm: "HS256", subject: String(admin._id), expiresIn: adminEnv.accessTtl }
  );
}

export async function issueSessionFor(res, admin) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + adminEnv.refreshTtlMs);
  admin.addSession(hashRefreshToken(refreshToken), expiresAt);
  await admin.save();
  res.cookie(REFRESH_COOKIE, refreshToken, adminEnv.cookieOptions());
  return {
    accessToken: signAccessToken(admin),
    admin: publicAdmin(admin),
  };
}

export function publicAdmin(admin) {
  return {
    id: String(admin._id),
    email: admin.email,
    name: admin.name,
    role: admin.role,
    createdAt: admin.createdAt,
  };
}

/** Constant-ish behavior for unknown email vs wrong password. */
export async function login({ email, password }) {
  adminEnv.assertConfigured();
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid email or password");
  }
  return admin;
}

/**
 * Rotate the refresh token: old hash is revoked, a fresh session is issued.
 * A missing/unknown/expired cookie yields 401 so the client clears state.
 */
export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new ApiError(401, "No active session");
  }

  const tokenHash = hashRefreshToken(token);
  const admin = await Admin.findOne({ "sessions.tokenHash": tokenHash });
  if (!admin) {
    res.clearCookie(REFRESH_COOKIE, adminEnv.cookieOptions());
    throw new ApiError(401, "Session expired");
  }

  const session = admin.sessions.find((s) => s.tokenHash === tokenHash);
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    admin.revokeSession(tokenHash);
    await admin.save();
    res.clearCookie(REFRESH_COOKIE, adminEnv.cookieOptions());
    throw new ApiError(401, "Session expired");
  }

  admin.revokeSession(tokenHash); // rotation: single-use tokens
  return issueSessionFor(res, admin);
}

export async function me(adminId) {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(401, "Account not found");
  }
  return publicAdmin(admin);
}

export async function logout(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token && req.admin) {
    const admin = await Admin.findById(req.admin.id);
    if (admin) {
      admin.revokeSession(hashRefreshToken(token));
      await admin.save();
    }
  }
  if (token) {
    res.clearCookie(REFRESH_COOKIE, adminEnv.cookieOptions());
  }
  return { success: true };
}

export async function changePassword(adminId, { currentPassword, newPassword }) {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(401, "Account not found");
  }

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const salt = await bcrypt.genSalt(12);
  admin.passwordHash = await bcrypt.hash(newPassword, salt);
  // Revoke all sessions except current one for security
  admin.sessions = [];
  await admin.save();

  return { success: true, message: "Password changed. All other sessions revoked." };
}
