import { expect, it } from 'vitest'
import { breakthroughTimeAt, createOpeningSampler, openingTimeAt, sampleOpening } from './OpeningDirector'

it('suspends breakthrough physics while the continuous camera path keeps moving', () => {
  const a = .868, b = .922
  expect(breakthroughTimeAt(b) - breakthroughTimeAt(a)).toBeLessThan((b - a) * .15)
  expect(breakthroughTimeAt(.84)).toBe(.84)
  expect(breakthroughTimeAt(1)).toBe(1)
  const times = [.84, .85, .86, .89, .93, .95, .99, 1]
  const forward = times.map(breakthroughTimeAt)
  expect(times.slice().reverse().map(breakthroughTimeAt).reverse()).toEqual(forward)
  expect(forward.every((t, i) => !i || t >= forward[i - 1])).toBe(true)
})

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
