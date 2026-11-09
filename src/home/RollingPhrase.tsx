import { useEffect, useState } from 'react'
import { rollingIndex, STEP_MS } from './rolling'

interface RollingPhraseProps {
  lead: string
  phrases: readonly string[]
}

// "I engineer … that <phrase>": the last words roll through the list, pause on hover or focus,
// stop after two rounds, and stay still with reduced motion. Screen readers get one stable sentence.
export default function RollingPhrase({ lead, phrases }: RollingPhraseProps) {
  const [ticks, setTicks] = useState(0)
  const [paused, setPaused] = useState(false)
  const { index, done } = rollingIndex(ticks, phrases.length)

  useEffect(() => {
    if (done || paused) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => setTicks((t) => t + 1), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [ticks, done, paused])

  return (
    <p className="home-rolling" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <span className="home-sr">
        {lead} {phrases.join(' ')}
      </span>
      <span aria-hidden="true">
        {lead}{' '}
        <span className="home-rolling-slot">
          <span key={index} className="home-rolling-word">
            {phrases[index]}
          </span>
        </span>
      </span>
    </p>
  )
}
