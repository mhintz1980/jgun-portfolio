import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { createShaftCameraSample, sampleShaftCamera, SHAFT_DOLLY_START, SHAFT_DOLLY_TRAVEL_M } from './camera'
import { BULLET_TIME_SHOT_SPECS, SHAPER_CAMERA_CLOCK } from '../../torque-wrench/bulletTime'
import { createShaftKinematicsFrame, sampleShaftKinematics } from './kinematics'
import { narrativeModelToStudy } from './frame'
import { CASCADE_REVEAL_EVENTS, createShaftSchedule, sampleShaftSchedule } from './schedule'

const kinematics = createShaftKinematicsFrame()
const cam = createShaftCameraSample()
const sampleAt = (t: number, aspect: number) => {
  sampleShaftKinematics(t, kinematics)
  return sampleShaftCamera(t, aspect, kinematics, cam)
}
/** The sample object is caller-owned; snapshot scalars before the next sample overwrites it. */
const snapAt = (t: number, aspect: number) => {
  const s = sampleAt(t, aspect)
  return {
    px: s.px, py: s.py, pz: s.pz, tx: s.tx, ty: s.ty, tz: s.tz,
    ux: s.ux, uy: s.uy, uz: s.uz, fov: s.fov,
    followAzimuth: s.followAzimuth, followWeight: s.followWeight,
  }
}

/** Unwrapped-free camera azimuth about the shaft axis, degrees. */
const azimuthDeg = (c: { px: number; pz: number; tx: number; tz: number }) => Math.atan2(c.pz - c.tz, c.px - c.tx) * 180 / Math.PI
const elevationDeg = (c: { px: number; py: number; pz: number; tx: number; ty: number; tz: number }) =>
  Math.asin((c.py - c.ty) / Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz)) * 180 / Math.PI
const smoothstep = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }

it('replays every camera channel bit-exactly under dense forward, reverse and prime-stride seeks', () => {
  // Replaces the retired pre-retime SHA pin: the canonical contracts intentionally moved the
  // shaper, materials, leaf hand-off, ignition and cascade poses. The invariant that survives is
  // history independence of every channel at both layouts, an interpolated layout and every seam.
  const times = Array.from({ length: 16057 }, (_, i) => i / 240)
  times.push(0, 2, 6, 7.2, 7.5, 9.4, 9.7, 11, 14, 15, 22.6, 23.4, 25.4, 30.2, 31, 32, 33.2, 35, 36.2, 38.2, 38.5, 40.2, 43.5, SHAFT_DOLLY_START, 66.9)
  const n = times.length
  expect(n % 7919).not.toBe(0) // 7919 is prime, so the stride visits every sample exactly once
  const channels = (s: ReturnType<typeof snapAt>) => [s.px, s.py, s.pz, s.tx, s.ty, s.tz, s.ux, s.uy, s.uz, s.fov, s.followAzimuth, s.followWeight]
  const mismatches: string[] = []
  for (const aspect of [1440 / 900, 390 / 844, .75]) {
    const forward = times.map(t => channels(snapAt(t, aspect)))
    const check = (i: number, pass: string) => {
      const replay = channels(snapAt(times[i], aspect))
      for (let k = 0; k < replay.length; k++) {
        if (!Object.is(replay[k], forward[i][k]) || !Number.isFinite(replay[k])) mismatches.push(`${pass} aspect=${aspect} t=${times[i]} channel=${k}`)
      }
    }
    for (let i = n - 1; i >= 0; i--) check(i, 'reverse')
    for (let i = 0; i < n; i++) check((i * 7919) % n, 'prime-stride')
  }
  expect(mismatches.slice(0, 10)).toEqual([])
}, 60_000)

/** Layouts pinned by the leaf spec and the blockout layout rects. */
const DESKTOP_ASPECT = 1440 / 900
const NARROW_ASPECT = 390 / 844
const SAFE = 0.84 // 8% safe frame on each side, in NDC
/** Shaft axis y spans (mm) framed per story era; blockout accepts cropping noncritical geometry. */
const MM = 1e-3
const TIP_R = 6.0835

function axisPoints(y0: number, y1: number): Vector3[] {
  const points = [new Vector3(0, y0 * MM, 0), new Vector3(0, y1 * MM, 0), new Vector3(0, ((y0 + y1) / 2) * MM, 0)]
  const ym = (y0 + y1) / 2
  points.push(new Vector3(0, ym * MM, TIP_R * MM), new Vector3(0, ym * MM, -TIP_R * MM))
  return points
}

/** Shaft-local pitch-cylinder witnesses, mm; these are CPU bounds, not rendered CAD proof. */
function cylinderPoints(y0: number, y1: number, radius: number): Vector3[] {
  const points: Vector3[] = []
  for (const y of [y0, (y0 + y1) / 2, y1]) {
    for (let k = 0; k < 64; k++) {
      const a = k * 2 * Math.PI / 64
      points.push(new Vector3(radius * Math.cos(a) * MM, y * MM, radius * Math.sin(a) * MM))
    }
  }
  return points
}

interface BoundNode {
  name?: string; mesh?: number; children?: number[]; matrix?: number[]
  translation?: number[]; rotation?: number[]; scale?: number[]
}
interface BoundDocument {
  scene?: number; scenes: { nodes: number[] }[]; nodes: BoundNode[]
  meshes: { primitives: { attributes: { POSITION: number } }[] }[]
  accessors: { min?: number[]; max?: number[] }[]
}
const CASCADE_PARTS = [/A000591/, /A000592/, /A000606/, /K000004/, /A000860/, /A000861/, /P000095|P000207|K000001|K000074/, /P000245/]
/** Conservative rotating envelopes from ALL primitive accessor corners, not a seated proxy.
 * Planet radii are measured about each occurrence pin, then added to the pin orbit radius,
 * so arbitrary carrier/planet rotation stays enclosed. Default.glb is read without decoding/mutation.
 */
