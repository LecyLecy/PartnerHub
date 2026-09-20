# PartnerHub workspace guide

## Product baseline

PartnerHub is an event operations workspace with a sponsorship tracker. It is not a ticket marketplace, payment processor, social network, or generic CRM.

Initial build protects one complete flow: prepare an event workspace, publish an event, issue anonymous QR tickets, record entry attendance, and track sponsor benefits. Product must not ask for a personal name during onboarding or registration. It must not create a `User` model, account classification field, or personal profile in initial build.

Event titles and sponsor organization labels are operational data, not personal identity data. Do not add contact-person name, password, or personal phone fields without explicit product decision.

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
- Use opaque ticket secrets in QR payloads. Never place personal data, database URLs, or secrets in QR, client bundle, or log.
- Validate all external input server-side. Enforce event management through workspace secret, not request-body IDs.
- Model state changes explicitly. Do not permit arbitrary status replacement.
- Keep evidence as URLs in MVP. File uploads, payments, notifications, chat, and public event creation are deferred.
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
- `ARCHITECTURE.md` is complete reference. `ARCHITECTURE-ESSETIALS.md` stays short.
