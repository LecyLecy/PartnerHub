import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, statSync } from "node:fs";
import { loadTs } from "../helpers/load-ts.mjs";
const { seed } = loadTs("src/mocks/demo/seed.ts");
const { demoMedia } = loadTs("src/mocks/demo/data/media.ts");
const { demoEvents } = loadTs("src/mocks/demo/data/events.ts");
const { upgradeFixtures } = loadTs("src/mocks/demo/upgrade-fixtures.ts");

test("demo catalogs have unique identities and consistent owners, events, supporters and applicants", () => {
  const db = seed();
  const accounts = new Map(db.accounts.map(item => [item.id, item]));
  const events = new Map(db.events.map(item => [item.id, item]));
  assert.equal(accounts.size, db.accounts.length);
  assert.equal(new Set(db.accounts.map(item => item.email)).size, db.accounts.length);
  assert.equal(events.size, db.events.length);
  assert.ok(db.accounts.every(item => item.email.endsWith("@partnerhub.test") && !/\bDemo\b/.test(item.fullName)));
  for (const event of db.events) {
    assert.equal(accounts.get(event.ownerId).role, "organizer");
    assert.equal(event.branding.organizationName, accounts.get(event.ownerId).summary.find(row => row.label === "Organisasi").value);
    assert.ok(db.forms[event.id].priceIdr > 0);
    for (const sponsor of event.branding.sponsors) {
      assert.equal(accounts.get(sponsor.id).role, "sponsor");
      assert.equal(sponsor.name, accounts.get(sponsor.id).summary.find(row => row.label === "Perusahaan").value);
    }
  }
  for (const rows of [db.registrations, db.applications, db.openings, db.proposals, db.sponsorships, db.offers]) {
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    for (const row of rows) {
      assert.ok(accounts.has(row.ownerId), `missing owner ${row.ownerId}`);
      assert.ok(events.has(row.eventId), `missing event ${row.eventId}`);
      if (row.eventTitle) assert.equal(row.eventTitle, events.get(row.eventId).title);
      if (row.applicantName) assert.equal(row.applicantName, accounts.get(row.ownerId).fullName);
      if (row.registrantName) assert.equal(row.registrantName, accounts.get(row.ownerId).fullName);
    }
  }
  assert.equal(new Set(db.registrations.map(item => item.ticketReference)).size, db.registrations.length);
  for (const item of db.applications) assert.ok(db.openings.some(opening => opening.id === item.openingId && opening.eventId === item.eventId));
  for (const item of db.notifications) assert.ok(accounts.has(item.ownerId));
});

test("fixture photos are bundled JPEGs with provenance and a bounded payload, never remote or base64", () => {
  const db = seed(), paths = new Set(Object.values(demoMedia).map(item => item.path));
  const credits = readFileSync("public/demo/photos/CREDITS.md", "utf8");
  let totalBytes = 0;
  for (const item of Object.values(demoMedia)) {
    assert.match(item.path, /^\/demo\/photos\/[a-z-]+\.jpg$/);
    assert.equal(readFileSync(`public${item.path}`).subarray(0, 3).toString("hex"), "ffd8ff");
    const size = statSync(`public${item.path}`).size;
    assert.ok(size < 400000); totalBytes += size;
    assert.ok(credits.includes(String(item.pexelsId)));
  }
  assert.ok(totalBytes < 1800000);
  assert.ok(db.events.every(item => paths.has(item.branding.eventLogo.url) && item.branding.organizationLogo === null));
  assert.ok(db.accounts.filter(item => item.role === "sponsor").every(item => paths.has(item.imageUrl)));
});

test("seed resets create independent records without mutating catalogs or another session", () => {
  const a = seed(), b = seed();
  a.accounts[0].fullName = "Edited";
  a.events[0].branding.sponsors[0].name = "Edited";
  a.eventMatchingFields["demo-event-1"].push("Kesehatan");
  a.sponsorMatchingProfiles["demo-sponsor"].fields.push("Kesehatan");
  assert.equal(b.accounts[0].fullName, "Nadia Putri");
  assert.equal(b.events[0].branding.sponsors[0].name, "Lentera Sagara Teknologi");
  assert.deepEqual(b.eventMatchingFields["demo-event-1"], ["Pendidikan"]);
  assert.deepEqual(b.sponsorMatchingProfiles["demo-sponsor"].fields, ["Teknologi", "Pendidikan"]);
  assert.deepEqual(demoEvents[0].fields, ["Pendidikan"]);
});

