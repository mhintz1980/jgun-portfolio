/**
 * JG-026 B1/B2 — intro pacing, phase map, and the retained CH.02 proxy shape.
 *
 * Two independent axes are defined here and they must not be confused:
 *
 *   1. RAW SCROLL (`s`)      — the browser's own scroll fraction, 0 at the top
 *                              of the document and 1 at `scrollHeight - innerHeight`.
 *   2. PACED PROGRESS (`p`)  — the axis every downstream window in this repo is
 *                              authored against (`CHAPTER_RANGES`, `PATH_SEGMENTS`,
 *                              `STAGE_TRANSITIONS`, `LCD_REVEAL_WINDOW`, the CameraRig
 *                              literals). The B1/B2 intro owns `p <= 0.120`; the rest
 *                              of the site owns `0.120 -> 1.000`.
 *
 * `pacedProgress()` is the only place the two axes meet. It lets the intro occupy a
 * much larger share of the *document* (JG-026 owner pacing ruling, 2026-09-05) without
 * moving a single downstream constant: the intro's 0.120 of progress is stretched over
 * `INTRO_SCROLL_SHARE` of the document, and the remaining 0.880 of progress is stretched
 * over the rest. Because the downstream piece stays linear, every downstream chapter
 * keeps its progress span exactly and only gains absolute scroll distance.
 */

/**
 * Share of raw document scroll spent inside the B1/B2 intro (owner pacing Lever B).
 * Was implicitly 0.120 — the intro consumed exactly the progress band it owned.
 *
 * Raised 0.40 -> 0.50 on 2026-10-01 against the owner's oryzo.ai (Lusion) pacing
 * reference. Measured on the live reference: the site is 56 viewports tall and a single
 * statement beat holds for 2.5-3 viewports, with individual held moments past 5. At 0.40
 * the lit recognition beat lasted 0.24 viewports — a flicker rather than a breath. The
 * extra share buys dwell inside the SAME progress band, so no downstream constant moves.
 */
export const INTRO_SCROLL_SHARE = 0.5

/**
 * Progress band the intro owns. `releaseEnd` is the handoff to the retained site
 * timeline; `heroEnd` closes the JGun station segment. Neither value moves with pacing.
 */
export const DRAWING_INTRO_WINDOW = { releaseEnd: 0.12, heroEnd: 0.525 } as const

/**
 * Fully inked, registered and still: shared by drawing, model and camera. Pinned to
 * `onboardEnd` so the reduced-motion park sits exactly where the camera settle completes,
 * at the head of the lit recognition hold and well before the first lamp failure.
 */
export const REDUCED_MOTION_INTRO_T = 0.38

/**
 * Width (in raw scroll) of the C1 blend that removes the slope step where the slow intro
 * meets the faster main timeline.
 *
 * The band sits AFTER `INTRO_SCROLL_SHARE`, not straddling it. That placement is load-bearing.
 * Straddling the share (the original construction) makes `pacedProgress` non-monotone once the
 * two slopes differ enough: the blend's residual term scales with `smooth01'(x)*(x-0.5)`, whose
 * minimum is -0.2071, so `dp/ds` goes negative whenever `mainSlope - introSlope > 4.829 *
 * introSlope`. At `INTRO_SCROLL_SHARE = 0.50` that ratio is 6.33, and `dp/ds` measured -0.0748
 * near raw 0.4823 -- progress rose to 0.1143733, fell to 0.1140288, then rose again. Non-monotone
 * progress means a small forward scroll can move the whole scene backwards, and it also breaks
 * the bisection inverse in `rawScrollFor`.
 *
 * Starting the band at the share removes the term entirely: with `h(x) = smooth01'(x)*x -
 * (1 - smooth01(x))` the minimum is `h(0) = -1`, so `dp/ds` bottoms out at exactly `introSlope`
 * (> 0) at the left edge and rises to `mainSlope` at the right edge. The blend is therefore
 * monotone for ANY slope ratio, and because `introLine(share) === mainLine(share) === releaseEnd`
 * the pinned identity `pacedProgress(INTRO_SCROLL_SHARE) === releaseEnd` still holds exactly.
 */
const HANDOFF_BLEND = 0.025

