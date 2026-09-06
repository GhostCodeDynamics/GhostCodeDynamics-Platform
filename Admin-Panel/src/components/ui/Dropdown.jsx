import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Small accessible dropdown menu (click-triggered; Escape/outside click
 * closes). `trigger` must be inert content (icon/label) — it is wrapped
 * in a real <button> here. Items are rendered via DropdownItem.
 */
export function Dropdown({ trigger, children, align = "end", className, menuClassName, triggerLabel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={triggerLabel}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          onClick={() => setOpen(false)}
          className={cn(
            "glass-strong absolute z-40 mt-2 min-w-48 overflow-hidden rounded-xl shadow-elevated",
            align === "end" ? "right-0" : "left-0",
            menuClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, className, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="size-4 text-muted-foreground" />}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-border/70" role="separator" />;
}
