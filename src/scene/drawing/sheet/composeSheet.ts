import { Matrix4, Plane, Vector3, type WebGLRenderer } from 'three'
import { ASSEMBLY_IDENTITY } from '../../../data/caseStudies'
import {
  SHEET_HEIGHT,
  SHEET_WIDTH,
  SHEET_ZONES,
  VIEW_ROTATIONS,
  sectionLinework,
  type DrawingGeometry,
  type DrawingLayout,
  type DrawingView,
} from '../drawingGeometry'
import { buildEdgeSet, extractView, geometryFrom, type EdgeSet } from './edgeExtract'
import { DASH, GROUP, InkBuilder, PEN, type InkText, type TextCell } from './ink'
import { cachedSheet, rememberSheet } from './drawingCache'

/**
 * THE SHEET — every mark on the intro drawing, composed in sheet-plane metres.
 *
 * Model linework is extracted live from Default.glb (edgeExtract), so the side elevation the
 * JGun lifts out of is exactly its own projection. Everything else — dimensions, leaders,
 * datum flags, title block — is anchored to measured model bounds, and every value printed is
 * either measured from the GLB (reference dimensions, in parentheses) or one of the locked
 * JG-035 facts. Units are INCHES (fact sheet G1).
 */

const IN = 0.0254
const inches = (m: number, places = 2) => (m / IN).toFixed(places).replace(/^0\./, '.')

/** Lettering sizes (troika font size, sheet metres). */
const T = {
  micro: 0.0028,
  small: 0.0036,
  note: 0.0042,
  label: 0.0048,
  view: 0.0064,
  title: 0.0112,
  hero: 0.0145,
}

interface Detail {
  letter: string
  source: 'side' | 'section'
  /** Model-space point the detail magnifies. */
  focus: Vector3
  /** Detail circle radius on the sheet (at 2:1). */
  radius: number
  /** Sheet position of the detail circle centre. */
  at: [number, number]
  group: number
  note: string
}

export interface ComposedSheet {
  ink: InkBuilder
  stats: Record<string, number>
  /** Sheet-plane anchor points the camera path / pulse can aim at. */
  marks: Record<string, [number, number]>
}

const viewNamed = (layout: DrawingLayout, name: string): DrawingView => layout.views.find((v) => v.name === name)!

function clipToCircle(data: Float32Array, cx: number, cy: number, r: number): Float32Array {
  const out: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const ax = data[i] - cx, ay = data[i + 1] - cy, bx = data[i + 2] - cx, by = data[i + 3] - cy
    const dx = bx - ax, dy = by - ay
    const A = dx * dx + dy * dy
    const B = 2 * (ax * dx + ay * dy)
    const C = ax * ax + ay * ay - r * r
    const inA = C <= 0
    const inB = bx * bx + by * by <= r * r
    if (inA && inB) {
      out.push(data[i], data[i + 1], data[i + 2], data[i + 3])
      continue
    }
    const disc = B * B - 4 * A * C
    if (A < 1e-18 || disc <= 0) continue
    const sq = Math.sqrt(disc)
    const t0 = Math.max(0, (-B - sq) / (2 * A))
    const t1 = Math.min(1, (-B + sq) / (2 * A))
    if (t1 <= t0) continue
    out.push(data[i] + dx * t0, data[i + 1] + dy * t0, data[i] + dx * t1, data[i + 1] + dy * t1)
  }
  return new Float32Array(out)
}

/** Sweep order over a rect: left -> right with a slight top-down lean, normalised 0..1. */
const sweep = (rect: [number, number, number, number], span = 0.82) => (x: number, y: number) =>
  Math.min(1, Math.max(0, ((x - rect[0]) / rect[2]) * span + (1 - (y - rect[1]) / rect[3]) * (1 - span) * 0.9))

