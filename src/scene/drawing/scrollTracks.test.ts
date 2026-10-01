import { describe, expect, it } from 'vitest'
import { DRAWING_INTRO_WINDOW, INTRO_SCROLL_SHARE, pacedProgress } from './introTimeline'
import {
  DOCUMENT_HEIGHT_VH,
  HISTORICAL_INTRO_SCROLL_SHARE,
  HISTORICAL_TRACK_VH,
  HERO_CHAPTER_INDEX,
  SCROLL_DISTANCE_VH,
  SCROLL_TRACK_VH,
  VIEWPORT_VH,
  chapterTransitPaced,
  chapterTransitVh,
  deriveScrollTracks,
  documentHeightVh,
  rawScrollFraction,
  scrollDistanceVh,
  trackOffsetsVh,
  trackScaleFactor,
  type ScrollTracksVh,
} from './scrollTracks'

/**
 * Pacing-integration regression tests (2026-10-01). Node environment only — pure functions,
 * no jsdom, no canvas. The tracks are the only thing that decides where `[data-chapter]`
 * sections sit in raw scroll, so these pin the contract the paced axis depends on:
 * 3120vh document / 3020vh distance, the intro boundary on the share, the hero transit on
 * the window the retained CH.02 timeline was authored against, and that transit opening
 * after the intro release.
 */

/** The paced window `[data-chapter="1"]`'s transit was authored against (animation-spec §4.1). */
const HISTORICAL_HERO_WINDOW = { start: 0.17702932828760637, end: 0.45842951750236516 }

/**
 * Test-local evaluation of the paced map at the historical 0.30 share. The live
 * `pacedProgress()` only ever evaluates at the current share, and both hero edges sit past the
 * handoff band, where the map is the plain main line.
 */
function historicalPaced(offsetVh: number): number {
  const raw = Math.max(0, Math.min(1, offsetVh / SCROLL_DISTANCE_VH))
  const releaseEnd = DRAWING_INTRO_WINDOW.releaseEnd
  if (raw <= HISTORICAL_INTRO_SCROLL_SHARE) {
    return (releaseEnd / HISTORICAL_INTRO_SCROLL_SHARE) * raw
  }
  return (
    releaseEnd +
    ((1 - releaseEnd) / (1 - HISTORICAL_INTRO_SCROLL_SHARE)) * (raw - HISTORICAL_INTRO_SCROLL_SHARE)
  )
}

/** The hero transit's `top bottom` / `bottom top` anchors as the 0.30-share layout placed them. */
function historicalHeroWindow(): { start: number; end: number } {
  const chapter1Top = HISTORICAL_TRACK_VH.intro + HISTORICAL_TRACK_VH.chapters[0]
  return {
    start: historicalPaced(chapter1Top - VIEWPORT_VH),
    end: historicalPaced(chapter1Top + HISTORICAL_TRACK_VH.chapters[1]),
  }
}

/**
 * ScrollTrigger's own arithmetic for the hero section, in px, at one viewport height: the DOM
 * stacks the tracks, `top bottom` fires when the element's top meets the viewport's bottom edge,
 * `bottom top` when its bottom meets the viewport's top edge, and the trigger reports
 * `scrollY / (scrollHeight - innerHeight)` — the value `pacedProgress` consumes in `ScrollRig`.
 */
function heroWindowAtViewportHeightPx(
  viewportHeightPx: number,
  tracks: ScrollTracksVh = SCROLL_TRACK_VH,
): { start: number; end: number } {
  const pxPerVh = viewportHeightPx / VIEWPORT_VH
  const topPx = trackOffsetsVh(tracks)[HERO_CHAPTER_INDEX + 1] * pxPerVh
  const heightPx = tracks.chapters[HERO_CHAPTER_INDEX] * pxPerVh
  const maxScrollPx = scrollDistanceVh(tracks) * pxPerVh
  return {
    start: pacedProgress((topPx - viewportHeightPx) / maxScrollPx),
    end: pacedProgress((topPx + heightPx) / maxScrollPx),
  }
}

