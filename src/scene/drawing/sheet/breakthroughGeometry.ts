
/**
 * JG-035 paper breakthrough — the torn hole, the thick fragments that cover it, and the
 * charred rim that stays behind.
 *
 * One deterministic bake, off the frame loop. Sheet metres throughout (origin at the sheet
 * centre, +Z out of the sheet toward the viewer), so everything drops into the existing
 * sheet group unchanged:
 *
 *   paper      the sheet rectangle with a real hole. A 4 mm grid is triangulated cell by
 *              cell, and every cell the hole touches is clipped against the hole contour
 *              instead of being dropped — no triangle can bridge the aperture, every edge
 *              stays inside the subdivision the paperFlex vertex displacement needs, and the
 *              sheet boundary follows the torn contour to well under a millimetre.
 *   fragments  irregular thick pieces and small perimeter chips tile the hole at rest (Voronoi
 *              cells of deterministic seeds, clipped to the hole), each carrying local
 *              geometry centred on its area centroid, launch velocity, spin and delay.
 *              Front face on z = 0, back face on z = -thickness, side walls closed.
 *   edge       the permanent charred rim: a band that starts exactly on the hole contour and
 *              grows outward only, plus the hole wall through the full sheet thickness. It
 *              never encroaches on the modelled profile, so the aperture stays the full hole.
 *   cracks     ribbons along the fragment seams with the makeLightningRibbon attribute
 *              layout (position, arcLength, ribbonSide, ribbonNormal) plus crackId, so a
 *              mask can skip the joins between disjoint ribbons instead of bridging them.
 *
 * The hole itself is derived from the exact traced contour by a conservative raster pass at
 * 0.1 mm, dilated by two pixels and traced back to a polygon. The measured profile is a
 * silhouette raster: its true boundary can sit up to half a pixel outside the traced line,
 * so a geometric hole that merely follows the trace collides with the model. Dilation
 * reserves clearance for that quantization while keeping the measured deviation under
 * contract, and the traced contour is never simplified or moved — `profile` is the exact
 * input contour.
 */
import {
  BufferGeometry,
  Float32BufferAttribute,
  ShapeUtils,
  Uint32BufferAttribute,
  Vector2,
  Vector3,
} from 'three'

/** Sheet thickness the fragments and the hole wall carry, in metres. */
export const BREAKTHROUGH_THICKNESS = 0.00045
/** Upper bound on the torn outward offset of the hole from the exact profile, in metres. */
export const BREAKTHROUGH_TORN_MAX = 0.0004
/** Longest allowed edge in the paper mesh, in metres (the paperFlex shader needs vertices). */
export const BREAKTHROUGH_PAPER_SUBDIVISION = 0.004
/** Cell pitch: the quad diagonal of a square cell is the longest edge, so it sets the pitch. */
const PAPER_CELL = BREAKTHROUGH_PAPER_SUBDIVISION / Math.SQRT2
/** Fragment count band the fracture choreography expects. */
export const BREAKTHROUGH_FRAGMENT_MIN = 25
export const BREAKTHROUGH_FRAGMENT_MAX = 128
/** Crack ribbon half-width and height above the sheet, matching the lightning ribbon look. */
export const BREAKTHROUGH_CRACK_HALF_WIDTH = 0.0018
export const BREAKTHROUGH_CRACK_Z = 0.0001
/** Charred rim band width (outward from the hole) and its front-face height. */
export const BREAKTHROUGH_RIM_WIDTH = 0.0011
export const BREAKTHROUGH_RIM_FRONT_Z = 0.00002
/** Chord tolerance of the simplified rim path, in metres. */
export const BREAKTHROUGH_RIM_TOLERANCE = 0.00002
/** Launch letter per unit of normalised scroll: horizontal spread and lift, in metres. */
export const BREAKTHROUGH_FRAGMENT_RADIAL_MIN = 0.45
export const BREAKTHROUGH_FRAGMENT_RADIAL_MAX = 0.8
export const BREAKTHROUGH_FRAGMENT_LIFT_MIN = 0.7
export const BREAKTHROUGH_FRAGMENT_LIFT_MAX = 1.0
/** Spin per axis, signed, in radians per unit of normalised scroll. */
export const BREAKTHROUGH_FRAGMENT_SPIN_MAX = 6
/** Fragments start peeling within this window, in normalised scroll units. */
export const BREAKTHROUGH_FRAGMENT_DELAY_MAX = 0.1

export interface BreakthroughFragment {
  /** Local geometry: front face on z = 0, centred on the cell's area centroid. */
  geometry: BufferGeometry
  /** Area centroid in sheet metres — place the mesh here and the hole is covered at rest. */
  center: Vector2
  /** metres per unit of normalised scroll, sheet axes, mostly +Z toward the viewer. */
  velocity: Vector3
  /** radians per unit of normalised scroll, signed and varied per axis. */
  spin: Vector3
  /** 0..BREAKTHROUGH_FRAGMENT_DELAY_MAX, normalised scroll units. */
  delay: number
}

export interface BreakthroughGeometry {
  /** Sheet rectangle with a real, torn hole at the profile. Front face on z = 0, normals +Z. */
  paper: BufferGeometry
  fragments: BreakthroughFragment[]
  /** Permanent charred rim around the hole: outward band plus the hole wall. */
  edge: BufferGeometry
  /** Ribbons along the fragment seams, lightning ribbon attribute layout plus crackId. */
  cracks: BufferGeometry
  /** The exact input contour (deduplicated, counter-clockwise) the hole is built from. */
  profile: number[][]
  /** Torn hole contour, counter-clockwise — the barrier/rim reference path. */
  outline: number[][]
  /** Alias of outline, kept for integrations that named it before the rename. */
  tornContour: number[][]
  /** Area of the torn hole, in square metres. */
  area: number
  /** Sum of the fragment front-face areas; equal to area when the partition is exact. */
  fragmentArea: number
  thickness: number
  /** Largest distance any hole vertex sits outside the exact profile, in metres. */
  maxBoundaryDeviation: number
  /** Vertical extent of the fragment geometry, front to back, in metres. */
  fragmentZRange: [number, number]
  dispose: () => void
}

