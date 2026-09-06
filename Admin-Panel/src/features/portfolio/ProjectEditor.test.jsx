import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ToastProvider } from "../../context/ToastProvider";
import { ProjectEditor } from "./ProjectEditor";

/**
 * Regression tests for the false "unsaved changes" prompt after a successful
 * save. The editor must reset its saved baseline AND disarm the navigation /
 * beforeunload guard in the same tick a create/update succeeds, so leaving the
 * editor afterwards never asks to discard changes — while the guard keeps
 * protecting genuinely dirty forms.
 */

vi.mock("../../services/adminProjectsService", () => ({
  createAdminProject: vi.fn(),
  getAdminProject: vi.fn(),
  updateAdminProject: vi.fn(),
  deleteAdminProject: vi.fn(),
}));

vi.mock("../../services/adminUploadService", () => ({
  uploadAdminImage: vi.fn(),
}));

import {
  createAdminProject,
  getAdminProject,
  updateAdminProject,
  deleteAdminProject,
} from "../../services/adminProjectsService";
import { uploadAdminImage } from "../../services/adminUploadService";

const sampleProject = {
  _id: "p-1",
  name: "Nova",
  slug: "nova",
  category: "Web",
  image: "https://res.cloudinary.com/demo/projects/nova.jpg",
  imagePublicId: "projects/nova",
  problem: "Users could not find work.",
  solution: "A focused case-study layout.",
  tech: ["React", "Node"],
  liveUrl: "",
  repoUrl: "https://github.com/demo/nova",
  order: 2,
  publishedAt: null,
  featured: false,
};

let router;
let confirmSpy;

function renderEditor(initialPath) {
  router = createMemoryRouter(
    [
      { path: "/projects/new", element: <ProjectEditor /> },
      { path: "/projects/:id/edit", element: <ProjectEditor /> },
      { path: "/projects", element: <div>Projects list page</div> },
    ],
    { initialEntries: [initialPath] }
  );
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

/** Navigate as if the user clicked something outside the editor (e.g. sidebar). */
async function leaveEditor(to = "/projects") {
  await act(async () => {
    await router.navigate(to);
  });
}

function dispatchBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function fillCreateForm(user) {
  await user.type(screen.getByLabelText("Name"), "Alpha");
  await user.type(screen.getByLabelText("Category"), "Web app");
}

beforeEach(() => {
  confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
  createAdminProject.mockReset();
  getAdminProject.mockReset();
  updateAdminProject.mockReset();
  deleteAdminProject.mockReset();
  uploadAdminImage.mockReset();

  createAdminProject.mockResolvedValue({ data: { ...sampleProject, _id: "new-p" } });
  getAdminProject.mockResolvedValue({ data: sampleProject });
  updateAdminProject.mockResolvedValue({ data: sampleProject });
  deleteAdminProject.mockResolvedValue({ data: { deleted: 1 } });
});

afterEach(() => {
  confirmSpy?.mockRestore();
});

describe("ProjectEditor — dirty state lifecycle", () => {
  it("1. a brand new project starts clean", () => {
    renderEditor("/projects/new");

    expect(screen.getByRole("heading", { name: "New project" })).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("2. editing a field marks the new project dirty", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");

    await user.type(screen.getByLabelText("Name"), "Alpha");

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("3. leaving a dirty new project asks for confirmation and stays", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await user.type(screen.getByLabelText("Name"), "Alpha");

    await leaveEditor();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toMatch(/unsaved changes/i);
    expect(screen.getByRole("heading", { name: "New project" })).toBeInTheDocument();
    expect(screen.queryByText("Projects list page")).not.toBeInTheDocument();
  });

  it("4. a successful creation clears the dirty state", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await fillCreateForm(user);

    await user.click(screen.getByRole("button", { name: /create project/i }));

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(createAdminProject).toHaveBeenCalledTimes(1);
    expect(createAdminProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alpha", category: "Web app" })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("5. navigating away after a successful creation shows no confirmation", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await fillCreateForm(user);
    await user.click(screen.getByRole("button", { name: /create project/i }));
    await screen.findByText("Ready");

    await user.click(screen.getByRole("button", { name: "Back to projects" }));

    expect(await screen.findByText("Projects list page")).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("6. an existing project opens clean", async () => {
    renderEditor("/projects/p-1/edit");

    expect(await screen.findByText("All changes saved")).toBeInTheDocument();
    expect(getAdminProject).toHaveBeenCalledWith("p-1", expect.anything());
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("7. editing an existing project marks it dirty", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/p-1/edit");
    await screen.findByText("All changes saved");

    await user.type(screen.getByLabelText("Name"), " X");

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("8. a successful update clears the dirty state", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/p-1/edit");
    await screen.findByText("All changes saved");
    await user.type(screen.getByLabelText("Name"), " X");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("All changes saved")).toBeInTheDocument();
    expect(updateAdminProject).toHaveBeenCalledTimes(1);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("9. editing again after a save marks it dirty again", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/p-1/edit");
    await screen.findByText("All changes saved");
    await user.type(screen.getByLabelText("Name"), " X");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    await screen.findByText("All changes saved");

    await user.type(screen.getByLabelText("Category"), " Y");

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("10. a failed creation keeps the editor dirty", async () => {
    createAdminProject.mockRejectedValue(new Error("Boom"));
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await fillCreateForm(user);

    await user.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => expect(createAdminProject).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("11. a failed update keeps the editor dirty", async () => {
    updateAdminProject.mockRejectedValue(new Error("Nope"));
    const user = userEvent.setup();
    renderEditor("/projects/p-1/edit");
    await screen.findByText("All changes saved");
    await user.type(screen.getByLabelText("Name"), " X");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateAdminProject).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("ProjectEditor — Cloudinary image upload", () => {
  it("12. an uploaded image is saved, and the save leaves the editor clean", async () => {
    uploadAdminImage.mockResolvedValue({
      url: "https://res.cloudinary.com/demo/projects/shot.jpg",
      publicId: "projects/shot",
      width: 1200,
      height: 800,
      format: "jpg",
      fileName: "shot.jpg",
    });
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await fillCreateForm(user);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["image-bytes"], "shot.jpg", { type: "image/jpeg" });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => expect(uploadAdminImage).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(document.querySelector('[role="status"]')).toHaveTextContent(/image uploaded/i)
    );
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create project/i }));

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(createAdminProject).toHaveBeenCalledWith(
      expect.objectContaining({
        image: "https://res.cloudinary.com/demo/projects/shot.jpg",
        imagePublicId: "projects/shot",
      })
    );
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});

describe("ProjectEditor — beforeunload", () => {
  it("13. beforeunload warns only while the editor is dirty", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");

    expect(dispatchBeforeUnload()).toBe(false);

    await user.type(screen.getByLabelText("Name"), "Alpha");

    expect(dispatchBeforeUnload()).toBe(true);
  });

  it("14. beforeunload is silenced after a successful save", async () => {
    const user = userEvent.setup();
    renderEditor("/projects/new");
    await fillCreateForm(user);
    await user.click(screen.getByRole("button", { name: /create project/i }));
    await screen.findByText("Ready");

    expect(dispatchBeforeUnload()).toBe(false);
  });
});