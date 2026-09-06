import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Button } from "./ui/Button";
import { uploadAdminImage } from "../services/adminUploadService";

/**
 * ImageUploader — drag & drop / browse image upload for the admin CMS.
 *
 * Uploads go straight to the backend (POST /api/admin/uploads/image) which
 * forwards the bytes to Cloudinary; the admin never pastes a URL. The
 * returned asset is handed back via onChange({ url, publicId, width,
 * height, format, fileName }).
 *
 * State machine: idle → selected → uploading → success | error, plus
 * `value` (an already-persisted Cloudinary asset) for edit mode.
 *
 * Replace semantics: when an existing persisted image is swapped, the old
 * Cloudinary public id is passed as replacePublicId so the backend deletes
 * it only after the new upload succeeds. "Remove" detaches the field only
 * (see backend docs — server-side cleanup happens on replace, never on
 * blind detach).
 */
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = ["jpg", "jpeg", "png", "webp"];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function extensionOf(name) {
  const idx = String(name).lastIndexOf(".");
  return idx === -1 ? "" : String(name).slice(idx + 1).toLowerCase();
}

function isAccepted(file) {
  if (!file) return false;
  if (ACCEPTED_MIME.includes(file.type)) return true;
  return ACCEPTED_EXT.includes(extensionOf(file.name));
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function ImageUploader({
  label = "Image",
  folder = "projects",
  value = null,
  onChange,
  disabled = false,
  maxSize = MAX_IMAGE_BYTES,
  hint,
  className,
  containerClassName,
}) {
  const [status, setStatus] = useState("idle"); // idle | selected | uploading | success | error
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [asset, setAsset] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef(null);
  const previewUrlRef = useRef("");
  const uploadIdRef = useRef(0);
  const controllerRef = useRef(null);
  const dragDepthRef = useRef(0);

  // Always keep the current object URL in a ref so cleanup is reliable.
  const setPreview = useCallback((url) => {
    if (previewUrlRef.current && previewUrlRef.current !== url) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, []);

  useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const persistedUrl = value && value.url ? value.url : "";
  const persistedPublicId = value && value.publicId ? value.publicId : "";
  const displayUrl = previewUrl || (asset ? asset.url : persistedUrl) || "";

  const abortCurrent = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  const resetLocal = useCallback(() => {
    abortCurrent();
    uploadIdRef.current += 1;
    setPreview("");
    setAsset(null);
    setFileName("");
    setUploadError(null);
    setProgress(0);
    setStatus("idle");
  }, [setPreview, abortCurrent]);

  const handleFile = useCallback(
    (file) => {
      if (!file || disabled) return;

      // Client-side gate (server re-validates).
      if (!isAccepted(file)) {
        setPreview("");
        setAsset(null);
        setFileName(file.name);
        setUploadError("Unsupported file type. Use JPG, PNG or WEBP.");
        setStatus("error");
        return;
      }
      if (file.size > maxSize) {
        setPreview("");
        setAsset(null);
        setFileName(file.name);
        setUploadError(`Image size must be less than ${formatBytes(maxSize)}.`);
        setStatus("error");
        return;
      }

      // Race safety: bump the id so a stale response can't overwrite a
      // newer selection; abort any in-flight upload.
      abortCurrent();
      const myId = ++uploadIdRef.current;

      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      setUploadError(null);
      setProgress(0);
      setAsset(null);
      setStatus("selected");

      // Start the upload in a macrotask so the "selected" preview renders
      // before the "uploading" progress UI.
      setTimeout(() => {
        if (uploadIdRef.current !== myId) return; // replaced meanwhile
        setStatus("uploading");

        const controller = new AbortController();
        controllerRef.current = controller;

        uploadAdminImage({
          file,
          folder,
          replacePublicId: persistedPublicId || null,
          onProgress: (pct) => {
            if (uploadIdRef.current === myId) setProgress(pct);
          },
          signal: controller.signal,
        })
          .then((data) => {
            if (uploadIdRef.current !== myId) return; // stale — ignore
            controllerRef.current = null;
            setPreview("");
            setAsset(data);
            setStatus("success");
            if (typeof onChange === "function") {
              onChange({ ...data, fileName: file.name });
            }
          })
          .catch((err) => {
            if (uploadIdRef.current !== myId) return; // stale — ignore
            if (err && err.name === "AbortError") return; // replaced/removed
            controllerRef.current = null;
            setStatus("error");
            setProgress(0);
            setUploadError(
              err && err.message ? err.message : "The image could not be uploaded."
            );
          });
      }, 0);
    },
    [disabled, maxSize, folder, persistedPublicId, onChange, setPreview, abortCurrent]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setDragActive(false);
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current && inputRef.current.click();
  };

  const onRemove = () => {
    resetLocal();
    if (typeof onChange === "function") onChange(null);
  };

  const statusText =
    status === "selected"
      ? `Preparing ${fileName || "image"}…`
      : status === "uploading"
      ? `Uploading ${fileName}… ${progress}%`
      : status === "success"
        ? `${fileName || "Image"} uploaded successfully.`
        : status === "error"
          ? uploadError || "Image could not be uploaded."
          : "No image yet.";

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <span className="text-sm font-medium text-foreground">{label}</span>

      <div
        onDragEnter={disabled ? undefined : onDragEnter}
        onDragOver={disabled ? undefined : onDragOver}
        onDragLeave={disabled ? undefined : onDragLeave}
        onDrop={disabled ? undefined : onDrop}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed bg-surface/40 transition-colors",
          dragActive ? "border-primary/70 bg-primary/5" : "border-border",
          className
        )}
      >
        {/* Drag-and-drop hint that appears over any state */}
        {dragActive && !disabled && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/80 text-sm font-medium text-primary backdrop-blur-[2px]">
            <UploadCloud aria-hidden="true" className="size-4" /> Drop image here
          </div>
        )}

        {/* Hidden native file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME.join(",")}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {status === "uploading" || status === "selected" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            {status === "selected" ? (
              <>
                <FileImage aria-hidden="true" className="size-8 text-primary" />
                <span className="text-sm text-muted-foreground">Preparing upload…</span>
              </>
            ) : (
              <Loader2 aria-hidden="true" className="size-6 animate-spin text-primary" />
            )}
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Selected image preview"
                className="h-28 w-full max-w-xs rounded-lg border border-border object-cover"
              />
            ) : null}
            {status === "uploading" && (
              <div className="w-full max-w-xs">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{fileName}</span>
                  <span className="font-mono text-foreground">{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label={`Upload progress ${progress}%`}
                  className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-150"
                    style={{ width: `${Math.max(4, progress)}%` }}
                  />
                </div>
              </div>
            )}
            {!disabled && (
              <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Cancel upload">
                Cancel
              </Button>
            )}
          </div>
        ) : displayUrl || status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-6 text-center">
            {status === "success" && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                <span role="status">Image uploaded</span>
              </p>
            )}
            {status === "error" && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle aria-hidden="true" className="size-3.5" />
                <span role="alert">{uploadError}</span>
              </p>
            )}
            {displayUrl && (
              <img
                src={displayUrl}
                alt="Selected image preview"
                className="h-36 w-full max-w-sm rounded-lg border border-border object-cover"
              />
            )}
            {fileName && status !== "success" && (
              <span className="max-w-xs truncate text-xs text-muted-foreground">{fileName}</span>
            )}
            {!disabled && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={openPicker} aria-label="Replace image">
                  <RefreshCw aria-hidden="true" className="size-3.5" /> Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Remove image">
                  <Trash2 aria-hidden="true" className="size-3.5" /> Remove
                </Button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="group flex w-full flex-col items-center justify-center gap-2 px-6 py-10 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="grid size-11 place-items-center rounded-xl border border-border bg-card text-primary transition-colors group-hover:border-primary/40">
              {status === "error" ? (
                <AlertCircle aria-hidden="true" className="size-5 text-destructive" />
              ) : (
                <UploadCloud aria-hidden="true" className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium text-foreground">Upload {label.toLowerCase()}</span>
            <span className="text-xs text-muted-foreground">
              Drag &amp; drop an image here or{" "}
              <span className="font-medium text-primary underline underline-offset-2">browse files</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              JPG · PNG · WEBP — max {formatBytes(maxSize)}
            </span>
          </button>
        )}
      </div>

      {status === "error" && !displayUrl && (
        <p role="alert" className="text-xs text-destructive">
          {uploadError}
        </p>
      )}
      {hint && !uploadError && <p className="text-xs text-muted-foreground">{hint}</p>}

      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>
    </div>
  );
}

export default ImageUploader;