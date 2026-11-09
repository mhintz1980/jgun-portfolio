// Pure Verlet rope for the contact section's "Pull the thread" (JG-039 W4). No DOM, no randomness:
// the same inputs always give the same rope, so the tests are stable.

export interface Vec {
  x: number
  y: number
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Rope {
  /** Current positions; index 0 is pinned to the anchor, the last point is the free end. */
  x: Float64Array
  y: Float64Array
  /** Previous positions (Verlet velocity = current - previous). */
  px: Float64Array
  py: Float64Array
  anchor: Vec
  /** Rest length of one segment. */
  segment: number
  /** Total rest length, segment × (points − 1). */
  length: number
  iterations: number
  /** Downward acceleration in px/s². */
  gravity: number
  /** Velocity kept per step, 0..1. */
  damping: number
  bounds: Bounds | null
}

export interface RopeOptions {
  anchor: Vec
  length: number
  points?: number
  iterations?: number
  gravity?: number
  damping?: number
  bounds?: Bounds | null
  /** Initial layout; defaults to the looped trochoid. */
  layout?: 'tangled' | 'straight'
  /** Loop count for the tangled layout; defaults to what fits `maxHeight`. */
  loops?: number
  /** Total height the tangle may use (centred on the anchor). */
  maxHeight?: number
}

export const SOLVED_RATIO = 0.9
const TROCHOID_A = 1
const TROCHOID_B = 2.2

/** Arc-length samples of a looped trochoid starting at t = π/2 (y = 0), loop size gently varied. */
function trochoidSamples(loops: number, samples: number) {
  const t0 = Math.PI / 2
  const t1 = t0 + Math.PI * 2 * loops
  const xs = new Float64Array(samples + 1)
  const ys = new Float64Array(samples + 1)
  const arc = new Float64Array(samples + 1)
  for (let i = 0; i <= samples; i++) {
    const t = t0 + ((t1 - t0) * i) / samples
    const b = TROCHOID_B * (1 + 0.18 * Math.sin(0.9 * (t - t0)))
    xs[i] = TROCHOID_A * (t - t0) - b * Math.sin(t) + b
    ys[i] = -b * Math.cos(t)
    if (i > 0) arc[i] = arc[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1])
  }
  return { xs, ys, arc }
}

