# PartnerHub Architecture

## Architecture goals

PartnerHub supports one secure, understandable event flow before broader operations tooling. Architecture prioritizes opaque ticket handling, repeat-safe attendance, clean sponsorship records, and few explicit state transitions.

It does not optimize for multi-tenant enterprise management, payment processing, live collaboration, or personal account lifecycle in MVP.

## Technology stack

| Layer | Decision | Reason |
| --- | --- | --- |
| Web application | Next.js 16 App Router, React 19, TypeScript | One typed application for pages and server endpoints |
| Styling | Tailwind CSS 4 | Fast, consistent interface implementation |
| Validation | Zod | Explicit server input validation |
| Persistence | PostgreSQL | Transaction support for capacity and scan invariants |
| ORM and migration | Prisma | Typed schema, migrations, relational integrity |
| QR generation | Server-side library, in progress | Keep opaque payload generation off public page state |
| Deployment | In progress | Hosting follows prototype and data-region review |

## Application shape

```text
Browser
  public event page / registration / ticket display
  management page guarded by event workspace secret
  gate scan page guarded by event workspace secret
        |
Next.js App Router
  page components and Route Handlers
        |
Feature services
  event | registration | attendance | sponsorship
        |
Prisma repository boundary
        |
PostgreSQL
```

Server Components render initial pages. Client Components are limited to interactive forms, scanner integration, and live validation feedback. Route Handlers own mutations. Page components do not access Prisma.

## Folder ownership

| Path | Responsibility |
| --- | --- |
| `src/app` | Routes, layouts, page composition, Route Handlers |
| `src/features/event` | Event lifecycle and workspace-secret checks |
| `src/features/registration` | Capacity, consent, answer validation, ticket creation |
| `src/features/attendance` | QR verification and idempotent entry recording |
| `src/features/sponsorship` | Campaign, prospect, benefit, evidence workflow |
| `src/lib` | Environment validation, crypto, IDs, shared primitives |
| `prisma` | Canonical schema, migrations, development seed |
| `tests` | Unit, integration, and end-to-end tests |

## Persistent model

### Event and registration

`Event` owns public configuration and hash of management secret. It relates to registrations, questions, attendance, sponsorship campaigns, and timeline entries.

`Registration` has no personal fields. `ticketReference` is display-safe. `ticketSecretHash` verifies QR proof. `RegistrationQuestion` supports selection-only inputs. `RegistrationAnswer` stores selected values. `AttendanceCheckIn` has unique `(registrationId, kind)` pair for idempotence.

### Sponsorship

`SponsorshipCampaign` belongs to event. `SponsorOrganization` is reusable across campaigns. `SponsorProspect` joins campaign and organization, stores stage and next follow-up date. `SponsorBenefit` stores commitment and evidence URL. Evidence is meaningful only after `VERIFIED`.

### Timeline

`TimelineEntry` is system history record. It captures event, subject, message, and time without personal attribution.

## State transitions

| Entity | Allowed transition |
| --- | --- |
| Event | `DRAFT` to `PUBLISHED`, `PUBLISHED` to `CLOSED`, `CLOSED` to `ARCHIVED` |
| Registration | `REGISTERED` to `CANCELLED` |
| Sponsor prospect | Forward business decision, never automatic reversal |
| Sponsor benefit | `PLANNED` to `VERIFIED` |

State changes run in feature services. Route handlers must not accept arbitrary enum replacement.

## Endpoint plan

| Method and path | Purpose | Guard |
| --- | --- | --- |
| `GET /api/health` | Deployment health | Public, no database query in scaffold |
| `POST /api/events` | Create prepared event | Setup protection, in progress |
| `PATCH /api/events/:id` | Edit or publish event | Workspace secret |
| `POST /api/events/:slug/registrations` | Create anonymous ticket | Published event, window and capacity checks |
| `POST /api/events/:id/check-ins` | Record entry scan | Workspace secret and ticket proof |
| `POST /api/events/:id/campaigns` | Create sponsorship campaign | Workspace secret |
| `PATCH /api/prospects/:id` | Update sponsorship stage | Workspace secret |
| `PATCH /api/benefits/:id` | Add evidence or verify benefit | Workspace secret |

## Security and privacy

- Generate management and ticket secrets with cryptographic randomness. Store secure hashes only.
- QR payload format is `ticketReference.secret`. It must not include event metadata, personal data, or database identifiers.
- Compare secrets server-side.
- Verify workspace secret for every mutation outside public registration.
- Limit registration questions to consent and selection inputs. Free text or identity questions need PRD decision.
- Validate evidence URLs server-side. Render external links with safe rel attributes.
- Use generic scanner errors so invalid ticket does not reveal event or registration details.
- Add rate limiting to public registration and scanner endpoints before production deployment.

## Concurrency and failure handling

Capacity check and registration creation run in one database transaction. Transaction must lock or atomically condition event capacity so two final-slot registrations cannot both succeed.

Entry check-in uses unique constraint. Duplicate insert becomes `already checked in`, not server failure. Scanner retries stay safe.

If QR generation, database write, or response delivery fails, no ticket is issued until registration transaction commits. Ticket regeneration needs later explicit recovery design.

## Environment contract

```bash
DATABASE_URL=
MANAGEMENT_SECRET_PEPPER=
QR_SECRET_PEPPER=
```

`.env.example` lists names only. Secret values never enter Git. Deployment variables remain **In progress**.

## Testing strategy

| Layer | Minimum coverage |
| --- | --- |
| Unit | State transitions, secret helpers, payload parsing, capacity calculation |
| Integration | Final capacity slot and duplicate scan constraints |
| Route | Invalid secret, closed registration, forged ticket, invalid evidence URL |
| End-to-end | Publish event, anonymous register, valid scan, duplicate scan, benefit verification |

Testing infrastructure is scaffolded but **In progress**.

## Challenge review

### Likely breaks

- Browser retries submit registration twice.
- Time-zone conversion opens or closes registration at wrong local time.
- QR screenshots are replayed.
- Management secret leaks through shared URL, browser history, or logs.
- Capacity drifts if cancellation and registration are not transactional.
- Sponsor evidence URL points to removed or private content.

### Decisions added after review

- Database uniqueness makes entry idempotent.
- Event times store UTC. UI later displays explicit event timezone.
- Ticket secret is opaque and checked server-side.
- Management secret is submitted in protected request header or secure session, not query string.
- Evidence stays `PLANNED` until manual verification.

### Explicitly not built yet

- Account system and recovery flow.
- Generic workflow engine, plug-in architecture, audit framework, queue, or microservices.
- Payment ledger, messaging, storage adapter, real-time subscriptions, analytics warehouse.

One modular Next.js application plus PostgreSQL is sufficient for current scope.
