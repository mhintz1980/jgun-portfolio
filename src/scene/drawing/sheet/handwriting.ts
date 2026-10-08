/**
 * JG-035 O2 — deterministic single-stroke hand lettering for margin notes on the drawing.
 *
 * A tiny monoline all-caps font authored as polylines (no OS handwriting fonts, no canvas), written
 * the way a fast hand prints: every letter gets its own seeded size, lean, lift, width, spacing, stroke
 * wobble, open joins, overshoot and pen pressure, rushed letters toward the end of a line and the odd
 * double-struck correction, so the note reads as a person's pen rather than type. Everything is a pure
 * function of (text, options): identical output on every machine, in every direction of scroll, and
 * between the live bake and the cached asset.
 *
 * Glyph units: baseline y = 0, x-height 5, capital/digit height 7.5, ascender 8, descender -2.5.
 */

export type Pt = [number, number]
export interface HandStroke {
  points: Pt[]
  red?: boolean
  /** Relative pen pressure (about 0.65-1.35); the caller multiplies its pen width by it. */
  pressure?: number
}

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
  // Capitals are written the way a fast hand prints them: several short strokes, no serifs, arms that do not
  // quite meet the stem, bowls left a little open. The per-letter variation in `handwrite` does the rest.
  A: { w: 5.6, strokes: [poly(0.2, 0, 1.6, 4.6, 2.55, 7.5, 3.5, 4.8, 5.3, 0.1), poly(1.0, 2.1, 2.9, 2.3, 4.5, 2.2)] },
  B: { w: 5.2, strokes: [poly(0.5, 0, 0.45, 7.5), curve([0.55, 7.4], [[2.2, 7.9], [4.5, 7.9], [4.35, 5.8]], [[4.2, 4.3], [2.5, 3.9], [0.7, 4]]), curve([0.7, 4], [[2.9, 4.1], [5.1, 3.7], [4.95, 1.9]], [[4.8, 0.1], [2.5, -0.2], [0.5, 0.1]])] },
  C: { w: 5.4, strokes: [arc(3, 3.75, 2.6, 3.75, 42, 322)] },
  D: { w: 5.6, strokes: [poly(0.5, 0.1, 0.45, 7.5), curve([0.5, 7.4], [[3, 7.9], [5.3, 6.2], [5.2, 3.7]], [[5.1, 1.2], [3, -0.1], [0.45, 0.1]])] },
  E: { w: 4.8, strokes: [poly(0.7, 7.5, 0.5, 0, 4.6, 0.15), poly(0.6, 7.4, 4.6, 7.6), poly(0.55, 3.9, 3.5, 4.1)] },
  F: { w: 4.6, strokes: [poly(4.6, 7.5, 0.5, 7.45, 0.5, 0), poly(0.55, 3.9, 3.6, 4)] },
  G: { w: 5.6, strokes: [arc(2.95, 3.75, 2.6, 3.75, 46, 335), poly(5.2, 1.9, 5.25, 3.4, 3.2, 3.4)] },
  H: { w: 5.6, strokes: [poly(0.5, 7.5, 0.5, 0), poly(5, 7.5, 5, 0), poly(0.5, 3.9, 5, 3.8)] },
  I: { w: 2.0, strokes: [poly(1, 7.5, 1, 0)] },
  J: { w: 4.2, strokes: [join(poly(3.4, 7.5, 3.4, 1.6), curve([3.4, 1.6], [[3.4, -0.3], [0.9, -0.4], [0.3, 1.4]]))] },
  K: { w: 5.2, strokes: [poly(0.5, 7.5, 0.5, 0), poly(4.7, 7.5, 0.7, 3.1), poly(1.9, 4.3, 5.1, 0)] },
  L: { w: 4.4, strokes: [poly(0.5, 7.5, 0.5, 0, 4.3, 0.1)] },
  M: { w: 6.6, strokes: [poly(0.5, 0, 0.5, 7.5, 3.3, 1.6, 6.1, 7.5, 6.1, 0)] },
  N: { w: 5.6, strokes: [poly(0.5, 0, 0.5, 7.5, 5, 0, 5, 7.5)] },
  O: { w: 5.8, strokes: [arc(3, 3.75, 2.6, 3.75, 85, 460)] },
  P: { w: 5.0, strokes: [poly(0.5, 0, 0.5, 7.5), curve([0.5, 7.4], [[2.9, 7.9], [5.2, 7], [4.95, 5.4]], [[4.75, 4], [2.8, 3.7], [0.6, 3.9]])] },
  Q: { w: 5.8, strokes: [arc(3, 3.75, 2.6, 3.75, 85, 460), poly(3.4, 2.3, 5.5, -0.8)] },
  R: { w: 5.6, strokes: [poly(0.5, 0, 0.5, 7.5), curve([0.5, 7.4], [[2.8, 7.9], [5, 7.1], [4.85, 5.5]], [[4.7, 4.1], [2.8, 3.8], [0.65, 3.9]]), poly(2.7, 3.9, 5.2, 0)] },
  S: { w: 5.0, strokes: [curve([4.7, 6.6], [[3.9, 7.9], [0.9, 8], [0.8, 5.9]], [[0.7, 4.3], [4.8, 3.7], [4.9, 1.8]], [[5, -0.2], [1.4, -0.4], [0.3, 1.3]])] },
  T: { w: 5.4, strokes: [poly(0, 7.5, 5.4, 7.55), poly(2.7, 7.5, 2.7, 0)] },
  U: { w: 5.4, strokes: [join(poly(0.5, 7.5, 0.5, 2), curve([0.5, 2], [[0.5, 0.2], [1.6, -0.1], [2.6, 0]], [[3.9, 0.1], [4.9, 0.9], [4.9, 2.5]]), poly(4.9, 2.5, 4.9, 7.5))] },
  V: { w: 5.4, strokes: [poly(0.2, 7.5, 2.7, 0, 5.2, 7.5)] },
  W: { w: 6.6, strokes: [poly(0.1, 7.5, 1.5, 0, 3.2, 5.6, 4.9, 0, 6.3, 7.5)] },
  X: { w: 5.2, strokes: [poly(0.4, 7.5, 4.8, 0), poly(4.8, 7.5, 0.4, 0)] },
  Y: { w: 5.4, strokes: [poly(0.1, 7.5, 2.7, 3.6, 5.3, 7.5), poly(2.7, 3.6, 2.7, 0)] },
  Z: { w: 5.2, strokes: [poly(0.5, 7.4, 4.9, 7.5, 0.5, 0.1, 5, 0)] },
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
  /** Base forward lean as shear dx/dy (default tan 4 deg). Each letter adds its own +-7 deg on top. */
  slant?: number
  /** Baseline wander amplitude (cap-height fraction). */
  wander?: number
  /** Line pitch in cap heights. */
  lineHeight?: number
  /** Mean letter spacing in glyph units (varied per letter and per word). */
  tracking?: number
  /** Overall glyph width factor; < 1 reads as the tall, slightly narrow print of a fast hand. */
  narrow?: number
  red?: boolean
}
/** What the pen did for one letter (glyph units are 1/7.5 of the capital height). */
export interface HandGlyph {
  ch: string
  row: number
  index: number
  /** Height scale of this letter (1 = nominal, +-12 % plus rush shrink). */
  size: number
  /** Width scale of this letter relative to nominal. */
  width: number
  /** Total forward-lean shear dx/dy, base slant plus this letter's own lean. */
  shear: number
  /** Baseline lift of this letter in glyph units. */
  lift: number
  /** Mean pen pressure multiplier for this letter. */
  pressure: number
  /** Placed bounds in sheet metres. */
  x0: number; y0: number; x1: number; y1: number
}
export interface HandwriteResult {
  strokes: HandStroke[]
  /** Axis-aligned bounds in sheet metres after rotation. */
  bounds: { x0: number; y0: number; x1: number; y1: number }
  /** Sheet-metre bounds per input line (for strike-throughs / circles). */
  lines: { x0: number; y0: number; x1: number; y1: number; baseline: number }[]
  /** One record per written letter, in pen order. */
  glyphs: HandGlyph[]
}

