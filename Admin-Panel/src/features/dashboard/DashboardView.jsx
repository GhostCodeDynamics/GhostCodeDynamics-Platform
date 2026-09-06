import { Activity, Award, FileText, Flame, FolderKanban, Inbox, Mail, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { useAsync } from "../../hooks/useAsync";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { Table, TableContainer, TBody, THead } from "../../components/ui/Table";
import {
  getEditorsPicks,
  getFeaturedPost,
  getTrendingPosts,
  listPosts,
} from "../../services/postsService";
import { listProjects } from "../../services/projectsService";
import { getHealth } from "../../services/healthService";
import {
  getCommentStats,
} from "../../services/adminCommentsService";
import {
  getContactStats,
} from "../../services/adminContactsService";
import {
  getSubscriberStats,
} from "../../services/adminNewsletterService";
import { formatDate, formatNumber } from "../../utils/format";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card interactive>
      <CardBody className="flex items-start gap-3.5 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1.5 truncate label-mono">{label}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

function EngagementCard({ icon: Icon, label, value, sub, to, status, onRetry }) {
  const failed = status === "error";
  const loading = status === "loading" || status === "idle";
  return (
    <Link
      to={to}
      className="group block"
      aria-label={`${label} — manage`}
      onClick={failed ? (e) => e.preventDefault() : undefined}
    >
      <Card interactive>
        <CardBody className="flex items-start gap-3.5 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-semibold leading-none tracking-tight text-foreground">
              {loading || failed ? "—" : formatNumber(value ?? 0)}
            </p>
            <p className="mt-1.5 truncate label-mono">{label}</p>
            {failed ? (
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">Couldn't reach endpoint</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRetry?.(); }}
                  className="shrink-0 rounded-md border border-border px-2 py-0.5 text-xs transition-colors hover:bg-accent hover:text-foreground"
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">Loading…</p>
            ) : (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

/**
 * Loads every dashboard input in parallel. Section endpoints that fail
 * individually degrade to their own empty/error states; a failing posts
 * list only isolates the "Recent posts" card instead of killing the page.
 */
async function loadDashboard({ signal }) {
  const [postsRes, featuredRes, trendingRes, picksRes, projectsRes, healthRes] =
    await Promise.all([
      listPosts({ page: 1, limit: 5 }).catch(() => ({ failed: true, data: [], meta: { total: 0 } })),
      getFeaturedPost().catch(() => ({ data: null })),
      getTrendingPosts().catch(() => ({ data: [] })),
      getEditorsPicks().catch(() => ({ data: [] })),
      listProjects().catch(() => ({ data: [] })),
      getHealth(signal).catch(() => null),
    ]);

  const postsOk = Array.isArray(postsRes.data) && !postsRes.failed;

  return {
    posts: postsOk ? postsRes.data : [],
    postsFailed: !postsOk,
    totalPosts: postsOk ? (postsRes.meta?.total ?? postsRes.data.length) : 0,
    featured: featuredRes.data || null,
    trending: Array.isArray(trendingRes.data) ? trendingRes.data : [],
    editorsPicks: Array.isArray(picksRes.data) ? picksRes.data : [],
    projectsFailed: !Array.isArray(projectsRes.data),
    projects: Array.isArray(projectsRes.data) ? projectsRes.data : [],
    health: healthRes && typeof healthRes === "object" ? healthRes : null,
  };
}

export function DashboardView() {
  const { status, data, error, retry } = useAsync(loadDashboard);
  const commentStats = useAsync(({ signal }) => getCommentStats(signal), []);
  const contactStats = useAsync(({ signal }) => getContactStats(signal), []);
  const newsletterStats = useAsync(({ signal }) => getSubscriberStats(signal), []);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardBody className="p-4"><LoadingState rows={1} /></CardBody></Card>
          ))}
        </div>
        <Card><CardBody><LoadingState rows={4} /></CardBody></Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        error={error}
        onRetry={retry}
        title="Dashboard failed to load"
        description={undefined}
      />
    );
  }

  if (!data) return null;

  const hasPosts = data.posts.length > 0;
  const hasProjects = data.projects.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section aria-label="Key figures" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total published posts"
          value={formatNumber(data.totalPosts)}
        />
        <StatCard
          icon={Flame}
          label="Trending posts"
          value={formatNumber(data.trending.length)}
          sub={data.trending.length >= 4 ? "endpoint returns up to 4" : undefined}
        />
        <StatCard
          icon={Award}
          label="Editor's picks"
          value={formatNumber(data.editorsPicks.length)}
          sub={data.editorsPicks.length >= 3 ? "endpoint returns up to 3" : undefined}
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={formatNumber(data.projects.length)}
        />
      </section>

      {/* Featured spotlight + API status */}
      <section aria-label="Highlights" className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Featured spotlight"
            subtitle="Latest post flagged as featured"
            icon={Flame}
          />
          <CardBody>
            {data.featured ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/posts?search=${encodeURIComponent(data.featured.slug)}`}
                    className="truncate font-display text-base font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {data.featured.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.featured.category} · {formatDate(data.featured.publishedAt)} ·{" "}
                    {formatNumber(data.featured.views)} views
                  </p>
                </div>
                <Badge tone="violet">Featured</Badge>
              </div>
            ) : (
              <EmptyState
                title="No featured post"
                description="No published post is currently flagged as featured."
                className="border-0 py-6"
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="API status" subtitle="GET /api/health" icon={Activity} />
          <CardBody>
            {data.health ? (
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge tone={data.health.status === "ok" ? "success" : "warning"}>
                      {data.health.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Uptime</dt>
                  <dd className="font-mono text-xs">{Math.floor(data.health.uptime / 60)}m {Math.floor(data.health.uptime % 60)}s</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Service</dt>
                  <dd className="max-w-[55%] truncate font-mono text-xs">{data.health.service}</dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                title="Health check unavailable"
                description="The API health endpoint could not be reached."
                className="border-0 py-4"
              />
            )}
          </CardBody>
        </Card>
      </section>

      {/* Recent posts */}
      <Card>
        <CardHeader
          title="Recent posts"
          subtitle="Five most recently published"
          icon={FileText}
          actions={
            <Link to="/posts" className="label-mono transition-colors hover:text-primary">
              View all →
            </Link>
          }
        />
        <CardBody className="px-0 pb-1 pt-0">
          {data.postsFailed ? (
            <div className="px-4">
              <EmptyState
                title="Recent posts unavailable"
                description="The posts endpoint could not be reached during this load."
                className="border-0 py-8"
              />
              <div className="pb-2 text-center">
                <button
                  type="button"
                  onClick={retry}
                  className="text-sm text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : hasPosts ? (
            <TableContainer>
              <Table className="min-w-[560px]">
                <THead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Category</th>
                    <th scope="col">Author</th>
                    <th scope="col">Published</th>
                    <th scope="col" className="!text-right">Views</th>
                  </tr>
                </THead>
                <TBody>
                  {data.posts.map((post) => (
                    <tr key={post.slug}>
                      <td className="max-w-[280px] truncate font-medium">{post.title}</td>
                      <td><Badge tone="neutral">{post.category}</Badge></td>
                      <td className="text-muted-foreground">{post.author?.name || "—"}</td>
                      <td className="whitespace-nowrap text-muted-foreground">{formatDate(post.publishedAt)}</td>
                      <td className="text-right font-mono text-xs">{formatNumber(post.views)}</td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          ) : (
            <div className="px-4">
              <EmptyState
                title="No posts yet"
                description="Published posts will appear here once content exists."
                className="border-0 py-8"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Engagement modules — live stats from the admin API */}
      <section aria-label="Engagement" className="grid gap-4 md:grid-cols-3">
        <EngagementCard
          icon={MessageSquare}
          label="Comments"
          value={commentStats.data?.data?.totalComments}
          sub={`${commentStats.data?.data?.postsWithComments ?? 0} posts with comments`}
          to="/comments"
          status={commentStats.status}
          onRetry={commentStats.retry}
        />
        <EngagementCard
          icon={Mail}
          label="Contacts"
          value={contactStats.data?.data?.total}
          sub={`${contactStats.data?.data?.new ?? 0} new submissions`}
          to="/contacts"
          status={contactStats.status}
          onRetry={contactStats.retry}
        />
        <EngagementCard
          icon={Inbox}
          label="Newsletter"
          value={newsletterStats.data?.data?.active}
          sub={`${newsletterStats.data?.data?.total ?? 0} subscribers`}
          to="/newsletter"
          status={newsletterStats.status}
          onRetry={newsletterStats.retry}
        />
      </section>

      {/* Recent projects */}
      <Card>
        <CardHeader
          title="Recent projects"
          subtitle="Ordered portfolio entries"
          icon={FolderKanban}
          actions={
            <Link to="/projects" className="label-mono transition-colors hover:text-primary">
              View all →
            </Link>
          }
        />
        <CardBody className="space-y-2.5">
          {hasProjects ? (
            data.projects.slice(0, 5).map((project) => (
              <div
                key={project.slug || project.id || project.name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{project.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {Array.isArray(project.tech) && project.tech.slice(0, 3).map((t) => (
                    <Badge key={t} tone="neutral">{t}</Badge>
                  ))}
                  <span className="label-mono">#{project.order ?? 0}</span>
                </div>
              </div>
            ))
          ) : (
              <EmptyState
                title={data.projectsFailed ? "Projects unavailable" : "No projects yet"}
                description={
                  data.projectsFailed
                    ? "The projects endpoint could not be reached during this load."
                    : "Portfolio entries will appear here once content exists."
                }
                className="border-0 py-6"
              />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