function readCascadeEnvelopes(path = 'public/models/Default.glb', parts = CASCADE_PARTS, registration = narrativeModelToStudy(new Matrix4())) {
  const bytes = readFileSync(path)
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12))) as BoundDocument
  const bounds = parts.map(() => ({ y0: Infinity, y1: -Infinity, radius: 0, primitives: 0 }))
  function visit(index: number, parent: Matrix4, unit: number, pin?: Vector3) {
    const node = doc.nodes[index]
    const world = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]))
    world.premultiply(parent)
    const tag = parts.findIndex(re => re.test(node.name ?? ''))
    if (tag >= 0) unit = tag
    if (/occurrence.*P000247|occurrence.*P000248|occurrence.*P000069|occurrence.*P003046/.test(node.name ?? '')) {
      pin = new Vector3().setFromMatrixPosition(world).applyMatrix4(registration)
    }
    if (unit >= 0 && node.mesh !== undefined) {
      const bound = bounds[unit]
      const transform = new Matrix4().multiplyMatrices(registration, world)
      for (const primitive of doc.meshes[node.mesh].primitives) {
        const accessor = doc.accessors[primitive.attributes.POSITION]
        if (!accessor.min || !accessor.max) throw new Error('Missing CAD POSITION bounds')
        bound.primitives++
        for (let mask = 0; mask < 8; mask++) {
          const p = new Vector3(...accessor.min.map((min, axis) => mask & (1 << axis) ? accessor.max![axis] : min) as [number, number, number]).applyMatrix4(transform)
          bound.y0 = Math.min(bound.y0, -p.z * 1000)
          bound.y1 = Math.max(bound.y1, -p.z * 1000)
          const radius = pin ? Math.hypot(pin.x, pin.y) + Math.hypot(p.x - pin.x, p.y - pin.y) : Math.hypot(p.x, p.y)
          bound.radius = Math.max(bound.radius, radius * 1000)
        }
      }
    }
    for (const child of node.children ?? []) visit(child, world, unit, pin)
  }
  for (const root of doc.scenes[doc.scene ?? 0].nodes) visit(root, new Matrix4(), -1)
  return bounds
}
const CASCADE_ENVELOPES = readCascadeEnvelopes()
const SHAFT_ENVELOPES = readCascadeEnvelopes('public/models/manufacturing-core-full.glb',
  [/^approvedshaft$/, /^approvedbearing$/, /^approvedring$/, /^approvedhousing$/], new Matrix4())

function visibleCascadePoints(t: number): Vector3[] {
  const schedule = sampleShaftSchedule(t, createShaftSchedule())
  const points: Vector3[] = []
  for (const [index, bound] of CASCADE_ENVELOPES.entries()) {
    // Exactly zero-opacity parked units are invisible in shaftRuntime.apply; every positive alpha is included.
    if (schedule.cascadeAlpha[index] === 0 && schedule.cascadePlanetAlpha[index] === 0) continue
    const shift = schedule.cascadeOffsetZ[index] * 1000
    points.push(...cylinderPoints(bound.y0 - shift, bound.y1 - shift, bound.radius))
  }
  // The complete finished shaft, seated supports and clutch housing remain real visible geometry.
  for (const [index, alpha] of [schedule.approvedShaft, schedule.approvedBearing, schedule.approvedRing, schedule.housing].entries()) {
    if (alpha === 0) continue
    const bound = SHAFT_ENVELOPES[index]
    points.push(...cylinderPoints(bound.y0, bound.y1, bound.radius))
  }
  // shaftRuntime also shows a separate stationary P000245 witness during ignition.
  if (t > 38.2 && t < 40.6) {
    const bound = CASCADE_ENVELOPES[7]
    points.push(...cylinderPoints(bound.y0, bound.y1, bound.radius))
  }
  return points
}

function expectSafeFrame(t: number, aspect: number, points: Vector3[], subject: string) {
  const ndc = project(sampleAt(t, aspect), aspect, points)
  let x = 0, y = 0, near = Infinity, far = -Infinity
  for (const p of ndc) {
    x = Math.max(x, Math.abs(p.x)); y = Math.max(y, Math.abs(p.y))
    near = Math.min(near, p.z); far = Math.max(far, p.z)
  }
  expect(x, `${subject} t=${t} aspect=${aspect} max |x|=${x}, |y|=${y}`).toBeLessThan(SAFE)
  expect(y, `${subject} t=${t} aspect=${aspect} max |x|=${x}, |y|=${y}`).toBeLessThan(SAFE)
  expect(near).toBeGreaterThan(-1)
  expect(far).toBeLessThan(1)
}

/** Cutter exit region (mm): face end, relief groove floor/wall, exit overtravel corner, chip origin. */
function exitRegionPoints(): Vector3[] {
  return [
    new Vector3(0, 9.875 * MM, TIP_R * MM),
    new Vector3(0, 10.41 * MM, 3.97 * MM),
    new Vector3(0, 10.94 * MM, TIP_R * MM),
    new Vector3(0, 10.3749 * MM, 4.2968 * MM),
    new Vector3(0, kinematics.edgeY * MM, kinematics.cutterRho * MM),
  ]
}

/** Revised-section envelope (mm): approved journal r 6.325 sampled over y 9..20. */
const JOURNAL_R_MM = 6.325
function revisedSectionPoints(): Vector3[] {
  const points: Vector3[] = []
  for (let y = 9; y <= 20.0001; y += 0.5) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      points.push(new Vector3(JOURNAL_R_MM * Math.cos(a) * MM, y * MM, JOURNAL_R_MM * Math.sin(a) * MM))
    }
  }
  return points
}

function project(sample: ReturnType<typeof sampleAt>, aspect: number, points: Vector3[]): Vector3[] {
  // Match the private Canvas clipping planes (Scene.tsx), including the longer narrow stand-off.
  const camera = new PerspectiveCamera(sample.fov, aspect, 0.001, 30)
  camera.position.set(sample.px, sample.py, sample.pz)
  camera.up.set(sample.ux, sample.uy, sample.uz)
  camera.lookAt(sample.tx, sample.ty, sample.tz)
  camera.updateMatrixWorld(true)
  return points.map((p) => p.clone().project(camera))
}

