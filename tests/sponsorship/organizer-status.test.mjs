import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const call = (route, options = {}) => demoRequest(route, options);
const login = (email) => call("/api/auth/login", { method: "POST", body: { email, password: DEMO_PASSWORD }, auth: false });
const denied = (promise, status) => assert.rejects(promise, (error) => error.status === status);

beforeEach(() => { resetDemoData(); storage.clear(); });

test("owner sees event-scoped proposals, sponsor names, and no private account fields", async () => {
  await login("demo.penyelenggara@partnerhub.test");
  const items = (await call("/api/events/demo-event-2/sponsor-proposals")).items;
  assert.ok(items.length);
  assert.ok(items.every((item) => item.eventId === "demo-event-2" && item.sponsorName));
  assert.ok(items.every((item) => !["ownerId", "sponsorId", "email", "summary"].some((key) => key in item)));
  assert.deepEqual(items.map((item) => item.createdAt), items.map((item) => item.createdAt).sort().reverse());
  assert.deepEqual((await call("/api/events/demo-event-4/sponsor-proposals")).items, []);
});

test("proposal reads reject foreign events, missing events, and other roles", async () => {
  await login("demo.penyelenggara@partnerhub.test");
  await denied(call("/api/events/demo-event-6/sponsor-proposals"), 404);
  await denied(call("/api/events/missing/sponsor-proposals"), 404);
  await login("demo.sponsor@partnerhub.test");
  await denied(call("/api/events/demo-event-2/sponsor-proposals"), 403);
  await login("demo.user@partnerhub.test");
  await denied(call("/api/events/demo-event-2/sponsor-proposals"), 403);
});

test("a newly submitted sponsor proposal appears only on its target event", async () => {
  await login("demo.sponsor@partnerhub.test");
  const created = await call("/api/sponsor/proposals", { method: "POST", body: { eventId: "demo-event-2", category: "Produk", offer: "Perangkat desain untuk seluruh peserta workshop.", amountLabel: null } });
  await login("demo.penyelenggara@partnerhub.test");
  const target = (await call("/api/events/demo-event-2/sponsor-proposals")).items;
  assert.equal(target[0].id, created.id);
  assert.equal(target[0].status, "SENT");
  assert.equal((await call("/api/events/demo-event-1/sponsor-proposals")).items.some((item) => item.id === created.id), false);
});
