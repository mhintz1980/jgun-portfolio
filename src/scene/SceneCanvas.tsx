import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { PMREMGenerator, PointLight } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { CameraRig } from './CameraRig'
import { SpatialRig } from './SpatialRig'
import { SpatialWorld } from './SpatialWorld'
import { TorqueWrenchHero } from './TorqueWrenchHero'
import { degradeQuality, forcePoster } from '../state/qualityStore'
import { LCD_REVEAL_WINDOW } from '../data/caseStudies'
import { getScrollState } from '../state/scrollStore'

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
    return () => {
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
        camera={{ fov: 42, near: 0.005, far: 20, position: [0.32, 0.16, 0.42] }}
        onCreated={({ gl }) => {
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
          <fog attach="fog" args={['#05070a', 1.4, 4.5]} />

          {/* Studio balance for the photoreal PBR pass (2026-08-24): the
              environment carries the softbox reflections the clearcoat
              shells need, so the punctual key steps back from blowing out
              gloss highlights. */}
          <ambientLight intensity={0.25} />
          <directionalLight position={[1.5, 2, 1]} intensity={1.7} />
          <directionalLight position={[-2, 1, -1.5]} intensity={0.6} color="#7dd3fc" />
          <spotLight position={[0, 1.2, -0.6]} intensity={1.1} angle={0.5} penumbra={1} />

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
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
