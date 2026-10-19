import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
const { demoRequest: call, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { publicEventStatus } = loadTs("src/lib/public-events.ts");
beforeEach(() => { resetDemoData(); storage.clear(); });

test("guests can list and read published events, never drafts or private fields", async () => {
  const list = await call("/api/public/events");
  assert.ok(list.items.length >= 6);
  assert.ok(list.items.every(event => event.priceIdr > 0));
  assert.equal(loadDb().sessionAccountId, null);
  const expectedKeys = ["id", "title", "category", "summary", "startsAt", "endsAt", "venue", "capacity", "organizationName", "registeredCount", "priceIdr", "eventLogoUrl", "organizationLogoUrl", "sponsorNames"].sort();
  for (const event of list.items) {
    assert.deepEqual(Object.keys(event).sort(), expectedKeys);
    assert.deepEqual(await call(`/api/public/events/${event.id}`), event);
  }
  for (const id of ["demo-event-4", "demo-event-5", "not-found"]) await assert.rejects(call(`/api/public/events/${id}`), error => error.status === 404);
  await assert.rejects(call("/api/events/demo-event-1"), error => error.status === 401);
  await assert.rejects(call("/api/public/events/demo-event-3/registrations", { method: "POST", body: { answers: {} } }), error => error.status === 401);
});

test("existing demo tabs receive missing ticket prices without resetting edits or saved forms", () => {
  const db = structuredClone(loadDb());
  delete db.forms["demo-event-1"];
  db.events[0].title = "Nama acara yang sudah diedit";
  db.forms["demo-event-2"].priceIdr = 123000;
  const registrationCount = db.registrations.length;
  resetDemoData();
  storage.set("partnerhub:demo:v3", JSON.stringify(db));
  const restored = loadDb();
  assert.equal(restored.events[0].title, "Nama acara yang sudah diedit");
  assert.equal(restored.forms["demo-event-1"].priceIdr, 35000);
  assert.equal(restored.forms["demo-event-2"].priceIdr, 123000);
  assert.equal(restored.registrations.length, registrationCount);
});

test("only public supporter names and agreed sponsorships appear, with duplicates removed", async () => {
  const event = loadDb().events.find(item => item.id === "demo-event-3");
  assert.deepEqual((await call(`/api/public/events/${event.id}`)).sponsorNames, []);
  await call("/api/demo/switch", { method: "POST", body: { role: "sponsor" } });
  const proposal = await call("/api/sponsor/proposals", { method: "POST", body: { eventId: event.id, category: "Media partner", offer: "Publikasi melalui komunitas demo untuk acara ini.", amountLabel: null } });
  assert.deepEqual((await call(`/api/public/events/${event.id}`)).sponsorNames, []);
  await call("/api/demo/switch", { method: "POST", body: { role: "organizer" } });
  await call(`/api/events/${event.id}/sponsor-proposals/${proposal.id}/decision`, { method: "POST", body: { status: "ACCEPTED" } });
  event.branding.sponsors.push({ id: "duplicate", name: " Lentera Sagara Teknologi ", logo: null });
  await call("/api/auth/logout", { method: "POST" });
  assert.deepEqual((await call(`/api/public/events/${event.id}`)).sponsorNames, ["Lentera Sagara Teknologi"]);
  event.status = "CLOSED";
  await assert.rejects(call(`/api/public/events/${event.id}`), error => error.status === 404);
});

test("event timing includes start boundary, excludes end boundary and handles invalid schedules", () => {
  const now = Date.parse("2026-10-17T03:00:00Z");
  const event = { startsAt: "2026-10-17T03:00:00Z", endsAt: "2026-10-17T05:00:00Z" };
  assert.equal(publicEventStatus(event, now - 1), "upcoming");
  assert.equal(publicEventStatus(event, now), "ongoing");
  assert.equal(publicEventStatus(event, Date.parse(event.endsAt)), "ended");
  assert.equal(publicEventStatus({ ...event, endsAt: null }, now), "unscheduled");
  assert.equal(publicEventStatus({ ...event, endsAt: event.startsAt }, now), "unscheduled");
  assert.equal(publicEventStatus({ ...event, startsAt: "invalid" }, now), "unscheduled");
});
