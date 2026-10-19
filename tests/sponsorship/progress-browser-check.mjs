import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/sponsor-progress");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const navigation = () => page.locator("#workspace-sidebar").getByRole("navigation", { name: "Navigasi utama", exact: true, includeHidden: true });
const summary = () => page.getByRole("list", { name: "Ringkasan", exact: true });
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL(`**${destination}`);
}
async function stat(label, expected) {
  const item = summary().getByRole("listitem").filter({ hasText: label });
  await item.waitFor();
  assert.equal(await item.locator('strong [aria-hidden="true"]').innerText(), String(expected));
}
async function onlyCatalog() {
  await page.getByRole("heading", { name: "Rekomendasi event", exact: true }).waitFor();
  await page.getByRole("region", { name: "Rekomendasi event untuk perusahaanmu", exact: true }).waitFor();
  assert.equal(await summary().count(), 0);
  for (const name of ["Permintaan dari penyelenggara", "Manfaat sponsor", "Proposal perusahaanmu"]) assert.equal(await page.getByRole("heading", { name, exact: true }).count(), 0);
  assert.equal(await navigation().getByRole("link", { name: "Rekomendasi", exact: true, includeHidden: true }).getAttribute("aria-current"), "page");
}
try {
  await go("/sponsor/progress");
  await page.waitForURL(/\/login(?:\?|$)/);
  await role("sponsor", "/sponsor");
  await onlyCatalog();
  await page.screenshot({ path: path.join(output, "discovery-desktop.png"), fullPage: true });
  await navigation().getByRole("link", { name: "Permintaan masuk", exact: true }).click();
  await page.waitForURL("**/sponsor/progress");
  await page.getByRole("heading", { name: "Permintaan masuk", exact: true }).waitFor();
  assert.equal(await summary().count(), 0);
  assert.equal(await page.getByRole("heading", { name: "Rekomendasi event", exact: true }).count(), 0);
  assert.equal(await page.getByRole("region", { name: "Rekomendasi event untuk perusahaanmu", exact: true }).count(), 0);
  assert.equal(await navigation().getByRole("link", { name: "Permintaan masuk", exact: true }).getAttribute("aria-current"), "page");
  await go("/sponsor/progress/proposals");
  await stat("proposal terkirim", 3);
  await page.getByRole("button", { name: "Detail proposal Workshop Desain Poster Acara", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByText("Perangkat lunak desain untuk peserta workshop selama satu bulan.", { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Tutup", exact: true }).click();
  await go("/sponsor/progress");
  await page.getByRole("button", { name: "Detail permintaan Temu Komunitas Relawan", exact: true }).click();
  await dialog.getByRole("button", { name: "Terima", exact: true }).click();
  await page.getByText("Permintaan diterima.", { exact: true }).waitFor();
  await go("/sponsor/progress/benefits");
  await page.getByRole("list", { name: "Daftar komitmen", exact: true }).getByRole("heading", { name: "Temu Komunitas Relawan", exact: true }).waitFor();
  await stat("komitmen aktif", 2);
  await page.reload({ waitUntil: "networkidle" }); await stat("komitmen aktif", 2);
  await page.screenshot({ path: path.join(output, "progress-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, `progress-${width}.png`), fullPage: true });
    await go("/sponsor"); await onlyCatalog();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await go("/sponsor/progress/benefits"); await stat("komitmen aktif", 2);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/sponsor"); await onlyCatalog();
  await go("/sponsor/events");
  await page.getByRole("list", { name: "Acara untuk didukung", exact: true }).getByRole("button", { name: "Detail Forum Wirausaha Muda", exact: true }).click();
  await dialog.getByRole("link", { name: "Ajukan dukungan", exact: true }).click();
  await page.waitForURL("**/sponsor/proposals/new?eventId=demo-event-8");
  await page.getByLabel("Bentuk dukungan", { exact: true }).selectOption("Dana");
  await page.getByLabel("Penawaran", { exact: true }).fill("Kami menawarkan dukungan untuk sesi pengembangan usaha dan materi pembelajaran peserta.");
  await page.getByRole("button", { name: "Kirim proposal", exact: true }).click();
  await page.waitForURL("**/sponsor/progress/proposals?sent=1");
  await page.getByRole("button", { name: "Detail proposal Forum Wirausaha Muda", exact: true }).waitFor();
  await stat("proposal terkirim", 4);
  // Progress remains independent of public-event availability.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    db.events.find(item => item.id === "demo-event-1").status = "CLOSED";
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await go("/sponsor/progress/benefits");
  await page.getByRole("list", { name: "Daftar komitmen", exact: true }).getByRole("heading", { name: "Seminar Kepemimpinan Mahasiswa", exact: true }).waitFor();
  // Another approved sponsor has no access to the first company's records.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    db.sessionAccountId = "demo-sponsor-food";
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Belum ada komitmen.", exact: true }).waitFor();
  await stat("komitmen aktif", 0);
  await go("/sponsor/progress/proposals");
  await page.getByRole("heading", { name: "Belum ada proposal.", exact: true }).waitFor();
  await stat("proposal terkirim", 0);
  await go("/sponsor/progress");
  await page.getByRole("heading", { name: "Belum ada permintaan.", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /^Detail proposal / }).count(), 0);
  await role("user", "/me"); await go("/sponsor/progress"); await page.waitForURL("**/me");
  await role("organizer", "/organizer"); await go("/sponsor/progress"); await page.waitForURL("**/organizer");
  assert.deepEqual(errors, []);
  console.log("PASS sponsor progress: discovery has no operational panels/stats; progress has requests, proposals, benefits and counts; accept refresh, reload, proposal redirect, closed-event history, company isolation/empty states, role guards, 390/320px, no page errors.");
} catch (error) {
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
  throw error;
} finally { await browser.close(); }
