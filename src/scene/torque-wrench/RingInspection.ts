/** Private presentation clock. The inherited mechanical/clip law remains borrowed. */
import { sampleInspection, MAX_FEATURE_HZ, RING_FEATURES, RING_RADIUS, WHEEL_RADIUS, ROLLER_TEETH, type InspectionFrame } from '../inspection/timeline'

export const PRIVATE_RING_DURATION = 28
export const RING_SLOW_START = 8
export const RING_SLOW_END = 18
// Display seconds -> existing mechanical seconds. Near one-quarter formed OD the
// subject crawls; the camera has its own canonical-progress clock.
const KNOTS = [[0, 0], [4, 2.8], [6, 3.8], [8, 4.36], [9, 4.365],
  [17, 4.375], [18, 4.5], [23, 6.5], [25, 8.2], [26, 10.5], [28, 12]] as const
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u) }
function slope(i: number): number {
  if (i === 0 || i === KNOTS.length - 1) return 0
  const a = KNOTS[i - 1], b = KNOTS[i], c = KNOTS[i + 1]
  const h0 = b[0] - a[0], h1 = c[0] - b[0]
  const d0 = (b[1] - a[1]) / h0, d1 = (c[1] - b[1]) / h1
  return 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1)
}

/** No allocations; reverse/seek reproduces the same material and mechanical state. */
export function samplePrivateRing(time: number, out: InspectionFrame): InspectionFrame {
  const t = Math.max(0, Math.min(PRIVATE_RING_DURATION, time))
  let i = 0
  while (i < KNOTS.length - 2 && t >= KNOTS[i + 1][0]) i++
  const a = KNOTS[i], b = KNOTS[i + 1], h = b[0] - a[0], u = clamp((t - a[0]) / h)
  const m0 = slope(i), m1 = slope(i + 1), u2 = u * u, u3 = u2 * u
  const mechanical = (2 * u3 - 3 * u2 + 1) * a[1] + (u3 - 2 * u2 + u) * h * m0
    + (-2 * u3 + 3 * u2) * b[1] + (u3 - u2) * h * m1
  const rate = ((6 * u2 - 6 * u) * a[1] + (3 * u2 - 4 * u + 1) * h * m0
    + (-6 * u2 + 6 * u) * b[1] + (3 * u2 - 2 * u) * h * m1) / h
  sampleInspection(mechanical, out)
  const spinAngle = out.angle, spinRate = out.spin * Math.max(0, rate)
  out.time = t
  if (t < 4) {
    // The host holds display t=0 until ALL surroundings are fully hidden.
    out.knurl = 1 - smooth(t / 1)
    out.aluminium = smooth((t - 1) / 1)
    out.holePlugBlend = smooth((t - 2) / 1)
    const spinU = clamp(t - 3), spinBlend = smooth(spinU)
    out.angle = spinAngle * spinBlend
    out.spin = spinRate * spinBlend + spinAngle * 6 * spinU * (1 - spinU)
    out.toolVisible = false; out.toolOpacity = 0
    out.phase = t < 1 ? 'Remove knurl' : t < 2 ? 'Remove black anodize' : 'Conceal face holes'
  } else {
    out.spin *= Math.max(0, rate)
    if (t >= RING_SLOW_START && t <= RING_SLOW_END) out.phase = 'Knurl forming · bullet time'
  }
  const ringHz = out.spin * RING_FEATURES / Math.PI
  const rollerHz = out.spin * RING_RADIUS / WHEEL_RADIUS * ROLLER_TEETH / (2 * Math.PI)
  out.ringDetailScale = ringHz > MAX_FEATURE_HZ ? MAX_FEATURE_HZ / ringHz : 1
  out.rollerDetailScale = rollerHz > MAX_FEATURE_HZ ? MAX_FEATURE_HZ / rollerHz : 1
  return out
}
