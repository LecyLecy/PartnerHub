# PartnerHub classroom demo delivery

## Authorized scope, 2026-10-16

The owner requested integration of every available member branch into `production`, autonomous conflict resolution, a complete demonstrable UI using fictional local data, implementation of feedback from the two feedback-grid tabs, and a hosted app. This authorization supersedes the earlier frontend-only restrictions for this delivery. Real backend, payment processing, email, and commercial launch are not required.

## Branch integration

Remote heads inspected: `adin`, `jad`, `main`, `production`. `production` initially matched the initial commit on `main`. Integrated `origin/adin` and `origin/jad` with merge commits. No conflicts. Member branches remain intact.

## Feedback source

Google Doc: https://docs.google.com/document/d/1il2yYD-AAp6End2VQDCDjXPZ-m_ykQoejOAgaG-iQ3E/edit

- Feedback Capture Grid, tab `t.kauk7jn0tnkk`: prompts and hypotheses, not collected user responses.
- Feedback Capture Grid Kelompok Lain, tab `t.wrj0yktjdp4n`: peer feedback praises intuitive UI and clear detail; requests a working end-to-end flow, clearer journeys, simpler UI, improved event modules, sponsor value, and short guidance.

## Implementation in this pass

- Event draft readiness checklist, publish, close, and archive actions; valid schedules, registration windows, ownership, and revision checks.
- Registration checks open window and module; published seed events have an already-open registration period.
- Demo role switch preserves the same in-tab dataset so organizer, participant, applicant, and sponsor actions connect.
- Stable verification loader prevents repeated requests caused by inline function identity.
- Organizer proposal review, acceptance/decline, accountable benefit capture, evidence URLs with explicit verification, event report, and browser print/PDF.
- Sponsor request follow-up dates and notes; accepted requests materialize a shared sponsor commitment immediately.
- `/guide` explains the complete journey and answers privacy, sponsor value, and payment questions without a long onboarding wizard.
- Optional NONE/ENTRY/ENTRY_EXIT attendance with conditional exit controls, entry-before-exit, and stable duplicate-scan timestamps.
- Reused profile preview and explicit consent on participant registration; a demo-only approval control unblocks newly registered organizers and sponsors after verification.
- Explicit `build:demo` and Vercel build configuration publish the fictional classroom demo. Default normal builds remain separate.

## Verification and delivery

Local lint, typecheck, demo builds, and import-boundary checks passed. The complete unit suite passed (111 tests), including lifecycle, reports, entry/exit replay, credential persistence without raw password storage, and sponsor follow-up/acceptance. `tests/workspace/delivery-browser-check.mjs` passed against both the local production build and the hosted deployment: actual UI event creation, publication, consent, registration, organizer participant visibility, QR issuing, report rendering, attendance-mode persistence after reload, sponsor proposal, organizer acceptance, and benefit evidence visible back in the sponsor UI. Report overflow checks passed at 390 and 320px, with no page exceptions.

The final rerun additionally asserts that the new registration survives both attendance reload and sponsor decisions, and that the visible report count reaches 1 before the evidence screenshot. The initial screenshot's temporary 0 was the count-up animation, not lost registration data. The account/role regression was rerun successfully against the local production build on October 17.

`tests/committee/committee-browser-check.mjs` passed application validation/focus, stage transitions, acceptance notes, organizer request/sponsor response, notifications, role guards, and 320px layouts. `tests/registration/registration-browser-check.mjs` passed custom paid forms, image proof, confirmation, catalog/my-event transitions, mobile layouts, and actual participant/committee XLSX downloads read back using ExcelJS. `tests/attendance/scanner-browser-check.mjs` passed actual generated QR-image decoding, repeat entry, camera-denial feedback, a synthetic local camera stream, ownership boundaries, and mobile rendering. Hardware-camera behavior is not certified by a synthetic stream. Old browser assertions were updated for the existing dialog-based UI and pending-payment copy, without removing outcome checks.

The role/account browser regression passed, including signup validation, draft privacy, role switching, document requirements, pending-account guards, simulated admin approval, empty new accounts, duplicate handling, reset, and mobile layouts. The final demo build passed. After fetching origin, both member heads were verified as ancestors of the pushed production application commit `7679323ca721de224cebcc3433c4a6c0c71cc080`.

Vercel deployment `dpl_D8gK6m4Fna9WuCDz81WVcXr66ALZ` is READY with that exact application SHA, production aliases, and no alias error. Hosted URL: https://partnerhub.vercel.app/guide. Existing Vercel Authentication remains enabled; a temporary deployment share link was used for the complete hosted browser check and reviewer access. The test accepts that link through stdin with `VERCEL_PROTECTION_INPUT=1` and checks the origin; no link credentials are committed. Hosted screenshots are under the ignored `.impeccable/delivery/hosted` directory. Test and documentation follow-up commits do not alter the verified application payload.

Recovery screens intentionally acknowledge that the demo sends no email. Do not treat a passing demo test as evidence of a real backend. The temporary subscription screenshot mockup is not installed; `/pricing` retains the existing provisional product status page.

Demo storage is currently sessionStorage plus memory, scoped to one tab. Newly registered demo-account passwords are persisted only as a per-account salted SHA-256 digest so login still works after a page reload; this is a demo convenience, not production credential protection. It is not a shared or secure database. Reset restores fictional records. No real personal information should be entered.
