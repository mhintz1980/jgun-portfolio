// Project review stack (pure). Ported from the peel-through stack on Mark's earlier site: as the
// section scrolls past, each card in turn lifts up and tips away, revealing the one behind it.
// The last card stays, so the stack ends on an image instead of an empty frame.

export const INTRO = 0.08
export const OUTRO = 0.1
export const EXIT_WINDOW = 0.86

export interface CardState {
  /** 0 = in place, 1 = fully gone. */
  exit: number
  /** How many cards are still in front of this one (fractional while one is leaving). */
  depth: number
  opacity: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function cardState(progress: number, index: number, total: number): CardState {
  const leaving = Math.max(total - 1, 1)
  const slot = (1 - INTRO - OUTRO) / leaving
  const completed = Math.max(0, (progress - INTRO) / slot)
  const depth = Math.max(0, index - completed)
  if (index >= total - 1) return { exit: 0, depth, opacity: 1 }
  const start = INTRO + index * slot
  const end = start + slot * EXIT_WINDOW
  const exit = clamp01((progress - start) / Math.max(end - start, 1e-4))
  return { exit, depth, opacity: progress >= end ? 0 : clamp01(1 - exit * 1.15) }
}

const STEP_X = 22
const STEP_Y = 36
const STEP_Z = -70
const STEP_SCALE = 0.06
const STEP_ROTATE = -2

/** CSS transform for a card; `compact` shrinks the offsets for phones. */
export function cardTransform(state: CardState, compact = false): string {
  const k = compact ? 0.55 : 1
  const d = Math.min(state.depth, 4)
  const scale = 1 - d * STEP_SCALE + state.exit * 0.025
  return [
    `translate3d(${(d * STEP_X * k).toFixed(2)}px, calc(${(d * STEP_Y * k).toFixed(2)}px + ${(-135 * state.exit).toFixed(2)}%), ${(d * STEP_Z).toFixed(2)}px)`,
    `rotateX(${(-42 * state.exit).toFixed(2)}deg)`,
    `rotate(${(d * STEP_ROTATE).toFixed(2)}deg)`,
    `scale(${scale.toFixed(4)})`,
  ].join(' ')
}

/** Section progress 0..1 from its top edge and height (the sticky stage is one viewport tall). */
export function sectionProgress(top: number, height: number, viewport: number): number {
  const travel = height - viewport
  if (travel <= 0) return top <= 0 ? 1 : 0
  return clamp01(-top / travel)
}

/** Scroll length of a stack section, in viewport heights: one stage plus a beat per card. */
export function sectionHeightVh(total: number, perCardVh = 60): number {
  return 100 + Math.max(total - 1, 0) * perCardVh + 40
}
