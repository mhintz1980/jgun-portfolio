import { describe, expect, it } from 'vitest'
import { Box3, Vector3 } from 'three'
import { makeDrawingLayout } from './drawingGeometry'
import { introCameraPose, sheetReveal, type SheetCameraPose } from './sheetCamera'

const pose = (): SheetCameraPose => ({ position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 0, ortho: 0, distance: 0 })

describe('drafting camera', () => {
  it('finishes the technical print before profile excitation', () => {
    expect(sheetReveal(0.4, []).every((value) => value === 1)).toBe(true)
  })
  for (const aspect of [16 / 9, 390 / 844]) {
    it(`holds exact registration at aspect ${aspect}`, () => {
      const layout = makeDrawingLayout(aspect, new Box3(new Vector3(-0.05, -0.04, -0.15), new Vector3(0.05, 0.04, 0.15)))
      const start = introCameraPose(layout, aspect, 0.4, pose())
      for (const t of [0.45, 0.6, 0.72, 1, 0.5]) {
        const current = introCameraPose(layout, aspect, t, pose())
        expect(current.position.distanceTo(start.position)).toBeLessThan(1e-12)
        expect(current.target.distanceTo(start.target)).toBeLessThan(1e-12)
        expect(current.ortho).toBe(1)
      }
    })
  }
})
