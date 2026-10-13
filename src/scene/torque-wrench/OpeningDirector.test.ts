import { expect, it } from 'vitest'
import { openingTimeAt, sampleOpening } from './OpeningDirector'

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
