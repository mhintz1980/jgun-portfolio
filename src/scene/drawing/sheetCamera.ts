import { Vector3 } from 'three'
import { SHEET_ROTATION, type DrawingLayout } from './drawingGeometry'
import { INTRO_PHASES, clamp01, smooth01 } from './introTimeline'
import { GROUP, GROUP_COUNT } from './sheet/ink'

/**
 * THE DRAFTING PASS — intro camera + ink schedule (JG-035 rebuild).
 *
 * Shot list over intro-normalised scroll time t (0..1). Each shot is a dolly camera over the
 * sheet: a look-at point on the paper, a distance, an elevation above the paper (90° = square
 * on) and a heading (0 = looking up the sheet, the way it is read). The camera opens low and
 * tight on the title block's lettering, cranes up across the notes and details as they ink in,
 * rises to an establishing frame of the whole sheet, then descends square-on to the side
 * elevation and hands over to orthographic so the print registers to the model's projection.
 *
 * Sheet coordinates only; everything derives from the layout's view rects so re-laying the
 * sheet re-aims the shots.
 */

interface Shot {
  t: number
  x: number
  y: number
  dist: number
  /** Degrees above the paper. */
  elev: number
  /** Degrees; heading of the view direction across the paper, 0 = toward sheet +y. */
  head: number
  fov: number
  ortho: number
}

export interface SheetCameraPose {
  position: Vector3
  target: Vector3
  up: Vector3
  fov: number
  /** 0 = perspective, 1 = orthographic at the look-at distance. */
  ortho: number
  /** Distance camera -> look-at point. */
  distance: number
}

const centreOf = (r: [number, number, number, number]): [number, number] => [r[0] + r[2] / 2, r[1] + r[3] / 2]

/** Distance at which `width` sheet metres fill the viewport width. */
function fitWidth(width: number, fov: number, aspect: number): number {
  return width / (2 * Math.tan((fov * Math.PI) / 360) * Math.max(aspect, 0.3))
}
function fitHeight(height: number, fov: number): number {
  return height / (2 * Math.tan((fov * Math.PI) / 360))
}

