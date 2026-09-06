import { cn } from "../../utils/cn";

/**
 * Rounded card with the brand's soft surface treatment. `interactive`
 * adds the elevated hover used across the dashboard.
 */
export function Card({ className, interactive = false, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground",
        interactive &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, title, subtitle, actions, icon: Icon }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 border-b border-border/60 p-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon aria-hidden="true" className="size-4" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}
