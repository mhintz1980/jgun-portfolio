import { describe, expect, it } from 'vitest'
import {
  CHIP_SEED,
  CUTTER_RATE,
  FOLLOW_GAIN,
  FOLLOW_MF_TOTAL,
  MACHINING_AT_SHAPING_END,
  MACHINING_AT_SLOW_MID,
  MACHINING_RATE_BOUNDARIES,
  SHAFT_KINEMATICS_DURATION,
  SHAFT_MAX_FEATURE_HZ,
  SPACE_PASSES_REQUIRED,
  STROKE_PERIOD_M,
  STROKE_PHASE_OFFSET,
  WORK_RATE,
  backoffAt,
  countedPasses,
  createShaftKinematicsFrame,
  followMfAt,
  followWeightAt,
  hobEnvelopeTopY,
  infeedRhoAt,
  machiningRateAt,
  machiningTimeAt,
  sampleShaftKinematics,
  strokePhaseAt,
  writeShaftProgression,
} from './kinematics'
import {
  FACE_START_MM,
  HOB_INFEED_YC_MM,
  SHAFT_OD_MM,
  SHAFT_ROOT_MM,
  SHAFT_SPACES,
  SHAPING_FACE_END_MM,
  SPACE_CLOCK_RAD,
  SPACE_PITCH_RAD,
  createProgressionState,
  createProgressionUniforms,
  HOBBING_FACE_END_MM,
  HOB_VISUAL_A_MM,
  progressedRadius,
  writeProgressionUniforms,
} from './progression'
import {
  HOB_RADIUS_MM,
  HOB_STOP_YC_MM,
  SHAPER_OVERTRAVEL_MM,
  SHAPER_SIGNED_RATIO,
  SHAPER_STROKE_CENTRE_Y_MAX_MM,
  SHAPER_STROKE_CENTRE_Y_MIN_MM,
  SHAPER_THICKNESS_MM,
} from './toolSpec'

/** clearance-v4 report facts (legacy groove wall y). */
const GROOVE_WALL_Y_MM = 10.94
/** Certified stroke/edge relation: max centre + half thickness = last tooth material 9.8749 + overtravel 0.5. */
const MAX_EDGE_Y_MM = SHAPER_STROKE_CENTRE_Y_MAX_MM + SHAPER_THICKNESS_MM / 2

const frame = createShaftKinematicsFrame()
const sample = (t: number) => sampleShaftKinematics(t, frame)

