import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CenterpieceShape } from './types'
import type { BumperFrameState } from './bumperTimeline'
import {
  buildHexInlayGeometry,
  buildHexPlateGeometry,
  buildHexRimGeometry,
  buildMGeometry,
  buildMNeonGeometry,
  buildMobiusGeometry,
  buildMobiusInnerMBaseGeometry,
  buildMobiusInnerSMGeometry,
  buildPlanetaryCrownRingGeometry,
  buildPrismMonolithGeometry,
  buildSNeonGeometry,
  buildSStrokeGeometry,
} from './smGeometries'

interface StudioMarkCenterpieceProps {
  shape?: CenterpieceShape
  spin?: boolean
  speed?: number
  roughness?: number
  transmission?: number
  thickness?: number
  ior?: number
  chromaticAberration?: number
  glowColor?: string
  bumperState?: BumperFrameState | null
}

/**
 * Procedural CAD Hex Gem with central bore hole and chamfered facets.
 * Mirroring Mark's CAD systems engineering brand symbol.
 */
function useHexGemGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    const outerRadius = 1.15
    const sides = 6
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides
      const x = outerRadius * Math.cos(angle)
      const y = outerRadius * Math.sin(angle)
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()

    // Generous central circular optical bore hole for crisp refraction of text
    const hole = new THREE.Path()
    const innerRadius = 0.52
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.55,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    }

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geom.center()
    return geom
  }, [])
}

/**
 * Stylized 3D "SM" Monogram CAD Geometry (Interlocking architectural block).
 */
function useSMMonogramGeometry() {
  return useMemo(() => {
    // Stylized faceted "S" glyph
    const sShape = new THREE.Shape()
    sShape.moveTo(-0.98, 0.9)
    sShape.lineTo(-0.15, 0.9)
    sShape.lineTo(-0.15, 0.58)
    sShape.lineTo(-0.66, 0.58)
    sShape.lineTo(-0.66, 0.16)
    sShape.lineTo(-0.15, 0.16)
    sShape.lineTo(-0.15, -0.9)
    sShape.lineTo(-0.98, -0.9)
    sShape.lineTo(-0.98, -0.58)
    sShape.lineTo(-0.47, -0.58)
    sShape.lineTo(-0.47, -0.16)
    sShape.lineTo(-0.98, -0.16)
    sShape.closePath()

    // Stylized faceted "M" glyph
    const mShape = new THREE.Shape()
    mShape.moveTo(0.05, -0.9)
    mShape.lineTo(0.05, 0.9)
    mShape.lineTo(0.36, 0.9)
    mShape.lineTo(0.58, 0.12)
    mShape.lineTo(0.80, 0.9)
    mShape.lineTo(1.11, 0.9)
    mShape.lineTo(1.11, -0.9)
    mShape.lineTo(0.82, -0.9)
    mShape.lineTo(0.82, 0.25)
    mShape.lineTo(0.65, -0.32)
    mShape.lineTo(0.51, -0.32)
    mShape.lineTo(0.34, 0.25)
    mShape.lineTo(0.34, -0.9)
    mShape.closePath()

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.42,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.045,
      bevelThickness: 0.045,
    }

    const geom = new THREE.ExtrudeGeometry([sShape, mShape], extrudeSettings)
    geom.center()
    return geom
  }, [])
}