/** Seed placement targets the main pieces; disconnected perimeter chips are retained too. */
const FRAGMENT_TARGET = 32
/** Seeds closer than this to the torn edge are dropped, in metres. */
const SEED_INSET = 0.0006
/** Raster pitch the torn hole is derived on, in metres. */
const RASTER_PITCH = 0.0001
/** Raster dilation in pixels: reserves clearance beyond the quantized profile. */
const RASTER_DILATE = 2
/** Chord tolerance when the traced raster contour is simplified, in metres. */
const RASTER_SIMPLIFY = 0.00005
/** Border of the raster field around the profile bounds, in pixels. */
const RASTER_MARGIN = RASTER_DILATE + 2
/** Spatial cell of the segment index, in metres. */
const GRID_CELL = 0.002
/** Two coordinates within this distance are the same point when seam keys are built. */
const SNAP = 1e-7
/** Y-band height of the containment index, in metres. */
const BAND_HEIGHT = 0.0005
/** Radius of the seam classification probe against the hole contour, in metres. */
const SEAM_TOLERANCE = 1e-6
/** Search radius of that probe; only seams this close to the contour are boundary seams. */
const SEAM_SEARCH = 0.001
/** Ribbons shorter than this are dropped as seams noise, in metres. */
const CRACK_MIN_LENGTH = 0.0004
/** Ribbon sampling step along a crack, matching makeLightningRibbon. */
const RIBBON_STEP = 0.0006
/** Per-fragment inward taper of the back face, relative to the sheet thickness. */
const BACK_TAPER = 1

const SALT_RADIAL = 37
const SALT_LIFT = 41
const SALT_SPIN = 53
const SALT_DELAY = 67
const SALT_SEED = 71

/** Deterministic integer hash in [0, 1). Math.imul keeps it bit-exact everywhere. */
function hashUnit(seed: number): number {
  let x = seed | 0
  x = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** Hash of an ordered index (vertex, cell, ...) under a salt. */
function hashIndex(index: number, salt: number): number {
  return hashUnit(Math.imul(index + 1, 0x27d4eb2d) + Math.imul(salt, 0x165667b1))
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** Signed area of a closed polygon: positive when counter-clockwise. */
function signedArea(points: number[][]): number {
  let total = 0
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    total += points[j][0] * points[i][1] - points[i][0] * points[j][1]
  }
  return total / 2
}

function pointSegmentDistance(points: number[][], index: number, x: number, y: number): number {
  const a = points[index]
  const b = points[(index + 1) % points.length]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(x - a[0], y - a[1])
  const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / lengthSquared, 0, 1)
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t))
}

/** Distance from a point to the line through a and b. */
function pointLineDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const length = Math.hypot(dx, dy)
  if (length === 0) return Math.hypot(px - ax, py - ay)
  return Math.abs((px - ax) * dy - (py - ay) * dx) / length
}

/** Uniform grid over a polygon's segments; a query visits a superset of the nearby ones. */
class SegmentIndex {
  private readonly cells = new Map<number, number[]>()
  private readonly stride = 8192
  private readonly offset = 4096

  constructor(private readonly points: number[][], private readonly cell: number) {
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]
      const b = points[(i + 1) % points.length]
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (cell * 0.5)))
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps
        const key = this.key(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        const bucket = this.cells.get(key)
        if (bucket) {
          if (bucket[bucket.length - 1] !== i) bucket.push(i)
        } else {
          this.cells.set(key, [i])
        }
      }
    }
  }

  private key(x: number, y: number): number {
    const gx = Math.floor(x / this.cell)
    const gy = Math.floor(y / this.cell)
    return (gx + this.offset) * this.stride + (gy + this.offset)
  }

  private sweep(x: number, y: number, span: number, visit: (segment: number) => void): void {
    const gx = Math.floor(x / this.cell)
    const gy = Math.floor(y / this.cell)
    for (let ix = gx - span; ix <= gx + span; ix += 1) {
      for (let iy = gy - span; iy <= gy + span; iy += 1) {
        const bucket = this.cells.get((ix + this.offset) * this.stride + (iy + this.offset))
        if (!bucket) continue
        for (let i = 0; i < bucket.length; i += 1) visit(bucket[i])
      }
    }
  }

  /** Nearest distance from (x, y) to the indexed segments, capped by radius. */
  nearest(x: number, y: number, radius: number): number {
    let best = radius
    this.sweep(x, y, Math.max(1, Math.ceil(radius / this.cell)), (segment) => {
      const candidate = pointSegmentDistance(this.points, segment, x, y)
      if (candidate < best) best = candidate
    })
    return best
  }

  /** Visit candidate segments whose cell overlaps the radius around (x, y). */
  near(x: number, y: number, radius: number, visit: (segment: number) => void): void {
    this.sweep(x, y, Math.max(1, Math.ceil(radius / this.cell)), visit)
  }

  /** Even-odd containment; points within tolerance of an edge read as inside. */
  contains(x: number, y: number, tolerance: number): boolean {
    let inside = false
    let hitsBoundary = false
    this.sweep(x, y, Math.max(1, Math.ceil((tolerance + this.cell) / this.cell)), (segment) => {
      if (hitsBoundary) return
      if (pointSegmentDistance(this.points, segment, x, y) <= tolerance) {
        hitsBoundary = true
        return
      }
      const a = this.points[segment]
      const b = this.points[(segment + 1) % this.points.length]
      if ((a[1] > y) !== (b[1] > y) && x < a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) inside = !inside
    })
    return hitsBoundary ? true : inside
  }
}

