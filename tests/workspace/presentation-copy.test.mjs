import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const forbidden = /simulasi|on progress|in progress|mode demo|data fiktif|data demo|bukan AI sungguhan/i;
test("presentation copy omits development disclaimers but preserves role switching and separate confirmation", () => {
  const paths = ["src/features/workspace/subscription/packages-page.tsx", "src/features/workspace/subscription/pricing-page.tsx", "src/features/sponsorship/event-recommendations.tsx", "src/features/sponsorship/sponsor-directory.tsx", "src/features/event/report-page.tsx", "src/features/account/signup/role-picker.tsx", "src/features/account/verification-page.tsx", "src/app/about/page.tsx", "src/app/guide/page.tsx", "src/app/privacy/page.tsx", "src/app/terms/page.tsx", "src/app/contact/page.tsx"];
  for (const path of paths) assert.doesNotMatch(readFileSync(path, "utf8"), forbidden, path);
  const banner = readFileSync("src/mocks/demo/banner.tsx", "utf8");
  assert.match(banner, /aria-label="Ganti peran demo"/);
  assert.doesNotMatch(banner, forbidden);
  assert.match(banner, /await confirm\(/);
  assert.doesNotMatch(banner, /window\.confirm/);
  const subscription = readFileSync(paths[0], "utf8");
  assert.doesNotMatch(readFileSync("src/features/workspace/landing/landing-footer.tsx", "utf8"), /dalam pengembangan/i);
  assert.match(subscription, /Buat pesanan/);
  assert.match(subscription, /Konfirmasi pembayaran/);
  assert.match(subscription, /verifyDemoOrder\(order.id\)/);
});
test("all landing FAQ answers use product wording without fake AI or development notices", () => {
  const { faqItems } = loadTs("src/features/workspace/landing/landing-data.ts");
  for (const item of Object.values(faqItems).flat()) assert.doesNotMatch(item.answer, forbidden);
});