test("legacy refresh changes known placeholders but preserves edits, secrets, prices, preferences and user messages", () => {
  const defaults = seed(), db = seed();
  delete db.fixtureRevision;
  db.accounts[0].fullName = "Pengguna Demo";
  db.accounts[1].fullName = "Nama penyelenggara yang sudah diedit";
  db.accounts[1].summary[0].value = "Organisasi Demo Kampus";
  db.events[0].title = "Judul kustom"; db.events[0].venue = "Aula Demo Utama";
  db.events[0].branding.eventLogo.url = "/demo/cover-a.svg";
  db.events[0].branding.organizationLogo = { id: "old-org", name: "org-kampus.svg", url: "/demo/org-kampus.svg" };
  db.events[0].branding.sponsors[0].name = "Sponsor Demo A";
  db.events[1].venue = "Tempat kustom";
  db.events[1].branding.eventLogo = { id: "custom", name: "custom.png", url: "/custom.png" };
  db.forms["demo-event-1"].priceIdr = 123000;
  db.sponsorMatchingProfiles["demo-sponsor"] = { industry: "Kesehatan", fields: ["Kesehatan"] };
  db.registrations[3].registrantName = "Peserta Demo Satu";
  db.applications[1].applicantName = "Calon Panitia Demo";
  db.offers[0].message = "Pesan buatan pengguna, tentang Perusahaan Demo.";
  const originalSecret = db.registrations[1].qrSecret;
  upgradeFixtures(db, defaults);
  assert.equal(db.fixtureRevision, 1);
  assert.equal(db.accounts[0].fullName, "Nadia Putri");
  assert.equal(db.accounts[1].fullName, "Nama penyelenggara yang sudah diedit");
  assert.equal(db.accounts[1].summary[0].value, "Ruang Tumbuh Collective");
  assert.equal(db.events[0].title, "Judul kustom");
  assert.equal(db.events[0].venue, defaults.events[0].venue);
  assert.equal(db.events[0].branding.eventLogo.url, defaults.events[0].branding.eventLogo.url);
  assert.equal(db.events[0].branding.organizationLogo, null);
  assert.equal(db.events[1].branding.eventLogo.url, "/custom.png");
  assert.equal(db.events[1].venue, "Tempat kustom");
  assert.equal(db.forms["demo-event-1"].priceIdr, 123000);
  assert.equal(db.registrations[3].registrantName, "Alya Maheswari");
  assert.equal(db.applications[1].applicantName, "Naufal Prasetyo");
  assert.equal(db.registrations[1].qrSecret, originalSecret);
  assert.deepEqual(db.sponsorMatchingProfiles["demo-sponsor"].fields, ["Kesehatan"]);
  assert.equal(db.offers[0].message, "Pesan buatan pengguna, tentang Perusahaan Demo.");
  const upgraded = structuredClone(db); upgradeFixtures(db, defaults); assert.deepEqual(db, upgraded);
});

test("stored v3 tabs backfill missing identities without resetting custom data", () => {
  const storage = new Map();
  globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  const { loadDb, resetDb } = loadTs("src/mocks/demo/store.ts");
  const db = seed(); delete db.fixtureRevision;
  db.accounts = db.accounts.filter(item => !item.id.startsWith("demo-registrant-") && item.id !== "demo-other-organizer");
  db.accounts[0].fullName = "Pengguna Demo";
  db.events[0].branding.eventLogo.url = "/demo/cover-b.svg";
  db.events[0].title = "Saved title";
  resetDb(); storage.set("partnerhub:demo:v3", JSON.stringify(db));
  const loaded = loadDb();
  assert.equal(loaded.accounts[0].fullName, "Nadia Putri");
  assert.ok(loaded.accounts.some(item => item.id === "demo-registrant-1"));
  assert.equal(loaded.events[0].title, "Saved title");
  assert.equal(loaded.events[0].branding.eventLogo.url, "/demo/photos/seminar.jpg");
  resetDb();
});
