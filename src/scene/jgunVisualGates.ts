/**
 * JG-032 — JGUN visual-polish progress gates (pure, unit-testable).
 *
 * Every JGUN lighting/shadow addition lives on the GLOBAL SceneCanvas, which
 * renders for all three stations — so each one is gated on scroll progress
 * and must return ZERO contribution at CH.04 progress values (≥ 0.72).
 *
 * Window note: the source brief gated the explode shadow and spot nudge to
 * 0.47–0.97, but CH.04 owns the canvas from 0.72 (pointCloudIn) and the
 * StudioRig crossfades back to full for Station 3 — so the gate clamps to
 * the wrench-sink boundary (wrenchOut [0.525, 0.565]): full inside
 * 0.49–0.525, faded out by 0.565, zero everywhere after. CH.04 is inert by
 * construction, not by invisible-ness.
 */

const smooth01 = (x: number): number => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

/** Shared JGUN explode-hold gate: ramps 0.47→0.49, holds, fades 0.525→0.565. */
export function explodeHoldGate(progress: number): number {
  return smooth01((progress - 0.47) / 0.02) * (1 - smooth01((progress - 0.525) / 0.04))
}

/** Secondary wide contact-shadow opacity (peak 0.12, scaled by explodeFactor). */
export function explodeShadowOpacity(progress: number, explodeFactor: number): number {
  return 0.12 * Math.min(1, Math.max(0, explodeFactor)) * explodeHoldGate(progress)
}

/** StudioRig spot nudge during the explode hold (resting values unchanged). */
export function studioSpotNudge(progress: number): { intensity: number; y: number } {
  const g = explodeHoldGate(progress)
  return { intensity: 0.3 * g, y: 0.1 * g }
}

/**
 * Rear-LCD micro-rim point light (peak 0.8) — active only inside
 * LCD_REVEAL_WINDOW with the same 0.02 ease as LcdFillLight.
 */
export function lcdMicroRimIntensity(
  progress: number,
  window: readonly [number, number],
): number {
  const fadeIn = Math.min(Math.max((progress - window[0]) / 0.02, 0), 1)
  const fadeOut = Math.min(Math.max((window[1] - progress) / 0.02, 0), 1)
  return 0.8 * Math.min(fadeIn, fadeOut)
}
