import { NavLink } from "react-router";
import { LogOut } from "lucide-react";
import { Logo, LogoMark } from "../components/Logo";
import { cn } from "../utils/cn";
import { NAV_SECTIONS } from "./navSections";

function initialsOf(name, email) {
  const source = (name || email || "?").trim();
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function NavItem({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
              isActive ? "opacity-100" : "opacity-0"
            )}
          />
          <Icon aria-hidden="true" className={cn("size-[18px] shrink-0", isActive && "text-primary")} />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

/**
 * Shared sidebar contents. Rendered twice: pinned on desktop (lg+) and
 * inside the off-canvas drawer on smaller screens.
 */
export function SidebarContent({ collapsed = false, admin, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className={cn("flex items-center gap-2.5 border-b border-border/60 px-4 py-4", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <LogoMark height={34} />
        ) : (
          <>
            <Logo height={32} />
          </>
        )}
      </div>
      {!collapsed && (
        <p className="px-5 pt-3 label-mono">Control Panel</p>
      )}

      {/* Navigation */}
      <nav aria-label="Admin sections" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 label-mono">{section.label}</p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.to} onClick={onNavigate}>
                  <NavItem {...item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: profile + logout */}
      <div className="border-t border-border/60 p-3">
        <div className={cn("flex items-center gap-2.5 rounded-lg p-2", collapsed && "justify-center")}>
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-glow-soft font-display text-xs font-semibold text-primary-foreground"
          >
            {initialsOf(admin?.name, admin?.email)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{admin?.name || "Administrator"}</p>
              <p className="truncate text-xs text-muted-foreground">{admin?.email}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className={cn(
            "mt-1.5 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut aria-hidden="true" className="size-[18px] shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}
