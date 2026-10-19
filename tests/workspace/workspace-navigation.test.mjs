import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const { workspaceGroups, eventWorkspaceGroup, activeWorkspaceLink } = loadTs("src/lib/workspace-navigation.ts");
const { canAccess } = loadTs("src/lib/navigation.ts");
const session = role => ({ account: { role, status: "active" }, emailVerified: true, onboardingComplete: true });

test("every role has sectioned navigation with unique, authorized page destinations", () => {
  for (const role of ["organizer", "sponsor", "user"]) {
    const groups = workspaceGroups(role, "");
    assert.ok(groups.length >= 2);
    assert.ok(!groups.flatMap(group => group.items).some(item => item.href === "/settings"));
    const links = groups.flatMap(group => group.items);
    assert.equal(new Set(links.map(item => item.href)).size, links.length);
    for (const item of links) {
      assert.equal(canAccess(session(role), item.href), true, `${role}: ${item.href}`);
      assert.equal(activeWorkspaceLink(groups, item.href)?.href, item.href);
      assert.ok(!item.href.includes("?"), "subsections are independent routes, not hidden query panels");
    }
  }
});
test("event-specific navigation selects the longest matching authorized destination", () => {
  const sidebar = workspaceGroups("organizer");
  const group = eventWorkspaceGroup("organizer", "/events/demo-event-1/registration");
  const groups = [group];
  assert.ok(!sidebar.some(item => item.title === "Acara terpilih"));
  assert.equal(activeWorkspaceLink(sidebar, "/events/demo-event-1/registration")?.href, "/organizer");
  assert.equal(activeWorkspaceLink(groups, "/events/demo-event-1/registration")?.label, "Pendaftaran");
  assert.equal(activeWorkspaceLink(groups, "/events/demo-event-1/committee/stages")?.label, "Kelola panitia");
  assert.equal(activeWorkspaceLink(groups, "/events/demo-event-1/team")?.label, "Pengelola");
  for (const suffix of ["package", "report", "edit"]) {
    assert.equal(activeWorkspaceLink(groups, `/events/demo-event-1/${suffix}`)?.label, "Ringkasan acara");
    assert.ok(!group.items.some(item => item.href.endsWith(`/${suffix}`)));
  }
  assert.ok(!groups.flatMap(group => group.items).some(item => /subscription|organizer\/team|overview/.test(item.href)));
  assert.ok(!eventWorkspaceGroup("organizer", "/events/new"));
  assert.ok(!eventWorkspaceGroup("sponsor", "/events/demo-event-1"));
});
test("new proposal creation stays in the proposal trail, not discovery", () => {
  assert.equal(activeWorkspaceLink(workspaceGroups("sponsor", "/sponsor/proposals/new"), "/sponsor/proposals/new")?.href, "/sponsor/progress/proposals");
});
test("landing and public pages use one shared public header", () => {
  assert.match(readFileSync("src/features/workspace/landing/landing-nav.tsx", "utf8"), /<PublicHeader/);
  assert.match(readFileSync("src/lib/ui/site-frame.tsx", "utf8"), /<PublicHeader/);
  assert.doesNotMatch(readFileSync("src/features/workspace/landing/landing-nav.tsx", "utf8"), /navLinks|links=\{/);
});
test("tickets, applications and event package controls no longer stack on their old combined page", () => {
  assert.doesNotMatch(readFileSync("src/app/me/events/page.tsx", "utf8"), /MyApplications/);
  assert.match(readFileSync("src/app/me/applications/page.tsx", "utf8"), /MyApplications/);
  assert.doesNotMatch(readFileSync("src/features/event/event-detail-page.tsx", "utf8"), /<EventPackagePanel/);
  assert.match(readFileSync("src/features/event/event-package-page.tsx", "utf8"), /<EventPackagePanel/);
});

test("global search and its keyboard shortcut are removed, account menu retains profile", () => {
  for (const file of ["src/lib/ui/site-frame.tsx", "src/lib/ui/organizer-shell.tsx"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /CommandPalette|useShortcutLabel|searchTrigger|Pencarian cepat|ctrlKey|metaKey/);
  }
  assert.match(readFileSync("src/lib/ui/account-menu.tsx", "utf8"), /href="\/settings"/);
  assert.doesNotMatch(readFileSync("src/features/account/settings-page.tsx", "utf8"), /BackLink/);
});
test("transaction history is settings-only and annual cards include Custom without extra sections", () => {
  assert.ok(!workspaceGroups("organizer").flatMap(group => group.items).some(item => item.href === "/organizer/transactions"));
  assert.equal(activeWorkspaceLink(workspaceGroups("organizer"), "/organizer/transactions"), undefined);
  assert.match(readFileSync("src/features/account/settings-page.tsx", "utf8"), /href="\/organizer\/transactions"/);
  assert.doesNotMatch(readFileSync("src/features/workspace/subscription/subscription-page.tsx", "utf8"), /Transactions|organizer\/transactions/);
  assert.match(readFileSync("src/features/workspace/subscription/plan-cards.tsx", "utf8"), /Kontak PartnerHub/);
  const menu = readFileSync("src/lib/ui/account-menu.tsx", "utf8");
  assert.match(menu, />Pengaturan<\/Link>/);
  assert.doesNotMatch(menu, /Profil & pengaturan|\/>Profil<\/Link>/);
});
test("legal links stay in the shared footer, never the role sidebar", () => {
  const source = readFileSync("src/lib/ui/organizer-shell.tsx", "utf8");
  const aside = source.slice(source.indexOf("<aside"), source.indexOf("</aside>"));
  const footer = source.slice(source.indexOf("<footer"), source.indexOf("</footer>"));
  assert.doesNotMatch(aside, /href="\/(terms|privacy)"|shell\.legal/);
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/privacy"/);
  assert.doesNotMatch(readFileSync("src/lib/ui/role-shell.module.css", "utf8"), /\.legal\b/);
});
