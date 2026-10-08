import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import { createShaftCameraSample, sampleShaftCamera } from './camera'
import { createShaftKinematicsFrame, sampleShaftKinematics } from './kinematics'

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
  const camera = new PerspectiveCamera(sample.fov, aspect, 0.01, 1)
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

type Rect = { min: [number, number]; max: [number, number] }
function expectDomClearance(t: number, narrow: boolean, points: Vector3[], finalCard: boolean, cardVisible = true) {
  const [width, height] = narrow ? [390, 844] : [1440, 900]
  const rects: Rect[] = narrow ? [
    { min: [20, 24], max: [370, 94] }, // header
    { min: [20, 106], max: [310, 144.375] }, // copy
    { min: [31.1875, 156], max: [358.8125, finalCard ? 249.78125 : 339.96875] },
    { min: [20, 529.5], max: [370, 820] }, // footer
  ] : [
    { min: [57.59375, 24], max: [1382.40625, 75.796875] },
    { min: [57.59375, 87.796875], max: [407.59375, 129.390625] },
    { min: [904.8125, 144], max: [1324.8125, finalCard ? 262.78125 : 369.28125] },
    { min: [57.59375, 596.5], max: [537.59375, 876] },
  ]
  const aspect = width / height
  const ndc = project(sampleAt(t, aspect), aspect, points)
  const pixels = ndc.map(p => [(p.x + 1) * width / 2, (1 - p.y) * height / 2])
  const min = [Math.min(...pixels.map(p => p[0])), Math.min(...pixels.map(p => p[1]))]
  const max = [Math.max(...pixels.map(p => p[0])), Math.max(...pixels.map(p => p[1]))]
  for (const [index, rect] of rects.entries()) {
    // No attempt card exists before 15 s: the cutter pair may use the whole right-hand frame.
    if (!cardVisible && index === 2) continue
    // Full rectangle separation: either X or Y must clear by >=8 px.
    expect(Math.max(rect.min[0] - max[0], min[0] - rect.max[0], rect.min[1] - max[1], min[1] - rect.max[1])).toBeGreaterThanOrEqual(8)
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
  { t: 37, span: [3.2, 19.2] },
  { t: 41, span: [3.2, 19.2] },
]

describe('K5 camera continuity', () => {
  it('is C0 across the timeline at both layouts', () => {
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const step = 1 / 240
      let prev = snapAt(0, aspect)
      for (let t = step; t <= 43 + step; t += step) {
        const s = snapAt(t, aspect)
        expect(Number.isFinite(s.px) && Number.isFinite(s.py) && Number.isFinite(s.pz)).toBe(true)
        expect(Number.isFinite(s.tx) && Number.isFinite(s.ty) && Number.isFinite(s.tz)).toBe(true)
        expect(Number.isFinite(s.fov)).toBe(true)
        const dp = Math.hypot(s.px - prev.px, s.py - prev.py, s.pz - prev.pz)
        expect(dp).toBeLessThanOrEqual(0.005)
        expect(Math.abs(s.fov - prev.fov)).toBeLessThanOrEqual(0.12)
        expect(Math.abs(s.uy - prev.uy)).toBeLessThanOrEqual(0.02)
        expect(Math.hypot(s.ux, s.uy, s.uz)).toBeCloseTo(1, 9)
        prev = s
      }
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
    const cardBottomNdc = 1 - (2 * 339.96875) / 844 - 16 / 844 // card bottom minus 8 px
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
  it('settles the materials view from 15.0 s, before the first card is readable at 15.14 s', () => {
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const ref = snapAt(15, aspect)
      for (let t = 15; t <= 22.6 + 1e-9; t += 1 / 240) {
        const s = snapAt(t, aspect)
        expect(Math.hypot(s.px - ref.px, s.py - ref.py, s.pz - ref.pz)).toBeLessThanOrEqual(1e-9)
        expect(Math.hypot(s.tx - ref.tx, s.ty - ref.ty, s.tz - ref.tz)).toBeLessThanOrEqual(1e-9)
        expect(Math.abs(s.fov - ref.fov)).toBeLessThanOrEqual(1e-9)
        expect(s.ux).toBeCloseTo(ref.ux, 12)
        expect(s.uy).toBeCloseTo(ref.uy, 12)
        expect(s.uz).toBeCloseTo(ref.uz, 12)
      }
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
        expect(ndc.x).toBeLessThanOrEqual(0.12)
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
  it('holds the final-card view throughout 33.2..35 s and enters/leaves both card holds with C1 continuity', () => {
    for (const aspect of [DESKTOP_ASPECT, NARROW_ASPECT]) {
      const ref = snapAt(33.2, aspect)
      for (let t = 33.2; t <= 35 + 1e-9; t += 1 / 30) expect(snapAt(t, aspect)).toEqual(ref)
      const step = 1 / 480
      for (const t of [15, 22.6, 33.2, 35]) {
        const a = snapAt(t - step, aspect), b = snapAt(t, aspect), c = snapAt(t + step, aspect)
        expect(Math.hypot(c.px - 2 * b.px + a.px, c.py - 2 * b.py + a.py, c.pz - 2 * b.pz + a.pz)).toBeLessThanOrEqual(5e-5)
        expect(Math.hypot(c.tx - 2 * b.tx + a.tx, c.ty - 2 * b.ty + a.ty, c.tz - 2 * b.tz + a.tz)).toBeLessThanOrEqual(5e-5)
        expect(Math.abs(c.fov - 2 * b.fov + a.fov)).toBeLessThanOrEqual(0.02)
      }
    }
  })
  it('holds the finale settled framing for >= 1.5 s', () => {
    const a = snapAt(41.2, DESKTOP_ASPECT)
    const b = snapAt(42.9, DESKTOP_ASPECT)
    expect(Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz)).toBeLessThanOrEqual(1e-9)
    expect(a.fov).toBe(b.fov)
  })
})

describe('camera determinism', () => {
  it('is bit-identical under shuffled seeks and returns the caller-owned sample', () => {
    const a = createShaftCameraSample()
    const b = createShaftCameraSample()
    const times: number[] = []
    for (let i = 0; i < 400; i++) times.push(((i * 7919) % 10320) / 240)
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

  it.each([['desktop', DESKTOP_ASPECT], ['narrow', NARROW_ASPECT]])('puts the cutter right of the shaft at <= 1.55 mm depth difference, %s', (_, aspect) => {
    let worstDepth = 0, leastRight = Infinity
    for (const t of times) {
      const camera = cameraAt(t, aspect), w = cutterWitnesses()
      worstDepth = Math.max(worstDepth, Math.abs(viewDepth(camera, w.centre) - viewDepth(camera, w.shaftAxis)) * 1000)
      leastRight = Math.min(leastRight, w.centre.clone().project(camera).x - w.shaftAxis.clone().project(camera).x)
    }
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

  it('holds the azimuth exactly through shaping and slow exit, then swings C1 to the settled 15 s view', () => {
    expect(CUTTER_VIEW_AZIMUTH_DEG).toBe(180)
    for (const t of [0, 1, 2, 4, 6, 8.4, 10, 11]) expect(machiningViewAzimuthDeg(t)).toBe(180)
    expect(machiningViewAzimuthDeg(15 - 1e-9)).toBeCloseTo(180 + RECAP_SWING_DEG, 6)
    // The first sample at 15 s uses the authored anchors + frozen follow: identical total azimuth, no snap.
    const before = snapAt(15 - 1e-6, DESKTOP_ASPECT), after = snapAt(15 + 1e-6, DESKTOP_ASPECT)
    expect(Math.hypot(before.px - after.px, before.py - after.py, before.pz - after.pz)).toBeLessThan(2e-6)
    let last = machiningViewAzimuthDeg(11), peak = 0, maxStep = 0
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
