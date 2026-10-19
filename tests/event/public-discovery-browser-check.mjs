import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3132";
const output = path.resolve(".impeccable/delivery/public-discovery");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
if (process.env.VERCEL_PROTECTION_INPUT === "1") {
  console.log("Awaiting deployment share URL on stdin.");
  const input = createInterface({ input: process.stdin, terminal: false });
  const { url } = JSON.parse(await input.question(""));
  input.close();
  assert.equal(new URL(url).origin, new URL(base).origin);
  await page.goto(url, { waitUntil: "networkidle" });
}
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
try {
  await go("/");
  await page.getByRole("navigation").getByRole("link", { name: "Jelajahi event", exact: true }).click();
  await page.getByRole("list", { name: "Acara publik", exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("main").innerText(), /\bpendaftar\b/i);
  assert.doesNotMatch(await page.getByRole("list", { name: "Acara publik", exact: true }).innerText(), /Gratis/i);
  assert.equal(await page.getByRole("list", { name: "Acara publik", exact: true }).getByText(/Rp[\d.]+/).count(), await page.getByRole("list", { name: "Acara publik", exact: true }).getByRole("listitem").count());
  assert.equal(await page.getByRole("img", { name: /Kapasitas terisi/i }).count(), 0);
  assert.equal(new URL(page.url()).pathname, "/explore");
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).sessionAccountId), null);
  await page.getByLabel("Cari event", { exact: true }).fill("relawan");
  await page.getByRole("button", { name: "Detail Temu Komunitas Relawan", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  assert.doesNotMatch(await dialog.innerText(), /\bpendaftar\b/i);
  assert.equal(await dialog.getByRole("heading", { name: "Sponsor pendukung", exact: true }).count(), 0);
  await dialog.getByRole("link", { name: "Buka halaman event", exact: true }).click();
  await page.waitForURL("**/explore/demo-event-3");
  await page.getByRole("heading", { name: "Temu Komunitas Relawan", exact: true }).waitFor();
  await page.getByText("Rp25.000", { exact: false }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Sponsor pendukung", exact: true }).count(), 0);
  await page.screenshot({ path: path.join(output, "detail-no-sponsors.png"), fullPage: true });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Temu Komunitas Relawan", exact: true }).waitFor();
  await go("/explore/demo-event-1");
  await page.getByRole("heading", { name: "Sponsor pendukung", exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("main").innerText(), /\bpendaftar\b/i);
  assert.equal(await page.getByRole("img", { name: /Kapasitas terisi/i }).count(), 0);
  await page.getByText("Lentera Sagara Teknologi", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "detail-with-sponsors.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `detail overflow ${width}`);
    await page.screenshot({ path: path.join(output, `detail-${width}.png`), fullPage: true });
  }
  await go("/explore/demo-event-4");
  await page.getByRole("heading", { name: "Acara tidak tersedia.", exact: true }).waitFor();
  await go("/explore/missing");
  await page.getByRole("heading", { name: "Acara tidak tersedia.", exact: true }).waitFor();
  // Exercise the schedule boundary with the demo's own stored records, still signed out.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    const now = Date.now();
    const ongoing = db.events.find(item => item.id === "demo-event-3");
    ongoing.startsAt = new Date(now - 3600000).toISOString();
    ongoing.endsAt = new Date(now + 3600000).toISOString();
    const ended = db.events.find(item => item.id === "demo-event-2");
    ended.startsAt = new Date(now - 7200000).toISOString();
    ended.endsAt = new Date(now - 3600000).toISOString();
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  await go("/explore");
  await page.getByRole("list", { name: "Acara publik", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Detail Workshop Desain Poster Acara", exact: true }).count(), 0);
  await page.getByLabel("Waktu acara", { exact: true }).selectOption("ongoing");
  await page.getByRole("button", { name: "Detail Temu Komunitas Relawan", exact: true }).waitFor();
  assert.equal(await page.getByRole("list", { name: "Acara publik", exact: true }).getByRole("listitem").count(), 1);
  await page.getByLabel("Cari event", { exact: true }).fill("tidak-ada-hasil");
  await page.getByRole("heading", { name: "Belum ada acara yang cocok.", exact: true }).waitFor();
  await page.getByLabel("Cari event", { exact: true }).fill("");
  await page.getByLabel("Waktu acara", { exact: true }).selectOption("all");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(output, "catalog-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `catalog overflow ${width}`);
    await page.screenshot({ path: path.join(output, `catalog-${width}.png`), fullPage: true });
  }
  await go("/explore/demo-event-3");
  await page.getByRole("link", { name: "Ajukan sponsorship", exact: true }).click();
  await page.waitForURL(/\/login\?next=/);
  assert.match(decodeURIComponent(new URL(page.url()).searchParams.get("next")), /\/sponsor\/proposals\/new\?eventId=demo-event-3/);
  assert.deepEqual(errors, []);
  console.log("PASS public discovery: guest landing/catalog/deep link, sponsors present/absent, draft/unknown, search/empty, ongoing/ended, mobile 390/320, proposal requires login; no runtime errors.");
} finally { await browser.close(); }
