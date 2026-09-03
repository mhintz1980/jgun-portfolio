import { describe, expect, it } from 'vitest'
import {
  DRAWING_INTRO_WINDOW,
  drawingIntroState,
  remapHeroProgress,
} from './introTimeline'

describe('drawing intro timeline', () => {
  it('holds the drawing, pulses once, and hands off on an exact shared frame', () => {
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.focusEnd).drawingOpacity).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.pulsePeak).pulse).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.handoff).handoff).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.handoff).modelOpacity).toBe(1)
    expect(drawingIntroState(DRAWING_INTRO_WINDOW.handoff).drawingOpacity).toBe(0)
  })

  it('maps every retained hero beat after the intro without changing its relative order', () => {
    const first = remapHeroProgress(0)
    const ghost = remapHeroProgress(0.15)
    const explode = remapHeroProgress(0.35)
    const final = remapHeroProgress(0.85)

    expect(first).toBe(DRAWING_INTRO_WINDOW.releaseEnd)
    expect(first).toBeLessThan(ghost)
    expect(ghost).toBeLessThan(explode)
    expect(explode).toBeLessThan(final)
    expect(final).toBeCloseTo(0.525, 8)
  })
})
