import { describe, expect, it } from 'vitest'
import { torqueScrollFraction as physical, torqueNarrativeProgress as narrative,
  TORQUE_PACING_RAMP, TORQUE_PACING_SCALE, TORQUE_PACING_SPANS, torquePacingKernel } from './scrollPacing'
import { readFileSync } from 'node:fs'
import { TORQUE_SCROLL_VIEWPORTS } from './beats'
import { createPrivateInspectionSample, ringTimeAt, samplePrivateInspection } from './InspectionDirector'
import { hobPhiAt } from '../inspection/shaft/kinematics'
import { BULLET_TIME_SHOT_SPECS } from './bulletTime'

/** Independent restatement of the span integral: distance(p) = p + sum (b-a)(m-1) g((p-a)/(b-a)). */
const g = (u: number, r = TORQUE_PACING_RAMP) => {
  const c = Math.max(0, Math.min(1, u))
  if (c <= 0 || c >= 1) return c <= 0 ? 0 : 1
  const h = 1 / (1 - r)
  if (c < r) return h * (c * c) / (2 * r)
  if (c <= 1 - r) return h * (c - r / 2)
  const w = 1 - c
  return 1 - h * (w * w) / (2 * r)
}
const distance = (p: number, spans: readonly { start: number, end: number, multiplier: number }[]) =>
  p + spans.reduce((sum, s) => sum + (s.end - s.start) * (s.multiplier - 1) * g((p - s.start) / (s.end - s.start)), 0)

it('keeps the whole shatter camera window on the 3.8x flat top without moving downstream joins', () => {
  const shatter = TORQUE_PACING_SPANS.find(span => span.id === 'shatter')!
  expect(shatter).toMatchObject({ start: .42, end: .46, multiplier: 3.8 })
  const [lo, hi] = BULLET_TIME_SHOT_SPECS.shatter.window
  for (const p of [lo, hi]) {
    const u = (p - shatter.start) / (shatter.end - shatter.start)
    expect(u).toBeGreaterThanOrEqual(TORQUE_PACING_RAMP)
    expect(u).toBeLessThanOrEqual(1 - TORQUE_PACING_RAMP)
  }
  // Independent flat-top speed: 1 + (m - 1) / (1 - ramp) everywhere in the camera window.
  const plateau = 1 + (shatter.multiplier - 1) / (1 - TORQUE_PACING_RAMP)
  const h = 1e-7
  for (let i = 0; i <= 40; i++) {
    const p = lo + (hi - lo) * i / 40
    expect((distance(p + h, TORQUE_PACING_SPANS) - distance(p - h, TORQUE_PACING_SPANS)) / (2 * h)).toBeGreaterThanOrEqual(plateau - 1e-6)
  }
  // Retuning only the cracks/shatter pair shifts every later chapter by one constant and leaves the prefix alone.
  const alternative = TORQUE_PACING_SPANS.map(span => ({ ...span,
    multiplier: span.id === 'cracks' ? 2 : span.id === 'shatter' ? 4 : span.multiplier }))
  for (const p of [0, .2, .395]) expect(distance(p, TORQUE_PACING_SPANS)).toBe(distance(p, alternative))
  const delta = distance(1, TORQUE_PACING_SPANS) - distance(1, alternative)
  for (const p of [.505,.62,.94,1]) {
    expect(distance(p, TORQUE_PACING_SPANS) - distance(p, alternative)).toBeCloseTo(delta, 12)
  }
})

