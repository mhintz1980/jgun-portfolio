import {
  DRAWING_INTRO_WINDOW,
  drawingIntroState,
  INTRO_PHASES,
  type IntroState,
} from '../drawing/introTimeline'
import { sheetReveal } from '../drawing/sheetCamera'
import { GROUP_COUNT } from '../drawing/sheet/ink'

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
  const state = drawingIntroState(breakthroughTimeAt(openingTimeAt(progress)) * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
  applyPrivateLampTiming(state, finalInkT, crossing)
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
