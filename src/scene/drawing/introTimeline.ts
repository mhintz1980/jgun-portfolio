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
 */
export const INTRO_SCROLL_SHARE = 0.3

/**
 * Progress band the intro owns. `releaseEnd` is the handoff to the retained site
 * timeline; `heroEnd` closes the JGun station segment. Neither value moves with pacing.
 */
export const DRAWING_INTRO_WINDOW = { releaseEnd: 0.12, heroEnd: 0.525 } as const

/**
 * Half-width (in raw scroll) of the C1 blend that removes the slope step where the
 * slow intro meets the faster main timeline. Both linear pieces are met exactly at the
 * window edges, so no downstream absolute distance changes because of the blend.
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
  if (s <= INTRO_SCROLL_SHARE - HANDOFF_BLEND) return introLine(s)
  if (s >= INTRO_SCROLL_SHARE + HANDOFF_BLEND) return mainLine(s)
  const blend = smooth01((s - (INTRO_SCROLL_SHARE - HANDOFF_BLEND)) / (2 * HANDOFF_BLEND))
  return introLine(s) + blend * (mainLine(s) - introLine(s))
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
  /** Focus rack: blurred sheet resolves to a sharp registered print. */
  focusEnd: 0.14,
  /** RESERVED for the animated opening text. Nothing else is authored here. */
  onboardStart: 0.14,
  onboardEnd: 0.3,
  /** Ordered excitation traced along the primary elevation's profile. */
  pulseStart: 0.3,
  pulseEnd: 0.56,
  /** Camera orbit leads into the rise and keeps running through it. */
  orbitStart: 0.46,
  /** Extraction: the model lifts out of the sheet. */
  riseStart: 0.56,
  /** Committed-pace window opens here (scrollCommit.ts): detachment through shockwave. */
  detachStart: 0.86,
  /** The shockwave has finished crossing the sheet; the print may fade after this. */
  waveEnd: 0.96,
} as const

/**
 * Scroll-time -> pose-time reparameterization.
 *
 * `relativePose()` and the bisection solver in `extractionPose.ts` are untouched: they
 * still work on the pose axis where the extraction starts at 0.4 and the solved crossing
 * sits at ~0.899. This map is the only thing that decides how much *scroll* each part of
 * that pose range costs, so pacing changes never re-solve the contact.
 *
 * The exponent back-loads scroll onto the late pose range because `relativePose` lifts by
 * `travel * u^4`; without it, nine tenths of the visible travel would land in the last
 * tenth of the rise window.
 */
const RISE_EASE_EXPONENT = 0.55

export function introPoseTime(t: number): number {
  const clamped = clamp01(t)
  if (clamped <= INTRO_PHASES.riseStart) return 0.4 * (clamped / INTRO_PHASES.riseStart)
  const x = (clamped - INTRO_PHASES.riseStart) / (1 - INTRO_PHASES.riseStart)
  return 0.4 + 0.6 * Math.pow(clamp01(x), RISE_EASE_EXPONENT)
}

/** Scroll-time at which the pose reaches a given pose-time. Inverse of `introPoseTime`. */
export function introScrollTimeFor(poseTime: number): number {
  const pose = clamp01(poseTime)
  if (pose <= 0.4) return (pose / 0.4) * INTRO_PHASES.riseStart
  const x = Math.pow((pose - 0.4) / 0.6, 1 / RISE_EASE_EXPONENT)
  return INTRO_PHASES.riseStart + x * (1 - INTRO_PHASES.riseStart)
}

export interface IntroState {
  /** Intro-normalized scroll time, 0 at the top of the page and 1 at the handoff. */
  t: number
  /** Pose time handed to `relativePose` / the solved extraction. */
  poseT: number
  /** 0 = fully blurred sheet, 1 = sharp print. */
  focus: number
  /** Normalized arc position of the excitation head along the traced profile. */
  pulseHead: number
  /** 1 while the excitation is running. */
  pulse: number
  /** Flat-shade -> PBR activation for the live model and the studio lights. */
  pbr: number
  /** Orthographic-plan -> hero-perspective camera blend, including the orbit roll. */
  perspective: number
  /** Print luminance falloff as the model takes over. */
  contrast: number
  /** Print alpha. Held at 1 until the shockwave has crossed the sheet. */
  drawingOpacity: number
  /** 0 -> 1 across the single shockwave pass; 1 means the front has cleared the sheet. */
  waveTime: number
  /** 1 while the shockwave is live. */
  waveActive: number
}

/**
 * @param progress paced progress (not raw scroll)
 * @param crossing solved pose-time at which the model separates from the sheet
 */
export function drawingIntroState(progress: number, crossing = 0.9): IntroState {
  const t = clamp01(progress / DRAWING_INTRO_WINDOW.releaseEnd)
  const poseT = introPoseTime(t)
  // The wave is triggered by the solved separation, converted onto the scroll axis so
  // pacing decides how long it is on screen without moving the physical trigger.
  const waveStart = introScrollTimeFor(crossing)
  const waveSpan = Math.max(1e-4, INTRO_PHASES.waveEnd - waveStart)
  const waveTime = clamp01((t - waveStart) / waveSpan)
  return {
    t,
    poseT,
    focus: smooth01(t / INTRO_PHASES.focusEnd),
    pulseHead: clamp01((t - INTRO_PHASES.pulseStart) / (INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart)),
    pulse: t > INTRO_PHASES.pulseStart && t < INTRO_PHASES.pulseEnd ? 1 : 0,
    pbr: smooth01((t - INTRO_PHASES.riseStart) / 0.1),
    perspective: smooth01((t - INTRO_PHASES.orbitStart) / (1 - INTRO_PHASES.orbitStart)),
    contrast: 1 - 0.72 * smooth01((t - INTRO_PHASES.riseStart) / 0.34),
    drawingOpacity: 1 - smooth01((t - INTRO_PHASES.waveEnd) / (1 - INTRO_PHASES.waveEnd)),
    waveTime,
    waveActive: t > waveStart && waveTime < 1 ? 1 : 0,
  }
}

/**
 * Compress only the opening CH.01 mechanism cues into the band between the intro handoff
 * and the retained hero window; 0.18 onward keeps main timing untouched.
 */
export function remapHeroProgress(previousProgress: number): number {
  return DRAWING_INTRO_WINDOW.releaseEnd + clamp01(previousProgress / 0.18) * 0.06
}
