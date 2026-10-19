# Campus workspace and event-draft verification

Historical verification snapshot. The workspace/draft/IndexedDB implementation described below is superseded, not a current acceptance requirement. Current product flows are consolidated in PRD.md and ARCHITECTURE.md: individual-event archive/upload, owner-account subscription, no browser draft-copy feature, stable navigation and optional entry/exit QR. Preserve this evidence without restoring removed behavior. This documentation update does not rerun or extend the historical tests.

## Scope

### Current revision: multi-organization identity uploads

The owner clarified real production intent for multiple organizations. This change remains frontend-only, with backend blockers recorded in `todobackend.md`. Event/workspace and their focused tests are authorized; root product/design/architecture documents were explicitly approved for synchronization. No backend, Prisma, package, shared-contract or environment implementation changed in this revision.

Default workspace is now empty, not populated with fictional organizer activity. Labelled examples remain opt-in. The editor now has four stages, including uploaded event/organizer identity and named sponsor-display placements. Sponsor placement is not a sponsorship agreement or benefit workflow.

New browser proof: valid event/organizer/sponsor PNGs appear in preview; oversized, SVG and corrupt files show actionable errors while preserving the current valid image; selecting again, removing an image and dropping a new one work; adding/removing sponsor rows and switching poster/page preview work. The TEST raster in captures is generated only inside the browser verification script, not a real company logo or shipped app asset.

Saving writes one versioned IndexedDB record with details and logo blobs. A reload clears in-memory input; explicit restoration restores all three preview logos and names. Confirmed deletion removes the IndexedDB record and legacy localStorage draft; cancellation leaves storage intact. Invalid legacy JSON cannot overwrite the form. Actual browser tests verify the complete logo save/reload/restore/delete loop. Browser storage failures, blocked databases, quota errors and pending-image protection are handled in source; not all have been fault-injected in this verification.

Additional captures: `workspace-empty.png` (1440px), `branding-desktop.png` (1440px), `branding-mobile.png` (320px). No horizontal overflow at 320px for the identity editor. Existing responsive/filter/context/form/module/keyboard/reduced-motion checks remain in the runnable script. Lint, typecheck, build, ten unit checks and ten architecture checks passed. Known favicon 404 remains separate.

Detector warning: `logo-input.tsx` has an image ref without a JSX `src`. The effect assigns an actual local blob URL and revokes it on change/unmount. Browser captures and logo restore assertions show decoded images, not placeholder/broken-image boxes. The warning is a source-pattern false positive, not an omitted asset.

Independent fresh finish review: **ship** at this event/workspace frontend revision's scope, with no material fixes identified. It does not establish backend/production-release readiness. No approved comp or QUALITY BAR card was supplied; review used retained source direction and the six named production captures, not an invented visual benchmark.

Antislop gate for this revision:

- R-02 PASS: authored UI/document copy has no em dash.
- R-03 PASS: identity editor at 320px and workspace at 320/390/900/1440px reflow without horizontal overflow; text scaling and controls remain checked.
- R-17/R-18/R-36/R-38 PASS: default workspace has no invented organizer records; fixtures are opt-in and labelled; uploaded TEST logos are test-only inputs; no fabricated reviews, claims or organizations are shipped.
- R-23/R-37 PASS: user explicitly requested organizer-uploaded logos, multi-organization usage and event/workspace frontend; navy/large-type direction retained. No replacement company assets generated.
- R-24/R-26 PASS: actual navigation, upload/select/drop/replace/remove, sponsor-row editing, preview mode/expansion, validated step changes, local save/restore/delete and help actions exercised.
- R-25 PASS: existing navy/muted/white/yellow/error text and control-border/focus pairings retain the verified ratios below; no untested decorative palette added.
- R-27 PASS: explicit examples/empty/loading/error, no-match, upload validation/loading, form validation and storage feedback exist.
- R-28 PASS: no filler FAQ.
- R-32 PASS: native named file input, keyboard-operable choose/replace/remove controls, visible upload focus-within, native dialog Escape/focus return and step focus destinations.
- R-33/R-34 PASS: feature TSX/CSS owns behavior; no source-rewriting helper or unfinished theme toggle.
- R-35 PASS: actual production build and runnable upload/storage click-through used; known warning and non-injected failure branches disclosed above.
- Purpose gate PASS: upload zones expose an actual native selection/drop task, contain sizing preserves user brand marks, compact editor header makes room for editing, preview-mode layout and mobile reveal provide visible results; no decorative glow/blur/background patterns.
- Liveliness/craft PASS: named user assets and changing preview replace fixed visual identity; readable fields, persistent blobs, recoverable invalid replacements and local-only truth boundaries serve real organizer work. Backend release readiness is not claimed.

The sections below preserve earlier verification history; localStorage-only and three-stage statements refer to the superseded revision, not new saves.

User rejected the initial generic dashboard, small type, and preview-only interactions. This revision replaces that world with the approved bold campus-program direction and an interactive event-frontend draft flow. Feature code is isolated to `src/features/workspace` and `src/features/event`, with composition in `src/app/page.tsx` through a ReactNode slot. Backend, database schema, credentials, and other product features are unchanged by this revision.

## Reproduce

```powershell
npm run build
npm run start -- --port 3109
# In a separate terminal, with externally installed Playwright and Edge:
$env:PLAYWRIGHT_MODULE = "$env:LOCALAPPDATA\Temp\opencode\partnerhub-ui-check\node_modules\playwright"
$env:UI_BASE_URL = "http://localhost:3109"
node tests/workspace/browser-check.mjs
node --test tests/workspace/demo-data.test.mjs tests/event/draft.test.mjs
npm run test:boundaries
```

