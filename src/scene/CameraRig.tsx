import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { CAMERA_PATH } from '../data/caseStudies'
import { getScrollState, telemetry } from '../state/scrollStore'
import { getQuality } from '../state/qualityStore'

const smoothstep = (t: number): number => t * t * (3 - 2 * t)

/** Mirror the scroll store into telemetry.scroll each frame (probe surface). */
const writeScrollTelemetry = (): void => {
  const { progress, chapter, chapterProgress, materialMode } = getScrollState()
  telemetry.scroll.progress = progress
  telemetry.scroll.chapter = chapter
  telemetry.scroll.chapterProgress = chapterProgress
  telemetry.scroll.materialMode = materialMode
}

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
    // Reduced motion: pin the camera to the chapter-1 hero keyframe — no
    // scroll interpolation, no pointer parallax, no damped drift.
    if (getQuality().reducedMotion) {
      const hero = CAMERA_PATH[0]
      camera.position.set(hero.position[0], hero.position[1], hero.position[2])
      camera.lookAt(scratchA.current.set(hero.target[0], hero.target[1], hero.target[2]))
      if (camera instanceof PerspectiveCamera && camera.fov !== hero.fov) {
        camera.fov = hero.fov
        camera.updateProjectionMatrix()
        telemetry.camera.fov = camera.fov
      }
      telemetry.camera.x = camera.position.x
      telemetry.camera.y = camera.position.y
      telemetry.camera.z = camera.position.z
      writeScrollTelemetry()
      return
    }

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
      telemetry.camera.fov = camera.fov
    }

    telemetry.camera.x = camera.position.x
    telemetry.camera.y = camera.position.y
    telemetry.camera.z = camera.position.z
    writeScrollTelemetry()
  })

  return null
}
