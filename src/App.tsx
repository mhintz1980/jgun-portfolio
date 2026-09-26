import { Suspense, lazy } from 'react'
import { Chapters } from './components/Chapters'
import { IntroTitles } from './components/IntroTitles'
import { ToleranceStations } from './components/ToleranceStations'
import { StaticPoster } from './components/StaticPoster'
import { TechnicalHUD } from './components/TechnicalHUD'
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
const QuietMachinePreview = lazy(() => import('./scene/rl300/QuietMachinePreview'))

export default function App() {
  const { tier, reducedMotion } = useQuality()

  // JG-033 owner review checkpoint; portfolio timing stays on its existing clock.
  if (new URLSearchParams(window.location.search).get('study') === 'rl300') {
    return <Suspense fallback={null}><QuietMachinePreview /></Suspense>
  }

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

      {/* JG-035 opening titles over the drafting-table intro (scroll-scrubbed) */}
      {motionActive && <IntroTitles />}
      {/* JG-035 tolerance stations S1–S6 (one at a time, driven by the in-canvas StationDriver) */}
      {motionActive && <ToleranceStations />}

      {/* Telemetry overlay (DOM; hides its canvas-bound readouts per tier) */}
      {canvasActive && <TechnicalHUD />}

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
