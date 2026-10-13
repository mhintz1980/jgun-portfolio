import { describe, expect, it } from 'vitest'
import { TORQUE_PHASE_BUDGETS, validateTorquePerformanceRoster, validateTorquePerformanceSample } from './torque-verification-contract.mjs'

function sample(phase = 'drafting', viewportCase = 'D', requestedTier = 'full', run = 1) {
  return {
    phase, viewportCase, requestedTier, effectiveTier: requestedTier, run,
    runId: `${viewportCase}/${requestedTier}/${run}`, device: 'named fixture device', os: 'fixture OS',
    browser: 'fixture Chrome', renderer: 'fixture hardware renderer', backend: 'fixture backend', power: 'AC',
    inputScript: 'phase fixture', sourceHash: 'fixture source', buildHash: 'fixture build', assetHash: 'fixture assets', servedHash: 'fixture served',
    qualityLock: false, hardwareGL: true, captureActive: false, throttled: false, refreshHz: 60,
    observationSeconds: 60, prewarmComplete: true, ready: true,
    phaseInput: { forwardSeconds: 20, reverseSeconds: 20, holdSeconds: 20 },
    dpr: 1, pixels: 1000000, p50: 16.7, p95: 19, p99: 25, tailPercent: 0.5, maximum: 40,
    peakFrameCalls: 100, peakFrameTriangles: 100000, residentTextureTargetMiB: 64,
    allPassTotals: true, memoryMethod: 'fixture format/dimension/mips/faces/depth/MSAA estimate', geometryBufferBytes: 1000000,
    lineSegments: 100, points: 0, programCreationObserved: true, newWarmPrograms: 0, instrumentationOverheadMs: 0.1,
  }
}

describe('approved torque performance contract, synthetic validator fixtures only', () => {
  it('requires every observable before a sample can pass', () => {
    expect(validateTorquePerformanceSample(sample()).pass).toBe(true)
    const incomplete = { ...sample(), memoryMethod: undefined, programCreationObserved: false }
    expect(validateTorquePerformanceSample(incomplete).pass).toBe(false)
    expect(validateTorquePerformanceSample(incomplete).unverified).toHaveLength(2)
  })
  it('keeps failed full expectations, quality locks and software GL visible', () => {
    const result = validateTorquePerformanceSample({ ...sample(), effectiveTier: 'lite', qualityLock: true, hardwareGL: false })
    expect(result.pass).toBe(false)
    expect(result.errors).toHaveLength(3)
  })
  it('rejects a warm shader replacement even when net count is unchanged', () => {
    expect(validateTorquePerformanceSample({ ...sample(), newWarmPrograms: 1 }).pass).toBe(false)
  })
  it('enforces phase totals and frame tails independently', () => {
    const result = validateTorquePerformanceSample({ ...sample('close'), peakFrameCalls: 201, p95: 20.01 })
    expect(result.errors.some((e: string) => e.startsWith('peakFrameCalls'))).toBe(true)
    expect(result.errors.some((e: string) => e.startsWith('p95'))).toBe(true)
  })
  it('cannot pass an empty/incomplete/duplicate/identity-mixed roster', () => {
    expect(validateTorquePerformanceRoster([]).pass).toBe(false)
    const reports = []
    for (const v of ['D', 'N']) for (const t of ['full', 'lite']) for (const run of [1, 2, 3]) {
      for (const phase of Object.keys(TORQUE_PHASE_BUDGETS)) reports.push(sample(phase, v, t, run))
    }
    expect(validateTorquePerformanceRoster(reports).pass).toBe(true)
    expect(validateTorquePerformanceRoster([...reports, reports[0]]).pass).toBe(false)
    expect(validateTorquePerformanceRoster(reports.slice(1)).pass).toBe(false)
    expect(validateTorquePerformanceRoster(reports.map((r, i) => i ? r : { ...r, buildHash: 'different' })).pass).toBe(false)
  })
})
