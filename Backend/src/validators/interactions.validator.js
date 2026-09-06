import { ApiError } from "../utils/ApiError.js";
import { OBJECT_ID_REGEX } from "./common.js";

export const MIN_ACTOR_ID = 8;
export const MAX_ACTOR_ID = 128;

export function validateActorId(payload = {}) {
  const actorId =
    typeof payload.actorId === "string" ? payload.actorId.trim() : "";

  if (!actorId) {
    throw new ApiError(400, "actorId is required", [
      { field: "actorId", message: "actorId is required" },
    ]);
  }

  if (actorId.length < MIN_ACTOR_ID || actorId.length > MAX_ACTOR_ID) {
    throw new ApiError(
      400,
      `actorId must be between ${MIN_ACTOR_ID} and ${MAX_ACTOR_ID} characters`,
      [
        {
          field: "actorId",
          message: `actorId must be between ${MIN_ACTOR_ID} and ${MAX_ACTOR_ID} characters`,
        },
      ]
    );
  }

  return actorId;
}

export function validateCommentIdParam(id) {
  if (!OBJECT_ID_REGEX.test(String(id))) {
    throw new ApiError(400, "Invalid comment id");
  }
  return id;
}
