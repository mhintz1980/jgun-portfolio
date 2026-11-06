import { useMemo, useRef } from 'react'
import { Center, Text, Text3D } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StudioMarkTextProps {
  text?: string
  subtitle?: string
  glowColor?: string
  emissiveIntensity?: number
  emissiveScale?: number
  simTime?: number | null
}

export function StudioMarkText({
  text = 'STUDIOMARK',
  subtitle = 'PRECISION CAD × CREATIVE COMPUTING',
  glowColor = '#d2c4a3',
  emissiveIntensity = 4.5,
  emissiveScale = 1.0,
  simTime = null,
}: StudioMarkTextProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const pointLightRef = useRef<THREE.PointLight>(null!)

  const colorObj = useMemo(() => new THREE.Color(glowColor), [glowColor])

  const emissiveMaterial = useMemo(() => {
    // Architectural satin finish with restrained emissive so bevels stay razor-sharp
    // (never blowing out into a glowing blob, matching the crisp look of Act I)
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e8dfd1').lerp(colorObj, 0.35),
      emissive: colorObj,
      emissiveIntensity: Math.min(0.42, emissiveIntensity * 0.085),
      roughness: 0.22,
      metalness: 0.16,
    })
  }, [colorObj, emissiveIntensity])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = simTime ?? state.clock.elapsedTime
    // Very subtle idle breathe, positioned at y = 1.24 so its reflection fills the foreground puddle
    const breathe = Math.sin(t * 1.5) * 0.02
    groupRef.current.position.y = 1.24 + breathe

    emissiveMaterial.emissiveIntensity = Math.min(0.45, emissiveIntensity * 0.085) * emissiveScale

    if (pointLightRef.current) {
      pointLightRef.current.intensity = (1.6 + breathe * 1.5) * emissiveScale
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.24, -1.85]}>
      {/* Dynamic point light casting text glow on raindrops and floor */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 0.5]}
        color={glowColor}
        intensity={emissiveIntensity * 1.2}
        distance={10}
        decay={2}
      />

      {/* Main 3D Title: STUDIOMARK */}
      <Center position={[0, 0, 0]}>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={0.82}
          height={0.24}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.035}
          bevelSize={0.02}
          bevelOffset={0}
          bevelSegments={4}
          material={emissiveMaterial}
        >
          {text}
        </Text3D>
      </Center>

      {/* Sleek Technical Subtitle */}
      {subtitle && (
        <Center position={[0, -0.7, 0.08]}>
          <Text
            font="/fonts/BarlowCondensed-SemiBold.ttf"
            fontSize={0.17}
            letterSpacing={0.24}
            color={glowColor}
            anchorX="center"
            anchorY="middle"
          >
            {subtitle}
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.88}
            />
          </Text>
        </Center>
      )}

      {/* Fine Underline Accent Line */}
      <mesh position={[0, -0.48, 0.08]}>
        <boxGeometry args={[4.8, 0.015, 0.01]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