export function composeSheet(gl: WebGLRenderer, data: DrawingGeometry, layout: DrawingLayout): ComposedSheet {
  const started = performance.now()
  const cached = cachedSheet(data, layout)
  if (cached) return cached
  const ink = new InkBuilder()
  const stats: Record<string, number> = {}
  const marks: Record<string, [number, number]> = {}
  const position = data.geometry.getAttribute('position').array as Float32Array
  const edges: EdgeSet = buildEdgeSet(position)
  stats.edgeSetMs = performance.now() - started
  stats.hardEdges = edges.hard.length / 6
  stats.smoothEdges = edges.smooth.length / 6
  const geometry = geometryFrom(position)
  const sectionClip = new Plane(new Vector3(0, -1, 0), 0)
  const sideView = viewNamed(layout, 'side')
  const handle = data.units.handle
  const motorAxisX = data.units.housing ? (data.units.housing.min.x + data.units.housing.max.x) / 2 : 0
  const motorCenter = handle ? new Vector3(motorAxisX, 0, handle.min.z + 0.03).applyMatrix4(sideView.transform) : null
  const motorWindow = motorCenter ? { x: motorCenter.x, y: motorCenter.y, rx: 0.019, ry: 0.011 } : null
  // Split actual CAD segments at the oval; retain the exterior outside and the cut inside.
  const ovalClip = (segments: Float32Array, inside: boolean) => {
    if (!motorWindow) return inside ? new Float32Array() : segments
    const out: number[] = [], { x, y, rx, ry } = motorWindow
    for (let i = 0; i < segments.length; i += 4) {
      const ax = segments[i], ay = segments[i + 1], dx = segments[i + 2] - ax, dy = segments[i + 3] - ay
      const px = (ax - x) / rx, py = (ay - y) / ry, vx = dx / rx, vy = dy / ry
      const a = vx * vx + vy * vy, b = 2 * (px * vx + py * vy), c = px * px + py * py - 1
      const disc = b * b - 4 * a * c
      const cuts = [0, 1]
      if (a > 1e-18 && disc > 0) for (const t of [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)]) if (t > 0 && t < 1) cuts.push(t)
      cuts.sort((a, b) => a - b)
      for (let j = 1; j < cuts.length; j++) {
        const lo = cuts[j - 1], hi = cuts[j], mid = (lo + hi) / 2
        if (((px + vx * mid) ** 2 + (py + vy * mid) ** 2 <= 1) === inside) out.push(ax + dx * lo, ay + dy * lo, ax + dx * hi, ay + dy * hi)
      }
    }
    return new Float32Array(out)
  }

  // ---- Model views --------------------------------------------------------------------------
  const viewGroups: Record<string, number> = {
    side: GROUP.side,
    top: GROUP.top,
    section: GROUP.section,
    front: GROUP.front,
    rear: GROUP.rear,
    bottom: GROUP.bottom,
  }
  for (const view of layout.views) {
    const t0 = performance.now()
    const lines = extractView(gl, geometry, edges, {
      transform: view.transform,
      rect: view.rect,
      resolution: view.scale >= 1 ? 7000 : 9000,
      clip: view.section ? sectionClip : undefined,
    })
    const group = viewGroups[view.name]
    const order = sweep(view.rect)
    ink.segments(view.name === 'side' ? ovalClip(lines.outline, false) : lines.outline, view.scale >= 1 ? PEN.outline : PEN.edge, group, (x, y) => order(x, y) * 0.86, 0.1)
    ink.segments(view.name === 'side' ? ovalClip(lines.edges, false) : lines.edges, view.scale >= 1 ? PEN.edge : PEN.thin, group, (x, y) => order(x, y) * 0.86 + 0.02, 0.1)
    if (view.name === 'side' && motorWindow) {
      const cutView = extractView(gl, geometry, edges, { transform: view.transform, rect: view.rect, resolution: 7000, clip: sectionClip })
      ink.segments(ovalClip(cutView.outline, true), PEN.edge, group, () => 0.4, 0.1)
      ink.segments(ovalClip(cutView.edges, true), PEN.thin, group, () => 0.4, 0.1)
      const cut = sectionLinework(position, view.transform, 0.0019)
      ink.segments(ovalClip(cut.cut, true), PEN.edge, group, () => 0.4, 0.1)
      ink.segments(ovalClip(cut.hatch, true), PEN.fine, GROUP.hatch, () => 0.4, 0.1)
      const boundary: [number, number][] = Array.from({ length: 97 }, (_, i) => {
        const a = i * Math.PI * 2 / 96, rag = 1 + 0.035 * Math.sin(a * 13)
        return [motorWindow.x + motorWindow.rx * Math.cos(a) * rag, motorWindow.y + motorWindow.ry * Math.sin(a) * rag]
      })
      ink.path(boundary, PEN.thin, group, 0.4, 0.1)
      marks.airMotorCutaway = [motorWindow.x, motorWindow.y]
      stats.airMotorCutDepth = handle!.max.y
      stats.airMotorCutSegments = ovalClip(cutView.edges, true).length / 4
    }
    stats[`${view.name}Segments`] = (lines.outline.length + lines.edges.length) / 4
    stats[`${view.name}Ms`] = performance.now() - t0
    if (view.section) {
      const cut = sectionLinework(position, view.transform, 0.0019)
      ink.segments(cut.cut, PEN.outline, GROUP.section, (x, y) => order(x, y) * 0.8 + 0.12, 0.08)
      ink.segments(cut.hatch, PEN.fine, GROUP.hatch, (x, y) => order(x, y), 0.12)
      stats.hatch = cut.hatch.length / 4
    }
  }

  const side = viewNamed(layout, 'side')
  const toSide = (p: Vector3): [number, number] => {
    const q = p.clone().applyMatrix4(side.transform)
    return [q.x, q.y]
  }
  const b = data.bounds
  const u = data.units
  // Drivetrain axis: centre of the gearbox housing in model x/y.
  const axisX = u.housing ? (u.housing.min.x + u.housing.max.x) / 2 : 0
  const axisPoint = (z: number) => new Vector3(axisX, 0, z)

  // ---- Detail views (2:1) -------------------------------------------------------------------
  const details: Detail[] = []
  if (u.fork)
    details.push({
      letter: 'B',
      source: 'section',
      focus: new Vector3(axisX - 0.008, 0, (u.fork.min.z + u.fork.max.z) / 2),
      radius: 0.05,
      at: [0.322, 0.03],
      group: GROUP.detailB,
      note: 'CLUTCH SHIFT — 2-SPEED SELECTOR',
    })
  if (u.output)
    details.push({
      letter: 'C',
      source: 'side',
      focus: new Vector3(axisX, 0, u.output.max.z - 0.014),
      radius: 0.038,
      at: [0.11, 0.175],
      group: GROUP.detailC,
      note: 'OUTPUT SPINDLE',
    })
  if (u.stage4)
    details.push({
      letter: 'D',
      source: 'section',
      focus: new Vector3(axisX - 0.012, 0, (u.stage4.min.z + u.stage4.max.z) / 2 - 0.004),
      radius: 0.035,
      at: [0.085, -0.165],
      group: GROUP.detailD,
      note: 'PLANETARY STAGE — CUT IN HOUSE',
    })
  for (const d of details) {
    const R = VIEW_ROTATIONS.side
    const focusOnPlane = d.focus.clone().applyMatrix4(R)
    const transform = new Matrix4()
      .makeTranslation(d.at[0] - focusOnPlane.x * 2, d.at[1] - focusOnPlane.y * 2, 0)
      .multiply(new Matrix4().makeScale(2, 2, 2))
      .multiply(R)
    const rect: [number, number, number, number] = [d.at[0] - d.radius, d.at[1] - d.radius, d.radius * 2, d.radius * 2]
    const lines = extractView(gl, geometry, edges, {
      transform,
      rect,
      resolution: 9000,
      clip: d.source === 'section' ? sectionClip : undefined,
    })
    const order = sweep(rect)
    ink.segments(clipToCircle(lines.outline, d.at[0], d.at[1], d.radius), PEN.outline, d.group, (x, y) => 0.18 + order(x, y) * 0.66, 0.1)
    ink.segments(clipToCircle(lines.edges, d.at[0], d.at[1], d.radius), PEN.edge, d.group, (x, y) => 0.2 + order(x, y) * 0.66, 0.1)
    if (d.source === 'section') {
      const cut = sectionLinework(position, transform, 0.0016)
      ink.segments(clipToCircle(cut.cut, d.at[0], d.at[1], d.radius), PEN.outline, d.group, (x, y) => 0.25 + order(x, y) * 0.6, 0.08)
      ink.segments(clipToCircle(cut.hatch, d.at[0], d.at[1], d.radius), PEN.fine, d.group, (x, y) => 0.3 + order(x, y) * 0.6, 0.12)
    }
    // Detail frame: the circle draws first, then the magnified part inks inside it.
    ink.circle(d.at[0], d.at[1], d.radius, PEN.edge, d.group, 0, 0.18, DASH.solid, Math.PI / 2)
    ink.text({ text: `DETAIL ${d.letter}`, x: d.at[0], y: d.at[1] - d.radius - 0.009, size: T.view, anchorX: 'center', anchorY: 'middle', weight: 'semibold', letterSpacing: 0.06, group: d.group, key: 0.1 })
    ink.line(d.at[0] - 0.017, d.at[1] - d.radius - 0.0135, d.at[0] + 0.017, d.at[1] - d.radius - 0.0135, PEN.thin, d.group, 0.12, 0.05)
    ink.text({ text: 'SCALE 2:1', x: d.at[0], y: d.at[1] - d.radius - 0.018, size: T.small, anchorX: 'center', anchorY: 'middle', letterSpacing: 0.08, group: d.group, key: 0.14 })
    ink.text({ text: d.note, x: d.at[0], y: d.at[1] - d.radius - 0.0235, size: T.micro, anchorX: 'center', anchorY: 'middle', letterSpacing: 0.08, group: d.group, key: 0.16, opacity: 0.85 })
    // Callout circle + letter on the source view.
    const srcView = viewNamed(layout, d.source)
    const c = d.focus.clone().applyMatrix4(srcView.transform)
    const rSrc = (d.radius / 2) * srcView.scale
    ink.circle(c.x, c.y, rSrc, PEN.thin, d.group, 0.0, 0.12, DASH.phantom)
    const lx = c.x + rSrc * 0.78
    const ly = c.y + rSrc * 0.78
    ink.line(lx, ly, lx + 0.008, ly + 0.008, PEN.thin, d.group, 0.08, 0.03)
    ink.text({ text: d.letter, x: lx + 0.011, y: ly + 0.011, size: T.view, anchorX: 'center', anchorY: 'middle', weight: 'semibold', group: d.group, key: 0.1 })
    marks[`detail${d.letter}`] = d.at
  }

  // ---- View titles + centre lines -----------------------------------------------------------
  for (const view of layout.views) {
    const group = viewGroups[view.name]
    const [x, y, w] = view.rect
    const cx = x + w / 2
    const ty = y - (view.name === 'side' ? 0.016 : 0.009)
    const size = view.name === 'side' ? T.view * 1.25 : T.view
    ink.text({ text: view.label, x: cx, y: ty, size, anchorX: 'center', anchorY: 'middle', weight: 'semibold', letterSpacing: 0.06, group, key: 0.86, dur: 0.1 })
    const half = view.label.length * size * 0.26
    ink.line(cx - half, ty - size * 0.62, cx + half, ty - size * 0.62, PEN.thin, group, 0.88, 0.06)
    ink.text({ text: view.scaleLabel, x: cx, y: ty - size * 1.25, size: T.small, anchorX: 'center', anchorY: 'middle', letterSpacing: 0.08, group, key: 0.9 })
    marks[view.name] = [cx, y + view.rect[3] / 2]
  }
  // Drivetrain centre lines on every view that sees the axis side-on or end-on.
  const zSpan = [b.min.z - 0.012, b.max.z + 0.012]
  for (const name of ['side', 'section', 'top', 'bottom']) {
    const view = viewNamed(layout, name)
    const p0 = axisPoint(zSpan[0]).applyMatrix4(view.transform)
    const p1 = axisPoint(zSpan[1]).applyMatrix4(view.transform)
    ink.line(p1.x, p1.y, p0.x, p0.y, PEN.fine, viewGroups[name], 0.0, 0.3, DASH.center)
  }
  for (const name of ['front', 'rear']) {
    const view = viewNamed(layout, name)
    const c = axisPoint(0).applyMatrix4(view.transform)
    const r = 0.034 * view.scale + 0.006
    ink.line(c.x - r, c.y, c.x + r, c.y, PEN.fine, viewGroups[name], 0, 0.2, DASH.center)
    ink.line(c.x, c.y - r, c.x, c.y + r, PEN.fine, viewGroups[name], 0, 0.2, DASH.center)
  }

  // ---- Section A–A cutting plane on the plan view -------------------------------------------
  {
    const top = viewNamed(layout, 'top')
    const a = axisPoint(zSpan[1] + 0.006).applyMatrix4(top.transform)
    const c = axisPoint(zSpan[0] - 0.006).applyMatrix4(top.transform)
    // Model y = 0 is the plan view's horizontal through the axis only if axis y = 0 (it is).
    const y = new Vector3(axisX, 0, 0).applyMatrix4(top.transform).y
    ink.line(a.x, y, c.x, y, PEN.edge, GROUP.section, 0, 0.3, DASH.phantom)
    for (const x of [a.x, c.x]) {
      ink.line(x, y, x, y + 0.009, PEN.edge, GROUP.section, 0.05, 0.05)
      ink.arrow(x, y + 0.012, 0, 1, GROUP.section, 0.08, 0.0035)
      ink.text({ text: 'A', x: x + (x < a.x + 1e-6 ? -0.006 : 0.006), y: y + 0.013, size: T.view, anchorX: 'center', anchorY: 'middle', weight: 'semibold', group: GROUP.section, key: 0.1 })
    }
  }

  // ---- Side view: dimensions (reference, measured from the GLB) ------------------------------
  const sideRect = side.rect
  const top = sideRect[1] + sideRect[3]
  const right = sideRect[0] + sideRect[2]
  const dimH = (x1: number, x2: number, yPart1: number, yPart2: number, yDim: number, text: string, key: number) => {
    const g = GROUP.sideDims
    const gap = 0.0015
    const over = 0.002
    const dir1 = Math.sign(yDim - yPart1) || 1
    ink.line(x1, yPart1 + dir1 * gap, x1, yDim + dir1 * over, PEN.fine, g, key, 0.05)
    ink.line(x2, yPart2 + dir1 * gap, x2, yDim + dir1 * over, PEN.fine, g, key, 0.05)
    const mid = (x1 + x2) / 2
    ink.line(mid, yDim, x1, yDim, PEN.fine, g, key + 0.04, 0.06)
    ink.line(mid, yDim, x2, yDim, PEN.fine, g, key + 0.04, 0.06)
    ink.arrow(x1, yDim, -Math.sign(x2 - x1), 0, g, key + 0.09)
    ink.arrow(x2, yDim, Math.sign(x2 - x1), 0, g, key + 0.09)
    ink.text({ text, x: mid, y: yDim + 0.0035, size: T.label, anchorX: 'center', anchorY: 'bottom', group: g, key: key + 0.1, letterSpacing: 0.04 })
  }
  const dimV = (y1: number, y2: number, xPart1: number, xPart2: number, xDim: number, text: string, key: number) => {
    const g = GROUP.sideDims
    const dir = Math.sign(xDim - xPart1) || 1
    ink.line(xPart1 + dir * 0.0015, y1, xDim + dir * 0.002, y1, PEN.fine, g, key, 0.05)
    ink.line(xPart2 + dir * 0.0015, y2, xDim + dir * 0.002, y2, PEN.fine, g, key, 0.05)
    const mid = (y1 + y2) / 2
    ink.line(xDim, mid, xDim, y1, PEN.fine, g, key + 0.04, 0.06)
    ink.line(xDim, mid, xDim, y2, PEN.fine, g, key + 0.04, 0.06)
    ink.arrow(xDim, y1, 0, -Math.sign(y2 - y1), g, key + 0.09)
    ink.arrow(xDim, y2, 0, Math.sign(y2 - y1), g, key + 0.09)
    ink.text({ text, x: xDim - 0.0035, y: mid, size: T.label, anchorX: 'center', anchorY: 'bottom', rotation: Math.PI / 2, group: g, key: key + 0.1, letterSpacing: 0.04 })
  }
  // Overall length (snout face to handle rear).
  const snout = toSide(new Vector3(axisX, 0, b.max.z))
  const rearEnd = toSide(new Vector3(axisX, 0, b.min.z))
  const housingTop = u.housing ? toSide(new Vector3(u.housing.min.x, 0, u.housing.max.z)) : snout
  dimH(snout[0], rearEnd[0], snout[1], rearEnd[1], top + 0.03, `(${inches(b.max.z - b.min.z)})`, 0.05)
  if (u.housing && u.handle) {
    const hRear = toSide(new Vector3(u.housing.min.x, 0, u.housing.min.z))
    dimH(snout[0], hRear[0], housingTop[1], hRear[1], top + 0.016, `(${inches(b.max.z - u.housing.min.z)})`, 0.2)
    dimH(hRear[0], rearEnd[0], hRear[1], rearEnd[1], top + 0.016, `(${inches(u.housing.min.z - b.min.z)})`, 0.3)
  }
  // Overall height (tool top to grip base) on the right.
  const topPt = toSide(new Vector3(b.min.x, 0, 0))
  const basePt = toSide(new Vector3(b.max.x, 0, 0))
  dimV(basePt[1], topPt[1], right - 0.02, right - 0.02, right + 0.018, `(${inches(b.max.x - b.min.x)})`, 0.4)
  // Gearbox housing diameter, measured at the snout end.
  if (u.housing) {
    const d = u.housing.max.x - u.housing.min.x
    const z = u.housing.max.z - 0.03
    const p1 = toSide(new Vector3(u.housing.min.x, 0, z))
    const p2 = toSide(new Vector3(u.housing.max.x, 0, z))
    const x = sideRect[0] - 0.014
    dimV(p2[1], p1[1], p1[0] - 0.02, p2[0] - 0.02, x, `⌀${inches(d, 3)}`, 0.5)
    // Datum A flag hangs off the housing diameter (the journals it locates run inside it).
    const fy = p2[1] - 0.012
    ink.line(x, p2[1] - 0.0005, x, fy + 0.004, PEN.thin, GROUP.gdt, 0.1, 0.05)
    ink.tri(x - 0.0024, p2[1] - 0.0005, x + 0.0024, p2[1] - 0.0005, x, p2[1] - 0.0045, GROUP.gdt, 0.12)
    ink.rect(x - 0.0042, fy - 0.0042, 0.0084, 0.0084, PEN.thin, GROUP.gdt, 0.14, 0.06)
    ink.text({ text: 'A', x, y: fy, size: T.label * 1.1, anchorX: 'center', anchorY: 'middle', weight: 'semibold', group: GROUP.gdt, key: 0.2 })
    marks.datumA = [x, fy]
  }

  // ---- Side view: leaders to named parts ----------------------------------------------------
  const leader = (anchor: [number, number], label: [number, number], lines: string[], key: number, placement?: { elbowX: number; width: number; textRight?: boolean }) => {
    const g = GROUP.sideLabels
    const left = label[0] < anchor[0]
    const shelf = placement?.elbowX ?? (left ? label[0] + 0.004 : label[0] - 0.004)
    const end = placement ? label[0] + (placement.textRight ? -1 : 1) * (placement.width / 2 + 0.0015) : label[0]
    ink.path([[anchor[0], anchor[1]], [shelf, label[1]], [end, label[1]]], PEN.thin, g, key, 0.08)
    ink.tri(anchor[0] - 0.0009, anchor[1] - 0.0009, anchor[0] + 0.0009, anchor[1] - 0.0009, anchor[0], anchor[1] + 0.0011, g, key)
    lines.forEach((text, i) =>
      ink.text({
        text,
        x: placement ? label[0] : left ? label[0] - 0.0015 : label[0] + 0.0015,
        y: label[1] - i * 0.0062,
        size: i === 0 ? T.label : T.micro,
        anchorX: placement ? 'center' : left ? 'right' : 'left',
        anchorY: 'middle',
        weight: i === 0 ? 'semibold' : 'medium',
        letterSpacing: 0.05,
        group: g,
        key: key + 0.06 + i * 0.03,
      }),
    )
  }
  if (u.housing) {
    const a = toSide(new Vector3(axisX + 0.0145, 0, u.housing.min.z + 0.027))
    const label: [number, number] = [a[0] - 0.065, a[1] - 0.100]
    marks.gearboxCallout = label
    marks.gearboxLeaderAnchor = a
    leader(a, label, ['GEARBOX HOUSING', 'P000245 · MULTI-STAGE PLANETARY'], 0.1, { elbowX: a[0] - 0.019, width: 0.05 })
  }
  if (u.clutch) {
    // Owner's green endpoint is on the narrow housing next to the selector band,
    // not the centre of the combined static-clutch bounds (which projects onto the ring).
    const housingZ = u.ringSwitch ? u.ringSwitch.max.z + 0.0084 : (u.clutch.min.z + u.clutch.max.z) / 2
    const a = toSide(new Vector3(axisX + 0.006, 0, housingZ))
    const label: [number, number] = [a[0] - 0.079, a[1] - 0.154]
    marks.clutchCallout = label
    marks.clutchLeaderAnchor = a
    leader(a, label, ['CLUTCH HOUSING', 'P000420 · ⌀2.525 H7/k6'], 0.25, { elbowX: a[0] - 0.027, width: 0.046 })
  }
  if (u.ringSwitch) {
    const a = toSide(new Vector3(axisX + 0.024, 0, (u.ringSwitch.min.z + u.ringSwitch.max.z) / 2))
    const label: [number, number] = [a[0] + 0.026, a[1] - 0.157]
    marks.ringSwitchCallout = label
    marks.ringSwitchLeaderAnchor = a
    leader(a, label, ['RING SWITCH', 'P003068 · 2-SPEED'], 0.4, { elbowX: a[0] - 0.023, width: 0.035, textRight: true })
  }
  if (u.output) {
    const a = toSide(new Vector3(axisX + 0.006, 0, u.output.max.z - 0.010))
    const label: [number, number] = [a[0] + 0.0245, a[1] - 0.060]
    marks.outputCallout = label
    marks.outputLeaderAnchor = a
    leader(a, label, ['OUTPUT SPINDLE', 'P000095'], 0.55, { elbowX: a[0] - 0.019, width: 0.046, textRight: true })
  }
  if (u.handle) {
    const a: [number, number] = marks.airMotorCutaway
    const label: [number, number] = [a[0] + 0.069, top + 0.018]
    marks.airMotorCallout = label
    leader(a, label, ['AIR MOTOR', 'BALANCED VANE ASSEMBLY'], 0.7)
  }

  // ---- Feature control frames on the elevation ----------------------------------------------
  const fcf = (x: number, y: number, cells: (string | 'runout' | 'total' | 'profile' | 'flat')[], key: number, group = GROUP.gdt) => {
    const h = 0.0072
    const widths = cells.map((c) => (c === 'runout' || c === 'total' || c === 'profile' || c === 'flat' ? h : Math.max(h, c.length * 0.0027 + 0.004)))
    let cx = x
    const total = widths.reduce((s, w) => s + w, 0)
    ink.rect(x, y - h / 2, total, h, PEN.thin, group, key, 0.08)
    cells.forEach((c, i) => {
      const w = widths[i]
      if (i > 0) ink.line(cx, y - h / 2, cx, y + h / 2, PEN.thin, group, key + 0.06 + i * 0.03, 0.03)
      const mx = cx + w / 2
      const k = key + 0.08 + i * 0.04
      if (c === 'runout' || c === 'total') gdtRunout(ink, mx, y, h * 0.62, c === 'total', group, k)
      else if (c === 'profile') gdtProfile(ink, mx, y, h * 0.6, group, k)
      else if (c === 'flat') gdtFlatness(ink, mx, y, h * 0.62, group, k)
      else ink.text({ text: c, x: mx, y, size: T.label, anchorX: 'center', anchorY: 'middle', group, key: k, letterSpacing: 0.02 })
      cx += w
    })
    return total
  }
  if (u.output) {
    const p = toSide(new Vector3(u.output.max.x, 0, u.output.max.z - 0.022))
    // The output note moved below the spindle; its locked frame stays above-left.
    const y = toSide(new Vector3(axisX + 0.006, 0, u.output.max.z - 0.004))[1] + 0.070
    const shelf = p[0] - (y - p[1]) * 0.625
    const x = shelf - 0.039
    ink.path([[p[0], p[1]], [shelf, y], [x + 0.033, y]], PEN.thin, GROUP.gdt, 0.3, 0.05)
    ink.arrow(p[0], p[1], 0.625, -1, GROUP.gdt, 0.32, 0.0028)
    fcf(x, y, ['total', '.001', 'A-B'], 0.34)
    marks.outputGdt = [x, y]
  }
  if (u.clutch) {
    const [lx, ly] = marks.clutchCallout
    const y = ly - 0.016
    // Share the housing callout's feature leader instead of crossing it with a second one.
    ink.path([[lx + 0.0245, ly], [lx + 0.0245, y], [lx + 0.0185, y]], PEN.thin, GROUP.gdt, 0.5, 0.05)
    fcf(lx - 0.0185, y, ['profile', '.004', 'A', 'E'], 0.52)
    marks.clutchGdt = [lx - 0.0185, y]
  }

  // ---- Sheet furniture: trim, border, zones --------------------------------------------------
  const { border, frame, titleBlock: tb, revisionBlock: rb, notes } = SHEET_ZONES
  ink.rect(border.x, border.y, border.w, border.h, PEN.border, GROUP.printed)
  ink.rect(frame.x, frame.y, frame.w, frame.h, PEN.edge, GROUP.printed)
  const cols = 8
  const rows = 6
  for (let i = 0; i <= cols; i += 1) {
    const x = border.x + (border.w * i) / cols
    if (i > 0 && i < cols) {
      ink.line(x, border.y, x, frame.y, PEN.thin, GROUP.printed)
      ink.line(x, border.y + border.h, x, frame.y + frame.h, PEN.thin, GROUP.printed)
    }
    if (i < cols) {
      const cx = x + border.w / cols / 2
      for (const y of [(border.y + frame.y) / 2, (border.y + border.h + frame.y + frame.h) / 2])
        ink.text({ text: String(i + 1), x: cx, y, size: T.small, anchorX: 'center', anchorY: 'middle', group: GROUP.printed, key: 0 })
    }
  }
  for (let j = 0; j <= rows; j += 1) {
    const y = border.y + (border.h * j) / rows
    if (j > 0 && j < rows) {
      ink.line(border.x, y, frame.x, y, PEN.thin, GROUP.printed)
      ink.line(border.x + border.w, y, frame.x + frame.w, y, PEN.thin, GROUP.printed)
    }
    if (j < rows) {
      const cy = y + border.h / rows / 2
      const letter = String.fromCharCode(70 - j)
      for (const x of [(border.x + frame.x) / 2, (border.x + border.w + frame.x + frame.w) / 2])
        ink.text({ text: letter, x, y: cy, size: T.small, anchorX: 'center', anchorY: 'middle', group: GROUP.printed, key: 0 })
    }
  }
  // Centring marks at the trim midpoints.
  for (const [x, y, dx, dy] of [[0, SHEET_HEIGHT / 2, 0, -1], [0, -SHEET_HEIGHT / 2, 0, 1], [SHEET_WIDTH / 2, 0, -1, 0], [-SHEET_WIDTH / 2, 0, 1, 0]]) {
    ink.line(x, y, x + dx * 0.018, y + dy * 0.018, PEN.edge, GROUP.printed)
  }

  // ---- Title block ----------------------------------------------------------------------------
  {
    const firstText = ink.texts.length
    const g = GROUP.titleBlock
    const x0 = tb.x, y0 = tb.y, w = tb.w, h = tb.h
    ink.rect(x0, y0, w, h, PEN.border, g, 0, 0.2)
    const split = x0 + w * 0.46
    ink.line(split, y0, split, y0 + h, PEN.edge, g, 0.1, 0.1)
    // Right: project title, dwg no / rev, scale / sheet / date, tagline.
    const rows = [y0 + h * 0.52, y0 + h * 0.34, y0 + h * 0.17]
    for (const y of rows) ink.line(split, y, x0 + w, y, PEN.edge, g, 0.15, 0.1)
    ink.text({ text: 'PROJECT:', x: split + 0.003, y: y0 + h - 0.005, size: T.micro, anchorY: 'top', letterSpacing: 0.08, group: g, key: 0.2 })
    ink.text({ text: 'HIGH-PRECISION\nINDUSTRIAL\nTORQUE GUN', x: split + (x0 + w - split) / 2, y: y0 + h * 0.72, size: 0.0062, anchorX: 'center', anchorY: 'middle', weight: 'semibold', letterSpacing: 0.03, lineHeight: 1.05, group: g, key: 0.25, dur: 0.18 })
    const c2 = split + (x0 + w - split) * 0.62
    ink.line(c2, rows[1], c2, rows[0], PEN.edge, g, 0.3, 0.05)
    ink.text({ text: 'DWG NO.', x: split + 0.003, y: rows[0] - 0.003, size: T.micro, anchorY: 'top', letterSpacing: 0.08, group: g, key: 0.35 })
    ink.text({ text: ASSEMBLY_IDENTITY.drawingNumber, x: (split + c2) / 2, y: rows[1] + 0.0065, size: T.view * 1.1, anchorX: 'center', anchorY: 'middle', weight: 'semibold', letterSpacing: 0.06, group: g, key: 0.38 })
    ink.text({ text: 'REV', x: c2 + 0.003, y: rows[0] - 0.003, size: T.micro, anchorY: 'top', letterSpacing: 0.08, group: g, key: 0.4 })
    ink.text({ text: ASSEMBLY_IDENTITY.revision.replace('REV', ''), x: (c2 + x0 + w) / 2, y: rows[1] + 0.0065, size: T.view * 1.1, anchorX: 'center', anchorY: 'middle', weight: 'semibold', group: g, key: 0.42 })
    const s1 = split + (x0 + w - split) * 0.33
    const s2 = split + (x0 + w - split) * 0.62
    ink.line(s1, rows[2], s1, rows[1], PEN.edge, g, 0.44, 0.04)
    ink.line(s2, rows[2], s2, rows[1], PEN.edge, g, 0.44, 0.04)
    const cells: [number, number, string, string][] = [
      [split, s1, 'SCALE:', '1:1'],
      [s1, s2, 'SHEET:', '1 OF 1'],
      [s2, x0 + w, 'UNITS:', 'INCHES'],
    ]
    cells.forEach(([a, c, label, value], i) => {
      ink.text({ text: label, x: a + 0.003, y: rows[1] - 0.003, size: T.micro, anchorY: 'top', letterSpacing: 0.08, group: g, key: 0.46 + i * 0.02 })
      ink.text({ text: value, x: (a + c) / 2, y: rows[2] + 0.0045, size: T.label, anchorX: 'center', anchorY: 'middle', weight: 'semibold', group: g, key: 0.48 + i * 0.02 })
    })
    ink.text({ text: 'MACHINED COMPLETE ON 7-AXIS MILL-TURN', x: split + (x0 + w - split) / 2, y: y0 + h * 0.085, size: T.small, anchorX: 'center', anchorY: 'middle', weight: 'semibold', letterSpacing: 0.06, group: g, key: 0.55 })
    // Left: tolerance block + projection symbol.
    const l1 = y0 + h * 0.36
    ink.line(x0, l1, split, l1, PEN.edge, g, 0.5, 0.08)
    const tol = [
      'UNLESS OTHERWISE SPECIFIED:',
      'DIMENSIONS ARE IN INCHES',
      'INTERPRET PER ASME Y14.5',
      'GEARED PARTS: RUNOUT < .001 TIR',
      'GEARS: ISO 1328 GRADE A6',
    ]
    tol.forEach((text, i) => ink.text({ text, x: x0 + 0.004, y: y0 + h - 0.006 - i * 0.0078, size: i === 0 ? T.micro : T.small, anchorY: 'middle', letterSpacing: 0.05, weight: i === 0 ? 'medium' : 'medium', group: g, key: 0.55 + i * 0.03 }))
    // Third-angle projection symbol.
    const px = x0 + 0.022
    const py = y0 + h * 0.18
    ink.circle(px, py, 0.0065, PEN.thin, g, 0.7, 0.05)
    ink.circle(px, py, 0.0032, PEN.thin, g, 0.72, 0.05)
    ink.line(px - 0.011, py, px + 0.011, py, PEN.fine, g, 0.74, 0.03, DASH.center)
    ink.path([[px + 0.015, py - 0.0035], [px + 0.015, py + 0.0035], [px + 0.034, py + 0.0065], [px + 0.034, py - 0.0065], [px + 0.015, py - 0.0035]], PEN.thin, g, 0.75, 0.06)
    ink.text({ text: 'THIRD ANGLE\nPROJECTION', x: px + 0.04, y: py, size: T.micro, anchorY: 'middle', letterSpacing: 0.08, lineHeight: 1.2, group: g, key: 0.8 })
    for (const item of ink.texts.slice(firstText)) {
      let cell: TextCell
      if (item.x < split) {
        cell = item.y > l1
          ? { x: x0, y: l1, w: split - x0, h: y0 + h - l1 }
          : { x: px + 0.039, y: y0, w: split - px - 0.039, h: l1 - y0 }
      } else if (item.y > rows[0]) {
        cell = item.text === 'PROJECT:'
          ? { x: split, y: y0 + h - 0.011, w: x0 + w - split, h: 0.011 }
          : { x: split, y: rows[0], w: x0 + w - split, h: y0 + h - 0.011 - rows[0] }
      } else if (item.y > rows[1]) {
        const a = item.x < c2 ? split : c2
        const b = item.x < c2 ? c2 : x0 + w
        cell = { x: a, y: rows[1], w: b - a, h: rows[0] - rows[1] }
      } else if (item.y > rows[2]) {
        const a = item.x < s1 ? split : item.x < s2 ? s1 : s2
        const b = item.x < s1 ? s1 : item.x < s2 ? s2 : x0 + w
        cell = { x: a, y: rows[2], w: b - a, h: rows[1] - rows[2] }
      } else cell = { x: split, y: y0, w: x0 + w - split, h: rows[2] - y0 }
      fitTitleText(item, cell)
    }
    marks.titleBlock = [x0 + w / 2, y0 + h / 2]
    marks.titleText = [split + (x0 + w - split) / 2, y0 + h * 0.72]
  }

  // ---- Revision block ---------------------------------------------------------------------------
  {
    const g = GROUP.titleBlock
    const { x, y, w, h } = rb
    ink.rect(x, y, w, h, PEN.edge, g, 0.1, 0.12)
    const colsX = [x + 0.018, x + 0.06, x + w - 0.048, x + w - 0.024]
    for (const cx of colsX) ink.line(cx, y, cx, y + h, PEN.thin, g, 0.2, 0.04)
    const r1 = y + h - 0.009
    ink.line(x, r1, x + w, r1, PEN.thin, g, 0.2, 0.06)
    const heads = ['REV', 'DATE', 'DESCRIPTION', 'DRN', 'APPD']
    const boundaries = [x, ...colsX, x + w]
    const centres = [(x + colsX[0]) / 2, (colsX[0] + colsX[1]) / 2, (colsX[1] + colsX[2]) / 2, (colsX[2] + colsX[3]) / 2, (colsX[3] + x + w) / 2]
    heads.forEach((t, i) => {
      const item: InkText = { text: t, x: centres[i], y: r1 + 0.0045, size: T.micro, anchorX: 'center', anchorY: 'middle', letterSpacing: 0.08, weight: 'semibold', group: g, key: 0.25 }
      fitTitleText(item, { x: boundaries[i], y: r1, w: boundaries[i + 1] - boundaries[i], h: y + h - r1 })
      ink.text(item)
    })
    const rowsData = [
      ['03', '2026-09-25', 'TOLERANCES RELEASED — DATUMS A–E', 'M.H.', 'M.H.'],
      ['02', '2026-09-08', '2-SPEED CLUTCH KINEMATICS', 'M.H.', 'M.H.'],
      ['01', '2026-08-24', 'INITIAL RELEASE', 'M.H.', 'M.H.'],
    ]
    rowsData.forEach((row, j) => {
      const ry = r1 - 0.0045 - j * 0.0085
      if (j > 0) ink.line(x, ry + 0.00425, x + w, ry + 0.00425, PEN.fine, g, 0.3, 0.04)
      row.forEach((t, i) => {
        const item: InkText = { text: t, x: centres[i], y: ry, size: T.micro, anchorX: 'center', anchorY: 'middle', letterSpacing: 0.04, group: g, key: 0.32 + j * 0.05 }
        const bottom = j === rowsData.length - 1 ? y : r1 - 0.00025 - (j + 1) * 0.0085
        const top = j === 0 ? r1 : ry + 0.00425
        fitTitleText(item, { x: boundaries[i], y: bottom, w: boundaries[i + 1] - boundaries[i], h: top - bottom })
        ink.text(item)
      })
    })
  }

  // ---- General notes ------------------------------------------------------------------------------
  {
    const g = GROUP.notes
    const { x, y, w, h } = notes
    ink.rect(x, y, w, h, PEN.edge, g, 0, 0.15)
    ink.text({ text: 'GENERAL NOTES:', x: x + 0.004, y: y + h - 0.007, size: T.label, anchorY: 'middle', weight: 'semibold', letterSpacing: 0.08, group: g, key: 0.1 })
    ink.line(x + 0.004, y + h - 0.0112, x + 0.052, y + h - 0.0112, PEN.thin, g, 0.12, 0.04)
    const lines = [
      '1. ALL DIMENSIONS ARE IN INCHES. (  ) = REFERENCE.',
      '2. DATUM A: DRIVETRAIN AXIS — P003069 JOURNALS IN P000245.',
      '    B: MOUNTING FACE   C: OUTPUT FACE   D: PLANET BORE   E: FORK END FACE.',
      '3. ALL GEARED PARTS: RUNOUT < .001 TIR.',
      '4. ALL GEARS CUT IN HOUSE — ISO 1328 / AGMA 2015 GRADE A6.',
      '5. INPUT + OUTPUT SHAFTS TURNED AND HOBBED IN ONE CHUCKING.',
      '6. FORK PROFILE MILLED WITH LIVE TOOLING — .004 TOTAL ZONE.',
      '7. CLUTCH HOUSING FIT ⌀2.525 H7/k6 — OD AND ID FINISHED',
      '    AFTER HEAT TREAT.',
      '8. FLANGE MOUNT FACE FLATNESS .0008.',
    ]
    lines.forEach((text, i) => ink.text({ text, x: x + 0.005, y: y + h - 0.018 - i * 0.0086, size: T.small, anchorY: 'middle', letterSpacing: 0.03, group: g, key: 0.16 + i * 0.075, dur: 0.07 }))
    marks.notes = [x + w / 2, y + h / 2]
  }

  // Signature strip under the title block area: the drafter's hand.
  stats.segments = ink.segs.length / 9
  stats.fills = ink.fills.length / 15
  stats.texts = ink.texts.length
  stats.totalMs = performance.now() - started
  geometry.dispose()
  const result = { ink, stats, marks }
  rememberSheet(data, layout, result)
  return result
}

