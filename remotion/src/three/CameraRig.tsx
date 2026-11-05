import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'

type V3 = readonly [number, number, number]

/** Frame-driven camera: written before R3F's advance() renders the frame. */
/** `shiftX` is a lens shift in pixels (positive moves the subject right) — reframes for type
 *  without changing perspective. */
export function CameraRig({ position, target, fov, roll = 0, near = 0.005, far = 80, shiftX = 0 }: { position: V3; target: V3; fov: number; roll?: number; near?: number; far?: number; shiftX?: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2])
    camera.up.set(Math.sin(roll), Math.cos(roll), 0)
    camera.lookAt(target[0], target[1], target[2])
    camera.fov = fov
    camera.near = near
    camera.far = far
    if (shiftX) camera.setViewOffset(1920, 1080, -shiftX, 0, 1920, 1080)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  })
  return null
}
