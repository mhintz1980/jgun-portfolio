import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ProductStage } from '../../components/canvas/ProductStage'
import { useLenisGsapBridge } from '../../utils/lenisGsapBridge'
import { resolveRigModel } from './rigRequest'

/**
 * Standalone host for the cinematic camera rig. Reached only through `isCinematicRigRequested`,
 * so the portfolio and torque-wrench routes never mount it.
 */
export default function CinematicRigRoute() {
  useLenisGsapBridge()
  const modelPath = resolveRigModel(window.location.search)

  return (
    <div id="cinematic-scroll-container" style={{ position: 'relative', width: '100%', height: '100vh', background: '#05070a' }}>
      <Canvas gl={{ antialias: false, powerPreference: 'high-performance' }} dpr={[1, 1.5]}>
        <color attach="background" args={['#05070a']} />
        <Suspense fallback={null}>
          <ProductStage modelPath={modelPath} />
        </Suspense>
      </Canvas>
    </div>
  )
}
