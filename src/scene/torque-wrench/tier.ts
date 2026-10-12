// Tier helpers for the private torque page. The entry resolves the tier synchronously from the
// shared registry helper before first render; nothing narrative can import before that because
// the only narrative import path is cadGate's dynamic import.
import { type TierParam } from '../../shared/pages'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Reads prefers-reduced-motion defensively; a throwing matchMedia reads as no preference. */
export function readReducedMotion(): boolean {
  try {
    return Boolean(window.matchMedia(REDUCED_MOTION_QUERY).matches)
  } catch {
    return false
  }
}

/**
 * Mid-session reduced-motion changes may only step down to the poster floor; they never pull
 * narrative CAD back into a document. Returns the new tier, or null when nothing should change.
 */
export function downgradeForReducedMotion(current: TierParam, reducedMotion: boolean): TierParam | null {
  if (!reducedMotion || current === 'poster') return null
  return 'poster'
}
