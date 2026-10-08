/** Deterministic reference lettering; variation belongs to whole letters, never their outlines. */
import { REFERENCE_GLYPHS } from './referenceHandGlyphs'

export type Pt = [number, number]
export interface ReferenceGlyph {
  w: number; contours: Pt[][]; triangles?: Pt[][]
  /** Original TTF black bounds, in raw font units before cap-7.5 normalization. */
  fontMinX?: number
  fontMinY?: number
  fontHeight?: number
}
export interface HandStroke {
  points: Pt[]
  red?: boolean
  /** Reference outlines are specimen/metric data, never paths to be stroked by InkBuilder. */
  letter?: {
    ch: string
    x: number; y: number
    capHeight: number
    scaleX: number
    rotation: number
    contours: Pt[][]
    triangles?: Pt[][]
  }
  /** Uniform pen pressure; retained for the existing path interface. */
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
  /** Actual supplementary path half-width for visible ink bounds; defaults proportionally to cap height. */
  penHalfWidth?: number
  seed?: number
  /** Whole-block rotation, radians (CCW), about (x, y). */
  rotation?: number
  /** Additional forward lean as dx/dy; implemented as rotation to preserve reference anatomy. */
  slant?: number
  /** Baseline wander amplitude (cap-height fraction). */
  wander?: number
  /** Line pitch in cap heights. */
  lineHeight?: number
  /** Mean letter spacing in glyph units (varied per letter and per word). */
  tracking?: number
  /** Overall glyph width factor (default 1 preserves the reference proportions). */
  narrow?: number
  red?: boolean
}
/** What the pen did for one letter (glyph units are 1/7.5 of the capital height). */
export interface HandGlyph {
  ch: string
  row: number
  index: number
  /** Height scale of this letter (1 = nominal, +/-6%). */
  size: number
  /** Width scale of this letter relative to nominal. */
  width: number
  /** Forward lean expressed as dx/dy; the actual transform is a mild rotation. */
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
const missing = (ch: string) => !(ch in REFERENCE_GLYPHS) && !(ch in GLYPHS)
export const supportedText = (text: string): boolean => [...written(text).replace(/\n/g, '')].every(ch => !missing(ch))

export function handwrite(text: string, o: HandwriteOptions): HandwriteResult {
  const seed = o.seed ?? 7
  const unit = o.capHeight / 7.5
  const blockRotation = o.rotation ?? 0
  const cos = Math.cos(blockRotation), sin = Math.sin(blockRotation)
  const pitch = (o.lineHeight ?? 1.7) * 7.5
  const tracking = o.tracking ?? 0.32
  const narrow = o.narrow ?? 1
  const wander = o.wander ?? 0.025
  const strokes: HandStroke[] = []
  const lines: HandwriteResult['lines'] = []
  const glyphs: HandGlyph[] = []
  const bounds = (pts: Pt[]) => ({
    x0: Math.min(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])),
    x1: Math.max(...pts.map(p => p[0])), y1: Math.max(...pts.map(p => p[1])),
  })
  const merge = (boxes: HandwriteResult['bounds'][]): HandwriteResult['bounds'] => boxes.length ? {
    x0: Math.min(...boxes.map(b => b.x0)), y0: Math.min(...boxes.map(b => b.y0)),
    x1: Math.max(...boxes.map(b => b.x1)), y1: Math.max(...boxes.map(b => b.y1)),
  } : { x0: 0, y0: 0, x1: 0, y1: 0 }

  written(text).split('\n').forEach((line, row) => {
    const rowY = -row * pitch
    const rowDx = row === 0 ? 0 : (hash(seed, 610 + row) - 0.5) * 0.6
    const slope = (hash(seed, 700 + row) - 0.5) * 0.004
    let pen = rowDx
    let wordGap = 0
    let previous: HandGlyph | undefined
    const rowGlyphs: HandGlyph[] = []
    ;[...line].forEach((ch, index) => {
      if (missing(ch)) throw new Error(`handwriting: unsupported character ${JSON.stringify(ch)}`)
      const h = (k: number) => hash(seed, row * 131 + index, k)
      if (ch === ' ') {
        wordGap += unit * 7.5 * (0.32 + h(8) * 0.13)
        return
      }
      const reference: ReferenceGlyph | undefined = REFERENCE_GLYPHS[ch]
      const paths = reference?.contours ?? GLYPHS[ch].strokes
      const size = 1 + (h(1) - 0.5) * 0.12
      const width = 1 + (h(2) - 0.5) * 0.12
      const lean = Math.atan(o.slant ?? 0) + (h(3) - 0.5) * 4 * D2R
      const rotation = blockRotation - lean
      const c = Math.cos(rotation), s = Math.sin(rotation)
      const sx = unit * width * narrow, sy = unit * size
      const lift = (h(4) - 0.5) * 2 * wander * 7.5 + pen * slope
      const local = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [x * sx * c - y * sy * s, x * sx * s + y * sy * c])
      const localContours = paths.map(local)
      const box = bounds(localContours.flat())
      // Fallback ink quads extend past their centreline. Reference contours already describe black ink.
      const pad = reference ? 0 : o.penHalfWidth ?? o.capHeight * (0.00024 / 0.0038)
      box.x0 -= pad; box.x1 += pad; box.y0 -= pad; box.y1 += pad
      const originY = o.y + pen * unit * sin + (rowY + lift) * unit * cos
      const originX = o.x + pen * unit * cos - (rowY + lift) * unit * sin
      const glyphWidth = box.x1 - box.x0
      // Solve from actual rotated black bounds, including both neighbours, with a cap-height floor.
      // This is a translation only: no late-line shrinking or altered reference contours.
      const gap = previous ? Math.max(0.12 * Math.max(previous.x1 - previous.x0, glyphWidth), o.capHeight * 0.075,
        tracking * unit * (0.9 + h(7) * 0.2)) * (1 + h(9) * 0.08) + wordGap : wordGap
      const left = previous ? previous.x1 + gap : originX + wordGap
      const x = left - box.x0, y = originY
      const placed = (pts: Pt[]): Pt[] => pts.map(([px, py]) => [x + px, y + py])
      const contours = localContours.map(placed)
      const glyph: HandGlyph = { ch, row, index, size, width, shear: Math.tan(lean), lift, pressure: 1,
        x0: left, y0: y + box.y0, x1: x + box.x1, y1: y + box.y1 }
      if (reference) {
        const triangles = reference.triangles?.map(t => placed(local(t)))
        strokes.push({ points: [], pressure: 1, ...(o.red ? { red: true } : {}),
          letter: { ch, x, y, capHeight: o.capHeight * size, scaleX: width * narrow / size, rotation, contours,
            ...(triangles ? { triangles } : {}) } })
      } else {
        for (const points of contours) strokes.push({ points, pressure: 1, ...(o.red ? { red: true } : {}) })
      }
      glyphs.push(glyph); rowGlyphs.push(glyph); previous = glyph
      // Keep the authored block slope/baseline while the visible-gap solve advances the pen.
      pen = (glyph.x1 - o.x + (rowY + lift) * unit * sin) / (unit * Math.max(0.1, cos))
      wordGap = 0
    })
    if (rowGlyphs.length) lines.push({ ...merge(rowGlyphs), baseline: o.y + rowDx * unit * sin + rowY * unit * cos })
  })
  return { strokes, bounds: merge(glyphs), lines, glyphs }
}