/** Y-banded segment index for global ray-cast containment probes over thousands of points. */
export class YBandIndex {
  private readonly bands: number[][]
  private readonly minY: number

  constructor(private readonly points: number[][]) {
    let minY = Infinity
    let maxY = -Infinity
    for (const point of points) {
      if (point[1] < minY) minY = point[1]
      if (point[1] > maxY) maxY = point[1]
    }
    this.minY = minY
    const count = Math.max(1, Math.ceil((maxY - minY) / BAND_HEIGHT) + 1)
    this.bands = Array.from({ length: count }, () => [] as number[])
    for (let i = 0; i < points.length; i += 1) {
      const low = Math.min(points[i][1], points[(i + 1) % points.length][1])
      const high = Math.max(points[i][1], points[(i + 1) % points.length][1])
      const from = Math.max(0, Math.floor((low - minY) / BAND_HEIGHT))
      const to = Math.min(count - 1, Math.floor((high - minY) / BAND_HEIGHT))
      for (let band = from; band <= to; band += 1) this.bands[band].push(i)
    }
  }

  /** Candidate segments whose y span reaches (x, y) within slack. */
  near(y: number, slack: number, visit: (segment: number) => void): void {
    const from = Math.max(0, Math.floor((y - slack - this.minY) / BAND_HEIGHT))
    const to = Math.min(this.bands.length - 1, Math.floor((y + slack - this.minY) / BAND_HEIGHT))
    for (let band = from; band <= to; band += 1) {
      const bucket = this.bands[band]
      for (let i = 0; i < bucket.length; i += 1) visit(bucket[i])
    }
  }

  /** Even-odd containment; points within tolerance of an edge read as inside. */
  contains(x: number, y: number, tolerance: number): boolean {
    let inside = false
    let hitsBoundary = false
    const visited = new Set<number>()
    this.near(y, tolerance + 1e-9, (segment) => {
      if (visited.has(segment)) return
      visited.add(segment)
      if (hitsBoundary) return
      if (pointSegmentDistance(this.points, segment, x, y) <= tolerance) {
        hitsBoundary = true
        return
      }
      const a = this.points[segment]
      const b = this.points[(segment + 1) % this.points.length]
      if ((a[1] > y) !== (b[1] > y) && x < a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1])) inside = !inside
    })
    return hitsBoundary ? true : inside
  }
}

/** Dedupe a traced contour, force counter-clockwise winding, check it fits the sheet. */
function normaliseProfile(points: number[][], width: number, height: number): number[][] {
  if (!Array.isArray(points) || points.length < 3) {
    throw new Error('breakthrough geometry needs a profile contour of at least three points')
  }
  const cleaned: number[][] = []
  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      throw new Error('breakthrough geometry received a malformed profile point')
    }
    const last = cleaned[cleaned.length - 1]
    if (last && last[0] === point[0] && last[1] === point[1]) continue
    cleaned.push([point[0], point[1]])
  }
  while (cleaned.length > 3) {
    const first = cleaned[0]
    const last = cleaned[cleaned.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) break
    cleaned.pop()
  }
  if (cleaned.length < 3) throw new Error('breakthrough geometry received a degenerate profile')
  if (signedArea(cleaned) < 0) cleaned.reverse()
  if (Math.abs(signedArea(cleaned)) < 1e-12) throw new Error('breakthrough geometry received a zero-area profile')
  const halfWidth = width / 2
  const halfHeight = height / 2
  for (const point of cleaned) {
    if (Math.abs(point[0]) > halfWidth + 1e-9 || Math.abs(point[1]) > halfHeight + 1e-9) {
      throw new Error('breakthrough geometry profile escapes the sheet rectangle')
    }
  }
  return cleaned
}

/** Douglas-Peucker on an open polyline; endpoints always survive. */
function simplifyOpen(points: number[][], tolerance: number): number[][] {
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const range = stack.pop() as [number, number]
    const lo = range[0]
    const hi = range[1]
    if (hi - lo < 2) continue
    const a = points[lo]
    const b = points[hi]
    let worst = -1
    let index = -1
    for (let i = lo + 1; i < hi; i += 1) {
      const candidate = pointLineDistance(points[i][0], points[i][1], a[0], a[1], b[0], b[1])
      if (candidate > worst) {
        worst = candidate
        index = i
      }
    }
    if (worst > tolerance && index > 0) {
      keep[index] = 1
      stack.push([lo, index], [index, hi])
    }
  }
  return points.filter((_, index) => keep[index] === 1)
}

/** Douglas-Peucker on a closed loop, split at the vertex farthest from the first. */
function simplifyClosed(points: number[][], tolerance: number): number[][] {
  const count = points.length
  if (count <= 4) return points
  let far = 0
  let best = -1
  for (let i = 1; i < count; i += 1) {
    const candidate = Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1])
    if (candidate > best) {
      best = candidate
      far = i
    }
  }
  const head = simplifyOpen(points.slice(0, far + 1), tolerance)
  const tail = simplifyOpen([...points.slice(far), points[0]], tolerance)
  const merged = [...head.slice(0, -1), ...tail.slice(0, -1)]
  return merged.length >= 3 ? merged : points
}

/**
 * The torn hole: the exact profile is rasterised at RASTER_PITCH with a scanline pass,
 * dilated by RASTER_DILATE pixels, traced back to its outer contour and simplified to
 * RASTER_SIMPLIFY. Dilating first is what guarantees clearance — the traced profile is a
 * silhouette raster, so the model can reach up to half a pixel beyond it, and a hole that
 * follows the trace alone collides. No inward nib is possible: every vertex is on or outside
 * the dilated silhouette.
 */
