import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";
const { selectionPath } = loadTs("src/features/committee/selection-path.ts");
const stages = [{ id: "shortlist", name: "Daftar pendek" }, { id: "interview", name: "Wawancara" }];
const path = extra => selectionPath({ status: "ACCEPTED", stageId: null, stages, ...extra });
test("accepting after shortlist marks the unvisited interview skipped, never done", () => {
  assert.deepEqual(path({ visitedStageIds: ["shortlist"] }).map(step => step.state), ["done", "done", "skipped", "done"]);
});
test("legacy acceptance has unknown intermediate history, not fabricated completed or skipped stages", () => {
  assert.deepEqual(path({}).map(step => step.state), ["done", "unknown", "unknown", "done"]);
});
test("all visited stages complete only after acceptance", () => {
  assert.deepEqual(path({ visitedStageIds: ["shortlist", "interview"] }).map(step => step.state), ["done", "done", "done", "done"]);
  assert.deepEqual(path({ status: "IN_SELECTION", stageId: "interview", visitedStageIds: ["shortlist", "interview"] }).map(step => step.state), ["done", "done", "current", "waiting"]);
});
test("rejection and withdrawal stop at the recorded stage, and zero-stage acceptance is valid", () => {
  for (const status of ["REJECTED", "WITHDRAWN"]) assert.deepEqual(path({ status, stageId: "shortlist", visitedStageIds: ["shortlist"] }).map(step => step.state), ["done", "stopped", "waiting", "waiting"]);
  assert.deepEqual(path({ stages: [], visitedStageIds: [] }).map(step => step.state), ["done", "done"]);
});
