# Organizer and shared landing frontend

Updated: 18 October 2026. The historical workspace folder name is not an organization/workspace product.

## Current responsibilities

- Landing page and organizer event list/archive, shared role-shell composition and account subscription UI.
- /organizer lists published/completed authorized events. /organizer/archive lists private completed setup awaiting upload, with Siap diunggah or Perlu dilengkapi.
- Event creation alone creates no order. Upload resolves qualifying annual owner-account coverage or verified single-event coverage. See subscription/README.md and root PRD.md.
- No workspace creation/switching/membership, cross-event overview or annual-only event duplication.
- No quick-save, browser local-copy controls, persisted signup draft or draft-resume dashboard.

## Navigation and presentation

Role sidebars stay constant, including when an event is selected. Selected-event navigation belongs above content; the event frontend owns its operations. Event data and UI compose through thin route adapters and shared contracts, not cross-feature internal imports.

Pengaturan is in the account popup, never a profile sidebar destination. Transaction history is reached only through settings, not Subscription or the sidebar. Legal links belong only in the shared footer. No global search/command palette remains; local event filters remain.

Landing stays concise: hero/organizer preview, three-step workflow, role entry points and three short visible FAQ answers. Bounded sections alternate clear surfaces with spacing/borders. No feature tabs, animated bento comparison, scenario rails or duplicate closing CTA. Reuse shared PublicHeader; FAQ owns static semantic sections, not the removed shared Accordion.

Keep the established navy/blue palette, self-hosted fonts, readable controls, mobile drawer focus/Escape behavior and reduced motion. Preserve Ganti peran demo; do not add prototype/simulation/status disclaimers to product UI. Fictional fixtures are not traction.

## Data and verification

Typed loaders/services supply data. The explicit demo uses src/mocks/demo; normal builds do not silently fall back. Production authentication, persistence, billing and payments remain **In progress**. Never reset browser data to reconcile docs or refresh fixtures.

Relevant browser suites cover landing, stable navigation, header Back, footer-only legal links, archive/subscription and subscription/settings. Historical screenshots may show superseded workspace/draft controls; current PRD and contracts govern implementation.
