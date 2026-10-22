import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { makeDrawingLayout } from '../drawing/drawingGeometry'
import { sampleOpeningCamera, SHATTER_ORBIT_END, SHATTER_ORBIT_START } from './OpeningCamera'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'

const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 })
describe('private opening camera handoff', () => {
  for (const aspect of [1440 / 900, 390 / 844]) {
    const layout = makeDrawingLayout(aspect, new Box3(new Vector3(-0.4, -0.25, 0), new Vector3(0.4, 0.25, 0.012)))
    it(`preserves drafting/rake and matches overview at aspect ${aspect}`, () => {
      for (const p of [0, 0.15, 0.395, 0.42, 0.43]) {
        const a = sampleOpeningCamera(layout, aspect, p, pose()), b = introCameraPose(layout, aspect, openingTimeAt(p), pose())
        expect(a.position.distanceTo(b.position)).toBe(0)
        expect(a.target.distanceTo(b.target)).toBe(0)
      }
      const end = sampleOpeningCamera(layout, aspect, 0.46, pose())
      expect(end.position.toArray()).toEqual([0.32, 0.16, 0.42])
      expect(end.target.length()).toBe(0)
      expect(end.fov).toBe(aspect < 0.8 ? 58 : 42)
    })
    it(`makes one complete low orbit before the overview handoff at aspect ${aspect}`,()=>{
      let previous: SheetCameraPose | null = null, azimuth = 0
      const unwrap = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))
      for (let i = 0; i <= 512; i++) {
        const p = SHATTER_ORBIT_START + (SHATTER_ORBIT_END - SHATTER_ORBIT_START) * i / 512
        const current = sampleOpeningCamera(layout, aspect, p, pose())
        if (previous) {
          const a = Math.atan2(previous.position.x - previous.target.x, previous.position.z - previous.target.z)
          const b = Math.atan2(current.position.x - current.target.x, current.position.z - current.target.z)
          azimuth += unwrap(b - a)
        }
        previous = current
      }
      // A complete revolution plus the small azimuth difference to the settled
      // overview endpoint.
      expect(Math.abs(azimuth)).toBeGreaterThanOrEqual(Math.PI * 2)
      expect(Math.abs(azimuth)).toBeLessThan(Math.PI * 2 + 0.05)
      const end = sampleOpeningCamera(layout, aspect, SHATTER_ORBIT_END, pose())
      expect(end.position.toArray()).toEqual([0.32, 0.16, 0.42])
      expect(end.target.length()).toBe(0)
    })
    it(`has no endpoint snap or first-derivative mismatch at aspect ${aspect}`, () => {
      const h = 1e-7
      for (const p of [SHATTER_ORBIT_START, SHATTER_ORBIT_END]) {
        const a = sampleOpeningCamera(layout, aspect, p - h, pose()), c = sampleOpeningCamera(layout, aspect, p + h, pose())
        expect(a.position.distanceTo(c.position) / Math.max(a.distance, c.distance)).toBeLessThan(2e-5)
        expect(Math.abs(a.fov - c.fov)).toBeLessThan(1e-4)
      }
    })
  }
})
