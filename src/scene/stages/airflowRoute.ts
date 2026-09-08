import { Vector3 } from 'three'

/**
 * JG-032 — Station-2 thermal airflow route derivation (pure, unit-testable).
 *
 * The shader route is driven by two measured volumes resolved at runtime from
 * the GLB (never by props — the Station-2 contract string-matches the mounts):
 *
 * - `DUCT_INTAKE_AIRWAY` (mesh 187: 48 verts, 1 primitive — a coarse volume
 *   block, NOT a swept duct; verified world AABB x [-0.600, 0.600],
 *   y [1.200, 1.855], z [0.431, 1.300], covering the +Z intake plenum only).
 * - `G2RL300-SAF-1003-2` (mesh 188: 8,282 verts, closed manifold, ray-grid
 *   probe 2026-09-08: NO perforation lattice — a solid decorative plate), the
 *   MSP_YELLOW_PAINT intake grille on the +Z face. Its AABB (never its
 *   material) drives the aperture slot lattice.
 *
 * Flow story (CAD axes, not "front/rear"): intake +Z → plenum → heat pickup
 * at PUMP_HOUSING → baffle deflection → exhaust −Z.
 */

export interface Box3Like {
  min: Vector3
  max: Vector3
}

export interface AirwayRouteParams {
  /** false → shader keeps the legacy guessed arc (null/degenerate box). */
  valid: boolean
  /** +Z entry plane (box.max.z). */
  entryZ: number
  /** Exit plane toward the enclosure interior (box.min.z). */
  exitZ: number
  minX: number
  maxX: number
  minY: number
  maxY: number
  centerX: number
  centerY: number
}

const INVALID_AIRWAY: AirwayRouteParams = {
  valid: false,
  entryZ: 0,
  exitZ: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  centerX: 0,
  centerY: 0,
}

/**
 * Derive the intake-plenum route parameters from the airway's world AABB.
 * A null (GLB re-export without the node) or degenerate box returns
 * `valid: false` — the caller keeps the legacy arc instead of collapsing
 * particles to the origin.
 */
export function airwayRouteParams(box: Box3Like | null): AirwayRouteParams {
  if (!box) return INVALID_AIRWAY
  const { min, max } = box
  const dx = max.x - min.x
  const dy = max.y - min.y
  const dz = max.z - min.z
  // Degenerate: inverted (Box3 empty) or zero-volume
  if (!(dx > 0 && dy > 0 && dz > 0)) return INVALID_AIRWAY
  return {
    valid: true,
    entryZ: max.z,
    exitZ: min.z,
    minX: min.x,
    maxX: max.x,
    minY: min.y,
    maxY: max.y,
    centerX: (min.x + max.x) / 2,
    centerY: (min.y + max.y) / 2,
  }
}

/**
 * Intake aperture lattice — rectangular slot array snapped inside the grille
 * AABB (the ray-grid probe found no hex perforations, so no hex lattice).
 */
export const APERTURE_COLS = 8
export const APERTURE_ROWS = 4
/** Inset (m) from the grille AABB edges so slots never spawn on the frame. */
export const APERTURE_INSET = 0.1

/**
 * Cool→hot thermal ramp stops (t across the whole route):
 * intake #00e5ff → plenum #38bdf8/#7dd3fc → heat pickup #fbbf24 → #f97316 →
 * exhaust #ef4444. Mirrored by the GLSL `heatRamp` in AirflowField.tsx.
 */
const RAMP_STOPS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.0, 0.0, 0.898, 1.0], // #00e5ff
  [0.2, 0.0, 0.898, 1.0], // #00e5ff
  [0.3, 0.22, 0.742, 0.973], // #38bdf8
  [0.45, 0.49, 0.827, 0.988], // #7dd3fc
  [0.6, 0.984, 0.749, 0.141], // #fbbf24
  [0.75, 0.976, 0.451, 0.086], // #f97316
  [0.9, 0.937, 0.267, 0.267], // #ef4444
  [1.0, 0.937, 0.267, 0.267], // #ef4444
]

/** Sample the cool→hot ramp at route parameter t ∈ [0, 1]. */
export function heatRampColor(t: number): readonly [number, number, number] {
  const x = Math.min(1, Math.max(0, t))
  for (let i = 0; i < RAMP_STOPS.length - 1; i++) {
    const [t0, r0, g0, b0] = RAMP_STOPS[i]
    const [t1, r1, g1, b1] = RAMP_STOPS[i + 1]
    if (x <= t1 || i === RAMP_STOPS.length - 2) {
      const k = t1 === t0 ? 0 : (x - t0) / (t1 - t0)
      const c = Math.min(1, Math.max(0, k))
      return [r0 + (r1 - r0) * c, g0 + (g1 - g0) * c, b0 + (b1 - b0) * c]
    }
  }
  const [, r, g, b] = RAMP_STOPS[RAMP_STOPS.length - 1]
  return [r, g, b]
}

/**
 * Ring split — OWNER RULING 2026-09-08: keep the 6-ring acoustic pool exactly
 * as it behaves today (−43 dBA story stays legible) and convert the 5-ring
 * exhaust pool into thermal boundary shells. No third pool; counts fixed.
 */
export const ACOUSTIC_RING_COUNT = 6
export const THERMAL_SHELL_COUNT = 5
/** Nested shell radii (m) around PUMP_HOUSING, spanning the 0.25–0.65 band. */
export const THERMAL_SHELL_RADII = [0.25, 0.35, 0.45, 0.55, 0.65] as const
/** Per-shell color: #fbbf24 → #f97316 → #ea580c across the pool. */
export const THERMAL_SHELL_COLORS = [
  '#fbbf24',
  '#f9991d',
  '#f97316',
  '#f26511',
  '#ea580c',
] as const
/** Restrained additive opacity band. */
export const THERMAL_SHELL_OPACITY_MIN = 0.06
export const THERMAL_SHELL_OPACITY_MAX = 0.1
