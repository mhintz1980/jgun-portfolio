import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { BULLET_TIME_RATE } from './bulletTime'
import { createShaftCameraSample, sampleShaftCamera } from '../inspection/shaft/camera'
import {
  createShaftKinematicsFrame,
  CUTTER_RATE,
  hobPhiAt,
  infeedRhoAt,
  machiningRateAt,
  machiningTimeAt,
  sampleShaftKinematics,
  strokeCentreYAt,
  strokePhaseAt,
} from '../inspection/shaft/kinematics'
import { FACE_START_MM, SHAFT_OD_MM, SHAPING_FACE_END_MM } from '../inspection/shaft/progression'
import { SHAPER_THICKNESS_MM } from '../inspection/shaft/toolSpec'
import {
  createPrivateRingCamera,
  CutterCameraArc,
  createPrivateInspectionSample,
  RING_KNURL_DEPTH_MULTIPLIER,
  ringTimeAt,
  sampleInspectionSurroundings,
  samplePrivateInspection,
  samplePrivateRingCamera,
  type PrivateInspectionSample,
} from './InspectionDirector'

const DESKTOP = 1440 / 900
const NARROW = 390 / 844
const KNOTS = [
  [0.735, 0], [0.795, 7.2], [0.835, 9.6],
  [0.87, 24.6], [0.884, 25], [0.89, 25.257], [0.89116, 25.62],
  [0.90071, 28.955], [0.90208, 30.508], [0.905, 32], [0.94, 43],
] as const
const CAMERA_SEAMS = [
  0.735, 0.795, 0.835, 0.846, 0.863, 0.874, 0.884, 0.905, 0.925, 0.94,
] as const
const at = (progress: number, aspect = DESKTOP) =>
  samplePrivateInspection(progress, aspect, createPrivateInspectionSample())

