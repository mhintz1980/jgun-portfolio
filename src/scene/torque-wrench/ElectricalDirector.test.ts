import { describe, expect, it } from 'vitest'
import { BURST_KEYS, electricalTimeAt } from '../drawing/electricalScore'
import { burstEnergy, samplePrivateElectrical } from './ElectricalDirector'

describe('private unified electrical emission', () => {
  it('has exact dark holds and finite peaks for the approved burst roster', () => {
    for (let i = 0; i < BURST_KEYS.length; i++) {
      const key = BURST_KEYS[i]
      expect(burstEnergy((key.t0 + key.t1) / 2)).toBeCloseTo(1, 12)
      expect(burstEnergy(key.t0)).toBe(0)
      expect(burstEnergy(key.t1)).toBe(0)
      if (i + 1 < BURST_KEYS.length) expect(burstEnergy((key.t1 + BURST_KEYS[i + 1].t0) / 2)).toBe(0)
    }
  })
  it('preserves path growth during dark holds without leaving lit seams', () => {
    const a = samplePrivateElectrical(electricalTimeAt(0.22), 0)
    const b = samplePrivateElectrical(electricalTimeAt(0.38), 0)
    expect(a.outline).toBe(0.1); expect(b.outline).toBe(0.1)
    expect(a.energy).toBe(0); expect(b.energy).toBe(0)
  })
  it('gates pit emission on actual rupture and extinguishes it after emergence', () => {
    expect(samplePrivateElectrical(0.847, 0).pitEnergy).toBe(0)
    expect(samplePrivateElectrical(0.847, 0.2).pitEnergy).toBeGreaterThan(0.9)
    expect(samplePrivateElectrical(0.9, 1).energy).toBe(0)
    expect(samplePrivateElectrical(1, 1).energy).toBe(0)
  })
  it('reverses and seeks reproducibly without accumulated state', () => {
    const times = [0.768, 0.771, 0.79, 0.805, 0.837, 0.846, 0.85, 0.86, 0.9]
    const forward = times.map(t => samplePrivateElectrical(t, 0.5))
    for (let i = times.length - 1; i >= 0; i--) expect(samplePrivateElectrical(times[i], 0.5)).toEqual(forward[i])
    expect(() => samplePrivateElectrical(NaN, 0)).toThrow()
  })
})