describe('K1 machining-time map m(t)', () => {
  it('is monotonic and C1 across a dense 1/240 sweep', () => {
    const step = 1 / 240
    let prevM = machiningTimeAt(0)
    let maxJump = 0
    let maxSecondDiff = 0
    for (let t = step; t <= SHAFT_KINEMATICS_DURATION + step; t += step) {
      const m = machiningTimeAt(t)
      expect(m).toBeGreaterThanOrEqual(prevM - 1e-12)
      const d1 = m - prevM
      const rate = machiningRateAt(t - step / 2)
      maxSecondDiff = Math.max(maxSecondDiff, Math.abs(d1 - rate * step))
      maxJump = Math.max(maxJump, d1)
      prevM = m
    }
    expect(maxJump).toBeLessThanOrEqual(4 * step + 1e-12)
    // Rate is C0: the forward difference matches dm/dt to O(h^2).
    expect(maxSecondDiff).toBeLessThan(2e-4)
  })
  it('holds the authored speed structure: normal, slow, compressed recap, frozen gaps', () => {
    expect(machiningTimeAt(2)).toBe(0)
    // Eased startup 2..3 s (rate 0 -> 1, C1 at both ends): half a machining second is banked.
    expect(machiningTimeAt(3)).toBeCloseTo(0.5, 12)
    expect(machiningTimeAt(6)).toBeCloseTo(3.5, 12)
    expect(machiningRateAt(2)).toBe(0)
    expect(machiningRateAt(3)).toBe(1)
    expect(machiningRateAt(5)).toBe(1)
    expect(machiningRateAt(8.4)).toBeCloseTo(0.22, 12)
    expect(machiningRateAt(12)).toBe(4)
    // Stable slow action inside 6..11: the whole 7.2..9.6 window runs at the slow rate.
    for (let t = 7.2; t <= 9.6; t += 1 / 240) expect(machiningRateAt(t)).toBeCloseTo(0.22, 10)
    expect(9.6 - 7.2).toBeGreaterThanOrEqual(1.2)
    // Machining freezes outside its beats.
    expect(machiningTimeAt(20)).toBe(MACHINING_AT_SHAPING_END)
    expect(machiningTimeAt(24.6)).toBe(MACHINING_AT_SHAPING_END)
  })
  it('is C1 at every rate-segment boundary (one-sided straddling finite differences)', () => {
    // Catches the Sol review's 2.0 s kink: with a 0 -> 1 rate step there, the offset
    // one-sided derivatives differ by ~1.0 and the straddling central difference misses
    // dm/dt by ~0.5. Intervals sit a half-step off each side (never aligned to the boundary)
    // plus one interval straddling it. Tolerance 0.02; observed worst case 5.6e-3 at h = 1/48.
    expect(MACHINING_RATE_BOUNDARIES).toContain(2)
    for (const boundary of MACHINING_RATE_BOUNDARIES) {
      for (const h of [1 / 48, 1 / 96, 1 / 161]) {
        const left = (machiningTimeAt(boundary - 0.5 * h) - machiningTimeAt(boundary - 1.5 * h)) / h
        const right = (machiningTimeAt(boundary + 1.5 * h) - machiningTimeAt(boundary + 0.5 * h)) / h
        expect(Math.abs(right - left)).toBeLessThanOrEqual(0.02)
        const central = (machiningTimeAt(boundary + 0.5 * h) - machiningTimeAt(boundary - 0.5 * h)) / h
        expect(Math.abs(central - machiningRateAt(boundary))).toBeLessThanOrEqual(0.02)
      }
    }
  })
  it('places the exit stroke peak at the centre of the slow window', () => {
    expect(MACHINING_AT_SLOW_MID).toBeCloseTo(machiningTimeAt(7.2) + 0.22 * 1.2, 12)
    expect(strokePhaseAt(MACHINING_AT_SLOW_MID)).toBeCloseTo(0.5, 12)
    const atPeak = sample(8.4)
    expect(atPeak.strokeCentreY).toBeCloseTo(SHAPER_STROKE_CENTRE_Y_MAX_MM, 9)
    expect(atPeak.edgeY).toBeCloseTo(MAX_EDGE_Y_MM, 9)
    expect(STROKE_PHASE_OFFSET).toBeGreaterThan(0)
    expect(STROKE_PERIOD_M).toBe(0.8)
  })
})

