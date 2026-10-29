/**
 * JG-038 C1: pure canonical-progress inspection sample. The private host owns
 * camera application, playback arbitration and the shaft-to-world conversion.
 * No narrative clock, stores, Three objects or mutable shared scratch live here.
 */
import {
  createShaftKinematicsFrame,
  hobPhiAt,
  machiningRateAt,
  machiningTimeAt,
  sampleShaftKinematics,
  type ShaftKinematicsFrame,
} from '../inspection/shaft/kinematics'
import {
  createShaftCameraSample,
  sampleShaftCamera,
  type ShaftCameraSample,
} from '../inspection/shaft/camera'
import { BULLET_TIME_SHOT_SPECS, SHAPER_CAMERA_CLOCK, sampleBulletTimeRate, sampleBulletTimeWarp } from './bulletTime'
import {
  CASCADE_PACING_BASELINE_MULTIPLIER,
  torqueProgressAtDistance,
  torqueScrollDistance,
  torqueScrollDistanceRate,
} from './scrollPacing'

export const CASCADE_CLOCK_START = 40.2
export const CASCADE_CLOCK_END = 66.9
const [SHAPER_BULLET_START, SHAPER_BULLET_END] = BULLET_TIME_SHOT_SPECS.shaperContact.window
const [HOB_BULLET_START, HOB_BULLET_END] = BULLET_TIME_SHOT_SPECS.hobContact.window
const [IGNITION_START, IGNITION_END] = BULLET_TIME_SHOT_SPECS.stage1Ignition.window

interface TimeKnot {
  readonly progress: number
  readonly time: number
  /** Preserve the incoming owner-approved clock when replacing the following span. */
  readonly slopeNext?: TimeKnot
}

const SUBJECT_KNOTS: readonly TimeKnot[] = [
  { progress: 0.735, time: 0 },
  { progress: 0.795, time: 7.2 },
  { progress: SHAPER_BULLET_START, time: 7.5 },
  { progress: SHAPER_BULLET_END, time: 7.5 + (SHAPER_CAMERA_CLOCK.end - SHAPER_CAMERA_CLOCK.start)
    * (BULLET_TIME_SHOT_SPECS.shaperContact.rate + BULLET_TIME_SHOT_SPECS.shaperContact.rampFraction
      * (1 - BULLET_TIME_SHOT_SPECS.shaperContact.rate)) / machiningRateAt(7.5) },
  { progress: 0.835, time: 9.6 },
  { progress: 0.87, time: 24.6 },
  { progress: 0.884, time: 25 },
  // Reference shoulder tangents. Doc39 replaces the interior shaping/hob clocks
  // below with 10% NORMAL speed; the outer timing seams stay fixed.
  { progress: 0.89, time: 25.257 },
  { progress: HOB_BULLET_START, time: 25.62 },
  { progress: HOB_BULLET_END, time: 26.4 },
  { progress: 0.90071, time: 28.955 },
  { progress: 0.90208, time: 30.508 },
  { progress: 0.905, time: 32, slopeNext: { progress: 0.94, time: 43 } },
  { progress: 0.912, time: 35 },
  { progress: IGNITION_START, time: 38.5 },
  { progress: IGNITION_END, time: 40.2, slopeNext: { progress: 0.94, time: 43 } },
  { progress: 0.94, time: CASCADE_CLOCK_END },
]

/**
 * The camera is allowed to lead the machining master. It dwells with the fading
 * cutter, makes the recap/FEA move while the subject is static, then re-syncs at
 * hob engagement and settles before the approved close handoff.
 */
const CAMERA_KNOTS: readonly TimeKnot[] = [
  { progress: 0.735, time: 0 },
  { progress: 0.795, time: 7.2 },
  { progress: 0.835, time: 10.3 },
  { progress: 0.846, time: 10.4 },
  { progress: 0.863, time: 15 },
  { progress: 0.874, time: 22.6 },
  { progress: 0.884, time: 25 },
  { progress: 0.905, time: 32, slopeNext: { progress: 0.925, time: 43 } },
  { progress: 0.912, time: 35 },
  { progress: IGNITION_START, time: 38.5 },
  { progress: IGNITION_END, time: 40.2, slopeNext: { progress: 0.94, time: 43 } },
  { progress: 0.94, time: CASCADE_CLOCK_END },
]

