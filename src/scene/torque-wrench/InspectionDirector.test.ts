import { describe, expect, it } from 'vitest'
import { createShaftCameraSample, sampleShaftCamera } from '../inspection/shaft/camera'
import {
  createShaftKinematicsFrame,
  machiningRateAt,
  sampleShaftKinematics,
} from '../inspection/shaft/kinematics'
import {
  CutterCameraArc,
  createPrivateInspectionSample,
  samplePrivateInspection,
  type PrivateInspectionSample,
} from './InspectionDirector'

const DESKTOP = 1440 / 900
const NARROW = 390 / 844
const KNOTS = [
  [0.735, 0], [0.795, 7.2], [0.835, 9.6],
  [0.87, 24.6], [0.905, 32], [0.94, 43],
] as const
const at = (progress: number, aspect = DESKTOP) =>
  samplePrivateInspection(progress, aspect, createPrivateInspectionSample())

/** Locate a subject seam without assuming a particular interpolation polynomial. */
function progressAtTime(time: number): number {
  let low = 0.735
  let high = 0.94
  const out = createPrivateInspectionSample()
  for (let i = 0; i < 55; i++) {
    const mid = (low + high) / 2
    if (samplePrivateInspection(mid, DESKTOP, out).subjectTime < time) low = mid
    else high = mid
  }
  return (low + high) / 2
}

function positionDistance(a: PrivateInspectionSample, b: PrivateInspectionSample): number {
  return Math.hypot(a.camera.px - b.camera.px, a.camera.py - b.camera.py, a.camera.pz - b.camera.pz)
}

/** Angular change of the actual look direction, independent of translation. */
function orientationAngle(a: PrivateInspectionSample, b: PrivateInspectionSample): number {
  const dot = a.camera.dx * b.camera.dx + a.camera.dy * b.camera.dy + a.camera.dz * b.camera.dz
  return Math.acos(Math.max(-1, Math.min(1, dot)))
}

