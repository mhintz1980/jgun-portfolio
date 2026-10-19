import { expect, it } from 'vitest'
import { breakthroughTimeAt, createOpeningSampler, openingTimeAt, sampleOpening } from './OpeningDirector'

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
  expect(sampleOpening(0.448).fracture).toBe(1)
})
