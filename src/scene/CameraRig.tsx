import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { CAMERA_PATH, EXPLODE_OFFSETS, LCD_ORBIT_KEYFRAMES, LCD_REVEAL_WINDOW } from '../data/caseStudies'
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
 * Subassembly inspect camera framing keyframes (position, target, FOV).
 * Used when a visitor clicks a spatial hotspot to inspect that specific part.
 */
interface InspectFraming {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

const HOTSPOT_INSPECT_FRAMES: Record<string, InspectFraming> = {
  // ---- Station 1: JGun Torque Multiplier ([0, 0, 0]) ----
  // Air motor rotor — tight 3/4 view focusing on rotor vanes & input drive
  rotor: {
    position: [0.18, 0.08, 0.12],
    target: [0, 0, -0.06],
    fov: 24,
  },
  // Datum A motor housing bore — angled view into machined bore & datum surface
  'motor-housing': {
    position: [0.2, 0.09, 0.04],
    target: [0, 0, -0.12],
    fov: 24,
  },
  // Datum B interface flange — side angle focusing on motor-to-gearbox joint
  flange: {
    position: [0.18, 0.07, 0.08],
    target: [0, 0, -0.03],
    fov: 22,
  },
  // Gearbox outer housing P000245 — side inspection framing of ring gears & shell
  'gearbox-housing': {
    position: [0.24, 0.09, 0.14],
    target: [0, 0, 0.01],
    fov: 25,
  },
  // MSP430 MCU — tight top-rear view on handle smart-tool electronics
  mcu: {
    position: [-0.07, 0.1, -0.36],
    target: [0, 0.02, -0.22],
    fov: 25,
  },
  // LCD manometer screen & backlit buttons
  lcd: {
    position: [-0.05, 0.08, -0.42],
    target: [0, 0.02, -0.24],
    fov: 28,
  },
  // LiPo battery cell
  lipo: {
    position: [-0.09, -0.02, -0.34],
    target: [0, -0.01, -0.2],
    fov: 25,
  },

  // ---- Station 2: RL-300 / MSP Acoustic SAFE Enclosure ([28, 0, -6]) ----
  'enclosure-chassis': {
    position: [31.8, 2.4, -2.4],
    target: [28.0, 1.23, -6.41],
    fov: 34,
  },
  'composite-panels': {
    position: [31.2, 2.0, -2.8],
    target: [28.66, 1.20, -5.74],
    fov: 30,
  },
  'pump-housing': {
    position: [30.4, 1.8, -3.4],
    target: [28.02, 0.89, -6.00],
    fov: 28,
  },
  'acoustic-baffles': {
    position: [25.2, 2.2, -4.2],
    target: [26.68, 1.54, -6.38],
    fov: 28,
  },
  'isolation-mounts': {
    position: [29.6, 0.6, -4.0],
    target: [28.00, 0.05, -6.00],
    fov: 26,
  },
  'duct-intake': {
    position: [29.8, 1.6, -2.8],
    target: [28.00, 1.11, -5.05],
    fov: 28,
  },
  'duct-exhaust': {
    position: [29.6, 1.8, -9.2],
    target: [27.90, 1.23, -7.17],
    fov: 28,
  },

  // ---- Station 3: M249 Receiver Platform ([56, 0, -12]) ----
  'm249-receiver': {
    position: [56 + 0.25, 0.35, -12 + 0.8],
    target: [56, 0.05, -12],
    fov: 26,
  },
  'm249-trunnion': {
    position: [56 + 0.22, 0.25, -12 + 0.65],
    target: [56, 0.03, -12 + 0.15],
    fov: 22,
  },
  'm249-rail': {
    position: [56 + 0.2, 0.45, -12 + 0.6],
    target: [56, 0.1, -12 - 0.08],
    fov: 22,
  },
  'm249-feed-tray': {
    position: [56 + 0.22, 0.32, -12 + 0.7],
    target: [56, 0.06, -12 + 0.04],
    fov: 24,
  },
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
 *  - LCD orbit: after the measured explode completion, camera arcs rearward,
 *    dwells on the emissive LCD/buttons, then returns before stage handoff.
 *  - Click-to-inspect subassembly focus (hotspotId active): dollies tight
 *    into the selected part coordinates; scrolling seamlessly releases.
 */

/** Smoothly ramp 0→1 over [lo, hi] and 1→0 over [lo2, hi2]. */
function bellWeight(p: number, lo: number, hi: number, lo2: number, hi2: number): number {
  const fadeIn = Math.min(Math.max((p - lo) / (hi - lo), 0), 1)
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

    const { progress, hotspotId } = getScrollState()

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

    // ---- CR-3: Shift groove reveal & handle orbit sub-sequence (progress 0.035 → 0.18) ----
    const shiftW = bellWeight(progress, 0.035, 0.055, 0.115, 0.18)
    if (shiftW > 0.001) {
      const orbitT = smoothstep(Math.min(Math.max((progress - 0.05) / 0.05, 0), 1))
      const grPos: [number, number, number] = [
        lerpN(0.16, 0.12, orbitT),
        lerpN(0.06, 0.05, orbitT),
        lerpN(0.16, 0.02, orbitT),
      ]
      const grTgt: [number, number, number] = [0, 0.012, 0.022]
      const grFov = 22
      goalPos.current.x = lerpN(goalPos.current.x, grPos[0], shiftW)
      goalPos.current.y = lerpN(goalPos.current.y, grPos[1], shiftW)
      goalPos.current.z = lerpN(goalPos.current.z, grPos[2], shiftW)
      goalTarget.current.x = lerpN(goalTarget.current.x, grTgt[0], shiftW)
      goalTarget.current.y = lerpN(goalTarget.current.y, grTgt[1], shiftW)
      goalTarget.current.z = lerpN(goalTarget.current.z, grTgt[2], shiftW)
      goalFov = lerpN(goalFov, grFov, shiftW)
    }

    // ---- CR-5: post-explode rear LCD orbit and stable dwell ----
    // Piecewise path: start → arc → dwell (hold) → return, each segment
    // smoothstep-eased. The pre-repair code interpolated start→arc across the
    // whole entry phase and then SNAPPPED to the dwell keyframe at dwellStart;
    // this version passes through the arc and eases into the dwell. start and
    // return equal the base CAMERA_PATH blend at the window edges (see the
    // measurement notes in caseStudies.ts), so entry/exit are continuous.
    const { start, dwellStart, dwellEnd, end } = LCD_REVEAL_WINDOW
    if (progress >= start && progress <= end) {
      const orbit = LCD_ORBIT_KEYFRAMES
      const midArc = start + (dwellStart - start) / 2
      const blend = (from: number, to: number, lo: number, hi: number): number =>
        lerpN(from, to, smoothstep(Math.min(Math.max((progress - lo) / (hi - lo), 0), 1)))
      const seg = <T extends readonly number[]>(from: T, to: T, lo: number, hi: number) =>
        [blend(from[0], to[0], lo, hi), blend(from[1], to[1], lo, hi), blend(from[2], to[2], lo, hi)] as [number, number, number]
      let rearPos: [number, number, number]
      let rearTarget: [number, number, number]
      let rearFov: number
      if (progress < midArc) {
        rearPos = seg(orbit.start.position, orbit.arc.position, start, midArc)
        rearTarget = seg(orbit.start.target, orbit.arc.target, start, midArc)
        rearFov = blend(orbit.start.fov, orbit.arc.fov, start, midArc)
      } else if (progress < dwellStart) {
        rearPos = seg(orbit.arc.position, orbit.dwell.position, midArc, dwellStart)
        rearTarget = seg(orbit.arc.target, orbit.dwell.target, midArc, dwellStart)
        rearFov = blend(orbit.arc.fov, orbit.dwell.fov, midArc, dwellStart)
      } else if (progress <= dwellEnd) {
        rearPos = [...orbit.dwell.position] as [number, number, number]
        rearTarget = [...orbit.dwell.target] as [number, number, number]
        rearFov = orbit.dwell.fov
      } else {
        rearPos = seg(orbit.dwell.position, orbit.return.position, dwellEnd, end)
        rearTarget = seg(orbit.dwell.target, orbit.return.target, dwellEnd, end)
        rearFov = blend(orbit.dwell.fov, orbit.return.fov, dwellEnd, end)
      }
      goalPos.current.set(rearPos[0], rearPos[1], rearPos[2])
      goalTarget.current.set(rearTarget[0], rearTarget[1], rearTarget[2])
      goalFov = rearFov
    }

    // ---- CH.04 M249 continuous zoom-out (progress 0.76 → 1.00, Station 3: [56, 0, -12]) ----
    if (progress >= 0.76) {
      const t4 = smoothstep(Math.min((progress - 0.76) / 0.24, 1))
      const m249Pos: [number, number, number] = [
        lerpN(56.18, 56.28, t4),
        lerpN(0.26, 0.42, t4),
        lerpN(-12 + 0.75, -12 + 1.55, t4),
      ]
      const m249Tgt: [number, number, number] = [56, 0, -12]
      const m249Fov = lerpN(33, 38, t4)
      goalPos.current.set(m249Pos[0], m249Pos[1], m249Pos[2])
      goalTarget.current.set(m249Tgt[0], m249Tgt[1], m249Tgt[2])
      goalFov = m249Fov
    }

    // ---- Click-to-Inspect Subassembly Focus ----
    // The LCD hotspot's own orbit dwell (already framing the rear cap) IS the
    // inspection — don't yank the camera to the rest-frame inspect position
    // while that window is active.
    const inLcdWindow =
      progress >= LCD_REVEAL_WINDOW.start && progress <= LCD_REVEAL_WINDOW.end
    const inspectFrame =
      hotspotId && !(hotspotId === 'lcd' && inLcdWindow)
        ? HOTSPOT_INSPECT_FRAMES[hotspotId]
        : null
    if (inspectFrame) {
      const explode = telemetry.rig.explodeFactor
      // Station 1 handle parts ride the handle rear extraction offset.
      // Station 1 gearbox housing and all Station 2/3 occurrences use fixed station frames.
      const isStation1Handle =
        hotspotId === 'rotor' ||
        hotspotId === 'motor-housing' ||
        hotspotId === 'flange' ||
        hotspotId === 'mcu' ||
        hotspotId === 'lcd' ||
        hotspotId === 'lipo'
      const offsetZ = isStation1Handle ? EXPLODE_OFFSETS.handle * explode : 0

      goalPos.current.set(
        inspectFrame.position[0],
        inspectFrame.position[1],
        inspectFrame.position[2] + offsetZ,
      )
      goalTarget.current.set(
        inspectFrame.target[0],
        inspectFrame.target[1],
        inspectFrame.target[2] + offsetZ,
      )
      goalFov = inspectFrame.fov
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
