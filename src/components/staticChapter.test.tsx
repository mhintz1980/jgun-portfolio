import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHAPTER_RANGES, chapterForProgress } from './staticChapter'
import { pacedProgress, rawScrollFor, INTRO_SCROLL_SHARE } from '../scene/drawing/introTimeline'
import { CHAPTERS } from '../data/caseStudies'
import { StaticPoster } from './StaticPoster'
import { StationNav } from './StationNav'
import { Chapters } from './Chapters'
import { getQuality } from '../state/qualityStore'

/**
 * Fallback-QA regression tests (2026-09-27): the poster tier previously
 * rendered all four chapter cards stacked over a fixed text-6xl poster
 * heading, with no station navigation. These pin the corrected behavior.
 * Node environment only — pure functions plus react-dom/server static
 * markup; no jsdom, no canvas, no WebGL.
 */

describe('CHAPTER_RANGES (shared by full-motion and static tiers)', () => {
  it('covers every chapter with ordered, non-overlapping ranges', () => {
    expect(Object.keys(CHAPTER_RANGES).length).toBe(CHAPTERS.length)
    const ordered = [...CHAPTERS].sort((a, b) => a.index - b.index)
    let previousEnd = -1
    for (const chapterDef of ordered) {
      const [start, end] = CHAPTER_RANGES[chapterDef.index]
      expect(start).toBeLessThan(end)
      expect(start).toBeGreaterThan(previousEnd)
      previousEnd = end
    }
    expect(previousEnd).toBe(1)
  })
})

describe('chapterForProgress', () => {
  it('maps window starts and gaps to the expected chapters', () => {
    expect(chapterForProgress(-0.5)).toBe(0)
    expect(chapterForProgress(0)).toBe(0)
    expect(chapterForProgress(0.23)).toBe(0) // gap after CH.01: previous window holds
    expect(chapterForProgress(0.24)).toBe(1)
    expect(chapterForProgress(0.5)).toBe(2)
    expect(chapterForProgress(0.76)).toBe(3)
    expect(chapterForProgress(1.5)).toBe(3)
  })

  it('never returns a chapter whose window has not started', () => {
    for (let i = 0; i <= 100; i += 1) {
      const p = i / 100
      const chapter = chapterForProgress(p)
      const [start] = CHAPTER_RANGES[chapter]
      expect(p).toBeGreaterThanOrEqual(start - 1e-9)
    }
  })
})

describe('paced axis round-trip (static tier scroll math)', () => {
  it('rawScrollFor inverts pacedProgress across the handoff blend', () => {
    for (let i = 0; i <= 50; i += 1) {
      const p = i / 50
      const raw = rawScrollFor(p)
      expect(pacedProgress(raw)).toBeCloseTo(p, 9)
    }
  })

  it('keeps the intro stretched over INTRO_SCROLL_SHARE of the document', () => {
    // The pacing constant the static listener relies on: paced 0.12 (intro
    // handoff) must sit exactly at raw INTRO_SCROLL_SHARE.
    expect(rawScrollFor(0.12)).toBeCloseTo(INTRO_SCROLL_SHARE, 6)
    // Chapter windows therefore land at these raw fractions in the static
    // tiers — CH.03's start (paced 0.50) must not be a plain 0.50 of scroll.
    const ch03Raw = rawScrollFor(0.5)
    expect(ch03Raw).toBeGreaterThan(0.5)
  })
})

describe('StaticPoster (poster-tier backdrop)', () => {
  const markup = renderToStaticMarkup(<StaticPoster />)

  it('carries no narrative-size heading (sheet furniture only)', () => {
    expect(markup).not.toMatch(/text-(4xl|5xl|6xl|7xl)/)
    expect(markup).not.toMatch(/<h1[ >]/)
  })

  it('stays small, fixed and aria-hidden behind the chapter cards', () => {
    expect(markup).toContain('fixed inset-0')
    expect(markup).toContain('aria-hidden')
    expect(markup).toContain('text-[10px]')
  })

  it('keeps the drawing identity and static-mode notice as furniture', () => {
    expect(markup).toContain('DWG NO.')
    expect(markup).toContain('STATIC RENDER MODE')
    expect(markup).toContain('SHEET 1 OF 1')
  })
})

describe('StationNav (poster-tier navigation)', () => {
  const markup = renderToStaticMarkup(<StationNav />)

  it('renders exactly three persistent station buttons', () => {
    const buttons = markup.match(/<button/g) ?? []
    expect(buttons.length).toBe(3)
    for (const st of ['STATION 01', 'STATION 02', 'STATION 03']) {
      expect(markup).toContain(st)
    }
  })

  it('is an accessible nav with labelled focus targets', () => {
    expect(markup).toContain('aria-label="Station navigation"')
    expect(markup).toContain('aria-label="Navigate to STATION 02')
    expect(markup).toContain('focus-visible:ring-2')
  })

  it('carries no canvas-coupled HUD readouts', () => {
    expect(markup).not.toContain('SCROLL //')
    expect(markup).not.toContain('CAM [')
    expect(markup).not.toMatch(/solid|blueprint|exploded/)
  })
})

describe('Chapters static fallback (poster tier one-card)', () => {
  it('renders the single chapter card as a fixed overlay that survives native scroll', () => {
    // Node test env has no WebGL2, so the quality ladder starts at poster.
    expect(getQuality().tier).toBe('poster')
    const markup = renderToStaticMarkup(<Chapters />)
    // Overlay stays pinned through the scroll track and never eats page scroll.
    expect(markup).toContain('fixed inset-0')
    expect(markup).toContain('pointer-events-none')
    // The card itself remains interactive and scrolls internally when tall.
    expect(markup).toContain('pointer-events-auto')
    expect(markup).toContain('overflow-y-auto')
    // Exactly one chapter heading — the JG-022 one-card gate.
    expect(markup.match(/<h2/g)?.length).toBe(1)
  })
})
