import { describe, expect, it } from 'vitest'
import {
  PAPER_GRAIN_MIX,
  PAPER_GRAIN_SEED,
  PAPER_GRAIN_SIZE,
  fillPaperGrain,
} from './drawingGeometry'

/** JG-032 — paper grain: deterministic, unbiased, intro-only overlay. */
describe('JG-032 procedural paper grain', () => {
  it('is deterministic for a fixed seed (intro frames reproducible)', () => {
    const a = new Uint8ClampedArray(PAPER_GRAIN_SIZE * PAPER_GRAIN_SIZE * 4)
    const b = new Uint8ClampedArray(PAPER_GRAIN_SIZE * PAPER_GRAIN_SIZE * 4)
    fillPaperGrain(a, PAPER_GRAIN_SIZE)
    fillPaperGrain(b, PAPER_GRAIN_SIZE)
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true)
  })

  it('changes with the seed', () => {
    const a = new Uint8ClampedArray(PAPER_GRAIN_SIZE * PAPER_GRAIN_SIZE * 4)
    const b = new Uint8ClampedArray(PAPER_GRAIN_SIZE * PAPER_GRAIN_SIZE * 4)
    fillPaperGrain(a, PAPER_GRAIN_SIZE, PAPER_GRAIN_SEED)
    fillPaperGrain(b, PAPER_GRAIN_SIZE, PAPER_GRAIN_SEED + 1)
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false)
  })

  it('is unbiased (mean near mid-grey) and fully opaque', () => {
    const a = new Uint8ClampedArray(PAPER_GRAIN_SIZE * PAPER_GRAIN_SIZE * 4)
    fillPaperGrain(a, PAPER_GRAIN_SIZE)
    let sum = 0
    for (let i = 0; i < a.length; i += 4) {
      sum += a[i]
      expect(a[i + 3]).toBe(255)
    }
    const mean = sum / (a.length / 4)
    expect(mean).toBeGreaterThan(107)
    expect(mean).toBeLessThan(147)
  })

  it('guards the owner-approved 0.06 mix against drift', () => {
    expect(PAPER_GRAIN_MIX).toBeCloseTo(0.06, 6)
    expect(PAPER_GRAIN_SIZE).toBe(256)
  })
})
