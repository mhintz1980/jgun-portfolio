import {
  DRAWING_INTRO_WINDOW,
  drawingIntroState,
  INTRO_PHASES,
  type IntroState,
} from '../drawing/introTimeline'
import { sheetReveal } from '../drawing/sheetCamera'
import { GROUP_COUNT } from '../drawing/sheet/ink'
import { BULLET_TIME_RATE } from './bulletTime'
import {
  PRIVATE_SPARK_START_T,
  PRIVATE_WEB_COMPLETE_T,
  PRIVATE_WEB_START_T,
  samplePrivateElectricalScore,
} from './ElectricalDirector'

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth01 = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u) }

/** Private semantic coordinates map to the unchanged lower-level physical channels. */
const INTRO_KNOTS = [
  [0, 0], [0.265, 0.38], [0.32, 0.45], [0.36, 0.66],
  [0.395, 0.79], [0.42, 0.84], [0.435, 0.9], [0.46, 1],
] as const

/** Measured from jgun-sheet-v2.bin.gz: group 15 starts drawing at key .67 -> t .3835. */
export const DEFAULT_FINAL_INK_T = 0.3835

function revealBoundary(group: number, complete: boolean, scratch: number[]): number {
  const read = (t: number) => sheetReveal(t, scratch)[group]
  const atZero = read(0), atOne = read(1)
  if (complete) {
    if (atZero >= 1) return 0
    if (atOne < 1) return 1
  } else {
    if (atZero > 0) return 0
    if (atOne <= 0) return 1
  }
  let low = 0, high = 1
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2
    if (complete ? read(mid) < 1 : read(mid) <= 0) low = mid
    else high = mid
  }
  return (low + high) / 2
}

/**
 * Read the actual baked line instances and convert the latest stroke START
 * to intro time through the unchanged shared reveal map. The lamp therefore
 * fails while that final line is being drawn, not after it completes.
 * This is bake-time only; normal sampling stays allocation-free.
 */
export function finalInkTimeFromStyles(
  styles: ArrayLike<number>,
  stride = 4,
  fallback = DEFAULT_FINAL_INK_T,
): number {
  if (!Number.isFinite(stride) || stride < 4 || !Number.isInteger(stride)) {
    throw new RangeError('Final-ink style stride must be an integer >= 4')
  }
  if (styles.length % stride !== 0) throw new RangeError('Final-ink style buffer is not aligned')
  const scratch = new Array<number>(GROUP_COUNT).fill(1)
  const starts = new Array<number>(GROUP_COUNT).fill(1)
  const ends = new Array<number>(GROUP_COUNT).fill(1)
  let latest = 0
  for (let i = 0; i < styles.length; i += stride) {
    const group = Math.round(styles[i + 1])
    if (group === 0) continue
    if (group < 0 || group >= GROUP_COUNT) throw new RangeError('Final-ink group is out of range')
    if (starts[group] === 1 && ends[group] === 1 && revealBoundary(group, false, scratch) === 1) continue
    if (starts[group] === 1) starts[group] = revealBoundary(group, false, scratch)
    if (ends[group] === 1) ends[group] = revealBoundary(group, true, scratch)
    const key = styles[i + 2]
    if (key <= 0 || key >= 1) continue
    latest = Math.max(latest, starts[group] + key * (ends[group] - starts[group]))
  }
  return latest > 0 ? latest : fallback
}

export function openingTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Opening progress must be finite')
  const p = Math.max(0, Math.min(1, progress))
  if (p >= 0.46) return 1
  let i = 0
  while (i < INTRO_KNOTS.length - 2 && p >= INTRO_KNOTS[i + 1][0]) i++
  const [a, t0] = INTRO_KNOTS[i], [b, t1] = INTRO_KNOTS[i + 1]
  const u = Math.max(0, Math.min(1, (p - a) / (b - a)))
  return t0 + (t1 - t0) * u * u * (3 - 2 * u)
}

function openingRateAt(progress: number): number {
  const p = Math.max(0, Math.min(0.46, progress))
  let i = 0
  while (i < INTRO_KNOTS.length - 2 && p >= INTRO_KNOTS[i + 1][0]) i++
  const [a, t0] = INTRO_KNOTS[i], [b, t1] = INTRO_KNOTS[i + 1]
  const u = (p - a) / (b - a)
  return (t1 - t0) * 6 * u * (1 - u) / (b - a)
}

