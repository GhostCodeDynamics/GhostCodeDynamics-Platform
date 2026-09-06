import {
  MessagesSquare,
  Github,
  CalendarDays,
  Sparkles,
  LifeBuoy,
  Trophy,
  Hammer,
  Terminal,
  ShieldCheck,
  GraduationCap,
  Users,
  Video,
  Mic,
} from "lucide-react";
import { PageHero } from "../components/Section";
import { Seo } from "../components/Seo";
import { Faq, FeatureGrid, ProgramCta, StatusNote, Timeline } from "../components/ProgramPage";
import { webPageSchema, breadcrumbSchema, NOINDEX_ROBOTS } from "../lib/seo";

const title = "Community & Ecosystem - GhostCode Dynamics";
const description =
  "An ecosystem for builders, developers and collaborators — code reviews, knowledge sharing, open source and future workshops, webinars and tech talks.";
const path = "/community";

const ECOSYSTEM = [
  {
    icon: <Hammer className="h-5 w-5" />,
    title: "Builders",
    desc: "People shipping side projects and polishing portfolios, with honest feedback on both.",
  },
  {
    icon: <Terminal className="h-5 w-5" />,
    title: "Developers",
    desc: "Working devs and freelancers trading notes on production problems, tooling and performance.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Security learners & researchers",
    desc: "From break-the-app exercises to responsible write-ups — always on targets you own.",
  },
  {
    icon: <GraduationCap className="h-5 w-5" />,
    title: "Students & self-taught learners",
    desc: "Study groups and accountability pods for people learning in the open.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Collaborators",
    desc: "Contributors who want their work seen and credited, in the studio and in the community.",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "Open-source contributors",
    desc: "The goal is open repos and write-ups anyone can build on — credit given where it's due.",
  },
];

const PILLARS = [
  {
    icon: <MessagesSquare className="h-5 w-5" />,
    title: "Ask anything",
    desc: "A no-ego help channel. Beginner questions are welcome; 'just Google it' is not an accepted answer.",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "Code reviews",
    desc: "Post a repo, get real feedback on structure, naming, accessibility and security — not just style nits.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Build in public",
    desc: "Weekly build logs where members share progress, blockers and what they shipped.",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Study groups",
    desc: "Small accountability pods working through the same track at the same pace.",
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: "Mini challenges",
    desc: "Short, scoped builds with a deadline. Best submissions get featured and reviewed.",
  },
  {
    icon: <LifeBuoy className="h-5 w-5" />,
    title: "Career help",
    desc: "Resume and portfolio teardowns, plus referrals to internships and collaborator work when they open.",
  },
];

const SESSIONS = [
  {
    icon: <Hammer className="h-5 w-5" />,
    title: "Workshops",
    desc: "Hands-on sessions where a feature or a lab gets built in front of you — then you rebuild it yourself.",
  },
  {
    icon: <Video className="h-5 w-5" />,
    title: "Webinars",
    desc: "Sixty-minute deep dives on one topic with a proper Q&A at the end.",
  },
  {
    icon: <Mic className="h-5 w-5" />,
    title: "Tech talks",
    desc: "Short talks on architecture, security and lessons from client work, followed by open discussion.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Security clinics",
    desc: "Break a deliberately vulnerable app, then patch it together on the call.",
  },
];

const PHASES = [
  {
    label: "Phase 01",
    title: "Invite-only core",
    desc: "A small founding group of active builders sets the tone before we open the doors.",
  },
  {
    label: "Phase 02",
    title: "Public channels",
    desc: "Help, reviews and build logs open to anyone learning seriously, with light moderation.",
  },
  {
    label: "Phase 03",
    title: "Sessions & events",
    desc: "Workshops, webinars, tech talks and security clinics open up for the community once the core is in place, so every session has real people in it.",
  },
  {
    label: "Phase 04",
    title: "Ecosystem integration",
    desc: "Internships, Labs write-ups and open-source work all get a home inside the ecosystem.",
  },
];

const FAQS = [
  {
    q: "Is the community live?",
    a: "Not yet. We're assembling a small founding group first so it starts with real conversation rather than an empty server.",
  },
  {
    q: "Are any sessions scheduled?",
    a: "No. Workshops, webinars and clinics will open once the community core is in place, so every session has people in them. We haven't committed to any dates yet.",
  },
  {
    q: "Does it cost anything?",
    a: "The core community will be free. Paid programmes get private channels, but help and reviews stay open. Longer hands-on workshops with reviewed exercises may be paid, and are always priced clearly up front.",
  },
  {
    q: "Are sessions recorded?",
    a: "Yes — free sessions get published afterwards with notes and the repo, so they keep teaching after the call ends.",
  },
  {
    q: "Do I need to be a student?",
    a: "It's built for students and self-taught builders, but anyone learning or contributing in good faith is welcome.",
  },
  {
    q: "Can you speak at our college or club?",
    a: "Yes. Reach out with your dates, audience size and topic interest and we'll work it out.",
  },
  {
    q: "What are the rules?",
    a: "Be useful, be kind, credit your sources, and no recruitment spam. That's about it.",
  },
];

export default function Community() {
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
            { name: "Community & Ecosystem", path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Community & Ecosystem · Forming"
        title="A home for builders, learners & collaborators."
        description="One ecosystem for the people around GhostCode Dynamics — honest feedback on real work, knowledge sharing, open source and future sessions in rooms with actual people in them."
      >
        <StatusNote>Founding group forming · Invites first</StatusNote>
      </PageHero>

      <FeatureGrid
        eyebrow="Who it's for"
        title="The ecosystem"
        description="Builders, developers, security learners, students and contributors — anyone showing up with real effort and good faith."
        items={ECOSYSTEM}
      />

      <FeatureGrid
        eyebrow="What happens here"
        title="How people work together"
        description="Structured enough to be useful, small enough to still feel human."
        items={PILLARS}
      />

      <FeatureGrid
        eyebrow="Knowledge & sessions"
        title="Kinds of sessions we'll run"
        description="None of these are scheduled yet — they're the formats the ecosystem grows into once the community core is in place."
        items={SESSIONS}
        columns={4}
      />

      <Timeline eyebrow="Roadmap" title="How the ecosystem grows" items={PHASES} />

      <Faq items={FAQS} />

      <ProgramCta
        title="Claim a founding seat"
        description="Tell us what you're building right now. Founding members help shape the channels, sessions and pace of the ecosystem."
        primaryLabel="Request an invite"
        secondaryLabel="Read the blog"
        secondaryTo="/blog"
      />
    </>
  );
}