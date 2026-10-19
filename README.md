# PartnerHub

<p align="center"><img src="./public/brand/partnerhub-wordmark-transparent-hd.png" alt="PartnerHub, event operations and sponsorship" width="640"></p>

Event operations with sponsorship discovery and accountability for campus organizations, communities and small organizers.

Updated: 18 October 2026. Current changes are local; an earlier hosted preview must not be assumed to include them.

## Current product

Complete event setup, keep it privately in **Arsip acara**, then upload using either verified per-event payment or an eligible annual organizer-account subscription. Only published events enter guest discovery; details become read-only after publication. Organization/workspace setup and browser draft-copy features are removed.

| Plan | Per event | Per year | Per-event limits |
| --- | --- | --- | --- |
| Paket Starter | Rp149.000 | Rp699.000 | 300 participants, 3 managers including owner |
| Paket Growth | Rp499.000 | Rp1.499.000 | 1.500 participants, 10 managers including owner |

Annual plans cover unlimited qualifying events without an additional per-event fee. The event must fit the tier and end within the subscription term. Single-event Starter upgrade: Rp350.000. Custom offers use **Kontak PartnerHub**. Prices live in [billing contracts](./src/contracts/billing.ts).

Connected local flows include:

- Public ongoing/upcoming event discovery and details without application login. Public registrant totals are hidden; empty sponsor sections are omitted.
- Participant registration, organizer-reviewed payment proof, private receipt and tickets. Seeded events have paid prices; new event forms still permit price 0.
- Committee applications with custom selection stages and visible, truthful progress.
- Optional QR issuance/display and organizer or accepted-committee entry/exit scanning.
- Two-way field matching, sponsor invitations/proposals, separate collaboration progress and benefit evidence.
- Stable role sidebars, event navigation above content, account-popup Pengaturan, settings-only transaction history and footer-only legal links.
- Exactly three subscription cards: Starter, Growth and Custom, with checkout in a dialog.

Matching is rule-based, not real AI. Sponsorship recommendations do not guarantee funding. Local fixture activity is not real customers, transactions or partnerships.

## Delivery boundary

The explicit demo build uses fictional data and browser-only services in versioned in-tab sessionStorage. Keep **Ganti peran demo**. Independent browsers do not share this database. Normal builds default to non-demo mode, with no silent mock fallback.

Real authentication/approval, email, secure uploads, database-backed operations, payment gateway/webhooks and production concurrency remain **In progress**. The Prisma schema covers the earlier anonymous-registration foundation, not all current frontend/demo contracts. See [backend backlog](./todobackend.md).

Existing local test/browser evidence is recorded in tests and [delivery notes](./DEMO-DELIVERY.md). Functional QA does not establish demand, usability-study results, paid usage or revenue. No new build or browser tests are implied by this documentation reconciliation.

## Run locally

Use Node 22.18+ or Node 24 for native TypeScript test loading.

```powershell
npm install
$env:NEXT_PUBLIC_PARTNERHUB_DEMO = "1"
npm run dev
```

Open http://localhost:3000 unless the terminal reports another port. For a production-mode local demo build:

```powershell
npm run build:demo
npm start
```

A normal `npm run build` remains non-demo by default. Do not publish or deploy changes without authorization.

## Architecture and ownership

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4/CSS Modules and Zod. Prisma/PostgreSQL is the selected production persistence direction; connection and expanded migrations remain In progress.

```text
src/app              thin route adapters and composition
src/features         frontend UI, state and typed services
src/backend          server-only feature logic
src/contracts        shared transport contracts
src/lib              shared frontend-safe utilities
src/mocks/demo       explicit browser-local demo services/catalog
prisma               implemented persistent schema and migrations
tests                focused tests and isolated browser checks
```

Confirm feature/layer and exact shared-file scope before implementation, following [AGENTS.md](./AGENTS.md). Preserve existing dirty work and data; never reset unrelated changes or import another feature's internals.

```powershell
npm run test:boundaries
npm run typecheck
npm run lint
git diff --check
```

Database configuration names are in `.env.example`; do not commit credentials. Database or migration operations require an approved backend/infrastructure task, not ordinary demo hosting.

## Documentation

- [Brand assets](./public/brand/README.md): approved transparent wordmark and compact symbol replacing the previous opaque logos. Desktop headers/sidebar/footer use the wordmark; narrow public headers and favicon use the symbol.
- [PRD.md](./PRD.md): product, audience, current flows, prices, acceptance and unresolved risks.
- [ARCHITECTURE.md](./ARCHITECTURE.md): complete runtime, data, state, security and integration design.
- [ARCHITECTURE-ESSETIALS.md](./ARCHITECTURE-ESSETIALS.md): short implementation guardrails.
- [PRODUCT.md](./PRODUCT.md): design-facing product context.
- [Demo catalog](./src/mocks/demo/data/README.md) and [photo provenance](./public/demo/photos/CREDITS.md): fictional fixtures and bundled visuals.
- Earlier verification/delivery notes describe their dated implementation, not authority to restore superseded behavior.

## License

Application license decision is **In progress**. Bundled Bricolage Grotesque and Manrope fonts include SIL Open Font Licenses. Photos have separate provenance; illustrative pictures are not proof of actual events or sponsorships.