describe('K8 follow azimuth integral', () => {
  const law = (t: number) => FOLLOW_GAIN * followWeightAt(t) * machiningRateAt(t)

  it('integrates the eased startup exactly instead of the retired linear ramp', () => {
    // Sol re-review regression: the retired followMfAt banked a full machining second by
    // 3 s (psi rate pi/8 at 2.5 s vs the documented law pi/16), overshooting the follow
    // azimuth by 11.25 deg from 3 s onward. The eased segment integrates to 0.5 exactly.
    expect(followMfAt(2)).toBe(0)
    expect(followMfAt(3)).toBeCloseTo(0.5, 12)
    expect(followMfAt(6)).toBeCloseTo(3.5, 12)
    // Weight is 1 across the whole 2..6 s window: mf is exactly the machining time there.
    for (let t = 2; t <= 6; t += 1 / 48) expect(followMfAt(t)).toBeCloseTo(machiningTimeAt(t), 12)
    expect(FOLLOW_GAIN * (followMfAt(6) - followMfAt(2))).toBeCloseTo((7 * Math.PI) / 16, 12)
  })

  it('has d(psi)/dt = FOLLOW_GAIN * followWeight * machiningRate across 2..15 s', () => {
    // Central finite differences of the follow azimuth vs the documented law on a 1/240
    // grid with half-step h = 1/480. psi is C2 (weight and rate are both C1), so the error
    // stays O(h^2) even across joints: observed worst 6.8e-6 rad/s, tolerance 0.005. The
    // retired linear startup fails this by ~0.196 rad/s throughout 2..3 s.
    const h = 1 / 480
    for (let i = 0; i <= 13 * 240; i++) {
      const t = 2 + i / 240
      const central = (FOLLOW_GAIN * followMfAt(t + h) - FOLLOW_GAIN * followMfAt(t - h)) / (2 * h)
      expect(Math.abs(central - law(t))).toBeLessThanOrEqual(0.005)
    }
  })

  it('matches the law through straddling intervals at every rate/weight boundary in 2..15 s', () => {
    const boundaries = [...new Set([...MACHINING_RATE_BOUNDARIES.filter((b) => b >= 2 && b <= 15), 12])].sort((a, b) => a - b)
    expect(boundaries).toEqual([2, 3, 6, 7.2, 9.6, 11, 12, 14, 15])
    // Half-step-offset one-sided intervals (never crossing the boundary) plus one interval
    // straddling it; observed worst 1.7e-4 rad/s, tolerance 0.005. 12 is the follow-weight
    // C1 joint that the rate-boundary list does not contain.
    for (const b of boundaries) {
      for (const h of [1 / 48, 1 / 96, 1 / 161]) {
        const left = (FOLLOW_GAIN * followMfAt(b - 0.5 * h) - FOLLOW_GAIN * followMfAt(b - 1.5 * h)) / h
        const right = (FOLLOW_GAIN * followMfAt(b + 1.5 * h) - FOLLOW_GAIN * followMfAt(b + 0.5 * h)) / h
        expect(Math.abs(left - law(b - h))).toBeLessThanOrEqual(0.005)
        expect(Math.abs(right - law(b + h))).toBeLessThanOrEqual(0.005)
        const central = (FOLLOW_GAIN * followMfAt(b + 0.5 * h) - FOLLOW_GAIN * followMfAt(b - 0.5 * h)) / h
        expect(Math.abs(central - law(b))).toBeLessThanOrEqual(0.005)
      }
    }
  })

  it('keeps FOLLOW_MF_TOTAL equal to the law integral over the timeline', () => {
    // Trapezoid at 1/960 over [2, 15] (the law is identically 0 outside); the C2 integrand
    // puts the quadrature error near 1e-14. New total = 3.5 + 0.479657... + 2 + 8 + 2.
    const step = 1 / 960
    const n = 13 * 960
    let sum = 0
    for (let i = 0; i <= n; i++) {
      const t = 2 + i * step
      sum += (i === 0 || i === n ? 0.5 : 1) * followWeightAt(t) * machiningRateAt(t) * step
    }
    expect(sum).toBeCloseTo(FOLLOW_MF_TOTAL, 6)
    expect(FOLLOW_MF_TOTAL).toBeCloseTo(15.979657142857143, 12)
    // G * total now stays below 2 pi, so FOLLOW_AZIMUTH_MOD (camera.ts) no longer wraps.
    expect(FOLLOW_GAIN * FOLLOW_MF_TOTAL).toBeLessThan(2 * Math.PI)
  })
})

