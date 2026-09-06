/**
 * seed-content.mjs — idempotent legacy content migration.
 *
 * Adds the 8 blog posts and 4 portfolio projects from the legacy
 * GhostCode site to the backend database.
 *
 *   - Upserts by slug, so it is safe to run repeatedly.
 *   - Sets publishedAt, which is required for content to appear publicly.
 *   - Does NOT import engagement counters (views / likes / commentsCount)
 *     or the trending flag. Those are server-maintained and start at zero.
 *   - Does NOT import placeholder GitHub URLs ("https://github.com/") or
 *     screenshot bands — repoUrl / liveUrl / image stay empty and the
 *     frontend renders them as "coming soon".
 *
 * Usage:
 *   MONGO_URI="mongodb://..." node scripts/seed-content.mjs
 */
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../src/config/db.js";

dotenv.config();

import Post from "../src/models/Post.js";
import Project from "../src/models/Project.js";

const AUTHOR = { name: "Jeet Ahirwar", role: "Founder, GhostCode Dynamics" };

// Unsplash covers were the real cover art on the legacy site and remain valid.
const COVER = (seed) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=1600&q=70`;

// Record metadata so publishedAt satisfies the public visibility filter.
// Not displayed by the frontend; portfolio ordering uses `order`.
const PROJECT_RECORD_DATE = new Date("2026-01-01T00:00:00.000Z");

const POSTS = [
  {
    slug: "designing-scalable-mern-architecture",
    title: "Designing a Scalable MERN Architecture in 2026",
    subtitle: "From monolith to modular services without over-engineering.",
    excerpt:
      "A practical walkthrough of layering an Express API, structuring MongoDB access, and keeping the React frontend honest as your product scales.",
    cover: COVER("photo-1517134191118-9d595e4c8c2b"),
    category: "MERN Stack",
    tags: ["MERN", "Architecture", "Node.js", "MongoDB"],
    author: AUTHOR,
    publishedAt: new Date("2026-06-18T00:00:00.000Z"),
    readingMinutes: 9,
    featured: true,
    trending: true,
    editorsPick: true,
    body: `## Why architecture matters early

Most MERN apps drown not in traffic but in **their own folders**. The
antidote isn't microservices — it's *seams*. Draw a line between
delivery (HTTP), the domain, and infrastructure so you can swap
Mongo, Redis, or the queue without ripping the app apart.

## A layered layout that scales

