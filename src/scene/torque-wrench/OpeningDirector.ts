import {
  DRAWING_INTRO_WINDOW,
  drawingIntroState,
  INTRO_PHASES,
  type IntroState,
} from '../drawing/introTimeline'
import { sheetReveal } from '../drawing/sheetCamera'
import { GROUP_COUNT } from '../drawing/sheet/ink'
import { BULLET_TIME_SHOT_SPECS } from './bulletTime'
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
 * openingTimeAt; only the shards, wrench rise and later electrical tail use this time.
 *
 * Physical-rate contract. Let t_open(p) = openingTimeAt(p) be the un-dilated reference and
 * rho(p) = dT_subj/dt_open the speed ratio. The clock is the exact integral
 *   T_subj(p) = T(.42) + integral rho(q) * t_open'(q) dq,
 * so the ratio itself is what is authored, and the opening clock's own smoothstep easing is
 * compensated automatically instead of being stacked under the ratio:
 *  - entry knee [.42, plateau start]: rho = 1 - (1 - rate) * s(k), s(k) = 3k^2 - 2k^3, k the
 *    knee fraction. rho is 1 at .42 (continuous with the unslowed clock to the left), C1, and
 *    reaches the shared rate with zero slope. The integrand is a degree-5 polynomial on each
 *    opening-knot span, so 3-point Gauss-Legendre is exact there (no sampling error, pure in p).
 *  - plateau [plateauWindow]: rho = rate exactly (area-corrected: T advances rate * dt_open).
 *  - release (plateau end, .46]: the area the plateau withheld is repaid through the approved
 *    airborne-hold knot (.456, .89) and the .46 endpoint (t = 1, zero slope). The first span starts at the
 *    plateau's own value and velocity (rate * t_open'), so the join is C1; interior tangents are monotone
 *    weighted-harmonic. The release is entered only after the event band (t < .88) has been crossed slowly.
 * The release still finishes by .46 and the glow fade / lamp return stay within .01 progress of
 * their pre-T6 positions (OpeningDirector.test).
 */
const [ORBIT_FIRST_PROGRESS, ORBIT_LAST_PROGRESS] = BULLET_TIME_SHOT_SPECS.shatter.plateauWindow
const SHATTER_RATE = BULLET_TIME_SHOT_SPECS.shatter.rate
const SHATTER_ENTRY_START = 0.42
const SHATTER_RELEASE_END = 0.46
const SHATTER_ENTRY_TIME = 0.84
const smoothstep3 = (k: number) => k * k * (3 - 2 * k)
/** rho on the entry knee, k in [0, 1]: 1 -> rate with zero slope at both ends. */
export function shatterEntryRatio(k: number): number {
  return 1 - (1 - SHATTER_RATE) * smoothstep3(Math.max(0, Math.min(1, k)))
}
const GL3_NODES = [-Math.sqrt(0.6), 0, Math.sqrt(0.6)] as const
const GL3_WEIGHTS = [5 / 9, 8 / 9, 5 / 9] as const
/** Exact integral of rho(q) * t_open'(q) over [a, b]; exact because t_open' is quadratic per knot span. */
function integrateOpeningRate(a: number, b: number, ratio: (q: number) => number): number {
  let total = 0
  let lo = a
  for (let i = 1; i < INTRO_KNOTS.length && lo < b; i++) {
    const hi = Math.min(b, INTRO_KNOTS[i][0])
    if (hi <= lo) continue
    const mid = (lo + hi) / 2, half = (hi - lo) / 2
    for (let n = 0; n < 3; n++) {
      const q = mid + half * GL3_NODES[n]
      total += half * GL3_WEIGHTS[n] * ratio(q) * openingRateAt(q)
    }
    lo = hi
  }
  return total
}
const entryRatioAt = (q: number) => shatterEntryRatio((q - SHATTER_ENTRY_START) / (ORBIT_FIRST_PROGRESS - SHATTER_ENTRY_START))
const SHATTER_PLATEAU_TIME = SHATTER_ENTRY_TIME + integrateOpeningRate(SHATTER_ENTRY_START, ORBIT_FIRST_PROGRESS, entryRatioAt)
const SHATTER_PLATEAU_END_TIME = SHATTER_PLATEAU_TIME
  + (openingTimeAt(ORBIT_LAST_PROGRESS) - openingTimeAt(ORBIT_FIRST_PROGRESS)) * SHATTER_RATE
export const SHATTER_SUBJECT_KNOTS: readonly (readonly [number, number])[] = Object.freeze([
  Object.freeze([SHATTER_ENTRY_START, SHATTER_ENTRY_TIME] as const),
  Object.freeze([ORBIT_FIRST_PROGRESS, SHATTER_PLATEAU_TIME] as const),
  Object.freeze([ORBIT_LAST_PROGRESS, SHATTER_PLATEAU_END_TIME] as const),
  Object.freeze([0.456, 0.89] as const),
  Object.freeze([SHATTER_RELEASE_END, 1] as const),
])

