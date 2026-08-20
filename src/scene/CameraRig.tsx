import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { CAMERA_PATH } from '../data/caseStudies'
import { getScrollState, telemetry } from '../state/scrollStore'

const smoothstep = (t: number): number => t * t * (3 - 2 * t)

/**
 * Module 1 — camera trajectory state machine.
 *
 * Global scroll progress selects a segment between two chapter keyframes;
 * position, look-at target and FOV are interpolated with a smoothstep-eased
 * local t, then exponentially damped so fast scrolling never snaps the camera.
 * Pointer parallax is layered on top of the goal position.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera)

  const currentPos = useRef(new Vector3(...CAMERA_PATH[0].position))
  const currentTarget = useRef(new Vector3(...CAMERA_PATH[0].target))
  const goalPos = useRef(new Vector3())
  const goalTarget = useRef(new Vector3())
  const scratchA = useRef(new Vector3())
  const scratchB = useRef(new Vector3())

  useFrame((state, delta) => {
    const { progress } = getScrollState()

    const segments = CAMERA_PATH.length - 1
    const s = Math.min(progress, 0.9999) * segments
    const index = Math.floor(s)
    const t = smoothstep(s - index)
    const from = CAMERA_PATH[index]
    const to = CAMERA_PATH[Math.min(index + 1, segments)]

    goalPos.current
      .set(from.position[0], from.position[1], from.position[2])
      .lerp(scratchA.current.set(to.position[0], to.position[1], to.position[2]), t)
    goalTarget.current
      .set(from.target[0], from.target[1], from.target[2])
      .lerp(scratchB.current.set(to.target[0], to.target[1], to.target[2]), t)
    const goalFov = from.fov + (to.fov - from.fov) * t

    // Hover parallax on the camera itself (the hero adds its own object-space parallax).
    goalPos.current.x += state.pointer.x * 0.03
    goalPos.current.y += state.pointer.y * 0.02

    const damp = 1 - Math.exp(-6 * delta)
    currentPos.current.lerp(goalPos.current, damp)
    currentTarget.current.lerp(goalTarget.current, damp)

    camera.position.copy(currentPos.current)
    camera.lookAt(currentTarget.current)
    if (camera instanceof PerspectiveCamera) {
      camera.fov += (goalFov - camera.fov) * damp
      camera.updateProjectionMatrix()
      telemetry.fov = camera.fov
    }

    telemetry.x = camera.position.x
    telemetry.y = camera.position.y
    telemetry.z = camera.position.z
  })

  return null
}
