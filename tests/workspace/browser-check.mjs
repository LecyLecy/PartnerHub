import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const output = process.env.UI_REVIEW_DIR || path.resolve(".impeccable/review");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
const knownWarnings = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const url = message.location().url;
  if (url.endsWith("/favicon.ico") && message.text().includes("404"))
    knownWarnings.push("Existing app has no favicon.ico.");
  else errors.push(`${message.text()} (${url})`);
});
const overflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
const nav = () => page.getByRole("navigation", { name: "Workspace utama" });
const storedDraft = () =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("partnerhub-event-drafts", 1);
        open.onsuccess = () => {
          const db = open.result;
          const transaction = db.transaction("drafts", "readonly");
          const request = transaction.objectStore("drafts").get("current");
          transaction.oncomplete = () => {
            const value = request.result;
            db.close();
            resolve(
              value
                ? {
                    draft: value.draft,
                    eventLogoBytes: value.branding.eventLogo?.file.size,
                    organizationName: value.branding.organizationName,
                    sponsors: value.branding.sponsors.length,
                  }
                : null,
            );
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
        open.onerror = () => reject(open.error);
      }),
  );

try {
  await page.goto(process.env.UI_BASE_URL || "http://localhost:3000", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("heading", { name: /Ada ide/ }).waitFor();
  await page
    .getByRole("heading", { name: "Event berikutnya mulai di sini." })
    .waitFor();
  assert.equal(
    await page.getByText("Forum Kolaborasi Kampus", { exact: true }).count(),
    0,
  );
  await page.screenshot({
    path: path.join(output, "workspace-empty.png"),
    fullPage: true,
  });
  await page.locator("summary").click();
  await page
    .getByRole("combobox", { name: "Mode pratinjau" })
    .selectOption("demo");
  await page.locator("summary").click();
  assert.match(
    await page.locator("main").innerText(),
    /data demo, bukan aktivitas nyata/,
  );
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 900, 1000],
    ["mobile", 390, 844],
    ["narrow", 320, 800],
  ]) {
    await page.setViewportSize({ width, height });
    assert.equal(await overflow(), false, `no overflow at ${width}px`);
    await page.screenshot({
      path: path.join(output, `${name}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const search = page.getByRole("searchbox", { name: "Cari event contoh" });
  await search.fill("workshop");
  await page
    .getByRole("heading", { name: "Workshop Kepanitiaan", exact: true })
    .waitFor();
  await page
    .getByRole("group", { name: "Filter status event" })
    .getByRole("button", { name: "Terpublikasi", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Tidak ada event yang cocok." })
    .waitFor();
  await page.getByRole("button", { name: "Reset pencarian" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: /Belajar.*Workshop Kepanitiaan/ })
    .click();
  const selectedHeading = page.getByRole("heading", {
    name: "Workshop Kepanitiaan",
    exact: true,
  });
  await selectedHeading.waitFor();
  assert.equal(
    await selectedHeading.evaluate(
      (element) => element === document.activeElement,
    ),
    true,
  );
  assert.equal(
    await selectedHeading.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight;
    }),
    true,
    "stacked event selection reveals and focuses its context",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("button", { name: /Belajar.*Workshop Kepanitiaan/ })
    .click();
  await page
    .getByRole("heading", { name: "Workshop Kepanitiaan", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: /Temu.*Forum Kolaborasi Kampus/ })
    .click();
  await page.getByRole("button", { name: "Tinjau sponsor contoh" }).click();
  await page
    .getByRole("heading", { name: "Komitmen, bukan cuma logo." })
    .waitFor();
  await nav().getByRole("button", { name: "Event kamu" }).click();

  await page.getByRole("button", { name: "Lihat tanpa data" }).click();
  await page
    .getByRole("heading", { name: "Event berikutnya mulai di sini." })
    .waitFor();
  await page.locator("summary").click();
  const state = page.getByRole("combobox", { name: "Mode pratinjau" });
  await state.selectOption("demo");
  for (const [value, heading] of [
    ["loading", "Menyiapkan ruang kerjamu."],
    ["error", "Ruang kerja belum bisa dibuka."],
  ]) {
    await state.selectOption(value);
    await page.getByRole("heading", { name: heading }).waitFor();
    await page.getByRole("button", { name: "Kembali ke data demo" }).click();
  }
  await page.locator("summary").click();
  await page.getByRole("button", { name: "Penyimpanan & akses" }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").isVisible(), false);

  await page
    .getByRole("button", { name: "Susun event baru", exact: true })
    .first()
    .click();
  await page
    .getByRole("heading", { name: "Apa yang ingin kamu buat?" })
    .waitFor();
  await page.getByRole("button", { name: "Buka draft tersimpan" }).click();
  await page.getByText("Belum ada draft tersimpan di browser ini. Mulai dari ide kamu di bawah.").waitFor();
  assert.match(
    await page.locator("form").innerText(),
    /Belum ada draft tersimpan/,
  );
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page.getByText("Isi judul event, minimal 3 karakter.").waitFor();
  await page
    .getByRole("textbox", { name: /Nama event/ })
    .fill("Malam Kolaborasi Kampus");
  await page
    .getByRole("textbox", { name: /Ceritakan idenya/ })
    .fill("Diskusi dan pertemuan komunitas kampus, sebagai draft pengujian.");
  assert.equal(
    await page
      .getByRole("complementary", { name: "Preview event langsung" })
      .getByRole("heading", { name: "Malam Kolaborasi Kampus", exact: true })
      .count(),
    2,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(output, "event-desktop.png"),
    fullPage: true,
  });
  await nav().getByRole("button", { name: "Event kamu" }).click();
  await nav().getByRole("button", { name: "Susun event", exact: true }).click();
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    "Malam Kolaborasi Kampus",
  );
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page.getByText("Pilih tanggal event yang valid.").waitFor();
  await page.locator('[name="date"]').fill("2026-12-03");
  await page.locator('[name="startTime"]').fill("09:00");
  await page.locator('[name="endTime"]').fill("08:00");
  await page.locator('[name="venue"]').fill("Kampus contoh");
  await page.locator('[name="capacity"]').fill("120");
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page
    .getByText("Jam selesai harus setelah jam mulai (hari yang sama).")
    .waitFor();
  await page.locator('[name="endTime"]').fill("17:00");
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  await page
    .getByRole("heading", { name: "Beri eventmu identitas." })
    .waitFor();
  const image = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 60;
      const context = canvas.getContext("2d");
      context.fillStyle = "#162748";
      context.fillRect(0, 0, 100, 60);
      context.fillStyle = "#f5d765";
      context.font = "20px sans-serif";
      context.fillText("TEST", 22, 38);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  const upload = {
    name: "test-logo.png",
    mimeType: "image/png",
    buffer: image,
  };
  await page.getByLabel("Logo acara", { exact: true }).setInputFiles(upload);
  await page.getByRole("img", { name: "Logo acara di preview" }).waitFor();
  await page.getByLabel("Logo acara", { exact: true }).setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await page.getByText("Ukuran gambar maksimal 2 MB. Kecilkan file lalu coba lagi.").waitFor();
  await page
    .getByLabel("Logo acara", { exact: true })
    .setInputFiles({
      name: "invalid.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg/>"),
    });
  await page
    .getByText("Gunakan PNG, JPG, atau WebP. SVG dan GIF tidak didukung.")
    .waitFor();
  assert.equal(
    await page.getByRole("img", { name: "Logo acara di preview" }).count(),
    1,
  );
  await page
    .getByLabel("Logo acara", { exact: true })
    .setInputFiles({
      name: "bad.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    });
  await page
    .getByText("Gambar tidak bisa dibaca. Pilih file gambar yang valid.")
    .waitFor();
  await page.getByLabel("Logo acara", { exact: true }).setInputFiles(upload);
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'));
  const eventUpload = page.getByLabel("Logo acara", { exact: true }).locator("..");
  await eventUpload.getByRole("button", { name: "Hapus gambar", exact: true }).click();
  assert.equal(await page.getByRole("img", { name: "Logo acara di preview" }).count(), 0);
  const dropped = await page.evaluateHandle((base64) => {
    const data = new DataTransfer();
    data.items.add(new File([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))], "dropped-logo.png", { type: "image/png" }));
    return data;
  }, image.toString("base64"));
  await eventUpload.dispatchEvent("drop", { dataTransfer: dropped });
  await page.getByRole("img", { name: "Logo acara di preview" }).waitFor();
  await dropped.dispose();
  await page
    .getByLabel("Nama organisasi penyelenggara")
    .fill("Organisasi Pengujian");
  await page
    .getByLabel("Logo organisasi", { exact: true })
    .setInputFiles(upload);
  await page.getByRole("img", { name: "Logo organisasi di preview" }).waitFor();
  await page.getByRole("button", { name: /Tambah sponsor/ }).click();
  await page
    .getByLabel("Nama sponsor 1", { exact: true })
    .fill("Sponsor Pengujian");
  await page
    .getByLabel("Logo sponsor 1", { exact: true })
    .setInputFiles(upload);
  await page
    .getByRole("img", { name: "Logo Sponsor Pengujian di preview" })
    .waitFor();
  await page.getByRole("button", { name: /Tambah sponsor/ }).click();
  await page
    .getByRole("button", { name: "Hapus sponsor 2", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Halaman event", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(output, "branding-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  assert.equal(await overflow(), false, "logo editor reflows at 320px");
  await page.screenshot({
    path: path.join(output, "branding-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Poster", exact: true }).click();
  await page.getByRole("button", { name: "Lanjutkan" }).click();
  const registration = page.getByRole("checkbox", {
    name: /Registrasi peserta/,
  });
  const attendance = page.getByRole("checkbox", { name: /Scan masuk/ });
  await attendance.check();
  await registration.uncheck();
  assert.equal(await attendance.isChecked(), false);
  await attendance.check();
  assert.equal(await registration.isChecked(), true);
  await page.getByRole("checkbox", { name: /Rekrutmen panitia/ }).check();
  await page.getByRole("checkbox", { name: /Sponsorship/ }).uncheck();
  await page.getByRole("checkbox", { name: /Sponsorship/ }).check();
  await page.getByRole("button", { name: "Simpan draft lokal" }).click();
  await page
    .getByText(
      "Draft tersimpan di browser ini. Belum dipublikasikan atau dikirim ke server.",
    )
    .waitFor();
  const stored = await storedDraft();
  assert.equal(stored.draft.title, "Malam Kolaborasi Kampus");
  assert.equal(stored.draft.capacity, "120");
  assert.equal(stored.draft.modules.attendance, true);
  assert.equal(stored.eventLogoBytes, image.length);
  assert.equal(stored.organizationName, "Organisasi Pengujian");
  assert.equal(stored.sponsors, 1);
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await page.getByRole("button", { name: /Ide & cerita/ }).click();
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    stored.draft.title,
  );
  await page.reload({ waitUntil: "networkidle" });
  await nav().getByRole("button", { name: "Susun event", exact: true }).click();
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    "",
  );
  await page.getByRole("button", { name: "Buka draft tersimpan" }).click();
  await page
    .getByText("Draft lokal dipulihkan. Kamu bisa melanjutkan mengeditnya.")
    .waitFor();
  await page.getByRole("img", { name: "Logo acara di preview" }).waitFor();
  await page.getByRole("img", { name: "Logo organisasi di preview" }).waitFor();
  await page.getByRole("img", { name: "Logo Sponsor Pengujian di preview" }).waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    stored.draft.title,
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Lihat preview", exact: true })
    .click();
  assert.equal(await overflow(), false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(output, "event-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Tutup preview", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("heading", { name: "Malam Kolaborasi Kampus", exact: true })
      .first()
      .isVisible(),
    false,
  );
  await page.getByRole("button", { name: "Hapus draft lokal" }).focus();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.keyboard.press("Enter");
  assert.notEqual(await storedDraft(), null);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hapus draft lokal" }).click();
  await page
    .getByText(
      "Draft lokal dihapus dari browser. Isian formulir saat ini tidak diubah.",
    )
    .waitFor();
  assert.equal(await storedDraft(), null);
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    stored.draft.title,
  );

  await page.evaluate(() =>
    localStorage.setItem("partnerhub:event-draft:v1", "bad json"),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Buka draft tersimpan" }).click();
  await page
    .getByText("Draft tersimpan tidak valid. Isian saat ini tidak diubah.")
    .waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: /Nama event/ }).inputValue(),
    stored.draft.title,
  );
  await page.evaluate(() =>
    localStorage.removeItem("partnerhub:event-draft:v1"),
  );

  await page.setViewportSize({ width: 720, height: 1000 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  assert.equal(await overflow(), false, "draft reflows with doubled text");
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await nav().getByRole("button", { name: "Event kamu" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Penyimpanan & akses" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog").waitFor();
  await page.screenshot({ path: path.join(output, "mobile-guide.png") });
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Penyimpanan & akses" })
      .evaluate((element) => element === document.activeElement),
    true,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .getByRole("button", { name: "Susun event baru", exact: true })
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration),
    "0s",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: event selection, filters/search/reset, sponsor view, empty/loading/error, draft validation/live preview/step navigation, module prerequisites, local save/reload/restore/delete/cancel/corrupt recovery, view-switch preservation, desktop/tablet/mobile/narrow, doubled text, keyboard/Escape, reduced motion",
  );
  console.log(`Screenshots: ${output}`);
  for (const warning of new Set(knownWarnings))
    console.log(`Known warning: ${warning}`);
} finally {
  await browser.close();
}
