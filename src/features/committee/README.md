# Committee frontend

## Recruitment form grouping, 2026-10-18

The organizer recruitment form separates needs, open divisions, selection stages and the optional applicant question into labeled sections. Each section has its own bordered surface and heading divider; one shared action area saves the whole opening. On narrow screens, row actions wrap below their inputs. This presentation change preserves validation, selection ordering, opening/closing behavior and existing records. No API or data-model change is required.

Verified with typecheck, lint, demo build, 10 import-boundary tests and 13 committee tests. The isolated form-sections browser check covers section borders and spacing at 1440/390/320px without page overflow, division add/remove, stage reordering, invalid-description focus and save/reload persistence. Screenshots were visually inspected. The user's browser data was not accessed or reset.

## Optional QR and committee scanning, 2026-10-18

Participant tickets at /me/events show Tampilkan QR only for confirmed registrations when the event's registration and attendance modules are active. Organizer issuance remains explicit and idempotent. QR-disabled events do not expose show/generate actions; existing secrets are retained but QR endpoints and scanning reject use. Enabling presensi remains organizer-controlled.

Accepted committee members see Scan QR peserta on their own application card at /me/applications. The /me/committee/:id/scan route reuses the attendance feature, not organizer management pages. API checks current active account, accepted membership, event publication and modules on every request. Other applications/events, rejected/withdrawn membership and closed events cannot scan. Closing recruitment does not itself revoke an already accepted membership. Ordinary participants and sponsors cannot scan.

Committee responses contain only display-safe ticket identity/status and entry/exit timestamps. They contain no answers, proof images, review notes, contact details or QR secrets; no bulk attendance list is returned. Committee cannot configure attendance, issue tickets or confirm payments. The existing manager/owner scanner and mode configuration remain. Entry and exit retain first timestamps, repeated scans are idempotent, exit-before-entry and disabled exit are refused. Remove redundant scan buttons from organizer registration/QR delivery pages. Current flags are computed at response time, never inferred from historical QR issuance or trusted from client input. Demo data remains browser-local and is not production security; real production persistence/authorization remain In progress.

## Truthful selection paths, 2026-10-18

New applications carry optional `visitedStageIds`, initialized empty and appended only by allowed stage transitions. Accepted paths label unvisited stages Dilewati rather than Selesai. Existing records without history keep that field missing and display intermediate history as Tidak tercatat; do not fabricate previous visits. Both role views share selectionPath and SelectionSteps. Rejected/withdrawn paths stop on their known stage. Current opening stage definitions are still used; an immutable full audit trail remains In progress. Tests cover skipped stages, legacy unknown history, all-stage completion, rejection, withdrawal and zero-stage openings.

**In progress**. Owns recruitment setup, application, and decision UI. Backend owner: `src/backend/committee`.

Implemented against the expected API in `services/committee-service.ts` (see `ARCHITECTURE.md`). Pages:

- `committee-page.tsx`: user lists open recruitments, applies, sees status, organizer note, and notifications.
- `committee-manage-page.tsx`: organizer opens or closes a recruitment, reads answers, and moves applicants through allowed states. Accepting requires a next-steps note.
- `/committee` is recruitment discovery; `/me/applications` composes `my-applications.tsx` through an app adapter. Applications are no longer rendered beneath participant tickets. Existing services and role guards are unchanged.

- Selection stages are organizer-defined per opening (0 to 5, `stages` on the opening). An application is `SUBMITTED`, `IN_SELECTION` (with a `stageId`), `ACCEPTED`, `REJECTED`, or `WITHDRAWN`. The service returns `allowed` moves (`to` is a stage id, `ACCEPTED`, or `REJECTED`); accepting needs a next-steps note. This replaces the fixed SHORTLISTED/INTERVIEW states. PRD.md and both architecture documents now use the current contract; do not restore the earlier fixed state table.

The backend does not exist yet. Demo mode simulates it for presentations and tests.
