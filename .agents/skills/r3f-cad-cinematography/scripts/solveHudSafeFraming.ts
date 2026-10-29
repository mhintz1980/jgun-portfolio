/**
 * Closed-form HUD-Safe Camera Framing Solver for R3F / Three.js CAD Storytelling.
 *
 * Given a set of 3D CAD extremal witness points (in meters), camera viewing angles
 * (azimuthDeg, elevationDeg), standoff distance (distM), up-vector, and active DOM
 * HUD rectangles (in pixels), this offline solver selects an unobstructed
 * screen-space box and solves perspective inequalities using each witness's
 * actual depth. Returned poses pass a real PerspectiveCamera projection gate.
 * Invalid inputs and infeasible fits throw RangeError; no unsafe fallback pose.
 * The search is conservative: one ranked free box, fixed viewing direction and
 * standoff, centroid depth plane, and near/far = 0.001/30 meters. Failure does
 * not establish that no other camera pose or free box could work.
 */
import { PerspectiveCamera, Vector3 } from 'three'

export interface DomRectPx {
  readonly min: readonly [number, number]
  readonly max: readonly [number, number]
  readonly label?: string
}

export interface ViewportSpec {
  readonly width: number
  readonly height: number
  readonly rects: readonly DomRectPx[]
  /** Minimum pixel clearance from any DOM rect (default: 8 px). */
  readonly minClearancePx?: number
  /** Maximum NDC coordinate magnitude (default: 0.84 for 8% safe frame). */
  readonly safeNdc?: number
}

export interface SolveViewportInput {
  /** Extremal 3D CAD witness points in the study's meter coordinate frame. */
  readonly witnessesM: readonly Vector3[]
  /** Total camera azimuth in degrees (including any frozen follow azimuth). */
  readonly azimuthDeg: number
  /** Camera elevation in degrees. */
  readonly elevationDeg: number
  /** Camera-to-target standoff distance in meters. */
  readonly distM: number
  /** Camera up unit vector (e.g. [0, 1, 0] for machining, [0, 0, 1] for side study). */
  readonly up: readonly [number, number, number]
  /** Minimum allowed telephoto FOV (deg) to prevent extreme flattening. */
  readonly minFovDeg?: number
  /** Maximum allowed wide FOV (deg) to prevent perspective distortion. */
  readonly maxFovDeg?: number
  /** Fill ratio inside the safe unobstructed sub-rectangle (default: 0.88). */
  readonly fillFactor?: number
  readonly viewport: ViewportSpec
}

export interface SolvedFraming {
  /** Target position in millimeters [tx, ty, tz] (matching ANCHORS convention). */
  readonly tgtMm: readonly [number, number, number]
  /** Vertical FOV in degrees (Three.js PerspectiveCamera convention). */
  readonly fovDeg: number
  /** Minimum signed axis separation of the projected subject AABB from HUD rects; Infinity with no rects. */
  readonly minRectClearancePx: number
  /** Peak absolute NDC coordinate [max|x|, max|y|]. */
  readonly maxNdc: readonly [number, number]
}

const DEG = Math.PI / 180
const NEAR_M = 0.001
const FAR_M = 30

function validateViewport(viewport: ViewportSpec): void {
  const { width, height, rects, minClearancePx = 8, safeNdc = 0.84 } = viewport
  if (![width, height, minClearancePx, safeNdc].every(Number.isFinite)
    || width <= 0 || height <= 0 || minClearancePx < 0 || safeNdc <= 0 || safeNdc > 1
    || rects.some(r => ![...r.min, ...r.max].every(Number.isFinite)
      || r.min[0] > r.max[0] || r.min[1] > r.max[1])) {
    throw new RangeError('Invalid HUD framing viewport or rectangle')
  }
}

/**
 * Selects an axis-aligned free rectangle by area, balance and center bias.
 * Throws RangeError when no positive-area candidate exists.
 */
