import { expect, it } from 'vitest'
import { breakthroughSubjectTimeAt, breakthroughTimeAt, createOpeningSampler, openingTimeAt, sampleOpening,
  SHATTER_SUBJECT_KNOTS } from './OpeningDirector'
import { TORQUE_PACING_SCALE, torqueScrollFraction } from './scrollPacing'
import { BULLET_TIME_RATE } from './bulletTime'

it('suspends breakthrough physics while the continuous camera path keeps moving', () => {
  const a = .868, b = .922
  expect(breakthroughTimeAt(b) - breakthroughTimeAt(a)).toBeLessThan((b - a) * .15)
  expect(breakthroughTimeAt(.84)).toBe(.84)
  expect(breakthroughTimeAt(1)).toBe(1)
  const times = [.84, .85, .86, .89, .93, .95, .99, 1]
  const forward = times.map(breakthroughTimeAt)
  expect(times.slice().reverse().map(breakthroughTimeAt).reverse()).toEqual(forward)
  expect(forward.every((t, i) => !i || t >= forward[i - 1])).toBe(true)
})

it('aligns intact pressure, first rupture and completed emergence to canonical beats', () => {
  expect(openingTimeAt(0.395)).toBeCloseTo(0.79)
  expect(openingTimeAt(0.42)).toBeCloseTo(0.84)
  expect(openingTimeAt(0.46)).toBe(1)
  const samples = [0, .265, .32, .36, .395, .42, .435, .46, 1]
  const forward = samples.map(p => sampleOpening(p))
  expect(samples.slice().reverse().map(p => sampleOpening(p)).reverse()).toEqual(forward)
  expect(() => openingTimeAt(NaN)).toThrow()
  for (let i = 1; i < samples.length; i++) expect(forward[i].t).toBeGreaterThanOrEqual(forward[i - 1].t)
})

it('installs a solved crossing while progress is held, then freezes the exact sampled state', () => {
  const sample = createOpeningSampler()
  const progress = 0.435
  const fallback = sample(progress)
  expect(sample(progress)).toBe(fallback)
  const installed = sample(progress, 0.865)
  expect(installed).toEqual(sampleOpening(progress, 0.865))
  expect(installed).not.toBe(fallback) // crossing invalidates even when both waves have not begun
  const sensitiveProgress = Array.from({ length: 1001 }, (_, i) => i * 0.46 / 1000)
    .find(p => sampleOpening(p, 0.865).lightSweepPosition !== sampleOpening(p, 0.9).lightSweepPosition)
  expect(sensitiveProgress).toBeDefined()
  const beforeWave = sample(sensitiveProgress!, 0.9)
  const solvedWave = sample(sensitiveProgress!, 0.865)
  expect(solvedWave).not.toEqual(beforeWave)
  expect(solvedWave).toEqual(sampleOpening(sensitiveProgress!, 0.865))
  const heldAgain = sample(progress, 0.865)
  expect(heldAgain).toEqual(installed)
  expect(sample(progress, 0.865)).toBe(heldAgain)
  // Returning to the old crossing retraces its state without traversal history.
  expect(sample(progress, 0.9)).toEqual(fallback)
  expect(() => sample(NaN, 0.865)).toThrow()
  expect(sample(progress, 0.9)).toEqual(fallback)
})

