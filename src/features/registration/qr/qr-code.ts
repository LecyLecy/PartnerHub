/** Minimal QR Code encoder (ISO/IEC 18004): byte mode, error correction level M, versions 1 to 6. */

export const QR_MAX_BYTES = 106;

interface VersionSpec {
  totalCodewords: number;
  ecPerBlock: number;
  blocks: number;
  remainderBits: number;
  alignment: number[];
}

// Index 0 is version 1. Byte capacity at level M is 14, 26, 42, 62, 84, 106.
const VERSIONS: VersionSpec[] = [
  { totalCodewords: 26, ecPerBlock: 10, blocks: 1, remainderBits: 0, alignment: [] },
  { totalCodewords: 44, ecPerBlock: 16, blocks: 1, remainderBits: 7, alignment: [6, 18] },
  { totalCodewords: 70, ecPerBlock: 26, blocks: 1, remainderBits: 7, alignment: [6, 22] },
  { totalCodewords: 100, ecPerBlock: 18, blocks: 2, remainderBits: 7, alignment: [6, 26] },
  { totalCodewords: 134, ecPerBlock: 24, blocks: 2, remainderBits: 7, alignment: [6, 30] },
  { totalCodewords: 172, ecPerBlock: 16, blocks: 4, remainderBits: 7, alignment: [6, 34] },
];

// GF(256) with primitive polynomial 0x11D.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

/** Reed-Solomon remainder of `data` divided by the generator polynomial of degree `ecLen`. */
function reedSolomon(data: number[], ecLen: number): number[] {
  let generator = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array<number>(generator.length + 1).fill(0);
    generator.forEach((coef, j) => {
      next[j] ^= coef;
      next[j + 1] ^= gfMul(coef, EXP[i]);
    });
    generator = next;
  }
  const rem = new Array<number>(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift()!;
    rem.push(0);
    for (let i = 0; i < ecLen; i++) rem[i] ^= gfMul(generator[i + 1], factor);
  }
  return rem;
}

function buildCodewords(bytes: Uint8Array, version: number): number[] {
  const spec = VERSIONS[version - 1];
  const dataLen = spec.totalCodewords - spec.ecPerBlock * spec.blocks;
  const bits: number[] = [];
  const push = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, 8);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, dataLen * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; data.length < dataLen; pad ^= 0xec ^ 0x11) data.push(pad);

  const blockLen = dataLen / spec.blocks;
  const dataBlocks: number[][] = [];
  for (let i = 0; i < spec.blocks; i++) dataBlocks.push(data.slice(i * blockLen, (i + 1) * blockLen));
  const ecBlocks = dataBlocks.map((block) => reedSolomon(block, spec.ecPerBlock));

  const out: number[] = [];
  for (let i = 0; i < blockLen; i++) for (const block of dataBlocks) out.push(block[i]);
  for (let i = 0; i < spec.ecPerBlock; i++) for (const block of ecBlocks) out.push(block[i]);
  return out;
}

/** 15-bit format information for level M (bits 00) and the given mask. */
function formatBits(mask: number): number {
  const data = mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
  return ((data << 10) | rem) ^ 0x5412;
}

/** Both copies of the format bits plus the always-dark module, as [row, col, dark]. */
function formatCells(size: number, mask: number): Array<[number, number, boolean]> {
  const bits = formatBits(mask);
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const cells: Array<[number, number, boolean]> = [];
  for (let i = 0; i <= 5; i++) cells.push([i, 8, bit(i)]);
  cells.push([7, 8, bit(6)], [8, 8, bit(7)], [8, 7, bit(8)]);
  for (let i = 9; i < 15; i++) cells.push([8, 14 - i, bit(i)]);
  for (let i = 0; i < 8; i++) cells.push([8, size - 1 - i, bit(i)]);
  for (let i = 8; i < 15; i++) cells.push([size - 15 + i, 8, bit(i)]);
  cells.push([size - 8, 8, true]);
  return cells;
}

const MASKS: Array<(row: number, col: number) => boolean> = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

const FINDER_LIKE = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];

function penalty(grid: boolean[][]): number {
  const size = grid.length;
  let score = 0;
  let dark = 0;
  const lines: number[][] = [];
  for (let i = 0; i < size; i++) {
    lines.push(grid[i].map(Number));
    lines.push(grid.map((row) => Number(row[i])));
  }
  for (const line of lines) {
    // N1: runs of five or more; N3: finder-like 1:1:3:1:1 pattern with four light modules on one side.
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += 3 + run - 5;
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= size; i++) {
      if (FINDER_LIKE.every((v, k) => line[i + k] === v) || FINDER_LIKE.every((v, k) => line[i + 10 - k] === v)) score += 40;
    }
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) dark++;
      // N2: 2x2 blocks of one colour.
      if (r + 1 < size && c + 1 < size && grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 1][c + 1]) score += 3;
    }
  }
  // N4: deviation of the dark share from 50 percent, in steps of 5 percent.
  const total = size * size;
  return score + 10 * Math.floor(Math.abs(dark * 20 - total * 10) / total);
}

export function encodeQr(text: string): { size: number; modules: boolean[][] } {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length === 0) throw new RangeError("QR payload must not be empty");
  if (bytes.length > QR_MAX_BYTES) throw new RangeError(`QR payload is ${bytes.length} bytes, maximum is ${QR_MAX_BYTES}`);

  const version = VERSIONS.findIndex((spec) => bytes.length <= spec.totalCodewords - spec.ecPerBlock * spec.blocks - 2) + 1;
  const spec = VERSIONS[version - 1];
  const size = 17 + 4 * version;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunction = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (row: number, col: number, dark: boolean) => {
    if (row < 0 || col < 0 || row >= size || col >= size) return;
    modules[row][col] = dark;
    isFunction[row][col] = true;
  };

  // Finder patterns with separators (distance 4 is the light separator ring).
  for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const dist = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        setFn(r0 + dr, c0 + dc, dist !== 2 && dist !== 4);
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  // Versions 2 to 6 have one alignment pattern, at the last center in both axes.
  if (spec.alignment.length > 0) {
    const center = spec.alignment[1];
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) setFn(center + dr, center + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
  }
  const placeFormat = (mask: number) => {
    for (const [r, c, dark] of formatCells(size, mask)) setFn(r, c, dark);
  };
  placeFormat(0); // reserve the format areas before data placement

  // Zigzag placement in two-column strips from the bottom right, skipping timing column 6.
  const codewords = buildCodewords(bytes, version);
  const dataBits: boolean[] = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) dataBits.push(((cw >>> i) & 1) === 1);
  for (let i = 0; i < spec.remainderBits; i++) dataBits.push(false);
  let next = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (!isFunction[row][col]) modules[row][col] = dataBits[next++] ?? false;
      }
    }
  }

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  let bestMask = 0;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((line, r) => line.map((dark, c) => (isFunction[r][c] ? dark : dark !== MASKS[mask](r, c))));
    const score = penalty(applyFormat(candidate, mask));
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
      bestMask = mask;
    }
  }
  const result = best as boolean[][];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) modules[r][c] = result[r][c];
  placeFormat(bestMask);
  return { size, modules };
}

/** Returns a copy of `grid` with the format bits of `mask` written into it, for penalty scoring. */
function applyFormat(grid: boolean[][], mask: number): boolean[][] {
  const copy = grid.map((line) => line.slice());
  for (const [r, c, dark] of formatCells(grid.length, mask)) copy[r][c] = dark;
  return copy;
}