// Extremal decoded CAD witnesses (shaft-local mm, including the actual group rotation),
// independently decoded from full/lite bundles by camera/footer-fix-2026-10-06/check-footer.mjs.
// Both layout extrema are retained: analytic journal/axis proxies alone miss the wider
// approved front geometry at y19.73 mm (r8.27 mm), which caused the desktop final overlap.
const MATERIAL_CAD_WITNESSES = [
  [4.266832068427301, 3.204427659511566, 1.0542713216261383],
  [-6.054424057611901, 12.788716703653336, -1.8277769148340548],
  [5.1540251723361115, 12.788716703653336, 3.66498320851933],
  [-2.1522988779283563, 11.430028825998306, 5.947044364205625],
  [2.1526353959062696, 12.788921594619751, -5.94685624764026],
].map(([x, y, z]) => new Vector3(x * MM, y * MM, z * MM))
const REVISED_CAD_WITNESSES = [
  [4.402330739613968, 3.2065436244010925, 0.2485545666159628],
  [4.372921500267474, 3.2012909650802612, 0.21114417884443626],
  [-8.266207084117266, 19.729703664779663, 0.1612094857321566],
  [-6.482882101344499, 19.729703664779663, 5.1311739164458166],
  [-2.910212724681493, 19.729703664779663, 7.738636287004341],
  [3.7289439569838274, 19.729703664779663, -7.378355718433207],
].map(([x, y, z]) => new Vector3(x * MM, y * MM, z * MM))

type Rect = { min: [number, number]; max: [number, number]; fos?: true }
function expectDomClearance(t: number, narrow: boolean, points: Vector3[], finalCard: boolean, cardVisible = true) {
  const [width, height] = narrow ? [390, 844] : [1440, 900]
  const rects: Rect[] = narrow ? [
    { min: [20, 24], max: [370, 94] }, // header
    { min: [20, 106], max: [310, 144.375] }, // copy
    { min: [31.1875, 156], max: [358.8125, finalCard ? 249.78125 : 339.96875] },
    { min: [31.1875, 346], max: [358.8125, 392], fos: true }, // S2 compact model line + horizontal FOS bar
    { min: [20, 529.5], max: [370, 820] }, // footer
  ] : [
    { min: [57.59375, 24], max: [1382.40625, 75.796875] },
    { min: [57.59375, 87.796875], max: [407.59375, 129.390625] },
    { min: [904.8125, 144], max: [1324.8125, finalCard ? 262.78125 : 369.28125] },
    { min: [57.59375, 596.5], max: [537.59375, 876] },
    // S2: "Model Name: Input Shaft" study block (5 lines warm, 4 lines revised) and the right-hand FOS bar.
    { min: [57.6, 148], max: [397.6, finalCard ? 224 : 246], fos: true },
    { min: [1342, 148], max: [1420, 488], fos: true },
  ]
  const aspect = width / height
  const ndc = project(sampleAt(t, aspect), aspect, points)
  const pixels = ndc.map(p => [(p.x + 1) * width / 2, (1 - p.y) * height / 2])
  const min = [Math.min(...pixels.map(p => p[0])), Math.min(...pixels.map(p => p[1]))]
  const max = [Math.max(...pixels.map(p => p[0])), Math.max(...pixels.map(p => p[1]))]
  for (const [index, rect] of rects.entries()) {
    // No attempt card exists before 15 s: the cutter pair may use the whole right-hand frame.
    if (!cardVisible && index === 2) continue
    // The FOS panels only exist with the stress study (15 s onward).
    if (!cardVisible && rect.fos) continue
    // Full rectangle separation: either X or Y must clear by >=8 px.
    expect(Math.max(rect.min[0] - max[0], min[0] - rect.max[0], rect.min[1] - max[1], min[1] - rect.max[1]), `t=${t.toFixed(2)} ${narrow ? 'narrow' : 'desktop'} rect#${index}`).toBeGreaterThanOrEqual(8)
  }
  for (const p of ndc) {
    expect(Math.abs(p.x)).toBeLessThanOrEqual(SAFE)
    expect(Math.abs(p.y)).toBeLessThanOrEqual(SAFE)
  }
}

const KEY_BEATS: ReadonlyArray<{ t: number; span: [number, number] }> = [
  { t: 0.5, span: [3.2, 19.2] },
  { t: 4, span: [3.2, 10.94] },
  { t: 6, span: [3.2, 10.94] },
  { t: 7.2, span: [3.2, 10.94] },
  { t: 8.4, span: [3.2, 10.94] },
  { t: 9.6, span: [3.2, 10.94] },
  { t: 13, span: [3.2, 10.94] },
  // Mid recap-to-materials handoff (14..15 s) and the settled materials side view.
  { t: 14.5, span: [3.2, 14.2] },
  { t: 15.5, span: [3.2, 14.2] },
  { t: 16, span: [3.2, 14.2] },
  { t: 18, span: [3.2, 14.2] },
  { t: 22, span: [3.2, 14.2] },
  { t: 24, span: [3.2, 13.94] },
  { t: 28, span: [3.2, 13.94] },
  { t: 30.2, span: [3.2, 13.94] },
  { t: 31.5, span: [3.2, 14.2] },
  // Final-card runout era: the full revised section up to the journal end (y 20 mm).
  { t: 33.5, span: [3.2, 20] },
]

