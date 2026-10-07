import { Matrix4, Vector3 } from 'three'
import type { DrawingGeometry, DrawingLayout, RenderedDrawing } from './drawingGeometry'
import { SIDE_ROTATION, SHEET_ROTATION } from './drawingGeometry'
import { clamp01, smooth01 } from './introTimeline'
import { getQuality } from '../../state/qualityStore'
import { getPaperFlexField, PAPER_FLEX_MAX, paperFlexTierScale, type PaperFlexField } from './sheet/paperFlex'

export interface Extraction {
  travel: number
  initialZ: number
  clearanceTravel: number
  /** Pose time at which the lowest transformed vertex crosses the sheet plane. */
  crossing: number
  contact: Vector3
  support: Vector3[]
  /** Highest actual mesh vertex at rest, in sheet-local coordinates. */
  initialTop: number
  /** Maximal pressure push bounded against every vertex and the live flex field. */
  pressureTravel: number
  /** Model surface and push telemetry updated by applyExtraction. */
  modelTop: number
  modelPush: number
  pressureClearance: number
}

const translation = new Matrix4()
const source = new WeakMap<Extraction, { data: DrawingGeometry; field: PaperFlexField | null; full: number; lite: number; tier: string; restMin: number }>()
// 0.45 mm stock: reserve its lower half thickness plus 0.05 mm separation.
const STOCK_UNDERSIDE = 0.000275

export function extractionLift(t: number, travel: number, pressureTravel: number): number {
  if (t <= 0.5) return pressureTravel * smooth01((t - 0.4) / 0.1)
  const u = clamp01((t - 0.5) / 0.5)
  return pressureTravel + (travel - pressureTravel) * Math.pow(u, 1.4)
}

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
  clearanceTravel = travel,
  pressureTravel = 0,
): Matrix4 {
  // Translate through the true profile without widening it. The camera supplies
  // the orbit; a free model tilt can bring an already-cleared vertex back below
  // the barrier. Keep this basis throughout the lift so clearance stays monotone.
  void clearanceTravel
  out
    .makeTranslation(layout.primaryCenter.x, layout.primaryCenter.y, initialZ + extractionLift(t, travel, pressureTravel))
    .multiply(SIDE_ROTATION)
  return out
}