export function rasterTornOutline(profile: number[][]): number[][] {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of profile) {
    if (point[0] < minX) minX = point[0]
    if (point[0] > maxX) maxX = point[0]
    if (point[1] < minY) minY = point[1]
    if (point[1] > maxY) maxY = point[1]
  }
  const originX = minX - RASTER_MARGIN * RASTER_PITCH
  const topY = maxY + RASTER_MARGIN * RASTER_PITCH
  const columns = Math.ceil((maxX - minX) / RASTER_PITCH) + 2 * RASTER_MARGIN
  const rows = Math.ceil((maxY - minY) / RASTER_PITCH) + 2 * RASTER_MARGIN
  const mask = new Uint8Array(columns * rows)
  // Scanline fill: the contour is closed, so crossings pair up per row. Rows are scanned half
  // a pixel inside the cell they represent, which is why the fill cannot drift off the trace.
  for (let row = 0; row < rows; row += 1) {
    const y = topY - (row + 0.5) * RASTER_PITCH
    const crossings: number[] = []
    for (let i = 0, j = profile.length - 1; i < profile.length; j = i++) {
      const a = profile[j]
      const b = profile[i]
      if ((a[1] > y) !== (b[1] > y)) {
        crossings.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]))
      }
    }
    crossings.sort((a, b) => a - b)
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] - originX) / RASTER_PITCH - 0.5))
      const to = Math.min(columns - 1, Math.floor((crossings[k + 1] - originX) / RASTER_PITCH - 0.5))
      for (let column = from; column <= to; column += 1) mask[row * columns + column] = 1
    }
  }
  // Separable box dilation by RASTER_DILATE pixels in each axis.
  const horizontal = new Uint8Array(columns * rows)
  for (let row = 0; row < rows; row += 1) {
    const base = row * columns
    for (let column = 0; column < columns; column += 1) {
      const from = Math.max(0, column - RASTER_DILATE)
      const to = Math.min(columns - 1, column + RASTER_DILATE)
      for (let k = from; k <= to; k += 1) {
        if (mask[base + k]) {
          horizontal[base + column] = 1
          break
        }
      }
    }
  }
  const dilated = new Uint8Array(columns * rows)
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const from = Math.max(0, row - RASTER_DILATE)
      const to = Math.min(rows - 1, row + RASTER_DILATE)
      for (let k = from; k <= to; k += 1) {
        if (horizontal[k * columns + column]) {
          dilated[row * columns + column] = 1
          break
        }
      }
    }
  }
  // Border following: collect the directed boundary edges of the mask, then walk the longest
  // closed loop. Same construction the drawing tracer uses, over the dilated field.
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < columns && y < rows && dilated[y * columns + x] === 1
  const edges = new Map<string, number[][]>()
  const add = (x: number, y: number, a: number, b: number) => {
    const key = x + ',' + y
    const bucket = edges.get(key)
    if (bucket) bucket.push([a, b])
    else edges.set(key, [[a, b]])
  }
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!on(x, y)) continue
      if (!on(x, y - 1)) add(x, y, x + 1, y)
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1)
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1)
      if (!on(x - 1, y)) add(x, y + 1, x, y)
    }
  }
  let longest: number[][] = []
  while (edges.size) {
    const first = edges.keys().next().value as string
    let key = first
    const path: number[][] = []
    do {
      const bucket = edges.get(key)
      if (!bucket || !bucket.length) break
      path.push(key.split(',').map(Number))
      const next = bucket.pop() as number[]
      if (!bucket.length) edges.delete(key)
      key = next.join(',')
    } while (key !== first && path.length < columns * rows)
    if (key === first && path.length > longest.length) longest = path
  }
  if (longest.length) longest.push(longest[0])
  const traced = longest.map(([x, y]) => [originX + x * RASTER_PITCH, topY - y * RASTER_PITCH])
  // Close and drop the duplicated tail before simplifying; the loop is re-closed implicitly.
  const ring = traced.length > 1 ? traced.slice(0, -1) : traced
  const simplified = simplifyClosed(ring, RASTER_SIMPLIFY)
  if (signedArea(simplified) < 0) simplified.reverse()
  return simplified
}

