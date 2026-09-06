import { cn } from "../../utils/cn";

/** Brand-toned skeleton placeholder (respects reduced motion). */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_oklch,var(--muted-foreground)_18%,var(--muted))_50%,var(--muted)_75%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}
