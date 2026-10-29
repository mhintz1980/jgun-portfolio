import { describe, expect, it } from 'vitest'
import {
  BULLET_TIME_RATE,
  BULLET_TIME_SHOT_SPECS,
  sampleBulletTimeRate,
  sampleBulletTimeWarp,
} from './bulletTime'

const shots = Object.values(BULLET_TIME_SHOT_SPECS)
const clockCases = [
  { id: 'default', rate: BULLET_TIME_RATE, ramp: undefined },
  ...shots.map(({ id, rate, rampFraction }) => ({ id, rate, ramp: rampFraction })),
]

// Preserve both halves of the IEEE-754 double, including signed zero.
const bitView = new DataView(new ArrayBuffer(8))
function floatBits(value: number): string {
  bitView.setFloat64(0, value)
  return `${bitView.getUint32(0).toString(16).padStart(8, '0')}${bitView.getUint32(4).toString(16).padStart(8, '0')}`
}

// Simpson quadrature provides an independent check of the warp's normalization.
function integratedRate(rate: number, ramp: number | undefined): number {
  const intervals = 2000
  let sum = sampleBulletTimeRate(0, rate, ramp) + sampleBulletTimeRate(1, rate, ramp)
  for (let i = 1; i < intervals; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * sampleBulletTimeRate(i / intervals, rate, ramp)
  }
  return sum / (3 * intervals)
}

describe('bullet-time shot specifications', () => {
  it('keeps the baseline at exactly ten percent and the die budget at 0.15 revolutions', () => {
    expect(BULLET_TIME_RATE).toBe(0.1)
    expect(BULLET_TIME_SHOT_SPECS.ringSwitch.rate).toBe(0.1)
    expect(BULLET_TIME_SHOT_SPECS.ringSwitch.maxRevolutions).toBe(0.15)
  })

  it('defines every shot once with matching record keys', () => {
    expect(Object.keys(BULLET_TIME_SHOT_SPECS).sort()).toEqual([
      'hobContact', 'ringSwitch', 'shaperContact', 'shatter', 'stage1Ignition',
    ])
    expect(new Set(shots.map(({ id }) => id)).size).toBe(shots.length)
    expect(Object.isFrozen(BULLET_TIME_SHOT_SPECS)).toBe(true)
    for (const [key, spec] of Object.entries(BULLET_TIME_SHOT_SPECS)) {
      expect(spec.id).toBe(key)
      expect(Object.isFrozen(spec)).toBe(true)
      expect(Object.isFrozen(spec.window)).toBe(true)
      expect(['narrative', 'shaft-study']).toContain(spec.progressSpace)
    }
  })

  it.each(shots)('$id has finite, ordered progress and valid motion parameters', (spec) => {
    const [start, end] = spec.window
    expect(spec.window).toHaveLength(2)
    for (const value of [start, end, spec.rate, spec.rampFraction, spec.minCameraSweepDeg]) {
      expect(Number.isFinite(value)).toBe(true)
    }
    // Consumer windows and sweep angles can be retimed without weakening these invariants.
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeLessThanOrEqual(1)
    expect(end).toBeGreaterThan(start)
    expect(spec.rate).toBe(BULLET_TIME_RATE)
    expect(spec.rampFraction).toBeGreaterThanOrEqual(0.05)
    expect(spec.rampFraction).toBeLessThanOrEqual(0.25)
    expect(spec.minCameraSweepDeg).toBeGreaterThan(0)
    if ('maxRevolutions' in spec && spec.maxRevolutions !== undefined) {
      expect(Number.isFinite(spec.maxRevolutions)).toBe(true)
      expect(spec.maxRevolutions).toBeGreaterThan(0)
    }
  })
})

