// scripts/generate-noise.ts
// Generates a 256x256 noise texture PNG for the film grain overlay.
// Uses raw PNG encoding without external image libraries.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const SIZE = 256;
const __dirname = typeof import.meta.dirname === 'string'
  ? import.meta.dirname
  : dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'public', 'textures', 'noise-256.png');

function createNoisePNG(size: number): Buffer {
  // Build raw image data: each row = filter byte (0) + RGBA pixels
  const rawData = Buffer.alloc((1 + size * 4) * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    rawData[rowOffset] = 0; // PNG filter: None

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const noise = Math.floor(Math.random() * 256);
      rawData[pixelOffset] = noise;       // R
      rawData[pixelOffset + 1] = noise;   // G
      rawData[pixelOffset + 2] = noise;   // B
      rawData[pixelOffset + 3] = 255;     // A (fully opaque — opacity controlled by CSS)
    }
  }

  const compressedData = deflateSync(rawData);

  // PNG file structure
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = createChunk('IHDR', (() => {
    const buf = Buffer.alloc(13);
    buf.writeUInt32BE(size, 0);   // width
    buf.writeUInt32BE(size, 4);   // height
    buf[8] = 8;                   // bit depth
    buf[9] = 6;                   // color type: RGBA
    buf[10] = 0;                  // compression
    buf[11] = 0;                  // filter
    buf[12] = 0;                  // interlace
    return buf;
  })());

  const idat = createChunk('IDAT', compressedData);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIGNATURE, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf: Buffer): number {
  const CRC_TABLE: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    CRC_TABLE[n] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate and write
const pngBuffer = createNoisePNG(SIZE);
writeFileSync(OUTPUT_PATH, pngBuffer);
console.log(`Noise texture written to ${OUTPUT_PATH} (${pngBuffer.length} bytes)`);
