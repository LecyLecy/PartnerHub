import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { loadTs } from "../helpers/load-ts.mjs";
const { sponsorCatalog } = loadTs("src/features/sponsorship/sponsor-catalog.ts");
const { workspaceGroups, activeWorkspaceLink } = loadTs("src/lib/workspace-navigation.ts");
const sponsors = Array.from({ length: 15 }, (_, index) => ({ id: `sponsor-${index}`, companyName: `Company ${index}`, industry: index % 2 ? "Pendidikan" : "Teknologi", fields: [], sharedFields: [], imageUrl: null }));

test("catalog pagination has six results per page, clamps invalid pages and preserves input", () => {
  const before = structuredClone(sponsors);
  assert.equal(sponsorCatalog(sponsors, "", 1).items.length, 6);
  assert.equal(sponsorCatalog(sponsors, "", 2).items[0].id, "sponsor-6");
  assert.deepEqual(sponsorCatalog(sponsors, "", 99), { items: sponsors.slice(12), page: 3, pages: 3, total: 15 });
  for (const page of [-1, 0, NaN, Infinity, 1.5]) assert.equal(sponsorCatalog(sponsors, "", page).page, 1);
  assert.deepEqual(sponsors, before);
});
test("catalog searches company and industry, has a clear empty result, and clamps after filtering", () => {
  assert.equal(sponsorCatalog(sponsors, "  PENDIDIKAN ", 2).total, 7);
  assert.equal(sponsorCatalog(sponsors, "Company 14", 3).page, 1);
  assert.equal(sponsorCatalog(sponsors, "Company 14", 1).items[0].id, "sponsor-14");
  assert.deepEqual(sponsorCatalog(sponsors, "not found", 2), { items: [], page: 1, pages: 1, total: 0 });
});
test("organizer catalog has a stable sidebar entry; invitation form is no longer on event overview", () => {
  const groups = workspaceGroups("organizer");
  assert.equal(activeWorkspaceLink(groups, "/organizer/sponsors").label, "Jelajahi sponsor");
  const overview = readFileSync("src/features/sponsorship/sponsor-offers-page.tsx", "utf8");
  assert.doesNotMatch(overview, /Siapkan ajakan sponsor|<form|createOffer/);
  assert.match(readFileSync("src/features/sponsorship/sponsor-invite-page.tsx", "utf8"), /createOffer/);
  assert.match(readFileSync("src/features/sponsorship/sponsor-directory.tsx", "utf8"), /<Icon name="users"[^>]+\/><span>Smart Matching/);
});