/** Pen travel of vectors, or one deterministic cap-height/black-width measure per font letter. */
export function strokeLength(strokes: HandStroke[]): number {
  let total = 0
  for (const s of strokes) {
    if (s.letter) {
      total += s.letter.capHeight + s.letter.capHeight / 7.5 * REFERENCE_GLYPHS[s.letter.ch].w * s.letter.scaleX
    } else {
      for (let i = 1; i < s.points.length; i++) total += Math.hypot(s.points[i][0] - s.points[i - 1][0], s.points[i][1] - s.points[i - 1][1])
    }
  }
  return total
}

/** A smooth, slightly elliptical pen loop with the requested small overlapping finish. */
export function handCircle(cx: number, cy: number, rx: number, ry: number, seed = 3, laps = 1.12, tilt = -0.18): Pt[] {
  const pts: Pt[] = []
  const n = Math.ceil(laps * 72)
  const phase = hash(seed, 5) * Math.PI * 2
  const ax = rx * (1 + (hash(seed, 6) - 0.5) * 0.025)
  const ay = ry * (1 + (hash(seed, 7) - 0.5) * 0.025)
  for (let i = 0; i <= n; i++) {
    const a = phase + (i / n) * laps * Math.PI * 2
    const x = Math.cos(a) * ax, y = Math.sin(a) * ay
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)])
  }
  return pts
}

/** A decisive line, at most one quadratic bow, landing exactly on both endpoints. */
export function handLine(a: Pt, b: Pt, seed = 4, amp = 0.0004): Pt[] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9
  const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len
  const n = Math.max(8, Math.ceil(len / 0.002))
  const bow = amp * (hash(seed, 1) - 0.5) * 2
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = i / n, offset = 4 * t * (1 - t) * bow
    return [a[0] + (b[0] - a[0]) * t + nx * offset, a[1] + (b[1] - a[1]) * t + ny * offset]
  })
}
