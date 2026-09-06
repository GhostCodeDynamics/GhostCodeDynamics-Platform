import { useEffect, useState } from "react";
import { Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, Reveal } from "../components/Section";
import { fadeUp, stagger } from "../utils/motion";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema } from "../lib/seo";
import { apiClient } from "../services/apiClient";
import { projectImageSrc } from "../utils/cloudinary";

export default function Portfolio() {
  const title = "Portfolio - GhostCode Dynamics";
  const description =
    "Selected GhostCode Dynamics projects across MERN web applications and cybersecurity labs, built end-to-end and documented.";
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  function loadProjects() {
    setStatus("loading");
    apiClient
      .get("/projects")
      .then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : []);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }

  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/projects", { signal: controller.signal })
      .then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : []);
        setStatus("ready");
      })
      .catch((err) => {
        if (err && err.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <>
      <Seo
        title={title}
        description={description}
        path="/portfolio"
        schemas={[
          webPageSchema(title, description, "/portfolio"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Portfolio", path: "/portfolio" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Portfolio"
        title="Work that ships."
        description="A growing collection of real projects across full-stack development and cybersecurity. Code-first, polished, documented."
      />

      <section className="container-prose pt-16 pb-24 md:pt-20">
        {status === "loading" && (
          <div
            className="flex min-h-48 items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
              aria-label="Loading projects"
            />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <p>We couldn't load the portfolio right now.</p>
            <button
              type="button"
              onClick={loadProjects}
              className="mt-4 text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && projects.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <p>Projects are being prepared — check back soon.</p>
          </div>
        )}

        {status === "ready" && projects.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid gap-6 lg:grid-cols-2"
          >
            {projects.map((p, i) => (
              <motion.article
                key={p.slug || p.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 transition-colors hover:border-primary/40 shadow-elevated"
              >
                <div
                  className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />

                <div className="relative -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-6 h-44 overflow-hidden rounded-t-3xl border-b border-border bg-aurora">
                  <ProjectCover image={p.image} index={i} />
                </div>

                <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  {p.category}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
                  {p.name}
                </h2>

                <div className="mt-5 space-y-4 text-sm leading-relaxed">
                  <Block label="Problem" text={p.problem} />
                  <Block label="Solution" text={p.solution} />
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(p.tech || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {p.repoUrl ? (
                    <a
                      href={p.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40"
                    >
                      <Github className="h-3.5 w-3.5" /> Code
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <Github className="h-3.5 w-3.5" /> Code — coming soon
                    </span>
                  )}
                  {p.liveUrl ? (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Live link
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5" /> Live link — coming soon
                    </span>
                  )}
                  <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        <Reveal className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            More projects in progress. Want to collaborate or commission something custom?
          </p>
          <a
            href="mailto:ghostcodedynamics@gmail.com"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            ghostcodedynamics@gmail.com <ArrowUpRight className="h-4 w-4" />
          </a>
        </Reveal>
      </section>
    </>
  );
}

function Block({ label, text }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-foreground/90">{text}</p>
    </div>
  );
}

function ProjectCover({ image, index }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) {
    return (
      <>
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/40">
            Screenshot · #{String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </>
    );
  }
  return (
    <img
      src={projectImageSrc(image)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}