/** Geometries + physical materials for the six SM monogram concepts. */
function useSMConcepts(
  ior: number,
  roughness: number,
  transmission: number,
  thickness: number,
  chromaticAberration: number,
  glowColor: string,
) {
  const geo = useMemo(() => {
    // True 3D over-under weave function for Shared Spine & Kinetic Chevron:
    // Top of S weaves in front (+z), upper-mid weaves behind M's left chevron (-z),
    // center spine weaves in front of M's V-valley (+z), bottom tail tucks into M (-z).
    const weave = (_y: number, u: number) => 0.19 * Math.cos(u * Math.PI * 2.5 - 0.35)

    return {
      // Concept 1: Continuous Mobius Ribbon + Inner Sculptural SM Ligature
      mobiusRing: buildMobiusGeometry(),
      mobiusSM: buildMobiusInnerSMGeometry(),
      mobiusMBase: buildMobiusInnerMBaseGeometry(),

      // Concept 2: Interlocking Isometric CAD Hex (3-block CNC assembly)
      hexPlate: buildHexPlateGeometry(),
      hexRim: buildHexRimGeometry(),
      hexInlay: buildHexInlayGeometry(),

      // Concept 3: Shared-Spine Modernist Emblem (Centered interwoven S & M with gold bevel trim)
      spineS: buildSStrokeGeometry({ width: 0.25, depth: 0.26, crest: true, scaleX: 1.05, scaleY: 1.02, weave }),
      spineSGold: buildSStrokeGeometry({ width: 0.31, depth: 0.20, chamfer: 0.03, scaleX: 1.05, scaleY: 1.02, weave }),
      spineM: buildMGeometry({ depth: 0.26, bevel: 0.035 }),
      spineMGold: buildMGeometry({ scale: 1.055, depth: 0.19, bevel: 0.035 }),

      // Concept 4: Kinetic Dimensional Chevron (Prismatic Glass M + Woven Glass S + Dual Neon Filaments)
      chevM: buildMGeometry({ depth: 0.32, bevel: 0.055 }),
      chevMNeon: buildMNeonGeometry(0.032),
      chevS: buildSStrokeGeometry({
        width: 0.25,
        depth: 0.22,
        chamfer: 0.05,
        scaleX: 0.92,
        scaleY: 0.92,
        weave: (_y, u) => 0.16 * Math.cos(u * Math.PI * 2.2) + 0.04,
      }),
      chevSNeon: buildSNeonGeometry(0.034, (_y, u) => 0.16 * Math.cos(u * Math.PI * 2.2) + 0.04),

      // Concept 5: Planetary Gear Crown (24-tooth splined ring + integral SM sun/carrier)
      crownRing: buildPlanetaryCrownRingGeometry(),
      crownInnerM: buildMGeometry({ scale: 0.72, depth: 0.28, bevel: 0.035 }),
      crownInnerS: buildSStrokeGeometry({
        width: 0.22,
        depth: 0.24,
        chamfer: 0.04,
        scaleX: 0.78,
        scaleY: 0.82,
        weave: (_y, u) => 0.14 * Math.sin(u * Math.PI * 2),
      }),

      // Concept 6: Architectural Prism Monolith
      monolithM: buildPrismMonolithGeometry(),
      monolithS: buildSStrokeGeometry({
        width: 0.30,
        depth: 0.52,
        chamfer: 0.06,
        scaleX: 1.08,
        scaleY: 0.96,
      }),
    }
  }, [])

  const mat = useMemo(() => {
    const accent = new THREE.Color(glowColor)
    return {
      // Concept 1: Warm Amber Optical Crystal
      mobiusCrystal: new THREE.MeshPhysicalMaterial({
        color: '#fff6eb',
        transmission: Math.max(0.88, transmission),
        roughness: Math.min(0.22, roughness + 0.04),
        thickness: thickness * 1.15,
        ior,
        dispersion: Math.max(0.06, chromaticAberration),
        attenuationColor: new THREE.Color('#ffaa55').lerp(accent, 0.35),
        attenuationDistance: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      }),
      mobiusCoreGold: new THREE.MeshPhysicalMaterial({
        color: '#f3d9b1',
        metalness: 0.75,
        roughness: 0.18,
        clearcoat: 0.8,
      }),

      // Concept 2 & 5: CNC Brushed Titanium & Champagne Gold
      titanium: new THREE.MeshPhysicalMaterial({
        color: '#8f98a3',
        metalness: 0.88,
        roughness: 0.24,
        clearcoat: 0.35,
        clearcoatRoughness: 0.15,
      }),
      gold: new THREE.MeshPhysicalMaterial({
        color: '#e5cf9e',
        metalness: 0.94,
        roughness: 0.12,
        clearcoat: 0.5,
      }),
      smoky: new THREE.MeshPhysicalMaterial({
        color: '#22262e',
        transmission: 0.85,
        roughness: 0.08,
        thickness: 1.2,
        ior: Math.max(ior, 1.58),
        attenuationColor: new THREE.Color('#12151c'),
        attenuationDistance: 0.65,
        clearcoat: 1.0,
      }),

      // Concept 3: Stealth Matte Black Ceramic
      ceramic: new THREE.MeshPhysicalMaterial({
        color: '#11141c',
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 0.65,
        clearcoatRoughness: 0.18,
      }),

      // Concept 4: Prismatic Glass + Warm Neon Tube
      prism: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transmission: Math.max(0.92, transmission),
        roughness: Math.min(0.12, roughness * 0.6),
        thickness: thickness * 1.1,
        ior: Math.max(ior, 1.62),
        dispersion: Math.max(0.1, chromaticAberration * 1.8),
        attenuationColor: accent,
        attenuationDistance: 1.8,
        clearcoat: 1.0,
      }),
      neon: new THREE.MeshStandardMaterial({
        color: '#e09f52',
        emissive: new THREE.Color('#d98c36').lerp(accent, 0.3),
        emissiveIntensity: 1.25,
        roughness: 0.2,
        metalness: 0.35,
        toneMapped: true,
      }),
    }
  }, [ior, roughness, transmission, thickness, chromaticAberration, glowColor])

  return { geo, mat }
}

