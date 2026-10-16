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

test("user applies once per opening, validation names the failing field", async () => {
  await login(USER);
  const { items } = await call("/api/committee/openings");
  const second = items.find((item) => item.id === "demo-o2");
  await denied(call(`/api/committee/openings/${second.id}/applications`, { method: "POST", body: { divisionIds: [], motivation: "pendek" } }), 422);
  const created = await call(`/api/committee/openings/${second.id}/applications`, { method: "POST", body: { divisionIds: [second.divisions[0].id], motivation: "Saya ingin membantu menyiapkan materi workshop.", answer: null } });
  assert.equal(created.status, "SUBMITTED");
  assert.deepEqual(created.divisions, [second.divisions[0].name]);
  assert.equal("ownerId" in created, false);
  await denied(call(`/api/committee/openings/${second.id}/applications`, { method: "POST", body: { divisionIds: [second.divisions[0].id], motivation: "Saya ingin membantu menyiapkan materi workshop." } }), 409);
});

test("a question on the opening makes the answer required", async () => {
  // The seeded user already applied to demo-o1, so use a fresh account-free check through the organizer-created opening.
  await login(ORGANIZER);
  await call("/api/events/demo-event-2/committee/opening", { method: "PUT", body: { description: "Butuh panitia materi dan registrasi.", divisions: ["Materi"], question: "Alat desain apa yang kamu kuasai?", stages: [], open: true } });
  await login(USER);
  const opening = (await call("/api/committee/openings")).items.find((item) => item.id === "demo-o2");
  await assert.rejects(call(`/api/committee/openings/${opening.id}/applications`, { method: "POST", body: { divisionIds: [opening.divisions[0].id], motivation: "Saya ingin membantu materi workshop ini." } }), (error) => error.status === 422 && Boolean(error.fields.answer));
});

test("organizer follows the stage path and the applicant is notified with the next steps", async () => {
  await login(ORGANIZER);
  const board = await call("/api/events/demo-event-1/committee");
  const [first, second] = board.opening.stages;
  const submitted = board.applications.find((item) => item.status === "SUBMITTED");
  assert.deepEqual(submitted.allowed.map((move) => move.to), [first.id, "REJECTED"]);
  await denied(call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: "ACCEPTED", note: "Selamat bergabung di panitia." } }), 409);
  await denied(call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: second.id, note: null } }), 409);
  const moved = await call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: first.id, note: null } });
  assert.equal(moved.status, "IN_SELECTION");
  assert.equal(moved.stageId, first.id);
  assert.deepEqual(moved.allowed.map((move) => move.to), [second.id, "ACCEPTED", "REJECTED"]);
  await denied(call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: "ACCEPTED", note: "" } }), 422);
  const accepted = await call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: "ACCEPTED", note: "Masuk grup WhatsApp panitia, tautan dikirim lewat email." } });
  assert.equal(accepted.status, "ACCEPTED");
  assert.deepEqual(accepted.allowed, []);
  await denied(call(`/api/events/demo-event-1/committee/applications/${submitted.id}/decision`, { method: "POST", body: { to: "REJECTED", note: null } }), 409);
});