// ---- GD&T characteristic glyphs (ASME Y14.5 proportions), drawn as vector ink ----------------
function gdtRunout(ink: InkBuilder, x: number, y: number, s: number, total: boolean, group: number, key: number) {
  const ax = x - s * 0.35
  const ay = y - s * 0.45
  const bx = x + s * 0.25
  const by = y + s * 0.45
  ink.line(ax, ay, bx, by, 0.00007, group, key, 0.03)
  ink.arrow(bx + s * 0.08, by + s * 0.12, bx - ax, by - ay, group, key + 0.02, s * 0.5)
  if (total) {
    const off = s * 0.4
    ink.line(ax + off, ay, bx + off, by, 0.00007, group, key + 0.01, 0.03)
    ink.arrow(bx + off + s * 0.08, by + s * 0.12, bx - ax, by - ay, group, key + 0.03, s * 0.5)
    ink.line(ax - s * 0.1, ay, ax + off + s * 0.1, ay, 0.00007, group, key, 0.03)
  }
}

function gdtProfile(ink: InkBuilder, x: number, y: number, s: number, group: number, key: number) {
  const r = s * 0.55
  ink.circle(x, y - r * 0.45, r, 0.00007, group, key, 0.04, 0, 0, Math.PI)
  ink.line(x - r, y - r * 0.45, x + r, y - r * 0.45, 0.00007, group, key + 0.02, 0.02)
}

