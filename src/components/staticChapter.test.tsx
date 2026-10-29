import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHAPTER_RANGES, chapterForProgress } from './staticChapter'
import { pacedProgress, rawScrollFor, INTRO_SCROLL_SHARE } from '../scene/drawing/introTimeline'
import { CHAPTERS } from '../data/caseStudies'
import { StaticPoster } from './StaticPoster'
import { StationNav } from './StationNav'
import { Chapters } from './Chapters'
import { getQuality } from '../state/qualityStore'
import { buildShaftAnnouncement, ShaftStoryLayer, SHAFT_TRANSCRIPT } from './ShaftStoryLayer'
import { StaticShaftStory } from './StaticShaftStory'
import { createShaftScriptFrame, sampleShaftScript, SHAFT_CAPTION_TEXT } from '../scene/inspection/shaft/script'
import { Story } from '../scene/torque-wrench/Story'

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

describe('shaft engagement narrative parity', () => {
  const plainText = (markup: string) => markup.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')

  it('announces the current caption on forward and reverse seeks without stale material text', () => {
    const frame = createShaftScriptFrame()
    for (const time of [16.5, 37, 39.4, 42.5, 39.4, 37, 0]) {
      sampleShaftScript(time, false, frame)
      const announcement = buildShaftAnnouncement(frame)
      if (time === 16.5) {
        expect(announcement).toContain('AISI 4140 (40-45 HRC); FAILED')
      } else {
        expect(announcement).toBe(SHAFT_CAPTION_TEXT[frame.caption])
        expect(announcement).not.toMatch(/FAILED|Factor of safety|HRC/)
      }
    }
  })

  it('renders exactly the active live caption and one polite atomic status region', () => {
    for (const reducedMotion of [false, true]) {
      for (const [time, caption] of [[35, 'stage1-mesh'], [38.5, 'bullet-time'], [40.2, 'driveline-cascade'], [43, 'driveline-cascade']] as const) {
        const markup = renderToStaticMarkup(<ShaftStoryLayer time={time} reducedMotion={reducedMotion} />)
        expect(markup.match(/data-shaft-caption=/g)).toHaveLength(1)
        expect(markup).toContain(`data-shaft-caption="${caption}"`)
        expect(plainText(markup)).toContain(SHAFT_CAPTION_TEXT[caption])
        expect(markup.match(/role="status"/g)).toHaveLength(1)
        expect(markup).toContain('aria-live="polite" aria-atomic="true"')
        expect(markup).not.toContain('data-shaft-card=')
        expect(markup).not.toContain('data-shaft-fos-model=')
      }
    }
    expect(renderToStaticMarkup(<ShaftStoryLayer time={34.9} reducedMotion={false} />)).not.toContain('data-shaft-caption=')
  })

  it('shares the four-chapter transcript with the static story and explains display ratios', () => {
    const live = plainText(renderToStaticMarkup(<ShaftStoryLayer time={39.4} reducedMotion={false} />))
    const still = plainText(renderToStaticMarkup(<StaticShaftStory />))
    expect(SHAFT_TRANSCRIPT).toHaveLength(4)
    for (const section of SHAFT_TRANSCRIPT) {
      for (const text of [live, still]) {
        expect(text).toContain(section.heading)
        expect(text).toContain(section.body)
      }
    }
    expect(still).toContain('Stage 1 engagement and driveline cascade')
    expect(still).toContain('labels relative carrier speeds; actual elapsed turns follow the bullet-time and cascade speed ramps')
    expect(still).not.toMatch(/Moving the supports|2\.75 millimetres|support relocation/)
  })

  it('retains the first three chapters’ images and requests the six new responsive stills', () => {
    const markup = renderToStaticMarkup(<StaticShaftStory />)
    const stillIds = ['cutter-exit', 'material-attempts', 'revised-blank', 'hobbed', 'cool-stress', 'stage1-engagement', 'bullet-time', 'driveline-cascade']
    expect(Array.from(markup.matchAll(/data-shaft-still="([^"]+)"/g), match => match[1])).toEqual(stillIds)
    for (const id of stillIds) {
      expect(markup).toContain(`<source media="(max-width: 600px)" srcSet="/inspection/shaft/${id}-narrow.webp"`)
      expect(markup).toContain(`<img src="/inspection/shaft/${id}-desktop.webp" alt="`)
    }
    expect(markup.match(/loading="lazy" decoding="async" width="960" height="600"/g)).toHaveLength(8)
    expect(markup).not.toMatch(/support-before|support-after|assembled-finale|<canvas|\.glb/)
    expect(markup).not.toMatch(/alt=""/)
  })

  it('keeps the top-level chapter and inspection disclosure on the new story', () => {
    const markup = renderToStaticMarkup(<Story />)
    const inspection = plainText(markup.split('data-torque-chapter="inspection"')[1].split('data-torque-chapter="close"')[0])
    expect(inspection).toContain('After the runout hold, the Stage 1 carrier (A000591)')
    expect(inspection).toContain('0.10× bullet time')
    expect(inspection).toContain('physical order 1, 2, 5 (A000606), 3 and 4')
    expect(inspection).toContain('actual elapsed turns follow the timed spin-up')
    expect(inspection).not.toMatch(/supports that moved|bearing and retaining rings moved/)
    expect(markup).toContain('aria-controls="torque-inspection-detail"')
    expect(markup).toContain('aria-label="Cutter inspection details" hidden=""')
  })
})
