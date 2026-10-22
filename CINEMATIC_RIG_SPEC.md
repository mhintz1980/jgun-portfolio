# Cinematic Rig, GLB Auditor, Exploded-View & Telemetry Implementation Spec

## Constraints & Guardrails
- **Stack:** React 19.2, Vite 7, TypeScript 5.9 (`npm run typecheck` must pass with 0 errors), `three@0.185`, `@react-three/fiber@9.7`, `@react-three/drei@10.7.8`, `postprocessing@6.39`, `@react-three/postprocessing@3.1`, `troika-three-text`, `gsap@3.13`, `lenis@1.3`.
- **Protected Models:** NEVER run `gltfjsx --transform` on `public/models/m249-transformed.glb` or `public/models/msp-enclosure.glb`.
- **Verification:** Always verify via `npm run typecheck` and Playwright runtime evaluation of `window.__WEBGL_TELEMETRY__` and `window.__GLB_MANIFESTS__`.

---

## File 1: `src/utils/lenisGsapBridge.ts` (Root Scroll Synchronization)

### BEFORE
```tsx
// Unsynchronized Lenis and GSAP ScrollTrigger clocks causing jitter during camera spline scrubs
import Lenis from 'lenis'
const lenis = new Lenis()
```

### AFTER
```tsx
// src/utils/lenisGsapBridge.ts
import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useLenisGsapBridge() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const updateTicker = (time: number) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateTicker)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(updateTicker)
      lenis.destroy()
    }
  }, [])
}
```

---

## File 2: `src/utils/glbSceneAuditor.ts` (Non-Destructive GLB Manifest + Radial/Axial Exploded-View Vectors)

### BEFORE
```tsx
// No runtime mesh/material manifest or automated explosion vector math
const { scene } = useGLTF('/models/msp-enclosure.glb')
```

### AFTER
```tsx
// src/utils/glbSceneAuditor.ts
import { useEffect } from 'react'
import * as THREE from 'three'

export interface GLBNodeRecord {
  path: string
  name: string
  type: string
  materialName: string
  vertexCount: number
  bboxSize: [number, number, number]
  bboxCenter: [number, number, number]
  explodeVector: [number, number, number]
}

export interface GLBManifest {
  modelPath: string
  assemblyCenter: [number, number, number]
  totalMeshes: number
  totalVertices: number
  uniqueMaterials: string[]
  nodes: GLBNodeRecord[]
}

declare global {
  interface Window {
    __GLB_MANIFESTS__?: Record<string, GLBManifest>
    __CopyGLBManifest__?: (modelPath?: string) => string
  }
}

export function auditGLBScene(scene: THREE.Object3D, modelPath: string): GLBManifest {
  const nodes: GLBNodeRecord[] = []
  const materialSet = new Set<string>()
  let totalVertices = 0

  const assemblyBox = new THREE.Box3()
  const assemblyCenter = new THREE.Vector3()
  const tempBox = new THREE.Box3()
  const tempSize = new THREE.Vector3()
  const tempCenter = new THREE.Vector3()
  const tempExplode = new THREE.Vector3()

  scene.updateMatrixWorld(true)
  assemblyBox.setFromObject(scene)
  assemblyBox.getCenter(assemblyCenter)

  const getPath = (obj: THREE.Object3D): string => {
    const parts: string[] = []
    let curr: THREE.Object3D | null = obj
    while (curr && curr !== scene) {
      parts.unshift(curr.name || `[${curr.type}]`)
      curr = curr.parent
    }
    return parts.join(' / ')
  }

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const geom = mesh.geometry
      const vCount = geom?.attributes?.position?.count ?? 0
      totalVertices += vCount

      tempBox.setFromObject(mesh)
      tempBox.getSize(tempSize)
      tempBox.getCenter(tempCenter)

      // Compute outward radial/axial explosion vector from assembly centroid
      tempExplode.subVectors(tempCenter, assemblyCenter)
      if (tempExplode.lengthSq() < 0.0001) {
        tempExplode.set(0, 1, 0)
      } else {
        tempExplode.normalize()
      }

      // Store base local position and explosion direction on userData for runtime scrubbing
      if (!mesh.userData.basePosition) {
        mesh.userData.basePosition = mesh.position.clone()
      }
      mesh.userData.explodeDirection = tempExplode.clone()

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      const matNames = mats
        .filter(Boolean)
        .map((m) => {
          const name = m.name || '[UnnamedMaterial]'
          materialSet.add(name)
          return name
        })
        .join(', ')

      nodes.push({
        path: getPath(mesh),
        name: mesh.name || '[UnnamedMesh]',
        type: mesh.type,
        materialName: matNames,
        vertexCount: vCount,
        bboxSize: [
          Number(tempSize.x.toFixed(3)),
          Number(tempSize.y.toFixed(3)),
          Number(tempSize.z.toFixed(3)),
        ],
        bboxCenter: [
          Number(tempCenter.x.toFixed(3)),
          Number(tempCenter.y.toFixed(3)),
          Number(tempCenter.z.toFixed(3)),
        ],
        explodeVector: [
          Number(tempExplode.x.toFixed(3)),
          Number(tempExplode.y.toFixed(3)),
          Number(tempExplode.z.toFixed(3)),
        ],
      })
    }
  })

  const manifest: GLBManifest = {
    modelPath,
    assemblyCenter: [
      Number(assemblyCenter.x.toFixed(3)),
      Number(assemblyCenter.y.toFixed(3)),
      Number(assemblyCenter.z.toFixed(3)),
    ],
    totalMeshes: nodes.length,
    totalVertices,
    uniqueMaterials: Array.from(materialSet),
    nodes,
  }

  if (typeof window !== 'undefined') {
    window.__GLB_MANIFESTS__ = window.__GLB_MANIFESTS__ || {}
    window.__GLB_MANIFESTS__[modelPath] = manifest

    window.__CopyGLBManifest__ = (targetPath = modelPath) => {
      const data = window.__GLB_MANIFESTS__?.[targetPath]
      const json = JSON.stringify(data, null, 2)
      navigator.clipboard?.writeText(json).catch(() => {})
      return json
    }
  }

  return manifest
}

export function useGLBSceneAuditor(scene: THREE.Object3D | null | undefined, modelPath: string) {
  useEffect(() => {
    if (!scene) return
    auditGLBScene(scene, modelPath)
  }, [scene, modelPath])
}
```

