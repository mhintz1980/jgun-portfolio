/** Physical pacing: shaft spans translate by -.115 with their private host clock. */
export const TORQUE_PACING_RAMP = 0.15
export const CASCADE_PACING_BASELINE_MULTIPLIER = 16
export const CASCADE_PACING_MULTIPLIER = 24.095648

export const TORQUE_PACING_SPANS = Object.freeze([
  // Compress the static registered-drawing / lamp-flicker / trace hold (0.265..0.395) from ~8.2 vp down to ~2.6 vp.
  Object.freeze({ start: .265, end: .395, multiplier: .45, id: 'drafting' }),
  // Move 0.02 units of physical scroll from the pre-rupture crack approach
  // into the shatter orbit, preserving total page length and downstream joins.
  Object.freeze({ start: .395, end: .435, multiplier: 1.5, id: 'cracks' }),
  Object.freeze({ start: .42, end: .46, multiplier: 3.8, id: 'shatter' }),
  // Rebalanced ring study [.46,.505]: reduced from 18x (35.5 vp) to 4.5x (~8.9 vp) with a flat-top kernel.
  Object.freeze({ start: .46, end: .505, multiplier: 5.3, id: 'ring' }),
  // Expand rushed collision beats so camera sweeps and mechanical separations breathe cleanly.
  Object.freeze({ start: .505, end: .56, multiplier: 2.1, id: 'switch' }),
  Object.freeze({ start: .56, end: .62, multiplier: 2.1, id: 'isolation' }),
  Object.freeze({ start: .62, end: .825, multiplier: 2, id: 'shaft' }),
  // Compact the contact whip independently of the ordinary shaft story.
  Object.freeze({ start: .685, end: .717, multiplier: .8, id: 'shaperWhip' }),
  Object.freeze({ start: .72, end: .755, multiplier: 2.2, id: 'materials' }),
  // T6-C3: local slow-downs on the hob engagement (old [.884,.905], host [.769,.79], each <= x8). 'hobSeat' covers
  // touch/seat and 'hobSwing' the >=60 deg camera swing plus its catch-up.
  Object.freeze({ start: .7756, end: .7787, multiplier: 1.5, id: 'hobSeat' }),
  Object.freeze({ start: .7778, end: .7892, multiplier: 5.5, id: 'hobSwing' }),
  // A 165-degree ignition macro needs a decisive but readable 2..4.5 vp.
  Object.freeze({ start: .807, end: .815, multiplier: 6, id: 'ignitionWhip' }),
  // Final cascade: 40.2–66.9 s gets 1.5x the previous continuation distance.
  // Beat metadata alone does not change the native scroll mapping.
  Object.freeze({ start: .815, end: .825, multiplier: CASCADE_PACING_MULTIPLIER, id: 'cascade' }),
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

/**
 * Native distance in baseline-page units, independent of the total page length.
 * The optional cascade multiplier reconstructs the old map for budget derivation.
 */
export function torqueScrollDistance(progress: number, cascadeMultiplier = CASCADE_PACING_MULTIPLIER): number {
  if (!Number.isFinite(progress)) throw new RangeError('Progress must be finite')
  const p = clamp(progress)
  let distance = p
  for (const span of TORQUE_PACING_SPANS) {
    const u = clamp((p - span.start) / (span.end - span.start))
    const multiplier = span.id === 'cascade' ? cascadeMultiplier : span.multiplier
    distance += (span.end - span.start) * (multiplier - 1) * torquePacingKernel(u)
  }
  return distance
}

/** Analytic native-distance derivative; no finite-difference noise at shoulders. */
export function torqueScrollDistanceRate(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Progress must be finite')
  const p = clamp(progress)
  let rate = 1
  for (const span of TORQUE_PACING_SPANS) {
    const u = (p - span.start) / (span.end - span.start)
    if (u <= 0 || u >= 1) continue
    const weight = Math.min(u / TORQUE_PACING_RAMP, 1, (1 - u) / TORQUE_PACING_RAMP)
      / (1 - TORQUE_PACING_RAMP)
    rate += (span.multiplier - 1) * weight
  }
  return rate
}

/** Integral of the flat-top trapezoidal weight: mean weight is 1. */
export function torqueScrollFraction(progress: number): number {
  return torqueScrollDistance(progress) / TORQUE_PACING_SCALE
}

/** Monotone inverse in baseline-page units, also usable with the old cascade map. */
export function torqueProgressAtDistance(distance: number, cascadeMultiplier = CASCADE_PACING_MULTIPLIER): number {
  if (!Number.isFinite(distance)) throw new RangeError('Scroll distance must be finite')
  const end = torqueScrollDistance(1, cascadeMultiplier)
  if (distance <= 0) return 0
  if (distance >= end) return 1
  let lo = 0, hi = 1
  for (let i = 0; i < 52; i++) {
    const mid = (lo + hi) / 2
    if (torqueScrollDistance(mid, cascadeMultiplier) < distance) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** Deterministic native seek/reload/reverse; no mutable clock. */
export function torqueNarrativeProgress(fraction: number): number {
  if (!Number.isFinite(fraction)) throw new RangeError('Scroll fraction must be finite')
  return torqueProgressAtDistance(clamp(fraction) * TORQUE_PACING_SCALE)
}
