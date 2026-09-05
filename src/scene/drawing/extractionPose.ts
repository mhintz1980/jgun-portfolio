import { Matrix4, Vector3 } from 'three'
import type { DrawingGeometry, DrawingLayout, RenderedDrawing } from './drawingGeometry'
import { SIDE_ROTATION, SHEET_ROTATION } from './drawingGeometry'
import { clamp01, smooth01 } from './introTimeline'

export interface Extraction {
  travel: number
  initialZ: number
  /** Pose time at which the lowest transformed vertex crosses the sheet plane. */
  crossing: number
  contact: Vector3
  support: Vector3[]
}

const rotationX = new Matrix4()
const rotationY = new Matrix4()
const rotationZ = new Matrix4()
const translation = new Matrix4()

/**
 * Model pose relative to the sheet, on the POSE axis (not the scroll axis).
 *
 * `introTimeline.introPoseTime()` decides how much scroll each part of this range costs, so
 * pacing changes never move the geometry solved below. At t = 1 the rotations are back to
 * zero and the translation is exactly the release translation, which is what makes the
 * composed model matrix land on world identity when the intro hands off.
 */
export function relativePose(
  t: number,
  layout: DrawingLayout,
  travel: number,
  initialZ: number,
  out: Matrix4,
): Matrix4 {
  const u = clamp01((t - 0.4) / 0.6)
  const angle = Math.sin(Math.PI * u)
  out
    .makeTranslation(layout.primaryCenter.x, layout.primaryCenter.y, initialZ + travel * Math.pow(u, 4))
    .multiply(rotationX.makeRotationX(angle * 0.28))
    .multiply(rotationY.makeRotationY(angle * 0.45))
    .multiply(rotationZ.identity())
    .multiply(SIDE_ROTATION)
  return out
}

/** Exact support vertex of the transformed mesh. Used off the frame loop for the root solve. */
export function lowestVertex(data: DrawingGeometry, matrix: Matrix4): Vector3 {
  const a = data.geometry.getAttribute('position')
  const m = matrix.elements
  let z = Infinity
  let index = 0
  for (let i = 0; i < a.count; i += 1) {
    const pz = m[2] * a.getX(i) + m[6] * a.getY(i) + m[10] * a.getZ(i) + m[14]
    if (pz < z) {
      z = pz
      index = i
    }
  }
  return new Vector3().fromBufferAttribute(a, index).applyMatrix4(matrix)
}

/**
 * Solve the detachment: 44 bisection steps on the lowest transformed vertex give the pose
 * time at which the model actually leaves the sheet, to within floating-point contact. The
 * shockwave is triggered from this number, never from a phase boundary.
 */
export function solveExtraction(data: DrawingGeometry, layout: DrawingLayout): Extraction {
  const side = data.bounds.clone().applyMatrix4(layout.primaryRotation)
  const initialZ = -side.max.z
  const travel = Math.max(0.22, (side.max.z - side.min.z) * 2.6)
  const matrix = new Matrix4()
  let lo = 0.4
  let hi = 1
  for (let i = 0; i < 44; i += 1) {
    const t = (lo + hi) / 2
    if (lowestVertex(data, relativePose(t, layout, travel, initialZ, matrix)).z > 0) hi = t
    else lo = t
  }
  const crossing = (lo + hi) / 2
  relativePose(crossing, layout, travel, initialZ, matrix)
  const contact = lowestVertex(data, matrix)
  // Actual supporting vertices across the authored orientation range. Include exact contact.
  const support: Vector3[] = []
  const add = (t: number) => {
    relativePose(t, layout, travel, initialZ, matrix)
    const p = lowestVertex(data, matrix).applyMatrix4(matrix.clone().invert())
    if (!support.some((q) => q.distanceToSquared(p) < 1e-16)) support.push(p)
  }
  for (let i = 0; i <= 64; i += 1) add(0.4 + (i / 64) * 0.6)
  add(crossing)
  return { travel, initialZ, crossing, contact, support }
}

const pose = new Matrix4()
const sheet = new Matrix4()
const temp = new Vector3()

export function applyExtraction(
  t: number,
  layout: DrawingLayout,
  extraction: Extraction,
  modelMatrix: Matrix4,
  sheetMatrix: Matrix4,
): number {
  const release = smooth01((t - 0.7) / 0.3)
  sheet.copy(SHEET_ROTATION).multiply(
    translation.makeTranslation(
      -layout.primaryCenter.x * release,
      -layout.primaryCenter.y * release,
      -(extraction.initialZ + extraction.travel) * release,
    ),
  )
  relativePose(t, layout, extraction.travel, extraction.initialZ, pose)
  modelMatrix.multiplyMatrices(sheet, pose)
  sheetMatrix.copy(sheet)
  let minZ = Infinity
  for (const p of extraction.support) minZ = Math.min(minZ, temp.copy(p).applyMatrix4(pose).z)
  return minZ
}

/** Shared mutable rendering state. No React subscription in Canvas and no per-frame setState. */
export const drawingRuntime = {
  ready: false,
  captureNext: null as null | (() => void),
  rendered: null as RenderedDrawing | null,
  modelMatrix: new Matrix4(),
  sheetMatrix: new Matrix4(),
  layout: null as DrawingLayout | null,
  extraction: null as Extraction | null,
}
