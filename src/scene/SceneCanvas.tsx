import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { TorqueWrenchHero } from './TorqueWrenchHero'
import { degradeQuality, forcePoster } from '../state/qualityStore'

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

          <ambientLight intensity={0.35} />
          <directionalLight position={[1.5, 2, 1]} intensity={2.2} />
          <directionalLight position={[-2, 1, -1.5]} intensity={0.6} color="#7dd3fc" />
          <spotLight position={[0, 1.2, -0.6]} intensity={1.4} angle={0.5} penumbra={1} />

          <Suspense fallback={null}>
            <TorqueWrenchHero />
            <ContactShadows position={[0, -0.16, 0]} opacity={0.4} scale={1.2} blur={2.4} far={0.4} />
          </Suspense>

          <CameraRig />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
