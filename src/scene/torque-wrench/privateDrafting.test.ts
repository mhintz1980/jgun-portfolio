import { existsSync, readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { DASH, GROUP, InkBuilder, PEN } from '../drawing/sheet/ink'
import { decodeDrawingPrecompute } from '../drawing/sheet/drawingCodec'
import { applyPrivateSheetContent } from './privateSheetContent'
import { DRAFT_PEN, LABEL_MOVES, draftSheet } from './privateDrafting'

const segsOf = (b: InkBuilder, pick: (s: number[]) => boolean) => {
  const out: number[][] = []
  for (let i = 0; i < b.segs.length; i += 9) {
    const s = b.segs.slice(i, i + 9)
    if (pick(s)) out.push(s)
  }
  return out
}

function box(b: InkBuilder, x: number, y: number, w: number, h: number) {
  const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]
  for (let i = 1; i < pts.length; i++) {
    b.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 0.00034, GROUP.section, 0.3, 0.08)
  }
}

function detailCallout(b: InkBuilder, group: number, letter: string, cx: number, cy: number, r: number) {
  b.circle(cx, cy, r, PEN.thin, group, 0, 0.12, DASH.phantom)
  const lx = cx + r * 0.78, ly = cy + r * 0.78
  b.line(lx, ly, lx + 0.008, ly + 0.008, PEN.thin, group, 0.08, 0.03)
  b.text({ text: letter, x: lx + 0.011, y: ly + 0.011, size: 0.0064, anchorX: 'center', anchorY: 'middle',
    weight: 'semibold', group, key: 0.1 })
}

describe('private section hatching', () => {
  it('drops hatch spans that bridge open space and keeps spans inside material', () => {
    const source = new InkBuilder()
    box(source, 0, 0, 0.02, 0.02)
    box(source, 0.06, 0, 0.02, 0.02)
    // Inside the first body, across the void between bodies, and far away (the side-view oval).
    source.line(0.004, 0.012, 0.012, 0.004, 0.0001, GROUP.hatch, 0.3, 0.12)
    source.line(0.021, 0.012, 0.059, 0.002, 0.0001, GROUP.hatch, 0.3, 0.12)
    source.line(-0.5, 0.5, -0.49, 0.49, 0.0001, GROUP.hatch, 0.3, 0.12)
    const frozen = JSON.stringify(source), drafted = draftSheet(source)
    expect(JSON.stringify(source)).toBe(frozen)
    const hatch = segsOf({ segs: drafted.segs } as InkBuilder, s => s[5] === GROUP.hatch)
    expect(hatch.map(s => s[0])).toEqual([0.004, -0.5])
    expect(drafted.stats.hatchDropped).toBe(1)
  })

  it('keeps all hatch when the source has no section cut', () => {
    const source = new InkBuilder()
    source.line(0, 0, 0.01, -0.01, 0.0001, GROUP.hatch, 0.3, 0.12)
    expect(draftSheet(source).stats.hatchDropped).toBe(0)
  })
})

describe('private pen hierarchy', () => {
  it('lightens 1:2 view linework in the order cut > silhouette > edge, leaving the 1:1 side view alone', () => {
    const source = new InkBuilder()
    source.line(0, 0, 0.01, 0, 0.00034, GROUP.section, 0.3, 0.08)
    source.line(0, 0, 0.01, 0, 0.00021, GROUP.section, 0.3, 0.1)
    source.line(0, 0, 0.01, 0, 0.00014, GROUP.section, 0.3, 0.1)
    source.line(0, 0, 0.01, 0, 0.00021, GROUP.front, 0.3, 0.1)
    source.line(0, 0, 0.01, 0, 0.00034, GROUP.side, 0.3, 0.1)
    source.line(0, 0, 0.01, 0, 0.00021, GROUP.side, 0.3, 0.1)
    source.line(0, 0, 0.01, 0, 0.00014, GROUP.rear, 0.88, 0.06)
    const pens = draftSheet(source).segs.filter((_, i) => i % 9 === 4)
    expect(pens).toEqual([DRAFT_PEN.cut, DRAFT_PEN.outline, DRAFT_PEN.edge, DRAFT_PEN.outline, 0.00034, 0.00021, 0.00014])
    expect(DRAFT_PEN.cut).toBeGreaterThan(DRAFT_PEN.outline)
    expect(DRAFT_PEN.outline).toBeGreaterThan(DRAFT_PEN.edge)
  })
})

