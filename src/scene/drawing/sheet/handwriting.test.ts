import { describe, expect, it } from 'vitest'
import { GLYPHS, handCircle, handLine, handwrite, strokeLength, supportedText, type Pt, type ReferenceGlyph } from './handwriting'
import { REFERENCE_GLYPHS } from './referenceHandGlyphs'

const NOTES = [
  'Failure point. Alternate materials??', '4140', '4340', 'C300',
  'change manufacturing method...\nROTARY HOBB IN LATHE!',
  'Run FEA. Material?\nTry C300 - Heat treat\nto 52 to 54 HRC.',
]
const options = { x: 0.03, y: 0.07, capHeight: 0.0038, seed: 51, rotation: 0.006 }
const bounds = (points: Pt[]) => ({ x0: Math.min(...points.map(p => p[0])), x1: Math.max(...points.map(p => p[0])),
  y0: Math.min(...points.map(p => p[1])), y1: Math.max(...points.map(p => p[1])) })

// Signed turning of a clean, sampled path; straight segments have zero cross product.
const turns = (pts: Pt[]) => pts.slice(2).map((p, i) => {
  const a = pts[i], b = pts[i + 1]
  return (b[0] - a[0]) * (p[1] - b[1]) - (b[1] - a[1]) * (p[0] - b[0])
}).filter(v => Math.abs(v) > 1e-15)

