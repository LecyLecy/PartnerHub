# PartnerHub Architecture Essentials

Read this first. Use `ARCHITECTURE.md` for complete detail.

## Product guardrails

- First-version product: event setup, reusable participant profiles, event-specific forms, committee recruitment, optional QR entry, and sponsorship benefit evidence.
- Each account has one account role (user, organizer, sponsor) chosen at registration, plus an approval status (`active`, `pending_verification`, `rejected`). Organizer and sponsor accounts need admin approval. Event-level roles such as committee membership stay event-scoped. Frontend guards only steer navigation; every API must enforce role, status and ownership.
- Demo mode is a build-time flag (`NEXT_PUBLIC_PARTNERHUB_DEMO=1`). Demo code and fictional data live only in `src/mocks/demo` and are imported through flag-guarded dynamic imports. `next.config.ts` pins the default to `0`. Verified by searching `.next/static`: with the variable unset or `0` no demo strings are emitted; with `1` three demo chunks are emitted.
- Collect personal data only when necessary, with clear consent and retention rules.
- QR contains only a ticket reference plus opaque secret.
- Payments, document uploads, chat, sponsor matching, matching notifications, marketplace, and committee task management are deferred. User-uploaded event/organizer/sponsor-display logos are approved frontend scope; server image storage is In progress.
- The current Prisma schema covers the earlier anonymous-registration foundation. Account and committee persistence changes are **In progress**.

## Stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 for interface styling.
- Route Handlers for server endpoints.
- Supabase-hosted PostgreSQL plus Prisma ORM for persistence and migrations. Actual database connection is **In progress**. No Supabase Auth, SDK, or Edge Functions are configured.
- Zod at server boundaries.
- Approved frontend authentication: email/password, email verification, emailed single-use recovery, optional display name. Backend provider, session/token lifetimes, retention and deletion are **In progress** and block real-data release.

## Boundaries

```text
src/app       routes and page composition
src/features  frontend UI, client state, and API calls per feature
src/backend   server-only services and Prisma access per feature
src/contracts agreed shared API transport types
src/lib       shared frontend-safe utilities
prisma        database schema and migrations
tests         focused unit, integration, and flow tests
```

Pages never query the database directly. Route handlers validate input, call backend feature logic, and return a response. Backend feature logic owns authorization, state transitions, and Prisma access. Frontend features never import backend modules. Backend runtime entry modules import `server-only`.

Before editing, ask the user which feature and layer to develop and confirm allowed files. Never edit or import another feature's internals. Shared schema, contracts, dependencies, and infrastructure require separate approval. Use separate branches and isolated checkouts for parallel development. Run `npm run lint` and `npm run test:boundaries`; also review changed paths against the agreed scope.

Supabase runtime connection uses `DATABASE_URL`; Prisma migration connection uses `DIRECT_URL`. Keep credentials server-only. Supabase Auth is not configured. Frontend credential fields are approved; backend privacy/lifecycle decisions remain open.

### Earlier browser-only implementation (superseded by connected frontend revision)

The event frontend saves one draft with user-selected logo blobs in IndexedDB (`partnerhub-event-drafts`, `drafts`, `current`) only on explicit save. Restore validates details/branding and decodes logos; legacy v1 localStorage text drafts remain readable. Confirmed delete removes only these draft records. Raster limit: PNG/JPEG/WebP, 2 MB and 4096px per axis, up to six sponsor-display entries. No server uploads, backend calls, publishing or real module activation. User identity is per organizer/event, never hard-coded. The route composes workspace/event through a ReactNode slot without cross-feature internal imports. See complete architecture for retention, same-day WIB limits and `todobackend.md` for release blockers.

## Data direction

Connected frontend routes use typed feature services and shared HTTP/session utilities. No production mock fallback, browser auth token storage, or component-level fetching. Guards provide UX only; APIs must authorize every action. Incomplete event drafts require backend/schema changes outside this frontend task. See the connected frontend revision in the complete architecture and `todobackend.md`.

`prisma/schema.prisma` remains authoritative for implemented persistence. Current records cover events, anonymous registrations, attendance, sponsorship, and timeline history. The approved target model adds:

- Account and consented reusable profile.
- Event-scoped organizer and committee membership.
- Committee division, application, preferences, and answers.
- Account ownership on participant registration.
- Configurable attendance mode.

Do not claim these target records are implemented until the schema and migration are committed.

## State rules

- Event: `DRAFT` to `PUBLISHED` to `CLOSED` to `ARCHIVED`.
- Registration: `REGISTERED` or `CANCELLED`.
- Committee application: `SUBMITTED`, `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.
- Entry scan: zero or one `ENTRY` record per registration when enabled.
- Sponsor prospect: `PLANNED`, `CONTACTED`, `NEGOTIATING`, `AGREED`, `DECLINED`.
- Benefit: `PLANNED` or `VERIFIED`.

## Security

- Hash authentication credentials, session tokens, and ticket secrets as appropriate.
- Do not log credentials, tokens, ticket secrets, personal form answers, or full QR payloads.
- Apply server-side authorization, capacity, registration-window, and duplicate-registration checks.
- Expose only profile fields required for the current event action.
- Return generic ticket failures to the scanner.

## Update triggers

- Product change: update `PRD.md` first.
- Model, state, API, stack, authentication, or security change: update `ARCHITECTURE.md`, this file, and schema.
- Environment change: update `.env.example`, architecture, and README.
