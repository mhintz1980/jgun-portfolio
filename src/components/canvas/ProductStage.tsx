import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Environment, Lightformer, PerspectiveCamera, Text, useGLTF } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing'
import type { DepthOfFieldEffect } from 'postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGLBSceneAuditor } from '../../utils/glbSceneAuditor'
import type { GLBStageFit } from '../../utils/glbSceneAuditor'
import { CameraSplineStudio, DEFAULT_SHOT_KEYFRAMES, isDebugRigRequested } from './CameraSplineStudio'
import type { InterpolatedShot } from './CameraSplineStudio'

gsap.registerPlugin(ScrollTrigger)

type Vec3 = [number, number, number]

export type ShotId = 'establishing' | 'bullet-time-orbit' | 'assembly-isolation' | 'machining-macro'

export type StageModelPath = '/models/msp-enclosure.glb' | '/models/m249-transformed.glb'

export interface WebGLTelemetryState {
  splineProgress: number
  timeScale: number
  simTime: number
  housingOpacity: number
  explodeAmount: number
  machiningPlaneConstant: number
  hudOpacity: number
  cameraFov: number
  cameraWorldPos: Vec3
  targetWorldPos: Vec3
  activeShot: ShotId
  /** Mirrors the last `depthWrite` written to the housing materials (the isolation guard). */
  housingDepthWrite: boolean
  housingMeshCount: number
  movingPartCount: number
  explodableMeshCount: number
  modelPath: StageModelPath | null
  /** Rendered frames since mount; lets verifiers wait for N frames instead of wall-clock time. */
  frameCount: number
}

declare global {
  interface Window {
    __WEBGL_TELEMETRY__?: WebGLTelemetryState
  }
}

const INITIAL_RIG_STATE: WebGLTelemetryState = {
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
  housingDepthWrite: true,
  housingMeshCount: 0,
  movingPartCount: 0,
  explodableMeshCount: 0,
  modelPath: null,
  frameCount: 0,
}

/**
 * Module-scoped rig state. GSAP tweens it, `useFrame` reads it; never mirrored into React state
 * so a scroll scrub does not re-render the tree.
 */
export const rigState: WebGLTelemetryState = {
  ...INITIAL_RIG_STATE,
  cameraWorldPos: [...INITIAL_RIG_STATE.cameraWorldPos],
  targetWorldPos: [...INITIAL_RIG_STATE.targetWorldPos],
}

export function resetRigState(): void {
  Object.assign(rigState, INITIAL_RIG_STATE, {
    cameraWorldPos: [...INITIAL_RIG_STATE.cameraWorldPos],
    targetWorldPos: [...INITIAL_RIG_STATE.targetWorldPos],
  })
}

const SHOT_IDS: readonly ShotId[] = ['establishing', 'bullet-time-orbit', 'assembly-isolation', 'machining-macro']

/** Longest model side after fitting, and the height the assembly centre sits at (spline units). */
const STAGE_SIZE = 2.4
const STAGE_CENTER_Y = 0.6
const LAST_SHOT = DEFAULT_SHOT_KEYFRAMES.length - 1
const MACHINING_NORMAL = new THREE.Vector3(-1, -0.2, 0).normalize()

/**
 * Scales and recentres the cached GLTF root so every model lives in the coordinate space the
 * default keyframes were authored in. Idempotent (StrictMode, remount); the GLB itself is never
 * rewritten, so the protected assets stay untouched.
 */
function fitSceneToStage(scene: THREE.Object3D): GLBStageFit {
  const cached = scene.userData.stageFit as GLBStageFit | undefined
  if (cached) return cached

  scene.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  const scale = STAGE_SIZE / Math.max(size.x, size.y, size.z, 1e-6)

  scene.scale.multiplyScalar(scale)
  scene.updateWorldMatrix(true, true)
  const fitted = new THREE.Box3().setFromObject(scene)
  const center = fitted.getCenter(new THREE.Vector3())
  scene.position.x -= center.x
  scene.position.y += STAGE_CENTER_Y - center.y
  scene.position.z -= center.z
  scene.updateWorldMatrix(true, true)

  const fit: GLBStageFit = {
    scale: Number(scale.toPrecision(6)),
    offset: [scene.position.x, scene.position.y, scene.position.z].map((v) => Number(v.toFixed(4))) as Vec3,
    sourceSize: [size.x, size.y, size.z].map((v) => Number(v.toFixed(4))) as Vec3,
  }
  scene.userData.stageFit = fit
  return fit
}

