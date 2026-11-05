import type { V3 } from './track'

/** Pinhole projection matching three's PerspectiveCamera.lookAt (for HTML overlays that must
 *  sit on 3D features without a round-trip through the WebGL scene). */
export function projectPoint(p: V3, cam: { pos: V3; target: V3; fov: number; roll?: number }, w = 1920, h = 1080) {
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const norm = (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1
    return [a[0] / l, a[1] / l, a[2] / l]
  }
  const roll = cam.roll ?? 0
  const zAxis = norm(sub(cam.pos, cam.target))
  const up: V3 = [Math.sin(roll), Math.cos(roll), 0]
  const xAxis = norm(cross(up, zAxis))
  const yAxis = cross(zAxis, xAxis)
  const d = sub(p, cam.pos)
  const cx = dot(d, xAxis)
  const cy = dot(d, yAxis)
  const cz = dot(d, zAxis)
  const f = 1 / Math.tan(((cam.fov * Math.PI) / 180) / 2)
  const aspect = w / h
  const nx = (cx * f) / aspect / -cz
  const ny = (cy * f) / -cz
  return { x: (nx * 0.5 + 0.5) * w, y: (0.5 - ny * 0.5) * h, behind: cz > 0 }
}
