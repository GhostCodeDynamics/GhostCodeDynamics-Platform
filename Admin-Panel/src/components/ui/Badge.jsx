import { cn } from "../../utils/cn";

const tones = {
  neutral: "bg-muted text-muted-foreground border-border",
  violet: "bg-accent text-accent-foreground border-primary/25",
  success:
    "border-[color-mix(in_oklch,var(--success)_30%,transparent)] bg-[color-mix(in_oklch,var(--success)_12%,transparent)] text-[var(--success)]",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Badge({ tone = "neutral", className, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        tones[tone] || tones.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