describe('K5 camera continuity', () => {
  it('is C0 across the timeline at both layouts', () => {
    // Worst-case accumulators, asserted once per layout: ~10k samples x 11 expect() calls per layout was
    // the whole cost (5 s timeout under full-suite load). Same thresholds, same samples.
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const step = 1 / 240
      let prev = snapAt(0, aspect)
      let finite = true, dp = 0, dfov = 0, duy = 0, unit = 0
      for (let t = step; t <= 58 + step; t += step) {
        const s = snapAt(t, aspect)
        finite &&= Object.values(s).every(Number.isFinite)
        const stepDistance = Math.hypot(s.px - prev.px, s.py - prev.py, s.pz - prev.pz)
        // Keep the inherited frame-step bound across the continued close orbit.
        dp = Math.max(dp, stepDistance)
        dfov = Math.max(dfov, Math.abs(s.fov - prev.fov))
        duy = Math.max(duy, Math.abs(s.uy - prev.uy))
        unit = Math.max(unit, Math.abs(Math.hypot(s.ux, s.uy, s.uz) - 1))
        prev = s
      }
      expect(finite).toBe(true)
      expect(dp).toBeLessThanOrEqual(0.005)
      expect(dfov).toBeLessThanOrEqual(0.12)
      expect(duy).toBeLessThanOrEqual(0.02)
      expect(unit).toBeLessThan(5e-10)
    }
  })
  it('is C1 through the follow-to-fixed handoff with zero follow rate at 7.2 s', () => {
    const step = 1 / 480
    const prior = snapAt(7.2 - step, DESKTOP_ASPECT)
    const at = snapAt(7.2, DESKTOP_ASPECT)
    const next = snapAt(7.2 + step, DESKTOP_ASPECT)
    const d2px = next.px - 2 * at.px + prior.px
    const d2py = next.py - 2 * at.py + prior.py
    const d2pz = next.pz - 2 * at.pz + prior.pz
    expect(Math.hypot(d2px, d2py, d2pz)).toBeLessThanOrEqual(5e-5)
    expect(Math.abs(next.fov - 2 * at.fov + prior.fov)).toBeLessThanOrEqual(0.02)
    const followRate = (snapAt(7.2 + step, DESKTOP_ASPECT).followAzimuth - snapAt(7.2 - step, DESKTOP_ASPECT).followAzimuth) / (2 * step)
    expect(Math.abs(followRate)).toBeLessThanOrEqual(1e-3)
    // Follow eases to zero before the cutter edge reaches the face end during the exit stroke.
    for (let t = 7.2; t <= 9.6; t += 1 / 240) {
      sampleShaftKinematics(t, kinematics)
      expect(kinematics.followWeight).toBe(0)
      if (kinematics.edgeY >= 9.875) break
    }
  })
  it('follows the shaft frame for the exact law integral over 2..6 s (7*pi/16)', () => {
    const at2 = snapAt(2, DESKTOP_ASPECT)
    const at6 = snapAt(6, DESKTOP_ASPECT)
    // The eased startup 2..3 s banks only half a machining second, so the 2..6 s span is
    // FOLLOW_GAIN * 3.5 = 7*pi/16 (78.75 deg), not the retired linear pi/2 (90 deg).
    expect(at6.followAzimuth - at2.followAzimuth).toBeCloseTo((7 * Math.PI) / 16, 12)
  })
})