export function findLargestFreeNdcBox(viewport: ViewportSpec): {
  ndcMinX: number
  ndcMaxX: number
  ndcMinY: number
  ndcMaxY: number
} {
  validateViewport(viewport)
  const { width, height, rects, minClearancePx = 8, safeNdc = 0.84 } = viewport

  // Convert inflated DOM pixel rects to NDC obstacles: x in [-1, 1], y in [-1, 1] (bottom-up)
  const obstacles = rects.map((r) => {
    const x0 = ((r.min[0] - minClearancePx) / width) * 2 - 1
    const x1 = ((r.max[0] + minClearancePx) / width) * 2 - 1
    const yTop = 1 - ((r.min[1] - minClearancePx) / height) * 2
    const yBot = 1 - ((r.max[1] + minClearancePx) / height) * 2
    return { x0, x1, y0: Math.min(yBot, yTop), y1: Math.max(yBot, yTop) }
  })

  // Candidate edges from safe frame and obstacle boundaries
  const xEdges = new Set<number>([-safeNdc, safeNdc])
  const yEdges = new Set<number>([-safeNdc, safeNdc])
  for (const ob of obstacles) {
    if (ob.x0 > -safeNdc && ob.x0 < safeNdc) xEdges.add(ob.x0)
    if (ob.x1 > -safeNdc && ob.x1 < safeNdc) xEdges.add(ob.x1)
    if (ob.y0 > -safeNdc && ob.y0 < safeNdc) yEdges.add(ob.y0)
    if (ob.y1 > -safeNdc && ob.y1 < safeNdc) yEdges.add(ob.y1)
  }

  const xs = Array.from(xEdges).sort((a, b) => a - b)
  const ys = Array.from(yEdges).sort((a, b) => a - b)

  let bestScore = -1
  let best = { ndcMinX: -safeNdc, ndcMaxX: safeNdc, ndcMinY: -safeNdc, ndcMaxY: safeNdc }

  for (let ix0 = 0; ix0 < xs.length; ix0++) {
    for (let ix1 = ix0 + 1; ix1 < xs.length; ix1++) {
      for (let iy0 = 0; iy0 < ys.length; iy0++) {
        for (let iy1 = iy0 + 1; iy1 < ys.length; iy1++) {
          const x0 = xs[ix0], x1 = xs[ix1], y0 = ys[iy0], y1 = ys[iy1]
          const w = x1 - x0, h = y1 - y0
          if (w <= 1e-10 || h <= 1e-10) continue

          const overlaps = obstacles.some(
            (ob) => !(x1 <= ob.x0 || x0 >= ob.x1 || y1 <= ob.y0 || y0 >= ob.y1),
          )
          if (overlaps) continue

          // Prefer large area with balanced aspect ratio (penalize ultra-thin slivers)
          const area = w * h
          const balance = Math.min(w, h) / Math.max(w, h)
          const centerBias = 1 - 0.15 * Math.hypot((x0 + x1) * 0.5, (y0 + y1) * 0.5)
          const score = area * Math.sqrt(balance) * centerBias
          if (score > bestScore) {
            bestScore = score
            best = { ndcMinX: x0, ndcMaxX: x1, ndcMinY: y0, ndcMaxY: y1 }
          }
        }
      }
    }
  }
  if (bestScore < 0) throw new RangeError('Infeasible HUD framing: no unobstructed free box')
  return best
}

/**
 * Solves target (mm) and vertical FOV (deg), preserving full numeric precision.
 * Callers must catch RangeError for infeasible requests. Rounding the returned
 * pose or changing near/far requires a new projection check.
 */
