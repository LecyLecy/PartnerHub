import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
try {
  await go("/guide");
  for (const [role, home] of [["organizer", "/organizer"], ["sponsor", "/sponsor"], ["user", "/me"]]) {
    await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(role);
    await page.waitForURL("**" + home);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 }); await go(home);
      assert.equal(await page.locator('#workspace-sidebar a[href="/terms"], #workspace-sidebar a[href="/privacy"]').count(), 0, role + " sidebar has no legal links");
      assert.equal(await page.locator('footer a[href="/terms"]').count(), 1);
      assert.equal(await page.locator('footer a[href="/privacy"]').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width < 500) {
        await page.getByRole("button", { name: "Buka menu", exact: true }).click();
        await page.getByRole("button", { name: /^Menu akun/ }).focus();
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest("#workspace-sidebar"))), true);
        await page.keyboard.press("Escape");
      }
    }
    for (const [href, title] of [["/terms", "Syarat & Ketentuan"], ["/privacy", "Kebijakan Privasi"]]) {
      await go(home); await page.locator(`footer a[href="${href}"]`).click();
      await page.waitForURL("**" + href);
      await page.getByRole("heading", { level: 1, name: title, exact: true }).waitFor();
    }
  }
  assert.deepEqual(errors, []);
  console.log("PASS footer-only legal links: all roles, no sidebar duplicates, intact footer destinations and mobile drawer focus; 1440/390/320px.");
} finally { await browser.close(); }
