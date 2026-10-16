import { SHEET_ZONES } from '../drawing/drawingGeometry'
import { fitTitleText } from '../drawing/sheet/composeSheet'
import { GROUP, InkBuilder, PEN_COLOR, withPenColor } from '../drawing/sheet/ink'
import { GLYPHS, handwrite, strokeLength } from '../drawing/sheet/handwriting'

export const PRIVATE_TITLE_TEXT = 'MECHANICAL DESIGNER / SYSTEMS ARCHITECT'
export const RED_STRIKE_PEN_HALF_WIDTH = .00026
export const PRIVATE_OUTPUT_LINES = ['Material?', 'Try C300 - Heat treat', 'to 52 to 54 HRC.', 'RUN FEA.'] as const
const CAP = .0038, PITCH = .0068, X = .034, TOP = .088

/** Private copy after precompute installation; shared cached arrays remain immutable. */
export function applyPrivateSheetContent(source: InkBuilder): InkBuilder {
  const out = new InkBuilder()
  for (let i = 0; i < source.segs.length; i += 9) {
    if (source.segs[i + 5] === GROUP.noteOutput && source.segs[i + 6] >= .26) continue
    for (let j = 0; j < 9; j++) out.segs.push(source.segs[i + j])
  }
  for (const n of source.fills) out.fills.push(n)
  for (const original of source.texts) {
    if (original.group === GROUP.noteOutput && original.weight === 'handwriting') continue
    const item = { ...original, ...(original.fitCell ? { fitCell: { ...original.fitCell } } : {}) }
    if (/^(digital )?systems architect$/i.test(item.text.trim()) || item.text === PRIVATE_TITLE_TEXT) {
      item.text = PRIVATE_TITLE_TEXT
      const tb = SHEET_ZONES.titleBlock, split = tb.x + tb.w * .46
      fitTitleText(item, item.fitCell ?? { x: split, y: tb.y + tb.h - .0275, w: tb.x + tb.w - split, h: .008 })
    }
    if (/torque\s+gun/i.test(item.text)) {
      const before = item.text.length
      item.text = item.text.replace(/torque\s+gun/gi, match => match === match.toUpperCase() ? 'TORQUE WRENCH' : 'Torque Wrench')
      if (item.fitCell) fitTitleText(item, item.fitCell)
      else item.size *= before / item.text.length
    }
    out.texts.push(item)
  }
  for (let row = 0; row < 3; row++) {
    const written = handwrite(PRIVATE_OUTPUT_LINES[row], { x: X, y: TOP - CAP - row * PITCH,
      capHeight: CAP, penHalfWidth: .00024, seed: 51 + row, rotation: .006 })
    const total = strokeLength(written.strokes) || 1
    let walked = 0
    for (const stroke of written.strokes) {
      const length = strokeLength([stroke]), key = .26 + row * .17 + walked / total * .17
      const dur = Math.max(1e-4, length / total * .17)
      if (stroke.letter) {
        const letter = stroke.letter
        out.text({ text: letter.ch, x: letter.x, y: letter.y, size: letter.capHeight,
          group: GROUP.noteOutput, key, dur, weight: 'handwriting', color: 'graphite',
          scaleX: letter.scaleX, rotation: letter.rotation, anchorX: 'left', anchorY: 'baseline', letterSpacing: 0 })
      } else out.path(stroke.points, .00024, GROUP.noteOutput, key, dur, withPenColor(0, PEN_COLOR.graphite))
      walked += length
    }
  }
  // Stroke lettering uses the exact colour channel and uniform half-width of
  // the alloy strikeouts; font weight alone cannot establish this equality.
  const unit = CAP / 7.5, baseline = TOP - CAP - 3 * PITCH
  let penX = X
  const paths: number[][][] = []
  for (const ch of PRIVATE_OUTPUT_LINES[3]) {
    const glyph = GLYPHS[ch]
    if (!glyph) throw new Error('Missing private annotation glyph: ' + ch)
    for (const stroke of glyph.strokes) paths.push(stroke.map(([x, y]) => [penX + x * unit, baseline + y * unit]))
    penX += (glyph.w + 1.25) * unit
  }
  const length = (p: number[][]) => p.slice(1).reduce((sum, v, i) => sum + Math.hypot(v[0] - p[i][0], v[1] - p[i][1]), 0)
  const total = paths.reduce((sum, p) => sum + length(p), 0) || 1
  let walked = 0
  for (const path of paths) {
    const d = length(path)
    out.path(path, RED_STRIKE_PEN_HALF_WIDTH, GROUP.noteOutput, .8 + .2 * walked / total,
      Math.max(1e-4, .2 * d / total), withPenColor(0, PEN_COLOR.red))
    walked += d
  }
  return out
}