Playwright is an external verification tool, not a project dependency. Native TypeScript tests need Node 22.18+ or Node 24. Existing CommonJS-package/TypeScript module-type warnings are non-fatal. The old dev server at port 3000 returned stale/empty event CSS exports during this session; production build at 3109 served correct CSS and was used for final captures and verification. No other person's server was stopped.

## Verified behavior

- Brand and top navigation switch event lineup, sponsorship sample, and draft builder. Builder remains mounted, preserving unfinished input while switching views.
- Event selection updates contextual counts, capacity, and relevant next action. At stacked widths (950px and below), selection focuses and reveals the contextual heading; browser assertions verify focus and viewport visibility at 390px. Desktop selection keeps its adjacent-panel behavior. Search and status filters combine; selection follows valid filtered records. No-match state offers reset.
- Sponsor review shows explicitly synthetic organizations/commitments, not editable production records.
- Demo/empty/loading/error controls preserve the distinction between simulated workspace data and browser draft storage.
- Three-step draft flow supports title, category, optional description, valid same-day WIB date/start/end, location, capacity, and module choices.
- Empty title, missing/invalid date, reversed times, and invalid capacity produce inline errors without losing input.
- Typing updates the visible preview; desktop shows it beside the form and mobile can expand/collapse it.
- Enabling entry scan also enables registration; disabling registration disables entry scan. No ticket is generated.
- Explicit save writes a versioned local draft. Reload clears in-memory input; restore reads and validates the saved draft. Invalid JSON, versions, fields, and oversize input are rejected without replacing the current form.
- Confirmed deletion removes only `partnerhub:event-draft:v1` and preserves current input. Cancel leaves storage intact. Storage-error paths keep the form, never report a successful backend write.
- Help dialog opens through a keyboard-operated native button, closes with Escape, and returns focus. Reduced motion removes transitions.

All seven event/fixture unit checks, ten architecture checks, lint, typecheck, build, and production browser flow passed. The browser also tested the complete save/reload/restore/delete/cancel/corrupt-data loop. No UI runtime errors occurred; existing `/favicon.ico` 404 is separately reported and remains outside scope.

## Visual and responsive proof

Captures: `.impeccable/review/desktop.png` (1440px), `tablet.png` (900px), `mobile.png` (390px), `narrow.png` (320px), `event-desktop.png` (1440px), `event-mobile.png` (390px), and `mobile-guide.png` (390px viewport). Captures use actual production CSS and locally served fonts. Full-page form captures reset scroll to the document top.

No horizontal document overflow at tested workspace widths or the expanded mobile draft. A 720px draft viewport with doubled root text size also reflowed without overflow. This is not a physical-device/on-screen-keyboard or actual browser zoom test.

Body/forms use 16px+, context labels 14px+, primary controls 48px+ (form fields 56px). Bricolage Grotesque and Manrope are self-hosted with adjacent SIL OFL licenses. No visitor font CDN requests or generated person imagery. There is no admin sidebar, global stat-card row, chart, or table in the replacement interface.

Calculated contrast: main text 13.95:1, muted text on paper 5.99:1, muted text on white 6.36:1, poster metadata 10.91:1, navy on yellow 10.43:1, module context 5.66:1, success 7.97:1, errors 6.59:1. Control borders are 3.49:1 on white and 3.29:1 on paper; keyboard focus is 6.81:1 on paper.

## Antislop delivery gate

Independent finish review requested two material fixes: reveal/focus selected context on stacked layouts and raise explanatory prose in context/preview to 16px. Both were implemented and verified. The follow-up disposition was **ship** specifically for these fixes, not renewed whole-design certification. Motion is honestly recorded as ENERGY 3 / RHYTHM 2 / MOTION 1, with interaction supplied by state changes and live editing rather than choreography.

- R-02 PASS: authored copy has no em dash.
- R-03 PASS: four responsive workspace widths, mobile draft expansion, and doubled-text reflow asserted.
- R-17/R-18/R-36/R-38 PASS: fixture events, counts, and sponsors remain visibly synthetic; local draft preview reflects user input, not fabricated product activity.
- R-23 PASS: user approved campus/navy replacement, larger text, draft workflow, and synthetic content. Existing logo reused; fonts sourced/licensed; no new logo/person/raster assets.
- R-24/R-26 PASS: actual local view navigation, filtering, selection, draft flow, native form controls, saving/restoration/deletion, and help behavior exercised.
- R-25 PASS: text, control-border, and focus pairings calculated above.
- R-27 PASS: demo, empty, loading, simulated error, filtered-no-match, field errors, save/restore/delete feedback.
- R-28 PASS: no filler FAQ.
- R-32 PASS: semantic forms/buttons, inline error associations, native dialog Escape/focus return, keyboard delete cancellation, and visible focus.
- R-33 PASS: UI lives in feature TSX/CSS modules, not source-rewriting feature scripts.
- R-34 PASS: intentional light workspace with navy identity, no unfinished theme toggle.
- R-35 PASS: production build, actual loaded CSS/fonts, bounded capture inspection, and end-to-end local draft flow verified; known favicon warning disclosed.
- R-37 PASS: user explicitly rejected the former world and chose the new character, larger text, and draft workflow before implementation.
- Purpose gate PASS: navy grounds the program covers, yellow marks creation, authored typography improves hierarchy, preview follows editing, no glow/blur/gradient/noise decoration.
- Liveliness PASS: campus typographic event covers, expressive headings, selected-event context, and a working live-preview workflow replace the interchangeable admin shell.
- Craft/quality locks PASS: preserved consent/opaque-ticket product boundaries, no backend impersonation, readable field sizes, explicit storage limits, recoverable input, and reduced motion.
