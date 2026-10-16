import { SHEET_ZONES } from '../drawing/drawingGeometry'
import { fitTitleText } from '../drawing/sheet/composeSheet'
import { GROUP, InkBuilder, PEN_COLOR, withPenColor } from '../drawing/sheet/ink'
import { handLine, handwrite, strokeLength } from '../drawing/sheet/handwriting'
import { draftSheet } from './privateDrafting'

export const PRIVATE_TITLE_TEXT = 'MECHANICAL DESIGNER / SYSTEMS ARCHITECT'
export const RED_STRIKE_PEN_HALF_WIDTH = .00026
export const PRIVATE_OUTPUT_LINES = ['Material?', 'Try C300 - Heat treat', 'to 52 to 54 HRC.', 'RUN FEA.'] as const
const CAP = .0038, PITCH = .0068, X = .034, TOP = .088, UNDERLINE_GAP = .0014

/** Private copy after precompute installation; shared cached arrays remain immutable. */
export function applyPrivateSheetContent(source: InkBuilder): InkBuilder {
  const out = new InkBuilder()
  // Drafting corrections: escaped section hatching, pen hierarchy, detail callouts.
  const drafted = draftSheet(source)
  for (let i = 0; i < drafted.segs.length; i += 9) {
    if (drafted.segs[i + 5] === GROUP.noteOutput && drafted.segs[i + 6] >= .26) continue
    for (let j = 0; j < 9; j++) out.segs.push(drafted.segs[i + j])
  }
  drafted.appendCallouts(out)
  for (const n of source.fills) out.fills.push(n)
  for (const original of source.texts) {
    if (original.group === GROUP.noteOutput && original.weight === 'handwriting') continue
    const item = { ...original, ...(original.fitCell ? { fitCell: { ...original.fitCell } } : {}) }
    drafted.adjustText(item)
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
  // Every output line, RUN FEA. included, is real handwriting-font text. The last line is red and sits
  // a little lower, with a hand-drawn red underline in the same pen as the alloy strikeouts.
  const RUN_FEA_DROP = .0026
  for (let row = 0; row < PRIVATE_OUTPUT_LINES.length; row++) {
    const red = row === 3
    const baseline = TOP - CAP - row * PITCH - (red ? RUN_FEA_DROP : 0)
    const written = handwrite(PRIVATE_OUTPUT_LINES[row], { x: X, y: baseline,
      capHeight: CAP, penHalfWidth: .00024, seed: 51 + row, rotation: .006, ...(red ? { red: true } : {}) })
    const span = red ? .13 : .17, start = red ? .8 : .26 + row * .17
    const total = strokeLength(written.strokes) || 1
    let walked = 0
    for (const stroke of written.strokes) {
      const length = strokeLength([stroke]), key = start + walked / total * span
      const dur = Math.max(1e-4, length / total * span)
      if (stroke.letter) {
        const letter = stroke.letter
        out.text({ text: letter.ch, x: letter.x, y: letter.y, size: letter.capHeight,
          group: GROUP.noteOutput, key, dur, weight: 'handwriting', color: red ? 'red' : 'graphite',
          scaleX: letter.scaleX, rotation: letter.rotation, anchorX: 'left', anchorY: 'baseline', letterSpacing: 0 })
      } else out.path(stroke.points, red ? RED_STRIKE_PEN_HALF_WIDTH : .00024, GROUP.noteOutput, key, dur,
        withPenColor(0, red ? PEN_COLOR.red : PEN_COLOR.graphite))
      walked += length
    }
    if (red) {
      const { x0, x1, baseline: line } = written.lines[0]
      const y = line - UNDERLINE_GAP
      // A single quick stroke drawn left to right, rising slightly like a hand underline.
      out.path(handLine([x0 - .0006, y + .0003], [x1 + .0012, y - .0002], 57, .0004),
        RED_STRIKE_PEN_HALF_WIDTH, GROUP.noteOutput, start + span, .06, withPenColor(0, PEN_COLOR.red))
    }
  }
  return out
}
