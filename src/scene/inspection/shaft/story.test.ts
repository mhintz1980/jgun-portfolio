import { describe, expect, it } from 'vitest'
import { shaftBeats, shaftStory } from './story'
import { SHAFT_DURATION } from './script'
import { SHAFT_KINEMATICS_DURATION, createShaftKinematicsFrame, sampleShaftKinematics } from './kinematics'
import { createShaftSchedule, sampleFinaleAngle, sampleShaftSchedule } from './schedule'

describe('v51.1 shaft interface', () => {
  it('shares the 66.9-second endpoint while preserving all pre-continuation beat boundaries', () => {
    expect([shaftStory.duration, SHAFT_DURATION, SHAFT_KINEMATICS_DURATION]).toEqual([66.9, 66.9, 66.9])
    expect(shaftBeats.map(({ start, end }) => [start, end])).toEqual([
      [0, 2], [2, 6], [6, 11], [11, 15], [15, 22.6], [22.6, 25],
      [25, 32], [32, 35], [35, 38.5], [38.5, 66.9],
    ])
    const schedule = createShaftSchedule()
    sampleShaftSchedule(40.2, schedule)
    expect(schedule.stage1SlideProgress).toBe(1)
    expect(schedule.cascadeAlpha).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
    expect(schedule.cascadePlanetAlpha).toEqual([1, 0, 0, 0, 0, 0, 0, 0])
    expect(schedule.finaleAngle).toBeCloseTo(sampleFinaleAngle(40.2), 12)
  })

  it('holds completed machining unchanged throughout the added continuation', () => {
    const frame = createShaftKinematicsFrame()
    sampleShaftKinematics(40.2, frame)
    const { time: baselineTime, ...baseline } = frame
    const expected = JSON.stringify(baseline)
    expect(baselineTime).toBe(40.2)
    for (const t of [41, 44.4, 45, 49, 52, 55, 66.9]) {
      sampleShaftKinematics(t, frame)
      // Time is telemetry, while tool/shaft machining coordinates stay settled.
      const { time, ...settled } = frame
      expect(time).toBe(t)
      expect(JSON.stringify(settled)).toBe(expected)
    }
  })
})
