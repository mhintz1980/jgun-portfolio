import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  RingGeometry,
  Vector3,
} from 'three'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { airflowIntensity, stageEnvelope, STAGE_TRANSITIONS, STATION2_CAD_ANCHORS } from './stageWindows'

/**
 * JG-018 — CH.03 Acoustic Baffle Soundwave System.
 *
 * Visualizes noise attenuation across the RL-300 / MSP SAFE enclosure:
 * - 115 dBA noise is generated at the PUMP_HOUSING ([0.022, 0.943, -0.055]).
 * - Acoustic sound pressure waves expand spherically and are absorbed/deflected by
 *   the ACOUSTIC_BAFFLES ([-1.319, 1.590, -0.433]) and 5-layer composite walls.
 * - Residual attenuated sound waves exit through the DUCT_EXHAUST ([-0.101, 1.282, -1.225])
 *   as restrained, dissipating additive acoustic wave rings (-43 dBA attenuation).
 *
 * Performance Contract (r3f-scroll-performance-guard):
 * - Pooled ring meshes with reused geometries & materials.
 * - Zero per-frame memory allocation.
 * - Reduced motion renders clean static contour arcs with zero rAF loops.
 * - Synchronizes telemetry.stage.acousticWave for runtime verification.
 */

const RING_COUNT = 6
const EXHAUST_RING_COUNT = 5

