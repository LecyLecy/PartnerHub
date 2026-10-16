# Committee frontend

**In progress**. Owns recruitment setup, application, and decision UI. Backend owner: `src/backend/committee`.

Implemented against the expected API in `services/committee-service.ts` (see `ARCHITECTURE.md`). Pages:

- `committee-page.tsx`: user lists open recruitments, applies, sees status, organizer note, and notifications.
- `committee-manage-page.tsx`: organizer opens or closes a recruitment, reads answers, and moves applicants through allowed states. Accepting requires a next-steps note.

- Selection stages are organizer-defined per opening (0 to 5, `stages` on the opening). An application is `SUBMITTED`, `IN_SELECTION` (with a `stageId`), `ACCEPTED`, `REJECTED`, or `WITHDRAWN`. The service returns `allowed` moves (`to` is a stage id, `ACCEPTED`, or `REJECTED`); accepting needs a next-steps note. This replaces the fixed SHORTLISTED/INTERVIEW states, so `PRD.md`, `ARCHITECTURE.md`, and `ARCHITECTURE-ESSETIALS.md` still describe the old state table and need an owner-approved update.

The backend does not exist yet. Demo mode simulates it for presentations and tests.