/** Half-plane clip; keeps the side the plane's normal points away from when keepNegative. */
function clipHalfPlane(polygon: number[][], mx: number, my: number, nx: number, ny: number, keepNegative: boolean): number[][] {
  const out: number[][] = []
  const count = polygon.length
  for (let i = 0; i < count; i += 1) {
    const p = polygon[i]
    const q = polygon[(i + 1) % count]
    const sp = (p[0] - mx) * nx + (p[1] - my) * ny
    const sq = (q[0] - mx) * nx + (q[1] - my) * ny
    const insideP = keepNegative ? sp <= 0 : sp >= 0
    const insideQ = keepNegative ? sq <= 0 : sq >= 0
    if (insideP) out.push([p[0], p[1]])
    if (insideP !== insideQ) {
      const t = sp / (sp - sq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

/** Drop coincident and sub-nanometre edges so no degenerate triangle reaches earcut. */
function cleanRing(ring: number[][]): number[][] {
  const out: number[][] = []
  for (const point of ring) {
    const last = out[out.length - 1]
    if (last) {
      const dx = point[0] - last[0]
      const dy = point[1] - last[1]
      if (dx * dx + dy * dy <= 1e-18) continue
    }
    out.push([point[0], point[1]])
  }
  while (out.length > 2) {
    const first = out[0]
    const last = out[out.length - 1]
    const dx = first[0] - last[0]
    const dy = first[1] - last[1]
    if (dx * dx + dy * dy > 1e-18) break
    out.pop()
  }
  return out
}

/** Area centroid of a counter-clockwise ring. */
function ringCentroid(ring: number[][]): Vector2 {
  let twiceArea = 0
  let cx = 0
  let cy = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    twiceArea += cross
    cx += (ring[j][0] + ring[i][0]) * cross
    cy += (ring[j][1] + ring[i][1]) * cross
  }
  if (Math.abs(twiceArea) < 1e-15) return new Vector2(ring[0][0], ring[0][1])
  return new Vector2(cx / (3 * twiceArea), cy / (3 * twiceArea))
}

/**
 * Deterministic seeds: a jittered lattice over the hole whose pitch is adjusted so the kept
 * (inside, inset) seeds land on the fragment target. No randomness and no RNG state.
 */
function placeSeeds(minX: number, minY: number, maxX: number, maxY: number, index: SegmentIndex, target: number): number[][] {
  const width = Math.max(1e-6, maxX - minX)
  const height = Math.max(1e-6, maxY - minY)
  let span = Math.max(2, Math.round(Math.sqrt(target)))
  let best: number[][] = []
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rows = span
    const columns = Math.max(2, Math.round(span * (width / height)))
    const seeds: number[][] = []
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const sequence = attempt * 4096 + row * columns + column
        const jitterX = (hashIndex(sequence, SALT_SEED) - 0.5) * 0.66
        const jitterY = (hashIndex(sequence, SALT_SEED + 1) - 0.5) * 0.66
        const x = minX + ((column + 0.5 + jitterX) / columns) * width
        const y = minY + ((row + 0.5 + jitterY) / rows) * height
        if (!index.contains(x, y, 0)) continue
        // A seed on the torn edge only makes a sliver; keep it off by the inset.
        if (index.nearest(x, y, SEED_INSET) < SEED_INSET) continue
        seeds.push([x, y])
      }
    }
    if (!best.length || Math.abs(seeds.length - target) < Math.abs(best.length - target)) best = seeds
    if (best.length >= target - 2 && best.length <= target + 3) break
    span = Math.max(2, Math.ceil(span * Math.sqrt(target / Math.max(1, best.length))))
  }
  return best
}

/** Voronoi cells of the seeds clipped to the hole: an exact, disjoint partition of it. */
function partitionOutline(outline: number[][], seeds: number[][]): number[][][] {
  const cells: number[][][] = []
  const triangles = ShapeUtils.triangulateShape(outline.map(p => new Vector2(p[0],p[1])), []).map(f => f.map(i => outline[i]))
  const key = (p:number[]) => `${Math.round(p[0]*1e8)},${Math.round(p[1]*1e8)}`
  for (let k = 0; k < seeds.length; k += 1) {
    // Clip convex triangles separately. Clipping a concave ring directly invents bridges
    // when a Voronoi plane disconnects it. Cancel shared triangle edges to recover boundaries.
    const edges = new Map<string, {a:number[],b:number[]}>()
    for (const triangle of triangles) {
      let part = triangle
      for (let j=0;j<seeds.length && part.length>=3;j++) {
        if(j===k) continue
        const a=seeds[k],b=seeds[j]
        part=clipHalfPlane(part,(a[0]+b[0])/2,(a[1]+b[1])/2,b[0]-a[0],b[1]-a[1],true)
      }
      part=cleanRing(part)
      if(part.length<3 || Math.abs(signedArea(part))<1e-16) continue
      if(signedArea(part)<0)part.reverse()
      for(let i=0;i<part.length;i++) {
        const a=part[i],b=part[(i+1)%part.length],ak=key(a),bk=key(b)
        if(ak===bk)continue
        if(!edges.delete(`${bk}|${ak}`))edges.set(`${ak}|${bk}`,{a,b})
      }
    }
    const outgoing = new Map<string, {a:number[],b:number[]}[]>()
    for(const edge of edges.values()) {
      const ak=key(edge.a),bucket=outgoing.get(ak)??[]
      bucket.push(edge);outgoing.set(ak,bucket)
    }
    while(outgoing.size) {
      const start=outgoing.keys().next().value as string
      let cursor=start
      const ring:number[][]=[]
      do {
        const bucket=outgoing.get(cursor)
        if(!bucket?.length)throw new Error('Open fragment boundary after triangle clipping')
        const edge=bucket.pop()!
        if(!bucket.length)outgoing.delete(cursor)
        ring.push(edge.a);cursor=key(edge.b)
      }while(cursor!==start)
      const cell=cleanRing(ring)
      if(cell.length>=3 && Math.abs(signedArea(cell))>1e-14) {
        if(signedArea(cell)<0)cell.reverse()
        cells.push(cell)
      }
    }
  }
  return cells
}

interface Seam {
  ax: number
  ay: number
  bx: number
  by: number
  cells: number[]
}

/** Exactly the edges shared by two fragment cells: the seams the cracks run along. */
function collectSeams(cells: number[][][], outlineIndex: SegmentIndex): Seam[] {
  const seams = new Map<string, Seam>()
  const keyOf = (ax: number, ay: number, bx: number, by: number) => {
    const a = Math.round(ax / SNAP) + ',' + Math.round(ay / SNAP)
    const b = Math.round(bx / SNAP) + ',' + Math.round(by / SNAP)
    return a < b ? a + '|' + b : b + '|' + a
  }
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index]
    for (let i = 0; i < cell.length; i += 1) {
      const a = cell[i]
      const b = cell[(i + 1) % cell.length]
      const key = keyOf(a[0], a[1], b[0], b[1])
      const seam = seams.get(key)
      if (seam) {
        if (seam.cells[seam.cells.length - 1] !== index) seam.cells.push(index)
      } else {
        seams.set(key, { ax: a[0], ay: a[1], bx: b[0], by: b[1], cells: [index] })
      }
    }
  }
  const interior: Seam[] = []
  for (const seam of seams.values()) {
    if (seam.cells.length !== 2) continue
    const mx = (seam.ax + seam.bx) / 2
    const my = (seam.ay + seam.by) / 2
    // Seams that sit on the hole contour are the hole boundary, not a crack.
    if (outlineIndex.nearest(mx, my, SEAM_SEARCH) <= SEAM_TOLERANCE) continue
    interior.push(seam)
  }
  return interior
}

