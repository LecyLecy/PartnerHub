# PartnerHub Architecture

Updated: 18 October 2026. Current design and delivery status are consolidated here; conflicting earlier revision notes are superseded. Product intent and acceptance live in PRD.md. ARCHITECTURE-ESSETIALS.md is the quick reference.

## Runtime and delivery boundaries

PartnerHub is one modular Next.js application. Working frontend flows call typed feature clients through shared HTTP/session utilities. In the explicit demo build, the HTTP layer routes to browser-only services in src/mocks/demo and versioned in-tab sessionStorage. Fictional local records are not shared across independent browsers and are not production security or a real payment ledger.

NEXT_PUBLIC_PARTNERHUB_DEMO defaults to 0 in next.config.ts. Only flag-guarded dynamic imports load demo code; normal builds must not silently fall back to mocks. Use npm run build:demo for the classroom build. Preserve Ganti peran demo while application copy omits prototype/simulation/In progress notices. Technical documents must state the actual limits.

The production path remains App Router/Route Handler, server-only feature service, Prisma and PostgreSQL. Apart from the static /api/health response, production operational endpoints, account/session/email providers, secure asset storage and billing persistence remain In progress. Existing Prisma schema describes the earlier anonymous-registration foundation, not all current demo contracts. Never migrate it implicitly during documentation work.

## Current event and billing design

- No organization/workspace creation, switching, membership, cross-event overview or annual-only duplication product. The workspace directory and WorkspaceShell names are historical implementation names.
- Complete valid setup first, then save a private event service record under /organizer/archive. Internal DRAFT displays Siap diunggah, or Perlu dilengkapi for incomplete historical records. No charge at creation. Internal ARCHIVED is completed-event history, distinct from waiting uploads.
- Publication is an explicit guarded mutation. Validate readiness and coverage at submit, not just UI load. Only PUBLISHED events enter public/sponsor/participant discovery. Both summary-query and legacy edit URLs reject editing published details.
- Shared catalog: src/contracts/billing.ts. Starter is Rp149.000/event or Rp699.000/year, 300 participants and 3 managers including owner. Growth is Rp499.000/event or Rp1.499.000/year, 1.500 participants and 10 managers. Single-event upgrade is Rp350.000.
- Demo authority: src/mocks/demo/billing.ts. Request-supplied prices, owner IDs or expiry cannot override service decisions. Enforce approved/verified organizer, ownership and foreign-order rejection.
- eventBilling retains its versioned per-event orders, coverage and managers. Optional additive accountBilling contains SubscriptionOrder[] and AccountSubscription[]. Legacy organization billing remains unchanged/read-only; its annual history cannot grant new event rights.
- PackageOrder uses SINGLE; SubscriptionOrder uses ANNUAL, null eventId and no upgrade. Both have PENDING, SUCCEEDED or EXPIRED. Confirmation is separate from creation; pending expiry is 30 minutes.
- AccountSubscription contains ownerId, tier, orderId, startsAt and endsAt. One confirmed calendar-year term per owner; no stacking, automatic renewal or mid-term annual upgrade.
- At publication resolve the current owner's subscription, capacity, manager count and event end. Growth covers smaller Starter events. Event end must fit within the term; recheck expiry and limits on every mutation. A manager's own subscription is not the owner's entitlement.
- Covered upload creates no event order or zero-value transaction; reject duplicate event checkout/verification when covered. Existing pending/history amounts remain unchanged, not rewritten into fabricated payments.
- EventCoverage stores tier, source SINGLE/SUBSCRIPTION/LEGACY, orderId and optional subscriptionId. Pin subscription reference only after successful publication. Published coverage survives subscription expiry through event end plus 30 days; unpublished events need current rights. Expired event operations become read-only while historical records remain.
- BillingBoard returns only owner-scoped event/subscription orders, current subscription, events and historical records. One chronological history, no transaction archive disclosure.
- Subscription UI has exactly Starter, Growth and Custom cards. Contact uses /contact, no invented quote/SLA/email. Local SubscriptionCheckout dialog reuses billing services and shared confirmation; selection/dismissal alone creates no order. Preserve pending resume, expiry recovery, retry safety and focus restoration.
- Production atomic confirmation, entitlement persistence, real gateway, webhooks and refund/settlement rules are In progress. Do not add a second billing engine for these presentation flows.

## Public projection and matching

