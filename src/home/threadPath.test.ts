import { describe, expect, it } from 'vitest'
import type { Anchor, Point } from './threadPath'
import {
  buildThread,
  catmullRomPath,
  drawnLength,
  lengthForY,
  lengthNearest,
  makeSamples,
  pointAtSampled,
} from './threadPath'

const W = 1440
const row = (top: number): Anchor => ({ kind: 'row', left: 216, top, width: 1008, height: 140 })
const card = (left: number, top: number): Anchor => ({ kind: 'card', left, top, width: 490, height: 200 })
const ANCHORS: Anchor[] = [
  { kind: 'start', left: 260, top: 300, width: 40, height: 80 },
  row(900),
  row(1068),
  row(1236),
  card(216, 1700),
  card(734, 1700),
  card(216, 1928),
  card(734, 1928),
  { kind: 'end', left: 216, top: 2900, width: 0, height: 0 },
]

/** Sample a polyline (stand-in for SVGPathElement.getPointAtLength). */
function polyline(points: Point[]) {
  const cum = [0]
  for (let i = 1; i < points.length; i++)
    cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  const total = cum[cum.length - 1]
  const at = (length: number): Point => {
    let i = 1
    while (i < cum.length - 1 && cum[i] < length) i++
    const t = (length - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
    return {
      x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
      y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
    }
  }
  return { total, at }
}

describe('buildThread', () => {
  const layout = buildThread(ANCHORS, { width: W })

  it('starts at the H1 + and ends at the contact pin', () => {
    expect(layout.points[0]).toEqual({ x: 280, y: 340 })
    expect(layout.points[layout.points.length - 1]).toEqual({ x: 216, y: 2900 })
  })

  it('laces rows edge to edge, alternating sides, eyelets 10px outside at the row centre', () => {
    expect(layout.eyelets).toHaveLength(6)
    const [e1, x1, e2, x2, e3, x3] = layout.eyelets
    // Row 1: enter left, exit right. Row 2: enter right, exit left. Row 3: enter left again.
    expect([e1.x, x1.x, e2.x, x2.x, e3.x, x3.x]).toEqual([206, 1234, 1234, 206, 206, 1234])
    expect([e1.y, x1.y, e2.y, x2.y, e3.y, x3.y]).toEqual([970, 970, 1138, 1138, 1306, 1306])
    // Eyelets are spline knots in order, so the curve passes through each of them.
    const indices = layout.eyelets.map((e) => e.pointIndex)
    expect([...indices].sort((a, b) => a - b)).toEqual(indices)
    for (const e of layout.eyelets) expect(layout.points[e.pointIndex]).toEqual({ x: e.x, y: e.y })
  })

  it('loops out into the margin between rows on the shared side', () => {
    const [, exit1, entry2] = layout.eyelets
    const loop = layout.points.slice(exit1.pointIndex + 1, entry2.pointIndex)
    expect(loop).toHaveLength(1)
    expect(loop[0].x).toBeGreaterThan(exit1.x)
    expect(loop[0].y).toBeGreaterThan(1040)
    expect(loop[0].y).toBeLessThan(1068)
  })

  it('routes into the cards via the left margin and into the pin from the left', () => {
    const firstCard = ANCHORS[4]
    const lastRowExit = layout.eyelets[5]
    const between = layout.points.slice(
      lastRowExit.pointIndex + 1,
      layout.points.findIndex((p) => p.y === 1800),
    )
    expect(between.some((p) => p.x < firstCard.left && p.y < firstCard.top + 60 && p.y > 1376)).toBe(true)
    const tail = layout.points.slice(-3, -1)
    for (const p of tail) expect(p.x).toBeLessThan(216)
  })

  it('zig-zags through every card interior in reading order', () => {
    const inside = (p: Point, a: Anchor) =>
      p.x > a.left && p.x < a.left + a.width && p.y > a.top && p.y < a.top + a.height
    const cards = ANCHORS.filter((a) => a.kind === 'card')
    let from = 0
    for (const c of cards) {
      const i = layout.points.findIndex((p, k) => k >= from && inside(p, c))
      expect(i).toBeGreaterThanOrEqual(from)
      from = i + 1
    }
  })

  it('clamps every point inside the page on a 390px phone', () => {
    const phone: Anchor[] = [
      { kind: 'start', left: 16, top: 200, width: 30, height: 50 },
      { kind: 'row', left: 16, top: 700, width: 358, height: 180 },
      { kind: 'row', left: 16, top: 908, width: 358, height: 180 },
      { kind: 'card', left: 16, top: 1300, width: 358, height: 220 },
      { kind: 'card', left: 16, top: 1548, width: 358, height: 220 },
      { kind: 'end', left: 16, top: 2400, width: 0, height: 0 },
    ]
    const out = buildThread(phone, { width: 390, loopReach: 4, margin: 2 })
    for (const p of out.points) {
      expect(p.x).toBeGreaterThanOrEqual(2)
      expect(p.x).toBeLessThanOrEqual(388)
    }
    expect(out.eyelets.map((e) => e.x)).toEqual([6, 384, 384, 6])
    // One column: the two card points still sit on opposite sides.
    const cardPts = out.points.filter((p) => p.y === 1410 || p.y === 1658)
    expect(cardPts[0].x).toBeLessThan(195)
    expect(cardPts[1].x).toBeGreaterThan(195)
  })
})

describe('catmullRomPath', () => {
  it('emits one cubic per segment, passing through every knot', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 40, y: 200 },
      { x: 300, y: 260 },
    ]
    const d = catmullRomPath(pts)
    expect(d.startsWith('M0,0 C')).toBe(true)
    expect(d.match(/C/g)).toHaveLength(3)
    expect(d.endsWith(' 300,260')).toBe(true)
    expect(d).toContain(' 100,50 C')
    expect(d).toContain(' 40,200 C')
    expect(d).not.toMatch(/NaN|Infinity/)
  })

  it('survives duplicate and degenerate inputs', () => {
    expect(catmullRomPath([])).toBe('')
    expect(catmullRomPath([{ x: 1, y: 2 }])).toBe('M1,2')
    expect(
      catmullRomPath([
        { x: 1, y: 2 },
        { x: 1, y: 2 },
        { x: 5, y: 9 },
      ]),
    ).not.toMatch(/NaN|Infinity/)
  })
})

