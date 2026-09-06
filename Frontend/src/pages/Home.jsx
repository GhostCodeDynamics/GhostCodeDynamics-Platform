import { Link } from "react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Layers,
  Zap,
  Heart,
  Landmark,
  Lock,
  Cpu,
} from "lucide-react";
import { Reveal, SectionHeader } from "../components/Section";
import { CtaLink } from "../components/CtaButton";
import { fadeUp, stagger } from "../utils/motion";
import { cn } from "../utils/cn";
import { Seo } from "../components/Seo";
import { SITE, webPageSchema, breadcrumbSchema, servicesSchema } from "../lib/seo";
import heroOrb from "../assets/hero-orb.webp";
import founderImg from "../assets/founder.webp";
import msmeLogo from "../assets/msme-logo.webp";

export default function Home() {
  return (
    <>
      <Seo
        title="GhostCode Dynamics - Building Digital Solutions"
        description={SITE.description}
        path="/"
        schemas={[
          webPageSchema("GhostCode Dynamics - Building Digital Solutions", SITE.description, "/"),
          breadcrumbSchema([{ name: "Home", path: "/" }]),
          servicesSchema(),
        ]}
      />
      <Hero />
      <ServicesBento />
      <WhyChooseUs />
      <FeaturedProjects />
      <WhyChoose />
      <FounderSpotlight />
      <FutureVision />
      <ContactCta />
    </>
  );
}

/* -------------------- Hero -------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="absolute inset-0 bg-aurora opacity-80 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-grid pointer-events-none" aria-hidden />

      <div className="container-prose relative grid gap-12 lg:grid-cols-12 lg:gap-8 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="flex flex-col items-start"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Founder-led · Building in public
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="text-gradient block">Building Digital</span>
              <span className="text-gradient block">Solutions.</span>
              <span className="block text-foreground/70 mt-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                Empowering Future Innovators.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              GhostCode Dynamics helps businesses build impactful digital experiences while guiding
              aspiring professionals through practical technology solutions.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
              <CtaLink to="/contact" variant="primary">
                Start Your Project
              </CtaLink>
              <CtaLink to="/portfolio" variant="secondary">
                View Our Work
              </CtaLink>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground"
            >
              <Badge>MERN Stack</Badge>
              <Badge>Cybersecurity Labs</Badge>
              <Badge>Mentorship</Badge>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-5 relative"
        >
          <div className="relative aspect-square w-full max-w-[520px] mx-auto">
            <div
              className="absolute inset-0 rounded-[2rem] bg-aurora opacity-90 blur-2xl"
              aria-hidden
            />
            <div className="relative h-full w-full rounded-[2rem] overflow-hidden glass-strong bg-transparent ring-glow animate-float-slow">
              <img
                src={heroOrb}
                alt="Glowing ghost mark — GhostCode Dynamics brand visual"
                className="h-full w-full object-cover opacity-80 mix-blend-normal dark:opacity-95 dark:mix-blend-screen"
                width={1024}
                height={1024}
                fetchPriority="high"
              />
            </div>
            <FloatingChip className="absolute -left-4 top-12 hidden sm:flex" delay={0.4}>
              <Code2 className="h-3.5 w-3.5 text-primary" />
              Full Stack
            </FloatingChip>

            <FloatingChip className="absolute -right-2 top-1/3 hidden sm:flex" delay={0.6}>
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Cybersecurity
            </FloatingChip>

            <FloatingChip className="absolute left-6 -bottom-2 hidden sm:flex" delay={0.8}>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Digital Growth
            </FloatingChip>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-1 w-1 rounded-full bg-primary/70" />
      {children}
    </span>
  );
}

function FloatingChip({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground shadow-elevated",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/* -------------------- Services Bento -------------------- */
function ServicesBento() {
  return (
    <section className="container-prose py-20 md:py-32">
      <SectionHeader
        eyebrow="What we do"
        title={
          <>
            Practical solutions, <span className="text-gradient-primary">thoughtfully built.</span>
          </>
        }
        description="From shipping production apps for businesses to mentoring students through real projects — focused work, no fluff."
      />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mt-14 grid gap-4 md:grid-cols-6 md:grid-rows-2"
      >
        <BentoCard
          icon={<Code2 className="h-5 w-5" />}
          title="Digital Solutions"
          desc="Business websites, portfolios, landing pages and full web apps — built with MERN, designed for conversion."
          className="md:col-span-4 md:row-span-1"
          accent
        />
        <BentoCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Student Services"
          desc="Project mentorship, portfolio development, and honest career guidance for aspiring developers."
          className="md:col-span-2 md:row-span-2"
        />
        <BentoCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Security Labs"
          desc="Hands-on SIEM, incident response & phishing investigation projects."
          className="md:col-span-2"
        />
        <BentoCard
          icon={<Layers className="h-5 w-5" />}
          title="Built to ship"
          desc="Tight scope. Fast iteration. Quality you can review on GitHub."
          className="md:col-span-2"
        />
      </motion.div>

      <Reveal className="mt-10">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Explore all services <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </section>
  );
}

function BentoCard({ icon, title, desc, className, accent = false }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 transition-colors hover:border-primary/40",
        className,
      )}
    >
      {accent && (
        <div className="absolute inset-0 bg-aurora opacity-40 pointer-events-none" aria-hidden />
      )}
      <div className="relative">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}

