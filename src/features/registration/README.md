# Registration frontend

**In progress**. Owns event registration forms and ticket views. Backend owner: `src/backend/registration`.

## Price, registration form, and export

- Organizer: `organizer-registration-page.tsx` at `/events/:id/registration` (registrants table, price, payment note, question editor, Excel export). Participant: `register-form.tsx` renders that form inside the event Detail dialog.
- Contracts (`TODO(backend)` in `services/registration-service.ts`): `GET/PUT /api/events/:id/registration-form`, `GET /api/public/events/:id/registration-form`, `POST /api/public/events/:id/registrations {answers}`, `POST /api/public/events/:id/registration-images`, `GET /api/events/:id/registrants`. Payment proof images are personal data: no public URL, no logging.
- `my-tickets.tsx` is the participant ticket list, composed into `/me/events`.
- Products rules: price is display only (0 to 10.000.000 IDR); PartnerHub does not process payments.

## QR tickets

- `qr/qr-code.ts`: dependency-free QR encoder (byte mode, error correction M, versions 1 to 6, up to 106 bytes). Tested in `tests/registration/qr-code.test.mjs` and round-tripped through jsQR outside the repo.
- `qr/qr-image.tsx` draws a payload as one SVG with a quiet zone, black on white.
- `qr/ticket-qr-dialog.tsx` is the participant's "Tampilkan QR". It fetches the payload only when opened.
- `qr/qr-delivery-page.tsx` is the organizer page at `/events/:id/qr`: see how many registrants hold a code, then create and send the missing ones.
- Payload shape: `PH1.<random secret>`. No name, email, reference, or database id. The secret is never shown as text and never listed; `GET /api/me/registrations` only reports `qrIssued`.
- Contracts live in `services/registration-service.ts` (`TODO(backend)` comments): `GET /api/me/registrations/:id/qr`, `GET /api/events/:id/qr`, `POST /api/events/:id/qr/send`. The real backend must store only a hash of the secret, send `Cache-Control: no-store`, and never log payloads.
- Door scanning and attendance are not built.
