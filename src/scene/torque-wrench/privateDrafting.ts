import { DASH, GROUP, InkBuilder, PEN, type InkText } from '../drawing/sheet/ink'

/**
 * Private drafting corrections for the Torque Wrench sheet (JG-038 drawing lane).
 *
 * The shared composer and its precompute cache stay untouched. This module reads the
 * composed builder (segment stride 9: x1 y1 x2 y2 halfWidth group key dur dash) and returns a
 * private corrected copy of the data it changes:
 *   1. Section A-A hatching that escapes into open space is removed. The cut contour is not
 *      watertight (overlapping bodies, open loops), so the composer's scan-line parity pairs
 *      hits across empty air. Hatch spans whose samples sit in the sheet region reachable from
 *      outside the cut contour plus the section silhouette are dropped.
 *   2. Model linework on the 1:2 views gets a tighter pen hierarchy.
 *   3. Detail callouts (circle, leader, letter) are redrawn as a heavy solid circle joined to its
 *      letter by a leader, with B and D placed at the owner's marked locations and E turned
 *      away from B.
 *   4. Gearbox, clutch and ring-switch part callouts move to the owner's marked boxes, clearing
 *      the trigger area for the Air Motor callout (label, subtitle, leader and the clutch
 *      feature frame move together).
 *   5. The Air Motor cutaway hatching (a hatch-group record in the 1:1 side view) is remapped
 *      to the side-view group so it appears with the rest of its view.
 */

export const DRAFT_PEN = {
  /** Section cut contour: the heaviest line in a 1:2 section. */
  cut: 0.00032,
  /** Silhouette of a 1:2 view. */
  outline: 0.00016,
  /** Interior visible edges of a 1:2 view. */
  edge: 0.00009,
  /** Detail callout circle: heavier than any model line so it never reads as section detail. */
  circle: 0.00036,
  /** Detail callout leader. */
  leader: 0.00022,
} as const

const STRIDE = 9
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps
const CELL = 0.00025
const PAD = 0.004
const DETAIL_GROUPS: Record<number, string> = {
  [GROUP.detailB]: 'B', [GROUP.detailC]: 'C', [GROUP.detailD]: 'D', [GROUP.detailE]: 'E',
}
const HALF_SCALE_GROUPS = new Set<number>([GROUP.top, GROUP.front, GROUP.rear, GROUP.bottom])

/**
 * Owner marks (drawing-feeback screenshot, 2026-10-16) mapped to sheet metres through a
 * four-point homography. 'from' guards against applying them to a different layout.
 */
const CALLOUT_TARGETS: Record<string, {
  from: [number, number]; center: [number, number]; radius: number
  leaderEnd: [number, number]; letter?: [number, number]
}> = {
  B: { from: [0.183, 0.0608], center: [0.1825, 0.0606], radius: 0.014, leaderEnd: [0.205, 0.0865], letter: [0.2086, 0.0908] },
  D: { from: [0.1514, 0.0668], center: [0.151, 0.0675], radius: 0.01, leaderEnd: [0.1659, 0.0819] },
  // E sits inside B's crowd; its leader runs shallower and further right so B and E leaders and letters part.
  E: { from: [0.1913, 0.0648], center: [0.1913, 0.0648], radius: 0.0082, leaderEnd: [0.2135, 0.077], letter: [0.2178, 0.0795] },
}

/**
 * Owner part-callout moves (green and blue boxes, drawing-feedback screenshot 2026-10-16), measured
 * from the page at ~2820 px per sheet metre. `from` is the source first label line and `elbowFrom`
 * the source leader elbow, both used as layout guards; `to` is the first label line, `elbow` the new
 * leader elbow and `end` the x where the horizontal shelf meets the label.
 */
