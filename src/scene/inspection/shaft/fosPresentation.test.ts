import { describe, expect, it } from 'vitest'
import {
  FOS_ATTEMPTS, FOS_MAX, FOS_MIN, FOS_REVISED, FOS_STOPS, attemptFosAt, fosColor, fosForCard, fosGlsl, newFosPresentation, sampleFosPresentation,
} from './fosPresentation'
import { createShaftScriptFrame, sampleShaftScript } from './script'

const hue = ([r, g, b]: number[]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return ((h * 60) + 360) % 360
}

describe('FOS presentation table (S2)', () => {
  it('orders the attempted alloys 4140 < 4340 < C300, all below 1.0 and inside the bar', () => {
    expect(FOS_ATTEMPTS['4140']).toBeLessThan(FOS_ATTEMPTS['4340'])
    expect(FOS_ATTEMPTS['4340']).toBeLessThan(FOS_ATTEMPTS.c300)
    for (const v of Object.values(FOS_ATTEMPTS)) { expect(v).toBeLessThan(1); expect(v).toBeGreaterThan(FOS_MIN) }
    expect([FOS_ATTEMPTS['4140'], FOS_ATTEMPTS['4340'], FOS_ATTEMPTS.c300]).toEqual([0.55, 0.72, 0.9])
    expect(fosForCard('4340')).toBe(0.72); expect(fosForCard('4340-ht')).toBeNull(); expect(fosForCard('none')).toBeNull()
  })

  it('maps every attempted value to a warm red/orange and the revised study to blue shades only', () => {
    for (const v of Object.values(FOS_ATTEMPTS)) { const h = hue(fosColor(v)); expect(h).toBeGreaterThanOrEqual(0); expect(h).toBeLessThanOrEqual(35) }
    // red channel dominates below 1.0
    for (const v of Object.values(FOS_ATTEMPTS)) { const [r, g, b] = fosColor(v); expect(r).toBeGreaterThan(g); expect(r).toBeGreaterThan(b) }
    for (const v of [FOS_REVISED.hotspot, 2.6, FOS_MAX]) { const [r, , b] = fosColor(v); expect(b).toBeGreaterThan(r) ; const h = hue(fosColor(v)); expect(h).toBeGreaterThan(180); expect(h).toBeLessThan(250) }
    // bar structure: red -> orange -> yellow -> green -> cyan -> blue
    const hues = [0.2, 0.7, 1.05, 1.5, 2.1, 2.5, 3].map(v => hue(fosColor(v)))
    expect(hues[0]).toBeLessThan(15); expect(hues[2]).toBeGreaterThan(45); expect(hues[2]).toBeLessThan(70)
    expect(hues[3]).toBeGreaterThan(90); expect(hues[3]).toBeLessThan(135)
    expect(hues[5]).toBeGreaterThan(185); expect(hues[6]).toBeGreaterThan(215)
  })

  it('emits the same colour stops into the shader that the DOM bar reads', () => {
    const glsl = fosGlsl()
    for (const s of FOS_STOPS) expect(glsl).toContain(`vec4(${s[0].toFixed(3)}, ${s[1].toFixed(3)}, ${s[2].toFixed(3)}, ${s[3].toFixed(3)})`)
    expect(glsl).toContain('vec3 jgFosColor(float fos)')
  })

  it('eases the hotspot FOS across the two alloy swaps and is exact on each plateau', () => {
    expect(attemptFosAt(15)).toBeCloseTo(0.55, 12); expect(attemptFosAt(17.5)).toBeCloseTo(0.55, 12)
    expect(attemptFosAt(18.2)).toBeCloseTo(0.72, 12); expect(attemptFosAt(20)).toBeCloseTo(0.72, 12)
    expect(attemptFosAt(20.8)).toBeCloseTo(0.9, 12); expect(attemptFosAt(22.5)).toBeCloseTo(0.9, 12)
    expect(attemptFosAt(17.8)).toBeCloseTo((0.55 + 0.72) / 2, 9)
    let last = 0
    for (let t = 15; t <= 22.6; t += 0.01) { const v = attemptFosAt(t); expect(v).toBeGreaterThanOrEqual(last - 1e-12); last = v }
  })

  it('panels and field share one opacity (onset within a frame) and the revised study prints no number', () => {
    const out = newFosPresentation(), script = createShaftScriptFrame()
    const at = (t: number) => { sampleShaftScript(t, false, script); return sampleFosPresentation(t, script.stress, script.stressMix, out) }
    expect(at(14.99).opacity).toBe(0); expect(at(14.99).kind).toBe('none')
    expect(at(15.02).kind).toBe('attempt'); expect(at(15.02).opacity).toBeGreaterThan(0)
    expect(at(15.02).opacity).toBe(script.stressMix)
    expect(at(16).hotspot).toBeCloseTo(0.55, 9)
    expect(at(21).hotspot).toBeCloseTo(0.9, 9)
    expect(at(32.7).kind).toBe('none')
    expect(at(32.85).kind).toBe('revised'); expect(at(32.85).opacity).toBe(script.stressMix)
    const revised = at(34)
    expect(revised.hotspot).toBe(FOS_REVISED.hotspot); expect(revised.body).toBe(FOS_MAX)
    expect(at(36).opacity).toBe(0)
    // determinism: seek order independent
    const times = [34, 16, 21, 15.5, 33.2, 40]
    const forward = times.map(t => ({ ...at(t) })), reverse = [...times].reverse().map(t => ({ ...at(t) })).reverse()
    expect(reverse).toEqual(forward)
  })
})
