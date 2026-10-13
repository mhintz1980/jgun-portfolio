// Private /torque-wrench/ entry. StrictMode root, shared CSS, shared fade installation, and the
// page with its page-local store. The tier is resolved synchronously here, before first render;
// the only narrative import path is cadGate's dynamic import, which cannot run earlier.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import './index.css'
import { TorqueWrenchPage } from './scene/torque-wrench/TorqueWrenchPage'
import { readReducedMotion } from './scene/torque-wrench/tier'
import { resolveEntryTier } from './shared/pages'
import { installPageFade } from './shared/pageFade'
import { createTorqueWrenchStore } from './state/torqueWrenchStore'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

// Fade install is document-scoped shell infrastructure. It is removed only when the root itself
// is torn down (HMR); the document-level bfcache cleanup inside the install stays for the
// document's real lifetime, and pagehide never uninstalls it.
const uninstallPageFade = installPageFade(document)

const store = createTorqueWrenchStore({
  tier: resolveEntryTier(window.location.search, readReducedMotion()),
})

const torqueRoot = createRoot(container)
// Commit the initial semantic layout before the document load/pageshow restoration.
// Otherwise a cached production module can finish loading while the concurrent root
// is still empty, and the browser clamps a saved position to a zero-height document.
flushSync(() => {
  torqueRoot.render(
    <StrictMode>
      <TorqueWrenchPage store={store} />
    </StrictMode>,
  )
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    torqueRoot.unmount()
    uninstallPageFade()
  })
}