Public /explore and /explore/:id do not require application login. Return only published event/supporter fields. No public registrant counts/fill indicators, private answers/proof/contacts, QR secrets, proposal terms or private evidence URLs. Omit sponsor sections when empty; pending/declined proposals are not supporters. Elapsed published events leave discovery; closed/archived/unpublished records are unavailable. Missing schedules never imply ongoing status.

PublicEvent currently includes registeredCount/capacity in its DTO, but public UI must not render registration totals or capacity-fill indicators. Response minimization is a production review requirement, not a false claim that those fields already disappeared from the contract. Demo ticket forms support price 0; all seed prices being paid does not enforce a paid-only creation rule.

Matching reuses shared fields in src/contracts/matching.ts and src/lib/matching.ts. Organizer recommendations are event-scoped on Ajak sponsor. Sponsor industry is selected at registration and initializes the new account's matching profile; existing profiles retain their saved fields. Event matchingFields are selected in the creation form and stored atomically with creation in the existing demo eventMatchingFields map. GET event projections include these fields; PATCH rejects replacement or clearing, including before publication. Omission by older clients preserves saved fields. Both matching endpoints are read-only and reject former write methods. No editable matching/profile picker remains. A legacy sponsor without a profile may use only its known saved registration industry as a read-only fallback; unknown industry and untagged historical events stay unknown, without fabricated fields or reset. This is deterministic field overlap, not real AI or automatic notifications. Prepared sponsor accounts already have fields. Keep requests, proposals, commitments and evidence distinct; recommendations do not authorize a deal. Production persistence and server enforcement remain In progress.

Sponsor discovery (/sponsor and /sponsor/events), preferences (/sponsor/preferences) and progress (/sponsor/progress, /proposals, /benefits) mount separate task views using existing services. Organizer incoming proposals and outgoing invitations also have separate pages. No second progress store is introduced.

Organizer sponsor discovery is split into `/events/:id/sponsors` (matching recommendations and sent-request cards), `/organizer/sponsors` (full directory) and `/events/:id/sponsors/invite?sponsorId=...` (selected-company request form). The catalog sidebar link is stable across organizer pages. Optional eventId survives search and pagination; selection without event context first asks for an authorized published event. Never choose a default company/event or create a request while browsing. The catalog reuses GET /api/sponsors/directory, whose demo projection adds the same minimal image/field data as matching and excludes account contacts/documents. Demo pagination is client-side, six items per page, with query/page in the URL; production server-side pagination remains In progress. Event authorization and sponsor eligibility remain in existing services, and pending duplicate requests are rejected. Sent history remains sourced from getOfferBoard even if a sponsor no longer appears in the active directory; omit missing imagery rather than hiding the request or inventing a photo. Existing DetailRow dialogs and FollowUpForm are reused.

## Navigation and shared UI contracts

- src/lib/workspace-navigation.ts defines stable role destinations. Selected-event navigation renders above content, not inside the sidebar; links do not grant permission.
- Event nav contains summary, registration, committee, module-dependent QR/attendance, sponsorship invitation and managers. No Laporan & bukti, Paket acara or Edit detail subsection. Existing reports/evidence and compatibility URLs are retained.
- Event editing reuses the editor at /events/:id?edit=1 before publication. Summary displays actual coverage as Paket Starter/Growth.
- Account popup says Pengaturan. Settings retains profile editing, has no Back control and is the only navigation entry to organizer transaction history. /organizer/transactions stays guarded and its header Back returns to /settings.
- Shared footer owns /terms and /privacy links. No sidebar legal links or global search/command palette/Ctrl+K. Local list filters remain.
- Header Back uses existing explicit destinations and accessible arrow-only controls, never guessed browser history. Form step Back remains local.
- ConfirmationProvider supplies shared asynchronous custom confirmations. Cancel/Escape does not mutate; focus is contained and restored. In-app leave guards await consent; browser refresh/tab-close beforeunload is necessarily native.
- Shared role shell, consistent guest header, distinct canvas/sidebar/footer surfaces, bordered form groups and mobile drawer focus behavior remain required.
- Content is always presented in open, labeled sections, not accordion/details/summary controls. The shared Accordion component/export/styles are retired. FAQ uses static semantic sections; manager, applicant-answer, sponsor-detail, field-preference and package-feature controls stay in their existing feature/service boundary. Form selects, account/navigation menus and dialogs are unaffected.
- Event summary uses aligned status/title text, short labels mapped from publicationErrors and sequential detail/schedule/registration sections. Do not duplicate validation logic or alter payment/publication checks to simplify copy. tests/workspace coverage uses an AST check to prevent content-disclosure JSX from returning and isolated responsive browser checks for layout/actions/data preservation.
- Fixture catalogs are composed from src/mocks/demo/data. Bundled JPEG provenance is public/demo/photos/CREDITS.md. Compatibility upgrades preserve user changes/records, never fabricate activity or silently reseed QA data.

