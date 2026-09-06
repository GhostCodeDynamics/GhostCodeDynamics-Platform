import { motion } from "framer-motion";
import { fadeUp } from "../utils/motion";
import { cn } from "../utils/cn";

export function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}) {
  return (
    <Reveal className={cn(align === "center" && "text-center mx-auto max-w-2xl", className)}>
      {eyebrow && (
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          {eyebrow}
        </div>
      )}
      <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="absolute inset-0 bg-aurora opacity-70 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-grid pointer-events-none" aria-hidden />
      <div className="container-prose relative">
        <Reveal>
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              {eyebrow}
            </div>
          )}
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="text-gradient">{title}</span>
          </h1>
          {description && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
