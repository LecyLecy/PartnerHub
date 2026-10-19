import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
const { demoRequest: call, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { sharedMatchingFields } = loadTs("src/lib/matching.ts");
const role = role => call("/api/demo/switch", { method: "POST", body: { role } });
const put = (route, body) => call(route, { method: "PUT", body });
const snapshot = () => JSON.stringify(loadDb());
beforeEach(() => { resetDemoData(); storage.clear(); });

test("matching is deterministic, duplicate-safe and does not match generic Lainnya", () => {
  assert.deepEqual(sharedMatchingFields(["Teknologi", "Pendidikan", "Teknologi"], ["Pendidikan", "Teknologi"]), ["Teknologi", "Pendidikan"]);
  assert.deepEqual(sharedMatchingFields(["Lainnya"], ["Lainnya"]), []);
  assert.deepEqual(sharedMatchingFields(["Kesehatan"], ["Teknologi"]), []);
});

test("organizer directory ranks matching registered sponsors without exposing contacts or sending offers", async () => {
  await role("organizer");
  const before = loadDb().offers.length;
  const board = await call("/api/events/demo-event-1/sponsor-matches");
  assert.equal(board.eventTitle, "Seminar Kepemimpinan Mahasiswa");
  assert.deepEqual(board.fields, ["Pendidikan"]);
  assert.ok(board.items.length >= 6);
  assert.ok(board.items[0].sharedFields.includes("Pendidikan"));
  assert.ok(board.items.some(item => !item.sharedFields.length));
  assert.ok(board.items.every(item => Object.keys(item).every(key => ["id", "companyName", "industry", "imageUrl", "fields", "sharedFields"].includes(key))));
  assert.ok(board.items.every(item => /^\/demo\/photos\/[a-z-]+\.jpg$/.test(item.imageUrl)));
  assert.equal(loadDb().offers.length, before);
  loadDb().accounts.find(item => item.id === "demo-sponsor-education").status = "pending_verification";
  assert.ok(!(await call("/api/events/demo-event-1/sponsor-matches")).items.some(item => item.id === "demo-sponsor-education"));
});

test("matching routes are read-only and retain account and event access guards", async () => {
  await assert.rejects(call("/api/events/demo-event-1/sponsor-matches"), error => error.status === 401);
  await role("organizer");
  const before = snapshot();
  for (const fields of [[], ["Unknown"], ["Teknologi"], ["Pendidikan"]]) {
    await assert.rejects(put("/api/events/demo-event-1/sponsor-matches", { fields }), error => error.status === 405);
  }
  await assert.rejects(call("/api/events/demo-event-6/sponsor-matches"), error => error.status === 404);
  assert.equal(snapshot(), before);
  await role("sponsor");
  await assert.rejects(call("/api/events/demo-event-1/sponsor-matches"), error => error.status === 403);
  const sponsorBefore = snapshot();
  for (const method of ["PUT", "PATCH", "POST", "DELETE"]) {
    await assert.rejects(call("/api/sponsor/matching-profile", { method, body: { industry: "Pendidikan", fields: ["Pendidikan"] } }), error => error.status === 405);
  }
  assert.equal(snapshot(), sponsorBefore);
  await role("user");
  await assert.rejects(call("/api/sponsor/event-matches"), error => error.status === 403);
});

test("new event fields are validated at creation, locked before publication, and shared with matching", async () => {
  await role("organizer");
  const { id, revision, status, updatedAt, ...input } = await call("/api/events/demo-event-1");
  void id; void revision; void status; void updatedAt;
  for (const matchingFields of [undefined, [], ["Unknown"], ["Teknologi", "Teknologi"], Array(6).fill("Teknologi")]) {
    await assert.rejects(call("/api/events", { method: "POST", body: { ...input, matchingFields } }), error => error.status === 422);
  }
  const key = { "Idempotency-Key": "matching-create" };
  const created = await call("/api/events", { method: "POST", body: { ...input, matchingFields: ["Teknologi"] }, headers: key });
  assert.deepEqual(created.matchingFields, ["Teknologi"]);
  assert.deepEqual((await call("/api/events/" + created.id + "/sponsor-matches")).fields, ["Teknologi"]);
  assert.deepEqual((await call("/api/events")).items.find(item => item.id === created.id).matchingFields, ["Teknologi"]);
  const before = snapshot();
  await assert.rejects(call("/api/events/" + created.id, { method: "PATCH", body: { ...created, title: "Changed too", matchingFields: ["Pendidikan"] } }), error => error.code === "FIELDS_LOCKED");
  await assert.rejects(put("/api/events/" + created.id + "/sponsor-matches", { fields: ["Pendidikan"] }), error => error.status === 405);
  assert.equal(snapshot(), before);
  const retried = await call("/api/events", { method: "POST", body: { ...input, matchingFields: ["Pendidikan"] }, headers: key });
  assert.equal(retried.id, created.id);
  assert.deepEqual(retried.matchingFields, ["Teknologi"]);
  const edited = await call("/api/events/" + created.id, { method: "PATCH", body: { ...created, title: "Permitted detail edit" } });
  assert.deepEqual(edited.matchingFields, ["Teknologi"]);
  await assert.rejects(call("/api/events/demo-event-1", { method: "PATCH", body: { ...input, revision: "1", matchingFields: ["Teknologi"] } }), error => error.status === 409);
  assert.deepEqual(loadDb().eventMatchingFields["demo-event-1"], ["Pendidikan"]);
});

test("sponsor registration initializes immutable matching from industry without extra onboarding", async () => {
  const form = new FormData();
  form.set("payload", new Blob([JSON.stringify({ email: "new-sponsor@example.test", fullName: "PIC Sponsor", password: "StrongPass-2026!", companyName: "Company", industry: "Pendidikan" })], { type: "application/json" }));
  const registered = await call("/api/auth/register/sponsor", { method: "POST", body: form });
  const accountId = registered.session.account.id;
  assert.deepEqual(loadDb().sponsorMatchingProfiles[accountId], { industry: "Pendidikan", fields: ["Pendidikan"] });
  await assert.rejects(call("/api/sponsor/matching-profile"), error => error.status === 403);
  await call("/api/demo/approve", { method: "POST", body: {} });
  assert.equal((await call("/api/sponsor/event-matches")).complete, true);
  assert.ok((await call("/api/sponsor/event-matches")).items.some(item => item.eventId === "demo-event-1"));
  await assert.rejects(put("/api/sponsor/matching-profile", { industry: "Teknologi", fields: ["Teknologi"] }), error => error.status === 405);
  await role("organizer");
  assert.ok((await call("/api/events/demo-event-1/sponsor-matches")).items.find(item => item.id === accountId).sharedFields.includes("Pendidikan"));
});

test("invalid sponsor industry cannot create an account", async () => {
  await role("sponsor");
  const before = snapshot();
  for (const industry of ["", "Unknown"]) {
    const form = new FormData();
    form.set("payload", new Blob([JSON.stringify({ email: "bad@example.test", industry })]));
    await assert.rejects(call("/api/auth/register/sponsor", { method: "POST", body: form }), error => error.status === 422);
  }
  assert.equal(snapshot(), before);
});

test("existing sponsor matching is preserved; legacy fallback only reads a known registration industry", async () => {
  await role("sponsor");
  assert.deepEqual((await call("/api/sponsor/matching-profile")).profile, { industry: "Teknologi", fields: ["Teknologi", "Pendidikan"] });
  assert.ok((await call("/api/sponsor/event-matches")).items.length > 0);
  delete loadDb().sponsorMatchingProfiles["demo-sponsor"];
  const before = snapshot();
  assert.deepEqual((await call("/api/sponsor/matching-profile")).profile, { industry: "Teknologi", fields: ["Teknologi"] });
  assert.equal(snapshot(), before, "reads do not rewrite legacy data");
  loadDb().accounts.find(item => item.id === "demo-sponsor").summary.find(row => row.label === "Industri").value = "";
  assert.equal((await call("/api/sponsor/matching-profile")).profile, null);
  assert.deepEqual(await call("/api/sponsor/event-matches"), { complete: false, items: [] });
});

test("recommendations exclude closed and elapsed events and preserve saved profiles across reload", async () => {
  await role("sponsor");
  const db = loadDb();
  const profile = structuredClone(db.sponsorMatchingProfiles["demo-sponsor"]);
  db.events.find(item => item.id === "demo-event-1").endsAt = new Date(Date.now() - 1000).toISOString();
  db.events.find(item => item.id === "demo-event-6").status = "CLOSED";
  const result = await call("/api/sponsor/event-matches");
  assert.ok(!result.items.some(item => ["demo-event-1", "demo-event-6"].includes(item.eventId)));
  const saved = storage.get("partnerhub:demo:v3");
  resetDemoData(); storage.set("partnerhub:demo:v3", saved);
  assert.deepEqual((await call("/api/sponsor/matching-profile")).profile, profile);
  assert.ok(!(await call("/api/sponsor/event-matches")).items.some(item => item.eventId === "demo-event-1"));
});
