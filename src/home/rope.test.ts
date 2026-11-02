import { describe, expect, it } from 'vitest'
import { REACH, createRope, endToEnd, isSolved, loopsToFit, maxSpeed, step, straightLayout, tangledLayout } from './rope'

const anchor = { x: 10, y: 110 }
const length = 1000
const bounds = { minX: 0, minY: 4, maxX: 1040, maxY: 216 }

function segmentErrors(rope: ReturnType<typeof createRope>) {
  let worst = 0
  for (let i = 0; i < rope.x.length - 1; i++) {
    const d = Math.hypot(rope.x[i + 1] - rope.x[i], rope.y[i + 1] - rope.y[i])
    worst = Math.max(worst, Math.abs(d - rope.segment) / rope.segment)
  }
  return worst
}

describe('rope layout', () => {
  it('starts as a looped trochoid at the anchor with equal segments', () => {
    const rope = createRope({ anchor, length, points: 60, maxHeight: 180 })
    expect(rope.x[0]).toBe(anchor.x)
    expect(rope.y[0]).toBe(anchor.y)
    expect(rope.x.length).toBe(60)
    // Resampled at equal arc length: chords are a little shorter than the arc, never longer.
    expect(segmentErrors(rope)).toBeLessThan(0.12)
    const ys = Array.from(rope.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(180)
    expect(isSolved(rope)).toBe(false)
    expect(endToEnd(rope)).toBeLessThan(0.6 * length)
  })

  it('has real loops: x goes backwards somewhere', () => {
    const pts = tangledLayout(anchor, length, 60, 3)
    let backwards = 0
    for (let i = 1; i < pts.length; i++) if (pts[i].x < pts[i - 1].x) backwards++
    expect(backwards).toBeGreaterThan(5)
  })

  it('fits at least three loops into the given height', () => {
    expect(loopsToFit(1000, 180)).toBeGreaterThanOrEqual(3)
    expect(loopsToFit(330, 140)).toBe(3)
    expect(loopsToFit(1000, 60)).toBeGreaterThan(loopsToFit(1000, 180))
  })

  it('is deterministic', () => {
    const a = createRope({ anchor, length, maxHeight: 180 })
    const b = createRope({ anchor, length, maxHeight: 180 })
    expect(Array.from(a.x)).toEqual(Array.from(b.x))
    expect(Array.from(a.y)).toEqual(Array.from(b.y))
  })

  it('straight layout is solved and reaches the far end', () => {
    const pts = straightLayout(anchor, length, 60)
    expect(pts[59].x - anchor.x).toBeCloseTo(REACH * length, 6)
    const rope = createRope({ anchor, length, layout: 'straight' })
    expect(isSolved(rope)).toBe(true)
    let arc = 0
    for (let i = 1; i < pts.length; i++) arc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    expect(arc / length).toBeGreaterThan(0.98)
    expect(arc / length).toBeLessThan(1.02)
  })
})

describe('rope simulation', () => {
  it('keeps segment lengths within tolerance and the left end pinned while idle', () => {
    const rope = createRope({ anchor, length, maxHeight: 180, bounds })
    for (let i = 0; i < 240; i++) step(rope, 1 / 60)
    expect(rope.x[0]).toBe(anchor.x)
    expect(rope.y[0]).toBe(anchor.y)
    expect(segmentErrors(rope)).toBeLessThan(0.12)
  })

  it('is solved after the free end is pulled to anchor + 0.95 × length', () => {
    const rope = createRope({ anchor, length, maxHeight: 180, bounds })
    expect(isSolved(rope)).toBe(false)
    const start = { x: rope.x[59], y: rope.y[59] }
    const target = { x: anchor.x + 0.95 * length, y: anchor.y }
    // A gradual pull, like a drag: 1 s of travel, then 1 s holding.
    for (let i = 0; i < 120; i++) {
      const f = Math.min(1, i / 60)
      step(rope, 1 / 60, { x: start.x + (target.x - start.x) * f, y: start.y + (target.y - start.y) * f })
    }
    expect(rope.x[0]).toBe(anchor.x)
    expect(rope.y[0]).toBe(anchor.y)
    expect(isSolved(rope)).toBe(true)
    expect(endToEnd(rope)).toBeGreaterThanOrEqual(0.9 * length)
    expect(segmentErrors(rope)).toBeLessThan(0.08)
  })

  it('clamps a pin beyond reach and stays bounded', () => {
    const rope = createRope({ anchor, length, maxHeight: 180, bounds })
    for (let i = 0; i < 90; i++) step(rope, 1 / 60, { x: 5000, y: anchor.y })
    expect(endToEnd(rope)).toBeLessThanOrEqual(REACH * length + 1e-6)
    for (let i = 0; i < rope.x.length; i++) {
      expect(rope.y[i]).toBeGreaterThanOrEqual(bounds.minY)
      expect(rope.y[i]).toBeLessThanOrEqual(bounds.maxY)
    }
  })

  it('settles: velocity decays to ~0 once the pull is held', () => {
    const rope = createRope({ anchor, length, layout: 'straight', bounds })
    const end = { x: rope.x[59], y: rope.y[59] }
    for (let i = 0; i < 600; i++) step(rope, 1 / 60, end)
    expect(maxSpeed(rope)).toBeLessThan(0.05)
  })
})
