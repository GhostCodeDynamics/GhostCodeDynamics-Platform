import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext } from "../hooks/useToast";
import { cn } from "../utils/cn";

const TONES = {
  success: { icon: CheckCircle2, className: "text-[var(--success)]" },
  error: { icon: AlertTriangle, className: "text-destructive" },
  info: { icon: Info, className: "text-accent-foreground" },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { tone = "info", duration = 4000 } = {}) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, message, tone }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast: push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Live region announces toasts to assistive technology. */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-2"
      >
        {toasts.map(({ id, message, tone }) => {
          const { icon: Icon, className } = TONES[tone] || TONES.info;
          return (
            <div
              key={id}
              role="status"
              className={cn(
                "glass-strong pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-elevated animate-toast-in"
              )}
            >
              <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", className)} />
              <p className="flex-1 text-sm leading-snug text-foreground">{message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(id)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