it('starts cracking shortly after lights-out, completes in 4 bursts with C1 holds, and keeps shatter timing intact', () => {
  // Lights-out (lampPower <= 0.03) occurs around progress 0.343; first burst starts at progress ~0.348.
  const lightsOut = sampleOpening(0.343)
  expect(lightsOut.lampPower).toBeLessThanOrEqual(0.03)
  expect(lightsOut.sparkAnticipation).toBeGreaterThan(0)
  expect(lightsOut.pulseHead).toBe(0)

  const firstBurst = sampleOpening(0.351)
  expect(firstBurst.pulseHead).toBeGreaterThan(0.05)
  expect(firstBurst.sparkAnticipation).toBe(0)

  // Exact plateaus in the 3 holds between the 4 outline bursts:
  const hold1A = sampleOpening(0.356), hold1B = sampleOpening(0.362)
  expect(hold1A.pulseHead).toBeCloseTo(0.24, 6)
  expect(hold1B.pulseHead).toBeCloseTo(0.24, 6)
  const hold2A = sampleOpening(0.371), hold2B = sampleOpening(0.374)
  expect(hold2A.pulseHead).toBeCloseTo(0.52, 6)
  expect(hold2B.pulseHead).toBeCloseTo(0.52, 6)
  const hold3A = sampleOpening(0.379), hold3B = sampleOpening(0.380)
  expect(hold3A.pulseHead).toBeCloseTo(0.82, 6)
  expect(hold3B.pulseHead).toBeCloseTo(0.82, 6)

  // Outline finishes and web begins around progress 0.383, completing by progress 0.407.
  const outlineDone = sampleOpening(0.383)
  expect(outlineDone.pulseHead).toBe(1)
  expect(sampleOpening(0.386).crackGrowth).toBeGreaterThan(0)
  expect(sampleOpening(0.407).crackGrowth).toBe(1)

  // Monotone completion and C1 continuity across the entire electrical window.
  let prevHead = 0, prevWeb = 0, prevHeadStep = 0
  for (let i = 0; i <= 400; i++) {
    const p = 0.34 + (i / 400) * 0.08
    const s = sampleOpening(p)
    expect(s.pulseHead).toBeGreaterThanOrEqual(prevHead - 1e-12)
    expect(s.crackGrowth).toBeGreaterThanOrEqual(prevWeb - 1e-12)
    const headStep = s.pulseHead - prevHead
    if (i > 1) expect(Math.abs(headStep - prevHeadStep)).toBeLessThan(0.025)
    prevHead = s.pulseHead; prevWeb = s.crackGrowth; prevHeadStep = headStep
  }

  // Shatter (fracture) boundaries remain unchanged at progress 0.42..0.46.
  expect(sampleOpening(0.42).fracture).toBe(0)
  expect(sampleOpening(0.422).fracture).toBeGreaterThan(0)
  expect(sampleOpening(0.454).fracture).toBeLessThan(1)
  expect(sampleOpening(0.456).fracture).toBe(1)
})

const fnv = (text: string, seed: number) => {
  let h = seed >>> 0
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return h.toString(16)
}
/** Measured native document range: 39442.74 px / 900 px viewport. */
const BASE_VIEWPORTS = 43.825
const nativeViewports = (p: number) => torqueScrollFraction(p) * TORQUE_PACING_SCALE * BASE_VIEWPORTS
const event = (t: number) => Math.max(0, Math.min(1, (t - .84) / .04))

it('leaves every full IntroState through progress .42 byte-identical to the pre-T6 opening', () => {
  // Digests recorded from the unmodified source: 4,201 serialized states at p = i * 1e-4 and .42.
  const parts: string[] = []
  for (let i = 0; i < 4200; i++) parts.push(JSON.stringify(sampleOpening(i * 1e-4)))
  parts.push(JSON.stringify(sampleOpening(0.42)))
  const joined = parts.join('|')
  expect([fnv(joined, 2166136261), fnv(joined, 305419896), joined.length]).toEqual(['27d708f1', 'ac28bd20', 1632744])
  for (let i = 0; i <= 4200; i++) {
    const p = i * 1e-4
    expect(breakthroughSubjectTimeAt(p)).toBe(breakthroughTimeAt(openingTimeAt(p)))
  }
})