/** Normalise seams into disjoint chains; each chain is one crack ribbon. */
function seamRibbons(seams: Seam[]): { id: number; points: number[][] }[] {
  const nodeOf = new Map<string, number>()
  const nodePoints: number[][] = []
  const node = (x: number, y: number): number => {
    const key = Math.round(x / SNAP) + ',' + Math.round(y / SNAP)
    const existing = nodeOf.get(key)
    if (existing !== undefined) return existing
    const index = nodePoints.length
    nodePoints.push([x, y])
    nodeOf.set(key, index)
    return index
  }
  const edges = seams.map((seam) => ({ a: node(seam.ax, seam.ay), b: node(seam.bx, seam.by) }))
  const adjacency = new Map<number, number[]>()
  edges.forEach((edge, index) => {
    for (const end of [edge.a, edge.b]) {
      const bucket = adjacency.get(end)
      if (bucket) bucket.push(index)
      else adjacency.set(end, [index])
    }
  })
  const visited = new Uint8Array(edges.length)
  const ribbons: { id: number; points: number[][] }[] = []
  const nextFrom = (end: number): number => {
    const bucket = adjacency.get(end)
    if (!bucket) return -1
    for (const index of bucket) if (!visited[index]) return index
    return -1
  }
  for (let start = 0; start < edges.length; start += 1) {
    if (visited[start]) continue
    visited[start] = 1
    const nodes: number[] = [edges[start].a, edges[start].b]
    for (;;) {
      const edge = nextFrom(nodes[nodes.length - 1])
      if (edge < 0) break
      visited[edge] = 1
      const other = edges[edge].a === nodes[nodes.length - 1] ? edges[edge].b : edges[edge].a
      if (nodes.includes(other)) break
      nodes.push(other)
    }
    for (;;) {
      const edge = nextFrom(nodes[0])
      if (edge < 0) break
      visited[edge] = 1
      const other = edges[edge].a === nodes[0] ? edges[edge].b : edges[edge].a
      if (nodes.includes(other)) break
      nodes.unshift(other)
    }
    const points = nodes.map((index) => nodePoints[index])
    let length = 0
    for (let i = 1; i < points.length; i += 1) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    if (length < CRACK_MIN_LENGTH) continue
    ribbons.push({ id: ribbons.length, points })
  }
  return ribbons
}

/**

/** Exact stock complement, then grid clipping for flex. No boundary cell is discarded. */
function buildPaperGeometry(width: number, height: number, hole: number[][]): BufferGeometry {
  const outer = [[-width / 2, -height / 2], [width / 2, -height / 2],
    [width / 2, height / 2], [-width / 2, height / 2]]
  const all = [...outer, ...hole]
  const faces = ShapeUtils.triangulateShape(outer.map(p => new Vector2(...p as [number, number])),
    [hole.map(p => new Vector2(...p as [number, number]))])
  const positions: number[] = [], normals: number[] = [], indices: number[] = []
  const columns = Math.ceil(width / PAPER_CELL), rows = Math.ceil(height / PAPER_CELL)
  const dx = width / columns, dy = height / rows
  const bound = (polygon: number[][], axis: number, maximum: boolean) =>
    polygon.reduce((v, p) => maximum ? Math.max(v, p[axis]) : Math.min(v, p[axis]), maximum ? -Infinity : Infinity)
  for (const face of faces) {
    const triangle = face.map(i => all[i])
    const loY = Math.max(0, Math.floor((bound(triangle, 1, false) + height / 2) / dy))
    const hiY = Math.min(rows - 1, Math.floor((bound(triangle, 1, true) + height / 2) / dy))
    for (let row = loY; row <= hiY; row++) {
      const y0 = -height / 2 + row * dy, y1 = y0 + dy
      const strip = clipHalfPlane(clipHalfPlane(triangle, 0, y0, 0, 1, false), 0, y1, 0, 1, true)
      if (strip.length < 3) continue
      const loX = Math.max(0, Math.floor((bound(strip, 0, false) + width / 2) / dx))
      const hiX = Math.min(columns - 1, Math.floor((bound(strip, 0, true) + width / 2) / dx))
      for (let column = loX; column <= hiX; column++) {
        const x0 = -width / 2 + column * dx, x1 = x0 + dx
        const cell = cleanRing(clipHalfPlane(clipHalfPlane(strip, x0, 0, 1, 0, false), x1, 0, 1, 0, true))
        if (cell.length < 3) continue
        for (let i = 1; i < cell.length - 1; i++) {
          const a = cell[0], b = cell[i], c = cell[i + 1]
          if (Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1])) < 1e-18) continue
          const base = positions.length / 3
          for (const p of [a, b, c]) { positions.push(p[0], p[1], 0); normals.push(0, 0, 1) }
          indices.push(base, base + 1, base + 2)
        }
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setIndex(new Uint32BufferAttribute(indices, 1))
  return geometry
}

