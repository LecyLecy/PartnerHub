---
name: PartnerHub campus program studio
description: PartnerHub visual system and historical design-delivery notes.
colors:
  navy: "#162748"
  muted: "#526078"
  ground: "#f7f8fb"
  surface: "#ffffff"
  yellow: "#f5d765"
  line: "#cdd5e2"
  control-border: "#7f8a9c"
  focus: "#1e54aa"
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontWeight: 700
    fontSize: "clamp(2.5rem, 1.5rem + 4vw, 4rem)"
    lineHeight: 1.1
  body:
    fontFamily: Manrope
    fontWeight: 400
    fontSize: "1rem"
    lineHeight: 1.6
  button:
    fontFamily: Manrope
    fontWeight: 600
    fontSize: "1rem"
  supporting:
    fontFamily: Manrope
    fontSize: "0.875rem"
rounded:
  field: "8px"
  action: "8px"
  event: "12px"
  dialog: "16px"
---

# PartnerHub campus program studio

## Current design baseline, 18 October 2026

Use PRODUCT.md, PRD.md and ARCHITECTURE-ESSETIALS.md for current requirements. Retain the visual tokens above, readable typography and distinct bounded surfaces, but do not restore the removed workspace product or browser draft-copy workflow.

Current UI uses stable per-role sidebars, selected-event navigation above content, concise landing sections, Pengaturan through the account popup, settings-only transaction history and footer-only legal links. Existing Back actions are header arrows; global search/command palette is removed. Subscription has exactly Starter, Growth and Custom cards with dialog checkout. Optional participant QR display and accepted-committee entry/exit scanning exist locally. Preserve Ganti peran demo without adding simulation/status disclaimers elsewhere in the product UI.

The remaining sections below are historical design and finish-review evidence. Statements about draft persistence, absent scanning, old navigation or deployment describe their original revision, not the current implementation or authority to reintroduce it. New user-facing design decisions belong in PRODUCT.md and PRD.md rather than another conflicting dated override.

## Historical design record

The user rejected the former organizer briefing dashboard as generic, lifeless, and too small. The approved replacement is bold and creative, distinctly campus-oriented, navy-led, with larger text and a usable event-draft workflow. The old rail, statistics strip, table, and checklist are no longer design authority.

Reading this as: a campus event-planning workspace for student organizer teams, in a typography-led program-studio language. ENERGY 3 / RHYTHM 2 / MOTION 1. Movement stays limited to hover/state feedback rather than decorative choreography; interaction comes from changing event context and editing a live draft.

## Decisions and purposes

- Navy anchors the program covers and action hierarchy because the owner explicitly retained it.
- Warm yellow marks the creation action and differentiates the workshop cover, without becoming an accent on every control.
- Bricolage Grotesque 700 gives headings and typographic event covers their expressive campus voice; Manrope 400/600 supports readable Indonesian forms and operational copy. Both are self-hosted with adjacent SIL OFL licenses.
- Large editorial introductions lead to event selection or creation rather than an arbitrary metrics dashboard. Primary body/form prose is at least 16px at default root size; status/provenance labels are at least 14px.
- Event program cards pair an expressive cover with real fixture context. They are selection controls, not claims of product traction. Sponsor follow-ups remain a separate sample view.
- The desktop context panel sits beside the lineup. At 950px and below the layout stacks, and choosing an event reveals/focuses its updated context so the action has a discoverable result.
- Desktop drafting pairs generous fields with a live poster/detail preview. Mobile preview is explicitly expandable, leaving the form usable without mandatory extra scrolling.
- Flat surfaces and borders separate content. Only the native help dialog uses a shadow to mark temporary elevation.
- Onward actions may use proportional arrows; selection, storage, filters, help, and back controls are not all decorated with arrows. Functional SVGs identify search/information/close and relevant operational tasks, not a generic icon-library aesthetic.
- Spacing separates narrative, selection, and editing: desktop main padding 54px 48px, lineup/context gap 44px, form/preview gap 32–80px. It is not a uniform card grid.

## Implemented vocabulary

### Folio-inspired motion and shell revision, 2026-10-06

**In progress** (frontend only; stages 1 to 4 of 7 done). The owner asked for the design language, motion, and interaction patterns of a reference site (folio-topaz-delta.vercel.app). Observed with an external Playwright run (desktop and mobile screenshots, keyframes, computed styles); hover and scroll timing were not observed live because the desktop browser was not connected. Nothing was copied: no code, assets, logos, photos, or text. The 2026-10-06 yellow poster landing below is superseded by this landing.

Adapted from the reference: white page with hairline dashed column rails, pill announcement, large tight headline, two buttons, a dashboard mockup rising under the hero, a marquee strip, a bento grid of live demos, segmented tabs, an accordion FAQ, a soft closing panel, and a large footer. Easing is `cubic-bezier(.4, 0, .2, 1)` for state changes and an exponential ease-out for entrances, 150, 300, and 500 ms.

