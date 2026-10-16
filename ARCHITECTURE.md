# PartnerHub Architecture

## Hosted classroom-demo architecture, 2026-10-16

The current owner authorizes a hosted demo using the existing typed frontend services and a browser-local simulated database. `npm run build:demo` explicitly enables `NEXT_PUBLIC_PARTNERHUB_DEMO=1`; `vercel.json` selects this command for the classroom deployment. Normal `npm run build` still defaults to the non-demo configuration. This is not a working production authentication or PostgreSQL backend.

`src/mocks/demo/router.ts` applies role, status, ownership, lifecycle and registration-window rules to the in-tab dataset. `src/mocks/demo/reporting.ts` connects proposal decisions and accepted requests to sponsor commitments and reviewed evidence. Event lifecycle readiness lives in `src/features/event/lifecycle.ts`; the UI and simulated service use the same rules. Event report transport is declared in `src/contracts/event-report.ts`. Attendance supports NONE, ENTRY and ENTRY_EXIT with repeat-safe first timestamps; exit requires entry.

Data lives in versioned sessionStorage and a memory cache. Switching seeded roles changes the acting session without discarding event data. Reset removes the dataset. Browsers and tabs do not share a real database, secrets are not secure in client code, and this demo must use fictional personal information. For actual deployment to customers, the backend requirements in the remainder of this document still apply.

## Architecture goals

PartnerHub supports a complete event flow from setup through post-event sponsor evidence. The target first version adds reusable participant profiles and committee recruitment to the existing event, QR attendance, and sponsorship foundation.

Architecture priorities are data minimization, event-scoped authorization, opaque QR tickets, repeat-safe attendance, explicit application states, and recoverable sponsorship records. It does not optimize for payment processing, a national marketplace, live collaboration, or enterprise multi-tenancy.

## Delivery status

### Connected frontend revision, 2026-10-05

**In progress**. Approved frontend authentication uses email/password with email verification, password recovery and optional display name. Required credentials are email and password (new passwords 12–128 characters). The backend provider, credential hashing implementation, cookie lifetime, recovery/verification token lifetime, deletion/retention rules and email delivery are not implemented or finalized. No account schema changes are authorized in this task.

Typed transports live in `src/contracts/account.ts` and `src/contracts/event.ts`. Feature services call `src/lib/api-client.ts`; UI components do not fetch. Shared React Context owns session checks, expiry refresh, cross-tab invalidation and frontend guards. Cookies must be Secure/HttpOnly/SameSite with server-side origin/CSRF defenses. No session/password/profile records go into browser storage. Missing APIs produce visible errors rather than fixture substitution.

App Router provides landing, login/register, forgot/reset password, verification, onboarding, dashboard, settings and event create/detail/edit routes. `src/app` composes features; dashboard receives the event-list loader through its adapter. Features do not import one another. Shared frontend typography reuses existing licensed local fonts.

API requests use same-origin credentials, no-store, a 15-second timeout, abort signals, normalized error envelopes `{error:{code,fields?}}`, and typed/validated success responses. Session API returns 401 for guests; missing routes are service failures, not guest sessions. Protected 401 responses invalidate frontend session state. `next` accepts only internal dashboard/events/settings destinations.

Event draft creation requires a valid title; omitted schedule/capacity stay null. Existing persistent schema cannot represent these incomplete drafts, so schema/backend compatibility is a separate infrastructure prerequisite. Idempotency keys protect creation/uploads; revisions protect edits. Upload metadata is not proof of server image safety. API-backed and browser-only saves must be explicitly distinguished.

Frontend contracts and `TODO(backend)` comments are integration requirements, not implemented server behavior. Password recovery must use neutral responses, single-use expiring tokens and revoke prior sessions. Verification must confirm ownership before event-management access. Retention/deletion/export and consent decisions block real-data release.

The repository currently contains a Next.js scaffold and a Prisma model for the earlier anonymous-registration foundation. The Venture Creation direction now requires accounts, reusable profiles, committee recruitment, and configurable attendance. Those model and implementation changes are **In progress**.

`prisma/schema.prisma` is authoritative for what is implemented. Sections labelled target describe approved design, not committed behavior.

## Technology stack

