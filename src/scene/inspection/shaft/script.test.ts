import { describe, expect, it } from 'vitest'
import { storyChapterAt } from '../story'
import { shaftBeat, shaftBeats, shaftStory } from './story'
import {
  createShaftScriptFrame, sampleShaftScript, SHAFT_ATTRIBUTION_TEXT, SHAFT_CARD_GAP, SHAFT_CARD_TEXT, SHAFT_IMPULSE,
  SHAFT_MATERIAL_ATTEMPTS, SHAFT_RECAP_CAPTION_TEXT, SHAFT_READABLE, SHAFT_STAMP_TEXT, SHAFT_STRESS_CAPTION_TEXT, type ShaftScriptFrame,
} from './script'

const STEP = 1 / 240
const DURATION = 43
const samples = (from: number, to: number): number[] => {
  const times: number[] = []
  for (let t = from; t <= to + STEP / 2; t += STEP) times.push(Math.min(t, to))
  return times
}
const snapshot = (f: ShaftScriptFrame): string => JSON.stringify([f.card, f.cardText, f.cardOpacity, f.stamp, f.stampScale, f.attribution, f.remainingTeeth, f.stressIllustrative, f.stress, f.stressMix, f.scanProgress, f.discrete])
const signature = (f: ShaftScriptFrame): string => [f.card, f.stamp, f.attribution, f.remainingTeeth, f.stressIllustrative, f.stress].join('|')
const visibleCard = (t: number): string => {
  const f = sampleShaftScript(t, false, createShaftScriptFrame())
  return f.cardOpacity > 0.05 ? f.card : 'none'
}

describe('shaft story metadata', () => {
  it('exports the exact authored chapters, assets, entry window and static alt', () => {
    expect(shaftStory.id).toBe('shaft-p001835')
    expect(shaftStory.kind).toBe('shaft')
    expect(shaftStory.version).toBe(1)
    expect(shaftStory.duration).toBe(43)
    expect(shaftStory.chapters.map(c => [c.id, c.label, c.start, c.end])).toEqual([
      ['why-groove', 'Why the groove was needed', 0, 15],
      ['materials', 'Material attempts', 15, 22.6],
      ['process', 'Changing the process', 22.6, 35],
      ['supports', 'Moving the supports', 35, 43],
    ])
    expect(shaftStory.assets).toHaveLength(2)
    expect({ ...shaftStory.assets[0] }).toEqual({ id: 'manufacturing-core', url: 'models/manufacturing-core-full.glb', tier: 'full', required: true, maxBytes: 2 * 1024 * 1024, sha256: null })
    expect({ ...shaftStory.assets[1] }).toEqual({ id: 'manufacturing-core', url: 'models/manufacturing-core-lite.glb', tier: 'lite', required: false, maxBytes: 2 * 1024 * 1024, sha256: null })
    expect(shaftStory.assets.filter(a => a.required)).toHaveLength(1)
    expect([...shaftStory.entryWindow]).toEqual([0.12, 0.525])
    expect(shaftStory.staticAlt).toBe('shaft-study')
    expect(Object.isFrozen(shaftStory)).toBe(true)
    expect(Object.isFrozen(shaftStory.chapters)).toBe(true)
    for (const chapter of shaftStory.chapters) expect(Object.isFrozen(chapter)).toBe(true)
  })
  it('keeps chapters contiguous over 0..43 and resolves them with storyChapterAt', () => {
    let end = 0
    for (const chapter of shaftStory.chapters) {
      expect(chapter.start).toBe(end)
      expect(chapter.end).toBeGreaterThan(chapter.start)
      end = chapter.end
    }
    expect(end).toBe(shaftStory.duration)
    expect(storyChapterAt(shaftStory, 0)).toBe(0)
    expect(storyChapterAt(shaftStory, 14.9)).toBe(0)
    expect(storyChapterAt(shaftStory, 15)).toBe(1)
    expect(storyChapterAt(shaftStory, 22.5)).toBe(1)
    expect(storyChapterAt(shaftStory, 22.6)).toBe(2)
    expect(storyChapterAt(shaftStory, 34.9)).toBe(2)
    expect(storyChapterAt(shaftStory, 35)).toBe(3)
    expect(storyChapterAt(shaftStory, 43)).toBe(3)
  })
  it('exports one frozen contiguous beat table covering 0..43', () => {
    expect(shaftBeats.map(b => [b.id, b.start, b.end])).toEqual([
      ['isolate', 0, 2],
      ['shaping', 2, 6],
      ['slow-exit', 6, 11],
      ['recap', 11, 15],
      ['materials', 15, 22.6],
      ['revised-blank', 22.6, 25],
      ['hobbing', 25, 32],
      ['runout-hold', 32, 35],
      ['supports', 35, 39],
      ['finale', 39, 43],
    ])
    let end = 0
    for (const b of shaftBeats) {
      expect(b.start).toBe(end)
      expect(b.end).toBeGreaterThan(b.start)
      end = b.end
      expect(Object.isFrozen(b)).toBe(true)
    }
    expect(end).toBe(DURATION)
    expect(Object.isFrozen(shaftBeats)).toBe(true)
    expect(shaftBeat('materials')).toMatchObject({ start: 15, end: 22.6 })
    expect(() => shaftBeat('unknown' as never)).toThrow()
  })
})

