# PartnerHub Architecture Essentials

Updated: 18 October 2026. Quick reference only; PRD.md governs product behavior and ARCHITECTURE.md contains technical detail.

## Runtime

- One modular Next.js 16 App Router application, React 19, TypeScript, Tailwind CSS 4/CSS Modules, Zod, Prisma 5.
- Frontend typed clients are working. Explicit NEXT_PUBLIC_PARTNERHUB_DEMO=1 uses browser-only services and in-tab sessionStorage; normal builds default to 0 and never fall back to mocks.
- Production accounts, authorization, PostgreSQL integration, secure storage, email, billing and payment gateway remain **In progress**. Existing Prisma schema does not represent all demo contracts.
- src/app is thin composition/transport; src/features owns frontend; src/backend owns server-only logic; src/contracts contains agreed DTOs; src/lib contains shared frontend-safe utilities. No feature-internal cross-imports or frontend/backend imports.

## Product invariants

- Individual events, no organization/workspace product. Complete setup, private Arsip acara, coverage check at upload, then public discovery. Creation creates no order; published details cannot be edited.
- Internal DRAFT is unpublished, not a draft-save feature. No browser copy or signup persistence. Internal ARCHIVED is completed history, not the upload queue.
- Account roles are user/organizer/sponsor plus approval status. Registration, committee and managers are event-scoped relations. API authorization must enforce both.
- Public event views require no login, hide registrant counts and omit empty sponsor lists. Never expose proof, answers, contact data or secrets.
- Paid ticket registration requires organizer proof review, separate from PartnerHub publication billing. Contract still permits free events; paid seed examples do not change that.
- Committee uses 0 to 5 custom stages, IN_SELECTION/stageId and visitedStageIds. Unknown legacy history is not completion.
- QR is opaque PH1.secret. Confirmed participants show issued QR; accepted same-event committee scan with least privilege. Registration and attendance modules must be enabled. NONE/ENTRY/ENTRY_EXIT, stable first timestamps, no exit-before-entry.
- Two-way matching is deterministic shared fields, not AI or automatic matching notifications. Sponsor industry is fixed at registration; event fields are fixed at creation, including before publication. Matching views and endpoints are read-only. Preserve existing profiles/fields, never invent unknown legacy fields. Sponsor discovery is separate from collaboration progress.

## Billing

| Tier | Single event | Annual account | Per-event limits |
| --- | --- | --- | --- |
| Starter | Rp149.000 | Rp699.000 | 300 participants, 3 managers including owner |
| Growth | Rp499.000 | Rp1.499.000 | 1.500 participants, 10 managers including owner |

- src/contracts/billing.ts defines prices; src/mocks/demo/billing.ts implements local decisions. Single-event upgrade Rp350.000.
- Annual owner-account term: one calendar year from confirmation, unlimited qualifying events, no stacking/auto-renew/mid-term annual upgrade.
- At every upload recheck owner, term, capacity, managers and event end within term. Covered upload creates no extra order/charge; pin coverage only on successful publication.
- Published coverage lasts through event end plus 30 days. New/unpublished events need current rights.
- eventBilling remains intact; additive accountBilling stores subscriptions. Legacy organization billing is read-only and never grants new rights. Preserve exact historical amounts/data.

## Navigation and interactions

- Stable per-role sidebar, selected-event links above content. No report/package/edit-detail subsection or global search/command palette.
- Organizer sponsorship discovery: event recommendations and sent-request cards at /events/:id/sponsors, full searchable/paginated catalog at /organizer/sponsors, selected-company form at /events/:id/sponsors/invite. Preserve event context; select a published event if entering from the global catalog. Browsing never sends an invitation. Use existing request services and detail/follow-up dialogs.
- Subscription: exactly Starter, Growth, Custom cards; Custom links to /contact. Local checkout dialog, explicit creation/confirmation, pending resume and safe cancellation.
- Pengaturan via account popup; profile edit retained without Back. History only through settings, one chronological list. Legal links only in footer.
- Existing page Back is an accessible arrow in header with explicit destination. Custom shared asynchronous confirmations; browser beforeunload is native.
- Distinct header/sidebar/canvas/footer surfaces, bounded sections, mobile drawer focus, visible focus and reduced motion.
- No content accordion or details/summary elements. Open sections replace them across event, committee, sponsorship, packages, guide and FAQ. Normal form selects, account/navigation menus and dialogs remain. Summary readiness labels are presentation mappings of existing publication errors, not a second validator.
- Keep Ganti peran demo. No simulation/status disclaimers in UI, but truthful production gaps in technical docs.

## Safety and verification

- Browser/demo guards are not production security. Production requires secure sessions, server validation, scoped authorization, hashed secrets, proof privacy and no sensitive logs.
- Atomic capacity/duplicate checks, committee acceptance, billing confirmation and scan idempotence need database transactions and constraints.
- Preserve existing events, answers, tickets, evidence, assignments and old secrets. No implicit reset or destructive migration.
- Scope gate in AGENTS.md applies before edits. Update PRD for product decisions; architecture/essentials/contracts for technical decisions; schema only in approved persistence tasks.
- Run relevant tests and git diff --check. Local QA is not real-user validation, actual revenue or proof of production readiness.
