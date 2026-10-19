# Sponsorship frontend

Received invitation dialogs include Lihat detail acara linking to `/explore/:id` before response actions. Reuse public event information, with no new private event contract. Historical events that are no longer public use the existing unavailable-event state. No automatic agreement or response is triggered by viewing the event.

## Discovery clarity, 2026-10-17

`/sponsor` shows recommendations; `/sponsor/events` owns the complete eligible catalog with title search and resettable no-result state. `/sponsor/preferences` is a read-only summary of saved industry and recommendation fields, not an editable preferences form. Sponsor industry is selected at registration; event matching fields are selected during event creation and remain locked even before publication. Both matching endpoints accept GET only. Matching reasons use the existing stored fields and exact shared values. Existing profiles/records are preserved, and unknown legacy fields remain unknown. Private operational panels and participant counts are never added to discovery. Proposal, invitation and benefit decisions are unchanged.

**In progress**. Owns sponsor proposals, the event catalog, organizer-initiated sponsor requests, and benefit views. Backend owner: `src/backend/sponsorship`.

- Sponsor to organizer: `proposal-form-page.tsx` and `services/sponsorship-service.ts`.
- Discovery: `sponsor-dashboard-page.tsx` uses route-selected views for recommendations and the full catalog.
- Progress: `sponsor-progress-page.tsx` has separate request, proposal and benefit views at `/sponsor/progress`, `/sponsor/progress/proposals` and `/sponsor/progress/benefits`. Only the selected operational view mounts its loader. Navigation comes from the shared role sidebar, not a second feature menu.
- Organizer proposal and outgoing invitation boards use `/organizer/sponsorship` and `/organizer/sponsorship/requests`.
- Organizer to sponsor: `sponsor-offers-page.tsx` at `/events/:id/sponsors` shows matching recommendations and a visually separate sent-request card section. It has no request form or complete directory. `sponsor-directory.tsx` shares sponsor cards and illustrative photography; Smart Matching has a leading matching icon.
- `sponsor-explore-page.tsx` at `/organizer/sponsors` owns the full catalog, company/industry search, six-item pagination and no-result recovery. Search, pagination and reset use native GET forms, keeping query/page/event context in the URL without changing records. A new search resets the page. Entering without eventId asks for an authorized published event after selecting a sponsor. The route injects the existing event loader rather than importing event feature internals.
- `sponsor-invite-page.tsx` at `/events/:id/sponsors/invite?sponsorId=...` shows one verified company and the existing request form, with no sponsor selector. It rejects unavailable/unpublished context and pending duplicate requests. Selection alone never sends; success returns to the event's sent-request section. Existing services, DetailRow dialogs, follow-ups and sponsor response notifications remain in use.
- GET /api/sponsors/directory reuses the demo matching projection, including illustrative image/field values, without contact/document exposure. Pagination is local to the prepared demo, not a production-scale backend claim. Historical request cards remain even if a sponsor is no longer in the active directory; missing images are omitted rather than invented.
- Proposal submission redirects to the proposal page. Accepting an organizer request refreshes requests; commitments load current data when opening the benefit page. Existing services and owner/role guards are retained; no separate progress database or status is introduced.

The backend does not exist yet. Demo mode simulates it for presentations and tests.