describe('deriveScrollTracks (JG-026 pacing integration)', () => {
  it('keeps the 3120vh document and 3020vh scroll distance at every share', () => {
    for (const share of [0.3, 0.4, 0.5, 0.6]) {
      const tracks = deriveScrollTracks(share)
      expect(documentHeightVh(tracks)).toBeCloseTo(DOCUMENT_HEIGHT_VH, 9)
      expect(scrollDistanceVh(tracks)).toBeCloseTo(SCROLL_DISTANCE_VH, 9)
    }
    expect(documentHeightVh()).toBeCloseTo(DOCUMENT_HEIGHT_VH, 9)
    expect(SCROLL_DISTANCE_VH).toBe(3020)
  })

  it('is the identity at the 0.30 share the historical literals were measured at', () => {
    expect(HISTORICAL_TRACK_VH.intro).toBe(906)
    expect(deriveScrollTracks(HISTORICAL_INTRO_SCROLL_SHARE)).toEqual({
      intro: 906,
      chapters: [237, 576, 541, 811],
      footer: 49,
    })
  })

  it('derives the rebalanced 0.50 ladder from the current share', () => {
    expect(INTRO_SCROLL_SHARE).toBe(0.5)
    expect(trackScaleFactor()).toBeCloseTo(5 / 7, 12)
    expect(SCROLL_TRACK_VH.intro).toBeCloseTo(1510, 9)
    expect(SCROLL_TRACK_VH.chapters[0]).toBeCloseTo(197.857142857, 9)
    expect(SCROLL_TRACK_VH.chapters[1]).toBeCloseTo(382.857142857, 9)
    expect(SCROLL_TRACK_VH.chapters[2]).toBeCloseTo(386.428571429, 9)
    expect(SCROLL_TRACK_VH.chapters[3]).toBeCloseTo(579.285714286, 9)
    expect(SCROLL_TRACK_VH.footer).toBeCloseTo(63.571428571, 9)
  })

  it('puts the intro boundary exactly on INTRO_SCROLL_SHARE', () => {
    expect(SCROLL_TRACK_VH.intro).toBeCloseTo(SCROLL_DISTANCE_VH * INTRO_SCROLL_SHARE, 12)
    expect(rawScrollFraction(SCROLL_TRACK_VH.intro)).toBeCloseTo(INTRO_SCROLL_SHARE, 12)
    // The DOM boundary is exactly where the drawing hands off to the retained timeline.
    expect(pacedProgress(INTRO_SCROLL_SHARE)).toBeCloseTo(DRAWING_INTRO_WINDOW.releaseEnd, 12)
  })

  it('compresses the post-intro band by trackScaleFactor while the total holds', () => {
    const historicalMain =
      HISTORICAL_TRACK_VH.chapters.reduce((sum, height) => sum + height, 0) +
      HISTORICAL_TRACK_VH.footer -
      VIEWPORT_VH
    const derivedMain =
      SCROLL_TRACK_VH.chapters.reduce((sum, height) => sum + height, 0) +
      SCROLL_TRACK_VH.footer -
      VIEWPORT_VH
    expect(historicalMain).toBeCloseTo(SCROLL_DISTANCE_VH - HISTORICAL_TRACK_VH.intro, 9)
    expect(derivedMain).toBeCloseTo(SCROLL_DISTANCE_VH - SCROLL_TRACK_VH.intro, 9)
    expect(derivedMain / historicalMain).toBeCloseTo(trackScaleFactor(), 12)
  })

  it('keeps every chapter end from CH.02 onward on its historical paced boundary', () => {
    // The affine map preserves every cumulative `bottom top` boundary from CH.02 onward; the
    // chapter 0/1 boundary is the deliberate exception (chapter 0 absorbs one viewport so
    // CH.02's own start edge can map).
    let historicalTop = HISTORICAL_TRACK_VH.intro
    for (const chapterIndex of [1, 2, 3]) {
      historicalTop += HISTORICAL_TRACK_VH.chapters[chapterIndex - 1]
      expect(chapterTransitPaced(chapterIndex).end).toBeCloseTo(
        historicalPaced(historicalTop + HISTORICAL_TRACK_VH.chapters[chapterIndex]),
        9,
      )
    }
  })
})

describe('hero transit ([data-chapter="1"], start top-bottom / end bottom-top)', () => {
  it('retains the paced window the retained CH.02 timeline was authored against', () => {
    const hero = chapterTransitPaced(HERO_CHAPTER_INDEX)
    // The digits animation-spec §4.1 quotes are truncations of these two numbers …
    expect(hero.start).toBeCloseTo(0.177029, 5)
    expect(hero.end).toBeCloseTo(0.458429, 5)
    // …which themselves hold to full double precision …
    expect(hero.start).toBeCloseTo(HISTORICAL_HERO_WINDOW.start, 9)
    expect(hero.end).toBeCloseTo(HISTORICAL_HERO_WINDOW.end, 9)
    // …and independently recomputed from the 0.30 layout's own tracks.
    const historical = historicalHeroWindow()
    expect(hero.start).toBeCloseTo(historical.start, 9)
    expect(hero.end).toBeCloseTo(historical.end, 9)
  })

  it('lands on the same window at desktop and narrow viewport heights', () => {
    // The harness viewports: 1600x900 desktop, 390x844 narrow (verify-jgun-opening.mjs).
    const desktop = heroWindowAtViewportHeightPx(900)
    const narrow = heroWindowAtViewportHeightPx(844)
    for (const transit of [desktop, narrow]) {
      expect(transit.start).toBeCloseTo(HISTORICAL_HERO_WINDOW.start, 9)
      expect(transit.end).toBeCloseTo(HISTORICAL_HERO_WINDOW.end, 9)
    }
    expect(narrow.start).toBeCloseTo(desktop.start, 12)
    expect(narrow.end).toBeCloseTo(desktop.end, 12)
  })

  it('opens the transit after the intro release, so the first post-handoff frame carries no partially advanced mechanism', () => {
    const { startVh, endVh } = chapterTransitVh(HERO_CHAPTER_INDEX)
    expect(startVh).toBeGreaterThan(SCROLL_TRACK_VH.intro)
    expect(rawScrollFraction(startVh)).toBeGreaterThan(INTRO_SCROLL_SHARE)
    // GSAP scrub progress over the transit at the raw intro handoff: not yet started.
    expect((SCROLL_TRACK_VH.intro - startVh) / (endVh - startVh)).toBeLessThan(0)
    // CH.01's own section still opens before the handoff, so its card stays held back by the
    // `afterIntro` gate in Chapters.tsx instead of appearing early.
    expect(chapterTransitPaced(0).start).toBeLessThan(DRAWING_INTRO_WINDOW.releaseEnd)
  })

  it('is sensitive to the stale 0.30 literals it replaced', () => {
    // The defect this derivation fixes (animation-spec §4.1): the historical heights under the
    // current share handed the hero a transit it was already 69% through at the handoff.
    const stale = chapterTransitPaced(HERO_CHAPTER_INDEX, HISTORICAL_TRACK_VH)
    expect(stale.start).toBeCloseTo(0.082887, 6)
    expect(stale.end).toBeCloseTo(0.241801, 6)
  })
})

