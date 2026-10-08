import { beforeAll, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { Box3, Color, LinearSRGBColorSpace, Vector3, type Mesh, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SHEET_ZONES, makeDrawingLayout, snapshotDrawing, type DrawingGeometry, type DrawingLayout } from '../drawingGeometry'
import { loadRingSource } from '../../inspection/testing/loadRig'
import { NodeDracoLoader } from '../../inspection/testing/nodeDraco'
import { GROUP, INK_GRAPHITE, InkBuilder, PEN_COLOR, penColorOf, type InkText } from './ink'
import { REFERENCE_GLYPHS } from './referenceHandGlyphs'
import type { ReferenceGlyph } from './handwriting'
import { GLYPHS } from './handwriting'
import { INK } from '../drawingGeometry'
import { makeSheetText, SHEET_FONTS } from './sheetText'
import type { Text } from 'troika-three-text'
import {
  OWNER_CAREER, OWNER_EXTRA_FIELDS, OWNER_NOTES, OWNER_NOTE_TEXT, OWNER_TITLE, SUN_GEAR, composeOwnerAnnotations, sunGearModelPoint,
} from './ownerAnnotations'

// Exercise our batching adapter without a DOM/web-worker/GPU. Font anatomy is checked
// against extracted contours in handwriting.test.ts; this checks the public Troika contract.
vi.mock('troika-three-text', async () => {
  const { Mesh } = await import('three')
  class MockText extends Mesh {
    textRenderInfo = { blockBounds: [0, -0.001, 0.003, 0.004], visibleBounds: [0.0002, 0, 0.0028, 0.0038] }
    sync(done?: () => void) { done?.() }
    dispose() {}
  }
  return { Text: MockText, BatchedText: MockText }
})

let data: DrawingGeometry, layout: DrawingLayout
beforeAll(async () => {
  const { rig } = await loadRingSource()
  data = snapshotDrawing(rig)
  layout = makeDrawingLayout(16 / 9, data.bounds)
}, 120000)

const DETAIL_B = { at: [0.322, 0.03] as [number, number], radius: 0.05 }
function compose() {
  const ink = new InkBuilder()
  const section = layout.views.find(v => v.name === 'section')!
  const marks = composeOwnerAnnotations({ ink, detailB: DETAIL_B, section: { transform: section.transform, scale: section.scale }, data, layout })
  return { ink, marks, section }
}
const segsOf = (ink: InkBuilder, group: number) => {
  const out: { x1: number; y1: number; x2: number; y2: number; key: number; dur: number; dash: number }[] = []
  for (let i = 0; i < ink.segs.length; i += 9) if (ink.segs[i + 5] === group) out.push({ x1: ink.segs[i], y1: ink.segs[i + 1], x2: ink.segs[i + 2], y2: ink.segs[i + 3], key: ink.segs[i + 6], dur: ink.segs[i + 7], dash: ink.segs[i + 8] })
  return out
}
const colourOf = (s: { dash: number }) => penColorOf(s.dash)
const fontCopy = (text: string) => [...text.toUpperCase()].filter(ch => REFERENCE_GLYPHS[ch]).join('')
const boundsOf = (segs: ReturnType<typeof segsOf>) => ({ x0: Math.min(...segs.flatMap(s => [s.x1, s.x2])), x1: Math.max(...segs.flatMap(s => [s.x1, s.x2])), y0: Math.min(...segs.flatMap(s => [s.y1, s.y2])), y1: Math.max(...segs.flatMap(s => [s.y1, s.y2])) })

// Include the actual letter outlines; segment-only bounds would silently ignore the new font.
function letterPoints(item: InkText) {
  const sx = item.size / 7.5 * item.scaleX!, sy = item.size / 7.5
  const c = Math.cos(item.rotation!), s = Math.sin(item.rotation!)
  return REFERENCE_GLYPHS[item.text].contours.flat().map(([x, y]) => [item.x + x * sx * c - y * sy * s, item.y + x * sx * s + y * sy * c])
}
function writingBounds(ink: InkBuilder, group: number, key: number) {
  const paths = segsOf(ink, group).filter(s => s.key >= key).flatMap(s => [[s.x1, s.y1], [s.x2, s.y2]])
  const points = paths.concat(ink.texts.filter(t => t.group === group && t.key >= key).flatMap(letterPoints))
  return { x0: Math.min(...points.map(p => p[0])), x1: Math.max(...points.map(p => p[0])),
    y0: Math.min(...points.map(p => p[1])), y1: Math.max(...points.map(p => p[1])) }
}

describe('measured sun-gear anchor (P001835) — the constants are the CAD, not a guess', () => {
  it('matches the toothed land measured straight from the raw Default.glb', async () => {
    const buf = readFileSync('public/models/Default.glb')
    const gltf = await new GLTFLoader().setDRACOLoader(new NodeDracoLoader() as never).parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
    gltf.scene.updateMatrixWorld(true)
    let node: Object3D | undefined
    gltf.scene.traverse(o => { if (o.name === 'P001835-2') node = o })
    expect(node).toBeDefined()
    const pts: Vector3[] = []
    node!.traverse(o => { const m = o as Mesh; if (!m.isMesh) return; const p = m.geometry.getAttribute('position'); for (let i = 0; i < p.count; i++) pts.push(new Vector3().fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)) })
    const box = new Box3().setFromPoints(pts)
    // Toothed sun: the axial run whose max radius equals the tip radius (6.0835 mm) and that sits beyond the 5.39 mm relief groove.
    const tip = SUN_GEAR.tipRadiusMm * 1e-3
    // z > -79 mm excludes the plain r 6.08 land below the 5.39 mm relief groove (groove spans ~ -79.7..-78.7 mm).
    const zs = pts.filter(p => Math.abs(Math.hypot(p.x, p.y) - tip) < 2e-5 && p.z > -0.0792).map(p => p.z)
    expect(zs.length).toBeGreaterThan(150)
    const zMin = Math.min(...zs) * 1000, zMax = Math.max(...zs) * 1000
    expect(zMin).toBeCloseTo(SUN_GEAR.rawZMm[0], 1)
    expect(zMax).toBeCloseTo(SUN_GEAR.rawZMm[1], 1)
    expect(box.max.z * 1000).toBeCloseTo(-69.2, 1)
  }, 120000)

  it('maps to the rig-recentred frame through the recorded rig centre and lands inside the clutch unit', () => {
    const p = sunGearModelPoint(data)
    expect(p.z).toBeCloseTo(-0.07565 - data.rigCenter.z, 9)
    const clutch = data.units.clutch
    expect(p.z).toBeGreaterThan(clutch.min.z); expect(p.z).toBeLessThan(clutch.max.z)
  })
})

