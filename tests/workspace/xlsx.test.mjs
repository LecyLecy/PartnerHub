import assert from "node:assert/strict";
import test from "node:test";
import { inflateRawSync } from "node:zlib";
import { loadTs } from "../helpers/load-ts.mjs";

const { buildXlsx, XLSX_MIME } = loadTs("src/lib/xlsx.ts");

/** Minimal ZIP reader: walks the central directory and checks local headers. */
function readZip(bytes) {
  const buf = Buffer.from(bytes);
  const eocd = buf.length - 22;
  assert.equal(buf.readUInt32LE(eocd), 0x06054b50, "end of central directory");
  const count = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(pos), 0x02014b50);
    const method = buf.readUInt16LE(pos + 10);
    const crc = buf.readUInt32LE(pos + 16);
    const size = buf.readUInt32LE(pos + 24);
    const nameLength = buf.readUInt16LE(pos + 28);
    const local = buf.readUInt32LE(pos + 42);
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLength);
    assert.equal(buf.readUInt32LE(local), 0x04034b50);
    assert.equal(buf.readUInt32LE(local + 14), crc);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + size);
    const data = method === 0 ? raw : inflateRawSync(raw);
    assert.equal(method, 0, "STORE only");
    assert.equal(crc32(data), crc, `crc of ${name}`);
    entries.set(name, data.toString("utf8"));
    pos += 46 + nameLength;
  }
  assert.equal(pos, buf.readUInt32LE(eocd + 16) + buf.readUInt32LE(eocd + 12));
  return entries;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const sheetOf = (sheets, index = 1) => readZip(buildXlsx(sheets)).get(`xl/worksheets/sheet${index}.xml`);
const namesOf = (sheets) => [...readZip(buildXlsx(sheets)).get("xl/workbook.xml").matchAll(/<sheet name="([^"]*)"/g)].map((m) => m[1]);

