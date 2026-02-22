#!/usr/bin/env node
/* Generates PWA icons (192x192 and 512x512 PNG) for FinaTrak.
   Design: dark background (#0a0a0f) with 3 ascending orange (#f97316) bars.
   Uses only Node.js built-ins — no external dependencies.
*/

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── CRC32 ─────────────────────────────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buildChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── PNG builder ───────────────────────────────────────────────────────────────

function createPng(size) {
  const BG = [10, 10, 15];     // #0a0a0f
  const ACC = [249, 115, 22];  // #f97316

  // Pixel buffer (RGB)
  const img = Buffer.alloc(size * size * 3);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    img[i * 3] = BG[0];
    img[i * 3 + 1] = BG[1];
    img[i * 3 + 2] = BG[2];
  }

  function setPixel(x, y) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const p = (y * size + x) * 3;
    img[p] = ACC[0];
    img[p + 1] = ACC[1];
    img[p + 2] = ACC[2];
  }

  // Draw 3 ascending bars
  const barW = Math.round(size * 0.13);
  const gap = Math.round(size * 0.07);
  const totalW = barW * 3 + gap * 2;
  const startX = Math.round((size - totalW) / 2);
  const baseY = Math.round(size * 0.70);
  const maxH = Math.round(size * 0.42);
  const cornerR = Math.round(barW * 0.32);

  const barHeights = [
    Math.round(maxH * 0.45),
    Math.round(maxH * 0.72),
    Math.round(maxH),
  ];

  barHeights.forEach((barH, i) => {
    const bx = startX + i * (barW + gap);
    const by = baseY - barH;

    // Filled rectangle (bar body)
    for (let y = by + cornerR; y < baseY; y++) {
      for (let x = bx; x < bx + barW; x++) {
        setPixel(x, y);
      }
    }

    // Rounded top cap using circle
    for (let dy = -cornerR; dy <= cornerR; dy++) {
      for (let dx = -cornerR; dx <= cornerR; dx++) {
        if (dx * dx + dy * dy <= cornerR * cornerR) {
          setPixel(bx + cornerR + dx, by + cornerR + dy);
          setPixel(bx + barW - cornerR - 1 + dx, by + cornerR + dy);
        }
      }
    }
    // Fill top rectangle between the two rounded corners
    for (let y = by; y <= by + cornerR; y++) {
      for (let x = bx + cornerR; x < bx + barW - cornerR; x++) {
        setPixel(x, y);
      }
    }
  });

  // Build PNG scanlines with filter byte 0 (None)
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    img.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    buildChunk("IHDR", ihdr),
    buildChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    buildChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Output ────────────────────────────────────────────────────────────────────

const outputDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outputDir, { recursive: true });

for (const size of [192, 512]) {
  const dest = path.join(outputDir, `icon-${size}.png`);
  fs.writeFileSync(dest, createPng(size));
  console.log(`✓ icon-${size}.png`);
}