## Technology stack

| Layer | Decision | Reason |
| --- | --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript | One typed application for pages and server endpoints |
| Styling | Tailwind CSS 4 | Consistent interface implementation in the existing stack |
| Validation | Zod | Explicit validation at every server boundary |
| Persistence | Supabase-hosted PostgreSQL | Transactions for capacity, duplicate registration, and scan invariants; actual project connection is In progress |
| ORM and migration | Prisma | Typed schema, migrations, and relational integrity |
| Authentication | Approved email/password frontend; backend **In progress** | Verified email, cookie sessions, emailed recovery; account role and approval plus event-scoped ownership/membership |
| QR generation | Existing client encoder; production secret issuance **In progress** | On-demand SVG from an opaque PH1 payload, never public profile fields |
| Deployment | Local demo for current changes; production release **In progress** | Do not assume earlier hosted previews contain current local changes |

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
| `src/features/workspace` | Landing, organizer list/archive and account subscription UI; historical folder name is not a workspace product |
| `src/backend/<feature>` | Server-only validation, authorization, lifecycle rules, and Prisma operations |
| `src/backend/health` | Existing static health response, not a database health check |
| `src/backend/shared` | Reserved shared server infrastructure, added only when needed |
| `src/contracts` | Typed account/session and event/asset transport contracts |
| `src/lib` | Shared frontend-safe utilities, added only when needed |
| `prisma` | Canonical implemented schema, migrations, and development seed |
| `tests` | Unit, integration, route, and end-to-end tests |

Target folders do not count as implemented until code and tests exist.

### Parallel feature ownership

Product feature names are `account`, `event`, `registration`, `committee`, `attendance`, and `sponsorship`. Each has separate frontend and backend folders. Frontend feature folders contain working typed clients and UI. Production server services remain In progress.

Before editing, an agent must ask which feature and which layer the user wants to develop, obtain confirmation, and list allowed files. Changes stay within that feature, its tests, and explicitly approved route adapters. Another feature's internals must not be imported. Shared contracts and cross-feature integration require approval before implementation.

ESLint rejects direct frontend/backend imports and imports of other named feature internals. `npm run test:boundaries` checks representative allowed and rejected imports. These checks are architectural guardrails, not a filesystem sandbox; root `AGENTS.md` additionally requires reviewing changed paths against the agreed scope.

Schema, migrations, package files, environment, root documents, shared layouts/styles, and shared utilities remain coordinated infrastructure ownership. Use separate feature branches and isolated checkouts for concurrent workers. Do not change unrelated pages or `/api/health` during a feature task.

### Supabase boundary

Supabase is selected only as managed PostgreSQL. Prisma connects from server code with database credentials. No Supabase SDK, Auth, public database API, or Edge Functions are introduced. Production authentication provider/session implementation remains an open decision. Do not expose database connection strings or privileged keys to the browser. SQL roles/grants and any Supabase Data API exposure require security review before real data is collected; server-only Prisma is not an RLS policy.

### Current event editor and identity assets

The four-stage editor owns in-memory idea/details, same-day WIB schedule, capacity, raster identity and module configuration with live poster/page preview. Final valid submission uses the event service. There is no IndexedDB/localStorage draft save, restore or delete, and signup form persistence is removed. Legacy browser copies are ignored, not silently deleted. Completed unpublished events are service records, not browser planning copies.

Optional event/organizer logos and up to six named sponsor-display entries use native file selection or drag/drop, replace/remove and contain-fit previews. PNG/JPEG/WebP are limited to 2 MB and 4096 pixels per axis. Reject empty, corrupt, unsupported, oversized and multiple inputs without replacing a valid asset. Revoke object URLs on replacement/unmount. An organizer name is required with its logo; each sponsor-display entry needs a name. Display placement is not an accepted sponsorship commitment.

