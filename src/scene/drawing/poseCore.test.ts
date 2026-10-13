import { afterEach, describe, expect, it, vi } from 'vitest'
import { Box3, BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import { SIDE_ROTATION, type DrawingGeometry, type DrawingLayout } from './drawingGeometry'
import {
  applyExtractionCore, bindExtractionPressure, createExtractionContext,
  lowestVertex, relativePose, solveExtraction,
} from './poseCore'
import { clearPaperFlexField, makePaperFlexField, type PaperFlexField } from './sheet/paperFlex'

const resources: Array<() => void> = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const dispose of resources.splice(0)) dispose()
})

function fixture(center = new Vector3()) {
  const points = [
    [-0.14, 0, 0.02], [0, 0, 0.02], [0.14, 0, 0.02],
    [-0.14, 0.045, 0.019], [0.14, -0.045, 0.019],
    [-0.14, 0, -0.04], [0.14, 0, -0.04],
  ]
  const inverse = SIDE_ROTATION.clone().invert()
  const positions = points.flatMap(p => new Vector3(...p as [number, number, number]).applyMatrix4(inverse).toArray())
  const attribute = new Float32BufferAttribute(positions, 3)
  const geometry = new BufferGeometry().setAttribute('position', attribute)
  const data: DrawingGeometry = {
    geometry, bounds: new Box3().setFromBufferAttribute(attribute),
    features: {}, units: {}, rigCenter: new Vector3(), sourceTriangles: 0,
  }
  const layout: DrawingLayout = {
    width: 0.8, height: 0.5, primaryRotation: SIDE_ROTATION, primaryCenter: center,
    views: [], fitDistance: 1, narrow: false, sectionLineY: 0,
  }
  const field = makePaperFlexField(
    [[-0.15, -0.05], [0.15, -0.05], [0.15, 0.05], [-0.15, 0.05]], 0.8, 0.5)
  resources.push(() => { clearPaperFlexField(field); field.texture.dispose(); geometry.dispose() })
  return { data, layout, field, extraction: solveExtraction(data, layout) }
}

function expectTrueCrossing(data: DrawingGeometry, layout: DrawingLayout, extraction: ReturnType<typeof solveExtraction>) {
  const matrix = relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ,
    new Matrix4(), extraction.clearanceTravel, extraction.pressureTravel)
  expect(lowestVertex(data, matrix).z).toBeCloseTo(0, 10)
}

describe('explicit extraction inputs', () => {
  for (const tier of ['full', 'lite']) {
    it(`resets ${tier} -> null without scanning, then rebinds the same field`, () => {
      const { data, layout, field, extraction } = fixture()
      const out = createExtractionContext()
      const restCrossing = extraction.crossing
      applyExtractionCore(0.5, layout, extraction, field, tier, out)
      const bound = { travel: extraction.pressureTravel, crossing: extraction.crossing }
      expect(bound.travel).toBeGreaterThan(0)
      expectTrueCrossing(data, layout, extraction)
      const scan = vi.spyOn(data.geometry, 'getAttribute')
      const sample = vi.spyOn(field, 'sample')
      applyExtractionCore(0.5, layout, extraction, null, tier, out)
      expect(scan).not.toHaveBeenCalled()
      expect(sample).not.toHaveBeenCalled()
      expect(extraction.pressureTravel).toBe(0)
      expect(extraction.modelPush).toBe(0)
      expect(extraction.crossing).toBeCloseTo(restCrossing, 12)
      applyExtractionCore(0.5, layout, extraction, field, tier, out)
      expect(scan).toHaveBeenCalledOnce()
      expect(sample).toHaveBeenCalledTimes(data.geometry.getAttribute('position').count)
      expect(extraction.pressureTravel).toBe(bound.travel)
      expect(extraction.crossing).toBe(bound.crossing)
      expectTrueCrossing(data, layout, extraction)
    })
  }

  it('switches full/lite/poster on one field without another vertex scan or cumulative drift', () => {
    const { data, layout, field, extraction } = fixture()
    bindExtractionPressure(extraction, layout, field, 'full')
    const full = { travel: extraction.pressureTravel, crossing: extraction.crossing }
    const scan = vi.spyOn(data.geometry, 'getAttribute')
    const sample = vi.spyOn(field, 'sample')
    bindExtractionPressure(extraction, layout, field, 'lite')
    expect(extraction.pressureTravel).toBeLessThan(full.travel)
    const lite = { travel: extraction.pressureTravel, crossing: extraction.crossing }
    bindExtractionPressure(extraction, layout, field, 'poster')
    expect(extraction.pressureTravel).toBe(0)
    bindExtractionPressure(extraction, layout, field, 'full')
    expect(extraction.pressureTravel).toBe(full.travel)
    expect(extraction.crossing).toBe(full.crossing)
    bindExtractionPressure(extraction, layout, field, 'lite')
    expect(extraction.pressureTravel).toBe(lite.travel)
    expect(extraction.crossing).toBe(lite.crossing)
    expect(scan).not.toHaveBeenCalled()
    expect(sample).not.toHaveBeenCalled()
    expectTrueCrossing(data, layout, extraction)
  })

  it('recomputes for a different field rather than retaining the previous pressure bound', () => {
    const { layout, field, extraction } = fixture()
    const sample = vi.fn(() => 0)
    const flat: PaperFlexField = { ...field, sample }
    bindExtractionPressure(extraction, layout, field, 'full')
    const full = extraction.pressureTravel
    bindExtractionPressure(extraction, layout, flat, 'full')
    expect(sample).toHaveBeenCalledTimes(7)
    expect(extraction.pressureTravel).toBeLessThan(full)
    bindExtractionPressure(extraction, layout, field, 'full')
    expect(extraction.pressureTravel).toBe(full)
  })

  it('keeps separate contexts stable while another consumer publishes and applies a field', () => {
    const a = fixture(), b = fixture(new Vector3(0.08, -0.02, 0))
    const ca = createExtractionContext(), cb = createExtractionContext()
    expect(ca.modelMatrix).not.toBe(cb.modelMatrix)
    expect(ca.sheetMatrix).not.toBe(cb.sheetMatrix)
    const minA = applyExtractionCore(0.48, a.layout, a.extraction, a.field, 'full', ca)
    const modelA = ca.modelMatrix.elements.slice(), sheetA = ca.sheetMatrix.elements.slice()
    const pushA = a.extraction.modelPush
    applyExtractionCore(0.85, b.layout, b.extraction, null, 'lite', cb)
    expect(ca.modelMatrix.elements).toEqual(modelA)
    expect(ca.sheetMatrix.elements).toEqual(sheetA)
    expect(a.extraction.modelPush).toBe(pushA)
    expect(b.extraction.pressureTravel).toBe(0)
    expect(applyExtractionCore(0.48, a.layout, a.extraction, a.field, 'full', ca)).toBe(minA)
    expect(ca.modelMatrix.elements).toEqual(modelA)
    expect(ca.sheetMatrix.elements).toEqual(sheetA)
  })
})
