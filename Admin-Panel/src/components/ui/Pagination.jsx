import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

function pageWindow(current, totalPages) {
  const pages = new Set([1, totalPages]);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const result = [];
  let prev = 0;
  for (const p of [...pages].sort((a, b) => a - b)) {
    const gap = p - prev;
    if (gap === 2) result.push(prev + 1);
    else if (gap > 2) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, totalPages = 1, onChange, className }) {
  if (totalPages <= 1) return null;

  const items = pageWindow(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-end gap-1.5", className)}>
      <Button
        variant="outline"
        size="iconSm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1.5 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "primary" : "outline"}
            size="sm"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
            className="min-w-9"
          >
            {item}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="iconSm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </nav>
  );
}
