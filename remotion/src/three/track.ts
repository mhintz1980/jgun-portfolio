export type V3 = [number, number, number]
export interface CamKey {
  f: number
  pos: V3
  target: V3
  fov: number
  roll?: number
}

/** Non-uniform Catmull-Rom (Hermite) through camera keys: continuous velocity through every
 *  key, eased only at the first and last key, so the camera never "stops at a waypoint". */
export function track(keys: CamKey[], frame: number) {
  const n = keys.length
  if (frame <= keys[0].f) return { pos: keys[0].pos, target: keys[0].target, fov: keys[0].fov, roll: keys[0].roll ?? 0 }
  if (frame >= keys[n - 1].f) {
    const k = keys[n - 1]
    return { pos: k.pos, target: k.target, fov: k.fov, roll: k.roll ?? 0 }
  }
  let i = 0
  while (i < n - 2 && frame > keys[i + 1].f) i++
  const k0 = keys[Math.max(0, i - 1)]
  const k1 = keys[i]
  const k2 = keys[i + 1]
  const k3 = keys[Math.min(n - 1, i + 2)]
  const dt = k2.f - k1.f
  // Zero tangents at the first and last key ease the whole move in and out.
  const t = (frame - k1.f) / dt
  const h = (a: number, b: number, c: number, d: number, fa: number, fb: number, fc: number, fd: number) => {
    const m1 = i === 0 ? 0 : ((c - a) / Math.max(1, fc - fa)) * dt
    const m2 = i === n - 2 ? 0 : ((d - b) / Math.max(1, fd - fb)) * dt
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * c + (t3 - t2) * m2
  }
  const v = (get: (k: CamKey) => number) => h(get(k0), get(k1), get(k2), get(k3), k0.f, k1.f, k2.f, k3.f)
  return {
    pos: [v((k) => k.pos[0]), v((k) => k.pos[1]), v((k) => k.pos[2])] as V3,
    target: [v((k) => k.target[0]), v((k) => k.target[1]), v((k) => k.target[2])] as V3,
    fov: v((k) => k.fov),
    roll: v((k) => k.roll ?? 0),
  }
}

/** Khronos PBR Neutral tone mapping (three's NeutralToneMapping), forward. */
function neutral(c: V3): V3 {
  const start = 0.8 - 0.04
  const desat = 0.15
  const x = Math.min(c[0], c[1], c[2])
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04
  let r = c[0] - offset
  let g = c[1] - offset
  let b = c[2] - offset
  const peak = Math.max(r, g, b)
  if (peak < start) return [r, g, b]
  const d = 1 - start
  const newPeak = 1 - (d * d) / (peak + d - start)
  r *= newPeak / peak
  g *= newPeak / peak
  b *= newPeak / peak
  const gg = 1 - 1 / (desat * (peak - newPeak) + 1)
  return [r + (newPeak - r) * gg, g + (newPeak - g) * gg, b + (newPeak - b) * gg]
}
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

/** The linear clear colour that lands on `hex` after Neutral tone mapping — so the WebGL
 *  background matches the HTML paper/navy exactly. */
export function preToneMapped(hex: string): V3 {
  const n = parseInt(hex.replace('#', ''), 16)
  const target: V3 = [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)]
  const x: V3 = [...target]
  for (let k = 0; k < 60; k++) {
    const y = neutral(x)
    for (let c = 0; c < 3; c++) x[c] = Math.max(0, x[c] + (target[c] - y[c]) * 1.2)
  }
  return x
}

export function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
  return '#' + [ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, '0')).join('')
}
