import { createRoot } from 'react-dom/client'
import { RingInspection } from '../../../../../../src/components/RingInspection'
import { inspection, inspectionFailed, enterInspection, exitInspection, setInspectionStatus, playInspection } from '../../../../../../src/state/inspectionStore'
import { setScrollState } from '../../../../../../src/state/scrollStore'
import { forcePoster, getQuality } from '../../../../../../src/state/qualityStore'

setScrollState({ progress: .35, chapter: 1, materialMode: 'blueprint', hotspotId: 'rotor' })
document.body.style.margin = '0'
document.body.style.background = '#202124'
document.body.style.fontFamily = 'Arial, sans-serif'
createRoot(document.getElementById('root')!).render(<>
  <main style={{ minHeight: 3000 }}><section data-chapter="0"><h1>JGun narrative</h1><button id="outside-focus">Narrative action</button></section></main>
  <RingInspection />
</>)
;(window as unknown as Record<string, unknown>).shellProof = {
  inspection, fail: inspectionFailed, status: setInspectionStatus, play: playInspection, exit: exitInspection, forcePoster, getQuality,
  openRemovedTrigger() {
    setScrollState({ progress: .12 })
    const trigger = document.createElement('button')
    trigger.id = 'removed-trigger'; document.body.appendChild(trigger)
    enterInspection(trigger, false); trigger.remove()
  },
}
