import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RainSplashesProps {
  count?: number
  enabled?: boolean
  simTime?: number | null
}

export function RainSplashes({ count = 130, enabled = true, simTime = null }: RainSplashesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Lifetime tracking per particle: progress 0..1
  const lifetimes = useMemo(() => new Float32Array(count), [count])
  const phaseOffsets = useMemo(() => new Float32Array(count), [count])
  const seedXZ = useMemo(() => new Float32Array(count * 2), [count])
  const speeds = useMemo(() => new Float32Array(count), [count])
  const scales = useMemo(() => new Float32Array(count), [count])

  const splashMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#7aa2c4') },
        uOpacity: { value: 0.14 },
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
          float dist = length(vUv - 0.5) * 2.0;
          // Hairline delicate expanding surface tension ring
          float ring = smoothstep(0.84, 0.96, dist) * smoothstep(1.0, 0.96, dist);
          float alpha = ring * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    let seed = 0x73706c73
    const nextRand = () => {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    for (let i = 0; i < count; i++) {
      const x0 = (nextRand() - 0.5) * 12
      const z0 = (nextRand() - 0.5) * 12
      seedXZ[i * 2] = x0
      seedXZ[i * 2 + 1] = z0

      dummy.position.set(x0, 0.015, z0)
      dummy.rotation.x = -Math.PI / 2
      dummy.scale.set(0.01, 0.01, 0.01)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      const p0 = nextRand()
      lifetimes[i] = p0 // Stagger phase
      phaseOffsets[i] = p0
      speeds[i] = 2.2 + nextRand() * 1.4
      scales[i] = 0.08 + nextRand() * 0.10
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, dummy, lifetimes, phaseOffsets, scales, seedXZ, speeds])

  useFrame((_, dt) => {
    if (!enabled) {
      splashMaterial.uniforms.uOpacity.value = 0
      return
    }

    splashMaterial.uniforms.uOpacity.value = 0.15
    const mesh = meshRef.current
    if (!mesh) return

    if (simTime != null) {
      for (let i = 0; i < count; i++) {
        const total = phaseOffsets[i] + simTime * speeds[i]
        const cycle = Math.floor(total)
        const life = ((total % 1.0) + 1.0) % 1.0
        const x = ((seedXZ[i * 2] + cycle * 2.3 + 6) % 12) - 6
        const z = ((seedXZ[i * 2 + 1] + cycle * 3.1 + 6) % 12) - 6
        const currentScale = Math.max(0.005, scales[i] * life)

        dummy.position.set(x, 0.015, z)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.scale.set(currentScale, currentScale, currentScale)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      return
    }

    const pos = new THREE.Vector3()
    const rot = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
      lifetimes[i] += dt * speeds[i]

      mesh.getMatrixAt(i, dummy.matrix)
      dummy.matrix.decompose(pos, rot, scale)

      if (lifetimes[i] >= 1.0) {
        // Respawn splash at random impact site
        lifetimes[i] = 0
        pos.set(
          THREE.MathUtils.randFloatSpread(12),
          0.015,
          THREE.MathUtils.randFloatSpread(12),
        )
      }

      // Expand ring outwards
      const currentScale = scales[i] * lifetimes[i]
      scale.set(currentScale, currentScale, currentScale)

      dummy.position.copy(pos)
      dummy.quaternion.copy(rot)
      dummy.scale.copy(scale)
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
      <planeGeometry args={[1, 1]} />
      <primitive object={splashMaterial} attach="material" />
    </instancedMesh>
  )
}

