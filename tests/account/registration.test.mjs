import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const v = loadTs("src/lib/form/validators.ts");
const s = loadTs("src/features/account/signup/schemas.ts");
const { buildOrganizer, buildSponsor } = loadTs("src/features/account/signup/payload.ts");

const base = { ...s.emptyValues, fullName: "Nama Uji", email: "uji@perusahaan-uji.co.id", phone: "0812 3456 7890", password: "Strong-Pass-93!x", confirm: "Strong-Pass-93!x", acceptTerms: true };
const file = (name = "x.pdf") => ({ name, size: 10 });

test("Indonesian phone numbers normalize to +62 and bad ones are rejected", () => {
  for (const ok of ["0812 3456 7890", "+62 812-3456-7890", "6281234567890", "081234567890"]) assert.equal(v.normalizePhone(ok), "+6281234567890");
  for (const bad of ["12345", "0712345678", "+1 555 123 4567", "08123", "abc", ""]) assert.equal(v.normalizePhone(bad), null, bad);
});

test("password policy blocks short, single-class, common and email-derived passwords and scores strength", () => {
  assert.ok(v.passwordIssue("Short1!"));
  assert.ok(v.passwordIssue("alllowercaseletters"));
  assert.ok(v.passwordIssue("Password-2026!xx"));
  assert.ok(v.passwordIssue("Budi-Santoso-77!", "budi@contoh.id"));
  assert.equal(v.passwordIssue("Strong-Pass-93!x", "budi@contoh.id"), null);
  assert.equal(v.passwordStrength("").score, 0);
  assert.ok(v.passwordStrength("Strong-Pass-93!x-long").score >= 3);
  assert.ok(v.passwordStrength("abc").score <= 1);
});

test("company identity numbers are validated by format only", () => {
  assert.ok(v.isNib("1234567890123") && v.isNib("1234 5678 9012 3"));
  assert.ok(!v.isNib("12345") && !v.isNib("12345678901234"));
  assert.ok(v.isNpwp("12.345.678.9-012.345") && v.isNpwp("1234567890123456"));
  assert.ok(!v.isNpwp("123"));
});

test("free email domains are flagged for sponsors only through the heuristic", () => {
  assert.equal(v.isFreeEmailDomain("a@gmail.com"), true);
  assert.equal(v.isFreeEmailDomain("A@Yahoo.co.id"), true);
  assert.equal(v.isFreeEmailDomain("a@perusahaan-uji.co.id"), false);
});

test("user path is short: account, optional profile, confirm", () => {
  assert.deepEqual([...s.stepsFor.user], ["account", "profile", "confirm"]);
  assert.deepEqual(s.validateStep("user", "account", base, s.emptyFiles), {});
  assert.deepEqual(s.validateStep("user", "profile", base, s.emptyFiles), {});
  assert.ok(s.validateStep("user", "confirm", { ...base, acceptTerms: false }, s.emptyFiles).acceptTerms);
});

test("account step reports specific errors per field", () => {
  const errors = s.validateStep("user", "account", { ...base, fullName: "", email: "bad", phone: "123", password: "short", confirm: "other" }, s.emptyFiles);
  for (const key of ["fullName", "email", "phone", "password", "confirm"]) assert.ok(errors[key], key);
  assert.ok(s.validateStep("user", "account", { ...base, confirm: "Different-Pass-1!" }, s.emptyFiles).confirm);
});

test("sponsors must use a work email and give a position", () => {
  const free = s.validateStep("sponsor", "account", { ...base, email: "pic@gmail.com", position: "Manajer" }, s.emptyFiles);
  assert.match(free.email, /email kerja/i);
  assert.ok(s.validateStep("sponsor", "account", { ...base, position: "" }, s.emptyFiles).position);
  assert.deepEqual(s.validateStep("sponsor", "account", { ...base, position: "Manajer" }, s.emptyFiles), {});
  assert.equal(s.validateStep("user", "account", { ...base, email: "pic@gmail.com" }, s.emptyFiles).email, undefined);
});

