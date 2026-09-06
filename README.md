# GhostCode Dynamics — Platform

> Where Technology Meets Vision.

A full-stack, production-ready web platform for the GhostCode Dynamics agency:
a public marketing site and blog, a REST API, and an admin CMS panel — all in one
monorepo.

| Home | About | Services | Portfolio | Founder | Blog | Contact |
|------|-------|----------|-----------|---------|------|---------|
| Public site | agency story | service pages | case studies | founder profile | tech blog | newsletter + contact form |

## Repository layout

```
GhostCodeDynamics-Platform/
├── Frontend/        Public marketing site + blog (React SPA)      — port 5173
├── Backend/         Express REST API + MongoDB + SMTP/Cloudinary  — port 5000
└── Admin-Panel/     Admin CMS (React SPA)                         — port 5174
```

Each app is a self-contained npm package in its own directory with its own
`.env.example`, `package-lock.json`, and `.gitignore`. No source code is shared
across apps; they communicate over HTTP (`/api/*`).

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS 4, Framer Motion, lucide-react |
| Backend  | Node.js ≥ 20, Express 4, Mongoose 9, JSON Web Tokens, bcryptjs, Helmet, express-rate-limit, mongo-sanitize, Nodemailer, Cloudinary, multer |
| Admin    | React 19, Vite 8, React Router 7, Tailwind CSS 4, @dnd-kit (drag-and-drop ordering), Vitest + Testing Library |
| Databases/Infra | MongoDB, SMTP (transactional email), Cloudinary (admin image uploads) |

All three apps use ESLint; the admin panel adds Vitest with jsdom.

## Features

```text
Public site (Frontend)
  - Blog: posts, categories, tags, search, sort, pagination, reader views
  - Post engagement: comments, likes, bookmarks, pre-filled share links
  - Portfolio with service/category descriptions and contact CTAs
  - Contact form, newsletter sign-up, SEO page titles/descriptions,
    sitemap + robots.txt, favicons + Open Graph image

API (Backend)
  - Public API: posts, comments, interactions, newsletter, contact, projects
  - Admin CMS API (/api/admin): JWT access token + rotating httpOnly refresh
    cookie, per-session revocation (password change revokes all sessions)
  - Content management: posts, projects (incl. drag-and-drop ordering),
    contacts, comments, subscribers (with opt-out + stats)
  - Cloudinary image uploads through the backend (API secret never in the browser)
  - SMTP transactional email: contact acknowledgement, admin notification,
    newsletter welcome
  - Security: Helmet, global + per-route rate limiting, $-operator sanitization,
    CORS allow-list with credentials, request size limits, fail-fast startup
    validation in production
  - Operational: health endpoint (DB + SMTP status), graceful shutdown,
    admin provisioning script, idempotent content seed script

Admin panel (Admin-Panel)
  - Login with bcrypt-verified credentials, token auto-refresh
  - Dashboards, post/project editors with drag-and-drop reordering,
    engagement stats, subscriber and contact inbox management
```

## Getting started

Prerequisites: **Node.js ≥ 20** and **MongoDB** (local or Atlas).

### 1. Install dependencies

```bash
npm install --prefix Frontend
npm install --prefix Backend
npm install --prefix Admin-Panel
```

### 2. Configure environment variables

Each app reads its own `.env` (never committed — copy from `.env.example`):

```bash
cp Frontend/.env.example Frontend/.env
cp Backend/.env.example Backend/.env
cp Admin-Panel/.env.example Admin-Panel/.env
```

| File | Variables |
|------|-----------|
| `Frontend/.env` | `VITE_API_BASE_URL`, `VITE_SITE_URL` |
| `Backend/.env` | `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `FRONTEND_URL`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `ADMIN_EMAIL`, `CLOUDINARY_*`, `SMTP_*`, `COOKIE_*`, token TTLs (see `Backend/.env.example`) |
| `Admin-Panel/.env` | `VITE_ADMIN_API_BASE_URL` |

Only `VITE_API_BASE_URL` / `VITE_ADMIN_API_BASE_URL` and `MONGO_URI` are needed
for local development; SMTP and Cloudinary are optional until you exercise
email/image features. **Never commit a real `.env`.** During local development the
Vite dev servers proxy `/api` to the backend, so the browser stays same-origin.

### 3. Run the three apps

| App | Command | URL |
|-----|---------|-----|
| Backend | `cd Backend && npm run dev` | http://localhost:5000 |
| Frontend | `cd Frontend && npm run dev` | http://localhost:5173 |
| Admin panel | `cd Admin-Panel && npm run dev` | http://localhost:5174 |

### 4. Provision the admin account (optional)

```bash
cd Backend
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-random-password' npm run create-admin
```

### 5. Seed content (optional)

Seeds 8 legacy blog posts and 4 portfolio projects. Idempotent — safe to run
repeatedly; it does not import engagement counters or placeholder URLs.

```bash
cd Backend
MONGO_URI="mongodb://127.0.0.1:27017/ghostcode_dynamics" npm run seed
```

## Production build

```bash
npm run build --prefix Frontend
npm run build --prefix Admin-Panel
```

Both are static SPAs and require SPA rewrites on the host (Vercel, Netlify,
Cloudflare Pages, etc.). The backend is a Node.js service that must be reachable
via `VITE_API_BASE_URL` / `VITE_ADMIN_API_BASE_URL`. In production set
`NODE_ENV=production` so startup validation fails fast on missing configuration.

## Testing

```bash
cd Backend && npm test        # node:test integration suite
cd Admin-Panel && npm test    # Vitest unit/component tests
cd Frontend && npm run lint   # ESLint
```

Verified against the current codebase:

- Backend: 103/103 tests pass with a reachable MongoDB (dedicated test database).
- Admin panel: 37/37 tests pass (`vitest run --pool=threads`); eslint clean.
- Frontend: eslint clean and production build succeeds.

## Security notes

- `.env` files and `node_modules`/`dist` are git-ignored; only `.env.example`
  templates are committed.
- No credentials, API keys, or personal inboxes are committed anywhere in the
  repository (verified by sweep before the initial push).
- The admin refresh cookie is `httpOnly`, scoped to `/api/admin/auth`, and uses
  strict SameSite by default; switch to `SameSite=None + Secure` only if your
  deployment serves the admin app on a different origin than the API.
- CORS is allow-listed and credential-enabled — it must name every deployed
  frontend origin; it never uses `*`.

## Project status

Codebase production-ready; deployment infrastructure and production environment
configuration (hosting, domains, TLS, MongoDB, SMTP, Cloudinary) are required
before go-live. The platform is not yet deployed.

## License

No license has been selected yet — no LICENSE file is committed. The code is
published for portfolio/reference purposes under the repository owner's terms.