describe.each(clockCases)('$id bullet-time clock', ({ rate, ramp }) => {
  const knee = ramp ?? 0.15
  const sampleRate = (u: number): number => sampleBulletTimeRate(u, rate, ramp)
  const sampleWarp = (u: number): number => sampleBulletTimeWarp(u, rate, ramp)

  it('enters and exits at exactly normal speed', () => {
    expect(sampleRate(0)).toBe(1)
    expect(sampleRate(1)).toBe(1)
  })

  it('holds exactly 0.1 across the entire inclusive plateau', () => {
    for (let i = 0; i <= 100; i++) {
      const u = i === 100 ? 1 - knee : knee + (1 - 2 * knee) * i / 100
      expect(sampleRate(u)).toBe(BULLET_TIME_RATE)
    }
  })

  it('smoothly decelerates into the plateau and accelerates out', () => {
    let previousEntry = sampleRate(0)
    let previousExit = sampleRate(1 - knee)
    for (let i = 1; i <= 100; i++) {
      const entry = sampleRate(knee * i / 100)
      const exit = sampleRate(1 - knee + knee * i / 100)
      expect(entry).toBeLessThan(previousEntry)
      expect(exit).toBeGreaterThan(previousExit)
      expect(entry).toBeGreaterThanOrEqual(rate)
      expect(exit).toBeLessThanOrEqual(1)
      previousEntry = entry
      previousExit = exit
    }
  })

  it('maps the endpoints exactly and remains strictly increasing throughout [0, 1]', () => {
    expect(sampleWarp(0)).toBe(0)
    expect(sampleWarp(1)).toBe(1)
    let previous = sampleWarp(0)
    for (let i = 1; i <= 2000; i++) {
      const value = sampleWarp(i / 2000)
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThan(previous)
      expect(value).toBeLessThanOrEqual(1)
      previous = value
    }
  })

  it('has C1 joins at both knees, with the normalized plateau slope', () => {
    const h = 1e-6
    const expectedSlope = rate / (rate + (1 - rate) * knee)
    for (const u of [knee, 1 - knee]) {
      const left = (sampleWarp(u) - sampleWarp(u - h)) / h
      const right = (sampleWarp(u + h) - sampleWarp(u)) / h
      expect(Math.abs(left - right)).toBeLessThan(1e-6)
      expect(left).toBeCloseTo(expectedSlope, 6)
      expect(right).toBeCloseTo(expectedSlope, 6)
      // The rate envelope also joins the flat plateau with zero slope.
      const rateLeft = (sampleRate(u) - sampleRate(u - h)) / h
      const rateRight = (sampleRate(u + h) - sampleRate(u)) / h
      expect(Math.abs(rateLeft)).toBeLessThan(3e-4)
      expect(Math.abs(rateRight)).toBeLessThan(3e-4)
    }
  })

  it('differentiates to instantaneous rate divided by integrated total area', () => {
    const area = integratedRate(rate, ramp)
    expect(area).toBeCloseTo(rate + (1 - rate) * knee, 12)
    const h = 1e-6
    for (const u of [0, knee / 4, knee / 2, knee, 0.35, 0.5, 0.65, 1 - knee, 1 - knee / 2, 1]) {
      const lo = Math.max(0, u - h)
      const hi = Math.min(1, u + h)
      const derivative = (sampleWarp(hi) - sampleWarp(lo)) / (hi - lo)
      expect(derivative).toBeCloseTo(sampleRate(u) / area, 6)
    }
    // Normalizing to finish at 1 makes warp slope differ from the raw 0.1 rate.
    expect((sampleWarp(0.5 + h) - sampleWarp(0.5 - h)) / (2 * h)).toBeGreaterThan(rate)
  })

  it('replays rate and warp bit-identically in forward, reverse and prime-stride seek order', () => {
    // 613 is coprime to 257, so this visits every grid sample exactly once.
    const count = 257
    const progress = Array.from({ length: count }, (_, i) => i / (count - 1))
    progress.push(knee, 1 - knee, knee - 1e-7, knee + 1e-7, 1 - knee - 1e-7, 1 - knee + 1e-7)
    const baseline = progress.map((u) => [floatBits(sampleRate(u)), floatBits(sampleWarp(u))])
    const forward = Array.from({ length: progress.length }, (_, i) => i)
    const reverse = [...forward].reverse()
    const shuffled = Array.from({ length: count }, (_, i) => (i * 613) % count)
    shuffled.push(...forward.slice(count).reverse())
    expect(new Set(shuffled).size).toBe(progress.length)
    for (const order of [reverse, shuffled, forward]) {
      for (const i of order) {
        expect([floatBits(sampleRate(progress[i])), floatBits(sampleWarp(progress[i]))]).toEqual(baseline[i])
      }
    }
  })
})

describe('finite ordinary parameter clamps', () => {
  it.each([-1e6, -1, -1e-8, 1 + 1e-8, 2, 1e6])('clamps progress %s to the nearest endpoint', (u) => {
    for (const rate of [0.05, 0.1, 0.25, 1]) {
      for (const ramp of [0.05, 0.15, 0.25]) {
        expect(sampleBulletTimeRate(u, rate, ramp)).toBe(1)
        expect(sampleBulletTimeWarp(u, rate, ramp)).toBe(u < 0 ? 0 : 1)
      }
    }
  })

  it.each([
    [-10, 1e-4], [0, 1e-4], [1e-6, 1e-4],
    [0.05, 0.05], [0.25, 0.25], [0.45, 0.45], [0.5, 0.45], [10, 0.45],
  ])('clamps ramp %s to %s for both samplers', (ramp, effectiveRamp) => {
    for (const rate of [0.05, 0.1, 0.25, 1]) {
      for (const u of [0, 0.00005, 0.025, 0.1, 0.4, 0.5, 0.9, 0.975, 0.99995, 1]) {
        for (const sample of [sampleBulletTimeRate, sampleBulletTimeWarp]) {
          const value = sample(u, rate, ramp)
          expect(Number.isFinite(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
          expect(floatBits(value)).toBe(floatBits(sample(u, rate, effectiveRamp)))
        }
      }
    }
  })
})
