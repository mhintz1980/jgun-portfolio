import { describe, expect, it } from 'vitest'
import { createJourneySample, sampleJourney } from './JourneyDirector'
const sampleInspectionSurroundings=(p:number)=>sampleJourney(p,true,createJourneySample()).surroundingsOpacity
import { createInspectionIsolationSample, sampleInspectionIsolation } from './inspectionIsolation'

describe('shared effective inspection isolation', () => {
  it('starts with visible surroundings and separate caller-owned samples', () => {
    const sample = createInspectionIsolationSample()
    expect(sample).toEqual({ progress: 0, surroundingsOpacity: 1, manual: false })
    expect(createInspectionIsolationSample()).not.toBe(sample)
  })

  it('reuses one output through forward, reverse and manual samples', () => {
    const sample = createInspectionIsolationSample()
    for (const progress of [0, 0.471, 0.815, 0.932, 1, 0.932, 0.471, 0]) {
      expect(sampleInspectionIsolation(progress, false, 0.94, sample)).toBe(sample)
      expect(sample.progress).toBe(progress)
      expect(sample.surroundingsOpacity).toBe(sampleInspectionSurroundings(progress))
      expect(sample.manual).toBe(false)
      expect(sampleInspectionIsolation(progress, true, 0.735, sample)).toBe(sample)
      expect(sample).toEqual({ progress: 0.735, surroundingsOpacity: 0, manual: true })
    }
  })

  it.each([
    { progress: 0.471, studyProgress: 0.932, opacity: 0 },
    { progress: 0.824, studyProgress: 0.928, opacity: 0 },
  ])('uses manual opacity when both envelopes are nonzero at scroll $progress', ({ progress, studyProgress, opacity }) => {
    const sample = createInspectionIsolationSample()
    sampleInspectionIsolation(progress, false, studyProgress, sample)
    const scrollOpacity = sample.surroundingsOpacity
    expect(scrollOpacity).toBeGreaterThan(0)
    expect(scrollOpacity).toBeLessThan(1)

    sampleInspectionIsolation(progress, true, studyProgress, sample)
    expect(sample.progress).toBe(studyProgress)
    expect(sample.manual).toBe(true)
    expect(sample.surroundingsOpacity).toBeCloseTo(opacity, 12)
    expect(sample.surroundingsOpacity).not.toBeCloseTo(scrollOpacity, 6)
  })

  it.each([0.471, 0.824])('restores scroll isolation after manual start and end at scroll %s', progress => {
    const sample = createInspectionIsolationSample()
    sampleInspectionIsolation(progress, true, 0.735, sample)
    expect(sample).toEqual({ progress: 0.735, surroundingsOpacity: 0, manual: true })
    sampleInspectionIsolation(progress, true, 0.94, sample)
    expect(sample).toEqual({ progress: 0.94, surroundingsOpacity: 0, manual: true })

    sampleInspectionIsolation(progress, false, 0.94, sample)
    expect(sample.progress).toBe(progress)
    expect(sample.manual).toBe(false)
    expect(sample.surroundingsOpacity).toBe(sampleInspectionSurroundings(progress))
    expect(sample.surroundingsOpacity).toBeGreaterThan(0)
    expect(sample.surroundingsOpacity).toBeLessThan(1)
  })
})
