# PartnerHub Product Requirements Document

Updated: 18 October 2026. This consolidated baseline replaces conflicting dated requirements previously accumulated in this file. Historical delivery evidence is not a current product specification.

## Product and audience

PartnerHub is a web-based individual-event operations platform for campus organizations (BEM, Himpunan, UKM), youth communities and small event organizers. It connects event preparation, participant registration, committee recruitment, optional QR attendance and sponsorship management. Sponsorship discovery and benefit accountability are the differentiator, not ticketing alone.

Organizers currently coordinate through forms, spreadsheets, chats and personal sponsorship files. PartnerHub aims to reduce repeated data entry, unclear selection status, missed follow-ups and scattered evidence. These value and willingness-to-pay claims remain hypotheses, not validated outcomes.

The current build demonstrates connected flows locally with fictional data. Real authentication, email, shared persistence, secure uploads, payment processing and production authorization remain **In progress**. Functional QA is not a user study, customer adoption or revenue evidence.

## Users and authorization

- Accounts register as `user`, `organizer` or `sponsor`. Organizer/sponsor approval and email verification gate private actions. Production approval tooling is **In progress**.
- Users may be participants in one event and accepted committee members in another. These relations are event-scoped, not extra global account roles.
- Organizers own events and may assign event-specific managers. No organization/workspace creation, switching, workspace membership or cross-event workspace analytics remains.
- Sponsors can browse public event information without login. Proposals, invitations and private progress require an approved sponsor account.
- Demo account menu labels stay Penyelenggara, Sponsor and Peserta / Calon Panitia. Keep the top Ganti peran demo control.
- Assistant/project onboarding must not block work by asking "siapa nama kamu" or carrying over former-project identity rules. This does not remove necessary account/profile fields from the product.

## Organizer lifecycle

1. Complete event setup: title, category, 1 to 5 matching fields, description, same-day WIB schedule, venue, capacity, registration period, identity and desired modules. Matching fields are chosen during creation and locked once the event is created, including while it remains unpublished in Arsip acara.
2. Finish setup to store the event privately in **Arsip acara** at `/organizer/archive`. Complete records display **Siap diunggah**; incomplete historical records display **Perlu dilengkapi**. Creation alone creates no billing order.
3. Review and edit from Ringkasan acara before publication. No partial-draft quick-save, persistent signup draft or browser local-copy save/restore/delete feature exists. Form steps retain input in memory only.
4. Upload the event. Validate publication readiness and either verified per-event coverage or a currently qualifying owner-account subscription.
5. Only publication makes it visible to guests, sponsors and participants. Published event details cannot be edited through either the summary edit action or legacy edit URL.
6. Manage enabled registration, recruitment, attendance and sponsorship flows. Close the event, then retain historical records.

Internal `DRAFT` means unpublished, not a restored user-facing draft feature. Internal `ARCHIVED` means completed-event history, not the waiting-to-upload Arsip acara list. `/organizer` lists published/completed events, not waiting uploads.

## Publication pricing and subscription

Prices and limits are authoritative in `src/contracts/billing.ts`.

| Tier | Per event | Annual account subscription | Participants per event | Managers per event |
| --- | --- | --- | --- | --- |
| Paket Starter | Rp149.000 | Rp699.000/year | 300 | 3, including owner |
| Paket Growth | Rp499.000 | Rp1.499.000/year | 1.500 | 10, including owner |

- A single-event Starter-to-Growth upgrade costs Rp350.000. Custom means a special offer, not an invented price or entitlement.
- Annual subscriptions belong to the organizer account, not a workspace. Both allow unlimited events within their per-event limits. Growth covers smaller Starter-sized events.
- Per-event payment and qualifying subscription coverage are alternatives. Covered uploads create no per-event charge or zero-value transaction.
- Creating an order does not activate rights. Confirmation is separate. Pending orders expire after 30 minutes; retries must not duplicate purchases.
- An annual term starts at explicit confirmation and lasts one calendar year. No auto-renewal, stacking or mid-term annual upgrade is offered.
- Recheck the owner, subscription expiry, participant capacity, manager count and event end at every upload. The event must end no later than subscription expiry.
- Pin subscription coverage only when publication succeeds. Published-event rights last through event end plus 30 days, even if the subscription expires sooner. New/unpublished events still require current qualifying coverage.
- Preserve exact historical amounts, old published coverage and operational records. Removed organization-scoped annual orders remain read-only and never grant new rights.
- Subscription displays exactly three cards: Paket Starter, Paket Growth and Custom. Custom uses **Kontak PartnerHub** to `/contact`. No separate feature disclosure, transaction history or loose Custom section.
- Active tier and expiry appear inside its card. Checkout uses a feature-local dialog with explicit create/confirm actions, pending-order resume, cancellation and keyboard focus handling.
- **Riwayat transaksi** is accessed only through **Pengaturan**, not the sidebar or Subscription. Keep a single newest-first list, including read-only historical records.