describe('K2 shaper kinematics', () => {
  it('drives the work at the certified signed ratio work/cutter = -2', () => {
    for (const t of [2.5, 4, 6.5, 8.4, 10, 12.5, 14.9]) {
      const f = sample(t)
      expect(f.workPhi).toBeCloseTo(SHAPER_SIGNED_RATIO * f.cutterPhi, 12)
    }
  })
  it('has ~0 signed pitch-point relative velocity (recorded tolerance)', () => {
    // tool-conventions pitch circles: work r = 5 mm, cutter r = 10 mm, contact at work +Z.
    const vRel = 5 * WORK_RATE + 10 * CUTTER_RATE
    expect(Math.abs(vRel)).toBeLessThanOrEqual(1e-12)
  })
  it('keeps the stroke between the certified centre limits and the edge inside the groove', () => {
    let maxEdge = 0
    for (let t = 2; t <= 15; t += 1 / 240) {
      const f = sample(t)
      expect(f.strokeCentreY).toBeGreaterThanOrEqual(SHAPER_STROKE_CENTRE_Y_MIN_MM - 1e-9)
      expect(f.strokeCentreY).toBeLessThanOrEqual(SHAPER_STROKE_CENTRE_Y_MAX_MM + 1e-9)
      expect(f.edgeY).toBeCloseTo(f.strokeCentreY + SHAPER_THICKNESS_MM / 2, 12)
      maxEdge = Math.max(maxEdge, f.edgeY)
    }
    expect(maxEdge).toBeCloseTo(MAX_EDGE_Y_MM, 9)
    // Certified axial room to the groove wall: 0.565 mm.
    expect(GROOVE_WALL_Y_MM - maxEdge).toBeGreaterThanOrEqual(0.565 - 1e-9)
  })
  it('feeds radially to full depth during the first quarter orbit, then holds', () => {
    expect(infeedRhoAt(0)).toBe(SHAFT_OD_MM)
    expect(infeedRhoAt(0.5)).toBeGreaterThan(SHAFT_ROOT_MM)
    expect(infeedRhoAt(1)).toBeCloseTo(SHAFT_ROOT_MM + 0.005, 12)
    expect(infeedRhoAt(5)).toBeCloseTo(SHAFT_ROOT_MM + 0.005, 12)
    expect(infeedRhoAt(12)).toBeCloseTo(SHAFT_ROOT_MM + 0.005, 12)
  })
  it('relieves the return by the full 2.0 mm with an unmistakable >= 0.4 s clear hold', () => {
    // m = 0.1 sits in the cutting half (phase 0.38): no backoff while cutting.
    expect(backoffAt(0.1)).toBe(0)
    let clearStart = -1
    let clearSpan = 0
    for (let t = 7.2; t <= 9.6; t += 1 / 240) {
      const f = sample(t)
      if (f.strokePhase < 0.5) expect(f.backoff).toBe(0)
      if (f.backoff >= 2 * 0.999) {
        if (clearStart < 0) clearStart = t
        clearSpan = t - clearStart
      }
    }
    expect(clearSpan).toBeGreaterThanOrEqual(0.4)
  })
  it('derives every space depth from cutting contact events (independent numerical oracle)', () => {
    const crossings: number[][] = []
    for (let i = 0; i < SHAFT_SPACES; i++) {
      let c = (SPACE_CLOCK_RAD + i * SPACE_PITCH_RAD - Math.PI / 2) / -WORK_RATE
      c -= Math.floor(c / 2) * 2
      const list: number[] = []
      for (let k = 0; k < 16; k++) {
        const m = c + 2 * k
        if (strokePhaseAt(m) >= 0.5) continue
        // Independent contact solve: retain the nearest-space interval, find where the
        // certified cosine stroke first enters the material face, not the old angular
        // centre alone. No producer event table or stock-phase constant is imported.
        const edge = (x: number) => SHAPER_STROKE_CENTRE_Y_MIN_MM
          + (SHAPER_STROKE_CENTRE_Y_MAX_MM - SHAPER_STROKE_CENTRE_Y_MIN_MM)
          * (1 - Math.cos(2 * Math.PI * (x / STROKE_PERIOD_M + STROKE_PHASE_OFFSET))) / 2
          + SHAPER_THICKNESS_MM / 2
        let event = m
        if (edge(m) < FACE_START_MM) {
          let lo = m, hi = m + 0.1
          for (let j = 0; j < 60; j++) {
            const mid = (lo + hi) / 2
            if (edge(mid) < FACE_START_MM) lo = mid; else hi = mid
          }
          event = (lo + hi) / 2
        } else if (edge(m) > SHAPING_FACE_END_MM) {
          let lo = m - 0.1, hi = m
          for (let j = 0; j < 60; j++) {
            const mid = (lo + hi) / 2
            if (edge(mid) < SHAPING_FACE_END_MM) lo = mid; else hi = mid
          }
          event = (lo + hi) / 2
        }
        expect(Math.abs(event - m)).toBeLessThan(0.1)
        list.push(event)
      }
      crossings.push(list)
    }
    for (let t = 2; t <= 15; t += 1 / 24) {
      const m = machiningTimeAt(t)
      const f = sample(t)
      for (let i = 0; i < SHAFT_SPACES; i++) {
        let counted = 0
        for (const mK of crossings[i]) if (mK <= m) counted++
        expect(countedPasses(m, i)).toBe(counted)
        expect(f.spaceDepth[i]).toBeCloseTo(Math.min(1, counted / SPACE_PASSES_REQUIRED), 9)
      }
    }
  })
  it('does not advance stock before face contact or during wholly disengaged intervals (dense causal sweep)', () => {
    for (const t of [2.5, 2.512274, 2.52, 2.55]) {
      const f = sample(t)
      expect(f.edgeY).toBeLessThan(FACE_START_MM)
      expect(f.engagedSpace).toBe(-1)
      expect([...f.spaceDepth]).toEqual(Array(SHAFT_SPACES).fill(0))
    }
    const priorDepth = new Float32Array(SHAFT_SPACES)
    const state = createProgressionState()
    let gains = 0, whollyDisengaged = 0, returnPartial = 0, completion = 0
    let contactFailures = 0, nearestFailures = 0, retainedFailures = 0, previousDepthFailures = 0, aheadMaskFailures = 0
    let priorDisengaged = true
    const firstCompletion = Array(SHAFT_SPACES).fill(-1) as number[]
    const step = 1 / 4800
    for (let tick = 0; tick <= 13 * 4800; tick++) {
      const t = 2 + tick * step, f = sample(t)
      const cutting = f.strokePhase < 0.5
      const contact = cutting && f.edgeY >= FACE_START_MM && f.edgeY <= SHAPING_FACE_END_MM
        && f.cutterRho < SHAFT_OD_MM - 1e-3
      if ((f.engagedSpace >= 0) !== (contact && t < 15)) contactFailures++
      const disengaged = f.engagedSpace < 0
      for (let space = 0; space < SHAFT_SPACES; space++) {
        const depth = f.spaceDepth[space]
        if (depth > priorDepth[space]) {
          gains++
          if (!contact) contactFailures++
          const raw = Math.round((Math.PI / 2 - SPACE_CLOCK_RAD - SHAPER_SIGNED_RATIO * f.cutterPhi) / SPACE_PITCH_RAD)
          const nearest = ((raw % SHAFT_SPACES) + SHAFT_SPACES) % SHAFT_SPACES
          if (nearest !== space || f.engagedSpace !== space) nearestFailures++
        }
        if (disengaged && priorDisengaged && depth !== priorDepth[space]) retainedFailures++
        if (depth === 1 && firstCompletion[space] < 0) firstCompletion[space] = t
        priorDepth[space] = depth
      }
      if (disengaged && priorDisengaged) whollyDisengaged++
      if (!cutting && f.spaceDepth.some(d => d > 0 && d < 1)) returnPartial++
      if (f.spaceDepth.every(d => d === 1) && completion === 0) completion = t
      writeShaftProgression(f, state)
      if (contact && t < 15) {
        // Ahead of the leading face, the CPU/shader writer keeps prior event depth;
        // it never drops farther back than one pass or fabricates a new ahead-edge cut.
        const space = f.engagedSpace
        if ((state.engagedPreviousDepth ?? 0) > f.spaceDepth[space]
          || f.spaceDepth[space] - (state.engagedPreviousDepth ?? 0) > 1 / SPACE_PASSES_REQUIRED) previousDepthFailures++
        const y = (f.edgeY + SHAPING_FACE_END_MM) / 2
        const radius = progressedRadius(SHAFT_ROOT_MM, y, SPACE_CLOCK_RAD + space * SPACE_PITCH_RAD, state, 'legacy')
        if (Math.abs((SHAFT_OD_MM - radius) / (SHAFT_OD_MM - SHAFT_ROOT_MM) - (state.engagedPreviousDepth ?? 0)) >= 0.5e-12) aheadMaskFailures++
      }
      priorDisengaged = disengaged
    }
    expect(gains).toBe(SHAFT_SPACES * SPACE_PASSES_REQUIRED)
    expect({ contactFailures, nearestFailures, retainedFailures, previousDepthFailures, aheadMaskFailures })
      .toEqual({ contactFailures: 0, nearestFailures: 0, retainedFailures: 0, previousDepthFailures: 0, aheadMaskFailures: 0 })
    expect(whollyDisengaged).toBeGreaterThan(10000)
    expect(returnPartial).toBeGreaterThan(0)
    expect(completion).toBeGreaterThan(11)
    expect(completion).toBeLessThan(15)
    expect(firstCompletion.every(t => t > 11 && t < 15)).toBe(true)
  })
  it('completes all ten spaces inside the recap and none before engagement', () => {
    let firstComplete = -1
    const prev = new Float32Array(SHAFT_SPACES)
    for (let t = 2; t <= 15; t += 1 / 240) {
      const f = sample(t)
      let all = true
      for (let i = 0; i < SHAFT_SPACES; i++) {
        expect(f.spaceDepth[i]).toBeGreaterThanOrEqual(prev[i] - 1e-12)
        expect(f.spaceDepth[i]).toBeLessThanOrEqual(1)
        prev[i] = f.spaceDepth[i]
        if (f.spaceDepth[i] < 1 - 1e-12) all = false
      }
      if (all && firstComplete < 0) firstComplete = t
    }
    expect(firstComplete).toBeGreaterThan(11)
    expect(firstComplete).toBeLessThan(15)
    const atRecapStart = sample(11)
    let remaining = 0
    for (let i = 0; i < SHAFT_SPACES; i++) if (atRecapStart.spaceDepth[i] < 1 - 1e-12) remaining++
    expect(remaining).toBe(SHAFT_SPACES)
  })
  it('exposes engagedSpace/edgeY consistent with progression.ts semantics', () => {
    const state = createProgressionState()
    for (const t of [3.5, 8.4, 13.2]) {
      const f = sample(t)
      if (f.engagedSpace >= 0) {
        expect(f.mode).toBe('shaping')
        expect(f.cutting).toBe(true)
        expect(f.edgeY).toBeGreaterThanOrEqual(FACE_START_MM)
      }
      writeShaftProgression(f, state)
      expect(state.mode).toBe(f.mode)
      expect(state.engagedSpace).toBe(f.engagedSpace)
      expect(state.edgeY).toBe(f.edgeY)
      expect(state.hobYc).toBe(f.hobYc)
      expect(state.hobA).toBe(f.hobA)
      expect(state.hobR).toBe(f.hobR)
      for (let i = 0; i < SHAFT_SPACES; i++) expect(state.spaceDepth[i]).toBe(f.spaceDepth[i])
    }
  })
})

