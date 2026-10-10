import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import QuietMachinePreview from './scene/rl300/QuietMachinePreview'
import { installPageFade } from './shared/pageFade'

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

installPageFade(document)

createRoot(container).render(
  <StrictMode>
    <QuietMachinePreview />
  </StrictMode>,
)
