/**
 * B1/B2 own the first 0.120 of the established JGun stage.  The retained
 * hero animation still reaches the same global stage boundary (0.525); its
 * local cues are remapped rather than reordered.
 */
export const DRAWING_INTRO_WINDOW = {
  focusStart: 0.0,
  focusEnd: 0.032,
  pulseStart: 0.052,
  pulsePeak: 0.068,
  handoff: 0.084,
  releaseEnd: 0.12,
  heroEnd: 0.525,
} as const

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))
const smooth01 = (value: number): number => {
  const clamped = clamp01(value)
  return clamped * clamped * (3 - 2 * clamped)
}

export interface DrawingIntroState {
  focus: number
  drawingOpacity: number
  modelOpacity: number
  pulse: number
  handoff: number
  ripple: number
}

/** Pure scroll-to-state mapping, shared by linework, SVG, model and post FX. */
export function drawingIntroState(progress: number): DrawingIntroState {
  const focus = smooth01(
    (progress - DRAWING_INTRO_WINDOW.focusStart) /
      (DRAWING_INTRO_WINDOW.focusEnd - DRAWING_INTRO_WINDOW.focusStart),
  )
  const handoff = smooth01(
    (progress - DRAWING_INTRO_WINDOW.pulsePeak) /
      (DRAWING_INTRO_WINDOW.handoff - DRAWING_INTRO_WINDOW.pulsePeak),
  )
  const pulse = Math.sin(
    Math.PI * clamp01(
      (progress - DRAWING_INTRO_WINDOW.pulseStart) /
        (DRAWING_INTRO_WINDOW.handoff - DRAWING_INTRO_WINDOW.pulseStart),
    ),
  )
  const ripple = Math.sin(
    Math.PI * clamp01(
      (progress - DRAWING_INTRO_WINDOW.pulsePeak) /
        (DRAWING_INTRO_WINDOW.releaseEnd - DRAWING_INTRO_WINDOW.pulsePeak),
    ),
  )

  return {
    focus,
    drawingOpacity: 1 - handoff,
    modelOpacity: handoff,
    pulse,
    handoff,
    ripple,
  }
}

/** Remap a pre-intro [0, 0.85] cue into the retained [0.12, 0.525] window. */
export function remapHeroProgress(previousLocalProgress: number): number {
  const local = clamp01(previousLocalProgress / 0.85)
  return DRAWING_INTRO_WINDOW.releaseEnd +
    local * (DRAWING_INTRO_WINDOW.heroEnd - DRAWING_INTRO_WINDOW.releaseEnd)
}