Deliberately different:
- Headline face stays Bricolage 700 with Manrope body (two families). The reference uses a licensed serif; none was added.
- Navy ink with one yellow accent replaces black and white. No dark mode.
- No logo cloud of partners and no testimonials. The strip lists organization types; the usage section is labeled as scenarios and carries no names or quotes, because the product rules forbid invented social proof.
- Pricing page states that pricing is undecided. Contact page states that no channel is set. Neither invents numbers or addresses.
- The reference app shell is applied to organizers only. Participants and sponsors keep the website frame (owner decision), with the command palette in their header.
- Dashboard "favorites" and data columns the services do not provide are not shown.

Tokens (`src/lib/design-tokens.css`): `--radius-pill|card|panel`, `--shadow-1|2|3`, `--ease-standard|out|spring`, `--dur-fast|base|slow`, `--text-hero`, `--text-section`, `--line-dashed`. Older tokens are unchanged.

Motion rules, all in `src/lib/motion.tsx` and `src/lib/ui/`:
- Reveal fades up once per element. Content is visible without JavaScript and under reduced motion; an element is marked hidden only after mount and only when it starts below the fold.
- Looping effects (marquees, feed, typing, workflow) run only while on screen and while the tab is visible, pause on hover or focus for marquees, and under reduced motion render a static equivalent with the same information. Every animated state is also written as text.
- Only transform and opacity animate, except the accordion grid-row height and the sliding tab indicator (transform).
- Duplicated marquee groups are `aria-hidden` and `inert`.

Components added: Tabs (sliding indicator, arrow/Home/End), Accordion (one open), Toggle (44px hit area), Toast (provider mounted, not yet used), Marquee, Timeline, Avatar stack, sortable DataTable, command palette on native `dialog`, notification popover, organizer shell (grouped, collapsible, drawer below 60rem).

Known limits: hover and transition feel were not judged live; Lighthouse was not run; the dashboard preview and all landing numbers are illustrative and labeled so. The bento and scenario sections were adjusted after review screenshots showed a gap in the grid and a rail that showed one card.

Stages 5 to 7 (dashboards, forms, remaining pages) apply the landing language to every role page. Shared blocks in `src/lib/ui/stats.tsx`: `PageHeader` (title, one line, primary action), `StatGrid` (count-up metric cards), `SkeletonCards` (opacity pulse only), `Meter` (transform-based capacity bar). Action feedback for registering, applying, and answering a sponsor request uses `useToast` instead of an inline notice. The organizer greeting uses the account display name when it exists. Metrics come only from data the services already return (event counts, registrants, applications, proposals, commitments); no new fields or charts were invented. Yellow poster hero blocks on the participant, sponsor, and committee pages are gone; cards use one declared elevation (border plus `--shadow-1`), 12 to 16px radii, and status is a badge, not a thick colored border. Form pages (login, register, committee opening) sit in a single bordered card.

Follow-up revision (owner feedback, same day):
- One header everywhere. `src/lib/ui/site-header.tsx` is the landing header (sticky, translucent after scroll, hamburger below 48rem). Guests, participants, and sponsors all use it. Signed-in users get the organizer-style profile (avatar plus display name, linking to Settings) and a Keluar button on wide screens; both move into the menu on small screens.
- Organizer sidebar is a hover rail, not a toggle. At rest it is a 4.75rem icon rail; hover or keyboard focus widens the real sidebar over the page (width and shadow only, the page column never moves, labels fade in after the width settles). The collapse button and its localStorage key are gone. The profile moved from the top bar into the top of the sidebar; the top bar keeps only search and notifications. Below 60rem it is still a drawer.
- Event cards (`src/lib/ui/event-card.tsx`, shared by participant and sponsor): the organizer's logo (initials when none) sits on top, the event logo is the cover with a dark scrim for text contrast, and the only action on the card is "Detail". A native `dialog` opens with about, schedule, location, capacity meter, organizer, and displayed sponsors. Role actions ("Daftar acara", "Ajukan dukungan") live inside that dialog, so nothing is triggered from a half-read card. On phones the dialog is a bottom sheet.
- Data: `PublicEvent` now carries `eventLogoUrl`, `organizationLogoUrl`, and `sponsorNames`, taken from the event's existing branding. Logo URLs use the same rule as organizer assets (same-origin or https); a bad URL drops only that image. The organizer's "profile photo" is the organization logo from the event; accounts have no separate photo field, and none was added. Demo published events use bundled SVG art in `public/demo/`.

