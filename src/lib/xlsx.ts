export type XlsxCell = string | number | boolean | null | undefined;
export type XlsxSheet = { name: string; rows: XlsxCell[][] };

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_ROWS = 10000;
const MAX_COLUMNS = 50;
const MAX_CELL_CHARS = 32000;
const MAX_SHEET_NAME = 31;

/** Removes code units that are invalid in XML 1.0 (controls, lone surrogates, U+FFFE/U+FFFF). */
function stripInvalidXml(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += value.slice(i, i + 2);
        i++;
      }
    } else if (c === 0x9 || c === 0xa || c === 0xd || (c >= 0x20 && c < 0xd800) || (c >= 0xe000 && c <= 0xfffd)) {
      out += value[i];
    }
  }
  return out;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"'\r]/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return "&#13;"; // a raw CR would be normalized to LF by XML parsers
    }
  });
}

/** 0-based column index to spreadsheet letters: 0 -> A, 26 -> AA. */
function columnLetters(index: number): string {
  let letters = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
}

function sheetNames(sheets: readonly XlsxSheet[]): string[] {
  const used = new Set<string>();
  return sheets.map((sheet, index) => {
    let base = stripInvalidXml(sheet.name)
      .replace(/[[\]:*?/\\]/g, "")
      .trim()
      .slice(0, MAX_SHEET_NAME)
      .replace(/^'+|'+$/g, "")
      .trim();
    if (!base) base = `Sheet ${index + 1}`;
    let name = base;
    for (let n = 2; used.has(name.toLowerCase()); n++) {
      const suffix = ` (${n})`;
      name = base.slice(0, MAX_SHEET_NAME - suffix.length) + suffix;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

function cleanText(value: string): string {
  return stripInvalidXml(value.slice(0, MAX_CELL_CHARS));
}

function sheetXml(sheet: XlsxSheet): string {
  const { rows } = sheet;
  if (rows.length > MAX_ROWS) throw new RangeError(`A sheet may have at most ${MAX_ROWS} rows`);
  const widths: number[] = [];
  const rowXml = rows.map((row, r) => {
    if (row.length > MAX_COLUMNS) throw new RangeError(`A sheet may have at most ${MAX_COLUMNS} columns`);
    const style = r === 0 ? ' s="1"' : "";
    let cells = "";
    row.forEach((cell, c) => {
      let longest: number;
      let xml: string;
      if (typeof cell === "string") {
        const text = cleanText(cell);
        longest = Math.max(...text.split(/\r\n|\r|\n/).map((line) => line.length));
        xml = `<c r="${columnLetters(c)}${r + 1}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
      } else if (typeof cell === "number" && Number.isFinite(cell)) {
        longest = String(cell).length;
        xml = `<c r="${columnLetters(c)}${r + 1}"${style}><v>${cell}</v></c>`;
      } else if (typeof cell === "boolean") {
        longest = cell ? 4 : 5;
        xml = `<c r="${columnLetters(c)}${r + 1}"${style} t="b"><v>${cell ? 1 : 0}</v></c>`;
      } else {
        return; // null, undefined and non-finite numbers stay empty
      }
      widths[c] = Math.max(widths[c] ?? 0, longest);
      cells += xml;
    });
    return `<row r="${r + 1}">${cells}</row>`;
  });

  const cols = widths
    .map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${Math.min(60, Math.max(8, w + 2))}" customWidth="1"/>`) // sparse: skips empty columns
    .join("");
  const pane = rows.length > 1 ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : "";
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    (cols ? `<cols>${cols}</cols>` : "") +
    `<sheetData>${rowXml.join("")}</sheetData></worksheet>`
  );
}

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const STYLES_XML =
  XML_HEADER +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

// --- ZIP container (STORE only) ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = (CRC_TABLE[(crc ^ (data[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1; // 2020-01-01, fixed for deterministic output

function zipStore(files: readonly { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const entries = files.map((f) => ({ ...f, nameBytes: encoder.encode(f.name), crc: crc32(f.data) }));
  const localSize = entries.reduce((sum, e) => sum + 30 + e.nameBytes.length + e.data.length, 0);
  const centralSize = entries.reduce((sum, e) => sum + 46 + e.nameBytes.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  let pos = 0;
  const offsets: number[] = [];

  for (const e of entries) {
    offsets.push(pos);
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true); // version needed
    view.setUint16(pos + 6, 0x0800, true); // UTF-8 names
    view.setUint16(pos + 8, 0, true); // STORE
    view.setUint16(pos + 10, DOS_TIME, true);
    view.setUint16(pos + 12, DOS_DATE, true);
    view.setUint32(pos + 14, e.crc, true);
    view.setUint32(pos + 18, e.data.length, true);
    view.setUint32(pos + 22, e.data.length, true);
    view.setUint16(pos + 26, e.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true);
    out.set(e.nameBytes, pos + 30);
    out.set(e.data, pos + 30 + e.nameBytes.length);
    pos += 30 + e.nameBytes.length + e.data.length;
  }

  const centralStart = pos;
  entries.forEach((e, i) => {
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true); // version made by
    view.setUint16(pos + 6, 20, true); // version needed
    view.setUint16(pos + 8, 0x0800, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, DOS_TIME, true);
    view.setUint16(pos + 14, DOS_DATE, true);
    view.setUint32(pos + 16, e.crc, true);
    view.setUint32(pos + 20, e.data.length, true);
    view.setUint32(pos + 24, e.data.length, true);
    view.setUint16(pos + 28, e.nameBytes.length, true);
    // extra, comment, disk number, internal and external attributes stay zero
    view.setUint32(pos + 42, offsets[i] ?? 0, true);
    out.set(e.nameBytes, pos + 46);
    pos += 46 + e.nameBytes.length;
  });

  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, centralSize, true);
  view.setUint32(pos + 16, centralStart, true);
  return out;
}

/** First row of each sheet is the header row (bold, frozen). */
export function buildXlsx(sheets: readonly XlsxSheet[]): Uint8Array {
  if (sheets.length === 0) throw new RangeError("A workbook needs at least one sheet");
  const names = sheetNames(sheets);
  const sheetXmls = sheets.map(sheetXml);
  const indexes = sheets.map((_, i) => i + 1);

  const parts: Record<string, string> = {
    "[Content_Types].xml":
      XML_HEADER +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      indexes.map((i) => `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
      "</Types>",
    "_rels/.rels":
      XML_HEADER +
      `<Relationships xmlns="${REL_NS}"><Relationship Id="rId1" Type="${DOC_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml":
      XML_HEADER +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${DOC_REL}"><sheets>` +
      names.map((name, i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
      "</sheets></workbook>",
    "xl/_rels/workbook.xml.rels":
      XML_HEADER +
      `<Relationships xmlns="${REL_NS}">` +
      indexes.map((i) => `<Relationship Id="rId${i}" Type="${DOC_REL}/worksheet" Target="worksheets/sheet${i}.xml"/>`).join("") +
      `<Relationship Id="rId${sheets.length + 1}" Type="${DOC_REL}/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": STYLES_XML,
  };
  sheetXmls.forEach((xml, i) => {
    parts[`xl/worksheets/sheet${i + 1}.xml`] = xml;
  });

  const encoder = new TextEncoder();
  return zipStore(Object.entries(parts).map(([name, xml]) => ({ name, data: encoder.encode(xml) })));
}
