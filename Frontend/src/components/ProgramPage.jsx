import { motion } from "framer-motion";
import { Reveal, SectionHeader } from "./Section";
import { CtaLink } from "./CtaButton";
import { stagger, fadeUp } from "../utils/motion";
import { cn } from "../utils/cn";

export function FeatureGrid({
  eyebrow,
  title,
  description,
  items,
  columns = 3,
}) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="relative py-16 md:py-24">
      <div className="container-prose">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className={cn("mt-12 grid gap-5", cols)}
        >
          {items.map((item) => (
            <motion.li
              key={item.title}
              variants={fadeUp}
              className="group rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/60 text-primary">
                {item.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

export function Timeline({ eyebrow, title, description, items }) {
  return (
    <section className="relative border-t border-border/60 py-16 md:py-24">
      <div className="container-prose">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <ol className="mt-12 relative border-l border-border pl-6 sm:pl-8">
          {items.map((item, i) => (
            <li key={item.title} className="relative pb-10 last:pb-0">
              <span
                className="absolute -left-[31px] sm:-left-[39px] mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-primary/40 bg-background"
                aria-hidden
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <Reveal delay={i * 0.04}>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                  {item.label}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Faq({ title = "Questions, answered honestly", items }) {
  return (
    <section className="relative border-t border-border/60 py-16 md:py-24">
      <div className="container-prose">
        <SectionHeader title={title} />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Reveal key={item.q}>
              <details className="group rounded-2xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/40">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProgramCta({
  title,
  description,
  primaryLabel = "Get early access",
  primaryTo = "/contact",
  secondaryLabel,
  secondaryTo,
}) {
  return (
    <section className="relative border-t border-border/60 py-16 md:py-24">
      <div className="container-prose">
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 backdrop-blur sm:p-12">
          <div className="absolute inset-0 bg-aurora opacity-50 pointer-events-none" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CtaLink to={primaryTo}>{primaryLabel}</CtaLink>
              {secondaryLabel && secondaryTo && (
                <CtaLink to={secondaryTo} variant="secondary" icon={false}>
                  {secondaryLabel}
                </CtaLink>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function StatusNote({ children }) {
  return (
    <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
      {children}
    </p>
  );
}
