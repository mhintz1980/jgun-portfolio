import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { makeDrawingLayout, SHEET_ROTATION } from './drawingGeometry'
import { INTRO_PHASES, REDUCED_MOTION_INTRO_T } from './introTimeline'
import { introCameraPose, PRESSURE_CAMERA_RAKE_START, PRESSURE_CAMERA_RAKE_END, sheetReveal, type SheetCameraPose } from './sheetCamera'
import { GROUP } from './sheet/ink'

const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 0, ortho: 0, distance: 0 })
const layoutFor = (aspect: number) => makeDrawingLayout(aspect, new Box3(new Vector3(-0.05, -0.04, -0.15), new Vector3(0.05, 0.04, 0.15)))
const sheetNormal = new Vector3(0, 0, 1).applyMatrix4(SHEET_ROTATION).normalize()
/** Elevation of the camera ray above the sheet plane in degrees (90 = square on). */
const elevationOf = (p: SheetCameraPose): number =>
  (Math.asin(p.position.clone().sub(p.target).normalize().dot(sheetNormal)) * 180) / Math.PI

describe('drafting camera', () => {
  it('finishes the technical print before profile excitation', () => {
    expect(sheetReveal(0.42, []).every((value) => value === 1)).toBe(true)
  })
  it('opens on clean vellum: nothing but the printed border is inked at scroll 0', () => {
    const reveal = sheetReveal(0, [])
    for (let g = 0; g < reveal.length; g += 1) if (g !== GROUP.printed) expect(reveal[g], 'group ' + g).toBe(0)
  })
  it('inks the side profile during the whole-sheet reveal instead of pre-filling it', () => {
    const at = (t: number) => sheetReveal(t, [])[GROUP.side]
    expect(at(0)).toBe(0)
    expect(at(0.29)).toBe(0)
    expect(at(0.33)).toBeGreaterThan(0)
    expect(at(0.33)).toBeLessThan(1)
    expect(at(0.41)).toBe(1)
  })
  for (const aspect of [16 / 9, 390 / 844]) {
    it(`holds the exact square-on registration through the pulse at aspect ${aspect}`, () => {
      const layout = layoutFor(aspect)
      const start = introCameraPose(layout, aspect, INTRO_PHASES.pulseStart, pose())
      expect(elevationOf(start)).toBeCloseTo(90, 9)
      expect(start.ortho).toBe(1)
      // The lit park, storm flicker, dark hold and electrical trace share the registered hold.
      for (const t of [0.45, INTRO_PHASES.flickerStart, 0.49, INTRO_PHASES.blackoutStart, INTRO_PHASES.pulseStart, PRESSURE_CAMERA_RAKE_START]) {
        const current = introCameraPose(layout, aspect, t, pose())
        expect(current.position.distanceTo(start.position)).toBeLessThan(1e-12)
        expect(current.target.distanceTo(start.target)).toBeLessThan(1e-12)
        expect(current.ortho).toBe(1)
        expect(elevationOf(current)).toBeCloseTo(90, 9)
      }
    })

    it(`holds the reduced-motion still and the lit park square-on and registered at aspect ${aspect}`, () => {
      const layout = layoutFor(aspect)
      const park = introCameraPose(layout, aspect, INTRO_PHASES.onboardEnd, pose())
      expect(elevationOf(park)).toBeCloseTo(90, 9)
      expect(park.ortho).toBe(1)
      for (const t of [REDUCED_MOTION_INTRO_T, INTRO_PHASES.flickerStart, 0.41]) {
        const current = introCameraPose(layout, aspect, t, pose())
        expect(current.position.distanceTo(park.position)).toBeLessThan(1e-12)
        expect(current.target.distanceTo(park.target)).toBeLessThan(1e-12)
        expect(current.ortho).toBe(1)
        expect(elevationOf(current)).toBeCloseTo(90, 9)
      }
    })

    // Doc39 supersedes the static .79 hold / 58-degree rake with a low orbit.
    it(`descends ahead of rupture and orbits the shatter low at aspect ${aspect}`, () => {
      const layout=layoutFor(aspect)
      const held=introCameraPose(layout,aspect,PRESSURE_CAMERA_RAKE_START,pose())
      expect(elevationOf(held)).toBeCloseTo(90,9);expect(held.ortho).toBe(1)
      const early=introCameraPose(layout,aspect,.76,pose())
      expect(early.position.distanceTo(held.position)).toBeGreaterThan(.01)
      const low=introCameraPose(layout,aspect,PRESSURE_CAMERA_RAKE_END,pose())
      expect(elevationOf(low)).toBeCloseTo(22,9);expect(low.ortho).toBe(0)
      const end=introCameraPose(layout,aspect,.9,pose())
      expect(elevationOf(end)).toBeCloseTo(18,9)
      const inverse=SHEET_ROTATION.clone().invert()
      const offset=(p:SheetCameraPose)=>p.position.clone().sub(p.target).transformDirection(inverse)
      const a=offset(low),b=offset(end)
      expect(Math.acos(a.dot(b))*180/Math.PI).toBeGreaterThan(55)
      for(const t of [.84,.855,.87,.885,.9,1]){
        const current=introCameraPose(layout,aspect,t,pose())
        expect(elevationOf(current)).toBeLessThanOrEqual(22+1e-8)
        expect(elevationOf(current)).toBeGreaterThanOrEqual(18-1e-8)
        expect(current.target.distanceTo(held.target)).toBeLessThan(1e-12)
        expect(current.distance).toBeCloseTo(held.distance,12)
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
      for (const boundary of [INTRO_PHASES.registrationEnd, PRESSURE_CAMERA_RAKE_END]) {
        const left = introCameraPose(layout, aspect, boundary - 1e-7, pose())
        const right = introCameraPose(layout, aspect, boundary + 1e-7, pose())
        expect(left.position.distanceTo(right.position) / right.distance).toBeLessThan(1e-8)
        expect(Math.abs(left.ortho - right.ortho)).toBeLessThan(1e-8)
      }
    })
  }
})