describe('K5 camera framing at the key beats', () => {
  for (const layout of [DESKTOP_ASPECT, NARROW_ASPECT] as const) {
    it(`keeps the shaft axis and cutter exit region inside the 8% safe frame (aspect ${layout.toFixed(3)})`, () => {
      for (const beat of KEY_BEATS) {
        const s = sampleAt(beat.t, layout)
        const machining = beat.t >= 2 && beat.t < 15
        const points = axisPoints(beat.span[0], beat.span[1])
        if (machining) points.push(...exitRegionPoints())
        for (const ndc of project(s, layout, points)) {
          expect(Math.abs(ndc.x)).toBeLessThanOrEqual(SAFE)
          expect(Math.abs(ndc.y)).toBeLessThanOrEqual(SAFE)
        }
      }
    })
  }
  it('leaves the materials card slot clear (right 8..44% desktop; measured top bands narrow)', () => {
    // 15.0 = first card visible, 15.14 = full opacity (script.ts fade 0.14 s): test from 15.0.
    // Narrow bands measured 2026-10-06 from the live portal DOM (blockout-2026-10-06
    // report.json, narrow failed-* anchors): tallest card bottom py 339.96875 of 844
    // (4140/C300; the 4340 card ends at 293.78125), footer top py 529.5. The cards sit in
    // the TOP band of the 390x844 layout, not the retired blockout bottom-band assumption.
    const cardBottomNdc = 1 - (2 * 392) / 844 - 16 / 844 // S2 compact FOS block bottom (py392) minus 8 px
    const footerTopNdc = 1 - (2 * 529.5) / 844 + 16 / 844 // footer top plus 8 px
    for (const t of [15, 15.14, 16, 17.8, 20.3, 22.5]) {
      const desktop = sampleAt(t, DESKTOP_ASPECT)
      for (const ndc of project(desktop, DESKTOP_ASPECT, axisPoints(3.2, 19.2))) {
        // Card band measured from the right edge: x in [56%, 92%] of the frame => NDC x <= 0.12.
        expect(ndc.x).toBeLessThanOrEqual(0.12)
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(SAFE)
      }
      const narrow = sampleAt(t, NARROW_ASPECT)
      for (const ndc of project(narrow, NARROW_ASPECT, axisPoints(3.2, 14.2))) {
        // Critical action must sit strictly between the measured card band above and the
        // footer band below (independent-material-camera-check.json: 12.49 px / 13.36 px).
        expect(ndc.y).toBeLessThanOrEqual(cardBottomNdc)
        expect(ndc.y).toBeGreaterThanOrEqual(footerTopNdc)
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(SAFE)
      }
    }
  })
  it('drifts the materials view one way from 20 to 30 degrees with fixed lens, target and stand-off (15..22.6 s)', () => {
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const ref = snapAt(15, aspect)
      const refDistance = Math.hypot(ref.px - ref.tx, ref.py - ref.ty, ref.pz - ref.tz)
      expect(azimuthDeg(ref)).toBeCloseTo(20, 9)
      let last = azimuthDeg(ref)
      for (let t = 15; t <= 22.6 + 1e-9; t += 1 / 240) {
        const s = snapAt(t, aspect)
        expect(Math.hypot(s.tx - ref.tx, s.ty - ref.ty, s.tz - ref.tz)).toBeLessThanOrEqual(1e-9)
        expect(Math.abs(s.fov - ref.fov)).toBeLessThanOrEqual(1e-9)
        expect(Math.abs(Math.hypot(s.px - s.tx, s.py - s.ty, s.pz - s.tz) - refDistance)).toBeLessThanOrEqual(1e-12)
        expect(elevationDeg(s)).toBeCloseTo(elevationDeg(ref), 9)
        expect(s.ux).toBeCloseTo(ref.ux, 12)
        expect(s.uy).toBeCloseTo(ref.uy, 12)
        expect(s.uz).toBeCloseTo(ref.uz, 12)
        const az = azimuthDeg(s)
        expect(az, `one-way materials drift at ${t}`).toBeGreaterThanOrEqual(last - 1e-12)
        last = az
      }
      expect(last).toBeCloseTo(30, 9)
      // The drift starts C1 from rest: the view has moved < .05 deg when the first card is readable.
      expect(azimuthDeg(snapAt(15.14, aspect)) - 20).toBeLessThan(.05)
    }
  })
  it('keeps the shaft and revised section outside the final 4340 card band through 33.2..35 s', () => {
    const points = [...axisPoints(3.2, 20), ...revisedSectionPoints()]
    // Narrow final card measured in the TOP band: py 156..249.78125 of 844 (blockout
    // report.json narrow revised-4340 anchor). Preserve the original -0.3 floor; the
    // decoded-CAD DOM test below additionally enforces the stricter measured footer.
    const finalCardBottomNdc = 1 - (2 * 249.78125) / 844 - 16 / 844 // card bottom minus 8 px
    for (let t = 33.2; t <= 35 + 1e-9; t += 1 / 30) {
      const desktop = sampleAt(t, DESKTOP_ASPECT)
      for (const ndc of project(desktop, DESKTOP_ASPECT, points)) {
        // Desktop card band: right 8..44% of width -> content stays at NDC x <= 0.12.
        expect(ndc.x, `final-card desktop NDC x at t=${t.toFixed(4)}`).toBeLessThanOrEqual(0.12)
        expect(ndc.x).toBeGreaterThanOrEqual(-SAFE)
        expect(Math.abs(ndc.y)).toBeLessThanOrEqual(SAFE)
      }
      const narrow = sampleAt(t, NARROW_ASPECT)
      for (const ndc of project(narrow, NARROW_ASPECT, points)) {
        // Narrow final card band: measured top band; shaft stays below the card bottom.
        expect(ndc.y).toBeLessThanOrEqual(finalCardBottomNdc)
        expect(ndc.y).toBeGreaterThanOrEqual(-0.3)
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(SAFE)
      }
    }
  })
  it('keeps decoded critical CAD clear of the measured header, copy, cards and footers by >=8 px', () => {
    for (const narrow of [false, true]) {
      for (let t = 15; t <= 22.6 + 1e-9; t += 1 / 30) expectDomClearance(t, narrow, MATERIAL_CAD_WITNESSES, false)
      for (let t = 33.2; t <= 35 + 1e-9; t += 1 / 30) expectDomClearance(t, narrow, REVISED_CAD_WITNESSES, true)
    }
  })
  it('absorbs the private 60-degree hob orbit into the leaf over 33.2..35 s and enters/leaves both card windows C1', () => {
    // InspectionDirector hands its hob orbit back with transfer = 1 - smooth01((t - 33.2) / 1.8);
    // the leaf supplies the exact complement, so the composed view stays at 24.2 + sweep = 84.2 deg.
    const sweep = BULLET_TIME_SHOT_SPECS.hobContact.minCameraSweepDeg
    expect(sweep).toBe(60)
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const ref = snapAt(33.2, aspect)
      const refDistance = Math.hypot(ref.px - ref.tx, ref.py - ref.ty, ref.pz - ref.tz)
      expect(azimuthDeg(ref)).toBeCloseTo(24.2, 9)
      for (let t = 33.2; t <= 35 + 1e-9; t += 1 / 30) {
        const s = snapAt(t, aspect)
        expect([s.tx, s.ty, s.tz, s.ux, s.uy, s.uz, s.fov]).toEqual([ref.tx, ref.ty, ref.tz, ref.ux, ref.uy, ref.uz, ref.fov])
        expect(Math.hypot(s.px - s.tx, s.py - s.ty, s.pz - s.tz)).toBeCloseTo(refDistance, 12)
        expect(elevationDeg(s)).toBeCloseTo(4.2, 9)
        expect(azimuthDeg(s) - 24.2, `leaf hand-off at ${t}`).toBeCloseTo(sweep * smoothstep((t - 33.2) / 1.8), 9)
      }
      expect(azimuthDeg(snapAt(35, aspect))).toBeCloseTo(84.2, 9)
      const step = 1 / 480
      for (const t of [15, 22.6, 33.2, 35]) {
        const a = snapAt(t - step, aspect), b = snapAt(t, aspect), c = snapAt(t + step, aspect)
        expect(Math.hypot(c.px - 2 * b.px + a.px, c.py - 2 * b.py + a.py, c.pz - 2 * b.pz + a.pz)).toBeLessThanOrEqual(5e-5)
        expect(Math.hypot(c.tx - 2 * b.tx + a.tx, c.ty - 2 * b.ty + a.ty, c.tz - 2 * b.tz + a.tz)).toBeLessThanOrEqual(5e-5)
        expect(Math.abs(c.fov - 2 * b.fov + a.fov)).toBeLessThanOrEqual(0.02)
      }
    }
  })
})

