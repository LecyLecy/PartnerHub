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
const ORGANIZER = "demo.penyelenggara@partnerhub.test";
const SPONSOR = "demo.sponsor@partnerhub.test";
const input = { sponsorId: "demo-sponsor", category: "Dana", message: "Kami mengundang Perusahaan Demo mendukung acara ini.", amountLabel: "Rp5 juta", proposalUrl: "https://example.com/proposal" };

test("organizer sends a request to a verified sponsor, sponsor answers once and both are notified", async () => {
  await login(ORGANIZER);
  const directory = (await call("/api/sponsors/directory")).items;
  assert.deepEqual(directory.map((item) => Object.keys(item).sort()), [["companyName", "id", "industry"]]);
  const created = await call("/api/events/demo-event-2/sponsor-offers", { method: "POST", body: input });
  assert.equal(created.status, "SENT");
  assert.equal("ownerId" in created, false);
  await denied(call("/api/events/demo-event-2/sponsor-offers", { method: "POST", body: input }), 409);

  await login(SPONSOR);
  const received = (await call("/api/sponsor/offers")).items;
  assert.ok(received.some((item) => item.id === created.id));
  assert.ok((await call("/api/me/notifications")).items.some((item) => item.title === "Permintaan sponsorship baru"));
  assert.equal((await call(`/api/sponsor/offers/${created.id}/response`, { method: "POST", body: { status: "ACCEPTED" } })).status, "ACCEPTED");
  await denied(call(`/api/sponsor/offers/${created.id}/response`, { method: "POST", body: { status: "DECLINED" } }), 409);

  await login(ORGANIZER);
  assert.ok((await call("/api/me/notifications")).items.some((item) => item.title === "Tanggapan sponsor"));
  assert.equal((await call("/api/events/demo-event-2/sponsor-offers")).items[0].status, "ACCEPTED");
});

test("validation, draft events, foreign events and role boundaries are enforced", async () => {
  await login(ORGANIZER);
  await denied(call("/api/events/demo-event-4/sponsor-offers", { method: "POST", body: input }), 409);
  await denied(call("/api/events/demo-event-6/sponsor-offers"), 404);
  await assert.rejects(call("/api/events/demo-event-2/sponsor-offers", { method: "POST", body: { ...input, sponsorId: "demo-user", message: "pendek", proposalUrl: "http://x" } }), (error) => error.status === 422 && Boolean(error.fields.sponsorId && error.fields.message && error.fields.proposalUrl));
  await login(SPONSOR);
  await denied(call("/api/sponsors/directory"), 403);
  await denied(call("/api/events/demo-event-2/sponsor-offers"), 403);
  await denied(call("/api/events/demo-event-2/committee"), 403);
  await login("demo.user@partnerhub.test");
  await denied(call("/api/sponsor/offers"), 403);
});

test("a sponsor cannot answer an offer addressed to another company", async () => {
  await login(ORGANIZER);
  const created = await call("/api/events/demo-event-2/sponsor-offers", { method: "POST", body: input });
  await login(ORGANIZER);
  await denied(call(`/api/sponsor/offers/${created.id}/response`, { method: "POST", body: { status: "ACCEPTED" } }), 403);
});
