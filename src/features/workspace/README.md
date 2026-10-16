# Organizer workspace frontend

## Scope

Frontend workspace plus an explicitly approved event-frontend editing flow. `src/app/page.tsx` composes them using a ReactNode slot, without cross-feature imports or a shared event model. Workspace starts without synthetic records; fixture examples remain opt-in and labelled. The event feature can explicitly save one browser-only draft with user-selected logo blobs in IndexedDB; legacy text-only localStorage drafts remain readable. There are no backend requests or publishing operations. No other product feature changes are authorized.

## Direction contract

THESIS: A campus program studio turns an idea into an event draft. It replaces the rejected admin-sidebar/statistics/table shell, rather than repainting it.

OWN-WORLD: User-approved navy and a restrained warm-yellow action accent; expressive Bricolage headings and readable Manrope body copy, self-hosted under OFL. Body copy is at least 16px, controls 48px+, status/context 14px+. Typographic event covers carry a campus-program voice, not stock photos or fake activity. ENERGY 3 / RHYTHM 2 / MOTION 1, with reduced-motion support. Interactivity comes from live editing and contextual selection, not decorative choreography.

STORY: Begin an event draft for any organizer, enter details/schedule, upload event and organization logos, manage named sponsor placements, choose modules, and switch the live poster/page preview. Explicit save/restore preserves details and images locally. Labelled examples are optional, not the organizer's records.

FIRST VIEWPORT: Horizontal navigation, readable introductory text, a creation action and a truthful empty state. In the editor, a compact introduction makes room for generous fields and the live preview. Opt-in samples still provide the browsable lineup/context, never global metric cards or fake live activity.

FORM: Campus program studio, fourth of the new grounded list, seed ea1d42ab. User explicitly rejected the old world and pinned a bold creative campus direction, larger text, and interactive draft creation. Grounded alternatives: event program, campus noticeboard, committee briefing, program studio, sponsorship ledger, registration desk, running-order sheet. Foreign decorative systems do not replace familiar form semantics; retained discipline is stronger typography and live state continuity.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## States and verification

Workspace example/empty/loading/error states remain reachable through explicitly labelled example controls. Search and status filters affect local fixtures only. Native help dialog preserves Escape behavior. Event editor owns validation, local saving/restoration, four-stage navigation, identity uploads, and live poster/page preview. Product modules are configuration choices, not implemented registration/scanning/committee/sponsor services. The application ships no canned logo raster assets: preview images come from the user's file selection.
