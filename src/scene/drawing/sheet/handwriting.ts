/**
 * JG-035 O2 — deterministic single-stroke hand lettering for margin notes on the drawing.
 *
 * A tiny monoline "engineer's print" font authored as polylines (no OS handwriting fonts, no
 * canvas), expanded with seeded per-glyph wobble so the note reads as ink from a pen rather than
 * type. Everything is a pure function of (text, options): identical output on every machine, in
 * every direction of scroll, and between the live bake and the cached asset.
 *
 * Glyph units: baseline y = 0, x-height 5, capital/digit height 7.5, ascender 8, descender -2.5.
 */

export type Pt = [number, number]
export interface HandStroke { points: Pt[]; red?: boolean }

const D2R = Math.PI / 180

const poly = (...v: number[]): Pt[] => { const out: Pt[] = []; for (let i = 0; i < v.length; i += 2) out.push([v[i], v[i + 1]]); return out }

/** Elliptical arc, angles in degrees (CCW positive in glyph space, y up). Sampled finely enough for 1.3x zoom. */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Pt[] {
  const n = Math.max(10, Math.ceil(Math.abs(a1 - a0) / 12))
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) { const a = (a0 + ((a1 - a0) * i) / n) * D2R; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]) }
  return out
}

/** Cubic Bezier chain from an SVG-ish flat list: start point then [c1, c2, end] triples. */
function curve(start: Pt, ...segments: [Pt, Pt, Pt][]): Pt[] {
  const out: Pt[] = [start]
  let p0 = start
  for (const [c1, c2, p1] of segments) {
    for (let i = 1; i <= 10; i++) {
      const t = i / 10, u = 1 - t
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
      ])
    }
    p0 = p1
  }
  return out
}
const join = (...parts: Pt[][]): Pt[] => parts.flatMap((part, i) => (i === 0 ? part : part.slice(1)))
const L = (x: number, y: number): [Pt, Pt, Pt] => [[x, y], [x, y], [x, y]]

interface Glyph { w: number; strokes: Pt[][] }

const BOWL_R = 2.2
const bowlCW = (cx: number): Pt[] => arc(cx, 2.5, BOWL_R, 2.5, 180, -180)
const bowlCCW = (cx: number): Pt[] => arc(cx, 2.5, 2.1, 2.5, 50, 410)

