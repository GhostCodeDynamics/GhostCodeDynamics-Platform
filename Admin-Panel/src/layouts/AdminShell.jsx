import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiErrorMessage } from "../services/apiClient";
import { cn } from "../utils/cn";
import { Topbar } from "./Topbar";
import { SidebarContent } from "./Sidebar";

/**
 * Authenticated admin shell.
 * - lg+  : pinned sidebar (icon rail by default below xl)
 * - <lg  : off-canvas drawer with backdrop
 */
export function AdminShell() {
  const { admin, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1280
  );

  // Close the drawer on navigation.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast("Signed out.", { tone: "info" });
    } catch (err) {
      toast(apiErrorMessage(err), { tone: "error" });
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop / tablet rail */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-border/60 bg-surface/40 backdrop-blur transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        <SidebarContent collapsed={collapsed} admin={admin} onLogout={handleLogout} />
      </aside>

      {/* Off-canvas drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <div className="glass-strong absolute inset-y-0 left-0 flex w-[280px] flex-col animate-toast-in">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <SidebarContent
              collapsed={false}
              admin={admin}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setDrawerOpen(true)}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          collapsed={collapsed}
        />
        <main id="main-content" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-border/40 px-4 py-4 lg:px-8">
          <p className="label-mono">
            GhostCode Dynamics · Admin
          </p>
        </footer>
      </div>
    </div>
  );
}
