import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ToastProvider } from "../context/ToastProvider";
import { ProjectEditor } from "../features/portfolio/ProjectEditor";
import { PostEditor } from "../features/blog/PostEditor";

/**
 * Regression test for the white-screen bug on /projects/new and /posts/new.
 *
 * The editors call useBlocker (unsaved-changes guard), which requires a data
 * router. Under the old declarative <BrowserRouter> they threw "useBlocker
 * must be used within a data router", the routed ErrorBoundary fallback then
 * rendered <Link> outside the router and crashed with "Cannot destructure
 * property 'basename' ... is null", unmounting the whole app.
 */
function renderEditor(Editor, path) {
  const router = createMemoryRouter([{ path, element: <Editor /> }], {
    initialEntries: [path],
  });
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}

describe("editor routes render inside a data router", () => {
  it("/projects/new renders the new-project editor", () => {
    renderEditor(ProjectEditor, "/projects/new");
    expect(screen.getByRole("heading", { name: /new project/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create project/i })).toBeInTheDocument();
    expect(screen.getByText(/^project image$/i)).toBeInTheDocument();
  });

  it("/posts/new renders the new-post editor", () => {
    renderEditor(PostEditor, "/posts/new");
    expect(screen.getByRole("heading", { name: /new post/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create post/i })).toBeInTheDocument();
    expect(screen.getByText(/^cover image$/i)).toBeInTheDocument();
  });
});