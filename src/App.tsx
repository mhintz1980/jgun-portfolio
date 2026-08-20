import { SceneCanvas } from './scene/SceneCanvas'
import { ScrollRig } from './scene/ScrollRig'
import { Chapters } from './components/Chapters'
import { TechnicalHUD } from './components/TechnicalHUD'

export default function App() {
  return (
    <>
      {/* Fixed WebGL stage behind everything */}
      <SceneCanvas />

      {/* Lenis + ScrollTrigger orchestration (renders nothing; must mount after
          the chapter sections exist in the DOM — effects run post-commit) */}
      <ScrollRig />

      {/* Telemetry overlay */}
      <TechnicalHUD />

      {/* Scrollable narrative */}
      <main>
        <Chapters />
      </main>
    </>
  )
}