/** One closed prism per component, local to its area centroid; no two fronts overlap. */
function buildFragmentGeometry(ring: number[][], center: Vector2): BufferGeometry {
  const count = ring.length
  const positions: number[] = []
  for (let i = 0; i < count; i += 1) positions.push(ring[i][0] - center.x, ring[i][1] - center.y, 0)
  for (let i = 0; i < count; i += 1) {
    positions.push((ring[i][0] - center.x) * BACK_TAPER, (ring[i][1] - center.y) * BACK_TAPER, -BREAKTHROUGH_THICKNESS)
  }
  const faces = ShapeUtils.triangulateShape(
    ring.map((point) => new Vector2(point[0] - center.x, point[1] - center.y)),
    [],
  )
  const indices: number[] = []
  for (const face of faces) {
    const [a,b,c] = face.map(i => ring[i])
    if ((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]) < 0) [face[1],face[2]] = [face[2],face[1]]
    indices.push(face[0], face[1], face[2])
  }
  for (const face of faces) indices.push(count + face[0], count + face[2], count + face[1])
  // Walls get their own vertices so computeVertexNormals stays crisp on every face: the front
  // and back read exactly +Z and -Z, the sides exactly outward.
  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count
    const base = positions.length / 3
    positions.push(
      ring[i][0] - center.x, ring[i][1] - center.y, 0,
      ring[next][0] - center.x, ring[next][1] - center.y, 0,
      (ring[next][0] - center.x) * BACK_TAPER, (ring[next][1] - center.y) * BACK_TAPER, -BREAKTHROUGH_THICKNESS,
      (ring[i][0] - center.x) * BACK_TAPER, (ring[i][1] - center.y) * BACK_TAPER, -BREAKTHROUGH_THICKNESS,
    )
    indices.push(base, base + 2, base + 3, base, base + 1, base + 2)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(positions), 3))
  geometry.setIndex(indices)
  // Front, back and the side walls need real normals: the rest plane reads normal.z.
  geometry.computeVertexNormals()
  const faceNormals = geometry.getAttribute('normal')
  for (let i=0;i<count;i++) {
    faceNormals.setXYZ(i,0,0,1)
    faceNormals.setXYZ(count+i,0,0,-1)
  }
  return geometry
}

/**
 * Ribbon strips in the makeLightningRibbon layout, one per path, plus a crackId per ribbon so a
 * mask can skip the joins between disjoint ribbons instead of bridging them.
 */
function buildRibbonGeometry(paths: { id: number; points: number[][] }[], z: number, halfWidth: number): BufferGeometry {
  const positions: number[] = []
  const arcLengths: number[] = []
  const sides: number[] = []
  const normals: number[] = []
  const crackIds: number[] = []
  const indices: number[] = []
  for (const path of paths) {
    const points = path.points
    const distances = [0]
    for (let i = 1; i < points.length; i += 1) {
      distances.push(distances[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
    }
    const total = distances[distances.length - 1] || 1
    let previousPair = -1
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1]
      const b = points[i]
      const length = distances[i] - distances[i - 1]
      if (length < 1e-9) continue
      const nx = -(b[1] - a[1]) / length
      const ny = (b[0] - a[0]) / length
      const steps = Math.max(1, Math.ceil(length / RIBBON_STEP))
      for (let step = 0; step <= steps; step += 1) {
        const u = step / steps
        const x = a[0] + (b[0] - a[0]) * u
        const y = a[1] + (b[1] - a[1]) * u
        const arc = (distances[i - 1] + length * u) / total
        const pair = positions.length / 3
        for (const side of [-1, 1]) {
          positions.push(x + nx * halfWidth * side, y + ny * halfWidth * side, z)
          arcLengths.push(arc)
          sides.push(side)
          normals.push(nx, ny)
          crackIds.push(path.id)
        }
        if (previousPair >= 0) {
          indices.push(previousPair, previousPair + 1, pair, previousPair + 1, pair + 1, pair)
        }
        previousPair = pair
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('arcLength', new Float32BufferAttribute(arcLengths, 1))
  geometry.setAttribute('ribbonSide', new Float32BufferAttribute(sides, 1))
  geometry.setAttribute('ribbonNormal', new Float32BufferAttribute(normals, 2))
  geometry.setAttribute('crackId', new Float32BufferAttribute(crackIds, 1))
  geometry.setIndex(indices)
  return geometry
}


/** Outward unit normal of every edge of a counter-clockwise polygon. */
function edgeNormals(points: number[][]): number[][] {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length]
    const dx = next[0] - point[0]
    const dy = next[1] - point[1]
    const length = Math.hypot(dx, dy) || 1
    return [dy / length, -dx / length]
  })
}

/** Outward vertex direction: the bisector of the two adjacent edges, unit length. */
function vertexBisectors(points: number[][]): number[][] {
  const normals = edgeNormals(points)
  return points.map((_, index) => {
    const previous = normals[(index - 1 + points.length) % points.length]
    const next = normals[index]
    const bx = previous[0] + next[0]
    const by = previous[1] + next[1]
    const length = Math.hypot(bx, by)
    if (length < 1e-9) return [next[0], next[1]]
    return [bx / length, by / length]
  })
}

/**
 * Permanent charred rim: a band from the hole contour outward only (so the aperture is never
 * narrowed) plus the hole wall through the full sheet thickness.
 */