| Layer | Decision | Reason |
| --- | --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript | One typed application for pages and server endpoints |
| Styling | Tailwind CSS 4 | Consistent interface implementation in the existing stack |
| Validation | Zod | Explicit validation at every server boundary |
| Persistence | Supabase-hosted PostgreSQL | Transactions for capacity, duplicate registration, and scan invariants; actual project connection is In progress |
| ORM and migration | Prisma | Typed schema, migrations, and relational integrity |
| Authentication | Approved email/password frontend; backend **In progress** | Verified email, cookie sessions, emailed recovery; event-scoped access without a global role |
| QR generation | Server-side library, **In progress** | Keep opaque payload generation off public page state |
| Deployment | **In progress** | Hosting follows authentication, privacy, and data-region review |

## Application shape

```text
Browser
  public event and recruitment pages
  account, reusable profile, registration, and ticket views
  organizer event, committee, attendance, and sponsorship views
        |
Next.js App Router
  page composition and Route Handlers
        |
Server-only feature services in src/backend
  account | event | registration | committee | attendance | sponsorship
        |
Prisma repository boundary
        |
PostgreSQL
```

Server Components render initial pages. Client Components are limited to interactive forms, QR scanning, and immediate validation feedback. Route Handlers own mutation transport and delegate business logic to `src/backend`. Page components do not access Prisma. Frontend feature modules never import backend modules; they use API routes for data access.

## Folder ownership

| Path | Responsibility |
| --- | --- |
| `src/app` | Routes, layouts, page composition, and Route Handlers |
| `src/features/<feature>` | Frontend components, client state, and API calls owned by one feature |
| `src/features/workspace` | Existing foundation homepage |
| `src/backend/<feature>` | Server-only validation, authorization, lifecycle rules, and Prisma operations |
| `src/backend/health` | Existing static health response, not a database health check |
| `src/backend/shared` | Reserved shared server infrastructure, added only when needed |
| `src/contracts` | Typed account/session and event/asset transport contracts |
| `src/lib` | Shared frontend-safe utilities, added only when needed |
| `prisma` | Canonical implemented schema, migrations, and development seed |
| `tests` | Unit, integration, route, and end-to-end tests |

Target folders do not count as implemented until code and tests exist.

### Parallel feature ownership

Product feature names are `account`, `event`, `registration`, `committee`, `attendance`, and `sponsorship`. Each has separate frontend and backend folders. Feature folders currently contain ownership documentation, not working product services.

Before editing, an agent must ask which feature and which layer the user wants to develop, obtain confirmation, and list allowed files. Changes stay within that feature, its tests, and explicitly approved route adapters. Another feature's internals must not be imported. Shared contracts and cross-feature integration require approval before implementation.

ESLint rejects direct frontend/backend imports and imports of other named feature internals. `npm run test:boundaries` checks representative allowed and rejected imports. These checks are architectural guardrails, not a filesystem sandbox; root `AGENTS.md` additionally requires reviewing changed paths against the agreed scope.

Schema, migrations, package files, environment, root documents, shared layouts/styles, and shared utilities remain coordinated infrastructure ownership. Use separate feature branches and isolated checkouts for concurrent workers. Keep the homepage and `/api/health` response unchanged during this restructuring.

### Supabase boundary

Supabase is selected only as managed PostgreSQL. Prisma connects from server code with database credentials. No Supabase SDK, Auth, public database API, or Edge Functions are introduced. Authentication remains an open decision. Do not expose database connection strings or privileged keys to the browser. SQL roles/grants and any Supabase Data API exposure require security review before real data is collected; server-only Prisma is not an RLS policy.

### Earlier browser-only event editor (superseded by connected frontend revision)

`src/app/page.tsx` composes the workspace and event builder through a ReactNode slot. Each feature retains its own implementation; there are no cross-feature internal imports or shared product models. The workspace keeps the builder mounted while changing views so unfinished input is preserved.

The owner clarified real use across multiple organizations. Event/organizer/sponsor-display identity comes from user input and uploaded raster logos, not a hard-coded organization or invented brands. This narrowly approved logo frontend is an exception to the earlier upload deferral; proposal, portfolio and evidence uploads remain deferred. No object-storage provider or server upload is implemented.

The event frontend explicitly saves one versioned record (details and logo blobs) in IndexedDB database `partnerhub-event-drafts`, store `drafts`, key `current`. Details include title, category, description, same-day date/start/end (WIB), venue, capacity and module booleans. Branding includes optional event/organization logos, organizer display name and up to six named sponsor-display entries. No account/participant data, ticket secrets or credentials are stored. A read falls back to an existing valid text-only localStorage `partnerhub:event-draft:v1` draft when no new record exists. The local UI format is not a Prisma model or shared production API contract.

