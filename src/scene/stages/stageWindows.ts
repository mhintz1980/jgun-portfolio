/**
 * Multi-chapter stage windows — the global-scroll-progress ranges over which
 * each 3D stage owns the canvas (StageManager + AirflowField both read these;
 * canvas-side only, always via getScrollState() inside useFrame).
 *
 * Mission spec (2026-08-24 orzo-style upgrade) called for 0.00–0.42 /
 * 0.38–0.72 / 0.68–1.00, but those numbers predate the measured DOM. The
 * section height was doubled to 440vh the same day (Mark review — scroll
 * pacing ×2, oryzo.ai reference), so against the current layout (4 × 440vh
 * sections + 40vh footer ≈ 1800vh of document) the measured anchors are:
 * the explosion timeline scrubs [data-chapter="1"]'s viewport transit at
 * global progress 0.20 → 0.518, explodeFactor reaches 1 at ≈0.518 (gears at
 * the full 8π sweep simultaneously), the CH.02→CH.03 chapter flip lands at
 * ≈0.74. The wrench therefore holds its fully-exploded pose for a beat
 * (≈0.017 of scroll ≈ 30vh) before sinking — never truncated. Overlapping
 * ranges are the cross-fade regions.
 */
export type FadeRange = readonly [start: number, end: number]

export const STAGE_TRANSITIONS = {
  /** Wrench stage (CH.01+02) sinks out — after the explosion ladder and rear-LCD dwell complete. */
  wrenchOut: [0.535, 0.575] as FadeRange,
  /** MSP enclosure stage (CH.03) enters as the wrench leaves. */
  enclosureIn: [0.535, 0.575] as FadeRange,
  /** MSP enclosure stage exits upward-window as the point cloud arrives. */
  enclosureOut: [0.72, 0.76] as FadeRange,
  /** M249 point-cloud stage (CH.04) enters and holds to the end. */
  pointCloudIn: [0.72, 0.76] as FadeRange,
} as const

/** Vertical enter/exit travel per stage (m) — clears the 28–42° frustum. */
export const STAGE_TRAVEL = 0.5

/**
 * MSP SAFE enclosure placeholder half-extents (m), camera-fit to the frozen
 * CH.03 keyframe (position (0.27, 0.27, 0.27) → target origin, FOV 28° gives
 * ≈ ±0.12 m vertical half-view at the target plane). Provisional until the
 * real Draco GLB lands in public/models/ — then re-measure and re-fit.
 */
export const ENCLOSURE_HALF: readonly [number, number, number] = [0.14, 0.1, 0.19]

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
