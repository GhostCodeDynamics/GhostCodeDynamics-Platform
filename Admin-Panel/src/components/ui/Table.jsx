import { cn } from "../../utils/cn";

/**
 * Responsive table wrapper: horizontal scroll on narrow screens while
 * keeping a proper semantic <table> for assistive technology.
 */
export function TableContainer({ className, children, ...props }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)} {...props}>
      {children}
    </div>
  );
}

export function Table({ className, children, ...props }) {
  return (
    <table className={cn("w-full min-w-[720px] border-collapse text-left text-sm", className)} {...props}>
      {children}
    </table>
  );
}

export function THead({ children, ...props }) {
  return (
    <thead
      className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-medium"
      style={{ fontFamily: "var(--font-mono)" }}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, ...props }) {
  return (
    <tbody
      className="[&_td]:border-b [&_td]:border-border/50 [&_td]:px-3 [&_td]:py-3 [&_tr]:transition-colors hover:[&_tr]:bg-accent/30"
      {...props}
    >
      {children}
    </tbody>
  );
}
