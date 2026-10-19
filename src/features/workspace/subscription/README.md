# Event billing and annual account subscription frontend

Updated: 18 October 2026. Annual subscription is active in the local demo, scoped to the event owner's account. Organization workspaces remain removed.

## Catalog and rights

Prices/limits: src/contracts/billing.ts. Local decisions: src/mocks/demo/billing.ts.

| Tier | Per event | Annual | Per-event limits |
| --- | --- | --- | --- |
| Paket Starter | Rp149.000 | Rp699.000 | 300 participants, 3 managers including owner |
| Paket Growth | Rp499.000 | Rp1.499.000 | 1.500 participants, 10 managers including owner |

Single-event Starter upgrade costs Rp350.000. Both annual plans allow unlimited qualifying events for one calendar year from confirmation. No stacking, automatic renewal or mid-term annual upgrade.

Setup saves a private event without charging. At upload recheck owner, active term, capacity, manager count and event end within term. Eligible annual coverage replaces the per-event charge; it creates no zero-value transaction. Growth can cover smaller Starter events. Pin coverage only on successful publication. Already-published rights survive term expiry through event end plus 30 days.

## UI and routes

- /organizer/subscription displays exactly three cards: Starter, Growth, Custom. No separate feature disclosure, loose Custom section or history link.
- Custom has special-offer copy and Kontak PartnerHub to /contact, not an invented quote, email or SLA.
- Active status/expiry stay in the matching card; other standard tier cannot purchase a competing active term.
- subscription-checkout.tsx is feature-local and reuses existing billing services plus shared custom confirmation. Selecting/dismissing a card creates no order. Explicit order creation and confirmation remain separate.
- Pending orders resume after reload, expire after 30 minutes and allow retry/new order when appropriate. Cancel/Escape never activates a subscription; preserve focus containment/return.
- /events/:id/package is event checkout/upgrade, reached from Ringkasan acara when needed, not a selected-event sidebar subsection.
- /events/:id/team is event-specific manager assignment, not workspace membership.
- /organizer/transactions remains guarded but its only navigation entry is Pengaturan. One newest-first list includes event, annual-account and read-only historical records. Header Back returns to /settings.
- Single-event PlanCards retain their existing feature details; removing annual disclosure does not remove those.
- Per-event feature details are an open labeled section, not a details/summary disclosure. Annual Subscription remains exactly three cards without adding extra feature/history sections.

## Storage and safety

Keep eventBilling intact. Optional additive accountBilling contains annual orders/subscriptions. Legacy organization billing and exact amounts remain read-only; old organization annual terms cannot authorize new events.

Prices, owner and term are service decisions, never trusted request data. Reject foreign/inactive/unverified/wrong-role confirmations, duplicate active subscriptions and event double charging. Preserve pending historical amounts even if current subscription makes event checkout unnecessary.

No production gateway, webhook, atomic cross-browser billing, refund or persistent entitlement guarantee is implemented. Those remain **In progress**. Browser-local guards simulate rules but are not production security.

## Verification references

tests/workspace/account-subscription.test.mjs, billing.test.mjs, subscription.test.mjs, archive-subscription-browser-check.mjs and subscription-settings-browser-check.mjs cover current local behavior. Retain migration/history, expiry/race, ownership, cancellation, resume and non-duplication checks. Current docs do not imply these tests were rerun during documentation-only reconciliation.
