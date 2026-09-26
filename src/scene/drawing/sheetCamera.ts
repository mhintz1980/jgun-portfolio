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
 * tight on DETAIL D, traverses the drawing as it inks in,
 * rises to an establishing frame of the whole sheet, then descends square-on to the side
 * elevation and hands over to orthographic so the print registers to the model's projection.
 *
 * Sheet coordinates only; the registered hold derives from the main view rect.
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
  const close = portrait ? 0.24 : 0.19
  // Detail D is a composed inset (not one of the six projected layout views).
  const [dx, dy] = [0.085, -0.165]
  return [
    // One detail, one traverse, one reveal. No tour of every annotation.
    { t: 0.0, x: dx, y: dy, dist: close, elev: 38, head: -12, fov: 30, ortho: 0 },
    { t: 0.19, x: 0.08, y: 0.08, dist: 0.38, elev: 54, head: -4, fov: 32, ortho: 0 },
    { t: 0.31, x: 0, y: 0, dist: whole * 1.08, elev: 82, head: 0, fov: 34, ortho: 0 },
    { t: INTRO_PHASES.pulseStart, x: sx, y: sy, dist: settle, elev: 90, head: 0, fov: 30, ortho: 1 },
    { t: 1, x: sx, y: sy, dist: settle, elev: 90, head: 0, fov: 30, ortho: 1 },
  ]
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const scratchF = new Vector3()
const scratchN = new Vector3()

/**
 * Write the intro camera pose for intro time `t`. Bounded eased moves stop cleanly
 * on the primary elevation without spline overshoot during the registration hold.
 */
export function introCameraPose(layout: DrawingLayout, aspect: number, t: number, out: SheetCameraPose): SheetCameraPose {
  const list = shots(layout, aspect)
  let i = 0
  while (i < list.length - 2 && t >= list[i + 1].t) i += 1
  const b = list[i]
  const c = list[Math.min(list.length - 1, i + 1)]
  const u = clamp01(c.t > b.t ? (t - b.t) / (c.t - b.t) : 1)
  // Bounded easing cannot overshoot the registered hold or crop beyond a shot's framing.
  const k = smooth01(u)
  const x = lerp(b.x, c.x, k)
  const y = lerp(b.y, c.y, k)
  const dist = Math.exp(lerp(Math.log(b.dist), Math.log(c.dist), k))
  const elev = lerp(b.elev, c.elev, k)
  const head = lerp(b.head, c.head, k)
  const fov = lerp(b.fov, c.fov, k)
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
  [GROUP.front, 0.27, 0.34],
  [GROUP.side, 0.25, 0.36],
  [GROUP.sideDims, 0.33, 0.39],
  [GROUP.sideLabels, 0.34, 0.39],
  [GROUP.gdt, 0.35, 0.4],
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
