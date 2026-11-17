import { expect, it } from 'vitest'
import { Color, MeshStandardMaterial } from 'three'
import { applyShaftLook, STUDY_STEEL } from './shaftJourneyLook'
import { createJourneySample, sampleJourney } from './JourneyDirector'
const source = () =>
  new MeshStandardMaterial({ color: '#0d0d0d', metalness: 0.96, roughness: 0.28, envMapIntensity: 1.2 })
it('reproduces the source finish exactly at look 0 and the study steel at look 1, never touching the source', () => {
  const s = source(),
    c = s.clone()
  c.color.set('#ff0000')
  c.metalness = 0.1
  applyShaftLook(s, c, 0)
  expect([c.color.getHexString(), c.metalness, c.roughness, c.envMapIntensity]).toEqual(['0d0d0d', 0.96, 0.28, 1.2])
  applyShaftLook(s, c, 1)
  expect(c.color.getHexString()).toBe(new Color(STUDY_STEEL.color).getHexString())
  expect([c.metalness, c.roughness, c.envMapIntensity]).toEqual([
    STUDY_STEEL.metalness,
    STUDY_STEEL.roughness,
    STUDY_STEEL.envMapIntensity,
  ])
  expect([s.color.getHexString(), s.metalness, s.roughness, s.envMapIntensity]).toEqual(['0d0d0d', 0.96, 0.28, 1.2])
})
it('ramps monotonically between the two finishes', () => {
  const s = source(),
    c = s.clone()
  let previous = -1
  for (let i = 0; i <= 20; i++) {
    applyShaftLook(s, c, i / 20)
    const luma = c.color.r * 0.2126 + c.color.g * 0.7152 + c.color.b * 0.0722
    expect(luma).toBeGreaterThanOrEqual(previous)
    previous = luma
  }
})
it('keeps the source look C0 across every journey seam: 0 until .60, 1 on [.62,.845], back to 0 by .855', () => {
  const out = createJourneySample(),
    look = (p: number) => sampleJourney(p, true, out).sourceShaftLook
  for (const [p, expected] of [
    [0, 0],
    [0.585, 0],
    [0.6, 0],
    [0.62, 1],
    [0.7, 1],
    [0.8449999, 1],
    [0.845, 1],
    [0.855, 0],
    [0.93, 0],
  ] as const) {
    expect(look(p), 'p=' + p).toBeCloseTo(expected, 6)
  }
  for (const [a, b] of [
    [0.5999999, 0.6],
    [0.6199999, 0.62],
    [0.8449999, 0.845],
    [0.855, 0.8550001],
  ] as const) {
    expect(Math.abs(look(a) - look(b))).toBeLessThan(1e-4)
  }
  let previous = 0
  for (let i = 0; i <= 200; i++) {
    const v = look(0.6 + (0.02 * i) / 200)
    expect(v).toBeGreaterThanOrEqual(previous - 1e-12)
    previous = v
  }
})