These are local product rules, not proof of real money collection. Production gateway, webhooks, billing persistence and transaction concurrency remain **In progress**.

## Public discovery

`/explore` lists published ongoing/upcoming events with local search/time filters. `/explore/:id` shows shareable details, schedule, venue, organizer, ticket information and public supporter names without application login.

- Do not show public registration totals, capacity-fill indicators or invented popularity claims. Private organizer operational counts remain.
- Hide the entire sponsor section when empty. Only organizer-declared supporters and accepted commitments may appear, never pending/declined proposals.
- Never expose participant identities, contact data, QR secrets, commercial terms, private evidence URLs or follow-up notes.
- Unpublished, closed, archived and unknown events are unavailable publicly. Elapsed published events leave discovery; a direct page may show their completed schedule until closure.
- Registration/proposal actions still enforce account, publication, module and date/window eligibility. Login continuation preserves the selected event.

## Participant registration and tickets

- Reuse necessary consented profile data separately from event-specific answers. Answer labels are snapshotted so later form edits do not rewrite past submissions.
- Current forms use one event-level ticket price and payment instructions. All seeded events have illustrative paid prices; the current contract still permits price 0 for new events. Multiple ticket categories, multi-ticket orders and discounts are not implemented.
- Participant ticket payment is separate from the organizer's PartnerHub publication fee. PartnerHub does not process ticket money.
- Paid registration starts `PENDING`; organizer reviews proof and confirms `REGISTERED` or rejects `REJECTED` with an optional note. Free registration starts `REGISTERED`. Rejection permits a new submission; duplicate pending/confirmed registrations and over-capacity confirmations are refused.
- `/me/events` contains Tiket saya and a private read-only registration receipt. Proof and answers are loaded on demand for the registration owner, never included in public lists.
- QR display requires confirmed registration, explicit organizer issuance and currently enabled registration plus attendance modules. Fetch the opaque payload only when the participant opens Tampilkan QR.
- Pending/rejected/cancelled or unissued tickets do not receive QR. Existing secrets/receipts are retained when a module is disabled, not erased.

## Committee recruitment

`/committee` lists openings; `/me/applications` contains Lamaran saya. Applications are not mixed into the ticket page.

Organizers configure a needs description, 1 to 12 unique divisions, zero to five ordered custom selection stages and one optional question. Needs, divisions, stages and question have separate bordered sections and one save action area.

Applicants choose preferred divisions, provide motivation and answer the optional question. Services return the allowed transitions; arbitrary status changes are rejected. Acceptance requires a next-steps note. Opening/closing recruitment does not itself revoke an accepted membership.

Current statuses are `SUBMITTED`, `IN_SELECTION` with `stageId`, `ACCEPTED`, `REJECTED`, and `WITHDRAWN`. `visitedStageIds` records reached stages for new applications. Unvisited stages display Dilewati; missing legacy history displays Tidak tercatat, never fabricated completion. Full immutable stage-definition audit history remains **In progress**.

## Optional QR attendance

- Modes are `NONE`, `ENTRY`, and `ENTRY_EXIT`. QR requires registration and attendance modules. Disabled-module actions are hidden and direct use rejected, not inspection-only.
- Participants show their own issued QR in Tiket saya. Organizers scan under Presensi; accepted committee members scan from their own Lamaran saya card at `/me/committee/:id/scan`.
- Check current accepted membership, correct event, account approval, event publication and modules on every scan. Ordinary participants, sponsors, rejected/withdrawn members and members of other events cannot scan.
- Committee responses contain only display-safe ticket identity/status and entry/exit timestamps. No answers, proof, notes, contact details, secrets or bulk registrant list. Committee cannot configure attendance, issue QR or confirm payments.
- Camera or local QR-image decoding stays on-device. Only the decoded opaque payload is sent. Camera stops on result, dismissal, page hide and unmount.
- First entry/exit timestamps remain stable under retries. Reject exit-before-entry and disabled exit. QR screenshots are bearer proofs, not identity verification.
- No redundant Scan QR shortcut remains in Pendaftaran or QR delivery. No offline synchronization or hardware integration is promised.

