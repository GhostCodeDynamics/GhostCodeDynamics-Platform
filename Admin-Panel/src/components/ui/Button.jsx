import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:bg-secondary/60",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-accent/50 active:bg-accent",
  ghost: "bg-transparent text-foreground hover:bg-accent/50 active:bg-accent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
};

const sizes = {
  sm: "h-9 px-3 text-xs gap-1.5 rounded-md",
  md: "h-11 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
  icon: "size-11 rounded-lg",
  iconSm: "size-9 rounded-md",
};

/**
 * Primary action button. Minimum interactive height is 44px at the `md`
 * size (touch-target friendly); `sm` is reserved for dense table rows.
 */
export const Button = forwardRef(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {children}
    </button>
  );
});
