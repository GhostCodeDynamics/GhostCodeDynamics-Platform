import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";

const TITLES = [
  { match: /^\/dashboard/, section: "Content", title: "Dashboard" },
  { match: /^\/posts\/new/, section: "Blog", title: "New post" },
  { match: /^\/posts\/[^/]+\/edit/, section: "Blog", title: "Edit post" },
  { match: /^\/posts/, section: "Content · Blog", title: "Posts" },
  { match: /^\/projects\/new/, section: "Portfolio", title: "New project" },
  { match: /^\/projects\/[^/]+\/edit/, section: "Portfolio", title: "Edit project" },
  { match: /^\/projects/, section: "Content · Portfolio", title: "Projects" },
  { match: /^\/comments/, section: "Engagement", title: "Comments" },
  { match: /^\/contacts/, section: "Engagement", title: "Contacts" },
  { match: /^\/newsletter/, section: "Engagement", title: "Newsletter" },
  { match: /^\/settings/, section: "System", title: "Settings" },
];

function resolveTitle(pathname) {
  return TITLES.find((t) => t.match.test(pathname)) || { section: "Admin", title: "Overview" };
}

/**
 * Sticky topbar. The search field is wired to the one real server-side
 * search that exists today (GET /api/posts?search=…): submitting jumps
 * to the Blog manager pre-filtered.
 */
export function Topbar({ onMenuClick, onToggleCollapse, collapsed }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [query, setQuery] = useState("");
  const { section, title } = resolveTitle(pathname);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/posts?search=${encodeURIComponent(q)}`);
    setQuery("");
  };

  const initials = (admin?.name || admin?.email || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 px-4 lg:px-6">
      {/* Sidebar controls */}
      <Button
        variant="ghost"
        size="iconSm"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
      >
        <Menu aria-hidden="true" className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="iconSm"
        className="hidden lg:inline-flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
      >
        {collapsed ? (
          <PanelLeftOpen aria-hidden="true" className="size-5" />
        ) : (
          <PanelLeftClose aria-hidden="true" className="size-5" />
        )}
      </Button>

      {/* Title / breadcrumb */}
      <div className="min-w-0 flex-1">
        <p className="truncate label-mono">{section}</p>
        <h1 className="truncate font-display text-base font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      {/* Search -> posts server-side search */}
      <form onSubmit={submitSearch} role="search" className="relative hidden sm:block">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts…"
          aria-label="Search posts"
          className={cn(
            "h-11 w-44 rounded-lg border border-input bg-surface/70 pl-9 pr-3 text-sm text-foreground",
            "placeholder:text-muted-foreground/70 transition-all duration-200 focus:w-60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40",
            "lg:w-56 lg:focus:w-72"
          )}
        />
      </form>

      <ThemeToggle />

      {/* Profile dropdown */}
      <Dropdown
        triggerLabel="Account menu"
        trigger={
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface/60 py-1 pl-1 pr-2 transition-colors hover:border-primary/40">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-glow-soft font-display text-[11px] font-semibold text-primary-foreground"
            >
              {initials}
            </span>
            <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </span>
        }
      >
        <div className="px-4 py-3">
          <p className="truncate text-sm font-medium">{admin?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin?.email}</p>
          <p className="mt-1 label-mono">{admin?.role}</p>
        </div>
        <DropdownSeparator />
        <DropdownItem icon={Settings} onClick={() => navigate("/settings")}>
          Settings
        </DropdownItem>
        <DropdownItem icon={LogOut} onClick={() => logout()}>
          Sign out
        </DropdownItem>
      </Dropdown>
    </header>
  );
}
