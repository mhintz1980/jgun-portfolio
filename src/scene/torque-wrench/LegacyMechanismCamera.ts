import { Vector3 } from 'three'
import { baseAt, LCD_ORBIT_KEYFRAMES } from '../../data/caseStudies'
import type { SheetCameraPose } from '../drawing/sheetCamera'

const clamp = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (v: number) => {
  const u = clamp(v)
  return u * u * (3 - 2 * u)
}
const yawAxis = new Vector3(0, 1, 0)
const start = new Vector3(0.32, 0.16, 0.42),
  zero = new Vector3()
const knots = [
  [0.46, 0.12],
  [0.52, 0.18],
  [0.635, 0.42],
  [0.65, 0.458],
  [0.665, 0.488],
  [0.675, 0.525],
] as const

/** Read-only legacy CameraRig source, 2026-10-16: groove bell/orbit, baseAt
 * reduction-train transit, then LCD arc and dwell. The old hero yaw is removed
 * from the camera frame, because this private page keeps the CAD root unrotated.
 * Later legacy stations and UI framing biases are intentionally outside this shot.
 */
export function sampleLegacyMechanismCamera(
  progress: number,
  aspect: number,
  explode: number,
  out: SheetCameraPose,
): SheetCameraPose {
  const p = Math.max(0.46, Math.min(0.675, progress))
  let i = 0
  while (i < knots.length - 2 && p > knots[i + 1][0]) i++
  const [a, l0] = knots[i],
    [b, l1] = knots[i + 1]
  const legacy = l0 + ((l1 - l0) * (p - a)) / (b - a)
  const base = baseAt(legacy)
  out.position.fromArray(base.position)
  out.target.fromArray(base.target)
  out.fov = base.fov
  const bell =
    smooth((legacy - 0.13166666666666665) / 0.006666666666666682) *
    (1 - smooth((legacy - 0.15833333333333333) / 0.021666666666666667))
  const orbit = smooth((legacy - 0.13666666666666666) / 0.01666666666666669)
  if (bell > 0) {
    out.position.x += (0.16 - 0.04 * orbit - out.position.x) * bell
    out.position.y += (0.06 - 0.01 * orbit - out.position.y) * bell
    out.position.z += (0.16 - 0.14 * orbit - out.position.z) * bell
    out.target.lerp(newTarget.set(0, 0.012, 0.022), bell)
    out.fov += (22 - out.fov) * bell
  }
  const yaw = clamp((legacy - 0.18) / 0.17) * Math.PI * 0.85
  const centroid = -0.152 * explode * explode * 0.7
  out.target.x += centroid * Math.sin(yaw)
  out.target.z += centroid * Math.cos(yaw)
  if (legacy >= 0.42) {
    const arc = LCD_ORBIT_KEYFRAMES.arc,
      dwell = LCD_ORBIT_KEYFRAMES.dwell
    if (legacy < 0.439) {
      const incoming = baseAt(0.42)
      incoming.target[0] += centroid * Math.sin(yaw)
      incoming.target[2] += centroid * Math.cos(yaw)
      blend(incoming, arc, smooth((legacy - 0.42) / 0.019), out)
    } else if (legacy < 0.458) blend(arc, dwell, smooth((legacy - 0.439) / 0.019), out)
    else if (legacy <= 0.488) {
      out.position.fromArray(dwell.position)
      out.target.fromArray(dwell.target)
      out.fov = dwell.fov
    } else blend(dwell, baseAt(0.525), smooth((legacy - 0.488) / 0.037), out)
  }
  out.position.applyAxisAngle(yawAxis, -yaw)
  out.target.applyAxisAngle(yawAxis, -yaw)
  // Match the exact opening endpoint before departing for the first close-up.
  const arrive = smooth((p - 0.46) / 0.012)
  out.position.lerpVectors(start, out.position, arrive)
  out.target.lerpVectors(zero, out.target, arrive)
  out.fov = 42 + (out.fov - 42) * arrive
  if (aspect < 0.8) out.fov += 16
  out.up.set(0, 1, 0)
  out.ortho = 0
  out.distance = out.position.distanceTo(out.target)
  return out
}
const newTarget = new Vector3()
type Key = { position: readonly number[]; target: readonly number[]; fov: number }
function blend(a: Key, b: Key, k: number, out: SheetCameraPose) {
  out.position.set(
    a.position[0] + (b.position[0] - a.position[0]) * k,
    a.position[1] + (b.position[1] - a.position[1]) * k,
    a.position[2] + (b.position[2] - a.position[2]) * k,
  )
  out.target.set(
    a.target[0] + (b.target[0] - a.target[0]) * k,
    a.target[1] + (b.target[1] - a.target[1]) * k,
    a.target[2] + (b.target[2] - a.target[2]) * k,
  )
  out.fov = a.fov + (b.fov - a.fov) * k
}