describe('K3 hob kinematics', () => {
  it('follows the certified path: infeed yc, feed to stop, retract 2.5 mm, withdraw', () => {
    expect(sample(24.9).hobYc).toBe(HOB_INFEED_YC_MM)
    expect(sample(25).hobYc).toBe(HOB_INFEED_YC_MM)
    expect(sample(30.2).hobYc).toBeCloseTo(HOB_STOP_YC_MM, 12)
    let prevYc = -Infinity
    for (let t = 25.7; t <= 30.2; t += 1 / 240) {
      const f = sample(t)
      expect(f.hobYc).toBeGreaterThan(prevYc)
      expect(f.hobToolA).toBeCloseTo(10.1618, 9)
      prevYc = f.hobYc
    }
    expect(sample(31).hobToolA).toBeCloseTo(10.1618 + 2.5, 9)
  })
  it('is clear and out of the runout view by 32.0 s', () => {
    const f = sample(32)
    const radialClearance = f.hobToolA - HOB_RADIUS_MM - SHAFT_OD_MM
    expect(radialClearance).toBeGreaterThanOrEqual(0.5)
    expect(hobEnvelopeTopY(f.hobYc)).toBeLessThanOrEqual(FACE_START_MM - 0.5)
    expect(f.hobYc).toBeLessThan(HOB_INFEED_YC_MM)
  })
  it('couples the work at -phi_h / 10 (single start, ten teeth) and never reverses', () => {
    let prevPhi = 0
    let prevWork = 0
    for (let t = 25; t <= 32; t += 1 / 30) {
      const f = sample(t)
      expect(f.hobWorkPhi).toBeCloseTo(-f.hobPhi / 10, 12)
      expect(f.hobPhi).toBeGreaterThanOrEqual(prevPhi - 1e-12)
      expect(f.hobWorkPhi).toBeLessThanOrEqual(prevWork + 1e-12)
      prevPhi = f.hobPhi
      prevWork = f.hobWorkPhi
    }
  })
})

