import { describe, expect, it } from 'vitest'
import { cardState, cardTransform, INTRO, OUTRO, sectionHeightVh, sectionProgress } from './stackMath'

describe('cardState', () => {
  it('starts with every card in place, stacked by index', () => {
    for (let i = 0; i < 5; i++) {
      const s = cardState(0, i, 5)
      expect(s.exit).toBe(0)
      expect(s.depth).toBe(i)
      expect(s.opacity).toBe(1)
    }
  })

  it('peels cards off in order and keeps the last one', () => {
    const end = cardState(1, 3, 4)
    expect(end).toEqual({ exit: 0, depth: 0, opacity: 1 })
    for (let i = 0; i < 3; i++) expect(cardState(1 - OUTRO + 0.01, i, 4).opacity).toBe(0)
  })

  it('exit grows monotonically with progress', () => {
    let last = -1
    for (let p = 0; p <= 1; p += 0.01) {
      const e = cardState(p, 1, 5).exit
      expect(e).toBeGreaterThanOrEqual(last)
      last = e
    }
  })

  it('nothing moves during the intro beat', () => {
    expect(cardState(INTRO * 0.9, 0, 4).exit).toBe(0)
  })

  it('a single card never leaves', () => {
    expect(cardState(0.7, 0, 1)).toEqual({ exit: 0, depth: 0, opacity: 1 })
  })
})

describe('cardTransform', () => {
  it('is identity-like for the front card at rest', () => {
    expect(cardTransform({ exit: 0, depth: 0, opacity: 1 })).toBe(
      'translate3d(0.00px, calc(0.00px + 0.00%), 0.00px) rotateX(0.00deg) rotate(0.00deg) scale(1.0000)',
    )
  })

  it('lifts and tips a leaving card', () => {
    expect(cardTransform({ exit: 1, depth: 0, opacity: 0 })).toContain('-135.00%')
    expect(cardTransform({ exit: 1, depth: 0, opacity: 0 })).toContain('rotateX(-42.00deg)')
  })
})

describe('sectionProgress', () => {
  it('maps the sticky travel to 0..1 and clamps', () => {
    expect(sectionProgress(100, 2000, 800)).toBe(0)
    expect(sectionProgress(-600, 2000, 800)).toBeCloseTo(0.5)
    expect(sectionProgress(-5000, 2000, 800)).toBe(1)
  })

  it('handles a section no taller than the viewport', () => {
    expect(sectionProgress(10, 800, 800)).toBe(0)
    expect(sectionProgress(-1, 800, 800)).toBe(1)
  })
})

describe('sectionHeightVh', () => {
  it('adds a beat per card after the first', () => {
    expect(sectionHeightVh(1)).toBe(140)
    expect(sectionHeightVh(5)).toBe(380)
  })
})
