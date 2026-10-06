import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { loadTs } from "../helpers/load-ts.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://localhost:3113";
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/frontend-redesign");
await mkdir(output, { recursive: true });
// Reuse labelled fixtures only in the browser test. Production never receives these responses.
const db = loadTs("src/mocks/demo/seed.ts").seed();
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const exceptions = [];
page.on("pageerror", error => exceptions.push(error.message));
let role = null;
let status = "active";
let onboarding = false;
let empty = false;
let failLists = false;

await context.route("**/api/**", route => {
  const endpoint = new URL(route.request().url()).pathname;
  const account = db.accounts.find(item => item.role === role && (status === "active" ? item.status === "active" : item.status === "pending_verification"));
  const json = (data, code = 200) => route.fulfill({ status: code, contentType: "application/json", body: JSON.stringify(data) });
  if (endpoint === "/api/auth/session") return account ? json({ account: { id: account.id, email: account.email, displayName: account.fullName, role, status }, emailVerified: true, onboardingComplete: !onboarding, expiresAt: new Date(Date.now() + 3600000).toISOString() }) : json({ error: { code: "UNAUTHENTICATED" } }, 401);
  if (failLists) return json({ error: { code: "TEST_FAILURE" } }, 503);
  if (endpoint === "/api/accounts/me/verification") return json({ status, submittedAt: account.submittedAt, summary: account.summary, documents: account.documents, reviewNote: status === "rejected" ? "Test-only review note" : null });
  if (endpoint === "/api/events") return json({ items: empty ? [] : db.events.filter(item => item.ownerId === account.id) });
  if (endpoint.startsWith("/api/events/")) return json(db.events.find(item => item.id === endpoint.split("/")[3]));
  if (endpoint === "/api/organizer/summary") return json({ events: empty ? [] : db.events.filter(item => item.ownerId === account.id).map(item => ({ eventId: item.id, title: item.title, status: item.status, registered: db.baseRegistered[item.id] || 0, capacity: item.capacity })) });
  if (endpoint === "/api/me/notifications") return json({ items: empty ? [] : db.notifications.filter(item => item.ownerId === account.id) });
  if (endpoint === "/api/public/events") return json({ items: empty ? [] : db.events.filter(item => item.status === "PUBLISHED").map(item => ({ ...item, organizationName: item.branding.organizationName, registeredCount: db.baseRegistered[item.id] || 0 })) });
  if (endpoint === "/api/me/registrations") return json({ items: empty ? [] : db.registrations.filter(item => item.ownerId === account.id).map(item => ({ ...item, event: db.events.find(event => event.id === item.eventId) })) });
  if (endpoint === "/api/sponsor/proposals") return json({ items: empty ? [] : db.proposals.filter(item => item.ownerId === account.id) });
  if (endpoint === "/api/sponsor/sponsorships") return json({ items: empty ? [] : db.sponsorships.filter(item => item.ownerId === account.id) });
  if (endpoint === "/api/sponsor/offers") return json({ items: empty ? [] : (db.offers || []).filter(item => item.sponsorId === account.id) });
  return json({ error: { code: "TEST_UNHANDLED_ROUTE" } }, 404);
});

const views = [
  ["landing", "/", null], ["about", "/about", null], ["contact", "/contact", null], ["pricing", "/pricing", null], ["login", "/login", null], ["forgot", "/forgot-password", null],
  ["reset", "/reset-password?token=test-only", null], ["verify", "/verify-email", null],
  ["role-picker", "/register", null], ["organizer-signup", "/register?role=organizer", null],
  ["sponsor-signup", "/register?role=sponsor", null], ["user-signup", "/register?role=user", null],
  ["organizer", "/organizer", "organizer"], ["user", "/me", "user"], ["sponsor", "/sponsor", "sponsor"],
  ["proposal", "/sponsor/proposals/new", "sponsor"], ["event-detail", "/events/demo-event-1", "organizer"],
  ["event-new", "/events/new", "organizer"], ["event-edit", "/events/demo-event-4/edit", "organizer"],
  ["settings", "/settings", "organizer"], ["pending", "/account/verification", "organizer", "pending_verification"],
  ["rejected", "/account/verification", "organizer", "rejected"],
  ["onboarding-organizer", "/onboarding", "organizer"], ["onboarding-user", "/onboarding", "user"], ["onboarding-sponsor", "/onboarding", "sponsor"],
  ["terms", "/terms", null], ["privacy", "/privacy", null], ["not-found", "/missing-page", null],
];
// The existing verification loader is inline and refetches on render; network-idle is not its readiness signal.
const go = route => page.goto(`${base}${route}`, { waitUntil: route.startsWith("/account/verification") ? "domcontentloaded" : "networkidle" });
const noOverflow = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label);

