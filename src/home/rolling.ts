// Rolling phrase timing (pure). The phrase changes every STEP_MS and stops after ROUNDS full
// cycles on the first phrase, so the motion does not run forever (WCAG 2.2.2).
export const STEP_MS = 2600
export const ROUNDS = 2

/** Index shown after `ticks` steps, and whether rotation has finished. */
export function rollingIndex(ticks: number, count: number, rounds = ROUNDS): { index: number; done: boolean } {
  if (count <= 1) return { index: 0, done: true }
  const last = rounds * count
  if (ticks >= last) return { index: 0, done: true }
  return { index: ticks % count, done: false }
}