function buildRimGeometry(outline: number[][]): BufferGeometry {
  const path = simplifyClosed(outline, BREAKTHROUGH_RIM_TOLERANCE)
  const bisectors = vertexBisectors(path)
  const count = path.length
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  for (const point of path) {
    positions.push(point[0], point[1], BREAKTHROUGH_RIM_FRONT_Z)
    normals.push(0, 0, 1)
  }
  for (let i = 0; i < count; i += 1) {
    const point = path[i]
    const outward = bisectors[i]
    positions.push(point[0] + outward[0] * BREAKTHROUGH_RIM_WIDTH, point[1] + outward[1] * BREAKTHROUGH_RIM_WIDTH, BREAKTHROUGH_RIM_FRONT_Z)
    normals.push(0, 0, 1)
  }
  for (let i = 0; i < count; i += 1) {
    const point = path[i]
    const outward = bisectors[i]
    // Wall: on the contour at the sheet surface, down through the full thickness, facing the
    // aperture so it is what shows when the fragments have gone.
    positions.push(point[0], point[1], 0, point[0], point[1], -BREAKTHROUGH_THICKNESS)
    normals.push(-outward[0], -outward[1], 0, -outward[0], -outward[1], 0)
  }
  const wallTop = count * 2
  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count
    indices.push(i, count + i, count + next, i, count + next, next)
    const top = wallTop + i * 2
    const bottom = top + 1
    const nextTop = wallTop + next * 2
    const nextBottom = nextTop + 1
    indices.push(top, nextTop, nextBottom, top, nextBottom, bottom)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(new Float32Array(normals), 3))
  geometry.setIndex(indices)
  return geometry
}

export function makeBreakthroughGeometry(points: number[][], width: number, height: number): BreakthroughGeometry {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('breakthrough geometry needs a positive sheet size')
  }
  const profile = normaliseProfile(points, width, height)
  const outline = rasterTornOutline(profile)
  const area = Math.abs(signedArea(outline))
  const outlineIndex = new SegmentIndex(outline, GRID_CELL)

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of outline) {
    if (point[0] < minX) minX = point[0]
    if (point[0] > maxX) maxX = point[0]
    if (point[1] < minY) minY = point[1]
    if (point[1] > maxY) maxY = point[1]
  }
  const seeds = placeSeeds(minX, minY, maxX, maxY, outlineIndex, FRAGMENT_TARGET)
  const cells = partitionOutline(outline, seeds)
  if(cells.length<BREAKTHROUGH_FRAGMENT_MIN || cells.length>BREAKTHROUGH_FRAGMENT_MAX) throw new Error('Paper fragment count outside the geometry budget')
  const fragments: BreakthroughFragment[] = []
  let fragmentArea = 0
  let fragmentZMin = Infinity
  let fragmentZMax = -Infinity
  cells.forEach((ring, index) => {
    const center = ringCentroid(ring)
    const geometry = buildFragmentGeometry(ring, center)
    fragmentArea += Math.abs(signedArea(ring))
    const zValues = geometry.getAttribute('position').array
    for (let i = 2; i < zValues.length; i += 3) {
      if (zValues[i] < fragmentZMin) fragmentZMin = zValues[i]
      if (zValues[i] > fragmentZMax) fragmentZMax = zValues[i]
    }
    const azimuth = hashIndex(index, SALT_SPIN + 1) * Math.PI * 2
    const radial = BREAKTHROUGH_FRAGMENT_RADIAL_MIN
      + (BREAKTHROUGH_FRAGMENT_RADIAL_MAX - BREAKTHROUGH_FRAGMENT_RADIAL_MIN) * hashIndex(index, SALT_RADIAL)
    const lift = BREAKTHROUGH_FRAGMENT_LIFT_MIN
      + (BREAKTHROUGH_FRAGMENT_LIFT_MAX - BREAKTHROUGH_FRAGMENT_LIFT_MIN) * hashIndex(index, SALT_LIFT)
    fragments.push({
      geometry,
      center,
      // Deterministic per unit of normalised scroll: out of the sheet, unevenly spread.
      velocity: new Vector3(Math.cos(azimuth) * radial, Math.sin(azimuth) * radial, lift),
      spin: new Vector3(
        (hashIndex(index, SALT_SPIN) * 2 - 1) * BREAKTHROUGH_FRAGMENT_SPIN_MAX,
        (hashIndex(index, SALT_SPIN + 2) * 2 - 1) * BREAKTHROUGH_FRAGMENT_SPIN_MAX,
        (hashIndex(index, SALT_SPIN + 3) * 2 - 1) * BREAKTHROUGH_FRAGMENT_SPIN_MAX,
      ),
      delay: hashIndex(index, SALT_DELAY) * BREAKTHROUGH_FRAGMENT_DELAY_MAX,
    })
  })

  const seams = collectSeams(cells, outlineIndex)
  const ribbons = seamRibbons(seams)
  const cracks = buildRibbonGeometry(ribbons, BREAKTHROUGH_CRACK_Z, BREAKTHROUGH_CRACK_HALF_WIDTH)
  const paper = buildPaperGeometry(width, height, outline)
  const edge = buildRimGeometry(outline)

  // Measured, not assumed: how far past the exact profile the hole actually reaches.
  const profileIndex = new SegmentIndex(profile, GRID_CELL)
  const profileArea = new YBandIndex(profile)
  let maxBoundaryDeviation = 0
  for (const point of outline) {
    if (profileArea.contains(point[0], point[1], 0)) continue
    const deviation = profileIndex.nearest(point[0], point[1], 0.004)
    if (deviation > maxBoundaryDeviation) maxBoundaryDeviation = deviation
  }

  return {
    paper,
    fragments,
    edge,
    cracks,
    profile,
    outline,
    tornContour: outline,
    area,
    fragmentArea,
    thickness: BREAKTHROUGH_THICKNESS,
    maxBoundaryDeviation,
    fragmentZRange: [Number.isFinite(fragmentZMin) ? fragmentZMin : 0, Number.isFinite(fragmentZMax) ? fragmentZMax : 0],
    dispose: () => {
      paper.dispose()
      edge.dispose()
      cracks.dispose()
      for (const fragment of fragments) fragment.geometry.dispose()
    },
  }
}
