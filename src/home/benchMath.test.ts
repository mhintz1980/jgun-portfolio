import { describe, expect, it } from 'vitest'
import { DETENT, clampTilt, fitDistance, nearestDetent, stepSpin } from './benchMath'

describe('fitDistance', () => {
  it('fits the sphere vertically in a wide view', () => {
    const d = fitDistance(1, 30, 2, 1)
    expect(d).toBeCloseTo(1 / Math.sin((15 * Math.PI) / 180), 6)
  })

  it('moves back in a narrow view, where width is the limit', () => {
    expect(fitDistance(1, 30, 0.5, 1)).toBeGreaterThan(fitDistance(1, 30, 2, 1))
  })

  it('never returns a non-finite distance', () => {
    const cases: [number, number, number][] = [[0, 30, 1], [1, 0, 1], [1, 30, 0], [Number.NaN, 30, 1]]
    for (const [radius, fov, aspect] of cases) {
      expect(Number.isFinite(fitDistance(radius, fov, aspect))).toBe(true)
    }
  })
})

describe('detents', () => {
  it('snaps to the nearest 15 degree notch', () => {
    expect(nearestDetent(DETENT * 2.4)).toBeCloseTo(DETENT * 2, 9)
    expect(nearestDetent(-DETENT * 2.6)).toBeCloseTo(-DETENT * 3, 9)
  })

  it('a released spin coasts, slows, and comes to rest exactly on a notch', () => {
    let state = { angle: 0.1, velocity: 6 }
    let resting = false
    let peak = 0
    for (let i = 0; i < 2000 && !resting; i++) {
      const next = stepSpin(state, 1 / 60)
      peak = Math.max(peak, next.angle)
      state = next
      resting = next.resting
    }
    expect(resting).toBe(true)
    expect(peak).toBeGreaterThan(0.5)
    expect(state.angle / DETENT).toBeCloseTo(Math.round(state.angle / DETENT), 6)
    expect(state.velocity).toBe(0)
  })

  it('does not overshoot the notch while settling', () => {
    let state = { angle: DETENT * 0.4, velocity: 0 }
    for (let i = 0; i < 300; i++) {
      state = stepSpin(state, 1 / 60)
      expect(state.angle).toBeGreaterThanOrEqual(0)
      expect(state.angle).toBeLessThanOrEqual(DETENT * 0.4 + 1e-9)
    }
  })

  it('ignores a long frame gap instead of jumping', () => {
    const next = stepSpin({ angle: 0, velocity: 10 }, 5)
    expect(next.angle).toBeLessThan(0.6)
  })
})

describe('clampTilt', () => {
  it('keeps the tilt inside its range', () => {
    expect(clampTilt(5)).toBe(0.9)
    expect(clampTilt(-5)).toBe(-0.15)
    expect(clampTilt(0.3)).toBe(0.3)
  })
})
