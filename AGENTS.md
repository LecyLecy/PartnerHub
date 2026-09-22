# PartnerHub workspace guide

## Product baseline

PartnerHub is an event operations workspace with sponsorship management as its differentiator. It is not a national ticket marketplace, payment processor, social network, generic CRM, or full HR system.

The approved Venture Creation direction protects one complete flow: create and publish an event, reuse consented participant profile data, collect event-specific registration, recruit a committee, issue opaque QR tickets, record optional entry attendance, and track sponsor benefits.

Accounts may have different roles across different events. Do not add a permanent account classification field. Minimize personal data, separate reusable profile fields from event-specific answers, and never place personal data in QR payloads. Authentication fields, required profile fields, retention, deletion, and recovery need explicit decisions in `PRD.md` and `ARCHITECTURE.md` before implementation.

## Source of truth

Read before planning a change:

1. `PRD.md` for product intent, scope, and acceptance criteria.
2. `ARCHITECTURE-ESSETIALS.md` for fast architectural constraints.
3. `ARCHITECTURE.md` for stack, models, states, security, and testing detail.
4. `prisma/schema.prisma` for authoritative persistent model.

`README.md` is portfolio-facing. Keep it concise and claim only committed, verified behavior.

## When an idea changes

| Change | Update |
| --- | --- |
| Product goal, audience, workflow, success measure, or scope | `PRD.md`, then essentials if a constraint changes |
| Stack, API boundary, data model, state, secret handling, or deployment | `ARCHITECTURE.md`, essentials, schema when persistence changes |
| Environment variable or command | `ARCHITECTURE.md`, `.env.example`, `README.md` |
| Verified feature or screenshot | `README.md`, relevant PRD acceptance criteria, test |
| New risk, failure mode, or scope cut | PRD and architecture challenge-review sections |

Do not leave a product decision only in chat. Record it in matching document during same change.

## Implementation rules

- Before code change, run `git status --short --branch` and `git pull --ff-only origin main`.
- Work on a feature branch. Current delivery branch is `adin`.
- Keep App Router pages in `src/app`, feature behavior in `src/features`, shared infrastructure in `src/lib`, persistence through Prisma.
- Keep route handlers thin: validate input, call feature logic, return response. Do not query database in page components.
- Use opaque ticket secrets in QR payloads. Never place personal data, database URLs, credentials, or secrets in QR, client bundle, or log.
- Validate all external input server-side. Enforce event management through event-scoped authorization or the approved prepared-demo secret, never request-body IDs.
- Model state changes explicitly. Do not permit arbitrary status replacement.
- Keep proposal, portfolio, and evidence attachments as URLs in the first version. File uploads, payments, matching notifications, chat, and sponsor marketplace behavior are deferred.
- Do not copy source or Git history from `E:/Projects/PBL-Himti-2`. It is visual and conceptual reference only.

## Verification and Git

- Run `git diff --check` before every commit.
- Run typecheck, build, and focused tests once dependencies exist. State why when a check cannot run.
- Review new code for dead paths, duplicate models, and speculative abstractions before committing.
- Push only after local verification. Never force-push unless user explicitly requests history replacement.
- Preserve user changes. Never reset, discard, move, or delete unrelated files.

## Documentation style

- Write product and technical documents in clear English.
- Mark unfinished work as **In progress**. Do not invent features, metrics, integrations, screenshots, or deployment results.
- Never use em dashes. Use commas, colons, semicolons, parentheses, or separate sentences.
- `ARCHITECTURE.md` is complete reference. `ARCHITECTURE-ESSETIALS.md` stays short.