describe('authored strings', () => {
  it('matches the exact card, stamp, attribution and caption strings', () => {
    expect(Object.keys(SHAFT_CARD_TEXT)).toEqual(['4140', '4340', 'c300', '4340-ht'])
    expect(SHAFT_CARD_TEXT['4140']).toBe('AISI 4140 (40-45 HRC)')
    expect(SHAFT_CARD_TEXT['4340']).toBe('AISI 4340 (48-50 HRC)')
    expect(SHAFT_CARD_TEXT['c300']).toBe('C300 (56-58 HRC)')
    expect(SHAFT_CARD_TEXT['4340-ht']).toBe('AISI 4340 (H.T. 48-50 HRC)')
    expect(SHAFT_STAMP_TEXT).toBe('FAILED')
    expect(SHAFT_ATTRIBUTION_TEXT).toBe('Earlier material attempts, as recounted by the designer.')
    expect(SHAFT_STRESS_CAPTION_TEXT).toBe('Illustrative stress concentration')
    expect(SHAFT_RECAP_CAPTION_TEXT).toBe('Remaining teeth — time compressed')
  })
  it('pins ASCII hyphens in hardness ranges and the single em dash in the recap caption', () => {
    const dashLike = ['‐', '‑', '‒', '–', '—', '―', '−']
    for (const text of [...Object.values(SHAFT_CARD_TEXT), SHAFT_ATTRIBUTION_TEXT, SHAFT_STRESS_CAPTION_TEXT, SHAFT_STAMP_TEXT]) {
      for (const dash of dashLike) expect(text).not.toContain(dash)
      for (const ch of text) if (ch === '-') expect(ch.charCodeAt(0)).toBe(0x2d)
    }
    expect([...SHAFT_RECAP_CAPTION_TEXT].filter(ch => ch === '—')).toHaveLength(1)
    expect(SHAFT_RECAP_CAPTION_TEXT).not.toContain('-')
    for (const dash of dashLike.filter(d => d !== '—')) expect(SHAFT_RECAP_CAPTION_TEXT).not.toContain(dash)
  })
})

