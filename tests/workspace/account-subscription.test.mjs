import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const { demoRequest: call, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { eventPackage } = loadTs("src/mocks/demo/billing.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const post = (route, body = {}) => call(route, { method: "POST", body });
const login = email => post("/api/auth/login", { email, password: DEMO_PASSWORD });
const subscribe = (tier = "STARTER", extra = {}) => post("/api/organizer/subscription/orders", { tier, ...extra });
const verify = id => post(`/api/organizer/subscription/orders/${id}/verify-demo`, { confirmSimulation: true });
const publish = event => post(`/api/events/${event.id}/lifecycle`, { revision: event.revision, action: "publish" });
const blocked = (promise, code) => assert.rejects(promise, error => error.code === code);
async function fresh(capacity = 200, days = 30) {
  const { ownerId, id, status, revision, updatedAt, ...input } = loadDb().events[0];
  void ownerId; void id; void status; void revision; void updatedAt;
  const start = Date.now() + days * 86400000;
  return post("/api/events", { ...input, matchingFields: ["Pendidikan"], title: "Subscription event test", capacity, startsAt: new Date(start).toISOString(), endsAt: new Date(start + 3600000).toISOString(), registrationOpensAt: new Date(Date.now() - 86400000).toISOString(), registrationClosesAt: new Date(start - 3600000).toISOString() });
}
beforeEach(async () => { resetDemoData(); storage.clear(); await login("demo.penyelenggara@partnerhub.test"); });
test("completed event stays private and unpaid until verified payment and publication", async () => {
  const event = await fresh();
  assert.equal(event.status, "DRAFT");
  assert.equal(loadDb().eventBilling.orders.length, 0);
  assert.equal((await call("/api/public/events")).items.some(item => item.id === event.id), false);
  await blocked(publish(event), "PACKAGE_REQUIRED");
  const pending = await subscribe();
  await blocked(publish(event), "PACKAGE_REQUIRED");
  await verify(pending.id);
  await publish(event);
  assert.ok((await call("/api/public/events")).items.some(item => item.id === event.id));
  assert.equal(loadDb().eventBilling.orders.length, 0, "subscription publication never creates per-event orders");
});
test("annual orders use server prices, owner, idempotency and separate confirmation", async () => {
  const order = await subscribe("STARTER", { amountIdr: 1, ownerId: "attacker" });
  assert.equal(order.amountIdr, 699000); assert.equal(order.ownerId, "demo-organizer");
  assert.equal((await subscribe()).id, order.id);
  assert.equal((await call("/api/organizer/billing")).subscription, null);
  await blocked(post(`/api/organizer/subscription/orders/${order.id}/verify-demo`), "SIMULATION_REQUIRED");
  await verify(order.id); await verify(order.id);
  const board = await call("/api/organizer/billing");
  assert.equal(board.subscription.tier, "STARTER");
  assert.equal(loadDb().accountBilling.subscriptions.length, 1);
  assert.equal(board.subscriptionOrders.length, 1);
  await blocked(subscribe(), "SUBSCRIPTION_ACTIVE");
});
test("Growth price and limits cover multiple Starter/Growth-sized events without double charges", async () => {
  const order = await subscribe("GROWTH"); assert.equal(order.amountIdr, 1499000); await verify(order.id);
  for (const size of [200, 300, 301, 1500]) {
    const event = await fresh(size);
    await blocked(post("/api/organizer/orders", { tier: "GROWTH", eventId: event.id }), "ALREADY_COVERED");
    await publish(event);
    assert.equal(loadDb().eventBilling.coverage[event.id].source, "SUBSCRIPTION");
  }
  await blocked(publish(await fresh(1501)), "PACKAGE_REQUIRED");
  assert.equal(loadDb().eventBilling.orders.length, 0);
});
test("Starter cannot cover Growth capacity, out-of-term or over-manager-limit events", async () => {
  await verify((await subscribe()).id);
  await blocked(publish(await fresh(301)), "PACKAGE_REQUIRED");
  await blocked(publish(await fresh(100, 400)), "PACKAGE_REQUIRED");
  const event = await fresh();
  loadDb().eventBilling.managers[event.id] = ["demo-organizer", "one", "two", "three"];
  await blocked(publish(event), "PACKAGE_REQUIRED");
});
test("expiry prevents new uploads but preserves already published coverage, tickets and single purchases", async () => {
  const event = await fresh(); const order = await subscribe(); await verify(order.id); await publish(event);
  const db = loadDb(); const original = JSON.stringify(db.registrations);
  db.accountBilling.subscriptions[0].endsAt = new Date(Date.now() - 1).toISOString();
  assert.equal(eventPackage(db, db.events.find(item => item.id === event.id)).canPublish, true);
  await blocked(publish(await fresh()), "PACKAGE_REQUIRED");
  assert.equal(JSON.stringify(db.registrations), original);
  assert.equal((await call("/api/organizer/billing")).subscription, null);
  assert.ok(await subscribe("GROWTH"), "expired subscription can buy a new term");
});
test("cross-account, sponsor and pending accounts cannot grant subscription rights", async () => {
  const order = await subscribe();
  loadDb().sessionAccountId = "demo-other-organizer";
  await blocked(verify(order.id), "NOT_FOUND");
  assert.deepEqual((await call("/api/organizer/billing")).subscriptionOrders, []);
  await login("demo.sponsor@partnerhub.test"); await blocked(subscribe(), "FORBIDDEN");
  await login("demo.penyelenggara@partnerhub.test");
  loadDb().accounts.find(item => item.id === "demo-organizer").status = "pending_verification";
  await blocked(verify(order.id), "FORBIDDEN");
});
test("assigned managers cannot lend their subscription to another owner's event, expiry is checked at submit", async () => {
  const event = await fresh();
  const db = loadDb();
  db.eventBilling.managers[event.id].push("demo-other-organizer");
  db.sessionAccountId = "demo-other-organizer";
  await verify((await subscribe("GROWTH")).id);
  await blocked(publish(event), "PACKAGE_REQUIRED");
  await login("demo.penyelenggara@partnerhub.test");
  await verify((await subscribe()).id);
  assert.equal(eventPackage(db, db.events.find(item => item.id === event.id)).canPublish, true);
  db.accountBilling.subscriptions.find(item => item.ownerId === "demo-organizer").endsAt = new Date(Date.now() - 1).toISOString();
  await blocked(publish(event), "PACKAGE_REQUIRED");
});
test("competing or expired annual orders cannot activate twice; pending single order cannot double bill", async () => {
  const event = await fresh();
  const single = await post("/api/organizer/orders", { eventId: event.id, tier: "STARTER" });
  const a = await subscribe(); const b = await subscribe("GROWTH");
  await verify(a.id); await blocked(verify(b.id), "SUBSCRIPTION_ACTIVE");
  await blocked(post(`/api/organizer/orders/${single.id}/verify-demo`, { confirmSimulation: true }), "ALREADY_COVERED");
  assert.equal(loadDb().eventBilling.orders[0].status, "PENDING");
  assert.equal(loadDb().accountBilling.subscriptions.length, 1);
  loadDb().accountBilling.subscriptions[0].endsAt = new Date(Date.now() - 1).toISOString();
  loadDb().accountBilling.orders.find(item => item.id === b.id).expiresAt = "2000-01-01T00:00:00.000Z";
  await blocked(verify(b.id), "ORDER_EXPIRED");
});