Save atomically replaces the single IndexedDB record. Restoration validates version/details using the existing Zod parser, verifies branding shape/limits and decodes logo blobs before replacing current input. Invalid data is never silently loaded or deleted. Confirmed deletion removes the current IndexedDB record and the legacy draft key only. Storage failures preserve current input; controls prevent edits during storage operations. New assets are validated before replacing a valid logo, and local object URLs are revoked on replacement/unmount.

Browser upload rules: PNG/JPEG/WebP only, non-empty, maximum 2 MB per image, maximum 4096 pixels per axis. SVG/GIF are excluded. Image selection uses the native file picker or drag/drop. Display uses contain sizing with user-provided accessible names. These checks are UX guards, not server authorization, magic-byte inspection, quota protection or image sanitization. Backend requirements and proposed transport operations are in `todobackend.md`; storage, organization membership and schema/contracts need explicit approval before implementation.

This browser-only draft lasts until explicitly overwritten/deleted or browser storage is cleared. Shared-device users should delete it after use. Reload requires an explicit restore action; view switches preserve in-memory input. Saving does not publish, authorize, register, generate tickets, or activate services. Production date/timezone rules and backend validation remain separate future work; the prototype only handles same-day WIB schedules.

Display and body fonts are self-hosted inside workspace under their SIL Open Font Licenses; no visitor font requests go to a third-party CDN. Their CSS variables inherit through the composition slot; event code does not import workspace font files.

## Persistent model

### Current implemented schema

The existing schema contains:

- `Event`, `Registration`, `RegistrationQuestion`, `RegistrationAnswer`, and `AttendanceCheckIn`.
- `SponsorshipCampaign`, `SponsorOrganization`, `SponsorProspect`, and `SponsorBenefit`.
- `TimelineEntry`.

Current `Registration` records are anonymous. This no longer covers the full approved product scope.

### Target account and profile model

The next schema design must support an account with consented reusable profile data. It must not store a permanent account type such as participant, committee, or organizer. Authorization comes from relations to each event.

Frontend email/password verification and recovery are approved; email is required and display name optional. Backend provider, hashing/session/token policies, deletion and retention remain **In progress**. Password persistence must not be added without separate backend/schema approval.

### Target event access model

Event access must be relation-based:

- Organizer membership authorizes event management.
- Committee membership exists only after an application is accepted.
- Participant registration belongs to one account and one event.
- The same account may hold different relations in different events.

The existing management-secret design may remain for prepared demos, but it is not sufficient as the sole long-term authorization method once reusable accounts are introduced.

### Target registration and forms model

Reusable profile fields and event-specific answers must remain separate. Organizers can request only fields relevant to their event. Supported question types and free-text privacy rules remain **In progress**.

Registration must enforce one active registration per account and event. Ticket reference is display-safe. Ticket secret hash verifies QR proof.

### Target committee model

The minimum target records are:

- Event-owned committee divisions or jobdesks.
- One committee application per account and event.
- One or more ranked or selected division preferences.
- Event-specific application answers.
- Explicit decision status and decision time.
- Event-scoped committee membership created only from acceptance.

Portfolio evidence remains a URL in the first version. File storage is deferred.

### Attendance model

#### Approved frontend/demo ticket scan, 2026-10-06 (**In progress**)

`src/features/attendance` owns the scanner, local jsQR decoder and validated services. Thin route `/events/[id]/scan` uses `GET /api/events/:id/attendance` and `POST /api/events/:id/ticket-scans` with `{payload}`. DTOs live in `src/contracts/participation.ts`: `AttendanceBoard`, `TicketScan`, and nullable `Registrant.checkedInAt`. `TicketScan.attendance` is `RECORDED`, `ALREADY_RECORDED`, or `DISABLED`. Ticket QR remains `PH1.` plus the existing opaque 24-character secret; scanning is not public token-based access to personal data. The organizer's authenticated, approved account and event ownership are required before lookup.

jsQR reads bounded camera frames and local QR images, including browsers without BarcodeDetector. User-selected QR images are capped at 10 MB and downscaled to a 1600-pixel longest edge. Camera frames use a 960-pixel longest width and 250 ms decoding interval. Frames and file bytes are never submitted; only the decoded opaque payload is sent in a POST body, never a URL, log, or analytics event. Camera tracks stop on result, close, page hide, and unmount. Permission denial and image decode failure preserve retry controls.

