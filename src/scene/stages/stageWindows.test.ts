import { describe, expect, it } from 'vitest'
import {
  ENCLOSURE_HALF,
  STAGE_TRANSITIONS,
  STATION2_CAD_ANCHORS,
  airflowIntensity,
  stageEnvelope,
  type FadeRange,
} from './stageWindows'

/**
 * stageWindows — characterization tests for the pure multi-chapter stage-window
 * maths. SpatialRig / AirflowField all gate the canvas on these
 * numbers, so every expected value here is derived from the module as it stands,
 * measured against the CURRENT document (2026-08-27 remeasure: 3 × 440vh
 * chapters + 660vh CH.04 + 40vh footer = 2020vh).
 */

// The module's internal easing, mirrored here so sub-threshold alphas can be
// derived instead of guessed.
const smooth = (t: number): number => t * t * (3 - 2 * t)

/** Closed-form inverse of smoothstep on [0, 1]. */
const inverseSmooth = (alpha: number): number => 0.5 - Math.sin(Math.asin(1 - 2 * alpha) / 3)

/** The progress inside `range` whose segment() value is exactly `alpha`. */
const progressForSegmentAlpha = (alpha: number, [start, end]: FadeRange): number =>
  start + inverseSmooth(alpha) * (end - start)

describe('STAGE_TRANSITIONS — chapter ownership windows', () => {
  it('pins the four windows to the 2026-08-27 remeasure', () => {
    expect(STAGE_TRANSITIONS.wrenchOut).toEqual([0.525, 0.565])
    expect(STAGE_TRANSITIONS.enclosureIn).toEqual([0.525, 0.565])
    expect(STAGE_TRANSITIONS.enclosureOut).toEqual([0.72, 0.76])
    expect(STAGE_TRANSITIONS.pointCloudIn).toEqual([0.72, 0.76])
  })

  it('makes each handoff a true cross-fade by sharing one range', () => {
    // wrenchOut ↔ enclosureIn — identical windows, so the outgoing wrench and
    // incoming enclosure envelopes stay complementary across the fade.
    expect(STAGE_TRANSITIONS.enclosureIn).toEqual(STAGE_TRANSITIONS.wrenchOut)
    // enclosureOut ↔ pointCloudIn — identical windows too.
    expect(STAGE_TRANSITIONS.pointCloudIn).toEqual(STAGE_TRANSITIONS.enclosureOut)
    // Equal by value only: these are separately declared array literals.
    expect(STAGE_TRANSITIONS.enclosureIn).not.toBe(STAGE_TRANSITIONS.wrenchOut)
    expect(STAGE_TRANSITIONS.pointCloudIn).not.toBe(STAGE_TRANSITIONS.enclosureOut)
  })

  it('keeps every range strictly forward-ordered (start < end)', () => {
    for (const [name, [start, end]] of Object.entries(STAGE_TRANSITIONS)) {
      expect(start, `${name} must start before it ends`).toBeLessThan(end)
    }
  })

  it('runs the handoffs in chapter order, with a hold span between them', () => {
    expect(STAGE_TRANSITIONS.wrenchOut[1]).toBeLessThanOrEqual(STAGE_TRANSITIONS.enclosureOut[0])
    // The same 0.155 span airflowIntensity() ramps over.
    expect(
      STAGE_TRANSITIONS.enclosureOut[0] - STAGE_TRANSITIONS.enclosureIn[1],
    ).toBeCloseTo(0.155, 12)
  })
})

