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
async function checkBack(href) {
  const back = page.locator("header [data-header-back] a");
  await back.waitFor();
  assert.equal(await back.count(), 1);
  assert.equal(await back.getAttribute("href"), href);
  assert.equal((await back.innerText()).trim(), "", "Arrow only, no visible label");
  assert.match(await back.getAttribute("aria-label"), /Kembali/);
  assert.equal(await page.locator("main [data-header-back] a").count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No page overflow");
}
try {
  await mkdir(".impeccable/header-back", { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/explore/demo-event-1");
    await page.getByRole("heading", { level: 1 }).waitFor();
    await checkBack("/explore");
    await page.screenshot({ path: ".impeccable/header-back/public-" + width + ".png" });
    await page.locator("header [data-header-back] a").click();
    await page.waitForURL("**/explore");
    await go("/login");
    await checkBack("/");
  }
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption("organizer");
  await page.waitForURL("**/organizer");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/events/demo-event-1");
    await page.getByRole("heading", { level: 1 }).waitFor();
    await checkBack("/organizer");
    assert.equal(await page.getByRole("link", { name: /Lihat pendaftar|Lihat pendaftaran/, exact: true }).count(), 0);
    await page.getByRole("navigation", { name: "Navigasi acara", exact: true }).getByRole("link", { name: "Pendaftaran", exact: true }).waitFor();
    await page.screenshot({ path: ".impeccable/header-back/organizer-" + width + ".png" });
    await go("/events/demo-event-1/package");
    await page.getByRole("heading", { level: 1, name: /^(Pilih paket|Paket Starter|Paket Growth)$/, exact: true }).waitFor();
    await checkBack("/events/demo-event-1");
    await page.locator("header [data-header-back] a").click();
    await page.waitForURL("**/events/demo-event-1");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/events/new");
  await page.locator('input[name="title"]').fill("Preserve this form");
  await checkBack("/organizer");
  await page.locator("header [data-header-back] a").click();
  const dialog = page.getByRole("dialog", { name: "Tinggalkan halaman?", exact: true });
  await dialog.getByRole("button", { name: "Batal", exact: true }).click();
  assert.equal(await page.locator('input[name="title"]').inputValue(), "Preserve this form");
  await page.locator("header [data-header-back] a").click();
  await dialog.getByRole("button", { name: "Tinggalkan halaman", exact: true }).click();
  await page.waitForURL("**/organizer");
  assert.equal(await page.locator("header [data-header-back] a").count(), 0, "No stale Back link");
  await go("/settings");
  await page.getByRole("heading", { name: "Pengaturan akun", exact: true }).waitFor();
  assert.equal(await page.locator("header [data-header-back] a").count(), 0, "Profile stays without Back");
  assert.deepEqual(errors, []);
  console.log("PASS: arrow-only header Back, explicit destinations, public/account/event pages, no duplicate registration CTA, dirty form cancellation, no stale link, 1440/390/320px.");
} finally { await browser.close(); }