Submission uses existing asset services. Production storage, quarantine, magic-byte inspection, normalization, quotas and cleanup remain In progress. Never treat client validation as server security. Self-hosted display/body fonts remain under included SIL Open Font Licenses; frontend features do not import another feature's internal font or model implementation.

## Persistent model

### Current implemented schema

The existing schema contains:

- `Event`, `Registration`, `RegistrationQuestion`, `RegistrationAnswer`, and `AttendanceCheckIn`.
- `SponsorshipCampaign`, `SponsorOrganization`, `SponsorProspect`, and `SponsorBenefit`.
- `TimelineEntry`.

Current `Registration` records are anonymous. This no longer covers the full approved product scope.

### Target account and profile model

The next schema design must support an account with consented reusable profile data. The account has one role (user, organizer or sponsor) and approval status, aligned with src/contracts/account.ts. Participant registration, committee membership and event-manager access are separate event relations. Production must enforce both account eligibility and the relevant event relation.

Frontend email/password verification and recovery are approved; email is required and display name optional. Backend provider, hashing/session/token policies, deletion and retention remain **In progress**. Password persistence must not be added without separate backend/schema approval.

### Target event access model

Event access must be relation-based:

- Organizer membership authorizes event management.
- Committee membership exists only after an application is accepted.
- Participant registration belongs to one account and one event.
- The same account may hold different relations in different events.

The existing management-secret design may remain for prepared demos, but it is not sufficient as the sole long-term authorization method once reusable accounts are introduced.

### Target registration and forms model

Reusable profile fields and event-specific answers must remain separate. Organizers can request only fields relevant to their event. Current registration DTOs support text, longtext, choice and image answers, with stable field IDs and snapshotted labels. Production consent, secure proof storage and free-text retention/privacy rules remain **In progress**.

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

#### Current frontend/demo scanner

The attendance feature owns scanner UI, local jsQR decoding and validated clients. Organizer route `/events/:id/scan` and participant-area adapter `/me/committee/:id/scan` reuse it. Shared DTOs live in `src/contracts/participation.ts`; accepted-member capability comes from `src/contracts/committee.ts`.

Mode is NONE, ENTRY or ENTRY_EXIT. Both registration and attendance modules must currently be enabled. Recheck approved account, published event and current owner/manager authorization or same-event accepted committee membership on each request. Closed recruitment alone does not revoke acceptance. Wrong-role, foreign-event, rejected/withdrawn and closed-event scans fail.

PH1 plus an opaque random secret identifies an issued REGISTERED ticket. No name, email, reference or database identifier is encoded. Local camera/image decoding submits only the decoded payload in a POST body, never an image, URL query or log. Image input is capped at 10 MB and downscaled to a 1600-pixel longest edge; camera frames use a 960-pixel longest width and 250 ms decode interval. Stop tracks on result, close, page hide and unmount. Preserve retries after permission/decode failure; HTTPS/localhost is required for camera access.

First ENTRY/EXIT timestamps are stable under repeat requests. Exit-before-entry, disabled exit and disabled-module inspection are rejected. TicketScan supports RECORDED, ALREADY_RECORDED, EXIT_RECORDED and ALREADY_EXIT_RECORDED; a legacy DISABLED contract value is not permission to inspect disabled QR.

Committee responses strip answers, proof, notes, contact details and secrets, and expose no bulk registrant board. Committee cannot configure mode, issue QR or verify payments. Only confirmed participants see their own issued QR, loaded on demand; disabling modules hides and rejects QR without erasing secrets or historical timestamps.

Production must hash lookup secrets, define secure authenticated QR retrieval (a hash cannot reconstruct the payload), use no-store responses, rate-limit attempts and enforce unique registration/kind constraints atomically. Demo timestamps and guards are not production concurrency or security. Offline synchronization and identity verification remain out of scope.

### Sponsorship model

`SponsorshipCampaign` belongs to an event. `SponsorOrganization` is reusable across campaigns. `SponsorProspect` joins a campaign and organization, then stores stage, proposal URL, notes, and next follow-up date. `SponsorBenefit` stores a commitment and evidence URL. Evidence counts as delivered only after verification.

Approved sponsor accounts support two-way rule-based field matching and separate collaboration progress in the local demo. Real AI, automatic matching notifications and a broad marketplace are deferred. Recommendations never create agreements or disclose private company verification documents.

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

