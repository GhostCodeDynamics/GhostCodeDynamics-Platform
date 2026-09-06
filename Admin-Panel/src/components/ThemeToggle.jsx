import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../utils/cn";

/** Dark/light toggle used in the topbar and on the login screen. */
export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-grid size-11 place-items-center rounded-lg border border-border bg-surface/60 text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:text-foreground",
        className
      )}
    >
      {isDark ? (
        <Moon aria-hidden="true" className="size-[18px]" />
      ) : (
        <Sun aria-hidden="true" className="size-[18px]" />
      )}
    </button>
  );
}
