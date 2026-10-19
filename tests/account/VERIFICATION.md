# Frontend consistency verification

Verified locally on 19 October 2026 using an explicit demo build at http://127.0.0.1:3132.

## Changes in this audit

- Organizer onboarding now describes complete setup, private Arsip acara, and publication through per-event payment or an eligible subscription. It no longer advertises partial draft saving and explains field locking.
- Participant onboarding distinguishes Tiket saya from Lamaran saya and makes issued QR availability conditional on the optional module.
- Restricted mobile navigation says Pengaturan, matching the existing active-account menu. Approval guards are unchanged.
- Account browser coverage now exercises current onboarding for every role and the pending organizer's mobile settings navigation and restricted access.
- Committee browser coverage selects a company from the separate sponsor catalog before composing an invitation, preserving request, response and notification assertions.
- Registration browser coverage waits for scheduled validation focus and verifies the separate ticket/application destinations. Payment-proof review and actual XLSX read-back assertions remain enabled.

Only these six existing files were changed: src/features/account/onboarding-page.tsx, src/features/account/README.md, src/lib/ui/site-frame.tsx, tests/account/profile-navigation-browser-check.mjs, tests/committee/committee-browser-check.mjs and tests/registration/registration-browser-check.mjs. This report is the only added source-controlled file. A pre-edit content-hash baseline distinguishes these edits from the checkout's pre-existing changes.

## Completed checks

- npm run build:demo
- npm run typecheck
- npm run lint
- npm run test:boundaries, 10 passing checks
- All tests/**/*.test.mjs with node --test, 180 passing tests, no failures or skips
- TypeScript noUnusedLocals and noUnusedParameters checks
- git diff --check

Browser checks ran in isolated headless Microsoft Edge contexts, not the owner's browser session:

1. tests/account/profile-navigation-browser-check.mjs: onboarding, settings, profile persistence, restricted mobile account navigation and approval guards.
2. tests/committee/committee-browser-check.mjs: application validation, selection, acceptance note, sponsor invitation/response, notifications and role boundaries.
3. tests/registration/registration-browser-check.mjs: custom paid registration, proof upload/review, separate tickets/applications and participant/committee Excel exports read back with ExcelJS.
4. tests/sponsorship/discovery-flow-browser-check.mjs: matching, catalog, selected-company invitation, sent cards, duplicates, search/pagination and historical requests.
5. tests/attendance/committee-scan-browser-check.mjs: participant QR, accepted committee scanning, entry/exit idempotence, restricted access and disabled modules.
6. tests/workspace/archive-subscription-browser-check.mjs: complete setup, private archive, per-event purchase, annual subscription and covered publication without a second charge.
7. tests/event/summary-navigation-browser-check.mjs: single application shell through both archive edit actions and reload, legacy routes, save/publication and published edit locks.
8. tests/event/public-discovery-browser-check.mjs: guest catalog/details, sponsor-section visibility, unpublished/unknown events, search, date filters and login requirement for proposals.
9. tests/committee/form-sections-browser-check.mjs: separated form sections, divisions, stage ordering, validation and save/reload.

Checks cover desktop and narrow 390/320px layouts where implemented in each script. No application runtime errors were reported by these suites. Local HTTP smoke returned 200 and the server listened on 127.0.0.1:3132.

## Reproduction

Use npm run build:demo, then npm run start -- --hostname 127.0.0.1 --port 3132. Set UI_BASE_URL=http://127.0.0.1:3132 and PLAYWRIGHT_MODULE to the available Playwright installation before running the browser scripts with Node.

The registration script also requires ExcelJS. Set EXCELJS_MODULE to an external test-tooling installation; do not add it to application dependencies solely for this check. This run installed it in the operating-system temporary directory, without changing repository package or lock files.

## Limits

This is local frontend/demo verification, not production authentication, database, billing, concurrency or security certification. No production backend, schema, migrations, deployment, Git commit or push was included. Existing owner data and unrelated working-tree edits were not reset or deleted. Production requirements remain tracked in todobackend.md.
