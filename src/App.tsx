import { Suspense, lazy } from 'react'
import { Chapters } from './components/Chapters'
import { IntroTitles } from './components/IntroTitles'
import { ToleranceStations } from './components/ToleranceStations'
import { StaticPoster } from './components/StaticPoster'
import { StationNav } from './components/StationNav'
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
const RingInspection = lazy(() => import('./components/RingInspection').then(m => ({ default: m.RingInspection })))

export default function App() {
  const { tier, reducedMotion } = useQuality()

  // JG-033 owner review checkpoint; portfolio timing stays on its existing clock.
  // Owner decision 2026-10-06 ("posters throughout"): reduced-motion visitors
  // always get the static poster path, so the study query must not bypass it.
  if (!reducedMotion && new URLSearchParams(window.location.search).get('study') === 'rl300') {
    return <Suspense fallback={null}><QuietMachinePreview /></Suspense>
  }

  // Degradation wiring (see qualityStore for the tier ladder):
  //  - poster tier OR reduced motion: no canvas at all — static DOM poster +
  //    native scroll. The lazy canvas chunk is never imported, so nothing
  //    three- or CAD-bound downloads.
  //  - every other visitor: canvas + Lenis/GSAP ScrollTrigger as before.
  //  - Chapters (Module 4 content) renders as real DOM in every tier.
  const canvasActive = tier !== 'poster' && !reducedMotion

  return (
    <>
      {/* Fixed stage behind everything: WebGL when we can, poster when we can't */}
      {canvasActive ? (
        <Suspense fallback={null}>
          <SceneCanvas />
        </Suspense>
      ) : (
        <StaticPoster reason={reducedMotion ? 'reduced-motion' : 'poster-tier'} />
      )}

      {/* Lenis + ScrollTrigger orchestration (renders nothing; must mount after
          the chapter sections exist in the DOM — effects run post-commit) */}
      {canvasActive && (
        <Suspense fallback={null}>
          <ScrollRig />
        </Suspense>
      )}

      {/* JG-035 opening titles over the drafting-table intro (scroll-scrubbed) */}
      {canvasActive && <IntroTitles />}
      {/* JG-035 tolerance stations S1–S6 (one at a time, driven by the in-canvas StationDriver) */}
      {canvasActive && <ToleranceStations />}

      {/* Telemetry overlay (DOM; hides its canvas-bound readouts per tier) */}
      {canvasActive && <TechnicalHUD />}

      {/* No canvas (poster tier or reduced motion) means no HUD chrome at all — keep station navigation alive
          with a minimal DOM-only nav (no camera/material readouts, no canvas
          dependency; navigateToStation falls back to native scrollTo). */}
      {!canvasActive && <StationNav />}

      {/* GLB stream-in boot readout (no canvas: nothing streams, no boot) */}
      {canvasActive && (
        <Suspense fallback={null}>
          <BootSequence />
        </Suspense>
      )}

      {/* Scrollable narrative — always plain DOM, never canvas-gated */}
      <main>
        <Chapters />
      </main>
      <Suspense fallback={null}><RingInspection /></Suspense>
    </>
  )
}
