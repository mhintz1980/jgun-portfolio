import { expect, it } from 'vitest'
import { createOpeningSampler, openingTimeAt, sampleOpening } from './OpeningDirector'

it('aligns intact pressure, first rupture and completed emergence to canonical beats', () => {
  expect(openingTimeAt(0.395)).toBeCloseTo(0.79)
  expect(openingTimeAt(0.42)).toBeCloseTo(0.84)
  expect(openingTimeAt(0.46)).toBe(1)
  const samples = [0, .265, .32, .36, .395, .42, .435, .46, 1]
  const forward = samples.map(p => sampleOpening(p))
  expect(samples.slice().reverse().map(p => sampleOpening(p)).reverse()).toEqual(forward)
  expect(() => openingTimeAt(NaN)).toThrow()
  for (let i = 1; i < samples.length; i++) expect(forward[i].t).toBeGreaterThanOrEqual(forward[i - 1].t)
})

it('installs a solved crossing while progress is held, then freezes the exact sampled state', () => {
  const sample = createOpeningSampler()
  const progress = 0.435
  const fallback = sample(progress)
  expect(sample(progress)).toBe(fallback)
  const installed = sample(progress, 0.865)
  expect(installed).toEqual(sampleOpening(progress, 0.865))
  expect(installed).not.toBe(fallback) // crossing invalidates even when both waves have not begun
  const sensitiveProgress = Array.from({ length: 1001 }, (_, i) => i * 0.46 / 1000)
    .find(p => sampleOpening(p, 0.865).lightSweepPosition !== sampleOpening(p, 0.9).lightSweepPosition)
  expect(sensitiveProgress).toBeDefined()
  const beforeWave = sample(sensitiveProgress!, 0.9)
  const solvedWave = sample(sensitiveProgress!, 0.865)
  expect(solvedWave).not.toEqual(beforeWave)
  expect(solvedWave).toEqual(sampleOpening(sensitiveProgress!, 0.865))
  const heldAgain = sample(progress, 0.865)
  expect(heldAgain).toEqual(installed)
  expect(sample(progress, 0.865)).toBe(heldAgain)
  // Returning to the old crossing retraces its state without traversal history.
  expect(sample(progress, 0.9)).toEqual(fallback)
  expect(() => sample(NaN, 0.865)).toThrow()
  expect(sample(progress, 0.9)).toEqual(fallback)
})
