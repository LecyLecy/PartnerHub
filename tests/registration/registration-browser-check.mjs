// Browser check for paid events and custom registration forms: organizer sets price and questions, participant fills the
// form (with an image), the event moves to "Acara saya", and the organizer exports registrants to a real .xlsx file.
// Needs a demo build and `exceljs` next to Playwright (test tooling only).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const tools = path.dirname(process.env.PLAYWRIGHT_MODULE || "");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const ExcelJS = require(process.env.EXCELJS_MODULE || path.join(tools, "exceljs"));
const base = process.env.UI_BASE_URL || "http://localhost:3114";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/registration");
const PASSWORD = "DemoPass-2026!";
await mkdir(output, { recursive: true });
const proof = path.join(output, "bukti.png");
await writeFile(proof, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !/favicon|Failed to load resource|40[34]/.test(message.text() + message.location().url)) errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${label}`);
async function signIn(email) {
  await go("/login");
  await page.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(email.replace(".", "\\.")) }).click();
  await page.waitForFunction((expected) => document.querySelector('input[name="password"]')?.value === expected, PASSWORD, { timeout: 5000 });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
async function signOut() {
  await page.waitForLoadState("networkidle");
  const side = page.locator("#organizer-sidebar");
  if (await side.isVisible()) { await side.hover(); await page.waitForFunction(() => document.querySelector("#organizer-sidebar").getBoundingClientRect().width > 200); }
  await page.getByRole("button", { name: /^Menu akun/ }).first().click();
  await page.getByRole("button", { name: "Keluar", exact: true }).first().click();
  await page.waitForURL("**/login?reason=logout");
  await page.waitForLoadState("networkidle");
}

try {
  // 1. Organizer: price and questions for an event that has none yet.
  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  // The dashboard row opens its event on a click outside the title text.
  const row = page.getByRole("row", { name: /Temu Komunitas Relawan/ });
  await row.getByRole("cell").nth(2).click();
  await page.waitForURL("**/events/demo-event-3");
  await page.getByRole("link", { name: "Pendaftaran", exact: true }).click();
  await page.waitForURL("**/events/demo-event-3/registration");
  await page.getByRole("heading", { name: "Pendaftaran peserta.", level: 1 }).waitFor();
  await page.getByRole("link", { name: "Kembali", exact: true }).waitFor();
  await page.getByRole("tab", { name: "Harga dan form" }).click();
  await page.getByText(/belum punya form sendiri/).waitFor();
  await page.getByLabel("Harga (Rp)").fill("25000");
  await page.getByRole("button", { name: "Simpan harga dan form", exact: true }).click();
  await page.getByText("Jelaskan cara membayar, minimal 10 karakter.").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("name")), "paymentNote", "first error is focused");
  await page.getByLabel("Cara membayar").fill("Transfer ke rekening panitia, lalu unggah buktinya.");
  await page.getByRole("button", { name: "Simpan harga dan form", exact: true }).click();
  await page.getByText("Acara berbayar perlu satu pertanyaan Unggah gambar untuk bukti pembayaran.").waitFor();
  await page.getByLabel("Pertanyaan", { exact: true }).first().fill("Nama di kartu peserta");
  await page.getByRole("button", { name: "Tambah pertanyaan", exact: true }).click();
  await page.getByLabel("Pertanyaan", { exact: true }).nth(1).fill("Bukti pembayaran");
  await page.getByLabel("Jenis isian").nth(1).selectOption("image");
  // Questions are optional until the organizer marks them required.
  await page.getByLabel("Wajib diisi").nth(0).check();
  await page.getByLabel("Wajib diisi").nth(1).check();
  await page.getByRole("button", { name: "Simpan harga dan form", exact: true }).click();
  await page.getByText("Harga dan form pendaftaran disimpan.").waitFor();
  await page.screenshot({ path: path.join(output, "organizer-form-editor.png"), fullPage: true });
  await signOut();

  // 2. Participant: the paid event shows its price; the form must be filled; the image is uploaded.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  const catalog = page.getByRole("region", { name: "Acara yang dibuka" });
  assert.equal(await catalog.getByRole("button", { name: /^Detail Seminar Kepemimpinan Mahasiswa/ }).count(), 0, "events the participant joined are not in the catalog");
  await catalog.getByText("Rp25.000").first().waitFor();
  await catalog.getByRole("button", { name: /^Detail Temu Komunitas Relawan/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByText("Transfer ke rekening panitia, lalu unggah buktinya.").waitFor();
  await dialog.getByRole("button", { name: "Daftar acara", exact: true }).click();
  await dialog.getByText("Wajib diisi.").first().waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.closest("[data-field]")?.getAttribute("data-field")?.includes("__")), true, "first error field is focused");
  await dialog.getByLabel("Nama di kartu peserta").fill("Pengguna Demo");
  await dialog.locator('input[type="file"]').setInputFiles(proof);
  await dialog.getByRole("button", { name: "Daftar acara", exact: true }).click();
  await page.getByText(/Pendaftaran berhasil/).waitFor();
  assert.equal(await catalog.getByRole("button", { name: /^Detail Temu Komunitas Relawan/ }).count(), 0, "the joined event leaves the catalog");
  await page.getByRole("link", { name: "Acara saya", exact: true }).first().click();
  await page.waitForURL("**/me/events");
  await page.getByRole("link", { name: "Kembali", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Acara saya", level: 1 }).waitFor();
  const mine = page.getByRole("region", { name: "Tiket" });
  await mine.getByRole("heading", { name: "Temu Komunitas Relawan", level: 3 }).waitFor();
  await mine.getByText("Rp25.000").first().waitFor();
  await page.getByRole("region", { name: "Kepanitiaan" }).waitFor();
  await page.screenshot({ path: path.join(output, "participant-my-events.png"), fullPage: true });
  for (const width of [390, 320]) { await page.setViewportSize({ width, height: 900 }); await go("/me"); await noOverflow(`catalog ${width}`); await go("/me/events"); await noOverflow(`my events ${width}`); }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await signOut();

  // 3. Organizer: registrants with their answers, then a real spreadsheet.
  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  await go("/events/demo-event-3/registration");
  await page.getByText("Pengguna Demo").first().waitFor();
  await page.getByText("Lihat 2 jawaban").click();
  await page.getByText("Nama di kartu peserta").waitFor();
  await page.getByRole("link", { name: "Buka gambar" }).waitFor();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Ekspor Excel" }).click()]);
  assert.match(download.suggestedFilename(), /^peserta-temu-komunitas-relawan\.xlsx$/);
  const saved = path.join(output, download.suggestedFilename());
  await download.saveAs(saved);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(saved);
  const sheet = workbook.getWorksheet("Peserta");
  const header = sheet.getRow(1).values.slice(1);
  assert.deepEqual(header.slice(0, 6), ["No", "Nama", "Referensi tiket", "Status", "Waktu daftar", "QR terkirim"]);
  assert.ok(header.includes("Nama di kartu peserta") && header.includes("Bukti pembayaran"), "each form question is a column");
  const names = sheet.getColumn(2).values.slice(2);
  assert.ok(names.includes("Pengguna Demo"), "the registrant is in the sheet");
  const flat = JSON.stringify(sheet.getSheetValues());
  assert.equal(flat.includes("data:image"), false, "image data is not dumped into the spreadsheet");
  assert.equal(flat.includes("@partnerhub.test"), false, "no email in the export");
  assert.equal(sheet.getRow(1).getCell(1).font?.bold, true, "header cells are bold");

  // 4. Committee applicants export, from one of the three separate screens.
  await go("/events/demo-event-1/committee/diterima");
  await page.getByRole("heading", { name: "Pelamar yang diterima.", level: 1 }).waitFor();
  const [committeeDownload] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Ekspor Excel" }).click()]);
  assert.match(committeeDownload.suggestedFilename(), /^panitia-diterima-seminar-kepemimpinan-mahasiswa\.xlsx$/);
  const committeeFile = path.join(output, committeeDownload.suggestedFilename());
  await committeeDownload.saveAs(committeeFile);
  const committee = new ExcelJS.Workbook();
  await committee.xlsx.readFile(committeeFile);
  assert.equal(committee.getWorksheet("Panitia").getRow(1).getCell(2).value, "Nama");
  assert.ok(committee.getWorksheet("Panitia").rowCount >= 2, "the accepted applicant is exported");
  assert.deepEqual(errors, []);
  console.log("PASS registration: dashboard row click, price and payment note validation, custom form with image upload, event moves to Acara saya, registrants and committee export to .xlsx (read back with exceljs), 390/320px, no page errors.");
} finally { await browser.close(); }