## Sponsorship and two-way matching

- Organizer opens **Ajak sponsor** for an event. The page contains matching sponsor recommendations and a separate sent-request card section, not an invitation form or the full directory. Smart Matching has a leading matching icon and a Jelajahi sponsor lain action.
- Selecting a sponsor opens `/events/:id/sponsors/invite?sponsorId=...`, where that specific company is shown above the existing request fields. Merely selecting/browsing never sends a request. Sending requires a published, authorized event and a verified sponsor; pending duplicates remain blocked.
- `/organizer/sponsors` is the separate Jelajahi sponsor sidebar destination, with company/industry search and pagination. Opening it from an event preserves eventId. Without event context, selecting a sponsor asks which authorized published event to use before opening the invitation form. Sent cards retain sponsor name and response status, with available illustrative photography; empty history has a bounded empty state. Request detail and follow-up use the existing dialog.
- Sponsor recommendations are at `/sponsor`, full catalog at `/sponsor/events`, and a read-only field summary at `/sponsor/preferences`. Sponsors select industry at registration; new accounts use it for matching without a second setup. Prepared sponsor accounts retain their existing fields.
- Event matching fields are selected only during event creation and cannot be changed after creation, even before upload. Matching pages show saved fields and recommendations without field-selection controls. Existing legacy data is preserved; unknown fields stay unknown rather than being fabricated.
- Matching uses deterministic shared category/industry/interest fields and understandable reasons. It is not real AI, a confidence score, a notification service or guaranteed funding.
- Sponsor collaboration is separate from discovery: requests at `/sponsor/progress`, proposals at `/sponsor/progress/proposals`, benefit/evidence at `/sponsor/progress/benefits`.
- Organizer incoming proposals and outgoing invitations use separate pages. Requests and sponsor-initiated proposals remain separate records; a suggested match never creates a deal.
- Track decisions, commitments and benefit evidence with scoped services. Evidence is verified through explicit authorized review, never inferred from a logo, a click or a recommendation.
- Proposal, portfolio and evidence attachments remain URLs. Real file storage, advanced analytics, matching notifications and success-fee collection remain **In progress**.
- Removing Laporan & bukti from selected-event navigation does not delete evidence records or compatibility report URLs.

## Navigation and interface

- Stable, grouped left sidebar for each role. Selected-event subsections belong above content, not injected into the sidebar.
- Selected-event links: Ringkasan acara, Pendaftaran, Kelola panitia, module-dependent QR tiket/Presensi, Ajak sponsor and Pengelola. No Laporan & bukti, Paket acara or Edit detail subsection.
- Summary shows actual coverage as Paket Starter or Paket Growth, not a tier guessed from capacity. Uncovered events offer package checkout.
- Account popup uses **Pengaturan**, not Profil. Settings retains profile editing, has no Back action and exposes transaction history only for eligible organizers.
- Existing page Back controls are arrow-only in the shared header, with explicit destinations and accessible labels. Form step controls remain separate.
- No global search, command palette or Ctrl/Cmd+K handler. Page-specific filters remain.
- Header, sidebar, canvas, footer and internal form sections use visibly distinct surfaces/borders and spacing. Landing stays short: hero, three-step workflow, role entry points and short visible FAQ answers, without feature tabs or repeated calls to action.
- Content must not be hidden in accordions or details/summary dropdowns anywhere in the application. Use open, labeled sections with visible separation. Form select controls, account/navigation menus, dialogs and normal feature actions remain available. Do not restore the removed shared Accordion component.
- Event summary aligns status text with the title, uses short readiness labels derived from existing publication errors, and places detail, schedule and registration in full-width sequential sections. Visual identity, module settings, management and lifecycle actions remain visible without disclosure clicks. Preserve all readiness/payment/authorization checks and lifecycle confirmations.
- Terms and privacy links appear in the shared footer only, not sidebars. Preserve `/terms` and `/privacy`.
- Use shared custom asynchronous application confirmations. Cancel/Escape never mutates; contain and restore focus. Browser refresh/tab-close beforeunload remains native.
- Keep product-style Indonesian UI copy without simulation/prototype/In progress notices, except the retained demo role switch. Technical documentation must disclose unfinished integrations honestly.
- Use realistic fictional fixtures and bundled photography with provenance, never fake real customers or partnerships. Maintain keyboard access, visible focus, readable contrast, reduced motion and 320px mobile usability.