interface LabelMove {
  lines: string[]
  from: [number, number]; elbowFrom: [number, number]
  to: [number, number]; elbow: [number, number]; end: number
  /** Text anchor for the label lines after the move. */
  anchorX?: 'left' | 'center' | 'right'
  /** Clutch only: the feature control frame hangs from this label and moves with it. */
  gdtFrame?: boolean
}
export const LABEL_MOVES: Record<string, LabelMove> = {
  gearbox: { lines: ['GEARBOX HOUSING', 'P000245 \u00b7 MULTI-STAGE PLANETARY'], from: [-0.2277, -0.0749], elbowFrom: [-0.1817, -0.0749],
    to: [-0.2277, -0.0582], elbow: [-0.1873, -0.0582], end: -0.2012 },
  clutch: { lines: ['CLUTCH HOUSING', 'P000420 \u00b7 \u23002.525 H7/k6'], from: [-0.2102, -0.1204], elbowFrom: [-0.1582, -0.1204],
    to: [-0.2102, -0.1096], elbow: [-0.1731, -0.1096], end: -0.1857, gdtFrame: true },
  ringSwitch: { lines: ['RING SWITCH', 'P003068 \u00b7 2-SPEED'], from: [-0.0832, -0.1414], elbowFrom: [-0.1322, -0.1414],
    to: [-0.1867, -0.1547], elbow: [-0.1518, -0.1547], end: -0.1677 },
  airMotor: { lines: ['AIR MOTOR', 'BALANCED VANE ASSEMBLY'], from: [0.062, 0.0993], elbowFrom: [0.0565, 0.0993],
    to: [-0.0558, -0.1387], elbow: [-0.0437, -0.1387], end: -0.0543, anchorX: 'right' },
}
const LABEL_SUBTITLE_DROP = 0.0062
const LABEL_TOL = 0.002
/** Source feature-control-frame box under the clutch label (frame, connector, symbol, cells). */
const CLUTCH_GDT_BOX = { x0: -0.23, x1: -0.185, y0: -0.141, y1: -0.1195 }
const inClutchGdt = (x: number, y: number) =>
  x >= CLUTCH_GDT_BOX.x0 && x <= CLUTCH_GDT_BOX.x1 && y >= CLUTCH_GDT_BOX.y0 && y <= CLUTCH_GDT_BOX.y1

/** Air Motor cutaway hatch records: hatch group, key .4, dur .1 (section hatch uses dur .12). */
const isMotorCutawayHatch = (group: number, key: number, dur: number) =>
  group === GROUP.hatch && near(key, 0.4, 1e-6) && near(dur, 0.1, 1e-6)
const FROM_TOLERANCE = 0.004

interface SourceCallout {
  group: number
  letter: string
  cx: number; cy: number; radius: number
  stubEnd: [number, number]
}

export interface DraftedSheet {
  segs: number[]
  callouts: SourceCallout[]
  stats: { hatchDropped: number; reweighted: number; calloutsRedrawn: number; hatchRemapped: number; labelsMoved: number }
  /** Adjust a private copy of a source text item (callout letter placement and timing). */
  adjustText(item: InkText): void
  /** Append the redrawn callout circles and leaders. */
  appendCallouts(out: InkBuilder): void
}

interface Plan { center: [number, number]; radius: number; leaderEnd: [number, number]; letter?: [number, number] }

function planFor(c: SourceCallout): Plan {
  const target = CALLOUT_TARGETS[c.letter]
  if (target && Math.hypot(c.cx - target.from[0], c.cy - target.from[1]) < FROM_TOLERANCE) {
    return { center: target.center, radius: target.radius, leaderEnd: target.leaderEnd, letter: target.letter }
  }
  return { center: [c.cx, c.cy], radius: c.radius, leaderEnd: c.stubEnd }
}