Rules the backend must enforce, not only the UI: event ownership on every organizer route (foreign events return 404), organizer-defined stage transitions with 409 for invalid moves, a required note on acceptance, divisions unique per opening with stable ids across edits, one pending request per event and sponsor, and no applicant contact data in organizer views beyond the display name. Notifications are created in the same transaction as the state change.

The demo backend (`src/mocks/demo/router.ts`, build flag `NEXT_PUBLIC_PARTNERHUB_DEMO=1`) simulates these rules for presentations and tests only. It is not security and not a production fallback. Its stored data gains `openings`, `applications`, and `offers`; compatibility upgrades preserve existing operational records and user edits; do not reset data to migrate contracts.

New frontend routes: `/committee` (user), `/events/[id]/committee` and `/events/[id]/sponsors` (organizer). `/committee` is added to the user area in `src/lib/navigation.ts`.

Organizer incoming proposals at `/organizer/sponsorship` and outgoing requests at `/organizer/sponsorship/requests` are separate task pages. Thin adapters compose authorized event loaders without feature-internal cross-imports. Services validate responses; a paginated organizer-level production endpoint remains deferred until needed. Local proposal/offer acceptance materializes a shared agreement through the existing ensureAgreement helper; it does not mark benefits delivered. Production transactions and persistence remain In progress.

### Timeline

`TimelineEntry` records operational history. Once accounts are implemented, any actor reference must be optional and must not copy personal details into the message field.

## State transitions

| Entity | Allowed transitions |
| --- | --- |
| Event | `DRAFT` to `PUBLISHED`, `PUBLISHED` to `CLOSED`, `CLOSED` to `ARCHIVED` |
| Registration | Paid event: `PENDING` to `REGISTERED` (organizer confirms, capacity rechecked) or `REJECTED` (organizer rejects, optional reason max 200 characters); only `PENDING` can be decided. Free event: created as `REGISTERED`. `REGISTERED` to `CANCELLED`. A `REJECTED` participant may create a new registration. QR issuance applies to `REGISTERED` only. Payment proof images are personal data: visible only to the event owner and the uploader, never in a public URL or log. **In progress** (demo router only; backend endpoint `POST /api/events/:id/registrants/:registrationId/decision` and the Prisma enum are pending) |
| Committee application | SUBMITTED, then optional IN_SELECTION with stable stageId, then ACCEPTED, REJECTED or WITHDRAWN through service-returned allowed moves. Openings have 0 to 5 custom ordered stages; acceptance requires a next-steps note. |
| Sponsor prospect | Forward business decision, never arbitrary enum replacement |
| Sponsor benefit | `PLANNED` to `VERIFIED` |

State changes run in feature services. Route handlers must not accept unrestricted status replacement. Acceptance creates committee membership in the same transaction.

## Endpoint integration map

Typed clients in each feature are authoritative for current request/response shapes. The local demo implements these routes in-browser; production implementations remain In progress except the static /api/health. Do not implement an older slug-based endpoint or unrestricted status PATCH alongside the current service contract.

| Area | Current routes | Required boundary |
| --- | --- | --- |
| Account | /api/auth/session, /login, /logout, /register/:role, password and verification actions; /api/profile; /api/accounts/onboarding | Secure production cookies, approved account state, neutral recovery and abuse controls |
| Event | GET/POST /api/events, GET/PATCH /api/events/:id, POST /api/events/:id/assets | Authorized event relations, validation, revision conflicts and idempotent creation/upload |
| Lifecycle | POST /api/events/:id/lifecycle with revision and publish/close/archive action | Readiness, entitlement recheck and explicit transition; no arbitrary state assignment |
| Public discovery | GET /api/public/events and /api/public/events/:id | Published projection, no application login, private fields excluded |
| Registration | Public event form/registration endpoints, organizer registration-form/registrants/decision endpoints | Active participant and open event/window, duplicates/capacity, private proof and answer snapshots |
| Own tickets | /api/me/registrations, /:id and /:id/qr | Current participant owner; QR additionally confirmed, issued and currently enabled |
| Attendance | /api/events/:id/attendance and /ticket-scans | Current owner/manager or accepted committee, mode/configuration restrictions and minimized committee response |
| Committee | /api/committee/openings, /applications; /api/me/committee-applications; event committee/opening/decision routes | Same-event application, stable stage IDs, service-returned allowed moves and next-steps note |
| Sponsorship | Sponsor proposals/offers/sponsorships; event sponsor-proposals/decision, sponsor-offers/follow-up, benefits/report | Approved sponsor or event manager/owner, explicit decisions and separate evidence verification |
| Matching | GET event sponsor-matches; GET sponsor matching-profile and event-matches | Creation/registration-owned immutable fields, read-only recommendations and scoped minimal directory data |
| Billing | /api/organizer/billing, /orders, /orders/:id/verify-demo, /subscription/orders and /subscription/orders/:id/verify-demo | Current account owner, fixed catalog, separate confirmation, no double charging |
| Managers | Existing event-specific manager service routes | Owner-only assignment, inclusive limits; never workspace membership |