describe('owner handwriting (O2): content, anchors, order, colour', () => {
  it('carries the owner words exactly and nothing else', () => {
    expect(OWNER_NOTES.input.lead.join(' ')).toBe('Failure point. Alternate materials??')
    expect([...OWNER_NOTES.input.alloys]).toEqual(['4140', '4340', 'C300'])
    expect(OWNER_NOTES.input.decision.join(' ')).toBe('change manufacturing method... ROTARY HOBB IN LATHE!')
    expect(OWNER_NOTES.output.join(' ')).toBe('Run FEA. Material? Try C300 - Heat treat to 52 to 54 HRC.')
    expect(OWNER_NOTE_TEXT.output).toBe('Run FEA. Material? Try C300 - Heat treat to 52 to 54 HRC.')
    expect(JSON.stringify(OWNER_NOTES)).not.toMatch(/4140.*4340.*C300.*(17-4|Ti|Inconel)/)
  })

  it('writes font capitals in order, retaining red marks, fallback graphite and the final circle', () => {
    const { ink } = compose()
    const input = segsOf(ink, GROUP.noteInput), output = segsOf(ink, GROUP.noteOutput)
    const letters = ink.texts.filter(t => t.group === GROUP.noteInput)
    const expected = fontCopy([...OWNER_NOTES.input.lead, ...OWNER_NOTES.input.alloys, ...OWNER_NOTES.input.decision].join(''))
    expect(letters.map(t => t.text).join('')).toBe(expected)
    expect(ink.texts.filter(t => t.group === GROUP.noteOutput).map(t => t.text).join(''))
      .toBe(fontCopy(OWNER_NOTES.output.join('')))
    expect(letters.every(t => t.weight === 'handwriting' && t.color === 'graphite' && t.anchorY === 'baseline')).toBe(true)
    expect(ink.texts.every(t => t.opacity === undefined || t.opacity === 1)).toBe(true)
    for (const group of [GROUP.noteInput, GROUP.noteOutput]) {
      const texts = ink.texts.filter(t => t.group === group)
      for (let i = 1; i < texts.length; i++) expect(texts[i].key).toBeGreaterThanOrEqual(texts[i - 1].key + texts[i - 1].dur! - 1e-12)
    }
    const mark = input.filter(s => s.key < 0.18), strikes = input.filter(s => s.key >= 0.54 && s.key < 0.68)
    const circle = input.filter(s => s.key >= 0.9)
    expect(mark.length).toBeGreaterThan(40); expect(strikes.length).toBeGreaterThan(30); expect(circle.length).toBeGreaterThan(40)
    expect(mark.every(s => colourOf(s) === PEN_COLOR.red)).toBe(true)
    expect(strikes.every(s => colourOf(s) === PEN_COLOR.red)).toBe(true)
    expect(circle.every(s => colourOf(s) === PEN_COLOR.graphite)).toBe(true)
    expect(input.filter(s => s.key >= 0.18 && s.key < 0.52).every(s => colourOf(s) === PEN_COLOR.graphite)).toBe(true)
    expect(output.every(s => colourOf(s) === PEN_COLOR.graphite)).toBe(true)
    expect([...input, ...output].every(s => s.dash % 10 === 0 && Number.isFinite(s.x1 + s.y1 + s.x2 + s.y2)
      && s.key >= 0 && s.key + s.dur <= 1.0001)).toBe(true)
    expect(ink.texts.every(t => t.key >= 0 && t.key + t.dur! <= 1)).toBe(true)
    expect(letters.filter(t => t.key >= 0.18 && t.key < 0.4).map(t => t.text).join('')).toBe(fontCopy(OWNER_NOTES.input.lead.join('')))
    expect(letters.filter(t => t.key >= 0.4 && t.key < 0.52).map(t => t.text).join('')).toBe(fontCopy(OWNER_NOTES.input.alloys.join('')))
    expect(letters.filter(t => t.key >= 0.7 && t.key < 0.9).map(t => t.text).join('')).toBe(fontCopy(OWNER_NOTES.input.decision.join('')))
    // Only unavailable punctuation/digits remain paths; contours never become double-edge ink.
    const expectedFallback = [...OWNER_NOTES.input.lead, ...OWNER_NOTES.input.alloys, ...OWNER_NOTES.input.decision]
      .join('').toUpperCase().split('').filter(ch => ch !== ' ' && !REFERENCE_GLYPHS[ch]).join('')
    const fallback = input.filter(s => s.key >= 0.18 && s.key < 0.52 || s.key >= 0.7 && s.key < 0.9)
    expect(fallback.length).toBeGreaterThan(0)
    expect(fallback.length).toBe([...expectedFallback].reduce((n, ch) =>
      n + GLYPHS[ch].strokes.reduce((segments, path) => segments + path.length - 1, 0), 0))
  })

  it('is deterministic with uniform supplementary pen widths and full-opacity graphite font records', () => {
    const a = compose(), b = compose()
    expect(b.ink.segs).toStrictEqual(a.ink.segs)
    expect(b.ink.texts).toStrictEqual(a.ink.texts)
    expect(b.marks).toStrictEqual(a.marks)
    const widths: number[] = []
    for (let i = 0; i < a.ink.segs.length; i += 9) if (a.ink.segs[i + 5] === GROUP.noteOutput && a.ink.segs[i + 6] >= 0.26) widths.push(a.ink.segs[i + 4])
    expect(widths.length).toBeGreaterThan(0)
    expect(new Set(widths)).toEqual(new Set([0.00024]))
    expect(a.ink.texts.every(t => t.color === 'graphite' && t.weight === 'handwriting' && t.opacity === undefined)).toBe(true)
  })

  it('uses one text batch, baseline anchoring, correct linear graphite and bearing-compensated transforms', async () => {
    const { ink } = compose()
    const layer = makeSheetText(ink.texts)
    await layer.ready
    const members = layer.object.children as Text[]
    expect(members).toHaveLength(ink.texts.length)
    for (const [i, text] of members.entries()) {
      const item = ink.texts[i]
      expect(text.font).toBe(SHEET_FONTS.handwriting)
      expect(text.color).toBe(new Color(INK_GRAPHITE).getHex(LinearSRGBColorSpace))
      expect(text.color).not.toBe(new Color(INK).getHex(LinearSRGBColorSpace))
      expect(text.anchorY).toBe('top-baseline')
      const glyph: ReferenceGlyph = REFERENCE_GLYPHS[item.text]
      expect(text.fontSize).toBe(item.size * 1000 / glyph.fontHeight!)
      expect(text.rotation.z).toBe(item.rotation)
      expect(text.scale.x).toBe(item.scaleX)
      // Actual per-glyph black bounds must land at the supplied normalized black origin.
      const offsetX = glyph.fontMinX! * text.fontSize / 1000
      const offsetY = glyph.fontMinY! * text.fontSize / 1000
      text.updateMatrix()
      const blackOrigin = new Vector3(offsetX, offsetY, 0).applyMatrix4(text.matrix)
      expect(blackOrigin.x).toBeCloseTo(item.x, 12)
      expect(blackOrigin.y).toBeCloseTo(item.y, 12)
      expect(text.fillOpacity).toBe(0)
    }
    const reveal: number[] = []
    reveal[GROUP.noteInput] = 1; reveal[GROUP.noteOutput] = 1
    layer.update(reveal, 1)
    expect(members.every(t => t.fillOpacity === 1)).toBe(true)
    const item = ink.texts[0], first = members[0]
    reveal[item.group] = item.key + item.dur! / 2
    layer.update(reveal, 1)
    const b = first.textRenderInfo!.blockBounds
    expect(first.clipRect![2]).toBeCloseTo((b[0] + b[2]) / 2, 12)
    expect(first.fillOpacity).toBe(1)
    reveal[item.group] = item.key
    layer.update(reveal, 1)
    expect(first.fillOpacity).toBe(0)
    reveal[item.group] = 1
    layer.update(reveal, 1)
    expect(first.fillOpacity).toBe(1) // reverse/forward scroll has no accumulated state
    const captured = layer.captureBounds(item.group)
    expect(captured.ready).toBe(true)
    expect(captured.count).toBe(ink.texts.filter(t => t.group === item.group).length)
    const visible = (first.textRenderInfo as typeof first.textRenderInfo & { visibleBounds: number[] }).visibleBounds
    first.updateMatrix()
    const corners = [[visible[0], visible[1]], [visible[2], visible[1]], [visible[0], visible[3]], [visible[2], visible[3]]]
      .map(([x, y]) => new Vector3(x, y, 0).applyMatrix4(first.matrix))
    expect(captured.items[0].bounds).toEqual([Math.min(...corners.map(p => p.x)), Math.min(...corners.map(p => p.y)),
      Math.max(...corners.map(p => p.x)), Math.max(...corners.map(p => p.y))])
    const restore = first.textRenderInfo
    first.textRenderInfo = null
    expect(layer.captureBounds(item.group).ready).toBe(false)
    expect(layer.captureBounds(item.group).violations).toBe(1)
    first.textRenderInfo = restore
    layer.dispose()
  })

  it('reports an overflowing authored handwriting fit cell as a violation', async () => {
    const { ink } = compose()
    const item = { ...ink.texts[0], fitCell: { x: 0, y: 0, w: 0.01, h: 0.01 } }
    const layer = makeSheetText([item])
    await layer.ready
    const captured = layer.captureBounds(item.group)
    expect(captured.ready).toBe(true)
    expect(captured.items[0].contained).toBe(false)
    expect(captured.violations).toBe(1)
    layer.dispose()
  })

  it('writes capitals while preserving transcript wording and the free-paper envelope', () => {
    expect(OWNER_NOTE_TEXT.input).toContain('Failure point.')
    const { ink } = compose()
    const b = writingBounds(ink, GROUP.noteOutput, 0.26)
    expect(b.x1 - b.x0).toBeGreaterThan(0.045); expect(b.x1 - b.x0).toBeLessThan(0.07)
  })

  it('anchors the circle at the Detail B centre (the sun gear) with the measured 2:1 radius, and the arrow reaches it', () => {
    const { ink } = compose()
    const first = segsOf(ink, GROUP.noteInput).filter(s => s.key < 0.1)
    const b = boundsOf(first)
    expect((b.x0 + b.x1) / 2).toBeCloseTo(DETAIL_B.at[0], 2)
    expect((b.y0 + b.y1) / 2).toBeCloseTo(DETAIL_B.at[1], 2)
    const sunR = SUN_GEAR.tipRadiusMm * 2e-3
    expect((b.x1 - b.x0) / 2).toBeGreaterThan(sunR); expect((b.x1 - b.x0) / 2).toBeLessThan(sunR * 1.8)
    const arrow = segsOf(ink, GROUP.noteInput).filter(s => s.key >= 0.1 && s.key < 0.18)
    const tipDistance = Math.min(...arrow.flatMap(s => [Math.hypot(s.x1 - DETAIL_B.at[0], s.y1 - DETAIL_B.at[1]), Math.hypot(s.x2 - DETAIL_B.at[0], s.y2 - DETAIL_B.at[1])]))
    expect(tipDistance).toBeLessThan(sunR * 1.5)
  })

  it('puts the output circle around the real output spindle in Section A–A', () => {
    const { ink, marks, section } = compose()
    const o = data.units.output
    const c = new Vector3((data.units.housing.min.x + data.units.housing.max.x) / 2, 0, (o.min.z + o.max.z) / 2).applyMatrix4(section.transform)
    const b = boundsOf(segsOf(ink, GROUP.noteOutput).filter(s => s.key < 0.14))
    expect((b.x0 + b.x1) / 2).toBeCloseTo(c.x, 2)
    expect((b.y0 + b.y1) / 2).toBeCloseTo(c.y, 2)
    expect(marks.outputSpindle[0]).toBeCloseTo(c.x, 9)
    expect((b.x1 - b.x0)).toBeGreaterThan((o.max.z - o.min.z) * section.scale)
  })

  it('stays on free paper: inside the frame, clear of the title/revision/notes blocks and of the neighbouring views', () => {
    const { ink } = compose()
    const frame = SHEET_ZONES.frame
    const zones = [SHEET_ZONES.titleBlock, SHEET_ZONES.revisionBlock, SHEET_ZONES.notes]
    const inRect = (b: ReturnType<typeof boundsOf>, r: { x: number; y: number; w: number; h: number }, pad = 0.002) => b.x1 > r.x - pad && b.x0 < r.x + r.w + pad && b.y1 > r.y - pad && b.y0 < r.y + r.h + pad
    for (const group of [GROUP.noteInput, GROUP.noteOutput]) {
      const b = writingBounds(ink, group, 0)
      expect(b.x0).toBeGreaterThan(frame.x); expect(b.x1).toBeLessThan(frame.x + frame.w)
      expect(b.y0).toBeGreaterThan(frame.y); expect(b.y1).toBeLessThan(frame.y + frame.h)
      for (const z of zones) expect(inRect(b, z)).toBe(false)
    }
    // Writing proper (key > .18 for input, > .26 for output; the circles/arrows may touch their own view) avoids every view rect except its own.
    const writing = (group: number, key: number) => writingBounds(ink, group, key)
    for (const v of layout.views) {
      if (v.name === 'section') continue
      const r = { x: v.rect[0], y: v.rect[1], w: v.rect[2], h: v.rect[3] }
      expect(inRect(writing(GROUP.noteInput, 0.18), r, 0)).toBe(false)
      expect(inRect(writing(GROUP.noteOutput, 0.26), r, 0)).toBe(false)
    }
  })

  it('title / career content is the owner list, in order, with no dates', () => {
    expect(OWNER_TITLE).toEqual({ name: 'MARK HINTZ', role: 'Digital Systems Architect' })
    expect(OWNER_CAREER.map(r => r.rev)).toEqual(['A', 'B', 'C'])
    expect(OWNER_CAREER.map(r => r.organization)).toEqual(['Myers-Seth Pumps', 'Special Tool Solutions', 'Black Creek Precision'])
    expect(OWNER_CAREER[0].scope).toBe('Product Design / R&D / 3D Product Visualizer')
    expect(OWNER_CAREER[1].scope).toBe('Lead Mechanical Designer / Product Development / 3D Product Visualization / Data Management')
    expect(OWNER_CAREER[2].scope).toBe('Lead Mechanical Design / Product Development / Reverse Engineering / Materials and Processes')
    expect(JSON.stringify([OWNER_CAREER, OWNER_EXTRA_FIELDS])).not.toMatch(/\b(19|20)\d\d\b/)
    expect(OWNER_EXTRA_FIELDS.map(([k]) => k)).toEqual(['DRAWN BY', 'DISCIPLINE', 'METHODS', 'PORTFOLIO'])
  })
})
