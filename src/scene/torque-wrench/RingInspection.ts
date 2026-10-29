/** Private presentation clock. The inherited mechanical/clip law remains borrowed. */
import { sampleInspection, MAX_FEATURE_HZ, RING_FEATURES, RING_RADIUS, WHEEL_RADIUS, ROLLER_TEETH, SPIN_RATE, type InspectionFrame } from '../inspection/timeline'
import { BULLET_TIME_SHOT_SPECS, sampleBulletTimeRate, sampleBulletTimeWarp } from './bulletTime'

export const PRIVATE_RING_DURATION = 28
export const [RING_SLOW_START, RING_SLOW_END] = BULLET_TIME_SHOT_SPECS.ringSwitch.displayWindow
/**
 * The .15-revolution budget includes BOTH knees, not just the plateau.
 * For duration D, knee fraction r, normal mechanical rate N and plateau ratio q:
 *   deltaMechanical = D * N * (r + (1-r)*q).
 * The inherited N=.5 spends ~4.92 die revolutions on the knees alone, even
 * with q=0. Choose an explicit local normal of .05 die rev/display s (3 RPM,
 * 6.4 tooth passes/s < MAX_FEATURE_HZ). Solving the budget gives q=3/17,
 * rather than silently weakening the .15-rev override or stacking another ease.
 * Hold this readable normal on display 7..8 and 18..19, with C1 joins into
 * the surrounding lifecycle. The inherited ring angle is LINEAR in mechanical
 * time throughout this shot, so its physical derivative is SPIN_RATE * clockRate.
 */
export const RING_DIE_BULLET_TURNS = BULLET_TIME_SHOT_SPECS.ringSwitch.maxRevolutions
export const RING_NORMAL_DIE_REV_PER_SECOND = 0.05
export const RING_NORMAL_RATE = RING_NORMAL_DIE_REV_PER_SECOND * 2 * Math.PI * WHEEL_RADIUS / (SPIN_RATE * RING_RADIUS)
export const RING_BULLET_RAMP_FRACTION = BULLET_TIME_SHOT_SPECS.ringSwitch.rampFraction
const SLOW_DURATION = RING_SLOW_END - RING_SLOW_START
const SLOW_MECHANICAL_START = 4.36
const SLOW_MECHANICAL_TRAVEL = RING_DIE_BULLET_TURNS * 2 * Math.PI * WHEEL_RADIUS / (SPIN_RATE * RING_RADIUS)
/** Mean rate over the entire close-up; distinct from its interior plateau rate. */
export const RING_BULLET_MEAN_RATE = SLOW_MECHANICAL_TRAVEL / SLOW_DURATION
export const RING_BULLET_RATIO = (RING_BULLET_MEAN_RATE / RING_NORMAL_RATE - RING_BULLET_RAMP_FRACTION)
  / (1 - RING_BULLET_RAMP_FRACTION)
/** Mechanical seconds per display second during the flat interior plateau. */
export const RING_BULLET_RATE = RING_NORMAL_RATE * RING_BULLET_RATIO
const SLOW_MECHANICAL_END = SLOW_MECHANICAL_START + SLOW_MECHANICAL_TRAVEL
const KNOTS = [[0, 0], [4, 2.8], [6, 3.8],
  [RING_SLOW_START - 1, SLOW_MECHANICAL_START - RING_NORMAL_RATE], [RING_SLOW_START, SLOW_MECHANICAL_START],
  [RING_SLOW_END, SLOW_MECHANICAL_END], [RING_SLOW_END + 1, SLOW_MECHANICAL_END + RING_NORMAL_RATE],
  [23, 6.5], [25, 8.2], [26, 10.5], [28, 12]] as const
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u) }
function slope(i: number): number {
  // Readable normal speed at both shot boundaries and their one-second shoulders.
  if (i >= 3 && i <= 6) return RING_NORMAL_RATE
  if (i === 0 || i === KNOTS.length - 1) return 0
  const a = KNOTS[i - 1], b = KNOTS[i], c = KNOTS[i + 1]
  const h0 = b[0] - a[0], h1 = c[0] - b[0]
  const d0 = (b[1] - a[1]) / h0, d1 = (c[1] - b[1]) / h1
  return 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1)
}