/* -------------------- Why Choose Us (trust) -------------------- */
function WhyChooseUs() {
  const items = [
    {
      title: "MSME Registered Entity",
      desc: "Officially registered under India's MSME framework.",
      icon: <Landmark className="h-5 w-5" />,
      watermark: true,
    },
    {
      title: "Secure Development Practices",
      desc: "Security-focused development and coding standards.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Data Privacy Focused",
      desc: "Committed to responsible data protection practices.",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      title: "Modern Technology Stack",
      desc: "Built with modern web and software technologies.",
      icon: <Cpu className="h-5 w-5" />,
    },
  ];
  return (
    <section id="why-choose-us" className="container-prose py-20 md:py-28 scroll-mt-24">
      <SectionHeader
        eyebrow="Why choose us"
        title={<>Why Choose Us</>}
        description="Built on trust, security, and modern development standards."
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((it) => (
          <motion.div
            key={it.title}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            {it.watermark && (
              <img
                src={msmeLogo}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-3 bottom-3 h-25 w-25 select-none object-contain opacity-[0.50] rotate-[-10deg]"
              />
            )}

            <div className="relative z-10">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
                {it.icon}
              </div>

              <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                {it.title}
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------- Featured Projects -------------------- */
function FeaturedProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let live = true;
    fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/projects`)
      .then((r) => r.json())
      .then((res) => {
        if (!live) return;
        const data = res?.data;
        if (Array.isArray(data)) setProjects(data.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <section className="relative border-y border-border/60 bg-surface/20">
      <div className="container-prose py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow="Selected work"
            title={<>Things we&apos;ve built.</>}
            description="Real projects with code you can read. Live links coming soon."
          />
          <Reveal>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              All projects <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {projects.map((p) => (
            <motion.article
              key={p.name}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
                {p.category}
              </p>
              <h3 className="mt-3 font-display text-xl font-semibold text-foreground">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              {p.tech?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {p.tech.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.article>
          ))}
          {projects.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-10">
              Loading projects…
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------- Why choose -------------------- */
function WhyChoose() {
  const items = [
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Founder-led",
      desc: "You talk directly to the person building it. No middle layers, no handoffs.",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Fast iteration",
      desc: "Small, focused scope. Ship something real, review it, improve it.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Transparent process",
      desc: "Honest timelines, public code, clear deliverables — no inflated promises.",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Always learning",
      desc: "Built by someone bridging cybersecurity, MERN and modern web together.",
    },
  ];
  return (
    <section className="container-prose py-20 md:py-32">
      <SectionHeader
        eyebrow="Why GhostCode"
        title={<>A growing brand built on substance.</>}
        description="GhostCode Dynamics isn't a giant agency. It's a focused founder operation — small enough to care, serious enough to deliver."
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {items.map((it) => (
          <motion.div
            key={it.title}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
              {it.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{it.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* -------------------- Founder Spotlight -------------------- */
function FounderSpotlight() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-surface/20">
      <div className="absolute inset-0 bg-aurora opacity-50 pointer-events-none" aria-hidden />
      <div className="container-prose relative py-20 md:py-28 grid gap-10 lg:grid-cols-12 items-center">
        <Reveal className="lg:col-span-5">
          <div className="relative aspect-[4/5] w-full max-w-[240px] mx-auto overflow-hidden rounded-3xl glass-strong ring-glow sm:max-w-[280px] lg:max-w-[290px]">
            <img
              src={founderImg}
              alt="Jeet Ahirwar — Founder of GhostCode Dynamics"
              className="h-full w-full object-cover"
              width={600}
              height={750}
              loading="lazy"
            />
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">The founder</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              From learner to builder.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              I&apos;m <span className="text-foreground">Jeet Ahirwar</span> — an MCA graduate
              specializing in cybersecurity and a MERN stack developer. I started GhostCode Dynamics
              to build practical digital solutions while helping aspiring developers bridge the gap
              between learning and real industry work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CtaLink to="/founder" variant="secondary">
                Read my story
              </CtaLink>
              <CtaLink to="/about" variant="ghost">
                About GhostCode
              </CtaLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Future vision -------------------- */
function FutureVision() {
  const items = [
    "Internships",
    "Cohort Workshops",
    "Certificate Verification",
    "Community & Ecosystem",
    "Open Labs",
  ];
  return (
    <section className="container-prose py-20 md:py-32">
      <SectionHeader
        eyebrow="What's next"
        title={<>Built to grow — without losing its soul.</>}
        description="The roadmap goes beyond client work. We're building an ecosystem for students, builders and learners."
        align="center"
      />
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={stagger}
        className="mt-12 flex flex-wrap justify-center gap-3"
      >
        {items.map((label) => (
          <motion.li
            key={label}
            variants={fadeUp}
            className="rounded-full border border-border bg-surface/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {label}
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
              soon
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

/* -------------------- Contact CTA -------------------- */
function ContactCta() {
  return (
    <section className="container-prose pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-16 text-center shadow-elevated">
          <div className="absolute inset-0 bg-aurora opacity-70 pointer-events-none" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-gradient">
              Have an idea? Let&apos;s build something real.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Whether you need a website, a custom web app, or mentorship — start a conversation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaLink to="/contact" variant="primary">
                Start a project
              </CtaLink>
              <CtaLink
                href="mailto:ghostcodedynamics@gmail.com"
                external
                variant="secondary"
                icon={false}
              >
                ghostcodedynamics@gmail.com
              </CtaLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
