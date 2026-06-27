/**
 * Generate favicon + OG PNG assets (brand blue #0757d8, white "A" mark).
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = join(root, "images");
if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])) >>> 0);
  return Buffer.concat([len, Buffer.from(type), data, crcBuf]);
}

function inBar(sx, sy, bx, by, bw, bh) {
  return sx >= bx && sx <= bx + bw && sy >= by && sy <= by + bh;
}

function inTri(sx, sy, x1, y1, x2, y2, x3, y3) {
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  if (Math.abs(d) < 1e-6) return false;
  const a = ((y2 - y3) * (sx - x3) + (x3 - x2) * (sy - y3)) / d;
  const b = ((y3 - y1) * (sx - x3) + (x1 - x3) * (sy - y3)) / d;
  const c = 1 - a - b;
  return a >= 0 && b >= 0 && c >= 0;
}

function pixelColor(x, y, w, h) {
  const scale = w / 512;
  const sx = x / scale;
  const sy = y / scale;
  const bg = [7, 87, 216, 255];
  const white = [255, 255, 255, 255];
  const r = 92 * scale;

  if (x < r && y < r && (x - r) ** 2 + (y - r) ** 2 > r ** 2) return [0, 0, 0, 0];
  if (x > w - r && y < r && (x - (w - r)) ** 2 + (y - r) ** 2 > r ** 2) return [0, 0, 0, 0];
  if (x < r && y > h - r && (x - r) ** 2 + (y - (h - r)) ** 2 > r ** 2) return [0, 0, 0, 0];
  if (x > w - r && y > h - r && (x - (w - r)) ** 2 + (y - (h - r)) ** 2 > r ** 2) return [0, 0, 0, 0];

  if (
    inBar(sx, sy, 145, 112, 75, 288) ||
    inBar(sx, sy, 220, 112, 72, 132) ||
    inBar(sx, sy, 292, 112, 75, 288) ||
    inBar(sx, sy, 145, 303, 75, 97) ||
    inBar(sx, sy, 292, 303, 75, 97) ||
    inTri(sx, sy, 256, 145, 310, 272, 202, 272) ||
    inTri(sx, sy, 256, 145, 310, 272, 256, 183)
  ) {
    return white;
  }
  return bg;
}

function writePng(filePath, size) {
  const w = size;
  const h = size;
  const raw = Buffer.alloc((w * 4 + 1) * h);

  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1) + 1;
    for (let x = 0; x < w; x++) {
      const px = row + x * 4;
      const rgba = pixelColor(x, y, w, h);
      raw[px] = rgba[0];
      raw[px + 1] = rgba[1];
      raw[px + 2] = rgba[2];
      raw[px + 3] = rgba[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);

  writeFileSync(filePath, png);
  console.log("Wrote", filePath);
}

function writeIco(filePath, png32) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry[4] = 1;
  entry[6] = 32;
  entry.writeUInt32LE(png32.length, 8);
  entry.writeUInt32LE(22, 12);
  writeFileSync(filePath, Buffer.concat([header, entry, png32]));
  console.log("Wrote", filePath);
}

writePng(join(root, "favicon.png"), 32);
writePng(join(root, "apple-touch-icon.png"), 180);
writePng(join(imagesDir, "agh-logo-primary.png"), 512);
writeIco(join(root, "favicon.ico"), readFileSync(join(root, "favicon.png")));