Second follow-up (owner feedback, same day):
- Account menu (`src/lib/ui/account-menu.tsx`): the profile sits at the bottom of the organizer sidebar and at the right of the participant and sponsor header. Pengaturan and Keluar stay hidden until the chevron opens them; it opens upward in the sidebar and downward in the header. The old plain Keluar button is gone everywhere.
- Notifications are the bell in the header for every role. The in-page Notifikasi list (`src/lib/notifications.tsx`) was removed.
- Committee pages use the shared `InfoCard`: organizer logo, event logo cover, one Detail button. The dialog shows the selection path (`SelectionSteps`, the landing workflow look: done, running, waiting, stopped; state is also text). Organizers define 0 to 5 stages per opening (rename, reorder, add, remove); applicants always see Lamaran masuk, the organizer stages, then Diterima.
- Organizer dashboard is a sortable table (acara, status, pendaftar with capacity bar, lamaran, sponsor) under three count-up totals. Numbers come from `/api/organizer/summary`, which now also returns per-event `applications` and `sponsors`.
- QR: the organizer opens "QR tiket" on an event and uses one button to create and send codes to every registration that has none. Participants see "Tampilkan QR" on a ticket only after that; otherwise the ticket says the QR was not sent. The code is drawn by an own encoder (`features/registration/qr/qr-code.ts`, byte mode, level M, versions 1 to 6; 2321 payloads round-tripped through jsQR) as one SVG, always black on white. The payload is `PH1.` plus a random secret, never printed as text, never personal data. Door scanning is still not built.
- Landing: header is the shared sticky one (Masuk before Daftar), the skip link is gone from the landing page, the bento is three equal columns, and the sliding tab pill now animates width so it keeps its radius.

Third follow-up (owner feedback, same day):
- Back: every page reached from another page starts with a "Kembali" button (`BackLink`, also inside `Breadcrumb`). The organizer dashboard rows open their event on a click anywhere in the row.
- Selection path is horizontal and scrolls sideways instead of stacking. Applicants are split into three screens under `/events/:id/committee/pelamar|seleksi|diterima`; the committee page keeps only the opening form and the three entry cards. Each screen exports to Excel.
- Participants: "Acara" (`/me`) lists only events not yet joined, and registering happens in the Detail dialog through the organizer form. "Acara saya" (`/me/events`, in the profile menu) holds tickets with QR and the committee applications. The two sections are composed in `src/app/me/events/page.tsx` because features may not import each other.
- Price and registration form: the organizer sets price (0 is free, shown as Gratis), a payment note, and up to 10 questions (short text, long text, choice, image) at `/events/:id/registration`. A priced event needs a payment note and one image question for payment proof. PartnerHub only shows the price; it never takes payment. Answers copy the question text, so later edits do not rewrite old answers.
- Excel export (`src/lib/xlsx.ts`, own writer, checked by exceljs and jszip) for registrants and committee applicants, built in the browser. Image answers are not written into the sheet, and no email is exported.
- Sponsor: the anchor menu is gone; requests, benefits, and proposals sit in a column beside the event catalog.

Not done in this pass: a detail drawer for organizer events (the existing detail page stays), and the event editor and registration wizard internals (their logic and step markup are unchanged; they inherit the shared tokens and controls).

Evidence: `tests/workspace/landing-check.mjs`, `app-shell-check.mjs`, plus the existing redesign, product-flow, role-flow, and committee browser checks.

### Role-specific layout revision, 2026-10-06

Frontend presentation implemented; backend remains **In progress**. Owner-approved scope: workspace and sponsorship frontend, shared frame/styles, and verification tests. Landing follows the explicitly selected chemtest.fr reference: oversized centered lettering, playful text placement and full color fields, translated into existing navy/yellow identity rather than copying its assets or subject matter. No GSAP or new dependencies. The user-approved reference overrides the exploratory concept seed (35a4e922); unrelated instrument, cathode, metro, football, origami and garden directions are not adopted because the reference and role layouts are already pinned.

Direction contract: THESIS: an event starts with a story and continues through accountable sponsorship, not a generic software hero. OWN-WORLD: Bricolage lettering on yellow/navy fields, flat surfaces, Manrope task copy; no new photography or illustrations. STORY: understand preparation, choose an existing role and enter its existing flow. FIRST VIEWPORT: a yellow full-width poster with centered oversized headline, offset supporting phrases and a visible organizer signup action; explanation below is navy. FORM: user-pinned reference, code-led, seed 35a4e922 acknowledged and superseded by the user's selection. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Modes and dials: landing Persuade, ENERGY 3 / RHYTHM 3 / MOTION 1; organizer Operate, ENERGY 1 / RHYTHM 2 / MOTION 1; sponsor catalog Operate, ENERGY 2 / RHYTHM 2 / MOTION 1. Light task surfaces suit event teams working on laptops and phones in ordinary daytime conditions. Navy marks selected navigation and yellow distinguishes public presentation. The organizer-only shell covers approved active organizer work routes and settings, not public/legal/auth pages. Avatar is a default person glyph, never a fabricated portrait. Sponsor home lists existing public event records with organizer, schedule and venue; proposal and benefit views remain available. This is a catalog presentation, not payment, matching, chat or a new marketplace backend.

