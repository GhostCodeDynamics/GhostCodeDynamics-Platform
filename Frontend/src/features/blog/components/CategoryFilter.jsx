import { cn } from "../../../utils/cn";

export function CategoryFilter({ items, active, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
      {items.map((item) => {
        const isActive = active === item;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(item)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              isActive
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-primary/30",
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
