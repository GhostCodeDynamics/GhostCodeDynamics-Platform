import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "../../context/ToastProvider";
import { ProjectsView } from "./ProjectsView";

/**
 * Projects list tests. The reorder service mock returns the real apiClient
 * contract ({ data, meta }) so the response-normalization regression stays
 * covered, and it keeps a local "server" copy that the reorder payload
 * mutates — mirroring what the backend does on PATCH /admin/projects/reorder.
 */

vi.mock("../../services/adminProjectsService", () => ({
  listAdminProjects: vi.fn(),
  createAdminProject: vi.fn(),
  updateAdminProject: vi.fn(),
  deleteAdminProject: vi.fn(),
  reorderAdminProjects: vi.fn(),
}));

import {
  listAdminProjects,
  reorderAdminProjects,
} from "../../services/adminProjectsService";

const seed = () => [
  { _id: "p-a", id: "p-a", name: "Alpha", slug: "alpha", category: "Web app", tech: ["React"], featured: false, order: 0, liveUrl: null, repoUrl: null },
  { _id: "p-b", id: "p-b", name: "Beta", slug: "beta", category: "Mobile", tech: [], featured: true, order: 1, liveUrl: "https://b.dev", repoUrl: "https://github.com/gcd/beta" },
  { _id: "p-c", id: "p-c", name: "Gamma", slug: "gamma", category: "Design", tech: ["Figma"], featured: false, order: 2, liveUrl: null, repoUrl: "https://g.dev" },
];

let serverProjects = [];

beforeEach(() => {
  serverProjects = seed();
  listAdminProjects.mockReset();
  reorderAdminProjects.mockReset();
  listAdminProjects.mockImplementation(() =>
    Promise.resolve({ data: serverProjects, meta: undefined })
  );
  reorderAdminProjects.mockImplementation((items) => {
    const byId = new Map(serverProjects.map((p) => [p._id ?? p.id, p]));
    serverProjects = items.map(({ id }) => byId.get(id)).filter(Boolean);
    return Promise.resolve({ data: { updated: serverProjects.length } });
  });
  installRectSpy();
});

// dnd-kit resolves drop targets through geometric collision, so give each
// sortable <tr> a believable stacked rect inside jsdom.
const rectMap = new Map();
let rectSpy;
function installRectSpy() {
  rectMap.clear();
  rectSpy = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function () {
      const cached = rectMap.get(this);
      if (cached) return cached;
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    });
}
function mockRowRects() {
  rectMap.clear();
  Array.from(document.querySelectorAll("tbody tr[data-project-id]")).forEach((row, i) => {
    rectMap.set(row, {
      x: 0,
      y: i * 52,
      top: i * 52,
      left: 0,
      right: 900,
      bottom: i * 52 + 46,
      width: 900,
      height: 46,
    });
  });
}
afterEach(() => {
  rectSpy?.mockRestore();
});

function renderView() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ProjectsView />
      </ToastProvider>
    </MemoryRouter>
  );
}

/** Display order of the current rows (read from their drag-handle labels). */
function rowNames() {
  return Array.from(document.querySelectorAll("tbody tr[data-project-id]")).map(
    (tr) =>
      tr
        .querySelector('[aria-label^="Drag to reorder"]')
        ?.getAttribute("aria-label")
        ?.replace("Drag to reorder ", "") || ""
  );
}

/**
 * Keyboard reorder: lift with Enter, move with Arrow keys, drop with Enter.
 * dnd-kit attaches the sensor's real keydown listener asynchronously and
 * resolves all drag geometry through DOM rects + (in jsdom) timer/rAF
 * flushes, so every keypress is wrapped in `act` with a macrotask break.
 * Re-querying the activator each step also survives React re-renders.
 */
const flushAsync = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

async function pressKey(handle, { key, code }) {
  fireEvent.keyDown(handle, { key, code });
  await flushAsync();
}

async function keyboardDrag(getHandle, directions) {
  const start = getHandle();
  await pressKey(start, { key: "Enter", code: "Enter" });
  for (const code of directions) {
    await pressKey(getHandle(), { key: code, code });
  }
  await pressKey(getHandle(), { key: "Enter", code: "Enter" });
}

/** Mouse drag on the handle via the pointer sensor (6px activation distance). */
async function pointerDrag(getHandle, from, to) {
  const move = (cp, y) =>
    fireEvent.pointerMove(document, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      isPrimary: true,
      clientX: cp,
      clientY: y,
    });
  fireEvent.pointerDown(getHandle(), {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    isPrimary: true,
    clientX: from.x,
    clientY: from.y,
  });
  await flushAsync();
  move(from.x, from.y - 10);
  await flushAsync();
  move(to.x, to.y);
  await flushAsync();
  fireEvent.pointerUp(document, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    isPrimary: true,
    clientX: to.x,
    clientY: to.y,
  });
  await flushAsync();
}

describe("ProjectsView — rendered project data", () => {
  it("renders all projects returned by the admin endpoint (incl. drafts)", async () => {
    renderView();

    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.getByText(/3 projects · sorted by display order/i)).toBeInTheDocument();
    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
  });

  it("does not render a false empty state for an empty list", async () => {
    serverProjects = [];
    renderView();

    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });
});

describe("ProjectsView — 6-dot drag handle", () => {
  it("renders one 6-dot drag handle per row with an accessible label", async () => {
    renderView();
    await screen.findByText("Alpha");

    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    expect(handles).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Drag to reorder Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drag to reorder Gamma" })).toBeInTheDocument();
  });

  it("does not render the old up/down arrow controls", async () => {
    renderView();
    await screen.findByText("Alpha");

    expect(screen.queryByRole("button", { name: /move .* up/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /move .* down/i })).not.toBeInTheDocument();
  });
});