describe('scroll drawing', () => {
  // Down, back up a little (a loop), then down again: running max must ignore the climb.
  const line = polyline([
    { x: 0, y: 0 },
    { x: 0, y: 400 },
    { x: 100, y: 300 },
    { x: 100, y: 1000 },
  ])
  const samples = makeSamples(line.total, line.at, 8)

  it('samples every ~8px and keeps a monotone running max of y', () => {
    expect(samples.lengths[0]).toBe(0)
    expect(samples.lengths[samples.lengths.length - 1]).toBeCloseTo(line.total)
    for (let i = 1; i < samples.reach.length; i++) {
      expect(samples.reach[i]).toBeGreaterThanOrEqual(samples.reach[i - 1])
      expect(samples.lengths[i] - samples.lengths[i - 1]).toBeLessThanOrEqual(8 + 1e-9)
    }
  })

  it('binary-searches the length whose running max passes the target', () => {
    expect(lengthForY(samples, -50)).toBe(0)
    expect(lengthForY(samples, 200)).toBeCloseTo(200, 5)
    // y=350 is first passed on the way down (length 350), not on the climb back.
    expect(lengthForY(samples, 350)).toBeCloseTo(350, 5)
    // y=500: past the 400 peak, so after the climb (400 + 141.4 + 100 back to y=400 + 100).
    expect(lengthForY(samples, 500)).toBeCloseTo(400 + Math.SQRT2 * 100 + 200, 0)
    expect(lengthForY(samples, 5000)).toBe(line.total)
  })

  it('dash offset falls monotonically as the page scrolls down', () => {
    let previous = Infinity
    for (let scrollY = 0; scrollY <= 1200; scrollY += 100) {
      const offset = samples.total - drawnLength(samples, scrollY, 900)
      expect(offset).toBeLessThanOrEqual(previous)
      previous = offset
    }
    expect(previous).toBe(0)
    // 0.62 of the viewport, minus the .home offset.
    expect(drawnLength(samples, 0, 500, 10)).toBeCloseTo(300, 5)
    // At the bottom of the page the thread finishes even if the pin is below the 62% line.
    expect(drawnLength(samples, 0, 100, 0, 0)).toBe(samples.total)
  })

  it('reads points back from the samples and finds eyelet lengths in order', () => {
    expect(pointAtSampled(samples, 200)).toEqual({ x: 0, y: 200 })
    const p = pointAtSampled(samples, 400 + Math.SQRT2 * 50)
    expect(p.x).toBeCloseTo(50, 0)
    expect(p.y).toBeCloseTo(350, 0)
    // Within half a sample step (4px) of the true length.
    expect(Math.abs(lengthNearest(samples, { x: 0, y: 400 }) - 400)).toBeLessThanOrEqual(4)
    expect(
      Math.abs(lengthNearest(samples, { x: 100, y: 400 }, 500) - (400 + Math.SQRT2 * 100 + 100)),
    ).toBeLessThanOrEqual(4)
    // fromLength skips earlier passes: (0, 200) is on the first leg, so a later search ends late.
    expect(lengthNearest(samples, { x: 0, y: 200 }, 600)).toBeGreaterThanOrEqual(600)
  })
})