describe('material attempt schedule', () => {
  it('uses 2.8, 2.5 and 2.3 s attempts starting at 15 inside the materials beat', () => {
    expect(SHAFT_MATERIAL_ATTEMPTS.map(a => a.card)).toEqual(['4140', '4340', 'c300'])
    const lengths = SHAFT_MATERIAL_ATTEMPTS.map(a => a.end - a.start)
    expect(lengths[0]).toBeCloseTo(2.8, 9)
    expect(lengths[1]).toBeCloseTo(2.5, 9)
    expect(lengths[2]).toBeCloseTo(2.3, 9)
    expect(SHAFT_MATERIAL_ATTEMPTS[0].start).toBe(15)
    expect(SHAFT_MATERIAL_ATTEMPTS[2].end).toBe(22.6)
    expect(SHAFT_MATERIAL_ATTEMPTS[2].end - SHAFT_MATERIAL_ATTEMPTS[0].start).toBeCloseTo(7.6, 9)
    let end = 15
    for (const attempt of SHAFT_MATERIAL_ATTEMPTS) {
      expect(attempt.start).toBe(end)
      end = attempt.end
    }
    expect(end).toBe(shaftBeat('materials').end)
  })
  it('holds readable alloy text >= 1.0 s before FAILED, impulses <= 0.18 s and settles >= 0.8 s', () => {
    expect(SHAFT_READABLE).toBeGreaterThanOrEqual(1.0)
    expect(SHAFT_IMPULSE).toBeLessThanOrEqual(0.18)
    for (const attempt of SHAFT_MATERIAL_ATTEMPTS) {
      const frame = createShaftScriptFrame()
      let readable = 0
      let settledReadable = 0
      let impulseSamples = 0
      for (const t of samples(attempt.start, attempt.end - STEP)) {
        sampleShaftScript(t, false, frame)
        expect(frame.card).toBe(attempt.card)
        if (frame.stamp === 'none' && frame.cardOpacity > 0.999) readable += STEP
        if (frame.stamp === 'in') impulseSamples += 1
        if (frame.stamp === 'settled' && frame.cardOpacity > 0.999) settledReadable += STEP
      }
      expect(readable).toBeGreaterThanOrEqual(1.0 - STEP)
      expect(impulseSamples).toBeGreaterThan(0)
      expect(impulseSamples * STEP).toBeLessThanOrEqual(SHAFT_IMPULSE + STEP)
      expect(settledReadable).toBeGreaterThanOrEqual(0.8 - STEP)
    }
  })
  it('fades each card out distinctly before the next card and never shows two cards', () => {
    const frame = createShaftScriptFrame()
    for (let index = 0; index < SHAFT_MATERIAL_ATTEMPTS.length - 1; index++) {
      const attempt = SHAFT_MATERIAL_ATTEMPTS[index]
      let gapSamples = 0
      for (const t of samples(attempt.end - SHAFT_CARD_GAP, attempt.end - STEP / 2)) {
        sampleShaftScript(t, false, frame)
        if (frame.card === attempt.card && frame.cardOpacity === 0) gapSamples += 1
      }
      expect(gapSamples).toBeGreaterThan(0)
      sampleShaftScript(attempt.end + STEP, false, frame)
      expect(frame.card).toBe(SHAFT_MATERIAL_ATTEMPTS[index + 1].card)
    }
    const order: string[] = []
    let last = 'none'
    for (const t of samples(0, DURATION)) {
      const visible = visibleCard(t)
      if (visible !== last) {
        order.push(visible)
        last = visible
      }
    }
    expect(order).toEqual(['4140', 'none', '4340', 'none', 'c300', 'none', '4340-ht', 'none'])
  })
  it('stamps only inside the three attempts and scales down during the impulse', () => {
    const frame = createShaftScriptFrame()
    let lastScale = Number.POSITIVE_INFINITY
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, frame)
      if (t < 15 || t >= 22.6) expect(frame.stamp).toBe('none')
      if (frame.stamp === 'in') {
        expect(frame.stampScale).toBeGreaterThan(1)
        expect(frame.stampScale).toBeLessThanOrEqual(lastScale + 1e-12)
        lastScale = frame.stampScale
      }
      if (frame.stamp === 'settled') {
        expect(frame.stampScale).toBe(1)
        lastScale = Number.POSITIVE_INFINITY
      }
      expect(frame.cardOpacity).toBeGreaterThanOrEqual(0)
      expect(frame.cardOpacity).toBeLessThanOrEqual(1)
    }
  })
})

describe('captions and stress illustration', () => {
  it('shows attribution throughout 15..22.6 and the recap caption during 11..15', () => {
    const frame = createShaftScriptFrame()
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, frame)
      expect(frame.attribution).toBe(t >= 15 && t < 22.6)
      expect(frame.remainingTeeth).toBe(t >= 11 && t < 15)
    }
    sampleShaftScript(15 - 1e-9, false, frame)
    expect(frame.attribution).toBe(false)
    sampleShaftScript(15, false, frame)
    expect(frame.attribution).toBe(true)
    sampleShaftScript(22.6 - 1e-9, false, frame)
    expect(frame.attribution).toBe(true)
    sampleShaftScript(22.6, false, frame)
    expect(frame.attribution).toBe(false)
  })
  it('runs one warm scan from 15, holds to 22.6 and leaves with the old geometry by 25', () => {
    const frame = createShaftScriptFrame()
    let scans = 0
    let inScan = false
    let lastMix = -1
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, frame)
      if (t >= 15 && t < 25) {
        expect(frame.stress).toBe('warm')
        if (frame.scanProgress > 0 && frame.scanProgress < 1) {
          if (!inScan) {
            scans += 1
            inScan = true
          }
        } else if (frame.scanProgress === 1) inScan = false
        if (t >= 16.2 && t < 22.6) {
          expect(frame.scanProgress).toBe(1)
          expect(frame.stressMix).toBe(1)
        }
        if (t > 22.6 && t < 25) expect(frame.stressMix).toBeLessThanOrEqual(lastMix + 1e-12)
        lastMix = frame.stressMix
      } else {
        expect(frame.stress).not.toBe('warm')
      }
    }
    expect(scans).toBe(1)
    sampleShaftScript(25 - 1e-9, false, frame)
    expect(frame.stress).toBe('warm')
    expect(frame.stressMix).toBeLessThan(0.02)
    sampleShaftScript(25, false, frame)
    expect(frame.stress).toBe('none')
    expect(frame.stressMix).toBe(0)
    expect(frame.scanProgress).toBe(0)
  })
  it('starts the cool scan only after the 0.8 s runout hold and holds the final card to 35', () => {
    const frame = createShaftScriptFrame()
    let scans = 0
    let inScan = false
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, frame)
      if (t < 32.8) expect(frame.stress).not.toBe('cool')
      if (t >= 32.8 && t < 35) {
        expect(frame.stress).toBe('cool')
        expect(frame.stamp).toBe('none')
        if (frame.scanProgress > 0 && frame.scanProgress < 1) {
          if (!inScan) {
            scans += 1
            inScan = true
          }
        } else if (frame.scanProgress === 1) inScan = false
        if (t >= 34 && t < 34.7) {
          expect(frame.scanProgress).toBe(1)
          expect(frame.stressMix).toBe(1)
        }
      }
    }
    expect(scans).toBe(1)
    sampleShaftScript(32.8 - 1e-9, false, frame)
    expect(frame.stress).toBe('none')
    sampleShaftScript(32.8, false, frame)
    expect(frame.stress).toBe('cool')
    sampleShaftScript(33.2 - 1e-9, false, frame)
    expect(frame.card).toBe('none')
    sampleShaftScript(33.2, false, frame)
    expect(frame.card).toBe('4340-ht')
    expect(frame.cardText).toBe('AISI 4340 (H.T. 48-50 HRC)')
    expect(frame.stamp).toBe('none')
    sampleShaftScript(33.5, false, frame)
    expect(frame.cardOpacity).toBe(1)
    sampleShaftScript(34.8, false, frame)
    expect(frame.cardOpacity).toBe(1)
    sampleShaftScript(35 - 1e-9, false, frame)
    expect(frame.card).toBe('4340-ht')
    sampleShaftScript(35, false, frame)
    expect(frame.card).toBe('none')
    expect(frame.stress).toBe('none')
  })
})

