import { describe, expect, it } from 'vitest'
import { measureProfileRegistration } from './registration'

describe('pulse registration against independent ink segments', () => {
  const side = [0, 0, 1, 0, 0.001, 12, 0, 1, 0]
  it('detects a shifted profile and excludes other drawing groups', () => {
    const segments = [...side, 0, 0.2, 1, 0.2, 0.001, 3, 0, 1, 0]
    expect(measureProfileRegistration([[0, 0], [0.5, 0], [1, 0]], segments, 12).maxDistance).toBe(0)
    const shifted = measureProfileRegistration([[0, 0.2], [0.5, 0.2], [1, 0.2]], segments, 12)
    expect(shifted.maxDistance).toBeCloseTo(0.2)
    expect(shifted.meanDistance).toBeCloseTo(0.2)
  })
  it('fails closed without points or matching ink', () => {
    expect(measureProfileRegistration([], side, 12).ready).toBe(false)
    expect(measureProfileRegistration([[0, 0]], side, 3).ready).toBe(false)
  })
})
