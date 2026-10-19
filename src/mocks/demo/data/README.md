# Demo catalog

Local presentation data, not a production database. Use realistic invented identities, reserved `@partnerhub.test` addresses and illustrative photography. Do not scrape personal data or imply actual partnerships.

- `people.ts`: stable account IDs, fictional names and reserved emails.
- `organizations.ts`: organizer identities, sponsor companies, industries, interests and sector-photo keys.
- `accounts.ts`: builds accounts from those catalogs. The first organizer, user and sponsor remain banner-switch destinations.
- `events.ts`: event definitions, owner/supporter IDs, venues, photo keys, ticket prices and fields. Dates are relative to each fresh seed.
- `media.ts`: local paths and Pexels IDs. Sources and usage context are in `public/demo/photos/CREDITS.md`.
- `../seed.ts`: composes catalogs with operational scenarios: forms, registrations, applications, proposals, offers and notifications. `../types.ts` owns the local-store types, re-exported by seed for compatibility.
- `../upgrade-fixtures.ts`: one-time known-placeholder refresh for previous version-3 tabs. Never replace complete saved records or apply broad text substitution to user data.

Add a sponsor to people and companies once, then reference the stable ID. Add an event's owner, image, price and fields together, followed by only the operational scenarios required. Keep cached transport titles/names consistent and run `tests/workspace/demo-fixtures.test.mjs`.

Photos are compressed JPEGs served by the app, not remote requests or base64 browser storage. Avatars fall back to initials; stock photography is not a corporate logo or an account portrait. New photos need visual inspection, a media entry and credits. No new database or image-service package is needed.

Existing `baseRegistered` values are synthetic anonymous scenario counters, not extra participant rows or real traction. Named registrant/committee rows resolve to accounts. Public pages hide totals; organizer capacity checks retain existing counters. Real persistence and multi-browser synchronization remain In progress.
