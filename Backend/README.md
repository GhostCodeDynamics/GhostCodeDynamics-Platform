# GhostCode Dynamics — Backend API

The API server for the GhostCode Dynamics ecosystem.

## Architecture position

```
GhostCodeDynamics-Platform/
├── Frontend/          Production public site
├── Backend/           This API backend
└── Admin-Panel/       Admin app (API-only, never direct DB access)
```

The backend is a standalone Express application. It does not import anything
from the `Frontend` or `Admin-Panel` apps.

## Current scope

- Express application skeleton with environment-driven configuration
- `GET /api/health` health-check endpoint (includes SMTP + database status)
- Central JSON 404 and error handling
- CORS restricted to the configured frontend origin
- Helmet security headers
- Global rate limiter plus per-route limiters (comments, interactions,
  newsletter, contact) and a dedicated admin auth limiter
- Request size limits (`express.json`/`express.urlencoded`, 100 KB) and
  mongo-sanitize protection against `$` operator injection
- MongoDB connection layer (`src/config/db.js`) with fail-fast startup,
  database-disabled (health-only) fallback, and graceful shutdown
- Mongoose models: `Post`, `Comment`, `Interaction`, `Subscriber`, `Contact`,
  and `Project` in `src/models/`
- Public read/write API for the blog, comments, interactions, newsletter,
  contact, and projects (see "Endpoints")
- Admin namespace under `/api/admin`: authentication (JWT access + httpOnly
  refresh cookie, session revocation), CMS endpoints (posts, projects,
  contacts, comments, newsletter subscribers), Cloudinary image uploads,
  and statistics
- Transactional email via SMTP (contact acknowledgements, newsletter welcome)
- Validation, services, controllers, and routes under `src/`
- `node:test` integration suite against a dedicated test database (see
  "Tests")

## Setup

```bash
npm install
cp .env.example .env   # then edit values
```

## Run

```bash
npm run dev     # nodemon (development)
npm start       # plain node
```

## Environment variables

| Variable       | Example                              | Purpose                              |
|----------------|--------------------------------------|--------------------------------------|
| `NODE_ENV`        | `development`                        | Runtime environment                          |
| `PORT`            | `5000`                               | Server port                                  |
| `CORS_ORIGIN`     | `https://ghostcodedynamics.github.io`| Allowed browser origin(s), comma-separated   |
| `FRONTEND_URL`    | `https://ghostcodedynamics.github.io`| Canonical public site URL                    |
| `MONGO_URI`       | `mongodb://127.0.0.1:27017/ghostcode_dynamics` | MongoDB connection string (absent ⇒ database-disabled mode) |
| `ADMIN_EMAIL`     | `ghostcodedynamics@gmail.com`        | Initial admin email (provisioned by `npm run create-admin`) |
| `ADMIN_PASSWORD`  | *(secret)*                           | Initial admin password (provisioning only)   |
| `JWT_ACCESS_SECRET` | *(secret)*                         | JWT signing secret for admin access tokens   |
| `ACCESS_TOKEN_TTL`  | `15m`                             | Admin access-token lifetime                  |
| `REFRESH_TTL_DAYS`  | `7`                               | Refresh-cookie lifetime in days              |
| `COOKIE_SAMESITE`   | `strict`                          | Refresh-cookie SameSite (`strict`/`lax`/`none`) |
| `COOKIE_SECURE`     | `false`                           | Refresh-cookie Secure flag (true over HTTPS) |
| `CLOUDINARY_CLOUD_NAME` | *(from dashboard)*             | Cloudinary uploads                           |
| `CLOUDINARY_API_KEY`   | *(from dashboard)*             | Cloudinary uploads                           |
| `CLOUDINARY_API_SECRET`| *(from dashboard)*             | Cloudinary uploads (never sent to browsers)  |

## SMTP setup

The backend supports transactional email (contact acknowledgements, newsletter
welcome emails) via SMTP. **If SMTP credentials are not configured, the
application continues normally — emails are silently skipped.**

Add these to your `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM="GhostCode Dynamics <your-email@gmail.com>"
```

### Gmail SMTP

| Field    | Value              |
|----------|--------------------|
| Host     | `smtp.gmail.com`   |
| Port     | `587`              |
| Secure   | `false`            |
| Auth     | Gmail App Password |

> **Important:** Do not use your normal Gmail password. Enable 2-Step
> Verification, then generate a Gmail App Password at:
> https://myaccount.google.com/apppasswords

### Security