/** Physical time slows after the first separation; the lens retains openingTimeAt.
 * A small amount of travel during the hold keeps the shards suspended rather than
 * stopping the scroll. Pure coordinates also retrace exactly when scrolling back.
 */
export function breakthroughTimeAt(cameraTime: number): number {
  const keys = [[0, 0], [.84, .84], [.86, .858], [.93, .864], [1, 1]] as const
  const t = Math.max(0, Math.min(1, cameraTime))
  if (t <= .84) return t
  let i = 1
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++
  const [a, x] = keys[i], [b, y] = keys[i + 1]
  const u = (t - a) / (b - a)
  return x + (y - x) * u * u * (3 - 2 * u)
}

/**
 * T6-A: private subject clock for the shatter, keyed on canonical progress. The camera keeps
 * openingTimeAt; only the shards, wrench rise and later electrical tail use this time. Knots are
 * [progress, intro t] on a monotone cubic Hermite (weighted harmonic tangents, zero end slopes):
 * impact .42-.43008 (event 0 -> .375), hold .43008-.44212 (event .375 -> .395), release to .46.
 * The release knot at .4465 keeps the post-shatter glow fade and lamp return within .003 progress
 * of their pre-T6 positions (measured at t = .94, .96, .99 by inverting both clocks).
 * Authored against the x3 'shatter' pacing span, so the hold covers ~2.3 native viewports.
 */
export const SHATTER_SUBJECT_KNOTS: readonly (readonly [number, number])[] = Object.freeze([
  Object.freeze([0.42, 0.84] as const),
  Object.freeze([0.42685, 0.852] as const),
  Object.freeze([0.43008, 0.855] as const),
  Object.freeze([0.452, 0.855 + (openingTimeAt(0.452) - openingTimeAt(0.43008)) * BULLET_TIME_RATE] as const),
  Object.freeze([0.456, 0.89] as const),
  Object.freeze([0.46, 1] as const),
])

function shatterTangent(index: number): number {
  const k = SHATTER_SUBJECT_KNOTS
  if (index === 2 || index === 3) return openingRateAt(k[index][0]) * BULLET_TIME_RATE
  if (index === 0 || index === k.length - 1) return 0
  const h0 = k[index][0] - k[index - 1][0], h1 = k[index + 1][0] - k[index][0]
  const d0 = (k[index][1] - k[index - 1][1]) / h0, d1 = (k[index + 1][1] - k[index][1]) / h1
  if (d0 <= 0 || d1 <= 0) return 0
  const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0
  return (w0 + w1) / (w0 / d0 + w1 / d1)
}

/**
 * Owner 2026-10-22: the model must keep travelling through the 360 deg bullet-time orbit. The subject clock runs at
 * 10% there, which left the wrench still below the sheet plane when the orbit ended. The wrench's POSE time (only the
 * lift; the shards and electrical tail keep the subject clock) is floored by a ramp that reaches
 * `BULLET_TIME_RISE_PAST_CROSSING` beyond the pose time at which the lowest vertex clears the sheet, by the end of
 * the orbit, and then holds until the natural release overtakes it. Max of two monotone curves stays monotone, and the
 * ramp starts at the natural pose of the first orbit frame, so there is no jump.
 */
export const BULLET_TIME_RISE_PAST_CROSSING = 0.06
const ORBIT_FIRST_PROGRESS = 0.43008
const ORBIT_LAST_PROGRESS = 0.452

export function bulletTimeRiseFloor(progress: number, crossing: number): number {
  if (progress <= ORBIT_FIRST_PROGRESS) return 0
  const start = drawingIntroState(breakthroughSubjectTimeAt(ORBIT_FIRST_PROGRESS) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).poseT
  const end = Math.min(1, Math.max(start, crossing + BULLET_TIME_RISE_PAST_CROSSING))
  const u = Math.max(0, Math.min(1, (progress - ORBIT_FIRST_PROGRESS) / (ORBIT_LAST_PROGRESS - ORBIT_FIRST_PROGRESS)))
  return start + (end - start) * u * u * (3 - 2 * u)
}

