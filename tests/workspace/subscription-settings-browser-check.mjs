import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = ".impeccable/subscription-settings";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function role(value) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL("**" + ({ organizer: "/organizer", sponsor: "/sponsor", user: "/me" })[value]);
  await page.waitForLoadState("networkidle");
}
async function settings() {
  if (await page.getByRole("button", { name: "Buka menu", exact: true }).isVisible()) await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await page.getByRole("button", { name: /^Menu akun/ }).click();
  assert.equal(await page.getByRole("link", { name: "Profil", exact: true }).count(), 0);
  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "Pengaturan akun", exact: true }).waitFor();
}
async function cards() {
  const list = page.getByRole("list", { name: "Pilihan subscription", exact: true });
  assert.equal(await list.getByRole("listitem").count(), 3);
  assert.deepEqual(await list.getByRole("heading", { level: 2 }).allTextContents(), ["Paket Starter", "Paket Growth", "Custom"]);
  assert.equal(await list.getByRole("link", { name: "Kontak PartnerHub", exact: true }).getAttribute("href"), "/contact");
  assert.equal(await page.locator("main details").count(), 0);
  assert.equal(await page.locator('main a[href="/organizer/transactions"]').count(), 0);
  assert.equal(await page.getByText("Fitur paket & biaya tambahan", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("region", { name: "Transaksi paket", exact: true }).count(), 0);
  assert.equal(await page.locator('#workspace-sidebar a[href="/organizer/transactions"]').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
try {
  await mkdir(output, { recursive: true }); await go("/guide"); await role("organizer");
  const before = await stored();
  await go("/organizer/subscription");
  for (const width of [1440, 1100, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await cards();
    await page.screenshot({ path: `${output}/cards-${width}.png`, fullPage: true });
  }
  await page.getByRole("link", { name: "Kontak PartnerHub", exact: true }).click();
  await page.waitForURL("**/contact"); await page.getByRole("heading", { name: "Kontak", exact: true }).waitFor();
  await go("/organizer/subscription");
  const choose = page.getByRole("button", { name: "Pilih subscription Starter", exact: true });
  await choose.click();
  const checkout = page.getByRole("dialog", { name: "Periksa subscription", exact: true });
  await checkout.waitFor();
  assert.equal(await checkout.getByRole("button", { name: "Tutup", exact: true }).evaluate(element => element === document.activeElement), true);
  await page.keyboard.press("Shift+Tab");
  assert.equal(await checkout.getByRole("button", { name: "Buat pesanan subscription", exact: true }).evaluate(element => element === document.activeElement), true);
  await page.screenshot({ path: `${output}/checkout-320.png` });
  await page.keyboard.press("Escape"); await checkout.waitFor({ state: "hidden" });
  assert.equal(await choose.evaluate(element => element === document.activeElement), true);
  assert.equal((await stored()).accountBilling, undefined, "opening/cancelling checkout never creates an order");
  await choose.click(); await checkout.getByRole("button", { name: "Buat pesanan subscription", exact: true }).click();
  await checkout.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).waitFor();
  await page.keyboard.press("Escape"); await cards();
  await page.reload({ waitUntil: "networkidle" }); await cards();
  await choose.click();
  assert.equal(await checkout.getByRole("button", { name: "Buat pesanan subscription", exact: true }).count(), 0, "pending order resumes after reload");
  await checkout.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true });
  await confirmation.getByText(/Paket Starter sebesar Rp699.000/).waitFor();
  await confirmation.getByRole("button", { name: "Batal", exact: true }).click();
  assert.equal((await stored()).accountBilling.orders[0].status, "PENDING");
  await checkout.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await confirmation.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByText("Aktif", { exact: true }).waitFor(); await cards();
  await page.reload({ waitUntil: "networkidle" }); await cards();
  assert.equal((await stored()).accountBilling.orders.length, 1);
  await settings();
  assert.equal(await page.locator('#workspace-sidebar a[href="/organizer/transactions"]').count(), 0);
  await page.getByRole("link", { name: "Riwayat transaksi", exact: true }).click();
  await page.waitForURL("**/organizer/transactions");
  await page.getByText("Rp699.000", { exact: false }).waitFor();
  assert.equal(await page.locator('header [data-header-back] a').getAttribute("href"), "/settings");
  await page.locator('header [data-header-back] a').click(); await page.waitForURL("**/settings");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${output}/settings-${width}.png`, fullPage: true });
  }
  for (const value of ["sponsor", "user"]) {
    await role(value); await settings();
    assert.equal(await page.getByRole("link", { name: "Riwayat transaksi", exact: true }).count(), 0);
  }
  const after = await stored();
  for (const key of ["events", "registrations", "applications", "proposals", "sponsorships"]) assert.deepEqual(after[key], before[key]);
  assert.deepEqual(errors, []);
  console.log("PASS three subscription cards, Custom contact, no extra sections/history/sidebar item, checkout cancel/focus/resume/confirm, active state, settings-only history and all-role menu labels; 1440/1100/390/320px.");
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true }); throw error;
} finally { await browser.close(); }
