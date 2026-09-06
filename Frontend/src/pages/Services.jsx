import {
  Globe,
  Layout,
  Rocket,
  AppWindow,
  GraduationCap,
  FileCode,
  Compass,
  ShieldCheck,
  Activity,
  BookOpen,
  Search,
} from "lucide-react";
import { PageHero, Reveal, SectionHeader } from "../components/Section";
import { CtaLink } from "../components/CtaButton";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema, servicesSchema } from "../lib/seo";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "../utils/motion";

const DIGITAL = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Business Websites",
    desc: "Conversion-focused websites for growing brands — fast, modern, content-ready.",
    benefits: ["SEO-friendly structure", "Mobile-first design", "Easy to maintain"],
    deliverables: ["Multi-page site", "CMS-ready content", "Analytics setup"],
  },
  {
    icon: <Layout className="h-5 w-5" />,
    title: "Portfolio Websites",
    desc: "Personal portfolios that make your work look as good as it actually is.",
    benefits: ["Custom design system", "Case-study templates", "Smooth animations"],
    deliverables: ["Custom UI", "Project pages", "Resume/contact section"],
  },
  {
    icon: <Rocket className="h-5 w-5" />,
    title: "Landing Pages",
    desc: "Pixel-tight landing pages built to convert — for launches, campaigns, MVPs.",
    benefits: ["Above-the-fold focus", "A/B-ready structure", "Speed-optimized"],
    deliverables: ["Single-page experience", "Form & lead capture", "Conversion analytics"],
  },
  {
    icon: <AppWindow className="h-5 w-5" />,
    title: "Web Applications",
    desc: "Full-stack MERN apps with auth, dashboards, real-time features and clean APIs.",
    benefits: ["Scalable architecture", "Modern UI/UX", "Documented codebase"],
    deliverables: ["Frontend + backend", "Auth & RBAC", "Deployment-ready build"],
  },
];

const STUDENT = [
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Project Mentorship",
    desc: "1:1 guidance for your college, capstone or side projects — from idea to deploy.",
    benefits: ["Practical scope", "Code reviews", "Real GitHub workflow"],
    deliverables: ["Project plan", "Weekly check-ins", "Final review"],
  },
  {
    icon: <FileCode className="h-5 w-5" />,
    title: "Portfolio Development",
    desc: "Help shaping your portfolio site, resume and project narratives.",
    benefits: ["Stand out to recruiters", "Coherent story", "Stronger write-ups"],
    deliverables: ["Portfolio site", "Case-study drafts", "Resume polish"],
  },
  {
    icon: <Compass className="h-5 w-5" />,
    title: "Career Guidance",
    desc: "Honest direction on roles, skills and learning paths — no placement promises.",
    benefits: ["Clear next steps", "Skill prioritization", "Interview prep tips"],
    deliverables: ["1:1 sessions", "Personalized roadmap", "Resource list"],
  },
];

const SECURITY = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Security Awareness Initiatives",
    desc: "Practical awareness sessions covering phishing, passwords and safe habits.",
    benefits: ["Easy to understand", "Real-world examples", "Audience-friendly"],
    deliverables: ["Sessions / decks", "Quick-reference guides"],
  },
  {
    icon: <Activity className="h-5 w-5" />,
    title: "SIEM Projects",
    desc: "Hands-on Splunk detections, dashboards and rule-building labs.",
    benefits: ["Detection engineering", "Lab-ready setups", "Reusable rules"],
    deliverables: ["Detection rules", "Dashboards", "Lab write-up"],
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Incident Response Labs",
    desc: "Walkthroughs of investigation workflows — phishing emails, brute force, more.",
    benefits: ["Investigation thinking", "Tooling exposure", "Practice scenarios"],
    deliverables: ["Lab scenarios", "Triage playbooks", "Case write-ups"],
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Cybersecurity Learning Resources",
    desc: "Curated learning paths and project ideas for security beginners.",
    benefits: ["Structured progress", "Project-led learning", "Beginner-friendly"],
    deliverables: ["Roadmap docs", "Project ideas", "Resource lists"],
  },
];

export default function Services() {
  const title = "Services - GhostCode Dynamics";
  const description =
    "Digital solutions for businesses, mentorship for students, and hands-on cybersecurity learning projects from GhostCode Dynamics.";
  return (
    <>
      <Seo
        title={title}
        description={description}
        path="/services"
        schemas={[
          webPageSchema(title, description, "/services"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          servicesSchema(),
        ]}
      />
      <PageHero
        eyebrow="Services"
        title="Solutions that actually ship."
        description="Three focused service areas — digital solutions for businesses, mentorship for students, and hands-on security learning."
      >
        <div className="flex flex-wrap gap-3">
          <CtaLink to="/contact" variant="primary">
            Start a conversation
          </CtaLink>
          <CtaLink to="/portfolio" variant="secondary">
            See past work
          </CtaLink>
        </div>
      </PageHero>

      <ServiceGroup
        eyebrow="01 · For businesses"
        title="Digital Solutions"
        description="From a single landing page to full web applications — built with modern stacks and an eye for craft."
        services={DIGITAL}
      />
      <ServiceGroup
        eyebrow="02 · For students"
        title="Student Services"
        description="Practical mentorship that helps you build, ship and tell your story. No overpromises."
        services={STUDENT}
      />
      <ServiceGroup
        eyebrow="03 · Emerging expertise"
        title="Cybersecurity Learning"
        description="A growing focus on practical security projects and learning resources — not enterprise consulting."
        services={SECURITY}
      />

      <section className="container-prose pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-14 text-center shadow-elevated">
            <div className="absolute inset-0 bg-aurora opacity-60" aria-hidden />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl text-gradient">
                Not sure which fits?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Send a short note about your project or goal — we&apos;ll suggest the best path
                forward.
              </p>
              <div className="mt-6">
                <CtaLink to="/contact" variant="primary">
                  Get in touch
                </CtaLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function ServiceGroup({ eyebrow, title, description, services }) {
  return (
    <section className="container-prose py-16 md:py-24 border-b border-border/60 last:border-b-0">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mt-12 grid gap-5 md:grid-cols-2"
      >
        {services.map((s) => (
          <motion.article
            key={s.title}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
                {s.icon}
              </div>
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <DetailList label="Benefits" items={s.benefits} />
              <DetailList label="Deliverables" items={s.deliverables} />
            </div>

            <div className="mt-6">
              <CtaLink to="/contact" variant="ghost" className="px-0">
                Discuss this
              </CtaLink>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}

function DetailList({ label, items }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{label}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
