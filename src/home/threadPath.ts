// Pure geometry for the Revision Orange thread (W3). No DOM here: Thread.tsx measures the
// [data-thread] anchors, hands their rects to buildThread, and samples the resulting SVG path.

export type AnchorKind = 'start' | 'row' | 'card' | 'end'

export interface Point {
  x: number
  y: number
}

/** An anchor rect in .home coordinates (top-left origin, px). */
export interface Anchor {
  kind: AnchorKind
  left: number
  top: number
  width: number
  height: number
}

export interface Eyelet extends Point {
  /** Index into ThreadLayout.points: the spline passes exactly through it. */
  pointIndex: number
}

export interface ThreadLayout {
  points: Point[]
  eyelets: Eyelet[]
}

export interface ThreadOptions {
  /** Width of the .home box; loops are clamped inside [margin, width - margin]. */
  width: number
  /** Eyelet distance outside the row's edge. */
  eyeletOffset?: number
  /** How far the loop between two rows swings out past the eyelets. */
  loopReach?: number
  /** Keep every point at least this far inside the page's side edges. */
  margin?: number
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))
const centre = (a: Anchor): Point => ({ x: a.left + a.width / 2, y: a.top + a.height / 2 })

/**
 * Anchor points for the thread, in reading order:
 * start (H1 "+") → rows laced edge to edge, alternating sides, with a loop in the margin between
 * rows → cards zig-zagged through their interiors → a falling arc to the end pin.
 */