describe('K4 chip and display-rate guard', () => {
  it('shows one restrained chip only while stock is removed, none during return', () => {
    for (let t = 2; t <= 15; t += 1 / 240) {
      const f = sample(t)
      if (!f.cutting || f.mode !== 'shaping' || f.edgeY > SHAPING_FACE_END_MM + SHAPER_OVERTRAVEL_MM) {
        expect(f.chipOpacity).toBe(0)
      }
      if (f.chipOpacity > 0) {
        expect(f.cutting).toBe(true)
        expect(Math.abs(f.chipX)).toBeLessThanOrEqual(CHIP_SEED * 0.4 + 0.6)
        expect(f.chipZ).toBeLessThanOrEqual(SHAFT_OD_MM + 1)
        expect(f.chipY).toBeCloseTo(f.edgeY, 12)
      }
    }
  })
  it('keeps stroke/gash display rates at or below 7.5 Hz unless softened', () => {
    let softenedInRecap = false
    for (let t = 0; t <= SHAFT_KINEMATICS_DURATION; t += 1 / 240) {
      const f = sample(t)
      const exceeds = f.strokeHz > SHAFT_MAX_FEATURE_HZ || f.gashHz > SHAFT_MAX_FEATURE_HZ
      expect(f.softened).toBe(exceeds)
      if (!f.softened) {
        expect(f.strokeHz).toBeLessThanOrEqual(SHAFT_MAX_FEATURE_HZ)
        expect(f.gashHz).toBeLessThanOrEqual(SHAFT_MAX_FEATURE_HZ)
      }
      if (t > 11.5 && t < 14.5 && f.softened) softenedInRecap = true
    }
    expect(softenedInRecap).toBe(true)
  })
  it('never reverses displayed rotation at the 30 fps lite floor', () => {
    let prevCutter = 0
    let prevWork = 0
    for (let t = 2; t <= 32; t += 1 / 30) {
      const f = sample(t)
      expect(f.cutterPhi).toBeGreaterThanOrEqual(prevCutter - 1e-12)
      expect(f.workPhi).toBeLessThanOrEqual(prevWork + 1e-12)
      prevCutter = f.cutterPhi
      prevWork = f.workPhi
    }
  })
})

