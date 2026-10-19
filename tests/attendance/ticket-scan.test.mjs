import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const call = (route, options = {}) => demoRequest(route, options);
const login = (email) => call("/api/auth/login", { method: "POST", body: { email, password: DEMO_PASSWORD }, auth: false });
const scan = (payload, id = "demo-event-1") => call(`/api/events/${id}/ticket-scans`, { method: "POST", body: { payload } });
const denied = (promise, status) => assert.rejects(promise, (error) => error.status === status);

beforeEach(() => { resetDemoData(); storage.clear(); for (const event of loadDb().events) event.modules.attendance = true; });

async function issuedTicket() {
  await login("demo.penyelenggara@partnerhub.test");
  await call("/api/events/demo-event-1/qr/send", { method: "POST", body: {} });
  await login("demo.user@partnerhub.test");
  const ticket = (await call("/api/me/registrations")).items.find((item) => item.event.id === "demo-event-1" && item.status === "REGISTERED");
  const { payload } = await call(`/api/me/registrations/${ticket.id}/qr`);
  await login("demo.penyelenggara@partnerhub.test");
  return { ticket, payload };
}

test("issued QR resolves individual ticket and records entry once, also visible to registrants", async () => {
  const { ticket, payload } = await issuedTicket();
  loadDb().events.find((event) => event.id === "demo-event-1").modules.attendance = true;
  const first = await scan(payload);
  assert.equal(first.attendance, "RECORDED");
  assert.equal(first.participant.id, ticket.id);
  assert.equal(first.participant.status, "REGISTERED");
  assert.ok(first.participant.name && first.participant.checkedInAt);
  assert.equal("qrSecret" in first.participant, false);
  assert.equal("email" in first.participant, false);
  const repeat = await scan(payload);
  assert.equal(repeat.attendance, "ALREADY_RECORDED");
  assert.equal(repeat.participant.checkedInAt, first.participant.checkedInAt);
  const board = await call("/api/events/demo-event-1/attendance");
  assert.equal(board.items.filter((item) => item.id === ticket.id).length, 1);
  assert.equal((await call("/api/events/demo-event-1/registrants")).items.find((item) => item.id === ticket.id).checkedInAt, first.participant.checkedInAt);
});

test("disabled attendance refuses scanning and never creates an entry", async () => {
  const { payload } = await issuedTicket();
  loadDb().events.find((event) => event.id === "demo-event-1").modules.attendance = false;
  await denied(scan(payload), 403);
  assert.deepEqual((await call("/api/events/demo-event-1/attendance")).items, []);
});

test("invalid, wrong event, inactive tickets and foreign events disclose no details or attendance", async () => {
  const { ticket, payload } = await issuedTicket();
  await denied(scan("not a QR ticket"), 422);
  await denied(scan(payload, "demo-event-2"), 404);
  await denied(scan(`PH1.${"A".repeat(24)}`), 404);
  await denied(scan(payload, "demo-event-6"), 404);
  for (const status of ["PENDING", "REJECTED", "CANCELLED"]) {
    loadDb().registrations.find((item) => item.id === ticket.id).status = status;
    await denied(scan(payload), 409);
  }
  assert.deepEqual((await call("/api/events/demo-event-1/attendance")).items, []);
});

test("ordinary participant and sponsor cannot scan tickets or read attendance", async () => {
  const { payload } = await issuedTicket();
  loadDb().applications.filter(item => item.eventId === "demo-event-1").forEach(item => { item.status = "SUBMITTED"; });
  for (const email of ["demo.user@partnerhub.test", "demo.sponsor@partnerhub.test"]) {
    await login(email);
    await denied(scan(payload), 403);
    await denied(call("/api/events/demo-event-1/attendance"), 403);
  }
});
