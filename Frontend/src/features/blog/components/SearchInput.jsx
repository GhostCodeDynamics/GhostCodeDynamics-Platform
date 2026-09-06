import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Search articles…" }) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search articles"
        className="h-11 w-full rounded-full border border-border bg-surface/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