Surface-local type extensions intentionally exceed the task-page ramp: landing poster is clamp(4.5rem, 10.8vw, 9rem), with 3.7rem at widths below 25rem; supporting phrases are 1rem–1.5rem; section statements are 2.5rem–5rem and role names 1.75rem–3rem. Sponsor introduction is 2rem–3.5rem; event cover headings are 1.75rem–2.25rem. These belong to public poster/catalog presentation, not form controls or shared tokens. The detector's seven off-ramp advisories are accepted for this explicitly requested direction; no mechanical issues were reported.

Initial independent finish review: **Fix**, one material finding, missing whitespace where a mobile-hidden line break joined two words. Corrected in the landing supporting phrase. All six desktop/mobile captures and the reference were inspected. Mobile organizer navigation wraps but remains functional; no speculative menu was added. Catalog action retains the generic existing proposal route, so the user chooses the target event in that form. Event-specific preselection is not implemented or claimed.

The corrected whitespace finding was independently scored **Resolved**, with disposition **Ship** confined to that finding. This is not a claim that a full independent review passed after the fix. The seven intentional type-ramp advisories above remain accepted, not normalized.

#### Intended files and scope review

Exactly ten intended files for this revision:

- `DESIGN.md`
- `src/features/workspace/landing-page.tsx`
- `src/features/workspace/landing.module.css`
- `src/features/workspace/dashboard.module.css`
- `src/features/sponsorship/sponsor-dashboard-page.tsx`
- `src/features/sponsorship/sponsorship.module.css`
- `src/lib/ui/site-frame.tsx`
- `src/lib/ui/role-shell.module.css` (new)
- `tests/workspace/frontend-redesign-check.mjs`
- `tests/workspace/product-flow-check.mjs`

Existing user changes and documentation history were preserved. Build-time scope review also reported an unexpected generated change in `next-env.d.ts`, importing `.next/types/routes.d.ts`; that file was already modified by the development process at baseline and was not manually edited or reverted. No new images, dependencies, GSAP, routes, contracts, backend, session or mocks edits belong to this revision.

#### Final evidence and limits

