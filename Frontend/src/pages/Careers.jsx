import { Code2, GraduationCap, HeartHandshake, Clock } from "lucide-react";
import { PageHero, Reveal, SectionHeader } from "../components/Section";
import { Seo } from "../components/Seo";
import { Faq, FeatureGrid, ProgramCta, StatusNote } from "../components/ProgramPage";
import { webPageSchema, breadcrumbSchema, NOINDEX_ROBOTS } from "../lib/seo";

const title = "Careers - GhostCode Dynamics";
const description =
  "Future roles for developers, designers and student collaborators at GhostCode Dynamics — a founder-led technology studio.";
const path = "/careers";

const VALUES = [
  {
    icon: <HeartHandshake className="h-5 w-5" />,
    title: "Honest by default",
    desc: "We don't oversell to clients or to each other. Estimates, mistakes and limits get said out loud.",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Craft over volume",
    desc: "Fewer projects, done properly. Performance, accessibility and readable code are part of the job, not extras.",
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Teach what you learn",
    desc: "Everyone here writes, mentors or shares. It's how a small studio compounds.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Async and flexible",
    desc: "Remote-first with sane hours. Students can work around classes; deep work beats presence.",
  },
];

const ROLES = [
  {
    title: "Frontend Engineer (React / TypeScript)",
    type: "Future role · Remote",
    desc: "Build client sites and internal products with React, TypeScript and Tailwind. Strong eye for detail and motion.",
  },
  {
    title: "Product / UI Designer",
    type: "Future role · Remote",
    desc: "Own design systems, landing pages and brand work for client projects. Figma-fluent, comfortable in code-adjacent handoff.",
  },
  {
    title: "Security Research Collaborator",
    type: "Future role · Part-time",
    desc: "Help build GhostCode Labs write-ups and secure-coding material for students.",
  },
  {
    title: "Student Collaborator",
    type: "Open interest · Part-time",
    desc: "Work alongside the founder on real deliverables while you study. Mentored, credited, and paid where the project allows.",
  },
];

const FAQS = [
  {
    q: "Are you hiring right now?",
    a: "There are no funded, open positions today. GhostCode Dynamics is early-stage and founder-led, so roles open as client work grows. Applying now puts you first in line.",
  },
  {
    q: "Do you take students with no experience?",
    a: "We take students with evidence of effort — a project, a repo, a write-up. Polish is not required; initiative is.",
  },
  {
    q: "Is the work paid?",
    a: "Collaborator work tied to client projects is paid. Learning-only programmes such as internships are separate and clearly labelled.",
  },
  {
    q: "How do I apply?",
    a: "Send a short note with links to what you've built. One paragraph about why this studio, and we'll read all of it.",
  },
];

export default function Careers() {
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
            { name: "Careers", path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Careers · Early stage"
        title="Join the next phase."
        description="GhostCode Dynamics is small and founder-led on purpose. As the studio grows, we'll open roles for developers, designers and student collaborators who care about craft."
      >
        <StatusNote>No funded openings today · Talent list open</StatusNote>
      </PageHero>

      <FeatureGrid
        eyebrow="How we work"
        title="What you'd be signing up for"
        items={VALUES}
        columns={4}
      />

      <section className="relative border-t border-border/60 py-16 md:py-24">
        <div className="container-prose">
          <SectionHeader
            eyebrow="Roles"
            title="Roles we expect to open"
            description="These are honest signals of direction, not live vacancies. Register interest and you'll be contacted first when one becomes real."
          />
          <ul className="mt-12 grid gap-4">
            {ROLES.map((role) => (
              <Reveal key={role.title}>
                <li className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      {role.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {role.desc}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {role.type}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Faq items={FAQS} />

      <ProgramCta
        title="Introduce yourself early"
        description="Send your work, your GitHub and what you want to get better at. We keep a short list and we actually use it."
        primaryLabel="Register your interest"
        secondaryLabel="See internships"
        secondaryTo="/internships"
      />
    </>
  );
}
