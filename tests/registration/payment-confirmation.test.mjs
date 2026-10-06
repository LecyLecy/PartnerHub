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
const PNG = "data:image/png;base64,iVBORw0KGgo=";
const answers = { "demo-f1": "UKM Desain Demo", "demo-f2": "Pemula", "demo-f3": PNG };
const join = () => call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers } });
const decide = (id, body) => call(`/api/events/demo-event-2/registrants/${id}/decision`, { method: "POST", body });

test("paid events start as PENDING, free events stay REGISTERED", async () => {
  await login(USER);
  assert.equal((await join()).status, "PENDING");
  assert.equal((await call("/api/public/events/demo-event-3/registrations", { method: "POST", body: {} })).status, "REGISTERED");
});

test("a pending registrant cannot register twice and gets no QR", async () => {
  await login(USER);
  const pending = await join();
  await denied(join(), 409);
  await denied(call(`/api/me/registrations/${pending.id}/qr`), 404);
});

test("confirm moves PENDING to REGISTERED and notifies the participant", async () => {
  await login(USER);
  const pending = await join();
  await login(ORGANIZER);
  const result = await decide(pending.id, { decision: "CONFIRM" });
  assert.equal(result.status, "REGISTERED");
  await login(USER);
  const mine = (await call("/api/me/registrations")).items.find((item) => item.id === pending.id);
  assert.equal(mine.status, "REGISTERED");
  assert.ok((await call("/api/me/notifications")).items.some((item) => item.title === "Pembayaran dikonfirmasi"));
});

test("reject stores the reason and lets the participant register again", async () => {
  await login(USER);
  const pending = await join();
  await login(ORGANIZER);
  const result = await decide(pending.id, { decision: "REJECT", note: "Nominal tidak sesuai" });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.note, "Nominal tidak sesuai");
  await login(USER);
  assert.equal((await call("/api/me/registrations")).items.find((item) => item.id === pending.id).note, "Nominal tidak sesuai");
  assert.equal((await join()).status, "PENDING");
});

test("decisions are owner only, PENDING only, and validated", async () => {
  await login(USER);
  const pending = await join();
  await denied(decide(pending.id, { decision: "CONFIRM" }), 403);
  await login(ORGANIZER);
  await denied(decide(pending.id, { decision: "DELETE" }), 422);
  await denied(decide(pending.id, { decision: "REJECT", note: "x".repeat(201) }), 422);
  await denied(decide("missing", { decision: "CONFIRM" }), 404);
  await decide(pending.id, { decision: "CONFIRM" });
  await denied(decide(pending.id, { decision: "REJECT" }), 409);
});

test("the seeded pending registrants carry a payment proof image", async () => {
  await login(ORGANIZER);
  const board = await call("/api/events/demo-event-2/registrants");
  const pending = board.items.filter((item) => item.status === "PENDING");
  assert.ok(pending.length >= 2);
  assert.ok(pending.every((item) => item.answers.some((answer) => answer.type === "image" && answer.value.startsWith("data:image/png"))));
});
