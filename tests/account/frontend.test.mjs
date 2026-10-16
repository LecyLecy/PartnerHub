import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const { validateAccountForm } = loadTs("src/features/account/validation.ts");
const { safeDestination, homeFor, canAccess, destinationAfterAuth } = loadTs("src/lib/navigation.ts");

const session = (role, overrides = {}) => ({
  account: { id: "test", email: "owner@example.test", displayName: null, role, status: "active", ...overrides.account },
  emailVerified: true, onboardingComplete: true, expiresAt: new Date(Date.now() + 3600000).toISOString(), ...overrides.session,
});

test("login, recovery and reset validate before calling services", () => {
  const values = { email: "owner@example.test", password: "Strong-Pass-93!x", confirm: "Strong-Pass-93!x", token: "test-only-token" };
  for (const mode of ["login", "forgot", "reset", "verify"]) assert.deepEqual(validateAccountForm(mode, values), {});
  assert.ok(validateAccountForm("login", { ...values, email: "bad", password: "" }).email);
  assert.ok(validateAccountForm("reset", { ...values, password: "short" }).password);
  assert.ok(validateAccountForm("reset", { ...values, password: "alllowercaseletters" }).password);
  assert.ok(validateAccountForm("reset", { ...values, confirm: "different" }).confirm);
  assert.ok(validateAccountForm("reset", { ...values, token: "" }).token);
});

test("return navigation rejects external, protocol-relative and non-product destinations", () => {
  for (const value of [null, "", "https://example.test", "//example.test", "/\\example.test", "/login", "/api/health", "/dashboardevil", "/events/../../login", "/dashboard\n"]) assert.equal(safeDestination(value), "/dashboard");
  assert.equal(safeDestination("/events/example/edit?source=login"), "/events/example/edit?source=login");
  assert.equal(safeDestination("/sponsor/proposals/new"), "/sponsor/proposals/new");
  assert.equal(safeDestination("/settings"), "/settings");
});

test("each role lands on its own dashboard", () => {
  assert.equal(homeFor(session("user")), "/me");
  assert.equal(homeFor(session("organizer")), "/organizer");
  assert.equal(homeFor(session("sponsor")), "/sponsor");
  assert.equal(homeFor(null), "/login");
});

test("verification and onboarding come before the role dashboard", () => {
  assert.equal(homeFor(session("organizer", { session: { emailVerified: false } })), "/verify-email");
  assert.equal(homeFor(session("user", { session: { onboardingComplete: false } })), "/onboarding");
});

test("accounts under review are limited to their status page and settings", () => {
  for (const role of ["organizer", "sponsor"]) {
    const pending = session(role, { account: { status: "pending_verification" } });
    assert.equal(homeFor(pending), "/account/verification");
    assert.equal(canAccess(pending, "/account/verification"), true);
    assert.equal(canAccess(pending, "/settings"), true);
    for (const blocked of ["/organizer", "/events/new", "/sponsor", "/sponsor/proposals/new", "/me"]) assert.equal(canAccess(pending, blocked), false, `${role} must not open ${blocked}`);
  }
});

test("a role cannot open another role's pages", () => {
  const matrix = { user: ["/me", "/committee"], organizer: ["/organizer", "/events/new", "/events/abc/edit", "/events/abc/committee", "/events/abc/sponsors"], sponsor: ["/sponsor", "/sponsor/proposals/new"] };
  for (const [role, own] of Object.entries(matrix)) {
    for (const [other, paths] of Object.entries(matrix)) for (const path of paths) assert.equal(canAccess(session(role), path), role === other, `${role} -> ${path}`);
    assert.equal(canAccess(session(role), "/settings"), true);
    assert.equal(canAccess(session(role), "/account/verification"), false);
    assert.ok(own.length > 0);
  }
});

test("post-login destination honors a safe target the role may open, otherwise the role home", () => {
  assert.equal(destinationAfterAuth(session("organizer"), "/events/new"), "/events/new");
  assert.equal(destinationAfterAuth(session("user"), "/events/new"), "/me");
  assert.equal(destinationAfterAuth(session("sponsor"), "https://example.test"), "/sponsor");
  assert.equal(destinationAfterAuth(session("organizer", { account: { status: "pending_verification" } }), "/organizer"), "/account/verification");
  assert.match(destinationAfterAuth(session("user", { session: { emailVerified: false } }), "/me"), /^\/verify-email\?next=/);
});
