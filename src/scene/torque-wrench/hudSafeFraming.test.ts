import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { findLargestFreeNdcBox, solveViewportFraming, type SolveViewportInput } from '../../../scripts/solveHudSafeFraming'
import * as skillSolver from '../../../.agents/skills/r3f-cad-cinematography/scripts/solveHudSafeFraming'

// A volumetric subject: its front corners are three times nearer than its back.
const witnessesM = [-0.03, 0.03].flatMap(x =>
  [-0.05, 0.05].flatMap(y => [-0.2, 0.2].map(z => new Vector3(x, y, z))))
const viewports = [
  { width: 1440, height: 900, rects: [
    { min: [0, 0], max: [440, 900] },
    { min: [1100, 0], max: [1440, 200] },
  ] },
  { width: 390, height: 844, rects: [
    { min: [0, 0], max: [390, 180] },
    { min: [0, 640], max: [390, 844] },
  ] },
] as const
const inputFor = (viewport: SolveViewportInput['viewport']): SolveViewportInput => ({
  witnessesM, azimuthDeg: 90, elevationDeg: 0, distM: 0.4,
  up: [0, 1, 0], viewport,
})

// Independent oracle reconstructs a real camera solely from the public result.
function verifyProjection(input: SolveViewportInput) {
  const result = solveViewportFraming(input)
  const { viewport } = input
  const target = new Vector3(...result.tgtMm).multiplyScalar(0.001)
  const az = input.azimuthDeg * Math.PI / 180
  const el = input.elevationDeg * Math.PI / 180
  const camera = new PerspectiveCamera(result.fovDeg, viewport.width / viewport.height, 0.001, 30)
  camera.position.copy(target).addScaledVector(new Vector3(
    Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az),
  ), input.distM)
  camera.up.set(...input.up)
  camera.lookAt(target)
  camera.updateMatrixWorld(true)
  const ndc = input.witnessesM.map(p => p.clone().project(camera))
  const xs = ndc.map(p => (p.x + 1) * viewport.width / 2)
  const ys = ndc.map(p => (1 - p.y) * viewport.height / 2)
  const maxX = Math.max(...ndc.map(p => Math.abs(p.x)))
  const maxY = Math.max(...ndc.map(p => Math.abs(p.y)))
  for (const p of ndc) {
    expect(Math.abs(p.x)).toBeLessThanOrEqual(viewport.safeNdc ?? 0.84)
    expect(Math.abs(p.y)).toBeLessThanOrEqual(viewport.safeNdc ?? 0.84)
    expect(p.z).toBeGreaterThan(-1)
    expect(p.z).toBeLessThan(1)
  }
  const clearance = Math.min(...viewport.rects.map(rect => Math.max(
    rect.min[0] - Math.max(...xs), Math.min(...xs) - rect.max[0],
    rect.min[1] - Math.max(...ys), Math.min(...ys) - rect.max[1],
  )))
  expect(clearance).toBeGreaterThanOrEqual(viewport.minClearancePx ?? 8)
  expect(result.minRectClearancePx).toBeCloseTo(clearance, 10)
  expect(result.maxNdc[0]).toBeCloseTo(maxX, 10)
  expect(result.maxNdc[1]).toBeCloseTo(maxY, 10)
  return result
}

