/** Convex footprint predicates in sheet-local metres. A gap at or below the margin counts as a collision. */
export type Point = readonly [number, number]
/** Tool-local axis-aligned box [minX, maxX, minY, maxY] in the tool's own frame (origin = root pivot). */
export type LocalBox = readonly [number, number, number, number]
export const KEEP_OUT: readonly Point[] = [[-.404,-.254],[.404,-.254],[.404,.254],[-.404,.254]]
export const PLATE = [.68, .45] as const
export const FOOTPRINT_MARGIN = .0002

export function rectangle(x: number, y: number, theta: number, hx: number, hy: number): Point[] {
  return boxPolygon([-hx, hx, -hy, hy], x, y, theta)
}
/** Oriented footprint of a tool-local box placed at (x, y) with yaw theta, optionally grown by pad on every side. */
export function boxPolygon(box: LocalBox, x: number, y: number, theta: number, pad = 0): Point[] {
  const c = Math.cos(theta), s = Math.sin(theta)
  const [x0, x1, y0, y1] = box
  const corners: Point[] = [[x0 - pad, y0 - pad], [x1 + pad, y0 - pad], [x1 + pad, y1 + pad], [x0 - pad, y1 + pad]]
  return corners.map(([a, b]): Point => [x + a * c - b * s, y + a * s + b * c])
}
/** Largest distance from the root pivot to any corner of the box (bounds a rotation about the pivot). */
export function boxReach(box: LocalBox): number {
  return Math.hypot(Math.max(Math.abs(box[0]), Math.abs(box[1])), Math.max(Math.abs(box[2]), Math.abs(box[3])))
}
export function intersects(a: readonly Point[], b: readonly Point[], margin = FOOTPRINT_MARGIN): boolean {
  for (const polygon of [a, b]) for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length]
    const length = Math.hypot(q[0] - p[0], q[1] - p[1])
    if (length < 1e-12) continue
    const nx = -(q[1] - p[1]) / length, ny = (q[0] - p[0]) / length
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity
    for (const v of a) { const d = v[0] * nx + v[1] * ny; amin = Math.min(amin, d); amax = Math.max(amax, d) }
    for (const v of b) { const d = v[0] * nx + v[1] * ny; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d) }
    if (amax + margin < bmin || bmax + margin < amin) return false
  }
  return true
}
export function onPlate(polygon: readonly Point[], margin = FOOTPRINT_MARGIN): boolean {
  return polygon.every(([x, y]) => Math.abs(x) <= PLATE[0] - margin && Math.abs(y) <= PLATE[1] - margin)
}
export function hull(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (sorted.length < 3) return sorted
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const chain = (list: Point[]) => { const out: Point[] = []; for (const p of list) { while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop(); out.push(p) } return out }
  return [...chain(sorted).slice(0, -1), ...chain([...sorted].reverse()).slice(0, -1)]
}
/** Distance from a world point to the oriented box (0 when inside). */
export function pointBoxDistance(px: number, py: number, box: LocalBox, x: number, y: number, theta: number): number {
  const c = Math.cos(theta), s = Math.sin(theta)
  const lx = (px - x) * c + (py - y) * s, ly = -(px - x) * s + (py - y) * c
  return Math.hypot(Math.max(box[0] - lx, 0, lx - box[1]), Math.max(box[2] - ly, 0, ly - box[3]))
}
