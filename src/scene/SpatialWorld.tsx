import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { ContactShadows } from '@react-three/drei'
import { getQuality } from '../state/qualityStore'
import { getScrollState, telemetry } from '../state/scrollStore'
import { stageEnvelope, STAGE_TRANSITIONS } from './stages/stageWindows'
import { AcousticBaffleField } from './stages/AcousticBaffleField'
import { AirflowField } from './stages/AirflowField'
import { M249Stage } from './stages/M249Stage'
import { Station2_AcousticEnclosure } from './stages/Station2_AcousticEnclosure'

/**
 * Station world transform positions (m).
 * Discrete 3D spatial stations traversed via continuous camera flight.
 */
export const STATION_TRANSFORMS = {
  station1: [0, 0, 0] as const,
  station2: [28, 0, -6] as const,
  station3: [56, 0, -12] as const,
}

/**
 * JG-016 — Multi-station spatial world.
 *
 * Replaces in-place stage swapping with three discrete 3D engineering stations:
 *   Station 1 (`[0, 0, 0]`):     JGUN D1-AP Multi-Stage Planetary Torque Multiplier (CH.01/02)
 *   Station 2 (`[28, 0, -6]`):   RL-300 / MSP Acoustic SAFE Enclosure + CFM Airflow (CH.03)
 *   Station 3 (`[56, 0, -12]`):  M249 / MK46 Reverse-Engineered Receiver Platform (CH.04)
 *
 * Contract (r3f-scroll-performance-guard):
 * - Imperative useFrame reads via getScrollState() — ZERO React state writes.
 * - Visibility gating disables off-screen station rendering without unmounting geometry.
 * - Reduced motion pins Station 1 alone.
 */
export function SpatialWorld({ children }: { children: ReactNode }) {
  const station1Ref = useRef<Group>(null)
  const station2Ref = useRef<Group>(null)
  const station3Ref = useRef<Group>(null)

  useFrame(() => {
    const { progress } = getScrollState()
    const { reducedMotion } = getQuality()

    const wrench = reducedMotion
      ? { alpha: 1, y: 0, active: true }
      : stageEnvelope(progress, undefined, STAGE_TRANSITIONS.wrenchOut)
    const enclosure = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.enclosureIn, STAGE_TRANSITIONS.enclosureOut)
    const cloud = reducedMotion
      ? { alpha: 0, y: 0, active: false }
      : stageEnvelope(progress, STAGE_TRANSITIONS.pointCloudIn, undefined)

    if (station1Ref.current) {
      station1Ref.current.visible = wrench.active
    }
    if (station2Ref.current) {
      station2Ref.current.visible = enclosure.active
    }
    if (station3Ref.current) {
      station3Ref.current.visible = cloud.active
    }

    const alphas: [number, number, number] = [wrench.alpha, enclosure.alpha, cloud.alpha]
    const dominant = alphas.indexOf(Math.max(...alphas))
    telemetry.stage.active = alphas[dominant] > 0.25 ? dominant : -1
    telemetry.stage.alpha = alphas
  })

  return (
    <group name="spatial-world">
      {/* STATION 1 — [0, 0, 0]: JGun Torque Multiplier & Kinematics */}
      <group
        ref={station1Ref}
        name="station-1-jgun"
        position={[...STATION_TRANSFORMS.station1]}
      >
        {children}
      </group>

      {/* STATION 2 — [28, 0, -6]: RL-300 / MSP Acoustic SAFE Enclosure */}
      <group
        ref={station2Ref}
        name="station-2-enclosure"
        position={[...STATION_TRANSFORMS.station2]}
        visible={false}
      >
        <directionalLight position={[6, 8, 5]} intensity={1.4} color="#ffffff" />
        <directionalLight position={[-6, 4, -5]} intensity={0.5} color="#7dd3fc" />
        <pointLight position={[0, 4, 3]} intensity={0.9} color="#38bdf8" distance={15} decay={2} />
        <Station2_AcousticEnclosure />
        <AirflowField />
        <AcousticBaffleField />
        <ContactShadows position={[0, -0.05, 0]} opacity={0.45} scale={6.0} blur={2.0} far={2.0} />
      </group>

      {/* STATION 3 — [56, 0, -12]: M249 / MK46 Parametric CAD Platform */}
      <group
        ref={station3Ref}
        name="station-3-m249"
        position={[...STATION_TRANSFORMS.station3]}
        visible={false}
      >
        <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffffff" />
        <directionalLight position={[-4, 3, -3]} intensity={1.0} color="#7dd3fc" />
        <pointLight position={[0, 2, 1.5]} intensity={1.5} color="#38bdf8" distance={8} decay={2} />
        <M249Stage />
        <ContactShadows position={[0, -0.2, 0]} opacity={0.4} scale={2.5} blur={2.2} far={1.0} />
      </group>
    </group>
  )
}