describe("ProjectsView — drag & drop reordering", () => {
  it("optimistically reorders on drop, sends the full order to the API, and survives refetch", async () => {
    renderView();
    await screen.findByText("Alpha");
    mockRowRects();

    // Move Gamma to the top.
    await keyboardDrag(
      () => screen.getByRole("button", { name: "Drag to reorder Gamma" }),
      ["ArrowUp", "ArrowUp"]
    );

    await waitFor(() => expect(reorderAdminProjects).toHaveBeenCalledTimes(1));
    expect(reorderAdminProjects).toHaveBeenCalledWith([
      { id: "p-c", order: 0 },
      { id: "p-a", order: 1 },
      { id: "p-b", order: 2 },
    ]);

    // Optimistic UI, then the refetch (retry) canonicalizes the same order.
    await waitFor(() => expect(rowNames()).toEqual(["Gamma", "Alpha", "Beta"]));
  });

  it("rolls the UI back to the last server order and toasts when persistence fails", async () => {
    reorderAdminProjects.mockRejectedValue(new Error("Boom"));
    renderView();
    await screen.findByText("Alpha");
    mockRowRects();

    await keyboardDrag(
      () => screen.getByRole("button", { name: "Drag to reorder Gamma" }),
      ["ArrowUp", "ArrowUp"]
    );

    await waitFor(() => expect(reorderAdminProjects).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(rowNames()).toEqual(["Alpha", "Beta", "Gamma"]));
    expect(await screen.findByText(/order unchanged/i)).toBeInTheDocument();
  });

  it("supports pointer (mouse) dragging on the handle", async () => {
    renderView();
    await screen.findByText("Alpha");
    mockRowRects();

    const handle = () => screen.getByRole("button", { name: "Drag to reorder Gamma" });
    const rowHeight = 52;
    await pointerDrag(handle, {
      x: 20,
      y: 2 * rowHeight + 20,
    }, {
      x: 20,
      y: 20,
    });

    await waitFor(() => expect(reorderAdminProjects).toHaveBeenCalledTimes(1));
    expect(reorderAdminProjects).toHaveBeenCalledWith([
      { id: "p-c", order: 0 },
      { id: "p-a", order: 1 },
      { id: "p-b", order: 2 },
    ]);
  });
});

describe("ProjectsView — filter safety", () => {
  it("disables dragging while a search filter is active so the global order cannot be corrupted", async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText("Alpha");

    expect(
      screen.getAllByRole("button", { name: /drag to reorder/i }).every((b) => !b.disabled)
    ).toBe(true);

    await user.type(
      screen.getByLabelText("Filter projects by name, category or tech"),
      "beta"
    );
    expect(await screen.findByText(/1 of 3 shown/i)).toBeInTheDocument();

    const handles = screen.getAllByRole("button", { name: /drag to reorder/i });
    expect(handles).toHaveLength(1);
    expect(handles[0].disabled).toBe(true);
    expect(reorderAdminProjects).not.toHaveBeenCalled();
  });
});

describe("ProjectsView — row actions", () => {
  it("keeps edit and delete actions per row", async () => {
    renderView();
    await screen.findByText("Alpha");

    expect(screen.getByRole("button", { name: "Edit Beta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Gamma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /feature beta/i })).toBeInTheDocument();
  });
});

describe("ProjectsView — compact URL columns", () => {
  it("renders the Live URL and Repository as icon links, not full URL text", async () => {
    renderView();
    await screen.findByText("Beta");

    const live = screen.getByRole("link", { name: "Open live URL for Beta" });
    const repo = screen.getByRole("link", { name: "Open repository for Beta" });

    expect(live).toHaveAttribute("href", "https://b.dev");
    expect(live).toHaveAttribute("target", "_blank");
    expect(live).toHaveAttribute("rel", "noopener noreferrer");

    expect(repo).toHaveAttribute("href", "https://github.com/gcd/beta");
    expect(repo).toHaveAttribute("target", "_blank");
    expect(repo).toHaveAttribute("rel", "noopener noreferrer");

    // URLs must not leak back into the table as visible text.
    expect(screen.queryByText(/https:\/\/b\.dev/)).not.toBeInTheDocument();
    expect(screen.queryByText(/https:\/\/github\.com\/gcd\/beta/)).not.toBeInTheDocument();
  });

  it("shows the full URL in an accessible tooltip on hover/focus", async () => {
    const user = userEvent.setup();
    renderView();
    await screen.findByText("Beta");

    const live = screen.getByRole("link", { name: "Open live URL for Beta" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // Mouse hover surfaces the complete URL.
    await user.hover(live);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("https://b.dev");
    expect(live).toHaveAttribute("aria-describedby", tooltip.id);

    // Keyboard focus also surfaces the tooltip.
    await user.unhover(live);
    const repo = screen.getByRole("link", { name: "Open repository for Beta" });
    await act(async () => {
      repo.focus();
    });
    expect(await screen.findByText("https://github.com/gcd/beta")).toBeInTheDocument();
  });

  it("does not create links for missing URLs", async () => {
    renderView();
    await screen.findByText("Alpha");

    // Alpha has neither a live nor a repository URL.
    expect(screen.queryByRole("link", { name: "Open live URL for Alpha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open repository for Alpha" })).not.toBeInTheDocument();
  });

  it("keeps the six-dot drag handle on every row", async () => {
    renderView();
    await screen.findByText("Alpha");

    expect(screen.getAllByRole("button", { name: /drag to reorder/i })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /move .* up/i })).not.toBeInTheDocument();
  });
});