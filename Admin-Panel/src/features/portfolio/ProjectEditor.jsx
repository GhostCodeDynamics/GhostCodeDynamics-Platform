import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, FolderKanban, Image as ImageIcon, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { ImageUploader } from "../../components/ImageUploader";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChanges";
import { useToast } from "../../hooks/useToast";
import { apiErrorMessage } from "../../services/apiClient";
import {
  createAdminProject,
  deleteAdminProject,
  getAdminProject,
  updateAdminProject,
} from "../../services/adminProjectsService";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function emptyForm() {
  return {
    name: "",
    slug: "",
    category: "",
    image: "",
    imagePublicId: "",
    problem: "",
    solution: "",
    techText: "",
    liveUrl: "",
    repoUrl: "",
    order: "0",
    publishedAtLocal: "", // "" = draft
    featured: false,
  };
}

function toLocalInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function projectToForm(project) {
  return {
    name: project.name || "",
    slug: project.slug || "",
    category: project.category || "",
    image: project.image || "",
    imagePublicId: project.imagePublicId || "",
    problem: project.problem || "",
    solution: project.solution || "",
    techText: Array.isArray(project.tech) ? project.tech.join(", ") : "",
    liveUrl: project.liveUrl || "",
    repoUrl: project.repoUrl || "",
    order: String(project.order ?? 0),
    publishedAtLocal: toLocalInputValue(project.publishedAt),
    featured: Boolean(project.featured),
  };
}

function formToPayload(form) {
  const payload = {
    name: form.name.trim(),
    category: form.category.trim(),
    image: form.image.trim(),
    imagePublicId: form.imagePublicId.trim(),
    problem: form.problem.trim(),
    solution: form.solution.trim(),
    tech: form.techText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    liveUrl: form.liveUrl.trim(),
    repoUrl: form.repoUrl.trim(),
    publishedAt: form.publishedAtLocal
      ? new Date(form.publishedAtLocal).toISOString()
      : null,
    featured: form.featured,
  };
  if (form.slug.trim()) payload.slug = form.slug.trim();
  const order = Number(form.order);
  if (Number.isFinite(order)) payload.order = Math.max(0, Math.round(order));
  return payload;
}

function validateLocally(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (!form.category.trim()) errors.category = "Category is required.";
  const order = Number(form.order);
  if (!Number.isInteger(order) || order < 0) {
    errors.order = "Order must be a whole number of 0 or more.";
  }
  for (const field of ["liveUrl", "repoUrl"]) {
    const value = form[field].trim();
    if (value && !/^https?:\/\/\S+$/i.test(value)) {
      errors[field] = "Must be a valid http(s) URL.";
    }
  }
  if (form.slug.trim() && !SLUG_PATTERN.test(form.slug.trim())) {
    errors.slug = "Lowercase letters, numbers and single dashes only.";
  }
  return errors;
}

function fieldErrorsFrom(err) {
  const map = {};
  if (err && Array.isArray(err.errors)) {
    for (const item of err.errors) {
      if (!item?.field) continue;
      if (!map[item.field]) map[item.field] = item.message;
    }
  }
  return map;
}

