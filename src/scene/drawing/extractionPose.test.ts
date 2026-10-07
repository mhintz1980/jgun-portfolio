import { describe, expect, it } from 'vitest'
import { Box3, BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three'
import { SIDE_ROTATION, type DrawingGeometry, type DrawingLayout } from './drawingGeometry'
import { applyExtraction, bindExtractionPressure, extractionLift, lowestVertex, relativePose, solveExtraction } from './extractionPose'
import { DRAWING_INTRO_WINDOW, drawingIntroState, introPoseTime, introScrollTimeFor } from './introTimeline'
import { makePaperFlexField, paperFlexAmplitude } from './sheet/paperFlex'

// Different surface heights near the soft field shoulder exercise the limiting
// vertex. A peak-only bound would let that shoulder vertex pierce intact stock.
function fixture() {
  const sheetPoints = [
    [-0.14, 0, 0.02], [0, 0, 0.02], [0.14, 0, 0.02],
    [-0.14, 0.045, 0.019], [0.14, -0.045, 0.019],
    [-0.14, 0, -0.04], [0.14, 0, -0.04],
  ]
  const inv = SIDE_ROTATION.clone().invert()
  const positions = sheetPoints.flatMap(p => new Vector3(...p as [number, number, number]).applyMatrix4(inv).toArray())
  const attribute = new Float32BufferAttribute(positions, 3)
  const geometry = new BufferGeometry().setAttribute('position', attribute)
  const data: DrawingGeometry = { geometry, bounds: new Box3().setFromBufferAttribute(attribute), features: {}, units: {}, sourceTriangles: 0 }
  const layout: DrawingLayout = { width: 0.8, height: 0.5, primaryRotation: SIDE_ROTATION, primaryCenter: new Vector3(), views: [], fitDistance: 1, narrow: false, sectionLineY: 0 }
  const field = makePaperFlexField([[-0.15, -0.05], [0.15, -0.05], [0.15, 0.05], [-0.15, 0.05]], 0.8, 0.5)
  const extraction = solveExtraction(data, layout)
  return { data, layout, field, extraction }
}

describe('model-driven paper rupture', () => {
  for (const tier of ['full', 'lite'] as const) {
    it(`tracks the intact ${tier} bulge without intersecting any opaque stock vertex`, () => {
      const { data, layout, field, extraction } = fixture()
      bindExtractionPressure(extraction, layout, field, tier)
      expect(extraction.initialTop).toBeCloseTo(-0.0006, 9)
      expect(extraction.pressureTravel).toBeGreaterThan(0.001)
      expect(extraction.pressureTravel).toBeLessThanOrEqual(tier === 'lite' ? 0.0054 : 0.012)
      const matrix = new Matrix4()
      const a = data.geometry.getAttribute('position')
      let previous = 0
      for (let i = 0; i <= 200; i += 1) {
        const t = 0.79 + i / 200 * 0.05
        const poseT = introPoseTime(t)
        const lift = extractionLift(poseT, extraction.travel, extraction.pressureTravel)
        expect(lift).toBeGreaterThanOrEqual(previous)
        previous = lift
        relativePose(poseT, layout, extraction.travel, extraction.initialZ, matrix, extraction.clearanceTravel, extraction.pressureTravel)
        const amplitude = paperFlexAmplitude(t, poseT, extraction.crossing, tier)
        for (let j = 0; j < a.count; j += 1) {
          const p = new Vector3().fromBufferAttribute(a, j).applyMatrix4(matrix)
          expect(p.z).toBeLessThanOrEqual(amplitude * field.sample(p.x, p.y) - 0.000275 + 1e-10)
        }
      }
      const rupture = drawingIntroState(0.84 * DRAWING_INTRO_WINDOW.releaseEnd, extraction.crossing)
      expect(rupture.pbr).toBe(1)
      expect(rupture.illumination).toBe(0)
      expect(extraction.initialTop + previous).toBeGreaterThan(0)
      const firstGap = extractionLift(introPoseTime(0.845), extraction.travel, extraction.pressureTravel)
      // A meaningful shell section is already present on the first capture,
      // rather than a stationary tool waiting below an empty opening until .89.
      expect(firstGap - previous).toBeGreaterThan(0.01)
      field.texture.dispose(); data.geometry.dispose()
    })
  }

  it('continues monotonically across rupture, solves true clearance and hands off at identity', () => {
    const { data, layout, field, extraction } = fixture()
    const model = new Matrix4(), sheet = new Matrix4(), matrix = new Matrix4()
    let previous = -Infinity
    for (let i = 0; i <= 800; i += 1) {
      const t = 0.79 + i / 800 * 0.21
      applyExtraction(introPoseTime(t), layout, extraction, model, sheet, 'full')
      expect(extraction.modelPush).toBeGreaterThanOrEqual(previous - 1e-12)
      expect(extraction.modelTop).toBeCloseTo(extraction.initialTop + extraction.modelPush, 12)
      expect(extraction.modelPush).toBeCloseTo(new Matrix4().multiplyMatrices(sheet.clone().invert(), model).elements[14] - extraction.initialZ, 12)
      previous = extraction.modelPush
    }
    const push = (t: number) => extractionLift(introPoseTime(t), extraction.travel, extraction.pressureTravel)
    expect(push(0.84 + 1e-9) - push(0.84 - 1e-9)).toBeLessThan(1e-6)
    relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, matrix, extraction.clearanceTravel, extraction.pressureTravel)
    expect(lowestVertex(data, matrix).z).toBeCloseTo(0, 10)
    expect(introScrollTimeFor(extraction.crossing)).toBeGreaterThan(0.84)
    expect(model.elements).toEqual(new Matrix4().elements)
    // Tier changes and returning to full must recompute from the fixed rest
    // support rather than accumulate errors from the previous crossing.
    const fullCrossing = extraction.crossing
    applyExtraction(extraction.crossing, layout, extraction, model, sheet, 'lite')
    relativePose(extraction.crossing, layout, extraction.travel, extraction.initialZ, matrix, extraction.clearanceTravel, extraction.pressureTravel)
    expect(lowestVertex(data, matrix).z).toBeCloseTo(0, 10)
    applyExtraction(extraction.crossing, layout, extraction, model, sheet, 'full')
    expect(extraction.crossing).toBeCloseTo(fullCrossing, 12)
    field.texture.dispose(); data.geometry.dispose()
  })

  it('keeps proof and reduced-motion poses below the flat sheet even with a bound flex field', () => {
    const { data, layout, field, extraction } = fixture()
    const model = new Matrix4(), sheet = new Matrix4()
    for (const poseT of [0, introPoseTime(0.38)]) {
      applyExtraction(poseT, layout, extraction, model, sheet, 'full')
      expect(extraction.modelPush).toBe(0)
      expect(extraction.modelTop).toBeCloseTo(-0.0006, 9)
    }
    field.texture.dispose(); data.geometry.dispose()
  })
})
