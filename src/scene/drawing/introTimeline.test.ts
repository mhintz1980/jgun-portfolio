import { describe, expect, it } from 'vitest'
const smooth01 = (value: number) => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x) }
import { BRANCH_START_T } from './electricalScore'
import {
  DRAWING_INTRO_WINDOW,
  REDUCED_MOTION_INTRO_T,
  INTRO_PHASES,
  INTRO_SCROLL_SHARE,
  OPENING_CLOSE_READ_ANCHORS,
  OPENING_CLOSE_READ_END_RAW,
  OPENING_CLOSE_READ_END_T,
  drawingIntroState,
  introRawFraction,
  introTimeFromRaw,
  introPoseTime,
  introScrollTimeFor,
  pacedProgress,
  rawScrollFor,
  remapHeroProgress,
} from './introTimeline'

/**
 * Representative solved pose-time for the extraction crossing. The live value comes from
 * solveExtraction() against the real mesh, and the 2026-10-01 revision moved it earlier
 * (~.6 pose); a constant here lets the scroll-axis windows be exercised without the GLB.
 */
const SOLVED_CROSSING = 0.6
/** The pre-revision browser-derived crossing, kept to prove the legacy wave fields still run. */
const LEGACY_CROSSING = 0.8993818764962211

describe('intro pacing map', () => {
  it('gives the intro its .50 scroll share and leaves the downstream axis linear', () => {
    expect(pacedProgress(0)).toBe(0)
    expect(pacedProgress(1)).toBeCloseTo(1, 12)
    expect(pacedProgress(INTRO_SCROLL_SHARE)).toBeCloseTo(DRAWING_INTRO_WINDOW.releaseEnd, 12)
    // The storm opening stretches the same 0.12 of progress over .50 of the document.
    expect(INTRO_SCROLL_SHARE).toBe(0.5)
    expect(rawScrollFor(DRAWING_INTRO_WINDOW.releaseEnd)).toBeCloseTo(INTRO_SCROLL_SHARE, 9)
  })

  it('keeps every downstream progress span proportional to its raw scroll span', () => {
    // Two equal raw spans well clear of the handoff blend must cover equal progress.
    const a = pacedProgress(0.7) - pacedProgress(0.6)
    const b = pacedProgress(0.9) - pacedProgress(0.8)
    expect(a).toBeCloseTo(b, 12)
    // and that slope is exactly 0.88 of progress over (1 - share) of scroll.
    expect(a).toBeCloseTo((0.1 * (1 - DRAWING_INTRO_WINDOW.releaseEnd)) / (1 - INTRO_SCROLL_SHARE), 12)
  })

  it('is monotonic across the handoff blend', () => {
    let previous = -1
    for (let i = 0; i <= 2000; i += 1) {
      const value = pacedProgress(i / 2000)
      expect(value).toBeGreaterThan(previous)
      previous = value
    }
  })

  it('round-trips through the inverse used by deep links and capture', () => {
    for (const p of [0, 0.02, 0.12, 0.13, 0.4, 0.525, 0.76, 1]) {
      expect(pacedProgress(rawScrollFor(p))).toBeCloseTo(p, 10)
    }
  })

  it('crosses the .50 handoff continuously with both slopes intact', () => {
    const share = INTRO_SCROLL_SHARE
    // No jump across the blend centre.
    expect(pacedProgress(share + 1e-9) - pacedProgress(share - 1e-9)).toBeLessThan(1e-7)
    // Intro pace before the blend, downstream pace after it.
    const before = pacedProgress(share - 0.03) - pacedProgress(share - 0.05)
    const after = pacedProgress(share + 0.05) - pacedProgress(share + 0.03)
    expect(before).toBeCloseTo((0.02 * DRAWING_INTRO_WINDOW.releaseEnd) / INTRO_SCROLL_SHARE, 10)
    expect(after).toBeCloseTo((0.02 * (1 - DRAWING_INTRO_WINDOW.releaseEnd)) / (1 - INTRO_SCROLL_SHARE), 10)
  })
})