export const GLYPHS: Readonly<Record<string, Glyph>> = {
  ' ': { w: 2.6, strokes: [] },
  a: { w: 5.6, strokes: [bowlCCW(2.4), poly(4.5, 5, 4.5, 0)] },
  b: { w: 5.4, strokes: [poly(0.5, 8, 0.5, 0), bowlCW(2.7)] },
  c: { w: 5, strokes: [arc(2.7, 2.5, 2.3, 2.5, 45, 315)] },
  d: { w: 5.6, strokes: [arc(2.6, 2.5, 2.2, 2.5, 0, 360), poly(4.9, 8, 4.9, 0)] },
  e: { w: 5.2, strokes: [join(poly(0.4, 2.6, 4.7, 2.6), arc(2.5, 2.5, 2.3, 2.5, 0, 315))] },
  f: { w: 3.8, strokes: [join(curve([4.1, 7.8], [[3.2, 8.4], [2.2, 8.2], [2.2, 6.6]]), poly(2.2, 6.6, 2.2, 0)), poly(0.7, 5, 3.9, 5)] },
  g: { w: 5.6, strokes: [bowlCCW(2.4), join(poly(4.5, 5, 4.5, -1.2), curve([4.5, -1.2], [[4.4, -2.7], [2.2, -2.9], [0.8, -1.8]]))] },
  h: { w: 5.2, strokes: [poly(0.5, 8, 0.5, 0), join(curve([0.5, 3.4], [[0.8, 5.1], [2, 5.2], [2.8, 5.2]], [[4, 5.2], [4.4, 4.3], [4.4, 3]]), poly(4.4, 3, 4.4, 0))] },
  i: { w: 2, strokes: [poly(1, 5, 1, 0), poly(1, 6.9, 1.05, 7.1)] },
  j: { w: 2.4, strokes: [join(poly(1.4, 5, 1.4, -1.6), curve([1.4, -1.6], [[1.3, -2.7], [0.4, -2.8], [-0.3, -2.4]])), poly(1.4, 6.9, 1.45, 7.1)] },
  k: { w: 4.6, strokes: [poly(0.5, 8, 0.5, 0), poly(4, 5, 0.7, 2.3), poly(1.9, 3.3, 4.3, 0)] },
  l: { w: 2, strokes: [poly(1, 8, 1, 0)] },
  m: { w: 7, strokes: [poly(0.5, 5, 0.5, 0), join(curve([0.5, 3.6], [[0.8, 5.2], [1.8, 5.2], [2.2, 5.2]], [[3.2, 5.2], [3.4, 4.3], [3.4, 3.2]]), poly(3.4, 3.2, 3.4, 0)), join(curve([3.4, 3.6], [[3.7, 5.2], [4.6, 5.2], [5, 5.2]], [[6, 5.2], [6.2, 4.3], [6.2, 3.2]]), poly(6.2, 3.2, 6.2, 0))] },
  n: { w: 5.2, strokes: [poly(0.5, 5, 0.5, 0), join(curve([0.5, 3.6], [[0.8, 5.2], [2, 5.2], [2.6, 5.2]], [[3.9, 5.2], [4.3, 4.3], [4.3, 3]]), poly(4.3, 3, 4.3, 0))] },
  o: { w: 5.2, strokes: [arc(2.5, 2.5, 2.2, 2.5, 90, 450)] },
  p: { w: 5.4, strokes: [poly(0.5, 5, 0.5, -2.5), bowlCW(2.7)] },
  q: { w: 5.6, strokes: [arc(2.6, 2.5, 2.2, 2.5, 0, 360), poly(4.9, 5, 4.9, -2.5)] },
  r: { w: 4, strokes: [poly(0.5, 5, 0.5, 0), curve([0.5, 3.4], [[0.8, 5], [1.6, 5.2], [2.4, 5.2]], [[3, 5.2], [3.4, 5], [3.7, 4.7]])] },
  s: { w: 4.8, strokes: [curve([4.1, 4.5], [[3.4, 5.3], [1.1, 5.4], [0.9, 4]], [[0.8, 2.9], [4.3, 2.5], [4.3, 1.2]], [[4.3, -0.2], [1.4, -0.3], [0.4, 0.8]])] },
  t: { w: 4, strokes: [join(poly(1.8, 7.2, 1.8, 0.9), curve([1.8, 0.9], [[1.8, 0], [2.9, -0.1], [3.7, 0.6]])), poly(0.4, 5, 3.6, 5)] },
  u: { w: 5.2, strokes: [join(poly(0.5, 5, 0.5, 1.9), curve([0.5, 1.9], [[0.5, 0.1], [1.5, 0], [2.4, 0]], [[3.5, 0], [4.4, 0.8], [4.4, 2]])), poly(4.5, 5, 4.5, 0)] },
  v: { w: 4.8, strokes: [poly(0.2, 5, 2.4, 0, 4.6, 5)] },
  w: { w: 6, strokes: [poly(0.2, 5, 1.4, 0, 3, 4.2, 4.6, 0, 5.8, 5)] },
  x: { w: 4.8, strokes: [poly(0.4, 5, 4.4, 0), poly(4.4, 5, 0.4, 0)] },
  y: { w: 5, strokes: [poly(0.3, 5, 2.4, 0.4), join(poly(4.5, 5, 1.9, -2.5), curve([1.9, -2.5], [[1.6, -3.1], [0.7, -3], [0.3, -2.6]]))] },
  z: { w: 5, strokes: [poly(0.5, 5, 4.2, 5, 0.5, 0, 4.5, 0)] },
  A: { w: 5.8, strokes: [poly(0.2, 0, 2.8, 7.5, 5.4, 0), poly(1.1, 2.8, 4.5, 2.8)] },
  B: { w: 5.4, strokes: [poly(0.5, 0, 0.5, 7.5), join(curve([0.5, 7.5], L(2.8, 7.5), [[4.6, 7.5], [4.6, 4], [2.8, 4]]), poly(2.8, 4, 0.5, 4)), curve([2.8, 4], [[5.1, 4], [5.1, 0], [2.9, 0]], L(0.5, 0))] },
  C: { w: 5.8, strokes: [arc(3, 3.75, 2.8, 3.75, 40, 320)] },
  E: { w: 5, strokes: [poly(4.6, 7.5, 0.5, 7.5, 0.5, 0, 4.6, 0), poly(0.5, 3.9, 3.8, 3.9)] },
  F: { w: 4.8, strokes: [poly(4.6, 7.5, 0.5, 7.5, 0.5, 0), poly(0.5, 3.9, 3.8, 3.9)] },
  H: { w: 5.8, strokes: [poly(0.5, 7.5, 0.5, 0), poly(5, 7.5, 5, 0), poly(0.5, 3.9, 5, 3.9)] },
  I: { w: 2.8, strokes: [poly(1.2, 7.5, 1.2, 0), poly(0.2, 7.5, 2.2, 7.5), poly(0.2, 0, 2.2, 0)] },
  L: { w: 4.6, strokes: [poly(0.5, 7.5, 0.5, 0, 4.3, 0)] },
  M: { w: 6.8, strokes: [poly(0.5, 0, 0.5, 7.5, 3.3, 1.6, 6.1, 7.5, 6.1, 0)] },
  N: { w: 5.8, strokes: [poly(0.5, 0, 0.5, 7.5, 5, 0, 5, 7.5)] },
  O: { w: 6, strokes: [arc(3, 3.75, 2.8, 3.75, 90, 450)] },
  R: { w: 5.8, strokes: [poly(0.5, 0, 0.5, 7.5), join(curve([0.5, 7.5], L(2.9, 7.5), [[5.2, 7.5], [5.2, 3.7], [2.9, 3.7]]), poly(2.9, 3.7, 0.5, 3.7)), poly(2.6, 3.7, 5.2, 0)] },
  T: { w: 5.6, strokes: [poly(0, 7.5, 5.4, 7.5), poly(2.7, 7.5, 2.7, 0)] },
  Y: { w: 5.8, strokes: [poly(0.1, 7.5, 2.8, 3.6, 5.5, 7.5), poly(2.8, 3.6, 2.8, 0)] },
  '0': { w: 5, strokes: [arc(2.4, 3.75, 2.1, 3.75, 90, 450)] },
  '1': { w: 3.6, strokes: [poly(0.8, 6, 2.2, 7.5, 2.2, 0)] },
  '2': { w: 5.2, strokes: [curve([0.4, 5.8], [[0.6, 7.8], [4.4, 8.1], [4.5, 5.6]], [[4.5, 3.5], [1.2, 2], [0.3, 0]], L(4.8, 0))] },
  '3': { w: 5.2, strokes: [curve([0.5, 6.8], [[1.2, 8], [4.3, 7.9], [4.2, 5.8]], [[4.1, 4.3], [2.6, 4], [1.8, 3.9]], [[3.2, 3.9], [4.9, 3.4], [4.8, 1.8]], [[4.7, -0.3], [1.3, -0.6], [0.3, 1]])] },
  '4': { w: 5.2, strokes: [poly(3.9, 0, 3.9, 7.5, 0.2, 2.4, 5, 2.4)] },
  '5': { w: 5.2, strokes: [join(poly(4.4, 7.5, 1, 7.5, 0.7, 4.1), curve([0.7, 4.1], [[1.5, 4.9], [4.8, 5.1], [4.8, 2.6]], [[4.8, -0.5], [1.2, -0.5], [0.3, 0.9]]))] },
  '6': { w: 5.2, strokes: [curve([4.2, 7], [[2.4, 8.2], [0.4, 6], [0.5, 3]], [[0.6, -0.4], [4.7, -0.3], [4.6, 2.2]], [[4.5, 4.6], [1.6, 4.8], [0.6, 3.3]])] },
  '7': { w: 5.2, strokes: [poly(0.4, 7.5, 4.8, 7.5, 2, 0)] },
  '8': { w: 5.2, strokes: [arc(2.5, 5.8, 1.9, 1.7, 270, 630), arc(2.5, 1.9, 2.2, 1.9, 90, 450)] },
  '9': { w: 5.2, strokes: [join(arc(2.5, 5.3, 2.1, 2.2, 90, 450), curve([4.6, 5.3], [[4.5, 1.5], [3.5, -0.1], [1.6, 0.2]]))] },
  '.': { w: 1.6, strokes: [poly(0.5, 0, 0.62, 0.18)] },
  ',': { w: 1.6, strokes: [poly(0.7, 0.3, 0.3, -1)] },
  '?': { w: 4.8, strokes: [curve([0.6, 6], [[0.8, 8], [4.1, 8], [4.1, 5.8]], [[4.1, 4.2], [2.4, 4.1], [2.4, 2.5]]), poly(2.4, 0.2, 2.45, 0.4)] },
  '!': { w: 2.2, strokes: [poly(1, 7.5, 1, 2.4), poly(1, 0.1, 1.05, 0.3)] },
  '-': { w: 3.8, strokes: [poly(0.3, 3.2, 3.4, 3.2)] },
  "'": { w: 1.6, strokes: [poly(0.7, 7.5, 0.4, 5.8)] },
}

