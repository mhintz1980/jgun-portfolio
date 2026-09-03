import { Suspense, lazy } from 'react'
import { Chapters } from './components/Chapters'
import { StaticPoster } from './components/StaticPoster'
import { TechnicalHUD } from './components/TechnicalHUD'
import { EngineeringDrawingOverlay } from './components/EngineeringDrawingOverlay'
import { useQuality } from './state/qualityStore'

// The canvas world (three/R3F/drei/GSAP/Lenis + the dissolve shader) is code-
// split out of the entry chunk: the DOM narrative, HUD chrome and poster paint
// immediately from a small bundle, and the heavy modules stream in behind
// Suspense. Poster tier never fetches them at all.
const SceneCanvas = lazy(() =>
  import('./scene/SceneCanvas').then((m) => ({ default: m.SceneCanvas })),
)
const ScrollRig = lazy(() => import('./scene/ScrollRig').then((m) => ({ default: m.ScrollRig })))
const BootSequence = lazy(() =>
  import('./components/BootSequence').then((m) => ({ default: m.BootSequence })),
)

export default function App() {
  const { tier, reducedMotion } = useQuality()

  // Degradation wiring (see qualityStore for the tier ladder):
  //  - poster tier: no canvas at all — static DOM poster + native scroll.
  //  - reduced motion: canvas may render (static hero pose) but Lenis/GSAP
  //    ScrollTrigger never mount; the page scrolls natively.
  //  - Chapters (Module 4 content) renders as real DOM in every tier.
  const canvasActive = tier !== 'poster'
  const motionActive = canvasActive && !reducedMotion

  return (
    <>
      {/* Fixed stage behind everything: WebGL when we can, poster when we can't */}
      {canvasActive ? (
        <Suspense fallback={null}>
          <SceneCanvas />
        </Suspense>
      ) : (
        <StaticPoster />
      )}

      {/* Lenis + ScrollTrigger orchestration (renders nothing; must mount after
          the chapter sections exist in the DOM — effects run post-commit) */}
      {motionActive && (
        <Suspense fallback={null}>
          <ScrollRig />
        </Suspense>
      )}

      {/* Telemetry overlay (DOM; hides its canvas-bound readouts per tier) */}
      {canvasActive && <TechnicalHUD />}
      {canvasActive && <EngineeringDrawingOverlay />}

      {/* GLB stream-in boot readout (poster tier: nothing streams, no boot) */}
      {canvasActive && (
        <Suspense fallback={null}>
          <BootSequence />
        </Suspense>
      )}

      {/* Scrollable narrative — always plain DOM, never canvas-gated */}
      <main>
        <Chapters />
      </main>
    </>
  )
}
