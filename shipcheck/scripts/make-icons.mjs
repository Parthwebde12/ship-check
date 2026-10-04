import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const BLUE = [9, 105, 218]
const WHITE = [255, 255, 255]

// --- minimal PNG encoder ---
const table = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

// --- shapes ---
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// 0 = transparent, 1 = blue, 2 = white (u, v in 0..1)
function layerAt(u, v) {
  const r = 0.22
  const cx = Math.min(Math.max(u, r), 1 - r)
  const cy = Math.min(Math.max(v, r), 1 - r)
  if (Math.hypot(u - cx, v - cy) > r) return 0

  const d = Math.min(
    distToSegment(u, v, 0.25, 0.52, 0.43, 0.7),
    distToSegment(u, v, 0.43, 0.7, 0.76, 0.32)
  )
  return d <= 0.07 ? 2 : 1
}

function makePng(size) {
  const SS = 3 // 3x3 supersampling for smooth edges
  const stride = size * 4 + 1
  const raw = Buffer.alloc(stride * size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let n = 0, r = 0, g = 0, b = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const layer = layerAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size)
          if (layer) {
            const c = layer === 2 ? WHITE : BLUE
            r += c[0]; g += c[1]; b += c[2]; n++
          }
        }
      }
      const i = y * stride + 1 + x * 4
      raw[i] = n ? Math.round(r / n) : 0
      raw[i + 1] = n ? Math.round(g / n) : 0
      raw[i + 2] = n ? Math.round(b / n) : 0
      raw[i + 3] = Math.round((255 * n) / (SS * SS))
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
for (const s of [16, 48, 128]) {
  writeFileSync(`public/icons/icon${s}.png`, makePng(s))
}
console.log('Icons written to public/icons')