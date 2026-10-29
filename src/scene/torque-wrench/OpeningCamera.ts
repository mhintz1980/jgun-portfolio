import { Vector3 } from 'three'
import type { DrawingLayout } from '../drawing/drawingGeometry'
import { introCameraPose, type SheetCameraPose } from '../drawing/sheetCamera'
import { openingTimeAt } from './OpeningDirector'
import { BULLET_TIME_SHOT_SPECS } from './bulletTime'

const overview = new Vector3(0.32, 0.16, 0.42)
const overviewTarget = new Vector3()
const overviewUp = new Vector3(0, 1, 0)
const orbitBefore = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }
const orbitEarlier = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }
const orbitStart = { position: new Vector3(), target: new Vector3(), up: new Vector3(), fov: 30, ortho: 0, distance: 1 }

/** The shatter owns this span: one complete revolution, then a settled overview. */
export const [SHATTER_ORBIT_START, SHATTER_ORBIT_END] = BULLET_TIME_SHOT_SPECS.shatter.window
const ENTRY_SLOPE_PROBE = 1e-6
const entryDerivative = (a: number, b: number, c: number) => (3 * a - 4 * b + c) / (2 * ENTRY_SLOPE_PROBE)
const entryJoin = (a: number, b: number, slope: number, u: number) =>
  a + (b - a) * u * u * (3 - 2 * u) + slope * u * (1 - u) * (1 - u)
/**
 * Mid-orbit pull-in (fraction of radius) so the low orbit sweeps through the suspended shard ring, not round it.
 * rho(w) = rho_base(u) * (1 - k * sin^2(pi w)). The base radius already closes from the rake distance to the
 * overview, so a shallow k never dropped below the arrival radius; desktop now dives to ~0.5 of the base radius.
 * Narrow viewports (horizontal fov ~13 deg at the orbit's 30 deg lens) keep a shallower dive so shards are not cropped.
 */
export const ORBIT_SHRAPNEL_DIP = 0.35
export const ORBIT_SHRAPNEL_DIP_DESKTOP = 0.5
/** Mid-orbit elevation drop (rad), sin^2-shaped: shards cross the dark background, not only the vellum. */
export const ORBIT_ELEVATION_DIP = 0.087
export const ORBIT_ELEVATION_DIP_NARROW = 0.052
const layoutBlend = (aspect: number) => Math.max(0, Math.min(1, (aspect - 0.62) / 0.4))

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
  introCameraPose(layout, aspect, openingTimeAt(SHATTER_ORBIT_START - 2 * ENTRY_SLOPE_PROBE), orbitEarlier)
  const bx = orbitBefore.position.x - orbitBefore.target.x
  const bz = orbitBefore.position.z - orbitBefore.target.z
  const beforeDelta = Math.atan2(Math.sin(startAzimuth - Math.atan2(bx, bz)), Math.cos(startAzimuth - Math.atan2(bx, bz)))
  const ex = orbitEarlier.position.x - orbitEarlier.target.x, ey = orbitEarlier.position.y - orbitEarlier.target.y, ez = orbitEarlier.position.z - orbitEarlier.target.z
  const earlierDelta = Math.atan2(Math.sin(startAzimuth - Math.atan2(ex, ez)), Math.cos(startAzimuth - Math.atan2(ex, ez)))
  const duration = SHATTER_ORBIT_END - SHATTER_ORBIT_START
  const entrySlope = Math.min(0, (4 * beforeDelta - earlierDelta) / (2 * ENTRY_SLOPE_PROBE) * duration)
  const w = (progress - SHATTER_ORBIT_START) / (SHATTER_ORBIT_END - SHATTER_ORBIT_START)
  const w2 = w * w, w3 = w2 * w
  const azimuth = startAzimuth + (w3 - 2 * w2 + w) * entrySlope + (3 * w2 - 2 * w3) * total
  // sin^2 dip: zero value and slope at both ends, so the join and the overview handoff stay C1.
  const dip = Math.sin(Math.PI * w)
  const layout01 = layoutBlend(aspect)
  const beforeRadius = Math.hypot(bx, orbitBefore.position.y - orbitBefore.target.y, bz), earlierRadius = Math.hypot(ex, ey, ez)
  const startElevation = Math.asin(sy / startDistance)
  const elevationSlope = entryDerivative(startElevation,
    Math.asin((orbitBefore.position.y - orbitBefore.target.y) / beforeRadius), Math.asin(ey / earlierRadius)) * duration
  const elevation = entryJoin(startElevation, Math.asin(overview.y / endDistance), elevationSlope, w)
    - (ORBIT_ELEVATION_DIP_NARROW + (ORBIT_ELEVATION_DIP - ORBIT_ELEVATION_DIP_NARROW) * layout01) * dip * dip
  const dive = ORBIT_SHRAPNEL_DIP + (ORBIT_SHRAPNEL_DIP_DESKTOP - ORBIT_SHRAPNEL_DIP) * layout01
  const logSlope = entryDerivative(Math.log(startDistance), Math.log(beforeRadius), Math.log(earlierRadius)) * duration
  const distance = Math.exp(entryJoin(Math.log(startDistance), Math.log(endDistance), logSlope, w)) * (1 - dive * dip * dip)
  const horizontal = distance * Math.cos(elevation)
  out.target.set(
    entryJoin(orbitStart.target.x, overviewTarget.x, entryDerivative(orbitStart.target.x, orbitBefore.target.x, orbitEarlier.target.x) * duration, w),
    entryJoin(orbitStart.target.y, overviewTarget.y, entryDerivative(orbitStart.target.y, orbitBefore.target.y, orbitEarlier.target.y) * duration, w),
    entryJoin(orbitStart.target.z, overviewTarget.z, entryDerivative(orbitStart.target.z, orbitBefore.target.z, orbitEarlier.target.z) * duration, w),
  )
  out.position.set(
    out.target.x + horizontal * Math.sin(azimuth),
    out.target.y + distance * Math.sin(elevation),
    out.target.z + horizontal * Math.cos(azimuth),
  )
  out.up.set(
    entryJoin(orbitStart.up.x, overviewUp.x, entryDerivative(orbitStart.up.x, orbitBefore.up.x, orbitEarlier.up.x) * duration, w),
    entryJoin(orbitStart.up.y, overviewUp.y, entryDerivative(orbitStart.up.y, orbitBefore.up.y, orbitEarlier.up.y) * duration, w),
    entryJoin(orbitStart.up.z, overviewUp.z, entryDerivative(orbitStart.up.z, orbitBefore.up.z, orbitEarlier.up.z) * duration, w),
  ).normalize()
  out.fov = entryJoin(orbitStart.fov, aspect < 0.8 ? 58 : 42, entryDerivative(orbitStart.fov, orbitBefore.fov, orbitEarlier.fov) * duration, w)
  out.ortho = entryJoin(orbitStart.ortho, 0, entryDerivative(orbitStart.ortho, orbitBefore.ortho, orbitEarlier.ortho) * duration, w)
  out.distance = out.position.distanceTo(out.target)
  return out
}