function trochoidHeight(loops: number, length: number) {
  const { ys, arc } = trochoidSamples(loops, 400 * loops)
  let lo = Infinity
  let hi = -Infinity
  for (const v of ys) {
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  return ((hi - lo) * length) / arc[arc.length - 1]
}

/** Smallest loop count (at least 3) whose tangle fits in `maxHeight`. */
export function loopsToFit(length: number, maxHeight: number): number {
  let loops = 3
  while (loops < 40 && trochoidHeight(loops, length) > maxHeight) loops++
  return loops
}

/** `points` positions along a looped trochoid of total arc length `length`, first one at `anchor`. */
export function tangledLayout(anchor: Vec, length: number, points: number, loops: number): Vec[] {
  const samples = 400 * loops
  const { xs, ys, arc } = trochoidSamples(loops, samples)
  const scale = length / arc[samples]
  const out: Vec[] = []
  let j = 0
  for (let i = 0; i < points; i++) {
    const target = (arc[samples] * i) / (points - 1)
    while (j < samples - 1 && arc[j + 1] < target) j++
    const span = arc[j + 1] - arc[j] || 1
    const f = Math.min(1, Math.max(0, (target - arc[j]) / span))
    out.push({
      x: anchor.x + (xs[j] + (xs[j + 1] - xs[j]) * f) * scale,
      y: anchor.y + (ys[j] + (ys[j + 1] - ys[j]) * f) * scale,
    })
  }
  return out
}

/** Share of the rope length the free end can reach from the anchor (a pulled, nearly taut rope). */
export const REACH = 0.995

/** A pulled rope: free end at anchor + REACH × length, a shallow sag between. */
export function straightLayout(anchor: Vec, length: number, points: number): Vec[] {
  const span = length * REACH
  // A sine bow whose arc length is ~`length` (small-slope approximation: L ≈ S(1 + π²A²/4S²)).
  const amp = ((2 * span) / Math.PI) * Math.sqrt(length / span - 1)
  const out: Vec[] = []
  for (let i = 0; i < points; i++) {
    const u = i / (points - 1)
    out.push({ x: anchor.x + span * u, y: anchor.y + amp * Math.sin(Math.PI * u) })
  }
  return out
}

export function createRope(options: RopeOptions): Rope {
  const points = Math.max(3, Math.round(options.points ?? 60))
  const { anchor, length } = options
  const layout =
    options.layout === 'straight'
      ? straightLayout(anchor, length, points)
      : tangledLayout(anchor, length, points, options.loops ?? loopsToFit(length, options.maxHeight ?? length * 0.2))
  const rope: Rope = {
    x: new Float64Array(points),
    y: new Float64Array(points),
    px: new Float64Array(points),
    py: new Float64Array(points),
    anchor: { ...anchor },
    segment: length / (points - 1),
    length,
    iterations: options.iterations ?? 20,
    gravity: options.gravity ?? 24,
    damping: options.damping ?? 0.94,
    bounds: options.bounds ?? null,
  }
  layout.forEach((p, i) => {
    rope.x[i] = rope.px[i] = p.x
    rope.y[i] = rope.py[i] = p.y
  })
  return rope
}

/** Clamp a pull target so it stays inside the bounds and no farther than the rope can reach. */
export function clampPin(rope: Rope, target: Vec): Vec {
  let { x, y } = target
  if (rope.bounds) {
    x = Math.min(rope.bounds.maxX, Math.max(rope.bounds.minX, x))
    y = Math.min(rope.bounds.maxY, Math.max(rope.bounds.minY, y))
  }
  const dx = x - rope.anchor.x
  const dy = y - rope.anchor.y
  const d = Math.hypot(dx, dy)
  const reach = rope.length * REACH
  if (d > reach) {
    x = rope.anchor.x + (dx / d) * reach
    y = rope.anchor.y + (dy / d) * reach
  }
  return { x, y }
}

/**
 * Advance the rope by `dt` seconds. Point 0 is always pinned to the anchor. With `pin`, the free
 * end is held at that point (clamped to reach); without it, the free end moves freely.
 */
export function step(rope: Rope, dt: number, pin?: Vec | null): void {
  const n = rope.x.length
  const g = rope.gravity * dt * dt
  const { x, y, px, py, damping, bounds } = rope
  for (let i = 1; i < n; i++) {
    const vx = (x[i] - px[i]) * damping
    const vy = (y[i] - py[i]) * damping
    px[i] = x[i]
    py[i] = y[i]
    x[i] += vx
    y[i] += vy + g
  }
  const end = pin ? clampPin(rope, pin) : null
  for (let k = 0; k < rope.iterations; k++) {
    x[0] = rope.anchor.x
    y[0] = rope.anchor.y
    if (end) {
      x[n - 1] = end.x
      y[n - 1] = end.y
    }
    for (let i = 0; i < n - 1; i++) {
      const dx = x[i + 1] - x[i]
      const dy = y[i + 1] - y[i]
      const d = Math.hypot(dx, dy) || 1e-9
      const diff = (d - rope.segment) / d
      // Pinned points do not move; their neighbour takes the whole correction.
      const wa = i === 0 ? 0 : 1
      const wb = end && i + 1 === n - 1 ? 0 : 1
      const sum = wa + wb
      if (sum === 0) continue
      const ox = dx * diff
      const oy = dy * diff
      x[i] += (ox * wa) / sum
      y[i] += (oy * wa) / sum
      x[i + 1] -= (ox * wb) / sum
      y[i + 1] -= (oy * wb) / sum
    }
    if (bounds) {
      for (let i = 1; i < n; i++) {
        x[i] = Math.min(bounds.maxX, Math.max(bounds.minX, x[i]))
        y[i] = Math.min(bounds.maxY, Math.max(bounds.minY, y[i]))
      }
    }
  }
  x[0] = rope.anchor.x
  y[0] = rope.anchor.y
  if (end) {
    x[n - 1] = end.x
    y[n - 1] = end.y
  }
}

export function endToEnd(rope: Rope): number {
  const n = rope.x.length - 1
  return Math.hypot(rope.x[n] - rope.x[0], rope.y[n] - rope.y[0])
}

export function isSolved(rope: Rope): boolean {
  return endToEnd(rope) >= SOLVED_RATIO * rope.length
}

/** Largest per-step displacement of any point, in px (≈ 0 once the rope has settled). */
export function maxSpeed(rope: Rope): number {
  let m = 0
  for (let i = 0; i < rope.x.length; i++)
    m = Math.max(m, Math.abs(rope.x[i] - rope.px[i]), Math.abs(rope.y[i] - rope.py[i]))
  return m
}

/** Stop all motion (velocity → 0), e.g. after a layout rebuild. */
export function freeze(rope: Rope): void {
  rope.px.set(rope.x)
  rope.py.set(rope.y)
}

export function freeEnd(rope: Rope): Vec {
  const n = rope.x.length - 1
  return { x: rope.x[n], y: rope.y[n] }
}

/** Unit direction of the last segment (the needle points this way). */
export function endDirection(rope: Rope): Vec {
  const n = rope.x.length - 1
  const dx = rope.x[n] - rope.x[n - 1]
  const dy = rope.y[n] - rope.y[n - 1]
  const d = Math.hypot(dx, dy) || 1
  return { x: dx / d, y: dy / d }
}

export function easeInOutCubic(t: number): number {
  const u = Math.min(1, Math.max(0, t))
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
}
