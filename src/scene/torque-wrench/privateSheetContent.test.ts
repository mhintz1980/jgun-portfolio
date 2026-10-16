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
  const lowestText = Math.min(...corrected.texts.filter(t => t.group === GROUP.noteOutput).map(t => t.y))
  expect(Math.max(...red.flatMap(s => [s[1], s[3]]))).toBeLessThan(lowestText)
  expect(applyPrivateSheetContent(source)).toEqual(corrected)
})