it('holds ring/shaft isolation after camera arrival and restores it before close', () => {
  // T5: ring study window [.46,.505], isolation [.469,.4725], restore [.495,.505], pre-shaft fade [.72,.735].
  expect(sampleInspectionSurroundings(.46)).toBe(1)
  expect(sampleInspectionSurroundings(.469)).toBe(1)
  expect(sampleInspectionSurroundings(.4725)).toBe(0)
  expect(sampleInspectionSurroundings(.4945)).toBe(0)
  expect(sampleInspectionSurroundings(.495)).toBe(0)
  expect(sampleInspectionSurroundings(.503)).toBeLessThan(1)
  expect(sampleInspectionSurroundings(.505)).toBe(1)
  expect(sampleInspectionSurroundings(.72)).toBe(1)
  expect(sampleInspectionSurroundings(.728)).toBeGreaterThan(0)
  expect(sampleInspectionSurroundings(.728)).toBeLessThan(1)
  expect(sampleInspectionSurroundings(.735)).toBe(0)
  expect(sampleInspectionSurroundings(.90)).toBe(0)
  expect(sampleInspectionSurroundings(.94)).toBe(1)
  let previous = 1
  for (let p = .469; p <= .4725; p += .00005) {
    const o = sampleInspectionSurroundings(p)
    expect(o).toBeLessThanOrEqual(previous + 1e-12); previous = o
  }
  expect(RING_KNURL_DEPTH_MULTIPLIER).toBe(1.5)
  expect(ringTimeAt(.46)).toBe(0)
  expect(ringTimeAt(.469)).toBe(0)
  expect(ringTimeAt(.4725)).toBe(0)
  expect(ringTimeAt(.4945)).toBe(28)
  expect(ringTimeAt(.505)).toBe(28)
  let time = 0
  for (let p = .46; p <= .505; p += .0001) {
    const t = ringTimeAt(p)
    expect(t).toBeGreaterThanOrEqual(time - 1e-12); time = t
  }
  const camera = createPrivateRingCamera()
  samplePrivateRingCamera(.4775, .2, camera)
  expect(Object.values(camera).every(Number.isFinite)).toBe(true)
})

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

  it.each([DESKTOP, NARROW])('retains the baseline camera at clear endpoint seams at aspect %s', (aspect) => {
    const baseline = createShaftCameraSample()
    for (const progress of [0, 0.735, 0.925, 0.94, 1]) {
      const sample = at(progress, aspect)
      const expectedTime = progress <= 0.735 ? 0 : 43
      expect(sample.arcWeight).toBeLessThan(1e-20)
      expect(sample.hobSwingWeight).toBe(0)
      sampleShaftCamera(expectedTime, aspect, sample.kinematics, baseline)
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
      // Runtime framing may author a different target/FOV; preserve baseline up and
      // follow channels while the independent browser gate measures the actual disc.
      for (const key of ['ux', 'uy', 'uz', 'followAzimuth', 'followWeight'] as const) {
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
    const seams = [...new Set([...KNOTS.map(([p]) => p), ...CAMERA_SEAMS,
      progressAtTime(2), progressAtTime(6.5), progressAtTime(10.3),
      progressAtTime(15), progressAtTime(16)])]
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

/** Independent restatement of the pre-T6-C3 subject table and its weighted-harmonic PCHIP. */
const OLD_SUBJECT: readonly (readonly [number, number])[] = [
  [0.735, 0], [0.795, 7.2], [0.8, 7.5], [0.832, 8.3], [0.835, 9.6], [0.87, 24.6],
  [0.884, 25], [0.902, 31.8], [0.905, 32], [0.94, 43],
]
function oldSubjectTime(p: number): number {
  const k = OLD_SUBJECT
  if (p <= k[0][0]) return 0
  if (p >= k[k.length - 1][0]) return 43
  const slope = (i: number) => {
    if (i === 0 || i === k.length - 1) return 0
    const h0 = k[i][0] - k[i - 1][0], h1 = k[i + 1][0] - k[i][0]
    const d0 = (k[i][1] - k[i - 1][1]) / h0, d1 = (k[i + 1][1] - k[i][1]) / h1
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0
    return d0 <= 0 || d1 <= 0 ? 0 : (w0 + w1) / (w0 / d0 + w1 / d1)
  }
  let i = 0
  while (i < k.length - 2 && p >= k[i + 1][0]) i++
  const [a, ta] = k[i], [b, tb] = k[i + 1]
  if (p === a) return ta
  const h = b - a, u = (p - a) / h, u2 = u * u, u3 = u2 * u
  const t = (2 * u3 - 3 * u2 + 1) * ta + (u3 - 2 * u2 + u) * h * slope(i)
    + (-2 * u3 + 3 * u2) * tb + (u3 - u2) * h * slope(i + 1)
  return Math.max(ta, Math.min(tb, t))
}
const SWING_P = [0.89116, 0.89888] as const
const invertSubject = (time: number) => {
  let lo = 0.884, hi = 0.94
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (at(mid).subjectTime < time) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

describe('JG-038 T6-C3 hob engagement and shaper contact', () => {
  it.each([DESKTOP, NARROW])('keeps the >=60 deg camera swing on the fixed camera clock at aspect %s', (aspect) => {
    let first = -1, last = -1
    const out = createPrivateInspectionSample()
    for (let p = 0.885; p <= 0.905; p += 2e-6) {
      if (samplePrivateInspection(p, aspect, out).hobSwingWeight * 82 >= 60) { if (first < 0) first = p; last = p }
    }
    expect(first).toBeCloseTo(SWING_P[0], 4)
    expect(Math.abs(first - SWING_P[0])).toBeLessThan(1e-5)
    expect(Math.abs(last - SWING_P[1])).toBeLessThan(1e-5)
  })

  it.each([DESKTOP, NARROW])('touches in a rising swing, seats inside the 60 deg window and turns at doc39 10% normal speed (aspect %s)', (aspect) => {
    const pTouch = invertSubject(25.246)
    expect(pTouch).toBeLessThanOrEqual(0.89)
    expect(at(pTouch, aspect).hobSwingWeight * 82).toBeGreaterThanOrEqual(45)
    expect(at(pTouch, aspect).hobSwingWeight * 82).toBeLessThan(60) // touch precedes the formal window
    const pSeat = invertSubject(25.7)
    expect(pSeat).toBeGreaterThan(SWING_P[0])
    expect(pSeat).toBeLessThan(SWING_P[1])
    const turn = (hobDeg(at(SWING_P[1], aspect))) - hobDeg(at(SWING_P[0], aspect))
    // Doc39 replaces the former 90-180-degree timing budget with exact .10x.
    const normalTurn=(at(SWING_P[1],aspect).cameraTime-at(SWING_P[0],aspect).cameraTime)*180
    expect(turn/normalTurn).toBeCloseTo(BULLET_TIME_RATE,10)
    let prior = -1, priorPhi = -1
    for (let p = 0.884; p <= 0.905; p += 1e-5) {
      const sample = at(p, aspect)
      expect(sample.subjectTime).toBeGreaterThan(prior)
      expect(hobDeg(sample)).toBeGreaterThanOrEqual(priorPhi)
      prior = sample.subjectTime
      priorPhi = hobDeg(sample)
    }
  })

  it('keeps the kinematic law at shaft seams: the new knots end exactly on the unchanged [.905,32] and [.94,43]', () => {
    expect(at(0.905).subjectTime).toBe(32)
    expect(at(0.94).subjectTime).toBe(43)
    for (const [progress, time] of [[0.89, 25.257], [0.89116, 25.62], [0.90071, 28.955], [0.90208, 30.508]]) {
      expect(at(progress).subjectTime).toBe(time)
    }
  })

  it.each([DESKTOP, NARROW])('preserves the original formula outside the doc39 bullet retime and the static hob through .87-.884 (aspect %s)', (aspect) => {
    const frame = createShaftKinematicsFrame()
    for (let p = 0.735; p <= 0.87 + 1e-12; p += 0.001) {
      if(p>.795 && p<.835)continue // Explicitly superseded clock; physical kinematics tested separately.
      const sample = at(p, aspect)
      expect(sample.subjectTime).toBe(oldSubjectTime(p))
      expect(sample.kinematics).toEqual(sampleShaftKinematics(oldSubjectTime(p), frame))
    }
    // The PCHIP tangent at .884 now depends on the next knot, so only the hob/mode/depth fields are
    // compared here (hob is static before 25 s); subject time shifts by well under a frame.
    for (let p = 0.871; p < 0.884; p += 0.001) {
      const sample = at(p, aspect)
      const reference = sampleShaftKinematics(oldSubjectTime(p), frame)
      expect(sample.subjectTime).toBeLessThan(25)
      expect(Math.abs(sample.subjectTime - oldSubjectTime(p))).toBeLessThan(0.05)
      for (const key of ['hobPhi', 'hobWorkPhi', 'hobRevRate', 'hobYc', 'hobA', 'hobToolA', 'hobR', 'mode', 'followAzimuth'] as const) {
        expect(sample.kinematics[key], key).toEqual(reference[key])
      }
      expect(sample.kinematics.spaceDepth).toEqual(reference.spaceDepth)
    }
  })

  it.each([DESKTOP, NARROW])('keeps visible kinematics and camera equal through .905-.94 (aspect %s)', (aspect) => {
    const frame = createShaftKinematicsFrame()
    for (let p = 0.905; p <= 0.94 + 1e-12; p += 0.0025) {
      const sample = at(p, aspect)
      const reference = sampleShaftKinematics(oldSubjectTime(p), frame)
      for (const key of ['hobPhi', 'hobWorkPhi', 'hobRevRate', 'hobYc', 'hobA', 'hobToolA', 'hobR', 'mode', 'followAzimuth', 'cutterPhi', 'workPhi', 'cutting', 'returning', 'chipOpacity'] as const) {
        expect(sample.kinematics[key], key + ' @' + p).toEqual(reference[key])
      }
      expect(sample.kinematics.spaceDepth).toEqual(reference.spaceDepth)
      const camera = createShaftCameraSample()
      sampleShaftCamera(sample.cameraTime, aspect, reference, camera)
      expect(sample.hobSwingWeight).toBe(0)
      for (const key of Object.keys(camera) as (keyof typeof camera)[]) {
        if (key === 'valid') continue
        expect(sample.camera[key], key + ' @' + p).toBeCloseTo(camera[key] as number, 12)
      }
    }
  })

  it('retains physical shaper contact and cutter rotation under the doc39 clock retime', () => {
    const inStock = (m: number) => {
      const edge = strokeCentreYAt(m) + SHAPER_THICKNESS_MM / 2
      return strokePhaseAt(m) < 0.5 && edge >= FACE_START_MM && edge <= SHAPING_FACE_END_MM && infeedRhoAt(m) < SHAFT_OD_MM - 1e-3
    }
    const out = createPrivateInspectionSample()
    const segments: [number, number][] = []
    let open = -1, prev = -1
    for (let p = 0.79; p <= 0.8359; p += 2e-6) {
      const on = inStock(machiningTimeAt(samplePrivateInspection(p, DESKTOP, out).subjectTime))
      if (on && open < 0) open = p
      if (!on && open >= 0) { segments.push([open, prev]); open = -1 }
      prev = p
    }
    // The earlier stroke (.7828-.7848) precedes the bullet window; the main contact is the longest segment.
    const main = segments.reduce((a, s) => (s[1] - s[0] > a[1] - a[0] ? s : a))
    expect(Math.abs(main[0] - 0.7915)).toBeLessThan(1e-4)
    // Canonical exit .8282 belonged to the obsolete clock. Preserve the actual
    // stock-contact exit in machining seconds, not its old scroll coordinate.
    expect(main[1]).toBeGreaterThan(.8)
    expect(main[1]).toBeLessThan(.832)
    expect(machiningTimeAt(at(main[1]).subjectTime)).toBeCloseTo(machiningTimeAt(oldSubjectTime(.8282)),3)
    const m0 = machiningTimeAt(at(main[0]).subjectTime)
    const m1 = machiningTimeAt(at(main[1]).subjectTime)
    const cutterDeg = (m1 - m0) * CUTTER_RATE * 180 / Math.PI
    expect(cutterDeg).toBeGreaterThanOrEqual(24)
    expect(cutterDeg).toBeLessThanOrEqual(26)
  })
})
function hobDeg(sample: PrivateInspectionSample) { return hobPhiAt(sample.subjectTime) * 180 / Math.PI }


it('doc39 shaft interiors run at .10 of NORMAL physical speed against the camera clock',()=>{
  const h=1e-6
  for(const [lo,hi,read,normal] of [
    [.8,.832,(s:PrivateInspectionSample)=>machiningTimeAt(s.subjectTime),1],
    [.89116,.898881,(s:PrivateInspectionSample)=>hobPhiAt(s.subjectTime),Math.PI],
  ] as const){
    for(let i=1;i<20;i++){
      const p=lo+(hi-lo)*i/20,a=at(p-h),b=at(p+h)
      expect((read(b)-read(a))/((b.cameraTime-a.cameraTime)*normal)).toBeCloseTo(BULLET_TIME_RATE,7)
    }
  }
  // Include every new shoulder and plateau boundary in the derivative check.
  for(const p of [.795,.8,.832,.835,.89,.89116,.898881,.90071]){
    const h=1e-8,a=at(p-h),b=at(p),c=at(p+h)
    expect(Math.abs((c.subjectTime-b.subjectTime)-(b.subjectTime-a.subjectTime))/h).toBeLessThan(.1)
  }
})

it.each([DESKTOP,NARROW])('doc39 keeps the whole ring/indicator envelope framed at aspect %s',aspect=>{
  const out=createPrivateRingCamera(),camera=new PerspectiveCamera(),point=new Vector3()
  // Measured OD ~75.4 mm; conservative ring + blue/red stripe axial envelope.
  for(let n=0;n<=200;n++){
    const p=.46+.1*n/200,c=samplePrivateRingCamera(p,.19,out,aspect)
    const radius=Math.hypot(c.px-c.tx,c.py-c.ty,c.pz-c.tz)
    expect(radius).toBeGreaterThanOrEqual(.24*Math.max(1,.8/aspect)-1e-12)
    camera.position.set(c.px,c.py,c.pz);camera.up.set(c.ux,c.uy,c.uz)
    camera.lookAt(c.tx,c.ty,c.tz);camera.fov=c.fov;camera.aspect=aspect
    camera.updateProjectionMatrix();camera.updateMatrixWorld(true)
    if(p>=.4725&&p<=.4945)expect(Math.atan2(c.pz-c.tz,c.px-c.tx)).toBeLessThanOrEqual(3.0)
    for(const z of [-.016,.022])for(let j=0;j<48;j++){
      const a=j*Math.PI/24
      point.set(.0377*Math.cos(a),.0377*Math.sin(a),z).project(camera)
      expect(Math.abs(point.x),'ring horizontal at '+p).toBeLessThan(.9)
      expect(Math.abs(point.y),'ring vertical at '+p).toBeLessThan(.9)
      expect(point.z).toBeLessThan(1)
    }
  }
})

it('doc39 ring path moves during fade-in, swings handleward during shift and retraces all seams',()=>{
  const at=(p:number)=>samplePrivateRingCamera(p,.19,createPrivateRingCamera())
  expect(at(.495)).not.toEqual(at(.505))
  expect(at(.52).pz-at(.52).tz).toBeLessThan(0)
  expect(at(.56).pz-at(.56).tz).toBeLessThan(at(.52).pz-at(.52).tz)
  expect(at(.56).fov).toBe(32)
  for(const p of [.46,.4725,.4768,.485,.4945,.52,.56]){
    const a=at(p-1e-7),b=at(p+1e-7)
    expect(Math.hypot(a.px-b.px,a.py-b.py,a.pz-b.pz)).toBeLessThan(1e-5)
    expect(at(p)).toEqual(at(p))
  }
  const defaultPose=at(.48)
  expect(samplePrivateRingCamera(.48,.19,createPrivateRingCamera(),1.6)).toEqual(defaultPose)
  expect(()=>samplePrivateRingCamera(.48,.19,createPrivateRingCamera(),0)).toThrow(/finite/)
})
