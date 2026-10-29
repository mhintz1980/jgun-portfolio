import { describe, expect, it } from 'vitest'
import { BULLET_TIME_SHOT_SPECS as specs } from './bulletTime'
import { cameraTimeAt, subjectTimeAt, createPrivateInspectionSample, samplePrivateInspection, createPrivateRingCamera, samplePrivateRingCamera } from './InspectionDirector'
import { CUTTER_RATE, machiningTimeAt, hobPhiAt } from '../inspection/shaft/kinematics'
import { IGNITION_NORMAL_RATE, sampleFinaleAngle } from '../inspection/shaft/schedule'
import { SUN_TO_STAGE1_CARRIER_RATIO } from '../inspection/shaft/cascadeConfig'
import { torqueScrollDistance } from './scrollPacing'

const sample = (p: number, aspect = 1.6) => samplePrivateInspection(p, aspect, createPrivateInspectionSample())
const delta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))
const progressAtCamera = (a: number, b: number, u: number) => {
  const wanted = cameraTimeAt(a) + u * (cameraTimeAt(b) - cameraTimeAt(a))
  let lo = a, hi = b
  for (let i = 0; i < 52; i++) { const mid = (lo + hi) / 2; if (cameraTimeAt(mid) < wanted) lo = mid; else hi = mid }
  return (lo + hi) / 2
}

describe('page-wide physical choreography', () => {
  it('compensates the existing shaper and hob easing at the physical plateau', () => {
    for (const [spec, physical, normal] of [
      [specs.shaperContact, (p: number) => CUTTER_RATE * machiningTimeAt(subjectTimeAt(p)), CUTTER_RATE],
      [specs.hobContact, (p: number) => hobPhiAt(subjectTimeAt(p)), Math.PI],
    ] as const) {
      const [a, b] = spec.window, h = 1e-7
      for (let i = 0; i <= 60; i++) {
        const p = progressAtCamera(a, b, spec.rampFraction + .01 + (.98 - 2 * spec.rampFraction) * i / 60)
        const observed = (physical(p + h) - physical(p - h)) / (cameraTimeAt(p + h) - cameraTimeAt(p - h)) / normal
        expect(observed).toBeCloseTo(.1, 5)
      }
    }
  })
  it('reaches normal physical speed at both shaper/hob knee boundaries', () => {
    for (const [spec, physical, normal] of [
      [specs.shaperContact, (p: number) => CUTTER_RATE * machiningTimeAt(subjectTimeAt(p)), CUTTER_RATE],
      [specs.hobContact, (p: number) => hobPhiAt(subjectTimeAt(p)), Math.PI],
    ] as const) for (const p of spec.window) {
      const h = 1e-8
      expect((physical(p + h) - physical(p - h)) / (cameraTimeAt(p + h) - cameraTimeAt(p - h)) / normal).toBeCloseTo(1, 3)
    }
  })
  it('uses two sun tooth pitches over ignition, with .10 interior physical speed', () => {
    expect((sampleFinaleAngle(40.2) - sampleFinaleAngle(38.5)) * SUN_TO_STAGE1_CARRIER_RATIO / (2 * Math.PI)).toBeCloseTo(.2, 12)
    for (const t of [38.8, 39, 39.5, 39.9]) {
      const h = 1e-6
      expect((sampleFinaleAngle(t + h) - sampleFinaleAngle(t - h)) / (2 * h) / IGNITION_NORMAL_RATE).toBeCloseTo(.1, 7)
    }
  })
  it.each([1.6, 390 / 844])('meets signed sweep and camera/native-viewport contrast at aspect %s', aspect => {
    for (const spec of [specs.shaperContact, specs.hobContact, specs.stage1Ignition]) {
      const [a, b] = spec.window
      let total = 0, peak = 0
      let previous: number = a
      const c0 = sample(a, aspect).camera
      let last = Math.atan2(c0.pz - c0.tz, c0.px - c0.tx)
      for (let i = 1; i <= 256; i++) {
        const p = a + (b - a) * i / 256, c = sample(p, aspect).camera
        const az = Math.atan2(c.pz - c.tz, c.px - c.tx), d = delta(last, az) * 180 / Math.PI
        expect(d, `${spec.id} signed direction`).toBeGreaterThanOrEqual(-1e-8)
        total += d
        peak = Math.max(peak, d / ((torqueScrollDistance(p - .115) - torqueScrollDistance(previous - .115)) * 44.1))
        last = az; previous = p
      }
      expect(total, `${spec.id} net sweep`).toBeGreaterThanOrEqual(spec.minCameraSweepDeg - 1e-6)
      expect(peak, `${spec.id} deg/native vp`).toBeGreaterThanOrEqual(35)
    }
  })
  it('unrolls the ring sweep monotonically through the lifted owner angle limit', () => {
    const out = createPrivateRingCamera(), spec = specs.ringSwitch
    let last = 0, total = 0
    for (let i = 0; i <= 256; i++) {
      const p = spec.window[0] + (spec.window[1] - spec.window[0]) * i / 256
      samplePrivateRingCamera(p, .28, out)
      const az = Math.atan2(out.pz - out.tz, out.px - out.tx)
      if (i) { const d = delta(last, az); expect(d).toBeGreaterThanOrEqual(-1e-12); total += d }
      last = az
    }
    expect(total * 180 / Math.PI).toBeGreaterThanOrEqual(45 - 1e-8)
  })
  it('has history-independent camera and mechanical channels on dense prime-stride seeks', () => {
    const count = 503, values = Array.from({ length: count }, (_, i) => sample(.735 + .205 * i / (count - 1)))
    const out = createPrivateInspectionSample()
    for (const order of [Array.from({ length: count }, (_, i) => count - 1 - i), Array.from({ length: count }, (_, i) => i * 613 % count)]) {
      for (const i of order) expect(samplePrivateInspection(.735 + .205 * i / (count - 1), 1.6, out)).toEqual(values[i])
    }
  })
})
