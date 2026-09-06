import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ExternalLink,
  FolderKanban,
  Github,
  GripVertical,
  PencilLine,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Tooltip } from "../../components/ui/Tooltip";
import { useAsync } from "../../hooks/useAsync";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { Table, TableContainer, TBody, THead } from "../../components/ui/Table";
import { useToast } from "../../hooks/useToast";
import { apiErrorMessage } from "../../services/apiClient";
import { cn } from "../../utils/cn";
import {
  deleteAdminProject,
  listAdminProjects,
  reorderAdminProjects,
  updateAdminProject,
} from "../../services/adminProjectsService";

/**
 * Compact external-link / repository cell. Renders ONLY an icon (never the
 * full URL text) so the table stays narrow. The real URL lives in a tooltip
 * on hover/focus and is preserved exactly as stored in the href.
 *
 * - With a URL: a semantic <a>, icon-only, with a meaningful aria-label, an
 *   accessible description (aria-describedby) on hover/focus, and opens in a
 *   new tab with the standard security rel.
 * - Without a URL: a muted, non-interactive "—" (not a broken/focusable link).
 */
function ExternalLinkCell({
  url,
  projectName,
  icon: Icon,
  hrefLabel,
}) {
  const validUrl =
    typeof url === "string" && url.trim().length > 0 ? url.trim() : "";
  const ariaLabel = hrefLabel(projectName);

  if (!validUrl) {
    return (
      <span className="inline-grid size-8 cursor-default place-items-center text-muted-foreground/40">
        <span aria-hidden="true" className="text-xs">—</span>
      </span>
    );
  }

  return (
    <Tooltip
      label={validUrl}
      trigger={({ "aria-describedby": describedBy }) => (
        <a
          href={validUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          className="inline-grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Icon aria-hidden="true" className="size-4" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    />
  );
}

const sortIdOf = (project) => project._id ?? project.id;

/**
 * A single portfolio row. The whole `tr` is registered as a dnd-kit sortable
 * item, but only the 6-dot handle starts a drag (Mouse / Touch / Keyboard via
 * dnd-kit sensors). The row dims while it is being lifted so the floating
 * DragOverlay copy stays legible.
 */
function SortableProjectRow({
  project,
  dragEnabled,
  filterActive,
  togglingId,
  onToggleFeatured,
  onEdit,
  onRequestDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    isDragging,
  } = useSortable({ id: sortIdOf(project), disabled: !dragEnabled });
  const id = sortIdOf(project);

  return (
    <tr
      ref={setNodeRef}
      data-project-id={id}
      className={cn(isDragging && "opacity-40")}
    >
      {/* 6-dot drag handle — sole drag target for the row */}
      <td className="w-10 align-middle">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          disabled={!dragEnabled}
          aria-label={`Drag to reorder ${project.name}`}
          title={filterActive ? "Clear the filter to reorder" : "Drag to reorder"}
          className={cn(
            "grid size-8 cursor-grab place-items-center rounded-md text-muted-foreground/70 transition-colors",
            "hover:bg-accent/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing",
            isDragging && "cursor-grabbing bg-accent/60 text-foreground",
            !dragEnabled &&
              "cursor-default opacity-35 hover:bg-transparent hover:text-muted-foreground/70"
          )}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      </td>
      <td className="max-w-[200px]">
        <p className="truncate font-medium">{project.name}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">/{project.slug}</p>
      </td>
      <td><Badge tone="neutral">{project.category}</Badge></td>
      <td>
        <div className="flex max-w-[240px] flex-wrap gap-1">
          {(Array.isArray(project.tech) && project.tech.length > 0
            ? project.tech
            : ["—"]
          ).slice(0, 4).map((t) =>
            t === "—" ? (
              <span key="none" className="text-xs text-muted-foreground">—</span>
            ) : (
              <Badge key={t} tone="violet">{t}</Badge>
            )
          )}
          {Array.isArray(project.tech) && project.tech.length > 4 && (
            <Badge tone="neutral">+{project.tech.length - 4}</Badge>
          )}
        </div>
      </td>
      <td className="text-right font-mono text-xs">#{project.order ?? 0}</td>
      <td>
        <button
          type="button"
          disabled={togglingId === id}
          onClick={() => onToggleFeatured(project)}
          title={project.featured ? "Remove from featured" : "Mark as featured"}
          aria-label={project.featured ? `Unfeature ${project.name}` : `Feature ${project.name}`}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
            project.featured
              ? "bg-success/10 text-success hover:bg-success/20"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          }`}
        >
          <Star aria-hidden="true" className={`size-3.5 ${project.featured ? "fill-current" : ""}`} />
          {project.featured ? "Featured" : "—"}
        </button>
      </td>
      <td><ExternalLinkCell url={project.liveUrl} projectName={project.name} icon={ExternalLink} hrefLabel={(n) => `Open live URL for ${n}`} /></td>
      <td><ExternalLinkCell url={project.repoUrl} projectName={project.name} icon={Github} hrefLabel={(n) => `Open repository for ${n}`} /></td>
      <td>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="iconSm"
            aria-label={`Edit ${project.name}`}
            title="Edit project"
            onClick={() => onEdit(project)}
          >
            <PencilLine aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            aria-label={`Delete ${project.name}`}
            title="Delete project"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onRequestDelete(project)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

/** Floating copy shown while a row is dragged (elevated, no layout shift). */
function DragOverlayRow({ project }) {
  const id = sortIdOf(project);
  return (
    <div
      data-project-id={id}
      className="flex min-w-[900px] items-center gap-4 rounded-md border border-border bg-card px-4 py-3 shadow-elevated ring-1 ring-ring/30"
    >
      <GripVertical aria-hidden="true" className="size-4 text-muted-foreground/70" />
      <div className="w-[200px] min-w-0">
        <p className="truncate font-medium">{project.name}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">/{project.slug}</p>
      </div>
      <Badge tone="neutral">{project.category}</Badge>
      <div className="flex flex-wrap gap-1">
        {(Array.isArray(project.tech) ? project.tech : []).slice(0, 3).map((t) => (
          <Badge key={t} tone="violet">{t}</Badge>
        ))}
      </div>
      <span className="font-mono text-xs text-muted-foreground">#{project.order ?? 0}</span>
      {project.featured && (
        <Star aria-hidden="true" className="size-3.5 fill-current text-success" />
      )}
      <ExternalLinkCell url={project.liveUrl} projectName={project.name} icon={ExternalLink} hrefLabel={(n) => `Open live URL for ${n}`} />
      <ExternalLinkCell url={project.repoUrl} projectName={project.name} icon={Github} hrefLabel={(n) => `Open repository for ${n}`} />
    </div>
  );
}

/**
 * Portfolio manager backed by the authenticated /api/admin/projects
 * namespace. Supports create/edit/delete, a featured quick-toggle and
 * drag & drop reordering: rows reorder optimistically while you drag the
 * 6-dot handle, and the full ordering is PATCHed to the existing reorder
 * endpoint on drop (rolled back + toasted on failure).
 */
export function ProjectsView() {
  const navigate = useNavigate();
  // listAdminProjects resolves with apiClient's { data, meta } envelope;
  // unwrap .data so the view works on the projects array itself.
  const { status, data, error, retry } = useAsync(
    ({ signal }) => listAdminProjects({ signal }).then(({ data }) => data),
  );
  const { toast } = useToast();

  // Client-side filter over the already-loaded list (the endpoint returns
  // every project; labelled as client-side to be honest about scope).
  const [filterText, setFilterText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [persisting, setPersisting] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);

  const allProjects = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filterActive = Boolean(filterText.trim());

  const projects = useMemo(() => {
    const needle = filterText.trim().toLowerCase();
    if (!needle) return allProjects;
    return allProjects.filter((p) =>
      [p.name, p.category, p.slug, ...(Array.isArray(p.tech) ? p.tech : [])]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [allProjects, filterText]);

  // --- Sortable display order ------------------------------------------
  // `ordered` mirrors the server list (resynced on every refetch) and is
  // optimistically re-arranged while a row is dragged. On drop the complete
  // ordering is persisted through the existing reorder endpoint; a failure
  // rolls the UI back to the last server-confirmed order. Persistence is
  // serialized so drops can never race each other with conflicting orders.
  const [ordered, setOrdered] = useState([]);
  const orderedRef = useRef([]);
  const isDraggingRef = useRef(false);
  const persistChainRef = useRef(Promise.resolve());

  useEffect(() => {
    if (isDraggingRef.current) return; // never clobber an in-flight drag
    orderedRef.current = allProjects;
    setOrdered(allProjects);
  }, [allProjects]);

  const dragEnabled = status === "success" && !filterActive && !persisting;
  const sortIds = useMemo(
    () => (dragEnabled ? ordered.map(sortIdOf) : []),
    [dragEnabled, ordered]
  );
  // While a filter is active we show the filtered subset (unsorted, no drag)
  // so a drag can never reorder only a filtered slice and corrupt the
  // global display order.
  const displayProjects = filterActive ? projects : ordered;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findIndex = useCallback(
    (items, id) => items.findIndex((p) => sortIdOf(p) === id),
    []
  );

  const handleDragStart = useCallback((event) => {
    isDraggingRef.current = true;
    setActiveDrag(event.active.id);
  }, []);

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || over.id === active.id) return;
      const items = orderedRef.current;
      const from = findIndex(items, active.id);
      const to = findIndex(items, over.id);
      if (from === -1 || to === -1 || from === to) return;
      const next = arrayMove(items, from, to);
      orderedRef.current = next;
      setOrdered(next);
    },
    [findIndex]
  );

  const handleDragCancel = useCallback(() => {
    isDraggingRef.current = false;
    setActiveDrag(null);
  }, []);

  // Serialize reorder writes (single-flight chain) so two drops can never
  // issue overlapping PATCH /admin/projects/reorder calls.
  const enqueueReorder = useCallback((items) => {
    const request = persistChainRef.current.then(() => reorderAdminProjects(items));
    persistChainRef.current = request.catch(() => {});
    return request;
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      isDraggingRef.current = false;
      setActiveDrag(null);
      if (!over || over.id === active.id) return;

      const next = orderedRef.current;
      const items = next.map((p, i) => ({ id: sortIdOf(p), order: i }));
      const previous = allProjects; // last server-confirmed order (rollback target)

      setPersisting(true);
      enqueueReorder(items)
        .then(() => {
          setPersisting(false);
          retry();
        })
        .catch((err) => {
          setPersisting(false);
          orderedRef.current = previous;
          setOrdered(previous);
          toast(`${apiErrorMessage(err)} — order unchanged.`, { tone: "error" });
        });
    },
    [allProjects, enqueueReorder, retry, toast]
  );

  const activeProject =
    activeDrag != null ? ordered.find((p) => sortIdOf(p) === activeDrag) : null;

  const onToggleFeatured = async (project) => {
    const id = sortIdOf(project);
    setTogglingId(id);
    try {
      await updateAdminProject(id, { featured: !project.featured });
      toast(
        project.featured
          ? `Removed "${project.name}" from featured.`
          : `"${project.name}" is now featured.`,
        { tone: "success" }
      );
      retry();
    } catch (err) {
      toast(apiErrorMessage(err), { tone: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminProject(sortIdOf(deleteTarget));
      toast(`Deleted "${deleteTarget.name}".`, { tone: "success" });
      setDeleteTarget(null);
      retry();
    } catch (err) {
      setDeleteTarget(null);
      toast(apiErrorMessage(err), { tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="glass flex flex-wrap items-end justify-between gap-3 rounded-xl p-4">
        <div className="w-full max-w-xs">
          <Input
            type="search"
            label="Filter loaded projects"
            aria-label="Filter projects by name, category or tech"
            placeholder="Name, category, tech…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {status === "success" && (
            <p className="label-mono">
              {filterActive
                ? `${projects.length} of ${allProjects.length} shown · client-side filter`
                : persisting
                  ? "Saving order…"
                  : `${allProjects.length} project${allProjects.length === 1 ? "" : "s"} · sorted by display order`}
            </p>
          )}
          <Button size="sm" onClick={() => navigate("/projects/new")}>
            <Plus aria-hidden="true" className="size-4" /> New project
          </Button>
        </div>
      </div>

      {status === "loading" ? (
        <LoadingState rows={6} />
      ) : status === "error" ? (
        <ErrorState error={error} onRetry={retry} title="Could not load projects" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={filterActive ? "No projects match this filter" : "No projects yet"}
          description={
            filterActive
              ? "Try a different search term."
              : "Create your first portfolio entry — it stays private until you give it a publish date."
          }
          action={
            !filterActive ? (
              <Button onClick={() => navigate("/projects/new")}>
                <Plus aria-hidden="true" className="size-4" /> New project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sortIds} strategy={verticalListSortingStrategy}>
            <TableContainer className="rounded-xl border border-border bg-card">
              <Table className="min-w-[900px]">
                <THead>
                  <tr>
                    <th scope="col" className="w-10"><span className="sr-only">Reorder</span></th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Tech</th>
                    <th scope="col" className="!text-right">Order</th>
                    <th scope="col">Featured</th>
                    <th scope="col">Live URL</th>
                    <th scope="col">Repository</th>
                    <th scope="col" className="!text-right">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {displayProjects.map((project) => (
                    <SortableProjectRow
                      key={`${project.slug}-${sortIdOf(project)}`}
                      project={project}
                      dragEnabled={dragEnabled}
                      filterActive={filterActive}
                      togglingId={togglingId}
                      onToggleFeatured={onToggleFeatured}
                      onEdit={(p) =>
                        navigate(`/projects/${encodeURIComponent(sortIdOf(p))}/edit`)}
                      onRequestDelete={setDeleteTarget}
                    />
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeProject ? <DragOverlayRow project={activeProject} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Delete confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        footer={
          <>
            <Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Keep project
            </Button>
            <Button variant="destructive" loading={deleting} onClick={onConfirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          This removes “{deleteTarget?.name}” from the website immediately and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
