import { useCallback, useState } from "react";
import { Mail, Search, Trash2, UserMinus } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../hooks/useToast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { TableContainer, Table, THead, TBody } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { apiClient } from "../../services/apiClient";
import { formatDateTime } from "../../utils/format";

const STATUS_FILTERS = ["", "active", "unsubscribed"];

export function NewsletterView() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const statsQuery = useAsync(({ signal }) => apiClient.get("/admin/newsletter/stats", { signal }), []);

  const subscribersQuery = useAsync(
    ({ signal }) =>
      apiClient.get("/admin/newsletter", {
        query: { page, limit: 20, status: statusFilter || undefined, search: search || undefined },
        signal,
      }),
    [page, statusFilter, search]
  );

  const items = subscribersQuery.data?.data || [];
  const meta = subscribersQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const stats = statsQuery.data?.data || {};

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleUnsubscribe = useCallback(
    async (id, email) => {
      if (!window.confirm(`Unsubscribe "${email}"?`)) return;
      try {
        await apiClient.patch(`/admin/newsletter/${encodeURIComponent(id)}/unsubscribe`);
        toast(`${email} unsubscribed`, { tone: "success" });
        subscribersQuery.retry();
        statsQuery.retry();
      } catch (err) {
        toast(err?.message || "Failed to unsubscribe", { tone: "error" });
      }
    },
    [subscribersQuery, statsQuery, toast]
  );

  const handleDelete = useCallback(
    async (id, email) => {
      if (!window.confirm(`Permanently delete subscriber "${email}"? This cannot be undone.`)) return;
      try {
        await apiClient.del(`/admin/newsletter/${encodeURIComponent(id)}`);
        toast("Subscriber deleted", { tone: "success" });
        subscribersQuery.retry();
        statsQuery.retry();
      } catch (err) {
        toast(err?.message || "Failed to delete", { tone: "error" });
      }
    },
    [subscribersQuery, statsQuery, toast]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Newsletter Subscribers" subtitle={`${meta.total} subscribers`} icon={Mail} />
        <CardBody className="space-y-4">
          {/* Stats row */}
          {statsQuery.status === "success" && (
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Active: {stats.active ?? 0}</Badge>
              <Badge tone="warning">Unsubscribed: {stats.unsubscribed ?? 0}</Badge>
              <Badge tone="neutral">Total: {stats.total ?? 0}</Badge>
            </div>
          )}

          {/* Search + filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <form onSubmit={handleSearch} className="flex-1">
              <label className="text-sm font-medium">
                Search
                <div className="relative mt-1.5">
                  <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by email…"
                    className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </label>
            </form>
            <label className="text-sm font-medium">
              Status
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                aria-label="Filter by status"
                className="mt-1.5 h-11 appearance-none rounded-lg border border-input bg-surface px-3 pr-9 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>{s || "All statuses"}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Table */}
          {subscribersQuery.status === "loading" && <LoadingState rows={4} label="Loading subscribers…" />}
          {subscribersQuery.status === "error" && (
            <ErrorState error={subscribersQuery.error} onRetry={subscribersQuery.retry} title="Could not load subscribers" />
          )}
          {subscribersQuery.status === "success" && items.length === 0 && (
            <EmptyState icon={Mail} title="No subscribers found" description="No subscribers match your filters." />
          )}
          {subscribersQuery.status === "success" && items.length > 0 && (
            <TableContainer>
              <Table>
                <THead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Subscribed</th>
                    <th>Unsubscribed</th>
                    <th className="w-[120px]">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {items.map((s) => (
                    <tr key={s._id}>
                      <td className="font-medium">
                        <a href={`mailto:${s.email}`} className="text-primary hover:underline">
                          {s.email}
                        </a>
                      </td>
                      <td>
                        <Badge tone={s.status === "active" ? "success" : "warning"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(s.createdAt)}
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {s.unsubscribedAt ? formatDateTime(s.unsubscribedAt) : "—"}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          {s.status === "active" && (
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => handleUnsubscribe(s._id, s.email)}
                              title="Unsubscribe"
                            >
                              <UserMinus aria-hidden="true" className="size-4 text-amber-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => handleDelete(s._id, s.email)}
                            title="Delete"
                          >
                            <Trash2 aria-hidden="true" className="size-4 text-destructive" />
                          </Button>
                        </div>
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
    </div>
  );
}
