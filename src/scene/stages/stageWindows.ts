/**
 * Multi-chapter stage windows — the global-scroll-progress ranges over which
 * each 3D stage owns the canvas (StageManager + AirflowField both read these;
 * canvas-side only, always via getScrollState() inside useFrame).
 *
 * Measured against the CURRENT document (2026-08-27 remeasure, JG-014 repair):
 * 3 × 440vh chapter sections + 660vh CH.04 + 40vh footer = 2020vh (the old
 * 1800vh figures — explode done ≈0.518, flip ≈0.74 — are stale). The hero
 * timeline scrubs [data-chapter="1"]'s viewport transit at global progress
 * ≈0.177 → 0.458, so the explode tween (timeline 0.35→0.85) completes at
 * ≈0.416 (live-probed: gearRotation 8π and explodeFactor 1 by 0.47). The
 * rear-LCD orbit (LCD_REVEAL_WINDOW, caseStudies.ts) runs 0.420 → 0.525 —
 * after the explode beat, before this handoff — so the wrench sinks only
 * after the camera has returned from the LCD dwell. Overlapping ranges are
 * the cross-fade regions.
 */
export type FadeRange = readonly [start: number, end: number]

export const STAGE_TRANSITIONS = {
  /** Wrench stage (CH.01+02) sinks out — after the explosion ladder AND the rear-LCD orbit return (LCD_REVEAL_WINDOW.end = 0.525). */
  wrenchOut: [0.525, 0.565] as FadeRange,
  /** MSP enclosure stage (CH.03) enters as the wrench leaves. */
  enclosureIn: [0.525, 0.565] as FadeRange,
  /** MSP enclosure stage exits upward-window as the point cloud arrives. */
  enclosureOut: [0.72, 0.76] as FadeRange,
  /** M249 point-cloud stage (CH.04) enters and holds to the end. */
  pointCloudIn: [0.72, 0.76] as FadeRange,
} as const

/** Vertical enter/exit travel per stage (m) — clears the 28–42° frustum. */
export const STAGE_TRAVEL = 0.5

/**
 * Measured RL-300 / MSP SAFE enclosure subassembly anchor positions (m, model frame).
 * Extracted from the authoritative 7 named roots in public/models/msp-enclosure.glb:
 *   - DUCT_INTAKE: [0.0, 1.158, 0.893] (laminar inlet port, +Z)
 *   - PUMP_HOUSING: [0.022, 0.943, -0.055] (vibration / thermal noise source)
 *   - ACOUSTIC_BAFFLES: [-1.319, 1.590, -0.433] (labyrinth sound absorption wall)
 *   - DUCT_EXHAUST: [-0.101, 1.282, -1.225] (attenuated outlet port, -Z)
 *   - ISOLATION_MOUNTS: [0.0, 0.025, -0.055] (structure-borne decoupling base)
 */
export const STATION2_CAD_ANCHORS = {
  ductIntake: [0.0, 1.158, 0.893] as const,
  pumpHousing: [0.022, 0.943, -0.055] as const,
  acousticBaffles: [-1.319, 1.590, -0.433] as const,
  ductExhaust: [-0.101, 1.282, -1.225] as const,
  isolationMounts: [0.0, 0.025, -0.055] as const,
} as const

/**
 * Enclosure half-extents (m) for particle route and interaction bounding.
 */
export const ENCLOSURE_HALF: readonly [number, number, number] = [1.2, 1.1, 1.6]

export interface StageEnvelope {
  /** Cross-fade alpha 0..1 (visibility gate at ≤ 0.001). */
  alpha: number
  /** Vertical offset (m): enters from +travel, exits to −travel. */
  y: number
  active: boolean
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))
const smooth = (t: number): number => t * t * (3 - 2 * t)

const segment = (progress: number, [start, end]: FadeRange): number =>
  smooth(clamp01((progress - start) / (end - start)))

/**
 * Per-stage envelope from global scroll progress. `fadeIn` omitted means the
 * stage is already fully in at the top of its range; `fadeOut` omitted means
 * it never leaves.
 */
export function stageEnvelope(
  progress: number,
  fadeIn: FadeRange | undefined,
  fadeOut: FadeRange | undefined,
  travel: number = STAGE_TRAVEL,
): StageEnvelope {
  const tIn = fadeIn ? segment(progress, fadeIn) : 1
  const tOut = fadeOut ? segment(progress, fadeOut) : 0
  const alpha = Math.min(tIn, 1 - tOut)
  return {
    alpha,
    y: travel * (1 - tIn) - travel * tOut,
    active: alpha > 0.001,
  }
}

/**
 * CH.03 airflow intensity 0..1 across the enclosure stage's hold window
 * (after the enter cross-fade settles, before the exit begins).
 */
export function airflowIntensity(progress: number): number {
  return clamp01((progress - STAGE_TRANSITIONS.enclosureIn[1]) /
    (STAGE_TRANSITIONS.enclosureOut[0] - STAGE_TRANSITIONS.enclosureIn[1]))
}