- `SMTP_PASSWORD` is never logged, never exposed in API responses, and never
  included in error messages.
- The health endpoint reports only `"configured"` or `"unconfigured"` — never
  credentials.
- The `from` address defaults to `SMTP_FROM`. User-controlled input cannot
  override the sender identity.

## Endpoints

All API routes are served under `/api`. Every response is JSON:

- Success: `{ "success": true, "data": ... }` (create/update writes return
  `201`; reads return `200`)
- Client errors: `{ "success": false, "message": "...", "errors": [...] }`
  (`400` validation with per-field `errors`, `404` not found)
- Unknown routes return `404` `{ "success": false, "message": "Route not found" }`
- Malformed JSON bodies return `400` `"Invalid JSON payload"`; bodies over the
  100 KB limit return `413`

### Posts

| Method | Path                 | Notes                                            |
|--------|----------------------|--------------------------------------------------|
| GET    | `/api/posts`         | Published posts. Query: `category`, `tag`, `search`, `sort` (`newest`, `oldest`, `views`, `likes`, `comments`), `page`, `limit` (max 100). Returns `meta` with pagination. |
| GET    | `/api/posts/featured` | Featured post                                    |
| GET    | `/api/posts/editors-picks` | Editors' picks (up to 3)                   |
| GET    | `/api/posts/trending` | Trending posts (up to 4)                        |
| GET    | `/api/posts/:slug`   | Post detail (increments `views`). Includes `related` and `prev`/`next`. |

### Comments

| Method | Path                              | Notes                                            |
|--------|-----------------------------------|--------------------------------------------------|
| GET    | `/api/posts/:slug/comments`       | Flat list, `createdAt` ascending                  |
| POST   | `/api/posts/:slug/comments`       | Body: `body` (2–1000), `author` (≤80, optional, default `Anonymous`), `parentId` (ObjectId, optional, must belong to the same post). Increments the post's `commentsCount`. Rate limited: 20 / 15 min. |

### Interactions

Interactions require `actorId` (8–128 chars) in the request body so anonymous
visitors can like/bookmark. Interactions are idempotent; counters are
server-maintained.

| Method | Path                              | Notes                                            |
|--------|-----------------------------------|--------------------------------------------------|
| POST   | `/api/posts/:slug/like`           | Like a post                                      |
| DELETE | `/api/posts/:slug/like`           | Unlike a post                                    |
| POST   | `/api/posts/:slug/bookmark`       | Bookmark a post                                  |
| DELETE | `/api/posts/:slug/bookmark`       | Remove a bookmark                                |
| POST   | `/api/comments/:id/like`          | Like a comment                                   |
| DELETE | `/api/comments/:id/like`          | Unlike a comment                                 |

Rate limited: 60 / 15 min.

### Newsletter

| Method | Path                           | Notes                                            |
|--------|--------------------------------|--------------------------------------------------|
| POST   | `/api/newsletter/subscribe`    | Body: `email`. Idempotent; reactivates unsubscribed addresses. `201`. Rate limited: 10 / hour. |
| POST   | `/api/newsletter/unsubscribe`  | Body: `email`. Idempotent.                       |

### Contact

| Method | Path        | Notes                                            |
|--------|-------------|--------------------------------------------------|
| POST   | `/api/contact` | Body: `name` (≤80), `email` (≤160), `phone` (10–15), `topic` (`project`, `mentorship`, `collab`, `other`), `message` (10–1500). Stored with status `new`. `201`. Rate limited: 5 / hour. |

### Projects

| Method | Path                 | Notes                          |
|--------|----------------------|--------------------------------|
| GET    | `/api/projects`      | All projects, ordered          |
| GET    | `/api/projects/:slug`| Single project                 |

### Admin

Admin routes live under `/api/admin` and require authentication. Auth uses a
short-lived JWT access token returned to the browser plus an httpOnly refresh
cookie; changing the password revokes all existing sessions.

