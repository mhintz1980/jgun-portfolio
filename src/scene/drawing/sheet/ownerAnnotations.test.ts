import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { Box3, Vector3, type Mesh, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SHEET_ZONES, makeDrawingLayout, snapshotDrawing, type DrawingGeometry, type DrawingLayout } from '../drawingGeometry'
import { loadRingSource } from '../../inspection/testing/loadRig'
import { NodeDracoLoader } from '../../inspection/testing/nodeDraco'
import { GROUP, InkBuilder } from './ink'
import {
  OWNER_CAREER, OWNER_EXTRA_FIELDS, OWNER_NOTES, OWNER_NOTE_TEXT, OWNER_TITLE, SUN_GEAR, composeOwnerAnnotations, sunGearModelPoint,
} from './ownerAnnotations'

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
const boundsOf = (segs: ReturnType<typeof segsOf>) => ({ x0: Math.min(...segs.flatMap(s => [s.x1, s.x2])), x1: Math.max(...segs.flatMap(s => [s.x1, s.x2])), y0: Math.min(...segs.flatMap(s => [s.y1, s.y2])), y1: Math.max(...segs.flatMap(s => [s.y1, s.y2])) })

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

  it('writes in order: gear circle+arrow, list, red strikes, decision, decision circle; only the failure-point mark and the strikes are red', () => {
    const { ink } = compose()
    const input = segsOf(ink, GROUP.noteInput)
    expect(input.length).toBeGreaterThan(300)
    const red = input.filter(s => s.dash >= 10)
    expect(red.length).toBeGreaterThan(30)
    expect(input.filter(s => s.dash < 10).length).toBeGreaterThan(red.length * 4)
    // red = the failure-point mark (gear circle + leader + arrow, written first; navy would vanish into the section linework)
    // or the alloy strikes (written after the list and before the decision)
    const mark = red.filter(s => s.key < 0.2), strikes = red.filter(s => s.key >= 0.2)
    expect(mark.length).toBeGreaterThan(20); expect(strikes.length).toBeGreaterThan(30)
    for (const s of mark) expect(s.key + s.dur).toBeLessThanOrEqual(0.18 + 1e-6)
    for (const s of strikes) { expect(s.key).toBeGreaterThanOrEqual(0.54 - 1e-9); expect(s.key + s.dur).toBeLessThanOrEqual(0.68 + 1e-6) }
    const early = input.filter(s => s.key < 0.18), list = input.filter(s => s.key >= 0.18 && s.key < 0.52), decision = input.filter(s => s.key >= 0.7)
    expect(early.length).toBeGreaterThan(40); expect(list.length).toBeGreaterThan(100); expect(decision.length).toBeGreaterThan(100)
    expect(input.every(s => Number.isFinite(s.x1 + s.y1 + s.x2 + s.y2) && s.key >= 0 && s.key + s.dur <= 1.0001)).toBe(true)
    // output group has no red at all
    expect(segsOf(ink, GROUP.noteOutput).some(s => s.dash >= 10)).toBe(false)
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
      const b = boundsOf(segsOf(ink, group))
      expect(b.x0).toBeGreaterThan(frame.x); expect(b.x1).toBeLessThan(frame.x + frame.w)
      expect(b.y0).toBeGreaterThan(frame.y); expect(b.y1).toBeLessThan(frame.y + frame.h)
      for (const z of zones) expect(inRect(b, z)).toBe(false)
    }
    // Writing proper (key > .18 for input, > .26 for output; the circles/arrows may touch their own view) avoids every view rect except its own.
    const writing = (group: number, key: number) => boundsOf(segsOf(ink, group).filter(s => s.key >= key))
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
