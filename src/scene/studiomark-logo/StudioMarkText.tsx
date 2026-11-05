import { useMemo, useRef } from 'react'
import { Center, Text, Text3D } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StudioMarkTextProps {
  text?: string
  subtitle?: string
  glowColor?: string
  emissiveIntensity?: number
}

export function StudioMarkText({
  text = 'STUDIOMARK',
  subtitle = 'PRECISION CAD × CREATIVE COMPUTING',
  glowColor = '#d2c4a3',
  emissiveIntensity = 4.5,
}: StudioMarkTextProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const pointLightRef = useRef<THREE.PointLight>(null!)

  const colorObj = useMemo(() => new THREE.Color(glowColor), [glowColor])

  const emissiveMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: colorObj,
      emissive: colorObj,
      emissiveIntensity: emissiveIntensity * 1.5,
      roughness: 0.2,
      metalness: 0.1,
    })
  }, [colorObj, emissiveIntensity])

  useFrame((state) => {
    if (!groupRef.current) return
    // Very subtle idle breathe
    const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.03
    groupRef.current.position.y = 1.95 + breathe

    if (pointLightRef.current) {
      pointLightRef.current.intensity = emissiveIntensity * (1.2 + breathe * 2)
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.95, -1.85]}>
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