try {
  for (const width of [320, 390, 900, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const [name, route, viewRole, viewStatus = "active"] of views) {
      role = viewRole; status = viewStatus; onboarding = route === "/onboarding";
      // Each signup view starts with a fresh draft so the role-query fixture stays predictable.
      await page.goto(`${base}/privacy`, { waitUntil: "networkidle" });
      await page.evaluate(() => sessionStorage.clear());
      await go(route);
      await page.locator("h1").first().waitFor();
      await noOverflow(`${name}: ${width}px`);
      assert.equal(await page.locator("h1").count(), 1, `${name}: one main heading`);
      // Below 960px the sidebar is a closed drawer (visibility hidden), so check the element itself rather than its role.
      const organizerShell = page.locator("aside#organizer-sidebar");
      if (["organizer", "event-detail", "event-new", "event-edit", "settings"].includes(name)) {
        await organizerShell.waitFor({ state: "attached" });
        assert.equal(await organizerShell.locator('a[href="/settings"]').count(), 1, `${name}: Settings link in the sidebar; profile menu stays closed`);
        assert.equal(await organizerShell.isVisible(), width > 960, `${name}: sidebar visible only on desktop widths (${width}px)`);
        assert.equal(await page.locator("header").getByRole("link", { name: "Profil & pengaturan" }).count(), 0, `${name}: no profile in the top bar`);
      } else {
        assert.equal(await organizerShell.count(), 0, `${name}: normal website frame`);
      }
      if (name === "sponsor") {
        const catalog = page.getByRole("region", { name: "Acara untuk kamu dukung" });
        await catalog.getByRole("heading", { level: 3 }).first().waitFor();
        assert.equal(await catalog.getByRole("link", { name: "Ajukan dukungan" }).count(), 0, `${name}: no support action on the card itself`);
        await catalog.getByRole("button", { name: /^Detail / }).first().waitFor();
      }
      if (name === "terms" || name === "privacy") {
        const back = page.getByRole("link", { name: "Kembali ke beranda", exact: true });
        assert.equal(await back.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(22, 39, 72)", `${name}: server page button styles`);
        assert.ok((await back.boundingBox()).height >= 44, `${name}: touch target`);
      }
      await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
    }
  }
  onboarding = false; status = "active";
  for (const [viewRole, route] of [["organizer", "/organizer"], ["user", "/me"], ["sponsor", "/sponsor"]]) {
    role = viewRole; empty = true; await go(route); await noOverflow(`${viewRole}: empty`);
    await page.screenshot({ path: path.join(output, `${viewRole}-empty.png`), fullPage: true });
    empty = false; failLists = true; await go(route); await page.getByRole("alert").first().waitFor();
    await noOverflow(`${viewRole}: error`); await page.screenshot({ path: path.join(output, `${viewRole}-error.png`), fullPage: true });
    failLists = false;
  }
  role = "organizer"; await page.setViewportSize({ width: 320, height: 950 }); await go("/events/new");
  const local = page.locator("details").filter({ hasText: "Salinan lokal di browser" });
  await local.locator("summary").focus(); await page.keyboard.press("Enter"); assert.equal(await local.getAttribute("open"), "");
  await page.getByRole("button", { name: /2\s*Waktu & tempat/ }).click(); await page.getByLabel("Registrasi dibuka").waitFor();
  await noOverflow("editor schedule: 320px"); await page.screenshot({ path: path.join(output, "editor-schedule-320.png"), fullPage: true });
  await page.getByRole("button", { name: "Lihat preview", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Tutup preview", exact: true }).getAttribute("aria-expanded"), "true");
  const order = await page.evaluate(() => { const form = document.querySelector("form"); const preview = document.querySelector('aside[aria-label="Preview event langsung"]'); return form.getBoundingClientRect().y < preview.getBoundingClientRect().y && Boolean(form.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING); });
  assert.equal(order, true, "mobile visual order matches DOM order");
  role = "sponsor"; await go("/sponsor"); const detail = page.locator("details").first();
  await detail.locator("summary").focus(); await page.keyboard.press("Enter"); assert.equal(await detail.getAttribute("open"), "");
  await noOverflow("proposal detail: 320px");
  await page.emulateMedia({ reducedMotion: "reduce" }); role = "organizer"; await go("/events/new");
  assert.equal(await page.getByRole("button", { name: "Lanjutkan", exact: true }).evaluate(el => getComputedStyle(el).transitionDuration), "0s");
  role = "sponsor"; await go("/sponsor");
  await page.getByRole("button", { name: /^Detail / }).first().click();
  const eventDialog = page.getByRole("dialog");
  await eventDialog.waitFor();
  for (const heading of ["Tentang acara", "Penyelenggara"]) await eventDialog.getByRole("heading", { name: heading, level: 3 }).waitFor();
  await noOverflow("event dialog: 320px");
  await page.keyboard.press("Escape");
  await eventDialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: /^Detail / }).first().click();
  await page.getByRole("dialog").getByRole("link", { name: "Ajukan dukungan", exact: true }).click();
  await page.waitForURL("**/sponsor/proposals/new");
  await page.getByLabel("Acara", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Acara", { exact: true }).inputValue(), "", "existing proposal form requires event selection");
  role = "organizer"; await go("/organizer");
  // The viewport is 320px here, so the sidebar is a drawer: open it before using its links.
  await page.getByRole("button", { name: "Buka menu" }).click();
  await page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Settings", exact: true }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("button", { name: "Simpan profil", exact: true }).waitFor();
  await page.getByRole("link", { name: "Langsung ke konten" }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content", "organizer skip link focuses main");
  role = null; await go("/");
  await page.getByRole("link", { name: "Lihat cara kerja", exact: true }).click();
  await page.waitForURL("**/#fitur");
  await page.getByRole("link", { name: /^Ikuti acaranya/ }).click();
  await page.waitForURL("**/register?role=user");
  assert.deepEqual(exceptions, []);
  console.log("PASS frontend-redesign: 100 route/viewport combinations, empty/error dashboards, one H1, keyboard disclosures, schedule grouping, mobile DOM/visual order, reduced motion; no page exceptions. API data is test-only.");
} finally { await browser.close(); }
