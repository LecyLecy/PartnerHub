import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function assertSingleShell(eventNavigation = true) {
  assert.equal(await page.locator("#workspace-sidebar").count(), 1, "one role sidebar");
  assert.equal(await page.locator("#main-content").count(), 1, "one main content region");
  assert.equal(await page.locator('#workspace-sidebar nav[aria-label="Navigasi utama"]').count(), 1, "one role navigation, including the closed mobile drawer");
  assert.equal(await page.getByRole("navigation", { name: "Navigasi acara", exact: true }).count(), eventNavigation ? 1 : 0, "no nested event navigation");
  assert.equal(await page.locator("#main-content header, #main-content #workspace-sidebar").count(), 0, "no shell inside page content");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
try {
  await mkdir(".impeccable/event-summary", { recursive: true });
  await go("/guide");
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption("organizer");
  await page.waitForURL("**/organizer");
  const before = await stored();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const action of ["Lengkapi detail", "Edit detail acara"]) {
      await go("/organizer/archive");
      await page.locator('a[href="/events/demo-event-4"][aria-label^="Kelola acara:"]').click();
      await page.getByRole("link", { name: action, exact: true }).click();
      await page.waitForURL("**/events/demo-event-4?edit=1");
      await page.getByRole("heading", { name: "Edit detail acara", exact: true }).waitFor();
      await assertSingleShell();
      await page.reload({ waitUntil: "networkidle" });
      await page.getByRole("heading", { name: "Edit detail acara", exact: true }).waitFor();
      await assertSingleShell();
    }
    await page.screenshot({ path: `.impeccable/event-summary/editor-${width}.png`, fullPage: true });
  }
  assert.deepEqual((await stored()).events, before.events, "opening editors never changes records");
  await go("/events/new");
  await page.getByRole("heading", { name: "Susun acara baru", exact: true }).waitFor();
  await assertSingleShell(false);
  await go("/events/demo-event-4/edit");
  await page.getByRole("heading", { name: "Edit detail acara", exact: true }).waitFor();
  await assertSingleShell();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await go("/events/demo-event-1");
    await page.getByRole("heading", { name: /^Paket (Starter|Growth)$/, level: 2 }).waitFor();
    const nav = page.getByRole("navigation", { name: "Navigasi acara", exact: true });
    assert.equal(await nav.getByRole("link", { name: /Laporan & bukti|Paket acara|Edit detail/ }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Edit detail acara", exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `.impeccable/event-summary/summary-${width}.png`, fullPage: true });
  }
  for (const route of ["/events/demo-event-1/edit", "/events/demo-event-1?edit=1"]) {
    await go(route);
    await page.getByRole("heading", { name: "Acara ini sudah dipublikasikan.", exact: true }).waitFor();
    await assertSingleShell();
    assert.equal(await page.locator('input[name="title"]').count(), 0);
    assert.equal(await page.getByRole("button", { name: "Simpan perubahan", exact: true }).count(), 0);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/events/demo-event-4");
  await page.getByRole("link", { name: "Edit detail acara", exact: true }).click();
  await page.waitForURL("**/events/demo-event-4?edit=1");
  await page.locator('input[name="title"]').fill("Pelatihan Panitia Diperbarui");
  await page.getByRole("button", { name: "Waktu & tempat", exact: false }).click();
  const day = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  for (const [name, value] of Object.entries({ date: day, startTime: "09:00", endTime: "12:00", venue: "Ruang Pelatihan", capacity: "100" })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByLabel("Registrasi dibuka", { exact: true }).fill(new Date(Date.now() - 86400000).toISOString().slice(0, 10) + "T09:00");
  await page.getByLabel("Registrasi ditutup", { exact: true }).fill(day + "T08:00");
  await page.getByRole("button", { name: "Logo & identitas", exact: false }).click();
  await page.locator('input[name="organizationName"]').fill("Ruang Tumbuh Collective");
  await page.getByRole("button", { name: "Modul event", exact: false }).click();
  await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
  await page.waitForURL("**/events/demo-event-4?saved=1");
  await page.getByRole("heading", { name: "Pelatihan Panitia Diperbarui", exact: true }).waitFor();
  await assertSingleShell();
  await page.getByRole("link", { name: "Pilih paket", exact: true }).click();
  await page.getByRole("button", { name: "Pilih paket Starter", exact: true }).click();
  await page.getByRole("heading", { name: "Paket Starter", level: 1 }).waitFor();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true }).getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  await go("/events/demo-event-4");
  await page.getByRole("heading", { name: "Paket Starter", level: 2 }).waitFor();
  await page.getByRole("button", { name: "Unggah acara", exact: true }).click();
  await page.getByText("Terpublikasi", { exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Edit detail acara", exact: true }).count(), 0);
  await go("/events/demo-event-4?edit=1");
  await page.getByRole("heading", { name: "Acara ini sudah dipublikasikan.", exact: true }).waitFor();
  const after = await stored();
  assert.equal(after.events.length, before.events.length);
  for (const key of ["registrations", "applications", "sponsorships", "offers"]) assert.deepEqual(after[key], before[key]);
  assert.deepEqual(errors, []);
  console.log("PASS summary: one shell through both archive edit actions/reload, legacy edit/new routes, summary edit/save, payment/publication and locked edit URLs, preserved records, 1440/390/320px.");
} finally { await browser.close(); }
