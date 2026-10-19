# Registration frontend

## Optional QR and committee scanning, 2026-10-18

Participant tickets at /me/events show Tampilkan QR only for confirmed registrations when the event's registration and attendance modules are active. Organizer issuance remains explicit and idempotent. QR-disabled events do not expose show/generate actions; existing secrets are retained but QR endpoints and scanning reject use. Enabling presensi remains organizer-controlled.

Accepted committee members see Scan QR peserta on their own application card at /me/applications. The /me/committee/:id/scan route reuses the attendance feature, not organizer management pages. API checks current active account, accepted membership, event publication and modules on every request. Other applications/events, rejected/withdrawn membership and closed events cannot scan. Closing recruitment does not itself revoke an already accepted membership. Ordinary participants and sponsors cannot scan.

Committee responses contain only display-safe ticket identity/status and entry/exit timestamps. They contain no answers, proof images, review notes, contact details or QR secrets; no bulk attendance list is returned. Committee cannot configure attendance, issue tickets or confirm payments. The existing manager/owner scanner and mode configuration remain. Entry and exit retain first timestamps, repeated scans are idempotent, exit-before-entry and disabled exit are refused. Remove redundant scan buttons from organizer registration/QR delivery pages. Current flags are computed at response time, never inferred from historical QR issuance or trusted from client input. Demo data remains browser-local and is not production security; real production persistence/authorization remain In progress.

## QA follow-up, 2026-10-18

`event-registration-page.tsx` serves `/me/register/:id` through a thin adapter. It reuses the existing event detail/form, preserves the event across login and avoids another form when a pending/confirmed registration exists. Success goes to `/me/events`.

`registration-receipt.tsx` adds a read-only Detail pendaftaran action to every ticket. Existing native-dialog styling is reused. `getMyRegistration` loads validated `MyRegistrationDetail` only while open. Demo `GET /api/me/registrations/:id` requires the registration's participant owner and returns saved answers/proof, not QR secrets. Other participants get 404; other roles get 403. List payloads do not include proof. Form edits do not change answer labels already saved, and closed events do not erase receipt access. Real endpoint and secure persistent proof storage remain In progress. Tests: `registration-receipt.test.mjs` and workspace `qa-followup-browser-check.mjs`.

**In progress**. Owns event registration forms and ticket views. Backend owner: `src/backend/registration`.

## Price, registration form, and export

- Organizer: `organizer-registration-page.tsx` at `/events/:id/registration` (registrants table, price, payment note, question editor, Excel export). Participant: `register-form.tsx` renders that form inside the event Detail dialog.
- Contracts (`TODO(backend)` in `services/registration-service.ts`): `GET/PUT /api/events/:id/registration-form`, `GET /api/public/events/:id/registration-form`, `POST /api/public/events/:id/registrations {answers}`, `POST /api/public/events/:id/registration-images`, `GET /api/events/:id/registrants`. Payment proof images are personal data: no public URL, no logging.
- `my-tickets.tsx` is the participant ticket list, composed into `/me/events`. Committee applications use `/me/applications`, not a second panel on the ticket page. Both are separate destinations in the shared participant sidebar.
- Products rules: price is display only (0 to 10.000.000 IDR); PartnerHub does not process payments.

## QR tickets

- `qr/qr-code.ts`: dependency-free QR encoder (byte mode, error correction M, versions 1 to 6, up to 106 bytes). Tested in `tests/registration/qr-code.test.mjs` and round-tripped through jsQR outside the repo.
- `qr/qr-image.tsx` draws a payload as one SVG with a quiet zone, black on white.
- `qr/ticket-qr-dialog.tsx` is the participant's "Tampilkan QR". It fetches the payload only when opened.
- `qr/qr-delivery-page.tsx` is the organizer page at `/events/:id/qr`: see how many registrants hold a code, then create and send the missing ones.
- Payload shape: `PH1.<random secret>`. No name, email, reference, or database id. The secret is never shown as text and never listed; `GET /api/me/registrations` only reports `qrIssued`.
- Contracts live in `services/registration-service.ts` (`TODO(backend)` comments): `GET /api/me/registrations/:id/qr`, `GET /api/events/:id/qr`, `POST /api/events/:id/qr/send`. The real backend must store only a hash of the secret, send `Cache-Control: no-store`, and never log payloads.
- Attendance and camera/local-image scanning are implemented in the attendance frontend and explicit local demo, including accepted same-event committee access. Production authorization, secret persistence and atomic entry/exit remain In progress. Disabled registration/attendance modules reject direct QR use.
