import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import {
  ACOUSTIC_RING_COUNT,
  APERTURE_COLS,
  APERTURE_INSET,
  APERTURE_ROWS,
  THERMAL_SHELL_COLORS,
  THERMAL_SHELL_COUNT,
  THERMAL_SHELL_OPACITY_MAX,
  THERMAL_SHELL_OPACITY_MIN,
  THERMAL_SHELL_RADII,
  airwayRouteParams,
  heatRampColor,
} from './airflowRoute'

/**
 * JG-032 — Station-2 thermal route unit tests.
 * The measured airway AABB below is the verified GLB value (mesh 187,
 * .scratch probe 2026-09-08): x [-0.600, 0.600], y [1.200, 1.855],
 * z [0.431, 1.300] — the +Z intake plenum only.
 */
const MEASURED_AIRWAY = new Box3(
  new Vector3(-0.6, 1.2, 0.431),
  new Vector3(0.6, 1.855, 1.3),
)

describe('JG-032 airway box → route parameter derivation', () => {
  it('lands the intake leg entry/exit planes on the expected z values', () => {
    const params = airwayRouteParams(MEASURED_AIRWAY)
    expect(params.valid).toBe(true)
    // Entry plane at the +Z face, exit plane toward the enclosure interior
    expect(params.entryZ).toBeCloseTo(1.3, 6)
    expect(params.exitZ).toBeCloseTo(0.431, 6)
    expect(params.entryZ).toBeGreaterThan(params.exitZ)
  })

  it('constrains the plenum leg to the measured x/y bands', () => {
    const params = airwayRouteParams(MEASURED_AIRWAY)
    expect(params.minX).toBeCloseTo(-0.6, 6)
    expect(params.maxX).toBeCloseTo(0.6, 6)
    expect(params.minY).toBeCloseTo(1.2, 6)
    expect(params.maxY).toBeCloseTo(1.855, 6)
    expect(params.centerX).toBeCloseTo(0, 6)
    expect(params.centerY).toBeCloseTo(1.5275, 6)
  })

  it('falls back to the legacy arc on a null airway instead of collapsing to the origin', () => {
    const params = airwayRouteParams(null)
    expect(params.valid).toBe(false)
    // No fabricated route through (0,0,0): valid=false is the only signal
    // the shader needs to select legacyRoute()
  })

  it('rejects degenerate boxes (inverted or zero-volume)', () => {
    // Box3() default is "empty": min=+Inf, max=-Inf
    expect(airwayRouteParams(new Box3()).valid).toBe(false)
    // Zero-thickness slab
    expect(
      airwayRouteParams(new Box3(new Vector3(0, 0, 0), new Vector3(1, 1, 0))).valid,
    ).toBe(false)
    // Zero-size point
    expect(
      airwayRouteParams(new Box3(new Vector3(1, 1, 1), new Vector3(1, 1, 1))).valid,
    ).toBe(false)
  })
})

