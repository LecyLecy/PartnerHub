// Browser check for the landing page: structure, interactions, motion rules and info pages. Works on a normal build
// (the landing page needs no API; the session probe is answered as signed out).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3112";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/landing");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !/favicon|401|Failed to load resource/.test(message.text() + message.location().url)) errors.push(message.text()); });
await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAUTHENTICATED" } }) }));
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${label}`);
// The page uses smooth scrolling for anchors, so tests jump instantly to stay deterministic.
const jump = (top) => page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
const scrollThrough = async () => {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) { await jump(y); await page.waitForTimeout(120); }
  await jump(0);
};

try {
  await go("/");
  assert.equal(await page.locator("h1").count(), 1, "one h1");
  await page.getByRole("heading", { name: /Satu ruang kerja untuk acara/, level: 1 }).waitFor();
  // Navbar: links, sticky, translucent after scroll.
  const nav = page.locator("header").first();
  for (const name of ["Cara kerja", "Keunggulan", "Tanya jawab", "Tentang"]) await nav.getByRole("link", { name, exact: true }).waitFor();
  assert.equal(await nav.evaluate((el) => getComputedStyle(el).position), "sticky");
  assert.equal(await nav.getAttribute("data-scrolled"), "false");
  await jump(900);
  await page.waitForFunction(() => document.querySelector("header").dataset.scrolled === "true");
  assert.equal(await nav.evaluate((el) => getComputedStyle(el).backdropFilter.includes("blur")), true);
  await jump(0);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(output, "landing-top-1440.png") });

  // Hero preview is decorative and labelled as an example.
  assert.equal(await page.locator('[aria-hidden="true"]').filter({ hasText: "Overview acara" }).count() > 0, true);
  await page.getByText(/Angka di atas hanya ilustrasi/).waitFor();
  await scrollThrough();
  await page.waitForTimeout(500);

  // Every heading section is reachable and content is visible after reveal (no element left hidden).
  await jump(99999);
  await page.waitForTimeout(700);
  assert.equal(await page.locator('[data-reveal="hidden"]').count(), 0, "all reveal elements end visible after scrolling through");
  await jump(0);

  // Toggle switches really switch.
  const toggle = page.getByRole("switch", { name: "Kehadiran QR" });
  await toggle.scrollIntoViewIfNeeded();
  assert.equal(await toggle.getAttribute("aria-checked"), "false");
  await toggle.click();
  assert.equal(await toggle.getAttribute("aria-checked"), "true");
  assert.ok((await toggle.boundingBox()).width >= 44, "toggle hit area is 44px");

  // Timeline reveals more items.
  // The button's name flips with its state, so address it by a name pattern instead of holding one locator.
  const more = page.getByRole("button", { name: /^Tampilkan lebih (banyak|sedikit)$/ });
  const list = page.getByRole("list", { name: "Contoh perjalanan sebuah acara" });
  await more.scrollIntoViewIfNeeded();
  const before = await list.getByRole("listitem").count();
  await more.click();
  assert.equal(await more.getAttribute("aria-expanded"), "true");
  assert.ok((await list.getByRole("listitem").count()) > before, "timeline grew");
  await more.click();
  assert.equal(await more.getAttribute("aria-expanded"), "false");
  assert.equal(await list.getByRole("listitem").count(), before);

  // Workflow states are written as text, not color alone.
  const flow = page.getByRole("list", { name: "Contoh alur seleksi panitia" });
  await flow.scrollIntoViewIfNeeded();
  for (const word of ["Selesai", "Berjalan", "Menunggu"]) await flow.getByText(word).first().waitFor();

  // Compare tabs: arrow keys move selection, panel swaps, indicator follows, height stays stable.
  const tabs = page.getByRole("tablist", { name: "Keunggulan" });
  await tabs.scrollIntoViewIfNeeded();
  const panelBefore = (await page.getByRole("tabpanel").first().boundingBox()).height;
  await tabs.getByRole("tab", { name: "Pendaftaran" }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await tabs.getByRole("tab", { name: "Panitia" }).getAttribute("aria-selected"), "true");
  await page.getByRole("heading", { name: "Seleksi panitia punya urutan yang jelas.", level: 3 }).waitFor();
  await page.keyboard.press("End");
  assert.equal(await tabs.getByRole("tab", { name: "Tiket dan kehadiran" }).getAttribute("aria-selected"), "true");
  await page.getByText(/QR dikirim per acara/).waitFor();
  const panelAfter = (await page.getByRole("tabpanel").first().boundingBox()).height;
  assert.ok(Math.abs(panelAfter - panelBefore) < 120, `panel height stays close (${panelBefore} vs ${panelAfter})`);

  // FAQ: categories, one open at a time, honest answers.
  const faqTabs = page.getByRole("tablist", { name: "Kategori pertanyaan" });
  await faqTabs.scrollIntoViewIfNeeded();
  const first = page.getByRole("button", { name: "Apa itu PartnerHub?" });
  const second = page.getByRole("button", { name: /Apakah PartnerHub menjual tiket/ });
  await first.click();
  assert.equal(await first.getAttribute("aria-expanded"), "true");
  await second.click();
  assert.equal(await first.getAttribute("aria-expanded"), "false", "only one open");
  assert.equal(await second.getAttribute("aria-expanded"), "true");
  await page.getByText(/tidak memproses pembayaran/).waitFor();
  await faqTabs.getByRole("tab", { name: "Sponsorship" }).click();
  await page.getByRole("button", { name: /Apa bedanya proposal dan permintaan sponsor/ }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Apa itu PartnerHub?" }).count(), 0);

  // No invented social proof: scenarios are labelled as examples and carry no quotes or person names.
  await page.getByText(/Skenario contoh, bukan testimoni pengguna/).waitFor();
  assert.equal(await page.locator("blockquote").count(), 0, "no quotations");

  // Footer: real destinations only.
  const footer = page.locator("footer");
  for (const [name, href] of [["Tentang", "/about"], ["Kontak", "/contact"], ["Harga", "/pricing"], ["Syarat & Ketentuan", "/terms"], ["Kebijakan Privasi", "/privacy"]]) {
    assert.equal(await footer.getByRole("link", { name, exact: true }).first().getAttribute("href"), href);
  }
  await page.screenshot({ path: path.join(output, "landing-footer-1440.png"), fullPage: false });

  // Marquee only animates while visible and pauses on hover.
  const cloud = page.getByRole("group", { name: "Jenis organisasi pengguna" });
  await cloud.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[role=group][aria-label="Jenis organisasi pengguna"]').dataset.running === "true");
  await cloud.hover();
  assert.equal(await cloud.locator("> div").evaluate((el) => getComputedStyle(el).animationPlayState), "paused", "pauses on hover");
  await jump(99999);
  await page.waitForFunction(() => document.querySelector('[role=group][aria-label="Jenis organisasi pengguna"]').dataset.running === "false");

  // Info pages are real and honest.
  for (const [route, heading, notice] of [["/about", "Tentang PartnerHub", /dalam pengembangan/], ["/contact", "Kontak", /belum ditetapkan/], ["/pricing", "Harga", /belum ditetapkan/]]) {
    await go(route);
    await page.getByRole("heading", { name: heading, level: 1 }).waitFor();
    await page.getByText(notice).first().waitFor();
    await noOverflow(route);
  }

  // Mobile: hamburger menu, no overflow, 44px targets, menu closes on Escape with focus returned.
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await go("/");
    await page.getByRole("heading", { name: /Satu ruang kerja/, level: 1 }).waitFor();
    await noOverflow(`landing ${width}`);
    await scrollThrough();
    await page.waitForTimeout(400);
    await noOverflow(`landing ${width} after scroll`);
    const menu = page.getByRole("button", { name: "Buka menu" });
    assert.ok((await menu.boundingBox()).width >= 44, "menu button target");
    await menu.click();
    await page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: "Cara kerja" }).waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("navigation", { name: "Menu" }).count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Buka menu");
    await page.screenshot({ path: path.join(output, `landing-${width}.png`), fullPage: true });
  }

  // Reduced motion: no entrance animation, marquees become static lists, animated demos stop, all content stays.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await go("/");
  assert.equal(await page.locator("h1").evaluate((el) => getComputedStyle(el).animationName), "none", "hero does not animate");
  assert.equal(await page.locator('[data-static="true"]').count() > 0, true, "marquees are static");
  assert.equal(await page.locator('[data-reveal="hidden"]').count(), 0, "nothing starts hidden");
  await page.getByText(/Catatan untuk pelamar/).scrollIntoViewIfNeeded();
  await page.getByText(/masuk ke grup WhatsApp panitia dan hadir di rapat perdana/).first().waitFor();
  const feedBefore = await page.getByRole("list", { name: "Contoh aktivitas terbaru" }).innerText();
  await page.waitForTimeout(3200);
  assert.equal(await page.getByRole("list", { name: "Contoh aktivitas terbaru" }).innerText(), feedBefore, "feed does not cycle");
  await page.screenshot({ path: path.join(output, "landing-reduced-1440.png"), fullPage: true });

  assert.deepEqual(errors, []);
  console.log("PASS landing: sticky blur nav, hero + preview, marquees (visibility, hover, static), toggles, timeline, workflow text states, tabs (keyboard), one-at-a-time FAQ, honest copy, footer routes, info pages, mobile menu 390/320, reduced motion; no page errors.");
} finally { await browser.close(); }

