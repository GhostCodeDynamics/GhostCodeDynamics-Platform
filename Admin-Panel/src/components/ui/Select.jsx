import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export const Select = forwardRef(function Select(
  { label, id, error, hint, className, containerClassName, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border border-input bg-surface px-3 pr-9 text-sm text-foreground",
            "transition-colors duration-150 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