describe('skill-local HUD-safe framing', () => {
  it('re-exports the same implementation from the root scripts path', () => {
    expect(solveViewportFraming).toBe(skillSolver.solveViewportFraming)
    expect(findLargestFreeNdcBox).toBe(skillSolver.findLargestFreeNdcBox)
  })

  it.each(viewports)('fits 3D depth with 8px clearance and .84 NDC at $width x $height', viewport => {
    verifyProjection(inputFor(viewport))
  })

  it.each(viewports)('handles a rotated camera, Z up, and non-origin witnesses at $width x $height', viewport => {
    verifyProjection({ ...inputFor(viewport), azimuthDeg: 57, elevationDeg: 23,
      up: [0, 0, 1], distM: 1.4,
      witnessesM: witnessesM.map(p => p.clone().add(new Vector3(0.2, -0.3, 0.1))),
    })
  })

  it('fails closed when HUD coverage leaves no free box', () => {
    const viewport = { width: 390, height: 844, rects: [{ min: [0, 0], max: [390, 844] }] } as const
    expect(() => findLargestFreeNdcBox(viewport)).toThrow(/infeasible/i)
    expect(() => solveViewportFraming(inputFor(viewport))).toThrow(/infeasible/i)
  })

  it('rejects an insufficient FOV ceiling', () => {
    expect(() => solveViewportFraming({ ...inputFor(viewports[1]), maxFovDeg: 7 })).toThrow(/infeasible/i)
  })

  it('rejects witnesses behind the camera or outside its clipping range', () => {
    for (const z of [0.3995, 0.5, 40]) {
      expect(() => solveViewportFraming({ ...inputFor(viewports[0]),
        witnessesM: [new Vector3(0, 0, -z), new Vector3(0, 0, z)],
      })).toThrow(/infeasible/i)
    }
    expect(() => solveViewportFraming({ ...inputFor(viewports[0]), distM: 31 })).toThrow(/infeasible/i)
  })

  it.each(viewports)('preserves safety at full fill and a fixed FOV at $width x $height', viewport => {
    const result = verifyProjection({ ...inputFor(viewport), fillFactor: 1, minFovDeg: 58, maxFovDeg: 58 })
    expect(result.fovDeg).toBeCloseTo(58, 12)
  })

  it('returns exact metrics with no HUD and supports a single witness', () => {
    const result = verifyProjection({ ...inputFor({ width: 390, height: 844, rects: [] }),
      witnessesM: [new Vector3(0.2, -0.3, 0.1)],
    })
    expect(result.minRectClearancePx).toBe(Infinity)
  })

  it('fails closed for union coverage as well as one covering card', () => {
    expect(() => findLargestFreeNdcBox({ width: 390, height: 844, rects: [
      { min: [0, 0], max: [200, 844] }, { min: [190, 0], max: [390, 844] },
    ] })).toThrow(/infeasible/i)
  })

  it('keeps valid thin free boxes instead of imposing an arbitrary .25 NDC cutoff', () => {
    verifyProjection({ ...inputFor({ width: 1000, height: 1000, rects: [
      { min: [0, 0], max: [450, 1000] }, { min: [550, 0], max: [1000, 1000] },
    ] }), witnessesM: witnessesM.map(p => p.clone().multiplyScalar(0.01)) })
  })

  it('honors caller-provided safe-frame and clearance settings', () => {
    verifyProjection({ ...inputFor({ ...viewports[0], safeNdc: 0.7, minClearancePx: 20 }), distM: 0.8 })
  })

  it('rejects empty/nonfinite geometry, malformed viewports, and degenerate cameras', () => {
    const input = inputFor(viewports[0])
    const invalid: SolveViewportInput[] = [
      { ...input, witnessesM: [] },
      { ...input, witnessesM: [new Vector3(NaN, 0, 0)] },
      { ...input, up: [0, 0, 0] },
      { ...input, azimuthDeg: 0, elevationDeg: 0, up: [1, 0, 0] },
      { ...input, distM: 0 }, { ...input, azimuthDeg: Infinity },
      { ...input, fillFactor: 0 }, { ...input, fillFactor: 1.1 },
      { ...input, minFovDeg: 60 }, { ...input, maxFovDeg: 180 },
      { ...input, viewport: { ...input.viewport, width: 0 } },
      { ...input, viewport: { ...input.viewport, minClearancePx: -1 } },
      { ...input, viewport: { ...input.viewport, safeNdc: NaN } },
      { ...input, viewport: { ...input.viewport, rects: [{ min: [20, 0], max: [0, 20] }] } },
    ]
    for (const request of invalid) expect(() => solveViewportFraming(request)).toThrow(RangeError)
  })

  it('is deterministic and does not mutate owner input', () => {
    const input = inputFor(viewports[0])
    const before = witnessesM.map(p => p.toArray())
    const expected = solveViewportFraming(input)
    solveViewportFraming(inputFor(viewports[1]))
    expect(solveViewportFraming(input)).toEqual(expected)
    expect(witnessesM.map(p => p.toArray())).toEqual(before)
  })
})
