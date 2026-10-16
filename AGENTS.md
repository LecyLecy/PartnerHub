# PartnerHub workspace guide

## Approved production-demo integration task

On 2026-10-16 the owner explicitly authorized merging all member branches into `production`, resolving conflicts, completing the application UI with fictional local data, applying both feedback grids, and hosting the demo. For this specific delivery, scope includes all six frontend features, workspace, shared contracts/utilities/styles, app adapters, demo services/data, tests, build/deployment configuration, scripts, and documentation. The task does not require real backend authentication, payment, email, or a production database. Do not repeat the narrow-feature scope question for this already-authorized delivery. Later unrelated tasks still use the scope rules below.

Read `DEMO-DELIVERY.md` for the feedback source and evidence, and `/guide` for the user-facing demo sequence. `npm run build:demo` creates the explicitly labeled classroom build; normal builds retain their previous non-demo default. Preserve real-backend limitations in documentation and never claim fictional counts as traction.

## Mandatory scope gate

Before planning or editing, ask the user: "Which feature do you want to develop, and is the scope frontend, backend, or both?" Wait for an explicit answer. If the request already specifies both, restate them and ask for confirmation. Read-only orientation may happen before confirmation.

Feature choices: `account`, `event`, `registration`, `committee`, `attendance`, `sponsorship`. `workspace`, `health`, and shared infrastructure are separate scopes. Never assume authorization to work on every feature.

After confirmation, state the allowed paths:

- Frontend: `src/features/<feature>/**`.
- Backend: `src/backend/<feature>/**`.
- Tests: `tests/<feature>/**`.
- Only explicitly agreed page and API route files in `src/app` that serve this feature.
- Feature-local documentation inside those folders.

Do not edit, format, rename, delete, or refactor another feature. Reading another feature to understand an existing contract is allowed; editing it is not. If a dependency requires another feature to change, stop and request separate approval. Never hide a cross-feature edit inside cleanup.

Shared files require separate approval with exact paths and reasons: `prisma/**`, `src/lib/**`, `src/backend/shared/**`, `src/contracts/**`, root documentation, environment files, package files, configuration, and shared layouts/styles. A request to restructure the repository may authorize these paths only for that restructuring task.

Before editing, list the intended files. Before finishing, compare `git diff --name-only` with that list, distinguish pre-existing user changes, and report unexpected changes without reverting user work. This is a workflow boundary, not an operating-system sandbox.

## Parallel development

- Use one branch per feature and task. Do not switch branches in another person's active checkout; use an existing isolated workspace or coordinate a separate checkout.
- Each feature owns its frontend and backend folders. `src/app` contains thin adapters, not business logic.
- Do not import another feature's internals. Frontend features never import backend code. Agree on minimal shared DTOs in `src/contracts` or a deliberate backend integration contract before connecting features.
- Backend runtime entry modules must import `server-only`; keep credentials and Prisma access out of frontend modules.
- Coordinate Prisma schema/migrations, dependencies, shared contracts, and shared UI through one explicitly approved infrastructure task. Do not independently modify these shared files in parallel.
- Run `npm run test:boundaries` and `npm run lint` to check import boundaries. These checks do not replace the file-scope review above.

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
- Work on a task-specific feature branch. `adin` is a delivery branch, not a shared checkout for parallel development.
- Keep App Router adapters in `src/app`, frontend feature behavior in `src/features`, server feature behavior in `src/backend`, shared DTOs in `src/contracts`, shared frontend utilities in `src/lib`, and persistence through Prisma against Supabase PostgreSQL.
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
