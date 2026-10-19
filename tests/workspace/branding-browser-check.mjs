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
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
async function decode(src) {
  return page.evaluate(src => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
    image.onerror = () => reject(new Error("Brand image failed: " + src));
    image.src = src;
  }), src);
}
try {
  await mkdir(".impeccable/branding", { recursive: true });
  await go("/");
  for (const [src, dimensions] of [
    ["/brand/partnerhub-wordmark-transparent-hd.png", [2172, 724]],
    ["/brand/partnerhub-mark-transparent-hd.png", [1254, 1254]],
  ]) {
    assert.deepEqual(await decode(src), dimensions);
    assert.equal(await page.evaluate(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, 1, 1).data[3];
    }, src), 0, "logo background is transparent");
  }
  const icon = page.locator('link[rel="icon"][href*="icon.png"]');
  assert.equal(await icon.count(), 1);
  assert.equal((await page.request.get(new URL(await icon.getAttribute("href"), base).href)).status(), 200);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/explore", "/login"]) {
      await go(route);
      const brand = page.locator("header").getByRole("link", { name: "PartnerHub", exact: true });
      const wordmark = brand.locator('[data-brand-logo="wordmark"]');
      const mark = brand.locator('[data-brand-logo="mark"]');
      assert.equal(await wordmark.isVisible(), width > 640);
      assert.equal(await mark.isVisible(), width <= 640);
      assert.equal(await brand.getAttribute("href"), "/");
      await noOverflow();
    }
    await page.locator("header").screenshot({ path: `.impeccable/branding/header-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/");
  const footerBrand = page.locator("footer").getByRole("link", { name: "PartnerHub", exact: true });
  assert.equal(await footerBrand.locator('[data-brand-logo="wordmark"]').isVisible(), true);
  await footerBrand.screenshot({ path: ".impeccable/branding/footer.png" });
  for (const [role, home] of [["organizer", "/organizer"], ["sponsor", "/sponsor"], ["user", "/me"]]) {
    await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(role);
    await page.waitForURL("**" + home);
    await page.locator("#workspace-sidebar").waitFor({ state: "attached" });
    const before = await page.evaluate(() => sessionStorage.getItem("partnerhub:demo:v3"));
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      if (width < 960) await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      const sidebar = page.locator("#workspace-sidebar");
      const brand = sidebar.getByRole("link", { name: /^PartnerHub,/ });
      await brand.locator('[data-brand-logo="wordmark"]').waitFor();
      assert.equal(await brand.locator('[data-brand-logo="wordmark"]').isVisible(), true);
      assert.equal(await brand.locator('[data-brand-logo="mark"]').count(), 0, "no duplicate symbol beside the long logo");
      assert.equal(await brand.getAttribute("href"), home);
      assert.ok((await brand.boundingBox()).width <= (await sidebar.boundingBox()).width);
      await noOverflow();
      await brand.screenshot({ path: `.impeccable/branding/${role}-${width}.png` });
      if (width < 960) await page.keyboard.press("Escape");
    }
    assert.equal(await page.evaluate(() => sessionStorage.getItem("partnerhub:demo:v3")), before, "branding views preserve stored records");
  }
  assert.deepEqual(errors, []);
  console.log("PASS branding: transparent PNGs decode with clear backgrounds, PNG favicon responds, long/compact responsive headers, wordmark footer/all-role sidebars, accessible links, unchanged data and 1440/768/390/320px without overflow.");
} finally { await browser.close(); }