describe('opening close-reading scroll remap (JG-035 O3)', () => {
  const identityRaw = (t: number) => t * INTRO_SCROLL_SHARE
  const slope = (f: (x: number) => number, x: number, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h)

  it('passes exactly through every authored anchor', () => {
    for (const [t, raw] of OPENING_CLOSE_READ_ANCHORS) expect(introRawFraction(t)).toBeCloseTo(raw, 12)
  })

  it('adds the owner-targeted extra close-reading scroll at the establishing and settle shots', () => {
    // At a 100 s linear sweep, raw fraction * 100 = seconds into the sweep.
    expect((introRawFraction(0.29) - identityRaw(0.29)) * 100).toBeCloseTo(3.5, 9)
    expect((introRawFraction(0.38) - identityRaw(0.38)) * 100).toBeCloseTo(4, 9)
    // The recognition hold keeps its raw width (.38-.45 = .035 raw = 3.5 s at 100 s).
    expect((introRawFraction(0.45) - introRawFraction(0.38)) * 100).toBeCloseTo(3.5, 9)
  })

  it('is strictly increasing with a positive derivative everywhere (no slope-pinning reversal)', () => {
    let minSlope = Infinity
    for (let i = 1; i < 20000; i += 1) minSlope = Math.min(minSlope, slope(introRawFraction, i / 20000))
    // Measured minimum d(raw)/dt is ~.165 (t .60-.62, inside the dark hold): ~3x faster than identity, never stalled.
    expect(minSlope).toBeGreaterThan(0.16)
    let previous = -1
    for (let i = 0; i <= 5000; i += 1) {
      const raw = introRawFraction(i / 5000)
      expect(raw).toBeGreaterThan(previous)
      previous = raw
    }
  })

  it('joins the unchanged intro slope C1 at t .66 / raw .33 and keeps the identity beyond', () => {
    expect(OPENING_CLOSE_READ_END_T).toBe(0.66)
    expect(OPENING_CLOSE_READ_END_RAW).toBe(0.33)
    expect(introRawFraction(0.66)).toBeCloseTo(identityRaw(0.66), 12)
    // One-sided limits of the derivative at the join (the cubic bends hard in the last .04 of t).
    expect(slope(introRawFraction, 0.66 - 1e-5, 1e-6)).toBeCloseTo(INTRO_SCROLL_SHARE, 3)
    expect(slope(introRawFraction, 0.66 + 1e-5, 1e-6)).toBeCloseTo(INTRO_SCROLL_SHARE, 6)
    for (const t of [0.66, 0.7, 0.765, 0.79, 0.88, 1]) expect(introRawFraction(t)).toBeCloseTo(identityRaw(t), 12)
    // Starts at the old pace too, so the opening focus rack does not lurch.
    expect(slope(introRawFraction, 1e-3)).toBeCloseTo(INTRO_SCROLL_SHARE, 2)
  })

  it('leaves pacedProgress untouched from raw .33 on (trace, rupture, rise, downstream)', () => {
    const oldPaced = (s: number) => s <= INTRO_SCROLL_SHARE ? (DRAWING_INTRO_WINDOW.releaseEnd / INTRO_SCROLL_SHARE) * s : null
    for (let i = 0; i <= 170; i += 1) {
      const s = 0.33 + (i / 170) * (INTRO_SCROLL_SHARE - 0.33)
      expect(pacedProgress(s)).toBeCloseTo(oldPaced(s)!, 12)
    }
    expect(pacedProgress(0.33)).toBeCloseTo(0.12 * 0.66, 12)
  })

  it('inverts exactly through introTimeFromRaw and rawScrollFor', () => {
    for (let i = 0; i <= 200; i += 1) {
      const t = i / 200
      expect(introTimeFromRaw(introRawFraction(t))).toBeCloseTo(t, 9)
    }
    for (const p of [0.001, 0.006, 0.0348, 0.045, 0.054, 0.0696, 0.0792, 0.1, 0.12]) {
      expect(pacedProgress(rawScrollFor(p))).toBeCloseTo(p, 10)
    }
  })

  it('keeps the rest of the paced axis monotone with a continuous slope at the join', () => {
    const f = (s: number) => pacedProgress(s)
    expect(slope(f, 0.33 - 1e-6, 1e-7)).toBeCloseTo(slope(f, 0.33 + 1e-6, 1e-7), 3)
    let previous = -1
    for (let i = 0; i <= 4000; i += 1) {
      const value = f(i / 4000)
      expect(value).toBeGreaterThan(previous)
      previous = value
    }
  })
})

