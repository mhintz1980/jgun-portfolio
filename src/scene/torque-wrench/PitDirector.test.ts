import { expect, it } from 'vitest'
import { samplePit } from './PitDirector'
it('reveals only through actual fracture and seeks/reverses without state', () => {
  expect(samplePit(0.84, 0).visible).toBe(false)
  const open = samplePit(0.87, 0.4)
  expect(open.reveal).toBe(0.4)
  samplePit(1, 1)
  expect(samplePit(0.87, 0.4)).toEqual(open)
  expect(samplePit(0.8, 0).reveal).toBe(0)
  expect(() => samplePit(NaN, 0)).toThrow()
})