it('lengthens selected physical spans by their authored factors, preserving the close distance', () => {
  // Overlapping spans (cracks .36-.435 and shatter .42-.46) add their weights, so compare the full integral.
  for (const span of TORQUE_PACING_SPANS) {
    expect((physical(span.end) - physical(span.start)) * TORQUE_PACING_SCALE)
      .toBeCloseTo(distance(span.end, TORQUE_PACING_SPANS) - distance(span.start, TORQUE_PACING_SPANS), 12)
  }
  const ring = TORQUE_PACING_SPANS.find(span => span.id === 'ring')!
  expect((physical(ring.end) - physical(ring.start)) * TORQUE_PACING_SCALE)
    .toBeCloseTo(ring.multiplier * (ring.end - ring.start), 12)
  const explodedHold = TORQUE_PACING_SPANS.find(span => span.id === 'explodedHold')!
  expect((physical(explodedHold.end) - physical(explodedHold.start)) * TORQUE_PACING_SCALE)
    .toBeCloseTo(explodedHold.multiplier * (explodedHold.end - explodedHold.start), 12)
  expect((physical(1) - physical(.94)) * TORQUE_PACING_SCALE).toBeCloseTo(.06, 12)
})
it('preserves the drafting track and reserves the reallocated shatter tail in the stylesheet', () => {
  // Scene sets y = baseRange * distance(p), so a span that starts at .42 cannot move any p <= .42.
  const legacy = TORQUE_PACING_SPANS.filter(span => span.id !== 'shatter')
  for (let i = 0; i <= 420; i++) {
    const p = i / 1000
    expect(physical(p) * TORQUE_PACING_SCALE).toBeCloseTo(distance(p, legacy), 12)
  }
  const css = readFileSync(new URL('./torque-wrench.css', import.meta.url), 'utf8')
  const reserved = /--torque-pacing-extra:\s*([0-9.]+)vh/.exec(css)
  expect(reserved).not.toBeNull()
  expect(Number(reserved![1])).toBeCloseTo(TORQUE_SCROLL_VIEWPORTS * 100 * (TORQUE_PACING_SCALE - 1), 2)
})
it('maintains a flat-top trapezoidal plateau and inverts monotone seeks with strictly positive derivative', () => {
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'drafting')).toMatchObject({ start: .265, end: .395, multiplier: .45 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'shatter')).toMatchObject({ start: .42, end: .46, multiplier: 3.8 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'cracks')).toMatchObject({ start: .395, end: .435, multiplier: 1.5 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'ring')).toMatchObject({ start: .46, end: .505, multiplier: 5.3 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'switch')).toMatchObject({ start: .505, end: .56, multiplier: 2.1 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'isolation')).toMatchObject({ start: .56, end: .62, multiplier: 2.1 })
  // The shaper whip spans exactly the canonical shaper shot window, translated to native progress.
  const whip = TORQUE_PACING_SPANS.find(span => span.id === 'shaperWhip')!
  expect(whip.multiplier).toBe(.8)
  expect(whip.start).toBeCloseTo(BULLET_TIME_SHOT_SPECS.shaperContact.window[0] - .115, 12)
  expect(whip.end).toBeCloseTo(BULLET_TIME_SHOT_SPECS.shaperContact.window[1] - .115, 12)
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'hobSeat')).toMatchObject({ start: .7756, end: .7787, multiplier: 1.5 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'hobSwing')).toMatchObject({ start: .7778, end: .7892, multiplier: 5.5 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'extraction')).toMatchObject({ start: .855, end: .93, multiplier: 2 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'explodedHold')).toMatchObject({ start: .93, end: .94, multiplier: 8 })
  expect(TORQUE_PACING_SCALE).toBeCloseTo(1 + TORQUE_PACING_SPANS.reduce(
    (sum, span) => sum + (span.end - span.start) * (span.multiplier - 1), 0), 12)
  expect(TORQUE_PACING_SCALE).toBeCloseTo(2.11990648, 8)
  expect(TORQUE_SCROLL_VIEWPORTS * 100 * (TORQUE_PACING_SCALE - 1)).toBeCloseTo(4938.7875768, 6)
  expect(readFileSync(new URL('./torque-wrench.css', import.meta.url), 'utf8')).toContain('--torque-pacing-extra: 4938.7875768vh;')

  // Verify flat-top kernel constant derivative across interior [ramp, 1 - ramp]:
  const plateauSlope = 1 / (1 - TORQUE_PACING_RAMP)
  for (const u of [0.2, 0.35, 0.5, 0.65, 0.8]) {
    const du = 1e-6
    expect((torquePacingKernel(u + du) - torquePacingKernel(u - du)) / (2 * du)).toBeCloseTo(plateauSlope, 8)
  }

  let prior = -1
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000, f = physical(p)
    expect(f).toBeGreaterThan(prior)
    expect(narrative(f)).toBeCloseTo(p, 10)
    prior = f
  }
  for (const span of TORQUE_PACING_SPANS) for (const p of [span.start, span.end]) {
    // One-sided differences differ by h * f'' (spans now overlap), so shrink h; a true speed jump is O(1).
    const h = 1e-7
    const left = (physical(p) - physical(p - h)) / h
    const right = (physical(p + h) - physical(p)) / h
    expect(left).toBeGreaterThan(0)
    expect(left).toBeCloseTo(right, 3)
  }
  expect(narrative(0)).toBe(0); expect(narrative(1)).toBe(1)
  expect(() => narrative(NaN)).toThrow()
})

