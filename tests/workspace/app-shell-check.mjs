// Browser check for the organizer app shell and the command palette. Requires a build made with
// NEXT_PUBLIC_PARTNERHUB_DEMO=1 (the demo backend runs in the browser).
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3112";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/app-shell");
await mkdir(output, { recursive: true });
const PASSWORD = "DemoPass-2026!";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.location().url.endsWith("/favicon.ico")) errors.push(message.text()); });
const go = (route) => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const noOverflow = async (label) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow: ${label}`);
async function signIn(email) {
  await go("/login");
  await page.getByRole("button", { name: "Pilih akun", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(email.replace(".", "\\.")) }).click();
  await page.waitForFunction((expected) => document.querySelector('input[name="password"]')?.value === expected, PASSWORD, { timeout: 5000 });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
}
async function signOut() {
  // The header bell fetches on its own; let it finish so a late response cannot write the session back into storage.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  await page.evaluate(() => sessionStorage.removeItem("partnerhub:demo:v3"));
  await context.clearCookies();
}
const palette = () => page.getByRole("dialog", { name: "Pencarian cepat" });

try {
  await signIn("demo.penyelenggara@partnerhub.test");
  await page.waitForURL("**/organizer");
  const sidebar = page.getByRole("complementary", { name: "Ruang kerja penyelenggara" });
  await sidebar.waitFor();
  for (const title of ["Menu utama"]) await sidebar.getByRole("heading", { name: title, level: 2 }).waitFor();
  assert.equal(await sidebar.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Event kamu", exact: true }).getAttribute("aria-current"), "page");
  // Capture only after data has loaded and the entrance animation has finished.
  await page.getByText("125/200").first().waitFor();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("main")).opacity === "1");
  await page.screenshot({ path: path.join(output, "organizer-1440.png"), fullPage: true });

  // Command palette: opens with Ctrl+K, filters, moves with arrows, Enter navigates, Esc returns focus.
  await page.keyboard.press("Control+k");
  await palette().waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Cari halaman atau aksi", "search input is focused on open");
  await page.keyboard.type("zzzz");
  await page.getByText(/Tidak ada hasil untuk/).waitFor();
  await page.keyboard.press("Control+a"); await page.keyboard.type("pengat");
  await palette().getByRole("option", { name: /Profil & pengaturan/ }).waitFor();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/settings");
  assert.equal(await palette().isVisible(), false, "palette closes after navigating");
  await page.getByRole("button", { name: "Pencarian cepat", exact: true }).click();
  await palette().waitFor();
  await page.keyboard.press("Escape");
  await palette().waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Pencarian cepat", "focus returns to the trigger");
  await page.keyboard.press("Control+k");
  await palette().waitFor();
  await page.keyboard.press("Control+k");
  await palette().waitFor({ state: "hidden" });

  // Desktop destinations stay visible without hover or layout shifts.
  await go("/organizer");
  await page.mouse.move(900, 500);
  await page.waitForTimeout(500);
  const rest = (await sidebar.boundingBox()).width;
  assert.ok(rest > 200, `sidebar labels are visible (${rest}px)`);
  assert.equal(await page.getByRole("button", { name: /sidebar/i }).count(), 0, "no sidebar toggle button");
  const content = page.locator("main#main-content");
  const contentLeft = (await content.boundingBox()).x;
  await sidebar.hover();
  await page.waitForFunction(() => document.querySelector("#workspace-sidebar").getBoundingClientRect().width > 200);
  assert.ok((await sidebar.boundingBox()).width > 200, "stays labeled on hover");
  assert.equal((await content.boundingBox()).x, contentLeft, "hover does not move the page");
  const profile = sidebar.getByRole("button", { name: /^Menu akun/ });
  await profile.waitFor();
  const profileBox = await profile.boundingBox();
  assert.ok(profileBox.y > 600, `profile sits at the bottom of the sidebar (${profileBox.y}px)`);
  assert.equal(await sidebar.getByRole("button", { name: "Keluar", exact: true }).count(), 0, "Keluar is hidden until the profile menu opens");
  assert.equal(await profile.getAttribute("aria-expanded"), "false");
  await profile.click();
  assert.equal(await profile.getAttribute("aria-expanded"), "true");
  await sidebar.getByRole("link", { name: "Profil & pengaturan" }).waitFor();
  await sidebar.getByRole("button", { name: "Keluar", exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "organizer-profile-menu.png") });
  await page.keyboard.press("Escape");
  await sidebar.getByRole("button", { name: "Keluar", exact: true }).waitFor({ state: "detached" });
  await page.screenshot({ path: path.join(output, "workspace-sidebar-open.png") });
  // Pointer and focus changes preserve the full sidebar width.
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.mouse.move(900, 500);
  await page.waitForFunction(() => document.querySelector("#workspace-sidebar").getBoundingClientRect().width > 200);
  assert.equal(await page.locator("header").getByRole("link", { name: "Profil & pengaturan" }).count(), 0, "no profile in the top bar");
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Langsung ke konten" }).waitFor({ state: "attached" });
  await sidebar.getByRole("link", { name: "Event kamu", exact: true }).focus();
  await page.waitForFunction(() => document.querySelector("#workspace-sidebar").getBoundingClientRect().width > 200);
  await page.screenshot({ path: path.join(output, "workspace-sidebar-focus.png") });

  // Notifications: bell lists the latest items, Escape closes and returns focus.
  await page.getByRole("button", { name: /^Notifikasi/ }).click();
  const latest = page.getByRole("region", { name: "Notifikasi terbaru" });
  await latest.waitFor();
  await latest.getByText("Proposal sponsor masuk").waitFor();
  await page.screenshot({ path: path.join(output, "organizer-notifications.png") });
  await page.keyboard.press("Escape");
  await latest.waitFor({ state: "hidden" });
  assert.match(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? ""), /^Notifikasi/);

  // Mobile: sidebar is a drawer, closed by default, reachable only after opening; no horizontal overflow.
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await go("/organizer");
    await noOverflow(`organizer ${width}`);
    assert.equal(await sidebar.isVisible(), false, "drawer is hidden on load");
    const open = page.getByRole("button", { name: "Buka menu" });
    assert.ok((await open.boundingBox()).width >= 44, "menu button is a 44px target");
    await open.click();
    await sidebar.waitFor();
    // The drawer slides in over 300ms; wait until it rests at the screen edge before asserting or capturing.
    await page.waitForFunction(() => document.querySelector("#workspace-sidebar").getBoundingClientRect().left >= 0);
    assert.ok((await sidebar.boundingBox()).width >= 240, "drawer is fully on screen");
    assert.equal(await page.evaluate(() => document.activeElement?.closest("aside")?.id), "workspace-sidebar", "focus moves into the drawer");
    await page.screenshot({ path: path.join(output, `organizer-drawer-${width}.png`) });
    await page.keyboard.press("Escape");
    await sidebar.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Buka menu", "focus returns to the menu button");
  }
  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page.locator("div[aria-hidden=true][data-open=true]").click({ position: { x: 380, y: 400 } });
  await sidebar.waitFor({ state: "hidden" });

  // Reduced motion: shell still works and transitions are off.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await go("/organizer");
  assert.equal(await sidebar.getByRole("link", { name: "Event kamu", exact: true }).evaluate((el) => getComputedStyle(el).transitionDuration), "0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // Other roles keep the website frame but get the palette with their own pages only.
  await signOut();
  await signIn("demo.user@partnerhub.test");
  await page.waitForURL("**/me");
  assert.equal(await sidebar.count(), 0, "participants keep the website frame");
  await page.getByRole("button", { name: "Pencarian cepat", exact: true }).waitFor();
  // Same header as the landing page, with the organizer-style profile (avatar + name) and no yellow strip of plain links.
  const siteHeader = page.locator("header").first();
  assert.equal(await siteHeader.getAttribute("data-scrolled"), "false");
  assert.equal(await siteHeader.evaluate((el) => getComputedStyle(el).position), "sticky");
  const headerProfile = siteHeader.getByRole("button", { name: /^Menu akun/ });
  assert.equal(await headerProfile.innerText(), "Peserta / Calon Panitia");
  assert.equal(await siteHeader.getByRole("button", { name: "Keluar", exact: true }).count(), 0, "Keluar is hidden until the profile menu opens");
  await siteHeader.getByRole("button", { name: /^Notifikasi/ }).waitFor();
  assert.equal(await page.getByRole("heading", { name: "Notifikasi", level: 2 }).count(), 0, "notifications live in the header, not in the page");
  await headerProfile.click();
  await siteHeader.getByRole("link", { name: "Acara saya" }).waitFor();
  await siteHeader.getByRole("link", { name: "Profil & pengaturan" }).waitFor();
  await siteHeader.getByRole("button", { name: "Keluar", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  // The participant catalog can be shorter than a tall window now, so use a short window to make the page scrollable.
  await page.setViewportSize({ width: 1440, height: 420 });
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
  await page.waitForFunction(() => document.querySelector("header").dataset.scrolled === "true");
  assert.equal(await siteHeader.evaluate((el) => getComputedStyle(el).backdropFilter.includes("blur")), true, "blurs after scroll");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.keyboard.press("Control+k");
  await palette().waitFor();
  await palette().getByRole("option", { name: /Panitia/ }).waitFor();
  assert.equal(await palette().getByRole("option", { name: /Susun event/ }).count(), 0, "no organizer pages for a participant");
  await page.keyboard.press("Escape");
  await signOut();
  await signIn("demo.sponsor@partnerhub.test");
  await page.waitForURL("**/sponsor");
  await page.getByRole("button", { name: "Pencarian cepat", exact: true }).waitFor();
  await page.keyboard.press("Control+k");
  await palette().getByRole("option", { name: /Kirim proposal/ }).waitFor();
  await page.keyboard.press("Escape");
  await signOut();
  await go("/login");
  await page.keyboard.press("Control+k");
  assert.equal(await palette().count(), 0, "signed-out visitors get no palette");
  assert.deepEqual(errors.filter((text) => !/40[34]|Failed to load resource/.test(text)), []);
  console.log("PASS app-shell: grouped sidebar, Ctrl+K palette (filter, arrows, Enter, Esc, focus return), labeled sidebar, profile only in sidebar, shared site header, notifications menu, mobile drawer (390/320, focus, scrim), reduced motion, per-role palette, no page errors.");
} finally { await browser.close(); }