- Lint, typecheck, normal and demo production builds passed, as did 10 import-boundary tests and 41 account/event/workspace unit tests.
- Normal product-flow browser checks and the full demo role-flow passed with test fixtures. These checks establish frontend behavior, not real backend delivery.
- Frontend-redesign browser checks passed 100 combinations at 320, 390, 900 and 1440px, including one H1 per view, empty/error dashboards, organizer shell presence only on intended organizer work/settings routes and absence elsewhere, catalog organizer labels, responsive layout and reduced motion.
- Added click-through confirmed catalog `Ajukan dukungan` opens the existing proposal form with an empty event selector; organizer `Settings` opens settings; keyboard skip focuses main content; landing `Kenali PartnerHub` reaches `#features`, followed by participant-role signup.
- Current screenshots: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-role-layout-review`. Normal flow: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-role-layout-product-flow`. Demo flow: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-role-layout-demo-flow`.
- The existing server on port 3000 was not stopped. Temporary servers on ports 3113 and 3114 were stopped at finish.
- Contrast calculation found the legacy muted text on the new yellow landing frame at 4.48:1, below AA. Landing header navigation and footer copy now use navy on yellow (10.43:1); the higher-specificity primary navigation action remains white on navy (14.81:1). Other used copy pairs are muted on white (6.36:1) and muted on subtle (5.66:1). No global palette change was needed.

Run ordinary frontend with `npm run dev`. For demo, set `NEXT_PUBLIC_PARTNERHUB_DEMO=1` before starting; restart an existing process to change the flag. Catalog users must select an event in the existing proposal form. This revision adds no event preselection, matching, payments, photo upload or real backend implementation.

### Frontend hierarchy revision, 2026-10-05

**In progress**. The owner approved the audit, centralized tokens, and a hybrid structure: shared presentation foundations, feature-owned page UI and adjacent CSS Modules. This revision supersedes the older prototype vocabulary below; page-specific adoption is staged, not complete.

- `src/lib/design-tokens.css` owns shared colors, typography, spacing, radii, control sizes and feedback motion; `src/app/globals.css` imports it. Existing palette variable names remain compatible.
- `src/lib/ui.tsx` preserves existing imports. `src/lib/ui/site-frame.tsx` owns the shared frame; `src/lib/ui/primitives.tsx` owns presentation components. Routes, session guards, services and logout behavior remain unchanged.
- Navy primary actions establish one consistent action language; yellow remains a restrained brand accent rather than highlighting every list action.
- Bricolage headings retain campus character; Manrope body and controls support readable Indonesian text. Working-page H1 is 32–40px, section headings 24px, item headings 20px, body 16px and helper text 14px.
- Spacing uses 4, 8, 12, 16, 24, 32, 48 and 64px: compact relationships within groups, larger separation between tasks. Application width is capped at 1200px; forms at 640px.
- Controls use 8px corners, sections 12px and overlays 16px. Flat borders distinguish content; shadows are reserved for overlays.
- Keyboard focus uses a blue outer outline with a white inner separation ring so it remains visible on both paper and navy surfaces; this ring is an accessibility indicator, not decorative elevation.
- Buttons are 48px high, fields 56px; navigation targets are at least 44px. Mobile navigation keeps existing destinations and visually separates account controls without introducing menu state.
- Status colors distinguish success, warning, error and information, always alongside readable text. Proposed semantic foreground/background pairs have contrast ratios of 5.98:1 or higher; actual page adoption still requires rendered verification.
- Motion remains ENERGY 3 / RHYTHM 2 / MOTION 1: brief color feedback and a loading indicator, disabled under reduced motion. No decorative entrance animation, new assets, dependencies or dark mode are added.

The subsequent sections record page-specific adoption and cross-page verification. Backend availability, QR delivery, support and unfinished legal policies remain outside this visual revision.

Foundation-stage verification: lint, typecheck, production build, 10 import-boundary tests and 41 account/event/workspace tests passed. The existing normal-build browser flow passed guard/login/register/email verification/onboarding/recovery/profile/logout, event saving/upload retry/conflict, dashboard filters/retry, 404 and responsive checks with test-only API interception. This is frontend evidence, not a working-backend claim.

Additional rendered inspection covered landing, login and all three role dashboards at 320, 390, 768 and 1440px: no horizontal overflow, header targets at least 44px and no page exceptions. Keyboard activation of the skip link focused main content; header login and registration links reached their routes. The dark-surface link rendered a 3px blue outline plus 4px white separation ring. Screenshots and the temporary inspection script are outside the repository in `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-ui-foundation`. The temporary production server on port 3113 was stopped; the existing development server was not stopped.

### Landing and authentication presentation stage

Implemented frontend presentation for landing, login, password recovery/reset and email verification. The all-page stage below records the subsequent account, dashboard and event presentation work.

- Landing leads with event preparation and sponsor commitments because those are the product's purpose and differentiator, instead of two competing abstract slogans. Organizer registration is the prominent content CTA; other roles and login remain lower-weight links to existing destinations.
- The navy panel explains actual editor inputs and storage distinctions rather than pretending to be a product screenshot. Yellow identifies its short labels; no new logos, imagery, metrics or testimonials are introduced.
- Role explanations use editorial rows rather than uniform feature cards. Participant copy explicitly identifies QR delivery as unfinished; sponsor copy describes existing proposal/status/benefit views, not payments or evidence uploads.
- Account forms share a compact, single-column feature-local layout to keep the input task ahead of promotional copy, especially on phones. Mode-specific headings remain within the existing account page, avoiding duplicate page scaffolding.
- Missing-token reset guidance appears before password inputs; its condition and disabled submission behavior are unchanged. Email verification separates inbox instructions from resend assistance; token verification retains its existing handler and destinations.
- Landing uses centralized type/space/radius tokens. The dark-panel link uses the yellow inverse focus token (10.43:1 against navy); body text remains white (14.81:1). Existing account state, validation, payloads, service calls, demo gating and guards are preserved.

Verification: production build, lint, typecheck, 10 boundary tests and 20 account tests passed. The existing normal-build product-flow script passed with only its landing-heading selector updated. A separate Edge inspection covered eight landing/auth states at 320, 390, 768 and 1440px (32 combinations) without overflow or page exceptions. Click-through confirmed the feature anchor, organizer signup, alternate role selection, login validation, forgot-password feedback, reset recovery link and resend feedback. Inbox/resend and token states were captured separately; the missing-token notice precedes the password input. Existing product-flow checks also covered password reset, email confirmation, redirects and logout. Browser responses were test-only API interceptions, not real backend delivery.

Review screenshots: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-landing-auth-review`. Product-flow evidence: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-landing-auth-flow`. Manual checks: open landing at phone width and choose each existing entry link; submit an empty login; request password recovery; open reset with and without a token; inspect verification with and without a token; tab to the navy-panel link and confirm visible focus. Normal APIs remain unfinished and must show genuine errors without demo fallback.

### All-page frontend adoption

#### Follow-up: compact role control and three demo choices

Latest owner correction supersedes the disclosure arrangement described below: registration now shows all three role buttons immediately, with the selected role distinguished by aria-pressed and navy fill. A short data-loss hint stays adjacent to the choices. Login initially shows only a Pilih akun demo button; its accessible expanded/collapsed panel contains the three existing demo choices. This prioritizes normal login while keeping role selection immediately discoverable during registration. No credential or role-switch service behavior changes. ENERGY 1 / RHYTHM 2 / MOTION 1 remains unchanged.

Latest verification: lint, typecheck, boundary tests, demo production build and full role-flow browser checks passed. Keyboard opens/closes the demo panel; three registration choices are immediately visible with at least 44px targets. No overflow at 320, 390 and 1280px. All demo role logins, manual pending login, signup field retention and reset flow passed without page errors. Browser evidence: C:/Users/user/AppData/Local/Temp/opencode/partnerhub-direct-roles-flow. Files remain the same six listed for this follow-up.

The owner approved frontend account presentation plus the demo-picker files and related tests. The role header now shows the current role beside a visible Ganti peran affordance. Native disclosure keeps secondary choices out of the form's initial reading order. One short explanation precedes switching, and a compact status message replaces the repeated long notice. Existing role-switch handlers and retained-field behavior are unchanged.

The login demo picker offers exactly Peserta, Penyelenggara and Sponsor. Each button fills existing credentials; Masuk still submits the existing form. The pending-verification account remains a test fixture accessible by manual credentials, not a fourth picker option. Demo visibility still requires NEXT_PUBLIC_PARTNERHUB_DEMO=1. The panel uses adjacent CSS Modules and existing tokens, with no new assets, dependencies or authentication behavior.

Design read: account forms for event participants and operators, typography-led navy/yellow identity, ENERGY 1 / RHYTHM 2 / MOTION 1. A simple divider separates the role control without competing with form content. Three demo choices reflect the three real role paths, not a decorative card template. Existing fonts and spacing tokens preserve legibility and continuity.

Verification: typecheck, lint, boundary tests, focused account/demo tests, demo production build and full role-flow browser checks passed. Browser checks verified three picker buttons, credential prefilling via keyboard, collapsed/expanded role control, common-field retention, no duplicate notice, at least 44px role targets and no overflow/page exceptions at 320, 390, 768 and 1280px. All three demo role logins passed; pending credentials passed manually. Evidence: C:/Users/user/AppData/Local/Temp/opencode/partnerhub-role-picker-fix and partnerhub-three-demo-role-flow.

Changed files: src/features/account/signup/register-wizard.tsx, src/features/account/signup/registration.module.css, src/mocks/demo/demo-accounts.tsx, src/mocks/demo/demo-accounts.module.css (new), tests/workspace/role-flow-check.mjs and DESIGN.md. Existing unrelated uncommitted work remains intact.

The owner confirmed all active frontend pages in workspace, account, event, registration and sponsorship, including legal and route fallback presentation. This completes presentation adoption for existing pages, not backend delivery or legal readiness. No GSAP, dependencies, routes, service contracts, validation rules, React state management or demo data were added or changed.

| Page group | Presentation resolution and purpose |
| --- | --- |
| Registration | Role headings remain real headings outside their selection buttons. Profile/company fields are grouped into named fieldsets. Current role stays prominent; role switching is secondary native disclosure with its existing consequences explained. Review shows existing submitted values and filenames, never passwords. |
| Onboarding | Instructions use the existing session role so participants, organizers and sponsors see relevant tasks; completion and redirection remain unchanged. |
| Profile | Distinguish read-only account email/role/verification from the single editable display-name field. Remove the outdated claim that no account role exists. |
| Admin verification status | Status badge, submitted date, reload action, review note, submitted data and document filenames have distinct hierarchy. Rejected copy no longer points to nonexistent support or implies resubmission works. No review SLA is invented. |
| Organizer | Existing per-event registration counts move above the event list for quick review. Search/status filters remain unchanged. Event rows differentiate status, schedule, organization and secondary actions; non-draft edit links explain the existing restriction without changing their destination. |
| Participant | Ticket references are prominent, statuses are semantic, and open-event rows show the existing event summary before registration. The main anchor leads to open events; repeated registration buttons are secondary. QR is explicitly unfinished. |
| Sponsor | Existing commitments precede proposal history because sponsor accountability is the differentiator. Benefit/proposal statuses use semantic labels. Native proposal disclosure keeps long offers available without dominating the list. Dashboard and proposal form now have separate files with compatible exports. |
| Proposal form | Existing selected-event information supplies organizer/schedule/summary context. Upfront offer guidance explains the existing minimum; payload, validation and redirect are preserved. |
| Event editor | Server save shortcut is separate from native local-backup disclosure. Existing local save/restore/delete handlers remain intact. Registration-period inputs now sit with schedule, using unchanged parent state and validation. Mobile form/preview follow both visual and DOM order; preview controls remain available. |
| Event detail | Translated state, draft-edit CTA, grouped schedule/registration facts, contained identity logos and module configuration replace the record dump. The organizer-only scope and unfinished operations are stated before details. |
| Legal and route states | Legal notices remain explicitly unfinished within the shared frame; no policies are fabricated. 404 has one recovery action. Error retains retry and home navigation with different weights. Loading and dashboard redirect reuse the shared loading treatment. Server adapters import CSS Modules directly rather than reading CSS objects through a client-module export. |

#### Files changed in this all-page stage

Existing uncommitted foundation and product-flow work was preserved. The source baseline was fingerprinted before this stage, including untracked files, because `git diff --name-only` alone cannot report content changes in untracked files.

- `src/features/account/signup/options.ts`
- `src/features/account/signup/role-picker.tsx`
- `src/features/account/signup/register-wizard.tsx`
- `src/features/account/signup/steps.tsx`
- `src/features/account/signup/registration.module.css`
- `src/features/account/onboarding-page.tsx`
- `src/features/account/settings-page.tsx`
- `src/features/account/verification-page.tsx`
- `src/features/account/account.module.css`
- `src/features/workspace/dashboard-page.tsx`
- `src/features/workspace/dashboard.module.css`
- `src/features/registration/me-page.tsx`
- `src/features/registration/me.module.css` (new)
- `src/features/sponsorship/sponsor-pages.tsx` (compatible exports)
- `src/features/sponsorship/sponsor-dashboard-page.tsx` (new)
- `src/features/sponsorship/proposal-form-page.tsx` (new)
- `src/features/sponsorship/sponsorship.module.css` (new)
- `src/features/event/event-editor-page.tsx`
- `src/features/event/event-draft-builder.tsx`
- `src/features/event/event-fields.tsx`
- `src/features/event/event-draft.module.css`
- `src/features/event/event-detail-page.tsx`
- `src/features/event/event-detail.module.css` (new)
- `src/lib/form/form.module.css`
- `src/lib/ui.module.css`
- `src/lib/notifications.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/error.tsx`
- `src/app/loading.tsx`
- `src/app/not-found.tsx`
- `tests/workspace/product-flow-check.mjs`
- `tests/workspace/role-flow-check.mjs`
- `tests/workspace/frontend-redesign-check.mjs` (new)
- `DESIGN.md`

#### Verification and limits

- Lint, typecheck, import-boundary checks, and 51 architecture/account/event/workspace tests passed. Existing Node module-type warnings were not addressed because package configuration is outside this task.
- Both normal (`NEXT_PUBLIC_PARTNERHUB_DEMO=0`) and demo (`1`) production builds passed. Build/server execution was sequential; temporary servers were stopped, and the existing development server was not stopped.
- Normal-build `product-flow-check.mjs` passed the existing API-intercepted authentication, registration, recovery, onboarding, profile, logout, draft/upload/retry/conflict, local restoration/deletion, module dependency, registration-window and dashboard scenarios. UI selectors now follow breadcrumbs, grouped schedule inputs and local-storage disclosure. Assertions about retained input, validation, persistence and navigation were preserved.
- Demo-build `role-flow-check.mjs` passed role choice, validation/focus, Back, safe draft refresh, role switching, file inspection, pending flow, guards, newly registered empty accounts, duplicate email, four seeded accounts, proposal submission, demo reset and mobile checks. Long proposal text is opened via disclosure before assertions.
- `frontend-redesign-check.mjs` covered 25 route/role/status views at 320, 390, 900 and 1440px (100 combinations). It also checked empty/error dashboards, one H1 per captured view, keyboard local/proposal disclosure, grouped schedule fields, mobile visual/DOM order, reduced motion and legal server-page button styling. No page exceptions occurred. Fixture API responses are test-only; this does not prove real API or email delivery.
- Edge was the tested browser. App Router fallback error/loading markup and preserved retry handlers were code-reviewed; no real uncaught failure was deliberately injected to exercise the global error boundary. Data-loading/error UI and retries were exercised by browser scenarios.
- Review images: `C:/Users/user/AppData/Local/Temp/opencode/partnerhub-all-pages-review`; normal flow: `partnerhub-all-pages-product-flow`; demo flow: `partnerhub-all-pages-role-flow` in the same temporary directory.
- Known pre-existing logic issue: verification status passes an inline loader to `useResource`, which depends on loader identity, so renders can cause repeated verification requests. This task retained that logic. The visual test waits for rendered content rather than network-idle on this route. Fixing the loader needs separately approved frontend logic work.
- Remaining release blockers: real backend persistence/auth/email/admin approval, consent/event-specific participation, QR delivery, sponsor evidence, support/resubmission and finalized legal policies. No visual redesign resolves them.

#### Run and manual scenarios

Normal frontend: `npm run dev`. Demo frontend: set `NEXT_PUBLIC_PARTNERHUB_DEMO=1` before starting the process; restart an existing dev process to change the flag. To check production, build first and start only after it completes. Browser scripts require an available Playwright installation; use `PLAYWRIGHT_MODULE` to point to an external installation rather than adding a project dependency. Set `UI_BASE_URL` for the running server and `UI_REVIEW_DIR` for screenshots.

1. Register with each role: choose a role, inspect field groups, trigger an error, go Back, change role through disclosure, and review values. Passwords and files must not survive draft restoration.
2. Use organizer search/status filters, reset a no-result search, follow a draft edit link and inspect the existing non-draft editing restriction.
3. Open a participant event summary, register, and confirm the reference/status appears; do not expect a QR payload.
4. Open sponsor offer details by keyboard, select an event on the proposal form, inspect its context, submit invalid then valid input, and inspect the resulting proposal.
5. Create a title-only server draft; configure a schedule/registration period; inspect poster/page previews; use local disclosure to save/restore/delete a complete copy; cancel unsaved navigation; retry failed saving without duplicate events.
6. Inspect pending/rejected account status, data and document filenames. Reload status and use the profile link, noting the known loader limitation.
7. Open legal pages, a missing route, and data-error/retry states. Repeat on a 320px viewport and using keyboard/reduced-motion settings.

`src/features/workspace/workspace.module.css` owns the navy/ink, muted, paper, line, and yellow variables. `src/features/event/event-draft.module.css` keeps matching local values. These are not global shared tokens; a shared token extraction would need separate infrastructure approval.

Heading and body font variables inherit through the route composition slot. Neither feature imports the other's internals. Workspace owns local font files and license documentation.

- Primary creation: yellow, navy border/text, 58px minimum height, 12px corners. Form forward/save: navy with white text, 52px minimum height.
- Inputs: white fields, strong control borders, 56px minimum height, 10px corners. Native date/time/select/checkbox controls are retained.
- Focus: 3px blue outline with 4px offset; search wrapper uses focus-within and 3px offset. Selected records use a 2px navy border, not color alone.
- Navigation: horizontal labelled buttons with `aria-current`; the header wraps into a second navigation row below 950px. It has no inactive product-module links.
- Desktop event lineup/context uses `minmax(0,1.75fr) minmax(300px,1fr)`. At 950px it stacks; below 650px event cover/info stack. Narrow 320px layouts retain readable labels and functional navigation.
- Drafting stacks below 760px. Preview expansion uses `aria-expanded`. Step actions validate current fields before advancing; errors preserve input and target the invalid field.
- Motion: 160ms color/border and 180ms record hover feedback, enabled only when reduced motion is not requested. No entrance/parallax animation or ambient movement.
- Native help dialog supports Escape and focus return; 18px corners and `0 24px 80px #16274845` shadow, with `#101e37a8` backdrop.

