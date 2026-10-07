import { describe, expect, it } from 'vitest'
import { createShaftSchedule, sampleShaftSchedule } from './schedule'
import { shaftBeats } from './story'

describe('shaft schedule', () => {
  it('uses the authored beat boundaries, including the held endpoint', () => {
    const out = createShaftSchedule()
    for (let i = 0; i < shaftBeats.length; i++) {
      const beat = shaftBeats[i]
      expect(sampleShaftSchedule(beat.start, out)).toBe(out)
      expect(out.beat).toBe(beat.id); expect(out.beatIndex).toBe(i)
      if (i > 0) expect(sampleShaftSchedule(beat.start - 1e-9, out).beat).toBe(shaftBeats[i - 1].id)
      expect(sampleShaftSchedule(beat.start + 1e-9, out).beat).toBe(beat.id)
    }
    expect(sampleShaftSchedule(100, out).time).toBe(43)
    expect(out.beat).toBe('finale')
    expect(sampleShaftSchedule(-2, out).time).toBe(0)
    expect(sampleShaftSchedule(NaN, out).time).toBe(0)
  })

  it('is deterministic under shuffled seeks and rewrites all fields in place', () => {
    const times = [...shaftBeats.flatMap(beat => [beat.start, beat.start + 1e-8, beat.end - 1e-8]), 0, 1.2, 32.8, 35.6, 37.6, 38.6, 43]
    const out = createShaftSchedule(), keys = Object.keys(out)
    const expected = times.map(t => JSON.stringify(sampleShaftSchedule(t, out)))
    let seed = 1979
    for (let i = 0; i < 500; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0
      const index = seed % times.length
      expect(sampleShaftSchedule(times[index], out)).toBe(out)
      expect(JSON.stringify(out)).toBe(expected[index])
      expect(Object.keys(out)).toEqual(keys)
    }
  })

  it('enforces opacity, tool, wipe, section, witness and narrative rules at dense times', () => {
    const out = createShaftSchedule()
    const opacities = ['legacyShaft', 'approvedShaft', 'shaper', 'hob', 'housing', 'legacyHousing', 'legacyBearing', 'legacyRing', 'approvedBearing', 'approvedRing', 'neighbours'] as const
    const violations: string[] = []
    for (let i = 0; i <= 5160; i++) {
      const t = i / 120; sampleShaftSchedule(t, out)
      for (const key of opacities) if (!(out[key] >= 0 && out[key] <= 1)) violations.push(t + ': ' + key)
      if ((t < 2 || t >= 15) && out.shaper !== 0) violations.push(t + ': shaper')
      if ((t < 25 || t >= 32) && out.hob !== 0) violations.push(t + ': hob')
      if (t >= 1.2 && out.narrativeAlpha !== 0) violations.push(t + ': narrative')
      if (t < 22.6 && out.approvedShaft !== 0) violations.push(t + ': approved before wipe')
      if (t >= 22.6 && t < 25 && (!out.wipe || out.legacyShaft !== 1 || out.approvedShaft !== 1)) violations.push(t + ': opaque wipe')
      if (t >= 25 && (out.legacyShaft !== 0 || out.approvedShaft !== 1)) violations.push(t + ': shaft selection')
      if (out.section !== (t >= 35 && t < 39)) violations.push(t + ': section')
      if (out.approvedBearing !== out.approvedRing || out.legacyBearing !== out.legacyRing) violations.push(t + ': rigid pair visibility')
      if ((t < 35 || t >= 39) && out.witnesses) violations.push(t + ': witnesses')
      if (t < 39 && out.neighbours !== 0) violations.push(t + ': neighbours')
    }
    expect(violations).toEqual([])
  })

  it('establishes witnesses before the rigid slide and holds its endpoint before fading', () => {
    const out = createShaftSchedule()
    for (const t of [35.1, 35.5, 35.6]) {
      sampleShaftSchedule(t, out); expect(out.witnesses).toBe(true); expect(out.supportBlend).toBe(0)
    }
    sampleShaftSchedule(36.6, out); expect(out.supportBlend).toBeCloseTo(0.5, 12)
    for (const t of [37.6, 38, 38.5]) {
      sampleShaftSchedule(t, out); expect(out.supportBlend).toBe(1); expect(out.endpointHeld).toBe(true); expect(out.legacyBearing).toBeCloseTo(0.16)
    }
    sampleShaftSchedule(39, out); expect(out.witnesses).toBe(false); expect(out.section).toBe(false)
    sampleShaftSchedule(40.5, out); expect(out.neighbours).toBe(1)
    sampleShaftSchedule(43, out); expect(out.neighbours).toBe(1); expect(out.approvedShaft).toBe(1)
  })
})