it('gives the 5.3x ring study ~10.45 viewports while expanding collision beats and the exploded hold to ~3.5 viewports', () => {
  const BASE = 39442.74225
  const vp = (a: number, b: number) => (BASE / 900) * (physical(b) - physical(a)) * TORQUE_PACING_SCALE
  // Ring study [.46, .505] at 5.3x: no neighbouring span overlaps it, so it is exactly 5.3 * .045 page units.
  expect(vp(0.46, 0.505)).toBeCloseTo((BASE / 900) * 5.3 * .045, 8)
  expect(vp(0.46, 0.505)).toBeCloseTo(10.45, 1)
  // Drafting dead zone [.265, .395] at 0.45x is compressed to ~2.56 viewports (down from 7.1+ viewports)
  expect(vp(0.265, 0.395)).toBeCloseTo(2.56, 1)
  // Rushed collision beats are expanded:
  expect(vp(0.505, 0.56)).toBeCloseTo(5.06, 1) // mechanism-switch (~5.0 vp)
  expect(vp(0.56, 0.62)).toBeCloseTo(5.52, 1)  // inspection-isolation (~5.5 vp)
  expect(vp(0.855, 0.93)).toBeCloseTo(6.57, 1) // mechanism-extraction (~6.5 vp)
  expect(vp(0.93, 0.94)).toBeCloseTo(3.51, 1)  // mechanism-exploded-hold (~3.5 vp)

  const at = (time: number) => {
    let lo = .46, hi = .505
    if (time <= 0) {
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (ringTimeAt(mid) <= 0) lo = mid; else hi = mid }
      return lo
    }
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (ringTimeAt(mid) < time) lo = mid; else hi = mid }
    return (lo + hi) / 2
  }
  expect(vp(at(0), at(28))).toBeGreaterThan(4.5)
})

const NATIVE = [
  { name: 'desktop 1440x900', base: 39442.74225, height: 900, aspect: 1440 / 900 },
  { name: 'narrow 390x844', base: 37198.67711, height: 844, aspect: 390 / 844 },
] as const

it('adds exactly two hob spans inside [.884,.905], each <= x8, on top of the T5 spans', () => {
  const extra = TORQUE_PACING_SPANS.filter(span => span.id === 'hobSeat' || span.id === 'hobSwing')
  expect(extra).toHaveLength(2)
  for (const span of extra) {
    expect(span.start).toBeGreaterThanOrEqual(.884-.115)
    expect(span.end).toBeLessThanOrEqual(.905-.115)
    expect(span.multiplier).toBeLessThanOrEqual(8)
  }
})

