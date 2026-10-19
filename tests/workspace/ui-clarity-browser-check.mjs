import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/ui-clarity");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const storage = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL(`**${destination}`);
  await page.waitForLoadState("networkidle");
}
async function shot(name) {
  await page.getByLabel("Ganti peran demo", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: page overflow`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
}
try {
  await go("/guide"); await role("organizer", "/organizer");
  const initial = await storage();
  await page.getByRole("heading", { name: "Event kamu", exact: true }).waitFor();
  const sidebar = page.getByRole("complementary", { name: "Ruang kerja penyelenggara" });
  assert.ok((await sidebar.boundingBox()).width > 200, "desktop labels visible without hover");
  assert.equal(await sidebar.getByRole("link", { name: "Subscription", exact: true }).evaluate(el => getComputedStyle(el.querySelector("span")).opacity), "1");
  assert.equal(await page.getByRole("link", { name: /^Kelola acara:/ }).count(), initial.events.filter(event => event.ownerId === "demo-organizer" && event.status !== "DRAFT").length);
  await shot("after-organizer");
  await page.getByLabel("Cari event", { exact: true }).fill("acara-tidak-ada");
  await page.getByRole("heading", { name: "Tidak ada event yang cocok.", exact: true }).waitFor();
  await page.getByRole("button", { name: "Reset pencarian", exact: true }).click();
  await page.getByRole("link", { name: "Kelola acara: Seminar Kepemimpinan Mahasiswa", exact: true }).click();
  await page.getByRole("heading", { name: "Seminar Kepemimpinan Mahasiswa", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Simpan pengelola", exact: true }).count(), 0);
  await page.getByRole("navigation", { name: "Navigasi acara", exact: true }).getByRole("link", { name: "Pengelola", exact: true }).click();
  await page.getByRole("heading", { name: /^Atur pengelola event/ }).waitFor();
  await page.getByRole("button", { name: "Simpan pengelola", exact: true }).waitFor();
  await go("/events/demo-event-1");
  await shot("after-event");
  await page.getByRole("button", { name: "Tutup acara", exact: true }).click();
  await page.getByRole("dialog", { name: "Tutup acara?", exact: true }).getByRole("button", { name: "Batal", exact: true }).click();
  assert.equal((await storage()).events.find(event => event.id === "demo-event-1").status, "PUBLISHED", "cancel preserves lifecycle");
  await go("/events/demo-event-4/package");
  await page.getByRole("heading", { level: 1, name: /^(Pilih paket|Paket Starter|Paket Growth)$/ }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Tim workspace", exact: true }).count(), 0);
  await shot("after-package");
  await go("/organizer/transactions");
  await page.getByRole("heading", { name: "Riwayat transaksi", exact: true }).waitFor();
  await shot("after-transactions");
  const afterReads = await storage();
  for (const field of ["events", "registrations", "applications", "offers", "sponsorships"]) assert.deepEqual(afterReads[field], initial[field], `${field} preserved by navigation`);
  assert.deepEqual(afterReads.eventBilling.orders, initial.eventBilling.orders, "navigation never purchases");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [route, name] of [["/organizer", "organizer"], ["/events/demo-event-1", "event"], ["/events/demo-event-4/package", "package"], ["/events/demo-event-1/team", "managers"], ["/organizer/transactions", "transactions"]]) {
      await go(route); await page.getByRole("heading", { level: 1 }).waitFor();
      await shot(`after-${name}-${width}`);
    }
    await page.getByRole("button", { name: "Buka menu", exact: true }).click();
    await sidebar.getByRole("link", { name: "Subscription", exact: true }).waitFor();
    const lastControl = sidebar.getByRole("button", { name: /^Menu akun/ });
    await lastControl.focus(); await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.closest("#workspace-sidebar") !== null), true, "drawer traps keyboard focus");
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", { name: "Buka menu", exact: true }).getAttribute("aria-expanded"), "false");
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Buka menu");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await role("sponsor", "/sponsor");
  await shot("after-sponsor");
  await go("/sponsor/events");
  const catalog = page.getByRole("list", { name: "Acara untuk didukung", exact: true });
  await page.getByLabel("Cari acara", { exact: true }).fill("Forum Wirausaha");
  assert.equal(await catalog.getByRole("listitem").count(), 1);
  await page.getByLabel("Cari acara", { exact: true }).fill("tidak-ada-acara");
  await page.getByText("Tidak ada acara yang cocok.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Reset pencarian", exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 }); await shot(`after-sponsor-${width}`);
  }
  await go("/sponsor/progress");
  await page.waitForURL("**/sponsor/progress");
  await page.waitForLoadState("networkidle");
  assert.equal(await page.getByRole("list", { name: "Acara untuk didukung", exact: true }).count(), 0);
  await role("user", "/me");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await shot(`after-participant-${width}`);
  }
  assert.deepEqual(errors, []);
  console.log("PASS UI clarity: explicit navigation/actions, open manager sections, independent task URLs/reload, mobile drawer keyboard focus, close cancellation, record preservation, sponsor search/reset, 1440/390/320px and no runtime errors.");
} catch (error) {
  await page.screenshot({ path: path.join(output, "clarity-failure.png"), fullPage: true }); throw error;
} finally { await browser.close(); }
