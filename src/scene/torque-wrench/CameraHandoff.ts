import { Matrix4, Quaternion, Vector3 } from 'three'

export interface CameraHandoffPose {
  position: Vector3
  target: Vector3
  up: Vector3
  fov: number
}

/** Per-host scratch, never a clock or a retained prior-frame pose. */
export function createCameraHandoff() {
  const matrix = new Matrix4()
  const qa = new Quaternion(), qb = new Quaternion(), orientation = new Quaternion()
  const forward = new Vector3()
  return (from: CameraHandoffPose, to: CameraHandoffPose, progress: number, start: number, end: number, out: CameraHandoffPose) => {
    const u = Math.max(0, Math.min(1, (progress - start) / (end - start)))
    const weight = u * u * u * (10 + u * (-15 + 6 * u))
    const distance = from.position.distanceTo(from.target) * (1 - weight) + to.position.distanceTo(to.target) * weight
    qa.setFromRotationMatrix(matrix.lookAt(from.position, from.target, from.up))
    qb.setFromRotationMatrix(matrix.lookAt(to.position, to.target, to.up))
    orientation.slerpQuaternions(qa, qb, weight)
    out.position.lerpVectors(from.position, to.position, weight)
    forward.set(0, 0, -1).applyQuaternion(orientation)
    out.target.copy(out.position).addScaledVector(forward, distance)
    out.up.set(0, 1, 0).applyQuaternion(orientation)
    out.fov = from.fov + (to.fov - from.fov) * weight
    return out
  }
}
