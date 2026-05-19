# Project Review Report

Date: 2026-05-16  
Repo: `C:\Dev\admin12121\@26\agency`

## Scope

Reviewed the current Next.js/Better Auth/Drizzle project for leftover work, broken flows, security concerns, UI/UX mismatches, and error-handling problems. This is a code-level audit; browser/runtime verification is blocked until dependencies are installed.

## Verification Status

- `bun run lint` failed because `node_modules` is missing and `eslint` is not available.
- `bun run build` failed because `node_modules` is missing and `next` is not available.
- Existing dirty file was not touched: `app/login/page.tsx` only removes unused imports.
- No existing `report.md` was present.

### Implementation Update: 2026-05-17

Status after fixes:

- `bun run tsc --noEmit` passes.
- `bun run build` passes.
- `bun run lint` exits successfully with existing warnings only.
- Added generated migration `drizzle/0001_pale_vengeance.sql`; run the normal DB migration before deploying the booking/proposal changes.

Completed from this report:

- Proposal submission no longer creates an orphan consultation first. The UI keeps the same screens, but the consultation selection is held only in browser state until final submit.
- Client proposal submit now creates the project, project members, first-class booking link, and confirmed booking inside one Drizzle transaction.
- Added `booking.projectId`, a unique project link, and an owner/time/status index for safer booking integrity and lookup.
- Booking creation now rechecks active overlap inside the same transaction before insert, reducing the double-booking race.
- Added typed `AppError` handling so safe business errors remain visible in production.
- Added public/no-account booking backend routes: `GET/POST /api/bookings/public` and `GET /api/bookings/public/slots`, with guest policy enforcement from event type settings.
- Added rate limiting to proposal/project creation, client booking routes, public booking routes, team creation, profile update, and booking app mutation routes.
- Decoupled notification email delivery from core mutations; DB notification creation can succeed even if email delivery fails.
- Bulk task status updates now go through `bulkUpdateTaskStatusAsAdmin`, recalculate project progress, and emit completion notifications consistently.
- Connected app API responses no longer expose access/refresh token columns.
- Fixed proposal booking toggle accessibility state and labels without changing the visual layout.
- Fixed lint errors found during verification, including two existing React effect lint violations and one prefer-const issue.

Still intentionally not completed in this code-only pass:

- Real Google/Outlook/Zoom OAuth, external busy-time reads, generated meeting links, and calendar invite creation are still not implemented. This requires provider credentials, OAuth callback flows, token encryption/rotation policy, and product decisions about failed provider sync behavior.
- Visible copy that promises email/calendar invitations and the static contact/connect CTA were not changed because the current request explicitly said not to change the UI.

## Executive Summary

The biggest unfinished area is the Cal.com-like booking/proposal flow. The database and admin UI expose many scheduling concepts, but the frontend/backend behavior is only partially wired: booking is authenticated-client-only, external calendar/conferencing flags are stored but not executed, guest booking toggles are not honored by public routes, and proposal creation is not atomic with booking.

The known issue is valid in substance. In the current code, the consultation booking is created first, then the project proposal is submitted. If the user books a consultation and closes the page before submitting the proposal, the confirmed booking remains without a linked project. This is the same class of broken two-step flow, even if the order is currently booking-first rather than proposal-first.

## Critical / High Priority Findings

### 1. Proposal and consultation are not one atomic flow

Evidence:
- The UI first calls `POST /api/bookings/client` in `bookConsultation()` and stores `bookedConsultation` in component state.
- The proposal is submitted later through `POST /api/projects` with `bookingId`.
- Files: `components/layout/dashboard/project-proposal-form.tsx:587-618`, `components/layout/dashboard/project-proposal-form.tsx:549-577`.

Impact:
- If the user books a slot and closes the tab before pressing "Submit proposal", the booking remains confirmed.
- Admin sees a real meeting, but no project/proposal exists.
- The booked slot blocks future availability because internal booking conflict checks read existing confirmed bookings.

Recommended fix:
- Make submission a single server transaction: create or reserve the booking and project together.
- Alternative: create booking as `pending_proposal` or `hold`, expire it automatically if no proposal is created, and only confirm it after proposal creation succeeds.

### 2. Project proposal creation itself is not transactional

Evidence:
- `createProjectProposalAsClient()` inserts `project`, then inserts `projectMember`, then updates `booking.internalNotes`.
- There is no `db.transaction`.
- Linking is done through a string tag in `booking.internalNotes`, not a first-class `projectId`/proposal FK.
- File: `lib/services/projects.ts:520-565`.

Impact:
- Failure after project insert can leave a project without members or without a booking link.
- Duplicate/partial state is possible if retry behavior crosses the tag update.
- The proposal-booking relationship is hard to query, validate, and repair.

Recommended fix:
- Add a real `projectId` or `proposalId` column on `booking`, or a join table.
- Wrap project insert, member insert, and booking link update in one transaction.
- Enforce one project per booking at DB level.

