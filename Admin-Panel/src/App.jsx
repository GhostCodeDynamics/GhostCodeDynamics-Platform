import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider,
} from "react-router";
import { ThemeProvider } from "./context/ThemeProvider";
import { AuthProvider } from "./context/AuthProvider";
import { ToastProvider } from "./context/ToastProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminShell } from "./layouts/AdminShell";
import { LogoMark } from "./components/Logo";

// Feature pages are lazy-loaded so each admin module ships separately.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PostsPage = lazy(() => import("./pages/PostsPage"));
const PostEditorPage = lazy(() => import("./pages/PostEditorPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectEditorPage = lazy(() => import("./pages/ProjectEditorPage"));
const CommentsPage = lazy(() => import("./pages/CommentsPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function RouteFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <LogoMark height={36} className="animate-pulse" />
        <p className="label-mono">Loading module…</p>
      </div>
    </div>
  );
}

// Data router. The editors' unsaved-changes guard uses useBlocker, which must
// run inside a data router — a declarative <BrowserRouter> only provides the
// navigation context, so the editors crashed with "useBlocker must be used
// within a data router".
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/new" element={<PostEditorPage />} />
          <Route path="/posts/:id/edit" element={<PostEditorPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/new" element={<ProjectEditorPage />} />
          <Route path="/projects/:id/edit" element={<ProjectEditorPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>
  )
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<RouteFallback />}>
              <RouterProvider router={router} />
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