describe('v51.1 engagement and cascade camera', () => {
  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('shows the integral-sun reference before Stage 2 fades in (aspect %s)', aspect => {
    const start = CASCADE_REVEAL_EVENTS[0].planetStart
    const c = snapAt(start, aspect), schedule = createShaftSchedule()
    // The selected high-to-low track starts at an elevated oblique view.
    expect(azimuthDeg(c)).toBeCloseTo(-118.5, 10); expect(elevationDeg(c)).toBeCloseTo(-17, 10)
    expect(90 - Math.abs(elevationDeg(c))).toBeGreaterThan(45)
    expect(sampleShaftSchedule(start, schedule).cascadePlanetAlpha[1]).toBe(0)
    expect(sampleShaftSchedule(start + .01, schedule).cascadePlanetAlpha[1]).toBeGreaterThan(0)
    expect(schedule.cascadeAlpha[1]).toBe(0)
    expect(SHAFT_DOLLY_START).toBe(52.2)
  })
  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('keeps the active CAD region large during continuation (aspect %s)', (aspect) => {
    // All primitive accessor bounds are read from the actual GLBs. Projected
    // envelopes are CPU composition guards, not foreground/occlusion proof.
    for (const bound of [...CASCADE_ENVELOPES, ...SHAFT_ENVELOPES]) {
      expect(bound.primitives).toBeGreaterThan(0)
      expect(bound.radius).toBeGreaterThan(0)
      expect(bound.y1).toBeGreaterThan(bound.y0)
    }
    const windows = [...CASCADE_REVEAL_EVENTS.map(event => [event.planetStart + .05, event.carrierFull, event.index]), [56.45,57,3], [63.2,66.9,6]]
    for (const [start, end, index] of windows) for (let i = 0; i <= 16; i++) {
      const t = start + (end - start) * i / 16
      const bound = CASCADE_ENVELOPES[index]
      const center = new Vector3(0, (bound.y0 + bound.y1) * .0005, 0)
      const c = sampleAt(t, aspect)
      const ndcCenter = project(c, aspect, [center])[0]
      expect(Math.abs(ndcCenter.x), `active centre x at ${t}`).toBeLessThan(SAFE)
      expect(Math.abs(ndcCenter.y), `active centre y at ${t}`).toBeLessThan(SAFE)
      const projected = project(c, aspect, cylinderPoints(bound.y0, bound.y1, bound.radius))
      const width = Math.min(SAFE, Math.max(...projected.map(p => p.x))) - Math.max(-SAFE, Math.min(...projected.map(p => p.x)))
      const height = Math.min(SAFE, Math.max(...projected.map(p => p.y))) - Math.max(-SAFE, Math.min(...projected.map(p => p.y)))
      expect(Math.max(width, height), `active envelope occupancy at ${t}`).toBeGreaterThanOrEqual(SAFE)
      expect(projected.every(p => p.z > -1 && p.z < 1)).toBe(true)
      expect(visibleCascadePoints(t).length).toBeGreaterThan(0)
    }
    expect(sampleShaftSchedule(35.8, createShaftSchedule()).cascadeOffsetZ[0]).toBeGreaterThan(.024)
  })
  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('keeps camera pose and follow azimuth C0/C1 at authored seams (aspect %s)', (aspect) => {
    const seams = [0, 2, 6, 7.2, 9.7, 11, 14, 15, 22.6, 23.4, 25.4, 30.2, 31, 32, 33.2, 35, 36.2, 38.2, 38.5, 40.2, 42.4, 44.4, SHAFT_DOLLY_START, 66.9]
    const h = 1e-5
    for (const t of seams) {
      const left = snapAt(t - h, aspect), center = snapAt(t, aspect), right = snapAt(t + h, aspect)
      for (const key of Object.keys(center) as (keyof typeof center)[]) {
        // followWeight is a discrete kinematics mode flag (it jumps at 2s), not a camera pose channel.
        if (key === 'followWeight') continue
        const delta = right[key] - left[key]
        const rateJump = (right[key] - center[key]) / h - (center[key] - left[key]) / h
        expect(Math.abs(delta), `${key} C0 at ${t}`).toBeLessThan(1e-4)
        expect(Math.abs(rateJump), `${key} C1 at ${t}`).toBeLessThan(.01)
      }
    }
  })

  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('sweeps ignition a signed 165 degrees CCW, then continues CCW to the 241.5-degree cascade view at close scale (aspect %s)', (aspect) => {
    const azimuth = (t: number) => azimuthDeg(snapAt(t, aspect))
    expect(azimuth(38.5)).toBeCloseTo(103.5, 10)
    let last = azimuth(38.5)
    const unwrapThrough = (t0: number, t1: number) => {
      for (let i = 1; i <= 240; i++) {
        const t = t0 + (t1 - t0) * i / 240
        const c = snapAt(t, aspect)
        let angle = azimuthDeg(c)
        while (angle < last - 180) angle += 360
        expect(angle, `CCW at ${t}`).toBeGreaterThanOrEqual(last)
        last = angle
        expect(Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz)).toBeCloseTo(aspect === DESKTOP_ASPECT ? .22 : .32, 12)
      }
    }
    unwrapThrough(38.5, 40.2)
    expect(last - 103.5).toBeCloseTo(BULLET_TIME_SHOT_SPECS.stage1Ignition.cameraSweepDeg, 10)
    expect(last - 103.5).toBeGreaterThanOrEqual(BULLET_TIME_SHOT_SPECS.stage1Ignition.minCameraSweepDeg)
    expect(last).toBeCloseTo(103.5 + BULLET_TIME_SHOT_SPECS.stage1Ignition.cameraSweepDeg, 10)
    unwrapThrough(40.2, 43.5)
    expect(last).toBeCloseTo(601.5, 10)
    expect(((last % 360) + 360) % 360).toBeCloseTo(241.5, 10)
    expect(elevationDeg(snapAt(SHAFT_DOLLY_START, aspect))).toBeLessThan(-17)
  })

  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('tracks toward output while descending with stable lens and stand-off (aspect %s)', (aspect) => {
    const start = snapAt(SHAFT_DOLLY_START, aspect)
    let lastTargetY = start.ty, lastElevation = elevationDeg(start)
    for (let i = 1; i <= 100; i++) {
      const c = snapAt(SHAFT_DOLLY_START + (66.9 - SHAFT_DOLLY_START) * i / 100, aspect)
      expect(c.tx).toBe(start.tx); expect(c.tz).toBe(start.tz)
      expect(c.ty).toBeLessThan(lastTargetY)
      expect(elevationDeg(c)).toBeLessThan(lastElevation)
      expect(90 - Math.abs(elevationDeg(c))).toBeGreaterThan(45)
      expect([c.ux, c.uy, c.uz, c.fov]).toEqual([start.ux, start.uy, start.uz, start.fov])
      expect(Math.hypot(c.px-c.tx,c.py-c.ty,c.pz-c.tz)).toBeCloseTo(aspect === DESKTOP_ASPECT ? .22 : .32, 12)
      lastTargetY = c.ty; lastElevation = elevationDeg(c)
    }
    expect(lastTargetY - start.ty).toBeCloseTo(SHAFT_DOLLY_TRAVEL_M, 12)
    expect(lastElevation).toBeCloseTo(-42, 10)
    expect(lastTargetY).toBeCloseTo(-.092, 12)
  })

  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('frames the engaging tooth-flank band at 37 s (aspect %s)', (aspect) => {
    // Plan's radial glint/contact band reaches 5.95mm; this checks the actual macro subject.
    expectSafeFrame(37, aspect, cylinderPoints(3.175, 9.525, 5.95), 'sun tooth-flank band')
  })

  it.each([DESKTOP_ASPECT, NARROW_ASPECT])('shows rear-side contact at readable scale throughout ignition (aspect %s)', (aspect) => {
    // Sun tooth band r4.45..5.95 and the adjacent planet's inward flank toward its
    // r11.641 pin at 39.06deg. Includes the real 6.35mm face width; no shaft-length proxy.
    const points: Vector3[] = []
    for (const y of [3.175, 9.525]) for (const r of [4.45, 5.95, 10]) for (const deg of [19.06, 39.06, 59.06]) {
      const a = deg * Math.PI / 180
      points.push(new Vector3(r * Math.cos(a) * MM, y * MM, r * Math.sin(a) * MM))
    }
    const [width, height] = aspect === DESKTOP_ASPECT ? [1440, 900] : [390, 844]
    for (let i = 0; i <= 34; i++) {
      const t = 38.5 + i * .05
      const phase = -sampleShaftSchedule(t, createShaftSchedule()).finaleAngle
      const cos = Math.cos(phase), sin = Math.sin(phase)
      const contact = points.map(p => new Vector3(p.x * cos - p.z * sin, p.y, p.x * sin + p.z * cos))
      expectSafeFrame(t, aspect, contact, 'rotating sun/planet flank region')
      const c = sampleAt(t, aspect)
      const elevation = Math.asin((c.py - c.ty) / Math.hypot(c.px - c.tx, c.py - c.ty, c.pz - c.tz)) * 180 / Math.PI
      expect(elevation).toBeGreaterThanOrEqual(40 - 1e-8)
      expect(elevation).toBeLessThanOrEqual(55 + 1e-8)
      const pixels = project(c, aspect, contact).map(p => [(p.x + 1) * width / 2, (1 - p.y) * height / 2])
      let diameter = 0
      for (const a of pixels) for (const b of pixels) diameter = Math.max(diameter, Math.hypot(a[0] - b[0], a[1] - b[1]))
      expect(diameter, `contact diameter at ${t}`).toBeGreaterThanOrEqual(aspect === DESKTOP_ASPECT ? 70 : 80)
    }
  })


})