### 3. Public/no-account booking is not implemented despite UI/schema toggles

Evidence:
- `app/api/bookings/client/route.ts` requires `requireApiSession(["client"])` for both listing bookable event types and creating bookings.
- `app/api/bookings/client/slots/route.ts` also requires `requireApiSession(["client"])`.
- The event type editor exposes `Allow guest bookings`, `Require login`, and `Require email verification`.
- Files: `app/api/bookings/client/route.ts:11-25`, `app/api/bookings/client/slots/route.ts:8-20`, `components/layout/dashboard/booking-event-type-editor.tsx:995-1017`.

Impact:
- Normal no-account users cannot use the booking flow.
- Admin settings imply guest booking support, but backend routes ignore it.
- `allowGuestBookings`, `requireLogin`, and `requireEmailVerification` are currently product promises, not enforced booking policy.

Recommended fix:
- Decide the product rule: proposal requires account, or guest booking/proposal is supported.
- If guests are supported, add public routes with attendee name/email validation, email verification where required, abuse controls, and manage-token based cancel/reschedule.
- If guests are not supported, remove or disable the guest-related toggles.

### 4. External calendar/conferencing integration is mostly placeholder state

Evidence:
- Schema stores `bookingAppConnection.accessToken`, `refreshToken`, `canCheckConflicts`, `canCreateEvents`, `booking.externalCalendarEventId`, and `booking.externalMeetingId`.
- UI exposes "Supports calendar sync", "Use for conflict checking", and "Use for event creation".
- Slot conflict checks only query internal `booking` rows.
- `meetingUrl` is set from static location value for `google_meet`/`zoom`; no meeting is generated.
- Files: `lib/db/schema.ts:575-597`, `components/layout/dashboard/booking-apps-manager.tsx:301-315`, `lib/services/bookings.ts:1817-1833`, `lib/services/bookings.ts:2200-2231`.

Impact:
- Admin can configure connected apps, but no OAuth sync or provider API behavior is present.
- External busy times are not checked.
- Calendar events and Google Meet/Zoom links are not created.
- `externalCalendarEventId` and `externalMeetingId` remain unused.

Recommended fix:
- Either complete provider integrations or clearly label these as manual placeholders.
- Store provider tokens encrypted, add refresh handling, and implement conflict/destination calendar sync before presenting this as Cal.com-like behavior.

### 5. Double booking race condition

Evidence:
- Slot availability is computed by reading existing bookings.
- `createBookingForClient()` recomputes slots and then inserts a booking, but there is no DB lock, transaction isolation guard, or uniqueness constraint for `(ownerUserId, startsAt, endsAt/status)`.
- Files: `lib/services/bookings.ts:1817-1833`, `lib/services/bookings.ts:2176-2201`.

Impact:
- Two clients can potentially book the same slot concurrently if both pass slot recomputation before either insert becomes visible.

Recommended fix:
- Add a transaction-safe booking guard.
- Use a DB uniqueness/locking strategy for active bookings per owner/time range.
- Recheck conflicts under the same transaction that creates the booking.

## Medium Priority Findings

### 6. Error handling hides useful business errors in production

Evidence:
- `errorResponse()` maps most plain `Error` objects to status `400`.
- In production, status `400` returns the generic fallback `"Request failed"`.
- Most services throw plain `Error`, including booking and proposal validation errors.
- Files: `lib/http.ts:30-60`, `lib/services/bookings.ts:2169-2186`, `lib/services/projects.ts:479-504`.

Impact:
- Users may see vague errors for recoverable cases like unavailable slots, unavailable event type, or booking ownership mismatch.
- Frontend toasts become inconsistent and hard to act on.

Recommended fix:
- Introduce typed application errors with explicit status, public message, and internal code.
- Keep user-safe business errors visible in production.
- Log server details separately with request IDs.

### 7. Connected app tokens are stored as plain longtext

Evidence:
- Better Auth account tokens and booking app connection tokens are stored in `longtext`.
- Files: `lib/db/schema.ts:189-204`, `lib/db/schema.ts:575-597`.

Impact:
- A database leak exposes OAuth/calendar tokens directly.
- This becomes higher risk once real calendar integrations are implemented.

Recommended fix:
- Encrypt external provider tokens at rest using envelope encryption or a managed secret/KMS strategy.
- Store minimal scopes and rotate/delete tokens on disconnect.

### 8. Critical mutations are coupled to email delivery

Evidence:
- `createNotification()` inserts a DB notification and then awaits Resend email.
- Project creation, task creation, task completion, and role changes await notification/email after database mutation.
- Files: `lib/notifications.ts:22-44`, `lib/services/projects.ts:407-448`, `lib/services/tasks.ts:253-275`.

Impact:
- If Resend fails after DB mutation, the API can return an error even though the project/task/role change already happened.
- Users may retry and create duplicate or confusing changes.

