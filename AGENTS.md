# PartnerHub workspace guide

Updated: 18 October 2026. This guide consolidates standing owner decisions. Superseded task-by-task permissions and contradictory older product rules are not current instructions.

## Current documentation task

The owner explicitly approved documentation-only reconciliation of root product/architecture/agent/readme files, relevant feature READMEs and todobackend.md, plus the Business Idea tab in the existing Google Doc. No application code, schema, records, payment behavior, other Google Doc tabs, push or deployment is authorized by that approval.

## Standing product decisions

- Complete event setup, store it privately in Arsip acara, then upload after coverage validation. Creation alone is not charged. Internal DRAFT is unpublished storage, not a user-facing draft-save feature; internal ARCHIVED is completed-event history.
- No organization/workspace product, workspace switching/membership, cross-event overview, annual-only duplication, quick-save, browser-copy restoration or persisted signup draft.
- Per-event purchase and qualifying annual owner-account subscription are alternatives. Starter: Rp149.000/event or Rp699.000/year, 300 participants and 3 managers including owner. Growth: Rp499.000/event or Rp1.499.000/year, 1.500 participants and 10 managers. Single-event upgrade: Rp350.000. src/contracts/billing.ts is price authority.
- Annual subscriptions allow unlimited qualifying events. Recheck owner, active term, limits and event end at upload. Pin coverage only on successful publication, with no duplicate per-event charge. No stacking, automatic renewal or mid-term annual upgrade. Preserve already-published coverage through event end plus 30 days.
- Preserve exact historical transaction amounts and legacy records. Removed organization billing is read-only, never silently reactivated. No reset, deletion or migration that discards user work.
- Published events become public without login; public views hide registrant totals and omit empty sponsor sections. Never infer a sponsor from a pending proposal or a logo.
- Edit within Ringkasan acara before publication only. Published details stay locked through every edit entry.
- Stable role sidebars; selected-event links above content. No report/package/edit-detail subsection, global search or command palette. Preserve existing evidence records and compatibility reports.
- No content accordions or details/summary dropdowns anywhere. Use open sections and concise copy, not hidden content. Keep normal form selects, navigation/account menus, dialogs and confirmation safeguards. Event summary status aligns with its title; registration follows schedule rather than a floating right-hand panel. Publication labels may be shorter in presentation, but must use existing readiness validation.
- Subscription has exactly three cards: Paket Starter, Paket Growth, Custom. Custom says Kontak PartnerHub and links to /contact. Checkout uses existing services and the local dialog. No extra history or feature-disclosure section.
- Pengaturan opens through the account popup, not a profile sidebar item. Transaction history is accessed only from settings, with one chronological list. Settings has no Back; existing other page Back controls are accessible arrow-only controls in the header.
- Terms and privacy links belong only in the shared footer. Preserve /terms and /privacy.
- Optional QR requires both registration and attendance modules. Confirmed participants show issued QR in Tiket saya. Same-event accepted committee scan from Lamaran saya, without access to proofs, answers, contact details, bulk registrants, payments, issuance or mode configuration. Disabled modules hide actions and reject direct access. Preserve first entry/exit timestamps.
- Committee selection uses 0 to 5 custom stages and SUBMITTED/IN_SELECTION/ACCEPTED/REJECTED/WITHDRAWN, not fixed shortlist/interview states. Missing legacy history stays unknown. Separate needs/divisions/stages/question visually.
- Two-way matching is shared-field logic, not real AI. Organizer suggestions live under an event's Ajak sponsor; sponsor suggestions are separate from requests/proposals/benefits progress. Prepared sponsor accounts already have industry fields.
- Use shared custom asynchronous confirmations; cancel/Escape never mutates and focus returns. Native refresh/tab-close protection is the unavoidable exception.
- Keep Indonesian product-style UI without prototype/simulation/In progress notices; preserve Ganti peran demo. Technical docs must disclose production gaps. Never invent customers, revenue, real sponsor partnerships, contacts, legal approval or user-study results.
- Use realistic fictional local fixtures and bundled photography with provenance. No borrowing source/history from the previous PBL project.
- Never block project work with "siapa nama kamu" or inherited assistant identity/role onboarding. This does not delete necessary account registration/profile fields.
- Current hosting requests are local only. A previous cloud URL is not evidence the latest changes are deployed.

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

PartnerHub is an individual-event operations platform with sponsorship discovery and accountability as its differentiator. Read PRD.md for the consolidated current product rules; do not restore removed behavior from historical chat or verification notes. It is not a national ticket marketplace, payment processor, social network, generic CRM, or full HR system.

The approved Venture Creation direction protects one complete flow: create and publish an event, reuse consented participant profile data, collect event-specific registration, recruit a committee, issue opaque QR tickets, record optional entry attendance, and track sponsor benefits.

Accounts register as user, organizer or sponsor, with approval status. Participant/committee membership and event-manager access are separate event-scoped relations. Do not infer event authorization from account role alone. Minimize personal data, separate reusable profile fields from event-specific answers, and never place personal data in QR payloads. Authentication fields, required profile fields, retention, deletion, and recovery need explicit decisions in `PRD.md` and `ARCHITECTURE.md` before implementation.

## Source of truth

Read before planning a change:

1. `PRD.md` for product intent, scope, and acceptance criteria.
2. `ARCHITECTURE-ESSETIALS.md` for fast architectural constraints.
3. `ARCHITECTURE.md` for stack, models, states, security, and testing detail.
4. `prisma/schema.prisma` for implemented persistence only; shared contracts and demo types describe additional local behavior not yet migrated.

`README.md` is portfolio-facing. Keep it concise and distinguish local implementation evidence from production availability and market validation.

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
- Keep proposal, portfolio, and evidence attachments as URLs in the first version. Production file storage, real payments, automatic matching notifications, chat and broad sponsor marketplace behavior are deferred. Existing browser-local payment/entitlement and two-way rule-based matching flows are approved demo behavior, not production integrations.
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
