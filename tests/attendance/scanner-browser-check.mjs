import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright-core");
const base = process.env.BASE_URL || "http://localhost:3000";
const output = process.env.REVIEW_DIR || "/private/var/folders/xp/wb5z7bgn173bvwbycwdztmdm0000gn/T/opencode/ticket-scan-review";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || (process.platform === "win32" ? "msedge" : undefined), headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const switchRole = async (role) => {
  const side = page.locator("#organizer-sidebar");
  if (await side.isVisible()) await side.hover();
  await page.getByRole("button", { name: /^Menu akun/ }).first().click();
  await page.getByRole("button", { name: "Keluar", exact: true }).first().click();
  await page.waitForURL("**/login?reason=logout");
  await page.locator('input[name="email"]').fill(role === "user" ? "demo.user@partnerhub.test" : "demo.penyelenggara@partnerhub.test");
  await page.locator('input[name="password"]').fill("DemoPass-2026!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL(role === "user" ? "**/me" : "**/organizer");
  await page.waitForLoadState("networkidle");
};
const upload = (file) => page.getByLabel("Pilih gambar QR", { exact: true }).setInputFiles(file);
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
try {
  await go("/login");
  await page.locator('input[name="email"]').fill("demo.penyelenggara@partnerhub.test");
  await page.locator('input[name="password"]').fill("DemoPass-2026!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/organizer");
  await go("/events/demo-event-1/qr");
  await page.getByRole("button", { name: /Buat dan kirim|Kirim/ }).click();
  await page.getByRole("status").filter({ hasText: /QR sudah terkirim/ }).waitFor();
  await switchRole("user");
  await go("/me/events");
  const eventTitle = await page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")).events.find((event) => event.id === "demo-event-1").title);
  await page.getByRole("button", { name: `Tampilkan QR ${eventTitle}`, exact: true }).click();
  const qr = page.getByRole("dialog").getByRole("img");
  await qr.waitFor();
  const png = `${output}/generated-ticket.png`;
  await qr.screenshot({ path: png });
  await page.keyboard.press("Escape");
  await switchRole("organizer");
  await page.evaluate(() => {
    const db = JSON.parse(sessionStorage.getItem("partnerhub:demo:v3"));
    db.events.find((event) => event.id === "demo-event-1").modules.attendance = true;
    sessionStorage.setItem("partnerhub:demo:v3", JSON.stringify(db));
  });
  await go("/organizer");
  await page.getByRole("link", { name: /^Scan QR peserta:/ }).first().click();
  await page.waitForURL("**/events/demo-event-1/scan");
  await page.getByRole("heading", { name: "Periksa QR tiket", exact: true }).waitFor();
  await upload(png);
  await page.getByText("Hadir tercatat", { exact: true }).waitFor();
  await page.getByRole("heading", { name: "Daftar Hadir (1)", exact: true }).waitFor();
  await noOverflow();
  await page.screenshot({ path: `${output}/scan-desktop.png`, fullPage: true });
  const time = await page.locator("dd").last().textContent();
  await upload(png);
  await page.getByText("Sudah hadir sebelumnya", { exact: true }).waitFor();
  assert.equal(await page.locator("dd").last().textContent(), time);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow();
    await page.screenshot({ path: `${output}/scan-${width}.png`, fullPage: true });
  }
  await go("/events/demo-event-1/registration");
  await page.getByRole("tab", { name: "Hadir", exact: true }).click();
  await page.getByRole("cell", { name: /^Hadir ·/ }).waitFor();
  await page.getByRole("link", { name: "Scan QR peserta", exact: true }).click();
  await page.waitForURL("**/events/demo-event-1/scan");
  // Inject a deterministic denial, then a local canvas stream, to exercise camera lifecycle without physical hardware.
  await page.evaluate(() => Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => { throw new DOMException("Denied", "NotAllowedError"); } }));
  await page.getByRole("button", { name: "Buka kamera", exact: true }).click();
  await page.getByText(/Izin kamera ditolak/).waitFor();
  await page.getByRole("button", { name: "Tutup kamera", exact: true }).click();
  const data = await page.evaluate(async (file) => {
    const image = new Image();
    image.src = file;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, 640, 480);
    ctx.drawImage(image, 160, 80, 320, 320);
    window.testCameraCanvas = canvas;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: async () => {
      window.testCameraStream = canvas.captureStream(10);
      window.testCameraPaint = setInterval(() => ctx.drawImage(image, 160, 80, 320, 320), 100);
      return window.testCameraStream;
    } });
    return true;
  }, `data:image/png;base64,${(await readFile(png)).toString("base64")}`);
  assert.ok(data);
  await page.getByRole("button", { name: "Buka kamera", exact: true }).click();
  await page.getByText("Sudah hadir sebelumnya", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.testCameraStream.getTracks().every((track) => track.readyState === "ended")), true);
  await page.getByRole("button", { name: "Scan peserta berikutnya", exact: true }).click();
  await page.getByText("Sudah hadir sebelumnya", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Kelola pengiriman QR", exact: true }).click();
  await page.waitForURL("**/events/demo-event-1/qr");
  await page.getByRole("link", { name: "Scan QR peserta", exact: true }).click();
  await page.waitForURL("**/events/demo-event-1/scan");
  // Decode failure must retain retry controls and not insert attendance.
  await upload({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
  await page.getByRole("alert").filter({ hasText: /Gambar rusak/ }).waitFor();
  await go("/organizer/sponsorship");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of ["Permintaan terkirim", "Proposal masuk"]) {
      await page.getByRole("region", { name, exact: true }).getByRole("button").first().click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      assert.equal(await dialog.locator("dl").count(), 1);
      assert.equal(await dialog.getByRole("button", { name: "Tutup detail sponsor", exact: true }).count(), 1);
      assert.equal(await dialog.evaluate((element) => element.scrollWidth > element.clientWidth), false);
      await page.screenshot({ path: `${output}/${name === "Proposal masuk" ? "incoming" : "outgoing"}-${width}.png` });
      await dialog.getByRole("button", { name: "Tutup detail sponsor", exact: true }).click();
      assert.equal(await page.getByRole("dialog").count(), 0);
    }
    await noOverflow();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/verification.txt`, "PASS: actual generated participant QR decoded from file and canvas camera; first/repeated attendance, Hadir tab, scan action routes, camera denial and track cleanup, invalid image, sponsor X dialogs, 1440/390/320px overflow checks. No page/console errors. Physical camera hardware not tested.\n");
  console.log(`PASS. Screenshots and evidence: ${output}`);
} catch (error) { console.log(await page.locator("body").innerText()); await page.screenshot({ path: `${output}/failure.png`, fullPage: true }); throw error; }
finally { await browser.close(); }