function ancestorNameMatches(object: THREE.Object3D, root: THREE.Object3D, pattern: RegExp): boolean {
  let current: THREE.Object3D | null = object
  while (current && current !== root) {
    if (pattern.test(current.name)) return true
    current = current.parent
  }
  return false
}

const MATCH_NOTHING = /$^/

/**
 * Node-name rules per protected GLB, taken from the audited manifests (src/data/glb-manifests.json).
 * msp-enclosure: the outer shell is the two roots ENCLOSURE_CHASSIS and COMPOSITE_PANELS; the other
 * roots (pump, baffles, ducts) are the internals the fade must reveal. It has no node that is
 * unambiguously a rotor, so nothing spins until one is chosen. m249-transformed is one merged mesh
 * (`Object_4`, one material), so there is no housing to fade and nothing to separate.
 */
const MODEL_NODE_RULES: Record<StageModelPath, { housing: RegExp; moving: RegExp }> = {
  '/models/msp-enclosure.glb': { housing: /^(ENCLOSURE_CHASSIS|COMPOSITE_PANELS)$/, moving: MATCH_NOTHING },
  '/models/m249-transformed.glb': { housing: MATCH_NOTHING, moving: MATCH_NOTHING },
}

interface ProductStageProps {
  modelPath: StageModelPath
  /** Overrides the per-model housing rule; matched against the mesh name and every ancestor name. */
  housingNodeMatch?: RegExp
  /** Overrides the per-model rule for nodes that spin on the simulation clock. */
  movingPartNodeMatch?: RegExp
}

interface HudTextMesh extends THREE.Mesh {
  fillOpacity: number
  outlineOpacity: number
}