/** Cheap deterministic hash in [0, 1). */
function hash(seed: number, a: number, b = 0): number {
  let h = (seed ^ Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35)) >>> 0
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}

export interface HandwriteOptions {
  /** Left/baseline origin of the first line, sheet metres. */
  x: number
  y: number
  /** Capital height in sheet metres. */
  capHeight: number
  seed?: number
  /** Whole-block rotation, radians (CCW), about (x, y). */
  rotation?: number
  /** Forward lean as shear dx/dy. */
  slant?: number
  /** Baseline wander amplitude (cap-height fraction). */
  wander?: number
  /** Line pitch in cap heights. */
  lineHeight?: number
  /** Letter spacing in glyph units. */
  tracking?: number
  red?: boolean
}
export interface HandwriteResult {
  strokes: HandStroke[]
  /** Axis-aligned bounds in sheet metres after rotation. */
  bounds: { x0: number; y0: number; x1: number; y1: number }
  /** Sheet-metre bounds per input line (for strike-throughs / circles). */
  lines: { x0: number; y0: number; x1: number; y1: number; baseline: number }[]
}

const missing = (ch: string) => !(ch in GLYPHS)
export const supportedText = (text: string): boolean => [...text.replace(/\n/g, '')].every(ch => !missing(ch))

export function handwrite(text: string, o: HandwriteOptions): HandwriteResult {
  const seed = o.seed ?? 7
  const unit = o.capHeight / 7.5
  const slant = o.slant ?? 0.13
  const wander = o.wander ?? 0.035
  const pitch = (o.lineHeight ?? 1.7) * 7.5
  const tracking = o.tracking ?? 0.55
  const cos = Math.cos(o.rotation ?? 0), sin = Math.sin(o.rotation ?? 0)
  const strokes: HandStroke[] = []
  const lines: HandwriteResult['lines'] = []
  let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity
  const place = (px: number, py: number): Pt => {
    // glyph-block units -> metres, shear, rotate about origin
    const x = (px + slant * py) * unit, y = py * unit
    return [o.x + x * cos - y * sin, o.y + x * sin + y * cos]
  }
  text.split('\n').forEach((line, row) => {
    let pen = 0
    let lx0 = Infinity, ly0 = Infinity, lx1 = -Infinity, ly1 = -Infinity
    ;[...line].forEach((ch, i) => {
      const glyph = GLYPHS[ch]
      if (!glyph) throw new Error(`handwriting: unsupported character ${JSON.stringify(ch)}`)
      const gs = row * 131 + i
      // Per-glyph personality: size, lift, lean, and a slow baseline wave across the line.
      const size = 1 + (hash(seed, gs, 1) - 0.5) * 0.09
      const lift = (hash(seed, gs, 2) - 0.5) * 2 * wander * 7.5 + Math.sin((pen + row * 9) * 0.21) * wander * 7.5 * 0.6
      const lean = (hash(seed, gs, 3) - 0.5) * 0.07
      glyph.strokes.forEach((stroke, si) => {
        const pts: Pt[] = stroke.map(([gxp, gyp], pi) => {
          const jx = (hash(seed, gs * 17 + si, pi + 11) - 0.5) * 0.14
          const jy = (hash(seed, gs * 17 + si, pi + 97) - 0.5) * 0.14
          const x = pen + gxp * size + jx + lean * gyp
          const y = -row * pitch + lift + gyp * size + jy
          const p = place(x, y)
          lx0 = Math.min(lx0, p[0]); lx1 = Math.max(lx1, p[0]); ly0 = Math.min(ly0, p[1]); ly1 = Math.max(ly1, p[1])
          return p
        })
        strokes.push(o.red ? { points: pts, red: true } : { points: pts })
      })
      pen += (glyph.w + tracking) * size
    })
    if (lx0 !== Infinity) {
      lines.push({ x0: lx0, y0: ly0, x1: lx1, y1: ly1, baseline: o.y - row * pitch * unit })
      gx0 = Math.min(gx0, lx0); gy0 = Math.min(gy0, ly0); gx1 = Math.max(gx1, lx1); gy1 = Math.max(gy1, ly1)
    }
  })
  if (gx0 === Infinity) { gx0 = gy0 = gx1 = gy1 = 0 }
  return { strokes, bounds: { x0: gx0, y0: gy0, x1: gx1, y1: gy1 }, lines }
}

