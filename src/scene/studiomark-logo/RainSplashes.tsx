import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RainSplashesProps {
  count?: number
  enabled?: boolean
}

export function RainSplashes({ count = 130, enabled = true }: RainSplashesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Lifetime tracking per particle: progress 0..1
  const lifetimes = useMemo(() => new Float32Array(count), [count])
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

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        THREE.MathUtils.randFloatSpread(12),
        0.015,
        THREE.MathUtils.randFloatSpread(12),
      )
      dummy.rotation.x = -Math.PI / 2
      dummy.scale.set(0.01, 0.01, 0.01)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      lifetimes[i] = Math.random() // Stagger phase
      speeds[i] = THREE.MathUtils.randFloat(2.2, 3.6)
      scales[i] = THREE.MathUtils.randFloat(0.08, 0.18)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, dummy, lifetimes, scales, speeds])

  useFrame((_, dt) => {
    if (!enabled) {
      splashMaterial.uniforms.uOpacity.value = 0
      return
    }

    splashMaterial.uniforms.uOpacity.value = 0.15
    const mesh = meshRef.current
    if (!mesh) return

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

