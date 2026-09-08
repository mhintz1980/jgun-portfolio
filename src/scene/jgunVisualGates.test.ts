import { describe, expect, it } from 'vitest'
import { LCD_REVEAL_WINDOW } from '../data/caseStudies'
import {
  explodeHoldGate,
  explodeShadowOpacity,
  lcdMicroRimIntensity,
  studioSpotNudge,
} from './jgunVisualGates'

/**
 * JG-032 — JGUN progress-gate tests. The SceneCanvas is global, so every
 * addition must be provably inert outside its window — asserted at CH.04
 * progress values specifically (CH.04 owns the canvas from 0.72).
 */
const CH04_PROGRESS = [0.72, 0.76, 0.8, 0.9, 0.97, 1.0]

describe('JG-032 explode-hold gate (clamped to the wrench-sink boundary)', () => {
  it('is zero at every CH.04 progress value', () => {
    for (const p of CH04_PROGRESS) {
      expect(explodeHoldGate(p)).toBe(0)
    }
  })

  it('is full inside the explode hold and zero before the window', () => {
    expect(explodeHoldGate(0.5)).toBe(1)
    expect(explodeHoldGate(0.49)).toBe(1)
    expect(explodeHoldGate(0.46)).toBe(0)
    expect(explodeHoldGate(0)).toBe(0)
    expect(explodeHoldGate(0.565)).toBe(0)
    // smooth ramps at both edges
    expect(explodeHoldGate(0.48)).toBeGreaterThan(0)
    expect(explodeHoldGate(0.48)).toBeLessThan(1)
    expect(explodeHoldGate(0.545)).toBeGreaterThan(0)
    expect(explodeHoldGate(0.545)).toBeLessThan(1)
  })
})

describe('JG-032 secondary explode shadow', () => {
  it('peaks at 0.12 × explodeFactor inside the window', () => {
    expect(explodeShadowOpacity(0.5, 1)).toBeCloseTo(0.12, 6)
    expect(explodeShadowOpacity(0.5, 0.5)).toBeCloseTo(0.06, 6)
    expect(explodeShadowOpacity(0.5, 0)).toBe(0)
  })

  it('returns zero at CH.04 progress values even with explodeFactor = 1', () => {
    for (const p of CH04_PROGRESS) {
      expect(explodeShadowOpacity(p, 1)).toBe(0)
    }
  })
})

describe('JG-032 StudioRig spot nudge', () => {
  it('adds +0.3 intensity / +0.1 Y at full gate', () => {
    const nudge = studioSpotNudge(0.5)
    expect(nudge.intensity).toBeCloseTo(0.3, 6)
    expect(nudge.y).toBeCloseTo(0.1, 6)
  })

  it('is exactly zero at CH.04 progress values (resting values unchanged)', () => {
    for (const p of CH04_PROGRESS) {
      expect(studioSpotNudge(p).intensity).toBe(0)
      expect(studioSpotNudge(p).y).toBe(0)
    }
  })
})

describe('JG-032 LCD micro-rim light', () => {
  it('is active only inside LCD_REVEAL_WINDOW (0.420–0.525)', () => {
    expect(LCD_REVEAL_WINDOW.start).toBeCloseTo(0.42, 6)
    expect(LCD_REVEAL_WINDOW.end).toBeCloseTo(0.525, 6)
    expect(lcdMicroRimIntensity(0.47, [0.42, 0.525])).toBeCloseTo(0.8, 6)
    expect(lcdMicroRimIntensity(0.419, [0.42, 0.525])).toBe(0)
    expect(lcdMicroRimIntensity(0.526, [0.42, 0.525])).toBe(0)
    // eased edges
    expect(lcdMicroRimIntensity(0.43, [0.42, 0.525])).toBeGreaterThan(0)
    expect(lcdMicroRimIntensity(0.43, [0.42, 0.525])).toBeLessThan(0.8)
  })

  it('is zero at CH.04 progress values', () => {
    for (const p of CH04_PROGRESS) {
      expect(lcdMicroRimIntensity(p, [0.42, 0.525])).toBe(0)
    }
  })
})
