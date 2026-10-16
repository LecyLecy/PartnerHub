// Browser check for role registration, role guards and demo isolation. Requires a build made with
// NEXT_PUBLIC_PARTNERHUB_DEMO=1 (the demo backend runs in the browser, no server API exists).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3112";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/role-flow");
await mkdir(output, { recursive: true });
const PASSWORD = "DemoPass-2026!";
const STRONG = "Strong-Pass-93!x";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${label}`);
const field = (name) => page.locator(`input[name="${name}"]:not([type="file"]), textarea[name="${name}"], select[name="${name}"]`);
const next = (label = "Lanjutkan") => page.getByRole("button", { name: label, exact: true }).click();
// Focus moves in requestAnimationFrame after a failed submit, so poll briefly instead of reading it once.
const focusedName = async () => {
  await page.waitForFunction(() => { const el = document.activeElement; return Boolean(el && el.tagName !== "BUTTON" && (el.getAttribute("name") || el.id)); }, null, { timeout: 3000 }).catch(() => {});
  return page.evaluate(() => document.activeElement?.getAttribute("name") ?? document.activeElement?.id ?? "");
};
async function signIn(email) {
  await go("/login");
  await page.getByRole("region", { name: "Pilih akun demo" }).waitFor();
  await page.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  if (email === "demo.menunggu@partnerhub.test") {
    await field("email").fill(email);
    await field("password").fill(PASSWORD);
  } else {
    await page.getByRole("button", { name: new RegExp(email.replace(".", "\\.")) }).click();
  }
  // The form remounts with the picked credential, so wait for it instead of reading the value once.
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
  // Logout reloads the page; wait for it to settle so the next navigation does not collide with it.
  await page.waitForLoadState("networkidle");
}

try {
  await go("/login");
  const demoPicker = page.getByRole("region", { name: "Pilih akun demo" });
  await demoPicker.waitFor();
  assert.equal(await demoPicker.getByRole("button", { name: /Pilih akun .+:/ }).count(), 0);
  await demoPicker.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  assert.equal(await demoPicker.getByRole("button", { name: /Pilih akun .+:/ }).count(), 3);
  for (const name of ["Peserta", "Penyelenggara", "Sponsor"]) await demoPicker.getByRole("button", { name: new RegExp(`Pilih akun ${name}:`) }).waitFor();
  assert.equal(await demoPicker.getByRole("button", { name: /demo\.menunggu/ }).count(), 0);
  // 1. Role picker: three clear cards, sign-in link, demo banner.
  await go("/register");
  await page.getByRole("heading", { name: "Daftar sebagai siapa?" }).waitFor();
  for (const title of ["Peserta", "Penyelenggara", "Perusahaan sponsor"]) await page.getByRole("heading", { name: title, level: 2 }).waitFor();
  await page.getByRole("link", { name: "Sudah punya akun? Masuk" }).waitFor();
  await page.getByRole("region", { name: "Mode demo" }).waitFor();
  for (const width of [1280, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await noOverflow(`picker ${width}`); await page.screenshot({ path: path.join(output, `picker-${width}.png`), fullPage: true }); }
  await page.setViewportSize({ width: 1280, height: 1000 });

  // 2. Organizer path: empty submit focuses first error, data survives Back, role switch keeps shared fields.
  await page.getByRole("button", { name: /^Penyelenggara/ }).click();
  await page.getByText("Langkah 1 dari 4: Akun").waitFor();
  await next();
  await page.getByText("Isi nama lengkap.").waitFor();
  assert.equal(await focusedName(), "fullName");
  await field("fullName").fill("Budi Uji");
  await field("email").fill("budi@contoh.id");
  await field("phone").fill("12345");
  await field("password").fill("short");
  await field("confirm").fill("lain");
  await next();
  await page.getByText(/Gunakan nomor Indonesia/).waitFor();
  await page.getByText("Gunakan minimal 12 karakter.").waitFor();
  await page.getByText("Konfirmasi password belum cocok.").waitFor();
  assert.equal(await focusedName(), "phone");
  await field("phone").fill("0812 3456 7890");
  await field("password").fill(STRONG);
  await field("confirm").fill(STRONG);
  await page.getByText(/Kekuatan password: (Baik|Kuat)/).waitFor();
  await page.getByRole("button", { name: /Lihat/ }).first().click();
  assert.equal(await field("password").getAttribute("type"), "text");
  await next();
  await page.getByText("Langkah 2 dari 4: Profil").waitFor();
  await next();
  await page.getByText("Pilih jenis penyelenggara.").waitFor();
  await page.getByRole("radio", { name: /Komunitas/ }).check();
  await next();
  await page.getByText("Isi nama organisasi, komunitas, atau institusi.").waitFor();
  await field("organizationName").fill("Komunitas Uji");
  await field("description").fill("Komunitas uji yang menyelenggarakan diskusi bulanan.");
  await field("city").fill("Kota Uji");
  await field("address").fill("Jl. Uji No. 1");
  await field("position").fill("Ketua");
  await field("website").fill("bukan tautan");
  await next();
  await page.getByText(/Tulis tautan lengkap/).waitFor();
  await field("website").fill("https://komunitas-uji.id");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  assert.equal(await field("fullName").inputValue(), "Budi Uji");
  assert.equal(await field("email").inputValue(), "budi@contoh.id");
  await next();
  assert.equal(await field("organizationName").inputValue(), "Komunitas Uji");
  assert.equal(await field("website").inputValue(), "https://komunitas-uji.id");

  // 3. Refresh mid-way: non-sensitive data restored, password is not.
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("Langkah 2 dari 4: Profil").waitFor();
  assert.equal(await field("organizationName").inputValue(), "Komunitas Uji");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  assert.equal(await field("fullName").inputValue(), "Budi Uji");
  assert.equal(await field("password").inputValue(), "", "password must not survive a refresh");
  await field("password").fill(STRONG); await field("confirm").fill(STRONG);
  await next();

  // 4. Switch role to sponsor: shared fields stay, role-only fields clear, notice is shown.
  await page.getByRole("group", { name: "Peran akun" }).getByRole("button", { name: "Perusahaan sponsor" }).click();
  await page.getByText("Peran diperbarui. Periksa detail sebelum melanjutkan.").waitFor();
  await page.getByText("Langkah 1 dari 4: Akun").waitFor();
  assert.equal(await field("fullName").inputValue(), "Budi Uji");
  assert.equal(await field("email").inputValue(), "budi@contoh.id");
  assert.equal(await field("phone").inputValue(), "0812 3456 7890");
  await field("password").fill(STRONG); await field("confirm").fill(STRONG);
  assert.equal(await field("position").inputValue(), "Ketua", "position is a shared field and survives the role switch");
  await field("position").fill("");
  await next();
  await page.getByText("Isi jabatan penanggung jawab.").waitFor();
  assert.equal(await focusedName(), "position");
  await field("position").fill("Manajer");
  await field("email").fill("budi@gmail.com");
  await page.getByText(/email kerja dengan domain perusahaan/i).first().waitFor();
  await next();
  assert.equal(await focusedName(), "email");
  await field("email").fill("budi@perusahaan-uji.co.id");
  await next();
  await page.getByText("Langkah 2 dari 4: Perusahaan").waitFor();
  await next();
  await page.getByText("Isi nama perusahaan atau brand.").waitFor();
  assert.equal(await field("city").inputValue(), "Kota Uji", "shared city survives the role switch");
  assert.equal(await field("website").inputValue(), "https://komunitas-uji.id");

  // 5. File validation: oversized, wrong real type, valid logo with preview, replace and remove.
  const png = Buffer.from(await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 24; c.height = 24; const g = c.getContext("2d"); g.fillStyle = "#162748"; g.fillRect(0, 0, 24, 24); return c.toDataURL("image/png").split(",")[1]; }), "base64");
  const logo = page.locator('input[type="file"][name="logo"]');
  await logo.setInputFiles({ name: "besar.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await page.getByText(/Ukuran file maksimal 2 MB/).waitFor();
  await logo.setInputFiles({ name: "palsu.png", mimeType: "image/png", buffer: Buffer.from("%PDF-1.4 bukan gambar") });
  await page.getByText(/Gunakan PNG, JPG, atau WebP/).waitFor();
  await logo.setInputFiles({ name: "logo-uji.png", mimeType: "image/png", buffer: png });
  await page.getByText("logo-uji.png").waitFor();
  await page.getByRole("img", { name: /Pratinjau Logo perusahaan/ }).waitFor();
  await page.getByRole("button", { name: "Ganti file" }).click({ trial: true });
  await page.getByRole("button", { name: "Hapus file" }).click();
  await page.getByText("Belum ada file").waitFor();
  await logo.setInputFiles({ name: "logo-uji.png", mimeType: "image/png", buffer: png });
  await page.getByText("logo-uji.png").waitFor();
  await page.screenshot({ path: path.join(output, "sponsor-company.png"), fullPage: true });

  // 6. Finish sponsor path up to the document step and confirm step.
  await field("companyName").fill("PT Uji Sejahtera");
  await field("industry").selectOption("Teknologi");
  await field("legalNumber").fill("123");
  await field("address").fill("Jl. Perusahaan No. 2");
  await field("website").fill("https://perusahaan-uji.co.id");
  await next();
  await page.getByText("NIB terdiri dari 13 digit angka.").waitFor();
  await page.getByText("Pilih minimal satu kategori sponsorship.").waitFor();
  await field("legalNumber").fill("1234 5678 9012 3");
  await page.getByRole("checkbox", { name: "Dana" }).check();
  await next();
  await page.getByText("Langkah 3 dari 4: Dokumen").waitFor();
  await next();
  await page.getByText("Unggah dokumen legalitas perusahaan.").waitFor();
  const doc = page.locator('input[type="file"][name="document"]');
  await doc.setInputFiles({ name: "legalitas.exe", mimeType: "application/pdf", buffer: Buffer.from("MZ not a pdf") });
  await page.getByText("Gunakan PDF, PNG, atau JPG.").waitFor();
  await doc.setInputFiles({ name: "legalitas.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%uji\n") });
  await page.getByText("legalitas.pdf").waitFor();
  await next();
  await page.getByText("Langkah 4 dari 4: Konfirmasi").waitFor();
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await page.getByText(/Setujui Syarat & Ketentuan/).waitFor();
  assert.equal(await focusedName(), "acceptTerms");
  await page.getByRole("checkbox", { name: /Saya menyetujui/ }).check();
  await page.getByRole("link", { name: "Syarat & Ketentuan" }).first().waitFor();

  // 7. Submit, see the pending flow: verify, then limited access with banner.
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await page.waitForURL(/\/verify-email\?registered=sponsor/);
  await page.getByText(/admin memeriksa data dan dokumenmu/).waitFor();
  await page.getByRole("link", { name: /buka tautan verifikasi/ }).click();
  await page.getByRole("button", { name: "Verifikasi email" }).click();
  await page.waitForURL("**/account/verification");
  await page.getByRole("heading", { name: "Akunmu sedang diverifikasi." }).waitFor();
  await page.getByText("PT Uji Sejahtera").waitFor();
  await page.getByText(/legalitas\.pdf/).waitFor();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Sponsorship" }).count().then((n) => assert.equal(n, 0));
  for (const blocked of ["/sponsor", "/organizer", "/me", "/events/new"]) { await go(blocked); await page.waitForURL("**/account/verification"); }
  await go("/settings"); await page.getByRole("button", { name: "Simpan profil" }).waitFor();
  await signOut();
  await page.evaluate(() => sessionStorage.removeItem("partnerhub:register-draft:v1"));

  // 8. A real (registered) user account starts empty, never with demo data.
  await go("/register?role=user");
  await page.getByText("Langkah 1 dari 3: Akun").waitFor();
  await field("fullName").fill("Sari Uji"); await field("email").fill("sari@contoh.id"); await field("phone").fill("+62 812 9999 0000");
  await field("password").fill(STRONG); await field("confirm").fill(STRONG);
  await next();
  await page.getByText(/Langkah ini opsional/).waitFor();
  await next();
  await page.getByRole("checkbox", { name: /Saya menyetujui/ }).check();
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await page.waitForURL(/\/verify-email\?registered=user/);
  await page.getByRole("link", { name: /buka tautan verifikasi/ }).click();
  await page.getByRole("button", { name: "Verifikasi email" }).click();
  await page.waitForURL("**/me");
  await page.getByRole("heading", { name: "Temukan acara.", level: 1 }).waitFor();
  await (await openBell()).getByText("Belum ada notifikasi.").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { name: "Festival Literasi Kota", level: 3 }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Daftar acara" }).count(), 0, "registering is not offered on the card itself");
  await page.getByRole("button", { name: /^Detail Seminar Kepemimpinan Mahasiswa/ }).click();
  // The default form asks for one optional question, so a participant can submit it straight away.
  await page.getByRole("dialog").getByText("Gratis").first().waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Daftar acara" }).click();
  await page.getByText(/Pendaftaran berhasil/).waitFor();
  // A joined event leaves the catalog and shows up under Acara saya with its ticket.
  assert.equal(await page.getByRole("button", { name: /^Detail Seminar Kepemimpinan Mahasiswa/ }).count(), 0, "a joined event leaves the catalog");
  await go("/me/events");
  await page.getByRole("heading", { name: "Acara saya", level: 1 }).waitFor();
  await page.getByText(/Referensi tiket\s+PH-/).waitFor();
  for (const blocked of ["/organizer", "/sponsor", "/account/verification"]) { await go(blocked); await page.waitForURL("**/me"); }
  await signOut();

  // 9. Duplicate email is reported next to the field.
  await go("/register?role=user");
  await field("fullName").fill("Sari Dua"); await field("email").fill("sari@contoh.id"); await field("phone").fill("0812 1111 2222");
  await field("password").fill(STRONG); await field("confirm").fill(STRONG);
  await next(); await next();
  await page.getByRole("checkbox", { name: /Saya menyetujui/ }).check();
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await page.getByText("Email ini sudah terdaftar. Masuk, atau gunakan email lain.").first().waitFor();
  assert.equal(await focusedName(), "email");

  // 10. Seeded demo accounts: full data, own dashboard, no access to other roles.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  await go("/me/events");
  await page.getByText("PH-K7M2-Q9DA").waitFor();
  await (await openBell()).getByText("Pengingat acara").waitFor();
  await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(output, "demo-user.png"), fullPage: true });
  await go("/organizer"); await page.waitForURL("**/me");
  await signOut();

  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  await page.getByRole("heading", { name: "Seminar Kepemimpinan Mahasiswa", level: 2 }).waitFor();
  assert.equal(await page.getByText("Festival Literasi Kota").count(), 0, "another organizer's event must not be listed as mine");
  // 124 seeded registrants + the demo user's seeded ticket + the account registered earlier in this run.
  await page.getByText("126/200").first().waitFor();
  await page.screenshot({ path: path.join(output, "demo-organizer.png"), fullPage: true });
  await go("/sponsor"); await page.waitForURL("**/organizer");
  await go("/events/demo-event-6"); await page.getByText(/tidak tersedia/).first().waitFor();
  await signOut();

  await signIn("demo.sponsor@partnerhub.test");
  await page.waitForURL("**/sponsor");
  await page.locator("details").first().waitFor();
  for (const detail of await page.locator("details").all()) await detail.locator("summary").click();
  await page.getByText("Dukungan dana untuk konsumsi peserta").waitFor();
  await page.getByText("Logo pada poster acara: terverifikasi").waitFor();
  await page.getByRole("link", { name: "Kirim proposal", exact: true }).first().click();
  await page.getByRole("button", { name: "Kirim proposal", exact: true }).click();
  await page.getByText("Pilih acara yang ingin kamu dukung.").waitFor();
  assert.equal(await focusedName(), "eventId");
  await field("eventId").selectOption({ index: 1 });
  await field("category").selectOption("Dana");
  await field("offer").fill("Dukungan dana untuk konsumsi peserta kegiatan ini.");
  await page.getByRole("button", { name: "Kirim proposal", exact: true }).click();
  await page.waitForURL("**/sponsor?sent=1");
  await page.locator("details").first().waitFor();
  for (const detail of await page.locator("details").all()) await detail.locator("summary").click();
  await page.getByText("Dukungan dana untuk konsumsi peserta kegiatan ini.").waitFor();
  await go("/organizer"); await page.waitForURL("**/sponsor");
  await signOut();

  await signIn("demo.menunggu@partnerhub.test");
  await page.waitForURL("**/account/verification");
  await page.getByText("Komunitas Demo Baru").waitFor();
  await page.getByRole("link", { name: /Lihat status verifikasi/ }).count().then((n) => assert.equal(n, 0));
  await page.screenshot({ path: path.join(output, "demo-pending.png"), fullPage: true });
  await signOut();

  // 11. Reset demo data removes this session's changes (new accounts, proposals) and signs out.
  await signIn("demo.sponsor@partnerhub.test");
  await page.waitForURL("**/sponsor");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset data demo" }).click();
  await page.waitForURL("**/login");
  await page.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  await page.getByRole("button", { name: /demo\.sponsor@partnerhub\.test/ }).click();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/sponsor");
  assert.equal(await page.getByText("Dukungan dana untuk konsumsi peserta kegiatan ini.").count(), 0, "reset must remove session proposals");
  await signOut();
  // Accounts registered in the wiped session no longer exist after Reset.
  await go("/login");
  await field("email").fill("sari@contoh.id");
  await field("password").fill(STRONG);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.getByText("Email atau password tidak cocok.").first().waitFor();

  // 12. Mobile layouts of the wizard.
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/register?role=organizer"); await noOverflow(`wizard ${width}`);
    await page.screenshot({ path: path.join(output, `wizard-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log("PASS role-flow: picker, validation+focus, Back, refresh draft (no password), role switch, file checks, pending flow, guards, empty real account, duplicate email, 4 demo accounts, reset, mobile; no page errors.");
} catch (error) {
  console.log("Failure URL:", page.url(), "Errors:", errors.slice(0, 5));
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally { await browser.close(); }
