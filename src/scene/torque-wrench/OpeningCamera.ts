import { Vector3 } from 'three'
import type { DrawingLayout } from '../drawing/drawingGeometry'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'

const overview = new Vector3(0.32, 0.16, 0.42)
const overviewTarget = new Vector3()
const overviewUp = new Vector3(0, 1, 0)
const orbitStart = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }

/** The shatter owns this span: one complete revolution, then a settled overview. */
export const SHATTER_ORBIT_START = 0.43
export const SHATTER_ORBIT_END = 0.452
const smooth = (u: number) => u * u * u * (u * (u * 6 - 15) + 10)

function overviewPose(out: SheetCameraPose, aspect: number): SheetCameraPose {
  out.position.copy(overview); out.target.copy(overviewTarget); out.up.copy(overviewUp)
  out.fov = aspect < 0.8 ? 58 : 42; out.ortho = 0
  out.distance = out.position.distanceTo(out.target)
  return out
}

/** One full low orbit around the emerging model, then the Ring Switch handoff pose. */
export function sampleOpeningCamera(layout: DrawingLayout, aspect: number, progress: number, out: SheetCameraPose) {
  if (!Number.isFinite(progress)) throw new RangeError('Opening camera progress must be finite')
  if (progress >= SHATTER_ORBIT_END) return overviewPose(out, aspect)
  if (progress <= SHATTER_ORBIT_START) return introCameraPose(layout, aspect, openingTimeAt(progress), out)

  introCameraPose(layout, aspect, openingTimeAt(SHATTER_ORBIT_START), orbitStart)
  const u = smooth((progress - SHATTER_ORBIT_START) / (SHATTER_ORBIT_END - SHATTER_ORBIT_START))
  const sx = orbitStart.position.x - orbitStart.target.x
  const sy = orbitStart.position.y - orbitStart.target.y
  const sz = orbitStart.position.z - orbitStart.target.z
  const startDistance = Math.hypot(sx, sy, sz)
  const endDistance = overview.length()
  const startAzimuth = Math.atan2(sx, sz)
  const endAzimuth = Math.atan2(overview.x, overview.z)
  const endDelta = Math.atan2(Math.sin(endAzimuth - startAzimuth), Math.cos(endAzimuth - startAzimuth))
  // The extra 2π guarantees a complete orbit even when start and end point the
  // same way; the final delta lands exactly on the overview without a snap.
  const azimuth = startAzimuth + (Math.PI * 2 + endDelta) * u
  const elevation = Math.asin(sy / startDistance)
    + (Math.asin(overview.y / endDistance) - Math.asin(sy / startDistance)) * u
  const distance = startDistance + (endDistance - startDistance) * u
  const horizontal = distance * Math.cos(elevation)
  out.target.lerpVectors(orbitStart.target, overviewTarget, u)
  out.position.set(
    out.target.x + horizontal * Math.sin(azimuth),
    out.target.y + distance * Math.sin(elevation),
    out.target.z + horizontal * Math.cos(azimuth),
  )
  out.up.copy(orbitStart.up).lerp(overviewUp, u).normalize()
  out.fov = orbitStart.fov + ((aspect < 0.8 ? 58 : 42) - orbitStart.fov) * u
  out.ortho = orbitStart.ortho * (1 - u)
  out.distance = out.position.distanceTo(out.target)
  return out
}
