import assert from "node:assert/strict";
import test from "node:test";
import {
  initialDraft,
  parseStoredDraft,
  validateDraftStep,
} from "../../src/features/event/draft.ts";

const validDraft = {
  ...initialDraft,
  title: "Event contoh pengujian",
  date: "2026-11-14",
  startTime: "09:00",
  endTime: "15:00",
  venue: "Lokasi contoh",
  capacity: "200",
};

test("each step rejects missing required input without requiring later-step fields early", () => {
  assert.match(validateDraftStep(initialDraft, 0).title, /minimal 3/);
  assert.deepEqual(
    validateDraftStep({ ...initialDraft, title: "Acara kampus" }, 0),
    {},
  );
  assert.ok(validateDraftStep(initialDraft, 1).date);
  assert.deepEqual(validateDraftStep(validDraft, 2), {});
});

test("schedule rejects impossible dates and reversed/same-day times", () => {
  assert.ok(validateDraftStep({ ...validDraft, date: "2026-02-30" }, 1).date);
  assert.ok(validateDraftStep({ ...validDraft, date: "not-a-date" }, 1).date);
  assert.ok(validateDraftStep({ ...validDraft, endTime: "08:00" }, 1).endTime);
  assert.ok(validateDraftStep({ ...validDraft, endTime: "09:00" }, 1).endTime);
  assert.ok(
    validateDraftStep({ ...validDraft, startTime: "24:00" }, 1).startTime,
  );
});

test("capacity and attendance prerequisites are validated", () => {
  for (const capacity of ["", "0", "-1", "1.5", "100001", "abc"])
    assert.ok(validateDraftStep({ ...validDraft, capacity }, 1).capacity);
  assert.ok(
    validateDraftStep(
      {
        ...validDraft,
        modules: {
          ...validDraft.modules,
          registration: false,
          attendance: true,
        },
      },
      2,
    ).modules,
  );
});

test("restoring only accepts a valid versioned whitelist of non-personal draft fields", () => {
  assert.deepEqual(
    parseStoredDraft(JSON.stringify({ version: 1, draft: validDraft })),
    validDraft,
  );
  for (const value of [
    null,
    "",
    "bad json",
    "x".repeat(10001),
    JSON.stringify({ version: 0, draft: validDraft }),
    JSON.stringify({ version: 1, draft: initialDraft }),
    JSON.stringify({
      version: 1,
      draft: { ...validDraft, title: "x".repeat(101) },
    }),
  ])
    assert.equal(parseStoredDraft(value), null);
  const parsed = parseStoredDraft(
    JSON.stringify({
      version: 1,
      draft: { ...validDraft, secret: "must-not-restore" },
    }),
  );
  assert.equal("secret" in parsed, false);
});