const RING_TIME_KNOTS: readonly TimeKnot[] = [
  // T5: ring study window [.46,.505]. Display time is held at 0 until ALL surroundings are hidden
  // (isolation completes at .4725) and reaches the 28 s end at .4945, then holds through the restore.
  { progress: 0.46, time: 0 },
  { progress: 0.4725, time: 0 },
  { progress: 0.475, time: 4 },
  { progress: BULLET_TIME_SHOT_SPECS.ringSwitch.window[0], time: BULLET_TIME_SHOT_SPECS.ringSwitch.displayWindow[0] },
  { progress: BULLET_TIME_SHOT_SPECS.ringSwitch.window[1], time: BULLET_TIME_SHOT_SPECS.ringSwitch.displayWindow[1] },
  { progress: 0.4905, time: 26 },
  { progress: 0.4945, time: 28 },
  { progress: 0.505, time: 28 },
]

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth01 = (x: number) => {
  const u = clamp01(x)
  // Evaluate the same cubic from the nearer endpoint to avoid weight overshoot.
  return u <= 0.5 ? u * u * (3 - 2 * u) : 1 - (1 - u) * (1 - u) * (1 + 2 * u)
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const DEG = Math.PI / 180

/** Weighted harmonic PCHIP tangent: monotone spans with shared C1 knot rates. */
function timeSlope(knots: readonly TimeKnot[], index: number): number {
  if (index === 0 || index === knots.length - 1) return 0
  const a = knots[index - 1]
  const b = knots[index]
  const c = b.slopeNext ?? knots[index + 1]
  const h0 = b.progress - a.progress
  const h1 = c.progress - b.progress
  const d0 = (b.time - a.time) / h0
  const d1 = (c.time - b.time) / h1
  const w0 = 2 * h1 + h0
  const w1 = h1 + 2 * h0
  return d0 <= 0 || d1 <= 0 ? 0 : (w0 + w1) / (w0 / d0 + w1 / d1)
}

function timeAt(knots: readonly TimeKnot[], progress: number, endTime: number): number {
  if (progress <= knots[0].progress) return knots[0].time
  if (progress >= knots[knots.length - 1].progress) return knots[0].time + endTime
  let i = 0
  while (i < knots.length - 2 && progress >= knots[i + 1].progress) i++
  const a = knots[i]
  const b = knots[i + 1]
  if (progress === a.progress) return a.time
  const h = b.progress - a.progress
  const u = (progress - a.progress) / h
  const u2 = u * u
  const u3 = u2 * u
  const result = (2 * u3 - 3 * u2 + 1) * a.time
    + (u3 - 2 * u2 + u) * h * timeSlope(knots, i)
    + (-2 * u3 + 3 * u2) * b.time
    + (u3 - u2) * h * timeSlope(knots, i + 1)
  return Math.max(a.time, Math.min(b.time, result))
}

function timeRateAt(knots: readonly TimeKnot[], p: number): number {
  let i = 0
  while (i < knots.length - 2 && p >= knots[i + 1].progress) i++
  const a = knots[i], b = knots[i + 1], h = b.progress - a.progress
  const u = (p - a.progress) / h
  return 6 * u * (1 - u) * (b.time - a.time) / h
    + (3 * u * u - 4 * u + 1) * timeSlope(knots, i)
    + (3 * u * u - 2 * u) * timeSlope(knots, i + 1)
}

function joinTime(p: number, a: number, b: number, ta: number, tb: number, ra: number, rb: number): number {
  const u = (p - a) / (b - a), u2 = u * u, u3 = u2 * u
  return (2 * u3 - 3 * u2 + 1) * ta + (u3 - 2 * u2 + u) * (b - a) * ra
    + (-2 * u3 + 3 * u2) * tb + (u3 - u2) * (b - a) * rb
}

const CASCADE_PROGRESS_START: number = IGNITION_END
const CASCADE_PROGRESS_END = .94
const CASCADE_NATIVE_START = .815
const CASCADE_NATIVE_END = .825
const INSPECTION_PROGRESS_OFFSET = .115
/** Each side uses 5% of its window's physical distance; the middle 90% is linear. */
export const CASCADE_CLOCK_SHOULDER = .05

// Freeze the *old* 40.2–58 s PCHIP solely as a distance-budget reference.
// The incoming tangent deliberately uses slopeNext (.94, 43), just as before.
const CASCADE_INCOMING_PROGRESS_RATE = timeSlope(SUBJECT_KNOTS, SUBJECT_KNOTS.length - 2)
function baselineCascadeProgressAtTime(time: number): number {
  if (time <= CASCADE_CLOCK_START) return CASCADE_PROGRESS_START
  if (time >= 58) return CASCADE_PROGRESS_END
  let lo = CASCADE_PROGRESS_START, hi = CASCADE_PROGRESS_END
  for (let i = 0; i < 52; i++) {
    const p = (lo + hi) / 2
    const t = joinTime(p, CASCADE_PROGRESS_START, CASCADE_PROGRESS_END,
      CASCADE_CLOCK_START, 58, CASCADE_INCOMING_PROGRESS_RATE, 0)
    if (t < time) lo = p
    else hi = p
  }
  return (lo + hi) / 2
}

const CASCADE_DISTANCE_START = torqueScrollDistance(CASCADE_NATIVE_START)
const CASCADE_BASELINE_DISTANCE_START = torqueScrollDistance(CASCADE_NATIVE_START, CASCADE_PACING_BASELINE_MULTIPLIER)

/** Budget boundaries derived from the unrounded old clock and native-distance map. */
const baselineCascadeBoundaries = [
  40.2, 43.5, 44.4, 45.3, 46.2, 52.2, 53.1, 54, 55.5, 56.4, 57,
  57.9, 59.1, 60, 60.9, 62.25, 63.15, 64.65, 65.4, 66.9,
].map((time, i, times) => {
  const baselineTime = CASCADE_CLOCK_START + (time - CASCADE_CLOCK_START) / 1.5
  const baselineProgress = baselineCascadeProgressAtTime(baselineTime)
  const baselineNativeProgress = i === 0 ? CASCADE_NATIVE_START
    : i === times.length - 1 ? CASCADE_NATIVE_END : baselineProgress - INSPECTION_PROGRESS_OFFSET
  const baselineDistance = torqueScrollDistance(baselineNativeProgress, CASCADE_PACING_BASELINE_MULTIPLIER)
  const distance = i === 0 ? CASCADE_DISTANCE_START
    : i === times.length - 1 ? torqueScrollDistance(CASCADE_NATIVE_END)
      : CASCADE_DISTANCE_START + 1.5 * (baselineDistance - CASCADE_BASELINE_DISTANCE_START)
  const progress = i === 0 ? CASCADE_PROGRESS_START : i === times.length - 1 ? CASCADE_PROGRESS_END
    : torqueProgressAtDistance(distance) + INSPECTION_PROGRESS_OFFSET
  return Object.freeze({ time, progress, distance, baselineTime, baselineProgress, baselineDistance })
})

/** Owner proposal 66: shorten the early unsupported-planet read and spend its
 * native distance on later stages. Total page/cascade distance is unchanged. */
const earlyWindow = (a:number,b:number) => a >= 44.4 && b <= 52.2
const laterWindow = (a:number,b:number) => a >= 53.1 && b <= 64.65
const earlyDistance = baselineCascadeBoundaries.slice(1).reduce((sum,b,i)=>
  sum+(earlyWindow(baselineCascadeBoundaries[i].time,b.time)?b.distance-baselineCascadeBoundaries[i].distance:0),0)
const laterDistance = baselineCascadeBoundaries.slice(1).reduce((sum,b,i)=>
  sum+(laterWindow(baselineCascadeBoundaries[i].time,b.time)?b.distance-baselineCascadeBoundaries[i].distance:0),0)
const earlyWeight = .35
export const CASCADE_LATER_DISTANCE_GAIN = 1 + earlyDistance * (1-earlyWeight) / laterDistance
let cascadeBudgetDistance = CASCADE_DISTANCE_START
export const CASCADE_CLOCK_BOUNDARIES = Object.freeze(baselineCascadeBoundaries.map((b,i,all)=>{
  if(i>0){
    const a=all[i-1],weight=earlyWindow(a.time,b.time)?earlyWeight
      :laterWindow(a.time,b.time)?CASCADE_LATER_DISTANCE_GAIN:1
    cascadeBudgetDistance+=(b.distance-a.distance)*weight
  }
  const distance=i===all.length-1?b.distance:cascadeBudgetDistance
  const progress=i===0?CASCADE_PROGRESS_START:i===all.length-1?CASCADE_PROGRESS_END
    :torqueProgressAtDistance(distance)+INSPECTION_PROGRESS_OFFSET
  return Object.freeze({...b,distance,progress,previewDistanceWeight:i===0?1:
    earlyWindow(all[i-1].time,b.time)?earlyWeight:laterWindow(all[i-1].time,b.time)?CASCADE_LATER_DISTANCE_GAIN:1})
}))

const cascadeMeanRates = CASCADE_CLOCK_BOUNDARIES.slice(1).map((b, i) => {
  const a = CASCADE_CLOCK_BOUNDARIES[i]
  return (b.time - a.time) / (b.distance - a.distance)
})
const cascadeBoundaryRates = CASCADE_CLOCK_BOUNDARIES.map((_, i) => i === 0
  ? CASCADE_INCOMING_PROGRESS_RATE / torqueScrollDistanceRate(CASCADE_NATIVE_START)
  : i === cascadeMeanRates.length ? cascadeMeanRates[i - 1]
    : Math.sqrt(cascadeMeanRates[i - 1] * cascadeMeanRates[i]))

/** Rates are seconds per baseline-page distance unit, not seconds per narrative progress. */
export const CASCADE_CLOCK_WINDOWS = Object.freeze(CASCADE_CLOCK_BOUNDARIES.slice(1).map((end, i) => {
  const start = CASCADE_CLOCK_BOUNDARIES[i]
  const width = end.distance - start.distance
  const startRate = cascadeBoundaryRates[i], endRate = cascadeBoundaryRates[i + 1]
  // Integral of both smoothstep velocity shoulders plus the constant interior.
  const interiorRate = (cascadeMeanRates[i] - CASCADE_CLOCK_SHOULDER * (startRate + endRate) / 2)
    / (1 - CASCADE_CLOCK_SHOULDER)
  const shoulderDistance = CASCADE_CLOCK_SHOULDER * width
  const interiorStartProgress = torqueProgressAtDistance(start.distance + shoulderDistance) + INSPECTION_PROGRESS_OFFSET
  const interiorEndProgress = torqueProgressAtDistance(end.distance - shoulderDistance) + INSPECTION_PROGRESS_OFFSET
  return Object.freeze({ start, end, startRate, endRate, interiorRate, shoulderDistance,
    interiorStartProgress, interiorEndProgress })
}))

/** Integral of smoothstep velocity from 0 to u. */
const shoulderIntegral = (u: number) => u * u * u * (1 - u / 2)

/** Shared, stateless continuation clock. No PCHIP or zero-rate endpoint in this era. */
export function cascadeTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Cascade progress must be finite')
  if (progress <= CASCADE_PROGRESS_START) return CASCADE_CLOCK_START
  if (progress >= CASCADE_PROGRESS_END) return CASCADE_CLOCK_END
  let i = 0
  while (i < CASCADE_CLOCK_WINDOWS.length - 1 && progress >= CASCADE_CLOCK_WINDOWS[i].end.progress) i++
  const { start, end, startRate, endRate, interiorRate, shoulderDistance } = CASCADE_CLOCK_WINDOWS[i]
  if (progress === start.progress) return start.time
  const distance = torqueScrollDistance(progress - INSPECTION_PROGRESS_OFFSET)
  const traveled = distance - start.distance
  const remaining = end.distance - distance
  if (traveled < shoulderDistance) {
    const u = traveled / shoulderDistance
    return start.time + shoulderDistance * (startRate * u + (interiorRate - startRate) * shoulderIntegral(u))
  }
  if (remaining < shoulderDistance) {
    const u = remaining / shoulderDistance
    return end.time - shoulderDistance * (endRate * u + (interiorRate - endRate) * shoulderIntegral(u))
  }
  return start.time + shoulderDistance * (startRate + interiorRate) / 2
    + interiorRate * (traveled - shoulderDistance)
}

