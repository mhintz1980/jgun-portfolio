import type { WrenchMechanicsFrame } from '../rig/wrenchMechanics'

const smooth = (value: number) => {
  const u = Math.max(0, Math.min(1, value))
  return u * u * (3 - 2 * u)
}

export interface MechanismSample extends WrenchMechanicsFrame {
  ghostOpacity: number
}

/**
 * T5 (interpretation, not owner acceptance): the ring study owns [.46,.505] and the whole former
 * mechanism [.46,.69] is translated by +MECHANISM_TRANSLATION into [.505,.735]. Everything at
 * p >= .735 (shaft, close) keeps its absolute coordinates.
 */
export const RING_WINDOW_START = 0.46
export const RING_WINDOW_END = 0.505
export const MECHANISM_TRANSLATION = RING_WINDOW_END - RING_WINDOW_START

/**
 * C2 sequence switch: owner selected 'fullAfter' on 2026-10-19.
 * Sequence selection is separate from served-camera proof and visual acceptance.
 * - 'preview12': the ring nudges 12 deg (shift S0 = 0.10, 0.9525 mm, exactly 12 of 120 deg) before the
 *   study, holds S0 through it, then continues S0 -> 1 from .520.
 * - 'fullAfter': shift stays 0 through the study, then 0 -> 1 over .520-.560.
 * The 120 deg / 9.525 mm law is unchanged; S0 is never increased.
 */
export type C2Sequence = 'preview12' | 'fullAfter'
export const C2_SEQUENCE: C2Sequence = 'fullAfter'
export const C2_PREVIEW_SHIFT = 0.1
/** Nudge 0 -> S0 happens over [.4655,.469]; the plateau then spans [.469,.505]. */
export const C2_NUDGE_START = 0.4655
export const C2_NUDGE_END = 0.469
/** Study anchor, inside the S0 plateau and independent of the entry progress. */
export const RING_ANCHOR_PROGRESS = 0.48

/** Baseline (pre-T5) shift/explode/gear law, evaluated at the translated coordinate q = p - W. */
function sampleBaseline(q: number, out: MechanismSample): void {
  // Owner correction (2026-10-21): the shift completes by .545 so the OSHA
  // Red stripe is fully uncovered when the camera reaches the red view, and
  // the camera then holds the handle-side framing through .560.
  out.shift = smooth((q - (0.520 - MECHANISM_TRANSLATION)) / 0.025)
  out.explode = smooth((q - 0.575) / 0.075)
  out.gearAngle = Math.PI * 8 * smooth((q - 0.52) / 0.17)
  // Owner correction (2026-10-26): housing stays solid through explosion and return.
  out.ghostOpacity = 1
}

/** Continuous channels spanning beats; canonical sampling has no idle clock. */
export function sampleMechanism(
  progress: number,
  out: MechanismSample,
  sequence: C2Sequence = C2_SEQUENCE,
): MechanismSample {
  if (!Number.isFinite(progress)) throw new RangeError('Mechanism progress must be finite')
  const p = Math.max(0, Math.min(1, progress))
  const close = 1 - smooth((p - 0.94) / 0.04)
  sampleBaseline(p - MECHANISM_TRANSLATION, out)
  if (sequence === 'preview12') {
    const s0 = C2_PREVIEW_SHIFT
    const nudge = smooth((p - C2_NUDGE_START) / (C2_NUDGE_END - C2_NUDGE_START))
    // The remaining S0 -> 1 traverse starts only after the camera settles at .520.
    out.shift = s0 * nudge + (1 - s0) * out.shift
  }
  out.shift *= close
  out.explode *= close
  out.gearAngle *= close
  out.idle = 0
  return out
}