---

## File 3: `src/components/canvas/CameraSplineStudio.tsx` (`?debug=rig` Interactive Authoring HUD)

### BEFORE
```tsx
// No interactive 3D gizmos or TypeScript keyframe exporter
export function CameraSplineStudio() { return null }
```

### AFTER
```tsx
// src/components/canvas/CameraSplineStudio.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import {
  PivotControls,
  CatmullRomLine,
  OrbitControls,
  Html,
  Text,
  Billboard,
} from '@react-three/drei'

export interface ShotKeyframe {
  id: string
  label: string
  camPos: [number, number, number]
  targetPos: [number, number, number]
  fov: number
  timeScale: number
  housingOpacity: number
  explodeAmount: number
  machiningConstant: number
}

export const DEFAULT_SHOT_KEYFRAMES: ShotKeyframe[] = [
  {
    id: 'establishing',
    label: 'Shot 1: Hero Establishing',
    camPos: [0.0, 1.8, 6.2],
    targetPos: [0.0, 0.6, 0.0],
    fov: 40,
    timeScale: 1.0,
    housingOpacity: 1.0,
    explodeAmount: 0.0,
    machiningConstant: 3.0,
  },
  {
    id: 'bullet-time-orbit',
    label: 'Shot 2: Bullet-Time Orbit',
    camPos: [4.2, 1.4, 2.8],
    targetPos: [0.0, 0.55, 0.0],
    fov: 32,
    timeScale: 0.03,
    housingOpacity: 0.85,
    explodeAmount: 0.15,
    machiningConstant: 2.2,
  },
  {
    id: 'assembly-isolation',
    label: 'Shot 3: Sub-Assembly Isolation',
    camPos: [1.8, 2.2, -3.6],
    targetPos: [0.0, 0.45, 0.0],
    fov: 28,
    timeScale: 0.15,
    housingOpacity: 0.08,
    explodeAmount: 0.35,
    machiningConstant: 1.2,
  },
  {
    id: 'machining-macro',
    label: 'Shot 4: CNC Machining Macro',
    camPos: [-0.9, 0.65, 1.35],
    targetPos: [-0.15, 0.4, 0.0],
    fov: 22,
    timeScale: 1.0,
    housingOpacity: 0.08,
    explodeAmount: 0.0,
    machiningConstant: -0.25,
  },
]

interface CameraSplineStudioProps {
  initialKeyframes?: ShotKeyframe[]
  onScrubChange?: (progress: number, interpolated: Omit<ShotKeyframe, 'id' 'label' |>) => void
}

export function CameraSplineStudio({
  initialKeyframes = DEFAULT_SHOT_KEYFRAMES,
  onScrubChange,
}: CameraSplineStudioProps) {
  const isDebugRig =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'rig'

  const [keyframes, setKeyframes] = useState<ShotKeyframe[]>(initialKeyframes)
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [scrubProgress, setScrubProgress] = useState<number>(0)
  const [directorMode, setDirectorMode] = useState<boolean>(false)
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false)

  const { camera } = useThree()

  const { cameraCurve, targetCurve, camPoints, targetPoints } = useMemo(() => {
    const camVecs = keyframes.map((k) => new THREE.Vector3(...k.camPos))
    const targetVecs = keyframes.map((k) => new THREE.Vector3(...k.targetPos))

    const cameraCurve = new THREE.CatmullRomCurve3(camVecs, false, 'centripetal', 0.5)
    const targetCurve = new THREE.CatmullRomCurve3(targetVecs, false, 'centripetal', 0.5)

    return {
      cameraCurve,
      targetCurve,
      camPoints: camVecs.map((v) => [v.x, v.y, v.z] as [number, number, number]),
      targetPoints: targetVecs.map((v) => [v.x, v.y, v.z] as [number, number, number]),
    }
  }, [keyframes])

  const tempCam = useMemo(() => new THREE.Vector3(), [])
  const tempTarget = useMemo(() => new THREE.Vector3(), [])
  const tempMat = useMemo(() => new THREE.Matrix4(), [])
  const tempPos = useMemo(() => new THREE.Vector3(), [])

  const updateKeyframeVector = useCallback(
    (index: number, field: 'camPos' | 'targetPos', matrix: THREE.Matrix4) => {
      tempPos.setFromMatrixPosition(matrix)
      const rounded: [number, number, number] = [
        Number(tempPos.x.toFixed(3)),
        Number(tempPos.y.toFixed(3)),
        Number(tempPos.z.toFixed(3)),
      ]
      setKeyframes((prev) =>
        prev.map((kf, idx) => (idx === index ? { ...kf, [field]: rounded } : kf))
      )
    },
    [tempPos]
  )

  const evaluateAtProgress = useCallback(
    (t: number) => {
      const clamped = THREE.MathUtils.clamp(t, 0, 1)
      cameraCurve.getPointAt(clamped, tempCam)
      targetCurve.getPointAt(clamped, tempTarget)

      const scaled = clamped * (keyframes.length - 1)
      const i0 = Math.floor(scaled)
      const i1 = Math.min(i0 + 1, keyframes.length - 1)
      const alpha = scaled - i0

      const k0 = keyframes[i0]
      const k1 = keyframes[i1]

      return {
        camPos: [tempCam.x, tempCam.y, tempCam.z] as [number, number, number],
        targetPos: [tempTarget.x, tempTarget.y, tempTarget.z] as [number, number, number],
        fov: THREE.MathUtils.lerp(k0.fov, k1.fov, alpha),
        timeScale: THREE.MathUtils.lerp(k0.timeScale, k1.timeScale, alpha),
        housingOpacity: THREE.MathUtils.lerp(k0.housingOpacity, k1.housingOpacity, alpha),
        explodeAmount: THREE.MathUtils.lerp(k0.explodeAmount, k1.explodeAmount, alpha),
        machiningConstant: THREE.MathUtils.lerp(k0.machiningConstant, k1.machiningConstant, alpha),
      }
    },
    [cameraCurve, targetCurve, keyframes, tempCam, tempTarget]
  )

  useFrame(() => {
    if (!isDebugRig) return

    const stateAtT = evaluateAtProgress(scrubProgress)
    onScrubChange?.(scrubProgress, stateAtT)

    if (!directorMode) {
      camera.position.set(...stateAtT.camPos)
      camera.lookAt(...stateAtT.targetPos)
      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - stateAtT.fov) > 0.01) {
        camera.fov = stateAtT.fov
        camera.updateProjectionMatrix()
      }
    }
  })

  const copyTypeScriptKeyframes = () => {
    const code = `export const AUTHORED_SHOT_KEYFRAMES: ShotKeyframe[] = ${JSON.stringify(keyframes, null, 2)};\n\nexport const CAMERA_SPLINE_VECTORS = [\n${keyframes
      .map((k) => `  new THREE.Vector3(${k.camPos.join(', ')}), //${k.label}`)
      .join('\n')}\n];\n\nexport const TARGET_SPLINE_VECTORS = [\n${keyframes
      .map((k) => `  new THREE.Vector3(${k.targetPos.join(', ')}), //${k.label}`)
      .join('\n')}\n];`

    navigator.clipboard.writeText(code)
    setCopiedNotice(true)
    setTimeout(() => setCopiedNotice(false), 2200)
  }

  useEffect(() => {
    if (isDebugRig && typeof window !== 'undefined') {
      ;(window as any).__AUTHORED_KEYFRAMES__ = keyframes
    }
  }, [isDebugRig, keyframes])

  if (!isDebugRig) return null

  const currentEval = evaluateAtProgress(scrubProgress)

  return (
    <group name="CameraSplineStudio">
      {directorMode && <OrbitControls dampingFactor="{0.08}" enableDamping makeDefault/>}

      <CatmullRomLine color="#00f0ff" curveType="centripetal" lineWidth="{2.5}" points="{camPoints}" tension="{0.5}"/>
      <CatmullRomLine color="#ff9900" curveType="centripetal" dashScale="{12}" dashed lineWidth="{2.0}" points="{targetPoints}" tension="{0.5}"/>

      <group position={currentEval.camPos}>
        <mesh>
          <coneGeometry args={[0.14, 0.32, 4]} />
          <meshBasicMaterial color="#00f0ff" wireframe />
        </mesh>
      </group>

      {keyframes.map((kf, index) => {
        const isSelected = index === activeIdx
        return (
          <React.Fragment key="{kf.id}">
            <PivotControls 0, 0.4} 0.65 0]} 1.5} 3 : ? anchor="{[0," lineWidth="{isSelected" matrix="{tempMat.clone().setPosition(...kf.camPos)}" onDrag="{(l)" scale="{isSelected"> updateKeyframeVector(index, 'camPos', l)}
            >
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIdx(index)
                  setScrubProgress(index / (keyframes.length - 1))
                }}
              >
                <sphereGeometry args={[isSelected ? 0.11 : 0.075, 16, 16]} />
                <meshBasicMaterial color={isSelected ? '#00f0ff' : '#007799'} />
              </mesh>
              <Billboard 0.22, 0]} position="{[0,">
                <Text color="#00f0ff" fontSize="{0.09}" outlineColor="#000" outlineWidth="{0.008}">
                  {`CAM ${index + 1}`}
                </Text>
              </Billboard>
            </PivotControls>

            <PivotControls 0, 0.35} 0.55 0]} 1.2} 2.5 : ? anchor="{[0," lineWidth="{isSelected" matrix="{tempMat.clone().setPosition(...kf.targetPos)}" onDrag="{(l)" scale="{isSelected"> updateKeyframeVector(index, 'targetPos', l)}
            >
              <mesh
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIdx(index)
                }}
              >
                <octahedronGeometry args={[isSelected ? 0.09 : 0.06, 0]} />
                <meshBasicMaterial color={isSelected ? '#ff9900' : '#995500'} wireframe={!isSelected} />
              </mesh>
              <Billboard 0.18, 0]} position="{[0,">
                <Text color="#ff9900" fontSize="{0.075}" outlineColor="#000" outlineWidth="{0.008}">
                  {`TGT ${index + 1}`}
                </Text>
              </Billboard>
            </PivotControls>
          </React.Fragment>
        )
      })}

      <Html 'none' fullscreen pointerEvents: style="{{" }}>
        <div
          style={{ pointerEvents: 'auto' }}
          className="fixed bottom-4 right-4 z-50 w-96 rounded-xl border border-cyan-500/40 bg-zinc-950/90 p-4 font-mono text-xs text-zinc-100 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-bold tracking-wider text-cyan-400">SPLINE RIG STUDIO (?debug=rig)</span>
            <button
              type="button"
              onClick={() => setDirectorMode((v) => !v)}
              className={`rounded px-2 py-1 text-[11px] font-semibold transition ${
                directorMode ? 'bg-amber-500 text-zinc-950' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {directorMode ? 'VIEW: DIRECTOR ORBIT' : 'VIEW: CAMERA POV'}
            </button>
          </div>

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
              <span>SPLINE SCRUB (t = {scrubProgress.toFixed(3)})</span>
              <span>FOV: {currentEval.fov.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.001}
              value={scrubProgress}
              onChange={(e) => setScrubProgress(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1">
            {keyframes.map((kf, idx) => (
              <button
                key={kf.id}
                type="button"
                onClick={() => {
                  setActiveIdx(idx)
                  setScrubProgress(idx / (keyframes.length - 1))
                }}
                className={`rounded py-1 text-center text-[11px] transition ${
                  idx === activeIdx ? 'bg-cyan-500 font-bold text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Shot {idx + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copyTypeScriptKeyframes}
            className="w-full rounded-lg bg-cyan-400 py-2 font-bold text-zinc-950 transition hover:bg-cyan-300"
          >
            {copiedNotice ? '✓ COPIED TS ARRAYS TO CLIPBOARD!' : 'COPY TYPESCRIPT KEYFRAMES'}
          </button>
        </div>
      </Html>
    </group>
  )
}
```

---

## File 4: `src/components/canvas/ProductStage.tsx` (Unified Spline Camera, Bullet-Time, Isolation, Explode & GLSL Machining)

### BEFORE
```tsx
// Basic static GLTF stage without spline camera, bullet-time clock, or telemetry
export function ProductStage() { return null }
```

### AFTER
```tsx
// src/components/canvas/ProductStage.tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, PerspectiveCamera, Text, Billboard } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGLBSceneAuditor } from '../../utils/glbSceneAuditor'
import { CameraSplineStudio, DEFAULT_SHOT_KEYFRAMES } from './CameraSplineStudio'

gsap.registerPlugin(ScrollTrigger)

export interface WebGLTelemetryState {
  splineProgress: number
  timeScale: number
  simTime: number
  housingOpacity: number
  explodeAmount: number
  machiningPlaneConstant: number
  hudOpacity: number
  cameraFov: number
  cameraWorldPos: [number, number, number]
  targetWorldPos: [number, number, number]
  activeShot: 'establishing' | 'bullet-time-orbit' | 'assembly-isolation' | 'machining-macro'
}

declare global {
  interface Window {
    __WEBGL_TELEMETRY__?: WebGLTelemetryState
  }
}

export const rigState: WebGLTelemetryState = {
  splineProgress: 0,
  timeScale: 1.0,
  simTime: 0,
  housingOpacity: 1.0,
  explodeAmount: 0.0,
  machiningPlaneConstant: 3.0,
  hudOpacity: 0.0,
  cameraFov: 40,
  cameraWorldPos: [0, 1.8, 6.2],
  targetWorldPos: [0, 0.6, 0],
  activeShot: 'establishing',
}

interface ProductStageProps {
  modelPath: '/models/msp-enclosure.glb' | '/models/m249-transformed.glb'
  housingNodeMatch?: RegExp
  movingPartNodeMatch?: RegExp
}

export function ProductStage({
  modelPath,
  housingNodeMatch = /enclosure|housing|panel|cover|receiver|shroud/i,
  movingPartNodeMatch = /impeller|fan|bolt|carrier|barrel|rotor|spindle/i,
}: ProductStageProps) {
  const { camera, gl } = useThree()
  const { scene } = useGLTF(modelPath)

  useGLBSceneAuditor(scene, modelPath)

  const movingPartsRef = useRef<THREE.Object3D[]>([])
  const housingMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([])
  const explodableMeshesRef = useRef<THREE.Mesh[]>([])
  const dofRef = useRef<any>(null)

  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  const { cameraSpline, targetSpline, machiningPlane, tempCamPos, tempTargetPos } = useMemo(() => {
    const cameraSpline = new THREE.CatmullRomCurve3(
      DEFAULT_SHOT_KEYFRAMES.map((k) => new THREE.Vector3(...k.camPos)),
      false,
      'centripetal',
      0.5
    )

    const targetSpline = new THREE.CatmullRomCurve3(
      DEFAULT_SHOT_KEYFRAMES.map((k) => new THREE.Vector3(...k.targetPos)),
      false,
      'centripetal',
      0.5
    )

    const machiningPlane = new THREE.Plane(
      new THREE.Vector3(-1, -0.2, 0).normalize(),
      rigState.machiningPlaneConstant
    )

    return {
      cameraSpline,
      targetSpline,
      machiningPlane,
      tempCamPos: new THREE.Vector3(),
      tempTargetPos: new THREE.Vector3(),
    }
  }, [])

  useEffect(() => {
    const movingParts: THREE.Object3D[] = []
    const housingMaterials: THREE.MeshStandardMaterial[] = []
    const explodableMeshes: THREE.Mesh[] = []

    scene.traverse((child) => {
      if (movingPartNodeMatch.test(child.name)) {
        movingParts.push(child)
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        explodableMeshes.push(mesh)

        const origMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        if (origMat && origMat instanceof THREE.MeshStandardMaterial) {
          const clonedMat = origMat.clone()
          clonedMat.clippingPlanes = [machiningPlane]
          clonedMat.clipShadows = true

          clonedMat.onBeforeCompile = (shader) => {
            shader.uniforms.uClipPlane = {
              value: new THREE.Vector4(
                machiningPlane.normal.x,
                machiningPlane.normal.y,
                machiningPlane.normal.z,
                machiningPlane.constant
              ),
            }
            shader.vertexShader = shader.vertexShader
              .replace(
                '#include <common>',
                `#include <common>\nvarying vec3 vWorldPosition;`
              )
              .replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>\nvWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
              )
            shader.fragmentShader = shader.fragmentShader
              .replace(
                '#include <common>',
                `#include <common>\nvarying vec3 vWorldPosition;\nuniform vec4 uClipPlane;`
              )
              .replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>
                 float distToCut = abs(dot(vWorldPosition, uClipPlane.xyz) + uClipPlane.w);
                 float kerfGlow = 1.0 - smoothstep(0.0, 0.025, distToCut);
                 gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.42, 0.05) * 2.5, kerfGlow);`
              )
            clonedMat.userData.shader = shader
          }

          if (housingNodeMatch.test(mesh.name) || housingNodeMatch.test(mesh.parent?.name || '')) {
            clonedMat.transparent = true
            housingMaterials.push(clonedMat)
          }

          mesh.material = clonedMat
        }
      }
    })

    movingPartsRef.current = movingParts
    housingMaterialsRef.current = housingMaterials
    explodableMeshesRef.current = explodableMeshes
  }, [scene, housingNodeMatch, movingPartNodeMatch, machiningPlane])

  useEffect(() => {
    const isDebugRig =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'rig'
    if (isDebugRig) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#cinematic-scroll-container',
          start: 'top top',
          end: '+=450%',
          pin: true,
          scrub: 0.85,
        },
      })

      tl.to(
        rigState,
        {
          splineProgress: 0.35,
          timeScale: 0.03,
          explodeAmount: 0.15,
          cameraFov: 32,
          onUpdate: () => {
            rigState.activeShot = 'bullet-time-orbit'
          },
          duration: 2,
          ease: 'power2.inOut',
        },
        0
      )

      tl.to(
        rigState,
        {
          splineProgress: 0.7,
          housingOpacity: 0.08,
          explodeAmount: 0.35,
          hudOpacity: 1.0,
          onUpdate: () => {
            rigState.activeShot = 'assembly-isolation'
          },
          duration: 2,
          ease: 'none',
        },
        2
      )

      tl.to(
        rigState,
        {
          splineProgress: 1.0,
          timeScale: 1.0,
          explodeAmount: 0.0,
          machiningPlaneConstant: -0.25,
          cameraFov: 22,
          onUpdate: () => {
            rigState.activeShot = 'machining-macro'
          },
          duration: 2,
          ease: 'power3.out',
        },
        4
      )
    })

    return () => ctx.revert()
  }, [])

  useFrame((_, delta) => {
    const isDebugRig =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'rig'

    const t = THREE.MathUtils.clamp(rigState.splineProgress, 0, 1)
    cameraSpline.getPointAt(t, tempCamPos)
    targetSpline.getPointAt(t, tempTargetPos)

    if (!isDebugRig) {
      camera.position.copy(tempCamPos)
      camera.lookAt(tempTargetPos)

      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - rigState.cameraFov) > 0.01) {
        camera.fov = rigState.cameraFov
        camera.updateProjectionMatrix()
      }
    }

    if (dofRef.current?.target) {
      dofRef.current.target.copy(tempTargetPos)
    }

    const clampedDelta = Math.min(delta, 0.1)
    rigState.simTime += clampedDelta * rigState.timeScale

    for (const part of movingPartsRef.current) {
      part.rotation.z = rigState.simTime * 8.0
    }

    for (const mat of housingMaterialsRef.current) {
      mat.opacity = rigState.housingOpacity
      mat.depthWrite = rigState.housingOpacity > 0.95
    }

    for (const mesh of explodableMeshesRef.current) {
      const basePos = mesh.userData.basePosition as THREE.Vector3 | undefined
      const dir = mesh.userData.explodeDirection as THREE.Vector3 | undefined
      if (basePos && dir) {
        mesh.position.copy(basePos).addScaledVector(dir, rigState.explodeAmount)
      }
    }

    machiningPlane.constant = rigState.machiningPlaneConstant
    scene.traverse((child) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (mat?.userData?.shader?.uniforms?.uClipPlane) {
        mat.userData.shader.uniforms.uClipPlane.value.w = rigState.machiningPlaneConstant
      }
    })

    rigState.cameraWorldPos = [
      Number(camera.position.x.toFixed(3)),
      Number(camera.position.y.toFixed(3)),
      Number(camera.position.z.toFixed(3)),
    ]
    rigState.targetWorldPos = [
      Number(tempTargetPos.x.toFixed(3)),
      Number(tempTargetPos.y.toFixed(3)),
      Number(tempTargetPos.z.toFixed(3)),
    ]
    window.__WEBGL_TELEMETRY__ = { ...rigState }
  })

  return (
    <group>
      <PerspectiveCamera 1.8, 6.2]} far="{150}" fov="{40}" makeDefault near="{0.05}" position="{[0,"/>
      <primitive object={scene} />

      <CameraSplineStudio onScrubChange="{(progress,"> {
          rigState.splineProgress = progress
          rigState.cameraFov = evalState.fov
          rigState.timeScale = evalState.timeScale
          rigState.housingOpacity = evalState.housingOpacity
          rigState.explodeAmount = evalState.explodeAmount
          rigState.machiningPlaneConstant = evalState.machiningConstant
        }}
      />

      <Billboard 0.2]} 0.85, position="{[-0.2,">
        <Text anchorX="left" anchorY="middle" color="#00f0ff" fillOpacity="{rigState.hudOpacity}" fontSize="{0.065}" outlineColor="#000000" outlineOpacity="{rigState.hudOpacity}" outlineWidth="{0.004}">
          {`ISO-TOLERANCE: ±0.02mm\nSUB-ASSEMBLY ISOLATED`}
        </Text>
      </Billboard>

      <EffectComposer disableNormalPass multisampling="{4}">
        <DepthOfField bokehScale="{3.5}" focalLength="{0.04}" height="{480}" ref="{dofRef}"/>
        <Bloom intensity="{0.85}" luminanceSmoothing="{0.2}" luminanceThreshold="{1.1}" mipmapBlur/>
      </EffectComposer>
    </group>
  )
}
```

---

## File 5: `tests/e2e/dump-glb-manifests.spec.ts` (Playwright Manifest Dumper & Telemetry Verification)

### BEFORE
```ts
// No automated GLB manifest extraction or WebGL telemetry assertion
```

### AFTER
```ts
// tests/e2e/dump-glb-manifests.spec.ts
import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

test('extracts GLB sub-assembly manifests and verifies WebGL telemetry', async ({ page }) => {
  await page.goto('/?debug=rig')

  await page.waitForFunction(
    () =>
      window.__WEBGL_TELEMETRY__ !== undefined &&
      window.__GLB_MANIFESTS__ !== undefined &&
      Object.keys(window.__GLB_MANIFESTS__).length > 0,
    { timeout: 15000 }
  )

  const manifests = await page.evaluate(() => window.__GLB_MANIFESTS__!)
  const telemetry = await page.evaluate(() => window.__WEBGL_TELEMETRY__!)

  expect(telemetry.cameraFov).toBeGreaterThan(10)

  const outDir = path.resolve(process.cwd(), 'src/data')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, 'glb-manifests.json'),
    JSON.stringify(manifests, null, 2),
    'utf-8'
  )
})
```