describe('private detail callouts', () => {
  const source = new InkBuilder()
  detailCallout(source, GROUP.detailB, 'B', 0.183, 0.0608, 0.0125)
  detailCallout(source, GROUP.detailD, 'D', 0.1514, 0.0668, 0.0087)
  detailCallout(source, GROUP.detailC, 'C', -0.2475, 0.0396, 0.019)

  it('replaces dashed circles with solid circles joined to their letters by a leader', () => {
    const out = applyPrivateSheetContent(source)
    for (const group of [GROUP.detailB, GROUP.detailC, GROUP.detailD]) {
      expect(segsOf(out, s => s[5] === group && s[8] === DASH.phantom)).toHaveLength(0)
      expect(segsOf(out, s => s[5] === group && s[4] === DRAFT_PEN.circle).length).toBeGreaterThan(24)
      expect(segsOf(out, s => s[5] === group && s[4] === DRAFT_PEN.leader)).toHaveLength(1)
    }
  })

  it('moves B and D to the owner-marked circles and leaders and B letter to the end of its leader', () => {
    const out = applyPrivateSheetContent(source)
    const marks = { [GROUP.detailB]: { c: [0.1825, 0.0606], r: 0.014, end: [0.205, 0.0865], letter: [0.2086, 0.0908] },
      [GROUP.detailD]: { c: [0.151, 0.0675], r: 0.01, end: [0.1659, 0.0819] } }
    const b = marks[GROUP.detailB], d = marks[GROUP.detailD]
    for (const [group, m] of [[GROUP.detailB, b], [GROUP.detailD, d]] as const) {
      const ring = segsOf(out, s => s[5] === group && s[4] === DRAFT_PEN.circle)
      for (const s of ring) expect(Math.hypot(s[0] - m.c[0], s[1] - m.c[1])).toBeCloseTo(m.r, 6)
      const [leader] = segsOf(out, s => s[5] === group && s[4] === DRAFT_PEN.leader)
      expect(Math.hypot(leader[0] - m.c[0], leader[1] - m.c[1])).toBeCloseTo(m.r, 6)
      expect([leader[2], leader[3]]).toEqual(m.end)
    }
    const letterB = out.texts.find(t => t.group === GROUP.detailB && t.text === 'B')!
    expect([letterB.x, letterB.y]).toEqual(b.letter)
    // D already sits where the owner marked it; only its circle and leader change.
    const letterD = out.texts.find(t => t.group === GROUP.detailD && t.text === 'D')!
    const sourceD = source.texts.find(t => t.group === GROUP.detailD)!
    expect([letterD.x, letterD.y]).toEqual([sourceD.x, sourceD.y])
  })

  it('keeps unflagged callouts at their source position and ignores a changed layout', () => {
    const out = applyPrivateSheetContent(source)
    const ring = segsOf(out, s => s[5] === GROUP.detailC && s[4] === DRAFT_PEN.circle)
    for (const s of ring) expect(Math.hypot(s[0] + 0.2475, s[1] - 0.0396)).toBeCloseTo(0.019, 6)
    const shifted = new InkBuilder()
    detailCallout(shifted, GROUP.detailB, 'B', 0.3, 0.2, 0.0125)
    const moved = applyPrivateSheetContent(shifted)
    const ringB = segsOf(moved, s => s[5] === GROUP.detailB && s[4] === DRAFT_PEN.circle)
    for (const s of ringB) expect(Math.hypot(s[0] - 0.3, s[1] - 0.2)).toBeCloseTo(0.0125, 6)
  })
})

