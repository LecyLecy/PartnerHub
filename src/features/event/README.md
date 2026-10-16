# Event frontend

Owns event setup, publication, and public event UI. Backend owner: `src/backend/event`.

## Event editor frontend

`event-draft-builder.tsx` implements idea, same-day schedule (WIB), capacity, user-uploaded identity, and module configuration with a live poster/page preview. The route composes it into the workspace through a ReactNode slot; neither feature imports the other's internals. Identity belongs to each event's organizer, not a hard-coded organization. Sponsor display entries do not implement the sponsorship service.

Saving explicitly stores one versioned event-planning draft, including logo blobs, in IndexedDB database `partnerhub-event-drafts`, store `drafts`, key `current`. Re-saving atomically replaces that record. Restore can also read an older valid text-only `partnerhub:event-draft:v1` localStorage draft if no new record exists. Confirmed delete removes both local forms. Unrecognized/invalid data is not loaded. Storage-denial errors preserve current form state. Draft fields remain mounted while changing workspace views. Reload requires explicit restoration. Shared-device users should delete the draft after use. This browser store is not account/organization authorization or durable backup.

`logo-input.tsx` supports native file selection and drag/drop, replace/remove, loading/error feedback, and contain-fit previews. Accepted types are PNG/JPEG/WebP, 2 MB each, up to 4096 pixels per axis. File type/size and actual decoding are checked before replacement; invalid input retains the current asset. Object URLs are revoked when previews change/unmount. Up to six named sponsor placements are permitted. Restore revalidates saved blobs. No asset leaves the browser.

This is not event publishing, backend persistence, authorization, registration, ticket generation, or actual module setup. Those remain **In progress**. Backend requirements are in `todobackend.md`. Architecture records the narrowly approved logo exception; no storage provider was configured. Tests: `node --test tests/event/*.test.mjs` (Node 22.18+ or 24), plus `tests/workspace/browser-check.mjs` for decoded uploads and save/reload/restore.
