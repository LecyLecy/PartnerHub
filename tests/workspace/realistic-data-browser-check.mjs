import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/realistic-data");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [], externalRequests = [], badPhotos = [];
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => { if (response.url().includes("/demo/photos/") && !response.ok()) badPhotos.push(response.url()); });
await context.route("**/*", route => {
  if (new URL(route.request().url()).origin !== new URL(base).origin) { externalRequests.push(route.request().url()); return route.abort(); }
  return route.continue();
});
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
async function photosLoaded() {
  // Scroll the page so lazy images are requested before checking their natural size.
  const photos = page.locator('img[src^="/demo/photos/"]');
  assert.ok(await photos.count() > 0);
  for (const image of await photos.all()) {
    await image.scrollIntoViewIfNeeded();
    assert.equal(await image.evaluate(async element => { await element.decode(); return element.naturalWidth > 0; }), true);
  }
  await page.evaluate(() => scrollTo(0, 0));
}
try {
  await go("/explore");
  await page.getByRole("list", { name: "Acara publik", exact: true }).waitFor();
  await photosLoaded();
  assert.doesNotMatch(await page.locator("main").innerText(), /Organisasi Demo|Komunitas Demo|Sponsor Demo|pendaftar/i);
  await page.screenshot({ path: path.join(output, "public-events-desktop.png"), fullPage: true });
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption("organizer");
  await page.waitForURL("**/organizer");
  await page.getByRole("button", { name: "Menu akun, Penyelenggara", exact: true }).waitFor();
  await go("/organizer/sponsors?eventId=demo-event-1");
  const all = page.getByRole("list", { name: "Semua sponsor", exact: true });
  await all.waitFor();
  assert.equal(await all.getByRole("listitem").count(), 6);
  assert.equal(await all.getByRole("img").count(), 6);
  await photosLoaded();
  await page.screenshot({ path: path.join(output, "sponsor-directory-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, `sponsor-directory-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Simulate a previous tab and verify refresh without resetting a saved custom price/title.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    delete db.fixtureRevision;
    db.accounts.find(item => item.id === "demo-user").fullName = "Pengguna Demo";
    db.events[0].title = "Acara tersimpan saya";
    db.events[0].branding.eventLogo.url = "/demo/cover-a.svg";
    db.forms["demo-event-1"].priceIdr = 123000;
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await go("/explore");
  await page.getByRole("heading", { name: "Acara tersimpan saya", exact: true }).waitFor();
  await photosLoaded();
  const restored = await page.evaluate(() => {
    const db = JSON.parse(sessionStorage.getItem("partnerhub:demo:v3"));
    return { name: db.accounts.find(item => item.id === "demo-user").fullName, price: db.forms["demo-event-1"].priceIdr, cover: db.events[0].branding.eventLogo.url };
  });
  assert.deepEqual(restored, { name: "Nadia Putri", price: 123000, cover: "/demo/photos/seminar.jpg" });
  for (const [role, destination, label] of [["user", "/me", "Peserta / Calon Panitia"], ["sponsor", "/sponsor", "Sponsor"]]) {
    await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(role);
    await page.waitForURL(`**${destination}`);
    await page.getByRole("button", { name: `Menu akun, ${label}`, exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: `Menu akun, ${label}`, exact: true }).innerText(), label);
    await page.setViewportSize({ width: 320, height: 844 });
    await page.getByRole("button", { name: "Buka menu", exact: true }).click();
    const settings = page.getByRole("navigation", { name: "Menu", exact: true }).getByRole("link", { name: "Pengaturan", exact: true });
    await settings.waitFor();
    assert.equal(await settings.innerText(), `Pengaturan (${label})`);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  assert.deepEqual(externalRequests, [], "all photos and app resources work without external requests");
  assert.deepEqual(badPhotos, []);
  assert.deepEqual(errors, []);
  console.log("PASS realistic data: local photos, 390/320px, legacy-tab refresh preserves edits, role-based account labels in organizer sidebar and participant/sponsor desktop/mobile menus, no page errors.");
} finally { await browser.close(); }
