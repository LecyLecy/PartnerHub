import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { initialDraft } from "../../src/features/event/draft.ts";
const require = createRequire(import.meta.url);
const source = readFileSync(new URL("../../src/features/event/editor-model.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => require(name === "./draft" ? "../../src/features/event/draft.ts" : name === "./event-branding" ? "../../src/features/event/event-branding.ts" : name), loaded, loaded.exports);
const { validatePartialDraft, registrationError, draftToInput, recordToEditor } = loaded.exports;

test("titled incomplete drafts are accepted while malformed supplied fields are rejected", () => {
  const draft = { ...initialDraft, title: "Test event" };
  assert.deepEqual(validatePartialDraft(draft), {});
  assert.ok(validatePartialDraft({ ...draft, date: "2026-02-30" }).date);
  assert.ok(validatePartialDraft({ ...draft, capacity: "0" }).capacity);
  assert.ok(validatePartialDraft({ ...draft, startTime: "09:00" }).date);
});

test("registration window is paired, chronological and closes by event start", () => {
  const draft = { ...initialDraft, title: "Test event", date: "2026-11-14", startTime: "09:00", endTime: "10:00" };
  assert.equal(registrationError("", "", draft), null);
  assert.equal(registrationError("2026-11-01T08:00", "2026-11-14T09:00", draft), null);
  for (const [opens, closes] of [["2026-02-30T08:00", "2026-11-01T09:00"], ["2026-11-01T09:00", ""], ["2026-11-01T09:00", "2026-11-01T08:00"], ["2026-11-01T08:00", "2026-11-14T09:01"]]) assert.ok(registrationError(opens, closes, draft));
});

test("WIB transport conversion round-trips without changing event identity or introducing a status mutation", () => {
  const draft = { ...initialDraft, title: " Test event ", date: "2026-11-14", startTime: "09:00", endTime: "10:00" };
  const branding = { organizationName: "Test team", eventLogo: null, organizationLogo: null, sponsors: [] };
  const input = draftToInput(draft, branding, "", "");
  assert.equal(input.startsAt, "2026-11-14T02:00:00.000Z");
  assert.equal(input.capacity, null);
  assert.equal(input.title, "Test event");
  assert.equal("status" in input, false);
  const restored = recordToEditor({ ...input, id: "test-event", status: "DRAFT", revision: "1", updatedAt: new Date().toISOString() });
  assert.equal(restored.draft.startTime, "09:00");
  assert.equal(restored.draft.date, "2026-11-14");
});
