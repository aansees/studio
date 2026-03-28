# Ancs Studio

Production-oriented agency project management platform built with Next.js 16, Better Auth, Drizzle ORM, MySQL, Upstash Redis/Realtime, Nodemailer, React Email, and shadcn/ui components.

## Stack

- Next.js `16.1.6`
- React `19.2.3`
- Better Auth (`email/password`, social providers, passkey, 2FA)
- Drizzle ORM + MySQL (`mysql2`)
- Upstash Redis + Upstash Realtime
- Nodemailer + React Email
- Tailwind CSS + shadcn/ui component architecture

## Roles and Access Model

Single login page with role-based access:

- `admin`
  - Full platform management
  - Create projects/tasks, assign members, manage team roles
  - Can create developer accounts and convert client to developer
- `developer`
  - Sees assigned projects/tasks
  - Can update status for tasks assigned to self
  - Can chat only in authorized task rooms
- `client`
  - Read-only project visibility for own projects
  - Can track progress and participate in authorized chat

Hard rule:

- Admin cannot be created from public signup.
- Admin bootstrap is seeded from environment variables.

## System Flow

1. User authenticates through Better Auth (`/api/auth/[...all]`).
2. Route protection runs in [`proxy.ts`](./proxy.ts).
3. Server APIs enforce role/session checks with [`requireApiSession`](./lib/session.ts).
4. Core entities:
   - `project`, `projectMember`, `task`, `taskComment`, `taskChatMessage`, `notification`
5. Chat flow:
   - POST message -> validate access -> rate limit -> enqueue to Redis + emit realtime
   - Redis buffered messages are flushed to MySQL in batches
6. Notifications:
   - Triggered on role upgrades, project assignment, task assignment/completion, project completion

## Local Setup

### 1. Environment

```bash
cp .env.example .env
# PowerShell
Copy-Item .env.example .env
```

Required before testing:

- `BETTER_AUTH_SECRET` (use strong random >= 32 chars)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DATABASE_URL` (or MySQL docker vars)

Optional but recommended:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CHAT_FLUSH_API_KEY`
- SMTP provider variables

### 2. Database + Admin Bootstrap (Docker)

```bash
docker compose up -d
docker compose logs -f mysql-init
```

What docker does:

- Starts MySQL 8.4 with persistent volume
- Waits for MySQL to become healthy, then runs tracked Drizzle migrations
- Runs one-shot admin seed (`bun run seed:admin`)

If you need a clean DB re-initialize:

```bash
docker compose down -v
docker compose up -d
```

### 3. Run App

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

## Commands

```bash
bun run dev
bun run build
bun run lint
bun run db:generate
bun run db:migrate
bun run db:push
bun run db:studio
bun run seed:admin
```

## Delivery Status

### Completed

- Better Auth integration with role model and single login flow
- Passkey + 2FA plugin wiring
- Drizzle schema for auth + project management domain
- Role-based APIs for projects/tasks/team/notifications/chat
- Redis-buffered realtime task chat + flush endpoint
- Dashboard migrated from dummy data to real role-aware DB data
- Dockerized MySQL initialization and admin bootstrap
- Next.js 16 route interception updated to `proxy.ts`

### Remaining

- assistant-ui thread renderer as default chat UI (current chat is custom realtime panel)
- Integration tests for role boundaries and critical flows
- Audit logging for role/task mutations
- Broader API-level abuse protection beyond chat message rate limit
- Replace scheduling stubs with real backend logic

## Security Assessment (2026-03-05)

### Performed Checks

- Dependency vulnerability scan (`bun audit`)
- Route-level authorization review for all API handlers
- Chat flow abuse and validation review
- Error-response exposure review

### Issues Found and Fixed

1. Critical dependency vulnerability in `swiper` (prototype pollution)
   - Action: removed unused `swiper` dependency.
2. High-risk dependency chain via unused `shadcn` CLI package (`@modelcontextprotocol/sdk`, `hono`, etc.)
   - Action: removed unused `shadcn` package.
3. Chat abuse risk (no message rate limiting)
   - Action: added rate limiter (`lib/security/rate-limit.ts`) and enforced in task chat POST.
4. Chat reply integrity gap (reply target not validated)
   - Action: added server-side validation for `replyToMessageId` existence in task context.
5. Internal error message leakage risk
   - Action: hardened [`errorResponse`](./lib/http.ts) with status inference, Zod 422 handling, and safer production behavior.
6. Flush endpoint misconfiguration risk
   - Action: `CHAT_FLUSH_API_KEY` now required in production mode for `/api/chat/flush`.
7. Realtime room predictability
   - Action: hardened task room IDs with secret-derived fingerprint.

### Remaining Security Items

- Add rate limiting for more write endpoints (tasks/projects/team)
- Add audit trail table and immutable event records for privileged actions
- Add stronger bot/abuse controls (e.g., IP+user composite limits, anomaly rules)
- Add e2e authz tests to prevent regression in role enforcement

### Current Audit Snapshot

After fixes, `bun audit` reports only dev-tooling/transitive issues:

- `minimatch` via eslint toolchain (dev-time)
- `ajv` via eslint toolchain (dev-time)
- `esbuild` via drizzle-kit (dev-time)

These are not part of runtime request handling in production app server paths.

## Code Cleanup Applied

- Removed obsolete markdown files and consolidated project reporting into this README only.
- Removed unused project doc file under `app/_components/guide.md`.
- Removed unused high-risk dependencies from `package.json`.

## Notes

- Do not use weak `BETTER_AUTH_SECRET` in production.
- Keep `CHAT_FLUSH_API_KEY` configured in production.
- Ensure DB and auth secrets are managed outside source control.