export const clamp01 = (x: number): number => Math.max(0, Math.min(1, x))
export const smooth01 = (x: number): number => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

const INTRO_SLOPE = DRAWING_INTRO_WINDOW.releaseEnd / INTRO_SCROLL_SHARE
const MAIN_SLOPE = (1 - DRAWING_INTRO_WINDOW.releaseEnd) / (1 - INTRO_SCROLL_SHARE)
const introLine = (s: number): number => INTRO_SLOPE * s
const mainLine = (s: number): number =>
  DRAWING_INTRO_WINDOW.releaseEnd + MAIN_SLOPE * (s - INTRO_SCROLL_SHARE)

/** Raw document scroll fraction -> the paced progress axis the whole site is authored on. */
export function pacedProgress(rawScroll: number): number {
  const s = clamp01(rawScroll)
  if (s <= INTRO_SCROLL_SHARE) return introLine(s)
  if (s >= INTRO_SCROLL_SHARE + HANDOFF_BLEND) return mainLine(s)
  // Band starts AT the share (see HANDOFF_BLEND). At x = 0 both lines equal releaseEnd, so the
  // pinned identity `pacedProgress(INTRO_SCROLL_SHARE) === releaseEnd` holds exactly; at x = 1
  // the weight reaches 1 and the main line is met exactly, so no downstream absolute distance
  // changes. The result stays between the two lines across the whole band, and dp/ds falls no
  // lower than introSlope (> 0), so the map is strictly monotone for any slope ratio.
  const x = (s - INTRO_SCROLL_SHARE) / HANDOFF_BLEND
  return mainLine(s) + (1 - smooth01(x)) * (introLine(s) - mainLine(s))
}

/**
 * Inverse of `pacedProgress`, used for deep links and for scroll-driven capture where a
 * probe knows the progress it wants and has to ask the browser for a scroll position.
 * Bisection rather than a closed form because the handoff blend has no analytic inverse;
 * 40 iterations resolve to below 1e-12 and it never runs inside the frame loop.
 */
