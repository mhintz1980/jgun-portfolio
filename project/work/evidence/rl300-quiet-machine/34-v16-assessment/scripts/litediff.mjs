// Full-vs-lite difference map: dimmed full frame, changed pixels (>8/channel) painted magenta, plus a 4x3 region table.
import fs from 'node:fs'
import { deflateSync } from 'node:zlib'
import { pathToFileURL } from 'node:url'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { pixels } = await import(pathToFileURL(`${REPO}/scripts/lib/preview-pixels.mjs`).href)
const T = `${REPO}/project/work/evidence/rl300-quiet-machine/32-gpu-2/lite-vs-full-tiles`
const OUT = process.argv[2]
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c })
const crc = b => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0 }
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]) }
const png = (w, h, rgb) => {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
for (const name of ['u34-1440x900', 'u51-1440x900', 'u51-390x844']) {
  const a = pixels(fs.readFileSync(`${T}/${name}-full.png`)), b = pixels(fs.readFileSync(`${T}/${name}-lite.png`))
  const { width: w, height: h, channels: ch } = a
  const rgb = Buffer.alloc(w * h * 3)
  const gx = 4, gy = 3, cells = Array.from({ length: gx * gy }, () => 0)
  let changed = 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * ch, o = (y * w + x) * 3
    const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]))
    if (d > 8) { changed++; cells[Math.floor(y / h * gy) * gx + Math.floor(x / w * gx)]++; rgb[o] = 255; rgb[o + 1] = 0; rgb[o + 2] = Math.min(255, 120 + d) }
    else { rgb[o] = a.data[i] * .45; rgb[o + 1] = a.data[i + 1] * .45; rgb[o + 2] = a.data[i + 2] * .45 }
  }
  fs.writeFileSync(`${OUT}/lite-diff-${name}.png`, png(w, h, rgb))
  const per = cells.map(c => (c / (w * h / (gx * gy)) * 100).toFixed(0).padStart(3) + '%')
  console.log(`${name}: changed ${(changed / (w * h) * 100).toFixed(1)}%  grid(rows top->bottom, cols left->right, % of cell changed):`)
  for (let r = 0; r < gy; r++) console.log('   ' + per.slice(r * gx, r * gx + gx).join(' '))
}