## Content and truth boundaries

### Multi-organization event editor revision

The owner clarified a real multi-organization product, with visual identity uploaded by its users. Do not hard-code organizer/sponsor logos or treat the product as a single organization's website. Default workspace starts without synthetic records; examples are explicitly opt-in. The event editor's introduction is compact so editing, not marketing, dominates the viewport.

The four-stage editor includes logo/identity alongside details, schedule, and module configuration. Upload zones support drag/drop and the native file picker, retain existing images on invalid replacement, expose replace/remove actions, and show named sponsor placements. Logo rendering uses contain rather than clipping a brand mark. Poster/page tabs change preview composition, and mobile preview opens explicitly with reduced-motion-safe reveal feedback. No asset is generated by the agent.

Save now retains the user's details and logo blobs locally in IndexedDB, with explicit local-only copy. It does not simulate a remote upload or event publication. Backend release requirements are in `todobackend.md`. This supersedes older localStorage-only descriptions for new saves; existing v1 drafts remain readable.

Workspace events, sponsors, and counts are visibly labelled demo. Empty/loading/error modes are explicit simulations. No stock avatars, testimonials, invented integrations, or performance claims appear.

Draft preview uses the user's current input. Explicit save stores one non-personal draft in this browser only; restore validates it and deletion requires confirmation. No event is published, service activated, ticket generated, or data sent to a backend. Actual product modules remain **In progress**.