The demo stores optional `checkedInAt` on the registration and treats a repeat as a stable first-entry read. This is not database atomicity or security. Production must hash secrets, authorize the event, validate the issued active registration, and commit the unique entry plus return detail in one transactional operation. Attendance-disabled scans return details without inserting entry. Registration and scanner lists share the returned first-entry time. Existing Prisma models and migrations remain unchanged; real service, route, concurrency, retention and deletion work is in `todobackend.md`.

An event needs an attendance mode. The first version supports `NONE` and `ENTRY_ONLY`. The existing `CheckInKind.EXIT` enum reserves a later extension, but exit attendance does not ship in the first version.

`AttendanceCheckIn` keeps a unique registration and kind pair for idempotence. A scan is rejected when attendance is disabled.

### Sponsorship model

`SponsorshipCampaign` belongs to an event. `SponsorOrganization` is reusable across campaigns. `SponsorProspect` joins a campaign and organization, then stores stage, proposal URL, notes, and next follow-up date. `SponsorBenefit` stores a commitment and evidence URL. Evidence counts as delivered only after verification.

Sponsor matching and automatic matching notifications are deferred. The first version does not require a sponsor account or two-sided marketplace.

#### Frontend contracts for committee and sponsor requests, 2026-10-06 (**In progress**)

The frontend owns transport types in `src/contracts/committee.ts` and `src/contracts/sponsor-offer.ts`, and service functions that validate every response with Zod. Each service function carries a `TODO(backend)` comment with the endpoint it expects. Nothing below is persisted in Prisma yet.

| Endpoint (expected) | Purpose | Authorization |
| --- | --- | --- |
| `GET /api/committee/openings` | Open recruitments of published events | Approved user account |
| `POST /api/committee/openings/:id/applications` | Apply (`divisionIds`, `motivation`, `answer`) | Approved user account, one active application per opening |
| `GET /api/me/committee-applications` | Own applications, status, organizer note | Current account only |
| `GET /api/events/:id/committee` | Opening, applicants, and the `allowed` moves per applicant | Event owner |
| `PUT /api/events/:id/committee/opening` | Create, update, open, or close the recruitment | Event owner, published event |
| `POST /api/events/:id/committee/applications/:applicationId/decision` | Move through the state machine; acceptance requires a note; notifies the applicant | Event owner |
| `GET /api/sponsors/directory` | Verified sponsor companies (`id`, `companyName`, `industry` only) | Approved organizer |
| `GET`/`POST /api/events/:id/sponsor-offers` | List and send organizer-initiated requests; notifies the sponsor | Event owner, published event for POST |
| `GET /api/events/:id/sponsor-proposals` | Incoming sponsor proposals for one event, newest first; existing proposal fields plus `sponsorName`, no account identifiers or contact details | Event owner; foreign and missing events return 404 |
| `GET /api/sponsor/offers` | Requests addressed to the signed-in sponsor | Approved sponsor |
| `POST /api/sponsor/offers/:id/response` | Accept or decline once; notifies the organizer | Addressed sponsor |

Rules the backend must enforce, not only the UI: event ownership on every organizer route (foreign events return 404), the state machine in the committee table above with 409 for invalid moves, a required note on acceptance, divisions unique per opening with stable ids across edits, one pending request per event and sponsor, and no applicant contact data in organizer views beyond the display name. Notifications are created in the same transaction as the state change.

The demo backend (`src/mocks/demo/router.ts`, build flag `NEXT_PUBLIC_PARTNERHUB_DEMO=1`) simulates these rules for presentations and tests only. It is not security and not a production fallback. Its stored data gains `openings`, `applications`, and `offers`; older session data without them is discarded and reseeded.

New frontend routes: `/committee` (user), `/events/[id]/committee` and `/events/[id]/sponsors` (organizer). `/committee` is added to the user area in `src/lib/navigation.ts`.

Organizer sponsorship overview at `/organizer/sponsorship` composes the event-list service through the route adapter, so the sponsorship frontend never imports event internals. Its two panels independently load outgoing requests (`sponsor-offers`) and incoming proposals (`sponsor-proposals`) for those authorized event ids. Responses are validated by feature services; no production demo fallback or new decision mutation is added. The per-event reads are aggregated client-side for this initial dashboard; a paginated organizer-level endpoint is deferred until list size requires it. **In progress**: the demo router implements the new owner-scoped read, but real backend persistence remains pending. This presentation change adds no Prisma model or state transition.

### Timeline

`TimelineEntry` records operational history. Once accounts are implemented, any actor reference must be optional and must not copy personal details into the message field.

## State transitions

