import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { setScrollState } from '../state/scrollStore'

gsap.registerPlugin(ScrollTrigger)

/**
 * Module 1 — smooth-scroll + scroll-state rig.
 *
 * Lenis drives native window scroll; its raf is ticked from gsap.ticker so
 * ScrollTrigger, Lenis and the R3F frame loop share one clock. Lag smoothing
 * is disabled per the standard Lenis/ScrollTrigger integration, otherwise
 * scrubbed timelines stutter after tab-switches.
 */
export function ScrollRig() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })

    lenis.on('scroll', () => ScrollTrigger.update())
    const tick = (time: number): void => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const globalTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) =>
        setScrollState({ progress: self.progress, velocity: self.getVelocity() / 1000 }),
    })

    const sections = gsap.utils.toArray<HTMLElement>('[data-chapter]')
    const chapterTriggers = sections.map((section, index) =>
      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) setScrollState({ chapter: index })
        },
        onUpdate: (self) => {
          if (self.isActive) setScrollState({ chapterProgress: self.progress })
        },
      }),
    )

    return () => {
      chapterTriggers.forEach((trigger) => trigger.kill())
      globalTrigger.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  return null
}