## Functional acceptance

| ID | Requirement | Acceptance |
| --- | --- | --- |
| FR-01 | Prepare, archive and publish an event | No charge at creation; private until authorized publication; published detail locked |
| FR-02 | Consent and reusable profile | Profile data separated from per-event answers and reviewed by participant |
| FR-03 | Role and event scope | Account role plus approved status and event ownership/membership enforced |
| FR-04 | Registration | Window, capacity, duplicate and proof-review rules enforced |
| FR-05 | Ticket privacy | Opaque PH1 secret, no personal data in QR or list payloads |
| FR-06 | Optional attendance | No disabled-module use; idempotent entry/exit and least-privilege committee scanning |
| FR-07 | Committee application | Stable division preferences, motivation and optional answer |
| FR-08 | Selection | Custom stages and allowed moves; truthful history and acceptance note |
| FR-09 | Committee membership | Acceptance required for same-event scan permission |
| FR-10 | Sponsorship | Two-way discovery and separate progress; explicit decisions and evidence review |
| FR-11 | Operational totals | Authorized data only, no public registrant/popularity display |
| FR-12 | Ticket payment review | Paid pending, confirm/reject, no QR before confirmation |
| FR-13 | Publication billing | Account subscription or per-event coverage, never duplicate charge |
| FR-14 | Navigation | Stable sidebar, content-level event nav, settings-only history, footer-only legal links |

Demo checks exercise these behaviors locally; they do not establish production server/database guarantees.

## State model

| Entity | Current contract states |
| --- | --- |
| Event | DRAFT, PUBLISHED, CLOSED, ARCHIVED |
| Registration | PENDING, REGISTERED, REJECTED, CANCELLED |
| Committee application | SUBMITTED, IN_SELECTION, ACCEPTED, REJECTED, WITHDRAWN |
| Sponsor proposal | SENT, IN_REVIEW, ACCEPTED, DECLINED |
| Sponsor prospect | PLANNED, CONTACTED, NEGOTIATING, AGREED, DECLINED |
| Sponsor benefit | PLANNED, VERIFIED |
| Billing order | PENDING, SUCCEEDED, EXPIRED |

These frontend/demo contracts exceed the older Prisma schema. Schema alignment is **In progress**, not implied by this document.

## Validation and commercial boundaries

Research targets, not achieved results: interview 5 to 10 organizers, test registration with 5 participants, review recruitment with applicants/organizer, run QR valid/duplicate/invalid/wrong-event checks, and review sponsor invitation/proposal progress. Record completion time, confusion, errors, switching intent and willingness to pay.

Current organizer prices are product decisions, not validated demand. Sponsorship success fee, premium sponsor reporting and ticket transaction fees are future hypotheses only, without a current percentage, price or collection claim. Do not claim revenue, actual partnerships, customers or completed user testing without evidence.

## Challenge review and release blockers

- Subscription expiry/limits can change between load and upload. Recheck at mutation; preserve historical amounts and pin only successful publication coverage.
- Concurrent purchase confirmations, last-seat registration and repeated scans need transactional production guarantees. Browser-local tests do not supply them.
- Preserve old records and secrets; do not reset storage or silently reactivate legacy annual entitlements.
- Protect proof, verification documents, profile answers and private proposal terms. Decide retention, deletion, export, recovery and exact consent before real-data release.
- Define production authentication, secure cookie/session policies, abuse limits, provider integrations, image normalization/storage and operational support.
- Free-price support remains in current contracts despite paid seed examples. Any requirement to prohibit all free new events needs a separate approved implementation, not a false documentation claim.
- Keep one modular application. Do not add workspaces, a generic workflow engine, a new billing abstraction, real AI, chat, task boards or a broad marketplace to solve this scope.
- Multi-day/overnight schedules, ticket categories, multi-ticket orders, waitlists, certificates, templates, refunds, settlement and production deployment remain **In progress** or explicitly deferred.