const CACHE = 'public/drawing/jgun-sheet-v2.bin.gz'
describe.skipIf(!existsSync(CACHE))('private drafting on the shipped drawing precompute', () => {
  const asset = decodeDrawingPrecompute(new Uint8Array(gunzipSync(readFileSync(CACHE))))
  it('removes escaped section hatching below the housing and trigger, keeping material hatch', () => {
    expect(asset).not.toBeNull()
    const source = new InkBuilder()
    for (const n of asset!.segs) source.segs.push(n)
    for (const n of asset!.fills) source.fills.push(n)
    for (const t of asset!.texts) source.texts.push(t)
    const before = segsOf(source, s => s[5] === GROUP.hatch && s[0] > 0.1)
    const drafted = draftSheet(source)
    const after = segsOf({ segs: drafted.segs } as InkBuilder, s => s[5] === GROUP.hatch && s[0] > 0.1)
    const kept = new Set(after.map(s => s.join()))
    const dropped = before.filter(s => !kept.has(s.join()))
    expect(dropped.length).toBeGreaterThanOrEqual(12)
    expect(dropped.length).toBeLessThanOrEqual(30)
    // Every dropped span lies in open space under the housing line (y 0.0447) or in front of the grip.
    for (const s of dropped) expect(Math.max(s[1], s[3])).toBeLessThan(0.0455)
    // Material hatch at the output tang stays.
    expect(after.some(s => s[0] > 0.12 && s[0] < 0.14 && s[1] > 0.055)).toBe(true)
    // No long void-bridging span survives in the section.
    for (const s of after) expect(Math.hypot(s[2] - s[0], s[3] - s[1])).toBeLessThan(0.02)
    expect(drafted.stats.calloutsRedrawn).toBe(4)
  })

  const load = () => {
    const source = new InkBuilder()
    for (const n of asset!.segs) source.segs.push(n)
    for (const n of asset!.fills) source.fills.push(n)
    for (const x of asset!.texts) source.texts.push(x)
    return source
  }

  it('remaps only the Air Motor cutaway hatch to the side group and leaves section hatch alone', () => {
    const source = load()
    const isMotor = (s: number[]) => s[5] === GROUP.hatch && Math.abs(s[6] - 0.4) < 1e-6 && Math.abs(s[7] - 0.1) < 1e-6
    const motor = segsOf(source, isMotor)
    expect(motor.length).toBe(67)
    const out = applyPrivateSheetContent(source)
    const sideMotor = segsOf(out, s => s[5] === GROUP.side && s[4] === 0.0001 && Math.abs(s[6] - 0.4) < 1e-6 && Math.abs(s[7] - 0.1) < 1e-6)
    expect(sideMotor.length).toBe(67)
    // Motor hatch sits in the cutaway oval at the rear of the handle, and none remains in the hatch group.
    for (const s of sideMotor) { expect(s[0]).toBeGreaterThan(-0.03); expect(s[0]).toBeLessThan(0.012) }
    expect(segsOf(out, isMotor)).toHaveLength(0)
    const sectionBefore = segsOf(source, s => s[5] === GROUP.hatch && !isMotor(s)).length
    const sectionAfter = segsOf(out, s => s[5] === GROUP.hatch).length
    expect(sectionAfter).toBeGreaterThan(0)
    expect(sectionAfter).toBe(sectionBefore - draftSheet(source).stats.hatchDropped)
    expect(draftSheet(source).stats.hatchRemapped).toBe(67)
  })

  it('moves gearbox, clutch and ring switch callouts and rehomes the Air Motor callout near the vacated ring switch', () => {
    const source = load()
    const out = applyPrivateSheetContent(source)
    const text = (b: InkBuilder, s: string) => b.texts.find(x => x.group === GROUP.sideLabels && x.text === s)!
    for (const m of Object.values(LABEL_MOVES)) {
      const title = text(out, m.lines[0]), sub = text(out, m.lines[1]), old = text(source, m.lines[0])
      expect([title.x, title.y]).toEqual(m.to)
      expect(sub.x).toBe(m.to[0])
      expect(sub.y).toBeLessThan(title.y)
      expect(old.y).toBeCloseTo(m.from[1], 3)
      // a leader shelf ends at the label and the elbow joins it
      const shelf = segsOf(out, s => s[5] === GROUP.sideLabels && Math.abs(s[1] - m.to[1]) < 1e-9 && Math.abs(s[3] - m.to[1]) < 1e-9)
      expect(shelf.some(s => Math.abs(s[0] - m.elbow[0]) < 1e-9 && Math.abs(s[2] - m.end) < 1e-9)).toBe(true)
    }
    // Housing callouts moved up; none of the three is now near the trigger area where Air Motor goes... except Air Motor.
    expect(text(out, 'GEARBOX HOUSING').y).toBeGreaterThan(text(source, 'GEARBOX HOUSING').y)
    expect(text(out, 'CLUTCH HOUSING').y).toBeGreaterThan(text(source, 'CLUTCH HOUSING').y)
    expect(text(out, 'RING SWITCH').x).toBeLessThan(text(source, 'RING SWITCH').x)
    const motor = text(out, 'AIR MOTOR')
    expect(motor.y).toBeLessThan(-0.12)
    expect(motor.anchorX).toBe('right')
    // Motor leader still starts at the rear-handle cutaway (-0.0085, 0.0396) and ends at the new elbow.
    const lead = segsOf(out, s => s[5] === GROUP.sideLabels && Math.abs(s[0] + 0.0085) < 1e-3 && Math.abs(s[1] - 0.0396) < 1e-3)
    expect(lead).toHaveLength(1)
    expect([lead[0][2], lead[0][3]]).toEqual(LABEL_MOVES.airMotor.elbow)
    // The Air Motor subtitle must not collide with another callout title.
    const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.abs(a.x - b.x) < 0.02 && Math.abs(a.y - b.y) < 0.006
    const titles = ['GEARBOX HOUSING', 'CLUTCH HOUSING', 'RING SWITCH', 'OUTPUT SPINDLE'].map(s => text(out, s))
    expect(titles.some(x => near(x, motor))).toBe(false)
    // Clutch feature-control frame moved by the same amount as its label.
    const dy = text(out, 'CLUTCH HOUSING').y - text(source, 'CLUTCH HOUSING').y
    const gdtOld = source.texts.find(x => x.group === GROUP.gdt && x.text === '.004')!
    const gdtNew = out.texts.find(x => x.group === GROUP.gdt && x.text === '.004')!
    expect(gdtNew.y - gdtOld.y).toBeCloseTo(dy, 3)
  })

  it('draws B, C, D, E as heavy circles clearly heavier than section linework and parts B from E', () => {
    const out = applyPrivateSheetContent(load())
    expect(DRAFT_PEN.circle).toBeGreaterThan(DRAFT_PEN.cut)
    expect(DRAFT_PEN.leader).toBeGreaterThan(DRAFT_PEN.outline)
    const centre = (g: number) => {
      const ring = segsOf(out, s => s[5] === g && s[4] === DRAFT_PEN.circle)
      expect(ring.length).toBeGreaterThan(24)
      return [ring.reduce((a, s) => a + s[0], 0) / ring.length, ring.reduce((a, s) => a + s[1], 0) / ring.length]
    }
    for (const g of [GROUP.detailB, GROUP.detailC, GROUP.detailD, GROUP.detailE]) {
      centre(g)
      expect(segsOf(out, s => s[5] === g && s[8] === DASH.phantom)).toHaveLength(0)
    }
    const letter = (ch: string) => out.texts.find(x => x.text === ch && x.weight === 'semibold' && x.size === 0.0064)!
    const b = letter('B'), e = letter('E')
    expect(Math.hypot(b.x - e.x, b.y - e.y)).toBeGreaterThan(0.007)
    expect(Math.hypot(b.x - e.x, b.y - e.y)).toBeGreaterThan(Math.hypot(0.2037 - 0.2091, 0.0815 - 0.0826) * 1.5)
    // no fills added by the callouts: the model stays visible inside the rings
    expect(out.fills.length).toBe(load().fills.length)
  })
})




