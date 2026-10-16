import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");

beforeEach(() => { resetDemoData(); storage.clear(); });

const call = (route, options = {}) => demoRequest(route, options);
const login = (email, password = DEMO_PASSWORD) => call("/api/auth/login", { method: "POST", body: { email, password }, auth: false });
const denied = async (promise, status) => assert.rejects(promise, (error) => error.status === status);

test("demo accounts open with filled data and strictly separate private data", async () => {
  await login("demo.user@partnerhub.test");
  const tickets = await call("/api/me/registrations");
  assert.ok(tickets.items.length >= 3);
  assert.ok((await call("/api/me/notifications")).items.length >= 2);
  await denied(call("/api/events"), 403);
  await denied(call("/api/organizer/summary"), 403);
  await denied(call("/api/sponsor/proposals"), 403);

  await login("demo.penyelenggara@partnerhub.test");
  const own = (await call("/api/events")).items;
  assert.equal(own.length, 5);
  assert.ok(!own.some((item) => item.id === "demo-event-6"), "another organizer's event must not appear in 'acara saya'");
  await denied(call("/api/events/demo-event-6"), 404);
  await denied(call("/api/me/registrations"), 403);
  const summary = await call("/api/organizer/summary");
  assert.ok(summary.events.every((item) => own.some((event) => event.id === item.eventId)));

  await login("demo.sponsor@partnerhub.test");
  const proposals = (await call("/api/sponsor/proposals")).items;
  assert.equal(proposals.length, 3);
  assert.ok((await call("/api/sponsor/sponsorships")).items.length >= 1);
  await denied(call("/api/events"), 403);
  await denied(call("/api/me/registrations"), 403);
});

test("public events are visible to approved accounts but never expose private registrant data", async () => {
  for (const email of ["demo.user@partnerhub.test", "demo.penyelenggara@partnerhub.test", "demo.sponsor@partnerhub.test"]) {
    await login(email);
    const items = (await call("/api/public/events")).items;
    assert.ok(items.length >= 6);
    assert.ok(items.every((item) => item.registeredCount >= 0 && !("ownerId" in item) && !("registrations" in item)));
  }
});

test("the demo pending account has minimal data and limited API access", async () => {
  await login("demo.menunggu@partnerhub.test");
  const info = await call("/api/accounts/me/verification");
  assert.equal(info.status, "pending_verification");
  assert.ok(info.documents.length >= 1 && info.summary.length >= 1);
  for (const route of ["/api/events", "/api/organizer/summary", "/api/me/registrations"]) await denied(call(route), 403);
  assert.ok((await call("/api/public/events")).items.length > 0, "public browsing does not require approval");
  await denied(call("/api/events", { method: "POST", body: { title: "Tidak boleh" } }), 403);
});

test("a freshly registered account starts empty and sees no demo data", async () => {
  const body = new FormData();
  body.set("payload", new Blob([JSON.stringify({ email: "baru@contoh.id", fullName: "Akun Baru", password: "Strong-Pass-93!x" })], { type: "application/json" }));
  const result = await call("/api/auth/register/user", { method: "POST", body, auth: false });
  assert.equal(result.verificationRequired, true);
  assert.equal(result.session.account.role, "user");
  await call("/api/auth/verification/confirm", { method: "POST", body: { token: "demo-token" }, auth: false });
  assert.deepEqual((await call("/api/me/registrations")).items, []);
  assert.deepEqual((await call("/api/me/notifications")).items, []);
  const again = new FormData();
  again.set("payload", new Blob([JSON.stringify({ email: "BARU@contoh.id" })], { type: "application/json" }));
  await assert.rejects(call("/api/auth/register/user", { method: "POST", body: again, auth: false }), (error) => error.status === 409 && error.code === "EMAIL_TAKEN");
});

test("a newly registered organizer is pending, blocked from organizer APIs, and has no demo events", async () => {
  const body = new FormData();
  body.set("payload", new Blob([JSON.stringify({ email: "org@contoh.id", fullName: "Org Baru", password: "Strong-Pass-93!x", organizerType: "community", organizationName: "Komunitas Baru", city: "Kota" })], { type: "application/json" }));
  await call("/api/auth/register/organizer", { method: "POST", body, auth: false });
  await call("/api/auth/verification/confirm", { method: "POST", body: { token: "demo-token" }, auth: false });
  const session = await call("/api/auth/session");
  assert.equal(session.account.status, "pending_verification");
  await denied(call("/api/events"), 403);
});

test("actions change only this session's data and Reset restores the seed", async () => {
  await login("demo.user@partnerhub.test");
  const before = (await call("/api/me/registrations")).items.length;
  await call("/api/public/events/demo-event-8/registrations", { method: "POST", body: {} });
  assert.equal((await call("/api/me/registrations")).items.length, before + 1);
  await assert.rejects(call("/api/public/events/demo-event-8/registrations", { method: "POST", body: {} }), (error) => error.code === "ALREADY_REGISTERED");

  await login("demo.penyelenggara@partnerhub.test");
  const created = await call("/api/events", { method: "POST", body: { title: "Acara sesi uji", category: "Workshop", summary: "", startsAt: null, endsAt: null, timezone: "Asia/Jakarta", venue: "", capacity: null, registrationOpensAt: null, registrationClosesAt: null, modules: { registration: true, committee: false, attendance: false, sponsorship: false }, branding: { organizationName: "", eventLogo: null, organizationLogo: null, sponsors: [] } }, headers: { "Idempotency-Key": "k1" } });
  const retried = await call("/api/events", { method: "POST", body: { title: "Acara sesi uji" }, headers: { "Idempotency-Key": "k1" } });
  assert.equal(created.id, retried.id);
  assert.equal((await call("/api/events")).items.length, 6);

  resetDemoData();
  storage.clear();
  await login("demo.user@partnerhub.test");
  assert.equal((await call("/api/me/registrations")).items.length, before);
  await login("demo.penyelenggara@partnerhub.test");
  assert.equal((await call("/api/events")).items.length, 5);
});

test("wrong demo password and unknown accounts are rejected", async () => {
  await denied(login("demo.user@partnerhub.test", "salah-password"), 401);
  await denied(login("tidak.ada@partnerhub.test"), 401);
});

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

test("demo modules are reachable only through build-flag guarded dynamic imports", () => {
  const root = path.resolve("src");
  const allowed = new Map([
    ["lib/api-client.ts", 1], ["app/providers.tsx", 1], ["features/account/account-page.tsx", 1], ["features/account/email-verification.tsx", 1],
  ]);
  for (const file of walk(root).filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes(`${path.sep}mocks${path.sep}`))) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const text = readFileSync(file, "utf8");
    const imports = text.match(/@\/mocks\//g)?.length ?? 0;
    assert.equal(imports, allowed.get(relative) ?? 0, `${relative} imports demo code unexpectedly`);
    if (imports) {
      assert.match(text, /process\.env\.NEXT_PUBLIC_PARTNERHUB_DEMO === "1"/, `${relative} must guard the demo import with the build flag`);
      assert.doesNotMatch(text.replace(/import\(/g, ""), /^import .*@\/mocks\//m, `${relative} must not statically import demo code`);
    }
  }
});
