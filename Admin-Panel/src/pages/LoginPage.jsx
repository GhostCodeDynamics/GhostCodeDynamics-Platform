import { Navigate } from "react-router";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { LoginForm } from "../features/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

/** Full-screen sign-in. Authenticated visitors are sent to the dashboard. */
export default function LoginPage() {
  const { status } = useAuth();

  if (status === "restoring") {
    return (
      <div className="grid min-h-dvh place-items-center bg-background" role="status">
        <p className="label-mono">Checking session…</p>
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      {/* Brand atmosphere */}
      <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 opacity-70" />

      <ThemeToggle className="absolute right-4 top-4" />

      <div className="glass-strong w-full max-w-md rounded-3xl p-8 shadow-elevated sm:p-10">
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <Logo height={40} />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              <span className="text-gradient">Control Panel</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to manage GhostCode Dynamics content.
            </p>
          </div>
        </div>

        <LoginForm />
      </div>

      <p className="absolute bottom-5 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GhostCode Dynamics
      </p>
    </div>
  );
}