/** Pen length of a stroke list (metres), used to time a note's write-on by pen travel. */
export function strokeLength(strokes: HandStroke[]): number {
  let total = 0
  for (const s of strokes) for (let i = 1; i < s.points.length; i++) total += Math.hypot(s.points[i][0] - s.points[i - 1][0], s.points[i][1] - s.points[i - 1][1])
  return total
}

/** A loose hand-drawn ellipse around a box: two overlapping laps with an overshoot, seeded. */
export function handCircle(cx: number, cy: number, rx: number, ry: number, seed = 3, laps = 1.12, tilt = -0.18): Pt[] {
  const pts: Pt[] = []
  const n = Math.ceil(laps * 56)
  const phase = hash(seed, 5) * Math.PI * 2
  for (let i = 0; i <= n; i++) {
    const a = phase + (i / 56) * Math.PI * 2
    const wob = 1 + 0.045 * Math.sin(a * 2 + hash(seed, 6) * 6) + 0.03 * Math.sin(a * 3 + hash(seed, 7) * 6) + (i / n) * 0.07
    const x = Math.cos(a) * rx * wob, y = Math.sin(a) * ry * wob
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)])
  }
  return pts
}

/** A slightly wavering pen line from a to b (as an array of points). */
export function handLine(a: Pt, b: Pt, seed = 4, amp = 0.0004): Pt[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len
  const n = Math.max(4, Math.ceil(len / 0.003))
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const w = Math.sin(t * Math.PI * (1.5 + hash(seed, 1))) * amp + (hash(seed, i + 9) - 0.5) * amp * 0.5
    pts.push([a[0] + (b[0] - a[0]) * t + nx * w, a[1] + (b[1] - a[1]) * t + ny * w])
  }
  return pts
}
