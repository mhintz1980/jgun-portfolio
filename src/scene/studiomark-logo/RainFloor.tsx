import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface RainFloorProps {
  rippleStrength?: number
  puddleReflectivity?: number
  rainEnabled?: boolean
}

/**
 * Procedural GPU Ripple Normal Map Generator.
 * Directly implements Faraz Shaikh's analytic concentric ripple normal equation
 * (demo-2023-rain-puddle), rendered to an offscreen WebGLRenderTarget at 60 FPS.
 *
 * Real-time reactive: uIntensity uniform tracks rippleStrength dynamically
 * without re-allocating render targets or recompiling shaders.
 */
function useRippleTexture(rainEnabled = true, rippleStrength = 0.35) {
  const { renderTarget, rippleScene, rippleCamera, material } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
    })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: rippleStrength },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;

        #define MAX_RADIUS 1
        #define HASHSCALE1 .1031
        #define HASHSCALE3 vec3(.1031, .1030, .0973)

        float hash12(vec2 p) {
          vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
          p3 += dot(p3, p3.yzx + 19.19);
          return fract((p3.x + p3.y) * p3.z);
        }

        vec2 hash22(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * HASHSCALE3);
          p3 += dot(p3, p3.yzx + 19.19);
          return fract((p3.xx + p3.yz) * p3.zy);
        }

        // Faraz Shaikh analytic ripple normal equation
        vec3 getRipples(vec2 uv, float time) {
          vec2 p0 = floor(uv);
          vec2 circles = vec2(0.);

          for (int j = -MAX_RADIUS; j <= MAX_RADIUS; ++j) {
            for (int i = -MAX_RADIUS; i <= MAX_RADIUS; ++i) {
              vec2 pi = p0 + vec2(i, j);
              vec2 hsh = pi;
              vec2 p = pi + hash22(hsh);

              float t = fract(0.35 * time + hash12(hsh));
              vec2 v = p - uv;
              float d = length(v) - 2.0 * t;

              float h = 1e-3;
              float d1 = d - h;
              float d2 = d + h;
              float p1 = sin(31.0 * d1) * smoothstep(-0.6, -0.25, d1) * smoothstep(0.0, -0.25, d1);
              float p2 = sin(31.0 * d2) * smoothstep(-0.6, -0.25, d2) * smoothstep(0.0, -0.25, d2);
              circles += 0.5 * normalize(v) * ((p2 - p1) / (2.0 * h) * (1.0 - t) * (1.0 - t));
            }
          }
          circles /= 9.0;
          return vec3(circles, sqrt(max(0.001, 1.0 - dot(circles, circles))));
        }

        void main() {
          vec3 ripples = getRipples(vUv * 26.0, uTime);
          vec2 slope = ripples.xy * uIntensity * 1.6;
          vec3 n = normalize(vec3(-slope.x, -slope.y, 1.0));
          // Encode tangent space normal to 0..1 RGB
          gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
        }
      `,
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    scene.add(quad)

    return { renderTarget: target, rippleScene: scene, rippleCamera: camera, material: mat }
  }, []) // stable singleton setup

  useFrame(({ gl }, dt) => {
    if (!rainEnabled) return
    material.uniforms.uTime.value += dt * 1.5
    material.uniforms.uIntensity.value = rippleStrength

    const currentTarget = gl.getRenderTarget()
    gl.setRenderTarget(renderTarget)
    gl.render(rippleScene, rippleCamera)
    gl.setRenderTarget(currentTarget)
  })

  return renderTarget.texture
}

/**
 * Procedural Puddle Mask & Roughness Texture.
 * Creates organic wet depression pools across the asphalt floor:
 * - Ultra-slick mirror puddle pools in the center (roughness ~0.02)
 * - Meandering puddle pools expanding outward
 * - Surrounding dark textured asphalt (roughness ~0.85)
 */
function usePuddleMaskTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Base asphalt fill
    ctx.fillStyle = '#b8b8b8'
    ctx.fillRect(0, 0, size, size)

    const imgData = ctx.getImageData(0, 0, size, size)
    const data = imgData.data

    const seed = 37.19
    function hash(x: number, y: number) {
      const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453
      return n - Math.floor(n)
    }

    function smoothNoise(x: number, y: number) {
      const i = Math.floor(x)
      const j = Math.floor(y)
      const fx = x - i
      const fy = y - j
      const sx = fx * fx * (3 - 2 * fx)
      const sy = fy * fy * (3 - 2 * fy)

      const s00 = hash(i, j)
      const s10 = hash(i + 1, j)
      const s01 = hash(i, j + 1)
      const s11 = hash(i + 1, j + 1)

      const nx0 = s00 * (1 - sx) + s10 * sx
      const nx1 = s01 * (1 - sx) + s11 * sx
      return nx0 * (1 - sy) + nx1 * sy
    }

    function fbm(x: number, y: number) {
      let v = 0
      v += 0.50 * smoothNoise(x * 0.012, y * 0.012)
      v += 0.28 * smoothNoise(x * 0.024, y * 0.024)
      v += 0.14 * smoothNoise(x * 0.048, y * 0.048)
      v += 0.08 * smoothNoise(x * 0.096, y * 0.096)
      return v
    }

    const cx = size / 2
    const cy = size / 2

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - cx) / (size * 0.44)
        const dy = (y - cy) / (size * 0.44)
        const dist = Math.sqrt(dx * dx + dy * dy)

        const noiseVal = fbm(x, y)
        // Pool accumulates primarily in center studio zone
        const puddleVal = noiseVal * 1.35 - dist * 0.58

        // Asphalt fine grain noise (adds tactile roughness to dry areas)
        const grain = (hash(x * 2.1, y * 2.1) - 0.5) * 22

        let roughness: number
        if (puddleVal > 0.44) {
          // Deep glassy puddle mirror pool
          roughness = 8
        } else if (puddleVal > 0.32) {
          // Wet transition fringe
          const t = (puddleVal - 0.32) / 0.12
          roughness = Math.round(210 * (1 - t) + 8 * t)
        } else {
          // Surrounding dark asphalt pavement
          roughness = Math.min(255, Math.max(160, Math.round(210 + grain)))
        }

        const idx = (y * size + x) * 4
        data[idx] = roughness
        data[idx + 1] = roughness
        data[idx + 2] = roughness
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1.5, 1.5)
    return texture
  }, [])
}

export function RainFloor({
  rippleStrength = 0.35,
  puddleReflectivity = 0.85,
  rainEnabled = true,
}: RainFloorProps) {
  const floorRef = useRef<THREE.Mesh>(null!)
  const rippleNormalMap = useRippleTexture(rainEnabled, rippleStrength)
  const puddleMask = usePuddleMaskTexture()

  const normalScaleVec = useMemo(
    () => new THREE.Vector2(rippleStrength * 1.8, rippleStrength * 1.8),
    [rippleStrength],
  )

  return (
    <group position={[0, -0.01, 0]}>
      {/* Primary Reflective Wet Puddle Floor with Real-Time Scene Mirroring */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[32, 32, 64, 64]} />
        <MeshReflectorMaterial
          blur={[220, 70]}
          resolution={512}
          mirror={puddleReflectivity}
          mixBlur={0.55}
          mixStrength={3.4}
          roughness={0.08}
          depthScale={0.35}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.5}
          color="#0a0e17"
          metalness={0.22}
          distortion={rainEnabled ? rippleStrength * 0.12 : 0.0}
          distortionMap={rippleNormalMap}
          normalMap={rippleNormalMap}
          normalScale={normalScaleVec}
          roughnessMap={puddleMask}
        />
      </mesh>

      {/* Subtle outer darkening rim for infinite storm horizon vignette */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[6.5, 15.0, 64]} />
        <meshBasicMaterial
          color="#06080e"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
