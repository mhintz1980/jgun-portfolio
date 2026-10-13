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

const SUBJECT_KNOTS = [
  { progress: 0.735, time: 0 },
  { progress: 0.795, time: 7.2 },
  { progress: 0.835, time: 9.6 },
  { progress: 0.87, time: 24.6 },
  { progress: 0.905, time: 32 },
  { progress: 0.94, time: 43 },
] as const

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smooth01 = (x: number) => {
  const u = clamp01(x)
  // Evaluate the same cubic from the nearer endpoint to avoid weight overshoot.
  return u <= 0.5 ? u * u * (3 - 2 * u) : 1 - (1 - u) * (1 - u) * (1 + 2 * u)
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const DEG = Math.PI / 180

/** Camera seconds are canonical, independent of machining's integrated rate. */
function cameraTimeAt(progress: number): number {
  return 43 * smooth01((progress - 0.735) / (0.94 - 0.735))
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
    fovDesktop: 7.5, fovNarrow: 13.8,
    target: Object.freeze([0, 0.009, -0.0022] as const),
    targetNarrow: Object.freeze([0, 0.0082, 0.003] as const),
  }),
  Object.freeze({
    subjectTime: 9.6, cameraTime: cameraTimeAt(0.835),
    azimuth: 192 * DEG, elevation: 6 * DEG, distance: 0.205,
    fovDesktop: 7.5, fovNarrow: 13.8,
    target: Object.freeze([0, 0.009, -0.0022] as const),
    targetNarrow: Object.freeze([0, 0.0082, 0.003] as const),
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
  /** Existing kinematics remain in shaft-local millimetres and radians. */
  kinematics: ShaftKinematicsFrame
  /** Camera position/target are shaft-local metres; FOV is vertical degrees. */
  camera: PrivateInspectionCamera
}

export function createPrivateInspectionSample(): PrivateInspectionSample {
  return {
    progress: 0, subjectTime: 0, cameraTime: 0, machiningRate: 0, arcWeight: 0,
    kinematics: createShaftKinematicsFrame(),
    camera: { ...createShaftCameraSample(), dx: 0, dy: 0, dz: -1 },
  }
}

/** Weighted harmonic PCHIP tangent: monotone spans with shared C1 knot rates. */
function subjectSlope(index: number): number {
  if (index === 0 || index === SUBJECT_KNOTS.length - 1) return 0
  const a = SUBJECT_KNOTS[index - 1]
  const b = SUBJECT_KNOTS[index]
  const c = SUBJECT_KNOTS[index + 1]
  const h0 = b.progress - a.progress
  const h1 = c.progress - b.progress
  const d0 = (b.time - a.time) / h0
  const d1 = (c.time - b.time) / h1
  const w0 = 2 * h1 + h0
  const w1 = h1 + 2 * h0
  return (w0 + w1) / (w0 / d0 + w1 / d1)
}

function subjectTimeAt(progress: number): number {
  if (progress <= SUBJECT_KNOTS[0].progress) return 0
  if (progress >= SUBJECT_KNOTS[SUBJECT_KNOTS.length - 1].progress) return 43
  let i = 0
  while (i < SUBJECT_KNOTS.length - 2 && progress >= SUBJECT_KNOTS[i + 1].progress) i++
  const a = SUBJECT_KNOTS[i]
  const b = SUBJECT_KNOTS[i + 1]
  if (progress === a.progress) return a.time
  const h = b.progress - a.progress
  const u = (progress - a.progress) / h
  const u2 = u * u
  const u3 = u2 * u
  return (2 * u3 - 3 * u2 + 1) * a.time
    + (u3 - 2 * u2 + u) * h * subjectSlope(i)
    + (-2 * u3 + 3 * u2) * b.time
    + (u3 - u2) * h * subjectSlope(i + 1)
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
  const arcWeight = smooth01((subjectTime - 6.5) / (a.subjectTime - 6.5))
    * (1 - smooth01((subjectTime - b.subjectTime) / (10.3 - b.subjectTime)))

  out.progress = p
  out.subjectTime = subjectTime
  out.cameraTime = cameraTime
  out.machiningRate = machiningRateAt(subjectTime)
  out.arcWeight = arcWeight
  sampleShaftKinematics(subjectTime, out.kinematics)
  const camera = sampleShaftCamera(subjectTime, aspect, out.kinematics, out.camera)

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

  const dx = camera.tx - camera.px
  const dy = camera.ty - camera.py
  const dz = camera.tz - camera.pz
  const length = Math.hypot(dx, dy, dz)
  out.camera.dx = dx / length
  out.camera.dy = dy / length
  out.camera.dz = dz / length
  return out
}
