import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3110";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/product-flow");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", error => runtimeErrors.push(error.message));
let session = null;
let failEvents = false;
let conflict = false;
let failUpload = false;
let failLogin = false;
let creates = 0;
let uploads = 0;
const events = new Map();
const requests = [];
const signedSession = () => ({ account: { id: "test-account", email: "owner@example.test", displayName: null, role: "organizer", status: "active" }, emailVerified: true, onboardingComplete: true, expiresAt: new Date(Date.now() + 3600000).toISOString() });
const json = (route, value, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(value) });
const failure = (route, status) => json(route, { error: { code: "TEST_FAILURE" } }, status);
await context.route("**/api/**", async route => {
  const request = route.request(); const url = new URL(request.url()); const endpoint = url.pathname; const method = request.method();
  requests.push({ endpoint, method });
  if (endpoint === "/api/auth/session") return session ? json(route, session) : failure(route, 401);
  if (endpoint === "/api/auth/login") { if (failLogin) return failure(route, 401); session = signedSession(); return json(route, session); }
  if (endpoint === "/api/auth/register/user") { session = { ...signedSession(), emailVerified: false, onboardingComplete: false }; return json(route, { session, verificationRequired: true }, 201); }
  if (endpoint === "/api/auth/logout") { session = null; return route.fulfill({ status: 204 }); }
  if (endpoint === "/api/auth/verification/confirm") { session = { ...signedSession(), onboardingComplete: false }; return json(route, session); }
  if (endpoint === "/api/accounts/onboarding") { session = signedSession(); return json(route, session); }
  if (endpoint === "/api/profile") { session = { ...session, account: { ...session.account, ...request.postDataJSON() } }; return json(route, session); }
  if (["/api/auth/password/forgot", "/api/auth/password/reset", "/api/auth/verification/resend"].includes(endpoint)) return json(route, { message: "Test-only acknowledged request" });
  if (!session) return failure(route, 401);
  if (endpoint === "/api/organizer/summary") return json(route, { events: [...events.values()].map(item => ({ eventId: item.id, title: item.title, status: item.status, registered: 0, capacity: item.capacity })) });
  if (endpoint === "/api/me/notifications") return json(route, { items: [] });
  if (endpoint === "/api/events" && method === "GET") return failEvents ? failure(route, 503) : json(route, { items: [...events.values()] });
  if (endpoint === "/api/events" && method === "POST") {
    creates++; const event = { ...request.postDataJSON(), id: `test-event-${creates}`, status: "DRAFT", revision: "1", updatedAt: new Date().toISOString() }; events.set(event.id, event); return json(route, event, 201);
  }
  const match = endpoint.match(/^\/api\/events\/([^/]+)(\/assets)?$/);
  if (match) {
    const id = match[1]; const event = events.get(id); if (!event) return failure(route, 404);
    if (match[2]) { uploads++; return failUpload ? failure(route, 503) : json(route, { id: `test-asset-${uploads}`, name: "test-logo.png", url: "/test-logo.png" }, 201); }
    if (method === "GET") return json(route, event);
    if (method === "PATCH") { if (conflict) return failure(route, 409); const updated = { ...event, ...request.postDataJSON(), revision: String(Number(event.revision) + 1), updatedAt: new Date().toISOString() }; events.set(id, updated); return json(route, updated); }
  }
  return failure(route, 404);
});
const png = Buffer.from(await page.evaluate(() => { const canvas=document.createElement("canvas"); canvas.width=32;canvas.height=32;const paint=canvas.getContext("2d");paint.fillStyle="#162748";paint.fillRect(0,0,32,32);return canvas.toDataURL("image/png").split(",")[1]; }), "base64");
await context.route("**/test-logo.png", route => route.fulfill({ contentType: "image/png", body: png }));
const goto = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
// Keluar and Pengaturan sit behind the profile button. On the organizer rail, hover first so the rail is open.
async function openAccountMenu() {
  const side = page.locator("#organizer-sidebar");
  if (await side.isVisible()) { await side.hover(); await page.waitForFunction(() => document.querySelector("#organizer-sidebar").getBoundingClientRect().width > 200); }
  const trigger = page.getByRole("button", { name: /^Menu akun/ });
  if (!(await trigger.first().isVisible())) await page.getByRole("button", { name: "Buka menu" }).click();
  if (await trigger.first().isVisible()) await trigger.first().click();
}
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