/** The words are always written in capitals; the glyph table keeps its lower-case forms for completeness. */
const written = (text: string): string => text.toUpperCase()
const missing = (ch: string) => !(ch in GLYPHS)
export const supportedText = (text: string): boolean => [...written(text).replace(/\n/g, '')].every(ch => !missing(ch))

const PRESSURE_MIN = 0.65
const PRESSURE_MAX = 1.35
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Insert points so no segment is longer than `step` (straight runs need interior points to wobble). */
function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step))
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  return out
}

interface Hurry { rush: number }

/**
 * One glyph stroke, in glyph units, as a hand would make it: a little rotated/offset/stretched,
 * a slow two-sine wobble across the stroke (arc-length parameterised, so it is a lean of the
 * pen rather than pixel noise), the far end drifting off the start (open or overshot joins) and
 * the ends overshooting. Occasionally the pen goes back over a short stretch, which is returned
 * as a second, lighter stroke.
 */
function humanStroke(stroke: Pt[], seed: number, key: number, hurry: Hurry): { main: Pt[]; redo?: Pt[] } {
  const h = (n: number) => hash(seed, key, n)
  const base = resample(stroke, 0.8)
  let len = 0
  for (let i = 1; i < base.length; i++) len += Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1])
  if (len < 1.6) return { main: base.map(([x, y]) => [x + (h(1) - 0.5) * 0.2, y + (h(2) - 0.5) * 0.2] as Pt) }
  let cx = 0, cy = 0
  for (const [x, y] of base) { cx += x; cy += y }
  cx /= base.length; cy /= base.length
  const th = (h(3) - 0.5) * 2 * 4 * D2R, sc = 1 + (h(4) - 0.5) * 0.12
  const c = Math.cos(th) * sc, s = Math.sin(th) * sc
  const tx = (h(5) - 0.5) * 0.4, ty = (h(6) - 0.5) * 0.4
  const amp = 0.2 * (0.75 + 0.5 * h(7)) * (1 + 0.6 * hurry.rush)
  const l1 = 5 + 4 * h(8), l2 = 2.8 + 1.4 * h(9), p1 = h(10) * 6.2832, p2 = h(11) * 6.2832
  const da = h(12) * 6.2832, dm = 0.32 * h(13) * (1 + 0.5 * hurry.rush)
  const dx = Math.cos(da) * dm, dy = Math.sin(da) * dm
  const moved = base.map(([x, y]): Pt => [cx + (x - cx) * c - (y - cy) * s + tx, cy + (x - cx) * s + (y - cy) * c + ty])
  let walked = 0
  const pts = moved.map((p, i): Pt => {
    if (i > 0) walked += Math.hypot(p[0] - moved[i - 1][0], p[1] - moved[i - 1][1])
    const a = moved[Math.max(0, i - 1)], b = moved[Math.min(moved.length - 1, i + 1)]
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const w = amp * (Math.sin((walked / l1) * 6.2832 + p1) + 0.55 * Math.sin((walked / l2) * 6.2832 + p2)) / 1.2
    const f = walked / len
    return [p[0] - ((b[1] - a[1]) / tl) * w + dx * f, p[1] + ((b[0] - a[0]) / tl) * w + dy * f]
  })
  // Overshoot: the pen runs on a little past where it meant to stop, and starts a touch early.
  const ext = (from: Pt, toward: Pt, amount: number): Pt => {
    const l = Math.hypot(from[0] - toward[0], from[1] - toward[1]) || 1
    return [from[0] + ((from[0] - toward[0]) / l) * amount, from[1] + ((from[1] - toward[1]) / l) * amount]
  }
  const first = pts[0], last = pts[pts.length - 1]
  const lead = ext(first, pts[Math.min(2, pts.length - 1)], h(14) * 0.3)
  const tail = ext(last, pts[Math.max(0, pts.length - 3)], h(15) * 0.55 * (1 + 0.4 * hurry.rush))
  const main: Pt[] = [lead, ...pts, tail]
  // Correction: go back over the middle of a long stroke, slightly off the first pass.
  let redo: Pt[] | undefined
  if (len > 4.5 && h(16) < 0.075) {
    const i0 = Math.floor(pts.length * (0.25 + 0.15 * h(17))), i1 = Math.floor(pts.length * (0.6 + 0.2 * h(18)))
    const side = h(19) < 0.5 ? -1 : 1
    const seg = pts.slice(i0, Math.max(i0 + 3, i1))
    if (seg.length >= 3) {
      const a = seg[0], b = seg[seg.length - 1]
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const nx = (-(b[1] - a[1]) / l) * 0.28 * side, ny = ((b[0] - a[0]) / l) * 0.28 * side
      redo = seg.map(([x, y]): Pt => [x + nx, y + ny])
      if (h(20) < 0.5) redo.reverse()
    }
  }
  return redo ? { main, redo } : { main }
}