describe.each(NATIVE)('T6-C3 composed hob pacing at $name', ({ base, height, aspect }) => {
  const vp = (p: number) => physical(p-.115) * TORQUE_PACING_SCALE * base / height // native viewports from the top
  const h = 2e-6
  const rate = (p: number, read: (q: number) => number) => {
    const dvp = (vp(p + h) - vp(p - h)) // native viewports per progress step
    return (read(p + h) - read(p - h)) / dvp // channel units per native viewport (= per second at 1 vp/s)
  }
  const out = createPrivateInspectionSample()
  const subject = (p: number) => samplePrivateInspection(p, aspect, out).subjectTime
  const hobRev = (p: number) => hobPhiAt(subject(p)) / (2 * Math.PI)
  const camTy = (p: number) => samplePrivateInspection(p, aspect, out).camera.ty
  const grid: number[] = []
  for (let p = .884; p <= .905 + 1e-12; p += 5e-6) grid.push(p)

  it('keeps master <= 6.53 s/vp and the hob <= 3 rev/vp (<= 18 deg per frame at 1 vp/s, 60 fps)', () => {
    let master = 0, hob = 0
    for (const p of grid.slice(1, -1)) {
      master = Math.max(master, rate(p, subject))
      hob = Math.max(hob, rate(p, hobRev))
    }
    expect(master).toBeLessThanOrEqual(6.53)
    expect(hob).toBeLessThanOrEqual(3)
    expect(hob * 360 / 60).toBeLessThanOrEqual(18)
  })

  it('keeps the camera-target follow no faster than the old .884-.905 peak', () => {
    let peak = 0
    for (const p of grid.slice(1, -1)) peak = Math.max(peak, Math.abs(rate(p, camTy)))
    // Old peak (T5 composed pacing, previous knots) measured 0.0625 m/vp on this probe; the new
    // composition is roughly half that. The bound is the old peak.
    expect(peak).toBeLessThanOrEqual(0.0625)
  })

  // The legacy <=1 s/vp master bound covered a wider pre-retime swing window. The canonical gate is the
  // shot window itself: 2..4.5 native viewports, the full camera sweep, and a >=35 deg/vp camera.
  const cameraAzimuth = (p: number) => {
    const c = samplePrivateInspection(p, aspect, out).camera
    return Math.atan2(c.pz - c.tz, c.px - c.tx) * 180 / Math.PI
  }
  it.each(['shaperContact', 'hobContact', 'stage1Ignition'] as const)('gives the canonical %s window 2..4.5 native viewports, its full camera sweep and >=35 deg/vp', (id) => {
    const spec = BULLET_TIME_SHOT_SPECS[id]
    expect(spec.progressSpace).toBe('shaft-study')
    const [lo, hi] = spec.window
    const span = vp(hi) - vp(lo)
    expect(span, `${id} native viewports`).toBeGreaterThanOrEqual(2)
    expect(span, `${id} native viewports`).toBeLessThanOrEqual(4.5)
    const steps = 2000
    let last = cameraAzimuth(lo), lastVp = vp(lo), sweep = 0, peak = 0, hobPeak = 0
    for (let i = 1; i <= steps; i++) {
      const p = lo + (hi - lo) * i / steps
      const azimuth = cameraAzimuth(p)
      let step = azimuth - last
      while (step > 180) step -= 360
      while (step < -180) step += 360
      const nextVp = vp(p)
      sweep += step
      peak = Math.max(peak, Math.abs(step) / (nextVp - lastVp))
      if (id === 'hobContact' && i < steps) hobPeak = Math.max(hobPeak, rate(p, hobRev))
      last = azimuth; lastVp = nextVp
    }
    expect(Math.abs(sweep), `${id} camera sweep`).toBeGreaterThanOrEqual(spec.minCameraSweepDeg - 1e-9)
    expect(peak, `${id} peak camera deg per native viewport`).toBeGreaterThanOrEqual(35)
    // Feature alias guard retained inside the canonical hob window.
    if (id === 'hobContact') expect(hobPeak).toBeLessThanOrEqual(3)
  })

  it('keeps the shaper contact long enough and every p<=.884 scroll pixel independent of the hob spans', () => {
    expect(vp(.8282) - vp(.7915)).toBeGreaterThanOrEqual(1.5)
    const withoutHob = TORQUE_PACING_SPANS.filter(span => span.id !== 'hobSeat' && span.id !== 'hobSwing')
    for (let p = 0; p <= .884-.115; p += .004) {
      expect(physical(p) * TORQUE_PACING_SCALE).toBeCloseTo(distance(p, withoutHob), 12)
    }
  })
})


it.each(NATIVE)('keeps every shaft-study span inside the shaft chapter and every earlier pixel independent of it at $name', ({base}) => {
  // The pre-retime prefix pixel budget was intentionally re-authored (shatter 3.8, ring 5.3). What
  // remains invariant is ownership: shaft-study spans start at the .62 chapter join and end before
  // the .815 cascade allocation, so neither earlier pixels nor the cascade-local derivation move.
  const STUDY = ['shaft', 'shaperWhip', 'materials', 'hobSeat', 'hobSwing', 'ignitionWhip']
  const study = TORQUE_PACING_SPANS.filter(s => STUDY.includes(s.id))
  expect(study.map(s => s.id).sort()).toEqual([...STUDY].sort())
  for (const span of study) {
    expect(span.start).toBeGreaterThanOrEqual(.62)
    expect(span.id === 'shaft' || span.end <= .815).toBe(true)
  }
  const others = TORQUE_PACING_SPANS.filter(s => !STUDY.includes(s.id))
  for (let j = 0; j <= 2000; j++) {
    const p = .62 * j / 2000
    expect(Math.abs((distance(p, TORQUE_PACING_SPANS) - distance(p, others)) * base)).toBeLessThan(.000001)
  }
})

it('adds actual native travel for the continuation while preserving every incoming pixel', () => {
  const before = TORQUE_PACING_SPANS.filter(span => span.id !== 'cascade')
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'cascade')).toMatchObject({ start: .815, end: .825, multiplier: 24.095648 })
  for (let i = 0; i <= 815; i++) expect(distance(i / 1000, TORQUE_PACING_SPANS)).toBeCloseTo(distance(i / 1000, before), 12)
  const added = distance(.825, TORQUE_PACING_SPANS) - distance(.825, before)
  expect(added).toBeCloseTo(.23095648, 12)
  expect(added * TORQUE_SCROLL_VIEWPORTS).toBeCloseTo(10.185180768, 8)
})
