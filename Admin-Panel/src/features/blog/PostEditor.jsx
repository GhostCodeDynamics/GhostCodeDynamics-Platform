import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Eye,
  FileText,
  Heart,
  MessageSquare,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { ImageUploader } from "../../components/ImageUploader";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChanges";
import { useToast } from "../../hooks/useToast";
import { apiErrorMessage } from "../../services/apiClient";
import {
  createAdminPost,
  deleteAdminPost,
  getAdminPost,
  updateAdminPost,
} from "../../services/adminPostsService";

/**
 * The website renders post bodies with a minimal markdown subset
 * (headings / bullets / quotes / code fences). The editor is therefore a
 * plain textarea — no rich-text conversion — so what is saved is exactly
 * what the public article page displays.
 */
const BODY_SYNTAX_HINT =
  "Markdown-style: ## heading · ### subheading · - bullet · > quote · ``` code fence · **bold** · `inline code`";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function emptyForm() {
  return {
    title: "",
    slug: "",
    subtitle: "",
    excerpt: "",
    cover: "",
    coverPublicId: "",
    category: "",
    tagsText: "",
    authorName: "",
    authorRole: "",
    readingMinutes: "",
    publishedAtLocal: "", // "" = draft
    featured: false,
    trending: false,
    editorsPick: false,
    body: "",
  };
}

function toLocalInputValue(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function postToForm(post) {
  return {
    title: post.title || "",
    slug: post.slug || "",
    subtitle: post.subtitle || "",
    excerpt: post.excerpt || "",
    cover: post.cover || "",
    coverPublicId: post.coverPublicId || "",
    category: post.category || "",
    tagsText: Array.isArray(post.tags) ? post.tags.join(", ") : "",
    authorName: post.author?.name || "",
    authorRole: post.author?.role || "",
    readingMinutes: post.readingMinutes ? String(post.readingMinutes) : "",
    publishedAtLocal: toLocalInputValue(post.publishedAt),
    featured: Boolean(post.featured),
    trending: Boolean(post.trending),
    editorsPick: Boolean(post.editorsPick),
    body: post.body || "",
  };
}

function formToPayload(form) {
  const payload = {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    excerpt: form.excerpt.trim(),
    cover: form.cover.trim(),
    coverPublicId: form.coverPublicId.trim(),
    category: form.category.trim(),
    tags: form.tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    author: { name: form.authorName.trim(), role: form.authorRole.trim() },
    publishedAt: form.publishedAtLocal
      ? new Date(form.publishedAtLocal).toISOString()
      : null,
    featured: form.featured,
    trending: form.trending,
    editorsPick: form.editorsPick,
    body: form.body,
  };
  if (form.slug.trim()) payload.slug = form.slug.trim();
  const minutes = Number(form.readingMinutes);
  if (form.readingMinutes && Number.isFinite(minutes)) {
    payload.readingMinutes = Math.max(0, Math.round(minutes));
  }
  return payload;
}

function validateLocally(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!form.category.trim()) errors.category = "Category is required.";
  if (!form.authorName.trim()) errors.authorName = "Author name is required.";
  if (form.slug.trim() && !SLUG_PATTERN.test(form.slug.trim())) {
    errors.slug = "Lowercase letters, numbers and single dashes only.";
  }
  return errors;
}

/** Maps API errors[] entries ({field,message}) onto form field names. */
function fieldErrorsFrom(err) {
  const map = {};
  if (err && Array.isArray(err.errors)) {
    for (const item of err.errors) {
      if (!item?.field) continue;
      const key = item.field.replace(/^author\./, "");
      if (!map[key]) map[key] = item.message;
    }
  }
  return map;
}

