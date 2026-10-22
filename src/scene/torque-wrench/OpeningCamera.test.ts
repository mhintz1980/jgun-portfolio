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
      // One complete revolution, within the small azimuth difference to the settled overview endpoint.
      expect(Math.abs(azimuth)).toBeGreaterThan(Math.PI * 2 - 0.05)
      expect(Math.abs(azimuth)).toBeLessThan(Math.PI * 2 + 0.05)
      const end = sampleOpeningCamera(layout, aspect, SHATTER_ORBIT_END, pose())
      expect(end.position.toArray()).toEqual([0.32, 0.16, 0.42])
      expect(end.target.length()).toBe(0)
    })
    it(`turns one direction from the rake through the full orbit at aspect ${aspect}`, () => {
      const unwrap = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))
      const az = (p: number) => { const c = sampleOpeningCamera(layout, aspect, p, pose()); return Math.atan2(c.position.x - c.target.x, c.position.z - c.target.z) }
      let prev = az(0.38), moved = 0
      for (let i = 1; i <= 2000; i++) {
        const p = 0.38 + (SHATTER_ORBIT_END - 0.38) * i / 2000
        const cur = az(p), d = unwrap(cur - prev)
        expect(d).toBeLessThanOrEqual(1e-9)
        moved += d; prev = cur
      }
      expect(moved).toBeLessThan(-Math.PI * 2)
    })
    it(`keeps angular velocity continuous at the orbit join at aspect ${aspect}`, () => {
      const unwrap = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))
      const az = (p: number) => { const c = sampleOpeningCamera(layout, aspect, p, pose()); return Math.atan2(c.position.x - c.target.x, c.position.z - c.target.z) }
      const h = 1e-5
      const before = unwrap(az(SHATTER_ORBIT_START - 1e-6) - az(SHATTER_ORBIT_START - 1e-6 - h)) / h
      const after = unwrap(az(SHATTER_ORBIT_START + 1e-6 + h) - az(SHATTER_ORBIT_START + 1e-6)) / h
      expect(Math.abs(after - before) / Math.max(1, Math.abs(before))).toBeLessThan(0.05)
    })
    it(`has no endpoint snap or first-derivative mismatch at aspect ${aspect}`, () => {
      const h = 1e-7
      for (const p of [SHATTER_ORBIT_START, SHATTER_ORBIT_END]) {
        const a = sampleOpeningCamera(layout, aspect, p - h, pose()), m = sampleOpeningCamera(layout, aspect, p, pose()), c = sampleOpeningCamera(layout, aspect, p + h, pose())
        // The orbit now enters with the rake's own velocity, so compare the one-sided steps instead of requiring a stall.
        const before = a.position.distanceTo(m.position), after = m.position.distanceTo(c.position)
        expect(Math.abs(after - before) / Math.max(a.distance, c.distance)).toBeLessThan(2e-5)
        if (p === SHATTER_ORBIT_END) expect(a.position.distanceTo(c.position) / Math.max(a.distance, c.distance)).toBeLessThan(2e-5)
        expect(Math.abs(a.fov - c.fov)).toBeLessThan(1e-4)
      }
    })
  }
})
