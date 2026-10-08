import { describe, expect, it } from 'vitest'
import { GLYPHS, handCircle, handLine, handwrite, strokeLength, supportedText } from './handwriting'

const NOTES = [
  'Failure point. Alternate materials??',
  '4140', '4340', 'C300',
  'change manufacturing method...\nROTARY HOBB IN LATHE!',
  'Run FEA. Material?\nTry C300 - Heat treat\nto 52 to 54 HRC.',
]

describe('hand lettering (O2)', () => {
  it('covers every character of the owner notes', () => {
    for (const note of NOTES) expect(supportedText(note)).toBe(true)
    for (const ch of 'abcdefghijklmnopqrstuvwxyz') expect(GLYPHS[ch]).toBeDefined()
    expect(() => handwrite('é', { x: 0, y: 0, capHeight: 0.005 })).toThrow()
  })

  it('is deterministic and finite, and scales with cap height', () => {
    for (const note of NOTES) {
      const a = handwrite(note, { x: 0.1, y: 0.05, capHeight: 0.005, seed: 11 }), b = handwrite(note, { x: 0.1, y: 0.05, capHeight: 0.005, seed: 11 })
      expect(b).toStrictEqual(a)
      for (const s of a.strokes) for (const p of s.points) { expect(Number.isFinite(p[0])).toBe(true); expect(Number.isFinite(p[1])).toBe(true) }
      const big = handwrite(note, { x: 0.1, y: 0.05, capHeight: 0.01, seed: 11 })
      expect((big.bounds.x1 - big.bounds.x0) / (a.bounds.x1 - a.bounds.x0)).toBeCloseTo(2, 1)
    }
    const other = handwrite(NOTES[0], { x: 0.1, y: 0.05, capHeight: 0.005, seed: 12 })
    expect(other).not.toStrictEqual(handwrite(NOTES[0], { x: 0.1, y: 0.05, capHeight: 0.005, seed: 11 }))
  })

  it('keeps lines on their baselines within bounds a reader can predict', () => {
    const r = handwrite('Run FEA. Material?\nTry C300 - Heat treat\nto 52 to 54 HRC.', { x: 0, y: 0, capHeight: 0.005, seed: 3 })
    expect(r.lines).toHaveLength(3)
    expect(r.lines[0].baseline).toBeGreaterThan(r.lines[1].baseline)
    expect(r.lines[1].baseline).toBeGreaterThan(r.lines[2].baseline)
    for (const line of r.lines) {
      const h = line.y1 - line.y0
      expect(h).toBeGreaterThan(0.004); expect(h).toBeLessThan(0.0105)
    }
    expect(strokeLength(r.strokes)).toBeGreaterThan(0.2)
  })

  it('helpers return bounded pen paths', () => {
    const c = handCircle(0, 0, 0.01, 0.008)
    expect(c.length).toBeGreaterThan(40)
    expect(Math.max(...c.map(p => Math.hypot(p[0], p[1])))).toBeLessThan(0.0135)
    const l = handLine([0, 0], [0.05, 0.002])
    expect(l[0][0]).toBeCloseTo(0, 3)
    expect(Math.hypot(l.at(-1)![0] - 0.05, l.at(-1)![1] - 0.002)).toBeLessThan(0.0005)
  })
})
