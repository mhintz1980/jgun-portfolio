import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { getScrollState, setScrollState } from '../state/scrollStore'
import { pacedProgress, rawScrollFor } from './drawing/introTimeline'
import { installScrollCommit } from './scrollCommit'

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

    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__lenis = lenis
    }

    lenis.on('scroll', () => ScrollTrigger.update())
    const tick = (time: number): void => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // JG-026 pacing: the store publishes PACED progress, not raw scroll. The intro owns
    // `INTRO_SCROLL_SHARE` of the document but still only 0.120 of the progress axis, so
    // every downstream window keeps the value it was verified at and only gains distance.
    // Velocity is reported on the same axis (chain rule), which keeps the rest-orbit and
    // scroll-idle checks comparing like with like.
    const globalTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const raw = self.progress
        const paced = pacedProgress(raw)
        const slope =
          (pacedProgress(Math.min(1, raw + 1e-4)) - pacedProgress(Math.max(0, raw - 1e-4))) /
          (Math.min(1, raw + 1e-4) - Math.max(0, raw - 1e-4))
        setScrollState({ progress: paced, velocity: (self.getVelocity() / 1000) * slope })
      },
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

    // Deep-link initial scroll synchronization
    const { progress: initialProgress } = getScrollState()
    if (initialProgress > 0) {
      ScrollTrigger.refresh()
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max > 0) {
        // Deep links carry a paced-progress value; the browser needs the raw scroll for it.
        lenis.scrollTo(max * rawScrollFor(initialProgress), { immediate: true })
        ScrollTrigger.update()
      }
    }

    // JG-026 Item 5: the single committed-pace moment inside the B1/B2 intro. Cancels on any
    // input, symmetric under reverse scroll, never mounted in the reduced-motion tier.
    const removeScrollCommit = installScrollCommit(lenis)

    return () => {
      removeScrollCommit()
      chapterTriggers.forEach((trigger) => trigger.kill())
      globalTrigger.kill()
      gsap.ticker.remove(tick)
      lenis.destroy()
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__lenis
      }
    }
  }, [])

  return null
}