export function AcousticBaffleField() {
  const groupRef = useRef<Group>(null)
  const exhaustRingsRef = useRef<Group>(null)
  const waveIntensity = useRef(0)

  const { reducedMotion, tier } = getQuality()
  const isStaticMode = reducedMotion || tier === 'poster'

  // Geometry pools (allocated once)
  const ringGeometries = useMemo(() => {
    return Array.from({ length: RING_COUNT }, (_, i) => {
      const inner = 0.28 + i * 0.16
      const outer = inner + 0.025
      return new RingGeometry(inner, outer, 48)
    })
  }, [])

  const exhaustGeometries = useMemo(() => {
    return Array.from({ length: EXHAUST_RING_COUNT }, (_, i) => {
      const inner = 0.22 + i * 0.14
      const outer = inner + 0.022
      return new RingGeometry(inner, outer, 40)
    })
  }, [])

  // Shared materials with AdditiveBlending
  const baffleMaterials = useMemo(() => {
    return Array.from({ length: RING_COUNT }, () => {
      return new MeshBasicMaterial({
        color: '#00e5ff',
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    })
  }, [])

  const exhaustMaterials = useMemo(() => {
    return Array.from({ length: EXHAUST_RING_COUNT }, () => {
      return new MeshBasicMaterial({
        color: '#38bdf8',
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    })
  }, [])

  useEffect(() => {
    return () => {
      ringGeometries.forEach((g) => g.dispose())
      exhaustGeometries.forEach((g) => g.dispose())
      baffleMaterials.forEach((m) => m.dispose())
      exhaustMaterials.forEach((m) => m.dispose())
    }
  }, [ringGeometries, exhaustGeometries, baffleMaterials, exhaustMaterials])

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, 0.1)
    const { progress } = getScrollState()

    const envelope = stageEnvelope(
      progress,
      STAGE_TRANSITIONS.enclosureIn,
      STAGE_TRANSITIONS.enclosureOut,
    )

    if (!envelope.active || isStaticMode) {
      if (waveIntensity.current !== 0) {
        waveIntensity.current = 0
        telemetry.stage.acousticWave = 0
        baffleMaterials.forEach((m) => {
          m.opacity = 0
        })
        exhaustMaterials.forEach((m) => {
          m.opacity = 0
        })
      }
      return
    }

    const targetIntensity = airflowIntensity(progress)
    const damp = 1 - Math.exp(-4 * safeDelta)
    waveIntensity.current += (targetIntensity - waveIntensity.current) * damp
    telemetry.stage.acousticWave = waveIntensity.current

    const time = _state.clock.getElapsedTime() * 2.8

    // 1. Internal sound waves radiating from pump housing toward acoustic baffles
    baffleMaterials.forEach((mat, i) => {
      const phase = (i / RING_COUNT) * Math.PI * 2
      const wave = (Math.sin(time + phase) + 1) * 0.5
      // Attenuation dropoff: waves attenuate rapidly as they reach the outer baffles
      const attenuation = Math.exp(-i * 0.38)
      mat.opacity = wave * envelope.alpha * waveIntensity.current * 0.45 * attenuation
    })

    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const phase = (i / RING_COUNT) * Math.PI * 2
        const wave = (Math.sin(time + phase) + 1) * 0.5
        const scale = 0.95 + wave * 0.22
        child.scale.set(scale, scale, 1)
      })
    }

    // 2. Attenuated exhaust soundwave dissipation at DUCT_EXHAUST outlet
    exhaustMaterials.forEach((mat, i) => {
      const phase = (i / EXHAUST_RING_COUNT) * Math.PI * 2 + 1.2
      const wave = (Math.sin(time + phase) + 1) * 0.5
      const dissipation = Math.exp(-i * 0.42)
      mat.opacity = wave * envelope.alpha * waveIntensity.current * 0.32 * dissipation
    })

    if (exhaustRingsRef.current) {
      exhaustRingsRef.current.children.forEach((child, i) => {
        const phase = (i / EXHAUST_RING_COUNT) * Math.PI * 2 + 1.2
        const wave = (Math.sin(time + phase) + 1) * 0.5
        const scale = 0.92 + wave * 0.30
        child.scale.set(scale, scale, 1)
      })
    }
  })

  const pumpPos = new Vector3(...STATION2_CAD_ANCHORS.pumpHousing)
  const exhaustPos = new Vector3(...STATION2_CAD_ANCHORS.ductExhaust)

  // Static Fallback for Reduced-Motion & Poster Tiers
  if (isStaticMode) {
    return (
      <group name="acoustic-baffle-static">
        {/* Stationary concentric contour arcs showing acoustic attenuation boundary */}
        <group position={[pumpPos.x, pumpPos.y, pumpPos.z]} rotation={[0, -Math.PI / 4, 0]}>
          {ringGeometries.slice(0, 3).map((geo, i) => (
            <mesh key={`static-pump-${i}`} geometry={geo} position={[0, 0, i * 0.08]}>
              <meshBasicMaterial
                color="#00e5ff"
                transparent
                opacity={0.25 / (i + 1)}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
        <group position={[exhaustPos.x, exhaustPos.y, exhaustPos.z - 0.2]} rotation={[0, Math.PI, 0]}>
          {exhaustGeometries.slice(0, 2).map((geo, i) => (
            <mesh key={`static-exhaust-${i}`} geometry={geo} position={[0, 0, i * 0.1]}>
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.2 / (i + 1)}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      </group>
    )
  }

  return (
    <group name="acoustic-baffle-field">
      {/* 1. Internal Acoustic Wavefronts: Radially expanding from PUMP_HOUSING toward ACOUSTIC_BAFFLES */}
      <group
        ref={groupRef}
        position={[pumpPos.x, pumpPos.y + 0.15, pumpPos.z]}
        rotation={[-Math.PI / 6, -Math.PI / 3, 0]}
      >
        {ringGeometries.map((geo, i) => (
          <mesh
            key={`baffle-wave-${i}`}
            geometry={geo}
            material={baffleMaterials[i]}
            position={[0, 0, (i - 2.5) * 0.14]}
          />
        ))}
      </group>

      {/* 2. Dissipating Exhaust Soundwave Baffles: Emitting out rearward from DUCT_EXHAUST */}
      <group
        ref={exhaustRingsRef}
        position={[exhaustPos.x, exhaustPos.y, exhaustPos.z - 0.15]}
        rotation={[0, Math.PI, 0]}
      >
        {exhaustGeometries.map((geo, i) => (
          <mesh
            key={`exhaust-wave-${i}`}
            geometry={geo}
            material={exhaustMaterials[i]}
            position={[0, 0, i * 0.18]}
          />
        ))}
      </group>
    </group>
  )
}
