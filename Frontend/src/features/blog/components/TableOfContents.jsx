import { useMemo } from "react";
import { extractHeadings } from "../../../utils/format";

export function TableOfContents({ markdown }) {
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  if (headings.length === 0) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-2 border-l border-border pl-4">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${h.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