function shatterReleaseTangent(index: number): number {
  const k = SHATTER_SUBJECT_KNOTS
  if (index === 2) return openingRateAt(k[2][0]) * SHATTER_RATE
  if (index === k.length - 1) return 0
  const h0 = k[index][0] - k[index - 1][0], h1 = k[index + 1][0] - k[index][0]
  const d0 = (k[index][1] - k[index - 1][1]) / h0, d1 = (k[index + 1][1] - k[index][1]) / h1
  if (d0 <= 0 || d1 <= 0) return 0
  const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0
  return (w0 + w1) / (w0 / d0 + w1 / d1)
}

/**
 * Owner 2026-10-22: the model must keep travelling through the 360 deg bullet-time orbit. The subject clock runs at
 * 10% there, which left the wrench still below the sheet plane when the orbit ended. The wrench's POSE time (only the
 * lift; the shards and electrical tail keep the subject clock) follows a C1 monotone curve that reaches
 * `BULLET_TIME_RISE_PAST_CROSSING` beyond the pose time at which the lowest vertex clears the sheet, by the end of
 * the orbit, then continues to the full endpoint at .46. A single curve avoids both the old floor's
 * plateau and the velocity discontinuities caused by taking a max with the natural subject pose.
 */
export const BULLET_TIME_RISE_PAST_CROSSING = 0.06

function riseTangent(a: number, b: number, ha: number, hb: number): number {
  return a > 0 && b > 0 ? 3 * (ha + hb) / ((ha + 2 * hb) / a + (2 * ha + hb) / b) : 0
}

function riseSpan(progress: number, a: number, b: number, y0: number, y1: number, m0: number, m1: number): number {
  const h = b - a, u = (progress - a) / h, u2 = u * u, u3 = u2 * u
  return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m0
    + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m1
}

export function bulletTimeRiseFloor(progress: number, crossing: number): number {
  if (progress <= 0.42) return 0
  if (progress >= 0.46) return 1
  const start = drawingIntroState(breakthroughSubjectTimeAt(ORBIT_FIRST_PROGRESS) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).poseT
  const end = Math.min(1, Math.max(start, crossing + BULLET_TIME_RISE_PAST_CROSSING))
  // The solved crossings (.6-.9) leave positive travel on every span. Harmonic
  // tangents preserve monotonicity while sharing velocity across both orbit joins.
  const h0 = ORBIT_FIRST_PROGRESS - 0.42, h1 = ORBIT_LAST_PROGRESS - ORBIT_FIRST_PROGRESS, h2 = 0.46 - ORBIT_LAST_PROGRESS
  const d0 = (start - 0.5) / h0, d1 = (end - start) / h1, d2 = (1 - end) / h2
  const m1 = riseTangent(d0, d1, h0, h1), m2 = riseTangent(d1, d2, h1, h2)
  if (progress < ORBIT_FIRST_PROGRESS) return riseSpan(progress, 0.42, ORBIT_FIRST_PROGRESS, 0.5, start, 0, m1)
  if (progress < ORBIT_LAST_PROGRESS) return riseSpan(progress, ORBIT_FIRST_PROGRESS, ORBIT_LAST_PROGRESS, start, end, m1, m2)
  return riseSpan(progress, ORBIT_LAST_PROGRESS, 0.46, end, 1, m2, 0)
}

/** Pure in progress: identical to the shared opening clock through .42, no wall time or history. */
export function breakthroughSubjectTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Opening progress must be finite')
  if (progress <= SHATTER_ENTRY_START) return breakthroughTimeAt(openingTimeAt(progress))
  if (progress < ORBIT_FIRST_PROGRESS) {
    return SHATTER_ENTRY_TIME + integrateOpeningRate(SHATTER_ENTRY_START, progress, entryRatioAt)
  }
  // Plateau: the subject advances at exactly the shared rate of the unslowed opening clock,
  // so physical displacement is rate * the un-dilated displacement (no extra ease-stop stacked on it).
  if (progress <= ORBIT_LAST_PROGRESS) {
    return SHATTER_PLATEAU_TIME + (openingTimeAt(progress) - openingTimeAt(ORBIT_FIRST_PROGRESS)) * SHATTER_RATE
  }
  if (progress >= SHATTER_RELEASE_END) return 1
  const k = SHATTER_SUBJECT_KNOTS
  const i = progress < k[3][0] ? 2 : 3
  const [x0, y0] = k[i], [x1, y1] = k[i + 1]
  const h = x1 - x0, u = (progress - x0) / h, u2 = u * u, u3 = u2 * u
  const value = (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * shatterReleaseTangent(i)
    + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * shatterReleaseTangent(i + 1)
  return Math.max(y0, Math.min(y1, value))
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
  if (progress > 0.42) state.poseT = bulletTimeRiseFloor(progress, crossing)
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
