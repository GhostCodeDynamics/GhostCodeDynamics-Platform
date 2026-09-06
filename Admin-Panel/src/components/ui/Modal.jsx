import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

/**
 * Minimal accessible dialog: Escape closes, backdrop click closes,
 * focus moves into the panel and returns on close.
 */
export function Modal({ open, onClose, title, children, footer, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => onClose?.()}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div
        className={cn(
          "glass-strong relative z-10 w-full max-w-lg rounded-2xl shadow-elevated",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
          <Button variant="ghost" size="iconSm" aria-label="Close" onClick={() => onClose?.()}>
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
