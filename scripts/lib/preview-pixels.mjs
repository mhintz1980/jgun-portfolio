import { inflateSync } from 'node:zlib'

/** Decode Playwright's non-interlaced 8-bit RGB/RGBA screenshots for comparison. */
export function pixels(png) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
  const channels = png[25] === 6 ? 4 : png[25] === 2 ? 3 : 0
  if (!channels || png[24] !== 8 || png[28] !== 0) throw new Error('Unsupported screenshot PNG')
  const chunks = []
  for (let i = 8; i < png.length;) {
    const n = png.readUInt32BE(i), type = png.toString('ascii', i + 4, i + 8)
    if (type === 'IDAT') chunks.push(png.subarray(i + 8, i + 8 + n))
    i += 12 + n
  }
  const data = inflateSync(Buffer.concat(chunks)), stride = width * channels, decoded = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x, left = x >= channels ? decoded[at - channels] : 0
      const up = y ? decoded[at - stride] : 0, corner = y && x >= channels ? decoded[at - stride - channels] : 0
      const predict = left + up - corner, dl = Math.abs(predict - left), du = Math.abs(predict - up), dc = Math.abs(predict - corner)
      const paeth = dl <= du && dl <= dc ? left : du <= dc ? up : corner
      const offset = [0, left, up, Math.floor((left + up) / 2), paeth][filter]
      if (offset === undefined) throw new Error('Unsupported PNG filter')
      decoded[at] = (data[y * (stride + 1) + 1 + x] + offset) & 255
    }
  }
  return { width, height, channels, data: decoded }
}

export function compare(a, b, threshold = 8) {
  a = pixels(a); b = pixels(b)
  if (a.width !== b.width || a.height !== b.height || a.channels !== b.channels) throw new Error('Screenshot sizes differ')
  let changed = 0, sum = 0
  for (let i = 0; i < a.data.length; i += a.channels) {
    let max = 0
    for (let c = 0; c < 3; c++) { const d = Math.abs(a.data[i + c] - b.data[i + c]); max = Math.max(max, d); sum += d }
    if (max > threshold) changed++
  }
  return { changed, fraction: changed / (a.width * a.height), meanChannelDelta: sum / (a.width * a.height * 3) }
}