describe('determinism and purity', () => {
  it('is bit-identical under shuffled seeks and returns the caller-owned frame', () => {
    const a = createShaftKinematicsFrame()
    const b = createShaftKinematicsFrame()
    const times: number[] = []
    for (let i = 0; i < 600; i++) times.push(((i * 7919) % 10320) / 240)
    for (const t of times) sampleShaftKinematics(t, a)
    for (let i = times.length - 1; i >= 0; i--) sampleShaftKinematics(times[i], b)
    for (const t of times) {
      const fa = sampleShaftKinematics(t, a)
      const fb = sampleShaftKinematics(t, b)
      expect(fa).toBe(a)
      expect(fb).toBe(b)
      for (const key of Object.keys(fa) as (keyof typeof fa)[]) {
        if (key === 'spaceDepth' || key === 'mode' || key === 'cutting' || key === 'returning' || key === 'softened') continue
        expect(fa[key]).toBe(fb[key])
      }
      for (let i = 0; i < SHAFT_SPACES; i++) expect(fa.spaceDepth[i]).toBe(fb.spaceDepth[i])
    }
  })
  it('keeps every numeric field finite across the timeline', () => {
    for (let t = 0; t <= SHAFT_KINEMATICS_DURATION; t += 1 / 24) {
      const f = sample(t)
      expect(Number.isFinite(f.machining)).toBe(true)
      expect(Number.isFinite(f.followAzimuth)).toBe(true)
      expect(Number.isFinite(f.cutterPhi)).toBe(true)
      expect(Number.isFinite(f.hobYc)).toBe(true)
      expect(Number.isFinite(f.chipX)).toBe(true)
      expect(Number.isFinite(f.strokeHz)).toBe(true)
      for (let i = 0; i < SHAFT_SPACES; i++) expect(Number.isFinite(f.spaceDepth[i])).toBe(true)
    }
  })
})

