import { describe, expect, it } from 'vitest'
import { torqueHudChapter, torqueHudSeekStart } from './hudChapter'
import { createJourneySample, sampleJourney } from './JourneyDirector'
import { sampleTorqueBeat } from './beatTimeline'

describe('owner-reviewed Inspection chrome', () => {
  it('tracks the study window on forward, reverse and random seeks, including the mid-beat exit', () => {
    const points = [0.56, 0.6199, 0.62, 0.735, 0.8, 0.8449, 0.845, 0.8549]
    const journey = createJourneySample()
    for (const p of [...points, ...[...points].reverse(), 0.845, 0.62, 0.6199, 0.8]) {
      const poster = sampleTorqueBeat(p).beat.poster as 'inspection'
      const visible = sampleJourney(p, true, journey).studyVisible
      expect(torqueHudChapter(poster, visible)).toBe(visible ? 'inspection' : 'mechanism')
    }
  })

  it('holds Mechanism on cold/direct seeks until the study is installed', () => {
    const journey = createJourneySample()
    for (const p of [0.62, 0.735, 0.8]) {
      const loading = sampleJourney(p, false, journey)
      expect(loading.effectiveProgress).toBe(0.6)
      expect(torqueHudChapter('inspection', loading.studyVisible)).toBe('mechanism')
      const ready = sampleJourney(p, true, journey)
      expect(torqueHudChapter('inspection', ready.studyVisible)).toBe('inspection')
    }
  })

  it('seeks to the isolated shaft and preserves the other chapter targets', () => {
    expect(torqueHudSeekStart('inspection', 0.56)).toBe(0.62)
    for (const [chapter, start] of [
      ['drafting', 0],
      ['breakthrough', 0.32],
      ['mechanism', 0.46],
      ['close', 0.855],
    ] as const) {
      expect(torqueHudSeekStart(chapter, start)).toBe(start)
      expect(torqueHudChapter(chapter, false)).toBe(chapter)
    }
  })
})
