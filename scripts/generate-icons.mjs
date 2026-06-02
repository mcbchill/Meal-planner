// Generates PWA icons as PNGs with no external dependencies (pure Node + zlib).
// Draws a simple "meal bowl" mark: brand-green field, a white plate, and a few
// ingredient dots. Run: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const GREEN = [22, 163, 74]
const WHITE = [255, 255, 255]
const ING = [
  [234, 88, 12], // protein / orange
  [132, 204, 22], // veg / green
  [253, 224, 150], // grain / cream
]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function circle(px, W, cxf, cyf, rf, color) {
  const cx = Math.round(cxf)
  const cy = Math.round(cyf)
  const r = Math.round(rf)
  const r2 = r * r
  const y0 = Math.max(0, cy - r)
  const y1 = Math.min(W, cy + r + 1)
  const x0 = Math.max(0, cx - r)
  const x1 = Math.min(W, cx + r + 1)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        const i = (y * W + x) * 4
        px[i] = color[0]
        px[i + 1] = color[1]
        px[i + 2] = color[2]
        px[i + 3] = 255
      }
    }
  }
}

function makePng(W) {
  const px = new Uint8Array(W * W * 4)
  // green field (full-bleed so it works as a maskable icon)
  for (let i = 0; i < W * W; i++) {
    px[i * 4] = GREEN[0]
    px[i * 4 + 1] = GREEN[1]
    px[i * 4 + 2] = GREEN[2]
    px[i * 4 + 3] = 255
  }
  const c = W / 2
  circle(px, W, c, c, W * 0.34, WHITE) // plate
  const ir = W * 0.1
  const off = W * 0.13
  circle(px, W, c, c - off, ir, ING[0])
  circle(px, W, c - off, c + off * 0.7, ir, ING[1])
  circle(px, W, c + off, c + off * 0.7, ir, ING[2])

  // raw scanlines with filter byte 0
  const raw = Buffer.alloc(W * (W * 4 + 1))
  for (let y = 0; y < W; y++) {
    raw[y * (W * 4 + 1)] = 0
    for (let x = 0; x < W * 4; x++) {
      raw[y * (W * 4 + 1) + 1 + x] = px[y * W * 4 + x]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(W, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
for (const size of [32, 180, 192, 512]) {
  writeFileSync(`public/icon-${size}.png`, makePng(size))
  console.log(`wrote public/icon-${size}.png`)
}