/**
 * Centerpiece rotation behavior:
 * Monograms use a dignified upright showcase oscillation + optional smooth Y-axis turntable
 * (never tumbling upside-down on X/Z), while abstract geometric shapes keep multi-axis tumble.
 */
const MONOGRAM_SHAPES = new Set<CenterpieceShape>([
  'sm-mobius',
  'sm-cad-hex',
  'sm-shared-spine',
  'sm-kinetic-chevron',
  'sm-planetary-crown',
  'sm-prism-monolith',
  'sm-monogram',
])

export function StudioMarkCenterpiece({
  shape = 'sm-kinetic-chevron',
  spin = true,
  speed = 0.0008,
  roughness = 0.18,
  transmission = 1.0,
  thickness = 1.25,
  ior = 1.52,
  chromaticAberration = 0.05,
  glowColor = '#d2c4a3',
  bumperState = null,
}: StudioMarkCenterpieceProps) {
  const meshRef = useRef<THREE.Group>(null!)
  const innerGyroRef = useRef<THREE.Mesh>(null!)
  const crownRingRef = useRef<THREE.Mesh>(null!)

  const hexGeometry = useHexGemGeometry()
  const smGeometry = useSMMonogramGeometry()
  const { geo, mat } = useSMConcepts(
    ior,
    roughness,
    transmission,
    thickness,
    chromaticAberration,
    glowColor,
  )

  // High-end transmissive glass material for classic geometric primitives
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      transmission,
      roughness,
      thickness,
      ior,
      dispersion: chromaticAberration,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color(glowColor),
      attenuationDistance: 1.2,
      specularIntensity: 1.0,
    })
  }, [transmission, roughness, thickness, ior, chromaticAberration, glowColor])

  useFrame((state, dt) => {
    if (!meshRef.current) return

    if (bumperState) {
      const [rx, ry, rz] = bumperState.monogramRotation
      meshRef.current.rotation.set(rx, ry, rz)
      meshRef.current.position.y = bumperState.monogramPositionY
      meshRef.current.scale.setScalar(bumperState.monogramScale)
      mat.neon.emissiveIntensity = bumperState.neonIntensity
      return
    }

    meshRef.current.scale.setScalar(1.0)
    mat.neon.emissiveIntensity = 1.25

    const t = state.clock.elapsedTime
    const isMonogram = MONOGRAM_SHAPES.has(shape)

    if (isMonogram) {
      // Keep monograms upright and readable!
      // Gentle architectural presentation sway so lightformers sweep across facets and bevels
      meshRef.current.rotation.x = Math.sin(t * 0.7) * 0.08
      meshRef.current.rotation.z = Math.cos(t * 0.55) * 0.04
      if (spin) {
        // Dignified luxury showcase gimbal arc (±32°) scaled by speed slider
        const swayRate = 0.5 + speed * 650
        meshRef.current.rotation.y = Math.sin(t * swayRate) * 0.52
      } else {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, dt * 4)
      }
    } else {
      if (spin) {
        // Multi-axis rotation for symmetrical geometric gems & knots
        meshRef.current.rotation.x += dt * (speed * 900)
        meshRef.current.rotation.y += dt * (speed * 1250)
        meshRef.current.rotation.z += dt * (speed * 650)
      }
    }

    // Hover close to the wet street puddle (y = 1.24) so its reflection fills the foreground water
    meshRef.current.position.y = 1.24 + Math.sin(t * 1.2) * 0.04

    // Differential spin for gyroscope inner ring
    if (innerGyroRef.current && spin) {
      innerGyroRef.current.rotation.x += dt * (speed * 1800)
      innerGyroRef.current.rotation.z -= dt * (speed * 1400)
    }

    // Slow planetary counter-rotation for the outer gear ring on Concept 5
    if (crownRingRef.current && spin) {
      crownRingRef.current.rotation.z += dt * (speed * 420)
    }
  })

  return (
    <group ref={meshRef} position={[0, 1.24, 0]}>
      {/* CONCEPT 1: Continuous Mobius Ribbon + Sculptural SM Core */}
      {shape === 'sm-mobius' && (
        <group>
          <mesh geometry={geo.mobiusRing} material={mat.mobiusCrystal} castShadow />
          <mesh geometry={geo.mobiusSM} material={mat.mobiusCrystal} castShadow />
          <mesh geometry={geo.mobiusMBase} material={mat.mobiusCoreGold} position={[0, 0, -0.04]} castShadow />
        </group>
      )}

      {/* CONCEPT 2: Interlocking Isometric CAD Hex */}
      {shape === 'sm-cad-hex' && (
        <group>
          {/* Upper-left machined titanium Isometric S block + gold chamfer */}
          <mesh geometry={geo.hexPlate} material={mat.titanium} position={[-0.03, 0.03, 0.03]} castShadow />
          <mesh geometry={geo.hexPlate} material={mat.gold} scale={[1.03, 1.03, 0.88]} position={[-0.03, 0.03, 0.01]} />
          {/* Lower-left wedge + Lower-right M structural frame */}
          <mesh geometry={geo.hexRim} material={mat.titanium} position={[0.02, -0.02, 0]} castShadow />
          <mesh geometry={geo.hexRim} material={mat.gold} scale={[1.028, 1.028, 0.88]} position={[0.02, -0.02, -0.02]} />
          {/* Smoky optical crystal M core */}
          <mesh geometry={geo.hexInlay} material={mat.smoky} position={[0.02, -0.02, 0.01]} />
        </group>
      )}

      {/* CONCEPT 3: Shared-Spine Modernist Emblem */}
      {shape === 'sm-shared-spine' && (
        <group scale={1.08}>
          {/* Stealth Matte Black Ceramic M + Polished Gold Outer Rim */}
          <mesh geometry={geo.spineM} material={mat.ceramic} castShadow />
          <mesh geometry={geo.spineMGold} material={mat.gold} />
          {/* Interwoven Roof-Crest Ceramic S + Polished Gold Trim */}
          <mesh geometry={geo.spineS} material={mat.ceramic} castShadow />
          <mesh geometry={geo.spineSGold} material={mat.gold} />
        </group>
      )}

      {/* CONCEPT 4: Kinetic Dimensional Chevron */}
      {shape === 'sm-kinetic-chevron' && (
        <group scale={1.08}>
          {/* Prismatic Optical Glass M Frame + Internal Warm Neon Filament */}
          <mesh geometry={geo.chevM} material={mat.prism} castShadow />
          <mesh geometry={geo.chevMNeon} material={mat.neon} />
          {/* Interwoven Prismatic Glass S + Internal Warm Neon Filament */}
          <mesh geometry={geo.chevS} material={mat.prism} castShadow />
          <mesh geometry={geo.chevSNeon} material={mat.neon} />
        </group>
      )}

      {/* CONCEPT 5 (NEW): Planetary Gear Crown */}
      {shape === 'sm-planetary-crown' && (
        <group>
          <mesh ref={crownRingRef} geometry={geo.crownRing} material={mat.titanium} castShadow />
          <mesh geometry={geo.crownInnerM} material={mat.gold} position={[0, -0.04, -0.02]} castShadow />
          <mesh geometry={geo.crownInnerS} material={mat.prism} position={[0, 0.02, 0.04]} castShadow />
        </group>
      )}

      {/* CONCEPT 6 (NEW): Architectural Prism Monolith */}
      {shape === 'sm-prism-monolith' && (
        <group scale={1.06}>
          <mesh geometry={geo.monolithM} material={mat.prism} castShadow />
          <mesh geometry={geo.monolithS} material={mat.gold} castShadow />
        </group>
      )}

      {shape === 'hex-gem' && (
        <mesh geometry={hexGeometry} material={glassMaterial} castShadow />
      )}

      {shape === 'sm-monogram' && (
        <mesh geometry={smGeometry} material={glassMaterial} castShadow />
      )}

      {shape === 'torus-knot' && (
        <mesh material={glassMaterial} castShadow>
          <torusKnotGeometry args={[1.05, 0.38, 256, 64]} />
        </mesh>
      )}

      {shape === 'icosahedron' && (
        <mesh material={glassMaterial} castShadow>
          <icosahedronGeometry args={[1.4, 0]} />
        </mesh>
      )}

      {shape === 'gyroscope' && (
        <group>
          {/* Outer Gimbal Ring */}
          <mesh material={glassMaterial} castShadow>
            <torusGeometry args={[1.35, 0.12, 32, 64]} />
          </mesh>
          {/* Inner Counter-Rotating Gimbal Ring */}
          <mesh ref={innerGyroRef} material={glassMaterial} castShadow>
            <torusGeometry args={[0.96, 0.12, 32, 64]} />
          </mesh>
          {/* Core Central Gem */}
          <mesh material={glassMaterial} castShadow>
            <octahedronGeometry args={[0.48, 0]} />
          </mesh>
        </group>
      )}
    </group>
  )
}