try {
  await goto("/dashboard"); await page.waitForURL("**/login?next=*");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.getByText("Masukkan alamat email yang valid.").waitFor();
  assert.equal(requests.filter(item => item.endpoint === "/api/auth/login").length, 0);
  await page.locator('input[name="email"]').fill("owner@example.test");
  await page.locator('input[name="password"]').fill("test-only-password");
  await page.getByRole("button", { name: "Lihat password" }).click();
  assert.equal(await page.locator('input[name="password"]').getAttribute("type"), "text");
  failLogin=true;
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.getByText("Email atau password tidak cocok. Periksa kembali isianmu.").waitFor();
  assert.equal(await page.locator('input[name="email"]').inputValue(),"owner@example.test");
  failLogin=false;
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/organizer"); await page.getByRole("heading", { name: "Event berikutnya mulai di sini." }).waitFor();
  await page.getByRole("link", { name: "Susun event pertama" }).click();
  await page.getByRole("textbox", { name: /Nama event/ }).fill("Event untuk pengujian frontend");
  await page.getByRole("button", { name: /3\s*Logo & identitas/ }).click();
  await page.locator('input[type="file"]').first().setInputFiles({ name: "test-logo.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Ganti gambar" }).waitFor();
  await page.getByRole("button", { name: /4\s*Modul event/ }).click();
  failUpload = true;
  await page.getByRole("button", { name: "Simpan draft ke server" }).click();
  await page.getByText("Layanan sedang tidak tersedia. Coba lagi sebentar.", { exact: true }).waitFor();
  assert.equal(creates, 1); assert.equal(uploads, 1);
  await page.getByText(/Draft dasar sudah dibuat di server/).waitFor();
  failUpload = false;
  await page.getByRole("button", { name: "Simpan draft ke server" }).click();
  await page.waitForURL("**/events/test-event-1?saved=1");
  assert.equal(creates, 1); assert.equal(uploads, 2);
  await page.getByText("Draft tersimpan dan dimuat kembali dari layanan event.").waitFor();
  await page.getByRole("link", { name: "Lanjutkan edit draft" }).click();
  await page.getByRole("textbox", { name: /Nama event/ }).fill("Judul diperbarui di tes");
  const dismiss = dialog => dialog.dismiss(); page.on("dialog", dismiss);
  await page.getByRole("navigation", { name: "Jejak halaman" }).getByRole("link", { name: "Acara kamu" }).click();
  assert.match(page.url(), /\/edit$/);
  await page.goBack({ timeout: 1000 }).catch(error => { if (error.name !== "TimeoutError") throw error; });
  assert.match(page.url(), /\/edit$/); page.off("dialog", dismiss);
  conflict = true;
  await page.getByRole("button", { name: /4\s*Modul event/ }).click();
  await page.getByRole("button", { name: "Simpan draft ke server" }).click();
  await page.getByText("Data telah berubah. Muat versi terbaru sebelum menyimpan lagi.").waitFor();
  conflict = false;
  await page.getByRole("button", { name: "Simpan draft ke server" }).click();
  await page.waitForURL("**/events/test-event-1?saved=1");
  await page.getByRole("navigation", { name: "Jejak halaman" }).getByRole("link", { name: "Acara kamu" }).click();
  await page.getByRole("heading", { name: "Judul diperbarui di tes" }).waitFor();
  await page.getByLabel("Cari event").fill("no matches");
  await page.getByRole("heading", { name: "Tidak ada event yang cocok." }).waitFor();
  await page.getByRole("button", { name: "Reset pencarian" }).click();
  await page.getByRole("combobox", { name: /Status/ }).selectOption("DRAFT");
  await openAccountMenu();
  await page.getByRole("link", { name: "Profil & pengaturan", exact: true }).click();
  await page.getByLabel("Nama tampilan (opsional)").fill("Nama pengujian");
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await page.getByText("Profil berhasil diperbarui.").waitFor();
  for (const width of [1440, 900, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await noOverflow(); await page.screenshot({ path: path.join(output, `settings-${width}.png`), fullPage: true }); }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const otherTab=await context.newPage(); await otherTab.goto(`${base}/settings`,{waitUntil:"networkidle"}); await otherTab.getByRole("button",{name:"Simpan profil"}).waitFor();
  await openAccountMenu();
  await page.getByRole("button", { name: "Keluar", exact: true }).first().click();
  await page.waitForURL("**/login?reason=logout"); await page.getByText("Kamu sudah keluar dari akun.").waitFor();
  await otherTab.waitForURL("**/login?next=*"); await otherTab.close();
  await page.goBack(); await page.waitForURL("**/login?next=*");
  await goto("/register?role=user");
  await page.locator('input[name="fullName"]').fill("Pemilik Uji");
  await page.locator('input[name="email"]').fill("owner@example.test");
  await page.locator('input[name="phone"]').fill("0812 3456 7890");
  await page.locator('input[name="password"]').fill("Strong-Pass-93!x");
  await page.locator('input[name="confirm"]').fill("Strong-Pass-93!x");
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page.getByRole("checkbox", { name: /Saya menyetujui/ }).check();
  await page.getByRole("button", { name: "Buat akun", exact: true }).click();
  await page.waitForURL(/\/verify-email(?:\?|$)/);
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByRole("button", { name: "Kirim ulang email verifikasi" }).click();
  await page.getByText(/Jika akun tersebut menunggu verifikasi/).waitFor();
  await goto("/verify-email?token=test-only-token");
  await page.getByRole("button", { name: "Verifikasi email", exact: true }).click();
  await page.waitForURL(/\/onboarding(?:\?|$)/);
  await page.getByRole("button", { name: "Buka halaman kerja" }).click();
  await page.waitForURL("**/organizer");
  failEvents = true; await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Muat ulang event" }).waitFor();
  failEvents = false; await page.getByRole("button", { name: "Muat ulang event" }).click();
  await page.getByRole("heading", { name: "Judul diperbarui di tes" }).waitFor();

  await goto("/events/test-event-1/edit"); await page.reload({waitUntil:"networkidle"});
  assert.equal(await page.getByRole("textbox",{name:/Nama event/}).inputValue(),"Judul diperbarui di tes");
  await goto("/events/new");
  await page.getByRole("textbox",{name:/Nama event/}).fill("Salinan browser khusus pengujian");
  await page.getByRole("button",{name:/2\s*Waktu & tempat/}).click();
  await page.locator('input[name="date"]').fill("2026-11-14");
  await page.locator('input[name="startTime"]').fill("09:00");
  await page.locator('input[name="endTime"]').fill("08:00");
  await page.getByRole("button",{name:"Lanjutkan",exact:true}).click();
  await page.getByText(/Jam selesai harus setelah jam mulai/).waitFor();
  await page.locator('input[name="endTime"]').fill("10:00");
  await page.locator('input[name="venue"]').fill("Lokasi pengujian frontend");
  await page.locator('input[name="capacity"]').fill("100");
  await page.getByRole("button",{name:"Lanjutkan",exact:true}).click();
  await page.getByLabel("Logo acara",{exact:true}).setInputFiles({name:"test-logo.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Ganti gambar"}).waitFor();
  await page.getByLabel("Logo acara",{exact:true}).setInputFiles({name:"bad.svg",mimeType:"image/svg+xml",buffer:Buffer.from("<svg/>")});
  await page.getByText("Gunakan PNG, JPG, atau WebP. SVG dan GIF tidak didukung.").waitFor();
  assert.equal(await page.getByRole("button",{name:"Ganti gambar"}).count(),1);
  await page.getByLabel("Logo acara",{exact:true}).setInputFiles({name:"corrupt.png",mimeType:"image/png",buffer:Buffer.from("invalid")});
  await page.getByText("Gambar tidak bisa dibaca. Pilih file gambar yang valid.").waitFor();
  await page.getByLabel("Logo acara",{exact:true}).setInputFiles({name:"large.png",mimeType:"image/png",buffer:Buffer.alloc(2*1024*1024+1)});
  await page.getByText("Ukuran gambar maksimal 2 MB. Kecilkan file lalu coba lagi.").waitFor();
  await page.getByRole("textbox",{name:"Nama organisasi penyelenggara"}).fill("Organisasi khusus pengujian");
  await page.getByRole("button",{name:/Tambah sponsor/}).click();
  await page.getByRole("textbox",{name:"Nama sponsor 1"}).fill("Sponsor khusus pengujian");
  await page.getByLabel("Logo sponsor 1",{exact:true}).setInputFiles({name:"test-sponsor.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Ganti gambar"}).nth(1).waitFor();
  await page.locator("summary").filter({hasText:"Salinan lokal di browser"}).click();
  await page.getByRole("button",{name:"Simpan salinan lokal"}).click();
  await page.getByText(/Salinan detail dan logo tersimpan di browser ini/).waitFor();
  page.once("dialog",dialog=>dialog.accept()); await page.reload({waitUntil:"networkidle"});
  await page.locator("summary").filter({hasText:"Salinan lokal di browser"}).click();
  await page.getByRole("button",{name:"Buka salinan lokal"}).click();
  await page.getByText("Draft lokal dipulihkan. Kamu bisa melanjutkan mengeditnya.").waitFor();
  assert.equal(await page.getByRole("textbox",{name:/Nama event/}).inputValue(),"Salinan browser khusus pengujian");
  await page.getByRole("button",{name:/3\s*Logo & identitas/}).click();
  assert.equal(await page.getByRole("button",{name:"Ganti gambar"}).count(),2);
  assert.equal(await page.getByRole("textbox",{name:"Nama sponsor 1"}).inputValue(),"Sponsor khusus pengujian");
  await page.getByRole("button",{name:"Halaman event",exact:true}).click();
  assert.equal(await page.getByRole("button",{name:"Halaman event",exact:true}).getAttribute("aria-pressed"),"true");
  for(const width of [1440,900,390,320]) {await page.setViewportSize({width,height:1000});await noOverflow();await page.screenshot({path:path.join(output,`editor-${width}.png`),fullPage:true});}
  await page.getByRole("button",{name:"Poster",exact:true}).focus(); await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("button",{name:"Poster",exact:true}).getAttribute("aria-pressed"),"true");
  await page.getByRole("button",{name:"Tutup preview",exact:true}).click();
  await page.getByRole("button",{name:"Lihat preview",exact:true}).click();
  await page.getByRole("button",{name:"Hapus sponsor 1"}).click();
  await page.getByRole("button",{name:"Hapus gambar",exact:true}).click();
  page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Hapus draft lokal"}).click();
  await page.getByText(/Draft lokal dihapus dari browser/).waitFor();
  await page.getByRole("button",{name:/4\s*Modul event/}).click();
  await page.getByRole("checkbox",{name:/Registrasi peserta/}).uncheck();
  await page.getByRole("checkbox",{name:/Scan masuk/}).check();
  assert.equal(await page.getByRole("checkbox",{name:/Registrasi peserta/}).isChecked(),true);
  await page.getByRole("checkbox",{name:/Registrasi peserta/}).uncheck();
  assert.equal(await page.getByRole("checkbox",{name:/Scan masuk/}).isChecked(),false);
  const beforeWindowSave=creates;
  await page.getByRole("button",{name:/2\s*Waktu & tempat/}).click();
  await page.getByLabel("Registrasi dibuka").fill("2026-11-01T10:00");
  await page.getByRole("button",{name:/4\s*Modul event/}).click();
  await page.getByRole("button",{name:"Simpan draft ke server"}).click();
  await page.getByText(/Isi awal dan akhir periode registrasi/).first().waitFor();
  assert.equal(creates,beforeWindowSave);
  await page.getByRole("button",{name:/2\s*Waktu & tempat/}).click();
  await page.getByLabel("Registrasi ditutup").fill("2026-11-14T09:00");
  await page.getByRole("button",{name:/4\s*Modul event/}).click();
  await page.getByRole("button",{name:"Simpan draft ke server"}).click();
  await page.waitForURL("**/events/test-event-2?saved=1");
  assert.equal(events.get("test-event-2").registrationClosesAt,"2026-11-14T02:00:00.000Z");

  session = null; await goto("/settings"); await page.waitForURL("**/login?next=*");
  await goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
  await page.getByRole("button", { name: "Kirim tautan pemulihan" }).click();
  await page.getByText(/Jika email tersebut terdaftar/).waitFor();
  await goto("/reset-password"); await page.getByText("Tautan pemulihan tidak lengkap.", { exact: false }).waitFor();
  await goto("/reset-password?token=test-only-token");
  await page.locator('input[name="password"]').fill("weak");
  await page.locator('input[name="confirm"]').fill("weak");
  await page.getByRole("button", { name: "Perbarui password" }).click();
  await page.getByText("Gunakan minimal 12 karakter.").waitFor();
  await page.locator('input[name="password"]').fill("Strong-Pass-93!x");
  await page.locator('input[name="confirm"]').fill("Strong-Pass-93!x");
  await page.getByRole("button", { name: "Perbarui password" }).click();
  await page.getByText("Password berhasil diperbarui. Masuk menggunakan password baru.").waitFor();
  assert.equal(new URL(page.url()).search, "");
  await goto("/missing-page"); await page.getByRole("heading", { name: "Halaman ini tidak ditemukan." }).waitFor();
  await page.getByRole("link", { name: "Ke beranda", exact: true }).click();
  await page.getByRole("heading", { name: /Satu ruang kerja untuk acara/, level: 1 }).waitFor();
  for (const width of [1440, 900, 390, 320]) { await page.setViewportSize({ width, height: 1000 }); await noOverflow(); await page.screenshot({ path: path.join(output, `landing-${width}.png`), fullPage: true }); }
  assert.deepEqual(runtimeErrors, []);
  const live=await browser.newContext({viewport:{width:390,height:900}}); const livePage=await live.newPage();
  await livePage.goto(base,{waitUntil:"networkidle"});await livePage.getByText(/Pemeriksaan sesi belum berhasil/).waitFor();
  await livePage.goto(`${base}/login`,{waitUntil:"networkidle"});
  await livePage.locator('input[name="email"]').fill("owner@example.test");await livePage.locator('input[name="password"]').fill("test-only-password");
  await livePage.getByRole("button",{name:"Masuk",exact:true}).click();
  await livePage.getByText("Data atau layanan yang diminta tidak tersedia.",{exact:true}).last().waitFor();
  assert.match(livePage.url(),/\/login$/);assert.equal(await livePage.locator('input[name="email"]').inputValue(),"owner@example.test");
  await livePage.goto(`${base}/dashboard`,{waitUntil:"networkidle"});await livePage.getByRole("heading",{name:"Akses belum dapat diperiksa."}).waitFor();
  await live.close();
  console.log("PASS: test-only API flow, guard/login/register/verification/onboarding, recovery, profile, logout/back, incomplete draft/create/upload retry/edit/conflict, dashboard filters/error retry, 404, responsive landing/settings; no page exceptions.");
} catch (error) { console.log("Failure URL:", page.url(), "Recent requests:", requests.slice(-12)); await page.screenshot({path:path.join(output,"failure.png"),fullPage:true}); throw error; }
finally { await browser.close(); }
