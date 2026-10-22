import { describe, expect, it } from 'vitest'
import {
  C2_PREVIEW_SHIFT, C2_SEQUENCE, MECHANISM_TRANSLATION, RING_ANCHOR_PROGRESS,
  sampleMechanism, type MechanismSample,
} from './MechanismDirector'

const smooth = (value: number) => { const u = Math.max(0, Math.min(1, value)); return u * u * (3 - 2 * u) }
const fresh = (): MechanismSample => ({ shift: 0, explode: 0, gearAngle: 0, idle: 0, ghostOpacity: 1 })
/** Independent restatement of the pre-T5 law (shift .46/.055, explode .575/.075, gears .52/.17, ghost .52/.035-.64/.03). */
const baseline = (p: number) => {
  const close = 1 - smooth((p - 0.94) / 0.04)
  const ghost = smooth((p - 0.52) / 0.035) * (1 - smooth((p - 0.64) / 0.03))
  return { shift: smooth((p - 0.46) / 0.055) * close, explode: smooth((p - 0.575) / 0.075) * close,
    gearAngle: Math.PI * 8 * smooth((p - 0.52) / 0.17) * close, ghostOpacity: 1 - ghost * 0.85 }
}

describe('JG-038 T5 mechanism translation and C2 sequence switch', () => {
  it('defaults to an explicitly labelled variant and keeps S0 at exactly 12 of 120 degrees', () => {
    expect(['preview12', 'fullAfter']).toContain(C2_SEQUENCE)
    expect(C2_PREVIEW_SHIFT).toBe(0.1)
    expect(C2_PREVIEW_SHIFT * 120).toBeCloseTo(12, 12)
    expect(C2_PREVIEW_SHIFT * 9.525).toBeCloseTo(0.9525, 12)
    expect(MECHANISM_TRANSLATION).toBeCloseTo(0.045, 12)
  })

  it.each(['preview12', 'fullAfter'] as const)('translates explode, gears and ghost exactly by +.045 (%s)', (sequence) => {
    for (let p = 0.505; p <= 0.735 + 1e-9; p += 0.0005) {
      const now = sampleMechanism(p, fresh(), sequence), then = baseline(p - MECHANISM_TRANSLATION)
      expect(now.explode).toBeCloseTo(then.explode, 9)
      expect(now.gearAngle).toBeCloseTo(then.gearAngle, 9)
      expect(now.ghostOpacity).toBeCloseTo(then.ghostOpacity, 9)
      // Doc39 retimes only shift; all other mechanical channels retain translation.
      expect(now.idle).toBe(0)
    }
  })

  it('holds explode, gears and ghost at rest through the whole ring window', () => {
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
