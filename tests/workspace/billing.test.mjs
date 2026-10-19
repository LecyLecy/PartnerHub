import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const { demoRequest: call, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { billingOf, eventPackage, canManageEvent, participantLimit } = loadTs("src/mocks/demo/billing.ts");
const { seed, DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const post = (route, body = {}) => call(route, { method: "POST", body });
const login = email => post("/api/auth/login", { email, password: DEMO_PASSWORD });
const organizer = () => login("demo.penyelenggara@partnerhub.test");
const blocked = (promise, code) => assert.rejects(promise, error => error.code === code);
const order = (eventId, tier = "STARTER", extra = {}) => post("/api/organizer/orders", { eventId, tier, ...extra });
const verify = id => post(`/api/organizer/orders/${id}/verify-demo`, { confirmSimulation: true });
const publish = event => post(`/api/events/${event.id}/lifecycle`, { action: "publish", revision: event.revision });
async function fresh() {
  await organizer();
  const { ownerId, id, status, revision, updatedAt, ...input } = loadDb().events[0];
  void ownerId; void id; void status; void revision; void updatedAt;
  return post("/api/events", { ...input, matchingFields: ["Pendidikan"], title: "QA Event Satuan", capacity: 300 });
}
function legacy(db) {
  const now = new Date().toISOString();
  db.billing = { organizations: [{ id: "old-org", ownerId: "demo-organizer", name: "Organisasi QA Lama", memberIds: ["demo-organizer"] }], selected: { "demo-organizer": "old-org" }, eventOrganizations: {}, managers: {}, coverage: {}, subscriptions: [{ id: "old-sub", organizationId: "old-org", tier: "GROWTH", startsAt: now, endsAt: "2099-01-01T00:00:00.000Z", orderId: "old-annual", simulated: true }], orders: [{ id: "old-annual", organizationId: "old-org", eventId: null, tier: "GROWTH", cycle: "ANNUAL", amountIdr: 1499000, upgrade: false, status: "SUCCEEDED", createdAt: now, expiresAt: now, verifiedAt: now, simulated: true }] };
}
beforeEach(() => { resetDemoData(); storage.clear(); });
test("migration keeps every old dataset and legacy billing object unchanged and is idempotent", () => {
  const db = seed(); legacy(db);
  const before = JSON.stringify(db);
  const billing = billingOf(db);
  const { eventBilling, ...rest } = db;
  assert.equal(JSON.stringify(rest), before);
  assert.equal(billingOf(db), billing);
  assert.ok(eventBilling);
  assert.equal(eventBilling.orders.length, 0, "no fabricated payment or annual fixture");
});
test("existing published annual-backed events retain their tier, but new events never inherit annual coverage", () => {
  const db = seed(); legacy(db);
  db.billing.coverage[db.events[0].id] = { organizationId: "old-org", tier: "STARTER", source: "ANNUAL", orderId: "old-annual", subscriptionId: "old-sub" };
  const billing = billingOf(db);
  assert.equal(billing.coverage[db.events[0].id].tier, "STARTER");
  assert.equal(billing.coverage[db.events[0].id].source, "LEGACY");
  const draft = db.events.find(event => event.status === "DRAFT");
  assert.equal(eventPackage(db, draft).canPublish, false);
  assert.equal(billing.coverage[draft.id], undefined);
});
test("creating an event needs no workspace and publishing requires its own verified package", async () => {
  const event = await fresh();
  const db = loadDb();
  assert.equal(db.billing, undefined);
  await blocked(publish(event), "PACKAGE_REQUIRED");
  const pending = await order(event.id);
  assert.equal(pending.amountIdr, 149000);
  assert.equal(pending.status, "PENDING");
  await blocked(publish(event), "PACKAGE_REQUIRED");
  await verify(pending.id);
  assert.equal((await publish(event)).status, "PUBLISHED");
  const second = await fresh();
  await blocked(publish(second), "PACKAGE_REQUIRED");
  assert.equal(billingOf(db).coverage[second.id], undefined);
});
test("removed workspace, membership, duplication and annual APIs cannot mutate state", async () => {
  const event = await fresh(); const snapshot = JSON.stringify(loadDb());
  for (const route of ["/api/organizer/workspaces", "/api/organizer/workspaces/select", "/api/organizer/members", `/api/events/${event.id}/duplicate`]) await blocked(post(route, { name: "Do not create", organizationId: "old-org" }), "FEATURE_REMOVED");
  await blocked(order(event.id, "STARTER", { cycle: "ANNUAL" }), "INVALID_PLAN");
  assert.equal(JSON.stringify(loadDb()), snapshot);
});
test("orders reject foreign/missing events and ignore client price/owner overrides", async () => {
  const event = await fresh();
  await blocked(order("demo-event-6"), "EVENT_REQUIRED");
  await blocked(order("missing"), "EVENT_REQUIRED");
  const created = await order(event.id, "GROWTH", { amountIdr: 1, ownerId: "attacker" });
  assert.equal(created.amountIdr, 499000);
  assert.equal(created.ownerId, "demo-organizer");
  await login("demo.sponsor@partnerhub.test");
  await blocked(order(event.id), "FORBIDDEN");
});
test("pending order retry and verification are idempotent, conflicting coverage cannot activate twice", async () => {
  const event = await fresh(); const a = await order(event.id); const b = await order(event.id);
  assert.equal(a.id, b.id);
  const competing = await order(event.id, "GROWTH");
  await verify(a.id); await verify(a.id);
  await blocked(verify(competing.id), "ALREADY_COVERED");
  const upgrade = await order(event.id, "GROWTH");
  assert.equal(upgrade.amountIdr, 350000);
  await verify(upgrade.id);
  assert.equal(billingOf(loadDb()).coverage[event.id].tier, "GROWTH");
  await blocked(order(event.id), "ALREADY_COVERED");
  assert.equal((await call("/api/organizer/billing")).orders.length, 3);
});
test("expired and unconfirmed orders cannot activate, foreign owners cannot verify", async () => {
  const event = await fresh(); const pending = await order(event.id);
  await blocked(post(`/api/organizer/orders/${pending.id}/verify-demo`), "SIMULATION_REQUIRED");
  loadDb().sessionAccountId = "demo-other-organizer";
  await blocked(verify(pending.id), "NOT_FOUND");
  await organizer();
  billingOf(loadDb()).orders[0].expiresAt = "2000-01-01T00:00:00.000Z";
  await blocked(verify(pending.id), "ORDER_EXPIRED");
});
test("single-event Starter upgrade is Rp350000 and preserves operational data", async () => {
  const event = await fresh(); const pending = await order(event.id);
  await verify(pending.id);
  const snapshot = JSON.stringify(loadDb().registrations);
  const upgrade = await order(event.id, "GROWTH");
  assert.equal(upgrade.upgrade, true); assert.equal(upgrade.amountIdr, 350000);
  await verify(upgrade.id);
  assert.equal(eventPackage(loadDb(), loadDb().events.find(item => item.id === event.id)).participantLimit, 1500);
  assert.equal(JSON.stringify(loadDb().registrations), snapshot);
});
test("legacy annual orders are read-only history, and a late annual confirmation cannot grant new rights", async () => {
  await organizer(); const db = loadDb(); legacy(db);
  const archive = JSON.stringify(db.billing);
  const board = await call("/api/organizer/billing");
  assert.equal(board.history[0].id, "old-annual");
  assert.equal(board.history[0].amountIdr, 1499000);
  await blocked(verify("old-annual"), "NOT_FOUND");
  assert.equal(JSON.stringify(db.billing), archive);
  db.sessionAccountId = "demo-other-organizer";
  assert.deepEqual((await call("/api/organizer/billing")).history, []);
});
test("legacy single pending orders remain payable by the original event owner at their recorded amount", async () => {
  await organizer(); const db = loadDb(); legacy(db);
  const draft = db.events.find(event => event.status === "DRAFT");
  db.billing.orders.push({ ...db.billing.orders[0], id: "old-single", eventId: draft.id, cycle: "SINGLE", amountIdr: 149000, tier: "STARTER", status: "PENDING", expiresAt: "2099-01-01T00:00:00.000Z", verifiedAt: null });
  delete db.eventBilling;
  const archive = JSON.stringify(db.billing);
  await verify("old-single");
  assert.equal(billingOf(db).coverage[draft.id].tier, "STARTER");
  assert.equal(JSON.stringify(db.billing), archive);
});
test("event managers get only assigned event access; only the owner can buy packages or assign managers", async () => {
  const event = await fresh(); const pending = await order(event.id); await verify(pending.id);
  const other = loadDb().accounts.find(account => account.id === "demo-other-organizer");
  await call(`/api/events/${event.id}/managers`, { method: "PUT", body: { accountIds: [], email: other.email } });
  const db = loadDb(); assert.ok(canManageEvent(db, db.events.find(item => item.id === event.id), other.id));
  assert.equal(canManageEvent(db, db.events.find(item => item.id === "demo-event-1"), other.id), false);
  db.sessionAccountId = other.id;
  assert.ok((await call("/api/events")).items.some(item => item.id === event.id));
  await blocked(order(event.id, "GROWTH"), "EVENT_REQUIRED");
  await blocked(call(`/api/events/${event.id}/managers`, { method: "PUT", body: { accountIds: [] } }), "OWNER_REQUIRED");
});
test("manager revocation remains possible after service expiry and never deletes historical work", async () => {
  const event = await fresh(); const pending = await order(event.id); await verify(pending.id);
  const db = loadDb(); const target = db.events.find(item => item.id === event.id);
  const billing = billingOf(db); billing.managers[event.id].push("demo-other-organizer");
  target.endsAt = "2000-01-01T00:00:00.000Z";
  const snapshot = JSON.stringify(db.registrations);
  await call(`/api/events/${event.id}/managers`, { method: "PUT", body: { accountIds: [] } });
  assert.deepEqual(billing.managers[event.id], ["demo-organizer"]);
  assert.equal(JSON.stringify(db.registrations), snapshot);
});
test("tier capacity, service expiry and read-only reports remain event scoped", async () => {
  const event = await fresh(); const pending = await order(event.id); await verify(pending.id);
  const db = loadDb(); const target = db.events.find(item => item.id === event.id);
  assert.equal(participantLimit(db, target), 300);
  target.capacity = 301;
  assert.equal(eventPackage(db, target).canPublish, false);
  target.capacity = 300; target.endsAt = "2000-01-01T00:00:00.000Z";
  assert.equal(eventPackage(db, target).readOnly, true);
  await blocked(publish(target), "EVENT_READ_ONLY");
  assert.equal((await call(`/api/events/${event.id}/report`)).eventTitle, target.title);
});
test("old workspace-specific event idempotency keys are still respected without restoring workspaces", async () => {
  const event = await fresh(); const db = loadDb();
  db.idempotency["demo-organizer:old-org:old-key"] = event.id;
  const again = await call("/api/events", { method: "POST", body: { title: "No duplicate" }, headers: { "Idempotency-Key": "old-key" } });
  assert.equal(again.id, event.id);
});
test("runtime schemas reject annual activation DTOs, invalid limits and real-money flags", () => {
  const { packageOrderSchema, eventPackageSchema } = loadTs("src/contracts/billing.ts");
  assert.equal(packageOrderSchema.safeParse({ cycle: "ANNUAL" }).success, false);
  const db = seed(); const view = eventPackage(db, db.events[0]);
  assert.equal(eventPackageSchema.safeParse({ ...view, participantLimit: -1 }).success, false);
  assert.equal(packageOrderSchema.safeParse({ simulated: false }).success, false);
});