- \`interfaces/\` — Express controllers and route registration
- \`application/\` — use-cases orchestrating domain services
- \`domain/\` — entities, value objects, pure logic
- \`infrastructure/\` — DB, cache, third-party clients

### Example: a use-case that stays testable

\`\`\`ts
export const publishArticle = async (
  { slug }: PublishInput,
  repo: ArticleRepository,
  clock: Clock,
) => {
  const article = await repo.bySlug(slug);
  if (!article) throw new NotFound("article");
  article.publish(clock.now());
  await repo.save(article);
  return article;
};
\`\`\`

> Business rules live in \`domain/\`. Frameworks belong on the edges.

## What to skip

Don't reach for Kubernetes on day one. Ship a single Node process on
Fly.io or Render, put Mongo Atlas behind it, and only split when a
real bottleneck shows up in metrics.

## Wrap-up

The goal isn't a perfect diagram — it's a codebase you'll still
enjoy in eighteen months. Draw seams, keep the domain pure, and
let infrastructure be replaceable.`,
  },
  {
    slug: "hardening-express-apis-for-production",
    title: "Hardening Express APIs for Production",
    subtitle: "The 12 defaults every Node backend should ship with.",
    excerpt:
      "Rate limits, structured logging, secure headers, request validation — the small habits that keep an API alive under real traffic.",
    cover: COVER("photo-1555949963-aa79dcee981c"),
    category: "Backend",
    tags: ["Node.js", "Express", "Security"],
    author: AUTHOR,
    publishedAt: new Date("2026-06-11T00:00:00.000Z"),
    readingMinutes: 7,
    editorsPick: true,
    trending: true,
    body: `## The defaults that matter

Ship an Express app with **helmet**, **cors**, request validation
(zod), structured logs (pino), and a global error handler *before*
you write a single feature. Everything else is a rebuild waiting to
happen.

\`\`\`ts
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(pinoHttp({ logger }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
\`\`\`

> A 500-line \`server.ts\` that gets these five right beats a
> 15-file scaffold that gets them wrong.

## Validate at the edge

Every controller starts with a schema parse. If input isn't valid,
the handler never runs — the domain stays clean.`,
  },
  {
    slug: "react-server-state-vs-client-state",
    title: "React: Server State vs Client State (and why the difference matters)",
    subtitle: "Stop putting API responses in Redux.",
    excerpt:
      "A pragmatic mental model for choosing between React Query, Context, and useState — and why most 'global state' isn't global.",
    cover: COVER("photo-1633356122544-f134324a6cee"),
    category: "Web Development",
    tags: ["React", "State", "React Query"],
    author: AUTHOR,
    publishedAt: new Date("2026-06-02T00:00:00.000Z"),
    readingMinutes: 6,
    trending: true,
    body: `## Two problems, two tools

Server state is *cached remote data* — it goes stale, refetches,
and belongs in **React Query**. Client state is *UI intent* —
modals, tabs, form drafts — and belongs in \`useState\` or
Context.

The bug in most codebases is treating the server response as
"global" and mirroring it in Redux. You end up with three sources
of truth and none of them are right.`,
  },
  {
    slug: "docker-for-javascript-devs",
    title: "Docker for JavaScript Developers, Without the Yak-Shaving",
    subtitle: "One Dockerfile, one compose file, one deploy.",
    excerpt:
      "A minimal, production-friendly Docker setup for Node + React apps that doesn't require memorizing the CLI reference.",
    cover: COVER("photo-1605745341112-85968b19335b"),
    category: "DevOps",
    tags: ["Docker", "Node.js", "DevOps"],
    author: AUTHOR,
    publishedAt: new Date("2026-05-24T00:00:00.000Z"),
    readingMinutes: 8,
    body: `## A multi-stage Dockerfile that just works

\`\`\`dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
\`\`\`

> Multi-stage builds keep the final image tiny and reproducible.`,
  },
  {
    slug: "linux-fundamentals-for-web-devs",
    title: "Linux Fundamentals Every Web Dev Should Actually Know",
    subtitle: "Not sysadmin — just the 20% you use every day.",
    excerpt:
      "Processes, permissions, pipes, and systemd — the small pieces of Linux that unblock 90% of deploy issues.",
    cover: COVER("photo-1629654297299-c8506221ac97"),
    category: "DevOps",
    tags: ["Linux", "DevOps", "CLI"],
    author: AUTHOR,
    publishedAt: new Date("2026-05-15T00:00:00.000Z"),
    readingMinutes: 10,
    body: `## The five commands you'll use forever

\`ps\`, \`top\`, \`journalctl\`, \`ss\`, and \`grep\`. Learn what
each one *actually* prints and you'll debug production faster than
any dashboard.`,
  },
  {
    slug: "from-college-to-founder",
    title: "From College to Founder: What I'd Tell Myself in Year One",
    subtitle: "Honest notes on building a tech brand while learning.",
    excerpt:
      "A candid reflection on the missteps, small wins, and mindset shifts that shaped the first year of GhostCode Dynamics.",
    cover: COVER("photo-1519389950473-47ba0277781c"),
    category: "Career",
    tags: ["Career", "Founder", "Mentorship"],
    author: AUTHOR,
    publishedAt: new Date("2026-05-04T00:00:00.000Z"),
    readingMinutes: 5,
    editorsPick: true,
    body: `## Ship, then polish

For every twelve months I spent "learning", the six months I spent
shipping taught me more. Your first client won't care how clean
your Git history is — they'll care that the thing works.`,
  },
  {
    slug: "system-design-101-for-juniors",
    title: "System Design 101 for Junior Developers",
    subtitle: "Load balancers, caches, and queues — explained without hand-waving.",
    excerpt:
      "A gentle, example-first introduction to the building blocks that come up in every senior interview.",
    cover: COVER("photo-1518770660439-4636190af475"),
    category: "System Design",
    tags: ["System Design", "Interviews", "Backend"],
    author: AUTHOR,
    publishedAt: new Date("2026-04-20T00:00:00.000Z"),
    readingMinutes: 12,
    trending: true,
    body: `## Start with the request path

Every system design story begins with "a user clicks a button". If
you can narrate what happens next — DNS, load balancer, app server,
cache, DB — you already understand more than most junior devs.`,
  },
  {
    slug: "cybersecurity-lab-setup",
    title: "Building a Home Cybersecurity Lab on a Student Budget",
    subtitle: "Kali, a VPN, and one used ThinkPad.",
    excerpt:
      "A step-by-step guide to setting up a safe, isolated lab so you can practice offensive security without breaking anything real.",
    cover: COVER("photo-1550751827-4bd374c3f58b"),
    category: "Cybersecurity",
    tags: ["Cybersecurity", "Kali", "HomeLab"],
    author: AUTHOR,
    publishedAt: new Date("2026-04-08T00:00:00.000Z"),
    readingMinutes: 8,
    body: `## Isolate first, hack second

Before you download a single tool, put your lab on its own VLAN or
virtual network. Every serious CTF veteran will tell you the same
thing: **the first thing you compromise is your own network**.`,
  },
];

