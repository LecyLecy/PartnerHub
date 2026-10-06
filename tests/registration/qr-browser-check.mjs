// Browser check for QR delivery: the organizer sends codes, the participant shows one, and a real decoder reads it back.
// Needs a demo build (NEXT_PUBLIC_PARTNERHUB_DEMO=1) and the `jsqr` package next to Playwright (test tooling only, not a project dependency).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const jsQR = require(process.env.JSQR_MODULE || path.join(path.dirname(process.env.PLAYWRIGHT_MODULE || ""), "jsqr"));
const base = process.env.UI_BASE_URL || "http://localhost:3114";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/qr");
const PASSWORD = "DemoPass-2026!";
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !/favicon|Failed to load resource|40[34]/.test(message.text() + message.location().url)) errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
async function signIn(email) {
  await go("/login");
  await page.getByRole("button", { name: "Pilih akun demo", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(email.replace(".", "\\.")) }).click();
  await page.waitForFunction((expected) => document.querySelector('input[name="password"]')?.value === expected, PASSWORD, { timeout: 5000 });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
// Sign out through the profile menu. Clearing storage would also wipe the demo data this test depends on.
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
  // The participant has no code yet for the seminar.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  await go("/me/events");
  const seminar = page.locator("li", { has: page.getByRole("heading", { name: "Seminar Kepemimpinan Mahasiswa", level: 3 }) }).filter({ hasText: "PH-K7M2-Q9DA" });
  await seminar.getByText("QR belum dikirim penyelenggara.").waitFor();
  assert.equal(await seminar.getByRole("button", { name: /Tampilkan QR/ }).count(), 0);
  await signOut();

  // The organizer creates and sends.
  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  await go("/events/demo-event-1");
  await page.getByRole("link", { name: "QR tiket", exact: true }).click();
  await page.waitForURL("**/events/demo-event-1/qr");
  await page.getByRole("heading", { name: "QR tiket peserta.", level: 1 }).waitFor();
  await page.getByRole("button", { name: "Buat dan kirim QR" }).click();
  await page.getByText(/QR sudah terkirim/).waitFor();
  assert.equal(await page.getByRole("button", { name: /Buat dan kirim QR|Kirim QR yang tertunda/ }).isDisabled(), true, "nothing left to send");
  await page.screenshot({ path: path.join(output, "organizer-qr-sent.png") });
  await signOut();

  // The participant shows it, and the picture decodes to the opaque payload.
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  await go("/me/events");
  await (async () => { await page.getByRole("button", { name: /^Notifikasi/ }).click(); await page.getByRole("region", { name: "Notifikasi terbaru" }).getByText("QR tiket terkirim").first().waitFor(); await page.keyboard.press("Escape"); })();
  await page.getByRole("button", { name: /Tampilkan QR Seminar Kepemimpinan Mahasiswa/ }).click();
  const dialog = page.getByRole("dialog", { name: "QR masuk" });
  const image = dialog.getByRole("img", { name: /QR masuk untuk Seminar Kepemimpinan Mahasiswa/ });
  await image.waitFor();
  await page.screenshot({ path: path.join(output, "participant-qr.png") });
  const png = await image.screenshot();
  const { PNG } = await (async () => { try { return require(path.join(path.dirname(process.env.PLAYWRIGHT_MODULE || ""), "pngjs")); } catch { return {}; } })();
  let decoded = null;
  if (PNG) {
    const parsed = PNG.sync.read(png);
    decoded = jsQR(new Uint8ClampedArray(parsed.data), parsed.width, parsed.height);
  } else {
    // No PNG decoder installed: redraw the SVG onto a canvas inside the page and read pixels there.
    const pixels = await image.evaluate(async (svg) => {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      await img.decode();
      const size = 600;
      const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size); ctx.drawImage(img, 0, 0, size, size);
      return { size, data: Array.from(ctx.getImageData(0, 0, size, size).data) };
    });
    decoded = jsQR(new Uint8ClampedArray(pixels.data), pixels.size, pixels.size);
  }
  assert.ok(decoded, "a real QR decoder reads the code on screen");
  assert.match(decoded.data, /^PH1\.[A-Za-z0-9]{24}$/, "payload is PH1 plus an opaque secret");
  for (const forbidden of ["Pengguna", "demo.user", "PH-K7M2-Q9DA", "Seminar"]) assert.equal(decoded.data.includes(forbidden), false, `no personal data (${forbidden}) in the code`);
  assert.equal(await dialog.getByText(decoded.data).count(), 0, "the payload is never printed as text");
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/me/events");
    await page.getByRole("button", { name: /Tampilkan QR Seminar Kepemimpinan Mahasiswa/ }).click();
    await page.getByRole("dialog", { name: "QR masuk" }).getByRole("img").waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width}`);
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log("PASS qr: organizer creates and sends per event, participant waits then shows QR, jsQR decodes PH1 payload with no personal data, 390/320px, no page errors.");
} finally { await browser.close(); }