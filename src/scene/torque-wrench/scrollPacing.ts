/** Physical distance changes; canonical director/beat coordinates remain stable. */
export const TORQUE_PACING_SPANS = Object.freeze([
  Object.freeze({ start: .36, end: .435, multiplier: 2, id: 'cracks' }),
  Object.freeze({ start: .69, end: .735, multiplier: 2, id: 'ring' }),
  Object.freeze({ start: .735, end: .94, multiplier: 2, id: 'shaft' }),
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
