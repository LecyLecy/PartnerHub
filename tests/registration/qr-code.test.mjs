import assert from "node:assert/strict";
import test from "node:test";
import { loadTs } from "../helpers/load-ts.mjs";

const { encodeQr, QR_MAX_BYTES } = loadTs("src/features/registration/qr/qr-code.ts");

const flat = (qr) => qr.modules.map((row) => row.map((m) => (m ? "1" : "0")).join("")).join("\n");

test("exports the level M byte capacity of version 6", () => {
  assert.equal(QR_MAX_BYTES, 106);
});

test("smallest fitting version is chosen from the UTF-8 byte length", () => {
  const cases = [[1, 21], [14, 21], [15, 25], [26, 25], [27, 29], [42, 29], [43, 33], [62, 33], [63, 37], [84, 37], [85, 41], [106, 41]];
  for (const [length, size] of cases) {
    const qr = encodeQr("a".repeat(length));
    assert.equal(qr.size, size, `${length} bytes`);
    assert.equal(qr.modules.length, size);
    assert.ok(qr.modules.every((row) => row.length === size));
  }
});

test("finder patterns, separators, timing lines and the dark module are in place", () => {
  for (const length of [1, 15, 27, 43, 63, 85]) {
    const { size, modules } = encodeQr("b".repeat(length));
    for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
          assert.equal(modules[r0 + r][c0 + c], ring !== 2, `finder at ${r0},${c0} cell ${r},${c} size ${size}`);
        }
      }
    }
    for (let i = 8; i < size - 8; i++) {
      assert.equal(modules[6][i], i % 2 === 0);
      assert.equal(modules[i][6], i % 2 === 0);
    }
    assert.equal(modules[size - 8][8], true);
  }
});

test("alignment pattern is present from version 2", () => {
  const { modules } = encodeQr("c".repeat(15));
  for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) assert.equal(modules[18 + r][18 + c], Math.max(Math.abs(r), Math.abs(c)) !== 1);
});

test("output is deterministic and depends on the input", () => {
  assert.equal(flat(encodeQr("PH1.abcdefghijklmnopqrstuvwx")), flat(encodeQr("PH1.abcdefghijklmnopqrstuvwx")));
  assert.notEqual(flat(encodeQr("PH1.abcdefghijklmnopqrstuvwx")), flat(encodeQr("PH1.abcdefghijklmnopqrstuvwy")));
});

test("empty and oversized payloads are rejected", () => {
  assert.throws(() => encodeQr(""), RangeError);
  assert.throws(() => encodeQr("x".repeat(107)), RangeError);
  assert.throws(() => encodeQr("é".repeat(54)), RangeError);
});

test("multi-byte UTF-8 is measured in bytes", () => {
  assert.equal(encodeQr("Tiket \u{1F3AB} é").size, 21); // 13 bytes, not 9 characters
  assert.equal(encodeQr("Tiket \u{1F3AB} éé").size, 25); // 15 bytes
  assert.equal(encodeQr("é".repeat(8)).size, 25);
  assert.equal(encodeQr("é".repeat(53)).size, 41);
});