describe('reference hand lettering (O2)', () => {
  it('covers the owner notes, writes capitals and rejects unsupported letters', () => {
    for (const note of NOTES) expect(supportedText(note)).toBe(true)
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(REFERENCE_GLYPHS[ch]).toBeDefined()
    expect(supportedText('naive é')).toBe(false)
    expect(() => handwrite('é', options)).toThrow('unsupported character')
    expect(handwrite('abc', options)).toStrictEqual(handwrite('ABC', options))
    expect(handwrite('Failure point.', options).glyphs.map(g => g.ch).join('')).toBe('FAILUREPOINT.')
  })

  it('is deterministic, finite and scales every contour, baseline and bound with cap height', () => {
    for (const note of NOTES) {
      const a = handwrite(note, options), b = handwrite(note, options)
      expect(b).toStrictEqual(a)
      const big = handwrite(note, { ...options, capHeight: options.capHeight * 2 })
      for (const k of ['x0', 'x1'] as const) expect(big.bounds[k] - options.x).toBeCloseTo((a.bounds[k] - options.x) * 2, 12)
      for (const k of ['y0', 'y1'] as const) expect(big.bounds[k] - options.y).toBeCloseTo((a.bounds[k] - options.y) * 2, 12)
      for (const stroke of a.strokes) {
        const pts = stroke.letter?.contours.flat() ?? stroke.points
        expect(pts.length).toBeGreaterThan(1)
        expect(pts.flat().every(Number.isFinite)).toBe(true)
      }
      expect(strokeLength(a.strokes)).toBeGreaterThan(0)
    }
    expect(handwrite(NOTES[0], options)).not.toStrictEqual(handwrite(NOTES[0], { ...options, seed: 52 }))
    expect(handwrite(' \n ', options)).toEqual({ strokes: [], glyphs: [], lines: [], bounds: { x0: 0, x1: 0, y0: 0, y1: 0 } })
  })

  it('emits ONE font record per reference letter with unchanged anatomy and matching render transforms', () => {
    const r = handwrite('ABCDEFGHIJKLMNOPQRSTUVWXYZ', options)
    expect(r.strokes).toHaveLength(26)
    for (const [i, stroke] of r.strokes.entries()) {
      expect(stroke.points).toEqual([]) // contours must never accidentally enter ink.path
      const letter = stroke.letter!
      expect(letter.ch).toBe(r.glyphs[i].ch)
      const reference: ReferenceGlyph = REFERENCE_GLYPHS[letter.ch]
      expect(letter.contours.map(c => c.length)).toEqual(reference.contours.map(c => c.length))
      for (const [j, contour] of reference.contours.entries()) for (const [k, [x, y]] of contour.entries()) {
        // TTF has cap700/em1000; reference has cap7.5. This is the same scale/rotation as SheetText.
        const sx = letter.capHeight / 7.5 * letter.scaleX, sy = letter.capHeight / 7.5
        const c = Math.cos(letter.rotation), s = Math.sin(letter.rotation)
        expect(letter.contours[j][k][0]).toBeCloseTo(letter.x + x * sx * c - y * sy * s, 12)
        expect(letter.contours[j][k][1]).toBeCloseTo(letter.y + x * sx * s + y * sy * c, 12)
      }
      const b = bounds(letter.contours.flat())
      for (const k of ['x0', 'x1', 'y0', 'y1'] as const) expect(r.glyphs[i][k]).toBeCloseTo(b[k], 12)
      expect(letter.triangles?.length ?? 0).toBe(reference.triangles?.length ?? 0)
    }
  })

  it('enforces visible gaps on actual rotated ink, including fallback pen width and late-line pairs', () => {
    for (let seed = 0; seed < 80; seed++) for (const rotation of [-0.18, 0.006, 0.18]) {
      const r = handwrite('MWI.!!? 4140 C300 ALTERNATE MATERIALS\nROTARY HOBB IN LATHE!', { ...options, seed, rotation, tracking: -2, slant: 0.08 })
      for (let i = 1; i < r.glyphs.length; i++) {
        const a = r.glyphs[i - 1], b = r.glyphs[i]
        if (a.row !== b.row) continue
        const required = Math.max(options.capHeight * 0.075, 0.12 * Math.max(a.x1 - a.x0, b.x1 - b.x0))
        expect(b.x0 - a.x1).toBeGreaterThanOrEqual(required - 1e-12)
      }
      for (const g of r.glyphs) {
        expect(g.size).toBeGreaterThanOrEqual(0.94); expect(g.size).toBeLessThanOrEqual(1.06)
        expect(g.width).toBeGreaterThanOrEqual(0.94); expect(g.width).toBeLessThanOrEqual(1.06)
        expect(g.pressure).toBe(1)
      }
    }
  })

  it('keeps line bounds equal to their placed ink and uses descending deterministic baselines', () => {
    const r = handwrite(NOTES.at(-1)!, options)
    expect(r.lines).toHaveLength(3)
    expect(r.lines[0].baseline).toBeGreaterThan(r.lines[1].baseline)
    expect(r.lines[1].baseline).toBeGreaterThan(r.lines[2].baseline)
    for (const [row, line] of r.lines.entries()) {
      const glyphs = r.glyphs.filter(g => g.row === row)
      expect(line.x0).toBe(Math.min(...glyphs.map(g => g.x0)))
      expect(line.x1).toBe(Math.max(...glyphs.map(g => g.x1)))
      expect(line.y0).toBe(Math.min(...glyphs.map(g => g.y0)))
      expect(line.y1).toBe(Math.max(...glyphs.map(g => g.y1)))
    }
  })

  it('times font letters by cap height and black width, independent of contour point count/perimeter', () => {
    const r = handwrite('ALTERNATE MATERIALS', options)
    const changed = r.strokes.map(s => ({ ...s, letter: s.letter ? { ...s.letter,
      contours: s.letter.contours.map(c => c.concat(c, c)),
    } : undefined }))
    expect(strokeLength(changed)).toBe(strokeLength(r.strokes))
  })

  it('includes the actual fallback pen half-width when a whole line is fitted at a smaller cap size', () => {
    const fallback = Object.keys(GLYPHS).find(ch => ch !== ' ' && ch === ch.toUpperCase() && !REFERENCE_GLYPHS[ch])!
    const penHalfWidth = 0.00024
    const r = handwrite(`A${fallback}T`, { ...options, capHeight: 0.003344, penHalfWidth })
    const points = r.strokes.filter(s => !s.letter).flatMap(s => s.points)
    const black = bounds(points), g = r.glyphs[1]
    expect(g.x0).toBeCloseTo(black.x0 - penHalfWidth, 12)
    expect(g.x1).toBeCloseTo(black.x1 + penHalfWidth, 12)
    for (let i = 1; i < r.glyphs.length; i++) {
      const a = r.glyphs[i - 1], b = r.glyphs[i]
      expect(b.x0 - a.x1).toBeGreaterThanOrEqual(Math.max(0.075 * 0.003344,
        0.12 * Math.max(a.x1 - a.x0, b.x1 - b.x0)) - 1e-12)
    }
  })

  it('uses uniform fallback ink, no resampling tremor, no retraces and no overshoot points', () => {
    const text = Object.keys(GLYPHS).filter(ch => ch !== ' ' && ch === ch.toUpperCase() && !REFERENCE_GLYPHS[ch]).join('')
    expect(text.length).toBeGreaterThan(0)
    for (let seed = 1; seed <= 25; seed++) {
      const r = handwrite(text, { ...options, seed })
      const expected = [...text].flatMap(ch => GLYPHS[ch].strokes)
      expect(r.strokes).toHaveLength(expected.length)
      expect(r.strokes.map(s => s.points.length)).toEqual(expected.map(s => s.length))
      expect(r.strokes.every(s => s.pressure === 1 && !s.letter && !s.red)).toBe(true)
      // Each path is ONLY the affine image of its authored single pen pass.
      const source = GLYPHS[text[0]].strokes[0], actual = r.strokes[0].points
      const g = r.glyphs[0], angle = options.rotation - Math.atan(g.shear)
      const sx = options.capHeight / 7.5 * g.width, sy = options.capHeight / 7.5 * g.size
      for (let i = 1; i < source.length; i++) {
        const dx = source[i][0] - source[0][0], dy = source[i][1] - source[0][1]
        expect(actual[i][0] - actual[0][0]).toBeCloseTo(dx * sx * Math.cos(angle) - dy * sy * Math.sin(angle), 12)
        expect(actual[i][1] - actual[0][1]).toBeCloseTo(dx * sx * Math.sin(angle) + dy * sy * Math.cos(angle), 12)
      }
    }
    expect(handwrite('AX?', { ...options, red: true }).strokes.every(s => s.red)).toBe(true)
  })

  it('draws a single-curvature bow with exact endpoints, and a smooth ellipse without waves', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const line = handLine([0, 0], [0.05, 0.002], seed)
      expect(line[0]).toEqual([0, 0]); expect(line.at(-1)).toEqual([0.05, 0.002])
      const signs = new Set(turns(line).map(Math.sign))
      expect(signs.size).toBeLessThanOrEqual(1)
      const offsets = line.map(p => Math.abs(p[1] - (p[0] / 0.05) * 0.002))
      expect(Math.max(...offsets)).toBeLessThanOrEqual(0.000401)
      const circle = handCircle(0, 0, 0.01, 0.008, seed)
      expect(circle.length).toBeGreaterThan(50)
      expect(new Set(turns(circle).map(Math.sign)).size).toBe(1)
      expect(Math.max(...circle.map(p => Math.hypot(...p)))).toBeLessThan(0.01013)
    }
  })
})
