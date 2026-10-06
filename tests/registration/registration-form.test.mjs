import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const storage = new Map();
globalThis.sessionStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: (k) => storage.delete(k) };
globalThis.window = globalThis.window ?? { dispatchEvent() {} };
// The demo router reads uploads with FileReader, which only browsers have. This stand-in behaves the same for Blobs.
globalThis.FileReader ??= class { readAsDataURL(file) { file.arrayBuffer().then((buffer) => { this.result = `data:${file.type};base64,${Buffer.from(buffer).toString("base64")}`; this.onload?.(); }, (error) => { this.error = error; this.onerror?.(); }); } };
const { demoRequest, resetDemoData } = loadTs("src/mocks/demo/router.ts");
const { DEMO_PASSWORD } = loadTs("src/mocks/demo/seed.ts");
const { formatPrice } = loadTs("src/lib/money.ts");

beforeEach(() => { resetDemoData(); storage.clear(); });

const call = (route, options = {}) => demoRequest(route, options);
const login = (email) => call("/api/auth/login", { method: "POST", body: { email, password: DEMO_PASSWORD }, auth: false });
const denied = (promise, status) => assert.rejects(promise, (error) => error.status === status);
const USER = "demo.user@partnerhub.test";
const ORGANIZER = "demo.penyelenggara@partnerhub.test";
const SPONSOR = "demo.sponsor@partnerhub.test";
const PNG = "data:image/png;base64,iVBORw0KGgo=";

test("prices read as Gratis or whole rupiah", () => {
  assert.equal(formatPrice(0), "Gratis");
  assert.equal(formatPrice(50000), "Rp50.000");
  assert.equal(formatPrice(1250000), "Rp1.250.000");
});

test("public events carry their price; an event without a saved form is free", async () => {
  await login(USER);
  const events = (await call("/api/public/events")).items;
  assert.equal(events.find((item) => item.id === "demo-event-2").priceIdr, 50000);
  assert.equal(events.find((item) => item.id === "demo-event-1").priceIdr, 0);
  const form = await call("/api/public/events/demo-event-1/registration-form");
  assert.equal(form.isDefault, true);
  assert.equal(form.priceIdr, 0);
});

test("registering answers the organizer's form: required, choice membership, and image are enforced", async () => {
  await login(USER);
  await assert.rejects(call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers: {} } }), (error) => error.status === 422 && Object.keys(error.fields).length === 3);
  await assert.rejects(call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers: { "demo-f1": "UKM", "demo-f2": "Dewa", "demo-f3": PNG } } }), (error) => error.status === 422 && Boolean(error.fields["demo-f2"]));
  await assert.rejects(call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers: { "demo-f1": "UKM", "demo-f2": "Pemula", "demo-f3": "http://insecure.example/x.png" } } }), (error) => error.status === 422 && Boolean(error.fields["demo-f3"]));
  const created = await call("/api/public/events/demo-event-2/registrations", { method: "POST", body: { answers: { "demo-f1": "UKM Desain Demo", "demo-f2": "Pemula", "demo-f3": PNG } } });
  assert.equal(created.priceIdr, 50000);
  await login(ORGANIZER);
  const board = await call("/api/events/demo-event-2/registrants");
  const mine = board.items.find((item) => item.id === created.id);
  assert.equal(mine.answers.length, 3);
  assert.equal(mine.answers[0].label, "Asal institusi atau komunitas", "the question text is copied onto the answer");
  assert.equal("email" in mine, false, "an organizer never gets the email");
});

test("the organizer sets price and questions; a priced event needs a payment note and a payment-proof image question", async () => {
  await login(ORGANIZER);
  const field = { id: null, label: "Nama di kartu peserta", type: "text", required: true, hint: null, options: [] };
  await assert.rejects(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: -5, paymentNote: null, fields: [field] } }), (error) => error.status === 422 && Boolean(error.fields.priceIdr));
  await assert.rejects(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 25000, paymentNote: null, fields: [field] } }), (error) => error.status === 422 && Boolean(error.fields.paymentNote));
  await assert.rejects(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 25000, paymentNote: "Bayar ke panitia lewat transfer.", fields: [field] } }), (error) => error.status === 422 && Boolean(error.fields.fields));
  await assert.rejects(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 0, paymentNote: null, fields: [field, { ...field, label: "nama di kartu peserta" }] } }), (error) => error.status === 422 && Boolean(error.fields.field1));
  await assert.rejects(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 0, paymentNote: null, fields: [{ ...field, type: "choice", options: ["Satu"] }] } }), (error) => error.status === 422 && Boolean(error.fields.field0));
  const saved = await call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 25000, paymentNote: "Bayar ke panitia lewat transfer.", fields: [field, { id: null, label: "Bukti pembayaran", type: "image", required: true, hint: null, options: [] }] } });
  assert.equal(saved.isDefault, false);
  assert.equal(saved.priceIdr, 25000);
  assert.equal(saved.fields.length, 2);
  await login(USER);
  assert.equal((await call("/api/public/events")).items.find((item) => item.id === "demo-event-3").priceIdr, 25000);
  await denied(call("/api/events/demo-event-3/registration-form", { method: "PUT", body: { priceIdr: 0, paymentNote: null, fields: [] } }), 403);
});

test("only the owner reads registrants and the form editor; sponsors cannot", async () => {
  await login(ORGANIZER);
  await denied(call("/api/events/demo-event-6/registrants"), 404);
  await denied(call("/api/events/demo-event-6/registration-form"), 404);
  const own = await call("/api/events/demo-event-1/registrants");
  assert.ok(own.items.length >= 3);
  assert.ok(own.items.every((item) => !("ownerId" in item) && !("email" in item)));
  await login(SPONSOR);
  await denied(call("/api/events/demo-event-1/registrants"), 403);
});

test("payment-proof images: only raster images up to 2 MB, for published events", async () => {
  await login(USER);
  const upload = (file, event = "demo-event-2") => { const body = new FormData(); body.set("file", file); return call(`/api/public/events/${event}/registration-images`, { method: "POST", body }); };
  const png = new File([new Uint8Array([137, 80, 78, 71])], "bukti.png", { type: "image/png" });
  assert.match((await upload(png)).url, /^data:image\/png;base64,/);
  await denied(upload(new File(["x"], "x.svg", { type: "image/svg+xml" })), 422);
  await denied(upload(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" })), 422);
  await denied(upload(png, "demo-event-4"), 404);
});