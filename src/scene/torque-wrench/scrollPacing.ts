/** Physical pacing: shaft spans translate by -.115 with their private host clock. */
export const TORQUE_PACING_RAMP = 0.15

export const TORQUE_PACING_SPANS = Object.freeze([
  // Compress the static registered-drawing / lamp-flicker / trace hold (0.265..0.395) from ~8.2 vp down to ~2.6 vp.
  Object.freeze({ start: .265, end: .395, multiplier: .45, id: 'drafting' }),
  // Move 0.02 units of physical scroll from the pre-rupture crack approach
  // into the shatter orbit, preserving total page length and downstream joins.
  Object.freeze({ start: .395, end: .435, multiplier: 1.5, id: 'cracks' }),
  Object.freeze({ start: .42, end: .46, multiplier: 6, id: 'shatter' }),
  // Rebalanced ring study [.46,.505]: reduced from 18x (35.5 vp) to 4.5x (~8.9 vp) with a flat-top kernel.
  Object.freeze({ start: .46, end: .505, multiplier: 4.5, id: 'ring' }),
  // Expand rushed collision beats so camera sweeps and mechanical separations breathe cleanly.
  Object.freeze({ start: .505, end: .56, multiplier: 2.1, id: 'switch' }),
  Object.freeze({ start: .56, end: .62, multiplier: 2.1, id: 'isolation' }),
  Object.freeze({ start: .62, end: .825, multiplier: 2, id: 'shaft' }),
  Object.freeze({ start: .72, end: .755, multiplier: 2.2, id: 'materials' }),
  // T6-C3: local slow-downs on the hob engagement (old [.884,.905], host [.769,.79], each <= x8). 'hobSeat' covers
  // touch/seat and 'hobSwing' the >=60 deg camera swing plus its catch-up.
  Object.freeze({ start: .7756, end: .7787, multiplier: 5.5, id: 'hobSeat' }),
  Object.freeze({ start: .7778, end: .7892, multiplier: 6.5, id: 'hobSwing' }),
  Object.freeze({ start: .825, end: .855, multiplier: 2, id: 'return' }),
  Object.freeze({ start: .855, end: .93, multiplier: 2, id: 'extraction' }),
  Object.freeze({ start: .93, end: .94, multiplier: 8, id: 'explodedHold' }),
])
export const TORQUE_PACING_SCALE = 1 + TORQUE_PACING_SPANS.reduce(
  (sum, span) => sum + (span.end - span.start) * (span.multiplier - 1), 0,
)
const clamp = (p: number) => Math.max(0, Math.min(1, p))

/**
 * Integral of a flat-top trapezoidal weight: boundary speed is C1-continuous,
 * interior weight is constant H = 1 / (1 - r), eliminating center-spiking and negative derivatives.
 */
export function torquePacingKernel(u: number, ramp = TORQUE_PACING_RAMP): number {
  const c = clamp(u)
  if (c <= 0 || c >= 1) return c <= 0 ? 0 : 1
  const h = 1 / (1 - ramp)
  if (c < ramp) return h * (c * c) / (2 * ramp)
  if (c <= 1 - ramp) return h * (c - ramp / 2)
  const w = 1 - c
  return 1 - h * (w * w) / (2 * ramp)
}

/** Integral of the flat-top trapezoidal weight: boundary speed stays unchanged, mean weight is 1. */
export function torqueScrollFraction(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Progress must be finite')
  const p = clamp(progress)
  let distance = p
  for (const span of TORQUE_PACING_SPANS) {
    const u = clamp((p - span.start) / (span.end - span.start))
    distance += (span.end - span.start) * (span.multiplier - 1) * torquePacingKernel(u)
  }
  return distance / TORQUE_PACING_SCALE
}

/** Monotone inverse, deterministic for native seek/reload/reverse; no mutable clock. */
export function torqueNarrativeProgress(fraction: number): number {
  if (!Number.isFinite(fraction)) throw new RangeError('Scroll fraction must be finite')
  const target = clamp(fraction)
  if (target === 0 || target === 1) return target
  let lo = 0, hi = 1
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (torqueScrollFraction(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
