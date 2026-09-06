import { ApiError } from "../utils/ApiError.js";
import {
  uploadImage as cloudinaryUpload,
  deleteImage as cloudinaryDelete,
  isValidAssetPublicId,
} from "./cloudinary.service.js";

/**
 * Authenticated admin upload operations.
 *
 * - `folder` is constrained to the known set (projects | blog) so callers
 *   can never scatter files into arbitrary Cloudinary locations.
 * - `replacePublicId` (optional) lets an editor swap one asset for another
 *   in a single request: the old asset is deleted ONLY after the new
 *   upload succeeds, so a failed upload never destroys the existing image.
 */
const ALLOWED_FOLDERS = ["projects", "blog"];

export function validateFolder(folder) {
  if (folder === undefined || folder === null || folder === "") return null;
  if (typeof folder !== "string" || !ALLOWED_FOLDERS.includes(folder)) {
    throw new ApiError(400, "Invalid upload folder", [
      { field: "folder", message: `folder must be one of: ${ALLOWED_FOLDERS.join(", ")}` },
    ]);
  }
  return folder;
}

export async function uploadAdminImage({ file, folder, replacePublicId }) {
  if (!file || !file.buffer) {
    throw new ApiError(400, "No image provided", [
      { field: "image", message: "attach an image file as multipart field 'image'" },
    ]);
  }

  const safeFolder = validateFolder(folder);
  const asset = await cloudinaryUpload({ buffer: file.buffer, folder: safeFolder });

  // Safe cleanup after a successful replace (never on failure).
  if (replacePublicId) {
    if (!isValidAssetPublicId(replacePublicId)) {
      throw new ApiError(400, "Invalid replacePublicId", [
        { field: "replacePublicId", message: "must reference a ghostcode-dynamics asset" },
      ]);
    }
    try {
      await cloudinaryDelete(replacePublicId);
    } catch {
      // Orphaned old asset — never fail an otherwise-successful upload
      // because cleanup of the prior image failed.
    }
  }

  return asset;
}

export async function deleteAdminImage(publicId) {
  if (!publicId || !isValidAssetPublicId(publicId)) {
    throw new ApiError(400, "Invalid asset public id", [
      { field: "publicId", message: "must reference a ghostcode-dynamics asset" },
    ]);
  }
  return cloudinaryDelete(publicId);
}