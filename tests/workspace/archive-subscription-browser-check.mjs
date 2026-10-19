import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = ".impeccable/archive-subscription";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
async function role(value) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL("**" + ({ organizer: "/organizer", sponsor: "/sponsor", user: "/me" })[value]);
  await page.waitForLoadState("networkidle");
}
async function shot(name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + " overflow");
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
}
async function create(title, capacity) {
  const before = await stored();
  await go("/events/new");
  await page.locator('input[name="title"]').fill(title);
  await page.getByRole("checkbox", { name: "Pendidikan", exact: true }).check();
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  for (const [name, value] of Object.entries({ date: day(30), startTime: "09:00", endTime: "12:00", venue: "Auditorium Komunitas", capacity: String(capacity) })) await page.locator(`input[name="${name}"]`).fill(value);
  await page.getByLabel("Registrasi dibuka", { exact: true }).fill(day(-1) + "T09:00");
  await page.getByLabel("Registrasi ditutup", { exact: true }).fill(day(29) + "T09:00");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.locator('input[name="organizationName"]').fill("Kolektif Kreasi Bersama");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.getByRole("checkbox", { name: /Rekrutmen panitia/ }).check();
  await page.getByRole("button", { name: "Selesai susunan", exact: true }).click();
  await page.waitForURL(/\/organizer\/archive\?created=/);
  const id = new URL(page.url()).searchParams.get("created");
  await page.getByRole("heading", { name: "Arsip acara", exact: true }).waitFor();
  await page.getByRole("link", { name: title, exact: true }).waitFor();
  const after = await stored();
  assert.equal(after.events.find(item => item.id === id).status, "DRAFT");
  assert.equal(after.eventBilling.orders.length, before.eventBilling.orders.length, "finishing setup creates no per-event order");
  await go("/organizer");
  assert.equal(await page.getByRole("link", { name: title, exact: true }).count(), 0);
  return id;
}
try {
  await mkdir(output, { recursive: true });
  await go("/guide"); await role("organizer");
  const initial = await stored();
  const unpaid = await create("Acara Bayar Per Event", 100);
  await go(`/events/${unpaid}`);
  await page.getByRole("link", { name: "Bayar & unggah", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Unggah acara", exact: true }).count(), 0);
  await page.getByRole("link", { name: "Bayar & unggah", exact: true }).click();
  await page.waitForURL(`**/events/${unpaid}/package`);
  await page.getByRole("button", { name: "Pilih paket Starter", exact: true }).click();
  await page.getByRole("button", { name: "Buat pesanan", exact: true }).click();
  await page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true }).getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByRole("link", { name: "Lanjut unggah acara", exact: true }).click();
  await page.getByRole("button", { name: "Unggah acara", exact: true }).click();
  await page.getByText("Terpublikasi", { exact: true }).waitFor();
  await go("/organizer/subscription");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole("list", { name: "Pilihan subscription", exact: true }).waitFor();
    await shot("subscription-" + width);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Pilih subscription Growth", exact: true }).click();
  await page.getByRole("button", { name: "Buat pesanan subscription", exact: true }).click();
  await page.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Konfirmasi pembayaran?", exact: true });
  await confirmation.getByText(/Rp1.499.000.*subscription satu tahun/).waitFor();
  await confirmation.getByRole("button", { name: "Konfirmasi pembayaran", exact: true }).click();
  await page.getByText("Aktif", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Aktif", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Pilih subscription/ }).count(), 1, "only the unavailable tier keeps a disabled action");
  assert.equal(await page.getByRole("button", { name: /Pilih subscription/ }).isDisabled(), true, "active subscription does not offer another charge");
  const id = await create("Acara Subscription Growth", 400);
  await role("sponsor");
  await go(`/explore/${id}`);
  await page.getByRole("heading", { name: "Acara tidak tersedia.", exact: true }).waitFor();
  await role("organizer");
  await go(`/events/${id}`);
  await page.getByRole("heading", { name: "Paket Growth", exact: true }).waitFor();
  await page.getByText("Tercakup subscription. Unggah acara tanpa pembayaran tambahan.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Bayar & unggah", exact: true }).count(), 0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await shot("covered-summary-" + width);
    await go("/organizer/archive"); await shot("archive-" + width);
    await go(`/events/${id}`);
  }
  await page.getByRole("button", { name: "Unggah acara", exact: true }).click();
  await page.getByText("Terpublikasi", { exact: true }).waitFor();
  await go("/organizer/archive");
  assert.equal(await page.getByRole("link", { name: "Acara Subscription Growth", exact: true }).count(), 0);
  await go("/organizer");
  await page.getByRole("link", { name: "Acara Subscription Growth", exact: true }).waitFor();
  const after = await stored();
  assert.equal(after.eventBilling.orders.length, 1);
  assert.equal(after.accountBilling.orders.length, 1);
  assert.equal(after.eventBilling.coverage[id].source, "SUBSCRIPTION");
  assert.deepEqual(after.registrations, initial.registrations);
  await role("sponsor"); await go(`/explore/${id}`);
  await page.getByRole("heading", { name: "Acara Subscription Growth", exact: true }).waitFor();
  await page.getByRole("link", { name: "Ajukan sponsorship", exact: true }).click();
  await page.locator('[name="category"]').selectOption({ index: 1 });
  await page.locator('[name="offer"]').fill("Dukungan publikasi untuk acara komunitas dan program pelatihannya.");
  await page.getByRole("button", { name: "Kirim proposal", exact: true }).click();
  await page.waitForURL(/\/sponsor\/progress\/proposals/);
  await role("user"); await go(`/explore/${id}`);
  await page.getByRole("link", { name: "Daftar peserta", exact: true }).waitFor();
  await page.getByRole("link", { name: "Daftar peserta", exact: true }).click();
  await page.waitForURL(`**/me/register/${id}`);
  await page.getByRole("heading", { name: "Pendaftaran peserta", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log("PASS archive/subscription: complete setup, private archive, per-event purchase, annual confirmation/reload, Growth-covered upload without second charge, published catalog, sponsor proposal, participant form, preserved data, 1440/390/320px.");
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  throw error;
} finally { await browser.close(); }
