import { describe, expect, it } from 'vitest'
import {
  DRAWING_INTRO_WINDOW,
  REDUCED_MOTION_INTRO_T,
  INTRO_PHASES,
  INTRO_SCROLL_SHARE,
  drawingIntroState,
  introPoseTime,
  introScrollTimeFor,
  pacedProgress,
  rawScrollFor,
  remapHeroProgress,
} from './introTimeline'

describe('intro pacing map', () => {
  it('gives the intro its scroll share and leaves the downstream axis linear', () => {
    expect(pacedProgress(0)).toBe(0)
    expect(pacedProgress(1)).toBeCloseTo(1, 12)
    expect(pacedProgress(INTRO_SCROLL_SHARE)).toBeCloseTo(DRAWING_INTRO_WINDOW.releaseEnd, 12)
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
})

describe('intro phase map', () => {
  it('parks reduced motion on a fully focused, flat registered drawing before excitation', () => {
    const state = drawingIntroState(REDUCED_MOTION_INTRO_T * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(state.focus).toBe(1)
    expect(state.pulse).toBe(0)
    expect(state.pbr).toBe(0)
    expect(state.perspective).toBe(0)
    expect(state.drawingOpacity).toBe(1)
  })
  it('holds the registered camera through initial metal emergence', () => {
    for (const t of [0.4, 0.5, 0.6, 0.68, INTRO_PHASES.orbitStart]) {
      expect(drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd).perspective).toBe(0)
    }
    expect(drawingIntroState(0.7 * DRAWING_INTRO_WINDOW.releaseEnd).pbr).toBeCloseTo(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd).perspective).toBe(1)
  })

  it('ends exact registration before the pressure tilt and keeps the tilt inside the pulse window', () => {
    const { pulseStart, pulseEnd, registrationEnd, metalStart, riseStart, orbitStart } = INTRO_PHASES
    expect(pulseStart).toBeLessThan(registrationEnd)
    expect(registrationEnd).toBeLessThan(metalStart)
    expect(metalStart).toBeLessThan(riseStart)
    expect(riseStart).toBeLessThanOrEqual(orbitStart)
    // The square-on hold covers the reduced-motion park and completes before the pulse does.
    expect(REDUCED_MOTION_INTRO_T).toBeLessThanOrEqual(registrationEnd)
    expect(registrationEnd).toBeLessThan(pulseEnd)
    // Inside the tilt window the pressure is building and metal is already showing, while
    // the hero/perspective blend still waits for orbitStart: only the camera tilts.
    const midTilt = drawingIntroState(0.5 * (registrationEnd + riseStart) * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(midTilt.perspective).toBe(0)
    expect(midTilt.pulse).toBe(1)
    expect(midTilt.pbr).toBeGreaterThan(0)
    // Registration gates are honest only while the camera is square on: the hold must not
    // leak into the tilt, and the tilt must not start before the pulse does.
    expect(registrationEnd).toBeGreaterThan(pulseStart)
    expect(riseStart).toBeGreaterThan(registrationEnd)
  })

  it('reveals metal while the tool is still pressed into the sheet, before lift', () => {
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(state(INTRO_PHASES.metalStart).pbr).toBe(0)
    expect(INTRO_PHASES.metalStart).toBeGreaterThan(INTRO_PHASES.pulseStart)
    expect(state(INTRO_PHASES.riseStart).pbr).toBeGreaterThan(0.5)
    expect(state(INTRO_PHASES.riseStart).poseT).toBeCloseTo(0.4, 12)
  })

  it('sweeps light once after physical separation and resets on reverse scroll', () => {
    const crossing = 0.8993818764962211
    const start = introScrollTimeFor(crossing)
    const state = (t: number) => drawingIntroState(t * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    expect(state(start - 0.01).lightSweep).toBe(0)
    expect(state((start + 1) / 2).lightSweep).toBeCloseTo(1)
    expect(state(1).lightSweep).toBeCloseTo(0)
    expect(state(start - 0.01).lightSweep).toBe(0)
    expect(drawingIntroState(0.4, crossing).lightSweep).toBeCloseTo(0)
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
    const mid = drawingIntroState(0.5 * (INTRO_PHASES.onboardStart + INTRO_PHASES.onboardEnd) * DRAWING_INTRO_WINDOW.releaseEnd)
    expect(mid.focus).toBe(1)
    expect(mid.pulse).toBe(0)
    expect(mid.pbr).toBe(0)
    expect(mid.poseT).toBeLessThan(0.4)
    expect(mid.drawingOpacity).toBe(1)
  })

  it('holds the print opaque until the shockwave has crossed the sheet', () => {
    const crossing = 0.8993818764962211
    const atWaveEnd = drawingIntroState(INTRO_PHASES.waveEnd * DRAWING_INTRO_WINDOW.releaseEnd, crossing)
    expect(atWaveEnd.waveTime).toBeCloseTo(1, 12)
    expect(atWaveEnd.drawingOpacity).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, crossing).drawingOpacity).toBe(0)
  })

  it('runs the shockwave exactly once, after the solved separation', () => {
    const crossing = 0.8993818764962211
    const start = introScrollTimeFor(crossing)
    expect(drawingIntroState((start - 0.01) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
    expect(drawingIntroState((start + 0.01) * DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.releaseEnd, crossing).waveActive).toBe(0)
  })

  it('reparameterizes pose time without moving the pose axis itself', () => {
    expect(introPoseTime(0)).toBe(0)
    expect(introPoseTime(INTRO_PHASES.riseStart)).toBeCloseTo(0.4, 12)
    expect(introPoseTime(1)).toBeCloseTo(1, 12)
    for (const pose of [0.1, 0.4, 0.7, 0.8993818764962211, 1]) {
      expect(introPoseTime(introScrollTimeFor(pose))).toBeCloseTo(pose, 10)
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
