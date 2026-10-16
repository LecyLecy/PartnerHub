import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
const { demoRequest: call, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const switchRole = role => call("/api/demo/switch", { method: "POST", body: { role } });
const post = (route, body) => call(route, { method: "POST", body });
beforeEach(() => { resetDemoData(); storage.clear(); });

test("new event publishes, accepts a participant, and closes with ownership and revision checks", async () => {
  await switchRole("organizer");
  const template = loadDb().events[0];
  const { id, ownerId, revision, updatedAt, status, ...input } = template;
  void id; void ownerId; void revision; void updatedAt; void status;
  const created = await post("/api/events", { ...input, title: "Creative Community Workshop" });
  await assert.rejects(post(`/api/events/${created.id}/lifecycle`, { action: "publish", revision: "old" }), error => error.status === 409);
  const published = await post(`/api/events/${created.id}/lifecycle`, { action: "publish", revision: created.revision });
  assert.equal(published.status, "PUBLISHED");
  await switchRole("user");
  assert.ok((await call("/api/public/events")).items.some(event => event.id === created.id));
  const registration = await post(`/api/public/events/${created.id}/registrations`, { answers: {} });
  assert.equal(registration.status, "REGISTERED");
  await assert.rejects(post(`/api/events/${created.id}/lifecycle`, { action: "close", revision: published.revision }), error => error.status === 403);
  await switchRole("organizer");
  const closed = await post(`/api/events/${created.id}/lifecycle`, { action: "close", revision: published.revision });
  assert.equal(closed.status, "CLOSED");
  await switchRole("user");
  assert.ok(!(await call("/api/public/events")).items.some(event => event.id === created.id));
});

test("incomplete draft cannot publish and outside-window registrations are rejected", async () => {
  await switchRole("organizer");
  const draft = loadDb().events.find(event => event.status === "DRAFT");
  await assert.rejects(post(`/api/events/${draft.id}/lifecycle`, { action: "publish", revision: draft.revision }), error => error.status === 422);
  loadDb().events[0].registrationClosesAt = new Date(Date.now() - 1000).toISOString();
  await switchRole("user");
  // Use another published event to avoid the seeded user's existing registration.
  const event = loadDb().events.find(event => event.id === "demo-event-3");
  event.registrationOpensAt = new Date(Date.now() + 86400000).toISOString();
  await assert.rejects(post(`/api/public/events/${event.id}/registrations`, { answers: {} }), error => error.code === "REGISTRATION_CLOSED");
});

test("proposal decision connects sponsor commitment to reviewed evidence and rejects foreign access", async () => {
  await switchRole("sponsor");
  const proposal = await post("/api/sponsor/proposals", { eventId: "demo-event-3", category: "Media partner", offer: "Dukungan publikasi melalui kanal komunitas demo.", amountLabel: null });
  await switchRole("organizer");
  await post(`/api/events/demo-event-3/sponsor-proposals/${proposal.id}/decision`, { status: "ACCEPTED" });
  let report = await call("/api/events/demo-event-3/report");
  assert.equal(report.sponsorships.length, 1);
  await post("/api/events/demo-event-3/benefits", { sponsorshipId: report.sponsorships[0].id, label: "Publikasi poster acara" });
  report = await call("/api/events/demo-event-3/report");
  const benefit = report.sponsorships[0].benefits[0];
  assert.equal(benefit.status, "PLANNED");
  await assert.rejects(call(`/api/events/demo-event-3/benefits/${benefit.id}`, { method: "PATCH", body: { evidenceUrl: "javascript:alert(1)", verified: true } }), error => error.status === 422);
  await call(`/api/events/demo-event-3/benefits/${benefit.id}`, { method: "PATCH", body: { evidenceUrl: "https://example.com/demo-evidence", verified: true } });
  await switchRole("sponsor");
  const agreement = (await call("/api/sponsor/sponsorships")).items.find(item => item.eventId === "demo-event-3");
  assert.equal(agreement.benefits[0].status, "VERIFIED");
  await assert.rejects(call("/api/events/demo-event-3/report"), error => error.status === 403);
});

test("optional entry and exit preserve first timestamps and forbid exit before entry", async () => {
  await switchRole("organizer");
  await post("/api/events/demo-event-1/qr/send", {});
  await post("/api/events/demo-event-1/attendance", { mode: "ENTRY_EXIT" });
  await switchRole("user");
  const registration = (await call("/api/me/registrations")).items.find(item => item.event.id === "demo-event-1");
  const { payload } = await call(`/api/me/registrations/${registration.id}/qr`);
  await switchRole("organizer");
  await assert.rejects(post("/api/events/demo-event-1/ticket-scans", { payload, direction: "EXIT" }), error => error.code === "ENTRY_REQUIRED");
  assert.equal((await post("/api/events/demo-event-1/ticket-scans", { payload })).attendance, "RECORDED");
  const first = await post("/api/events/demo-event-1/ticket-scans", { payload, direction: "EXIT" });
  assert.equal(first.attendance, "EXIT_RECORDED");
  const repeated = await post("/api/events/demo-event-1/ticket-scans", { payload, direction: "EXIT" });
  assert.equal(repeated.attendance, "ALREADY_EXIT_RECORDED");
  assert.equal(first.participant.checkedOutAt, repeated.participant.checkedOutAt);
  await post("/api/events/demo-event-1/attendance", { mode: "NONE" });
  assert.equal((await post("/api/events/demo-event-1/ticket-scans", { payload })).attendance, "DISABLED");
});

test("demo account login survives reload without storing the raw password", async () => {
  const payload = new FormData();
  const password = "DemoReload-2026!";
  payload.set("payload", new Blob([JSON.stringify({ email: "reload@example.test", fullName: "Akun Reload Demo", password })], { type: "application/json" }));
  const created = await call("/api/auth/register/user", { method: "POST", body: payload });
  const saved = storage.get("partnerhub:demo:v3");
  assert.ok(saved);
  assert.equal(saved.includes(password), false);
  resetDemoData(); storage.set("partnerhub:demo:v3", saved);
  const session = await post("/api/auth/login", { email: "reload@example.test", password });
  assert.equal(session.account.id, created.session.account.id);
  await assert.rejects(post("/api/auth/login", { email: "reload@example.test", password: "wrong-password" }), error => error.status === 401);
});

test("sponsor follow-up persists and accepted requests materialize a commitment", async () => {
  await switchRole("organizer");
  const offer = loadDb().offers[0];
  await post(`/api/events/${offer.eventId}/sponsor-offers/${offer.id}/follow-up`, { date: "2026-12-01", note: "Konfirmasi kebutuhan publikasi" });
  const board = await call(`/api/events/${offer.eventId}/sponsor-offers`);
  assert.equal(board.items.find(item => item.id === offer.id).followUpNote, "Konfirmasi kebutuhan publikasi");
  await switchRole("sponsor");
  await post(`/api/sponsor/offers/${offer.id}/response`, { status: "ACCEPTED" });
  assert.ok((await call("/api/sponsor/sponsorships")).items.some(item => item.eventId === offer.eventId));
  await assert.rejects(post(`/api/events/${offer.eventId}/sponsor-offers/${offer.id}/follow-up`, { date: "2026-12-01", note: "Forbidden" }), error => error.status === 403);
});