/** Flood the sheet region reachable from outside the section walls. Null when no section cut exists. */
function exteriorTest(segs: readonly number[]): ((x: number, y: number) => boolean) | null {
  const cut: number[] = [], sil: number[] = []
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let i = 0; i < segs.length; i += STRIDE) {
    if (segs[i + 5] !== GROUP.section || segs[i + 8] !== 0) continue
    if (near(segs[i + 4], 0.00034) && near(segs[i + 7], 0.08)) {
      cut.push(i)
      x0 = Math.min(x0, segs[i], segs[i + 2]); x1 = Math.max(x1, segs[i], segs[i + 2])
      y0 = Math.min(y0, segs[i + 1], segs[i + 3]); y1 = Math.max(y1, segs[i + 1], segs[i + 3])
    }
  }
  if (cut.length < 4) return null
  x0 -= PAD; y0 -= PAD; x1 += PAD; y1 += PAD
  for (let i = 0; i < segs.length; i += STRIDE) {
    if (segs[i + 5] !== GROUP.section || segs[i + 8] !== 0) continue
    if (!(near(segs[i + 4], 0.00021) && near(segs[i + 7], 0.1))) continue
    const inside = (x: number, y: number) => x >= x0 && x <= x1 && y >= y0 && y <= y1
    if (inside(segs[i], segs[i + 1]) && inside(segs[i + 2], segs[i + 3])) sil.push(i)
  }
  const W = Math.ceil((x1 - x0) / CELL) + 1, H = Math.ceil((y1 - y0) / CELL) + 1
  const wall = new Uint8Array(W * H)
  const mark = (x: number, y: number) => {
    const cx = Math.floor((x - x0) / CELL), cy = Math.floor((y - y0) / CELL)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx, gy = cy + dy
      if (gx >= 0 && gx < W && gy >= 0 && gy < H) wall[gy * W + gx] = 1
    }
  }
  for (const list of [cut, sil]) for (const i of list) {
    const ax = segs[i], ay = segs[i + 1], bx = segs[i + 2], by = segs[i + 3]
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (CELL * 0.5)))
    for (let s = 0; s <= steps; s++) mark(ax + (bx - ax) * s / steps, ay + (by - ay) * s / steps)
  }
  const outside = new Uint8Array(W * H)
  const queue = new Int32Array(W * H)
  let head = 0, tail = 0
  const push = (gx: number, gy: number) => {
    const k = gy * W + gx
    if (!wall[k] && !outside[k]) { outside[k] = 1; queue[tail++] = k }
  }
  for (let gx = 0; gx < W; gx++) { push(gx, 0); push(gx, H - 1) }
  for (let gy = 0; gy < H; gy++) { push(0, gy); push(W - 1, gy) }
  while (head < tail) {
    const k = queue[head++], gx = k % W, gy = (k - gx) / W
    if (gx > 0) push(gx - 1, gy)
    if (gx < W - 1) push(gx + 1, gy)
    if (gy > 0) push(gx, gy - 1)
    if (gy < H - 1) push(gx, gy + 1)
  }
  return (x, y) => {
    const gx = Math.floor((x - x0) / CELL), gy = Math.floor((y - y0) / CELL)
    return gx >= 0 && gx < W && gy >= 0 && gy < H && outside[gy * W + gx] === 1
  }
}

