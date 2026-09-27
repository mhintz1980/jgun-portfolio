import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { makeDrawingLayout, SHEET_ROTATION } from './drawingGeometry'
import { INTRO_PHASES } from './introTimeline'
import { introCameraPose, sheetReveal, type SheetCameraPose } from './sheetCamera'

const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 0, ortho: 0, distance: 0 })
const layoutFor = (aspect: number) => makeDrawingLayout(aspect, new Box3(new Vector3(-0.05, -0.04, -0.15), new Vector3(0.05, 0.04, 0.15)))
const sheetNormal = new Vector3(0, 0, 1).applyMatrix4(SHEET_ROTATION).normalize()
/** Elevation of the camera ray above the sheet plane in degrees (90 = square on). */
const elevationOf = (p: SheetCameraPose): number =>
  (Math.asin(p.position.clone().sub(p.target).normalize().dot(sheetNormal)) * 180) / Math.PI

describe('drafting camera', () => {
  it('finishes the technical print before profile excitation', () => {
    expect(sheetReveal(0.4, []).every((value) => value === 1)).toBe(true)
  })
  for (const aspect of [16 / 9, 390 / 844]) {
    it(`holds the exact square-on registration through the pulse at aspect ${aspect}`, () => {
      const layout = layoutFor(aspect)
      const start = introCameraPose(layout, aspect, INTRO_PHASES.pulseStart, pose())
      expect(elevationOf(start)).toBeCloseTo(90, 9)
      expect(start.ortho).toBe(1)
      // pulseStart (.4) through registrationEnd (.5): the print-to-metal hold is exact.
      for (const t of [0.45, INTRO_PHASES.registrationEnd]) {
        const current = introCameraPose(layout, aspect, t, pose())
        expect(current.position.distanceTo(start.position)).toBeLessThan(1e-12)
        expect(current.target.distanceTo(start.target)).toBeLessThan(1e-12)
        expect(current.ortho).toBe(1)
        expect(elevationOf(current)).toBeCloseTo(90, 9)
      }
    })

    it(`tilts to the pressure view over the pressure window and holds it to the handoff at aspect ${aspect}`, () => {
      const layout = layoutFor(aspect)
      const held = introCameraPose(layout, aspect, INTRO_PHASES.registrationEnd, pose())
      const tilted = introCameraPose(layout, aspect, INTRO_PHASES.riseStart, pose())
      // Same focal point, distance and framing: only the elevation and projection change.
      expect(tilted.target.distanceTo(held.target)).toBeLessThan(1e-12)
      expect(tilted.distance).toBeCloseTo(held.distance, 12)
      expect(tilted.fov).toBeCloseTo(held.fov, 12)
      expect(elevationOf(tilted)).toBeCloseTo(58, 9)
      expect(tilted.ortho).toBe(0)
      // Monotone descent, no elevation or projection reversal inside (registrationEnd, riseStart).
      let previousElevation = 90
      let previousOrtho = 1
      for (let i = 1; i <= 40; i += 1) {
        const t = INTRO_PHASES.registrationEnd + (INTRO_PHASES.riseStart - INTRO_PHASES.registrationEnd) * (i / 40)
        const current = introCameraPose(layout, aspect, t, pose())
        const elevation = elevationOf(current)
        expect(elevation).toBeLessThanOrEqual(previousElevation)
        expect(elevation).toBeGreaterThanOrEqual(58 - 1e-6)
        expect(current.ortho).toBeLessThanOrEqual(previousOrtho)
        previousElevation = elevation
        previousOrtho = current.ortho
      }
      // The tilted pose is constant from riseStart into the hero blend window.
      for (const t of [0.7, INTRO_PHASES.orbitStart, 1]) {
        const current = introCameraPose(layout, aspect, t, pose())
        expect(current.position.distanceTo(tilted.position)).toBeLessThan(1e-12)
        expect(current.target.distanceTo(tilted.target)).toBeLessThan(1e-12)
        expect(current.ortho).toBe(0)
      }
    })

    it(`moves continuously across settle, hold, tilt and handoff without a snap at aspect ${aspect}`, () => {
      const layout = layoutFor(aspect)
      let previous: SheetCameraPose | null = null
      let maxAngularStep = 0
      for (let i = 0; i <= 800; i += 1) {
        const t = 0.35 + (i / 800) * 0.45
        const current = introCameraPose(layout, aspect, t, pose())
        if (previous) {
          // Normalised by camera distance so the bound holds at both aspect framings.
          maxAngularStep = Math.max(maxAngularStep, current.position.distanceTo(previous.position) / current.distance)
        }
        previous = current
      }
      expect(maxAngularStep).toBeLessThan(0.01)
    })
  }
})
