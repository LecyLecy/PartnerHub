import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = path.resolve(".impeccable/delivery/workspace-navigation");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(`${base}${route}`, { waitUntil: "networkidle" });
const sidebar = () => page.locator("#workspace-sidebar");
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function role(value, destination) {
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption(value);
  await page.waitForURL(`**${destination}`); await page.waitForLoadState("networkidle");
}
async function headerSignature() {
  await page.locator('header nav[aria-label="Navigasi utama"]').waitFor();
  return page.locator('header nav[aria-label="Navigasi utama"]').getByRole("link").evaluateAll(links => links.map(link => ({ label: link.textContent, href: link.getAttribute("href") })));
}
async function follow(label, route, heading) {
  if (await page.getByRole("button", { name: "Buka menu", exact: true }).isVisible()) await page.getByRole("button", { name: "Buka menu", exact: true }).click();
  await sidebar().getByRole("link", { name: label, exact: true }).click();
  await page.waitForURL(`**${route}`);
  if (heading) await page.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor();
  assert.equal(await sidebar().locator('a[aria-current="page"]').count(), 1);
  assert.equal(await sidebar().getByRole("link", { name: label, exact: true, includeHidden: true }).getAttribute("aria-current"), "page");
}
async function screenshot(name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: no page overflow`);
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
}
try {
  await go("/"); const publicNavigation = await headerSignature();
  assert.deepEqual(publicNavigation.map(item => item.label), ["Jelajahi event", "Cara kerja", "Harga", "Tentang"]);
  for (const [label, route] of [["Jelajahi event", "/explore"], ["Tentang", "/about"], ["Cara kerja", "/#fitur"], ["Harga", "/pricing"]]) {
    await page.locator('header nav[aria-label="Navigasi utama"]').getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(`${base}${route}`); await page.waitForLoadState("networkidle");
    assert.deepEqual(await headerSignature(), publicNavigation, `stable header after ${label}`);
  }
  for (const route of ["/guide", "/login", "/contact", "/terms", "/privacy"]) { await go(route); assert.deepEqual(await headerSignature(), publicNavigation); }
  const surfaces = await page.evaluate(() => [document.querySelector("header"), document.querySelector("main"), document.querySelector("footer")].map(element => ({ color: getComputedStyle(element).backgroundColor, border: getComputedStyle(element).borderTopWidth })));
  assert.notEqual(surfaces[2].color, surfaces[0].color);
  await screenshot("guest");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/explore", "/about"]) {
      await go(route);
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      const menu = page.getByRole("navigation", { name: "Menu", exact: true });
      for (const label of ["Jelajahi event", "Cara kerja", "Harga", "Tentang", "Masuk", "Daftar"]) await menu.getByRole("link", { name: label, exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("button", { name: "Buka menu", exact: true }).getAttribute("aria-expanded"), "false");
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await role("organizer", "/organizer");
  assert.ok((await sidebar().boundingBox()).width > 200);
  await go("/events/demo-event-1/scan");
  await page.getByLabel("Mode presensi", { exact: true }).selectOption("ENTRY");
  await page.getByRole("button", { name: "Buka kamera", exact: true }).waitFor();
  await go("/organizer");
  const baseline = await stored();
  assert.equal(await sidebar().getByRole("link", { name: "Riwayat transaksi", exact: true }).count(), 0);
  await page.getByRole("button", { name: /^Menu akun/ }).click();
  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  await page.getByRole("link", { name: "Riwayat transaksi", exact: true }).click();
  await page.waitForURL("**/organizer/transactions");
  assert.equal(await sidebar().getByRole("link", { name: "Tim", exact: true }).count(), 0);
  assert.equal(await sidebar().getByRole("link", { name: "Ringkasan event", exact: true }).count(), 0);
  for (const legacy of ["/organizer/team", "/organizer/overview"]) {
    await go(legacy); await page.waitForURL("**/organizer");
  }
  await go("/organizer/subscription?event=demo-event-1");
  await page.waitForURL("**/events/demo-event-1/package");
  await follow("Proposal masuk", "/organizer/sponsorship", "Proposal masuk");
  assert.equal(await page.getByRole("heading", { name: "Permintaan terkirim", exact: true }).count(), 0);
  await follow("Ajakan sponsor", "/organizer/sponsorship/requests", "Ajakan sponsor");
  assert.equal(await page.getByRole("heading", { name: "Proposal masuk", exact: true }).count(), 0);
  await go("/events/demo-event-1");
  assert.equal(await page.getByRole("button", { name: "Simpan pengelola", exact: true }).count(), 0);
  const roleLinks = await sidebar().locator('nav[aria-label="Navigasi utama"] a').evaluateAll(links => links.map(link => link.getAttribute("href")));
  assert.ok(!roleLinks.some(href => href.startsWith("/events/demo-event-1") || href === "/settings"));
  for (const [suffix, current] of [["", "Ringkasan acara"], ["/registration", "Pendaftaran"], ["/committee/stages", "Kelola panitia"], ["/qr", "QR tiket"], ["/scan", "Presensi"], ["/sponsors", "Ajak sponsor"], ["/report", "Ringkasan acara"], ["/package", "Ringkasan acara"], ["/team", "Pengelola"], ["/edit", "Ringkasan acara"]]) {
    await go("/events/demo-event-1" + suffix);
    const eventNavigation = page.getByRole("navigation", { name: "Navigasi acara", exact: true });
    await eventNavigation.waitFor();
    assert.equal(await eventNavigation.locator('a[aria-current="page"]').innerText(), current);
    assert.deepEqual(await sidebar().locator('nav[aria-label="Navigasi utama"] a').evaluateAll(links => links.map(link => link.getAttribute("href"))), roleLinks);
    assert.equal(await page.getByRole("button", { name: "Pencarian cepat", exact: true }).count(), 0);
    assert.ok(await eventNavigation.evaluate(el => Boolean(el.closest("main"))));
  }
  await go("/events/demo-event-1");
  await screenshot("event-navigation-desktop");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const eventNavigation = page.getByRole("navigation", { name: "Navigasi acara", exact: true });
    assert.equal(await eventNavigation.getByRole("link", { name: /Paket acara|Laporan & bukti|Edit detail/ }).count(), 0);
    const managerLink = eventNavigation.getByRole("link", { name: "Pengelola", exact: true });
    await managerLink.focus();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/events/demo-event-1/team");
    await page.getByRole("heading", { level: 1, name: "Pengelola acara", exact: true }).waitFor();
    assert.equal(await eventNavigation.getByRole("link", { name: "Pengelola", exact: true }).getAttribute("aria-current"), "page");
    await screenshot("event-navigation-" + width);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("navigation", { name: "Navigasi acara", exact: true }).getByRole("link", { name: "Pengelola", exact: true }).click();
  await page.waitForURL("**/events/demo-event-1/team");
  assert.deepEqual(await sidebar().locator('nav[aria-label="Navigasi utama"] a').evaluateAll(links => links.map(link => link.getAttribute("href"))), roleLinks);
  await page.getByRole("heading", { name: "Akses pengelola acara", exact: true }).waitFor();
  await go("/organizer"); await screenshot("organizer");
  const afterReads = await stored();
  for (const field of ["events", "registrations", "applications", "offers"]) assert.deepEqual(afterReads[field], baseline[field], `navigation preserves ${field}`);
  assert.deepEqual(afterReads.eventBilling.orders, baseline.eventBilling.orders);
  await role("sponsor", "/sponsor");
  await page.getByRole("list", { name: "Rekomendasi event", exact: true }).waitFor();
  assert.equal(await page.getByRole("list", { name: "Acara untuk didukung", exact: true }).count(), 0);
  await follow("Semua event", "/sponsor/events", "Semua event");
  assert.equal(await page.getByRole("heading", { name: "Rekomendasi event untuk perusahaanmu", exact: true }).count(), 0);
  await follow("Permintaan masuk", "/sponsor/progress", "Permintaan masuk");
  assert.equal(await page.getByRole("heading", { name: "Manfaat sponsor", exact: true }).count(), 0);
  await follow("Proposal saya", "/sponsor/progress/proposals", "Proposal saya");
  assert.equal(await page.getByRole("heading", { name: "Permintaan dari penyelenggara", exact: true }).count(), 0);
  await follow("Benefit & bukti", "/sponsor/progress/benefits", "Benefit & bukti");
  await follow("Bidang & minat", "/sponsor/preferences", "Bidang & minat");
  await page.getByRole("heading", { name: "Bidang perusahaan", exact: true }).waitFor();
  await screenshot("sponsor");
  await role("user", "/me");
  await follow("Tiket saya", "/me/events", "Tiket saya");
  assert.equal(await page.getByRole("heading", { name: "Kepanitiaan", exact: true }).count(), 0);
  await follow("Lamaran saya", "/me/applications", "Lamaran saya");
  assert.equal(await page.getByRole("heading", { name: "Tiket", exact: true }).count(), 0);
  await follow("Lowongan", "/committee", "Jadi panitia.");
  await screenshot("participant");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [value, destination, link, route, heading] of [["organizer", "/organizer", "Subscription", "/organizer/subscription", "Subscription"], ["sponsor", "/sponsor", "Proposal saya", "/sponsor/progress/proposals", "Proposal saya"], ["user", "/me", "Lamaran saya", "/me/applications", "Lamaran saya"]]) {
      await role(value, destination); await follow(link, route, heading);
      await screenshot(`${value}-${width}`);
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      const accountButton = sidebar().getByRole("button", { name: /^Menu akun/ });
      await accountButton.focus(); await page.keyboard.press("Tab");
      assert.equal(await page.evaluate(() => document.activeElement?.closest("#workspace-sidebar") !== null), true);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Buka menu");
      assert.equal(await page.getByRole("button", { name: "Buka menu", exact: true }).getAttribute("aria-expanded"), "false");
    }
  }
  assert.deepEqual(errors, []);
  console.log("PASS navigation: stable guest header, all-role sidebar, independent subsection routes, exact active trail, legacy deep links, record preservation, distinct surfaces and accessible 390/320px drawers.");
} catch (error) { await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }); throw error; }
finally { await browser.close(); }
