import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import {
  buildHexInlayGeometry,
  buildHexPlateGeometry,
  buildHexRimGeometry,
  buildMGeometry,
  buildMNeonGeometry,
  buildMobiusGeometry,
  buildMobiusInnerMBaseGeometry,
  buildMobiusInnerSMGeometry,
  buildPlanetaryCrownRingGeometry,
  buildPrismMonolithGeometry,
  buildSNeonGeometry,
  buildSStrokeGeometry,
} from './smGeometries'

describe('SM monogram geometries', () => {
  const builders = {
    mobiusRing: buildMobiusGeometry,
    mobiusSM: buildMobiusInnerSMGeometry,
    mobiusMBase: buildMobiusInnerMBaseGeometry,
    hexPlate: buildHexPlateGeometry,
    hexRim: buildHexRimGeometry,
    hexInlay: buildHexInlayGeometry,
    sChamfer: () => buildSStrokeGeometry({ chamfer: 0.05 }),
    sCrest: () => buildSStrokeGeometry({ crest: true }),
    m: () => buildMGeometry(),
    mNeon: () => buildMNeonGeometry(),
    sNeon: () => buildSNeonGeometry(),
    planetaryCrown: buildPlanetaryCrownRingGeometry,
    prismMonolith: buildPrismMonolithGeometry,
  }
  for (const [name, build] of Object.entries(builders)) {
    it(`${name} has finite, non-empty, bounded vertices`, () => {
      const g = build()
      const pos = g.getAttribute('position')
      expect(pos.count).toBeGreaterThan(50)
      for (let i = 0; i < pos.array.length; i++) expect(Number.isFinite(pos.array[i])).toBe(true)
      g.computeBoundingBox()
      const size = g.boundingBox!.getSize(new Vector3())
      expect(Math.max(size.x, size.y, size.z)).toBeLessThan(4)
    })
  }
})
