import { describe, expect, it } from 'vitest'
import { torqueScrollFraction as physical, torqueNarrativeProgress as narrative,
  TORQUE_PACING_SCALE, TORQUE_PACING_SPANS } from './scrollPacing'
import { readFileSync } from 'node:fs'
import { TORQUE_SCROLL_VIEWPORTS } from './beats'
import { createPrivateInspectionSample, ringTimeAt, samplePrivateInspection } from './InspectionDirector'
import { hobPhiAt } from '../inspection/shaft/kinematics'

/** Independent restatement of the span integral: distance(p) = p + sum (b-a)(m-1) g((p-a)/(b-a)). */
const g = (u: number) => { const c = Math.max(0, Math.min(1, u)); return c - Math.sin(2 * Math.PI * c) / (2 * Math.PI) }
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
it('inverts monotone seeks in both directions with continuous boundary speed', () => {
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'shatter')).toMatchObject({ start: .42, end: .46, multiplier: 3 })
  expect(TORQUE_PACING_SCALE).toBeCloseTo(1 + TORQUE_PACING_SPANS.reduce(
    (sum, span) => sum + (span.end - span.start) * (span.multiplier - 1), 0), 12)
  // cracks .075*1 + shatter .04*2 + ring .045*17 + shaft .205*1 + hobSeat .0031*3.8 + hobSwing .0114*3.2
  expect(TORQUE_PACING_SCALE).toBeCloseTo(2.125 + .0031 * 3.8 + .0114 * 3.2, 12)
  expect(TORQUE_PACING_SCALE).toBeCloseTo(2.17326, 5)
  expect(TORQUE_PACING_SPANS.find(span => span.id === 'ring')).toMatchObject({ start: .46, end: .505, multiplier: 18 })

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
    expect((physical(p) - physical(p - h)) / h)
      .toBeCloseTo((physical(p + h) - physical(p)) / h, 3)
  }
  expect(narrative(0)).toBe(0); expect(narrative(1)).toBe(1)
  expect(() => narrative(NaN)).toThrow()
})

it('gives the relocated ring study at least twice the native scroll of the old .69-.735 x8 span', () => {
  // baseRange is the viewport-independent 44.1-viewport range measured at 1440x900 (actualRange = base * scale).
  const BASE = 39442.74225
  type Span = { start: number, end: number, multiplier: number }
  const oldSpans: Span[] = TORQUE_PACING_SPANS.map(span => span.id === 'ring'
    ? { start: .69, end: .735, multiplier: 8 } : ['shaft','hobSeat','hobSwing'].includes(span.id) ? { ...span, start: span.start+.115, end: span.end+.115 } : span)
  const px = (a: number, b: number, spans: readonly Span[]) => BASE * (distance(b, spans) - distance(a, spans))
  const at = (time: number) => {
    let lo = .46, hi = .505
    // time 0 is the END of the held approach (operation starts when ringTime leaves 0): largest p with time <= 0.
    if (time <= 0) {
      for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (ringTimeAt(mid) <= 0) lo = mid; else hi = mid }
      return lo
    }
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (ringTimeAt(mid) < time) lo = mid; else hi = mid }
    return (lo + hi) / 2
  }
  // Baseline progress of the same display seconds, from the previous ring clock (.703/.7075/.709/.716/.7211/.735).
  expect(px(.703, .735, oldSpans)).toBeCloseTo(12015.99, -1)
  expect(px(.7075112385574371, .7211199525296335, oldSpans)).toBeCloseTo(7408.35, -1)
  expect(px(.709, .716, oldSpans)).toBeCloseTo(4065.46, -1)
  const next = TORQUE_PACING_SPANS
  const operation = px(at(0), at(28), next) // t=0 is the last held knot's end: [.4725,.4945]
  expect(operation).toBeGreaterThanOrEqual(24032)
  expect(px(at(6), at(22.975), next)).toBeGreaterThanOrEqual(14817)
  expect(px(at(8), at(18), next)).toBeGreaterThanOrEqual(8131)
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
  expect(TORQUE_PACING_SPANS.filter(span => span.id !== 'hobSeat' && span.id !== 'hobSwing'))
    .toEqual([
      { start: .36, end: .435, multiplier: 2, id: 'cracks' }, { start: .42, end: .46, multiplier: 3, id: 'shatter' },
      { start: .46, end: .505, multiplier: 18, id: 'ring' }, { start: .62, end: .825, multiplier: 2, id: 'shaft' },
    ])
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
  const before = TORQUE_PACING_SPANS.map(s => ['shaft','hobSeat','hobSwing'].includes(s.id) ? {...s,start:s.start+.115,end:s.end+.115}:s)
  for(let j=0;j<=2000;j++) {
    const p=.56*j/2000
    expect(Math.abs((distance(p,before)-distance(p,TORQUE_PACING_SPANS))*base)).toBeLessThan(.000001)
    const q=.735+.205*j/2000
    const old=distance(q,before)-distance(.735,before)
    const next=distance(q-.115,TORQUE_PACING_SPANS)-distance(.62,TORQUE_PACING_SPANS)
    expect(Math.abs((old-next)*base)).toBeLessThan(.000001)
  }
})
