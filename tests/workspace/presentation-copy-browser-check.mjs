import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/presentation");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const forbidden = /simulasi|on progress|in progress|mode demo|data fiktif|data demo|bukan AI sungguhan|dalam pengembangan/i;
async function scan(route) {
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.getByRole("region", { name: "Kontrol aplikasi", exact: true }).waitFor();
  const copy = await page.locator("body").innerText();
  assert.equal(forbidden.test(copy), false, `${route}: ${copy.match(forbidden)?.[0] ?? "clean"}`);
  assert.equal(await page.getByLabel("Ganti peran demo", { exact: true }).count(), 1);
}
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL(`**${destination}`);
}
try {
  for (const route of ["/", "/pricing", "/login", "/register", "/about", "/contact", "/privacy", "/terms", "/guide", "/explore"]) await scan(route);
  await role("organizer", "/organizer");
  for (const route of ["/organizer", "/events/demo-event-4/package", "/events/demo-event-1", "/events/demo-event-1/report", "/events/demo-event-1/sponsors"]) await scan(route);
  await page.getByText("Smart Matching", { exact: true }).waitFor();
  await scan("/events/demo-event-4/package");
  await page.getByRole("heading", { level: 1, name: /^(Pilih paket|Paket Starter|Paket Growth)$/, exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "subscription-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, `subscription-${width}.png`), fullPage: true });
  }
  const records = await page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).eventBilling.orders);
  assert.ok(records.every(order => order.simulated === true), "copy cleanup never turns records into real-money transactions");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await role("sponsor", "/sponsor");
  await scan("/sponsor"); await page.getByText("Smart Matching", { exact: true }).waitFor();
  await scan("/sponsor/progress");
  await role("user", "/me");
  await scan("/me"); await scan("/me/events"); await scan("/committee");
  assert.deepEqual(errors, []);
  console.log("PASS presentation: public and role pages use product copy, role switch retained, internal simulated flags preserved, no runtime errors or mobile overflow.");
} catch (error) {
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }); throw error;
} finally { await browser.close(); }