test("exports the xlsx MIME type", () => {
  assert.equal(XLSX_MIME, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
});

test("produces a zip with the expected parts", () => {
  const bytes = buildXlsx([{ name: "A", rows: [["h"], ["v"]] }, { name: "B", rows: [["h"]] }]);
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(Buffer.from(bytes).readUInt32LE(0), 0x04034b50);
  assert.deepEqual([...readZip(bytes).keys()], [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
    "xl/worksheets/sheet2.xml",
  ]);
});

test("output is deterministic", () => {
  const sheets = [{ name: "Data", rows: [["a", "b"], [1, true], ["é😀", null]] }];
  assert.deepEqual(buildXlsx(sheets), buildXlsx(sheets));
});

test("styles define a normal and a bold cell format", () => {
  const styles = readZip(buildXlsx([{ name: "A", rows: [["h"]] }])).get("xl/styles.xml");
  assert.match(styles, /<fonts count="2">/);
  assert.match(styles, /<cellXfs count="2">/);
  assert.equal((styles.match(/<b\/>/g) ?? []).length, 1);
});

test("header row is bold and frozen, with no pane for a header-only sheet", () => {
  const xml = sheetOf([{ name: "A", rows: [["h"], ["v"]] }]);
  assert.match(xml, /<c r="A1" s="1" t="inlineStr">/);
  assert.match(xml, /<c r="A2" t="inlineStr">/);
  assert.match(xml, /<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"\/>/);
  assert.doesNotMatch(sheetOf([{ name: "A", rows: [["h"]] }]), /<pane/);
  assert.doesNotMatch(sheetOf([{ name: "A", rows: [] }]), /<pane/);
});

test("column letters continue past Z", () => {
  const row = Array.from({ length: 30 }, (_, i) => i);
  const xml = sheetOf([{ name: "A", rows: [row] }]);
  for (const ref of ["A1", "Z1", "AA1", "AB1", "AD1"]) assert.ok(xml.includes(`r="${ref}"`), ref);
  assert.ok(!xml.includes('r="AE1"'));
});

test("numbers, booleans and empty cells", () => {
  const xml = sheetOf([{ name: "A", rows: [["h1", "h2", "h3", "h4"], [1.5, true, null, false], [undefined, -3]] }]);
  assert.match(xml, /<c r="A2"><v>1.5<\/v><\/c>/);
  assert.match(xml, /<c r="B2" t="b"><v>1<\/v><\/c>/);
  assert.match(xml, /<c r="D2" t="b"><v>0<\/v><\/c>/);
  assert.match(xml, /<c r="B3"><v>-3<\/v><\/c>/);
  assert.ok(!xml.includes('r="C2"'));
  assert.ok(!xml.includes('r="A3"'));
  assert.match(xml, /<row r="3">/);
});

test("strings are escaped and invalid XML characters are stripped", () => {
  const xml = sheetOf([{ name: "A", rows: [[`a&b<c>d"e'f`], ["x\u0000y\u0008z\ufffe\uffff\ud800q\udc00w"], ["ok\t\u{1F600}é"]] }]);
  assert.ok(xml.includes("a&amp;b&lt;c&gt;d&quot;e&apos;f"));
  assert.ok(xml.includes("<t xml:space=\"preserve\">xyzqw</t>"));
  assert.ok(xml.includes("ok\t\u{1F600}é"));
});

test("newlines inside cells are kept", () => {
  const xml = sheetOf([{ name: "A", rows: [["one\ntwo\r\nthree"]] }]);
  assert.ok(xml.includes("one\ntwo&#13;\nthree"));
});

test("formula-looking strings stay inline strings", () => {
  const xml = sheetOf([{ name: "A", rows: [["=SUM(1,2)", "+1", "-1", "@x"]] }]);
  assert.doesNotMatch(xml, /<f[ >]/);
  for (const ref of ["A1", "B1", "C1", "D1"]) assert.match(xml, new RegExp(`<c r="${ref}" s="1" t="inlineStr">`));
  assert.ok(xml.includes("<t xml:space=\"preserve\">=SUM(1,2)</t>"));
});

test("sheet names follow the Excel rules", () => {
  const long = "x".repeat(40);
  assert.deepEqual(namesOf([{ name: "  Pe[se]rta:*?/\\  ", rows: [] }]), ["Peserta"]);
  assert.deepEqual(namesOf([{ name: long, rows: [] }]), ["x".repeat(31)]);
  assert.deepEqual(namesOf([{ name: "   ", rows: [] }, { name: "[]", rows: [] }]), ["Sheet 1", "Sheet 2"]);
  const dupes = namesOf([{ name: "Data", rows: [] }, { name: "data", rows: [] }, { name: "DATA", rows: [] }]);
  assert.deepEqual(dupes, ["Data", "data (2)", "DATA (3)"]);
  const longDupes = namesOf([{ name: long, rows: [] }, { name: long, rows: [] }]);
  assert.equal(longDupes[1].length, 31);
  assert.equal(new Set(longDupes.map((n) => n.toLowerCase())).size, 2);
});

test("sheet names are XML-escaped in the workbook part", () => {
  const workbook = readZip(buildXlsx([{ name: "A&B'C", rows: [] }])).get("xl/workbook.xml");
  assert.ok(workbook.includes('name="A&amp;B&apos;C"'));
});

test("column widths come from the longest line, clamped to 8..60", () => {
  const xml = sheetOf([{ name: "A", rows: [["ab", "x".repeat(20), "y".repeat(200)], ["a\nlonger line", 1, "z"]] }]);
  assert.match(xml, /<col min="1" max="1" width="13" customWidth="1"\/>/);
  assert.match(xml, /<col min="2" max="2" width="22" customWidth="1"\/>/);
  assert.match(xml, /<col min="3" max="3" width="60" customWidth="1"\/>/);
  assert.match(sheetOf([{ name: "A", rows: [["a"]] }]), /width="8"/);
});

test("limits: rows, columns, and cell length", () => {
  assert.doesNotThrow(() => buildXlsx([{ name: "A", rows: Array.from({ length: 10000 }, () => ["x"]) }]));
  assert.throws(() => buildXlsx([{ name: "A", rows: Array.from({ length: 10001 }, () => ["x"]) }]), RangeError);
  assert.doesNotThrow(() => buildXlsx([{ name: "A", rows: [new Array(50).fill(1)] }]));
  assert.throws(() => buildXlsx([{ name: "A", rows: [new Array(51).fill(1)] }]), RangeError);
  const xml = sheetOf([{ name: "A", rows: [["x".repeat(40000)]] }]);
  assert.equal(/<t xml:space="preserve">(x*)<\/t>/.exec(xml)?.[1].length, 32000);
});
