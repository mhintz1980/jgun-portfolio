import { expect, it } from 'vitest'
import { GROUP, InkBuilder, PEN_COLOR, penColorOf } from '../drawing/sheet/ink'
import { applyPrivateSheetContent, PRIVATE_TITLE_TEXT, RED_STRIKE_PEN_HALF_WIDTH } from './privateSheetContent'

it('isolates private content from the shared builder and uses exact red strike width at the bottom', () => {
  const source = new InkBuilder()
  source.text({ text: 'Digital Systems Architect', x: .2, y: -.19, size: .004, group: 1, key: 0 })
  source.text({ text: 'PROJECT: TORQUE GUN', x: .2, y: -.2, size: .004, group: 1, key: 0 })
  source.text({ text: 'R', x: .04, y: .084, size: .0038, group: GROUP.noteOutput, key: .3, weight: 'handwriting' })
  source.line(0, 0, .1, .1, .0005, GROUP.noteOutput, .1)
  const frozen = JSON.stringify(source), corrected = applyPrivateSheetContent(source)
  expect(JSON.stringify(source)).toBe(frozen)
  expect(corrected.texts.some(t => t.text === PRIVATE_TITLE_TEXT)).toBe(true)
  expect(corrected.texts.some(t => t.text.includes('TORQUE WRENCH'))).toBe(true)
  const red = []
  for (let i = 0; i < corrected.segs.length; i += 9) {
    if (corrected.segs[i + 5] === GROUP.noteOutput && penColorOf(corrected.segs[i + 8]) === PEN_COLOR.red) {
      red.push(corrected.segs.slice(i, i + 9))
    }
  }
  expect(red.length).toBeGreaterThan(0)
  expect(red.every(s => s[4] === RED_STRIKE_PEN_HALF_WIDTH)).toBe(true)
  expect(applyPrivateSheetContent(source)).toEqual(corrected)
  // RUN FEA. is the same handwriting-font route as the notes above, red, lower, and underlined by hand.
  const runFea = corrected.texts.filter(t => t.group === GROUP.noteOutput && t.color === 'red')
  expect(runFea.map(t => t.text).join('')).toBe('RUNFEA')
  expect(runFea.every(t => t.weight === 'handwriting' && t.anchorY === 'baseline')).toBe(true)
  const upper = corrected.texts.filter(t => t.group === GROUP.noteOutput && t.color === 'graphite' && t.text === 'O')
  expect(upper.length).toBeGreaterThan(0)
  const third = corrected.texts.filter(t => t.group === GROUP.noteOutput && t.color === 'graphite' && t.y > Math.max(...runFea.map(r => r.y)))
  const gapAbove = Math.min(...third.map(t => t.y)) - Math.max(...runFea.map(r => r.y))
  expect(gapAbove).toBeGreaterThan(.0068 - .0016) // spaced lower than the regular row pitch
  const baseline = Math.min(...runFea.map(r => r.y))
  const underline = red.filter(s => Math.max(s[1], s[3]) < baseline)
  expect(underline.length).toBeGreaterThan(4)
  const xs = runFea.map(r => r.x), ux = underline.flatMap(s => [s[0], s[2]])
  expect(Math.min(...ux)).toBeLessThanOrEqual(Math.min(...xs))
  expect(Math.max(...ux)).toBeGreaterThan(Math.max(...xs))
})
