import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { makeDrawingLayout } from '../drawing/drawingGeometry'
import { sampleOpeningCamera } from './OpeningCamera'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'

const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 })
describe('private opening camera handoff', () => {
  for (const aspect of [1440 / 900, 390 / 844]) {
    const layout = makeDrawingLayout(aspect, new Box3(new Vector3(-0.4, -0.25, 0), new Vector3(0.4, 0.25, 0.012)))
    it(`preserves drafting/rake and matches overview at aspect ${aspect}`, () => {
      for (const p of [0, 0.15, 0.395, 0.42, 0.435]) {
        const a = sampleOpeningCamera(layout, aspect, p, pose()), b = introCameraPose(layout, aspect, openingTimeAt(p), pose())
        expect(a.position.distanceTo(b.position)).toBe(0)
        expect(a.target.distanceTo(b.target)).toBe(0)
      }
      const end = sampleOpeningCamera(layout, aspect, 0.46, pose())
      expect(end.position.toArray()).toEqual([0.32, 0.16, 0.42])
      expect(end.target.length()).toBe(0)
      expect(end.fov).toBe(aspect < 0.8 ? 58 : 42)
    })
    it(`has no endpoint snap or first-derivative mismatch at aspect ${aspect}`, () => {
      const h = 1e-6
      for (const p of [0.435, 0.46]) {
        const a = sampleOpeningCamera(layout, aspect, p - h, pose()), b = sampleOpeningCamera(layout, aspect, p, pose()), c = sampleOpeningCamera(layout, aspect, p + h, pose())
        expect(a.position.distanceTo(c.position)).toBeLessThan(1e-7)
        expect(b.position.clone().sub(a.position).sub(c.position.clone().sub(b.position)).length() / h).toBeLessThan(0.01)
        expect(Math.abs(a.fov - c.fov)).toBeLessThan(1e-5)
      }
    })
  }
})
