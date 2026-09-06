import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadAdminImage,
  deleteAdminImage,
  validateFolder,
} from "../services/adminUploads.service.js";

/**
 * POST /api/admin/uploads/image
 * Multipart field `image`; optional fields `folder` (projects|blog) and
 * `replacePublicId`. Returns safe uploaded asset metadata.
 */
export const adminUploadImageRoute = asyncHandler(async (req, res) => {
  const folder = validateFolder(req.body?.folder);
  const replacePublicId =
    typeof req.body?.replacePublicId === "string" && req.body.replacePublicId.trim()
      ? req.body.replacePublicId.trim()
      : null;

  const asset = await uploadAdminImage({
    file: req.file,
    folder,
    replacePublicId,
  });

  res.status(201).json({ success: true, data: asset });
});

/**
 * DELETE /api/admin/uploads/image
 * Body: { publicId }. Deletes one of our own Cloudinary assets.
 */
export const adminDeleteImageRoute = asyncHandler(async (req, res) => {
  const result = await deleteAdminImage(req.body?.publicId);
  res.json({ success: true, data: result });
});