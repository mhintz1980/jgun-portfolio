import { describe, expect, it } from 'vitest'
import { torqueScrollFraction as physical, torqueNarrativeProgress as narrative,
  TORQUE_PACING_RAMP, TORQUE_PACING_SCALE, TORQUE_PACING_SPANS, torquePacingKernel } from './scrollPacing'
import { readFileSync } from 'node:fs'
import { TORQUE_SCROLL_VIEWPORTS } from './beats'
import { createPrivateInspectionSample, ringTimeAt, samplePrivateInspection } from './InspectionDirector'
import { hobPhiAt } from '../inspection/shaft/kinematics'

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
it('keeps every pre-shatter scroll pixel fixed and reserves the paced tail in the stylesheet', () => {
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
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'shatter')).toMatchObject({ start: .42, end: .46, multiplier: 3.5 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'ring')).toMatchObject({ start: .46, end: .505, multiplier: 4.5 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'switch')).toMatchObject({ start: .505, end: .56, multiplier: 2.1 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'isolation')).toMatchObject({ start: .56, end: .62, multiplier: 2.1 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'extraction')).toMatchObject({ start: .855, end: .93, multiplier: 2 })
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'explodedHold')).toMatchObject({ start: .93, end: .94, multiplier: 8 })
  expect(TORQUE_PACING_SCALE).toBeCloseTo(1 + TORQUE_PACING_SPANS.reduce(
    (sum, span) => sum + (span.end - span.start) * (span.multiplier - 1), 0), 12)
  expect(TORQUE_PACING_SCALE).toBeCloseTo(1.83633, 5)

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

it('rebalances the ring study to ~8.9 viewports while expanding collision beats and the exploded hold to ~3.5 viewports', () => {
  const BASE = 39442.74225
  const vp = (a: number, b: number) => (BASE / 900) * (physical(b) - physical(a)) * TORQUE_PACING_SCALE
  // Ring study [.46, .505] at 4.5x is ~8.9 viewports (down from 35.5 viewports at 18x)
  expect(vp(0.46, 0.505)).toBeCloseTo(8.87, 1)
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

  it('gives the >=60 deg swing window >=2 native viewports at <=1 s/vp of master', () => {
    const lo = .89116, hi = .89888
    expect(vp(hi) - vp(lo)).toBeGreaterThanOrEqual(2)
    let peak = 0
    for (let p = lo; p <= hi; p += 5e-6) peak = Math.max(peak, rate(p, subject))
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('keeps the shaper contact long enough without local pacing and keeps p<=.884 scroll pixels', () => {
    expect(vp(.8282) - vp(.7915)).toBeGreaterThanOrEqual(1.5)
    const withoutHob = TORQUE_PACING_SPANS.filter(span => span.id !== 'hobSeat' && span.id !== 'hobSwing')
    for (let p = 0; p <= .884-.115; p += .004) {
      expect(physical(p) * TORQUE_PACING_SCALE).toBeCloseTo(distance(p, withoutHob), 12)
    }
  })
})


it.each(NATIVE)('preserves every prefix pixel and every translated shaft distance at $name', ({base}) => {
  const before = TORQUE_PACING_SPANS.filter(s => !['return','extraction','explodedHold'].includes(s.id)).map(s => ['shaft','materials','hobSeat','hobSwing'].includes(s.id) ? {...s,start:s.start+.115,end:s.end+.115}:s)
  const after = TORQUE_PACING_SPANS.filter(s => !['return','extraction','explodedHold'].includes(s.id))
  for(let j=0;j<=2000;j++) {
    const p=.56*j/2000
    expect(Math.abs((distance(p,before)-distance(p,after))*base)).toBeLessThan(.000001)
    const q=.735+.205*j/2000
    const old=distance(q,before)-distance(.735,before)
    const next=distance(q-.115,after)-distance(.62,after)
    expect(Math.abs((old-next)*base)).toBeLessThan(.000001)
  }
})