export function solveViewportFraming(input: SolveViewportInput): SolvedFraming {
  const {
    witnessesM,
    azimuthDeg,
    elevationDeg,
    distM,
    up,
    minFovDeg = 6.0,
    maxFovDeg = 58.0,
    fillFactor = 0.88,
    viewport,
  } = input

  if (witnessesM.length === 0
    || witnessesM.some(p => ![p.x, p.y, p.z].every(Number.isFinite))
    || ![azimuthDeg, elevationDeg, distM, ...up, minFovDeg, maxFovDeg, fillFactor].every(Number.isFinite)
    || distM <= 0 || minFovDeg <= 0 || maxFovDeg >= 180 || minFovDeg > maxFovDeg
    || fillFactor <= 0 || fillFactor > 1) {
    throw new RangeError('Invalid HUD framing witnesses, camera or fit parameters')
  }
  const aspect = viewport.width / viewport.height
  const freeBox = findLargestFreeNdcBox(viewport)
  const desiredNdcCenterX = (freeBox.ndcMinX + freeBox.ndcMaxX) * 0.5
  const desiredNdcCenterY = (freeBox.ndcMinY + freeBox.ndcMaxY) * 0.5
  // Tiny inset also protects fillFactor=1 against floating-point boundary noise.
  const availHalfW = (freeBox.ndcMaxX - freeBox.ndcMinX) * 0.5 * fillFactor * (1 - 1e-9)
  const availHalfH = (freeBox.ndcMaxY - freeBox.ndcMinY) * 0.5 * fillFactor * (1 - 1e-9)

  // Construct camera basis vectors from azimuth, elevation, and up
  const az = azimuthDeg * DEG
  const el = elevationDeg * DEG
  const viewOffsetDir = new Vector3(
    Math.cos(el) * Math.cos(az),
    Math.sin(el),
    Math.cos(el) * Math.sin(az),
  ).normalize()
  const forward = viewOffsetDir.clone().negate()
  const upVec = new Vector3(up[0], up[1], up[2]).normalize()
  const right = new Vector3().crossVectors(forward, upVec)
  if (right.lengthSq() < 1e-12) throw new RangeError('Invalid HUD framing: up vector is zero or parallel to view')
  right.normalize()
  const trueUp = new Vector3().crossVectors(right, forward).normalize()

  // Initial centroid of the 3D witness cloud
  const centroid = new Vector3()
  for (const w of witnessesM) centroid.add(w)
  centroid.multiplyScalar(1 / witnessesM.length)

  const points = witnessesM.map(w => {
    const rel = w.clone().sub(centroid)
    const depth = distM + rel.dot(forward)
    if (!(depth > NEAR_M && depth < FAR_M)) {
      throw new RangeError('Infeasible HUD framing: witness outside camera clipping range')
    }
    return { u: rel.dot(right), v: rel.dot(trueUp), depth }
  })

  // x_i = (u_i - shiftU) / (depth_i * aspect * tan(fov/2)).
  // Each point gives an interval for shiftU (likewise shiftV). All intervals
  // overlap iff every lower endpoint <= every upper endpoint. Pairwise
  // inequalities give exact lower AND upper bounds on tan(fov/2); an off-axis
  // box with depth variation need not become feasible monotonically with FOV.
  let minTan = Math.tan(minFovDeg * DEG / 2)
  let maxTan = Math.tan(maxFovDeg * DEG / 2)
  const axes = [
    { key: 'u', low: desiredNdcCenterX - availHalfW, high: desiredNdcCenterX + availHalfW, scale: aspect },
    { key: 'v', low: desiredNdcCenterY - availHalfH, high: desiredNdcCenterY + availHalfH, scale: 1 },
  ] as const
  for (const axis of axes) {
    for (const a of points) {
      for (const b of points) {
        const delta = a[axis.key] - b[axis.key]
        const coefficient = (axis.high * a.depth - axis.low * b.depth) * axis.scale
        if (coefficient > 0) minTan = Math.max(minTan, delta / coefficient)
        else if (coefficient < 0) maxTan = Math.min(maxTan, delta / coefficient)
        else if (delta > 0) throw new RangeError('Infeasible HUD framing: incompatible witness depths')
      }
    }
  }
  if (!(minTan <= maxTan)) throw new RangeError('Infeasible HUD framing: no fit within FOV limits in selected free box')
  const fovDeg = Math.max(minFovDeg, Math.min(maxFovDeg,
    2 * Math.atan(minTan + (maxTan - minTan) * 1e-9) / DEG))
  const actualTanHalfFov = Math.tan((fovDeg * DEG) * 0.5)

  const shifts = axes.map(axis => {
    let lower = -Infinity, upper = Infinity
    for (const p of points) {
      lower = Math.max(lower, p[axis.key] - axis.high * p.depth * axis.scale * actualTanHalfFov)
      upper = Math.min(upper, p[axis.key] - axis.low * p.depth * axis.scale * actualTanHalfFov)
    }
    return (lower + upper) / 2
  })

  const targetM = centroid
    .clone()
    .addScaledVector(right, shifts[0])
    .addScaledVector(trueUp, shifts[1])

  const tgtMm: [number, number, number] = [
    targetM.x * 1000,
    targetM.y * 1000,
    targetM.z * 1000,
  ]

  // Verify exact perspective projection against DOM rects & NDC safe frame
  const returnedTargetM = new Vector3(...tgtMm).multiplyScalar(1e-3)
  const camPosM = returnedTargetM.clone().addScaledVector(viewOffsetDir, distM)
  const cam = new PerspectiveCamera(fovDeg, aspect, NEAR_M, FAR_M)
  cam.position.copy(camPosM)
  cam.up.copy(upVec)
  cam.lookAt(returnedTargetM)
  cam.updateMatrixWorld(true)

  const ndcPts = witnessesM.map((p) => p.clone().project(cam))
  let maxNdcX = 0, maxNdcY = 0
  for (const p of ndcPts) {
    if (![p.x, p.y, p.z].every(Number.isFinite) || p.z <= -1 || p.z >= 1
      || p.x < freeBox.ndcMinX || p.x > freeBox.ndcMaxX
      || p.y < freeBox.ndcMinY || p.y > freeBox.ndcMaxY) {
      throw new RangeError('Infeasible HUD framing: exact projection failed safe-box or clipping gate')
    }
    maxNdcX = Math.max(maxNdcX, Math.abs(p.x))
    maxNdcY = Math.max(maxNdcY, Math.abs(p.y))
  }

  const pxPts = ndcPts.map((p) => [((p.x + 1) * viewport.width) / 2, ((1 - p.y) * viewport.height) / 2])
  const subjMin = [Math.min(...pxPts.map((p) => p[0])), Math.min(...pxPts.map((p) => p[1]))]
  const subjMax = [Math.max(...pxPts.map((p) => p[0])), Math.max(...pxPts.map((p) => p[1]))]

  let minClearance = Infinity
  for (const r of viewport.rects) {
    const sep = Math.max(
      r.min[0] - subjMax[0],
      subjMin[0] - r.max[0],
      r.min[1] - subjMax[1],
      subjMin[1] - r.max[1],
    )
    minClearance = Math.min(minClearance, sep)
  }

  if (minClearance < (viewport.minClearancePx ?? 8)) {
    throw new RangeError('Infeasible HUD framing: exact projection failed HUD clearance gate')
  }
  return {
    tgtMm,
    fovDeg,
    minRectClearancePx: minClearance,
    maxNdc: [maxNdcX, maxNdcY],
  }
}
