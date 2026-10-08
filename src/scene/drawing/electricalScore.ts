// Local copies: introTimeline imports this module, so importing back would create a cycle.
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))
const smooth01 = (x: number): number => { const t = clamp01(x); return t * t * (3 - 2 * t) }

/**
 * JG-035 owner revision O1 (2026-10-07) — the electrical outline as a crack that bursts,
 * pauses and hastens, then proliferates across the enclosed profile with the same rhythm.
 *
 * Pure score: `sampleElectrical(t, out)` is a function of intro-normalised scroll time only.
 * No accumulated clock, no per-frame randomness — forward, reverse and direct seeks sample the
 * identical state at identical scroll coordinates.
 *
 * Calibration domain. The owner described timings in seconds ("10% of the perimeter traversed
 * in 0.2 seconds, then pause for 0.2 seconds ..."). Scroll has no wall-clock, so the score is
 * authored in a *calibration sweep*: a linear 100-second pass through the whole document.
 * Because the trace window sits past the close-reading remap (t > .66, where raw = t * .5), the
 * mapping is direct: `elapsed = 100 * (t * INTRO_SCROLL_SHARE - OUTLINE_START_RAW)`. Actual
 * visitors set their own scroll speed; the owner's seconds hold in the calibrated capture domain.
 */

/** Calibration sweep length: the document is scrolled linearly over this many seconds. */
export const CALIBRATION_SWEEP_SECONDS = 100
/** Raw document fraction where the first outline burst begins (intro t .765). */
export const OUTLINE_START_RAW = 0.3825
/** Intro t of the first burst and of the end of the outline completion. */
export const OUTLINE_START_T = 0.765
export const OUTLINE_BURST_SECONDS = 1.25

/** One burst: perimeter completion travels `from` -> `to` between `t0` and `t1` calibration seconds. */
export interface BurstKey { t0: number; t1: number; from: number; to: number }

/**
 * Owner-specified rhythm: fast burst, brief pause, farther burst, shorter pause ... until the
 * pauses almost vanish. Plateaus are exact (zero slope, equal values); edges are smoothed.
 */
export const BURST_KEYS: readonly BurstKey[] = [
  { t0: 0, t1: 0.2, from: 0, to: 0.1 }, // first burst  10% in .20 s
  { t0: 0.4, t1: 0.55, from: 0.1, to: 0.25 }, // after a .20 s hold
  { t0: 0.7, t1: 0.85, from: 0.25, to: 0.45 }, // after .15 s
  { t0: 0.93, t1: 1.05, from: 0.45, to: 0.7 }, // after .08 s
  { t0: 1.09, t1: 1.16, from: 0.7, to: 0.85 }, // after .04 s
  { t0: 1.18, t1: 1.25, from: 0.85, to: 1 }, // after .02 s, completion
]

/** Completion at which interior branching begins (owner: "as the profile gets close to completing"). */
export const BRANCH_START_COMPLETION = 0.85
/** Calibration second at which the outline first reaches `BRANCH_START_COMPLETION`. */
export const BRANCH_START_SECONDS = BURST_KEYS[4].t1

/** Perimeter completion 0..1 at calibration second `elapsed` (burst/hold pattern, C1 at every join). */
export function burstProgress(elapsed: number): number {
  if (elapsed <= 0) return 0
  let value = 0
  for (const key of BURST_KEYS) {
    if (elapsed >= key.t1) { value = key.to; continue }
    if (elapsed > key.t0) return key.from + (key.to - key.from) * smooth01((elapsed - key.t0) / (key.t1 - key.t0))
    return value
  }
  return value
}

/** Calibration seconds elapsed for intro-normalised time `t` (unclamped; t is past the remap). */
export const electricalElapsed = (t: number): number => CALIBRATION_SWEEP_SECONDS * (t * 0.5 - OUTLINE_START_RAW)

/** Intro t at which a calibration second occurs. Inverse of `electricalElapsed`. */
export const electricalTimeAt = (seconds: number): number => 2 * (seconds / CALIBRATION_SWEEP_SECONDS + OUTLINE_START_RAW)

export const BRANCH_START_T = electricalTimeAt(BRANCH_START_SECONDS)
export const BRANCH_END_T = electricalTimeAt(BRANCH_START_SECONDS + OUTLINE_BURST_SECONDS)
export const ELECTRICAL_END_T = electricalTimeAt(OUTLINE_BURST_SECONDS)

export interface ElectricalSample {
  /** Perimeter completion 0..1 (drives the trace head). */
  outline: number
  /** Interior branch extent 0..1 (drives the crack-web growth threshold). */
  branch: number
  /** 0..1 build of the non-advancing pre-trace spark; zero once the first burst starts. */
  anticipation: number
  /** Calibration seconds into the outline trace, clamped to [0, 1.25]. */
  elapsed: number
  /** Calibration seconds into the interior branching, clamped to [0, 1.25]. */
  branchElapsed: number
}

export const newElectricalSample = (): ElectricalSample => ({ outline: 0, branch: 0, anticipation: 0, elapsed: 0, branchElapsed: 0 })

/**
 * @param t intro-normalised scroll time
 * @param anticipationStart intro t where the dark-hold spark begins to build (the profile-slit window)
 */
export function sampleElectrical(t: number, out: ElectricalSample, anticipationStart = 0.66): ElectricalSample {
  const raw = electricalElapsed(t)
  out.elapsed = Math.max(0, Math.min(OUTLINE_BURST_SECONDS, raw))
  out.outline = burstProgress(raw)
  const branchRaw = raw - BRANCH_START_SECONDS
  out.branchElapsed = Math.max(0, Math.min(OUTLINE_BURST_SECONDS, branchRaw))
  out.branch = burstProgress(branchRaw)
  out.anticipation = t < OUTLINE_START_T ? smooth01((t - anticipationStart) / (OUTLINE_START_T - anticipationStart)) : 0
  return out
}

/** Linear 0..1 helper for consumers that need the unclamped branch window position. */
export const branchWindow = (t: number): number => clamp01((t - BRANCH_START_T) / (BRANCH_END_T - BRANCH_START_T))
