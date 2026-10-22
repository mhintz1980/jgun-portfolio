import { expect, it } from 'vitest'
import { newFrame } from '../inspection/timeline'
import { ringTimeAt, sampleInspectionSurroundings, createPrivateRingCamera, samplePrivateRingCamera } from './InspectionDirector'
import { samplePrivateRing, ringMechanicalTimeAt, RING_SLOW_START, RING_SLOW_END, RING_NORMAL_RATE } from './RingInspection'
import { BULLET_TIME_RATE } from './bulletTime'

it('preserves the finished ring until ALL surrounding assembly has faded', () => {
  for (let p = .46; p <= .4725; p += .0001) {
    const f = samplePrivateRing(ringTimeAt(p), newFrame())
    expect(f.knurl).toBe(1); expect(f.aluminium).toBe(0); expect(f.holePlugBlend).toBe(0)
    expect(f.spin).toBe(0)
  }
  expect(sampleInspectionSurroundings(.4725)).toBe(0)
  const knurl = samplePrivateRing(.5, newFrame())
  expect(knurl.knurl).toBeGreaterThan(0); expect(knurl.knurl).toBeLessThan(1)
  expect(knurl.aluminium).toBe(0); expect(knurl.holePlugBlend).toBe(0)
  const finish = samplePrivateRing(1.5, newFrame())
  expect(finish.knurl).toBe(0); expect(finish.aluminium).toBeGreaterThan(0); expect(finish.holePlugBlend).toBe(0)
  const holes = samplePrivateRing(2.5, newFrame())
  expect(holes.knurl).toBe(0); expect(holes.aluminium).toBe(1); expect(holes.holePlugBlend).toBeGreaterThan(0)
})

it('forms the OD with fully resolved heavy knurl and an independent moving camera', () => {
  const a = samplePrivateRing(9, newFrame()), b = samplePrivateRing(17, newFrame())
  expect(a.knurl).toBeGreaterThan(.20); expect(a.knurl).toBeLessThan(.35)
  expect(b.knurl).toBeGreaterThan(a.knurl)
  expect(b.angle - a.angle).toBeGreaterThan(5)
  expect(b.angle - a.angle).toBeLessThan(5.1)
  for (const f of [a, b]) {
    expect(f.contact).toBe(true)
    expect(f.ringDetailScale).toBeGreaterThan(0); expect(f.ringDetailScale).toBeLessThanOrEqual(1)
    expect(f.rollerDetailScale).toBeGreaterThan(0); expect(f.rollerDetailScale).toBeLessThanOrEqual(1)
  }
  const ca = samplePrivateRingCamera(.4775, .204, createPrivateRingCamera())
  const cb = samplePrivateRingCamera(.4838, .204, createPrivateRingCamera())
  // Doc39 clamps the knurl orbit to a three-quarter view. Keep visible travel
  // while rejecting the former oversized swing toward the gearbox axis.
  const cameraTravel = Math.hypot(cb.px - ca.px, cb.py - ca.py, cb.pz - ca.pz)
  expect(cameraTravel).toBeGreaterThan(.025)
  expect(cameraTravel).toBeLessThan(.075)
  const contact = []
  for (let t = 0; t <= 28; t += .01) if (samplePrivateRing(t, newFrame()).contact) contact.push(t)
  expect(contact.at(-1)! - contact[0]).toBeGreaterThan(16)
  expect(samplePrivateRing(21, newFrame()).spin).toBeGreaterThan(0)
})

it('keeps the ring clock moving through the slow window and preserves its end event', () => {
  const start = samplePrivateRing(RING_SLOW_START, newFrame())
  const middle = samplePrivateRing((RING_SLOW_START + RING_SLOW_END) / 2, newFrame())
  const end = samplePrivateRing(RING_SLOW_END, newFrame())
  expect(middle.angle).toBeGreaterThan(start.angle)
  expect(end.angle).toBeGreaterThan(middle.angle)
  expect(end.time).toBe(RING_SLOW_END)
  expect(BULLET_TIME_RATE).toBe(0.1)
  const h = 0.01
  const centralRate = (ringMechanicalTimeAt(13 + h) - ringMechanicalTimeAt(13 - h)) / (2 * h)
  expect(centralRate).toBeCloseTo(RING_NORMAL_RATE * BULLET_TIME_RATE, 6)
  expect(centralRate / RING_NORMAL_RATE).toBeCloseTo(BULLET_TIME_RATE, 6)
  const hBoundary = 1e-4
  for (const boundary of [RING_SLOW_START, RING_SLOW_END]) {
    const leftRate = (ringMechanicalTimeAt(boundary) - ringMechanicalTimeAt(boundary - hBoundary)) / hBoundary
    const rightRate = (ringMechanicalTimeAt(boundary + hBoundary) - ringMechanicalTimeAt(boundary)) / hBoundary
    expect(leftRate).toBeCloseTo(RING_NORMAL_RATE * BULLET_TIME_RATE, 3)
    expect(rightRate).toBeCloseTo(RING_NORMAL_RATE * BULLET_TIME_RATE, 3)
    expect(Math.abs(leftRate - rightRate)).toBeLessThan(0.001)
  }
  expect(ringMechanicalTimeAt(18)).toBeCloseTo(4.86, 12)
  expect(ringMechanicalTimeAt(28)).toBe(12)
})

it('reproduces reverse and arbitrary seeks and retains registered return', () => {
  for (const t of [3, 4, 8, 9, 17, 18, 23, 26]) {
    const left = samplePrivateRing(t - 1e-7, newFrame()), right = samplePrivateRing(t + 1e-7, newFrame())
    expect(Math.abs(right.angle - left.angle)).toBeLessThan(.0001)
    expect(Math.abs(right.spin - left.spin)).toBeLessThan(.0001)
  }
  const points = [0, .5, 1.5, 2.5, 4, 8, 9, 12, 17, 18, 23, 26, 28]
  const out = newFrame(), expected = points.map(t => samplePrivateRing(t, newFrame()))
  for (const i of [12, 3, 7, 0, 5, 9, 1, 11]) expect(samplePrivateRing(points[i], out)).toEqual(expected[i])
  expect(expected.at(-1)!.angle).toBeCloseTo(16 * Math.PI, 10)
  expect(expected.at(-1)!.returnBlend).toBe(1)
})
