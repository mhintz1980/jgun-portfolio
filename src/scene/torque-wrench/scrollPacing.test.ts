import { expect, it } from 'vitest'
import { torqueScrollFraction as physical, torqueNarrativeProgress as narrative,
  TORQUE_PACING_SCALE, TORQUE_PACING_SPANS } from './scrollPacing'

it('doubles selected physical spans, preserving the entire close distance', () => {
  for (const span of TORQUE_PACING_SPANS) {
    expect((physical(span.end) - physical(span.start)) * TORQUE_PACING_SCALE)
      .toBeCloseTo(2 * (span.end - span.start), 12)
  }
  expect((physical(1) - physical(.94)) * TORQUE_PACING_SCALE).toBeCloseTo(.06, 12)
})
it('inverts monotone seeks in both directions with continuous boundary speed', () => {
  let prior = -1
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000, f = physical(p)
    expect(f).toBeGreaterThan(prior)
    expect(narrative(f)).toBeCloseTo(p, 10)
    prior = f
  }
  for (const span of TORQUE_PACING_SPANS) for (const p of [span.start, span.end]) {
    const h = 1e-5
    expect((physical(p) - physical(p - h)) / h)
      .toBeCloseTo((physical(p + h) - physical(p)) / h, 5)
  }
  expect(narrative(0)).toBe(0); expect(narrative(1)).toBe(1)
  expect(() => narrative(NaN)).toThrow()
})
