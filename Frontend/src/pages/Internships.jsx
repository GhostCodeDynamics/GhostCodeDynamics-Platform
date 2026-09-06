import { Briefcase, GitBranch, MessageSquare, Award, Target, Clock } from "lucide-react";
import { PageHero } from "../components/Section";
import { Seo } from "../components/Seo";
import { Faq, FeatureGrid, ProgramCta, StatusNote, Timeline } from "../components/ProgramPage";
import { webPageSchema, breadcrumbSchema, NOINDEX_ROBOTS } from "../lib/seo";

const title = "Internships - GhostCode Dynamics";
const description =
  "A project-based internship program at GhostCode Dynamics for students who want to ship production-grade work with real mentorship, not busywork.";
const path = "/internships";

const PILLARS = [
  {
    icon: <Target className="h-5 w-5" />,
    title: "Real briefs, real scope",
    desc: "You work on scoped slices of live client and in-house projects — not throwaway sample apps built to fill a certificate.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Founder-level mentorship",
    desc: "Direct code review and weekly one-to-one feedback from the founder. Fewer interns, more attention.",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Professional workflow",
    desc: "Branches, pull requests, reviews, issue tracking and deploys. You leave knowing how teams actually ship.",
  },
  {
    icon: <Briefcase className="h-5 w-5" />,
    title: "Portfolio-first outcome",
    desc: "Every internship ends with a documented case study you can show in interviews and link from your CV.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Student-friendly hours",
    desc: "Part-time, remote-first blocks designed around semesters and exams rather than fighting them.",
  },
  {
    icon: <Award className="h-5 w-5" />,
    title: "Verifiable certificate",
    desc: "Completing the programme issues a certificate with an ID that our verification page confirms. Certificates and verification go live together with the first completed cohort.",
  },
];

const PHASES = [
  {
    label: "Step 01",
    title: "Share your work",
    desc: "Share a GitHub profile, a deployed project or anything you have built. Effort counts more than polish.",
  },
  {
    label: "Step 02",
    title: "Short conversation",
    desc: "A relaxed call about how you think, what you want to learn and where you currently get stuck.",
  },
  {
    label: "Step 03",
    title: "Onboarding sprint",
    desc: "Environment setup, codebase walkthrough and a small first ticket to get you comfortable shipping.",
  },
  {
    label: "Step 04",
    title: "Project block",
    desc: "Six to twelve weeks owning features end to end, with reviews, standups and a written build journal.",
  },
  {
    label: "Step 05",
    title: "Wrap-up and certificate",
    desc: "A final demo, a public case study and — for those who complete the programme — a verifiable certificate.",
  },
];

const FAQS = [
  {
    q: "Is the internship program live?",
    a: "Not yet. Applications open with the first cohort. Registering interest now puts you on the shortlist we contact first.",
  },
  {
    q: "Is it paid?",
    a: "The first cohorts are unpaid but genuinely educational, with a stipend planned as client capacity grows. We will never charge students to intern.",
  },
  {
    q: "Do I need to be a computer science student?",
    a: "No. You need working fundamentals in HTML, CSS and JavaScript, and the discipline to finish what you start.",
  },
  {
    q: "Is it remote?",
    a: "Yes, remote-first with scheduled review calls. Time zones inside India are easiest, but we consider everyone.",
  },
  {
    q: "Is the certificate verifiable?",
    a: "Yes — when the programme runs, completing it earns a certificate with a GCD-YYYY-XXXXXX ID that our verification page will confirm. Verification goes live with the first cohort, and nothing is advertised before then.",
  },
];

export default function Internships() {
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
            { name: "Internships", path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Internships · Opening soon"
        title="Real internships. Real projects."
        description="An internship at GhostCode Dynamics is a working seat on real product work — scoped features, code review, deploys and a documented outcome you can point recruiters at."
      >
        <StatusNote>Applications not open yet · Shortlist forming</StatusNote>
      </PageHero>

      <FeatureGrid
        eyebrow="What you get"
        title="Built to make you employable"
        description="Everything here exists because it shows up in interviews — the work, the workflow and the write-up."
        items={PILLARS}
      />

      <Timeline
        eyebrow="Process"
        title="How an internship runs"
        description="Predictable structure from the first message to the final demo and documented outcome."
        items={PHASES}
      />

      <Faq items={FAQS} />

      <ProgramCta
        title="Get on the internship shortlist"
        description="Send your best work and what you want to build. Applications are not open yet — registering interest now puts you first in line when the first cohort is announced."
        primaryLabel="Register interest"
        secondaryLabel="See open roles"
        secondaryTo="/careers"
      />
    </>
  );
}
