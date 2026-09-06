import { asyncHandler } from "../utils/asyncHandler.js";
import {
  login,
  refresh,
  me,
  logout,
  changePassword,
  issueSessionFor,
} from "../services/adminAuth.service.js";
import {
  validateLoginPayload,
  validateChangePasswordPayload,
} from "../validators/adminAuth.validator.js";

export const loginRoute = asyncHandler(async (req, res) => {
  const { email, password } = validateLoginPayload(req.body);
  const admin = await login({ email, password });
  const data = await issueSessionFor(res, admin);
  res.json({ success: true, data });
});

export const refreshRoute = asyncHandler(async (req, res) => {
  const data = await refresh(req, res);
  res.json({ success: true, data });
});

export const meRoute = asyncHandler(async (req, res) => {
  const data = await me(req.admin.id);
  res.json({ success: true, data });
});

export const logoutRoute = asyncHandler(async (req, res) => {
  const data = await logout(req, res);
  res.json({ success: true, data });
});

export const changePasswordRoute = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = validateChangePasswordPayload(req.body);
  const data = await changePassword(req.admin.id, { currentPassword, newPassword });
  res.json({ success: true, data });
});