describe('camera determinism', () => {
  it('is bit-identical under shuffled seeks and returns the caller-owned sample', () => {
    const a = createShaftCameraSample()
    const b = createShaftCameraSample()
    const times: number[] = []
    for (let i = 0; i < 400; i++) times.push(((i * 7919) % 13920) / 240)
    for (const t of times) {
      sampleShaftKinematics(t, kinematics)
      sampleShaftCamera(t, 0.75, kinematics, a)
    }
    for (let i = times.length - 1; i >= 0; i--) {
      sampleShaftKinematics(times[i], kinematics)
      sampleShaftCamera(times[i], 0.75, kinematics, b)
    }
    for (const t of times) {
      sampleShaftKinematics(t, kinematics)
      const fa = sampleShaftCamera(t, 0.75, kinematics, a)
      const fb = sampleShaftCamera(t, 0.75, kinematics, b)
      expect(fa).toBe(a)
      expect(fb).toBe(b)
      for (const key of Object.keys(fa) as (keyof typeof fa)[]) {
        if (key === 'valid') continue
        expect(fa[key]).toBe(fb[key])
      }
    }
  })
})

// ---- JG-035 S1: button cutter viewer-right at equal depth --------------------------------------
import { CUTTER_VIEW_AZIMUTH_DEG, machiningViewAzimuthDeg, RECAP_SWING_DEG } from './camera'

const SHAPER_TIP_MM = 11.2032
/** Cutter centre / near edge in the shaft-local (CAD) frame, metres, from the live kinematics frame. */
function cutterWitnesses() {
  const distance = kinematics.cutterRho + SHAPER_TIP_MM
  const y = kinematics.strokeCentreY
  return {
    centre: new Vector3(0, y * MM, distance * MM),
    shaftAxis: new Vector3(0, y * MM, 0),
    nearEdge: new Vector3(0, y * MM, kinematics.cutterRho * MM),
    farTip: new Vector3(0, y * MM, (distance + SHAPER_TIP_MM) * MM),
  }
}
function cameraAt(t: number, aspect: number) {
  const s = sampleAt(t, aspect)
  const camera = new PerspectiveCamera(s.fov, aspect, 0.01, 1)
  camera.position.set(s.px, s.py, s.pz); camera.up.set(s.ux, s.uy, s.uz); camera.lookAt(s.tx, s.ty, s.tz)
  camera.updateMatrixWorld(true); camera.updateProjectionMatrix()
  return camera
}
const viewDepth = (camera: PerspectiveCamera, p: Vector3) => -p.clone().applyMatrix4(camera.matrixWorldInverse).z