export function buildThread(anchors: readonly Anchor[], options: ThreadOptions): ThreadLayout {
  const { width } = options
  const off = options.eyeletOffset ?? 10
  const reach = options.loopReach ?? 44
  const margin = options.margin ?? 3
  const cx = (x: number) => clamp(x, margin, width - margin)

  const points: Point[] = []
  const eyelets: Eyelet[] = []
  const push = (p: Point) => {
    const last = points[points.length - 1]
    if (last && Math.abs(last.x - p.x) < 0.5 && Math.abs(last.y - p.y) < 0.5) return points.length - 1
    points.push({ x: cx(p.x), y: p.y })
    return points.length - 1
  }

  /** A gentle arc between two points: midpoint pushed sideways by `swing` (signed px). */
  const bridge = (a: Point, b: Point, swing: number) => {
    if (Math.abs(b.y - a.y) < 24) return
    push({ x: (a.x + b.x) / 2 + swing, y: (a.y + b.y) / 2 })
  }

  let rowIndex = 0
  let cardIndex = 0
  let previousKind: AnchorKind | null = null
  let previousRow: Anchor | null = null

  for (const anchor of anchors) {
    const last = points[points.length - 1]
    if (anchor.kind === 'start' || anchor.kind === 'end') {
      const c = centre(anchor)
      if (last && anchor.kind === 'end' && c.y - last.y > 160) {
        // Fall away from the last card, cross to the left margin (behind opaque blocks or in
        // empty space), run down beside the contact heading and hook into the pin from the left.
        const mx = c.x - reach * 1.4
        push({ x: (last.x + mx) / 2, y: last.y + (c.y - last.y) * 0.3 })
        push({ x: mx, y: last.y + (c.y - last.y) * 0.62 })
        push({ x: mx, y: c.y - Math.min(48, (c.y - last.y) * 0.08) })
      } else if (last) {
        bridge(last, c, 0)
      }
      push(c)
    } else if (anchor.kind === 'row') {
      const enterLeft = rowIndex % 2 === 0
      const y = anchor.top + anchor.height / 2
      const leftEye = { x: anchor.left - off, y }
      const rightEye = { x: anchor.left + anchor.width + off, y }
      const entry = enterLeft ? leftEye : rightEye
      const exit = enterLeft ? rightEye : leftEye
      if (last) {
        if (previousKind === 'row' && previousRow) {
          // Loop in the side margin between two rows: out past the eyelets and back in.
          const side = enterLeft ? -1 : 1
          const gapY = (previousRow.top + previousRow.height + anchor.top) / 2
          push({ x: entry.x + side * reach, y: gapY })
        } else {
          // Arrive from above, swinging wide on the entry side before threading in.
          const side = enterLeft ? -1 : 1
          // Step straight out to the margin under the start, so the run down never crosses copy.
          const mx = entry.x + side * reach * 1.4
          push({ x: mx, y: last.y + Math.min(90, (y - last.y) * 0.15) })
          push({ x: mx, y: (last.y + y) / 2 + Math.min(60, (y - last.y) * 0.2) })
        }
      }
      eyelets.push({ ...entry, x: cx(entry.x), pointIndex: push(entry) })
      // Two interior points keep the hidden run straight so the eyelets line up with the row.
      push({ x: anchor.left + anchor.width * (enterLeft ? 0.3 : 0.7), y })
      push({ x: anchor.left + anchor.width * (enterLeft ? 0.7 : 0.3), y })
      eyelets.push({ ...exit, x: cx(exit.x), pointIndex: push(exit) })
      previousRow = anchor
      rowIndex += 1
    } else {
      // Card: zig-zag through the interior; alternate sides so one column still weaves.
      const x = anchor.left + anchor.width * (cardIndex % 2 === 0 ? 0.32 : 0.68)
      const p = { x, y: anchor.top + anchor.height / 2 }
      if (last && previousKind === 'row' && previousRow) {
        // Leave the last row's exit, curl down the margin, sweep left across the empty band
        // above the section heading, then drop down the left margin into the first card.
        const bottom = previousRow.top + previousRow.height
        const band = bottom + Math.min(64, (anchor.top - bottom) * 0.2)
        const exitSide = rowIndex % 2 === 0 ? -1 : 1 // side the last row exited on
        const exitX = exitSide > 0 ? previousRow.left + previousRow.width + off : previousRow.left - off
        push({ x: exitX + exitSide * reach, y: (bottom + band) / 2 })
        push({ x: (previousRow.left + previousRow.left + previousRow.width) / 2, y: band })
        push({ x: anchor.left - reach, y: band + Math.min(56, (anchor.top - band) * 0.15) })
        push({ x: anchor.left - reach, y: (band + anchor.top) / 2 + 20 })
        push({ x: anchor.left - reach * 0.5, y: anchor.top + Math.min(40, anchor.height * 0.25) })
      } else if (last && previousKind !== 'card') {
        bridge(last, p, Math.min(80, width * 0.08))
      }
      push(p)
      cardIndex += 1
    }
    previousKind = anchor.kind
  }

  return { points, eyelets }
}

/**
 * Centripetal Catmull-Rom (alpha 0.5) through every point, as an SVG cubic Bézier path.
 * Centripetal parameterisation avoids cusps and self-loops where points are unevenly spaced.
 */
