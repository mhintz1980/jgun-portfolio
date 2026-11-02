import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ArmamentPage from './home/ArmamentPage'
import { installPageFade, releaseFadeWhen } from './shared/pageFade'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

installPageFade(document)

createRoot(container).render(
  <StrictMode>
    <ArmamentPage />
  </StrictMode>,
)

let fontsReady = !document.fonts
document.fonts?.ready.then(() => { fontsReady = true }, () => { fontsReady = true })
releaseFadeWhen(() => fontsReady)
