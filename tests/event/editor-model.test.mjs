import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const { initialDraft } = loadTs("src/features/event/draft.ts");
const { registrationError, draftToInput, recordToEditor } = loadTs("src/features/event/editor-model.ts");

test("registration window is paired, chronological and closes by event start", () => {
  const draft = { ...initialDraft, title: "Test event", date: "2026-11-14", startTime: "09:00", endTime: "10:00" };
  assert.equal(registrationError("", "", draft), null);
  assert.equal(registrationError("2026-11-01T08:00", "2026-11-14T09:00", draft), null);
  for (const [opens, closes] of [["2026-02-30T08:00", "2026-11-01T09:00"], ["2026-11-01T09:00", ""], ["2026-11-01T09:00", "2026-11-01T08:00"], ["2026-11-01T08:00", "2026-11-14T09:01"]]) assert.ok(registrationError(opens, closes, draft));
});

test("WIB transport conversion round-trips without changing event identity or introducing a status mutation", () => {
  const draft = { ...initialDraft, title: " Test event ", matchingFields: ["Teknologi"], date: "2026-11-14", startTime: "09:00", endTime: "10:00" };
  const branding = { organizationName: "Test team", eventLogo: null, organizationLogo: null, sponsors: [] };
  const input = draftToInput(draft, branding, "", "");
  assert.equal(input.startsAt, "2026-11-14T02:00:00.000Z");
  assert.equal(input.capacity, null);
  assert.equal(input.title, "Test event");
  assert.equal("status" in input, false);
  const restored = recordToEditor({ ...input, id: "test-event", status: "DRAFT", revision: "1", updatedAt: new Date().toISOString() });
  assert.equal(restored.draft.startTime, "09:00");
  assert.equal(restored.draft.date, "2026-11-14");
  assert.deepEqual(restored.draft.matchingFields, ["Teknologi"]);
});