export function catmullRomPath(points: readonly Point[], alpha = 0.5): string {
  if (points.length === 0) return ''
  const f = (n: number) => Math.round(n * 100) / 100
  if (points.length === 1) return `M${f(points[0].x)},${f(points[0].y)}`
  const at = (i: number): Point => {
    if (i < 0) return { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y }
    if (i >= points.length) {
      const n = points.length
      return { x: 2 * points[n - 1].x - points[n - 2].x, y: 2 * points[n - 1].y - points[n - 2].y }
    }
    return points[i]
  }
  const dist = (a: Point, b: Point) => Math.max(1e-4, Math.hypot(b.x - a.x, b.y - a.y) ** alpha)

  let d = `M${f(points[0].x)},${f(points[0].y)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const d1 = dist(p0, p1)
    const d2 = dist(p1, p2)
    const d3 = dist(p2, p3)
    const a = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2
    const n = 3 * d1 * (d1 + d2)
    const b = 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2
    const m = 3 * d3 * (d3 + d2)
    const c1 = {
      x: (d1 * d1 * p2.x - d2 * d2 * p0.x + a * p1.x) / n,
      y: (d1 * d1 * p2.y - d2 * d2 * p0.y + a * p1.y) / n,
    }
    const c2 = {
      x: (d3 * d3 * p1.x - d2 * d2 * p3.x + b * p2.x) / m,
      y: (d3 * d3 * p1.y - d2 * d2 * p3.y + b * p2.y) / m,
    }
    d += ` C${f(c1.x)},${f(c1.y)} ${f(c2.x)},${f(c2.y)} ${f(p2.x)},${f(p2.y)}`
  }
  return d
}

/** Path samples (taken once per build) with a running-max y so "how far down" is monotone. */
export interface ThreadSamples {
  total: number
  lengths: Float64Array
  xs: Float64Array
  ys: Float64Array
  /** Running max of ys: non-decreasing. */
  reach: Float64Array
}

export function makeSamples(total: number, pointAt: (length: number) => Point, step = 8): ThreadSamples {
  const count = Math.max(2, Math.ceil(total / step) + 1)
  const lengths = new Float64Array(count)
  const xs = new Float64Array(count)
  const ys = new Float64Array(count)
  const reach = new Float64Array(count)
  let max = -Infinity
  for (let i = 0; i < count; i++) {
    const length = i === count - 1 ? total : Math.min(total, i * step)
    const p = pointAt(length)
    lengths[i] = length
    xs[i] = p.x
    ys[i] = p.y
    max = Math.max(max, p.y)
    reach[i] = max
  }
  return { total, lengths, xs, ys, reach }
}

/** The drawn length whose running-max y first reaches targetY (linear between samples). */
export function lengthForY(samples: ThreadSamples, targetY: number): number {
  const { lengths, reach, total } = samples
  const n = reach.length
  if (n === 0 || targetY <= reach[0]) return 0
  if (targetY >= reach[n - 1]) return total
  let lo = 0
  let hi = n - 1 // invariant: reach[lo] < targetY <= reach[hi]
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (reach[mid] < targetY) lo = mid
    else hi = mid
  }
  const span = reach[hi] - reach[lo]
  const t = span > 0 ? (targetY - reach[lo]) / span : 1
  return lengths[lo] + (lengths[hi] - lengths[lo]) * t
}

/** Point on the sampled path at a given length (for the tip dot; no DOM calls on scroll). */
export function pointAtSampled(samples: ThreadSamples, length: number): Point {
  const { lengths, xs, ys } = samples
  const n = lengths.length
  if (length <= lengths[0]) return { x: xs[0], y: ys[0] }
  if (length >= lengths[n - 1]) return { x: xs[n - 1], y: ys[n - 1] }
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (lengths[mid] <= length) lo = mid
    else hi = mid
  }
  const t = (length - lengths[lo]) / (lengths[hi] - lengths[lo] || 1)
  return { x: xs[lo] + (xs[hi] - xs[lo]) * t, y: ys[lo] + (ys[hi] - ys[lo]) * t }
}

/**
 * Length along the sampled path nearest to p, searching from fromLength on (pass the previous
 * eyelet's length so a later pass of the thread can never claim an earlier eyelet).
 */
export function lengthNearest(samples: ThreadSamples, p: Point, fromLength = 0): number {
  let best = fromLength
  let bestD = Infinity
  for (let i = 0; i < samples.lengths.length; i++) {
    if (samples.lengths[i] < fromLength) continue
    const d = (samples.xs[i] - p.x) ** 2 + (samples.ys[i] - p.y) ** 2
    if (d < bestD) {
      bestD = d
      best = samples.lengths[i]
    }
  }
  return best
}

/** Scroll position → drawn length: the tip follows a line 62% of the way down the viewport. */
export function drawnLength(
  samples: ThreadSamples,
  scrollY: number,
  viewportHeight: number,
  homeTop = 0,
  maxScroll = Infinity,
): number {
  // At the very bottom the pin may sit below the 62% line: finish the thread there.
  if (scrollY >= maxScroll - 1) return samples.total
  return lengthForY(samples, scrollY + 0.62 * viewportHeight - homeTop)
}