describe('S1: cutter side-by-side composition (2..11 s)', () => {
  const times: number[] = []
  for (let t = 2; t <= 11 + 1e-9; t += 0.05) times.push(+t.toFixed(2))

  it.each([['desktop', DESKTOP_ASPECT], ['narrow', NARROW_ASPECT]])('puts the cutter right of the shaft at <= 1.55 mm depth difference until the 7.5 s shaper sweep, %s', (_, aspect) => {
    // The exact side-by-side law owns 2..7.5 s only; the 60-degree shaper sweep starts at
    // SHAPER_CAMERA_CLOCK.start, after which the cutter must still read on the viewer's right.
    let worstDepth = 0, leastRight = Infinity
    for (const t of times) {
      const camera = cameraAt(t, aspect), w = cutterWitnesses()
      if (t <= SHAPER_CAMERA_CLOCK.start) worstDepth = Math.max(worstDepth, Math.abs(viewDepth(camera, w.centre) - viewDepth(camera, w.shaftAxis)) * 1000)
      leastRight = Math.min(leastRight, w.centre.clone().project(camera).x - w.shaftAxis.clone().project(camera).x)
    }
    expect(SHAPER_CAMERA_CLOCK.start).toBe(7.5)
    expect(worstDepth).toBeLessThanOrEqual(1.55)
    expect(worstDepth).toBeLessThan(0.05) // the law is exact; the tolerance only guards later retuning
    expect(leastRight).toBeGreaterThan(0.1)
  })

  it('keeps the engaging near edge and the shaft centred pair inside the 8% safe frame, clear of copy and footer', () => {
    for (const [aspect, narrow] of [[DESKTOP_ASPECT, false], [NARROW_ASPECT, true]] as const) {
      for (const t of times.filter((_, i) => i % 4 === 0)) {
        sampleShaftKinematics(t, kinematics)
        const w = cutterWitnesses()
        const pts = [w.shaftAxis, w.nearEdge, new Vector3(0, kinematics.edgeY * MM, TIP_R * MM), new Vector3(0, kinematics.edgeY * MM, -TIP_R * MM)]
        expectDomClearance(t, narrow, pts, false, false)
        const camera = cameraAt(t, aspect)
        expect(Math.abs(w.centre.clone().project(camera).y)).toBeLessThanOrEqual(SAFE)
      }
    }
  })

  it('holds the cutter-right view until 7.5 s, sweeps 60 degrees through shaper contact, then recaps 240 -> 380 C1', () => {
    expect(CUTTER_VIEW_AZIMUTH_DEG).toBe(180)
    const sweep = BULLET_TIME_SHOT_SPECS.shaperContact.minCameraSweepDeg
    expect(sweep).toBe(60)
    expect([SHAPER_CAMERA_CLOCK.start, SHAPER_CAMERA_CLOCK.end]).toEqual([7.5, 9.4])
    for (const t of [0, 1, 2, 4, 6, 7.2, 7.5]) expect(machiningViewAzimuthDeg(t)).toBe(180)
    for (const t of [9.4, 10, 11]) expect(machiningViewAzimuthDeg(t)).toBe(180 + BULLET_TIME_SHOT_SPECS.shaperContact.cameraSweepDeg)
    let previous = machiningViewAzimuthDeg(7.5)
    for (let t = 7.5; t <= 9.4 + 1e-9; t += 1 / 240) {
      const v = machiningViewAzimuthDeg(t)
      expect(v).toBeGreaterThanOrEqual(previous - 1e-12)
      previous = v
    }
    // Zero angular rate at both shot edges: C1 into the 180 hold and the 240 slow-exit hold.
    const h = 1e-6
    expect((machiningViewAzimuthDeg(7.5 + h) - machiningViewAzimuthDeg(7.5)) / h).toBeLessThan(1e-3)
    expect((machiningViewAzimuthDeg(9.4) - machiningViewAzimuthDeg(9.4 - h)) / h).toBeLessThan(1e-3)
    expect(machiningViewAzimuthDeg(15 - 1e-9)).toBeCloseTo(180 + RECAP_SWING_DEG, 6)
    // The first sample at 15 s uses the authored anchors + frozen follow: identical total azimuth, no snap.
    const before = snapAt(15 - 1e-6, DESKTOP_ASPECT), after = snapAt(15 + 1e-6, DESKTOP_ASPECT)
    expect(Math.hypot(before.px - after.px, before.py - after.py, before.pz - after.pz)).toBeLessThan(2e-6)
    let last = machiningViewAzimuthDeg(11), peak = 0, maxStep = 0
    expect(last).toBe(180 + BULLET_TIME_SHOT_SPECS.shaperContact.cameraSweepDeg)
    for (let t = 11; t <= 15 + 1e-9; t += 0.01) {
      const v = machiningViewAzimuthDeg(t)
      expect(v).toBeGreaterThanOrEqual(last - 1e-12)
      maxStep = Math.max(maxStep, v - last); last = v; peak = Math.max(peak, v)
    }
    // Existing recap follow rate was 90 deg/s; the swing never exceeds it.
    expect(maxStep / 0.01).toBeLessThanOrEqual(90)
    expect(peak).toBeCloseTo(380, 6)
  })

  it('mutation guard: the pre-revision follow orbit would put the cutter in front by 6 s', () => {
    // Old law: 24 deg + follow azimuth. At 6 s the cutter sits ~12 deg off the camera line (between camera and shaft).
    sampleShaftKinematics(6, kinematics)
    const old = 24 + kinematics.followAzimuth / (Math.PI / 180)
    const cutterAz = 90
    expect(Math.abs(old - cutterAz)).toBeLessThan(20) // in front: not side by side
    expect(Math.abs(Math.cos((180 - cutterAz) * Math.PI / 180))).toBeLessThan(1e-12) // new law: perpendicular, zero depth offset
  })
})
