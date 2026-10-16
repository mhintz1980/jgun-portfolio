/**
 * JG-038 C1: pure canonical-progress inspection sample. The private host owns
 * camera application, playback arbitration and the shaft-to-world conversion.
 * No narrative clock, stores, Three objects or mutable shared scratch live here.
 */
import {
  createShaftKinematicsFrame,
  machiningRateAt,
  sampleShaftKinematics,
  type ShaftKinematicsFrame,
} from '../inspection/shaft/kinematics'
import {
  createShaftCameraSample,
  sampleShaftCamera,
  type ShaftCameraSample,
} from '../inspection/shaft/camera'

interface TimeKnot {
  readonly progress: number
  readonly time: number
}

const SUBJECT_KNOTS: readonly TimeKnot[] = [
  { progress: 0.735, time: 0 },
  { progress: 0.795, time: 7.2 },
  { progress: 0.8, time: 7.5 },
  { progress: 0.832, time: 8.3 },
  { progress: 0.835, time: 9.6 },
  { progress: 0.87, time: 24.6 },
  { progress: 0.884, time: 25 },
  { progress: 0.902, time: 31.8 },
  { progress: 0.905, time: 32 },
  { progress: 0.94, time: 43 },
]

/**
 * The camera is allowed to lead the machining master. It dwells with the fading
 * cutter, makes the recap/FEA move while the subject is static, then re-syncs at
 * hob engagement and settles before the approved close handoff.
 */
const CAMERA_KNOTS: readonly TimeKnot[] = [
  { progress: 0.735, time: 0 },
  { progress: 0.795, time: 7.2 },
  { progress: 0.835, time: 10.3 },
  { progress: 0.846, time: 10.4 },
  { progress: 0.863, time: 15 },
  { progress: 0.874, time: 22.6 },
  { progress: 0.884, time: 25 },
  { progress: 0.905, time: 32 },
  { progress: 0.925, time: 43 },
  { progress: 0.94, time: 43 },
]

