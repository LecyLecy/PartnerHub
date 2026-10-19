# Event frontend

Updated: 18 October 2026. Owns event setup, summary/edit/publication and public event views. Backend owner: src/backend/event.

## Current lifecycle

Complete the four-stage setup, then submit valid title, schedule, venue and capacity to the event service. The event is private in /organizer/archive, internally DRAFT, displayed Siap diunggah or Perlu dilengkapi for incomplete historical records. Creation creates no order.

Select 1 to 5 matching fields during creation. They are stored in the existing demo matching map together with event creation and returned through EventRecord.matchingFields. They are read-only in subsequent editing, even before publication. Event PATCH rejects field replacement/clearing; missing fields from older clients preserve saved values. Untagged historical events stay untagged and can still edit other permitted details. Ajak sponsor never offers a second field picker.

Upload requires readiness plus verified single-event coverage or a qualifying owner-account subscription. Recheck tier limits, manager count, active term and event end at submission. Only PUBLISHED events enter discovery. Existing published rights last through event end plus 30 days. Prices and full billing rules are in PRD.md and src/contracts/billing.ts.

Edit reuses the editor from Ringkasan acara at /events/:id?edit=1 before publication only. Legacy /edit URLs have the same publication lock. No second editor, partial-draft save, browser-copy save/restore/delete, annual-only duplication or workspace selection exists. Form-step values stay in memory; reload starts a new empty form. Legacy browser copies are ignored, not erased.

## Navigation and composition

Stable role sidebar comes from shared navigation. Selected-event sections render above content. No Laporan & bukti, Paket acara or Edit detail subsection. Existing report/evidence records and compatibility URLs remain.

Summary status is flush-aligned with its title. Short publication checklist labels map existing publicationErrors without changing validation. Detail, schedule and registration are sequential full-width sections; identity, modules and lifecycle actions remain open. Managers are also an open section. No content details/summary or accordion controls are permitted; custom confirmations and published edit locks remain unchanged.

Each page mounts exactly one ProtectedPage shell. The summary edit query delegates to EventEditorPage, which already owns its protected shell; only the read-only summary branch wraps Detail. Do not wrap the editor again. The summary navigation browser regression checks both archive edit actions, reload, legacy edit/new routes and published edit locks at desktop/mobile sizes.

Summary labels coverage from actual entitlement as Paket Starter/Growth, never capacity inference. Uncovered events may open checkout; /events/:id/team manages event collaborators. Do not import subscription feature internals into event code; use shared contracts/loaders and route composition.

## Public event projection

/explore and /explore/:id are guest-readable published views. Show schedule, venue, organizer, ticket information and public supporter names. Hide registrant totals/fill indicators; omit empty sponsor sections. Pending/declined proposals are not sponsors. Never expose proof, answers, private proposal terms or QR secrets.

Daftar peserta targets /me/register/:id and preserves event through login; registration owns its form. Sponsorship submission requires an approved sponsor. Ended events omit registration/proposal actions, elapsed records leave discovery and closed/unpublished/archived/unknown details are unavailable.

## Editor and identity

event-draft-builder.tsx is the historical filename for idea, same-day WIB schedule, identity and module configuration, not a draft persistence feature. It retains live poster/page preview.

logo-input.tsx accepts PNG/JPEG/WebP up to 2 MB and 4096 pixels per axis, native file selection/drop, replace/remove, decode checks and contain-fit preview. Reject invalid/multiple input without replacing the valid asset; revoke object URLs. Up to six named sponsor placements are permitted. Event/organizer identity is user-provided, not hard-coded. Display logos alone do not create sponsorship commitments.

Submission uses existing asset/event services. Production storage, authorization, image normalization and persistent operational APIs remain **In progress**; the explicit local demo connects these flows in-browser.

## Tests

tests/event includes model/readiness and public discovery checks. no-draft-browser-check.mjs, summary-navigation-browser-check.mjs and workspace/archive-subscription-browser-check.mjs exercise current setup/archive/upload and edit locks. Full delivery checks cover registration, optional QR and sponsorship. Historical screenshots are not authority to restore removed behavior.

Single-shell fix verified locally on 18 October 2026: the new browser assertion first reproduced two sidebars, then passed after branch-level shell ownership was corrected. Both archive edit actions and reload have one sidebar/main/event navigation at 1440/390/320px. Legacy edit/new routes, save, payment/publication and published edit locks pass. No-draft browser regression, 18 event tests, 10 import-boundary tests, typecheck, lint and demo build also pass. Browser tests use isolated storage, not the user's Chrome data.

Open-section revision verified locally on 18 October 2026: 172 unit/integration tests, typecheck, lint, import boundaries and demo build pass. Nine browser suites cover open summary/FAQ content, single-shell editing, landing, custom confirmations, matching, committee decisions, archive/subscription publication, full delivery and UI clarity. Status/title alignment, short readiness labels, sequential registration, visible manager controls and 1440/390/320px layouts are checked. Source AST checks reject new details/summary/Accordion JSX. Screenshots were inspected; independent browser sessions preserve the user's data, and read-only section navigation preserves operational/billing records.
