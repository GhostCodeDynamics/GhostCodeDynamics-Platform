import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

/**
 * Multipart image upload middleware for /api/admin/uploads/image.
 *
 * Files are kept in memory (no disk writes) and only image payloads that
 * pass BOTH a server-side extension/MIME check are handed to Cloudinary.
 * Filename and client-provided MIME/extension are never trusted beyond
 * this coarse gate — Cloudinary re-validates the actual bytes.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ["jpg", "jpeg"]],
  ["image/png", ["png"]],
  ["image/webp", ["webp"]],
]);

function allowedMime(mime) {
  return ALLOWED_TYPES.has(mime);
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!allowedMime(file.mimetype)) {
      const err = new ApiError(
        415,
        "Unsupported image type. Allowed: JPG, PNG, WEBP.",
        [{ field: "image", message: "JPG, PNG and WEBP images only" }]
      );
      return cb(err);
    }
    cb(null, true);
  },
});

/** Single-file middleware that normalizes multer errors into ApiError. */
export function uploadSingleImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err?.name === "MulterError" && err.code === "LIMIT_FILE_SIZE") {
      return next(
        new ApiError(413, "Image size must be less than 5 MB.", [
          { field: "image", message: "Image size must be less than 5 MB." },
        ])
      );
    }
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(400, "Could not parse the uploaded file."));
  });
}

export default uploadSingleImage;