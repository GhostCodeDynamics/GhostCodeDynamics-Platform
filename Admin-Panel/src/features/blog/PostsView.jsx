import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  FileText,
  PencilLine,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { Select } from "../../components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { Table, TableContainer, TBody, THead } from "../../components/ui/Table";
import { useToast } from "../../hooks/useToast";
import { apiErrorMessage } from "../../services/apiClient";
import {
  deleteAdminPost,
  listAdminPosts,
} from "../../services/adminPostsService";
import { formatNumber } from "../../utils/format";

const PAGE_SIZE = 10;

/** Three-way flag filter values: undefined | true | false. */
const FLAG_OPTIONS = [
  { value: "", label: "Any" },
  { value: "true", label: "Only" },
  { value: "false", label: "Without" },
];

function buildQuery({ search, category, tag, sort, page, featured, trending, editorsPick }) {
  return {
    search: search || undefined,
    category: category || undefined,
    tag: tag || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
    featured: featured || undefined,
    trending: trending || undefined,
    editorsPick: editorsPick || undefined,
  };
}

function publishBadge(publishedAt) {
  if (!publishedAt) return <Badge tone="neutral">Draft</Badge>;
  const time = new Date(publishedAt).getTime();
  if (time > Date.now()) {
    return (
      <Badge tone="warning">
        <span title="Note: the public list shows any non-null publish date immediately">Scheduled*</span>
      </Badge>
    );
  }
  return <Badge tone="success">Published</Badge>;
}

/**
 * Blog manager backed by the authenticated /api/admin/posts namespace.
 * Unlike the public list it also returns drafts, exposes _id for row
 * actions, and supports three-way featured/trending/editorsPick filters.
 */