/** Useful for telemetry/seek tooling; clamps to this continuation's domain. */
export function cascadeProgressAtTime(time: number): number {
  if (!Number.isFinite(time)) throw new RangeError('Cascade time must be finite')
  if (time <= CASCADE_CLOCK_START) return CASCADE_PROGRESS_START
  if (time >= CASCADE_CLOCK_END) return CASCADE_PROGRESS_END
  for (const boundary of CASCADE_CLOCK_BOUNDARIES) if (time === boundary.time) return boundary.progress
  let lo = CASCADE_PROGRESS_START, hi = CASCADE_PROGRESS_END
  for (let i = 0; i < 52; i++) {
    const p = (lo + hi) / 2
    if (cascadeTimeAt(p) < time) lo = p
    else hi = p
  }
  return (lo + hi) / 2
}

// Normal machining seconds advance with the unslowed camera clock. Compensate
// for the borrowed shaper's .22 rate instead of multiplying two slowdowns.
function shapingBulletTime(p: number): number {
  const spec = BULLET_TIME_SHOT_SPECS.shaperContact
  const duration = cameraTimeAt(SHAPER_BULLET_END) - cameraTimeAt(SHAPER_BULLET_START)
  const u = (cameraTimeAt(p) - cameraTimeAt(SHAPER_BULLET_START)) / duration
  // The normalized integral has unit area: restore its physical area before
  // inverting the existing eased machining law (never multiply two slowdowns).
  const physical = machiningTimeAt(7.5) + duration
    * (spec.rate + spec.rampFraction * (1 - spec.rate))
    * sampleBulletTimeWarp(u, spec.rate, spec.rampFraction)
  let lo = 7.2, hi = 11
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2
    if (machiningTimeAt(mid) < physical) lo = mid
    else hi = mid
  }
  return p === SHAPER_BULLET_START ? 7.5 : (lo + hi) / 2
}
function shapingBulletRate(p: number): number {
  const spec = BULLET_TIME_SHOT_SPECS.shaperContact
  const duration = cameraTimeAt(SHAPER_BULLET_END) - cameraTimeAt(SHAPER_BULLET_START)
  const u = (cameraTimeAt(p) - cameraTimeAt(SHAPER_BULLET_START)) / duration
  const epsilon = 1e-7
  const cameraRate = p === SHAPER_BULLET_START ? SHAPER_CAMERA_CLOCK.entryRate
    : p === SHAPER_BULLET_END ? SHAPER_CAMERA_CLOCK.exitRate
      : (cameraTimeAt(p + epsilon) - cameraTimeAt(p - epsilon)) / (2 * epsilon)
  return sampleBulletTimeRate(u, spec.rate, spec.rampFraction)
    * cameraRate / machiningRateAt(shapingBulletTime(p))
}

