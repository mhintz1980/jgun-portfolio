import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { TORQUE_BEATS, TORQUE_SCROLL_VIEWPORTS, TORQUE_STORY_CHAPTER_IDS } from './beats'
import { createBeatTimeline, sampleTorqueBeat } from './beatTimeline'
import { TORQUE_DIRECTOR_IDS } from './directorRegistry'
import { TORQUE_POSTER_CHAPTERS } from './posterMap'

describe('torque beat inventory', () => {
  it('covers the normalized story exactly once in the delivered chapter order', () => {
    expect(TORQUE_BEATS[0].start).toBe(0)
    expect(TORQUE_BEATS.at(-1)?.end).toBe(1)
    const chapters: string[] = []
    for (const [index, beat] of TORQUE_BEATS.entries()) {
      expect(beat.start).toBeLessThan(beat.end)
      if (index > 0) expect(beat.start).toBe(TORQUE_BEATS[index - 1].end)
      expect(TORQUE_DIRECTOR_IDS).toContain(beat.director)
      expect(TORQUE_STORY_CHAPTER_IDS).toContain(beat.poster)
      if (beat.poster !== chapters.at(-1)) chapters.push(beat.poster!)
    }
    expect(chapters).toEqual(TORQUE_POSTER_CHAPTERS.map((chapter) => chapter.id))
    expect(chapters).toEqual(TORQUE_STORY_CHAPTER_IDS)
    expect(new Set(TORQUE_BEATS.map((beat) => beat.id)).size).toBe(TORQUE_BEATS.length)
  })

  it('keeps inventory, chapter identifiers, and beat metadata immutable', () => {
    expect(Object.isFrozen(TORQUE_BEATS)).toBe(true)
    expect(Object.isFrozen(TORQUE_STORY_CHAPTER_IDS)).toBe(true)
    expect(TORQUE_BEATS.every(Object.isFrozen)).toBe(true)
    expect(Reflect.set(TORQUE_BEATS[0], 'start', 0.1)).toBe(false)
    expect(Reflect.set(TORQUE_BEATS, '0', TORQUE_BEATS[1])).toBe(false)
  })

  it('authors substantive nonuniform microbeats and a cutter inspection slot', () => {
    for (const chapter of TORQUE_STORY_CHAPTER_IDS) {
      const beats = TORQUE_BEATS.filter((beat) => beat.poster === chapter)
      expect(beats.length).toBeGreaterThan(1)
      expect(beats.every((beat) => Boolean(beat.title && beat.copy))).toBe(true)
    }
    const read = TORQUE_BEATS.find((beat) => beat.id === 'drafting-input-note')!
    const rupture = TORQUE_BEATS.find((beat) => beat.id === 'breakthrough-rupture')!
    expect(read.end - read.start).toBeGreaterThan(rupture.end - rupture.start)
    expect(TORQUE_BEATS.find((beat) => beat.interaction === 'bullet-time')).toMatchObject({
      id: 'inspection-bullet-time', director: 'inspection', poster: 'inspection',
    })
  })

  it('does not introduce a separate cavern scene before first rupture', () => {
    const rupture = TORQUE_BEATS.find((beat) => beat.id === 'breakthrough-rupture')!
    expect(TORQUE_BEATS.filter((beat) => beat.start < rupture.start).some((beat) => beat.scene === 'pit')).toBe(false)
  })

  it('places the ring study at [.46,.505] and places the full shaft before final source extraction', () => {
    const ring = TORQUE_BEATS.find((beat) => beat.id === 'inspection-ring')!
    expect(ring).toMatchObject({ start: .46, end: .505, poster: 'mechanism', director: 'inspection' })
    const ids = ['mechanism-switch', 'inspection-isolation', 'mechanism-extraction', 'mechanism-exploded-hold']
    const bounds = [[.505, .56], [.56, .62], [.855, .93], [.93, .94]]
    ids.forEach((id, i) => {
      const beat = TORQUE_BEATS.find(candidate => candidate.id === id)!
      expect([beat.start,beat.end]).toEqual(bounds[i])
      expect(beat.poster).toBe(i<1?'mechanism':i<2?'inspection':'close')
    })
    expect(TORQUE_BEATS.find(beat => beat.id === 'inspection-shaping')).toMatchObject({start:.62,end:.68})
    expect(TORQUE_BEATS.find((beat) => beat.id === 'breakthrough-emergence')).toMatchObject({ start: .435, end: .46 })
  })

  it('leaves the reduced-motion/static chapter output independent of beat coordinates', () => {
    // The static path renders posterMap chapters and Story sections only; neither may read beats.
    for (const file of ['Poster.tsx', 'Story.tsx', 'posterMap.ts']) {
      const source = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
      expect(source, file).not.toMatch(/from '\.\/beats'|TORQUE_BEATS/)
    }
    expect(TORQUE_POSTER_CHAPTERS.map((chapter) => chapter.id)).toEqual([...TORQUE_STORY_CHAPTER_IDS])
  })

  it('keeps the provisional 44.1 viewport physical range out of the narrative resolver', () => {
    expect(TORQUE_SCROLL_VIEWPORTS).toBe(44.1)
    const timeline = createBeatTimeline(TORQUE_BEATS, TORQUE_DIRECTOR_IDS)
    // Different physical distances normalize to the same canonical input and sample.
    for (const range of [5000, TORQUE_SCROLL_VIEWPORTS * 900, 80000]) {
      expect(timeline.sample((range / 2) / range)).toEqual(sampleTorqueBeat(0.5))
    }
  })
})
