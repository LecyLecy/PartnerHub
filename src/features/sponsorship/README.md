# Sponsorship frontend

**In progress**. Owns sponsor proposals, the event catalog, organizer-initiated sponsor requests, and benefit views. Backend owner: `src/backend/sponsorship`.

- Sponsor to organizer: `proposal-form-page.tsx` and `services/sponsorship-service.ts`.
- Organizer to sponsor: `sponsor-offers-page.tsx` (route `/events/:id/sponsors`), `services/offer-service.ts`, and the "Permintaan dari penyelenggara" section in `sponsor-dashboard-page.tsx`.

The backend does not exist yet. Demo mode simulates it for presentations and tests.