function hobbingBulletTime(p: number): number {
  if (p === HOB_BULLET_START) return 25.62
  // Normal hob speed is .5 rev/s. Invert the existing eased spindle clock so
  // even engagement accelerations give exactly .10 of NORMAL angular speed.
  const spec = BULLET_TIME_SHOT_SPECS.hobContact
  const duration = cameraTimeAt(HOB_BULLET_END) - cameraTimeAt(HOB_BULLET_START)
  const u = (cameraTimeAt(p) - cameraTimeAt(HOB_BULLET_START)) / duration
  const phi = hobPhiAt(25.62) + Math.PI * duration
    * (spec.rate + spec.rampFraction * (1 - spec.rate))
    * sampleBulletTimeWarp(u, spec.rate, spec.rampFraction)
  let lo = 25.2, hi = 31
  for (let i = 0; i < 42; i++) {
    const mid = (lo + hi) / 2
    if (hobPhiAt(mid) < phi) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
function hobbingBulletRate(p: number): number {
  const t = hobbingBulletTime(p), u = clamp01((t - 25.2) / 0.8)
  const spec = BULLET_TIME_SHOT_SPECS.hobContact
  const duration = cameraTimeAt(HOB_BULLET_END) - cameraTimeAt(HOB_BULLET_START)
  const cameraU = (cameraTimeAt(p) - cameraTimeAt(HOB_BULLET_START)) / duration
  return sampleBulletTimeRate(cameraU, spec.rate, spec.rampFraction) * timeRateAt(CAMERA_KNOTS, p) / smooth01(u)
}

/** Pure subject clock; C1 shoulders preserve all surrounding story endpoints. */
export function subjectTimeAt(progress: number): number {
  const p = progress
  if (p > CASCADE_PROGRESS_START) return cascadeTimeAt(p)
  if (p > .795 && p < .835) {
    if (p < SHAPER_BULLET_START) return joinTime(p, .795, SHAPER_BULLET_START, 7.2, 7.5,
      timeRateAt(SUBJECT_KNOTS, .795), shapingBulletRate(SHAPER_BULLET_START))
    if (p <= SHAPER_BULLET_END) return shapingBulletTime(p)
    return joinTime(p, SHAPER_BULLET_END, .835, shapingBulletTime(SHAPER_BULLET_END), 9.6,
      shapingBulletRate(SHAPER_BULLET_END), timeRateAt(SUBJECT_KNOTS, .835))
  }
  if (p > .89 && p < .90071) {
    if (p < HOB_BULLET_START) return joinTime(p, .89, HOB_BULLET_START, 25.257, 25.62,
      timeRateAt(SUBJECT_KNOTS, .89), hobbingBulletRate(HOB_BULLET_START))
    if (p <= HOB_BULLET_END) return hobbingBulletTime(p)
    return joinTime(p, HOB_BULLET_END, .90071, hobbingBulletTime(HOB_BULLET_END), 28.955,
      hobbingBulletRate(HOB_BULLET_END), timeRateAt(SUBJECT_KNOTS, .90071))
  }
  return timeAt(SUBJECT_KNOTS, progress, CASCADE_CLOCK_END)
}

/** Authored camera seconds, independent of machining's integrated rate. */
export function cameraTimeAt(progress: number): number {
  if (progress > CASCADE_PROGRESS_START) return cascadeTimeAt(progress)
  // Shorten only the contact camera clock so the canonical normal-speed knees
  // fit before the preserved 9.6 s subject exit. Match positive shoulder rates.
  if (progress > .795 && progress < .835) {
    if (progress < SHAPER_BULLET_START) return joinTime(progress, .795, SHAPER_BULLET_START,
      7.2, SHAPER_CAMERA_CLOCK.start, timeRateAt(CAMERA_KNOTS, .795), SHAPER_CAMERA_CLOCK.entryRate)
    if (progress <= SHAPER_BULLET_END) return joinTime(progress, SHAPER_BULLET_START, SHAPER_BULLET_END,
      SHAPER_CAMERA_CLOCK.start, SHAPER_CAMERA_CLOCK.end, SHAPER_CAMERA_CLOCK.entryRate, SHAPER_CAMERA_CLOCK.exitRate)
    return joinTime(progress, SHAPER_BULLET_END, .835, SHAPER_CAMERA_CLOCK.end, 10.3,
      SHAPER_CAMERA_CLOCK.exitRate, timeRateAt(CAMERA_KNOTS, .835))
  }
  return timeAt(CAMERA_KNOTS, progress, CASCADE_CLOCK_END)
}

/** Ring master seconds on the fixed canonical .46-.505 span. */
export function ringTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Ring progress must be finite')
  return timeAt(RING_TIME_KNOTS, clamp01(progress), 28)
}

/**
 * T5: the ring study precedes the shift. Surroundings fade out over [.469,.4725], stay black
 * through the 28 s study, and restore over [.495,.505] while the camera glides
 * continuously into the shift view. They fade again over [.72,.735] so the shaft entry still starts from
 * black, then stay black through the shaft study and restore only through the approved close
 * handoff (.924-.94).
 */
export function sampleInspectionSurroundings(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Isolation progress must be finite')
  const p = clamp01(progress)
  if (p <= 0.469 || p >= 0.94) return 1
  if (p < 0.4725) return 1 - smooth01((p - 0.469) / 0.0035)
  if (p < 0.495) return 0
  if (p < 0.505) return smooth01((p - 0.495) / 0.010)
  if (p < 0.72) return 1
  if (p < 0.735) return 1 - smooth01((p - 0.72) / 0.015)
  if (p < 0.924) return 0
  return smooth01((p - 0.924) / 0.016)
}

export interface CutterCameraKeyframe {
  /** Subject master seconds gate the arc; camera seconds parameterize its path. */
  readonly subjectTime: number
  readonly cameraTime: number
  /** Machine-frame radians, metres, and vertical FOV degrees. */
  readonly azimuth: number
  readonly elevation: number
  readonly distance: number
  readonly fovDesktop: number
  readonly fovNarrow: number
  readonly target: readonly [number, number, number]
  readonly targetNarrow: readonly [number, number, number]
}

/**
 * Shaft-local METRES, +Y up. Authored framing candidates, not clearance proof.
 * Targets/FOV retain the baseline desktop and narrow slow-window composition.
 * The host must review the actual cutter, occlusion and DOM framing at runtime.
 */
export const CutterCameraArc: readonly CutterCameraKeyframe[] = Object.freeze([
  Object.freeze({
    subjectTime: 7.5, cameraTime: cameraTimeAt(SHAPER_BULLET_START),
    azimuth: 180 * DEG, elevation: 3.2 * DEG, distance: 0.2,
    fovDesktop: 11.4, fovNarrow: 28.5,
    target: Object.freeze([0.000068, 0.007821, 0.004208] as const),
    targetNarrow: Object.freeze([0.000490, 0.017355, 0.010186] as const),
  }),
  Object.freeze({
    subjectTime: 9.6, cameraTime: cameraTimeAt(SHAPER_BULLET_END),
    azimuth: (180 + BULLET_TIME_SHOT_SPECS.shaperContact.cameraSweepDeg) * DEG,
    elevation: 6 * DEG, distance: 0.205,
    fovDesktop: 11.4, fovNarrow: 28.5,
    target: Object.freeze([0.002280, 0.007102, 0.007128] as const),
    targetNarrow: Object.freeze([-0.001363, 0.014397, 0.010189] as const),
  }),
])

export interface PrivateInspectionCamera extends ShaftCameraSample {
  /** Normalized look direction; together with up specifies orientation, no roll override. */
  dx: number
  dy: number
  dz: number
}

export interface PrivateInspectionSample {
  progress: number
  /** Master seconds sent unchanged to the existing shaft sampler. */
  subjectTime: number
  /** Authored camera clock, not machining time or elapsed wall time. */
  cameraTime: number
  /** Existing dm/d(subject master seconds), not dm/d(canonical progress). */
  machiningRate: number
  arcWeight: number
  feaDwellWeight: number
  hobSwingWeight: number
  surroundingsOpacity: number
  /** Existing kinematics remain in shaft-local millimetres and radians. */
  kinematics: ShaftKinematicsFrame
  /** Camera position/target are shaft-local metres; FOV is vertical degrees. */
  camera: PrivateInspectionCamera
}

export function createPrivateInspectionSample(): PrivateInspectionSample {
  return {
    progress: 0, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0,
    feaDwellWeight: 0, hobSwingWeight: 0, surroundingsOpacity: 1,
    kinematics: createShaftKinematicsFrame(),
    camera: { ...createShaftCameraSample(), dx: 0, dy: 0, dz: -1 },
  }
}

function orbitAboutTarget(
  camera: ShaftCameraSample,
  radians: number,
  distanceScale: number,
): void {
  const ox = (camera.px - camera.tx) * distanceScale
  const oy = camera.py - camera.ty
  const oz = (camera.pz - camera.tz) * distanceScale
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  camera.px = camera.tx + ox * cos + oz * sin
  camera.py = camera.ty + oy
  camera.pz = camera.tz - ox * sin + oz * cos
}

/** No allocations per sample; all mutation is confined to the caller's output. */
export function samplePrivateInspection(
  progress: number,
  aspect: number,
  out: PrivateInspectionSample,
): PrivateInspectionSample {
  // Validate both inputs before touching output, including on out-of-range progress.
  if (!Number.isFinite(progress) || !Number.isFinite(aspect)) {
    throw new RangeError('Private inspection progress and aspect must be finite')
  }
  const p = clamp01(progress)
  const subjectTime = subjectTimeAt(p)
  const cameraTime = cameraTimeAt(p)
  const a = CutterCameraArc[0]
  const b = CutterCameraArc[1]
  const arcWeight = smooth01((cameraTime - 6.5) / (a.subjectTime - 6.5))
    * (1 - smooth01((cameraTime - 10.4) / (11.2 - 10.4)))

  out.progress = p
  out.subjectTime = subjectTime
  out.cameraTime = cameraTime
  out.machiningRate = machiningRateAt(subjectTime)
  out.arcWeight = arcWeight
  out.surroundingsOpacity = sampleInspectionSurroundings(p)
  sampleShaftKinematics(subjectTime, out.kinematics)

  // Camera seconds drive the normal camera while machining remains on its own
  // mechanical master. The kinematic follow is live before 15 s and frozen after.
  const camera = sampleShaftCamera(cameraTime, aspect, out.kinematics, out.camera)

  // The inherited macro crops the outer disc at the arc's two blend edges and
  // during the recap. Settle a private, wider cutter composition before its
  // reveal, then return smoothly after retirement. Geometry/subject laws stay
  // borrowed unchanged; this framing belongs only to the private page.
  const framingWeight = smooth01(cameraTime / 2)
    * (1 - smooth01((cameraTime - 15) / 1))
  if (framingWeight > 0) {
    const layout = clamp01((aspect - 0.62) / 0.4)
    // Owner correction 68: read the cutter and work gear, not the entire arbor.
    // The long spindle-side shaft must continue beyond the view to imply its
    // offscreen machine attachment. The contact arc itself stays unchanged.
    const establish=framingWeight*(1-arcWeight)
    const ty = lerp(0.004,0.003,layout)
    // Keep the work gear and near cutter edge together on narrow screens;
    // the cutter's far periphery may crop, while its engagement stays readable.
    // Desktop copy owns the left column, so the pair sits farther right there.
    const tz = lerp(.014,.005,layout)
    const dx = (0 - camera.tx) * framingWeight
    const dy = (ty - camera.ty) * framingWeight
    const dz = (tz - camera.tz) * framingWeight
    camera.px += dx; camera.py += dy; camera.pz += dz
    camera.tx += dx; camera.ty += dy; camera.tz += dz
    camera.fov = lerp(camera.fov, lerp(38, 24, layout), framingWeight)
    const ox=camera.px-camera.tx,oz=camera.pz-camera.tz
    const baseRadius=Math.hypot(ox,camera.py-camera.ty,oz)
    const radius=baseRadius
    const azimuth=Math.atan2(oz,ox)
    const elevation=lerp(Math.asin((camera.py-camera.ty)/baseRadius),24*DEG,establish)
    camera.px=camera.tx+radius*Math.cos(elevation)*Math.cos(azimuth)
    camera.py=camera.ty+radius*Math.sin(elevation)
    camera.pz=camera.tz+radius*Math.cos(elevation)*Math.sin(azimuth)
  }

  if (arcWeight > 0) {
    const u = smooth01((cameraTime - a.cameraTime) / (b.cameraTime - a.cameraTime))
    // Match the root-free leaf's layout law exactly; no extra aspect policy.
    const layout = clamp01((aspect - 0.62) / 0.4)
    const tx = lerp(lerp(a.targetNarrow[0], a.target[0], layout), lerp(b.targetNarrow[0], b.target[0], layout), u)
    const ty = lerp(lerp(a.targetNarrow[1], a.target[1], layout), lerp(b.targetNarrow[1], b.target[1], layout), u)
    const tz = lerp(lerp(a.targetNarrow[2], a.target[2], layout), lerp(b.targetNarrow[2], b.target[2], layout), u)
    const az = lerp(a.azimuth, b.azimuth, u)
    const el = lerp(a.elevation, b.elevation, u)
    const distance = lerp(a.distance, b.distance, u) * (1 - .12 * Math.sin(Math.PI * u) ** 2)
    const horizontal = distance * Math.cos(el)
    camera.px = lerp(camera.px, tx + horizontal * Math.cos(az), arcWeight)
    camera.py = lerp(camera.py, ty + distance * Math.sin(el), arcWeight)
    camera.pz = lerp(camera.pz, tz + horizontal * Math.sin(az), arcWeight)
    camera.tx = lerp(camera.tx, tx, arcWeight)
    camera.ty = lerp(camera.ty, ty, arcWeight)
    camera.tz = lerp(camera.tz, tz, arcWeight)
    camera.fov = lerp(camera.fov,
      lerp(lerp(a.fovNarrow, a.fovDesktop, layout), lerp(b.fovNarrow, b.fovDesktop, layout), u), arcWeight)
    // Baseline +Y up and follow/light fields pass through unchanged in this era.
  }

  // FEA is a patient dwell, not a frozen card: a small C1 orbit keeps depth
  // readable while the mechanical master itself remains stationary.
  const feaU = clamp01((cameraTime - 15.2) / (22.4 - 15.2))
  const feaBell = feaU <= 0 || feaU >= 1 ? 0 : Math.sin(Math.PI * feaU) ** 2
  out.feaDwellWeight = feaBell
  // A readable one-way drift, retained after the card; no out-and-back orbit.
  // The leaf anchors carry the one-way drift onward into the hob approach.

  // Bullet-time hob: subject time is heavily reparameterized below, while this
  // active camera swings through the actual certified contact and returns to
  // the baseline framing at both endpoints.
  const hobStart = cameraTimeAt(HOB_BULLET_START), hobEnd = cameraTimeAt(HOB_BULLET_END)
  const hobU = clamp01((cameraTime - hobStart) / (hobEnd - hobStart))
  const hobBell = hobU <= 0 || hobU >= 1 ? 0 : Math.sin(Math.PI * hobU) ** 2
  out.hobSwingWeight = hobBell
  if (hobBell > 0) {
    camera.ty = lerp(camera.ty, out.kinematics.hobYc * 0.001, hobBell)
    camera.fov = lerp(camera.fov, Math.max(6, camera.fov - 2), hobBell)
  }
  if (cameraTime >= hobStart && cameraTime < 35) {
    const transfer = 1 - smooth01((cameraTime - 33.2) / 1.8)
    orbitAboutTarget(camera, -BULLET_TIME_SHOT_SPECS.hobContact.cameraSweepDeg * DEG * smooth01(hobU) * transfer, 1 - .12 * hobBell)
  }
  // Offline GLB/DOM-solver authoring at both layouts. Blend framing outside
  // contact so the orbit retains its physical focus and handoff endpoints.
  const hobFraming = smooth01((cameraTime - 25.4) / (hobStart - 25.4))
    * (1 - smooth01((cameraTime - hobEnd) / (32 - hobEnd)))
  if (hobFraming > 0) {
    const layout = clamp01((aspect - .62) / .4)
    // Installed CAD hull + DOM solve: solver-02, desktop/narrow hob contact.
    const tx = lerp(-.007694, .000814, layout), ty = lerp(-.001334, -.003969, layout), tz = lerp(.007902, .004006, layout)
    camera.px += (tx - camera.tx) * hobFraming
    camera.py += (ty - camera.ty) * hobFraming
    camera.pz += (tz - camera.tz) * hobFraming
    camera.tx = lerp(camera.tx, tx, hobFraming); camera.ty = lerp(camera.ty, ty, hobFraming); camera.tz = lerp(camera.tz, tz, hobFraming)
    camera.fov = lerp(camera.fov, lerp(28, 11.4, layout), hobFraming)
    // The full orbital ROI, rather than its midpoint alone, needs this
    // standoff headroom on desktop; keep the telephoto lens discipline.
    const fitScale = 1 + .25 * layout * hobFraming
    camera.px = camera.tx + (camera.px - camera.tx) * fitScale
    camera.py = camera.ty + (camera.py - camera.ty) * fitScale
    camera.pz = camera.tz + (camera.pz - camera.tz) * fitScale
  }
  const ignitionFraming = smooth01((cameraTime - 36.2) / (38.5 - 36.2))
    * (1 - smooth01((cameraTime - 40.2) / (43.5 - 40.2)))
  if (ignitionFraming > 0) {
    const layout = clamp01((aspect - .62) / .4)
    const tx = 0, ty = .0094, tz = lerp(-.0015, .0001, layout)
    camera.px += (tx - camera.tx) * ignitionFraming
    camera.py += (ty - camera.ty) * ignitionFraming
    camera.pz += (tz - camera.tz) * ignitionFraming
    camera.tx = lerp(camera.tx, tx, ignitionFraming); camera.ty = lerp(camera.ty, ty, ignitionFraming); camera.tz = lerp(camera.tz, tz, ignitionFraming)
    camera.fov = lerp(camera.fov, lerp(20, 11.4, layout), ignitionFraming)
    const distanceScale = 1 + .15 * ignitionFraming
    camera.px = camera.tx + (camera.px - camera.tx) * distanceScale
    camera.py = camera.ty + (camera.py - camera.ty) * distanceScale
    camera.pz = camera.tz + (camera.pz - camera.tz) * distanceScale
  }

  // Correct the horizon against the actual view after orbital modifiers. Near
  // pole passages use the projected prior horizon, retaining a continuous roll.
  const vx = camera.tx - camera.px, vy = camera.ty - camera.py, vz = camera.tz - camera.pz
  const vl = Math.hypot(vx, vy, vz), dot = (vx * camera.ux + vy * camera.uy + vz * camera.uz) / vl
  if (cameraTime >= 15 && Math.abs(dot) > .975) {
    camera.ux -= dot * vx / vl; camera.uy -= dot * vy / vl; camera.uz -= dot * vz / vl
    const ul = Math.hypot(camera.ux, camera.uy, camera.uz)
    camera.ux /= ul; camera.uy /= ul; camera.uz /= ul
  }

  const dx = camera.tx - camera.px
  const dy = camera.ty - camera.py
  const dz = camera.tz - camera.pz
  const length = Math.hypot(dx, dy, dz)
  out.camera.dx = dx / length
  out.camera.dy = dy / length
  out.camera.dz = dz / length
  return out
}

export interface PrivateRingCamera {
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
  ux: number
  uy: number
  uz: number
  fov: number
}

interface RingCameraKnot {
  readonly progress: number
  readonly azimuth: number
  readonly elevation: number
  readonly distanceScale: number
  readonly fov: number
  /** Ring-local metres added to the target and camera along the ring axis (groove framing). */
  readonly targetZ?: number
}

/** Close-up dolly (fraction of the whole-ring distance) and how far the close-up follows the live die position. */
export const RING_CLOSEUP_SCALE = 0.55
const RING_CLOSEUP_FOCUS_WEIGHT = 0.8
export const RING_CLOSEUP_START = 0.4768
export const RING_CLOSEUP_END = 0.4905
/** Ring-local point of the active knurling die; the close-up leans the camera toward it. */
export interface PrivateRingFocus { x: number; y: number; z: number }

const RING_BASE_X = -0.7
const RING_BASE_Y = 0.48
const RING_BASE_Z = 0.53
const RING_BASE_LENGTH = Math.hypot(RING_BASE_X, RING_BASE_Y, RING_BASE_Z)
const RING_BASE_AZIMUTH = Math.atan2(RING_BASE_Z, RING_BASE_X)
const RING_BASE_ELEVATION = Math.asin(RING_BASE_Y / RING_BASE_LENGTH)

/** Ring-local +Z faces the snout, -Z faces the handle. Medium-close,
 * whole-ring framing throughout; the host applies ringAnchor exactly once. */
export const RING_GROOVE_VIEW = Object.freeze({
  blue: Object.freeze({ azimuth: RING_BASE_AZIMUTH, elevation: 0.2, distanceScale: 1, fov: 32, targetZ: 0.006 }),
  red: Object.freeze({ azimuth: 3.55, elevation: 0.2, distanceScale: 1, fov: 32, targetZ: -0.006 }),
})
export const RING_CAMERA_BLUE_AT = 0.4725
export const RING_CAMERA_RED_AT = 0.56
/** Camera reaches the snout-side (OSHA Blue) framing when the assembly is fully restored. */
export const RING_CAMERA_BLUE_HOLD_START = 0.505
/** Shift window (MechanismDirector): shift 0 -> 1 over [.520, .545]. The camera orbit shares it. */
export const RING_SHIFT_START = 0.520
export const RING_SHIFT_END = 0.545
const RING_CAMERA_KNOTS: readonly RingCameraKnot[] = [
  { progress: 0.46, azimuth: RING_BASE_AZIMUTH, elevation: RING_BASE_ELEVATION, distanceScale: 1, fov: 34 },
  { progress: 0.4725, ...RING_GROOVE_VIEW.blue },
  { progress: 0.4768, azimuth: 2.7, elevation: 0.16, distanceScale: 1, fov: 32 },
  // Owner 2026-10-22: swing in on the knurling die rolling the diamond pattern into the OD, then pull back to
  // whole-ring framing by .4945. Owner lifted the old 2.95-rad limit; the
  // authored 60-deg sweep supplies >=35 deg/native-vp at the canonical pace.
  // Owner 2026-10-27 explicitly lifts the old 2.95-rad cap for this sweep.
  { progress: 0.481, azimuth: 2.7 + BULLET_TIME_SHOT_SPECS.ringSwitch.cameraSweepDeg * DEG * .52, elevation: 0.22, distanceScale: RING_CLOSEUP_SCALE, fov: 24 },
  { progress: 0.485, azimuth: 2.7 + BULLET_TIME_SHOT_SPECS.ringSwitch.cameraSweepDeg * DEG, elevation: 0.28, distanceScale: RING_CLOSEUP_SCALE, fov: 24 },
  { progress: 0.4895, azimuth: 3.8, elevation: 0.3, distanceScale: 1, fov: 32 },
  { progress: 0.4945, azimuth: 3.8, elevation: 0.3, distanceScale: 1, fov: 32 },
  // Owner 2026-10-24 (06.png): while the assembly fades back in and the Ring Switch is still DOWN
  // (shift = 0), hold the snout-side three-quarter so the OSHA Blue groove is in plain view.
  { progress: RING_CAMERA_BLUE_HOLD_START, ...RING_GROOVE_VIEW.blue, azimuth: RING_GROOVE_VIEW.blue.azimuth + 2 * Math.PI },
  { progress: RING_SHIFT_START, ...RING_GROOVE_VIEW.blue, azimuth: RING_GROOVE_VIEW.blue.azimuth + 2 * Math.PI },
  // Orbit handleward in lockstep with the shift (.520 -> .545): the ring covers Blue and uncovers
  // OSHA Red, which is in view when the switch is UP. Hold the red framing through .560.
  { progress: RING_SHIFT_END, ...RING_GROOVE_VIEW.red, azimuth: RING_GROOVE_VIEW.red.azimuth + 2 * Math.PI },
  { progress: RING_CAMERA_RED_AT, ...RING_GROOVE_VIEW.red, azimuth: RING_GROOVE_VIEW.red.azimuth + 2 * Math.PI },
]

export function createPrivateRingCamera(): PrivateRingCamera {
  return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, ux: 0, uy: 1, uz: 0, fov: 34 }
}

