// Browser check for committee recruitment and organizer-to-sponsor requests. Requires a build made with
// NEXT_PUBLIC_PARTNERHUB_DEMO=1 (the demo backend runs in the browser).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3112";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/committee-flow");
await mkdir(output, { recursive: true });
const PASSWORD = "DemoPass-2026!";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${label}`);
async function signIn(email) {
  await go("/login");
  await page.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(email.replace(".", "\\.")) }).click();
  await page.waitForFunction((expected) => document.querySelector('input[name="password"]')?.value === expected, PASSWORD, { timeout: 5000 });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
// Keluar and Pengaturan sit behind the profile button. On the organizer rail, hover first so the rail is open.
async function openAccountMenu() {
  const side = page.locator("#organizer-sidebar");
  if (await side.isVisible()) { await side.hover(); await page.waitForFunction(() => document.querySelector("#organizer-sidebar").getBoundingClientRect().width > 200); }
  const trigger = page.getByRole("button", { name: /^Menu akun/ });
  if (!(await trigger.first().isVisible())) await page.getByRole("button", { name: "Buka menu" }).click();
  if (await trigger.first().isVisible()) await trigger.first().click();
}
async function openBell() { await page.getByRole("button", { name: /^Notifikasi/ }).click(); return page.getByRole("region", { name: "Notifikasi terbaru" }); }
async function signOut() {
  await openAccountMenu();
  await page.getByRole("button", { name: "Keluar", exact: true }).first().click();
  await page.waitForURL("**/login?reason=logout");
  await page.waitForLoadState("networkidle");
}

try {
  // 1. User: accepted application shows the organizer's next steps, then applies to a second opening.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Panitia", exact: true }).click();
  await page.waitForURL("**/committee");
  await page.getByRole("heading", { name: "Lowongan panitia", level: 2 }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Kepanitiaan", level: 2 }).count(), 0, "applications live under Acara saya, not here");
  // Own applications are on Acara saya. Cards only summarize; the path and next steps live in the Detail dialog.
  await go("/me/events");
  const mine = page.getByRole("region", { name: "Kepanitiaan" });
  assert.equal(await mine.getByText("Langkah berikutnya", { exact: true }).count(), 0, "next steps are not on the card");
  await mine.getByRole("button", { name: /^Detail Seminar Kepemimpinan Mahasiswa/ }).click();
  const detail = page.getByRole("dialog");
  await detail.getByRole("list", { name: /^Proses seleksi/ }).waitFor();
  for (const step of ["Lamaran masuk", "Daftar pendek", "Wawancara", "Diterima"]) await detail.getByText(step, { exact: true }).first().waitFor();
  assert.equal(await detail.getByText("Selesai").count(), 4, "an accepted application shows every step done");
  await detail.getByText("Langkah berikutnya", { exact: true }).waitFor();
  await detail.getByText(/grup WhatsApp panitia/).first().waitFor();
  await page.screenshot({ path: path.join(output, "user-application-detail.png") });
  await page.keyboard.press("Escape");
  await detail.waitFor({ state: "hidden" });
  await go("/committee");
  await page.getByRole("region", { name: "Lowongan panitia" }).getByRole("button", { name: /^Detail Workshop Desain Poster Acara/ }).click();
  const opening = page.getByRole("dialog");
  await opening.getByRole("list", { name: /^Tahapan seleksi/ }).waitFor();
  await opening.getByRole("button", { name: "Kirim lamaran", exact: true }).click();
  await page.getByText("Pilih minimal satu divisi.").waitFor();
  await page.getByText("Ceritakan motivasimu, minimal 20 karakter.").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.closest("[data-field]")?.getAttribute("data-field")), "divisionIds-demo-o2", "first error field is focused");
  await page.getByRole("checkbox", { name: "Materi" }).check();
  await page.locator("#motivation-demo-o2").fill("Saya ingin membantu menyiapkan materi workshop desain.");
  await page.getByRole("button", { name: "Kirim lamaran", exact: true }).click();
  await page.getByText(/Lamaran untuk Workshop Desain Poster Acara terkirim/).waitFor();
  await page.getByText("Sudah melamar").first().waitFor();
  await go("/me/events");
  await page.getByRole("region", { name: "Kepanitiaan" }).getByRole("button", { name: /^Detail Workshop Desain Poster Acara/ }).click();
  const fresh = page.getByRole("dialog");
  await fresh.getByText("Dalam seleksi", { exact: true }).or(fresh.getByText("Menunggu", { exact: true }).first()).first().waitFor();
  assert.equal(await fresh.getByText("Berjalan", { exact: true }).count(), 1, "a new application sits on the first step");
  await page.keyboard.press("Escape");
  for (const width of [1280, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await noOverflow(`committee ${width}`); await page.screenshot({ path: path.join(output, `user-committee-${width}.png`), fullPage: true }); }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await signOut();

  // 2. Organizer: shortlist, then accepting needs next steps.
  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  await go("/events/demo-event-2");
  await page.getByRole("link", { name: "Kelola panitia", exact: true }).click();
  await page.waitForURL("**/events/demo-event-2/committee");
  await page.getByRole("complementary", { name: "Ruang kerja penyelenggara" }).waitFor();
  // The overview only links to three separate screens; the applicants themselves are not on it.
  assert.equal(await page.getByRole("heading", { name: "Pengguna Demo", level: 3 }).count(), 0, "applicants are not on the overview");
  await page.getByRole("link", { name: /Lihat yang dalam seleksi/ }).waitFor();
  await page.getByRole("link", { name: /Lihat yang diterima/ }).waitFor();
  await page.getByRole("link", { name: /Lihat pelamar/ }).click();
  await page.waitForURL("**/events/demo-event-2/committee/pelamar");
  await page.getByRole("link", { name: "Kembali", exact: true }).waitFor();
  await page.getByRole("heading", { name: "Pengguna Demo", level: 3 }).waitFor();
  await page.getByText("Lihat jawaban").click();
  await page.getByText("Saya ingin membantu menyiapkan materi workshop desain.").waitFor();
  assert.equal(await page.getByRole("button", { name: "Terima", exact: true }).count(), 0, "cannot accept straight from Terkirim");
  await page.getByRole("button", { name: "Pindah ke Daftar pendek", exact: true }).click();
  await page.getByText("Berjalan", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Terima", exact: true }).waitFor();
  await page.getByRole("button", { name: "Terima", exact: true }).click();
  await page.getByText(/langkah berikutnya untuk panitia yang diterima/i).first().waitFor();
  await page.getByLabel("Catatan untuk pelamar").fill("Masuk grup WhatsApp panitia dan hadir rapat perdana hari Sabtu.");
  await page.getByRole("button", { name: "Terima", exact: true }).click();
  await page.getByText(/Catatan terkirim: Masuk grup WhatsApp panitia dan hadir rapat perdana/).waitFor();
  assert.equal(await page.getByRole("button", { name: "Tolak", exact: true }).count(), 0, "decided applications offer no more moves");
  await page.screenshot({ path: path.join(output, "organizer-committee-1280.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 }); await noOverflow("organizer committee 320"); await page.screenshot({ path: path.join(output, "organizer-committee-320.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 1000 });

  // 3. Organizer asks a verified sponsor.
  await go("/events/demo-event-2/sponsors");
  await page.getByRole("button", { name: "Kirim permintaan", exact: true }).click();
  await page.getByText("Pilih sponsor.").waitFor();
  await page.getByLabel("Sponsor", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Bentuk dukungan").selectOption("Produk");
  await page.getByLabel("Pesan untuk sponsor").fill("Kami mengajak Perusahaan Demo menyediakan perangkat lunak untuk peserta.");
  await page.getByRole("button", { name: "Kirim permintaan", exact: true }).click();
  await page.getByText("Permintaan terkirim. Sponsor menerima notifikasi.").waitFor();
  await page.getByText("Menunggu tanggapan").waitFor();
  await page.setViewportSize({ width: 320, height: 900 }); await noOverflow("organizer sponsors 320"); await page.screenshot({ path: path.join(output, "organizer-sponsors-320.png"), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await signOut();

  // 4. Sponsor sees the request, is notified and answers.
  await signIn("demo.sponsor@partnerhub.test");
  await page.waitForURL("**/sponsor");
  await page.getByRole("heading", { name: "Permintaan dari penyelenggara", level: 2 }).waitFor();
  await (await openBell()).getByText(/mengajak Perusahaan Demo mendukung Workshop Desain Poster Acara/).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Detail permintaan Workshop Desain Poster Acara", exact: true }).click();
  await page.getByRole("button", { name: "Terima", exact: true }).first().click();
  await page.getByText("Diterima sponsor").first().waitFor();
  await page.screenshot({ path: path.join(output, "sponsor-1280.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 }); await noOverflow("sponsor 320");
  await page.setViewportSize({ width: 1280, height: 1000 });
  await signOut();

  // 5. Role boundaries and the applicant's notification.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  await go("/events/demo-event-2/committee"); await page.waitForURL("**/me");
  await go("/committee");
  await (await openBell()).getByText(/Lamaranmu diterima\. Catatan penyelenggara: Masuk grup WhatsApp panitia dan hadir rapat perdana/).waitFor();
  await page.keyboard.press("Escape");
  await signOut();
  await signIn("demo.sponsor@partnerhub.test");
  await page.waitForURL("**/sponsor");
  await go("/committee"); await page.waitForURL("**/sponsor");
  assert.deepEqual(errors.filter((text) => !/40[34]|Failed to load resource/.test(text)), []);
  console.log("PASS committee-flow: apply + validation focus, next steps, state machine, accept note, sponsor request/response, notifications, role guards, 320px; no page errors.");
} finally { await browser.close(); }
