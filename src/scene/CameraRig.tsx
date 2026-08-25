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
 *
 * CR-3 / CR-5 sub-sequences (2026-08-25):
 *  - Shift zoom (progress 0 → 0.15): camera dollies tight on the P000420
 *    groove area so OSHA Blue is visible before the ring switch moves, then
 *    pulls back after the Red groove is revealed.
 *  - LCD orbit (progress 0.35 → 0.57): camera arcs rearward around the handle
 *    to reveal the emissive LCD screen and buttons, then returns to the
 *    lateral inspection position before the explosion begins.
 *
 * Both sub-sequences blend against the CAMERA_PATH goal using a weight that
 * fades in/out over 0.03 of scroll so there is never a hard snap.
 */

/** Smoothly ramp 0→1 over [lo, hi] and 1→0 over [lo2, hi2]. */
function bellWeight(p: number, lo: number, hi: number, lo2: number, hi2: number): number {
  const fadeIn  = Math.min(Math.max((p - lo) / (hi - lo), 0), 1)
  const fadeOut = Math.min(Math.max((hi2 - p) / (hi2 - lo2), 0), 1)
  return smoothstep(Math.min(fadeIn, fadeOut))
}

/** Lerp a scalar. */
const lerpN = (a: number, b: number, t: number): number => a + (b - a) * t

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

    // ---- Base CAMERA_PATH keyframe interpolation ----
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
    let goalFov = from.fov + (to.fov - from.fov) * t

    // ---- CR-3: Shift groove zoom sub-sequence (progress 0 → 0.15) ----
    // Zooms tight to reveal the OSHA Blue groove, holds while ring switch
    // lifts to reveal OSHA Red, then returns to the wide CH.01 framing.
    // Beat map: 0→0.04 zoom in; 0.04→0.10 hold tight; 0.10→0.15 pull back.
    const shiftW = bellWeight(progress, 0.01, 0.04, 0.10, 0.15)
    if (shiftW > 0.001) {
      const grPos: [number, number, number] = [0.14, 0.04, 0.19]
      const grTgt: [number, number, number] = [0, 0, 0.06]
      const grFov = 22
      goalPos.current.x = lerpN(goalPos.current.x, grPos[0], shiftW)
      goalPos.current.y = lerpN(goalPos.current.y, grPos[1], shiftW)
      goalPos.current.z = lerpN(goalPos.current.z, grPos[2], shiftW)
      goalTarget.current.x = lerpN(goalTarget.current.x, grTgt[0], shiftW)
      goalTarget.current.y = lerpN(goalTarget.current.y, grTgt[1], shiftW)
      goalTarget.current.z = lerpN(goalTarget.current.z, grTgt[2], shiftW)
      goalFov = lerpN(goalFov, grFov, shiftW)
    }

    // ---- CR-5: Rear LCD orbit sub-sequence (progress 0.35 → 0.57) ----
    // Camera arcs rearward around handle to reveal emissive LCD + buttons,
    // dwells, then returns to lateral position before explosion.
    // Beat map: 0.35→0.42 arc in; 0.42→0.50 dwell; 0.50→0.57 return.
    const lcdW = bellWeight(progress, 0.36, 0.42, 0.50, 0.57)
    if (lcdW > 0.001) {
      const lcdPos: [number, number, number] = [-0.06, 0.08, -0.44]
      const lcdTgt: [number, number, number] = [0, 0.02, -0.22]
      const lcdFov = 32
      goalPos.current.x = lerpN(goalPos.current.x, lcdPos[0], lcdW)
      goalPos.current.y = lerpN(goalPos.current.y, lcdPos[1], lcdW)
      goalPos.current.z = lerpN(goalPos.current.z, lcdPos[2], lcdW)
      goalTarget.current.x = lerpN(goalTarget.current.x, lcdTgt[0], lcdW)
      goalTarget.current.y = lerpN(goalTarget.current.y, lcdTgt[1], lcdW)
      goalTarget.current.z = lerpN(goalTarget.current.z, lcdTgt[2], lcdW)
      goalFov = lerpN(goalFov, lcdFov, lcdW)
    }

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
