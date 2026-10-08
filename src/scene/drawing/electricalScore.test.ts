import { describe, expect, it } from 'vitest'
import {
  BRANCH_END_T,
  BRANCH_START_COMPLETION,
  BRANCH_START_SECONDS,
  BRANCH_START_T,
  BURST_KEYS,
  CALIBRATION_SWEEP_SECONDS,
  ELECTRICAL_END_T,
  OUTLINE_START_RAW,
  OUTLINE_START_T,
  burstProgress,
  electricalElapsed,
  electricalTimeAt,
  newElectricalSample,
  sampleElectrical,
} from './electricalScore'
import { DRAWING_INTRO_WINDOW, drawingIntroState, rawScrollFor } from './introTimeline'

describe('electrical burst/hold score (JG-035 O1)', () => {
  it('reproduces the owner rhythm exactly at the authored calibration seconds', () => {
    const at = (e: number) => burstProgress(e)
    expect(at(0)).toBe(0)
    expect(at(0.2)).toBeCloseTo(0.1, 12) // 10% of the perimeter in .20 s
    expect(at(0.4)).toBeCloseTo(0.1, 12) // then paused .20 s
    expect(at(0.55)).toBeCloseTo(0.25, 12)
    expect(at(0.7)).toBeCloseTo(0.25, 12)
    expect(at(0.85)).toBeCloseTo(0.45, 12)
    expect(at(0.93)).toBeCloseTo(0.45, 12)
    expect(at(1.05)).toBeCloseTo(0.7, 12)
    expect(at(1.09)).toBeCloseTo(0.7, 12)
    expect(at(1.16)).toBeCloseTo(0.85, 12)
    expect(at(1.18)).toBeCloseTo(0.85, 12)
    expect(at(1.25)).toBe(1)
    // The first 10% is NOT reached any earlier, and the first hold really is a hold.
    expect(at(0.19)).toBeLessThan(0.1)
    expect(at(0.2 - 1e-6)).toBeLessThan(0.1)
    for (let e = 0.2; e <= 0.4; e += 0.005) expect(at(e)).toBeCloseTo(0.1, 12)
  })

  it('pauses shorten and speed grows: later bursts cover more distance in less time', () => {
    const holds: number[] = [], rates: number[] = [], spans: number[] = []
    for (let i = 0; i < BURST_KEYS.length; i += 1) {
      const k = BURST_KEYS[i]
      rates.push((k.to - k.from) / (k.t1 - k.t0)); spans.push(k.to - k.from)
      if (i > 0) holds.push(k.t0 - BURST_KEYS[i - 1].t1)
    }
    for (let i = 1; i < holds.length; i += 1) expect(holds[i]).toBeLessThan(holds[i - 1])
    for (let i = 1; i < rates.length; i += 1) expect(rates[i]).toBeGreaterThan(rates[i - 1] * 0.98)
    expect(Math.max(...spans.slice(2))).toBeGreaterThan(spans[0])
  })

  it('is monotone non-decreasing with continuous slope (no snaps at burst edges)', () => {
    let previous = 0, maxStep = 0
    for (let i = 0; i <= 12500; i += 1) {
      const v = burstProgress(i / 10000)
      expect(v).toBeGreaterThanOrEqual(previous)
      maxStep = Math.max(maxStep, v - previous); previous = v
    }
    // Largest per-sample step is the steepest smoothstep midpoint (1.5x average slope); no jump.
    expect(maxStep).toBeLessThan(0.002)
    expect(burstProgress(5)).toBe(1)
    expect(burstProgress(-3)).toBe(0)
  })

  it('maps scroll to calibration seconds directly and agrees with the real paced mapping', () => {
    expect(OUTLINE_START_T).toBeCloseTo(2 * OUTLINE_START_RAW, 12)
    expect(electricalElapsed(OUTLINE_START_T)).toBeCloseTo(0, 9)
    expect(electricalElapsed(0.79)).toBeCloseTo(1.25, 9)
    expect(ELECTRICAL_END_T).toBeCloseTo(0.79, 9)
    for (const t of [0.7, 0.765, 0.7692, 0.78, 0.79, 0.82, 0.9]) {
      const viaRealMap = CALIBRATION_SWEEP_SECONDS * (rawScrollFor(t * DRAWING_INTRO_WINDOW.releaseEnd) - OUTLINE_START_RAW)
      expect(electricalElapsed(t)).toBeCloseTo(viaRealMap, 7)
    }
    expect(electricalTimeAt(0.2)).toBeCloseTo(0.7690, 9)
  })

  it('begins interior branching at 85% outline completion and runs the same pattern for 1.25 s', () => {
    expect(BRANCH_START_COMPLETION).toBe(0.85)
    expect(burstProgress(BRANCH_START_SECONDS)).toBeCloseTo(0.85, 12)
    expect(BRANCH_START_T).toBeCloseTo(0.7882, 4)
    expect(BRANCH_END_T).toBeCloseTo(0.8132, 4)
    const out = newElectricalSample()
    expect(sampleElectrical(BRANCH_START_T - 1e-4, out).branch).toBe(0)
    // Branch replays the identical burst/hold table, offset by the start second.
    for (const e of [0.2, 0.4, 0.55, 0.7, 0.85, 1.05, 1.25]) {
      const t = electricalTimeAt(BRANCH_START_SECONDS + e)
      expect(sampleElectrical(t, out).branch).toBeCloseTo(burstProgress(e), 9)
    }
    expect(sampleElectrical(BRANCH_END_T + 0.01, out).branch).toBe(1)
    // The interior continues after the outline is complete.
    expect(sampleElectrical(0.8, out).outline).toBe(1)
    expect(sampleElectrical(0.8, out).branch).toBeGreaterThan(0)
  })

  it('anticipation is non-advancing: it builds in the dark hold and never moves the head', () => {
    const out = newElectricalSample()
    expect(sampleElectrical(0.66, out).anticipation).toBe(0)
    expect(sampleElectrical(0.7, out).outline).toBe(0)
    expect(sampleElectrical(0.7, out).anticipation).toBeGreaterThan(0)
    expect(sampleElectrical(OUTLINE_START_T - 1e-6, out).anticipation).toBeCloseTo(1, 5)
    expect(sampleElectrical(OUTLINE_START_T + 0.001, out).anticipation).toBe(0)
  })

  it('drawingIntroState exposes the score and is reversible: same t, same state', () => {
    const ts = [0.6, 0.7, 0.766, 0.769, 0.771, 0.78, 0.7882, 0.79, 0.8, 0.8132, 0.84, 0.9, 1]
    const fwd = ts.map(t => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, 0.6))
    const rev = [...ts].reverse().map(t => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, 0.6)).reverse()
    expect(rev).toStrictEqual(fwd)
    const at = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, 0.6)
    expect(at(electricalTimeAt(0.2)).pulseHead).toBeCloseTo(0.1, 9)
    expect(at(electricalTimeAt(0.3)).pulseHead).toBeCloseTo(0.1, 9)
    expect(at(0.79).pulseHead).toBe(1)
    expect(at(electricalTimeAt(BRANCH_START_SECONDS + 0.4)).crackGrowth).toBeCloseTo(0.1, 9)
    expect(at(0.7).crackGrowth).toBe(0)
  })
})
