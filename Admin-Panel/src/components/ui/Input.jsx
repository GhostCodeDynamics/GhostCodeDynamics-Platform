import { forwardRef, useId } from "react";
import { cn } from "../../utils/cn";

export const Input = forwardRef(function Input(
  { label, id, error, hint, className, containerClassName, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground",
          "placeholder:text-muted-foreground/70",
          "transition-colors duration-150 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30",
          className
        )}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={cn(error && errorId, hint && !error && hintId) || undefined}
        {...props}
      />
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
