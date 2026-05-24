# Ancs Studio

Production-oriented agency project management platform built with Next.js 16, Better Auth, Drizzle ORM, MySQL, local Redis realtime messaging, Resend, React Email, and shadcn/ui components.

## Stack

- Next.js `16.1.6`
- React `19.2.3`
- Better Auth (`email/password`, social providers, passkey, 2FA)
- Drizzle ORM + MySQL (`mysql2`)
- Local Redis for realtime fanout, short chat buffering, and replay windows
- Resend + React Email
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
   - Browser connects to authenticated `/api/realtime` SSE.
   - Redis pub/sub fans out live events with one shared subscriber per Next process.
   - Project chat writes to Redis first, broadcasts immediately, then the worker persists batches to MySQL.
   - Task chat persists attachment-backed messages before broadcast so attachment URLs are valid.
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

Recommended:

- `REDIS_URL`
- `CHAT_AUTO_FLUSH_INTERVAL_MS`
- `CHAT_FLUSH_BATCH_SIZE`
- `RESEND_API_KEY`
- `RESEND_FROM` (for example `Ancs Studio <noreply@ancsstudio.com>`)

### 2. VPS Docker Layout

```bash
docker compose up -d
docker compose logs -f web chat-worker nginx redis
```

What docker does:

- Runs Redis, Next.js, the chat worker, and Nginx.
- MySQL is expected to run on the VPS host. Use `host.docker.internal` in `DATABASE_URL`.
- The chat worker drains Redis project-chat buffers to MySQL without HTTP cron calls.

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
bun run chat:worker
bun run seed:admin
```

## VPS Production Notes

```bash
DATABASE_URL=mysql://agency:strong-password@host.docker.internal:3306/agency
REDIS_URL=redis://redis:6379
CHAT_AUTO_FLUSH_INTERVAL_MS=5000
CHAT_FLUSH_BATCH_SIZE=500
BETTER_AUTH_URL=https://ancsstudio.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://ancsstudio.com
```

Keep one `web` container on a 2 vCPU / 4 GB VPS unless you add sticky sessions or a shared SSE edge. Redis handles cross-process pub/sub, but each SSE connection still belongs to the web process that accepted it. Nginx disables buffering for `/api/realtime`.

## Delivery Status

### Completed

- Better Auth integration with role model and single login flow
- Passkey + 2FA plugin wiring
- Drizzle schema for auth + project management domain
- Role-based APIs for projects/tasks/team/notifications/chat
- Authenticated local realtime endpoint
- Redis-backed project chat fanout, buffering, and worker persistence
- Dashboard migrated from dummy data to real role-aware DB data
- Dockerized Redis, Nginx, Next.js, and chat worker layout
- Next.js 16 route interception updated to `proxy.ts`

### Remaining

- assistant-ui thread renderer as default chat UI (current chat is custom realtime panel)
- Integration tests for role boundaries and critical flows
- Audit logging for role/task mutations
- Broader API-level abuse protection beyond chat message rate limit
- Add production monitoring/alerting for chat worker failures

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
6. Realtime endpoint access risk
   - Action: `/api/realtime` verifies session and room access before opening SSE.
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
- Keep Redis, the chat worker, and Nginx SSE buffering settings enabled in production.
- Ensure DB and auth secrets are managed outside source control.