export function PostsView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState("");
  const [trending, setTrending] = useState("");
  const [editorsPick, setEditorsPick] = useState("");

  const [knownCategories, setKnownCategories] = useState([]);
  const abortRef = useRef(null);

  const [state, setState] = useState({ status: "loading", items: [], meta: null, error: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState((s) => ({ ...s, status: "loading", error: null }));
      listAdminPosts(buildQuery({ search, category, tag, sort, page, featured, trending, editorsPick }), controller.signal)
        .then(({ data, meta }) => {
          setState({ status: "success", items: Array.isArray(data) ? data : [], meta, error: null });
          const cats = Array.from(new Set((data || []).map((p) => p.category).filter(Boolean)));
          setKnownCategories((prev) => Array.from(new Set([...prev, ...cats])).sort());
        })
        .catch((err) => {
          if (err && err.name === "AbortError") return;
          setState((s) => ({ status: "error", items: [], meta: s.meta, error: err }));
        });
    },
    [search, category, tag, sort, page, featured, trending, editorsPick]
  );

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  // Debounced server-side search.
  const searchInitializedRef = useRef(false);
  useEffect(() => {
    if (!searchInitializedRef.current) {
      searchInitializedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Stay in sync when the URL param changes (e.g. topbar search hand-off).
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearchInput(urlSearch);
    setSearch(urlSearch);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const next = {};
    if (search) next.search = search;
    setSearchParams(next, { replace: true });
  }, [search, setSearchParams]);

  const totalPages = state.meta?.totalPages ?? 1;
  const total = state.meta?.total ?? 0;
  const hasActiveFilters = Boolean(
    search || category || tag || featured || trending || editorsPick
  );

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setTag("");
    setFeatured("");
    setTrending("");
    setEditorsPick("");
    setPage(1);
  };

  const rows = useMemo(() => state.items, [state.items]);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminPost(deleteTarget._id);
      toast(`Deleted "${deleteTarget.title}". Comments were kept.`, { tone: "success" });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteTarget(null);
      toast(apiErrorMessage(err), { tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="glass rounded-xl p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto_auto]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              label="Search"
              aria-label="Search posts by title or excerpt"
              placeholder="Title or excerpt…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              containerClassName="gap-0"
              className="pl-9"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-[38px] grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            )}
          </div>

          <Select
            label="Category"
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            containerClassName="min-w-36"
          >
            <option value="">All categories</option>
            {(knownCategories.length > 0 ? knownCategories : category ? [category] : []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          <Select
            label="Featured"
            aria-label="Filter by featured flag"
            value={featured}
            onChange={(e) => {
              setFeatured(e.target.value);
              setPage(1);
            }}
            containerClassName="min-w-32"
          >
            {FLAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>

          <Select
            label="Trending"
            aria-label="Filter by trending flag"
            value={trending}
            onChange={(e) => {
              setTrending(e.target.value);
              setPage(1);
            }}
            containerClassName="min-w-32"
          >
            {FLAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>

          <Select
            label="Editor's pick"
            aria-label="Filter by editors pick flag"
            value={editorsPick}
            onChange={(e) => {
              setEditorsPick(e.target.value);
              setPage(1);
            }}
            containerClassName="min-w-32"
          >
            {FLAG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>

          <Select
            label="Sort"
            aria-label="Sort posts"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            containerClassName="min-w-36"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most viewed</option>
            <option value="likes">Most liked</option>
            <option value="comments">Most commented</option>
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="label-mono">
            {state.status === "success" && (
              <>
                {formatNumber(total)} post{total === 1 ? "" : "s"} incl. drafts
                {hasActiveFilters ? " matching filters" : ""}
                {" · "}page {page}/{Math.max(totalPages, 1)}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {tag && (
              <Button variant="ghost" size="sm" onClick={() => { setTag(""); setPage(1); }}>
                <X aria-hidden="true" className="size-3.5" /> Tag: {tag}
              </Button>
            )}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X aria-hidden="true" className="size-3.5" /> Clear filters
              </Button>
            )}
            <Button size="sm" onClick={() => navigate("/posts/new")}>
              <Plus aria-hidden="true" className="size-4" /> New post
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {state.status === "loading" ? (
        <LoadingState rows={6} />
      ) : state.status === "error" ? (
        <ErrorState error={state.error} onRetry={() => load()} title="Could not load posts" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasActiveFilters ? "No posts match these filters" : "No posts yet"}
          description={
            hasActiveFilters
              ? "Try a different search term or clear the filters."
              : "Create your first post — it stays a private draft until you give it a publish date."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button onClick={() => navigate("/posts/new")}>
                <Plus aria-hidden="true" className="size-4" /> New post
              </Button>
            )
          }
        />
      ) : (
        <TableContainer className="rounded-xl border border-border bg-card">
          <Table className="min-w-[920px]">
            <THead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Author</th>
                <th scope="col" className="!text-right">Views</th>
                <th scope="col" className="!text-right">Likes</th>
                <th scope="col" className="!text-right">Comments</th>
                <th scope="col">Flags</th>
                <th scope="col" className="!text-right">Actions</th>
              </tr>
            </THead>
            <TBody>
              {rows.map((post) => (
                <tr key={post._id}>
                  <td className="max-w-[260px]">
                    <p className="truncate font-medium text-foreground">{post.title}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">/{post.slug}</p>
                  </td>
                  <td><Badge tone="neutral">{post.category}</Badge></td>
                  <td>{publishBadge(post.publishedAt)}</td>
                  <td className="whitespace-nowrap text-muted-foreground">{post.author?.name || "—"}</td>
                  <td className="text-right font-mono text-xs">{formatNumber(post.views)}</td>
                  <td className="text-right font-mono text-xs">{formatNumber(post.likes)}</td>
                  <td className="text-right font-mono text-xs">{formatNumber(post.commentsCount)}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {post.featured && <Badge tone="violet">Featured</Badge>}
                      {post.trending && <Badge tone="warning">Trending</Badge>}
                      {post.editorsPick && <Badge tone="success">Editor's pick</Badge>}
                      {!post.featured && !post.trending && !post.editorsPick && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Edit ${post.title}`}
                        title="Edit post"
                        onClick={() => navigate(`/posts/${encodeURIComponent(post._id)}/edit`)}
                      >
                        <PencilLine aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Delete ${post.title}`}
                        title="Delete post"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(post)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={(p) => setPage(p)} />

      {/* Delete confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title ?? ""}"?`}
        footer={
          <>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Keep post
            </Button>
            <Button variant="destructive" loading={deleting} onClick={onConfirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes “{deleteTarget?.title}” from the website immediately and cannot be undone.
          Reader comments are retained but become unreachable unless a new post reuses the slug{" "}
          <span className="font-mono">/{deleteTarget?.slug}</span>.
        </p>
      </Modal>
    </div>
  );
}
