import { useCallback, useState } from "react";
import { Archive, Contact, Eye, Mail, MailOpen, Phone, Search, Trash2 } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useToast } from "../../hooks/useToast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { TableContainer, Table, THead, TBody } from "../../components/ui/Table";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { apiClient } from "../../services/apiClient";
import { formatDateTime } from "../../utils/format";

const STATUS_FILTERS = ["", "new", "read", "replied", "archived"];
const STATUS_TONES = { new: "violet", read: "neutral", replied: "success", archived: "warning" };

export function ContactsView() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [detail, setDetail] = useState(null);

  const statsQuery = useAsync(({ signal }) => apiClient.get("/admin/contacts/stats", { signal }), []);

  const contactsQuery = useAsync(
    ({ signal }) =>
      apiClient.get("/admin/contacts", {
        query: { page, limit: 20, status: statusFilter || undefined, search: search || undefined },
        signal,
      }),
    [page, statusFilter, search]
  );

  const items = contactsQuery.data?.data || [];
  const meta = contactsQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const stats = statsQuery.data?.data || {};

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleStatusChange = useCallback(
    async (id, newStatus) => {
      try {
        await apiClient.patch(`/admin/contacts/${encodeURIComponent(id)}/status`, { status: newStatus });
        toast(`Contact marked as ${newStatus}`, { tone: "success" });
        contactsQuery.retry();
        statsQuery.retry();
      } catch (err) {
        toast(err?.message || "Failed to update status", { tone: "error" });
      }
    },
    [contactsQuery, statsQuery, toast]
  );

  const handleDelete = useCallback(
    async (id, name) => {
      if (!window.confirm(`Delete contact from "${name}"? This cannot be undone.`)) return;
      try {
        await apiClient.del(`/admin/contacts/${encodeURIComponent(id)}`);
        toast("Contact deleted", { tone: "success" });
        contactsQuery.retry();
        statsQuery.retry();
      } catch (err) {
        toast(err?.message || "Failed to delete", { tone: "error" });
      }
    },
    [contactsQuery, statsQuery, toast]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Contact Submissions" subtitle={`${meta.total} total submissions`} icon={Contact} />
        <CardBody className="space-y-4">
          {/* Stats row */}
          {statsQuery.status === "success" && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: "New", value: stats.new, tone: "violet" },
                { label: "Read", value: stats.read, tone: "neutral" },
                { label: "Replied", value: stats.replied, tone: "success" },
                { label: "Archived", value: stats.archived, tone: "warning" },
              ].map((s) => (
                <Badge key={s.label} tone={s.tone}>
                  {s.label}: {s.value ?? 0}
                </Badge>
              ))}
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
                    placeholder="Name, email, or message…"
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
          {contactsQuery.status === "loading" && <LoadingState rows={4} label="Loading contacts…" />}
          {contactsQuery.status === "error" && (
            <ErrorState error={contactsQuery.error} onRetry={contactsQuery.retry} title="Could not load contacts" />
          )}
          {contactsQuery.status === "success" && items.length === 0 && (
            <EmptyState icon={Mail} title="No contacts found" description="No submissions match your filters." />
          )}
          {contactsQuery.status === "success" && items.length > 0 && (
            <TableContainer>
              <Table>
                <THead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Topic</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="w-[220px]">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {items.map((c) => (
                    <tr key={c._id}>
                      <td className="font-medium">{c.name}</td>
                      <td>
                        <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                          {c.email}
                        </a>
                        {c.phone && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.phone}</p>
                        )}
                      </td>
                      <td>
                        <Badge tone="neutral">{c.topic}</Badge>
                      </td>
                      <td className="max-w-[240px]">
                        <button
                          type="button"
                          onClick={() => setDetail(c)}
                          title={c.message}
                          className="block w-full truncate text-left text-muted-foreground hover:text-foreground"
                        >
                          {c.message}
                        </button>
                      </td>
                      <td>
                        <Badge tone={STATUS_TONES[c.status] || "neutral"}>{c.status}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-muted-foreground">
                        {formatDateTime(c.createdAt)}
                      </td>
                      <td className="w-[220px]">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => setDetail(c)}
                            title="View details"
                          >
                            <Eye aria-hidden="true" className="size-4" />
                          </Button>
                          {c.status === "new" && (
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => handleStatusChange(c._id, "read")}
                              title="Mark as read"
                            >
                              <MailOpen aria-hidden="true" className="size-4" />
                            </Button>
                          )}
                          {c.status !== "replied" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(c._id, "replied")}
                              title="Mark as replied"
                            >
                              Reply
                            </Button>
                          )}
                          {c.status !== "archived" && (
                            <Button
                              variant="ghost"
                              size="iconSm"
                              onClick={() => handleStatusChange(c._id, "archived")}
                              title="Archive"
                            >
                              <Archive aria-hidden="true" className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="iconSm"
                            onClick={() => handleDelete(c._id, c.name)}
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

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Contact from ${detail.name}` : "Contact details"}
        className="max-w-xl"
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONES[detail.status] || "neutral"}>{detail.status}</Badge>
              <Badge tone="neutral">{detail.topic}</Badge>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <Contact aria-hidden="true" className="size-4 text-muted-foreground" /> Name
                </p>
                <p className="text-muted-foreground">{detail.name}</p>
              </div>
              <div className="space-y-1.5">
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <Mail aria-hidden="true" className="size-4 text-muted-foreground" /> Email
                </p>
                <a
                  href={`mailto:${detail.email}`}
                  className="break-all text-primary hover:underline"
                >
                  {detail.email}
                </a>
              </div>
              {detail.phone && (
                <div className="space-y-1.5">
                  <p className="inline-flex items-center gap-1.5 font-medium">
                    <Phone aria-hidden="true" className="size-4 text-muted-foreground" /> Phone
                  </p>
                  <a href={`tel:${detail.phone}`} className="text-primary hover:underline">
                    {detail.phone}
                  </a>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Submitted</p>
                <p className="text-muted-foreground">{formatDateTime(detail.createdAt)}</p>
              </div>
              {detail.updatedAt && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Last updated</p>
                  <p className="text-muted-foreground">{formatDateTime(detail.updatedAt)}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-surface/60 p-4 text-sm leading-relaxed text-foreground/90">
                {detail.message}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
