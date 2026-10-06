import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");

beforeEach(() => { resetDemoData(); storage.clear(); });

const call = (route, options = {}) => demoRequest(route, options);
const login = (email) => call("/api/auth/login", { method: "POST", body: { email, password: DEMO_PASSWORD }, auth: false });
const denied = (promise, status) => assert.rejects(promise, (error) => error.status === status);
const USER = "demo.user@partnerhub.test";
const ORGANIZER = "demo.penyelenggara@partnerhub.test";
const SPONSOR = "demo.sponsor@partnerhub.test";

test("the organizer sends QR per event and only the owner can", async () => {
  await login(ORGANIZER);
  const before = await call("/api/events/demo-event-1/qr");
  assert.equal(before.issued, 0);
  assert.ok(before.registered >= 1);
  await denied(call("/api/events/demo-event-6/qr"), 404);
  await denied(call("/api/events/demo-event-6/qr/send", { method: "POST", body: {} }), 404);
  await denied(call("/api/events/demo-event-4/qr/send", { method: "POST", body: {} }), 409);
  const sent = await call("/api/events/demo-event-1/qr/send", { method: "POST", body: {} });
  assert.equal(sent.issued, sent.registered);
  const again = await call("/api/events/demo-event-1/qr/send", { method: "POST", body: {} });
  assert.equal(again.issued, sent.issued, "sending twice does not issue new codes");
  await login(USER);
  await denied(call("/api/events/demo-event-1/qr"), 403);
});

test("a participant can show a QR only after it was sent, and the payload holds no personal data", async () => {
  await login(USER);
  const tickets = (await call("/api/me/registrations")).items;
  const unsent = tickets.find((item) => item.event.id === "demo-event-1");
  assert.equal(unsent.qrIssued, false);
  await denied(call(`/api/me/registrations/${unsent.id}/qr`), 409);
  await login(ORGANIZER);
  await call("/api/events/demo-event-1/qr/send", { method: "POST", body: {} });
  await login(USER);
  const notes = (await call("/api/me/notifications")).items;
  assert.ok(notes.some((item) => item.title === "QR tiket terkirim"));
  const after = (await call("/api/me/registrations")).items.find((item) => item.id === unsent.id);
  assert.equal(after.qrIssued, true);
  assert.equal("qrSecret" in after, false, "the list never carries the secret");
  const { payload } = await call(`/api/me/registrations/${unsent.id}/qr`);
  assert.match(payload, /^PH1\.[A-Za-z0-9]{24}$/);
  for (const forbidden of ["Pengguna", "demo.user", unsent.ticketReference, unsent.id, "demo-user"]) assert.equal(payload.includes(forbidden), false, `payload must not contain ${forbidden}`);
  const cancelled = tickets.find((item) => item.status === "CANCELLED");
  await denied(call(`/api/me/registrations/${cancelled.id}/qr`), 404);
  await login(SPONSOR);
  await denied(call(`/api/me/registrations/${unsent.id}/qr`), 403);
});

test("every registration gets its own code", async () => {
  await login(USER);
  const free = await call("/api/public/events/demo-event-3/registrations", { method: "POST", body: {} });
  const paid = await call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers: { "demo-f1": "UKM Desain Demo", "demo-f2": "Pemula", "demo-f3": "data:image/png;base64,iVBORw0KGgo=" } } });
  await login(ORGANIZER);
  assert.equal(paid.status, "PENDING");
  await call(`/api/events/demo-event-2/registrants/${paid.id}/decision`, { method: "POST", body: { decision: "CONFIRM" } });
  await call("/api/events/demo-event-3/qr/send", { method: "POST", body: {} });
  await call("/api/events/demo-event-2/qr/send", { method: "POST", body: {} });
  await login(USER);
  const first = await call(`/api/me/registrations/${free.id}/qr`);
  const second = await call(`/api/me/registrations/${paid.id}/qr`);
  assert.notEqual(first.payload, second.payload);
  assert.equal((await call(`/api/me/registrations/${free.id}/qr`)).payload, first.payload, "the same ticket always shows the same code");
});