export function handwrite(text: string, o: HandwriteOptions): HandwriteResult {
  const seed = o.seed ?? 7
  const unit = o.capHeight / 7.5
  const baseShear = o.slant ?? Math.tan(4 * D2R)
  const wander = o.wander ?? 0.03
  const pitch = (o.lineHeight ?? 1.7) * 7.5
  const tracking = o.tracking ?? 0.65
  const narrow = o.narrow ?? 0.93
  const cos = Math.cos(o.rotation ?? 0), sin = Math.sin(o.rotation ?? 0)
  const strokes: HandStroke[] = []
  const lines: HandwriteResult['lines'] = []
  const glyphs: HandGlyph[] = []
  let gx0 = Infinity, gy0 = Infinity, gx1 = -Infinity, gy1 = -Infinity
  const place = (px: number, py: number): Pt => {
    // glyph-block units -> metres, shear, rotate about origin
    const x = (px + baseShear * py) * unit, y = py * unit
    return [o.x + x * cos - y * sin, o.y + x * sin + y * cos]
  }
  written(text).split('\n').forEach((line, row) => {
    const chars = [...line]
    const n = chars.length
    // A line starts a little off the margin, sits a little off its nominal pitch and slowly drifts up or down.
    const rowDy = row === 0 ? 0 : (hash(seed, 600 + row) - 0.5) * 1.4
    const rowDx = row === 0 ? 0 : (hash(seed, 610 + row) - 0.5) * 1.2
    const slope = (hash(seed, 700 + row) - 0.5) * 2 * 0.005
    const wavePhase = hash(seed, 710 + row) * 6.2832, waveLen = 55 + 40 * hash(seed, 720 + row)
    const linePressure = hash(seed, 730 + row) * 6.2832
    let pen = rowDx
    let word = 0
    let lx0 = Infinity, ly0 = Infinity, lx1 = -Infinity, ly1 = -Infinity
    chars.forEach((ch, i) => {
      const glyph = GLYPHS[ch]
      if (!glyph) throw new Error(`handwriting: unsupported character ${JSON.stringify(ch)}`)
      const gs = row * 131 + i
      const h = (k: number) => hash(seed, gs, k)
      // Late in a line the hand hurries: letters get shorter, narrower, flatter and sloppier.
      const p = n > 1 ? i / (n - 1) : 0
      const rush = Math.pow(clamp((p - 0.5) / 0.5, 0, 1), 1.4)
      const size = (1 + (h(1) - 0.5) * 2 * 0.12) * (1 - 0.13 * rush * (0.4 + 0.6 * h(8)))
      const wid = (1 + (h(2) - 0.5) * 2 * 0.11) * (1 - 0.1 * rush)
      const sw = size * wid * narrow
      const lean = (h(3) - 0.5) * 2 * Math.tan(7 * D2R) + 0.03 * rush
      const lift = (h(4) - 0.5) * 2 * wander * 7.5
        + Math.sin(((pen + row * 9) / waveLen) * 6.2832 + wavePhase) * wander * 7.5 * 0.8
        + pen * slope - rush * 0.3 * h(5)
      const letterPressure = 1 + (h(6) - 0.5) * 0.4
      const rowY = -row * pitch + rowDy
      const hurry: Hurry = { rush }
      let glx0 = Infinity, gly0 = Infinity, glx1 = -Infinity, gly1 = -Infinity
      const toSheet = (pts: Pt[]): Pt[] => pts.map(([gxp, gyp]) => {
        const q = place(pen + gxp * sw + lean * gyp * size, rowY + lift + gyp * size)
        glx0 = Math.min(glx0, q[0]); glx1 = Math.max(glx1, q[0]); gly0 = Math.min(gly0, q[1]); gly1 = Math.max(gly1, q[1])
        return q
      })
      glyph.strokes.forEach((stroke, si) => {
        const { main, redo } = humanStroke(stroke, seed, gs * 17 + si, hurry)
        const strokePressure = 1 + (hash(seed, gs * 17 + si, 40) - 0.5) * 0.4
        const slow = 1 + 0.08 * Math.sin(pen * 0.05 + linePressure)
        const pressure = clamp(letterPressure * strokePressure * slow, PRESSURE_MIN, PRESSURE_MAX)
        const mk = (points: Pt[], pr: number): HandStroke => (o.red ? { points, red: true, pressure: pr } : { points, pressure: pr })
        strokes.push(mk(toSheet(main), pressure))
        if (redo) strokes.push(mk(toSheet(redo), clamp(pressure * 0.85, PRESSURE_MIN, PRESSURE_MAX)))
      })
      if (glx0 !== Infinity) {
        lx0 = Math.min(lx0, glx0); lx1 = Math.max(lx1, glx1); ly0 = Math.min(ly0, gly0); ly1 = Math.max(ly1, gly1)
        glyphs.push({ ch, row, index: i, size, width: wid, shear: baseShear + lean, lift, pressure: letterPressure, x0: glx0, y0: gly0, x1: glx1, y1: gly1 })
      } else if (ch !== ' ') {
        glyphs.push({ ch, row, index: i, size, width: wid, shear: baseShear + lean, lift, pressure: letterPressure, x0: 0, y0: 0, x1: 0, y1: 0 })
      }
      if (ch === ' ') {
        // Gaps between words are never the same twice.
        pen += glyph.w * (1.25 + 0.9 * hash(seed, 800 + row * 31 + word)) * narrow + 0.4
        word += 1
      } else {
        // Each word is written crowded or loose as a whole, and every letter pair wanders a little around it.
        const crowd = 0.35 + 1.3 * hash(seed, 900 + row * 31 + word)
        pen += glyph.w * sw + Math.max(rush > 0.3 ? 0.2 : -0.15, tracking * crowd + (h(7) - 0.5) * 0.7)
      }
    })
    if (lx0 !== Infinity) {
      lines.push({ x0: lx0, y0: ly0, x1: lx1, y1: ly1, baseline: o.y - (row * pitch - rowDy) * unit })
      gx0 = Math.min(gx0, lx0); gy0 = Math.min(gy0, ly0); gx1 = Math.max(gx1, lx1); gy1 = Math.max(gy1, ly1)
    }
  })
  if (gx0 === Infinity) { gx0 = gy0 = gx1 = gy1 = 0 }
  return { strokes, bounds: { x0: gx0, y0: gy0, x1: gx1, y1: gy1 }, lines, glyphs }
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

/**
 * A pen line from a to b that wanders: two slow sines across its length (zero at both ends so it still
 * lands where it was aimed), never per-point noise.
 */
export function handLine(a: Pt, b: Pt, seed = 4, amp = 0.0004): Pt[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len
  const n = Math.max(8, Math.ceil(len / 0.002))
  const f1 = 1.1 + hash(seed, 1) * 1.1, f2 = 2.6 + hash(seed, 2) * 1.4
  const p1 = hash(seed, 3) * 6.2832, p2 = hash(seed, 4) * 6.2832
  const pts: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const w = Math.sqrt(Math.sin(Math.PI * t)) * amp * (Math.sin(t * 6.2832 * f1 + p1) + 0.45 * Math.sin(t * 6.2832 * f2 + p2))
    pts.push([a[0] + (b[0] - a[0]) * t + nx * w, a[1] + (b[1] - a[1]) * t + ny * w])
  }
  return pts
}