verify-demo is an explicit local confirmation mechanism, not an endpoint to expose as payment verification in production. Production needs authenticated provider verification/webhooks and atomic ledger changes. GET /api/health is not proof of database connectivity.

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

Import-boundary tests exist under `tests/architecture`. Feature tests and isolated browser suites exercise local demo flows. Production database/authorization/concurrency and real-provider integration coverage remain **In progress**.

## Challenge review

### Likely failures

- Account or session design exposes more personal data than an event needs.
- Account role checks are mistaken for event authorization or accepted committee membership.
- Browser retries create duplicate registrations or applications.
- Time-zone conversion opens or closes registration at the wrong local time.
- Committee acceptance creates duplicate membership.
- QR screenshots are replayed.
- Capacity drifts when cancellation and registration are not transactional.
- Sponsor evidence URL points to removed or private content.
- Rule-based matching is mistaken for real AI, sponsor interest or guaranteed agreement.

### Required safeguards

- Use event-scoped membership for authorization.
- Keep reusable profile and event-specific answers separate.
- Enforce uniqueness for registration, committee application, membership, and attendance records.
- Store event times in UTC and display an explicit event timezone.
- Keep ticket data opaque and verify it server-side.
- Leave benefit status `PLANNED` until manual verification.
- Reuse local rule-based matching; defer real AI, matching notifications, real payments and production file infrastructure.

### Explicitly not built yet

- Production account, verification, recovery, approval tooling and secure sessions.
- Account and committee schema migration.
- Payment ledger, refunds, settlement, and transaction fees.
- Broad sponsor marketplace, real AI matching and automatic matching notifications.
- File storage, messaging, real-time subscriptions, analytics warehouse, generic workflow engine, or microservices.

One modular Next.js application plus PostgreSQL is sufficient for the current scope.

### Role-based accounts and demo mode, 2026-10-05

**In progress**. The owner approved three account roles chosen at registration: user, organizer, sponsor company. This supersedes the earlier rule against a permanent account classification. Event-level roles remain event-scoped.

- `Session.account.role` and `status` drive `src/lib/navigation.ts` (`homeFor`, `canAccess`, `destinationAfterAuth`) and `SessionGate`. Each role has its own area: `/me`, `/organizer` plus `/events/*`, `/sponsor`. Accounts under review may open only `/account/verification` and `/settings`. `/dashboard` only redirects to the role home.
- Registration is a multi-step wizard in `src/features/account/signup`. One flat value bag is shared by all roles, so name, email, phone and other shared fields survive a role switch. Role-only fields are cleared and documents must be uploaded again. Zod schemas per role and step are in `schemas.ts`. Signup values exist only in memory; no draft persistence remains.
- Reusable form controls, validators and file inspection are in `src/lib/form`. File inspection reads the real file signature instead of trusting the browser MIME type. These are UX guards, not server inspection.
- The folder is named `signup` because the import boundary rule treats any path segment named like a product feature (`registration`) as that feature's internals.
- `src/mocks/demo` holds the fictional data, the in-browser router and the demo UI. It is loaded only through dynamic imports guarded by `process.env.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"` in `api-client.ts`, `providers.tsx`, `account-page.tsx` and `email-verification.tsx`. A test fails if any other file imports it. `next.config.ts` pins the default to `"0"` (owner-approved change to that shared file). Checked by searching `.next/static` after separate builds: variable unset and `0` emit no demo strings; `1` emits three demo chunks. An earlier build without that pin emitted the chunks even with the guard false, which is why the pin exists.
- Demo data belongs to account IDs. The mock router filters by owner and refuses other roles and unapproved accounts, which simulates the backend. Accounts created with Register in a demo build start empty. Changes live in versioned in-tab sessionStorage. Reset requires explicit confirmation. It must never be invoked as part of documentation or migration work.
