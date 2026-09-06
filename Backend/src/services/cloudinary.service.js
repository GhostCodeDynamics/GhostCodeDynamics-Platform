import { v2 as cloudinary } from "cloudinary";
import cloudinaryEnv from "../config/cloudinaryEnv.js";

/**
 * Thin wrapper around the Cloudinary Node SDK.
 *
 * - Config is read once from cloudinaryEnv (fail-closed).
 * - Uploads go to a structured folder under ghostcode-dynamics/.
 * - The API secret never leaves this module and is never logged.
 */

let configured = false;

function client() {
  cloudinaryEnv.assertConfigured();
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudinaryEnv.cloudName,
      api_key: cloudinaryEnv.apiKey,
      api_secret: cloudinaryEnv.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/** Safe public-id validation: only our own folders may be referenced. */
export function isValidAssetPublicId(publicId) {
  return (
    typeof publicId === "string" &&
    publicId.length <= 200 &&
    publicId.startsWith(`${cloudinaryEnv.rootFolder}/`) &&
    !publicId.includes("..") &&
    /^[a-z0-9_\-/.]+$/i.test(publicId)
  );
}

/**
 * Upload a raw image buffer to Cloudinary.
 *
 * `folder` must be a single sub-folder under `ghostcode-dynamics/`.
 * Uses `use_filename` so the original filename (sanitized + made unique
 * by Cloudinary) shows up in the public id; never trusts the filename for
 * anything security-sensitive.
 *
 * Returns safe metadata only: url / publicId / width / height / format.
 * No credentials, no raw API internals.
 */
export async function uploadImage({ buffer, folder }) {
  cloudinaryEnv.assertConfigured();

  const options = {
    folder: folder ? `${cloudinaryEnv.rootFolder}/${folder}` : cloudinaryEnv.rootFolder,
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  };

  // upload_stream resolves via promise when no callback is supplied.
  const result = await new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream(options, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
    stream.on("error", reject);
    stream.end(buffer);
  });

  return {
    url: result.secure_url || result.url,
    publicId: result.public_id,
    width: result.width ?? null,
    height: result.height ?? null,
    format: result.format || null,
  };
}

/**
 * Delete a Cloudinary asset by public id.
 *
 * Only our own folder namespace is accepted — this prevents a compromised
 * admin token from wiping unrelated Cloudinary resources.
 */
export async function deleteImage(publicId) {
  if (!isValidAssetPublicId(publicId)) {
    const err = new Error("Invalid asset public id");
    err.status = 400;
    throw err;
  }
  cloudinaryEnv.assertConfigured();
  const result = await client().uploader.destroy(publicId);
  return { deleted: result?.result === "ok", result: result?.result };
}

export default { uploadImage, deleteImage, isValidAssetPublicId };