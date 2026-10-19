import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const { organizerPlans } = loadTs("src/features/workspace/subscription/plans.ts");
const { formatPrice } = loadTs("src/lib/money.ts");
const { canAccess, safeDestination } = loadTs("src/lib/navigation.ts");

test("organizer single-event prices stay unchanged alongside annual alternatives", () => {
  assert.deepEqual(organizerPlans.map(({ id, priceIdr, unit }) => ({ id, priceIdr, unit })), [
    { id: "STARTER", priceIdr: 149000, unit: "/ event" },
    { id: "GROWTH", priceIdr: 499000, unit: "/ event" },
  ]);
  assert.equal(formatPrice(organizerPlans[0].priceIdr), "Rp149.000");
  assert.equal(formatPrice(organizerPlans[1].priceIdr), "Rp499.000");
});
test("annual account prices are centralized and keep per-event limits", () => {
  const { packageTiers } = loadTs("src/contracts/billing.ts");
  assert.equal(packageTiers.STARTER.annualPrice, 699000);
  assert.equal(packageTiers.GROWTH.annualPrice, 1499000);
  assert.equal(packageTiers.STARTER.participants, 300);
  assert.equal(packageTiers.GROWTH.managers, 10);
});

test("subscription deep links stay in the approved organizer area and exclude other roles/review accounts", () => {
  const session = (role, status = "active") => ({ account: { role, status }, emailVerified: true, onboardingComplete: true });
  const route = "/organizer/subscription";
  assert.equal(safeDestination(route), route);
  assert.equal(canAccess(session("organizer"), route), true);
  for (const role of ["user", "sponsor"]) assert.equal(canAccess(session(role), route), false);
  assert.equal(canAccess(session("organizer", "pending_verification"), route), false);
});
