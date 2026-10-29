import { SHEET_ROTATION, type DrawingLayout } from '../drawing/drawingGeometry'
import { smooth01 } from '../drawing/introTimeline'
import { applyExtractionCore, type Extraction, type ExtractionContext } from '../drawing/poseCore'
import type { PaperFlexField } from '../drawing/sheet/paperFlex'

/** Private opening release: couple sheet retirement to actual lift, rather than
 * letting the shared pose-.7 smoothstep overtake the ascending model in world space.
 * Relative pose, pressure binding and the exact final identity remain shared.
 */
export function applyOpeningExtractionCore(
  t: number,
  layout: DrawingLayout,
  extraction: Extraction,
  field: PaperFlexField | null,
  tier: string,
  out: ExtractionContext,
): number {
  const clearance = applyExtractionCore(t, layout, extraction, field, tier, out)
  if (t <= 0.5 || t >= 1) return clearance
  // Lift = pressureTravel + (travel - pressureTravel) * release. Using
  // the same release for the sheet leaves composed normal translation at
  // (initialZ + pressureTravel) * (1 - release): continuous ascent to zero
  // from the pressure-bound pose below the sheet, without an overshoot.
  const release = Math.pow((t - 0.5) / 0.5, 1.4)
  const correction = smooth01((t - 0.7) / 0.3) - release
  const x = layout.primaryCenter.x * correction, y = layout.primaryCenter.y * correction
  const z = (extraction.initialZ + extraction.travel) * correction
  const r = SHEET_ROTATION.elements
  const dx = r[0] * x + r[4] * y + r[8] * z
  const dy = r[1] * x + r[5] * y + r[9] * z
  const dz = r[2] * x + r[6] * y + r[10] * z
  const sheet = out.sheetMatrix.elements, model = out.modelMatrix.elements
  sheet[12] += dx; sheet[13] += dy; sheet[14] += dz
  model[12] += dx; model[13] += dy; model[14] += dz
  return clearance
}