export function ProjectEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadStatus, setLoadStatus] = useState(isEdit ? "loading" : "ready");
  const [loadError, setLoadError] = useState(null);
  const [project, setProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const snapshotRef = useRef(JSON.stringify(emptyForm()));
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { markClean } = useUnsavedChangesGuard(dirty);

  const recomputeDirty = useCallback((nextForm) => {
    setDirty(JSON.stringify(nextForm) !== snapshotRef.current);
  }, []);

  const setField = useCallback(
    (key, value) => {
      setForm((f) => {
        const next = { ...f, [key]: value };
        recomputeDirty(next);
        return next;
      });
    },
    [recomputeDirty]
  );

  const onImageChange = useCallback(
    (asset) => {
      setForm((f) => {
        const next = {
          ...f,
          image: asset && asset.url ? asset.url : "",
          imagePublicId: asset && asset.publicId ? asset.publicId : "",
        };
        recomputeDirty(next);
        return next;
      });
    },
    [recomputeDirty]
  );

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setLoadStatus("loading");
    getAdminProject(id, controller.signal)
      .then(({ data }) => {
        if (cancelled) return;
        setProject(data);
        const next = projectToForm(data);
        setForm(next);
        snapshotRef.current = JSON.stringify(next);
        setDirty(false);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setLoadError(err);
        setLoadStatus("error");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, isEdit]);

  const goBack = useCallback(() => navigate("/projects"), [navigate]);

  // A successful save makes the just-submitted form the new clean baseline:
  // the saved-snapshot is reset, dirty is cleared and the navigation guard is
  // disarmed in the same tick (before any subsequent navigation), so leaving
  // the editor no longer raises a false "unsaved changes" prompt.
  const markSaved = useCallback(() => {
    snapshotRef.current = JSON.stringify(form);
    setDirty(false);
    markClean();
  }, [form, markClean]);

  const onCancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    goBack();
  };

  const onSave = async (e) => {
    e.preventDefault();
    setFormError(null);

    const localErrors = validateLocally(form);
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      setFormError("Please correct the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (isEdit) {
        await updateAdminProject(id, payload);
        toast("Project saved.", { tone: "success" });
      } else {
        await createAdminProject(payload);
        toast("Project created.", { tone: "success" });
      }
      markSaved();
    } catch (err) {
      if (err?.name === "AbortError") return;
      const mapped = fieldErrorsFrom(err);
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
        setFormError("Please correct the highlighted fields.");
      } else {
        setFormError(apiErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!project?._id && !project?.id) return;
    setDeleting(true);
    try {
      await deleteAdminProject(project._id ?? project.id);
      toast(`Deleted "${project.name}".`, { tone: "success" });
      setConfirmOpen(false);
      markClean();
      goBack();
    } catch (err) {
      setConfirmOpen(false);
      toast(apiErrorMessage(err), { tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  if (loadStatus === "loading") {
    return <LoadingState rows={8} label="Loading project." />;
  }
  if (loadStatus === "error") {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => window.location.reload()}
        title="Could not load this project"
      />
    );
  }

  return (
    <form onSubmit={onSave} className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="iconSm" aria-label="Back to projects" onClick={onCancel}>
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Button>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {isEdit ? "Edit project" : "New project"}
          </h2>
          {isEdit && project?.slug && (
            <p className="font-mono text-xs text-muted-foreground">/{project.slug}</p>
          )}
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      )}

      {/* Identity */}
      <Card>
        <CardHeader icon={FolderKanban} title="Identity" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            error={fieldErrors.name}
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            error={fieldErrors.slug}
            placeholder={isEdit ? undefined : "auto-generated from name"}
            hint={isEdit ? "Changing it changes the public URL of this project." : ""}
          />
          <Input
            label="Category"
            required
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            error={fieldErrors.category}
            placeholder="e.g. Web"
          />
          <Input
            label="Tech stack (comma separated)"
            value={form.techText}
            onChange={(e) => setField("techText", e.target.value)}
            error={fieldErrors.tech}
            placeholder="React, Node.js, MongoDB"
          />
        </CardBody>
      </Card>

      {/* Cover image */}
      <Card>
        <CardHeader
          icon={ImageIcon}
          title="Cover image"
          subtitle="Uploaded to Cloudinary and served optimized. Leave empty for no image."
        />
        <CardBody>
          <ImageUploader
            label="Project image"
            folder="projects"
            value={form.image ? { url: form.image, publicId: form.imagePublicId } : null}
            onChange={onImageChange}
            disabled={saving}
          />
        </CardBody>
      </Card>

      {/* Narrative */}
      <Card>
        <CardHeader title="Problem & solution" subtitle="Shown in the public case-study layout." />
        <CardBody className="space-y-4">
          <Input
            label="The problem"
            value={form.problem}
            onChange={(e) => setField("problem", e.target.value)}
            error={fieldErrors.problem}
          />
          <Input
            label="The solution"
            value={form.solution}
            onChange={(e) => setField("solution", e.target.value)}
            error={fieldErrors.solution}
          />
        </CardBody>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader title="Links" subtitle="Leave a field empty to show “coming soon” publicly." />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input
            label="Live URL"
            type="url"
            value={form.liveUrl}
            onChange={(e) => setField("liveUrl", e.target.value)}
            error={fieldErrors.liveUrl}
            placeholder="https://…"
          />
          <Input
            label="Repository URL"
            type="url"
            value={form.repoUrl}
            onChange={(e) => setField("repoUrl", e.target.value)}
            error={fieldErrors.repoUrl}
            placeholder="https://github.com/…"
          />
        </CardBody>
      </Card>

      {/* Publishing */}
      <Card>
        <CardHeader title="Publishing & ordering" subtitle="Lower order numbers appear first on the public site." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Display order"
              type="number"
              min="0"
              step="1"
              value={form.order}
              onChange={(e) => setField("order", e.target.value)}
              error={fieldErrors.order}
            />
            <Input
              label="Publish date & time"
              type="datetime-local"
              value={form.publishedAtLocal}
              onChange={(e) => setField("publishedAtLocal", e.target.value)}
              hint={!form.publishedAtLocal ? "Draft — hidden from the public site." : "Published."}
            />
            <label className="flex cursor-pointer items-start gap-2.5 self-end rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField("featured", e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="block text-xs text-muted-foreground">Highlighted slot</span>
              </span>
            </label>
          </div>
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Tip: drag-free reordering is available from the projects table via
              Move up / Move down — it rewrites every display order at once.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 backdrop-blur-md lg:left-[264px]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <p className="label-mono">
            {saving ? "Saving…" : deleting ? "Deleting…" : dirty ? "Unsaved changes" : isEdit ? "All changes saved" : "Ready"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isEdit && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 aria-hidden="true" className="size-4" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {!saving && <Save aria-hidden="true" className="size-4" />}
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete "${project?.name ?? ""}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep project</Button>
            <Button variant="destructive" loading={deleting} onClick={onDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes the project from the website immediately and cannot be undone.
        </p>
      </Modal>
    </form>
  );
}
