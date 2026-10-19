import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/landing-simple");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
try {
  await go("/");
  await page.getByRole("heading", { level: 1, name: /Satu ruang kerja untuk acara/ }).waitFor();
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("main > section").count(), 4, "intro, process, roles, FAQ only");
  assert.equal(await page.getByRole("tablist").count(), 0, "no unexplained tabs");
  assert.equal(await page.getByRole("switch").count(), 0, "no pretend settings on the landing page");
  assert.equal(await page.locator("blockquote").count(), 0);
  assert.ok((await page.locator("main").innerText()).split(/\s+/).length < 350, "keep initial copy short");
  const steps = page.getByRole("list", { name: "Cara kerja PartnerHub", exact: true });
  assert.equal(await steps.getByRole("listitem").count(), 3);
  const bands = await page.locator("main > section").evaluateAll(elements => elements.slice(1).map(element => ({
    border: getComputedStyle(element).borderTopWidth,
    color: getComputedStyle(element).backgroundColor,
    padding: getComputedStyle(element.firstElementChild).paddingTop,
  })));
  for (const band of bands) { assert.equal(band.border, "1px"); assert.ok(parseFloat(band.padding) >= 32); }
  assert.notEqual(bands[0].color, bands[1].color, "role section has a distinct surface");
  assert.equal(await page.getByRole("link", { name: "Buat acara", exact: true }).getAttribute("href"), "/register?role=organizer");
  for (const role of ["organizer", "user", "sponsor"]) assert.ok(await page.locator('main a[href="/register?role=' + role + '"]').count());
  for (const link of await page.locator('footer a[href^="#"]').all()) {
    const href = await link.getAttribute("href"); assert.equal(await page.locator(href).count(), 1, "footer anchor exists: " + href);
  }
  await page.getByRole("heading", { name: "Siapa yang bisa memakai PartnerHub?", exact: true }).waitFor();
  const costs = page.getByRole("region", { name: "Bagaimana biaya untuk penyelenggara?", exact: true });
  assert.ok(await costs.locator("p").isVisible(), "FAQ answers are visible without a click");
  assert.equal(await page.locator("main details, main summary, main button[aria-expanded]").count(), 0);
  await noOverflow();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(output, "landing-1440.png"), fullPage: true });
  await page.locator('header nav').getByRole("link", { name: "Cara kerja", exact: true }).click();
  await page.waitForURL(base + "/#fitur");
  assert.ok((await steps.boundingBox()).height > 0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 }); await go("/");
    await page.getByRole("heading", { level: 1 }).waitFor(); await noOverflow();
    const menu = page.getByRole("button", { name: "Buka menu", exact: true });
    await menu.click();
    await page.getByRole("navigation", { name: "Menu", exact: true }).getByRole("link", { name: "Cara kerja", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await menu.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('main [aria-hidden="true"] table').evaluate(element => element.getBoundingClientRect().right > innerWidth), false, "preview stays readable inside viewport");
    await page.screenshot({ path: path.join(output, "landing-" + width + ".png"), fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go("/"); await page.getByRole("heading", { level: 1 }).waitFor();
  assert.equal(await page.locator("h1").evaluate(element => getComputedStyle(element).animationName), "none");
  assert.equal(await page.locator('[data-reveal="hidden"]').count(), 0);
  for (const route of ["/about", "/guide", "/contact"]) { await go(route); await page.getByRole("heading", { level: 1 }).waitFor(); await noOverflow(); }
  assert.deepEqual(errors, []);
  console.log("PASS simple landing: compact copy, three content bands, visible separators, no tabs/settings/rotating feeds, open FAQ answers, role links, valid anchors, guest navigation, 1440/390/320px, reduced motion.");
} finally { await browser.close(); }

