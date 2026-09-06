import { Eye, Target, Heart, Sprout, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, Reveal, SectionHeader } from "../components/Section";
import { CtaLink } from "../components/CtaButton";
import { fadeUp, stagger } from "../utils/motion";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema } from "../lib/seo";

const VALUES = [
  {
    icon: <Sprout className="h-5 w-5" />,
    title: "Growth mindset",
    desc: "Every project is a chance to learn something we didn't know yesterday.",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Transparency",
    desc: "Honest timelines, public code, no inflated promises.",
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: "Craft",
    desc: "Small details matter — typography, motion, words, all of it.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Trust",
    desc: "We protect the work, the relationship, and the people we serve.",
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Focus",
    desc: "Tight scope. Real outcomes. No buzzwords.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Empowerment",
    desc: "We grow by helping others grow — students, peers, clients.",
  },
];

export default function About() {
  const title = "About - GhostCode Dynamics";
  const description =
    "The story, mission and values behind GhostCode Dynamics, a founder-led tech brand built on practical work, transparency and student empowerment.";
  return (
    <>
      <Seo
        title={title}
        description={description}
        path="/about"
        schemas={[
          webPageSchema(title, description, "/about"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="About"
        title="A founder-led tech brand."
        description="GhostCode Dynamics is built on a simple belief — practical work and continuous learning create real impact."
      />

      <section className="container-prose py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              Why it started
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built from a gap.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-7 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              GhostCode Dynamics started as a quiet response to a problem I kept seeing — students
              learning technology in theory, but unsure how to apply it; small businesses needing
              digital presence, but not knowing where to start.
            </p>
            <p>
              Instead of pretending to be a large agency or pushing inflated promises, GhostCode is
              built as a focused, founder-led brand — small enough to care about every detail,
              serious enough to actually ship.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-prose py-16 md:py-24 border-t border-border/60">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-elevated h-full">
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Mission</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-foreground">
                Practical digital solutions, accessible to everyone.
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Help businesses move forward with modern web experiences, while making technology
                career paths clearer for students and learners.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10 shadow-elevated h-full">
              <div className="absolute inset-0 bg-aurora opacity-50" aria-hidden />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-widest text-primary">Vision</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-gradient">
                  A community where building and learning grow together.
                </h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Evolving from a freelance practice into an ecosystem — internships, courses,
                  workshops, labs — where the next generation of tech professionals find a home.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-prose py-16 md:py-24 border-t border-border/60">
        <SectionHeader
          eyebrow="Core values"
          title="What we won't compromise on."
          description="A short list. Easy to say, hard to actually keep — which is exactly why we name them."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VALUES.map((v) => (
            <motion.div
              key={v.title}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
                {v.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="container-prose pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-16 text-center">
            <div className="absolute inset-0 bg-aurora opacity-50" aria-hidden />
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Trust</p>
              <h2 className="mt-3 mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl text-gradient">
                Building Trust, One Project at a Time.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Every meaningful collaboration starts with a single success story. Future
                testimonials from clients and students will live here as they happen.
              </p>
              <div className="mt-8">
                <CtaLink to="/contact" variant="primary">
                  Be the first story
                </CtaLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
