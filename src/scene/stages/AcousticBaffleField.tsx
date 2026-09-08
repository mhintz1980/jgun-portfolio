import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from 'three'
import { getQuality } from '../../state/qualityStore'
import { getScrollState, telemetry } from '../../state/scrollStore'
import { airflowIntensity, stageEnvelope, STAGE_TRANSITIONS, STATION2_CAD_ANCHORS } from './stageWindows'
import {
  ACOUSTIC_RING_COUNT,
  THERMAL_SHELL_COLORS,
  THERMAL_SHELL_COUNT,
  THERMAL_SHELL_OPACITY_MAX,
  THERMAL_SHELL_OPACITY_MIN,
  THERMAL_SHELL_RADII,
} from './airflowRoute'

/**
 * JG-018 → JG-032 — CH.03 Acoustic Baffle Soundwave + Thermal Boundary System.
 *
 * CH.03 is THERMAL / ACOUSTIC — both halves of the authored story render:
 *
 * - ACOUSTIC (JG-018, retained byte-for-byte in behavior): 115 dBA noise at
 *   the PUMP_HOUSING ([0.022, 0.943, -0.055]) radiates as expanding pressure
 *   wavefronts absorbed/deflected by the ACOUSTIC_BAFFLES and 5-layer
 *   composite walls — 6 restrained additive rings (−43 dBA attenuation).
 * - THERMAL (JG-032, owner ruling 2026-09-08 — split approved 6 acoustic /
 *   5 thermal, no third pool, counts fixed): the former 5-ring exhaust pool
 *   is converted into nested thermal boundary shells around PUMP_HOUSING at
 *   radii 0.25–0.65 m, #fbbf24 → #f97316 → #ea580c, opacity 0.06–0.10,
 *   additive BackSide, gentle scale/opacity undulation — the heat-soak
 *   boundary the airflow field's cool→hot ramp picks up from.
 *
 * Performance Contract (r3f-scroll-performance-guard):
 * - Pooled meshes with reused geometries & materials.
 * - Zero per-frame memory allocation.
 * - Reduced motion renders clean static contour arcs with zero rAF loops.
 * - Synchronizes telemetry.stage.acousticWave for runtime verification.
 */

const RING_COUNT = ACOUSTIC_RING_COUNT
const SHELL_COUNT = THERMAL_SHELL_COUNT

export function AcousticBaffleField() {
  const groupRef = useRef<Group>(null)
  const thermalShellsRef = useRef<Group>(null)
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

  const shellGeometries = useMemo(() => {
    return Array.from({ length: SHELL_COUNT }, (_, i) => {
      return new SphereGeometry(THERMAL_SHELL_RADII[i], 32, 18)
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

  const thermalMaterials = useMemo(() => {
    return Array.from({ length: SHELL_COUNT }, (_, i) => {
      return new MeshBasicMaterial({
        color: THERMAL_SHELL_COLORS[i],
        transparent: true,
        opacity: 0,
        side: BackSide,
        depthWrite: false,
        blending: AdditiveBlending,
      })
    })
  }, [])

  useEffect(() => {
    return () => {
      ringGeometries.forEach((g) => g.dispose())
      shellGeometries.forEach((g) => g.dispose())
      baffleMaterials.forEach((m) => m.dispose())
      thermalMaterials.forEach((m) => m.dispose())
    }
  }, [ringGeometries, shellGeometries, baffleMaterials, thermalMaterials])

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
        thermalMaterials.forEach((m) => {
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

    // 2. Thermal boundary shells nested around PUMP_HOUSING (JG-032):
    // gentle undulation inside the 0.06–0.10 opacity band — heat-soak boundary
    thermalMaterials.forEach((mat, i) => {
      const phase = (i / SHELL_COUNT) * Math.PI * 2
      const undulate = 0.5 + 0.5 * Math.sin(time * 0.54 + phase)
      mat.opacity =
        (THERMAL_SHELL_OPACITY_MIN +
          (THERMAL_SHELL_OPACITY_MAX - THERMAL_SHELL_OPACITY_MIN) * undulate) *
        envelope.alpha *
        waveIntensity.current
    })

    if (thermalShellsRef.current) {
      thermalShellsRef.current.children.forEach((child, i) => {
        const phase = (i / SHELL_COUNT) * Math.PI * 2
        const breathe = 1 + 0.03 * Math.sin(time * 0.54 + phase)
        child.scale.set(breathe, breathe, breathe)
      })
    }
  })

  const pumpPos = new Vector3(...STATION2_CAD_ANCHORS.pumpHousing)

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
        {/* Static thermal boundary contours around the pump (heat-soak boundary) */}
        <group position={[pumpPos.x, pumpPos.y, pumpPos.z]}>
          {shellGeometries.slice(0, 2).map((geo, i) => (
            <mesh key={`static-thermal-${i}`} geometry={geo}>
              <meshBasicMaterial
                color={THERMAL_SHELL_COLORS[i]}
                transparent
                opacity={0.05 / (i + 1)}
                side={BackSide}
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

      {/* 2. Thermal Boundary Shells: nested heat-soak boundary around PUMP_HOUSING (JG-032) */}
      <group
        ref={thermalShellsRef}
        position={[pumpPos.x, pumpPos.y, pumpPos.z]}
      >
        {shellGeometries.map((geo, i) => (
          <mesh
            key={`thermal-shell-${i}`}
            geometry={geo}
            material={thermalMaterials[i]}
          />
        ))}
      </group>
    </group>
  )
}
