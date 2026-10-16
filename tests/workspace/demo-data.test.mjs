import assert from "node:assert/strict";
import test from "node:test";
import {
  demoEvents,
  filterDemoEvents,
  getDemoTotals,
  preparationSteps,
} from "../../src/features/workspace/demo-data.ts";

test("workspace totals match the labelled synthetic records", () => {
  assert.deepEqual(getDemoTotals(), {
    registrations: 128,
    applications: 12,
    checkIns: 0,
    benefitsVerified: 2,
    benefitsTotal: 4,
  });
  for (const event of demoEvents) {
    assert.ok(event.id.startsWith("demo-"));
    assert.ok(event.registrations <= event.capacity);
    assert.ok(event.benefitsVerified <= event.benefitsTotal);
  }
});

test("search trims input, ignores case, and combines with status", () => {
  assert.equal(filterDemoEvents("  FORUM  ", "all")[0]?.id, "demo-forum");
  assert.equal(filterDemoEvents("", "DRAFT")[0]?.id, "demo-workshop");
  assert.equal(filterDemoEvents("forum", "DRAFT").length, 0);
  assert.equal(filterDemoEvents("does not exist", "all").length, 0);
  assert.equal(filterDemoEvents("", "all").length, 2);
});

test("preparation guide covers the approved operational flow without deferred work", () => {
  assert.equal(preparationSteps.length, 5);
  assert.match(preparationSteps[1].detail, /consent/);
  assert.match(
    preparationSteps[3].detail,
    /QR tidak boleh memuat data pribadi/,
  );
});
