import { describe, expect, it } from 'vitest'
import { Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three'
import { BULLET_TIME_RATE, BULLET_TIME_SHOT_SPECS, sampleBulletTimeRate } from './bulletTime'
import { TORQUE_PACING_SCALE, torqueScrollFraction } from './scrollPacing'
import { createJourneySample, sampleJourney } from './JourneyDirector'
import { createShaftCameraSample, sampleShaftCamera } from '../inspection/shaft/camera'
import { buildShaperCutter } from '../inspection/shaft/tools'
import { placeShaper, shaftMetrePoint } from '../inspection/shaft/frame'
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
import { SHAPER_TEETH, SHAPER_LEADING_FACE_Y_MM } from '../inspection/shaft/toolSpec'
import {
  createPrivateRingCamera,
  CutterCameraArc,
  createPrivateInspectionSample,
  RING_KNURL_DEPTH_MULTIPLIER,
  ringTimeAt,
  sampleInspectionSurroundings,
  samplePrivateInspection,
  samplePrivateRingCamera,
  RING_CLOSEUP_END,
  RING_CLOSEUP_START,
  type PrivateInspectionSample,
} from './InspectionDirector'

const DESKTOP = 1440 / 900
const NARROW = 390 / 844

it.each([DESKTOP,NARROW])('keeps the actual remote arbor end outside the cutting view at aspect %s',aspect=>{
  const material=new MeshStandardMaterial(),tool=buildShaperCutter(material)
  const shank=tool.root.getObjectByName('shaper-arbor-shank') as Mesh
  const positions=shank.geometry.getAttribute('position')
  let minY=Infinity
  for(let i=0;i<positions.count;i++)minY=Math.min(minY,positions.getY(i))
  const camera=new PerspectiveCamera(24,aspect,.001,30),target=new Vector3(),point=new Vector3()
  const sample=createPrivateInspectionSample()
  try{
    for(let i=0;i<=160;i++){
      const p=.75+.085*i/160
      samplePrivateInspection(p,aspect,sample)
      if(sample.subjectTime<2||sample.subjectTime>11)continue
      const c=sample.camera
      shaftMetrePoint(camera.position,c.px,c.py,c.pz)
      shaftMetrePoint(target,c.tx,c.ty,c.tz)
      shaftMetrePoint(camera.up,c.ux,c.uy,c.uz)
      camera.fov=c.fov;camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true)
      placeShaper(tool.root,sample.kinematics);tool.root.updateMatrixWorld(true)
      let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity
      for(let j=0;j<positions.count;j++)if(positions.getY(j)<=minY+1e-8){
        point.fromBufferAttribute(positions,j).applyMatrix4(shank.matrixWorld).project(camera)
        x0=Math.min(x0,point.x);x1=Math.max(x1,point.x);y0=Math.min(y0,point.y);y1=Math.max(y1,point.y)
      }
      expect(x1< -1.02||x0>1.02||y1< -1.02||y0>1.02,'arbor terminal cap at '+p).toBe(true)
    }
  }finally{tool.dispose();material.dispose()}
})
const KNOTS = [
  [0.735, 0], [0.795, 7.2], [0.835, 9.6],
  [0.87, 24.6], [0.884, 25], [0.89, 25.257], [0.89116, 25.62],
  [0.90071, 28.955], [0.90208, 30.508], [0.905, 32], [0.912, 35],
  [0.922, 38.5], [0.930, 40.2], [0.94, 66.9],
] as const
const CAMERA_SEAMS = [
  0.735, 0.795, 0.835, 0.846, 0.863, 0.874, 0.884, 0.905, 0.912, 0.922, 0.930, 0.94,
] as const
const at = (progress: number, aspect = DESKTOP) =>
  samplePrivateInspection(progress, aspect, createPrivateInspectionSample())

