# Connected frontend verification

Historical verification snapshot, not the current feature specification. The old local-copy and browser-draft scenarios below have been removed from the product. PRD.md and ARCHITECTURE.md govern current behavior. Current focused checks include no-draft-browser-check.mjs, archive-subscription-browser-check.mjs, subscription-settings-browser-check.mjs and footer-legal-browser-check.mjs in their feature/workspace test folders. No tests were rerun merely by updating this note.

**In progress**. These checks cover the frontend only. The authentication and event APIs do not exist in this repository. Browser scenarios intercept `/api/**` with test-only records. They prove client behavior, not server security, email delivery, persistence or image safety.

## Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run test:boundaries
node --test tests/account/*.test.mjs tests/event/*.test.mjs tests/workspace/*.test.mjs tests/architecture/*.test.mjs
```

Browser flow (Playwright is external and not a repository dependency):

```bash
npm run build
npm run start -- --port 3111
# PowerShell
$env:PLAYWRIGHT_MODULE='<path to node_modules/playwright>'
$env:UI_BASE_URL='http://localhost:3111'
$env:UI_REVIEW_DIR='<output folder for screenshots>'
node tests/workspace/product-flow-check.mjs
```

## Last recorded result (2026-10-05)

- Lint, typecheck, production build and 25 node tests passed.
- `tests/workspace/product-flow-check.mjs` passed against the production server.
- Final section of that script runs without any API mock: the real server has no `/api/auth/session`, so the landing page shows a session-check error, login shows "Data atau layanan yang diminta tidak tersedia." while keeping the typed email, and `/dashboard` shows "Akses belum dapat diperiksa." No mock session is substituted.

## Scenarios covered by the browser script

- Guest opening `/dashboard` is redirected to `/login?next=...`; empty login shows validation and makes no request.
- Wrong credentials show an error and retain the email; successful login returns to the dashboard; password visibility toggles.
- Register leads to verification; resend shows a neutral message; token confirmation leads to onboarding and the dashboard.
- Forgot password shows a neutral message; reset without a token is blocked; reset with a token clears the token from the URL and shows success.
- Profile update, logout (server-confirmed), Back after logout, and a second tab leaving the protected page after logout.
- Dashboard empty state, service failure with retry, search with no match, reset search, status filter.
- Event create with only a title; upload failure keeps the created draft and retries without creating a second event; 409 conflict message; successful edit; detail page reloads from the service.
- Unsaved changes: in-app link confirmation and Back traversal are dismissed and keep the user on the editor. The Navigation API is required for Back; browsers without it only get the unload warning.
- Editor regressions: same-day time validation, SVG/corrupt/oversized logo rejection that keeps the previous valid logo, sponsors, local copy save, reload and explicit restore including logos, confirmed local deletion, attendance requires registration, registration window validation and WIB conversion.
- 404 page and responsive no-overflow checks at 1440, 900, 390 and 320px for landing, settings and editor.

## Manual scenarios to repeat once a backend exists

1. Register with a new email, open the real verification email, finish onboarding, reach the dashboard.
2. Log in on two browsers, log out on one, confirm the other leaves protected pages.
3. Let the session expire while an editor has unsaved changes; confirm input is not silently discarded.
4. Open another organization's event ID; confirm 403 or 404 and no data leak.
5. Upload a spoofed or decompression-bomb image; confirm the server rejects it and the editor keeps other input.
6. Save the same new event twice during a network drop; confirm one event exists.
7. Edit the same draft from two browsers; confirm the second save receives a conflict.

## Known limits

- Route guards are navigation controls only. Every API must authorize independently.
- Only `/api/health` exists. Missing routes return 404 and surface as service errors.
- Older draft copies in IndexedDB are browser-wide, not per account.
- The `/favicon.ico` 404 and Node native-TypeScript module-type warnings during tests are pre-existing and nonfatal.
- Email delivery, cookie attributes, CSRF, rate limiting and image processing are backend work listed in `todobackend.md`.

## Role registration, guards and demo mode (2026-10-05)

Two different builds are involved. `product-flow-check.mjs` runs against a normal build and intercepts `/api/**` with test-only records. `role-flow-check.mjs` needs a demo build (`NEXT_PUBLIC_PARTNERHUB_DEMO=1`) because the demo backend runs in the browser.

```bash
# demo build for role-flow-check.mjs
$env:NEXT_PUBLIC_PARTNERHUB_DEMO='1'; npm run build; npm run start -- --port 3112
$env:UI_BASE_URL='http://localhost:3112'; node tests/workspace/role-flow-check.mjs
```

Last recorded result: lint, typecheck, 51 node tests, both browser scripts passed. Searching `.next/static` after separate builds found no demo strings with the variable unset or `0`, and three demo chunks with `1`.

Covered by `role-flow-check.mjs`: role picker (3 cards, sign-in link), empty submit with focus on the first error, field-level errors, password strength and show/hide, Back keeping data, refresh keeping non-sensitive data but not the password, role switch keeping shared fields and clearing role-only ones, free-email warning for sponsors, oversized and wrong-signature files, logo preview with replace and remove, pending verification flow with limited access, redirects away from other roles' pages, a newly registered account starting empty, duplicate email error, the four demo accounts with their own data, proposal creation, Reset data demo, and 390/320px layouts.

Not covered: real email delivery, real admin approval, server-side file inspection, and behavior across different browsers (only Edge was used).

Manual scenarios to repeat by hand: change role halfway through a long form; submit every step empty; upload a 3 MB logo and a renamed `.exe`; press Back on every step; refresh on step 3 and confirm the password field is empty; register with a free-mail address as sponsor; open `/organizer` while signed in as a user; sign in as the pending demo account and try `/events/new`; create a proposal, press Reset data demo, and sign in again; open the site from a normal build and confirm there is no demo banner and the demo credentials are rejected.
