import { expect, it } from 'vitest'
import {
  CLIP_TRAVERSE_START, MAX_FEATURE_HZ, newFrame, RING_RADIUS, ROLLER_TEETH,
  rollerAngle, sampleInspection, SPIN_RATE, TRAVERSE_START, WHEEL_RADIUS,
} from '../inspection/timeline'
import {
  ringMechanicalRateAt, ringMechanicalTimeAt, RING_BULLET_RATIO,
  RING_NORMAL_DIE_REV_PER_SECOND, samplePrivateRing,
} from './RingInspection'

const dieTurns = (time: number): number => samplePrivateRing(time, newFrame()).angle
  * RING_RADIUS / WHEEL_RADIUS / (2 * Math.PI)
const dieSpeed = (time: number): number => samplePrivateRing(time, newFrame()).spin
  * RING_RADIUS / WHEEL_RADIUS / (2 * Math.PI)

it('spends exactly .15 die revolutions over all of display 8..18, knees included', () => {
  expect(dieTurns(18) - dieTurns(8)).toBeCloseTo(.15, 12)
  // Independent Simpson integration of physical spin, not the normalized warp.
  const n = 2000, h = 10 / n
  let sum = dieSpeed(8) + dieSpeed(18)
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * dieSpeed(8 + i * h)
  expect(sum * h / 3).toBeCloseTo(.15, 11)
})

it('uses a readable 3-RPM normal with full-speed shoulders and cubic knees to the budget-derived plateau', () => {
  expect(RING_NORMAL_DIE_REV_PER_SECOND).toBe(.05)
  expect(RING_BULLET_RATIO).toBeCloseTo(3 / 17, 14)
  for (const t of [7, 7.5, 8, 18, 18.5, 19]) expect(dieSpeed(t)).toBeCloseTo(.05, 12)
  // Half-knee smoothstep is .5. These are physical die speeds, not clock ratios.
  for (const t of [8.75, 17.25]) expect(dieSpeed(t)).toBeCloseTo(.05 * (1 + 3 / 17) / 2, 12)
  for (const t of [9.5, 10, 13, 16, 16.5]) expect(dieSpeed(t)).toBeCloseTo(.05 * 3 / 17, 12)
  expect(dieTurns(16.5) - dieTurns(9.5)).toBeCloseTo(7 * .05 * 3 / 17, 12)
})

it('keeps physical angle moving positively and its reported spin equal to the actual derivative', () => {
  const h = 1e-5
  for (let i = 0; i <= 240; i++) {
    const t = 7 + i / 20, f = samplePrivateRing(t, newFrame())
    const measured = (samplePrivateRing(t + h, newFrame()).angle - samplePrivateRing(t - h, newFrame()).angle) / (2 * h)
    expect(f.spin).toBeGreaterThan(0)
    expect(measured).toBeCloseTo(f.spin, 7)
    expect(ringMechanicalRateAt(t)).toBeGreaterThan(0)
    expect(f.spin).toBeCloseTo(SPIN_RATE * ringMechanicalRateAt(t), 12)
    expect(f.rollerDetailScale).toBe(1)
    expect(f.ringDetailScale).toBe(1)
    expect(dieSpeed(t) * ROLLER_TEETH).toBeLessThan(MAX_FEATURE_HZ)
  }
})

it('joins physical angle and spin C1 at both shoulders, shot endpoints and plateau knees', () => {
  const h = 1e-7
  for (const t of [7, 8, 9.5, 16.5, 18, 19]) {
    const a = samplePrivateRing(t - h, newFrame()), b = samplePrivateRing(t, newFrame())
    const c = samplePrivateRing(t + h, newFrame())
    expect(Math.abs(c.angle - a.angle)).toBeLessThan(1e-4)
    expect(Math.abs(c.spin - a.spin)).toBeLessThan(1e-4)
    const left = (b.angle - a.angle) / h, right = (c.angle - b.angle) / h
    expect(Math.abs(left - right)).toBeLessThan(.1)
    const clockLeft = (ringMechanicalTimeAt(t) - ringMechanicalTimeAt(t - h)) / h
    const clockRight = (ringMechanicalTimeAt(t + h) - ringMechanicalTimeAt(t)) / h
    expect(Math.abs(clockLeft - clockRight)).toBeLessThan(1e-5)
  }
})

it('preserves the borrowed tool/work contact and external rolling identities through the close-up', () => {
  for (let i = 0; i <= 200; i++) {
    const t = 8 + i / 20, mechanical = ringMechanicalTimeAt(t)
    const f = samplePrivateRing(t, newFrame()), inherited = sampleInspection(mechanical, newFrame())
    expect(f.contact).toBe(true)
    expect(f.toolVisible).toBe(true)
    expect(f.toolOpacity).toBe(1)
    expect(f.holePlugBlend).toBe(1)
    expect(f.angle).toBe(inherited.angle)
    expect(f.clipTime).toBe(inherited.clipTime)
    expect(f.knurl).toBe(inherited.knurl)
    expect(f.clipTime).toBeCloseTo(CLIP_TRAVERSE_START + mechanical - TRAVERSE_START, 14)
    const roller = rollerAngle(f.angle, RING_RADIUS, WHEEL_RADIUS)
    expect(roller * WHEEL_RADIUS + f.angle * RING_RADIUS).toBeCloseTo(0, 14)
  }
})

it('keeps the whole clock monotonic, the lifecycle registered and every seek bit-identical', () => {
  const n = 1009, points = Array.from({ length: n }, (_, i) => i * 28 / (n - 1))
  const times = points.map(ringMechanicalTimeAt)
  const expected = points.map(t => samplePrivateRing(t, newFrame())), out = newFrame()
  for (let i = 1; i < n; i++) expect(times[i]).toBeGreaterThan(times[i - 1])
  for (let i = n - 1; i >= 0; i--) {
    expect(Object.is(ringMechanicalTimeAt(points[i]), times[i])).toBe(true)
    const actual = samplePrivateRing(points[i], out)
    expect(actual).toEqual(expected[i])
    expect(Object.is(actual.angle, expected[i].angle)).toBe(true)
    expect(Object.is(actual.spin, expected[i].spin)).toBe(true)
  }
  for (let i = 0; i < n; i++) {
    const j = (i * 613) % n, actual = samplePrivateRing(points[j], out)
    expect(actual).toEqual(expected[j])
    expect(Object.is(actual.angle, expected[j].angle)).toBe(true)
    expect(Object.is(actual.spin, expected[j].spin)).toBe(true)
  }
  expect(ringMechanicalTimeAt(0)).toBe(0)
  expect(ringMechanicalTimeAt(28)).toBe(12)
  expect(expected.at(-1)!.angle).toBeCloseTo(16 * Math.PI, 10)
  expect(expected.at(-1)!.returnBlend).toBe(1)
})