describe('intro phase map', () => {
  it('parks reduced motion on the measured lit hold, before flicker and excitation', () => {
    const state = drawingIntroState(REDUCED_MOTION_INTRO_T * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(state.focus).toBe(1)
    expect(state.lampPower).toBe(1)
    expect(state.blackout).toBe(0)
    expect(state.readingPool).toBe(0)
    expect(state.pulse).toBe(0)
    expect(state.pbr).toBe(0)
    expect(state.illumination).toBe(0)
    expect(state.perspective).toBe(0)
    expect(state.drawingOpacity).toBe(1)
    // Every breakthrough channel is still at rest at the park.
    expect(state.pressure).toBe(0)
    expect(state.fracture).toBe(0)
    expect(state.crackWeb).toBe(0)
    expect(state.crackGlow).toBe(0)
    expect(state.openingClear).toBe(0)
    // The camera settle is owned by onboardEnd, not by the later electrical pulse.
    expect(REDUCED_MOTION_INTRO_T).toBe(INTRO_PHASES.onboardEnd)
    // The lit recognition hold (.38-.45) is fully lit across its whole authored span.
    for (let i = 0; i <= 40; i += 1) {
      const t = INTRO_PHASES.onboardEnd + (i / 40) * (INTRO_PHASES.flickerStart - INTRO_PHASES.onboardEnd)
      expect(drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd).lampPower).toBe(1)
    }
    expect(INTRO_PHASES.onboardEnd).toBeLessThan(INTRO_PHASES.flickerStart)
    expect(INTRO_PHASES.flickerStart).toBeLessThan(INTRO_PHASES.pulseStart)
    // The solved extraction has not begun; the still is fully registered.
    expect(state.poseT).toBeLessThan(0.4)
  })

  it('orders every blackout, breakthrough, lamp, and camera boundary deterministically', () => {
    const p = INTRO_PHASES
    expect(p.focusEnd).toBe(p.onboardStart)
    expect(p.onboardEnd).toBeLessThan(p.flickerStart)
    expect(p.flickerStart).toBeLessThan(p.blackoutStart)
    expect(p.blackoutStart).toBeLessThan(p.pulseStart)
    expect(p.pulseStart).toBeLessThan(p.pulseEnd)
    expect(p.pulseEnd).toBe(p.registrationEnd)
    expect(p.registrationEnd).toBe(p.bulgeStart)
    expect(p.bulgeStart).toBeLessThan(p.fractureStart)
    expect(p.fractureEnd).toBeLessThan(p.lampReturnStart)
    expect(p.lampReturnStart).toBeLessThan(p.lampReturnEnd)
    expect(p.lampReturnEnd).toBe(1)
    // The model pushes first and is fully resolved before fragments open gaps.
    expect(p.fractureEnd).toBe(p.detachStart)
    expect(p.riseStart).toBe(p.bulgeStart)
    expect(p.metalStart + 0.02).toBeLessThan(p.fractureStart)
    // The shockwave arms before the camera orbit opens; both resolve inside the intro.
    expect(p.riseStart).toBeLessThan(p.orbitStart)
    expect(p.detachStart).toBeLessThan(p.waveEnd)
    expect(p.orbitStart).toBeLessThan(p.waveEnd)
    expect(p.waveEnd).toBeLessThan(1)
  })

  it('pins the breakthrough phase contract to the authored boundaries', () => {
    expect(INTRO_PHASES.focusEnd).toBe(0.05)
    expect(INTRO_PHASES.onboardStart).toBe(0.05)
    expect(INTRO_PHASES.onboardEnd).toBe(0.38)
    expect(INTRO_PHASES.flickerStart).toBe(0.45)
    expect(INTRO_PHASES.blackoutStart).toBe(0.58)
    expect(INTRO_PHASES.pulseStart).toBe(0.66)
    expect(INTRO_PHASES.pulseEnd).toBe(0.79)
    expect(INTRO_PHASES.registrationEnd).toBe(0.79)
    expect(INTRO_PHASES.bulgeStart).toBe(0.79)
    expect(INTRO_PHASES.lampReturnStart).toBe(0.96)
    expect(INTRO_PHASES.lampReturnEnd).toBe(1)
    expect(INTRO_PHASES.fractureStart).toBe(0.84)
    expect(INTRO_PHASES.fractureEnd).toBe(0.88)
    expect(INTRO_PHASES.detachStart).toBe(0.88)
    expect(INTRO_PHASES.metalStart).toBe(0.8)
    expect(INTRO_PHASES.riseStart).toBe(0.79)
    expect(INTRO_PHASES.orbitStart).toBe(0.9)
    expect(INTRO_PHASES.waveEnd).toBe(0.97)
    expect(REDUCED_MOTION_INTRO_T).toBe(0.38)
  })

  it('suppresses the measured reading pool before the stable hold and flicker', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(state(0.24).readingPool).toBe(1)
    expect(state(0.25).readingPool).toBe(1)
    expect(state(0.275).readingPool).toBeGreaterThan(0)
    expect(state(0.275).readingPool).toBeLessThan(1)
    expect(state(0.3).readingPool).toBe(0)
    for (const t of [0.3, 0.34, 0.38, 0.4, 0.44]) {
      expect(state(t).readingPool).toBe(0)
      expect(state(t).lampPower).toBe(1)
    }
  })

  it('traces the immutable five-failure lamp envelope between lit hold and blackout', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { flickerStart, blackoutStart } = INTRO_PHASES
    const span = blackoutStart - flickerStart
    const atU = (u: number) => state(flickerStart + u * span).lampPower
    // u is failure-local time; the keys are the immutable art-directed envelope.
    const keys: [number, number][] = [
      [0.12, 0.58], [0.18, 0.92],
      [0.28, 0.14], [0.34, 0.78],
      [0.46, 0.36], [0.51, 0.86],
      [0.64, 0.015], [0.72, 0.015], [0.78, 0.58],
      [0.85, 0.08], [0.91, 0.34], [1, 0],
    ]
    expect(state(flickerStart).lampPower).toBe(1)
    for (const [u, power] of keys) expect(atU(u)).toBeCloseTo(power, 12)
    expect(state(blackoutStart).lampPower).toBe(0)
    // Recovery peaks never reach full lamp power again inside the storm.
    for (const u of [0.18, 0.34, 0.51, 0.78, 0.91]) expect(atU(u)).toBeLessThan(1)
  })

  it('keeps storm light bounded, finite and identical under reverse scrubbing', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { flickerStart, blackoutStart } = INTRO_PHASES
    const span = blackoutStart - flickerStart
    const times = Array.from({ length: 1401 }, (_, i) => flickerStart + (i / 1400) * span)
    const forward = times.map(state)
    for (const s of forward) {
      expect(Number.isFinite(s.lampPower)).toBe(true)
      expect(s.lampPower).toBeGreaterThanOrEqual(0)
      expect(s.lampPower).toBeLessThanOrEqual(1)
    }
    // Pure function of scroll: reverse order and unrelated calls reproduce every channel.
    for (let i = times.length - 1; i >= 0; i -= 3) expect(state(times[i])).toStrictEqual(forward[i])
    const anchor = state(0.48)
    // t=0.48 sits inside the failure window: flicker light, not the lit hold or blackout.
    expect(anchor.lampPower).toBeGreaterThan(0)
    expect(anchor.lampPower).toBeLessThan(1)
    state(0.9)
    state(0.2)
    expect(state(0.48)).toStrictEqual(anchor)
  })

  it('fails light in exactly five unequal troughs with the long near-out shelf', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { flickerStart, blackoutStart } = INTRO_PHASES
    const span = blackoutStart - flickerStart
    const n = 1400
    const powers = Array.from({ length: n + 1 }, (_, i) => state(flickerStart + (i / n) * span).lampPower)
    // Cluster plateau samples so the shelf counts as one trough.
    const runs: { u: number; power: number }[] = []
    let i = 1
    while (i < n) {
      if (powers[i] < powers[i - 1]) {
        let j = i
        let min = i
        while (j + 1 <= n && powers[j + 1] <= powers[j]) {
          j += 1
          if (powers[j] < powers[min]) min = j
        }
        // The strict descent into blackoutStart is the authored boundary, not a storm trough.
        if (j >= n) break
        const minPower = powers[min]
        let last = min
        while (last + 1 <= n && powers[last + 1] <= minPower) last += 1
        runs.push({ u: (min + last) / (2 * n), power: minPower })
        i = j + 1
      } else {
        i += 1
      }
    }
    expect(runs).toHaveLength(5)
    const expected: [number, number][] = [
      [0.12, 0.58], [0.28, 0.14], [0.46, 0.36], [0.68, 0.015], [0.85, 0.08],
    ]
    runs.forEach((run, k) => {
      expect(run.power).toBeCloseTo(expected[k][1], 4)
      expect(Math.abs(run.u - expected[k][0])).toBeLessThan(0.03)
    })
    expect(new Set(runs.map((run) => run.power)).size).toBe(5)
  })

  it('holds one extended near-out shelf and reserves true extinction for the dark hold', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { flickerStart, blackoutStart, pulseEnd } = INTRO_PHASES
    const span = blackoutStart - flickerStart
    const n = 1400
    const runs: [number, number][] = []
    let open = -1
    for (let i = 0; i <= n; i += 1) {
      const nearOut = state(flickerStart + (i / n) * span).lampPower <= 0.03
      if (nearOut && open < 0) open = i
      if ((!nearOut || i === n) && open >= 0) {
        runs.push([open / n, (i - (nearOut ? 0 : 1)) / n])
        open = -1
      }
    }
    // The only near-extinct stretches are the long shelf and the authored collapse into blackout.
    expect(runs).toHaveLength(2)
    const [shelf, collapse] = runs
    expect(shelf[0]).toBeLessThanOrEqual(0.64 + 1e-9)
    expect(shelf[1]).toBeGreaterThanOrEqual(0.72 - 1e-9)
    expect(shelf[1] - shelf[0]).toBeGreaterThan(0.07)
    expect(collapse[1]).toBeCloseTo(1, 9)
    expect(collapse[1] - collapse[0]).toBeLessThan(0.09)
    // True darkness belongs to the dark hold: zero lamp straight through the trace window.
    for (let i = 0; i <= 40; i += 1) {
      const t = blackoutStart + (i / 40) * (pulseEnd - blackoutStart)
      expect(state(t).lampPower).toBe(0)
      expect(state(t).blackout).toBe(1)
    }
  })

  it('interpolates the envelope with continuous light and no snap at any key', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { flickerStart, blackoutStart } = INTRO_PHASES
    const span = blackoutStart - flickerStart
    const atU = (u: number) => state(flickerStart + u * span).lampPower
    const eps = 1e-4
    for (const u of [0, 0.12, 0.18, 0.28, 0.34, 0.46, 0.51, 0.64, 0.72, 0.78, 0.85, 0.91, 1]) {
      const left = (atU(u) - atU(u - eps)) / eps
      const right = (atU(u + eps) - atU(u)) / eps
      expect(Math.abs(left)).toBeLessThan(0.2)
      expect(Math.abs(right)).toBeLessThan(0.2)
      expect(Math.abs(right - left)).toBeLessThan(0.25)
    }
  })

  it('returns the lamp warmly and monotonically after the trace and holds it lit', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { lampReturnStart, lampReturnEnd } = INTRO_PHASES
    expect(state(lampReturnStart).lampPower).toBe(0)
    let previous = 0
    for (let i = 1; i <= 40; i += 1) {
      const power = state(lampReturnStart + (i / 40) * (lampReturnEnd - lampReturnStart)).lampPower
      expect(power).toBeGreaterThanOrEqual(previous)
      expect(power).toBeLessThanOrEqual(1)
      previous = power
    }
    expect(state(lampReturnEnd).lampPower).toBe(1)
    for (const t of [0.86, 0.9, 0.96]) expect(state(t).lampPower).toBe(0)
    expect(state(0.98).lampPower).toBeCloseTo(0.5, 12)
    expect(state(1).lampPower).toBe(1)
  })

  it('opens the perspective move only at the authored orbit boundary', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    for (const t of [INTRO_PHASES.metalStart, INTRO_PHASES.riseStart, INTRO_PHASES.detachStart, INTRO_PHASES.orbitStart - 0.001]) {
      expect(state(t).perspective).toBe(0)
    }
    expect(state((INTRO_PHASES.orbitStart + 1) / 2).perspective).toBeCloseTo(0.5, 12)
    expect(state(1).perspective).toBe(1)
  })

  it('establishes the dark hold before the white trace and keeps the lamp dark throughout it', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    const { blackoutStart, pulseStart } = INTRO_PHASES
    // The last flicker failure is still failing light, not yet the authored extinction.
    // 0.57 is the same normalized point of the failure envelope that 0.55 held inside
    // the old .42-.56 flicker window.
    const preBlackout = state(0.57)
    expect(preBlackout.lampPower).toBeGreaterThan(0.03)
    expect(preBlackout.lampPower).toBeLessThan(0.34)
    expect(preBlackout.blackout).toBe(0)
    expect(preBlackout.pulse).toBe(0)
    expect(state(blackoutStart).blackout).toBe(1)
    expect(state(pulseStart).pulse).toBe(1)
    // The dark hold (.58-.66) is true extinction: zero lamp, numeric blackout, no trace.
    for (let i = 0; i < 40; i += 1) {
      const dark = state(blackoutStart + (i / 40) * (pulseStart - blackoutStart))
      expect(dark.lampPower).toBe(0)
      expect(dark.blackout).toBe(1)
      expect(dark.pulse).toBe(0)
    }
    for (let i = 0; i <= 80; i += 1) {
      const trace = state(INTRO_PHASES.pulseStart + (i / 80) * (INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart))
      expect(trace.pulse).toBe(1)
      expect(trace.lampPower).toBe(0)
      expect(trace.blackout).toBe(1)
    }
  })

  it('lights and resolves the pushing model before the first fractured gap', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(state(INTRO_PHASES.pulseEnd).pbr).toBe(0)
    expect(state(INTRO_PHASES.pulseEnd).illumination).toBe(0)
    // Registration survives to the trace end: the pose axis has not started moving.
    expect(state(INTRO_PHASES.pulseEnd).poseT).toBeCloseTo(0.4, 12)
    expect(state(0.8).illumination).toBe(0)
    expect(state(0.81).illumination).toBe(0)
    expect(state(INTRO_PHASES.fractureStart).illumination).toBe(0)
    expect(state(INTRO_PHASES.fractureEnd).illumination).toBe(0)
    expect(state(0.98).illumination).toBeCloseTo(0.5, 12)
    expect(state(1).illumination).toBe(1)
    expect(state(INTRO_PHASES.fractureStart).openingClear).toBe(0)
    expect(state(INTRO_PHASES.fractureEnd).openingClear).toBe(1)
    expect(state(INTRO_PHASES.fractureEnd).pbr).toBe(1)
    expect(state(INTRO_PHASES.riseStart).poseT).toBeCloseTo(0.4, 12)
    expect(state(INTRO_PHASES.fractureStart).poseT).toBeCloseTo(0.5, 12)
    expect(state(INTRO_PHASES.fractureStart).pbr).toBe(1)
    expect(state(INTRO_PHASES.metalStart).pbr).toBe(0)
    expect(state(0.81).pbr).toBeCloseTo(0.5, 12)
    expect(state(0.82).pbr).toBeCloseTo(1, 12)
    // The camera holds the registered frame through the metal resolve, then the orbit opens.
    expect(state(INTRO_PHASES.metalStart).perspective).toBe(0)
    expect(state(INTRO_PHASES.orbitStart).perspective).toBe(0)
    expect(state(0.95).perspective).toBeCloseTo(0.5, 12)
  })

  it('sweeps light once after physical separation and resets on reverse scroll', () => {
    const crossing = SOLVED_CROSSING
    const start = introScrollTimeFor(crossing)
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    expect(state(start - 0.01).lightSweep).toBe(0)
    expect(state((start + 1) / 2).lightSweep).toBeCloseTo(1)
    expect(state(1).lightSweep).toBeCloseTo(0)
    expect(state(start - 0.01).lightSweep).toBe(0)
    // The legacy field still resolves for the pre-revision browser crossing.
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, LEGACY_CROSSING).lightSweep).toBeCloseTo(0)
    // Progress is the paced axis, so the lit hold (intro t = 0.4, inside .38-.45) is
    // 0.4 * releaseEnd of progress; a bare 0.4 lands past the intro handoff.
    expect(drawingIntroState(0.4 * DRAWING_INTRO_WINDOW.releaseEnd, crossing).lightSweep).toBeCloseTo(0)
  })
  it('completes the focus rack before the pulse starts', () => {
    const focused = drawingIntroState(INTRO_PHASES.focusEnd * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(focused.focus).toBe(1)
    expect(focused.pulse).toBe(0)
    const pulsing = drawingIntroState(0.5 * (INTRO_PHASES.pulseStart + INTRO_PHASES.pulseEnd) * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(pulsing.focus).toBe(1)
    expect(pulsing.pulse).toBe(1)
  })

  it('reserves the onboarding window with no other authored channel in it', () => {
    const stableHold = drawingIntroState(0.3 * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(stableHold.focus).toBe(1)
    expect(stableHold.lampPower).toBe(1)
    expect(stableHold.readingPool).toBe(0)
    expect(stableHold.pulse).toBe(0)
    expect(stableHold.pbr).toBe(0)
    expect(stableHold.poseT).toBeLessThan(0.4)
    expect(stableHold.drawingOpacity).toBe(1)
    expect(stableHold.pressure).toBe(0)
    expect(stableHold.crackWeb).toBe(0)
    expect(stableHold.crackGlow).toBe(0)
    expect(stableHold.openingClear).toBe(0)
  })

  it('holds the print permanently opaque; retirement is physical, never a fade', () => {
    for (let i = 0; i <= 1000; i += 1) {
      expect(drawingIntroState((i / 1000) * DRAWING_INTRO_WINDOW.releaseEnd, SOLVED_CROSSING).drawingOpacity).toBe(1)
    }
    // The legacy wave crossing cannot resurrect the old fade either.
    expect(drawingIntroState(INTRO_PHASES.waveEnd * DRAWING_INTRO_WINDOW.releaseEnd, LEGACY_CROSSING).drawingOpacity).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, LEGACY_CROSSING).drawingOpacity).toBe(1)
  })

  it('runs the legacy shockwave exactly once, after the solved separation', () => {
    const crossing = SOLVED_CROSSING
    const start = introScrollTimeFor(crossing)
    expect(drawingIntroState((start - 0.01) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
    expect(start).toBeLessThan(INTRO_PHASES.waveEnd)
    const midWave = (start + INTRO_PHASES.waveEnd) / 2
    expect(drawingIntroState(midWave * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
  })

  it('reparameterizes pose time without moving the pose axis itself', () => {
    expect(introPoseTime(0)).toBe(0)
    expect(introPoseTime(INTRO_PHASES.fractureStart)).toBeCloseTo(0.5, 12)
    expect(introPoseTime(INTRO_PHASES.fractureEnd)).toBeGreaterThan(0.5)
    expect(introPoseTime(INTRO_PHASES.riseStart)).toBeCloseTo(0.4, 12)
    expect(introPoseTime(1)).toBeCloseTo(1, 12)
    for (const pose of [0.1, 0.4, 0.6, 0.7, 1]) {
      expect(introPoseTime(introScrollTimeFor(pose))).toBeCloseTo(pose, 10)
    }
    // The pose axis never moves backwards and never leaves its authored range.
    let previous = -1
    for (let i = 0; i <= 2000; i += 1) {
      const pose = introPoseTime(i / 2000)
      expect(pose).toBeGreaterThanOrEqual(previous)
      expect(pose).toBeLessThanOrEqual(1)
      previous = pose
    }
  })

  it('evaluates every channel reversibly and derives blackout only from lamp power', () => {
    const crossing = SOLVED_CROSSING
    // Authored phase boundaries plus the old failure-window fractions: every edge where
    // a channel can move must reproduce identically under reverse scrubbing.
    const boundaries = [
      INTRO_PHASES.focusEnd, INTRO_PHASES.onboardEnd, INTRO_PHASES.flickerStart,
      INTRO_PHASES.blackoutStart, INTRO_PHASES.pulseStart, INTRO_PHASES.pulseEnd,
      INTRO_PHASES.bulgeStart, INTRO_PHASES.fractureStart, INTRO_PHASES.fractureEnd,
      INTRO_PHASES.lampReturnEnd, INTRO_PHASES.metalStart, INTRO_PHASES.detachStart,
      INTRO_PHASES.orbitStart, INTRO_PHASES.waveEnd,
    ]
    const samples = [
      0, 0.24, 0.3, 0.4, 0.42, 0.4368, 0.4452, 0.4592, 0.4676, 0.4844, 0.4914,
      0.5096, 0.5208, 0.5292, 0.539, 0.5474, 0.55, 0.63, 0.7, 0.72, 0.76, 0.78,
      0.8, 0.82, 0.835, 0.84, 0.85, 0.86, 0.87, 0.88, 0.885, 0.9, 0.91, 0.94,
      0.96, 0.98, 0.99, 1,
    ].concat(boundaries)
    const forward = samples.map((t) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing))

    for (let i = 0; i < samples.length; i += 1) {
      const repeated = drawingIntroState(samples[i] * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
      expect(repeated).toStrictEqual(forward[i])
      expect(repeated.blackout).toBe(repeated.lampPower <= 0.03 ? 1 : 0)
      expect(repeated.crackWeb).toBe(smooth01((repeated.t - BRANCH_START_T) / 0.012) * (1 - repeated.fracture))
      expect(repeated.openingClear).toBe(repeated.t >= INTRO_PHASES.fractureEnd ? 1 : 0)
    }
    for (let i = samples.length - 1; i >= 0; i -= 1) {
      expect(drawingIntroState(samples[i] * DRAWING_INTRO_WINDOW.releaseEnd, crossing)).toStrictEqual(forward[i])
    }
  })
})

describe('paper barrier breakthrough', () => {
  const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, SOLVED_CROSSING)

  it('ramps pressure to its maxPeak at .84 and releases it across .84-.88', () => {
    expect(state(INTRO_PHASES.bulgeStart).pressure).toBe(0)
    expect(state(0.815).pressure).toBeCloseTo(0.5, 12)
    expect(state(INTRO_PHASES.fractureStart).pressure).toBe(1)
    // maxPeak: .84 is the pressure maximum; .88 is the flat end of the release.
    for (let i = 0; i <= 2000; i += 1) expect(state(i / 2000).pressure).toBeLessThanOrEqual(1)
    expect(state(INTRO_PHASES.fractureStart).pressure).toBe(Math.max(
      state(INTRO_PHASES.fractureStart - 0.01).pressure,
      state(INTRO_PHASES.fractureStart + 0.01).pressure,
    ))
    expect(state(1).pressure).toBe(1)
    for (const t of [0, 0.2, 0.38, 0.58, 0.66, 0.78]) expect(state(t).pressure).toBe(0)

    expect(state(INTRO_PHASES.fractureStart).fracture).toBe(0)
    expect(state(0.86).fracture).toBeCloseTo(0.5, 12)
    expect(state(INTRO_PHASES.fractureEnd).fracture).toBeCloseTo(1, 12)
    expect(state(1).fracture).toBe(1)
    for (const t of [0, 0.4, 0.79, 0.83]) expect(state(t).fracture).toBe(0)

    // Pressure only builds; fracture only advances. Both stay inside their windows.
    let previous = -1
    for (let i = 0; i <= 1000; i += 1) {
      const pressure = state(i / 1000).pressure
      expect(pressure).toBeGreaterThanOrEqual(previous)
      expect(pressure).toBeLessThanOrEqual(1)
      previous = pressure
    }
    let fracture = -1
    for (let i = 0; i <= 400; i += 1) {
      const value = state(INTRO_PHASES.fractureStart + (i / 400) * (1 - INTRO_PHASES.fractureStart)).fracture
      expect(value).toBeGreaterThanOrEqual(fracture)
      expect(value).toBeLessThanOrEqual(1)
      fracture = value
    }
    expect(fracture).toBe(1)
  })

  it('opens the barrier exactly at .88 and closes the crack web with the fracture', () => {
    expect(state(INTRO_PHASES.fractureStart).openingClear).toBe(0)
    expect(state(0.8799).openingClear).toBe(0)
    expect(state(INTRO_PHASES.fractureEnd).openingClear).toBe(1)
    for (let i = 0; i <= 200; i += 1) {
      expect(state(INTRO_PHASES.fractureEnd + (i / 200) * (1 - INTRO_PHASES.fractureEnd)).openingClear).toBe(1)
    }
    // The web is the pressure carried into fracture: full at the peak, gone at clearance.
    expect(state(INTRO_PHASES.fractureStart).crackWeb).toBe(1)
    expect(state(0.86).crackWeb).toBeCloseTo(0.5, 12)
    expect(state(INTRO_PHASES.fractureEnd).crackWeb).toBe(0)
    expect(state(1).crackWeb).toBe(0)
  })

  it('keeps the trace glow lit through the break and tapers to a residual after .94', () => {
    for (let i = 0; i <= 80; i += 1) {
      const t = INTRO_PHASES.pulseStart + (i / 80) * (INTRO_PHASES.pulseEnd - INTRO_PHASES.pulseStart)
      expect(state(t).crackGlow).toBe(1)
    }
    // Sustained glow after the trace: carried by pressure, inside the authored .6-1 band
    // until fracture has completed half the break, then a quarter residual.
    for (let i = 0; i <= 140; i += 1) {
      const glow = state(INTRO_PHASES.pulseEnd + (i / 140) * (0.86 - INTRO_PHASES.pulseEnd)).crackGlow
      expect(glow).toBeGreaterThanOrEqual(0.6)
      expect(glow).toBeLessThanOrEqual(1)
    }
    expect(state(INTRO_PHASES.fractureStart).crackGlow).toBeCloseTo(1, 12)
    expect(state(0.85).crackGlow).toBeCloseTo(0.878125, 12)
    expect(state(0.86).crackGlow).toBeCloseTo(0.61, 12)
    expect(state(INTRO_PHASES.fractureEnd).crackGlow).toBeCloseTo(0.22, 12)
    expect(state(0.97).crackGlow).toBeCloseTo(0.07744, 12)
    expect(state(0.98).crackGlow).toBeCloseTo(0.02288, 12)
    expect(state(0.98).crackGlow).toBeGreaterThan(0)
    expect(state(0.99).crackGlow).toBe(0)
    expect(state(1).crackGlow).toBe(0)
    // Once the fracture advances the glow can only fade; it never re-lights.
    let previous = Infinity
    for (let i = 0; i <= 400; i += 1) {
      const glow = state(INTRO_PHASES.fractureStart + (i / 400) * (1 - INTRO_PHASES.fractureStart)).crackGlow
      expect(glow).toBeLessThanOrEqual(previous + 1e-12)
      previous = glow
    }
    expect(previous).toBe(0)
  })

  it('cannot produce a fracture with unlit or unresolved metal - thousands sampled', () => {
    const N = 4000
    let previousPose = -Infinity
    for (let i = 0; i <= N; i += 1) {
      const t = i / N
      const s = state(t)
      expect(s.openingClear).toBe(t >= INTRO_PHASES.fractureEnd ? 1 : 0)
      expect(s.drawingOpacity).toBe(1)
      expect(Number.isFinite(s.pbr)).toBe(true)
      expect(Number.isFinite(s.poseT)).toBe(true)
      expect(s.poseT).toBeGreaterThanOrEqual(previousPose)
      previousPose = s.poseT
      if (t < INTRO_PHASES.bulgeStart) {
        expect(s.pbr).toBe(0)
        expect(s.illumination).toBe(0)
        expect(s.poseT).toBeLessThanOrEqual(0.4)
        expect(s.crackWeb).toBeGreaterThanOrEqual(0)
      } else if (t >= INTRO_PHASES.fractureStart) {
        expect(s.pbr).toBe(1)
        expect(s.illumination).toBe(s.lampPower)
        expect(s.poseT).toBeGreaterThanOrEqual(0.5)
      }
    }
    expect(state(INTRO_PHASES.metalStart).pbr).toBe(0)
    expect(state(0.91).pbr).toBe(1)
  })

  it('keeps the print permanently opaque; retirement is physical, never a fade', () => {
    for (let i = 0; i <= 1000; i += 1) {
      expect(state(i / 1000).drawingOpacity).toBe(1)
    }
    expect(drawingIntroState(INTRO_PHASES.waveEnd * DRAWING_INTRO_WINDOW.releaseEnd, LEGACY_CROSSING).drawingOpacity).toBe(1)
  })

  it('reproduces every breakthrough channel exactly under reverse scrubbing', () => {
    const times = Array.from({ length: 1601 }, (_, i) => i / 1600)
    const forward = times.map(state)
    for (let i = times.length - 1; i >= 0; i -= 1) {
      const again = state(times[i])
      expect(again).toStrictEqual(forward[i])
      expect(again.crackWeb).toBe(smooth01((again.t - BRANCH_START_T) / 0.012) * (1 - again.fracture))
      expect(again.openingClear).toBe(again.t >= INTRO_PHASES.fractureEnd ? 1 : 0)
    }
    // Unrelated evaluations in between cannot leak state into the authored ramps.
    const anchor = state(0.86)
    state(0.2)
    state(1)
    expect(state(0.86)).toStrictEqual(anchor)
    expect(anchor.crackWeb).toBeCloseTo(0.5, 12)
    expect(anchor.crackGlow).toBeCloseTo(0.61, 12)
  })

  it('keeps the disabled shockwave fields functional from the solved crossing, inert past the wave end', () => {
    for (const crossing of [0.5, 0.55, 0.6, 0.7, 0.8]) {
      const start = introScrollTimeFor(crossing)
      expect(start).toBeLessThan(INTRO_PHASES.waveEnd)
      expect(drawingIntroState((start - 0.01) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
      const midWave = (start + INTRO_PHASES.waveEnd) / 2
      expect(drawingIntroState(midWave * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(1)
      expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
    }
    // The revised solved crossing (~.6 pose) arms the legacy wave well before its .97 end.
    const early = introScrollTimeFor(SOLVED_CROSSING)
    expect(early).toBeLessThan(0.93)
    expect(INTRO_PHASES.waveEnd - early).toBeGreaterThan(0.05)
    // A crossing beyond the wave end cannot arm it: the fields stay inert, not broken.
    expect(introScrollTimeFor(0.95)).toBeGreaterThan(INTRO_PHASES.waveEnd)
    for (let i = 0; i <= 100; i += 1) {
      expect(drawingIntroState((i / 100) * DRAWING_INTRO_WINDOW.releaseEnd, 0.95).waveActive).toBe(0)
    }
  })
})

describe('retained hero cue remap', () => {
  it('maps every retained CH.01 cue after the intro without changing its relative order', () => {
    const first = remapHeroProgress(0)
    const shiftIn = remapHeroProgress(0.05)
    const shiftHold = remapHeroProgress(0.12)
    const shiftOut = remapHeroProgress(0.17)

    expect(first).toBe(DRAWING_INTRO_WINDOW.releaseEnd)
    expect(first).toBeLessThan(shiftIn)
    expect(shiftIn).toBeLessThan(shiftHold)
    expect(shiftHold).toBeLessThan(shiftOut)
    // The remap saturates exactly where the retained hero timeline's own window opens.
    expect(remapHeroProgress(0.18)).toBeCloseTo(0.18, 8)
    expect(remapHeroProgress(0.85)).toBeCloseTo(0.18, 8)
  })
})