describe('JG-032 cool→hot thermal ramp', () => {
  it('matches the spec at representative route t values', () => {
    // Intake aperture: #00e5ff
    const intake = heatRampColor(0.1)
    expect(intake[0]).toBeCloseTo(0.0, 3)
    expect(intake[1]).toBeCloseTo(0.898, 3)
    expect(intake[2]).toBeCloseTo(1.0, 3)

    // Plenum transit mid: between #38bdf8 and #7dd3fc (cool blues)
    const plenum = heatRampColor(0.375)
    expect(plenum[2]).toBeGreaterThan(0.95) // still blue-dominant
    expect(plenum[0]).toBeLessThan(0.5)

    // Engine heat pickup: #fbbf24 at t = 0.60
    const heat = heatRampColor(0.6)
    expect(heat[0]).toBeCloseTo(0.984, 3)
    expect(heat[1]).toBeCloseTo(0.749, 3)
    expect(heat[2]).toBeCloseTo(0.141, 3)

    // Hot stream: #f97316 at t = 0.75
    const hot = heatRampColor(0.75)
    expect(hot[0]).toBeCloseTo(0.976, 3)
    expect(hot[1]).toBeCloseTo(0.451, 3)
    expect(hot[2]).toBeCloseTo(0.086, 3)

    // Exhaust: #ef4444 at t = 0.90+
    const exhaust = heatRampColor(0.9)
    expect(exhaust[0]).toBeCloseTo(0.937, 3)
    expect(exhaust[1]).toBeCloseTo(0.267, 3)
    expect(exhaust[2]).toBeCloseTo(0.267, 3)
  })

  it('progresses from cool-dominant to hot-dominant across the route', () => {
    // Blue channel falls from the cyan intake to the amber hot zone
    expect(heatRampColor(0.1)[2]).toBeGreaterThan(heatRampColor(0.375)[2])
    expect(heatRampColor(0.375)[2]).toBeGreaterThan(heatRampColor(0.75)[2])
    // Red channel rises from the cyan intake into the hot zone
    expect(heatRampColor(0.75)[0]).toBeGreaterThan(heatRampColor(0.375)[0])
    expect(heatRampColor(0.375)[0]).toBeGreaterThan(heatRampColor(0.1)[0] - 1e-9)
  })

  it('clamps outside [0, 1]', () => {
    expect(heatRampColor(-0.5)).toEqual(heatRampColor(0))
    expect(heatRampColor(1.5)).toEqual(heatRampColor(1))
  })
})

describe('JG-032 ring split — owner ruling 2026-09-08 (6 acoustic / 5 thermal)', () => {
  it('guards the owner-ruled counts against drift', () => {
    expect(ACOUSTIC_RING_COUNT).toBe(6)
    expect(THERMAL_SHELL_COUNT).toBe(5)
  })

  it('spans the ruled 0.25–0.65 m shell band with one radius per shell', () => {
    expect(THERMAL_SHELL_RADII).toHaveLength(THERMAL_SHELL_COUNT)
    expect(THERMAL_SHELL_RADII[0]).toBeCloseTo(0.25, 6)
    expect(THERMAL_SHELL_RADII[THERMAL_SHELL_RADII.length - 1]).toBeCloseTo(0.65, 6)
    for (let i = 1; i < THERMAL_SHELL_RADII.length; i++) {
      expect(THERMAL_SHELL_RADII[i]).toBeGreaterThan(THERMAL_SHELL_RADII[i - 1])
    }
  })

  it('ramps shell colors #fbbf24 → #f97316 → #ea580c across the pool', () => {
    expect(THERMAL_SHELL_COLORS).toHaveLength(THERMAL_SHELL_COUNT)
    expect(THERMAL_SHELL_COLORS[0]).toBe('#fbbf24')
    expect(THERMAL_SHELL_COLORS[2]).toBe('#f97316')
    expect(THERMAL_SHELL_COLORS[4]).toBe('#ea580c')
  })

  it('keeps thermal shells inside the restrained 0.06–0.10 additive opacity band', () => {
    expect(THERMAL_SHELL_OPACITY_MIN).toBeCloseTo(0.06, 6)
    expect(THERMAL_SHELL_OPACITY_MAX).toBeCloseTo(0.1, 6)
    expect(THERMAL_SHELL_OPACITY_MAX).toBeGreaterThan(THERMAL_SHELL_OPACITY_MIN)
  })
})

describe('JG-032 aperture lattice (verified geometry, no assumed hex)', () => {
  it('uses a rectangular slot array derived from the grille AABB', () => {
    // Ray-grid probe 2026-09-08: the intake grille is a solid decorative
    // plate — no hex perforations — so the lattice is a slot/rect array.
    expect(APERTURE_COLS).toBe(8)
    expect(APERTURE_ROWS).toBe(4)
    expect(APERTURE_INSET).toBeGreaterThan(0)
    expect(APERTURE_INSET).toBeLessThan(0.3)
  })
})