it('runs the shatter subject clock monotone, C1 at .42, ending exactly at t = 1', () => {
  expect(SHATTER_SUBJECT_KNOTS[0]).toEqual([.42, .84])
  expect(SHATTER_SUBJECT_KNOTS[3][1]).toBeCloseTo(
    .855 + (openingTimeAt(.452) - openingTimeAt(.43008)) * BULLET_TIME_RATE, 12,
  )
  expect(SHATTER_SUBJECT_KNOTS[3][1]).toBeGreaterThan(.857)
  expect(breakthroughSubjectTimeAt(.46)).toBe(1)
  expect(breakthroughSubjectTimeAt(1)).toBe(1)
  expect(() => breakthroughSubjectTimeAt(NaN)).toThrow()
  let prior = -1
  for (let i = 0; i <= 8000; i++) {
    const t = breakthroughSubjectTimeAt(.4 + i * 1e-5)
    expect(t).toBeGreaterThanOrEqual(prior)
    prior = t
  }
  const h = 1e-6
  const normalRate = (openingTimeAt(.43612 + h) - openingTimeAt(.43612 - h)) / (2 * h)
  const subjectRate = (breakthroughSubjectTimeAt(.43612 + h) - breakthroughSubjectTimeAt(.43612 - h)) / (2 * h)
  expect(subjectRate / normalRate).toBeCloseTo(BULLET_TIME_RATE, 6)
  for (const boundary of [.43008, .452]) {
    const epsilon = 1e-7
    const leftRatio = ((breakthroughSubjectTimeAt(boundary) - breakthroughSubjectTimeAt(boundary - epsilon))
      / (openingTimeAt(boundary) - openingTimeAt(boundary - epsilon)))
    const rightRatio = ((breakthroughSubjectTimeAt(boundary + epsilon) - breakthroughSubjectTimeAt(boundary))
      / (openingTimeAt(boundary + epsilon) - openingTimeAt(boundary)))
    expect(leftRatio).toBeCloseTo(BULLET_TIME_RATE, 3)
    expect(rightRatio).toBeCloseTo(BULLET_TIME_RATE, 3)
    expect(Math.abs(leftRatio - rightRatio)).toBeLessThan(0.002)
  }
  const left = (breakthroughSubjectTimeAt(.42) - breakthroughSubjectTimeAt(.42 - h)) / h
  const right = (breakthroughSubjectTimeAt(.42 + h) - breakthroughSubjectTimeAt(.42)) / h
  expect(Math.abs(right - left)).toBeLessThan(1e-3)
  // Seek and reverse evaluation are order independent.
  const ps = Array.from({ length: 41 }, (_, i) => .42 + i * .001)
  expect(ps.slice().reverse().map(breakthroughSubjectTimeAt).reverse()).toEqual(ps.map(breakthroughSubjectTimeAt))
})

it('holds shard separation nearly still, then releases within the native-viewport rate bound', () => {
  const hold = [.43008, .452]
  const e0 = event(breakthroughSubjectTimeAt(hold[0])), e1 = event(breakthroughSubjectTimeAt(hold[1]))
  expect(e1 - e0).toBeGreaterThan(0)
  expect(e1 - e0).toBeLessThanOrEqual(.25)
  expect(nativeViewports(hold[1]) - nativeViewports(hold[0])).toBeGreaterThan(2)
  let peak = 0
  const h = 1e-6
  for (let p = .42; p <= .46; p += 2e-5) {
    const rate = (event(breakthroughSubjectTimeAt(p + h)) - event(breakthroughSubjectTimeAt(p - h)))
      / (nativeViewports(p + h) - nativeViewports(p - h))
    peak = Math.max(peak, rate)
    if (p >= hold[0] && p <= hold[1]) expect(rate).toBeLessThan(.12)
  }
  expect(peak).toBeLessThanOrEqual(1.5)
  expect(sampleOpening(.46).t).toBe(1)
})

it('keeps the post-shatter glow fade and lamp return tightly joined to the pre-T6 clock', () => {
  const legacy = (p: number) => breakthroughTimeAt(openingTimeAt(p))
  const invert = (clock: (p: number) => number, t: number) => {
    let low = .42, high = .46
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2
      if (clock(mid) < t) low = mid; else high = mid
    }
    return (low + high) / 2
  }
  for (const t of [.9, .92, .94, .96, .98, .99]) {
    expect(Math.abs(invert(breakthroughSubjectTimeAt, t) - invert(legacy, t))).toBeLessThanOrEqual(.01)
  }
  // Owner extended the airborne hold on 2026-10-21; the release now lands at
  // .456 and still completes before the Ring Switch window at .46.
  expect(invert(breakthroughSubjectTimeAt, .88)).toBeLessThanOrEqual(.456)
})
