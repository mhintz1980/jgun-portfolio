import { describe, expect, it } from 'vitest'
import {
  C2_PREVIEW_SHIFT, C2_SEQUENCE, MECHANISM_TRANSLATION, RING_ANCHOR_PROGRESS,
  sampleMechanism, type MechanismSample,
} from './MechanismDirector'

const smooth = (value: number) => { const u = Math.max(0, Math.min(1, value)); return u * u * (3 - 2 * u) }
const fresh = (): MechanismSample => ({ shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
/** Independent restatement of the pre-T5 motion law; housing stays solid. */
const baseline = (p: number) => {
  const close = 1 - smooth((p - 0.94) / 0.04)
  return { shift: smooth((p - 0.46) / 0.055) * close, explode: smooth((p - 0.575) / 0.075) * close,
    gearAngle: Math.PI * 8 * smooth((p - 0.52) / 0.17) * close }
}

describe('JG-038 T5 mechanism translation and C2 sequence switch', () => {
  it('defaults to an explicitly labelled variant and keeps S0 at exactly 12 of 120 degrees', () => {
    expect(['preview12', 'fullAfter']).toContain(C2_SEQUENCE)
    expect(C2_PREVIEW_SHIFT).toBe(0.1)
    expect(C2_PREVIEW_SHIFT * 120).toBeCloseTo(12, 12)
    expect(C2_PREVIEW_SHIFT * 9.525).toBeCloseTo(0.9525, 12)
    expect(MECHANISM_TRANSLATION).toBeCloseTo(0.045, 12)
  })

  it.each(['preview12', 'fullAfter'] as const)('translates explode and gears exactly by +.045 with solid housing (%s)', (sequence) => {
    for (let p = 0.505; p <= 0.735 + 1e-9; p += 0.0005) {
      const now = sampleMechanism(p, fresh(), sequence), then = baseline(p - MECHANISM_TRANSLATION)
      expect(now.explode).toBeCloseTo(then.explode, 9)
      expect(now.gearAngle).toBeCloseTo(then.gearAngle, 9)
      expect(now.ghostOpacity).toBe(1)
      // Doc39 retimes only shift; explode and gears retain translation.
      expect(now.idle).toBe(0)
    }
  })

  it('holds explode and gears at rest with solid housing through the whole ring window', () => {
    for (let p = 0; p <= 0.505; p += 0.001) for (const sequence of ['preview12', 'fullAfter'] as const) {
      const s = sampleMechanism(p, fresh(), sequence)
      expect(s.explode).toBe(0); expect(s.gearAngle).toBe(0); expect(s.ghostOpacity).toBe(1)
    }
  })

  it('fullAfter keeps shift 0 through the study; preview12 plateaus at S0 on [.469,.505] and reaches 1', () => {
    for (let p = 0; p <= 0.505; p += 0.0005) expect(sampleMechanism(p, fresh(), 'fullAfter').shift).toBe(0)
    for (let p = 0.469; p <= 0.505 + 1e-12; p += 0.0005) {
      expect(sampleMechanism(p, fresh(), 'preview12').shift).toBeCloseTo(C2_PREVIEW_SHIFT, 12)
    }
    expect(sampleMechanism(0.4655, fresh(), 'preview12').shift).toBe(0)
    expect(sampleMechanism(0.56, fresh(), 'preview12').shift).toBeCloseTo(1, 12)
    expect(sampleMechanism(0.56, fresh(), 'fullAfter').shift).toBeCloseTo(1, 12)
  })

  it.each(['preview12', 'fullAfter'] as const)('shift is monotone up to the close and reverse samples equal forward samples (%s)', (sequence) => {
    const forward: number[] = []
    let prior = 0
    for (let i = 0; i <= 940; i++) {
      const s = sampleMechanism(i / 1000, fresh(), sequence).shift
      expect(s).toBeGreaterThanOrEqual(prior - 1e-12); prior = s; forward.push(s)
    }
    for (let i = 940; i >= 0; i--) expect(sampleMechanism(i / 1000, fresh(), sequence).shift).toBe(forward[i])
  })

  it('anchors the ring in the S0 explode-0 pose and leaves the close and shaft ranges untouched', () => {
    const anchor = sampleMechanism(RING_ANCHOR_PROGRESS, fresh())
    expect(anchor.explode).toBe(0)
    for (const p of [0.94, 0.96, 1]) {
      const s = sampleMechanism(p, fresh()), then = baseline(p)
      expect(s.explode).toBeCloseTo(then.explode, 12)
      expect(s.gearAngle).toBeCloseTo(then.gearAngle, 12)
    }
    expect(() => sampleMechanism(NaN, fresh())).toThrow(/finite/)
  })
})

describe('solid housing through explosion and return', () => {
  it.each([undefined, 'preview12', 'fullAfter'] as const)(
    'stays exactly opaque on forward, reverse and shuffled seeks (%s)',
    (sequence) => {
      // .001 spacing includes the entire .52-.70 mechanism interval and
      // .94-.98 collapse. 137 is coprime to 1001, so the
      // shuffled order visits every checkpoint once without a random seed.
      const forward = Array.from({ length: 1001 }, (_, i) => i / 1000)
      const reverse = [...forward].reverse()
      const shuffled = forward.map((_, i) => forward[(i * 137) % forward.length])
      const expected = forward.map((p) => ({ ...sampleMechanism(p, fresh(), sequence) }))
      const out = fresh()
      out.ghostOpacity = 0.15
      for (const order of [forward, reverse, shuffled]) {
        for (const p of order) {
          const sampled = sampleMechanism(p, out, sequence)
          expect(sampled).toBe(out)
          expect(sampled.ghostOpacity).toBe(1)
          expect(sampled).toEqual(expected[Math.round(p * 1000)])
        }
      }
      // Constant opacity must not suppress extraction or its assembled return.
      expect(sampleMechanism(0.62, out, sequence).explode).toBeCloseTo(0, 12)
      expect(sampleMechanism(0.6575, out, sequence).explode).toBeCloseTo(0.5, 12)
      expect(sampleMechanism(0.70, out, sequence).explode).toBe(1)
      expect(sampleMechanism(0.94, out, sequence).explode).toBe(1)
      expect(sampleMechanism(0.96, out, sequence).explode).toBeCloseTo(0.5, 12)
      expect(sampleMechanism(0.98, out, sequence).explode).toBe(0)
      for (const p of [-1, 2]) expect(sampleMechanism(p, out, sequence).ghostOpacity).toBe(1)
    },
  )
})

it('settles first, then shifts exactly over .520-.545 so the red stripe is uncovered by the red view', () => {
  for (const p of [.46,.495,.505,.515,.520]) expect(sampleMechanism(p,fresh(),'fullAfter').shift).toBe(0)
  expect(sampleMechanism(.5325,fresh(),'fullAfter').shift).toBeCloseTo(.5,12)
  expect(sampleMechanism(.545,fresh(),'fullAfter').shift).toBe(1)
  expect(sampleMechanism(.56,fresh(),'fullAfter').shift).toBe(1)
  for (const p of [.520,.545]) {
    const h=1e-7, a=sampleMechanism(p-h,fresh()).shift,b=sampleMechanism(p,fresh()).shift,c=sampleMechanism(p+h,fresh()).shift
    expect(Math.abs((c-b)-(b-a))/h).toBeLessThan(.001)
  }
})
