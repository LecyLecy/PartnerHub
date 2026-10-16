import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3130";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/delivery");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
if (process.env.VERCEL_PROTECTION_INPUT === "1") {
  console.log("Awaiting deployment share URL on stdin.");
  const access = await new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => {
      input += chunk;
      if (input.includes("\n")) { process.stdin.pause(); try { resolve(JSON.parse(input.split("\n")[0])); } catch (error) { reject(error); } }
    });
  });
  assert.equal(new URL(access.url).origin, new URL(base).origin, "Share URL must match the tested deployment");
  await page.goto(access.url, { waitUntil: "networkidle" });
}
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL(`**${destination}`);
  await page.waitForLoadState("networkidle");
}
const date = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
async function assertRegistrationPersisted(eventId, stage) {
  const registrations = await page.evaluate(id => {
    const data = JSON.parse(sessionStorage.getItem("partnerhub:demo:v3") || "{}");
    return (data.registrations || []).filter(item => item.eventId === id).map(item => item.status);
  }, eventId);
  assert.deepEqual(registrations, ["REGISTERED"], `Registration persists ${stage}`);
}
try {
  await go("/guide");
  await role("organizer", "/organizer");
  await page.getByRole("link", { name: "Susun event baru", exact: true }).click();
  await page.locator('input[name="title"]').fill("Creative Community Workshop");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.locator('input[name="date"]').fill(date(14));
  await page.locator('input[name="startTime"]').fill("09:00");
  await page.locator('input[name="endTime"]').fill("12:00");
  await page.locator('input[name="venue"]').fill("Aula Komunitas Demo");
  await page.locator('input[name="capacity"]').fill("50");
  await page.getByLabel("Registrasi dibuka", { exact: true }).fill(`${date(-1)}T09:00`);
  await page.getByLabel("Registrasi ditutup", { exact: true }).fill(`${date(13)}T09:00`);
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.locator('input[name="organizationName"]').fill("Komunitas Kreatif Demo");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.getByRole("button", { name: "Simpan draft ke server", exact: true }).click();
  await page.waitForURL(/\/events\/[^/]+\?saved=1/);
  const eventId = new URL(page.url()).pathname.split("/")[2];
  await page.getByRole("button", { name: "Publikasikan acara", exact: true }).click();
  await page.getByRole("button", { name: "Tutup acara", exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "published-event.png"), fullPage: true });
  await role("user", "/me");
  await page.getByRole("button", { name: "Detail Creative Community Workshop", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("checkbox", { name: /Saya setuju menggunakan profil/ }).check();
  await dialog.getByRole("button", { name: "Daftar acara", exact: true }).click();
  await page.waitForTimeout(800);
  await go("/me/events");
  await page.getByText("Creative Community Workshop", { exact: true }).first().waitFor();
  await role("organizer", "/organizer");
  await go(`/events/${eventId}/registration`);
  await page.getByText("Pengguna Demo", { exact: true }).first().waitFor();
  await go(`/events/${eventId}/qr`);
  const qrButton = page.getByRole("button").filter({ hasText: /Buat.*QR|Kirim.*QR|Buat dan kirim/i });
  await qrButton.first().click();
  await page.waitForTimeout(600);
  await go(`/events/${eventId}/report`);
  await page.getByRole("heading", { name: "Laporan & bukti sponsor" }).waitFor();
  await page.screenshot({ path: path.join(output, "event-report-desktop.png"), fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `report overflow ${width}`);
    await page.screenshot({ path: path.join(output, `event-report-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go(`/events/${eventId}/scan`);
  await page.getByLabel("Mode presensi", { exact: true }).selectOption("ENTRY_EXIT");
  await page.getByLabel("Jenis scan", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Jenis scan", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Mode presensi", { exact: true }).inputValue(), "ENTRY_EXIT");
  await assertRegistrationPersisted(eventId, "after attendance reload");
  await role("sponsor", "/sponsor");
  await go(`/sponsor/proposals/new?eventId=${eventId}`);
  await page.locator('[name="category"]').selectOption({ index: 1 });
  await page.locator('[name="offer"]').fill("Perusahaan demo menawarkan dukungan publikasi workshop melalui kanal komunitas.");
  await page.getByRole("button", { name: "Kirim proposal", exact: true }).click();
  await page.waitForURL(/\/sponsor(?:\?sent=1)?$/);
  await role("organizer", "/organizer");
  await go("/organizer/sponsorship");
  await page.getByRole("button", { name: /Proposal .*Creative Community Workshop/ }).click();
  await page.getByRole("button", { name: "Terima proposal", exact: true }).click();
  await page.waitForTimeout(600);
  await go(`/events/${eventId}/report`);
  await assertRegistrationPersisted(eventId, "after sponsorship decision");
  await page.locator('input[name="label"]').fill("Logo sponsor di poster acara demo");
  await page.getByRole("button", { name: "Tambahkan benefit", exact: true }).click();
  await page.getByRole("heading", { name: /Logo sponsor di poster acara demo/ }).waitFor();
  await page.getByLabel("Tautan bukti", { exact: true }).fill("https://example.com/demo-poster");
  await page.getByRole("checkbox", { name: /Saya sudah meninjau bukti/ }).check();
  await page.getByRole("button", { name: "Simpan bukti", exact: true }).click();
  await page.getByText("Terverifikasi", { exact: true }).waitFor();
  const participantStat = page.getByRole("list", { name: "Ringkasan", exact: true }).getByRole("listitem").filter({ hasText: "peserta terdaftar" });
  await participantStat.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const list = document.querySelector('ul[aria-label="Ringkasan"]');
    return list?.querySelector('strong [aria-hidden="true"]')?.textContent?.trim() === "1";
  });
  await page.screenshot({ path: path.join(output, "sponsor-evidence.png"), fullPage: true });
  await role("sponsor", "/sponsor");
  await page.getByText("Logo sponsor di poster acara demo:", { exact: false }).waitFor();
  await go("/guide");
  await page.getByRole("heading", { name: "Satu acara, dari ide sampai laporan." }).waitFor();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ status: "PASS", eventId, flow: "create, publish, consent, register, organizer sees participant, issue QR, report, persist attendance mode, sponsor proposal, organizer decision, benefit and evidence visible to sponsor", mobile: [390, 320], runtimeErrors: errors }));
} catch (error) {
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
  console.error(error); process.exitCode = 1;
} finally { await browser.close(); }
