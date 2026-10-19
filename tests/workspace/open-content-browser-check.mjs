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
const go = async route => {
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
};
const stored = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("partnerhub:demo:v3")));
async function assertOpenContent() {
  assert.equal(await page.locator("main details, main summary").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
try {
  await mkdir(".impeccable/open-content", { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await go("/");
    const faq = page.getByRole("region", { name: "Bagaimana biaya untuk penyelenggara?", exact: true });
    assert.equal(await faq.locator("p").isVisible(), true);
    await assertOpenContent();
    await go("/guide");
    assert.equal(await page.getByRole("heading", { name: "Siapa yang membayar?", exact: true }).isVisible(), true);
    await assertOpenContent();
  }
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption("organizer");
  await page.waitForURL("**/organizer");
  const before = await stored();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await go("/events/demo-event-4");
    await page.getByRole("region", { name: "Unggah acara", exact: true }).waitFor();
    const status = await page.getByText("Perlu dilengkapi", { exact: true }).boundingBox();
    const title = await page.getByRole("heading", { level: 1 }).boundingBox();
    assert.ok(Math.abs(status.x - title.x) < 2, "status text aligns with the title");
    const checklist = page.getByRole("list", { name: "Bagian yang perlu dilengkapi", exact: true });
    assert.deepEqual(await checklist.locator("li").allTextContents(), ["Jadwal acara", "Lokasi acara", "Kapasitas peserta", "Periode pendaftaran"]);
    const sections = [];
    for (const name of ["Detail acara", "Jadwal dan lokasi", "Pendaftaran", "Identitas visual", "Konfigurasi modul"]) {
      const section = page.getByRole("region", { name, exact: true });
      assert.equal(await section.isVisible(), true, name + " is open");
      sections.push(await section.boundingBox());
    }
    for (let i = 1; i < sections.length; i++) assert.ok(sections[i].y >= sections[i - 1].y + sections[i - 1].height, "sections appear in sequence");
    assert.ok(Math.abs(sections[1].x - sections[2].x) < 2, "registration is aligned under schedule, not in a floating sidebar");
    assert.equal(await page.locator("main aside").count(), 0);
    assert.equal(await page.getByRole("button", { name: "Unggah acara", exact: true }).isDisabled(), true);
    await assertOpenContent();
    await page.getByRole("region", { name: "Identitas visual", exact: true }).scrollIntoViewIfNeeded();
    await page.waitForFunction(() => Array.from(document.querySelectorAll("main img")).every(image => image.complete && image.naturalWidth > 0));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `.impeccable/open-content/summary-${width}.png`, fullPage: true });
    for (const route of ["/events/demo-event-1", "/events/demo-event-1/team", "/events/demo-event-1/package", "/events/demo-event-1/sponsors", "/events/demo-event-1/committee"]) {
      await go(route);
      await assertOpenContent();
    }
    await go("/events/demo-event-1/team");
    assert.equal(await page.getByRole("button", { name: "Simpan pengelola", exact: true }).isVisible(), true);
    await go("/events/demo-event-1/sponsors");
    assert.equal(await page.getByRole("button", { name: "Simpan bidang", exact: true }).count(), 0);
    assert.equal(await page.getByRole("heading", { name: "Siapkan ajakan sponsor", exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Jelajahi sponsor lain", exact: true }).isVisible(), true);
  }
  const after = await stored();
  for (const key of ["events", "registrations", "applications", "offers", "sponsorships", "eventBilling", "accountBilling"]) assert.deepEqual(after[key], before[key], "viewing sections preserves " + key);
  assert.deepEqual(errors, []);
  console.log("PASS open content: aligned status, concise checklist, sequential sections, open FAQ/managers/matching, unchanged records and 1440/390/320px without overflow.");
} finally { await browser.close(); }
