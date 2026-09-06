import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

export function ComingSoon({ module, title, description, bullets }) {
  return (
    <section className="relative min-h-[80vh] overflow-hidden pt-32 pb-24">
      <div className="absolute inset-0 bg-aurora opacity-60 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-grid pointer-events-none" aria-hidden />
      <div className="container-prose relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          {module} · In the lab
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>

        {bullets && (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 max-w-2xl">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 rounded-xl border border-border bg-card/60 backdrop-blur p-4 text-sm text-muted-foreground"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary animate-pulse-glow" />
                {b}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-elevated hover:opacity-90 transition"
          >
            Get notified at launch
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
