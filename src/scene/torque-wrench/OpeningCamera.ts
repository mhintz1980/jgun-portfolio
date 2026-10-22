import { Vector3 } from 'three'
import type { DrawingLayout } from '../drawing/drawingGeometry'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'

const overview = new Vector3(0.32, 0.16, 0.42)
const overviewTarget = new Vector3()
const overviewUp = new Vector3(0, 1, 0)
const orbitBefore = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }
const orbitStart = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }

/** The shatter owns this span: one complete revolution, then a settled overview. */
export const SHATTER_ORBIT_START = 0.43
export const SHATTER_ORBIT_END = 0.452
const smooth = (u: number) => u * u * u * (u * (u * 6 - 15) + 10)
const ENTRY_SLOPE_PROBE = 1e-4
/** Mid-orbit pull-in (fraction of radius) so the low orbit sweeps through the suspended shard ring, not round it. */
export const ORBIT_SHRAPNEL_DIP = 0.35

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
  // Owner ruling 2026-10-22: the orbit keeps the sense the drafting rake already turns (azimuth DEcreasing
  // through the rupture rake), so it is one continuous direction instead of ~70 deg one way then 360 the other.
  // The extra full turn guarantees a complete revolution; the total lands exactly on the overview.
  const total = endDelta - Math.PI * 2
  // Hermite azimuth: entry slope matches the rake's own angular velocity (C1 at the join), zero slope on arrival.
  introCameraPose(layout, aspect, openingTimeAt(SHATTER_ORBIT_START - ENTRY_SLOPE_PROBE), orbitBefore)
  const bx = orbitBefore.position.x - orbitBefore.target.x
  const bz = orbitBefore.position.z - orbitBefore.target.z
  const beforeDelta = Math.atan2(Math.sin(startAzimuth - Math.atan2(bx, bz)), Math.cos(startAzimuth - Math.atan2(bx, bz)))
  const entrySlope = Math.min(0, beforeDelta / ENTRY_SLOPE_PROBE * (SHATTER_ORBIT_END - SHATTER_ORBIT_START))
  const w = (progress - SHATTER_ORBIT_START) / (SHATTER_ORBIT_END - SHATTER_ORBIT_START)
  const w2 = w * w, w3 = w2 * w
  const azimuth = startAzimuth + (w3 - 2 * w2 + w) * entrySlope + (3 * w2 - 2 * w3) * total
  const elevation = Math.asin(sy / startDistance)
    + (Math.asin(overview.y / endDistance) - Math.asin(sy / startDistance)) * u
  // sin^2 dip: zero value and slope at both ends, so the join and the overview handoff stay C1.
  const dip = Math.sin(Math.PI * w)
  const distance = (startDistance + (endDistance - startDistance) * u) * (1 - ORBIT_SHRAPNEL_DIP * dip * dip)
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
