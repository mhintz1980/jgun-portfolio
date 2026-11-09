import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RainDropsProps {
  count?: number
  intensity?: 'heavy' | 'drizzle' | 'off'
  onDropImpact?: (x: number, z: number) => void
  simTime?: number | null
}

export function RainDrops({ count = 1400, intensity = 'heavy', onDropImpact, simTime = null }: RainDropsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Particle state arrays + deterministic seed arrays
  const velocities = useMemo(() => new Float32Array(count), [count])
  const windOffsets = useMemo(() => new Float32Array(count), [count])
  const seedPos = useMemo(() => new Float32Array(count * 3), [count])
  const seedScaleY = useMemo(() => new Float32Array(count), [count])

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

  // Initialize deterministic drop distribution (mulberry32 PRNG so renders are 100% repeatable)
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    let seed = 0x534d3344
    const nextRand = () => {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    for (let i = 0; i < count; i++) {
      const x0 = (nextRand() - 0.5) * 14
      const y0 = 0.1 + nextRand() * 9.4
      const z0 = (nextRand() - 0.5) * 14
      const sy = 0.8 + nextRand() * 0.6

      seedPos[i * 3] = x0
      seedPos[i * 3 + 1] = y0
      seedPos[i * 3 + 2] = z0
      seedScaleY[i] = sy

      dummy.position.set(x0, y0, z0)
      // Slight slant for wind
      dummy.rotation.z = -0.06
      dummy.scale.set(1.0, sy, 1.0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      velocities[i] = 14.0 + nextRand() * 8.0
      windOffsets[i] = -0.4 - nextRand() * 0.4
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, dummy, seedPos, seedScaleY, velocities, windOffsets])

  useFrame((state, dt) => {
    if (intensity === 'off') {
      rainMaterial.uniforms.uOpacity.value = 0
      return
    }

    const targetOpacity = intensity === 'heavy' ? 0.38 : 0.18
    if (simTime != null) {
      rainMaterial.uniforms.uOpacity.value = targetOpacity
    } else {
      rainMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        rainMaterial.uniforms.uOpacity.value,
        targetOpacity,
        dt * 4,
      )
    }

    const mesh = meshRef.current
    if (!mesh) return

    const speedScale = intensity === 'heavy' ? 1.0 : 0.65

    if (simTime != null) {
      const spanY = 9.8
      for (let i = 0; i < count; i++) {
        const x0 = seedPos[i * 3]
        const y0 = seedPos[i * 3 + 1]
        const z0 = seedPos[i * 3 + 2]
        const fallDist = velocities[i] * simTime * speedScale
        const y = 9.85 - ((((9.85 - y0 + fallDist) % spanY) + spanY) % spanY)
        const cycle = Math.floor((9.85 - y0 + fallDist) / spanY)
        const x = ((x0 + windOffsets[i] * ((9.85 - y) / velocities[i]) + cycle * 1.7 + 7) % 14) - 7

        dummy.position.set(x, y, z0)
        dummy.rotation.set(0, Math.atan2(state.camera.position.x - x, state.camera.position.z - z0), -0.06)
        dummy.scale.set(1.0, seedScaleY[i], 1.0)
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
      dummy.rotation.y = Math.atan2(state.camera.position.x - pos.x, state.camera.position.z - pos.z)

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      {/* Thin vertical blade geometry for rain streak */}
      <planeGeometry args={[0.02, 0.45]} />
      <primitive object={rainMaterial} attach="material" />
    </instancedMesh>
  )
}