/** Pure in progress: identical to the shared opening clock through .42, no wall time or history. */
export function breakthroughSubjectTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Opening progress must be finite')
  // During the hold, use the unslowed opening clock as the normal reference;
  // the subject advances at exactly the shared 10% rate while the camera keeps
  // following canonical progress independently.
  if (progress >= 0.43008 && progress <= 0.452) {
    return 0.855 + (openingTimeAt(progress) - openingTimeAt(0.43008)) * BULLET_TIME_RATE
  }
  const k = SHATTER_SUBJECT_KNOTS
  if (progress <= k[0][0]) return breakthroughTimeAt(openingTimeAt(progress))
  if (progress >= k[k.length - 1][0]) return k[k.length - 1][1]
  let i = 0
  while (i < k.length - 2 && progress >= k[i + 1][0]) i++
  const [a, ta] = k[i], [b, tb] = k[i + 1]
  const h = b - a, u = (progress - a) / h, u2 = u * u, u3 = u2 * u
  const value = (2 * u3 - 3 * u2 + 1) * ta + (u3 - 2 * u2 + u) * h * shatterTangent(i)
    + (-2 * u3 + 3 * u2) * tb + (u3 - u2) * h * shatterTangent(i + 1)
  return Math.max(ta, Math.min(tb, value))
}

function applyPrivateLampTiming(state: IntroState, finalInkT: number, crossing: number): void {
  if (finalInkT >= INTRO_PHASES.flickerStart) return
  if (state.t < finalInkT) {
    state.lampPower = 1
  } else if (state.t < INTRO_PHASES.blackoutStart) {
    const mapped = INTRO_PHASES.flickerStart
      + (state.t - finalInkT) * (INTRO_PHASES.blackoutStart - INTRO_PHASES.flickerStart)
        / (INTRO_PHASES.blackoutStart - finalInkT)
    state.lampPower = drawingIntroState(mapped * DRAWING_INTRO_WINDOW.releaseEnd, crossing).lampPower
  }
  state.blackout = state.lampPower <= 0.03 ? 1 : 0
  state.illumination = state.lampPower * state.pbr
}

export function sampleOpening(progress: number, crossing = 0.9, finalInkT = DEFAULT_FINAL_INK_T): IntroState {
  if (!Number.isFinite(finalInkT) || finalInkT < 0 || finalInkT > 1) {
    throw new RangeError('Final ink time must be finite in [0, 1]')
  }
  const state = drawingIntroState(breakthroughSubjectTimeAt(progress) * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
  state.poseT = Math.max(state.poseT, bulletTimeRiseFloor(progress, crossing))
  applyPrivateLampTiming(state, finalInkT, crossing)
  const electrical = samplePrivateElectricalScore(state.t)
  state.pulseHead = electrical.outline
  state.crackGrowth = electrical.branch
  state.sparkAnticipation = electrical.anticipation
  state.crackWeb = smooth01((state.t - PRIVATE_WEB_START_T) / 0.010) * (1 - state.fracture)
  state.crackGlow = state.t < PRIVATE_SPARK_START_T ? 0 : state.t <= INTRO_PHASES.pulseEnd
    ? smooth01((state.t - PRIVATE_SPARK_START_T) / 0.006)
    : (0.65 + 0.35 * state.pressure) * (1 - 0.78 * state.fracture) * (1 - smooth01((state.t - 0.94) / 0.05))
  state.pulse = state.t >= PRIVATE_SPARK_START_T && state.t <= PRIVATE_WEB_COMPLETE_T ? 1 : 0
  return state
}

/** Page-owned cache: a newly solved bake must invalidate a stationary frame. */
export function createOpeningSampler() {
  let lastProgress = NaN, lastCrossing = NaN, lastFinalInkT = NaN
  let result: IntroState | null = null
  return (progress: number, crossing = 0.9, finalInkT = DEFAULT_FINAL_INK_T): IntroState => {
    if (result === null || progress !== lastProgress || crossing !== lastCrossing || finalInkT !== lastFinalInkT) {
      const next = sampleOpening(progress, crossing, finalInkT)
      lastProgress = progress; lastCrossing = crossing; lastFinalInkT = finalInkT; result = next
    }
    return result
  }
}
