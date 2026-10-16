# PartnerHub Architecture Essentials

Read this first. Use `ARCHITECTURE.md` for complete detail.

## Product guardrails

- MVP: event setup, anonymous ticket registration, QR entry, sponsorship benefit evidence.
- No personal accounts, personal-name prompt, passwords, personal profile, or account classification.
- QR contains only ticket reference plus opaque secret.
- Payments, file uploads, chat, notifications, marketplace, and generic forms are out of scope.

## Stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 for interface styling.
- Route Handlers for server endpoints.
- PostgreSQL plus Prisma ORM for persistence and migrations.
- Zod at server boundaries.

## Boundaries

```text
src/app       routes and page composition
src/features  event, registration, attendance, sponsorship behavior
src/lib       shared server utilities and validation
prisma        database schema and migrations
tests         focused unit, integration, and flow tests
```

Pages never query database directly. Route handlers validate input, call feature logic, return response. Feature logic uses Prisma repository code only.

## Canonical data

`prisma/schema.prisma` is source of truth. Core records:

- `Event`, `Registration`, `RegistrationQuestion`, `RegistrationAnswer`, `AttendanceCheckIn`
- `SponsorshipCampaign`, `SponsorOrganization`, `SponsorProspect`, `SponsorBenefit`
- `TimelineEntry`

## State rules

- Event: `DRAFT` to `PUBLISHED` to `CLOSED` to `ARCHIVED`.
- Registration: `REGISTERED` or `CANCELLED`.
- Entry scan: one `ENTRY` record per registration.
- Sponsor prospect: `PLANNED`, `CONTACTED`, `NEGOTIATING`, `AGREED`, `DECLINED`.
- Benefit: `PLANNED` or `VERIFIED`.

## Security

- Hash management and ticket secrets at rest.
- Do not log secrets or full QR payloads.
- Apply server-side capacity and time-window checks in one transaction.
- Return generic ticket failures to scanner.

## Update triggers

- Product change: `PRD.md` first.
- Model, state, API, stack, or security change: `ARCHITECTURE.md`, this file, and schema.
- Environment change: `.env.example`, architecture, and README.
