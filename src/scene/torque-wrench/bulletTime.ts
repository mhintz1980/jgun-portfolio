/**
 * Canonical Bullet-Time Contract (Doc 39 §7 + Doc 44 Items 2 & 4).
 *
 * Single source of truth for deterministic scroll-driven time dilation across
 * OpeningDirector, RingInspection, InspectionDirector, and Playwright verifiers.
 */

/** Default subject-to-camera speed ratio during a bullet-time plateau (10% normal speed). */
export const BULLET_TIME_RATE = 0.1

/** Contact camera seconds and shoulder tangents, authored together with the
 * physical shaper clock so full-speed knees fit the preserved exit pose. */
export const SHAPER_CAMERA_CLOCK = Object.freeze({ start: 7.5, end: 9.4, entryRate: 30, exitRate: 10 })

export interface BulletTimeShotSpec {
  readonly id: 'shatter' | 'ringSwitch' | 'shaperContact' | 'hobContact' | 'stage1Ignition'
  /** Progress window in the named director's coordinates (not wall time or native scroll distance). */
  readonly window: readonly [number, number]
  /** Shaft-study progress is native narrative progress + 0.115; other shots use narrative progress directly. */
  readonly progressSpace: 'narrative' | 'shaft-study'
  /** Optional physical-rate plateau when the camera begins its sweep before subject slowdown. */
  readonly plateauWindow?: readonly [number, number]
  /** Ring display seconds; distinct from narrative progress. */
  readonly displayWindow?: readonly [number, number]
  /** Ratio of subject speed to camera time (default: BULLET_TIME_RATE = 0.10). */
  readonly rate: number
  /**
   * Optional total angular displacement cap (in revolutions) across the shot window.
   * Used when 10% of high-RPM tooling would still blur fine teeth (e.g., Ring Switch knurling die).
   */
  readonly maxRevolutions?: number
  /** Minimum required camera azimuthal sweep (deg) across the window to guarantee 3D parallax. */
  readonly minCameraSweepDeg: number
  /** Authored sweep, including headroom where reachable CSS pixels trim endpoints. */
  readonly cameraSweepDeg: number
  /** Fractional width of the C1 speed-ramp entry/exit knees (each in [0.05, 0.25]). */
  readonly rampFraction: number
}

export const BULLET_TIME_SHOT_SPECS = Object.freeze({
  shatter: Object.freeze({
    id: 'shatter',
    window: Object.freeze([0.43, 0.452] as const),
    progressSpace: 'narrative',
    plateauWindow: Object.freeze([0.43008, 0.452] as const),
    rate: BULLET_TIME_RATE,
    minCameraSweepDeg: 355,
    cameraSweepDeg: 360,
    rampFraction: 0.12,
  }),
  ringSwitch: Object.freeze({
    id: 'ringSwitch',
    window: Object.freeze([0.4768, 0.485] as const),
    progressSpace: 'narrative',
    displayWindow: Object.freeze([8, 18] as const),
    rate: BULLET_TIME_RATE,
    maxRevolutions: 0.15, // Doc 44 Item 4: 54 deg (10-20% of one die rev) so knurling teeth stay sharp
    minCameraSweepDeg: 45,
    cameraSweepDeg: 60,
    rampFraction: 0.15,
  }),
  shaperContact: Object.freeze({
    id: 'shaperContact',
    window: Object.freeze([0.8, 0.832] as const),
    progressSpace: 'shaft-study',
    rate: BULLET_TIME_RATE,
    minCameraSweepDeg: 60,
    cameraSweepDeg: 60.1,
    rampFraction: 0.15,
  }),
  hobContact: Object.freeze({
    id: 'hobContact',
    window: Object.freeze([0.89116, 0.898881] as const),
    progressSpace: 'shaft-study',
    rate: BULLET_TIME_RATE,
    minCameraSweepDeg: 60,
    cameraSweepDeg: 60.1,
    rampFraction: 0.15,
  }),
  stage1Ignition: Object.freeze({
    id: 'stage1Ignition',
    window: Object.freeze([0.922, 0.930] as const),
    progressSpace: 'shaft-study',
    rate: BULLET_TIME_RATE,
    maxRevolutions: .2, // Input sun: two of its ten tooth pitches over the complete macro.
    minCameraSweepDeg: 165,
    cameraSweepDeg: 165.1,
    rampFraction: 0.15,
  }),
}) satisfies Readonly<Record<BulletTimeShotSpec['id'], BulletTimeShotSpec>>

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u)

/**
 * Evaluates the instantaneous subject-to-camera rate r(u) in [rate, 1.0] across normalized
 * shot progress u in [0, 1], with C1-continuous cubic Hermite entry and exit knees.
 *
 * - At u = 0 and u = 1: r(u) = 1.0 (full normal speed contrast at boundaries).
 * - Across [ramp, 1 - ramp]: r(u) = rate (exact flat-top bullet-time plateau).
 */
export function sampleBulletTimeRate(
  u: number,
  rate: number = BULLET_TIME_RATE,
  ramp: number = 0.15,
): number {
  const c = clamp01(u)
  const r = Math.max(1e-4, Math.min(0.45, ramp))
  if (c < r) {
    const k = c / r
    const s = k * k * (3 - 2 * k)
    return 1 + (rate - 1) * s
  }
  if (c > 1 - r) {
    const k = (1 - c) / r
    const s = k * k * (3 - 2 * k)
    return 1 + (rate - 1) * s
  }
  return rate
}

/**
 * Closed-form integral of sampleBulletTimeRate(u, rate, ramp), normalized to [0, 1].
 * Pure, history-independent, and strictly monotonic for forward/reverse scrubbing.
 * Its derivative is rate(u) / totalArea, not rate(u). A physical subject clock
 * must multiply this normalized warp by camera duration * totalArea, where
 * totalArea = rate + clamp(ramp, 1e-4, .45) * (1 - rate). Existing physically
 * calibrated scene clocks retain their own C1 shoulders until separately authored.
 */
export function sampleBulletTimeWarp(
  u: number,
  rate: number = BULLET_TIME_RATE,
  ramp: number = 0.15,
): number {
  const c = clamp01(u)
  if (c <= 0) return 0
  if (c >= 1) return 1

  const r = Math.max(1e-4, Math.min(0.45, ramp))
  // Integral of smoothstep s(k) = 3k^2 - 2k^3 on [0, k] is k^3 - 0.5*k^4 (equals 0.5 at k = 1)
  const kneeIntegral = (k: number): number => {
    const k2 = k * k
    return r * (k + (rate - 1) * (k2 * k - 0.5 * k2 * k2))
  }

  const singleKneeTotal = r * 0.5 * (1 + rate)
  const plateauTotal = (1 - 2 * r) * rate
  const totalArea = 2 * singleKneeTotal + plateauTotal

  let area: number
  if (c < r) {
    area = kneeIntegral(c / r)
  } else if (c <= 1 - r) {
    area = singleKneeTotal + (c - r) * rate
  } else {
    const rem = (1 - c) / r
    area = totalArea - kneeIntegral(rem)
  }

  return area / totalArea
}
