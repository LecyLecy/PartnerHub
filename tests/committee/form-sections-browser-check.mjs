import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3132";
const output = ".impeccable/committee-sections";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const go = route => page.goto(base + route, { waitUntil: "networkidle" });
const groupNames = ["Kebutuhan panitia", "Divisi yang dibuka", "Tahapan seleksi", "Pertanyaan tambahan"];

try {
  await mkdir(output, { recursive: true });
  await go("/guide");
  await page.getByLabel("Ganti peran demo", { exact: true }).selectOption("organizer");
  await page.waitForURL("**/organizer");
  await go("/events/demo-event-1/committee");
  await page.getByRole("heading", { name: "Lowongan", exact: true }).waitFor();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    let previousBottom = 0;
    for (const name of groupNames) {
      const section = page.getByRole("region", { name, exact: true });
      const geometry = await section.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const heading = getComputedStyle(element.querySelector("h3"));
        return { top: rect.top + scrollY, bottom: rect.bottom + scrollY, border: parseFloat(style.borderTopWidth), headingBorder: parseFloat(heading.borderBottomWidth) };
      });
      assert.ok(geometry.border >= 1 && geometry.headingBorder >= 1, `${name}: visible section and heading borders`);
      assert.ok(geometry.top - previousBottom >= 16, `${name}: separate vertical spacing`);
      previousBottom = geometry.bottom;
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px: no overflow`);
    await page.screenshot({ path: `${output}/form-${width}.png`, fullPage: true });
  }
  const divisions = page.getByRole("region", { name: "Divisi yang dibuka", exact: true });
  const count = await divisions.getByRole("textbox").count();
  await divisions.getByRole("button", { name: "Tambah divisi", exact: true }).click();
  assert.equal(await divisions.getByRole("textbox").count(), count + 1);
  await divisions.getByRole("button", { name: `Hapus divisi ${count + 1}`, exact: true }).click();
  const description = page.getByLabel("Deskripsi kebutuhan", { exact: true });
  const originalDescription = await description.inputValue();
  await description.fill("Singkat");
  await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
  await page.getByText("Jelaskan kebutuhan panitia, minimal 20 karakter.", { exact: true }).waitFor();
  assert.equal(await description.evaluate(element => element === document.activeElement), true);
  await description.fill(originalDescription);
  const stages = page.getByRole("region", { name: "Tahapan seleksi", exact: true });
  const first = stages.getByLabel("Tahap 1", { exact: true });
  const second = stages.getByLabel("Tahap 2", { exact: true });
  const firstName = await first.inputValue();
  const secondName = await second.inputValue();
  await stages.getByRole("button", { name: "Turunkan tahap 1", exact: true }).click();
  assert.equal(await first.inputValue(), secondName);
  assert.equal(await second.inputValue(), firstName);
  await stages.getByRole("button", { name: "Naikkan tahap 2", exact: true }).click();
  await page.getByLabel("Pertanyaan untuk pelamar", { exact: false }).fill("Apa pengalaman kepanitiaanmu?");
  await page.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
  await page.getByText("Lowongan dibuka dan tampil untuk user.", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByLabel("Pertanyaan untuk pelamar", { exact: false }).inputValue(), "Apa pengalaman kepanitiaanmu?");
  assert.equal(await page.getByLabel("Deskripsi kebutuhan", { exact: true }).inputValue(), originalDescription);
  assert.equal(await divisions.getByRole("textbox").count(), count);
  assert.deepEqual(errors, []);
  console.log("PASS committee form: four separated sections, 1440/390/320px, add/remove division, stage ordering, validation/focus and save/reload.");
} finally {
  await browser.close();
}
