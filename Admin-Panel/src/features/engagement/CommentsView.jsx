import { useCallback, useMemo, useState } from "react";
import { MessageSquare, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../hooks/useToast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { TableContainer, Table, THead, TBody } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { apiClient } from "../../services/apiClient";
import { listPosts, listPostComments } from "../../services/postsService";
import { formatDateTime } from "../../utils/format";

function CommentItem({ comment, depth = 0 }) {
  return (
    <li className={depth > 0 ? "ml-6 border-l border-border/60 pl-4" : ""}>
      <div className="rounded-lg border border-border/50 bg-surface/60 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{comment.author}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {formatDateTime(comment.createdAt)}
          </p>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {comment.body}
        </p>
        <p className="mt-2 label-mono">{comment.likes ?? 0} likes</p>
      </div>
      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <ul className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id || reply._id} comment={reply} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function threadComments(flat) {
  const byId = new Map();
  const roots = [];
  for (const c of flat) {
    byId.set(c._id || c.id, { ...c, replies: [] });
  }
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId).replies.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

function PostCommentBrowser() {
  const [activeSlug, setActiveSlug] = useState("");

  const postsQuery = useAsync(
    ({ signal }) => listPosts({ page: 1, limit: 50, signal }),
    []
  );
  const commentsQuery = useAsync(
    ({ signal }) => listPostComments(activeSlug, { signal }),
    [activeSlug],
    { enabled: Boolean(activeSlug) }
  );

  const postOptions = useMemo(() => {
    const items = Array.isArray(postsQuery.data) ? postsQuery.data : [];
    return items.map((p) => ({ slug: p.slug, title: p.title }));
  }, [postsQuery.data]);

  const threads = useMemo(() => {
    const flat = Array.isArray(commentsQuery.data) ? commentsQuery.data : [];
    return threadComments(flat);
  }, [commentsQuery.data]);

  const totalFlat = Array.isArray(commentsQuery.data) ? commentsQuery.data.length : 0;

  return (
    <Card>
      <CardHeader
        title="Browse comments by post"
        subtitle="Threaded view for per-post discussions"
        icon={MessageSquare}
      />
      <CardBody className="space-y-4">
        <label className="text-sm font-medium">
          Post
          <select
            value={activeSlug}
            onChange={(e) => setActiveSlug(e.target.value)}
            aria-label="Select a post to view its comments"
            className="mt-1.5 h-11 w-full appearance-none rounded-lg border border-input bg-surface px-3 pr-9 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Select a published post…</option>
            {postOptions.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </label>

        {postsQuery.status === "loading" && <LoadingState rows={2} label="Loading posts…" />}
        {postsQuery.status === "error" && (
          <ErrorState error={postsQuery.error} onRetry={postsQuery.retry} title="Could not load the post list" />
        )}

        {activeSlug && commentsQuery.status === "loading" && <LoadingState rows={3} label="Loading comments…" />}
        {activeSlug && commentsQuery.status === "error" && (
          <ErrorState error={commentsQuery.error} onRetry={commentsQuery.retry} title="Could not load comments" />
        )}
        {activeSlug && commentsQuery.status === "success" && (
          <>
            <p className="label-mono">
              {totalFlat} comment{totalFlat === 1 ? "" : "s"} on /{activeSlug}
            </p>
            {threads.length === 0 ? (
              <EmptyState icon={Search} title="No comments yet" description="This post has not received any comments." className="border-0 py-6" />
            ) : (
              <ul className="space-y-2">{threads.map((c) => <CommentItem key={c._id || c.id} comment={c} />)}</ul>
            )}
          </>
        )}
        {!activeSlug && postsQuery.status === "success" && (
          <EmptyState icon={MessageSquare} title="Pick a post to inspect its discussion" className="border-0 py-6" />
        )}
      </CardBody>
    </Card>
  );
}

function GlobalCommentQueue() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postSlugInput, setPostSlugInput] = useState("");

  const statsQuery = useAsync(({ signal }) => apiClient.get("/admin/comments/stats", { signal }), []);

  const commentsQuery = useAsync(
    ({ signal }) =>
      apiClient.get("/admin/comments", {
        query: { page, limit: 20, postSlug: postSlug || undefined, search: search || undefined },
        signal,
      }),
    [page, search, postSlug]
  );

  const items = commentsQuery.data?.data || [];
  const meta = commentsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const stats = statsQuery.data?.data || {};

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setPostSlug(postSlugInput.trim());
  }, [searchInput, postSlugInput]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this comment? This cannot be undone.")) return;
      try {
        await apiClient.del(`/admin/comments/${encodeURIComponent(id)}`);
        toast("Comment deleted", { tone: "success" });
        commentsQuery.retry();
        statsQuery.retry();
      } catch (err) {
        toast(err?.message || "Failed to delete comment", { tone: "error" });
      }
    },
    [commentsQuery, statsQuery, toast]
  );

  return (
    <Card>
      <CardHeader
        title="Global comment queue"
        subtitle="All comments across every post — delete spam or rule-breaking content"
        icon={ShieldAlert}
        actions={
          statsQuery.status === "success" ? (
            <div className="flex gap-2">
              <Badge tone="neutral">{stats.totalComments ?? 0} comments</Badge>
              <Badge tone="violet">{stats.postsWithComments ?? 0} posts</Badge>
            </div>
          ) : null
        }
      />
      <CardBody className="space-y-4">
        <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Search comments
            <div className="relative mt-1.5">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by author or content…"
                className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </label>
          <label className="text-sm font-medium">
            Post slug
            <input
              type="text"
              value={postSlugInput}
              onChange={(e) => setPostSlugInput(e.target.value)}
              placeholder="Filter to one post, e.g. an-intro-to-…"
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-surface px-3 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </form>

        {(postSlug || search) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Filtering by</span>
            {postSlug && (
              <button
                type="button"
                onClick={() => { setPostSlug(""); setPostSlugInput(""); setPage(1); }}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-primary"
              >
                /{postSlug} <span aria-hidden>×</span>
              </button>
            )}
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-primary"
              >
                “{search}” <span aria-hidden>×</span>
              </button>
            )}
          </div>
        )}

        {commentsQuery.status === "loading" && <LoadingState rows={4} label="Loading comments…" />}
        {commentsQuery.status === "error" && (
          <ErrorState error={commentsQuery.error} onRetry={commentsQuery.retry} title="Could not load comments" />
        )}
        {commentsQuery.status === "success" && items.length === 0 && (
          <EmptyState icon={MessageSquare} title="No comments found" description="No comments match your search." />
        )}
        {commentsQuery.status === "success" && items.length > 0 && (
          <TableContainer>
            <Table>
              <THead>
                <tr>
                  <th>Author</th>
                  <th>Comment</th>
                  <th>Post</th>
                  <th>Likes</th>
                  <th>Date</th>
                  <th className="w-[60px]">Actions</th>
                </tr>
              </THead>
              <TBody>
                {items.map((c) => (
                  <tr key={c._id}>
                    <td className="font-medium">{c.author}</td>
                    <td className="max-w-[320px] truncate text-muted-foreground" title={c.body}>
                      {c.body}
                    </td>
                    <td>
                      <Badge tone="neutral">{c.postSlug}</Badge>
                    </td>
                    <td>{c.likes ?? 0}</td>
                    <td className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(c.createdAt)}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => handleDelete(c._id)}
                        title="Delete comment"
                      >
                        <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </TableContainer>
        )}

        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
      </CardBody>
    </Card>
  );
}

export function CommentsView() {
  return (
    <div className="space-y-4">
      <GlobalCommentQueue />
      <PostCommentBrowser />
    </div>
  );
}
