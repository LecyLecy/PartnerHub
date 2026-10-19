import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { loadDb } = loadTs("src/mocks/demo/store.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const call = (route, options = {}) => demoRequest(route, options);
const login = email => call("/api/auth/login", { method: "POST", body: { email, password: DEMO_PASSWORD }, auth: false });
beforeEach(() => { resetDemoData(); storage.clear(); });
test("receipt returns own snapshot answers and proof after form edits and event closure, without QR secrets", async () => {
  await login("demo.user@partnerhub.test");
  const answers = { "demo-f1": "QA Komunitas", "demo-f2": "Pemula", "demo-f3": "data:image/png;base64,iVBORw0KGgo=" };
  const joined = await call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers } });
  const url = `/api/me/registrations/${joined.id}`;
  const receipt = await call(url);
  assert.equal(receipt.status, "PENDING");
  assert.equal(receipt.answers.length, 3);
  assert.equal(receipt.answers[0].value, "QA Komunitas");
  assert.equal(receipt.answers[2].value, answers["demo-f3"]);
  for (const privateField of ["ownerId", "qrSecret", "payload", "registrantName"]) assert.equal(privateField in receipt, false);
  loadDb().forms["demo-event-2"].fields[0].label = "Pertanyaan baru";
  loadDb().events.find(event => event.id === "demo-event-2").status = "CLOSED";
  assert.equal((await call(url)).answers[0].label, receipt.answers[0].label);
  assert.equal("answers" in (await call("/api/me/registrations")).items[0], false, "large private proof stays out of list response");
});
test("receipt refuses guests, other roles and another participant's registration", async () => {
  await assert.rejects(call("/api/me/registrations/demo-r1"), error => error.status === 401);
  for (const email of ["demo.sponsor@partnerhub.test", "demo.penyelenggara@partnerhub.test"]) {
    await login(email);
    await assert.rejects(call("/api/me/registrations/demo-r1"), error => error.status === 403);
  }
  await login("demo.user@partnerhub.test");
  const other = loadDb().registrations.find(item => item.ownerId !== "demo-user");
  assert.ok(other);
  await assert.rejects(call(`/api/me/registrations/${other.id}`), error => error.status === 404);
  await assert.rejects(call("/api/me/registrations/missing"), error => error.status === 404);
});
