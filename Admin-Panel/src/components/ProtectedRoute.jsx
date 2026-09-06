import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { LogoMark } from "./Logo";

/**
 * Gate for authenticated routes. While the session is being restored the
 * app shows a quiet brand splash instead of flashing /login.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "restoring") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <LogoMark height={44} className="animate-pulse" />
          <p className="label-mono">Restoring session…</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
