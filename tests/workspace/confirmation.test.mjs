import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

test("application source never uses native confirm, alert or prompt", () => {
  function inspect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (/\.tsx?$/.test(file)) {
        assert.doesNotMatch(readFileSync(file, "utf8"), /\b(?:window\.)?(?:confirm|alert|prompt)\s*\(\s*["'`]/, file);
      }
    }
  }
  inspect("src");
});