const RING_TIME_KNOTS: readonly TimeKnot[] = [
  { progress: 0.69, time: 0 },
  { progress: 0.7, time: 2.8 },
  { progress: 0.712, time: 6.2 },
  { progress: 0.724, time: 10.5 },
  { progress: 0.735, time: 12 },
]

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth01 = (x: number) => {
  const u = clamp01(x)
  // Evaluate the same cubic from the nearer endpoint to avoid weight overshoot.
  return u <= 0.5 ? u * u * (3 - 2 * u) : 1 - (1 - u) * (1 - u) * (1 + 2 * u)
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const DEG = Math.PI / 180

/** Weighted harmonic PCHIP tangent: monotone spans with shared C1 knot rates. */
function timeSlope(knots: readonly TimeKnot[], index: number): number {
  if (index === 0 || index === knots.length - 1) return 0
  const a = knots[index - 1]
  const b = knots[index]
  const c = knots[index + 1]
  const h0 = b.progress - a.progress
  const h1 = c.progress - b.progress
  const d0 = (b.time - a.time) / h0
  const d1 = (c.time - b.time) / h1
  const w0 = 2 * h1 + h0
  const w1 = h1 + 2 * h0
  return (w0 + w1) / (w0 / d0 + w1 / d1)
}

function timeAt(knots: readonly TimeKnot[], progress: number, endTime: number): number {
  if (progress <= knots[0].progress) return knots[0].time
  if (progress >= knots[knots.length - 1].progress) return knots[0].time + endTime
  let i = 0
  while (i < knots.length - 2 && progress >= knots[i + 1].progress) i++
  const a = knots[i]
  const b = knots[i + 1]
  if (progress === a.progress) return a.time
  const h = b.progress - a.progress
  const u = (progress - a.progress) / h
  const u2 = u * u
  const u3 = u2 * u
  const result = (2 * u3 - 3 * u2 + 1) * a.time
    + (u3 - 2 * u2 + u) * h * timeSlope(knots, i)
    + (-2 * u3 + 3 * u2) * b.time
    + (u3 - u2) * h * timeSlope(knots, i + 1)
  return Math.max(a.time, Math.min(b.time, result))
}

/** Subject master seconds; internal hob knots deliberately apply bullet time. */
function subjectTimeAt(progress: number): number {
  return timeAt(SUBJECT_KNOTS, progress, 43)
}

/** Authored camera seconds, independent of machining's integrated rate. */
function cameraTimeAt(progress: number): number {
  return timeAt(CAMERA_KNOTS, progress, 43)
}

/** Ring master seconds on the fixed canonical .69-.735 span. */
export function ringTimeAt(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Ring progress must be finite')
  return timeAt(RING_TIME_KNOTS, clamp01(progress), 12)
}

/**
 * Camera arrival precedes isolation. Ring and shaft are one contiguous isolated
 * study, so surroundings remain black between subjects and restore only through
 * the approved close handoff (.925-.94).
 */
export function sampleInspectionSurroundings(progress: number): number {
  if (!Number.isFinite(progress)) throw new RangeError('Isolation progress must be finite')
  const p = clamp01(progress)
  if (p <= 0.69 || p >= 0.94) return 1
  if (p < 0.703) return 1 - smooth01((p - 0.69) / 0.013)
  if (p < 0.924) return 0
  return smooth01((p - 0.924) / 0.016)
}

export interface CutterCameraKeyframe {
  /** Subject master seconds gate the arc; camera seconds parameterize its path. */
  readonly subjectTime: number
  readonly cameraTime: number
  /** Machine-frame radians, metres, and vertical FOV degrees. */
  readonly azimuth: number
  readonly elevation: number
  readonly distance: number
  readonly fovDesktop: number
  readonly fovNarrow: number
  readonly target: readonly [number, number, number]
  readonly targetNarrow: readonly [number, number, number]
}

/**
 * Shaft-local METRES, +Y up. Authored framing candidates, not clearance proof.
 * Targets/FOV retain the baseline desktop and narrow slow-window composition.
 * The host must review the actual cutter, occlusion and DOM framing at runtime.
 */
export const CutterCameraArc: readonly CutterCameraKeyframe[] = Object.freeze([
  Object.freeze({
    subjectTime: 7.2, cameraTime: cameraTimeAt(0.795),
    azimuth: 168 * DEG, elevation: 3.2 * DEG, distance: 0.2,
    fovDesktop: 10.2, fovNarrow: 24,
    target: Object.freeze([0, 0.009, 0.0078] as const),
    targetNarrow: Object.freeze([0, 0.0082, 0.014] as const),
  }),
  Object.freeze({
    subjectTime: 9.6, cameraTime: cameraTimeAt(0.835),
    azimuth: 192 * DEG, elevation: 6 * DEG, distance: 0.205,
    fovDesktop: 10.2, fovNarrow: 24,
    target: Object.freeze([0, 0.009, 0.0078] as const),
    targetNarrow: Object.freeze([0, 0.0082, 0.014] as const),
  }),
])

export interface PrivateInspectionCamera extends ShaftCameraSample {
  /** Normalized look direction; together with up specifies orientation, no roll override. */
  dx: number
  dy: number
  dz: number
}

export interface PrivateInspectionSample {
  progress: number
  /** Master seconds sent unchanged to the existing shaft sampler. */
  subjectTime: number
  /** Authored camera clock, not machining time or elapsed wall time. */
  cameraTime: number
  /** Existing dm/d(subject master seconds), not dm/d(canonical progress). */
  machiningRate: number
  arcWeight: number
  feaDwellWeight: number
  hobSwingWeight: number
  surroundingsOpacity: number
  /** Existing kinematics remain in shaft-local millimetres and radians. */
  kinematics: ShaftKinematicsFrame
  /** Camera position/target are shaft-local metres; FOV is vertical degrees. */
  camera: PrivateInspectionCamera
}

export function createPrivateInspectionSample(): PrivateInspectionSample {
  return {
    progress: 0, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0,
    feaDwellWeight: 0, hobSwingWeight: 0, surroundingsOpacity: 1,
    kinematics: createShaftKinematicsFrame(),
    camera: { ...createShaftCameraSample(), dx: 0, dy: 0, dz: -1 },
  }
}

function orbitAboutTarget(
  camera: ShaftCameraSample,
  radians: number,
  distanceScale: number,
): void {
  const ox = (camera.px - camera.tx) * distanceScale
  const oy = camera.py - camera.ty
  const oz = (camera.pz - camera.tz) * distanceScale
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  camera.px = camera.tx + ox * cos + oz * sin
  camera.py = camera.ty + oy
  camera.pz = camera.tz - ox * sin + oz * cos
}

/** No allocations per sample; all mutation is confined to the caller's output. */
export function samplePrivateInspection(
  progress: number,
  aspect: number,
  out: PrivateInspectionSample,
): PrivateInspectionSample {
  // Validate both inputs before touching output, including on out-of-range progress.
  if (!Number.isFinite(progress) || !Number.isFinite(aspect)) {
    throw new RangeError('Private inspection progress and aspect must be finite')
  }
  const p = clamp01(progress)
  const subjectTime = subjectTimeAt(p)
  const cameraTime = cameraTimeAt(p)
  const a = CutterCameraArc[0]
  const b = CutterCameraArc[1]
  const arcWeight = smooth01((cameraTime - 6.5) / (a.subjectTime - 6.5))
    * (1 - smooth01((cameraTime - 10.4) / (11.2 - 10.4)))

  out.progress = p
  out.subjectTime = subjectTime
  out.cameraTime = cameraTime
  out.machiningRate = machiningRateAt(subjectTime)
  out.arcWeight = arcWeight
  out.surroundingsOpacity = sampleInspectionSurroundings(p)
  sampleShaftKinematics(subjectTime, out.kinematics)

  // Camera seconds drive the normal camera while machining remains on its own
  // mechanical master. The kinematic follow is live before 15 s and frozen after.
  const camera = sampleShaftCamera(cameraTime, aspect, out.kinematics, out.camera)

  // The inherited macro crops the outer disc at the arc's two blend edges and
  // during the recap. Settle a private, wider cutter composition before its
  // reveal, then return smoothly after retirement. Geometry/subject laws stay
  // borrowed unchanged; this framing belongs only to the private page.
  const framingWeight = smooth01(cameraTime / 2)
    * (1 - smooth01((cameraTime - 15) / 1))
  if (framingWeight > 0) {
    const layout = clamp01((aspect - 0.62) / 0.4)
    const ty = lerp(0.0082, 0.009, layout)
    const tz = lerp(0.014, 0.0078, layout)
    const dx = (0 - camera.tx) * framingWeight
    const dy = (ty - camera.ty) * framingWeight
    const dz = (tz - camera.tz) * framingWeight
    camera.px += dx; camera.py += dy; camera.pz += dz
    camera.tx += dx; camera.ty += dy; camera.tz += dz
    camera.fov = lerp(camera.fov, lerp(27, 14, layout), framingWeight)
  }

  if (arcWeight > 0) {
    const u = smooth01((cameraTime - a.cameraTime) / (b.cameraTime - a.cameraTime))
    // Match the root-free leaf's layout law exactly; no extra aspect policy.
    const layout = clamp01((aspect - 0.62) / 0.4)
    const tx = lerp(lerp(a.targetNarrow[0], a.target[0], layout), lerp(b.targetNarrow[0], b.target[0], layout), u)
    const ty = lerp(lerp(a.targetNarrow[1], a.target[1], layout), lerp(b.targetNarrow[1], b.target[1], layout), u)
    const tz = lerp(lerp(a.targetNarrow[2], a.target[2], layout), lerp(b.targetNarrow[2], b.target[2], layout), u)
    const az = lerp(a.azimuth, b.azimuth, u)
    const el = lerp(a.elevation, b.elevation, u)
    const distance = lerp(a.distance, b.distance, u)
    const horizontal = distance * Math.cos(el)
    camera.px = lerp(camera.px, tx + horizontal * Math.cos(az), arcWeight)
    camera.py = lerp(camera.py, ty + distance * Math.sin(el), arcWeight)
    camera.pz = lerp(camera.pz, tz + horizontal * Math.sin(az), arcWeight)
    camera.tx = lerp(camera.tx, tx, arcWeight)
    camera.ty = lerp(camera.ty, ty, arcWeight)
    camera.tz = lerp(camera.tz, tz, arcWeight)
    camera.fov = lerp(camera.fov,
      lerp(lerp(a.fovNarrow, a.fovDesktop, layout), lerp(b.fovNarrow, b.fovDesktop, layout), u), arcWeight)
    // Baseline +Y up and follow/light fields pass through unchanged in this era.
  }

  // FEA is a patient dwell, not a frozen card: a small C1 orbit keeps depth
  // readable while the mechanical master itself remains stationary.
  const feaU = clamp01((cameraTime - 15.2) / (22.4 - 15.2))
  const feaBell = 4 * smooth01(feaU) * (1 - smooth01(feaU))
  out.feaDwellWeight = feaBell
  if (feaBell > 0) orbitAboutTarget(camera, 10 * DEG * feaBell, 1 + 0.06 * feaBell)

  // Bullet-time hob: subject time is heavily reparameterized below, while this
  // active camera swings through the actual certified contact and returns to
  // the baseline framing at both endpoints.
  const hobU = clamp01((cameraTime - 24.8) / (31.9 - 24.8))
  const hobBell = 4 * smooth01(hobU) * (1 - smooth01(hobU))
  out.hobSwingWeight = hobBell
  if (hobBell > 0) {
    camera.ty = lerp(camera.ty, out.kinematics.hobYc * 0.001, hobBell)
    camera.fov = lerp(camera.fov, Math.max(6, camera.fov - 2), hobBell)
    orbitAboutTarget(camera, 82 * DEG * hobBell, 1 - 0.18 * hobBell)
  }

  const dx = camera.tx - camera.px
  const dy = camera.ty - camera.py
  const dz = camera.tz - camera.pz
  const length = Math.hypot(dx, dy, dz)
  out.camera.dx = dx / length
  out.camera.dy = dy / length
  out.camera.dz = dz / length
  return out
}

export interface PrivateRingCamera {
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
  ux: number
  uy: number
  uz: number
  fov: number
}

interface RingCameraKnot {
  readonly progress: number
  readonly azimuth: number
  readonly elevation: number
  readonly distanceScale: number
  readonly fov: number
}

const RING_BASE_X = -0.7
const RING_BASE_Y = 0.48
const RING_BASE_Z = 0.53
const RING_BASE_LENGTH = Math.hypot(RING_BASE_X, RING_BASE_Y, RING_BASE_Z)
const RING_BASE_AZIMUTH = Math.atan2(RING_BASE_Z, RING_BASE_X)
const RING_BASE_ELEVATION = Math.asin(RING_BASE_Y / RING_BASE_LENGTH)

const RING_CAMERA_KNOTS: readonly RingCameraKnot[] = [
  { progress: 0.69, azimuth: RING_BASE_AZIMUTH, elevation: RING_BASE_ELEVATION, distanceScale: 1, fov: 34 },
  { progress: 0.699, azimuth: RING_BASE_AZIMUTH + 0.42, elevation: RING_BASE_ELEVATION - 0.08, distanceScale: 0.98, fov: 34 },
  { progress: 0.708, azimuth: RING_BASE_AZIMUTH + 0.94, elevation: RING_BASE_ELEVATION + 0.13, distanceScale: 1.03, fov: 34 },
  { progress: 0.715, azimuth: RING_BASE_AZIMUTH + 1.22, elevation: RING_BASE_ELEVATION - 0.04, distanceScale: 1.06, fov: 34 },
  { progress: 0.723, azimuth: RING_BASE_AZIMUTH + 1.22, elevation: RING_BASE_ELEVATION - 0.04, distanceScale: 1.06, fov: 34 },
]

export function createPrivateRingCamera(): PrivateRingCamera {
  return { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, ux: 0, uy: 1, uz: 0, fov: 34 }
}

/**
 * World-frame camera around the ring runtime's unchanged unit-local origin.
 * The first pose is bit-compatible with ringRuntimeCore's fixed camera; endpoint
 * flats join the overview and shaft handoffs without relying on scalar blending.
 */
export function samplePrivateRingCamera(
  progress: number,
  distance: number,
  out: PrivateRingCamera,
): PrivateRingCamera {
  if (!Number.isFinite(progress) || !Number.isFinite(distance) || distance <= 0) {
    throw new RangeError('Private ring camera progress and distance must be finite')
  }
  const p = clamp01(progress)
  if (p <= RING_CAMERA_KNOTS[0].progress) {
    out.px = RING_BASE_X / RING_BASE_LENGTH * distance
    out.py = RING_BASE_Y / RING_BASE_LENGTH * distance
    out.pz = RING_BASE_Z / RING_BASE_LENGTH * distance
    out.tx = 0; out.ty = 0; out.tz = 0
    out.ux = 0; out.uy = 1; out.uz = 0; out.fov = 34
    return out
  }
  let i = 0
  while (i < RING_CAMERA_KNOTS.length - 2 && p >= RING_CAMERA_KNOTS[i + 1].progress) i++
  const a = RING_CAMERA_KNOTS[i]
  const b = RING_CAMERA_KNOTS[i + 1]
  const u = smooth01((p - a.progress) / (b.progress - a.progress))
  const azimuth = lerp(a.azimuth, b.azimuth, u)
  const elevation = lerp(a.elevation, b.elevation, u)
  const scaledDistance = distance * lerp(a.distanceScale, b.distanceScale, u)
  const horizontal = scaledDistance * Math.cos(elevation)
  out.px = horizontal * Math.cos(azimuth)
  out.py = scaledDistance * Math.sin(elevation)
  out.pz = horizontal * Math.sin(azimuth)
  out.tx = 0; out.ty = 0; out.tz = 0
  out.ux = 0; out.uy = 1; out.uz = 0
  out.fov = lerp(a.fov, b.fov, u)
  return out
}

/** Apparent depth multiplier applied only to a private cloned ring material. */
export const RING_KNURL_DEPTH_MULTIPLIER = 1.5