| Entity | Allowed transitions |
| --- | --- |
| Event | `DRAFT` to `PUBLISHED`, `PUBLISHED` to `CLOSED`, `CLOSED` to `ARCHIVED` |
| Registration | Paid event: `PENDING` to `REGISTERED` (organizer confirms, capacity rechecked) or `REJECTED` (organizer rejects, optional reason max 200 characters); only `PENDING` can be decided. Free event: created as `REGISTERED`. `REGISTERED` to `CANCELLED`. A `REJECTED` participant may create a new registration. QR issuance applies to `REGISTERED` only. Payment proof images are personal data: visible only to the event owner and the uploader, never in a public URL or log. **In progress** (demo router only; backend endpoint `POST /api/events/:id/registrants/:registrationId/decision` and the Prisma enum are pending) |
| Committee application | `SUBMITTED` to `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`, or `WITHDRAWN`; `SHORTLISTED` to `INTERVIEW`, `ACCEPTED`, `REJECTED`, or `WITHDRAWN`; `INTERVIEW` to `ACCEPTED`, `REJECTED`, or `WITHDRAWN` |
| Sponsor prospect | Forward business decision, never arbitrary enum replacement |
| Sponsor benefit | `PLANNED` to `VERIFIED` |

State changes run in feature services. Route handlers must not accept unrestricted status replacement. Acceptance creates committee membership in the same transaction.

## Endpoint plan

The account/event frontend integration contract is specified in `todobackend.md` and typed feature services. Historical broader endpoint plan follows; each server endpoint remains **In progress** except `/api/health`.

| Method and path | Purpose | Guard |
| --- | --- | --- |
| `GET /api/health` | Deployment health | Public |
| `POST /api/accounts` | Create account | Public with abuse protection |
| `PATCH /api/profile` | Update reusable profile and consent | Authenticated account |
| `POST /api/events` | Create event | Authorized organizer flow |
| `PATCH /api/events/:id` | Edit or publish event | Event organizer membership or approved demo secret |
| `POST /api/events/:slug/registrations` | Create participant registration and ticket | Authenticated account, published event, window and capacity checks |
| `POST /api/events/:slug/committee-applications` | Submit committee application | Authenticated account and open recruitment |
| `PATCH /api/committee-applications/:id` | Move application through allowed states | Event organizer membership |
| `POST /api/events/:id/check-ins` | Record entry scan | Event staff authorization and ticket proof |
| `POST /api/events/:id/campaigns` | Create sponsorship campaign | Event organizer membership |
| `PATCH /api/prospects/:id` | Update sponsorship stage | Event organizer membership |
| `PATCH /api/benefits/:id` | Add evidence or verify benefit | Event organizer membership |

## Security and privacy

- Use cryptographically random session and ticket tokens. Store secure hashes where token replay from the database would be harmful.
- Never place a name, email, phone number, student identifier, event answer, or database identifier in the QR payload.
- Keep QR payload format limited to `ticketReference.secret` or an equivalent opaque token.
- Verify account session and event membership on every protected request.
- Query and return only fields required for the current action.
- Keep reusable profile data separate from event answers so consent and deletion can be handled correctly.
- Do not log passwords, session tokens, ticket secrets, full QR payloads, or personal form answers.
- Validate proposal, portfolio, and evidence URLs server-side. Render external links with safe `rel` attributes.
- Return generic scanner errors so invalid tickets do not reveal event, account, or registration details.
- Add rate limiting to authentication, registration, application, and scanner endpoints before public deployment.
- Define account deletion, event-data retention, and organizer export rules before collecting real participant data.

## Concurrency and failure handling

Capacity check, duplicate-registration check, registration creation, and ticket creation run in one database transaction. The transaction must prevent two requests from taking the final slot and prevent duplicate active registration for the same account and event.

Committee acceptance and membership creation run in one transaction. A retry must not create a second membership.

Entry check-in uses a unique constraint. A duplicate insert becomes `already checked in`, not a server error. Scanner retries remain safe.

If QR generation, database write, or response delivery fails, the system must not issue a ticket before the registration transaction commits. Ticket recovery needs an authenticated view rather than creating another registration.

## Environment contract

Current variables:

```bash
DATABASE_URL=
DIRECT_URL=
MANAGEMENT_SECRET_PEPPER=
QR_SECRET_PEPPER=
```

Authentication variables will be added only after the authentication approach is chosen. `.env.example` must list names without values. Secret values never enter Git.