export function ProductStage({
  modelPath,
  housingNodeMatch = MODEL_NODE_RULES[modelPath].housing,
  movingPartNodeMatch = MODEL_NODE_RULES[modelPath].moving,
}: ProductStageProps) {
  const { camera, gl } = useThree()
  const { scene } = useGLTF(modelPath, '/draco/')

  const stageFit = useMemo(() => fitSceneToStage(scene), [scene])
  useGLBSceneAuditor(scene, modelPath, stageFit)

  const movingPartsRef = useRef<{ object: THREE.Object3D; baseRotationZ: number }[]>([])
  const housingMaterialsRef = useRef<THREE.Material[]>([])
  const explodableMeshesRef = useRef<THREE.Mesh[]>([])
  const dofRef = useRef<DepthOfFieldEffect | null>(null)
  const hudTextRef = useRef<HudTextMesh | null>(null)

  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  const { cameraSpline, targetSpline, machiningPlane, clipUniform, tempCamPos, tempTargetPos } = useMemo(
    () => ({
      cameraSpline: new THREE.CatmullRomCurve3(
        DEFAULT_SHOT_KEYFRAMES.map((k) => new THREE.Vector3(...k.camPos)),
        false,
        'centripetal',
        0.5,
      ),
      targetSpline: new THREE.CatmullRomCurve3(
        DEFAULT_SHOT_KEYFRAMES.map((k) => new THREE.Vector3(...k.targetPos)),
        false,
        'centripetal',
        0.5,
      ),
      machiningPlane: new THREE.Plane(MACHINING_NORMAL.clone(), INITIAL_RIG_STATE.machiningPlaneConstant),
      // One uniform shared by every cloned material: updated once per frame instead of per mesh.
      clipUniform: { value: new THREE.Vector4(MACHINING_NORMAL.x, MACHINING_NORMAL.y, MACHINING_NORMAL.z, 0) },
      tempCamPos: new THREE.Vector3(),
      tempTargetPos: new THREE.Vector3(),
    }),
    [],
  )

  // Per-mesh material clones: housing fades and the machining cut must not bleed through shared
  // GLB material references. Originals are restored on cleanup.
  useEffect(() => {
    const movingParts: { object: THREE.Object3D; baseRotationZ: number }[] = []
    const housingMaterials: THREE.Material[] = []
    const explodableMeshes: THREE.Mesh[] = []
    const originals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    const clones: THREE.Material[] = []

    const cloneForStage = (source: THREE.Material, isHousing: boolean): THREE.Material => {
      const clone = source.clone()
      clone.clippingPlanes = [machiningPlane]
      clone.clipShadows = true

      clone.onBeforeCompile = (shader) => {
        shader.uniforms.uClipPlane = clipUniform
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>\nvarying vec3 vWorldPosition;`)
          .replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>\nvWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
          )
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\nvarying vec3 vWorldPosition;\nuniform vec4 uClipPlane;`)
          .replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
             float distToCut = abs(dot(vWorldPosition, uClipPlane.xyz) + uClipPlane.w);
             float kerfGlow = 1.0 - smoothstep(0.0, 0.025, distToCut);
             gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.42, 0.05) * 2.5, kerfGlow);`,
          )
      }

      if (isHousing) {
        clone.transparent = true
        housingMaterials.push(clone)
      }
      clones.push(clone)
      return clone
    }

    scene.traverse((child) => {
      if (movingPartNodeMatch.test(child.name)) {
        movingParts.push({ object: child, baseRotationZ: child.rotation.z })
      }

      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      explodableMeshes.push(mesh)

      const isHousing = ancestorNameMatches(mesh, scene, housingNodeMatch)
      originals.set(mesh, mesh.material)
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => cloneForStage(m, isHousing))
        : cloneForStage(mesh.material, isHousing)
    })

    movingPartsRef.current = movingParts
    housingMaterialsRef.current = housingMaterials
    explodableMeshesRef.current = explodableMeshes
    rigState.modelPath = modelPath
    rigState.housingMeshCount = housingMaterials.length
    rigState.movingPartCount = movingParts.length
    rigState.explodableMeshCount = explodableMeshes.length

    return () => {
      for (const [mesh, material] of originals) mesh.material = material
      for (const clone of clones) clone.dispose()
      for (const mesh of explodableMeshes) {
        const base = mesh.userData.basePosition as THREE.Vector3 | undefined
        if (base) mesh.position.copy(base)
      }
      for (const { object, baseRotationZ } of movingParts) object.rotation.z = baseRotationZ
      movingPartsRef.current = []
      housingMaterialsRef.current = []
      explodableMeshesRef.current = []
    }
  }, [scene, modelPath, housingNodeMatch, movingPartNodeMatch, machiningPlane, clipUniform])

  // Scroll-driven shot timeline. Skipped under ?debug=rig, where the studio scrubber owns rigState.
  // The spline is parameterised per keyframe, so 1/3 and 2/3 land exactly on shots 2 and 3.
  useEffect(() => {
    if (isDebugRigRequested()) return

    resetRigState()
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
        { splineProgress: 1 / 3, timeScale: 0.03, explodeAmount: 0.15, cameraFov: 32, duration: 2, ease: 'power2.inOut' },
        0,
      )
      tl.to(
        rigState,
        { splineProgress: 2 / 3, housingOpacity: 0.08, explodeAmount: 0.35, hudOpacity: 1.0, duration: 2, ease: 'none' },
        2,
      )
      tl.to(
        rigState,
        {
          splineProgress: 1.0,
          timeScale: 1.0,
          explodeAmount: 0.0,
          machiningPlaneConstant: -0.25,
          cameraFov: 22,
          duration: 2,
          ease: 'power3.out',
        },
        4,
      )
    })

    return () => ctx.revert()
  }, [])

  useFrame((_, delta) => {
    const debugRig = isDebugRigRequested()

    const t = THREE.MathUtils.clamp(rigState.splineProgress, 0, 1)
    cameraSpline.getPoint(t, tempCamPos)
    targetSpline.getPoint(t, tempTargetPos)

    if (!debugRig) {
      camera.position.copy(tempCamPos)
      camera.lookAt(tempTargetPos)

      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - rigState.cameraFov) > 0.01) {
        camera.fov = rigState.cameraFov
        camera.updateProjectionMatrix()
      }
    } else {
      // The studio drives the camera from its own authored keyframes; mirror its target for DOF.
      tempTargetPos.set(...rigState.targetWorldPos)
    }

    rigState.activeShot = SHOT_IDS[THREE.MathUtils.clamp(Math.round(t * LAST_SHOT), 0, LAST_SHOT)]

    if (dofRef.current?.target) dofRef.current.target.copy(tempTargetPos)

    rigState.simTime += Math.min(delta, 0.1) * rigState.timeScale
    rigState.frameCount++

    for (const part of movingPartsRef.current) {
      part.object.rotation.z = part.baseRotationZ + rigState.simTime * 8.0
    }

    // Isolation fade: transparent surfaces stop writing depth below 0.95 opacity, otherwise the
    // housing z-sorts against the internals it is meant to reveal.
    const housingDepthWrite = rigState.housingOpacity > 0.95
    for (const material of housingMaterialsRef.current) {
      material.opacity = rigState.housingOpacity
      material.depthWrite = housingDepthWrite
    }
    rigState.housingDepthWrite = housingDepthWrite

    for (const mesh of explodableMeshesRef.current) {
      const basePos = mesh.userData.basePosition as THREE.Vector3 | undefined
      const dir = mesh.userData.explodeDirectionLocal as THREE.Vector3 | undefined
      if (basePos && dir) mesh.position.copy(basePos).addScaledVector(dir, rigState.explodeAmount)
    }

    machiningPlane.constant = rigState.machiningPlaneConstant
    clipUniform.value.w = rigState.machiningPlaneConstant

    if (hudTextRef.current) {
      hudTextRef.current.fillOpacity = rigState.hudOpacity
      hudTextRef.current.outlineOpacity = rigState.hudOpacity
      hudTextRef.current.visible = rigState.hudOpacity > 0.01
    }

    rigState.cameraWorldPos[0] = Number(camera.position.x.toFixed(3))
    rigState.cameraWorldPos[1] = Number(camera.position.y.toFixed(3))
    rigState.cameraWorldPos[2] = Number(camera.position.z.toFixed(3))
    rigState.targetWorldPos[0] = Number(tempTargetPos.x.toFixed(3))
    rigState.targetWorldPos[1] = Number(tempTargetPos.y.toFixed(3))
    rigState.targetWorldPos[2] = Number(tempTargetPos.z.toFixed(3))
    window.__WEBGL_TELEMETRY__ = rigState
  })

  const handleScrubChange = (progress: number, shot: InterpolatedShot) => {
    rigState.splineProgress = progress
    rigState.cameraFov = shot.fov
    rigState.timeScale = shot.timeScale
    rigState.housingOpacity = shot.housingOpacity
    rigState.explodeAmount = shot.explodeAmount
    rigState.machiningPlaneConstant = shot.machiningConstant
    rigState.targetWorldPos[0] = shot.targetPos[0]
    rigState.targetWorldPos[1] = shot.targetPos[1]
    rigState.targetWorldPos[2] = shot.targetPos[2]
  }

  return (
    <group>
      <PerspectiveCamera makeDefault position={[0, 1.8, 6.2]} fov={40} near={0.05} far={150} />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} position={[0, 5, 2]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={2} position={[-5, 2, -2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={2} position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <directionalLight position={[3, 5, 4]} intensity={1.2} />

      <primitive object={scene} />

      <CameraSplineStudio onScrubChange={handleScrubChange} />

      <Billboard position={[-0.2, 0.85, 0.2]}>
        <Text
          ref={hudTextRef}
          anchorX="left"
          anchorY="middle"
          color="#00f0ff"
          fontSize={0.065}
          fillOpacity={0}
          outlineColor="#000000"
          outlineOpacity={0}
          outlineWidth={0.004}
        >
          {`ISO-TOLERANCE: ±0.02mm\nSUB-ASSEMBLY ISOLATED`}
        </Text>
      </Billboard>

      <EffectComposer enableNormalPass={false} multisampling={4}>
        {/* focusRange is in world units (the old `focalLength` is a deprecated alias): 0.04 left the subject blurred. */}
        <DepthOfField ref={dofRef} target={[0, 0.6, 0]} bokehScale={3.5} focusRange={2.5} height={480} />
        <Bloom intensity={0.85} luminanceThreshold={1.1} luminanceSmoothing={0.2} mipmapBlur />
      </EffectComposer>
    </group>
  )
}
