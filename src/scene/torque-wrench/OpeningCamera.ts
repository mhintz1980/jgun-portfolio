import { Vector3 } from 'three'
import type { DrawingLayout } from '../drawing/drawingGeometry'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'

const overview = new Vector3(0.32, 0.16, 0.42)
const overviewTarget = new Vector3()
const overviewUp = new Vector3(0, 1, 0)

/** Private opening handoff. Stops at both endpoints; no extra scroll smoothing. */
export function sampleOpeningCamera(layout: DrawingLayout, aspect: number, progress: number, out: SheetCameraPose) {
  if (!Number.isFinite(progress)) throw new RangeError('Opening camera progress must be finite')
  if (progress >= 0.46) {
    out.position.copy(overview); out.target.copy(overviewTarget); out.up.copy(overviewUp)
    out.fov = aspect < 0.8 ? 58 : 42; out.ortho = 0
    out.distance = out.position.distanceTo(out.target)
    return out
  }
  if (progress <= 0.435) return introCameraPose(layout, aspect, openingTimeAt(progress), out)
  introCameraPose(layout, aspect, openingTimeAt(0.435), out)
  const u = Math.max(0, Math.min(1, (progress - 0.435) / 0.025))
  const k = u * u * u * (10 + u * (-15 + 6 * u))
  out.position.lerp(overview, k)
  out.target.lerp(overviewTarget, k)
  out.up.lerp(overviewUp, k).normalize()
  out.fov += ((aspect < 0.8 ? 58 : 42) - out.fov) * k
  out.ortho *= 1 - k
  out.distance = out.position.distanceTo(out.target)
  return out
}
