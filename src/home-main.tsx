import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import HomePage from './home/HomePage'
import { installPageFade, releaseFadeWhen } from './shared/pageFade'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

installPageFade(document)

createRoot(container).render(
  <StrictMode>
    <HomePage />
  </StrictMode>,
)

// The page is plain DOM: it is ready once the display font has settled (or the hold cap passes).
let fontsReady = false
document.fonts?.ready.then(
  () => {
    fontsReady = true
  },
  () => {
    fontsReady = true
  },
)
if (!document.fonts) fontsReady = true
releaseFadeWhen(() => fontsReady)
