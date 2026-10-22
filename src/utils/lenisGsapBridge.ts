import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Root scroll synchronisation: Lenis is ticked from gsap.ticker so Lenis, ScrollTrigger and the
 * R3F frame loop share one clock. Lag smoothing is disabled, otherwise scrubbed timelines stutter
 * after a tab switch. Mount once per page; the legacy `ScrollRig` owns this job on the main site.
 */
export function useLenisGsapBridge(): void {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const updateTicker = (time: number): void => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateTicker)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(updateTicker)
      lenis.destroy()
    }
  }, [])
}