function shots(layout: DrawingLayout, aspect: number): Shot[] {
  const view = (name: string) => layout.views.find((v) => v.name === name)!
  const side = view('side')
  const [sx, sy] = centreOf(side.rect)
  const portrait = aspect < 1
  // Settle: the whole side elevation plus its dimensions, square on.
  const settleW = side.rect[2] + 0.07
  const settleH = side.rect[3] + 0.075
  const settle = Math.max(fitWidth(settleW, 30, aspect), fitHeight(settleH, 30))
  const whole = Math.max(fitWidth(layout.width * 1.02, 34, aspect), fitHeight(layout.height * 1.04, 34))
  const close = portrait ? 0.2 : 0.15
  return [
    // 1. Title block lettering, low and tight, the planetary DETAIL D inking beside it.
    { t: 0.0, x: 0.285, y: -0.212, dist: close, elev: 24, head: -30, fov: 30, ortho: 0 },
    { t: 0.08, x: 0.19, y: -0.17, dist: close * 1.3, elev: 30, head: -18, fov: 30, ortho: 0 },
    // 2. Crane up the right column: section A–A and DETAIL B, into the general notes.
    { t: 0.17, x: 0.25, y: 0.02, dist: 0.28, elev: 40, head: -8, fov: 32, ortho: 0 },
    { t: 0.24, x: 0.25, y: 0.155, dist: 0.28, elev: 44, head: 4, fov: 32, ortho: 0 },
    // 3. Track left along the top band: DETAIL C, bottom and plan views.
    { t: 0.3, x: -0.02, y: 0.16, dist: 0.34, elev: 50, head: 14, fov: 32, ortho: 0 },
    // 4. Establishing: the whole sheet.
    { t: 0.345, x: -0.01, y: -0.005, dist: whole * 1.02, elev: 72, head: 4, fov: 34, ortho: 0 },
    // 5. Descend square-on to the elevation; orthographic by the time the pulse starts.
    { t: INTRO_PHASES.pulseStart, x: sx, y: sy, dist: settle, elev: 90, head: 0, fov: 30, ortho: 1 },
    { t: 0.52, x: sx, y: sy, dist: settle * 0.97, elev: 90, head: 0, fov: 30, ortho: 1 },
  ]
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const scratchF = new Vector3()
const scratchN = new Vector3()

/**
 * Write the intro camera pose for intro time `t`. Catmull-Rom through the shot list on every
 * channel, so the camera moves like a dolly rather than stopping at each shot.
 */
export function introCameraPose(layout: DrawingLayout, aspect: number, t: number, out: SheetCameraPose): SheetCameraPose {
  const list = shots(layout, aspect)
  let i = 0
  while (i < list.length - 2 && t >= list[i + 1].t) i += 1
  const a = list[Math.max(0, i - 1)]
  const b = list[i]
  const c = list[Math.min(list.length - 1, i + 1)]
  const d = list[Math.min(list.length - 1, i + 2)]
  const u = clamp01(c.t > b.t ? (t - b.t) / (c.t - b.t) : 1)
  // Uniform Catmull-Rom: continuous velocity through every shot; the duplicated end shots
  // give the opening and the settle their own ease. Ortho eases on its own.
  const cr = (p0: number, p1: number, p2: number, p3: number) => {
    const s = u
    const s2 = s * s
    const s3 = s2 * s
    return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3)
  }
  const x = cr(a.x, b.x, c.x, d.x)
  const y = cr(a.y, b.y, c.y, d.y)
  const dist = Math.max(0.05, Math.exp(cr(Math.log(a.dist), Math.log(b.dist), Math.log(c.dist), Math.log(d.dist))))
  const elev = Math.min(90, cr(a.elev, b.elev, c.elev, d.elev))
  const head = cr(a.head, b.head, c.head, d.head)
  const fov = cr(a.fov, b.fov, c.fov, d.fov)
  const ortho = lerp(b.ortho, c.ortho, smooth01(u))
  const el = (elev * Math.PI) / 180
  const hd = (head * Math.PI) / 180
  // Sheet-plane forward (reading direction rotated by heading) and normal, then to world.
  const fx = Math.sin(hd)
  const fy = Math.cos(hd)
  out.target.set(x, y, 0).applyMatrix4(SHEET_ROTATION)
  scratchF.set(fx, fy, 0).applyMatrix4(SHEET_ROTATION)
  scratchN.set(0, 0, 1).applyMatrix4(SHEET_ROTATION)
  out.position
    .copy(out.target)
    .addScaledVector(scratchF, -dist * Math.cos(el))
    .addScaledVector(scratchN, dist * Math.sin(el))
  out.up.copy(scratchN).multiplyScalar(Math.cos(el)).addScaledVector(scratchF, Math.sin(el)).normalize()
  out.fov = fov
  out.ortho = ortho
  out.distance = dist
  return out
}

/**
 * Ink schedule: the pen position for each reveal group at intro time t. Keyed to the shot list
 * so every view finishes inking while it is on screen.
 */
const WINDOWS: [number, number, number][] = [
  [GROUP.printed, -1, 0],
  [GROUP.titleBlock, 0.055, 0.16],
  [GROUP.detailD, 0.0, 0.1],
  [GROUP.rear, 0.08, 0.17],
  [GROUP.section, 0.1, 0.19],
  [GROUP.hatch, 0.13, 0.22],
  [GROUP.detailB, 0.12, 0.21],
  [GROUP.notes, 0.17, 0.28],
  [GROUP.detailC, 0.22, 0.3],
  [GROUP.bottom, 0.24, 0.32],
  [GROUP.top, 0.26, 0.34],
  [GROUP.front, 0.3, 0.37],
  [GROUP.side, 0.3, 0.4],
  [GROUP.sideDims, 0.37, 0.46],
  [GROUP.sideLabels, 0.38, 0.47],
  [GROUP.gdt, 0.4, 0.49],
]

export function sheetReveal(t: number, out: number[]): number[] {
  for (let g = 0; g < GROUP_COUNT; g += 1) out[g] = 1
  for (const [g, start, end] of WINDOWS) out[g] = start < 0 ? 1 : clamp01((t - start) / (end - start))
  return out
}

/** Lamp pool centre on the sheet (follows the look-at point with a lag) — for the paper shader. */
export function lampFor(pose: SheetCameraPose, out: Vector3): Vector3 {
  return out.copy(pose.target)
}
