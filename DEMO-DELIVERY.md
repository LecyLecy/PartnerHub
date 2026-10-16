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

## Verification and remaining work

In progress pending final hosted verification. Local lint, typecheck, and demo builds passed. The complete unit suite passed (111 tests), including lifecycle, reports, entry/exit replay, credential persistence without raw password storage, and sponsor follow-up/acceptance. `tests/workspace/delivery-browser-check.mjs` passed actual UI event creation, publication, consent, registration, organizer participant visibility, QR issuing, report rendering, attendance-mode persistence after reload, sponsor proposal, organizer acceptance, and benefit evidence visible back in the sponsor UI; report overflow checks passed at 390 and 320px, with no page exceptions.

`tests/committee/committee-browser-check.mjs` passed application validation/focus, stage transitions, acceptance notes, organizer request/sponsor response, notifications, role guards, and 320px layouts. `tests/registration/registration-browser-check.mjs` passed custom paid forms, image proof, confirmation, catalog/my-event transitions, mobile layouts, and actual participant/committee XLSX downloads read back using ExcelJS. `tests/attendance/scanner-browser-check.mjs` passed actual generated QR-image decoding, repeat entry, camera-denial feedback, a synthetic local camera stream, ownership boundaries, and mobile rendering. Hardware-camera behavior is not certified by a synthetic stream. Old browser assertions were updated for the existing dialog-based UI and pending-payment copy, without removing outcome checks.

Final audit still needs the latest role/account regression, final rebuild, pushed-branch ancestry checks, and actual hosted-build verification. Recovery screens intentionally acknowledge that the demo sends no email. Do not treat a passing demo test as evidence of a real backend.

Demo storage is currently sessionStorage plus memory, scoped to one tab. Newly registered demo-account passwords are persisted only as a per-account salted SHA-256 digest so login still works after a page reload; this is a demo convenience, not production credential protection. It is not a shared or secure database. Reset restores fictional records. No real personal information should be entered.