describe('R8 progression review regressions', () => {
  it('retains prior depth ahead of the edge on passes 2-4 across all ten spaces and both sides of crossings', () => {
    const f = createShaftKinematicsFrame(), state = createProgressionState(), uniforms = createProgressionUniforms()
    const covered = new Set<string>()
    const sides = new Set<number>()
    for (let space = 0; space < SHAFT_SPACES; space++) {
      let first = (SPACE_CLOCK_RAD + space * SPACE_PITCH_RAD - Math.PI / 2) / -WORK_RATE
      first -= Math.floor(first / 2) * 2
      let pass = 0
      for (let crossing = first; crossing <= MACHINING_AT_SHAPING_END; crossing += 2) {
        if (strokePhaseAt(crossing) >= 0.5) continue
        pass++
        if (pass < 2 || pass > 4) continue
        for (const offset of [-0.09, -0.05, -0.025, 0, 0.025, 0.05, 0.09]) {
          const m = crossing + offset
          let lo = 2, hi = 15
          for (let i = 0; i < 60; i++) {
            const mid = (lo + hi) / 2
            if (machiningTimeAt(mid) < m) lo = mid; else hi = mid
          }
          sampleShaftKinematics((lo + hi) / 2, f)
          // Some offsets land in the relieved return or beyond the face band;
          // those samples have no engaged region ahead of the edge to evaluate.
          if (f.engagedSpace !== space || f.edgeY >= SHAPING_FACE_END_MM) continue
          writeShaftProgression(f, state); writeProgressionUniforms(uniforms, state, 'legacy')
          const previous = (pass - 1) / SPACE_PASSES_REQUIRED
          expect(state.engagedPreviousDepth).toBe(previous)
          expect(uniforms.uEngagedPreviousDepth.value).toBe(previous)
          const aheadY = (f.edgeY + SHAPING_FACE_END_MM) / 2
          const radius = progressedRadius(SHAFT_ROOT_MM, aheadY, SPACE_CLOCK_RAD + space * SPACE_PITCH_RAD, state, 'legacy')
          const shownDepth = (SHAFT_OD_MM - radius) / (SHAFT_OD_MM - SHAFT_ROOT_MM)
          expect(shownDepth).toBeCloseTo(previous, 12)
          expect(shownDepth).toBeGreaterThanOrEqual(previous - 1e-12)
          covered.add(space + ':' + pass)
          sides.add(Math.sign(offset))
        }
      }
    }
    expect(covered.size).toBe(SHAFT_SPACES * 3)
    expect([...sides].sort()).toEqual([-1, 0, 1])
    writeShaftProgression(sampleShaftKinematics(1, f), state)
    expect(state.engagedPreviousDepth).toBe(0)
  })

  it('holds the completed swept hob envelope in the shared writer while the tool retracts and withdraws', () => {
    const f = createShaftKinematicsFrame(), state = createProgressionState()
    writeShaftProgression(sampleShaftKinematics(30.2, f), state)
    const radii = Array.from({ length: 101 }, (_, i) => progressedRadius(SHAFT_ROOT_MM,
      FACE_START_MM + (HOBBING_FACE_END_MM - FACE_START_MM) * i / 100, 0, state, 'approved'))
    for (const t of [31.999, 30.2, 31.2, 30.8, 31.8, 31, 30.2]) {
      writeShaftProgression(sampleShaftKinematics(t, f), state)
      expect(state.hobYc).toBe(HOB_STOP_YC_MM)
      expect(state.hobA).toBe(HOB_VISUAL_A_MM)
      for (let i = 0; i <= 100; i++) {
        expect(progressedRadius(SHAFT_ROOT_MM, FACE_START_MM + (HOBBING_FACE_END_MM - FACE_START_MM) * i / 100,
          0, state, 'approved')).toBe(radii[i])
      }
      if (t > 31) expect(f.hobYc).toBeLessThan(HOB_STOP_YC_MM)
      if (t > 30.2) expect(f.hobA).toBeGreaterThan(HOB_VISUAL_A_MM)
    }
    writeShaftProgression(sampleShaftKinematics(30.2 - 1e-6, f), state)
    expect(state.hobYc).toBe(f.hobYc); expect(state.hobA).toBe(f.hobA)
    writeShaftProgression(sampleShaftKinematics(25, f), state)
    expect(state.hobYc).toBe(HOB_INFEED_YC_MM); expect(state.hobA).toBe(f.hobA)
  })
})
