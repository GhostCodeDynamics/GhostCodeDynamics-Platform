import { Linkedin, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, Reveal } from "../components/Section";
import { CtaLink } from "../components/CtaButton";
import { fadeUp, stagger } from "../utils/motion";
import founderImg from "../assets/founder.webp";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema, founderSchema } from "../lib/seo";

const TIMELINE = [
  {
    year: "Early",
    title: "First lines of code",
    desc: "Discovered programming and got hooked on solving real problems with code.",
  },
  {
    year: "Education",
    title: "MCA — Cyber Security",
    desc: "Deep dive into security fundamentals, networks, and modern web technologies.",
  },
  {
    year: "Build phase",
    title: "MERN Stack Developer",
    desc: "Shipped full-stack projects — job portals, real-time apps, dashboards.",
  },
  {
    year: "Now",
    title: "Founded GhostCode Dynamics",
    desc: "Started a founder-led brand to combine building, mentoring and security learning.",
  },
  {
    year: "Next",
    title: "GhostCode Labs",
    desc: "Internships, workshops and an open community for student builders.",
  },
];

export default function Founder() {
  const title = "Founder - Jeet Ahirwar | GhostCode Dynamics";
  const description =
    "Meet Jeet Ahirwar, MCA Cybersecurity graduate, MERN developer, and founder of GhostCode Dynamics.";
  return (
    <>
      <Seo
        title={title}
        description={description}
        path="/founder"
        type="profile"
        schemas={[
          webPageSchema(title, description, "/founder"),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Founder", path: "/founder" },
          ]),
          founderSchema(),
        ]}
      />
      <PageHero eyebrow="Founder" title="From Learner to Builder.">
        <p className="-mt-2 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          The story behind GhostCode Dynamics — written by someone still in love with the craft.
        </p>
      </PageHero>

      <section className="container-prose pt-16 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          <Reveal className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-border/60 sm:max-w-[260px] lg:max-w-[300px]">
              <img
                src={founderImg}
                alt="Jeet Ahirwar — Founder of GhostCode Dynamics"
                className="h-full w-full object-cover"
                width={600}
                height={750}
                loading="eager"
              />
            </div>
            <div className="mt-5 text-center">
              <p className="font-display text-xl font-semibold text-foreground">Jeet Ahirwar</p>
              <p className="text-sm text-muted-foreground">Founder, GhostCode Dynamics</p>
              <a
                href="https://www.linkedin.com/in/jeetahirwar/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
              >
                <Linkedin className="h-4 w-4" /> Connect on LinkedIn
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>

          <div className="lg:col-span-7 space-y-12">
            <Reveal>
              <Heading label="The story">A long-form path, written in short steps.</Heading>
              <Prose>
                <p>
                  I&apos;m Jeet — a developer who took the long, quiet route into tech. My
                  postgraduate work in <span className="text-foreground">MCA (Cyber Security)</span>
                  taught me to look at software not just as features, but as systems with people on
                  the other end.
                </p>
                <p>
                  Somewhere between debugging Express APIs at 2am and chasing logs in a SIEM lab, I
                  realized I didn&apos;t want to pick one. I wanted to build, secure, and teach.
                </p>
                <p>
                  GhostCode Dynamics is the answer to that — a small, founder-led brand that ships
                  real digital work for businesses while staying close to the student community I
                  came from.
                </p>
              </Prose>
            </Reveal>

            <Reveal>
              <Heading label="Education & focus">MCA — Cybersecurity. MERN by craft.</Heading>
              <Prose>
                <p>
                  My focus areas blend cleanly: full-stack MERN development for building, and
                  cybersecurity fundamentals — SIEM, incident response, phishing analysis — for
                  thinking about resilience.
                </p>
              </Prose>
            </Reveal>

            <Reveal>
              <Heading label="The journey">A short timeline.</Heading>
              <motion.ol
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={stagger}
                className="relative mt-6 space-y-6 border-l border-border pl-6"
              >
                {TIMELINE.map((t) => (
                  <motion.li key={t.title} variants={fadeUp} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                      {t.year}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-foreground">
                      {t.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                  </motion.li>
                ))}
              </motion.ol>
            </Reveal>

            <Reveal>
              <Heading label="Philosophy">What I believe.</Heading>
              <Prose>
                <p>
                  Build small things that work. Tell the truth about timelines. Treat students like
                  future peers, not customers. And keep learning — always.
                </p>
              </Prose>
              <div className="mt-8 flex flex-wrap gap-3">
                <CtaLink to="/contact" variant="primary">
                  Work with me
                </CtaLink>
                <CtaLink to="/portfolio" variant="secondary">
                  See projects
                </CtaLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

function Heading({ label, children }) {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-primary">{label}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {children}
      </h2>
    </>
  );
}

function Prose({ children }) {
  return (
    <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
      {children}
    </div>
  );
}