test("organizer profile requires an organization name unless individual, and a document is required", () => {
  const profile = { ...base, organizerType: "organization", organizationName: "", description: "Organisasi mahasiswa penyelenggara seminar.", city: "Kota Uji", address: "Jl. Uji 1", position: "Ketua" };
  assert.ok(s.validateStep("organizer", "profile", profile, s.emptyFiles).organizationName);
  assert.deepEqual(s.validateStep("organizer", "profile", { ...profile, organizerType: "individual" }, s.emptyFiles), {});
  assert.ok(s.validateStep("organizer", "profile", { ...profile, organizerType: "" }, s.emptyFiles).organizerType);
  assert.ok(s.validateStep("organizer", "profile", { ...profile, organizationName: "X", description: "pendek" }, s.emptyFiles).description);
  assert.ok(s.validateStep("organizer", "profile", { ...profile, organizationName: "X", website: "bukan tautan" }, s.emptyFiles).website);
  assert.ok(s.validateStep("organizer", "documents", base, s.emptyFiles).document);
  assert.deepEqual(s.validateStep("organizer", "documents", base, { logo: null, document: file() }), {});
});

test("sponsor company step validates identity numbers, logo, categories and website", () => {
  const company = { ...base, companyName: "PT Uji", industry: "Teknologi", legalNumber: "1234567890123", address: "Jl. Uji 2", city: "Kota Uji", website: "https://perusahaan-uji.co.id", categories: ["Dana"] };
  assert.ok(s.validateStep("sponsor", "company", company, s.emptyFiles).logo);
  assert.deepEqual(s.validateStep("sponsor", "company", company, { logo: file("l.png"), document: null }), {});
  assert.ok(s.validateStep("sponsor", "company", { ...company, legalNumber: "123" }, { logo: file(), document: null }).legalNumber);
  assert.ok(s.validateStep("sponsor", "company", { ...company, npwp: "12" }, { logo: file(), document: null }).npwp);
  assert.ok(s.validateStep("sponsor", "company", { ...company, categories: [] }, { logo: file(), document: null }).categories);
  assert.ok(s.validateStep("sponsor", "company", { ...company, website: "" }, { logo: file(), document: null }).website);
});

test("validateAll returns the first failing step so submit can jump back to it", () => {
  const problem = s.validateAll("sponsor", { ...base, position: "Manajer" }, s.emptyFiles);
  assert.equal(problem.step, "company");
});

test("switching roles keeps shared fields and clears role-only ones and documents", () => {
  const filled = { ...base, city: "Kota Uji", position: "Ketua", website: "https://x.id", organizerType: "community", organizationName: "Komunitas Uji", description: "d".repeat(30), companyName: "PT Uji", categories: ["Dana"] };
  const moved = s.switchRole(filled, { logo: file("l.png"), document: file() }, "organizer", "sponsor");
  for (const key of ["fullName", "email", "phone", "city", "position", "website"]) assert.equal(moved.values[key], filled[key], key);
  assert.equal(moved.values.organizerType, "");
  assert.equal(moved.values.organizationName, "");
  assert.equal(moved.values.companyName, "PT Uji");
  assert.equal(moved.files.document, null);
  assert.ok(moved.files.logo);
  assert.equal(s.switchRole(filled, s.emptyFiles, "user", "user").values, filled);
});

test("payloads carry normalized phone, lower-cased email and digit-only identity numbers", () => {
  const organizer = buildOrganizer({ ...base, email: "Uji@Contoh.ID", organizerType: "individual", organizationName: "", description: "d".repeat(30), city: "K", address: "A", position: "P" });
  assert.equal(organizer.phone, "+6281234567890");
  assert.equal(organizer.email, "uji@contoh.id");
  assert.equal(organizer.organizationName, null);
  const sponsor = buildSponsor({ ...base, position: "P", companyName: "PT", industry: "Teknologi", legalNumber: "1234 5678 9012 3", npwp: "12.345.678.9-012.345", address: "A", city: "K", website: "https://x.id", categories: ["Dana"] });
  assert.equal(sponsor.legalNumber, "1234567890123");
  assert.equal(sponsor.npwp, "123456789012345");
  assert.equal(sponsor.scale, null);
});
