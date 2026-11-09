import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

interface RainFloorProps {
  rippleStrength?: number
  puddleReflectivity?: number
  rainEnabled?: boolean
  simTime?: number | null
}

/**
 * Procedural GPU Puddle + Asphalt Normal Map Generator.
 * Combines Faraz Shaikh's analytic concentric ripple normal equation
 * and FBM puddle mask (`demo-2023-rain-puddle`) with the real 2K photogrammetry
 * asphalt normal map (`aerial_asphalt_01_nor_gl_2k.jpg`), rendered to an offscreen
 * WebGLRenderTarget at 60 FPS:
 * - Inside puddles (puddleMask -> 1): dead-flat water surface perturbed by concentric raindrop ripples.
 * - Outside puddles (puddleMask -> 0): tactile wet street asphalt normal map.
 */
function usePuddleNormalTexture(
  asphaltNormalTex: THREE.Texture,
  puddleRoughnessTex: THREE.Texture,
  rainEnabled = true,
  rippleStrength = 0.35,
  simTime: number | null = null,
) {
  const { renderTarget, rippleScene, rippleCamera, material } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(512, 512, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
    })

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: rippleStrength },
        uAsphaltNormal: { value: asphaltNormalTex },
        uPuddleRoughness: { value: puddleRoughnessTex },
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
        uniform sampler2D uAsphaltNormal;
        uniform sampler2D uPuddleRoughness;
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

        // Faraz Shaikh analytic ripple normal equation (demo-2023-rain-puddle)
        vec3 getRipples(vec2 uv, float time) {
          vec2 p0 = floor(uv);
          vec2 circles = vec2(0.);

          for (int j = -MAX_RADIUS; j <= MAX_RADIUS; ++j) {
            for (int i = -MAX_RADIUS; i <= MAX_RADIUS; ++i) {
              vec2 pi = p0 + vec2(i, j);
              vec2 hsh = pi;
              vec2 p = pi + hash22(hsh);

              float t = fract(0.32 * time + hash12(hsh));
              vec2 v = p - uv;
              float d = length(v) - 2.0 * t;

              float h = 1e-3;
              float d1 = d - h;
              float d2 = d + h;
              float p1 = sin(31.0 * d1) * smoothstep(-0.6, -0.3, d1) * smoothstep(0.0, -0.3, d1);
              float p2 = sin(31.0 * d2) * smoothstep(-0.6, -0.3, d2) * smoothstep(0.0, -0.3, d2);
              circles += 0.5 * normalize(v) * ((p2 - p1) / (2.0 * h) * (1.0 - t) * (1.0 - t));
            }
          }
          circles /= 9.0;
          return vec3(circles, sqrt(max(0.001, 1.0 - dot(circles, circles))));
        }

        void main() {
          // Derive puddleMask directly from pre-baked puddleRoughnessMap (roughness ~ 0.015 inside puddles)
          float roughSample = texture2D(uPuddleRoughness, vUv).r;
          float puddleMask = 1.0 - smoothstep(0.04, 0.35, roughSample);

          // Sample real 2K asphalt normal (tiled 3x3)
          vec3 roadN = texture2D(uAsphaltNormal, vUv * 3.0).xyz * 2.0 - 1.0;
          roadN = normalize(vec3(roadN.xy * 1.15, roadN.z));

          // Compute analytic water ripples
          vec3 ripples = getRipples(vUv * 34.0, uTime);
          vec2 slope = ripples.xy * uIntensity * 0.85;
          vec3 waterN = normalize(vec3(-slope.x, -slope.y, 1.0));

          // Blend between rough street asphalt normal and flat rippling puddle water normal
          vec3 finalN = normalize(mix(roadN, waterN, puddleMask));
          gl_FragColor = vec4(finalN * 0.5 + 0.5, 1.0);
        }
      `,
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)
    scene.add(quad)

    return { renderTarget: target, rippleScene: scene, rippleCamera: camera, material: mat }
  }, [asphaltNormalTex, puddleRoughnessTex])

  useFrame(({ gl }, dt) => {
    material.uniforms.uAsphaltNormal.value = asphaltNormalTex
    material.uniforms.uPuddleRoughness.value = puddleRoughnessTex
    if (rainEnabled) {
      if (simTime != null) {
        material.uniforms.uTime.value = simTime * 1.65
      } else {
        material.uniforms.uTime.value += dt * 1.65
      }
      material.uniforms.uIntensity.value = rippleStrength
    } else {
      material.uniforms.uIntensity.value = 0.0
    }

    const currentTarget = gl.getRenderTarget()
    gl.setRenderTarget(renderTarget)
    gl.render(rippleScene, rippleCamera)
    gl.setRenderTarget(currentTarget)
  })

  return renderTarget.texture
}

/**
 * Procedural Puddle Roughness Map that carves glassy mirror pools (roughness ~ 0.01)
 * into the surrounding wet textured asphalt street (roughness ~ 0.35 - 0.72),
 * matching the exact FBM puddle mask in `usePuddleNormalTexture`.
 */
function usePuddleRoughnessTexture() {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    const imgData = ctx.createImageData(size, size)
    const data = imgData.data

    function hash12(x: number, y: number) {
      let p3x = (((x * 0.1031) % 1) + 1) % 1
      let p3y = (((y * 0.1031) % 1) + 1) % 1
      let p3z = (((x * 0.1031) % 1) + 1) % 1
      const dot = p3x * (p3y + 19.19) + p3y * (p3z + 19.19) + p3z * (p3x + 19.19)
      p3x += dot
      p3y += dot
      p3z += dot
      const v = (p3x + p3y) * p3z
      return v - Math.floor(v)
    }

    function smoothNoise(x: number, y: number) {
      const ix = Math.floor(x)
      const iy = Math.floor(y)
      const fx = x - ix
      const fy = y - iy
      const ux = fx * fx * (3 - 2 * fx)
      const uy = fy * fy * (3 - 2 * fy)
      const a = hash12(ix, iy)
      const b = hash12(ix + 1, iy)
      const c = hash12(ix, iy + 1)
      const d = hash12(ix + 1, iy + 1)
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
    }

    function fbm(x: number, y: number) {
      let v = 0
      v += 0.5 * smoothNoise(x * 1.0, y * 1.0)
      v += 0.28 * smoothNoise(x * 2.1, y * 2.1)
      v += 0.14 * smoothNoise(x * 4.3, y * 4.3)
      v += 0.08 * smoothNoise(x * 8.7, y * 8.7)
      return v
    }

    function smoothstep(e0: number, e1: number, x: number) {
      const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
      return t * t * (3 - 2 * t)
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size
        const v = 1.0 - y / size
        const cx = (u - 0.5) * 2.0 * 0.85
        const cy = (v - 0.5) * 2.0 * 0.75
        const radialDist = Math.sqrt(cx * cx + cy * cy)

        const nVal = fbm(u * 5.5 + 3.1, v * 5.5 + 1.7)
        const centerPool = smoothstep(0.95, 0.25, radialDist)
        const puddleScore = nVal * 0.85 + centerPool * 0.65
        const puddleMask = smoothstep(0.42, 0.62, puddleScore)

        // Fine asphalt aggregate grain outside the puddle pools
        const grain = (hash12(x * 1.7, y * 1.7) - 0.5) * 38
        const asphaltRough = Math.min(235, Math.max(85, 148 + grain))
        // Inside puddle: near-zero roughness (4 / 255 ≈ 0.015) for razor-sharp mirror reflection
        const rByte = Math.round(asphaltRough * (1.0 - puddleMask) + 4 * puddleMask)

        const idx = (y * size + x) * 4
        data[idx] = rByte
        data[idx + 1] = rByte
        data[idx + 2] = rByte
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])
}

export function RainFloor({
  rippleStrength = 0.35,
  puddleReflectivity = 0.92,
  rainEnabled = true,
  simTime = null,
}: RainFloorProps) {
  const floorRef = useRef<THREE.Mesh>(null!)

  // Real 2K photogrammetry asphalt textures from Faraz Shaikh's demo-2023-rain-puddle
  const roadMaps = useTexture({
    map: '/textures/studiomark-road/aerial_asphalt_01_diff_2k.jpg',
    normalMap: '/textures/studiomark-road/aerial_asphalt_01_nor_gl_2k.jpg',
    aoMap: '/textures/studiomark-road/aerial_asphalt_01_ao_2k.jpg',
  })

  useLayoutEffect(() => {
    Object.values(roadMaps).forEach((tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(3, 3)
      tex.needsUpdate = true
    })
  }, [roadMaps])

  const puddleRoughnessMap = usePuddleRoughnessTexture()
  const compositeNormalMap = usePuddleNormalTexture(
    roadMaps.normalMap,
    puddleRoughnessMap,
    rainEnabled,
    rippleStrength,
    simTime,
  )

  const normalScaleVec = useMemo(
    () => new THREE.Vector2(0.65 + rippleStrength * 0.75, 0.65 + rippleStrength * 0.75),
    [rippleStrength],
  )

  return (
    <group position={[0, -0.01, 0]}>
      {/* Wet Asphalt Street & Mirror Puddle Floor (Faraz Shaikh reference look + Planar Mirror) */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[28, 28, 32, 32]} />
        <MeshReflectorMaterial
          blur={[64, 18]}
          resolution={512}
          mirror={Math.max(0.95, puddleReflectivity)}
          mixBlur={0.08}
          mixStrength={8.5}
          roughness={0.42}
          depthScale={0.05}
          minDepthThreshold={0.2}
          maxDepthThreshold={1.6}
          color="#586478"
          metalness={0.55}
          map={roadMaps.map}
          aoMap={roadMaps.aoMap}
          aoMapIntensity={0.5}
          distortion={rainEnabled ? rippleStrength * 0.045 : 0.0}
          distortionMap={compositeNormalMap}
          normalMap={compositeNormalMap}
          normalScale={normalScaleVec}
          roughnessMap={puddleRoughnessMap}
        />
      </mesh>

      {/* Subtle outer horizon fade ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[8.5, 16.0, 64]} />
        <meshBasicMaterial color="#06080e" transparent opacity={0.78} depthWrite={false} />
      </mesh>
    </group>
  )
}
