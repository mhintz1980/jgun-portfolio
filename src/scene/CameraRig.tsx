import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  CAMERA_PATH,
  EXPLODE_OFFSETS,
  LCD_ORBIT_KEYFRAMES,
  LCD_REVEAL_WINDOW,
  baseAt,
  framingBias,
} from '../data/caseStudies'
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
  const scratchFwd = useRef(new Vector3())
  const scratchRight = useRef(new Vector3())

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
      telemetry.camera.framingBias = 0
      writeScrollTelemetry()
      return
    }

    const { progress, hotspotId } = getScrollState()

    // ---- 1. Content-aligned base trajectory (PATH_SEGMENTS table) ----
    const base = baseAt(progress)
    goalPos.current.set(base.position[0], base.position[1], base.position[2])
    goalTarget.current.set(base.target[0], base.target[1], base.target[2])
    let goalFov = base.fov

    // ---- 2. CR-3: Shift groove reveal & handle orbit sub-sequence (progress 0.035 → 0.18) ----
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

    // ---- 3. JG-021 WS1.3: Exploded reduction-train lookAt centroid tracking ----
    // During segment 0 (JGun beats, progress <= 0.525), shift goalTarget toward the
    // exploded-train centroid (midpoint of output face +0.102m and exploded handle tail -0.587m,
    // recentered by rig.center -0.0906m -> centroidZ = -0.152m at explode=1) rotated by hero yaw.
    if (progress <= 0.525) {
      const explodeFactor = telemetry.rig.explodeFactor
      if (explodeFactor > 0.001) {
        const spinProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.17))
        const heroYaw = spinProgress * Math.PI * 0.85
        const centroidZ = -0.152 * explodeFactor
        const centroidWorldX = centroidZ * Math.sin(heroYaw)
        const centroidWorldZ = centroidZ * Math.cos(heroYaw)
        const explodeWeight = explodeFactor * 0.7
        goalTarget.current.x += centroidWorldX * explodeWeight
        goalTarget.current.z += centroidWorldZ * explodeWeight
      }
    }

    // ---- 4. CR-5 / JG-021 WS1.2: Post-explode rear LCD orbit with runtime-derived continuity ----
    // Evaluates start and return keyframes dynamically from baseAt() so trajectory continuity
    // is guaranteed by construction without hardcoded keyframe syncing.
    const { start, dwellStart, dwellEnd, end } = LCD_REVEAL_WINDOW
    if (progress >= start && progress <= end) {
      const orbitStart = baseAt(start)
      const orbitReturn = baseAt(end)
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
        rearPos = seg(orbitStart.position, orbit.arc.position, start, midArc)
        rearTarget = seg(orbitStart.target, orbit.arc.target, start, midArc)
        rearFov = blend(orbitStart.fov, orbit.arc.fov, start, midArc)
      } else if (progress < dwellStart) {
        rearPos = seg(orbit.arc.position, orbit.dwell.position, midArc, dwellStart)
        rearTarget = seg(orbit.arc.target, orbit.dwell.target, midArc, dwellStart)
        rearFov = blend(orbit.arc.fov, orbit.dwell.fov, midArc, dwellStart)
      } else if (progress <= dwellEnd) {
        rearPos = [...orbit.dwell.position] as [number, number, number]
        rearTarget = [...orbit.dwell.target] as [number, number, number]
        rearFov = orbit.dwell.fov
      } else {
        rearPos = seg(orbit.dwell.position, orbitReturn.position, dwellEnd, end)
        rearTarget = seg(orbit.dwell.target, orbitReturn.target, dwellEnd, end)
        rearFov = blend(orbit.dwell.fov, orbitReturn.fov, dwellEnd, end)
      }
      goalPos.current.set(rearPos[0], rearPos[1], rearPos[2])
      goalTarget.current.set(rearTarget[0], rearTarget[1], rearTarget[2])
      goalFov = rearFov
    }

    // ---- 5. CH.04 M249 continuous zoom-out (progress 0.76 → 1.00, Station 3: [56, 0, -12]) ----
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

    // ---- 6. Click-to-Inspect Subassembly Focus ----
    const inLcdWindow =
      progress >= LCD_REVEAL_WINDOW.start && progress <= LCD_REVEAL_WINDOW.end
    const inspectFrame =
      hotspotId && !(hotspotId === 'lcd' && inLcdWindow)
        ? HOTSPOT_INSPECT_FRAMES[hotspotId]
        : null
    if (inspectFrame) {
      const explode = telemetry.rig.explodeFactor
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

    // ---- 7. JG-021 WS1.4 + Amendment 1: Framing bias along camera-left ----
    // Shifts goalTarget toward camera-left (negative camera-right) so the subject
    // renders cleanly in the right-hand viewport (~62-65% screen-x) clear of the narrative text.
    const bias = framingBias(progress)
    telemetry.camera.framingBias = bias

    if (bias > 0.0001) {
      scratchFwd.current.subVectors(goalTarget.current, goalPos.current)
      const dist = scratchFwd.current.length()
      if (dist > 0.0001) {
        scratchFwd.current.multiplyScalar(1 / dist)
        // Camera-right vector = fwd × (0, 1, 0)
        scratchRight.current.set(
          scratchFwd.current.z,
          0,
          -scratchFwd.current.x,
        )
        const rightLen = scratchRight.current.length()
        if (rightLen > 0.0001) {
          scratchRight.current.multiplyScalar(1 / rightLen)
          const aspect = state.size.width / Math.max(state.size.height, 1)
          const fovRad = (goalFov * Math.PI) / 180
          const biasMeters = bias * dist * Math.tan(fovRad / 2) * aspect
          // Shift goalTarget along camera-left (negative camera-right)
          goalTarget.current.addScaledVector(scratchRight.current, -biasMeters)
        }
      }
    }

    // Hover parallax on the camera itself (the hero adds its own object-space parallax).
    goalPos.current.x += state.pointer.x * 0.03
    goalPos.current.y += state.pointer.y * 0.02

    // Exponential damping with clamp to prevent overshoot on frame drops
    const safeDelta = Math.min(delta, 0.1)
    const damp = 1 - Math.exp(-6 * safeDelta)
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

