import { API_BASE_URL, ApiError, apiClient } from "./apiClient";
import { getAccessToken, clearSession, refreshSession } from "./authSession";

/**
 * Admin upload service — authenticated /api/admin/uploads namespace.
 *
 * Image uploads use XMLHttpRequest (not fetch) because browsers only
 * expose upload progress events through XHR. Body handling mirrors the
 * JSON apiClient conventions:
 *
 * POST   /admin/uploads/image  multipart(fields: image, folder, replacePublicId)
 *                             -> { url, publicId, width, height, format }
 * DELETE /admin/uploads/image  { publicId } -> { deleted }
 *
 * The Cloudinary API secret never appears in any request or response —
 * it lives exclusively behind the backend endpoint.
 */

export const IMAGE_FOLDERS = ["projects", "blog"];

/**
 * Upload a single image file.
 * @returns {Promise<{url:string, publicId:string, width:number|null, height:number|null, format:string|null}>}
 */
export function uploadAdminImage({
  file,
  folder = "projects",
  replacePublicId = null,
  onProgress,
  signal,
}) {
  return doUpload({ file, folder, replacePublicId, onProgress, signal, retried: false });
}

function doUpload({ file, folder, replacePublicId, onProgress, signal, retried }) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}/admin/uploads/image`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    const token = getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.withCredentials = true;

    const onAbort = () => {
      xhr.abort();
    };
    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        reject(new Error("Upload cancelled"));
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (signal) signal.removeEventListener("abort", onAbort);

      let payload = null;
      try {
        payload = JSON.parse(xhr.responseText || "null");
      } catch {
        payload = null;
      }

      // Transparent single refresh+retry on an expired access token.
      const status = xhr.status;
      if (status === 401 && token !== null && !retried) {
        refreshSession()
          .then(() =>
            doUpload({ file, folder, replacePublicId, onProgress, signal, retried: true }).then(resolve, reject)
          )
          .catch(() => {
            clearSession();
            reject(
              new ApiError({
                message: "Your session expired. Please sign in again.",
                status: 401,
              })
            );
          });
        return;
      }

      if (status >= 200 && status < 300 && payload && payload.success === true) {
        resolve(payload.data);
        return;
      }

      const withBody = (overrides) =>
        reject(
          new ApiError({
            message:
              payload && typeof payload.message === "string" && payload.message.trim()
                ? payload.message
                : "Image could not be uploaded.",
            errors: payload && Array.isArray(payload.errors) ? payload.errors : undefined,
            ...overrides,
          })
        );

      if (status === 429) {
        withBody({
          message: "Too many uploads. Please wait a moment and try again.",
          isRateLimited: true,
        });
      } else if (status === 401) {
        withBody({ message: "Your session expired. Please sign in again." });
      } else {
        withBody({});
      }
    });

    xhr.addEventListener("error", () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      reject(
        new ApiError({
          message: "Network error while uploading the image.",
          isNetworkError: true,
        })
      );
    });

    xhr.addEventListener("abort", () => {
      if (signal) signal.removeEventListener("abort", onAbort);
      const err = new Error("Upload cancelled");
      err.name = "AbortError";
      reject(err);
    });

    const body = new FormData();
    body.append("image", file, file.name);
    body.append("folder", folder);
    if (replacePublicId) body.append("replacePublicId", replacePublicId);
    xhr.send(body);
  });
}

/** Delete one of our own Cloudinary assets (used on explicit removal). */
export function deleteAdminImage(publicId, { signal } = {}) {
  return apiClient.del(`/admin/uploads/image`, { publicId }, { signal });
}