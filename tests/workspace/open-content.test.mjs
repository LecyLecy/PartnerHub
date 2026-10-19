import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

test("application content never uses details, summary or Accordion disclosure components", () => {
  const root = path.resolve("src");
  const violations = [];
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { scan(file); continue; }
      if (!file.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node) {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^(details|summary|Accordion)$/.test(node.tagName.getText(source))) violations.push(path.relative(root, file));
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  scan(root);
  assert.deepEqual(violations, []);
});