function FlagCheckbox({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function PostEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadStatus, setLoadStatus] = useState(isEdit ? "loading" : "ready");
  const [loadError, setLoadError] = useState(null);
  const [post, setPost] = useState(null);
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

  const onCoverChange = useCallback(
    (asset) => {
      setForm((f) => {
        const next = {
          ...f,
          cover: asset && asset.url ? asset.url : "",
          coverPublicId: asset && asset.publicId ? asset.publicId : "",
        };
        recomputeDirty(next);
        return next;
      });
    },
    [recomputeDirty]
  );

  // Load the post when editing.
  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    const controller = new AbortController();
    setLoadStatus("loading");
    getAdminPost(id, controller.signal)
      .then(({ data }) => {
        if (cancelled) return;
        setPost(data);
        const next = postToForm(data);
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

  const goBack = useCallback(() => navigate("/posts"), [navigate]);

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
        await updateAdminPost(id, payload);
        toast("Post saved.", { tone: "success" });
      } else {
        await createAdminPost(payload);
        toast("Post created.", { tone: "success" });
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
    if (!post?._id && !post?.id) return;
    setDeleting(true);
    try {
      await deleteAdminPost(post._id ?? post.id);
      toast(`Deleted "${post.title}". Existing comments were kept.`, { tone: "success" });
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
    return <LoadingState rows={8} label="Loading post." />;
  }
  if (loadStatus === "error") {
    return (
      <ErrorState
        error={loadError}
        onRetry={() => window.location.reload()}
        title="Could not load this post"
      />
    );
  }

  const publishHint = !form.publishedAtLocal
    ? "Draft — hidden from the public site."
    : new Date(form.publishedAtLocal).getTime() > Date.now()
      ? "Future date set — note: the public list shows any non-null publish date immediately (no scheduler)."
      : "Published.";

  return (
    <form onSubmit={onSave} className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="iconSm" aria-label="Back to posts" onClick={onCancel}>
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {isEdit ? "Edit post" : "New post"}
            </h2>
            {isEdit && post?.slug && (
              <p className="font-mono text-xs text-muted-foreground">/{post.slug}</p>
            )}
          </div>
        </div>
        {isEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral"><Eye aria-hidden="true" className="mr-1 inline size-3" />{post?.views ?? 0} views</Badge>
            <Badge tone="neutral"><Heart aria-hidden="true" className="mr-1 inline size-3" />{post?.likes ?? 0} likes</Badge>
            <Badge tone="neutral"><MessageSquare aria-hidden="true" className="mr-1 inline size-3" />{post?.commentsCount ?? 0} comments</Badge>
          </div>
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      )}

      {/* Basic information */}
      <Card>
        <CardHeader icon={FileText} title="Basic information" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            error={fieldErrors.title}
            containerClassName="md:col-span-2"
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            error={fieldErrors.slug}
            placeholder={isEdit ? undefined : "auto-generated from title"}
            hint={
              isEdit
                ? "Changing the slug changes the public URL of this article."
                : "Leave blank to auto-generate from the title."
            }
          />
          <Input
            label="Category"
            required
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            error={fieldErrors.category}
            placeholder="e.g. Engineering"
          />
          <Input
            label="Subtitle"
            value={form.subtitle}
            onChange={(e) => setField("subtitle", e.target.value)}
            error={fieldErrors.subtitle}
            containerClassName="md:col-span-2"
          />
          <Input
            label="Excerpt"
            value={form.excerpt}
            onChange={(e) => setField("excerpt", e.target.value)}
            error={fieldErrors.excerpt}
            containerClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <ImageUploader
              label="Cover image"
              folder="covers"
              value={form.cover ? { url: form.cover, publicId: form.coverPublicId } : null}
              onChange={onCoverChange}
              error={fieldErrors.cover}
              disabled={saving}
            />
          </div>
        </CardBody>
      </Card>

      {/* Classification + author */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Sparkles} title="Classification" />
          <CardBody className="space-y-4">
            <Input
              label="Tags (comma separated)"
              value={form.tagsText}
              onChange={(e) => setField("tagsText", e.target.value)}
              error={fieldErrors.tags}
              placeholder="security, node, web"
            />
            <Select
              label="Reading minutes"
              value={form.readingMinutes}
              onChange={(e) => setField("readingMinutes", e.target.value)}
              error={fieldErrors.readingMinutes}
              hint="Shown on the public article card."
            >
              <option value="">Default (0)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Author" />
          <CardBody className="space-y-4">
            <Input
              label="Name"
              required
              value={form.authorName}
              onChange={(e) => setField("authorName", e.target.value)}
              error={fieldErrors.authorName}
            />
            <Input
              label="Role"
              value={form.authorRole}
              onChange={(e) => setField("authorRole", e.target.value)}
              error={fieldErrors.authorRole}
              placeholder="e.g. Founder & Lead Engineer"
            />
          </CardBody>
        </Card>
      </div>

      {/* Publishing */}
      <Card>
        <CardHeader title="Publishing" subtitle="Drafts are invisible on the public site until given a publish date." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="Publish date & time"
              type="datetime-local"
              value={form.publishedAtLocal}
              onChange={(e) => setField("publishedAtLocal", e.target.value)}
              hint={publishHint}
            />
            <Button
              variant="outline"
              onClick={() => setField("publishedAtLocal", "")}
              disabled={!form.publishedAtLocal}
            >
              Unpublish (set as draft)
            </Button>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Flags</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <FlagCheckbox
                label="Featured"
                hint="Spotlight slot on the site"
                checked={form.featured}
                onChange={(v) => setField("featured", v)}
              />
              <FlagCheckbox
                label="Trending"
                checked={form.trending}
                onChange={(v) => setField("trending", v)}
              />
              <FlagCheckbox
                label="Editor's pick"
                checked={form.editorsPick}
                onChange={(v) => setField("editorsPick", v)}
              />
            </div>
          </fieldset>
        </CardBody>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader title="Content" subtitle={BODY_SYNTAX_HINT} />
        <CardBody>
          <textarea
            value={form.body}
            onChange={(e) => setField("body", e.target.value)}
            rows={16}
            spellCheck
            aria-label="Post body (markdown-style)"
            className="w-full rounded-lg border border-border bg-card p-3 font-mono text-sm leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {fieldErrors.body && (
            <p role="alert" className="mt-1.5 text-xs text-destructive">{fieldErrors.body}</p>
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
              {isEdit ? "Save changes" : "Create post"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Delete "${post?.title ?? ""}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep post</Button>
            <Button variant="destructive" loading={deleting} onClick={onDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes the post from the website immediately and cannot be undone.
          Reader comments are retained but become unreachable unless a new post
          reuses the same slug.
        </p>
      </Modal>
    </form>
  );
}
