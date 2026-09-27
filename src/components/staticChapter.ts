import { useEffect, useState } from 'react'
import { CHAPTERS } from '../data/caseStudies'
import { pacedProgress } from '../scene/drawing/introTimeline'

/**
 * Chapter active scroll progress ranges [start, end] on the global 0..1 *paced*
 * scroll timeline. Opacity clamps smoothly inside and fades between adjacent
 * chapter boundaries. Moved here from Chapters.tsx so the static fallback and
 * StationNav derive the active chapter from one source of truth.
 */
export const CHAPTER_RANGES: Record<number, [number, number]> = {
  0: [0.0, 0.22],
  1: [0.24, 0.46],
  2: [0.5, 0.72],
  3: [0.76, 1.0],
}

/** Paced progress -> active chapter index (chapter whose `start` is last passed). */
export function chapterForProgress(progress: number): number {
  let chapter = 0
  for (const chapterDef of CHAPTERS) {
    const [start] = CHAPTER_RANGES[chapterDef.index] ?? [0, 1]
    if (progress >= start) chapter = chapterDef.index
  }
  return chapter
}

/**
 * Native-scroll derivation of the active chapter for tiers without ScrollRig
 * (JG-022): the poster and reduced-motion tiers never mount Lenis/ScrollTrigger,
 * so `chapter` in the scroll store stays locked at 0. This hook listens to raw
 * window scroll instead and maps it through the same pacedProgress axis the
 * full-motion tier uses. Deliberately local state — no store writes, so the 3D
 * world stays pinned to Station 1 in these tiers.
 */
export function useNativeScrollChapter(enabled: boolean): number {
  const [chapter, setChapter] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      // CHAPTER_RANGES are authored on the paced progress axis, so raw scroll has to be
      // mapped the same way ScrollRig maps it in the full-motion tier (JG-026 pacing).
      const p = max > 0 ? pacedProgress(window.scrollY / max) : 0
      setChapter(chapterForProgress(p))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled])
  return chapter
}