describe('JG-038 private InspectionDirector C1', () => {
  it.each([NaN, Infinity, -Infinity])('rejects nonfinite inputs %s before changing caller output', (invalid) => {
    const out = at(0.815)
    const before = structuredClone(out)
    expect(() => samplePrivateInspection(invalid, DESKTOP, out)).toThrow(/finite/)
    expect(out).toEqual(before)
    expect(() => samplePrivateInspection(0.815, invalid, out)).toThrow(/finite/)
    expect(out).toEqual(before)
    expect(() => samplePrivateInspection(-100, invalid, out)).toThrow(/finite/)
    expect(out).toEqual(before)
  })

  it('clamps finite overscroll and canonicalizes negative zero', () => {
    expect(at(-100)).toEqual(at(0))
    expect(at(Number.MAX_VALUE)).toEqual(at(1))
    expect(at(-0)).toEqual(at(0))
    expect(Object.is(at(-0).progress, -0)).toBe(false)
  })

  it('hits every canonical master-time knot exactly and holds constant endpoints', () => {
    for (const [progress, time] of KNOTS) expect(at(progress).subjectTime).toBe(time)
    for (const progress of [0, 0.2, 0.734, 0.735]) {
      const sample = at(progress)
      expect(sample.subjectTime).toBe(0)
      expect(sample.cameraTime).toBe(0)
      expect(sample.kinematics).toEqual(at(0.735).kinematics)
      expect(sample.camera).toEqual(at(0.735).camera)
    }
    for (const progress of [0.94, 0.95, 1]) {
      const sample = at(progress)
      expect(sample.subjectTime).toBe(43)
      expect(sample.cameraTime).toBe(43)
      expect(sample.kinematics).toEqual(at(0.94).kinematics)
      expect(sample.camera).toEqual(at(0.94).camera)
    }
  })

  it('maps subject time monotonically without overshoot or internal stops', () => {
    const out = createPrivateInspectionSample()
    let previousTime = -1
    let previousCameraTime = -1
    for (let i = 0; i <= 2000; i++) {
      const sample = samplePrivateInspection(i / 2000, DESKTOP, out)
      expect(sample.subjectTime).toBeGreaterThanOrEqual(previousTime)
      expect(sample.subjectTime).toBeGreaterThanOrEqual(0)
      expect(sample.subjectTime).toBeLessThanOrEqual(43)
      expect(sample.cameraTime).toBeGreaterThanOrEqual(previousCameraTime)
      previousTime = sample.subjectTime
      previousCameraTime = sample.cameraTime
    }
    for (const [progress] of KNOTS.slice(1, -1)) {
      const rate = (at(progress + 1e-6).subjectTime - at(progress - 1e-6).subjectTime) / 2e-6
      expect(rate).toBeGreaterThan(1)
    }
  })

  it.each([DESKTOP, NARROW])('retraces forward/reverse/seek/reload and exact holds at aspect %s', (aspect) => {
    const checkpoints = [0, 0.735, 0.78, 0.795, 0.801, 0.817, 0.831, 0.835, 0.84, 0.87, 0.89, 0.905, 0.94, 1]
    const expected = new Map(checkpoints.map(p => [p, at(p, aspect)]))
    const out = createPrivateInspectionSample()
    const seeks = [...checkpoints.filter((_, i) => i % 2), ...checkpoints.filter((_, i) => !(i % 2))]
    for (const order of [checkpoints, [...checkpoints].reverse(), seeks]) {
      for (const p of order) {
        expect(samplePrivateInspection(p, aspect, out)).toEqual(expected.get(p))
        for (let hold = 0; hold < 5; hold++) {
          expect(samplePrivateInspection(p, aspect, out)).toEqual(expected.get(p))
        }
        expect(at(p, aspect)).toEqual(expected.get(p))
      }
    }
  })

  it('keeps outputs independent and reuses caller objects and depth storage', () => {
    const first = at(0.801)
    const snapshot = structuredClone(first)
    const second = createPrivateInspectionSample()
    const camera = second.camera
    const kinematics = second.kinematics
    const depth = second.kinematics.spaceDepth
    expect(second.camera).not.toBe(first.camera)
    expect(second.kinematics).not.toBe(first.kinematics)
    expect(depth).not.toBe(first.kinematics.spaceDepth)
    for (const p of [0.84, 0.79, 0.91, 0.801]) {
      expect(samplePrivateInspection(p, NARROW, second)).toBe(second)
      expect(second.camera).toBe(camera)
      expect(second.kinematics).toBe(kinematics)
      expect(second.kinematics.spaceDepth).toBe(depth)
      expect(first).toEqual(snapshot)
    }
  })

  it('preserves the existing shaft sampler and machining-rate API at matched master seconds', () => {
    const original = createShaftKinematicsFrame()
    for (let i = 0; i <= 250; i++) {
      const sample = at(0.735 + (0.94 - 0.735) * i / 250)
      expect(sample.kinematics).toEqual(sampleShaftKinematics(sample.subjectTime, original))
      expect(sample.machiningRate).toBe(machiningRateAt(sample.subjectTime))
      expect(sample.machiningRate).toBe(sample.kinematics.machiningRate)
    }
  })

  it.each([DESKTOP, NARROW, 0.82])('retains the entire baseline camera outside the arc at aspect %s', (aspect) => {
    const baseline = createShaftCameraSample()
    for (const time of [0, 2, 6.4, 6.5, 10.3, 11, 14.5, 15, 24.6, 28, 32, 43]) {
      const sample = at(progressAtTime(time), aspect)
      // Bisection may land a few ulps inside a seam; its smooth weight is negligible.
      expect(sample.arcWeight).toBeLessThan(1e-20)
      sampleShaftCamera(sample.subjectTime, aspect, sample.kinematics, baseline)
      for (const key of Object.keys(baseline) as (keyof typeof baseline)[]) {
        if (key === 'valid') expect(sample.camera[key]).toBe(baseline[key])
        else expect(sample.camera[key]).toBeCloseTo(baseline[key], 12)
      }
    }
  })

  it('deep-freezes the data-only authored arc', () => {
    expect(Object.isFrozen(CutterCameraArc)).toBe(true)
    expect(CutterCameraArc.length).toBeGreaterThanOrEqual(2)
    for (const keyframe of CutterCameraArc) {
      expect(Object.isFrozen(keyframe)).toBe(true)
      expect(Object.isFrozen(keyframe.target)).toBe(true)
      expect(Object.isFrozen(keyframe.targetNarrow)).toBe(true)
      expect(keyframe.distance).toBeGreaterThan(0)
    }
  })

  it.each([DESKTOP, NARROW])('has observable translation AND orientation in the stable slow window at aspect %s', (aspect) => {
    // Plain CPU motion witnesses only: no projected proxies or framing acceptance.
    const samples = [0.801, 0.809, 0.817, 0.825, 0.831].map(p => at(p, aspect))
    const baseline = createShaftCameraSample()
    for (const sample of samples) {
      expect(sample.subjectTime).toBeGreaterThan(7.2)
      expect(sample.subjectTime).toBeLessThan(9.6)
      expect(sample.machiningRate).toBeLessThanOrEqual(0.22)
      expect(sample.arcWeight).toBe(1)
      sampleShaftCamera(sample.subjectTime, aspect, sample.kinematics, baseline)
      for (const key of ['tx', 'ty', 'tz', 'fov', 'ux', 'uy', 'uz'] as const) {
        expect(sample.camera[key]).toBeCloseTo(baseline[key], 12)
      }
      expect(sample.camera.uy).toBe(1)
    }
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1]
      const b = samples[i]
      expect(positionDistance(a, b)).toBeGreaterThan(0.001)
      expect(orientationAngle(a, b)).toBeGreaterThan(0.005)
      // The camera clock advances independently of slowed machining time.
      expect((b.cameraTime - a.cameraTime) / (b.kinematics.machining - a.kinematics.machining)).toBeGreaterThan(5)
    }
  })

  it.each([DESKTOP, NARROW])('has finite normalized orientation and nondegenerate look/up throughout at aspect %s', (aspect) => {
    for (let i = 0; i <= 500; i++) {
      const sample = at(i / 500, aspect)
      const c = sample.camera
      expect(sample.arcWeight).toBeGreaterThanOrEqual(0)
      expect(sample.arcWeight).toBeLessThanOrEqual(1)
      for (const value of Object.values(c)) {
        if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true)
      }
      expect(c.valid).toBe(true)
      expect(Math.hypot(c.dx, c.dy, c.dz)).toBeCloseTo(1, 12)
      expect(Math.hypot(c.ux, c.uy, c.uz)).toBeCloseTo(1, 12)
      const length = Math.hypot(c.tx - c.px, c.ty - c.py, c.tz - c.pz)
      expect(length).toBeGreaterThan(0.1)
      expect(c.dx).toBeCloseTo((c.tx - c.px) / length, 12)
      expect(c.dy).toBeCloseTo((c.ty - c.py) / length, 12)
      expect(c.dz).toBeCloseTo((c.tz - c.pz) / length, 12)
      const upDot = c.dx * c.ux + c.dy * c.uy + c.dz * c.uz
      expect(Math.abs(upDot)).toBeLessThan(0.95)
      expect(c.fov).toBeGreaterThan(0)
      expect(c.fov).toBeLessThan(180)
    }
  })

  it.each([DESKTOP, NARROW])('is C1 at master knots and arc entry/exit seams at aspect %s', (aspect) => {
    const seams = [...KNOTS.map(([p]) => p), progressAtTime(6.5), progressAtTime(10.3)]
    // Small enough to distinguish a seam from the compressed exit's curvature.
    const h = 1e-9
    const channels: [string, (s: PrivateInspectionSample) => number, number][] = [
      ['subjectTime', s => s.subjectTime, 0.03],
      ['cameraTime', s => s.cameraTime, 0.03],
      ['arcWeight', s => s.arcWeight, 0.002],
      ...(['px', 'py', 'pz', 'tx', 'ty', 'tz'] as const).map(key =>
        [key, (s: PrivateInspectionSample) => s.camera[key], 0.001] as [string, (s: PrivateInspectionSample) => number, number]),
      ...(['dx', 'dy', 'dz', 'ux', 'uy', 'uz'] as const).map(key =>
        [key, (s: PrivateInspectionSample) => s.camera[key], 0.005] as [string, (s: PrivateInspectionSample) => number, number]),
      ['fov', s => s.camera.fov, 0.05],
    ]
    for (const p of seams) {
      const left = at(p - h, aspect)
      const center = at(p, aspect)
      const right = at(p + h, aspect)
      for (const [name, read, tolerance] of channels) {
        const leftRate = (read(center) - read(left)) / h
        const rightRate = (read(right) - read(center)) / h
        expect(Math.abs(read(right) - read(left)), `${name} C0 at ${p}`).toBeLessThan(2e-5)
        expect(Math.abs(rightRate - leftRate), `${name} C1 at ${p}`).toBeLessThan(tolerance)
      }
    }
  })
})