| Method | Path                              | Notes                                            |
|--------|-----------------------------------|--------------------------------------------------|
| POST   | `/api/admin/auth/login`           | Email + password → access token + refresh cookie. Rate limited: 10 / 15 min. |
| POST   | `/api/admin/auth/refresh`         | Rotates the refresh cookie for a new access token. Rate limited: 10 / 15 min. |
| POST   | `/api/admin/auth/logout`          | Revokes the current session                       |
| POST   | `/api/admin/auth/change-password` | Current + new password; revokes **all** sessions  |
| GET    | `/api/admin/auth/me`              | Current admin profile                             |
| GET    | `/api/admin/contacts`             | Contact list with `status`, `page`, `limit`, search |
| GET    | `/api/admin/contacts/:id`         | Single contact                                    |
| PATCH  | `/api/admin/contacts/:id/status`  | Update contact status (`new`/`read`/`replied`/`archived`) |
| DELETE | `/api/admin/contacts/:id`         | Delete a contact message                          |
| GET    | `/api/admin/contacts/stats`       | Contact statistics                                |
| GET    | `/api/admin/comments`             | All comments, with `postSlug`/`search` filters    |
| GET    | `/api/admin/comments/:id`         | Single comment                                    |
| DELETE | `/api/admin/comments/:id`         | Delete a comment (decrements post counter)        |
| GET    | `/api/admin/comments/stats`       | Comment statistics                                |
| GET    | `/api/admin/newsletter`           | Subscriber list with `page`, `limit`, `status`, `search` |
| GET    | `/api/admin/newsletter/:id`       | Single subscriber                                 |
| PATCH  | `/api/admin/newsletter/:id/unsubscribe` | Mark a subscriber unsubscribed               |
| DELETE | `/api/admin/newsletter/:id`       | Delete a subscriber                               |
| GET    | `/api/admin/newsletter/stats`     | Subscriber statistics                             |
| POST   | `/api/admin/posts`                | Create post (cover uploaded to Cloudinary)        |
| GET    | `/api/admin/posts`                | List posts incl. drafts, with filters + pagination |
| GET    | `/api/admin/posts/:id`            | Full post incl. `body`                            |
| PUT    | `/api/admin/posts/:id`            | Update post by id                                 |
| DELETE | `/api/admin/posts/:id`            | Delete post, **cascades** to its comments + interactions |
| GET    | `/api/admin/projects`             | Project list with filters                         |
| GET    | `/api/admin/projects/:id`         | Single project                                    |
| POST   | `/api/admin/projects`             | Create project (cover uploaded to Cloudinary)     |
| PUT    | `/api/admin/projects/:id`         | Update project by id                              |
| DELETE | `/api/admin/projects/:id`         | Delete project                                    |
| PATCH  | `/api/admin/projects/reorder`     | Reorder projects (`[{ id, order }]`)              |
| POST   | `/api/admin/uploads/image`        | Upload image to Cloudinary, returns safe metadata |
| DELETE | `/api/admin/uploads/image`        | Delete a Cloudinary asset by `publicId`           |

## Tests

```bash
npm test                        # runs the full suite (node --test tests/*.test.js)
node --test tests/api.test.js           # integration tests (needs MongoDB)
node --test tests/admin-auth.test.js    # admin auth tests
node --test tests/admin-content.test.js # admin CMS tests
node --test tests/email.test.js         # email subsystem tests (no DB needed)
```

The integration suite runs against a dedicated database
(`ghostcode_dynamics_test`, derived from `MONGO_URI`). It uses the built-in
`node:test` runner plus the global `fetch`, needs no test framework install,
and self-clears its data after each test. It never writes to the production
database.

The email tests verify SMTP configuration handling, template generation,
and service behavior with mocked transports — no real emails are sent.

## Health check

```
GET /api/health
```

Response `200 OK`:

```json
{
  "status": "ok",
  "service": "GhostCode Dynamics API",
  "uptime": 12.34,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "smtp": "configured",
  "database": {
    "enabled": true,
    "connected": true,
    "state": "connected"
  }
}
```

The `smtp` field is `"configured"` when SMTP credentials are present, or
`"unconfigured"` when email sending is disabled. Credentials are never exposed.

The `database` block reports whether Mongo is enabled and connected. When
`MONGO_URI` is set but the connection is down, the status degrades to
`"degraded"` (the server keeps running for health checks).

## Database connection

- Startup connects to MongoDB (via `MONGO_URI`) **before** the HTTP server
  starts listening. If a configured connection fails, startup aborts with a
  non-zero exit code.
- If `MONGO_URI` is absent, the server starts in database-disabled
  (health-only) mode with a warning.
- Graceful shutdown disconnects the database before exit.
- Connection strings and credentials are never logged; only the host and
  database name are printed after a successful connection.
- For `mongodb+srv://` URIs in non-production environments, if the machine's
  default DNS resolver cannot answer SRV queries (a known issue on some
  Windows networks), the connection is retried via public resolvers
  (`8.8.8.8`, `1.1.1.1`).
