import { AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";

function StateShell({ icon: Icon, title, description, action, className, tone = "muted" }) {
  const toneClass =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : "bg-accent text-accent-foreground";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className={cn("grid size-12 place-items-center rounded-xl", toneClass)}>
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <StateShell icon={Icon} title={title} description={description} action={action} className={className} />
  );
}

export function ErrorState({ error, onRetry, title = "Something went wrong", className }) {
  const message =
    (error && (error.isNetworkError
      ? "Network error. Please check your connection and try again."
      : error.message)) || "An unexpected error occurred.";
  return (
    <StateShell
      icon={AlertTriangle}
      tone="destructive"
      title={title}
      description={message}
      className={className}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
        ) : null
      }
    />
  );
}

export function NotAvailableState({ title, description, icon: Icon, className }) {
  return (
    <StateShell icon={Icon} title={title} description={description} className={className} />
  );
}

export function LoadingState({ label = "Loading…", rows = 3, className }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className={cn("space-y-3", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-shimmer rounded-lg bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_oklch,var(--muted-foreground)_18%,var(--muted))_50%,var(--muted)_75%)] bg-[length:200%_100%]" />
      ))}
    </div>
  );
}
