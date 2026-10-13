import { Matrix4 } from 'three'
import type { DrawingLayout, RenderedDrawing } from './drawingGeometry'
import { getQuality } from '../../state/qualityStore'
import { getPaperFlexField, type PaperFlexField } from './sheet/paperFlex'
import {
  applyBoundExtraction, bindExtractionPressure as bindCorePressure,
  createExtractionContext, type Extraction,
} from './poseCore'

export type { Extraction } from './poseCore'
export { extractionLift, relativePose, lowestVertex, solveExtraction } from './poseCore'

/** Keep the legacy non-null binding signature. */
export function bindExtractionPressure(extraction: Extraction, layout: DrawingLayout, field: PaperFlexField, tier: string): void {
  bindCorePressure(extraction, layout, field, tier)
}

const legacyContext = createExtractionContext()

export function applyExtraction(
  t: number,
  layout: DrawingLayout,
  extraction: Extraction,
  modelMatrix: Matrix4,
  sheetMatrix: Matrix4,
  tier = getQuality().tier,
): number {
  const field = getPaperFlexField()
  if (field) bindCorePressure(extraction, layout, field, tier)
  legacyContext.modelMatrix = modelMatrix
  legacyContext.sheetMatrix = sheetMatrix
  return applyBoundExtraction(t, layout, extraction, legacyContext)
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
