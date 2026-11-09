import type { ShaftKinematicsFrame } from '../inspection/shaft/kinematics'
import { MESH_AZ_RAD } from '../inspection/shaft/kinematics'
import { SHAFT_OD_MM } from '../inspection/shaft/progression'
import { shaftBeat } from '../inspection/shaft/story'
import { SHAPER_LEADING_FACE_Y_MM, SHAPER_ROOT_LIMIT_MM, SHAPER_TIP_RADIUS_MM } from '../inspection/shaft/toolSpec'
import { AUTHENTICATED_SHAFT_FEATURE_BANDS } from './cascadeFeatureMask'

/** Coordinates AFTER stripping shaft.root.matrixWorld: study metres (x, CAD z, -CAD y).
 * Do not pass mesh-local vertices or CAD millimetres. No camera/projection enters this API. */
export interface ShaftRootPoint {
  readonly x: number
  readonly y: number
  readonly z: number
}
export type ShaperContactPhase = 'inactive' | 'approach' | 'cutting' | 'return' | 'overtravel'
export type ShaperContactPose = Readonly<
  Pick<ShaftKinematicsFrame, 'time' | 'mode' | 'cutterRho' | 'strokeCentreY' | 'cutting' | 'engagedSpace'>
>

export interface ShaperContactRegion {
  readonly active: boolean
  /** Only 'cutting' asserts stock engagement. Other active phases retain the same tool feature. */
  readonly phase: ShaperContactPhase
  readonly centreX: number
  readonly centreY: number
  readonly leadingZ: number
  readonly sectorSin: number
}

const MM = 0.001
// 20 nm accommodates Float32 position attributes, not a screen-space or composition margin.
const EPS = 2e-8
const AX = Math.cos(MESH_AZ_RAD),
  AY = Math.sin(MESH_AZ_RAD)
const START = shaftBeat('shaping').start,
  END = shaftBeat('recap').end
/** Source-shaped exit is included; the later hob lead-out is a different feature/phase. */
export const SHAPER_WORKPIECE_BAND_MM = AUTHENTICATED_SHAFT_FEATURE_BANDS.inputSunTeeth.sourceFullShaping[0]

/**
 * placeShaper puts the tool centre at (tip radius + cutterRho) on MESH_AZ_RAD.
 * The two tangents from that centre to the authenticated stock OD delimit the
 * near-side engagement sector: sin(half-angle) = stock radius / centre distance.
 * Select only its toothed rim on the retained +0.6 mm rake face, never the bore,
 * back face, mount or far quadrant. The sector follows infeed/backoff and stroke,
 * so the real tip remains a required feature during approach/return/overtravel;
 * those are explicitly NOT claims of simultaneous tool/stock contact.
 *
 * This filters framing witnesses only. Keep complete installed tool hulls and
 * matrices for context and mechanical replay. An empty tool result is a proof
 * failure, not permission to fall back to shaft-only witnesses.
 */
export function shaperContactRegion(pose: ShaperContactPose): ShaperContactRegion {
  if (![pose.time, pose.cutterRho, pose.strokeCentreY].every(Number.isFinite) || pose.cutterRho < 0)
    throw new RangeError('Shaper witness pose requires finite time/stroke and nonnegative cutterRho')
  const distanceMm = SHAPER_TIP_RADIUS_MM + pose.cutterRho
  const active = pose.mode === 'shaping' && pose.time >= START && pose.time < END
  const edgeY = pose.strokeCentreY + SHAPER_LEADING_FACE_Y_MM
  const [yMin, yMax] = SHAPER_WORKPIECE_BAND_MM
  const phase: ShaperContactPhase = !active
    ? 'inactive'
    : edgeY > yMax
      ? 'overtravel'
      : !pose.cutting
        ? 'return'
        : pose.engagedSpace >= 0 && edgeY >= yMin
          ? 'cutting'
          : 'approach'
  return {
    active,
    phase,
    centreX: AX * distanceMm * MM,
    centreY: AY * distanceMm * MM,
    leadingZ: -edgeY * MM,
    sectorSin: SHAFT_OD_MM / distanceMm,
  }
}

const finitePoint = (p: ShaftRootPoint) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)

/** Real installed cutter vertices only; caller owns their world/datum transforms. */
export function isShaperToolContactPoint(p: ShaftRootPoint, region: ShaperContactRegion): boolean {
  if (!region.active || !finitePoint(p) || Math.abs(p.z - region.leadingZ) > EPS) return false
  const dx = p.x - region.centreX,
    dy = p.y - region.centreY
  const radius = Math.hypot(dx, dy)
  if (radius < SHAPER_ROOT_LIMIT_MM * MM - EPS || radius > SHAPER_TIP_RADIUS_MM * MM + EPS) return false
  const inward = -AX * dx - AY * dy
  const transverse = Math.abs(AY * dx - AX * dy)
  return inward > 0 && transverse <= radius * region.sectorSin + EPS
}

/** Complete authenticated shaped tooth/exit band, independent of instantaneous cutter stroke. */
export function isShaperShaftContactPoint(p: ShaftRootPoint, region: ShaperContactRegion): boolean {
  if (!region.active || !finitePoint(p)) return false
  const [yMin, yMax] = SHAPER_WORKPIECE_BAND_MM
  return -p.z >= yMin * MM - EPS && -p.z <= yMax * MM + EPS && Math.hypot(p.x, p.y) <= SHAFT_OD_MM * MM + EPS
}
