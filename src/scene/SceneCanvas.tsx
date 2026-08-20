import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { TorqueWrenchHero } from './TorqueWrenchHero'

/** Adaptive DPR clamp — never above 2, never above the device's own ratio. */
const MAX_DPR = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1)

/**
 * Module 1 — core scene canvas.
 *
 * Performance safeguards:
 *  - DPR starts at min(2, devicePixelRatio) and steps down 0.25 at a time when
 *    PerformanceMonitor sees sustained frame rates below 45 FPS (bounds lower
 *    edge), stepping back up when there is headroom.
 *  - onFallback pins DPR to 1 after repeated flip-flops (thrash guard).
 *  - Frustum culling stays enabled on every mesh (asserted in buildWrenchRig).
 */
export function SceneCanvas() {
  const [dpr, setDpr] = useState<number>(MAX_DPR)

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.005, far: 20, position: [0.32, 0.16, 0.42] }}
      >
        <PerformanceMonitor
          bounds={() => [45, 60] as [number, number]}
          flipflops={3}
          onDecline={() => setDpr((value) => Math.max(0.75, value - 0.25))}
          onIncline={() => setDpr((value) => Math.min(MAX_DPR, value + 0.25))}
          onFallback={() => setDpr(1)}
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
