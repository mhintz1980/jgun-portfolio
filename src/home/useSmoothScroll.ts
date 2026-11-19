import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Smooth wheel scrolling for the homepage (Lenis). It still moves the real document scroll, so
// the scroll-driven effects (drawings, the line, the image stacks) need no changes. Touch scrolling
// stays native, and reduced motion turns the smoothing off entirely.
//
// Call this AFTER the effect that owns the header's wheel gate: listeners on the same target run
// in registration order, and a wheel event the gate has cancelled must not scroll the page.
export function useSmoothScroll(): void {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | null = null

    const start = () => {
      if (lenis || reduced.matches) return
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.14,
        anchors: true,
        virtualScroll: ({ event }) => !event.defaultPrevented,
      })
    }
    const stop = () => {
      lenis?.destroy()
      lenis = null
    }
    const sync = () => (reduced.matches ? stop() : start())

    start()
    reduced.addEventListener('change', sync)
    return () => {
      reduced.removeEventListener('change', sync)
      stop()
    }
  }, [])
}