export function rawScrollFor(progress: number): number {
  const target = clamp01(progress)
  let lo = 0
  let hi = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    if (pacedProgress(mid) > target) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/**
 * Phase boundaries inside the intro, expressed on the intro's own normalized axis
 * `t = p / 0.120`. Owner pacing ruling: the focus rack needs the least additional room,
 * the orbit/rise and the shockwave need the most, and a window is reserved between the
 * focus rack and the pulse for the opening/onboarding text (JG-026 Item 6) so adding it
 * later cannot re-window anything.
 */
export const INTRO_PHASES = {
  /** Focus rack: the opening close-up on the title block pulls into focus. */
  focusEnd: 0.05,
  /**
   * The drafting pass (JG-035): the camera glides across the sheet while it inks itself in,
   * ending square-on to the side elevation. Opening titles live in this window too.
   */
  onboardStart: 0.05,
  onboardEnd: 0.38,
  /**
   * Lit recognition hold (.38-.45): the registered drawing, fully inked, held long enough
   * to register before anything moves. At 0.50 share this is ~1.1 viewports; at the old
   * 0.40/.02 contract it was 0.24 and read as a glitch rather than a beat.
   */
  flickerStart: 0.45,
  blackoutStart: 0.58,
  /**
   * Ordered excitation traced along the primary elevation's profile. This window does
   * not own the sheet-camera settle; registration remains a separate boundary.
   */
  pulseStart: 0.66,
  pulseEnd: 0.79,
  /** Paper swells in blue trace light; studio light returns after the doorway beat. */
  bulgeStart: 0.79,
  lampReturnStart: 0.96,
  lampReturnEnd: 1.0,
  /** Exact print/model registration ends as the dark profile trace completes. */
  registrationEnd: 0.79,
  /** Rupture reveals the already pushing, fully lit model. */
  fractureStart: 0.84,
  fractureEnd: 0.88,
  metalStart: 0.8,
  /** Camera orbit leads into the rise and keeps running through it. */
  orbitStart: 0.9,
  /** Extraction: the model lifts out of the sheet. */
  riseStart: 0.79,
  /** Committed-pace window opens here (scrollCommit.ts): detachment through shockwave. */
  detachStart: 0.88,
  /** The shockwave has finished crossing the sheet; the print may fade after this. */
  waveEnd: 0.97,
} as const

/**
 * An authored failure envelope, in normalized flicker time. Unequal troughs and
 * recoveries avoid a metronomic blink; the fourth failure hangs near extinction
 * before a weak recovery. Immutable keys and bounded C1 interpolation make the
 * same scroll position produce the same light in either direction.
 */
const LAMP_FAILURE_KEYS = [
  [0, 1], [0.12, 0.58], [0.18, 0.92],
  [0.28, 0.14], [0.34, 0.78],
  [0.46, 0.36], [0.51, 0.86],
  [0.64, 0.015], [0.72, 0.015], [0.78, 0.58],
  [0.85, 0.08], [0.91, 0.34], [1, 0],
] as const

function lampFlickerPower(t: number): number {
  const u = clamp01((t - INTRO_PHASES.flickerStart) / (INTRO_PHASES.blackoutStart - INTRO_PHASES.flickerStart))
  for (let i = 1; i < LAMP_FAILURE_KEYS.length; i += 1) {
    const a = LAMP_FAILURE_KEYS[i - 1]
    const b = LAMP_FAILURE_KEYS[i]
    if (u <= b[0]) return a[1] + (b[1] - a[1]) * smooth01((u - a[0]) / (b[0] - a[0]))
  }
  return 0
}

function lampPowerAt(t: number): number {
  if (t < INTRO_PHASES.flickerStart) return 1
  if (t < INTRO_PHASES.blackoutStart) return lampFlickerPower(t)
  return smooth01((t - INTRO_PHASES.lampReturnStart) / (INTRO_PHASES.lampReturnEnd - INTRO_PHASES.lampReturnStart))
}

/**
 * Scroll-time -> pose-time reparameterization.
 *
 * The pose axis starts extraction at 0.4; the geometric crossing is solved from
 * transformed vertices. Pose .4-.5 pushes the intact stock; .5-1 rises through rupture.
 *
 * The exponent spends more scroll on the late lift and hero handoff.
 */
const RISE_EASE_EXPONENT = 0.55

export function introPoseTime(t: number): number {
  const clamped = clamp01(t)
  if (clamped <= INTRO_PHASES.riseStart) return 0.4 * (clamped / INTRO_PHASES.riseStart)
  if (clamped <= INTRO_PHASES.fractureStart) {
    return 0.4 + 0.1 * (clamped - INTRO_PHASES.riseStart) / (INTRO_PHASES.fractureStart - INTRO_PHASES.riseStart)
  }
  const x = (clamped - INTRO_PHASES.fractureStart) / (1 - INTRO_PHASES.fractureStart)
  return 0.5 + 0.5 * Math.pow(clamp01(x), RISE_EASE_EXPONENT)
}

/** Scroll-time at which the pose reaches a given pose-time. Inverse of `introPoseTime`. */
export function introScrollTimeFor(poseTime: number): number {
  const pose = clamp01(poseTime)
  if (pose <= 0.4) return (pose / 0.4) * INTRO_PHASES.riseStart
  if (pose <= 0.5) return INTRO_PHASES.riseStart + (pose - 0.4) / 0.1 * (INTRO_PHASES.fractureStart - INTRO_PHASES.riseStart)
  const x = Math.pow((pose - 0.5) / 0.5, 1 / RISE_EASE_EXPONENT)
  return INTRO_PHASES.fractureStart + x * (1 - INTRO_PHASES.fractureStart)
}

export interface IntroState {
  crackGlow: number
  pressure: number
  crackWeb: number
  fracture: number
  openingClear: number
  /** Intro-normalized scroll time, 0 at the top of the page and 1 at the handoff. */
  t: number
  /** Pose time handed to `relativePose` / the solved extraction. */
  poseT: number
  /** 0 = fully blurred sheet, 1 = sharp print. */
  focus: number
  /** Fixed warm-key power: lit hold, irregular failure sequence, dark hold, then return. */
  lampPower: number
  /** Numeric predicate for the dark hold (`lampPower <= 0.03`). */
  blackout: number
  /** Measured trailing reading-pool contribution; suppressed before the flicker. */
  readingPool: number
  /** Normalized arc position of the excitation head along the traced profile. */
  pulseHead: number
  /** 1 while the excitation is running. */
  pulse: number
  /** Flat-shade -> PBR activation for the live model and the studio lights. */
  pbr: number
  /** Light arrives before the material finishes resolving, avoiding a double-dimmed reveal. */
  illumination: number
  /** Orthographic-plan -> hero-perspective camera blend, including the orbit roll. */
  perspective: number
  /** Print luminance falloff as the model takes over. */
  contrast: number
  /** Permanent opaque stock; physical sheet motion handles retirement. */
  drawingOpacity: number
  /** 0 -> 1 across the single shockwave pass; 1 means the front has cleared the sheet. */
  waveTime: number
  /** 1 while the shockwave is live. */
  waveActive: number
  /** One soft reflection pass after separation, zero outside the intro. */
  lightSweep: number
  lightSweepPosition: number
}

/**
 * @param progress paced progress (not raw scroll)
 * @param crossing solved pose-time at which the model separates from the sheet
 */
export function drawingIntroState(progress: number, crossing = 0.9): IntroState {
  const t = clamp01(progress / DRAWING_INTRO_WINDOW.releaseEnd)
  const poseT = introPoseTime(t)
  const lampPower = lampPowerAt(t)
  // The wave is triggered by the solved separation, converted onto the scroll axis so
  // pacing decides how long it is on screen without moving the physical trigger.
  const waveStart = introScrollTimeFor(crossing)
  const waveSpan = Math.max(1e-4, INTRO_PHASES.waveEnd - waveStart)
  const waveTime = clamp01((t - waveStart) / waveSpan)
  const pressure = smooth01((t - INTRO_PHASES.bulgeStart) / (INTRO_PHASES.fractureStart - INTRO_PHASES.bulgeStart))
  const fracture = smooth01((t - INTRO_PHASES.fractureStart) / (INTRO_PHASES.fractureEnd - INTRO_PHASES.fractureStart))
  return {
    pressure,
    fracture,
    openingClear: t >= INTRO_PHASES.fractureEnd ? 1 : 0,
    crackWeb: smooth01((t - 0.75) / 0.07) * (1 - fracture),
    crackGlow: t < INTRO_PHASES.pulseStart ? 0 : t <= INTRO_PHASES.pulseEnd ? 1 :
      (0.65 + 0.35 * pressure) * (1 - 0.78 * fracture) * (1 - smooth01((t - 0.94) / 0.05)),
    t,
    poseT,
    focus: smooth01(t / INTRO_PHASES.focusEnd),
    lampPower,
    blackout: lampPower <= 0.03 ? 1 : 0,
    readingPool: 1 - smooth01((t - 0.25) / 0.05),
    pulseHead: clamp01((t - INTRO_PHASES.pulseStart) / (INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart)),
    pulse: t >= INTRO_PHASES.pulseStart && t <= INTRO_PHASES.pulseEnd ? 1 : 0,
    pbr: smooth01((t - INTRO_PHASES.metalStart) / 0.02),
    illumination: lampPowerAt(t) * smooth01((t - INTRO_PHASES.metalStart) / 0.02),
    perspective: smooth01((t - INTRO_PHASES.orbitStart) / (1 - INTRO_PHASES.orbitStart)),
    contrast: 1 - 0.72 * smooth01((t - INTRO_PHASES.riseStart) / 0.34),
    drawingOpacity: 1,
    waveTime,
    waveActive: t > waveStart && waveTime < 1 ? 1 : 0,
    lightSweep: Math.pow(Math.sin(Math.PI * clamp01((t - waveStart) / Math.max(1e-4, 1 - waveStart))), 2),
    lightSweepPosition: clamp01((t - waveStart) / Math.max(1e-4, 1 - waveStart)),
  }
}

/**
 * Compress only the opening CH.01 mechanism cues into the band between the intro handoff
 * and the retained hero window; 0.18 onward keeps main timing untouched.
 */
export function remapHeroProgress(previousProgress: number): number {
  return DRAWING_INTRO_WINDOW.releaseEnd + clamp01(previousProgress / 0.18) * 0.06
}