Recommended fix:
- Decouple email into an outbox/job queue.
- Make the primary business mutation succeed or fail independently from notification delivery.

### 9. Rate limiting is incomplete

Evidence:
- Rate limiting exists for task chat and project chat only.
- README also lists broader API abuse protection as remaining work.
- Files: `app/api/tasks/[taskId]/chat/messages/route.ts:41-55`, `app/api/projects/[projectId]/chat/messages/route.ts:60-74`, `README.md`.

Impact:
- Project creation, booking creation, team invite, profile, and auth-adjacent write routes lack app-level throttling.
- Guest booking, if added, would need strong IP/email/user rate limits.

Recommended fix:
- Add composite rate limits for proposal creation, booking slot lookup, booking creation, team invites, and profile/security mutations.

### 10. Bulk task status update bypasses shared task update logic

Evidence:
- `app/api/tasks/bulk/route.ts` updates task status directly through `db.update(task)` instead of `updateTaskWithPermissions`.
- It does not recalculate project progress and does not emit completion notifications.

Impact:
- Dashboard progress can become stale after bulk updates.
- Bulk "done" behavior differs from single-task "done" behavior.

Recommended fix:
- Route bulk status updates through a shared service that recalculates affected projects and handles notifications consistently.

## UI / UX Findings

### 11. Proposal booking controls advertise behavior that does not exist

Evidence:
- The proposal flow has an "Overlay my calendar" switch.
- It only changes local unavailable-cell styling; it does not connect to any user calendar.
- File: `components/layout/dashboard/project-proposal-form.tsx:861-870`.

Impact:
- Users can believe real calendar overlay/conflict integration is active when it is not.

Recommended fix:
- Remove the switch until real calendar overlay exists, or rename it to a truthful display option.

### 12. Accessibility labels are copied from alignment controls

Evidence:
- The 12h/24h and view toggle buttons use labels like `Align left`, `Align center`, `Align right`, and `Toggle center`.
- File: `components/layout/dashboard/project-proposal-form.tsx:872-975`.

Impact:
- Screen readers announce incorrect commands.
- Automated accessibility testing will flag misleading labels.

Recommended fix:
- Use labels such as `Use 12-hour time`, `Use 24-hour time`, `Monthly view`, `Weekly view`, `Column view`.
- Bind toggle selected state to actual React state instead of uncontrolled `defaultValue`.

### 13. Booking confirmation promises email/calendar invite without implementation evidence

Evidence:
- UI says an email with a calendar invitation was sent after booking.
- `createBookingForClient()` creates a DB row but does not call email or calendar provider APIs.
- Files: `components/layout/dashboard/project-proposal-form.tsx:692-813`, `lib/services/bookings.ts:2200-2256`.

Impact:
- User expectations diverge from actual behavior.

Recommended fix:
- Send a real confirmation email and calendar invite, or change the copy until integration exists.

### 14. Contact/connect page has no action path

Evidence:
- `app/(app)/(client)/connect/page.tsx` is static contact info and image content.
- No form, booking CTA, proposal CTA, or API integration is present.

Impact:
- Public users have no direct path into the proposal/booking system unless they already know to sign in and navigate the dashboard.

Recommended fix:
- Add a clear CTA to start proposal/booking, or intentionally keep it static and route all intake through authenticated dashboard.

## Security Notes

- Auth/role checks are generally present on protected API routes reviewed.
- Admin creation is still environment-seeded, and web role change blocks granting admin role.
- `.env` is ignored by `.gitignore`, and current `.env` is not tracked.
- The main security gaps are incomplete rate limiting, missing audit logs, plaintext external provider tokens, and the absence of transactional integrity around critical multi-write flows.

## Recommended Fix Order

1. Redesign proposal + booking as one atomic backend operation or introduce expiring booking holds.
2. Add a first-class booking-to-project/proposal link and wrap proposal creation in a transaction.
3. Decide and implement the guest/no-account booking policy.
4. Remove or complete placeholder calendar/conferencing controls.
5. Add transaction/locking protection against double booking.
6. Replace generic error handling with typed public application errors.
7. Decouple email delivery from core mutations.
8. Add rate limiting and audit logs to privileged/write-heavy routes.
9. Install dependencies and run `bun run lint`, `bun run build`, and route-level tests.

## Suggested Test Cases

- Client books a consultation and closes before proposal submit: booking should expire or remain unconfirmed.
- Client submits proposal with booking: project, members, booking link, and notification should commit together.
- Two clients try booking the same slot concurrently: only one succeeds.
- Guest/no-account user opens booking page: behavior should match event type policy.
- Event type has `allowGuestBookings=false`: guest route must reject.
- Event type has `requireLogin=true`: unauthenticated booking must redirect/reject.
- Event type has calendar conflict connection: external busy times must block slots.
- Calendar event creation failure: booking/project should not silently lie about calendar invite.
- Production error for unavailable slot: user sees a clear, safe message.
- Bulk task status update to done: project progress and notifications match single-task update.