For Supabase, take connection strings from the project's Connect panel. `DATABASE_URL` is the runtime PostgreSQL connection, direct or a Prisma-compatible Supavisor pooled connection. `DIRECT_URL` is the migration connection, using direct PostgreSQL where reachable or the session pooler when direct IPv6 is unavailable. Do not use a transaction pooler for migrations. Use the provider's SSL settings and Prisma 5 pooler parameters where required. Both variables must be present when running Prisma commands, even if they use the same direct connection locally.

No database project or migration has been applied by this restructuring. Existing non-Supabase PostgreSQL remains compatible by setting both URLs to its connection string. Rollback of hosting selection is an environment change; do not delete data or reset migrations.

## Testing strategy

| Layer | Minimum coverage |
| --- | --- |
| Unit | State transitions, authorization decisions, token helpers, QR parsing, and capacity calculation |
| Integration | Final capacity slot, duplicate registration, committee acceptance and membership, and duplicate scan constraints |
| Route | Invalid session, wrong event role, closed registration, forged ticket, invalid transition, and invalid evidence URL |
| End-to-end | Create and publish event, reuse profile, register, receive ticket, scan entry, submit and accept committee application, and verify sponsor benefit |

Import-boundary tests exist under `tests/architecture`. Product feature-level unit, integration, and end-to-end coverage remains **In progress**.

## Challenge review

### Likely failures

- Account or session design exposes more personal data than an event needs.
- One account receives a global role that does not fit its role in another event.
- Browser retries create duplicate registrations or applications.
- Time-zone conversion opens or closes registration at the wrong local time.
- Committee acceptance creates duplicate membership.
- QR screenshots are replayed.
- Capacity drifts when cancellation and registration are not transactional.
- Sponsor evidence URL points to removed or private content.
- Sponsor matching is built before organizer and sponsor demand is validated.

### Required safeguards

- Use event-scoped membership for authorization.
- Keep reusable profile and event-specific answers separate.
- Enforce uniqueness for registration, committee application, membership, and attendance records.
- Store event times in UTC and display an explicit event timezone.
- Keep ticket data opaque and verify it server-side.
- Leave benefit status `PLANNED` until manual verification.
- Defer matching, payment, file upload, and notification infrastructure.

### Explicitly not built yet

- Approved account and recovery implementation.
- Account and committee schema migration.
- Payment ledger, refunds, settlement, and transaction fees.
- Sponsor marketplace, automatic matching, and matching notifications.
- File storage, messaging, real-time subscriptions, analytics warehouse, generic workflow engine, or microservices.

One modular Next.js application plus PostgreSQL is sufficient for the current scope.

### Role-based accounts and demo mode, 2026-10-05

**In progress**. The owner approved three account roles chosen at registration: user, organizer, sponsor company. This supersedes the earlier rule against a permanent account classification. Event-level roles remain event-scoped.

- `Session.account.role` and `status` drive `src/lib/navigation.ts` (`homeFor`, `canAccess`, `destinationAfterAuth`) and `SessionGate`. Each role has its own area: `/me`, `/organizer` plus `/events/*`, `/sponsor`. Accounts under review may open only `/account/verification` and `/settings`. `/dashboard` only redirects to the role home.
- Registration is a multi-step wizard in `src/features/account/signup`. One flat value bag is shared by all roles, so name, email, phone and other shared fields survive a role switch. Role-only fields are cleared and documents must be uploaded again. Zod schemas per role and step are in `schemas.ts`. A draft without password or files is kept in `sessionStorage` and removed on success.
- Reusable form controls, validators and file inspection are in `src/lib/form`. File inspection reads the real file signature instead of trusting the browser MIME type. These are UX guards, not server inspection.
- The folder is named `signup` because the import boundary rule treats any path segment named like a product feature (`registration`) as that feature's internals.
- `src/mocks/demo` holds the fictional data, the in-browser router and the demo UI. It is loaded only through dynamic imports guarded by `process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"` in `api-client.ts`, `providers.tsx`, `account-page.tsx` and `email-verification.tsx`. A test fails if any other file imports it. `next.config.ts` pins the default to `"0"` (owner-approved change to that shared file). Checked by searching `.next/static` after separate builds: variable unset and `0` emit no demo strings; `1` emits three demo chunks. An earlier build without that pin emitted the chunks even with the guard false, which is why the pin exists.
- Demo data belongs to account IDs. The mock router filters by owner and refuses other roles and unapproved accounts, which simulates the backend. Accounts created with Register in a demo build start empty. Changes live in `sessionStorage` and "Reset data demo" removes them.
