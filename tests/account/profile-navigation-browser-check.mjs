import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(base + "/guide", { waitUntil: "networkidle" });
  await mkdir(".impeccable/transaction-profile", { recursive: true });
  for (const [role, destination] of [["organizer", "/organizer"], ["sponsor", "/sponsor"], ["user", "/me"]]) {
    await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(role);
    await page.waitForURL("**" + destination);
    await page.goto(base + "/onboarding", { waitUntil: "networkidle" });
    const guide = await page.locator("main").innerText();
    assert.doesNotMatch(guide, /draft|Acara saya/i, "onboarding must not restore retired navigation or draft guidance");
    if (role === "organizer") {
      for (const text of ["Arsip acara", "Bayar per event", "subscription", "Bidang tidak dapat diubah"]) assert.ok(guide.includes(text), text);
    }
    if (role === "user") {
      for (const text of ["Tiket saya", "Lamaran saya", "jika modul QR diaktifkan"]) assert.ok(guide.includes(text), text);
    }
    await page.getByRole("button", { name: "Buka halaman kerja", exact: true }).click();
    await page.waitForURL(url => url.pathname !== "/onboarding");
    await page.goto(base + destination, { waitUntil: "networkidle" });
    assert.equal(await page.locator('#workspace-sidebar nav[aria-label="Navigasi utama"] a[href="/settings"]').count(), 0);
    await page.getByRole("button", { name: /^Menu akun/ }).click();
    await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
    await page.waitForURL("**/settings");
    await page.getByRole("heading", { name: "Pengaturan akun", exact: true }).waitFor();
    assert.equal(await page.locator("main").getByRole("link", { name: "Kembali", exact: true }).count(), 0);
    assert.equal(await page.locator("main").getByRole("button", { name: "Kembali", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Pencarian cepat", exact: true }).count(), 0);
    await page.keyboard.press("Control+k");
    assert.equal(await page.getByRole("dialog", { name: "Pencarian cepat", exact: true }).count(), 0);
    const name = page.getByLabel("Nama tampilan (opsional)", { exact: true });
    const original = await name.inputValue();
    await name.fill(original + " QA");
    await page.getByRole("button", { name: "Simpan profil", exact: true }).click();
    await page.getByText("Profil berhasil diperbarui.", { exact: true }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await name.inputValue(), original + " QA");
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (role === "organizer") await page.screenshot({ path: ".impeccable/transaction-profile/profile-" + width + ".png" });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.getByRole("button", { name: /^Menu akun/ }).click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.waitForURL("**/login?reason=logout");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Email", { exact: true }).fill("demo.menunggu@partnerhub.test");
  await page.locator('input[name="password"]').fill("DemoPass-2026!");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/account/verification");
  await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Menu", exact: true });
  assert.equal(await menu.locator('a[href="/settings"]').innerText(), "Pengaturan");
  assert.equal(await menu.getByRole("link", { name: /Profil/ }).count(), 0);
  await menu.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("heading", { name: "Pengaturan akun", exact: true }).waitFor();
  await page.goto(base + "/organizer", { waitUntil: "networkidle" });
  await page.waitForURL("**/account/verification");
  assert.equal(await page.locator("#workspace-sidebar").count(), 0, "pending accounts retain restricted navigation");
  assert.deepEqual(errors, []);
  console.log("PASS: current onboarding for all roles, profile save/reload and no Back, no global search, desktop/390/320px, restricted mobile Pengaturan and approval guard, no runtime errors.");
} finally { await browser.close(); }
