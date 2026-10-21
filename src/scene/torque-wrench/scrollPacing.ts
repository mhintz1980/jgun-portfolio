/** Physical pacing: shaft spans translate by -.115 with their private host clock. */
export const TORQUE_PACING_SPANS = Object.freeze([
  Object.freeze({ start: .36, end: .435, multiplier: 2, id: 'cracks' }),
  Object.freeze({ start: .42, end: .46, multiplier: 3, id: 'shatter' }),
  // T5: the ring study now owns [.46,.505]; multiplier 18 is the smallest integer giving >=2x on the
  // 28 s operation, the contact window and the slow window versus the old .69-.735 x8 span.
  Object.freeze({ start: .46, end: .505, multiplier: 18, id: 'ring' }),
  Object.freeze({ start: .62, end: .825, multiplier: 2, id: 'shaft' }),
  // T6-C3: local slow-downs on the hob engagement (old [.884,.905], host [.769,.79], each <= x8). 'hobSeat' covers
  // touch/seat and 'hobSwing' the >=60 deg camera swing plus its catch-up; scale 2.17326.
  Object.freeze({ start: .7756, end: .7787, multiplier: 4.8, id: 'hobSeat' }),
  Object.freeze({ start: .7778, end: .7892, multiplier: 4.2, id: 'hobSwing' }),
])
export const TORQUE_PACING_SCALE = 1 + TORQUE_PACING_SPANS.reduce(
  (sum, span) => sum + (span.end - span.start) * (span.multiplier - 1), 0,
)
const clamp = (p: number) => Math.max(0, Math.min(1, p))

/** Integral of a smooth weight: boundary speed stays unchanged, mean weight is 2. */
export function torqueScrollFraction(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Progress must be finite')
  const p = clamp(progress)
  let distance = p
  for (const span of TORQUE_PACING_SPANS) {
    const u = clamp((p - span.start) / (span.end - span.start))
    distance += (span.end - span.start) * (span.multiplier - 1)
      * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI))
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
