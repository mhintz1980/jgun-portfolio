import { describe, expect, it } from 'vitest'
import { GLYPHS, handCircle, handLine, handwrite, strokeLength, supportedText } from './handwriting'

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
const sd = (v: number[]) => Math.sqrt(mean(v.map(x => (x - mean(v)) ** 2)))

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

  it('writes every letter as a capital and has a capital for every letter the notes use', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(GLYPHS[ch]).toBeDefined()
    const r = handwrite('Failure point.\nAlternate materials??', { x: 0, y: 0, capHeight: 0.005, seed: 5 })
    expect(r.glyphs.map(g => g.ch).join('')).toBe('FAILUREPOINT.ALTERNATEMATERIALS??')
    expect(r.glyphs.every(g => g.ch === g.ch.toUpperCase())).toBe(true)
    // no x-height letters survive: every written letter reaches cap height (within the +-12 % size spread and lift)
    const caps = r.glyphs.filter(g => /[A-Z]/.test(g.ch) && g.ch !== 'J' && g.ch !== 'Q')
    for (const g of caps) expect((g.y1 - g.y0) / 0.005).toBeGreaterThan(0.72)
    expect(handwrite('abc', { x: 0, y: 0, capHeight: 0.005, seed: 5 }).strokes).toStrictEqual(handwrite('ABC', { x: 0, y: 0, capHeight: 0.005, seed: 5 }).strokes)
    expect(supportedText('ROTARY HOBB IN LATHE!')).toBe(true)
    expect(supportedText('Run FEA. Material? Try C300 - Heat treat to 52 to 54 HRC.')).toBe(true)
    expect(supportedText('naive \u00e9')).toBe(false)
  })

  it('is humanised: letters differ in size, lean, lift and width, within bounds a reader can predict', () => {
    const r = handwrite('change manufacturing method...\nROTARY HOBB IN LATHE!', { x: 0, y: 0, capHeight: 0.005, seed: 42 })
    const g = r.glyphs.filter(x => /[A-Z]/.test(x.ch))
    expect(g.length).toBeGreaterThan(30)
    expect(sd(g.map(x => x.size))).toBeGreaterThan(0.04)
    expect(sd(g.map(x => x.shear))).toBeGreaterThan(0.04)
    expect(sd(g.map(x => x.width))).toBeGreaterThan(0.03)
    expect(sd(g.map(x => x.lift))).toBeGreaterThan(0.1)
    expect(sd(g.map(x => (x.y1 - x.y0) / 0.005))).toBeGreaterThan(0.04)
    for (const x of g) {
      expect(x.size).toBeGreaterThan(0.72); expect(x.size).toBeLessThan(1.13)
      expect(x.width).toBeGreaterThan(0.8); expect(x.width).toBeLessThan(1.12)
      // base lean ~4 deg plus up to +-7 deg of its own (and a little extra when rushed): never backward by much, never past ~15 deg
      expect(x.shear).toBeGreaterThan(Math.tan(-3.5 * Math.PI / 180) - 0.04); expect(x.shear).toBeLessThan(Math.tan(15 * Math.PI / 180))
      expect(Math.abs(x.lift)).toBeLessThan(1.6)
    }
    // the mean lean stays forward at about 4 degrees
    expect(mean(g.map(x => x.shear))).toBeGreaterThan(0.03); expect(mean(g.map(x => x.shear))).toBeLessThan(0.12)
    // rushed letters toward the end of a line are shorter than the first letters
    const first = r.glyphs.filter(x => x.row === 1 && x.index < 6), last = r.glyphs.filter(x => x.row === 1 && x.index >= 15 && /[A-Z]/.test(x.ch))
    expect(mean(last.map(x => x.size))).toBeLessThan(mean(first.map(x => x.size)))
    // total drift of the baseline across the long line stays under a millimetre at 5 mm caps
    const bases = r.glyphs.filter(x => x.row === 0).map(x => x.y0)
    expect(Math.max(...bases) - Math.min(...bases)).toBeLessThan(0.0015)
  })

  it('varies pen pressure per stroke within +-35 % and tags colour only when asked', () => {
    const r = handwrite('ROTARY HOBB IN LATHE!', { x: 0, y: 0, capHeight: 0.004, seed: 9 })
    const p = r.strokes.map(s => s.pressure!)
    expect(p.every(v => Number.isFinite(v) && v >= 0.65 - 1e-9 && v <= 1.35 + 1e-9)).toBe(true)
    expect(sd(p)).toBeGreaterThan(0.08)
    expect(Math.max(...p) - Math.min(...p)).toBeGreaterThan(0.35)
    expect(r.strokes.some(s => s.red)).toBe(false)
    expect(handwrite('X', { x: 0, y: 0, capHeight: 0.004, red: true }).strokes.every(s => s.red === true)).toBe(true)
  })

  it('wobbles strokes slowly (low-frequency lean, not per-point noise) and sometimes retraces a stroke', () => {
    const r = handwrite('HELLO HILL TILT LIFT', { x: 0, y: 0, capHeight: 0.0075, seed: 3, rotation: 0, slant: 0 })
    // a vertical stem: sideways deviation from its own chord is smooth (second differences small) yet non-zero
    const stems = r.strokes.filter(s => s.points.length > 8 && Math.abs(s.points[0][0] - s.points.at(-1)![0]) < 0.0012 && Math.abs(s.points[0][1] - s.points.at(-1)![1]) > 0.004)
    expect(stems.length).toBeGreaterThan(3)
    for (const s of stems.slice(0, 6)) {
      const xs = s.points.map(q => q[0])
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.00004)
      const jerk = xs.slice(2).map((x, i) => Math.abs(x - 2 * xs[i + 1] + xs[i]))
      expect(Math.max(...jerk)).toBeLessThan(0.0004)
    }
    // a double-struck correction shows up as an extra stroke beyond the glyph table's own count
    const text = 'LITTLE HILL TILL'
    const nominal = [...text].reduce((n, ch) => n + (GLYPHS[ch]?.strokes.length ?? 0), 0)
    const extra = Array.from({ length: 40 }, (_, i) => handwrite(text, { x: 0, y: 0, capHeight: 0.005, seed: i + 1 }).strokes.length - nominal)
    expect(Math.min(...extra)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...extra)).toBeGreaterThan(0)
    expect(mean(extra)).toBeLessThan(nominal * 0.2) // occasional, not constant
  })

  it('is bit-identical for a given seed and different for another (no Math.random)', () => {
    const o = { x: 0.03, y: 0.07, capHeight: 0.0038, seed: 51, rotation: 0.006 }
    const t = 'Run FEA. Material?\nTry C300 - Heat treat\nto 52 to 54 HRC.'
    expect(JSON.stringify(handwrite(t, o))).toBe(JSON.stringify(handwrite(t, o)))
    expect(JSON.stringify(handwrite(t, { ...o, seed: 52 }))).not.toBe(JSON.stringify(handwrite(t, o)))
  })

  it('helpers return bounded pen paths', () => {
    const c = handCircle(0, 0, 0.01, 0.008)
    expect(c.length).toBeGreaterThan(40)
    expect(Math.max(...c.map(p => Math.hypot(p[0], p[1])))).toBeLessThan(0.0135)
    const l = handLine([0, 0], [0.05, 0.002])
    expect(l[0][0]).toBeCloseTo(0, 3)
    // wobble is a slow bow, not a zig-zag: sideways error from the chord stays under 1.5 amp and is smooth
    const off = l.map(p => Math.abs(p[1] - (p[0] / 0.05) * 0.002))
    expect(Math.max(...off)).toBeGreaterThan(0.00005); expect(Math.max(...off)).toBeLessThan(0.0004 * 1.6)
    expect(Math.hypot(l.at(-1)![0] - 0.05, l.at(-1)![1] - 0.002)).toBeLessThan(0.0005)
  })
})
