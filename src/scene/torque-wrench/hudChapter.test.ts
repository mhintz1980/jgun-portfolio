import { describe, expect, it } from 'vitest'
import { torqueHudChapter, torqueHudSeekStart } from './hudChapter'
import { createJourneySample, sampleJourney } from './JourneyDirector'
import { sampleTorqueBeat } from './beatTimeline'

describe('owner-reviewed Inspection chrome', () => {
  it('tracks the study window on forward, reverse and random seeks, including the mid-beat exit', () => {
    const points = [.56, .6199, .62, .735, .80, .8449, .845, .8549]
    const journey = createJourneySample()
    for (const p of [...points, ...[...points].reverse(), .845, .62, .6199, .80]) {
      const poster = sampleTorqueBeat(p).beat.poster as 'inspection'
      const visible = sampleJourney(p, true, journey).studyVisible
      expect(torqueHudChapter(poster, visible)).toBe(visible ? 'inspection' : 'mechanism')
    }
  })

  it('holds Mechanism on cold/direct seeks until the study is installed', () => {
    const journey = createJourneySample()
    for (const p of [.62, .735, .80]) {
      const loading = sampleJourney(p, false, journey)
      expect(loading.effectiveProgress).toBe(.60)
      expect(torqueHudChapter('inspection', loading.studyVisible)).toBe('mechanism')
      const ready = sampleJourney(p, true, journey)
      expect(torqueHudChapter('inspection', ready.studyVisible)).toBe('inspection')
    }
  })

  it('seeks to the isolated shaft and preserves the other chapter targets', () => {
    expect(torqueHudSeekStart('inspection', .56)).toBe(.62)
    for (const [chapter, start] of [['drafting', 0], ['breakthrough', .32], ['mechanism', .46], ['close', .855]] as const) {
      expect(torqueHudSeekStart(chapter, start)).toBe(start)
      expect(torqueHudChapter(chapter, false)).toBe(chapter)
    }
  })
})