/** Build the private corrected segment list and callout plan. The source builder is only read. */
export function draftSheet(source: InkBuilder): DraftedSheet {
  const s = source.segs
  const exterior = exteriorTest(s)
  const stats = { hatchDropped: 0, reweighted: 0, calloutsRedrawn: 0, hatchRemapped: 0, labelsMoved: 0 }
  // A label move applies only when the source still has its first label line where the owner marked it.
  const active = Object.values(LABEL_MOVES).filter(m => source.texts.some(t =>
    t.group === GROUP.sideLabels && t.text === m.lines[0] && Math.hypot(t.x - m.from[0], t.y - m.from[1]) < LABEL_TOL))
  stats.labelsMoved = active.length
  const clutchDy = (() => { const m = active.find(a => a.gdtFrame); return m ? m.to[1] - m.from[1] : 0 })()
  const circles = new Map<number, number[][]>(), stubs = new Map<number, [number, number]>()
  const segs: number[] = []
  for (let i = 0; i < s.length; i += STRIDE) {
    const group = s[i + 5], hw = s[i + 4], dash = s[i + 8], key = s[i + 6], dur = s[i + 7]
    if (group in DETAIL_GROUPS && near(hw, PEN.thin)) {
      if (dash === DASH.phantom) {
        const list = circles.get(group) ?? []
        list.push([s[i], s[i + 1]]); circles.set(group, list)
        continue
      }
      if (dash === 0 && near(key, 0.08) && near(dur, 0.03)) { stubs.set(group, [s[i + 2], s[i + 3]]); continue }
    }
    if (exterior && group === GROUP.hatch) {
      let outside = 0
      for (const f of [0.25, 0.5, 0.75]) {
        if (exterior(s[i] + (s[i + 2] - s[i]) * f, s[i + 1] + (s[i + 3] - s[i + 1]) * f)) outside++
      }
      if (outside >= 2) { stats.hatchDropped++; continue }
    }
    let pen = hw, outGroup = group
    if (isMotorCutawayHatch(group, key, dur)) { outGroup = GROUP.side; stats.hatchRemapped++ }
    let ends: [number, number, number, number] = [s[i], s[i + 1], s[i + 2], s[i + 3]]
    if (group === GROUP.sideLabels) {
      for (const m of active) {
        const shelf = near(s[i + 1], m.from[1], 2e-4) && near(s[i + 3], m.from[1], 2e-4)
          && Math.min(Math.abs(s[i] - m.from[0]), Math.abs(s[i + 2] - m.from[0])) < 0.06
        if (shelf) ends = [m.elbow[0], m.to[1], m.end, m.to[1]]
        else if (Math.hypot(s[i + 2] - m.elbowFrom[0], s[i + 3] - m.elbowFrom[1]) < 3e-4) ends = [s[i], s[i + 1], m.elbow[0], m.elbow[1]]
      }
    } else if (group === GROUP.gdt && clutchDy !== 0 && inClutchGdt(s[i], s[i + 1]) && inClutchGdt(s[i + 2], s[i + 3])) {
      ends = [s[i], s[i + 1] + clutchDy, s[i + 2], s[i + 3] + clutchDy]
    }
    if (dash === 0) {
      if (group === GROUP.section && near(hw, 0.00034) && near(dur, 0.08)) pen = DRAFT_PEN.cut
      else if ((group === GROUP.section || HALF_SCALE_GROUPS.has(group)) && near(dur, 0.1)) {
        if (near(hw, 0.00021)) pen = DRAFT_PEN.outline
        else if (near(hw, 0.00014)) pen = DRAFT_PEN.edge
      }
    }
    if (pen !== hw) stats.reweighted++
    for (let j = 0; j < STRIDE; j++) segs.push(s[i + j])
    const base = segs.length - STRIDE
    segs[base] = ends[0]; segs[base + 1] = ends[1]; segs[base + 2] = ends[2]; segs[base + 3] = ends[3]
    segs[base + 4] = pen; segs[base + 5] = outGroup
  }
  const callouts: SourceCallout[] = []
  for (const [group, points] of circles) {
    const stub = stubs.get(group)
    if (points.length < 24 || !stub) continue
    const cx = points.reduce((a, p) => a + p[0], 0) / points.length
    const cy = points.reduce((a, p) => a + p[1], 0) / points.length
    const radius = points.reduce((a, p) => a + Math.hypot(p[0] - cx, p[1] - cy), 0) / points.length
    callouts.push({ group, letter: DETAIL_GROUPS[group], cx, cy, radius, stubEnd: stub })
  }
  stats.calloutsRedrawn = callouts.length
  const byGroup = new Map(callouts.map(c => [c.group, c]))
  return {
    segs, callouts, stats,
    adjustText(item) {
      if (item.group === GROUP.sideLabels) {
        for (const m of active) {
          const row = m.lines.indexOf(item.text)
          if (row < 0 || Math.abs(item.x - m.from[0]) > LABEL_TOL) continue
          if (Math.abs(item.y - (m.from[1] - row * LABEL_SUBTITLE_DROP)) > LABEL_TOL * 0.5) continue
          item.x = m.to[0]
          item.y = m.to[1] - row * LABEL_SUBTITLE_DROP
          if (m.anchorX) item.anchorX = m.anchorX
        }
        return
      }
      if (item.group === GROUP.gdt && clutchDy !== 0 && inClutchGdt(item.x, item.y)) { item.y += clutchDy; return }
      const c = byGroup.get(item.group)
      if (!c || item.text !== c.letter || item.weight !== 'semibold') return
      const plan = planFor(c)
      if (plan.letter) { item.x = plan.letter[0]; item.y = plan.letter[1] }
      item.key = 0.14
    },
    appendCallouts(out) {
      for (const c of callouts) {
        const plan = planFor(c), [cx, cy] = plan.center
        const angle = Math.atan2(plan.leaderEnd[1] - cy, plan.leaderEnd[0] - cx)
        // The pen walks the circle from the leader root, then runs out along the leader.
        out.circle(cx, cy, plan.radius, DRAFT_PEN.circle, c.group, 0, 0.1, DASH.solid, angle, Math.PI * 2)
        out.line(cx + Math.cos(angle) * plan.radius, cy + Math.sin(angle) * plan.radius,
          plan.leaderEnd[0], plan.leaderEnd[1], DRAFT_PEN.leader, c.group, 0.1, 0.04)
      }
    },
  }
}