/** Mechanical-time sample for clock-rate verification and deterministic seeks. */
export function ringMechanicalTimeAt(time: number): number {
  const t = Math.max(0, Math.min(PRIVATE_RING_DURATION, time))
  if (t >= RING_SLOW_START && t <= RING_SLOW_END) {
    const u = (t - RING_SLOW_START) / SLOW_DURATION
    // Budget already supplies duration * normalRate * envelopeArea. The generic
    // normalized warp alone is not a physical speed ratio.
    return SLOW_MECHANICAL_START + SLOW_MECHANICAL_TRAVEL
      * sampleBulletTimeWarp(u, RING_BULLET_RATIO, RING_BULLET_RAMP_FRACTION)
  }
  let i = 0
  while (i < KNOTS.length - 2 && t >= KNOTS[i + 1][0]) i++
  const a = KNOTS[i], b = KNOTS[i + 1], h = b[0] - a[0], u = clamp((t - a[0]) / h)
  const m0 = slope(i), m1 = slope(i + 1), u2 = u * u, u3 = u2 * u
  // The steep lifecycle ramps meet the readable shoulders with zero
  // acceleration. C2 joins keep the physical speed smooth at display 7/19.
  if (i === 2 || i === 6) {
    const d = b[1] - a[1], v0 = h * m0, v1 = h * m1
    return a[1] + v0 * u + (10 * d - 6 * v0 - 4 * v1) * u3
      + (-15 * d + 8 * v0 + 7 * v1) * u3 * u
      + (6 * d - 3 * v0 - 3 * v1) * u3 * u2
  }
  return (2 * u3 - 3 * u2 + 1) * a[1] + (u3 - 2 * u2 + u) * h * m0
    + (-2 * u3 + 3 * u2) * b[1] + (u3 - u2) * h * m1
}

/** Exact derivative of ringMechanicalTimeAt in display seconds. */
export function ringMechanicalRateAt(time: number): number {
  if (time < 0 || time > PRIVATE_RING_DURATION) return 0
  if (time >= RING_SLOW_START && time <= RING_SLOW_END) {
    return RING_NORMAL_RATE * sampleBulletTimeRate((time - RING_SLOW_START) / SLOW_DURATION,
      RING_BULLET_RATIO, RING_BULLET_RAMP_FRACTION)
  }
  let i = 0
  while (i < KNOTS.length - 2 && time >= KNOTS[i + 1][0]) i++
  const a = KNOTS[i], b = KNOTS[i + 1], h = b[0] - a[0], u = clamp((time - a[0]) / h)
  const m0 = slope(i), m1 = slope(i + 1), u2 = u * u
  if (i === 2 || i === 6) {
    const d = b[1] - a[1], v0 = h * m0, v1 = h * m1
    return (v0 + 3 * (10 * d - 6 * v0 - 4 * v1) * u2
      + 4 * (-15 * d + 8 * v0 + 7 * v1) * u2 * u
      + 5 * (6 * d - 3 * v0 - 3 * v1) * u2 * u2) / h
  }
  return ((6 * u2 - 6 * u) * a[1] + (3 * u2 - 4 * u + 1) * h * m0
    + (-6 * u2 + 6 * u) * b[1] + (3 * u2 - 2 * u) * h * m1) / h
}

/** No allocations; reverse/seek reproduces the same material and mechanical state. */
export function samplePrivateRing(time: number, out: InspectionFrame): InspectionFrame {
  const t = Math.max(0, Math.min(PRIVATE_RING_DURATION, time))
  const mechanical = ringMechanicalTimeAt(t), rate = ringMechanicalRateAt(t)
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
