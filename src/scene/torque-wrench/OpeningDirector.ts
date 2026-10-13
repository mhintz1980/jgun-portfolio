import { DRAWING_INTRO_WINDOW, drawingIntroState, type IntroState } from '../drawing/introTimeline'

/** Private semantic coordinates map to the unchanged lower-level physical channels. */
const INTRO_KNOTS = [
  [0, 0], [0.265, 0.38], [0.32, 0.45], [0.36, 0.66],
  [0.395, 0.79], [0.42, 0.84], [0.435, 0.9], [0.46, 1],
] as const

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

export function sampleOpening(progress: number, crossing = 0.9): IntroState {
  return drawingIntroState(openingTimeAt(progress) * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
}