const PROJECTS = [
  {
    name: "OpportunityX",
    slug: "opportunityx",
    category: "Web App",
    problem:
      "Job seekers and recruiters lack a clean, modern portal that connects them with relevant matches and real-time updates.",
    solution:
      "A full-stack MERN job portal with role-based dashboards, smart filtering, application tracking and authentication.",
    tech: ["React", "Node.js", "Express", "MongoDB", "TailwindCSS"],
    liveUrl: "",
    repoUrl: "",
    featured: false,
    order: 1,
    publishedAt: PROJECT_RECORD_DATE,
  },
  {
    name: "Real-Time Chat App",
    slug: "real-time-chat-app",
    category: "Real-Time",
    problem:
      "Building a responsive messaging experience with presence, typing indicators and zero perceived lag.",
    solution:
      "Socket.IO powered chat with rooms, online status, typing indicators and persistent message history.",
    tech: ["React", "Socket.IO", "Node.js", "Express", "MongoDB"],
    liveUrl: "",
    repoUrl: "",
    featured: false,
    order: 2,
    publishedAt: PROJECT_RECORD_DATE,
  },
  {
    name: "Phishing Email Investigation",
    slug: "phishing-email-investigation",
    category: "Cybersecurity",
    problem:
      "Suspicious email reaches an inbox — how do you triage, extract IOCs and document the case?",
    solution:
      "A walkthrough case study: header analysis, URL/sender reputation, payload inspection, and a structured response report.",
    tech: ["Email Headers", "VirusTotal", "URLScan", "OSINT", "Markdown report"],
    liveUrl: "",
    repoUrl: "",
    featured: false,
    order: 3,
    publishedAt: PROJECT_RECORD_DATE,
  },
  {
    name: "SIEM Brute Force Detection Lab",
    slug: "siem-brute-force-detection-lab",
    category: "Cybersecurity",
    problem:
      "Detecting brute-force authentication attempts against Windows endpoints with low noise.",
    solution:
      "Splunk-based detection rules, dashboards and triage workflow using ingested Windows event logs.",
    tech: ["Splunk", "SPL", "Sysmon", "Windows Event Logs"],
    liveUrl: "",
    repoUrl: "",
    featured: false,
    order: 4,
    publishedAt: PROJECT_RECORD_DATE,
  },
];

async function upsertAll() {
  let posts = 0;
  for (const data of POSTS) {
    await Post.updateOne({ slug: data.slug }, { $set: data }, { upsert: true });
    posts += 1;
  }

  let projects = 0;
  for (const data of PROJECTS) {
    await Project.updateOne({ slug: data.slug }, { $set: data }, { upsert: true });
    projects += 1;
  }

  return { posts, projects };
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error(
      "[seed-content] MONGO_URI is not set. Provide the connection string explicitly."
    );
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error(`[seed-content] failed to connect to MongoDB: ${err && err.message}`);
    process.exit(1);
  }

  console.log("[seed-content] connected, seeding…");
  const counts = await upsertAll();
  console.log(
    `[seed-content] done: ${counts.posts} posts, ${counts.projects} projects (idempotent upserts).`
  );

  await disconnectDB();
}

main().catch((err) => {
  console.error(`[seed-content] unexpected error: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});