## Evidence

### Connected frontend extension, 2026-10-05

**In progress**. Same navy/yellow typography-led direction now extends to public/auth routes, guarded dashboard, settings and event routes. Existing product logo and licensed fonts are reused; organizer and sponsor identity always comes from user records/uploads. Production screens never populate synthetic fixtures. Browser tests may intercept APIs with explicitly test-only records.

- Shared palette/typography in `src/app/globals.css` and `src/lib` is approved to prevent visual drift between account and event routes.
- Asymmetric landing introduction explains preparation; form pages prioritize a readable single form rather than statistics or decorations.
- Dashboard uses title-led event rows rather than operational counts that have no API evidence.
- Bold headings keep ENERGY 3; consistent form/editor rhythm retains RHYTHM 2; hover/state feedback alone retains MOTION 1.
- Local restoration never labels content as server-saved. Server success requires service confirmation; errors preserve input.
- Unsaved changes warn on links, logout and unload. Cancelable history traversal uses the browser Navigation API; browsers without it cannot guarantee an in-app Back warning. Test evidence must disclose this compatibility boundary.

New-flow evidence: `tests/workspace/PRODUCT-FLOW-VERIFICATION.md`. Earlier screenshots/tests below describe the superseded state-navigation workspace.

Production screenshots and reproducible checks live in `.impeccable/review` and `tests/workspace/VERIFICATION.md`. Reviewed widths are 1440, 900, 390, and 320px; draft preview and native help were also captured. Build, lint, unit/architecture checks, and browser interactions were run. Contrast ratios and limitations are recorded in the verification file, not inferred from screenshots.

Independent finish review identified two material fixes: stacked-layout selection discoverability and undersized explanatory prose. The implementation adds focus/scroll on stacked selection and raises the identified prose to 16px. This reference describes the shipped frontend prototype, not certification of unfinished backend workflows.
