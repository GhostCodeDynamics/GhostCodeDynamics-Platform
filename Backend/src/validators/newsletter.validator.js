import { ApiError } from "../utils/ApiError.js";
import { isValidEmail } from "./common.js";

export function validateEmailBody(payload = {}) {
  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";

  if (!email) {
    throw new ApiError(400, "email is required", [
      { field: "email", message: "email is required" },
    ]);
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email address", [
      { field: "email", message: "Invalid email address" },
    ]);
  }

  return email;
}
