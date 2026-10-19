import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/event-packages");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL("**" + destination); await page.waitForLoadState("networkidle");
}
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
try {
  await go("/pricing");
  await page.getByText("Rp149.000", { exact: true }).waitFor();
  await page.getByText("Rp499.000", { exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("main").innerText(), /workspace/i);
  await page.getByRole("button", { name: "Subscription tahunan", exact: true }).click();
  await page.getByText("Rp699.000", { exact: true }).waitFor();
  await page.getByText("Rp1.499.000", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Per event", exact: true }).click();
  await role("organizer", "/organizer");
  // The isolated test browser gets a fixture resembling an older QA tab. No live Chrome storage is touched.
  await page.evaluate(() => {
    const key = "partnerhub:demo:v3", db = JSON.parse(sessionStorage.getItem(key));
    const now = new Date().toISOString();
    db.billing = { organizations: [{ id: "old-qa-org", name: "QA Organisation", ownerId: "demo-organizer", memberIds: ["demo-organizer"] }], selected: { "demo-organizer": "old-qa-org" }, eventOrganizations: {}, managers: {}, coverage: {}, subscriptions: [{ id: "old-sub", organizationId: "old-qa-org", tier: "GROWTH", startsAt: now, endsAt: "2099-01-01T00:00:00.000Z", orderId: "old-order", simulated: true }], orders: [{ id: "old-order", organizationId: "old-qa-org", eventId: null, tier: "GROWTH", cycle: "ANNUAL", amountIdr: 1499000, upgrade: false, status: "SUCCEEDED", createdAt: now, expiresAt: now, verifiedAt: now, simulated: true }] };
    db.billing.coverage["demo-event-1"] = { organizationId: "old-qa-org", tier: "GROWTH", source: "ANNUAL", orderId: "old-order", subscriptionId: "old-sub" };
    delete db.eventBilling;
    sessionStorage.setItem(key, JSON.stringify(db));
  });
  const before = await stored();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Event kamu", exact: true }).waitFor();
  const migrated = await stored();
  assert.deepEqual(migrated.billing, before.billing, "legacy archive unchanged");
  for (const field of ["events", "registrations", "applications", "forms", "offers", "proposals", "sponsorships"]) assert.deepEqual(migrated[field], before[field], field + " preserved");
  assert.equal(migrated.eventBilling.coverage["demo-event-1"].source, "LEGACY");
  assert.equal(migrated.eventBilling.coverage["demo-event-4"], undefined);
  const sidebar = page.locator("#workspace-sidebar");
  for (const name of ["Tim", "Ringkasan event", "Paket & transaksi"]) assert.equal(await sidebar.getByRole("link", { name, exact: true }).count(), 0);
  await go("/organizer/transactions");
  assert.equal(await page.locator("main details").count(), 0, "History is visible without an archive disclosure");
  await page.getByText("Rp1.499.000", { exact: false }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).count(), 0);
  await go("/events/demo-event-4");
  assert.equal(await page.getByRole("button", { name: "Unggah acara", exact: true }).isDisabled(), true);
  await go("/events/demo-event-4/package");
  await page.getByRole("button", { name: "Pilih paket Starter", exact: true }).click();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  const verify = page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true });
  await verify.waitFor();
  assert.equal((await stored()).eventBilling.coverage["demo-event-4"], undefined);
  await page.reload({ waitUntil: "networkidle" }); await verify.waitFor();
  await verify.click(); await page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true }).getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  assert.equal((await stored()).eventBilling.coverage["demo-event-4"].tier, "STARTER");
  assert.equal((await stored()).eventBilling.orders.length, 1);
  await page.getByRole("button", { name: "Pilih paket Growth", exact: true }).click();
  await page.getByText(/Rp350.000 untuk satu acara/).waitFor();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await page.getByText(/Rp350.000/).first().waitFor(); await verify.waitFor();
  await verify.click(); await page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true }).getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).eventBilling.coverage["demo-event-4"]?.tier === "GROWTH");
  await page.getByText(/^Paket acara sudah aktif\./).waitFor();
  assert.equal((await stored()).eventBilling.coverage["demo-event-4"].tier, "GROWTH");
  assert.deepEqual((await stored()).registrations, before.registrations);
  await go("/organizer/transactions");
  const records = page.locator('section[aria-label="Transaksi paket"] li');
  assert.equal(await records.count(), 3, "Current orders and historical order share one list");
  assert.equal(await page.locator('section[aria-label="Transaksi paket"] ul').count(), 1);
  const timestamps = await records.locator("time").evaluateAll(elements => elements.map(element => Date.parse(element.dateTime)));
  assert.deepEqual(timestamps, [...timestamps].sort((a, b) => b - a), "Newest first across both sources");
  await page.getByText("Rp1.499.000", { exact: false }).waitFor();
  assert.equal(await page.locator("main details").count(), 0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/pricing", "/events/demo-event-4/package", "/events/demo-event-4/team", "/organizer/transactions"]) {
      await go(route); await page.getByRole("heading", { level: 1 }).waitFor(); await noOverflow();
    }
    await page.screenshot({ path: path.join(output, "transactions-" + width + ".png"), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/events/demo-event-4/team");
  await page.getByText(/Atur pengelola event/).click();
  const state = await stored();
  const other = state.accounts.find(account => account.id === "demo-other-organizer");
  await page.getByLabel("Tambah lewat email penyelenggara terdaftar", { exact: true }).fill(other.email);
  await page.getByRole("button", { name: "Simpan pengelola", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).eventBilling.managers["demo-event-4"].includes("demo-other-organizer"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText(/Atur pengelola event/).click();
  await page.getByRole("checkbox", { name: other.fullName, exact: true }).uncheck();
  await page.getByRole("button", { name: "Simpan pengelola", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).eventBilling.managers["demo-event-4"].length === 1);
  for (const route of ["/organizer/team", "/organizer/overview"]) { await go(route); await page.waitForURL("**/organizer"); }
  await go("/organizer/subscription?event=demo-event-4"); await page.waitForURL("**/events/demo-event-4/package");
  await role("user", "/me"); await go("/events/demo-event-4/package"); await page.waitForURL("**/me");
  await role("sponsor", "/sponsor"); await go("/organizer/transactions"); await page.waitForURL("**/sponsor");
  assert.deepEqual(errors, []);
  console.log("PASS billing: single/annual price alternatives, removed workspace UI, lossless legacy history, event-scoped pending/verification, reload, upgrade price, managers, role guards, legacy event links, desktop/390/320px, no runtime errors.");
} catch (error) { await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }); throw error; }
finally { await browser.close(); }