/** Exact support vertex of the transformed mesh. Used off the frame loop for the root solve. */
export function lowestVertex(data: DrawingGeometry, matrix: Matrix4): Vector3 {
  const a = data.geometry.getAttribute('position')
  // Raw array walk: the solver calls this ~110 times over ~2.5M vertices during the bake.
  const v = a.array as Float32Array
  const m = matrix.elements
  const m2 = m[2], m6 = m[6], m10 = m[10], m14 = m[14]
  let z = Infinity
  let index = 0
  for (let i = 0, j = 0; i < a.count; i += 1, j += 3) {
    const pz = m2 * v[j] + m6 * v[j + 1] + m10 * v[j + 2] + m14
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
  const initialZ = -side.max.z - 0.0006
  const travel = Math.max(0.22, (side.max.z - side.min.z) * 2.6)
  const clearanceTravel = -side.min.z - initialZ + 0.0006
  const matrix = new Matrix4()
  let lo = 0.4
  let hi = 1
  for (let i = 0; i < 44; i += 1) {
    const t = (lo + hi) / 2
    if (lowestVertex(data, relativePose(t, layout, travel, initialZ, matrix, clearanceTravel)).z > 0) hi = t
    else lo = t
  }
  const crossing = (lo + hi) / 2
  relativePose(crossing, layout, travel, initialZ, matrix, clearanceTravel)
  const contact = lowestVertex(data, matrix)
  // Actual supporting vertices across the authored orientation range. Include exact contact.
  const support: Vector3[] = []
  const add = (t: number) => {
    relativePose(t, layout, travel, initialZ, matrix, clearanceTravel)
    const p = lowestVertex(data, matrix).applyMatrix4(matrix.clone().invert())
    if (!support.some((q) => q.distanceToSquared(p) < 1e-16)) support.push(p)
  }
  for (let i = 0; i <= 64; i += 1) add(0.4 + (i / 64) * 0.6)
  add(crossing)
  // The bounding box can overestimate the top; measure actual transformed vertices.
  const a = data.geometry.getAttribute('position')
  let top = -Infinity
  const e = SIDE_ROTATION.elements
  for (let i = 0; i < a.count; i += 1) top = Math.max(top, e[2] * a.getX(i) + e[6] * a.getY(i) + e[10] * a.getZ(i) + initialZ)
  const extraction = { travel, initialZ, clearanceTravel, crossing, contact, support,
    initialTop: top, pressureTravel: 0, modelTop: top, modelPush: 0, pressureClearance: -top - STOCK_UNDERSIDE }
  source.set(extraction, { data, field: null, full: 0, lite: 0, tier: '',
    restMin: contact.z - extractionLift(crossing, travel, 0) })
  return extraction
}

/** Bake once per field, outside steady-state frames. A scaled endpoint bound is safe
 * throughout pressure: both the lift and sheet displacement use the same smooth01.
 * Use the shader's exact byte texture, not its peak or an assumed silhouette plateau.
 */
export function bindExtractionPressure(extraction: Extraction, layout: DrawingLayout, field: PaperFlexField, tier: string): void {
  const cached = source.get(extraction)
  if (!cached) return
  if (cached.field !== field) {
    const a = cached.data.geometry.getAttribute('position')
    const e = SIDE_ROTATION.elements
    let full = PAPER_FLEX_MAX, lite = PAPER_FLEX_MAX * 0.45
    for (let i = 0; i < a.count; i += 1) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i)
      const px = e[0] * x + e[4] * y + e[8] * z + layout.primaryCenter.x
      const py = e[1] * x + e[5] * y + e[9] * z + layout.primaryCenter.y
      const pz = e[2] * x + e[6] * y + e[10] * z + extraction.initialZ
      const gap = -pz - STOCK_UNDERSIDE
      const weight = field.sample(px, py)
      full = Math.min(full, gap + PAPER_FLEX_MAX * weight)
      lite = Math.min(lite, gap + PAPER_FLEX_MAX * 0.45 * weight)
    }
    cached.full = Math.max(0, full)
    cached.lite = Math.max(0, lite)
    cached.field = field
    cached.tier = ''
  }
  if (cached.tier !== tier) {
    cached.tier = tier
    extraction.pressureTravel = paperFlexTierScale(tier) === 0 ? 0 : tier === 'full' ? cached.full : cached.lite
    // Fixed SIDE_ROTATION makes the true support offset constant. Solve the
    // revised lift analytically, avoiding another repeated multi-million vertex walk.
    extraction.crossing = 0.5 + 0.5 * Math.pow(clamp01((-cached.restMin - extraction.pressureTravel) / (extraction.travel - extraction.pressureTravel)), 1 / 1.4)
  }
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
  tier = getQuality().tier,
): number {
  const field = getPaperFlexField()
  if (field) bindExtractionPressure(extraction, layout, field, tier)
  const release = smooth01((t - 0.7) / 0.3)
  sheet.copy(SHEET_ROTATION).multiply(
    translation.makeTranslation(
      -layout.primaryCenter.x * release,
      -layout.primaryCenter.y * release,
      -(extraction.initialZ + extraction.travel) * release,
    ),
  )
  relativePose(t, layout, extraction.travel, extraction.initialZ, pose, extraction.clearanceTravel, extraction.pressureTravel)
  extraction.modelPush = extractionLift(t, extraction.travel, extraction.pressureTravel)
  extraction.modelTop = extraction.initialTop + extraction.modelPush
  // Conservative clearance guaranteed by the endpoint bound, including stock thickness.
  extraction.pressureClearance = t <= 0.5 ? (-extraction.initialTop - STOCK_UNDERSIDE) * (1 - smooth01((t - 0.4) / 0.1)) : 0
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
