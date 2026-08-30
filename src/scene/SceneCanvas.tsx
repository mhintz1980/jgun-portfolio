import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { DirectionalLight, PMREMGenerator, PointLight, SpotLight } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CameraRig } from './CameraRig'
import { SpatialRig } from './SpatialRig'
import { SpatialWorld } from './SpatialWorld'
import { TorqueWrenchHero } from './TorqueWrenchHero'
import { PostProcessingComposer } from './PostProcessingComposer'
import { degradeQuality, forcePoster } from '../state/qualityStore'
import { LCD_REVEAL_WINDOW } from '../data/caseStudies'
import { getScrollState } from '../state/scrollStore'
import { STAGE_TRANSITIONS } from './stages/stageWindows'

/** Adaptive DPR clamp — never above 2, never above the device's own ratio. */
const MAX_DPR = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)

/**
 * Explicit DPR staircase (2 → 1.5 → 1.25 → 1), clamped to the device ratio.
 * When the staircase is exhausted and frames still drop, we escalate to the
 * next quality tier instead (lite: dissolve shader off; poster: no canvas).
 */
const DPR_STEPS = [MAX_DPR, 1.5, 1.25, 1].filter(
  (value, index, all) => value <= MAX_DPR && all.indexOf(value) === index,
)

/**
 * Procedural IBL for the PBR assembly: PMREM-bakes three's bundled
 * RoomEnvironment (procedural geometry — no external HDR fetch) into
 * scene.environment. The GLB's metallic MeshStandardMaterials read near-black
 * under punctual lights alone; the envmap gives machined surfaces something to
 * reflect. Environment only — background/fog and the light rig stay untouched,
 * and the intensity keeps the punctual key/fill in charge so the look stays
 * restrained rather than showroom-bright.
 */
function RoomEnvironmentIbl() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    scene.environment = target.texture
    scene.environmentIntensity = 1.0
    ;(window as any).__threeScene = scene
    return () => {
      ;(window as any).__threeScene = null
      scene.environment = null
      target.dispose()
      pmrem.dispose()
      room.dispose()
    }
  }, [gl, scene])

  return null
}

/**
 * CR-5 — Warm fill light behind the handle LCD face.
 * Activates only during the shared post-explode rear-LCD reveal window so the
 * dwell has stable warm reflections without lighting the pre-explode ghost beat.
 */
function LcdFillLight() {
  const lightRef = useRef<PointLight>(null)

  useFrame(() => {
    if (!lightRef.current) return
    const { progress } = getScrollState()
    // Ease over 0.02 of scroll (~40vh) — the pre-repair 0.004 ramp was ~3 frames.
    const fadeIn = Math.min(Math.max((progress - LCD_REVEAL_WINDOW.start) / 0.02, 0), 1)
    const fadeOut = Math.min(Math.max((LCD_REVEAL_WINDOW.end - progress) / 0.02, 0), 1)
    const w = Math.min(fadeIn, fadeOut)
    lightRef.current.intensity = w * 2.8
  })

  return (
    <pointLight
      ref={lightRef}
      // Behind/above the rear cap at the measured dwell: the exploded LCD
      // cluster sits at world [−0.14, 0, 0.46] (see LCD_ORBIT_KEYFRAMES notes).
      position={[-0.24, 0.08, 0.56]}
      color="#ffe8c0"
      intensity={0}
      distance={0.35}
      decay={2}
    />
  )
}

/**
 * Global studio key/fill/spot — the balance tuned for the JGun hero's
 * photoreal PBR pass (CH.01/02). JG-021 materials round 3: the MSP
 * enclosure's retained CAD palette is bright and clips deep under this
 * studio (blown-hot 14-19% of the St.2 subject region). Live-perturbation
 * attribution pinned the driver on the RoomEnvironment IBL — not the
 * punctual rig and not material.envMapIntensity, which does not modulate
 * scene.environment in this three version (env 1.0→0: region hot
 * 56,399→464; env 0.5 under this rig: 0.13% blown, avgL 54.9). So BOTH
 * the punctual rig and scene.environmentIntensity ease to floors while
 * Station 2 owns the frame, riding the SAME STAGE_TRANSITIONS windows as
 * the station swap so the choreography masks the crossfade. Station 3
 * keeps the full studio — its committed look passed owner review.
 */
const STUDIO_KEY_INTENSITY = 1.7
const STUDIO_FILL_INTENSITY = 0.6
const STUDIO_SPOT_INTENSITY = 1.1
/** Punctual + environment floors while the MSP enclosure is up. */
const STUDIO_STATION2_SCALE = 0.25
const STUDIO_ENV_STATION2 = 0.5

const smoothstep01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x))
  return c * c * (3 - 2 * c)
}

