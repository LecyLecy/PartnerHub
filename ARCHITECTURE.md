# PartnerHub Architecture

## Architecture goals

PartnerHub supports a complete event flow from setup through post-event sponsor evidence. The target first version adds reusable participant profiles and committee recruitment to the existing event, QR attendance, and sponsorship foundation.

Architecture priorities are data minimization, event-scoped authorization, opaque QR tickets, repeat-safe attendance, explicit application states, and recoverable sponsorship records. It does not optimize for payment processing, a national marketplace, live collaboration, or enterprise multi-tenancy.

## Delivery status

The repository currently contains a Next.js scaffold and a Prisma model for the earlier anonymous-registration foundation. The Venture Creation direction now requires accounts, reusable profiles, committee recruitment, and configurable attendance. Those model and implementation changes are **In progress**.

`prisma/schema.prisma` is authoritative for what is implemented. Sections labelled target describe approved design, not committed behavior.

## Technology stack

| Layer | Decision | Reason |
| --- | --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript | One typed application for pages and server endpoints |
| Styling | Tailwind CSS 4 | Consistent interface implementation in the existing stack |
| Validation | Zod | Explicit validation at every server boundary |
| Persistence | PostgreSQL | Transactions for capacity, duplicate registration, and scan invariants |
| ORM and migration | Prisma | Typed schema, migrations, and relational integrity |
| Authentication | **In progress** | Must support participant, committee, and organizer access without a global role field |
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
Feature services
  account | event | registration | committee | attendance | sponsorship
        |
Prisma repository boundary
        |
PostgreSQL
```

Server Components render initial pages. Client Components are limited to interactive forms, QR scanning, and immediate validation feedback. Route Handlers own mutations. Page components do not access Prisma.

## Folder ownership

| Path | Responsibility |
| --- | --- |
| `src/app` | Routes, layouts, page composition, and Route Handlers |
| `src/features/account` | Target account, reusable profile, consent, and session behavior |
| `src/features/event` | Event lifecycle, module settings, and event-scoped authorization |
| `src/features/registration` | Registration window, capacity, answers, and ticket creation |
| `src/features/committee` | Target divisions, applications, decisions, and memberships |
| `src/features/attendance` | QR verification and idempotent entry recording |
| `src/features/sponsorship` | Campaign, prospect, benefit, and evidence workflow |
| `src/lib` | Environment validation, crypto, authentication helpers, IDs, and shared primitives |
| `prisma` | Canonical implemented schema, migrations, and development seed |
| `tests` | Unit, integration, route, and end-to-end tests |

Target folders do not count as implemented until code and tests exist.

## Persistent model

### Current implemented schema

The existing schema contains:

- `Event`, `Registration`, `RegistrationQuestion`, `RegistrationAnswer`, and `AttendanceCheckIn`.
- `SponsorshipCampaign`, `SponsorOrganization`, `SponsorProspect`, and `SponsorBenefit`.
- `TimelineEntry`.

Current `Registration` records are anonymous. This no longer covers the full approved product scope.

### Target account and profile model

The next schema design must support an account with consented reusable profile data. It must not store a permanent account type such as participant, committee, or organizer. Authorization comes from relations to each event.

The authentication method, required identity fields, recovery flow, deletion behavior, and retention period remain **In progress**. Password fields must not be added until the authentication decision is approved.

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

An event needs an attendance mode. The first version supports `NONE` and `ENTRY_ONLY`. The existing `CheckInKind.EXIT` enum reserves a later extension, but exit attendance does not ship in the first version.

`AttendanceCheckIn` keeps a unique registration and kind pair for idempotence. A scan is rejected when attendance is disabled.

### Sponsorship model

`SponsorshipCampaign` belongs to an event. `SponsorOrganization` is reusable across campaigns. `SponsorProspect` joins a campaign and organization, then stores stage, proposal URL, notes, and next follow-up date. `SponsorBenefit` stores a commitment and evidence URL. Evidence counts as delivered only after verification.

Sponsor matching and automatic matching notifications are deferred. The first version does not require a sponsor account or two-sided marketplace.

### Timeline

`TimelineEntry` records operational history. Once accounts are implemented, any actor reference must be optional and must not copy personal details into the message field.

## State transitions

| Entity | Allowed transitions |
| --- | --- |
| Event | `DRAFT` to `PUBLISHED`, `PUBLISHED` to `CLOSED`, `CLOSED` to `ARCHIVED` |
| Registration | `REGISTERED` to `CANCELLED` |
| Committee application | `SUBMITTED` to `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`, or `WITHDRAWN`; `SHORTLISTED` to `INTERVIEW`, `ACCEPTED`, `REJECTED`, or `WITHDRAWN`; `INTERVIEW` to `ACCEPTED`, `REJECTED`, or `WITHDRAWN` |
| Sponsor prospect | Forward business decision, never arbitrary enum replacement |
| Sponsor benefit | `PLANNED` to `VERIFIED` |

State changes run in feature services. Route handlers must not accept unrestricted status replacement. Acceptance creates committee membership in the same transaction.

## Endpoint plan

Paths may change after the authentication decision. Each endpoint remains **In progress** unless already present in the repository.

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
MANAGEMENT_SECRET_PEPPER=
QR_SECRET_PEPPER=
```

Authentication variables will be added only after the authentication approach is chosen. `.env.example` must list names without values. Secret values never enter Git.

## Testing strategy

| Layer | Minimum coverage |
| --- | --- |
| Unit | State transitions, authorization decisions, token helpers, QR parsing, and capacity calculation |
| Integration | Final capacity slot, duplicate registration, committee acceptance and membership, and duplicate scan constraints |
| Route | Invalid session, wrong event role, closed registration, forged ticket, invalid transition, and invalid evidence URL |
| End-to-end | Create and publish event, reuse profile, register, receive ticket, scan entry, submit and accept committee application, and verify sponsor benefit |

Testing infrastructure and feature-level coverage are **In progress**.

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
