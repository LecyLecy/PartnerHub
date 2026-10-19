import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/qa-followup");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL("**" + destination); await page.waitForLoadState("networkidle");
}
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
const data = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
try {
  await go("/explore/demo-event-2");
  await page.getByRole("link", { name: "Daftar peserta", exact: true }).click();
  await page.waitForURL(/\/login\?next=/);
  assert.equal(new URL(page.url()).searchParams.get("next"), "/me/register/demo-event-2");
  await page.locator('input[name="email"]').fill("demo.user@partnerhub.test");
  await page.locator('input[name="password"]').fill("DemoPass-2026!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/me/register/demo-event-2");
  await page.getByRole("heading", { name: "Pendaftaran peserta", exact: true }).waitFor();
  await page.locator('input[name="demo-event-2__demo-f1"]').fill("QA Komunitas Tiket");
  await page.getByRole("radio", { name: "Pemula", exact: true }).check();
  await page.locator('input[type="file"]').setInputFiles({ name: "bukti-qa.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
  await page.getByRole("checkbox", { name: /Saya setuju menggunakan profil/ }).check();
  await page.getByRole("button", { name: "Daftar acara", exact: true }).click();
  await page.waitForURL("**/me/events");
  await page.reload({ waitUntil: "networkidle" });
  const receipt = page.getByRole("button", { name: "Detail pendaftaran Workshop Desain Poster Acara", exact: true });
  await receipt.click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByText("QA Komunitas Tiket", { exact: true }).waitFor();
  await dialog.getByRole("img", { name: "Bukti pembayaran", exact: true }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: "Konfirmasi", exact: true }).count(), 0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await noOverflow();
    assert.equal(await dialog.evaluate(element => element.scrollWidth > element.clientWidth), false);
    await page.screenshot({ path: path.join(output, `receipt-${width}.png`) });
  }
  await page.keyboard.press("Escape");
  assert.equal(await receipt.evaluate(element => element === document.activeElement), true);
  await go("/me/register/demo-event-2");
  await page.getByText("Kamu sudah mengirim pendaftaran untuk acara ini.", { exact: false }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Daftar acara", exact: true }).count(), 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Add an independent new application fixture in this test context only, not the user's browser data.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    const item = structuredClone(db.applications.find(item => item.ownerId === "demo-user"));
    Object.assign(item, { id: "qa-path", status: "ACCEPTED", stageId: null, visitedStageIds: [db.openings.find(opening => opening.id === item.openingId).stages[0].id] });
    db.applications = db.applications.filter(application => application.id !== item.id);
    db.applications.push(item); sessionStorage.setItem(key, JSON.stringify(db));
  });
  await go("/me/applications");
  await page.getByRole("button", { name: "Detail Seminar Kepemimpinan Mahasiswa", exact: true }).last().click();
  await page.locator("dialog[open]").getByText("Dilewati", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  await role("sponsor", "/sponsor"); await go("/sponsor/progress");
  await page.getByRole("button", { name: /^Detail permintaan / }).first().click();
  const eventLink = page.locator("dialog[open]").getByRole("link", { name: "Lihat detail acara", exact: true });
  const eventHref = await eventLink.getAttribute("href");
  assert.match(eventHref, /^\/explore\//);
  await eventLink.click(); await page.waitForURL("**" + eventHref);
  await page.getByRole("heading", { level: 1 }).waitFor();
  await role("organizer", "/organizer"); await go("/events/demo-event-4/package");
  await page.getByRole("button", { name: "Pilih paket Starter", exact: true }).click();
  assert.equal(await page.getByText(/Starter Satuan ke Growth Satuan/).count(), 0);
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  const verify = page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true });
  await verify.waitFor();
  assert.equal((await data()).eventBilling.coverage["demo-event-4"], undefined);
  await verify.click(); await page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true }).getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  const activated = await data();
  assert.equal(activated.eventBilling.coverage["demo-event-4"].source, "SINGLE");
  assert.equal(activated.eventBilling.orders.filter(item => item.eventId === "demo-event-4" && item.status === "SUCCEEDED").length, 1);
  await go("/events/demo-event-4/team"); await page.getByRole("heading", { level: 1 }).waitFor(); await noOverflow();
  assert.deepEqual(errors, []);
  console.log("PASS QA follow-up: guest registration/login retains event, paid form, private read-only receipt and proof/reload/mobile, duplicate prevention, skipped selection stages, sponsor event link, event-only order copy, independent activation/reload/event managers.");
} catch (error) { await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }); throw error; }
finally { await browser.close(); }
