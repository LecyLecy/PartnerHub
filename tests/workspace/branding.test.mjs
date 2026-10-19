import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("brand PNGs retain the approved transparent artwork and dimensions, with the same compact favicon", () => {
  for (const [path, hash, width, height] of [
    ["public/brand/partnerhub-wordmark-transparent-hd.png", "aa8abbb35a19167c172c8e5a424f4fdc6bd56834877f1ca6c32d0d8e99b35974", 2172, 724],
    ["public/brand/partnerhub-mark-transparent-hd.png", "dfbc986c71d798026f1620c0a03987dc53ad6f24f6a1994395deb14db3949eb1", 1254, 1254],
    ["src/app/icon.png", "dfbc986c71d798026f1620c0a03987dc53ad6f24f6a1994395deb14db3949eb1", 1254, 1254],
  ]) {
    const bytes = readFileSync(path);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, path);
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
    assert.equal(bytes[25], 6, "RGBA PNG retains its alpha channel");
  }
  assert.equal(existsSync("src/app/icon.svg"), false, "superseded P favicon is removed");
  assert.equal(existsSync("assets/partnerhub-logo.svg"), false, "superseded P asset is removed");
  assert.equal(existsSync("public/brand/partnerhub-wordmark.png"), false, "opaque wordmark is removed");
  assert.equal(existsSync("public/brand/partnerhub-mark.png"), false, "opaque compact logo is removed");
});

test("README and shared brand components reference the transparent artwork instead of old logos", () => {
  const readme = readFileSync("README.md", "utf8");
  assert.match(readme, /<img src="\.\/public\/brand\/partnerhub-wordmark-transparent-hd\.png"[^>]+alt="PartnerHub/);
  const source = readFileSync("src/lib/ui/icons.tsx", "utf8");
  assert.match(source, /href="\/brand\/partnerhub-wordmark-transparent-hd\.png"/);
  assert.match(source, /href="\/brand\/partnerhub-mark-transparent-hd\.png"/);
  assert.doesNotMatch(source, /M20 12h32c20 0 34/);
});