function StudioRig() {
  const keyRef = useRef<DirectionalLight>(null)
  const fillRef = useRef<DirectionalLight>(null)
  const spotRef = useRef<SpotLight>(null)
  const scene = useThree((state) => state.scene)

  useFrame(() => {
    const { progress } = getScrollState()
    // wrenchOut [0.525, 0.565] is when the hero sinks and the enclosure
    // rises; enclosureOut [0.72, 0.76] is when the enclosure exits.
    const down = smoothstep01((progress - STAGE_TRANSITIONS.wrenchOut[0]) / (STAGE_TRANSITIONS.wrenchOut[1] - STAGE_TRANSITIONS.wrenchOut[0]))
    const up = smoothstep01((progress - STAGE_TRANSITIONS.enclosureOut[0]) / (STAGE_TRANSITIONS.enclosureOut[1] - STAGE_TRANSITIONS.enclosureOut[0]))
    const k = 1 - (1 - STUDIO_STATION2_SCALE) * down * (1 - up)
    if (keyRef.current) keyRef.current.intensity = STUDIO_KEY_INTENSITY * k
    if (fillRef.current) fillRef.current.intensity = STUDIO_FILL_INTENSITY * k
    if (spotRef.current) spotRef.current.intensity = STUDIO_SPOT_INTENSITY * k
    scene.environmentIntensity = 1 - (1 - STUDIO_ENV_STATION2) * down * (1 - up)
  })

  return (
    <>
      <directionalLight ref={keyRef} position={[1.5, 2, 1]} intensity={STUDIO_KEY_INTENSITY} />
      <directionalLight ref={fillRef} position={[-2, 1, -1.5]} intensity={STUDIO_FILL_INTENSITY} color="#7dd3fc" />
      <spotLight ref={spotRef} position={[0, 1.2, -0.6]} intensity={STUDIO_SPOT_INTENSITY} angle={0.5} penumbra={1} />
    </>
  )
}

/**
 * Module 1 — core scene canvas.
 *
 * Performance safeguards:
 *  - DPR walks the staircase down while PerformanceMonitor sees sustained
 *    frame rates below 45 FPS (bounds lower edge), stepping back up when
 *    there is headroom. Tier escalation is one-way; only DPR recovers.
 *  - At DPR 1 and still declining: degradeQuality() — first drop kills the
 *    Module 3 dissolve shader (lite), second unmounts the canvas (poster).
 *  - onFallback pins DPR to 1 after repeated flip-flops (thrash guard).
 *  - WebGL context loss bails straight to the static poster.
 *  - Frustum culling stays enabled on every mesh (asserted in buildWrenchRig).
 */
export function SceneCanvas() {
  const [step, setStep] = useState(0)
  const stepRef = useRef(0)

  const setDprStep = (next: number): void => {
    stepRef.current = next
    setStep(next)
  }

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={DPR_STEPS[step]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.005, far: 150, position: [0.32, 0.16, 0.42] }}
        onCreated={({ gl, camera }) => {
          // Camera probe surface for subject-bbox NDC verification (JG-021
          // remediation): CameraRig mutates this same default camera each
          // frame, so the reference stays live for the page's lifetime.
          ;(window as any).__threeCamera = camera
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            forcePoster()
          })
        }}
      >
        <PerformanceMonitor
          bounds={() => [45, 60] as [number, number]}
          flipflops={3}
          onDecline={() => {
            if (stepRef.current < DPR_STEPS.length - 1) setDprStep(stepRef.current + 1)
            else degradeQuality()
          }}
          onIncline={() => {
            if (stepRef.current > 0) setDprStep(stepRef.current - 1)
          }}
          onFallback={() => setDprStep(DPR_STEPS.length - 1)}
        >
          <color attach="background" args={['#05070a']} />
          <fog attach="fog" args={['#05070a', 25, 120]} />

          {/* Studio balance for the photoreal PBR pass (2026-08-24): the
              environment carries the softbox reflections the clearcoat
              shells need, so the punctual key steps back from blowing out
              gloss highlights. StudioRig crossfades this balance per
              station (see StudioRig notes). */}
          <ambientLight intensity={0.25} />
          <StudioRig />

          <RoomEnvironmentIbl />

          <Suspense fallback={null}>
            <SpatialWorld>
              <TorqueWrenchHero />
            </SpatialWorld>
            <LcdFillLight />
            <ContactShadows position={[0, -0.16, 0]} opacity={0.4} scale={1.2} blur={2.4} far={0.4} />
          </Suspense>

          <CameraRig />
          <SpatialRig />
          {/* JG-017 — restrained post-processing FX (transition chromatic aberration + bloom).
              Returns null for poster and reduced-motion tiers; safe to always mount. */}
          <PostProcessingComposer />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