describe('stageEnvelope — both windows present (CH.03 enclosure)', () => {
  const fadeIn = STAGE_TRANSITIONS.enclosureIn
  const fadeOut = STAGE_TRANSITIONS.enclosureOut

  it('smoothsteps 0 → 1 across the fade-in (start, middle, end)', () => {
    expect(stageEnvelope(fadeIn[0], fadeIn, fadeOut).alpha).toBe(0)
    // t = 0.25 / 0.50 / 0.75 of the 0.525 → 0.565 window
    expect(stageEnvelope(0.535, fadeIn, fadeOut).alpha).toBeCloseTo(0.15625, 12)
    expect(stageEnvelope(0.545, fadeIn, fadeOut).alpha).toBeCloseTo(0.5, 12)
    expect(stageEnvelope(0.555, fadeIn, fadeOut).alpha).toBeCloseTo(0.84375, 12)
    expect(stageEnvelope(fadeIn[1], fadeIn, fadeOut).alpha).toBe(1)
  })

  it('clamps alpha to 0 outside the live window', () => {
    expect(stageEnvelope(-1, fadeIn, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(0, fadeIn, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(0.524, fadeIn, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(fadeOut[1], fadeIn, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(0.9, fadeIn, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(2, fadeIn, fadeOut).alpha).toBe(0)
  })

  it('holds alpha at 1 between the fade-in and the fade-out', () => {
    expect(stageEnvelope(fadeIn[1], fadeIn, fadeOut).alpha).toBe(1)
    expect(stageEnvelope(0.6, fadeIn, fadeOut).alpha).toBe(1)
    expect(stageEnvelope(0.719999, fadeIn, fadeOut).alpha).toBe(1)
  })

  it('mirrors the ramp downward across the fade-out (start, middle, end)', () => {
    expect(stageEnvelope(fadeOut[0], fadeIn, fadeOut).alpha).toBe(1)
    expect(stageEnvelope(0.73, fadeIn, fadeOut).alpha).toBeCloseTo(0.84375, 12)
    expect(stageEnvelope(0.74, fadeIn, fadeOut).alpha).toBeCloseTo(0.5, 12)
    expect(stageEnvelope(0.75, fadeIn, fadeOut).alpha).toBeCloseTo(0.15625, 12)
    expect(stageEnvelope(fadeOut[1], fadeIn, fadeOut).alpha).toBe(0)
  })

  it('keeps the two stages of a shared handoff complementary', () => {
    // wrenchOut === enclosureIn, so the outgoing and incoming alphas sum to 1.
    for (const progress of [0.525, 0.535, 0.545, 0.555, 0.565]) {
      const incoming = stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, undefined).alpha
      const outgoing = stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut).alpha
      expect(incoming + outgoing).toBeCloseTo(1, 12)
    }
  })
})

describe('stageEnvelope — fadeIn omitted means already fully in (tIn = 1)', () => {
  it('stays alpha 1 everywhere when both windows are omitted', () => {
    expect(stageEnvelope(0, undefined, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(0.42, undefined, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(1, undefined, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(-0.5, undefined, undefined).alpha).toBe(1)
    expect(stageEnvelope(3, undefined, undefined).alpha).toBe(1)
  })

  it('fades out only across the supplied fadeOut (wrench stage)', () => {
    const fadeOut = STAGE_TRANSITIONS.wrenchOut
    expect(stageEnvelope(0, undefined, fadeOut).alpha).toBe(1)
    expect(stageEnvelope(fadeOut[0], undefined, fadeOut).alpha).toBe(1)
    expect(stageEnvelope(0.535, undefined, fadeOut).alpha).toBeCloseTo(0.84375, 12)
    expect(stageEnvelope(0.545, undefined, fadeOut).alpha).toBeCloseTo(0.5, 12)
    expect(stageEnvelope(0.555, undefined, fadeOut).alpha).toBeCloseTo(0.15625, 12)
    expect(stageEnvelope(fadeOut[1], undefined, fadeOut)).toEqual({ alpha: 0, active: false })
    expect(stageEnvelope(0.6, undefined, fadeOut).alpha).toBe(0)
    expect(stageEnvelope(1, undefined, fadeOut).alpha).toBe(0)
  })
})

describe('stageEnvelope — fadeOut omitted means it never leaves (tOut = 0)', () => {
  it('ramps in over fadeIn, then holds alpha 1 to the end (point-cloud stage)', () => {
    const fadeIn = STAGE_TRANSITIONS.pointCloudIn
    expect(stageEnvelope(0, fadeIn, undefined).alpha).toBe(0)
    expect(stageEnvelope(fadeIn[0], fadeIn, undefined).alpha).toBe(0)
    expect(stageEnvelope(0.73, fadeIn, undefined).alpha).toBeCloseTo(0.15625, 12)
    expect(stageEnvelope(0.74, fadeIn, undefined).alpha).toBeCloseTo(0.5, 12)
    expect(stageEnvelope(0.75, fadeIn, undefined).alpha).toBeCloseTo(0.84375, 12)
    expect(stageEnvelope(fadeIn[1], fadeIn, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(0.9, fadeIn, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(1, fadeIn, undefined)).toEqual({ alpha: 1, active: true })
    expect(stageEnvelope(5, fadeIn, undefined)).toEqual({ alpha: 1, active: true })
  })
})

describe('stageEnvelope — active gate is alpha > 0.001', () => {
  it('is inactive just below the threshold and active just above it', () => {
    const fadeIn = STAGE_TRANSITIONS.wrenchOut
    const belowAlpha = 0.0009
    const aboveAlpha = 0.0012
    // Invert the module's easing (smoothstep t*t*(3-2t)) so both progress
    // values are derived to land either side of the gate, not guessed.
    expect(smooth(inverseSmooth(belowAlpha))).toBeCloseTo(belowAlpha, 12)
    const belowProgress = progressForSegmentAlpha(belowAlpha, fadeIn)
    const aboveProgress = progressForSegmentAlpha(aboveAlpha, fadeIn)
    expect(belowProgress).toBeGreaterThan(fadeIn[0])
    expect(belowProgress).toBeLessThan(aboveProgress)
    expect(aboveProgress).toBeLessThan(fadeIn[1])

    const below = stageEnvelope(belowProgress, fadeIn, undefined)
    expect(below.alpha).toBeCloseTo(belowAlpha, 11)
    expect(below.alpha).toBeLessThan(0.001)
    expect(below.active).toBe(false)

    const above = stageEnvelope(aboveProgress, fadeIn, undefined)
    expect(above.alpha).toBeCloseTo(aboveAlpha, 11)
    expect(above.alpha).toBeGreaterThan(0.001)
    expect(above.active).toBe(true)
  })

  it('applies the same gate to the fade-out side (alpha = 1 - tOut)', () => {
    const fadeIn = STAGE_TRANSITIONS.enclosureIn
    const fadeOut = STAGE_TRANSITIONS.enclosureOut
    const below = stageEnvelope(progressForSegmentAlpha(1 - 0.0009, fadeOut), fadeIn, fadeOut)
    expect(below.alpha).toBeCloseTo(0.0009, 11)
    expect(below.active).toBe(false)

    const above = stageEnvelope(progressForSegmentAlpha(1 - 0.0012, fadeOut), fadeIn, fadeOut)
    expect(above.alpha).toBeCloseTo(0.0012, 11)
    expect(above.active).toBe(true)
  })

  it('never reports an alpha outside [0, 1]', () => {
    for (const progress of [-5, -0.001, 0, 0.525, 0.565, 0.6, 0.72, 0.76, 0.9999, 1, 5]) {
      const { alpha } = stageEnvelope(
        progress,
        STAGE_TRANSITIONS.enclosureIn,
        STAGE_TRANSITIONS.enclosureOut,
      )
      expect(alpha, `alpha at progress ${progress}`).toBeGreaterThanOrEqual(0)
      expect(alpha, `alpha at progress ${progress}`).toBeLessThanOrEqual(1)
    }
  })
})

describe('airflowIntensity — CH.03 hold-window ramp', () => {
  const holdStart = STAGE_TRANSITIONS.enclosureIn[1]
  const holdEnd = STAGE_TRANSITIONS.enclosureOut[0]

  it('is 0 at or before the entry cross-fade end', () => {
    expect(airflowIntensity(-1)).toBe(0)
    expect(airflowIntensity(0)).toBe(0)
    expect(airflowIntensity(holdStart * 0.5)).toBe(0)
    expect(airflowIntensity(holdStart - 0.001)).toBe(0)
    expect(airflowIntensity(holdStart)).toBe(0)
  })

  it('is 1 at or after the exit window start', () => {
    expect(airflowIntensity(holdEnd)).toBe(1)
    expect(airflowIntensity(holdEnd + 0.001)).toBe(1)
    expect(airflowIntensity(0.9)).toBe(1)
    expect(airflowIntensity(1)).toBe(1)
    expect(airflowIntensity(2)).toBe(1)
  })

  it('is the plain linear ramp across the 0.155 hold span', () => {
    const span = holdEnd - holdStart
    expect(span).toBeCloseTo(0.155, 12)
    expect(airflowIntensity(holdStart + span * 0.25)).toBeCloseTo(0.25, 12)
    expect(airflowIntensity(holdStart + span * 0.5)).toBeCloseTo(0.5, 12)
    expect(airflowIntensity(holdStart + span * 0.75)).toBeCloseTo(0.75, 12)
    expect(airflowIntensity(holdEnd - 0.001)).toBeCloseTo(1 - 0.001 / span, 12)
  })

  it('increases strictly between the two window edges', () => {
    let previous = -1
    for (let i = 0; i <= 500; i++) {
      const progress = holdStart + (i / 500) * (holdEnd - holdStart)
      const value = airflowIntensity(progress)
      expect(
        value,
        `airflowIntensity(${progress}) must exceed the previous sample`,
      ).toBeGreaterThan(previous)
      previous = value
    }
    expect(previous).toBeCloseTo(1, 12)
  })
})

describe('station-2 anchor data — existence and shape only', () => {
  it('exposes the seven measured enclosure anchors as 3-tuples', () => {
    expect(Object.keys(STATION2_CAD_ANCHORS)).toEqual([
      'enclosureChassis',
      'compositePanels',
      'pumpHousing',
      'acousticBaffles',
      'ductIntake',
      'ductExhaust',
      'isolationMounts',
    ])
    const anchors: readonly (readonly number[])[] = Object.values(STATION2_CAD_ANCHORS)
    for (const anchor of anchors) {
      expect(anchor).toHaveLength(3)
      for (const component of anchor) {
        expect(Number.isFinite(component)).toBe(true)
      }
    }
  })

  it('exposes the enclosure half-extents as a 3-tuple', () => {
    expect(ENCLOSURE_HALF).toHaveLength(3)
    for (const half of ENCLOSURE_HALF) {
      expect(Number.isFinite(half)).toBe(true)
    }
  })
})
