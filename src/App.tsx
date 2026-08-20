import { SceneCanvas } from './scene/SceneCanvas'
import { ScrollRig } from './scene/ScrollRig'
import { Chapters } from './components/Chapters'
import { StaticPoster } from './components/StaticPoster'
import { TechnicalHUD } from './components/TechnicalHUD'
import { useQuality } from './state/qualityStore'

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
      {canvasActive ? <SceneCanvas /> : <StaticPoster />}

      {/* Lenis + ScrollTrigger orchestration (renders nothing; must mount after
          the chapter sections exist in the DOM — effects run post-commit) */}
      {motionActive && <ScrollRig />}

      {/* Telemetry overlay (DOM; hides its canvas-bound readouts per tier) */}
      {canvasActive && <TechnicalHUD />}

      {/* Scrollable narrative — always plain DOM, never canvas-gated */}
      <main>
        <Chapters />
      </main>
    </>
  )
}
