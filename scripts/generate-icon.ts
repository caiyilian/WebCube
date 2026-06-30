/**
 * Generate a minimal 256×256 PNG app icon for WebCube.
 *
 * Usage: npx tsx scripts/generate-icon.ts
 *
 * Produces: icons/icon.png (256×256 RGBA)
 *
 * The icon is a gradient-like design (dark blue → purple background
 * with a white "W"), suitable as a placeholder before a professional
 * icon is designed.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

const SIZE = 256
const cx = SIZE / 2
const cy = SIZE / 2

// ── Build pixel buffer (RGBA, row-major, top-to-bottom) ──────
const buf = Buffer.alloc(SIZE * SIZE * 4)

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = Math.sqrt(cx * cx + cy * cy)

    // Radial gradient: dark blue (#1a1a2e) → purple (#6d28d9)
    const t = Math.min(1, dist / maxDist)
    const r = Math.round(26 + (109 - 26) * t)
    const g = Math.round(26 + (40 - 26) * t)
    const b = Math.round(46 + (217 - 46) * t)

    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = 255  // opaque
  }
}

// ── Draw a simple "W" shape (white) ───────────────────────────
function drawPixel(px: number, py: number): void {
  if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) return
  const i = (py * SIZE + px) * 4
  buf[i] = 255
  buf[i + 1] = 255
  buf[i + 2] = 255
  buf[i + 3] = 255
}

function drawLine(x1: number, y1: number, x2: number, y2: number): void {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 0 : s / steps
    drawPixel(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t))
  }
}

// W letter: four strokes
const wY = Math.round(SIZE * 0.45)
const wH = Math.round(SIZE * 0.4)
const wLeft = Math.round(SIZE * 0.2)
const wMid = Math.round(SIZE * 0.5)
const wRight = Math.round(SIZE * 0.8)

drawLine(wLeft, wY, wLeft + 10, wY + wH)        // left leg down
drawLine(wLeft + 10, wY + wH, wMid, wY + 5)      // up to middle
drawLine(wMid, wY + 5, wRight - 10, wY + wH)     // down to right
drawLine(wRight - 10, wY + wH, wRight, wY)       // right leg up

// ── Build PNG ─────────────────────────────────────────────────

function crc32(data: Buffer): number {
  let c = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    c = crc32Table[(c ^ data[i]) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

const crc32Table = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crc32Table[n] = c
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeB, data])
  const crcB = Buffer.alloc(4)
  crcB.writeUInt32BE(crc32(crcData))
  return Buffer.concat([len, typeB, data, crcB])
}

// IHDR
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)   // width
ihdr.writeUInt32BE(SIZE, 4)   // height
ihdr[8] = 8                    // bit depth
ihdr[9] = 6                    // color type: RGBA
ihdr[10] = 0                   // compression
ihdr[11] = 0                   // filter
ihdr[12] = 0                   // interlace

// IDAT — raw data with filter byte (0) per row
const rawRows = Buffer.alloc(SIZE * (1 + SIZE * 4))
for (let y = 0; y < SIZE; y++) {
  rawRows[y * (1 + SIZE * 4)] = 0  // filter: None
  buf.copy(rawRows, y * (1 + SIZE * 4) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}
const compressed = deflateSync(rawRows)

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

const outPath = resolve(import.meta.dirname, '..', 'icons', 'icon.png')
writeFileSync(outPath, png)
console.log(`Icon generated: ${outPath} (${png.length} bytes)`)