function gdtFlatness(ink: InkBuilder, x: number, y: number, s: number, group: number, key: number) {
  const w = s * 0.9
  const h = s * 0.45
  ink.path([[x - w / 2, y - h / 2], [x + w / 2 - h * 0.6, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2 + h * 0.6, y + h / 2], [x - w / 2, y - h / 2]], 0.00007, group, key, 0.04)
}

export type { TextCell } from './ink'

/** Conservative em bounds for the condensed drawing font, including tracking and line boxes.
 * No wrapping: preserves the authored technical labels and works with the existing text renderer.
 */
export function fitTitleText(item: InkText, cell: TextCell): void {
  item.fitCell = { ...cell }
  const pad = 0.0015
  const lines = item.text.split('\n')
  const widthEm = Math.max(...lines.map((line) => line.length * (0.7 + (item.letterSpacing ?? 0.02))))
  const heightEm = lines.length * (item.lineHeight ?? 1.15)
  const xRoom = item.anchorX === 'center'
    ? 2 * Math.min(item.x - cell.x - pad, cell.x + cell.w - pad - item.x)
    : item.anchorX === 'right' ? item.x - cell.x - pad : cell.x + cell.w - pad - item.x
  const yRoom = item.anchorY === 'top' ? item.y - cell.y - pad
    : item.anchorY === 'bottom' ? cell.y + cell.h - pad - item.y
      : 2 * Math.min(item.y - cell.y - pad, cell.y + cell.h - pad - item.y)
  item.size = Math.min(item.size, Math.max(0, xRoom) * 0.7 / widthEm, Math.max(0, yRoom) * 0.7 / heightEm)
  item.maxWidth = Math.max(0, xRoom)
}
