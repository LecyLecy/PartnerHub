# PartnerHub product context

<!-- impeccable:product-schema 1 -->

Updated: 18 October 2026.

## Platform

web

## Source of truth

This design-facing summary follows PRD.md, not historical screenshots or old revision notes. ARCHITECTURE.md describes complete implementation boundaries; prisma/schema.prisma describes implemented persistence only.

## Users

Campus organizations, youth communities and small organizers, with separate participant/applicant and sponsor experiences. Account roles are user, organizer and sponsor; committee/manager access is event-scoped.

## Product Purpose

Connect individual-event setup, consented participant registration, committee selection, optional entry/exit QR attendance, sponsor discovery and benefit accountability. Sponsorship is the differentiator, not ticketing alone.

## Operating Context

Teams currently coordinate through forms, spreadsheets and chat. Current connected demo flows use fictional browser-local data. Actual demand, revenue and completion-time improvements are not validated. No organization/workspace setup or switching is required.

## Capabilities and Constraints

Complete setup first, store privately in Arsip acara, then upload using verified per-event payment or a qualifying annual owner-account subscription. Published details cannot be edited. No quick-save, browser local-copy restoration or persisted signup draft.

Starter costs Rp149.000/event or Rp699.000/year, with 300 participants and 3 managers per event including owner. Growth costs Rp499.000/event or Rp1.499.000/year, with 1.500 participants and 10 managers. Annual plans cover unlimited qualifying events, not an extra mandatory charge per upload. Custom uses Kontak PartnerHub.

Public event discovery needs no login, hides registrant counts and omits empty sponsor sections. Two-way shared-field matching is implemented locally, not real AI or automatic matching notifications. Sponsor industry is fixed at registration; event matching fields are fixed at creation, even before upload. Matching pages are read-only, preserve existing fields and never invent unknown legacy values. Sponsor discovery stays separate from requests, proposals and benefits progress.

Optional QR requires registration and attendance modules; participants show issued QR and accepted same-event committee can scan it with limited data. Paid tickets use organizer-reviewed proof, separate from publication billing. Real authentication, approval, email, shared database, storage and gateway remain **In progress**.

## Brand Commitments

Use the established navy/blue system, readable self-hosted typography and restrained action accent. UI copy is Indonesian; technical docs are English. Product-style UI omits simulation/prototype/development notices but retains Ganti peran demo. Never imply fictional people, photos, activity or brands are actual customers or partnerships.

## Evidence on Hand

PRD.md, architecture documents, current source/contracts/schema and local test/browser evidence. Bundled photographs have provenance in public/demo/photos/CREDITS.md. No verified customer, revenue or owned market-study dataset is established by these fixtures.

## Product Principles

- Stable role sidebars and selected-event navigation above content.
- Separate task pages and visibly bounded sections, not large mixed-purpose dashboards.
- All explanatory/form content stays visible in open sections, never accordion dropdowns. Keep normal selects, menus and dialogs. Event status aligns with the title; readiness copy is concise and registration follows schedule in one reading flow.
- Settings via Pengaturan popup; transaction history only in settings; legal links only in footer.
- Exactly Starter, Growth and Custom subscription cards; feature-local checkout dialog.
- No global search, command palette, browser draft tools or workspace product.
- Consented profile reuse, private answers/proof and opaque QR.
- Reuse existing services and feature ownership; do not invent new infrastructure.
- Honest technical gaps and no fabricated traction.

## Accessibility & Inclusion

Support keyboard navigation, visible focus, readable contrast, reduced motion and layouts down to 320px. Custom confirmations and checkout dialogs contain/restore focus and cancel without mutation. Existing Back controls are accessible arrow-only header actions; settings has no Back.