const SHAPER = BULLET_TIME_SHOT_SPECS.shaperContact
const HOB = BULLET_TIME_SHOT_SPECS.hobContact
const RING = BULLET_TIME_SHOT_SPECS.ringSwitch
/** Normalized CAMERA time u in [0, 1] across a shot window; the speed envelope is a function of this, not of progress. */
function progressAtCameraU(window: readonly [number, number], u: number, aspect = DESKTOP): number {
  const c0 = at(window[0], aspect).cameraTime, c1 = at(window[1], aspect).cameraTime
  const target = c0 + (c1 - c0) * u
  let lo = window[0], hi = window[1]
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (at(mid, aspect).cameraTime < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
/** Camera azimuth about its look-at point in the shaft/ring-local x-z plane. */
const cameraAzimuth = (c: { px: number; pz: number; tx: number; tz: number }) => Math.atan2(c.pz - c.tz, c.px - c.tx)
const wrapAngle = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))
/** Signed unwrapped azimuth sweep (degrees) over [lo, hi]; also reports whether every step keeps one sign. */
function signedSweep(read: (p: number) => number, lo: number, hi: number, steps = 4000) {
  let previous = read(lo), total = 0, positive = 0, negative = 0
  for (let i = 1; i <= steps; i++) {
    const d = wrapAngle(read(lo + (hi - lo) * i / steps) - previous)
    previous = previous + d
    total += d
    if (d > 1e-12) positive++
    if (d < -1e-12) negative++
  }
  return { degrees: total * 180 / Math.PI, monotone: positive === 0 || negative === 0 }
}
/** Native viewports from the page top at the measured document heights (study progress = native + .115). */
const NATIVE_BASE = [{ base: 39442.74225, height: 900 }, { base: 37198.67711, height: 844 }] as const
const studyViewports = (p: number, layout: 0 | 1) =>
  torqueScrollFraction(p - .115) * TORQUE_PACING_SCALE * NATIVE_BASE[layout].base / NATIVE_BASE[layout].height

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
      expect(sample.subjectTime).toBe(66.9)
      expect(sample.cameraTime).toBe(66.9)
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
      expect(sample.subjectTime).toBeLessThanOrEqual(66.9)
      expect(sample.cameraTime).toBeGreaterThanOrEqual(previousCameraTime)
      previousTime = sample.subjectTime
      previousCameraTime = sample.cameraTime
    }
    for (const [progress] of KNOTS.slice(1, -1)) {
      const rate = (at(progress + 1e-6).subjectTime - at(progress - 1e-6).subjectTime) / 2e-6
      expect(rate).toBeGreaterThan(1)
    }
  })

  it.each([DESKTOP, NARROW])('synchronizes cascade clocks and keeps the camera moving until the R9 shoulder (aspect %s)', (aspect) => {
    for (const [progress, time] of [[.905, 32], [.912, 35], [.922, 38.5], [.930, 40.2], [.94, 66.9]]) {
      expect(at(progress, aspect).cameraTime).toBe(time)
      expect(at(progress, aspect).subjectTime).toBe(time)
    }
    // The incoming .905 tangents retain their independent pre-32s clocks;
    // once the runout shoulder is complete the full curves coincide.
    for (let i = 0; i <= 280; i++) {
      const p = .912 + .028 * i / 280
      expect(at(p, aspect).cameraTime).toBe(at(p, aspect).subjectTime)
    }
    for (const [a, b] of [[35, 36.2], [36.2, 38.2], [38.2, 38.5], [38.5, 40.2], [40.2, 41.6], [41.6, 42.6]]) {
      for (let i = 0; i < 10; i++) {
        const left = at(progressAtTime(a + (b - a) * i / 10), aspect)
        const right = at(progressAtTime(a + (b - a) * (i + 1) / 10), aspect)
        expect(positionDistance(left, right)).toBeGreaterThan(1e-6)
      }
    }
    expect(at(.939, aspect).cameraTime).toBeGreaterThan(at(.938, aspect).cameraTime)
    expect(at(.939, aspect).camera).not.toEqual(at(.94, aspect).camera)
  })

  it.each([DESKTOP, NARROW])('preserves JourneyDirector progress domains and the settled retirement handoff (aspect %s)', (aspect) => {
    for (const [canonical, time] of [[.797, 35], [.807, 38.5], [.815, 40.2], [.825, 66.9]]) {
      const journey = sampleJourney(canonical, true, createJourneySample())
      const study = at(journey.inspectionProgress, aspect)
      expect(study.subjectTime).toBeCloseTo(time, 11)
      expect(study.cameraTime).toBeCloseTo(time, 11)
    }
    const endpoint = at(.94, aspect).camera
    for (const p of [.825, .826, .83, .84]) {
      const journey = sampleJourney(p, true, createJourneySample())
      expect(at(journey.inspectionProgress, aspect).camera).toEqual(endpoint)
      expect(journey.studyVisible).toBe(true)
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
    for (const progress of [0, 0.735, 0.94, 1]) {
      const sample = at(progress, aspect)
      const expectedTime = progress <= 0.735 ? 0 : 66.9
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
    // The 0.10 plateau is a function of normalized CAMERA time (u in [.15, .85]), not of progress.
    const samples = [.15, .3, .5, .7, .85].map(u => at(progressAtCameraU(SHAPER.window, u, aspect), aspect))
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
      // The camera clock runs 1/rate = 10x faster than the slowed machining time on the plateau.
      expect((b.cameraTime - a.cameraTime) / (b.kinematics.machining - a.kinematics.machining))
        .toBeGreaterThan(0.9 / BULLET_TIME_RATE)
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
        // The physical continuation arrives at nonzero clock speed. Its held
        // endpoint has an explicit one-sided stop; camera dolly speed is zero.
        if (p !== .94 || (name !== 'subjectTime' && name !== 'cameraTime'))
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
  it.each([DESKTOP, NARROW])('sweeps the hob camera a signed >=60 deg in one direction on the camera clock at aspect %s', (aspect) => {
    const sweep = signedSweep(p => cameraAzimuth(at(p, aspect).camera), HOB.window[0], HOB.window[1])
    expect(sweep.monotone).toBe(true)
    expect(sweep.degrees).toBeGreaterThanOrEqual(HOB.minCameraSweepDeg - 1e-6)
    // The swing weight is a camera-clock bell: zero at both window edges, full at the middle.
    expect(at(HOB.window[0], aspect).hobSwingWeight).toBe(0)
    expect(at(HOB.window[1], aspect).hobSwingWeight).toBeCloseTo(0, 12)
    expect(at(progressAtCameraU(HOB.window, .5, aspect), aspect).hobSwingWeight).toBeCloseTo(1, 9)
    // The orbit holds its end azimuth until the transfer back to the baseline framing.
    const end = cameraAzimuth(at(HOB.window[1], aspect).camera)
    expect(Math.abs(wrapAngle(cameraAzimuth(at(.8995, aspect).camera) - end))).toBeLessThan(1e-9)
  })

  it.each([[DESKTOP, 0], [NARROW, 1]] as const)('peaks the shaper and hob camera at >=35 deg per native viewport (aspect %s)', (aspect, layout) => {
    // Skill Section 3.3 pillar 2: the camera whips fastest while the subject crawls. Measured per native viewport
    // scrolled through the live pacing map, so a pacing change that stretches the span fails this test.
    const h = 1e-6
    for (const spec of [SHAPER, HOB]) {
      let peak = 0
      for (let i = 0; i <= 600; i++) {
        const p = spec.window[0] + (spec.window[1] - spec.window[0]) * i / 600
        const dAz = Math.abs(wrapAngle(cameraAzimuth(at(p + h, aspect).camera) - cameraAzimuth(at(p - h, aspect).camera))) * 180 / Math.PI
        peak = Math.max(peak, dAz / (studyViewports(p + h, layout) - studyViewports(p - h, layout)))
      }
      expect(peak, spec.id + ' peak deg/vp').toBeGreaterThanOrEqual(35)
    }
  })

  it.each([DESKTOP, NARROW])('touches before the swing window, seats inside it and integrates the canonical hob area (aspect %s)', (aspect) => {
    const pTouch = invertSubject(25.246)
    expect(pTouch).toBeLessThanOrEqual(0.89)
    expect(pTouch).toBeLessThan(HOB.window[0]) // touch precedes the formal window
    expect(at(pTouch, aspect).hobSwingWeight).toBe(0)
    const pSeat = invertSubject(25.7)
    expect(pSeat).toBeGreaterThan(HOB.window[0])
    expect(pSeat).toBeLessThan(HOB.window[1])
    // Normal hob speed is .5 rev/s = 180 deg per camera second. Over the whole window the physical turn is
    // that normal turn times the area of the canonical envelope: rate + ramp * (1 - rate) (full-speed knees included).
    const turn = hobDeg(at(HOB.window[1], aspect)) - hobDeg(at(HOB.window[0], aspect))
    const normalTurn = (at(HOB.window[1], aspect).cameraTime - at(HOB.window[0], aspect).cameraTime) * 180
    expect(turn / normalTurn).toBeCloseTo(HOB.rate + HOB.rampFraction * (1 - HOB.rate), 9)
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
    expect(at(0.94).subjectTime).toBe(66.9)
    for (const [progress, time] of [[0.89, 25.257], [0.89116, 25.62], [0.90071, 28.955], [0.90208, 30.508]]) {
      expect(at(progress).subjectTime).toBe(time)
    }
  })

  it.each([DESKTOP, NARROW])('preserves the pre-shaper formula, the 9.6 s shaper exit and the static hob through .87-.884 (aspect %s)', (aspect) => {
    const frame = createShaftKinematicsFrame()
    // Before the shaper contact the whole law is unchanged (ratios, clock and kinematics).
    for (let p = 0.735; p <= 0.795 + 1e-12; p += 0.001) {
      const sample = at(p, aspect)
      expect(sample.subjectTime).toBe(oldSubjectTime(p))
      expect(sample.kinematics).toEqual(sampleShaftKinematics(oldSubjectTime(p), frame))
    }
    // The canonical shaper clock replaces .795-.835 but must land exactly on the owner seams 7.2 s / 9.6 s.
    expect(at(0.795, aspect).subjectTime).toBe(7.2)
    expect(at(0.835, aspect).subjectTime).toBe(9.6)
    expect(at(0.87, aspect).subjectTime).toBe(24.6)
    // After the exit the recap catch-up leaves 9.6 s with the C1 tangent of the new shoulder, so its interior
    // shape is no longer the legacy PCHIP: require a monotone climb that stays between the seams instead.
    let prior = 9.6
    for (let p = 0.835; p <= 0.87 + 1e-12; p += 0.0005) {
      const t = at(p, aspect).subjectTime
      expect(t).toBeGreaterThanOrEqual(prior - 1e-12)
      expect(t).toBeLessThanOrEqual(24.6 + 1e-9)
      prior = t
    }
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

  it.each([DESKTOP, NARROW])('hands the hob orbit back to the baseline camera by 35 s with unchanged kinematics through .905-.94 (aspect %s)', (aspect) => {
    const frame = createShaftKinematicsFrame()
    const baselineDistance = (p: number) => {
      const sample = at(p, aspect)
      const reference = sampleShaftKinematics(sample.subjectTime, frame)
      for (const key of ['hobPhi', 'hobWorkPhi', 'hobRevRate', 'hobYc', 'hobA', 'hobToolA', 'hobR', 'mode', 'followAzimuth', 'cutterPhi', 'workPhi', 'cutting', 'returning', 'chipOpacity'] as const) {
        expect(sample.kinematics[key], key + ' @' + p).toEqual(reference[key])
      }
      expect(sample.kinematics.spaceDepth).toEqual(reference.spaceDepth)
      expect(sample.hobSwingWeight).toBe(0)
      const camera = createShaftCameraSample()
      sampleShaftCamera(sample.cameraTime, aspect, reference, camera)
      return { sample, camera, distance: Math.hypot(sample.camera.px - camera.px, sample.camera.py - camera.py, sample.camera.pz - camera.pz) }
    }
    // The swing's end azimuth relaxes monotonically to the baseline until the 35 s transfer completes.
    let prior = Infinity
    for (let p = 0.905; p < 0.912; p += 0.0005) {
      const { distance } = baselineDistance(p)
      expect(distance).toBeLessThanOrEqual(prior + 1e-9)
      prior = distance
    }
    // From 35 s until the ignition macro takes over (~.916) position, target and lens equal the baseline.
    for (let p = 0.912; p <= 0.915 + 1e-12; p += 0.001) {
      const { sample, camera } = baselineDistance(p)
      for (const key of ['px', 'py', 'pz', 'tx', 'ty', 'tz', 'fov'] as const) {
        expect(sample.camera[key], key + ' @' + p).toBeCloseTo(camera[key], 12)
      }
    }
  })

  it.each([DESKTOP, NARROW])('restores the leaf target and lens after the hob orbit while retaining pole-safe horizon (aspect %s)', (aspect) => {
    const frame = createShaftKinematicsFrame()
    for (let p = 0.912; p <= 0.915 + 1e-12; p += 0.001) {
      const sample = at(p, aspect)
      const camera = createShaftCameraSample()
      sampleShaftCamera(sample.cameraTime, aspect, sampleShaftKinematics(sample.subjectTime, frame), camera)
      for (const key of ['tx', 'ty', 'tz', 'fov'] as const) expect(sample.camera[key], key + ' @' + p).toBeCloseTo(camera[key], 12)
      const view = [sample.camera.tx - sample.camera.px, sample.camera.ty - sample.camera.py, sample.camera.tz - sample.camera.pz]
      const length = Math.hypot(...view)
      const upDot = Math.abs((view[0] * sample.camera.ux + view[1] * sample.camera.uy + view[2] * sample.camera.uz) / length)
      expect(upDot, 'pole @' + p).toBeLessThan(.98)
      expect(Math.hypot(sample.camera.ux, sample.camera.uy, sample.camera.uz)).toBeCloseTo(1, 12)
    }
  })

  it('retains physical shaper contact and cutter rotation under the doc39 clock retime', () => {
    const inStock = (m: number) => {
      const edge = strokeCentreYAt(m) + SHAPER_LEADING_FACE_Y_MM
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
    // Preserve the same tooth passages after the owner changes 20 -> 60 teeth.
    const toothPitches=cutterDeg*SHAPER_TEETH/360
    expect(toothPitches).toBeGreaterThanOrEqual(24*20/360)
    expect(toothPitches).toBeLessThanOrEqual(26*20/360)
  })
})
function hobDeg(sample: PrivateInspectionSample) { return hobPhiAt(sample.subjectTime) * 180 / Math.PI }


it('doc39 shaft interiors run the canonical knees: 1.0x at the window edges, exactly .10 of NORMAL on camera-time u in [.15,.85]', () => {
  const h = 1e-6
  for (const [spec, read, normal] of [
    [SHAPER, (s: PrivateInspectionSample) => machiningTimeAt(s.subjectTime), 1],
    [HOB, (s: PrivateInspectionSample) => hobPhiAt(s.subjectTime), Math.PI],
  ] as const) {
    const ratioAt = (u: number) => {
      const p = progressAtCameraU(spec.window, u)
      const a = at(p - h), b = at(p + h)
      return (read(b) - read(a)) / ((b.cameraTime - a.cameraTime) * normal)
    }
    for (let k = 0; k <= 14; k++) expect(ratioAt(.15 + .7 * k / 14), spec.id + ' plateau u=' + k).toBeCloseTo(spec.rate, 6)
    // Inside the C1 knees the physical ratio follows the canonical envelope of normalized camera time.
    for (const u of [.02, .05, .1, .9, .95, .98]) {
      expect(ratioAt(u), spec.id + ' knee u=' + u).toBeCloseTo(sampleBulletTimeRate(u, spec.rate, spec.rampFraction), 4)
    }
    expect(ratioAt(.001)).toBeGreaterThan(.99)
    expect(ratioAt(.999)).toBeGreaterThan(.99)
  }
  // Include every shoulder and plateau boundary in the derivative check.
  for (const p of [.795, SHAPER.window[0], SHAPER.window[1], .835, .89, HOB.window[0], HOB.window[1], .90071]) {
    const e = 1e-8, a = at(p - e), b = at(p), c = at(p + e)
    expect(Math.abs((c.subjectTime - b.subjectTime) - (b.subjectTime - a.subjectTime)) / e, 'C1 at ' + p).toBeLessThan(.1)
  }
})

it.each([DESKTOP,NARROW])('doc39 keeps the whole ring/indicator envelope framed at aspect %s',aspect=>{
  const out=createPrivateRingCamera(),camera=new PerspectiveCamera(),point=new Vector3()
  // Measured OD ~75.4 mm; conservative ring + blue/red stripe axial envelope.
  for(let n=0;n<=200;n++){
    const p=.46+.1*n/200,c=samplePrivateRingCamera(p,.19,out,aspect)
    const radius=Math.hypot(c.px-c.tx,c.py-c.ty,c.pz-c.tz)
    // The knurl close-up (owner 2026-10-22) deliberately dollies in on the die; every other checkpoint keeps the whole ring.
    const closeUp=p>RING_CLOSEUP_START-1e-9&&p<RING_CLOSEUP_END+.004
    if(!closeUp)expect(radius).toBeGreaterThanOrEqual(.24*Math.max(1,.8/aspect)-1e-12)
    camera.position.set(c.px,c.py,c.pz);camera.up.set(c.ux,c.uy,c.uz)
    camera.lookAt(c.tx,c.ty,c.tz);camera.fov=c.fov;camera.aspect=aspect
    camera.updateProjectionMatrix();camera.updateMatrixWorld(true)
    if(!closeUp)for(const z of [-.016,.022])for(let j=0;j<48;j++){
      const a=j*Math.PI/24
      point.set(.0377*Math.cos(a),.0377*Math.sin(a),z).project(camera)
      expect(Math.abs(point.x),'ring horizontal at '+p).toBeLessThan(.9)
      expect(Math.abs(point.y),'ring vertical at '+p).toBeLessThan(.9)
      expect(point.z).toBeLessThan(1)
    }
  }
})

it.each([DESKTOP,NARROW])('sweeps the ring camera a signed >=45 deg one way across the knurl window and pulls back without a counter-swing at aspect %s',aspect=>{
  const az=(p:number)=>cameraAzimuth(samplePrivateRingCamera(p,.19,createPrivateRingCamera(),aspect))
  const window=signedSweep(az,RING.window[0],RING.window[1])
  expect(window.monotone).toBe(true)
  expect(window.degrees).toBeGreaterThanOrEqual(RING.minCameraSweepDeg-1e-6)
  const whole=signedSweep(az,.4725,.4945)
  expect(whole.monotone).toBe(true)
  expect(whole.degrees).toBeGreaterThanOrEqual(window.degrees)
  expect(whole.degrees).toBeLessThan(180)
})

it('doc39 ring path moves during fade-in, swings handleward during shift and retraces all seams',()=>{
  const at=(p:number)=>samplePrivateRingCamera(p,.19,createPrivateRingCamera())
  const side=(p:number)=>{const c=at(p);return c.pz-c.tz}
  expect(at(.495)).not.toEqual(at(.505))
  // Owner 2026-10-24 (06.png): Ring Switch DOWN (shift 0, .505-.520) is framed from the snout side (+Z)
  // where the OSHA Blue groove sits; the camera crosses to the handle side (-Z) only with the shift.
  for(const p of [.505,.51,.515,.52])expect(side(p),'snout side at '+p).toBeGreaterThan(0)
  for(const p of [.545,.55,.555,.56])expect(side(p),'handle side at '+p).toBeLessThan(0)
  expect(side(.5325)).toBeLessThan(side(.52))
  expect(side(.5325)).toBeGreaterThan(side(.545))
  expect(at(.56).fov).toBe(32)
  for(const p of [.46,.4725,.4768,.485,.4945,.505,.52,.545,.56]){
    const a=at(p-1e-7),b=at(p+1e-7)
    expect(Math.hypot(a.px-b.px,a.py-b.py,a.pz-b.pz)).toBeLessThan(1e-5)
    expect(at(p)).toEqual(at(p))
  }
  const defaultPose=at(.48)
  expect(samplePrivateRingCamera(.48,.19,createPrivateRingCamera(),1.6)).toEqual(defaultPose)
  expect(()=>samplePrivateRingCamera(.48,.19,createPrivateRingCamera(),0)).toThrow(/finite/)
})

it.each([DESKTOP,NARROW])('frames the die contact close-up between .4768 and .485 and pulls back to whole-ring framing by .4945 at aspect %s',aspect=>{
  const at=(p:number,focus?:{x:number;y:number;z:number})=>{
    const c=samplePrivateRingCamera(p,.24,createPrivateRingCamera(),aspect,focus)
    return {c,radius:Math.hypot(c.px-c.tx,c.py-c.ty,c.pz-c.tz)}
  }
  const whole=at(.4725).radius
  const ringRadius=.0377
  // Actual tool-contact framing (solver-authored absolute radius: desktop .31 m, narrow .5 m): far enough that
  // the ring OD and the knurling die stay clear of the near plane (>= 6 ring radii), on a sub-assembly lens (22-36 deg).
  expect(whole).toBeGreaterThanOrEqual(.24*Math.max(1,.8/aspect)-1e-12)
  for(const p of [.4768,.481,.485]){
    const shot=at(p)
    expect(shot.radius,'minimum contact radius at '+p).toBeGreaterThanOrEqual(6*ringRadius)
    expect(shot.c.fov).toBeGreaterThanOrEqual(22)
    expect(shot.c.fov).toBeLessThanOrEqual(36)
    // The look-at stays on the ring's own contact patch (inside the OD), not on the larger fixture.
    expect(Math.hypot(shot.c.tx,shot.c.ty)).toBeLessThan(ringRadius)
  }
  expect(at(.4945).radius).toBeGreaterThanOrEqual(whole-1e-9)
  expect(at(.4945).radius).toBeCloseTo(at(.46).radius,6)
  expect(at(.4945).c.fov).toBe(32)
  // The dolly between whole-ring and contact framing is continuous in both directions (no radius pop).
  let previous=at(.4725).radius,largestStep=0
  for(let n=1;n<=400;n++){
    const radius=at(.4725+(.4945-.4725)*n/400).radius
    largestStep=Math.max(largestStep,Math.abs(radius-previous));previous=radius
  }
  expect(largestStep).toBeLessThan(.02)
  // Whole-ring framing ignores a live die position entirely; the authored contact target is not displaced by it.
  const die={x:.02,y:.03,z:.01}
  expect(at(.485,die).c.tx).toBeCloseTo(at(.485).c.tx,12)
  expect(at(.4725,die).c).toEqual(at(.4725).c)
  expect(at(.4945,die).c).toEqual(at(.4945).c)
})