/**
 * Ring-anchor local camera, continuous through the complete shift. The caller
 * supplies the original study radius, never the previous sampled radius.
 */
export function samplePrivateRingCamera(
  progress: number,
  distance: number,
  out: PrivateRingCamera,
  aspect = 1.6,
  focus?: PrivateRingFocus,
): PrivateRingCamera {
  if (!Number.isFinite(progress) || !Number.isFinite(distance) || distance <= 0 || !Number.isFinite(aspect) || aspect <= 0) {
    throw new RangeError('Private ring camera progress and distance must be finite')
  }
  const p = clamp01(progress)
  let i = 0
  while (i < RING_CAMERA_KNOTS.length - 2 && p >= RING_CAMERA_KNOTS[i + 1].progress) i++
  const a = RING_CAMERA_KNOTS[i]
  const b = RING_CAMERA_KNOTS[i + 1]
  const u = smooth01((p - a.progress) / (b.progress - a.progress))
  const azimuth = lerp(a.azimuth, b.azimuth, u)
  const elevation = lerp(a.elevation, b.elevation, u)
  const scaledDistance = Math.max(0.28, distance) * Math.max(1, 0.8 / aspect) * lerp(a.distanceScale, b.distanceScale, u)
  const horizontal = scaledDistance * Math.cos(elevation)
  out.px = horizontal * Math.cos(azimuth)
  out.py = scaledDistance * Math.sin(elevation)
  out.pz = horizontal * Math.sin(azimuth)
  const axis = lerp(a.targetZ ?? 0, b.targetZ ?? 0, u)
  // 0 on the whole-ring framing, 1 at the full close-up: derived from the dolly so the focus lean shares its easing.
  const closeUp = focus ? clamp01((1 - lerp(a.distanceScale, b.distanceScale, u)) / (1 - RING_CLOSEUP_SCALE)) : 0
  // Release the departing die before its withdrawal; constrain contact framing to the ring itself.
  const lean = closeUp * RING_CLOSEUP_FOCUS_WEIGHT * (1 - smooth01((p - .485) / .003))
  const focusLimit = .012
  const focusLength = focus ? Math.hypot(focus.x, focus.y, focus.z) : 0
  const focusScale = focusLength > focusLimit ? focusLimit / focusLength : 1
  const fx = focus ? focus.x * focusScale * lean : 0, fy = focus ? focus.y * focusScale * lean : 0, fz = focus ? focus.z * focusScale * lean : 0
  out.tx = fx; out.ty = fy; out.tz = axis + fz
  out.px += fx; out.py += fy
  out.pz += axis + fz
  out.ux = 0; out.uy = 1; out.uz = 0
  out.fov = lerp(a.fov, b.fov, u)
  // Solver-authored ring/die composition: the close-up keeps actual contact
  // geometry visible rather than following the much larger tool fixture.
  const fit = smooth01((p - .4725) / (RING_CLOSEUP_START - .4725))
    * (1 - smooth01((p - .485) / (.4945 - .485)))
  if (fit > 0) {
    const layout = clamp01((aspect - .62) / .4)
    const shot = smooth01((p - RING_CLOSEUP_START) / (.485 - RING_CLOSEUP_START))
    const tx = lerp(.0007, -.004, shot), ty = lerp(.002, .0026, shot), tz = lerp(-.0011, .0075, shot)
    const radius = lerp(.5, .31, layout), current = Math.hypot(out.px - out.tx, out.py - out.ty, out.pz - out.tz)
    const distance = lerp(current, radius, fit)
    out.tx = lerp(out.tx, tx, fit); out.ty = lerp(out.ty, ty, fit); out.tz = lerp(out.tz, tz, fit)
    out.px = out.tx + distance * Math.cos(elevation) * Math.cos(azimuth)
    out.py = out.ty + distance * Math.sin(elevation)
    out.pz = out.tz + distance * Math.cos(elevation) * Math.sin(azimuth)
    out.fov = lerp(out.fov, lerp(36, 30, layout), fit)
  }
  return out
}

/** Apparent depth multiplier applied only to a private cloned ring material. */
export const RING_KNURL_DEPTH_MULTIPLIER = 1.5
