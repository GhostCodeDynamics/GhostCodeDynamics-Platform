import { ApiError } from "../utils/ApiError.js";
import { isValidEmail } from "./common.js";

export function validateLoginPayload(payload = {}) {
  const errors = [];

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email) {
    errors.push({ field: "email", message: "email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email address" });
  }

  const password = typeof payload.password === "string" ? payload.password : "";
  if (!password) {
    errors.push({ field: "password", message: "password is required" });
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid login payload", errors);
  }

  return { email, password };
}

export function validateChangePasswordPayload(payload = {}) {
  const errors = [];

  const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
  if (!currentPassword) {
    errors.push({ field: "currentPassword", message: "currentPassword is required" });
  }

  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
  if (!newPassword) {
    errors.push({ field: "newPassword", message: "newPassword is required" });
  } else if (newPassword.length < 8) {
    errors.push({ field: "newPassword", message: "newPassword must be at least 8 characters" });
  } else if (newPassword.length > 128) {
    errors.push({ field: "newPassword", message: "newPassword must be at most 128 characters" });
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push({ field: "newPassword", message: "newPassword must differ from currentPassword" });
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid password change payload", errors);
  }

  return { currentPassword, newPassword };
}
