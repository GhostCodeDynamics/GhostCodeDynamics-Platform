import { ShieldAlert, Terminal, Bug, Boxes, Gauge, Wrench, FlaskConical, KeyRound } from "lucide-react";
import { PageHero, SectionHeader, Reveal } from "../components/Section";
import { Seo } from "../components/Seo";
import { Faq, FeatureGrid, ProgramCta, StatusNote, Timeline } from "../components/ProgramPage";
import { webPageSchema, breadcrumbSchema, NOINDEX_ROBOTS } from "../lib/seo";

const title = "GhostCode Labs - GhostCode Dynamics";
const description =
  "GhostCode Dynamics' research, experimentation and open-source division — exploring security and engineering problems and sharing selected findings on Insights.";
const path = "/labs";

const AREAS = [
  {
    icon: <ShieldAlert className="h-5 w-5" />,
    title: "Security research",
    desc: "Web application security, authentication flows, OWASP-focused experiments and defensive practices — investigated on targets we build and own.",
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    title: "Developer tooling",
    desc: "Automation, internal tooling concepts and workflow experiments that make building and shipping faster.",
  },
  {
    icon: <Gauge className="h-5 w-5" />,
    title: "Performance engineering",
    desc: "Frontend performance, API optimisation and scalability experiments — profiling real pages and measuring what actually changes.",
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: "Experimental products",
    desc: "Prototype applications and architecture proof-of-concepts that explore ideas before any production commitment.",
  },
];

const CONCEPTS = [
  {
    icon: <Bug className="h-5 w-5" />,
    name: "GhostShop",
    tag: "Concept · Security",
    desc: "A web-application security experiment exploring OWASP-style vulnerabilities and how each one is fixed. An internal concept, not a released product.",
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    name: "AuthMaze",
    tag: "Concept · Authentication",
    desc: "An experiment modelling broken authentication flows — sessions, JWTs and reset paths — to study the defence. Internal, not released.",
  },
  {
    icon: <Terminal className="h-5 w-5" />,
    name: "RecoNotes",
    tag: "Concept · Tooling",
    desc: "A concept for a small reconnaissance note-taking tool for our own engagements. Internal, not released.",
  },
  {
    icon: <Boxes className="h-5 w-5" />,
    name: "PaintBudget",
    tag: "Concept · Performance",
    desc: "An instrumentation experiment studying render cost, hydration and image loading trade-offs in a React app. Internal, not released.",
  },
];

const PHASES = [
  {
    label: "Step 01",
    title: "Explore",
    desc: "Ideas, research questions and technical experiments — run internally, without customer-facing promises.",
  },
  {
    label: "Step 02",
    title: "Prototype",
    desc: "Proof-of-concepts that validate whether an approach actually works before anything is committed.",
  },
  {
    label: "Step 03",
    title: "Publish",
    desc: "Selected findings, write-ups and open-source work are shared on Insights when they are ready.",
  },
  {
    label: "Step 04",
    title: "Evolve",
    desc: "Experiments that prove out can mature into reusable tools, projects or future products.",
  },
];

const FAQS = [
  {
    q: "Is anything from Labs published yet?",
    a: "Not as a released product. Labs is early-stage research and experimentation. Selected findings appear as write-ups on Insights — that is the honest public record of what we are exploring.",
  },
  {
    q: "Is Labs an Academy or a course platform?",
    a: "No. Labs is GhostCode Dynamics' research, experimentation and open-source division. Learning programmes such as internships are separate company features, and the future Academy is a separate product entirely.",
  },
  {
    q: "Is everything in Labs open source?",
    a: "No. We only describe projects we have actually released as open source. Selected tools, experiments and engineering work may be released as open source when they are ready.",
  },
  {
    q: "Is any of this legal to practice on?",
    a: "The experiments are self-contained targets we build ourselves. Never apply these techniques to systems you do not own or have written permission to test.",
  },
  {
    q: "Can I contribute?",
    a: "When repositories or write-up programmes go public, contributions are welcome. Until then, honest feedback on Insights articles is the fastest way to help.",
  },
];

export default function Labs() {
  return (
    <>
      <Seo
        title={title}
        description={description}
        path={path}
        robots={NOINDEX_ROBOTS}
        schemas={[
          webPageSchema(title, description, path),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Labs", path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Research · Experimentation · Open source"
        title="Where ideas are tested before they ship."
        description="GhostCode Labs is the research, experimentation and open-source arm of GhostCode Dynamics — investigating security and engineering problems, building prototypes and publishing only what is genuinely ready."
      >
        <StatusNote>Early stage · Selected findings publish on Insights</StatusNote>
      </PageHero>

      <FeatureGrid
        eyebrow="What we're exploring"
        title="Exploration areas"
        description="Security, systems, tooling and experimental ideas — tackled the way a working engineering team actually tackles them."
        items={AREAS}
        columns={4}
      />

      <section className="relative border-t border-border/60 py-16 md:py-24">
        <div className="container-prose">
          <SectionHeader
            eyebrow="Internal experiments"
            title="Concepts in the lab"
            description="Working ideas, not releases. They may stall, change or be shelved — anything genuinely useful gets shared when it is ready."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {CONCEPTS.map((c) => (
              <Reveal key={c.name}>
                <li className="h-full rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/60 text-primary">
                      {c.icon}
                    </span>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      {c.name}
                    </h3>
                    <span className="shrink-0 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Timeline
        eyebrow="Roadmap"
        title="How the lab works"
        items={PHASES}
      />

      <Faq items={FAQS} />

      <ProgramCta
        title="Follow what comes out of the lab"
        description="Published write-ups on Insights are the honest record of what we explore. If you are working on something similar — security research, tooling or performance — we would like to hear from you."
        primaryLabel="Read the write-ups"
        primaryTo="/blog"
        secondaryLabel="Get in touch"
        secondaryTo="/contact"
      />
    </>
  );
}