import { ApiError } from "../utils/ApiError.js";
import { isValidEmail } from "./common.js";

export const MAX_NAME = 80;
export const MIN_PHONE = 10;
export const MAX_PHONE = 15;
export const MIN_MESSAGE = 10;
export const MAX_MESSAGE = 1500;
export const TOPICS = new Set(["project", "mentorship", "collab", "other"]);

export function validateContactPayload(payload = {}) {
  const errors = [];

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    errors.push({ field: "name", message: "name is required" });
  } else if (name.length > MAX_NAME) {
    errors.push({
      field: "name",
      message: `name must be at most ${MAX_NAME} characters`,
    });
  }

  const email =
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : "";
  if (!email) {
    errors.push({ field: "email", message: "email is required" });
  } else if (!isValidEmail(email)) {
    errors.push({ field: "email", message: "Invalid email address" });
  }

  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  if (!phone) {
    errors.push({ field: "phone", message: "phone is required" });
  } else if (phone.length < MIN_PHONE || phone.length > MAX_PHONE) {
    errors.push({
      field: "phone",
      message: `phone must be between ${MIN_PHONE} and ${MAX_PHONE} characters`,
    });
  }

  const topic = typeof payload.topic === "string" ? payload.topic.trim() : "project";
  if (!TOPICS.has(topic)) {
    errors.push({
      field: "topic",
      message: "topic must be one of: project, mentorship, collab, other",
    });
  }

  const message =
    typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) {
    errors.push({ field: "message", message: "message is required" });
  } else if (message.length < MIN_MESSAGE) {
    errors.push({
      field: "message",
      message: `message must be at least ${MIN_MESSAGE} characters`,
    });
  } else if (message.length > MAX_MESSAGE) {
    errors.push({
      field: "message",
      message: `message must be at most ${MAX_MESSAGE} characters`,
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Invalid contact submission", errors);
  }

  return { name, email, phone, topic, message };
}