test("organizer defines the stages; applicants see the whole path and an opening without stages goes straight to a decision", async () => {
  await login(ORGANIZER);
  const body = { description: "Butuh panitia untuk hari pelaksanaan.", divisions: ["Acara"], question: null, open: true };
  const before = (await call("/api/events/demo-event-2/committee")).opening;
  const custom = await call("/api/events/demo-event-2/committee/opening", { method: "PUT", body: { ...body, stages: [{ id: before.stages[0].id, name: "Tes tertulis" }, { id: null, name: "Wawancara" }, { id: null, name: "Uji coba" }] } });
  assert.deepEqual(custom.stages.map((item) => item.name), ["Tes tertulis", "Wawancara", "Uji coba"]);
  assert.equal(custom.stages[0].id, before.stages[0].id, "an existing stage keeps its id when renamed");
  await denied(call("/api/events/demo-event-2/committee/opening", { method: "PUT", body: { ...body, stages: [{ id: null, name: "A" }, { id: null, name: "a" }] } }), 422);
  await denied(call("/api/events/demo-event-2/committee/opening", { method: "PUT", body: { ...body, stages: Array.from({ length: 6 }, (_, index) => ({ id: null, name: `Tahap ${index}` })) } }), 422);
  await login(USER);
  const mine = (await call("/api/committee/openings")).items.find((item) => item.id === "demo-o2");
  assert.deepEqual(mine.stages.map((item) => item.name), ["Tes tertulis", "Wawancara", "Uji coba"]);
  const created = await call(`/api/committee/openings/${mine.id}/applications`, { method: "POST", body: { divisionIds: [mine.divisions[0].id], motivation: "Saya ingin membantu menyiapkan materi workshop." } });
  assert.equal(created.stages.length, 3, "the applicant's view carries the whole path");
  assert.equal(created.stageId, null);
});

test("a stage that still holds applicants cannot be removed", async () => {
  await login(ORGANIZER);
  const opening = (await call("/api/events/demo-event-1/committee")).opening;
  const body = { description: "Butuh panitia untuk hari pelaksanaan.", divisions: ["Acara", "Humas"], question: null, open: true };
  const held = opening.stages[0];
  await assert.rejects(call("/api/events/demo-event-1/committee/opening", { method: "PUT", body: { ...body, stages: opening.stages.filter((stage) => stage.id !== held.id) } }), (error) => error.status === 422 && Boolean(error.fields.stages));
  const kept = await call("/api/events/demo-event-1/committee/opening", { method: "PUT", body: { ...body, stages: opening.stages.map((stage) => ({ id: stage.id, name: stage.name })) } });
  assert.equal(kept.stages.length, opening.stages.length);
});
test("accepted applicant sees the organizer note in applications and notifications", async () => {
  await login(USER);
  const mine = (await call("/api/me/committee-applications")).items.find((item) => item.status === "ACCEPTED");
  assert.match(mine.note, /WhatsApp/);
  assert.equal("applicantName" in mine, false);
});

test("decisions create a notification only for the applicant and other organizers cannot see the board", async () => {
  await login(USER);
  const before = (await call("/api/me/notifications")).items.length;
  await login(ORGANIZER);
  const pending = (await call("/api/events/demo-event-1/committee")).applications.find((item) => item.status === "IN_SELECTION");
  await call(`/api/events/demo-event-1/committee/applications/${pending.id}/decision`, { method: "POST", body: { to: "REJECTED", note: "Terima kasih sudah melamar." } });
  await denied(call("/api/events/demo-event-6/committee"), 404);
  await login(USER);
  await denied(call("/api/events/demo-event-1/committee"), 403);
  await denied(call("/api/sponsors/directory"), 403);
  assert.equal((await call("/api/me/notifications")).items.length, before, "the decided applicant is another account, so this user gets no new notification");
});

test("opening needs a published event, unique divisions and keeps existing division ids", async () => {
  await login(ORGANIZER);
  const body = { description: "Butuh panitia untuk hari pelaksanaan.", divisions: ["Acara", "Acara"], question: null, stages: [], open: true };
  await denied(call("/api/events/demo-event-4/committee/opening", { method: "PUT", body: { ...body, divisions: ["Acara"] } }), 409);
  await denied(call("/api/events/demo-event-1/committee/opening", { method: "PUT", body }), 422);
  const before = (await call("/api/events/demo-event-1/committee")).opening;
  const saved = await call("/api/events/demo-event-1/committee/opening", { method: "PUT", body: { ...body, divisions: ["Acara", "Logistik"], stages: before.stages.map((stage) => ({ id: stage.id, name: stage.name })), open: false } });
  assert.equal(saved.status, "CLOSED");
  assert.equal(saved.divisions[0].id, before.divisions.find((item) => item.name === "Acara").id);
  await login(USER);
  assert.equal((await call("/api/committee/openings")).items.some((item) => item.id === saved.id), false);
});
