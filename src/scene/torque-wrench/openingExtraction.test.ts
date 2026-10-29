import { expect, it } from 'vitest'
import { Matrix4, Vector3 } from 'three'
import { SHEET_NORMAL_WORLD, SHEET_ROTATION, SIDE_ROTATION, type DrawingLayout } from '../drawing/drawingGeometry'
import { applyExtractionCore, createExtractionContext, extractionLift, relativePose, type Extraction } from '../drawing/poseCore'
import { sampleOpening } from './OpeningDirector'
import { applyOpeningExtractionCore } from './openingExtraction'

/** Already-bound extraction with an exact support crossing, including pressure
 * travel. Off-centre layout catches omissions of the sheet's in-plane release.
 */
function fixture(crossing: number) {
  const travel = 0.22, pressureTravel = 0.006
  const support = new Vector3(0, -0.005, 0)
  const initialZ = -support.y - extractionLift(crossing, travel, pressureTravel)
  const extraction: Extraction = {
    travel, pressureTravel, initialZ, crossing, support: [support],
    clearanceTravel: -support.y - initialZ + 0.0006,
    contact: new Vector3(), initialTop: -0.0006,
    modelTop: -0.0006, modelPush: 0, pressureClearance: 0.000325,
  }
  const layout: DrawingLayout = {
    width: 0.8, height: 0.5, primaryCenter: new Vector3(-0.11, 0.07, 0),
    primaryRotation: SIDE_ROTATION, views: [], fitDistance: 1, narrow: false, sectionLineY: 0,
  }
  return { extraction, layout, support }
}

it.each([0.6, 0.865, 0.9])('ascends in world and against a fixed sheet frame with full clearance, crossing %s', crossing => {
  const { extraction, layout, support } = fixture(crossing)
  const out = createExtractionContext(), legacy = createExtractionContext()
  const anchoredSheetInverse = SHEET_ROTATION.clone().invert()
  const endSheetInverse = new Matrix4()
  applyOpeningExtractionCore(1, layout, extraction, null, 'full', out)
  endSheetInverse.copy(out.sheetMatrix).invert()
  const bottom = new Vector3(), anchoredBottom = new Vector3(), endpointBottom = new Vector3()
  let worldHeight = -Infinity, anchoredHeight = -Infinity, clearance = -Infinity, legacyHeight = -Infinity
  let legacyReversals = 0
  for (let n = 0; n <= 2000; n++) {
    const p = 0.42 + 0.04 * n / 2000, pose = sampleOpening(p, crossing).poseT
    const minZ = applyOpeningExtractionCore(pose, layout, extraction, null, 'full', out)
    bottom.copy(support).applyMatrix4(out.modelMatrix)
    anchoredBottom.copy(bottom).applyMatrix4(anchoredSheetInverse)
    endpointBottom.copy(bottom).applyMatrix4(endSheetInverse)
    const height = bottom.dot(SHEET_NORMAL_WORLD)
    expect(height, 'world ascent at ' + p).toBeGreaterThan(worldHeight)
    expect(anchoredBottom.z, 'fixed sheet ascent at ' + p).toBeGreaterThan(anchoredHeight)
    expect(minZ, 'live sheet clearance at ' + p).toBeGreaterThan(clearance)
    if (p >= 0.452) expect(minZ).toBeGreaterThan(0)
    worldHeight = height; anchoredHeight = anchoredBottom.z; clearance = minZ

    // Exercise the actual composed matrices: the private correction must preserve
    // the authored relative pose, rather than merely making poseT monotone.
    const actualRelative = out.sheetMatrix.clone().invert().multiply(out.modelMatrix)
    const expectedRelative = relativePose(pose, layout, extraction.travel, extraction.initialZ,
      new Matrix4(), extraction.clearanceTravel, extraction.pressureTravel)
    for (let i = 0; i < 16; i++) expect(actualRelative.elements[i]).toBeCloseTo(expectedRelative.elements[i], 12)
    expect(bottom.clone().applyMatrix4(out.sheetMatrix.clone().invert()).z).toBeCloseTo(minZ, 12)

    applyExtractionCore(pose, layout, extraction, null, 'full', legacy)
    const legacyCurrent = support.clone().applyMatrix4(legacy.modelMatrix).dot(SHEET_NORMAL_WORLD)
    if (legacyCurrent < legacyHeight - 1e-10) legacyReversals++
    legacyHeight = legacyCurrent
  }
  if (crossing === 0.6) expect(legacyReversals, 'fixture exposes the shared composed-path reversal').toBeGreaterThan(0)
  expect(endpointBottom.z).toBeGreaterThan(0)
  expect(out.modelMatrix.elements).toEqual(new Matrix4().elements)
  expect(out.sheetMatrix.elements).toEqual(legacy.sheetMatrix.elements)
})

it.each([0.6, 0.865, 0.9])('preserves shared matrices through .42 and exact endpoint/seek identity, crossing %s', crossing => {
  const { extraction, layout } = fixture(crossing)
  const out = createExtractionContext(), shared = createExtractionContext()
  for (let n = 0; n <= 420; n++) {
    const pose = sampleOpening(n * 0.001, crossing).poseT
    const actual = applyOpeningExtractionCore(pose, layout, extraction, null, 'full', out)
    const expected = applyExtractionCore(pose, layout, extraction, null, 'full', shared)
    expect(actual).toBe(expected)
    expect(out.modelMatrix.elements).toEqual(shared.modelMatrix.elements)
    expect(out.sheetMatrix.elements).toEqual(shared.sheetMatrix.elements)
  }
  const ps = [0.42, 0.43008, 0.452, 0.455, 0.459, 0.46, 1]
  const sample = (p: number) => {
    const clearance = applyOpeningExtractionCore(sampleOpening(p, crossing).poseT, layout, extraction, null, 'full', out)
    return { clearance, model: out.modelMatrix.toArray(), sheet: out.sheetMatrix.toArray() }
  }
  const forward = ps.map(sample)
  expect(ps.slice().reverse().map(sample).reverse()).toEqual(forward)
  expect(sample(0.46)).toEqual(sample(1))
})

it.each([0.6, 0.865, 0.9])('keeps composed world velocity C1 across the opening joins, crossing %s', crossing => {
  const { extraction, layout, support } = fixture(crossing)
  const out = createExtractionContext(), bottom = new Vector3()
  const height = (p: number) => {
    applyOpeningExtractionCore(sampleOpening(p, crossing).poseT, layout, extraction, null, 'full', out)
    return bottom.copy(support).applyMatrix4(out.modelMatrix).dot(SHEET_NORMAL_WORLD)
  }
  const h = 1e-8
  for (const p of [0.42, 0.43008, 0.452, 0.46]) {
    const left = (height(p) - height(p - h)) / h
    const right = (height(p + h) - height(p)) / h
    expect(Math.abs(left - right), 'world C1 at ' + p).toBeLessThan(0.001)
  }
})
