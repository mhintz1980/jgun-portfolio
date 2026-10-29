import { expect, it } from 'vitest'
import { newFrame, RING_RADIUS, WHEEL_RADIUS } from '../inspection/timeline'
import { ringTimeAt, sampleInspectionSurroundings, createPrivateRingCamera, samplePrivateRingCamera } from './InspectionDirector'
import { samplePrivateRing, ringMechanicalTimeAt, RING_SLOW_START, RING_SLOW_END, RING_BULLET_RATE, RING_NORMAL_RATE, RING_BULLET_MEAN_RATE } from './RingInspection'


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
  // 9..17 now includes parts of both speed knees; the exact budget covers 8..18.
  const dieTravel = (b.angle - a.angle) * RING_RADIUS / WHEEL_RADIUS
  expect(dieTravel).toBeGreaterThan(0)
  expect(dieTravel).toBeLessThan(.15 * 2 * Math.PI)
  for (const f of [a, b]) {
    expect(f.contact).toBe(true)
    expect(f.ringDetailScale).toBeGreaterThan(0); expect(f.ringDetailScale).toBeLessThanOrEqual(1)
    expect(f.rollerDetailScale).toBeGreaterThan(0); expect(f.rollerDetailScale).toBeLessThanOrEqual(1)
  }
  const ca = samplePrivateRingCamera(.4775, .204, createPrivateRingCamera())
  const cb = samplePrivateRingCamera(.4838, .204, createPrivateRingCamera())
  // Owner lifted doc39's azimuth limit for the canonical isolation sweep.
  const cameraTravel = Math.hypot(cb.px - ca.px, cb.py - ca.py, cb.pz - ca.pz)
  expect(cameraTravel).toBeGreaterThan(.025)
  const start = samplePrivateRingCamera(.4768, .204, createPrivateRingCamera())
  const end = samplePrivateRingCamera(.485, .204, createPrivateRingCamera())
  const azimuth = (c: typeof start) => Math.atan2(c.px - c.tx, c.pz - c.tz)
  const sweep = Math.atan2(Math.sin(azimuth(end) - azimuth(start)), Math.cos(azimuth(end) - azimuth(start)))
  expect(-sweep * 180 / Math.PI).toBeGreaterThanOrEqual(45)
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
  const h = 0.01
  const centralRate = (ringMechanicalTimeAt(13 + h) - ringMechanicalTimeAt(13 - h)) / (2 * h)
  expect(centralRate).toBeCloseTo(RING_BULLET_RATE, 9)
  const hBoundary = 1e-4
  for (const boundary of [RING_SLOW_START, RING_SLOW_END]) {
    const leftRate = (ringMechanicalTimeAt(boundary) - ringMechanicalTimeAt(boundary - hBoundary)) / hBoundary
    const rightRate = (ringMechanicalTimeAt(boundary + hBoundary) - ringMechanicalTimeAt(boundary)) / hBoundary
    expect(leftRate).toBeCloseTo(RING_NORMAL_RATE, 5)
    expect(rightRate).toBeCloseTo(RING_NORMAL_RATE, 5)
    expect(Math.abs(leftRate - rightRate)).toBeLessThan(0.001)
  }
  expect(ringMechanicalTimeAt(18)).toBeCloseTo(4.36 + 10 * RING_BULLET_MEAN_RATE, 12)
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

it('turns the knurling die exactly .15 revolution including knees, with every tooth resolved (1B-1)', () => {
  const start = samplePrivateRing(RING_SLOW_START, newFrame()), end = samplePrivateRing(RING_SLOW_END, newFrame())
  const dieDeg = (end.angle - start.angle) * RING_RADIUS / WHEEL_RADIUS * 180 / Math.PI
  expect(dieDeg).toBeCloseTo(54, 9)
  const out = newFrame()
  for (let t = RING_SLOW_START; t <= RING_SLOW_END + 1e-9; t += .05) {
    const f = samplePrivateRing(t, out)
    expect(f.contact).toBe(true)
    expect(f.spin).toBeGreaterThan(0)
    expect(f.rollerDetailScale).toBe(1)
    expect(f.ringDetailScale).toBe(1)
  }
})
