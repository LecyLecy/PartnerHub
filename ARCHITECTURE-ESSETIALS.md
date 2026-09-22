# PartnerHub Architecture Essentials

Read this first. Use `ARCHITECTURE.md` for complete detail.

## Product guardrails

- First-version product: event setup, reusable participant profiles, event-specific forms, committee recruitment, optional QR entry, and sponsorship benefit evidence.
- Accounts may hold different roles in different events. Do not add a permanent global account classification.
- Collect personal data only when necessary, with clear consent and retention rules.
- QR contains only a ticket reference plus opaque secret.
- Payments, file uploads, chat, sponsor matching, matching notifications, marketplace, and committee task management are deferred.
- The current Prisma schema covers the earlier anonymous-registration foundation. Account and committee persistence changes are **In progress**.

## Stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 for interface styling.
- Route Handlers for server endpoints.
- PostgreSQL plus Prisma ORM for persistence and migrations.
- Zod at server boundaries.
- Authentication approach is **In progress**.

## Boundaries

```text
src/app       routes and page composition
src/features  account, event, registration, committee, attendance, sponsorship behavior
src/lib       shared server utilities, authentication, and validation
prisma        database schema and migrations
tests         focused unit, integration, and flow tests
```

Pages never query the database directly. Route handlers validate input, call feature logic, and return a response. Feature logic owns authorization, state transitions, and Prisma access.

## Data direction

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
