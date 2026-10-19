import { describe, expect, it } from 'vitest'
import {
  burstEnergy,
  PRIVATE_BRANCH_START_SECONDS,
  PRIVATE_BURST_KEYS,
  privateElectricalTimeAt,
  samplePrivateElectrical,
} from './ElectricalDirector'

describe('private unified electrical emission', () => {
  it('has exact dark holds and finite peaks for the approved burst roster', () => {
    expect(PRIVATE_BURST_KEYS).toHaveLength(4)
    const holds: number[] = []
    for (let i = 0; i < PRIVATE_BURST_KEYS.length; i++) {
      const key = PRIVATE_BURST_KEYS[i]
      expect(burstEnergy((key.t0 + key.t1) / 2)).toBeCloseTo(1, 12)
      expect(burstEnergy(key.t0)).toBe(0)
      expect(burstEnergy(key.t1)).toBe(0)
      if (i + 1 < PRIVATE_BURST_KEYS.length) {
        const hold = PRIVATE_BURST_KEYS[i + 1].t0 - key.t1
        holds.push(hold)
        expect(burstEnergy((key.t1 + PRIVATE_BURST_KEYS[i + 1].t0) / 2)).toBe(0)
      }
    }
    // Holds shorten progressively across the 4-burst sequence.
    expect(holds[0]).toBeGreaterThan(holds[1])
    expect(holds[1]).toBeGreaterThan(holds[2])
  })
  it('preserves path growth during dark holds without leaving lit seams', () => {
    const a = samplePrivateElectrical(privateElectricalTimeAt(0.22), 0)
    const b = samplePrivateElectrical(privateElectricalTimeAt(0.40), 0)
    expect(a.outline).toBe(0.24); expect(b.outline).toBe(0.24)
    expect(a.energy).toBe(0); expect(b.energy).toBe(0)
    expect(a.afterglow).toBeGreaterThan(b.afterglow)
    expect(b.afterglow).toBeGreaterThan(0.45)
  })
  it('starts the interior web immediately after the 4th profile burst completes', () => {
    const endOutline = samplePrivateElectrical(privateElectricalTimeAt(PRIVATE_BRANCH_START_SECONDS), 0)
    expect(endOutline.outline).toBe(1)
    expect(endOutline.branch).toBe(0)
    const intoWeb = samplePrivateElectrical(privateElectricalTimeAt(PRIVATE_BRANCH_START_SECONDS + 0.09), 0)
    expect(intoWeb.branch).toBeGreaterThan(0.05)
    expect(intoWeb.energy).toBeGreaterThan(0.9)
  })
  it('gates pit emission on actual rupture and extinguishes it after emergence', () => {
    expect(samplePrivateElectrical(0.847, 0).pitEnergy).toBe(0)
    expect(samplePrivateElectrical(0.847, 0.2).pitEnergy).toBeGreaterThan(0.9)
    expect(samplePrivateElectrical(0.9, 1).energy).toBe(0)
    expect(samplePrivateElectrical(1, 1).energy).toBe(0)
  })
  it('reverses and seeks reproducibly without accumulated state', () => {
    const times = [0.60, 0.625, 0.655, 0.675, 0.70, 0.72, 0.75, 0.78, 0.81, 0.847, 0.86, 0.9]
    const forward = times.map(t => samplePrivateElectrical(t, 0.5))
    for (let i = times.length - 1; i >= 0; i--) expect(samplePrivateElectrical(times[i], 0.5)).toEqual(forward[i])
    expect(() => samplePrivateElectrical(NaN, 0)).toThrow()
  })
})
