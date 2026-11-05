import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RainDropsProps {
  count?: number
  intensity?: 'heavy' | 'drizzle' | 'off'
  onDropImpact?: (x: number, z: number) => void
}

export function RainDrops({
  count = 1400,
  intensity = 'heavy',
  onDropImpact,
}: RainDropsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Particle state arrays
  const velocities = useMemo(() => new Float32Array(count), [count])
  const windOffsets = useMemo(() => new Float32Array(count), [count])

  // Raindrop shader material with soft motion streak
  const rainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#94b8d7') },
        uOpacity: { value: 0.35 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          // Elongated droplet streak: sharper in center, soft falloff at head and tail
          float streak = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
          float widthFalloff = smoothstep(0.0, 0.3, 0.5 - abs(vUv.x - 0.5));
          float alpha = streak * widthFalloff * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Initialize random drop distribution
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        THREE.MathUtils.randFloatSpread(14),
        THREE.MathUtils.randFloat(0.1, 9.5),
        THREE.MathUtils.randFloatSpread(14),
      )
      // Slight slant for wind
      dummy.rotation.z = -0.06
      dummy.scale.set(1.0, THREE.MathUtils.randFloat(0.8, 1.4), 1.0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      velocities[i] = THREE.MathUtils.randFloat(14.0, 22.0)
      windOffsets[i] = THREE.MathUtils.randFloat(-0.4, -0.8)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, dummy, velocities, windOffsets])

  useFrame((state, dt) => {
    if (intensity === 'off') {
      rainMaterial.uniforms.uOpacity.value = 0
      return
    }

    const targetOpacity = intensity === 'heavy' ? 0.38 : 0.18
    rainMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      rainMaterial.uniforms.uOpacity.value,
      targetOpacity,
      dt * 4,
    )

    const mesh = meshRef.current
    if (!mesh) return

    const speedScale = intensity === 'heavy' ? 1.0 : 0.65
    const pos = new THREE.Vector3()
    const rot = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(pos, rot, scale)

      // Fall downwards with gravity
      pos.y -= velocities[i] * dt * speedScale
      pos.x += windOffsets[i] * dt * speedScale

      // Hit the puddle floor
      if (pos.y <= 0.05) {
        if (onDropImpact && Math.random() < 0.25) {
          onDropImpact(pos.x, pos.z)
        }
        // Reset to sky
        pos.y = THREE.MathUtils.randFloat(8.0, 11.5)
        pos.x = THREE.MathUtils.randFloatSpread(14)
        pos.z = THREE.MathUtils.randFloatSpread(14)
      }

      // Billboarding towards camera on Y
      dummy.position.copy(pos)
      dummy.quaternion.copy(rot)
      dummy.scale.copy(scale)
      dummy.rotation.y = Math.atan2(
        state.camera.position.x - pos.x,
        state.camera.position.z - pos.z,
      )

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      {/* Thin vertical blade geometry for rain streak */}
      <planeGeometry args={[0.02, 0.45]} />
      <primitive object={rainMaterial} attach="material" />
    </instancedMesh>
  )
}

