import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const nodeRequire = createRequire(import.meta.url);
const cache = new Map();

function resolve(request, from) {
  const base = request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : path.resolve(path.dirname(from), request);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) if (existsSync(candidate) && /\.tsx?$/.test(candidate)) return candidate;
  return null;
}

/** Loads a TypeScript source file for tests, resolving the "@/" alias and extensionless relative imports. */
export function loadTs(file) {
  const full = path.isAbsolute(file) ? file : path.join(root, file);
  if (cache.has(full)) return cache.get(full).exports;
  const output = ts.transpileModule(readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const loaded = { exports: {} };
  cache.set(full, loaded);
  const localRequire = (request) => {
    if (request.startsWith("@/") || request.startsWith(".")) {
      const target = resolve(request, full);
      if (target) return loadTs(target);
    }
    return nodeRequire(request);
  };
  new Function("require", "module", "exports", output)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