describe('determinism, reduced motion and the discrete key', () => {
  it('is a pure function of time with identical output for any seek order', () => {
    let seed = 0x2f6e2b1
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    const times = Array.from({ length: 500 }, () => next() * 43)
    const expected = new Map(times.map(t => [t, snapshot(sampleShaftScript(t, false, createShaftScriptFrame()))]))
    const shuffled = [...times].sort(() => next() - 0.5)
    const frame = createShaftScriptFrame()
    for (const t of shuffled) {
      sampleShaftScript(t, false, frame)
      expect(snapshot(frame)).toBe(expected.get(t))
    }
    expect(snapshot(sampleShaftScript(-5, false, createShaftScriptFrame()))).toBe(snapshot(sampleShaftScript(0, false, createShaftScriptFrame())))
    expect(snapshot(sampleShaftScript(99, false, createShaftScriptFrame()))).toBe(snapshot(sampleShaftScript(43, false, createShaftScriptFrame())))
  })
  it('writes into a caller-owned frame without adding keys', () => {
    const frame = createShaftScriptFrame()
    const keysBefore = Object.keys(frame).slice().sort().join(',')
    expect(sampleShaftScript(16.2, false, frame)).toBe(frame)
    for (let i = 0; i < 240; i++) sampleShaftScript(i * 0.25, i % 3 === 0, frame)
    expect(Object.keys(frame).slice().sort().join(',')).toBe(keysBefore)
  })
  it('removes the stamp impulse and scan sweep under reduced motion but keeps fades', () => {
    const normal = createShaftScriptFrame()
    const reduced = createShaftScriptFrame()
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, normal)
      sampleShaftScript(t, true, reduced)
      expect(reduced.stampScale).toBe(1)
      expect(reduced.scanProgress === 0 || reduced.scanProgress === 1).toBe(true)
      expect(reduced.discrete).toBe(normal.discrete)
      expect(reduced.cardOpacity).toBe(normal.cardOpacity)
    }
    sampleShaftScript(15.2, true, reduced)
    expect(reduced.stressMix).toBeGreaterThan(0)
    expect(reduced.stressMix).toBeLessThan(1)
    sampleShaftScript(32.9, true, reduced)
    expect(reduced.stressMix).toBeGreaterThan(0)
    expect(reduced.stressMix).toBeLessThan(1)
  })
  it('changes the discrete key exactly when the discrete state changes', () => {
    const frame = createShaftScriptFrame()
    let prevKey: number | null = null
    let prevSig = ''
    const changeTimes: number[] = []
    for (const t of samples(0, DURATION)) {
      sampleShaftScript(t, false, frame)
      const sig = signature(frame)
      if (prevKey !== null) {
        expect(frame.discrete !== prevKey).toBe(sig !== prevSig)
        if (frame.discrete !== prevKey) changeTimes.push(t)
      }
      prevKey = frame.discrete
      prevSig = sig
    }
    expect(changeTimes).toHaveLength(15)
    expect(changeTimes.map(t => Number(t.toFixed(2)))).toEqual([11, 15, 16.16, 16.31, 17.8, 18.96, 19.11, 20.3, 21.46, 21.61, 22.6, 25, 32.8, 33.2, 35])
  })
})
