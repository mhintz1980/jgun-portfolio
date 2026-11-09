import { describe, expect, it } from 'vitest'
import { TORQUE_BEATS } from './beats'
import { TORQUE_HUD_STEPS, torqueHudStepText } from './hudCopy'

describe('HUD step copy', () => {
  it('labels every beat except the ending hand-off, with no unknown ids', () => {
    const ids = TORQUE_BEATS.map((beat) => beat.id).filter((id) => id !== 'close-ownership')
    expect(Object.keys(TORQUE_HUD_STEPS).sort()).toEqual([...ids].sort())
  })
  it('keeps every step line short enough not to wrap on narrow', () => {
    for (const id of Object.keys(TORQUE_HUD_STEPS))
      expect(torqueHudStepText(id, TORQUE_HUD_STEPS[id].chapter)!.length).toBeLessThanOrEqual(36)
  })
  it('numbers steps only under their own displayed chapter', () => {
    expect(torqueHudStepText('inspection-isolation', 'mechanism')).toBe('03·3  Isolating the input shaft')
    expect(torqueHudStepText('inspection-return', 'mechanism')).toBe('Back to the gearbox')
    expect(torqueHudStepText('close-ownership', 'close')).toBeNull()
  })
  it('never presents cinematic cascade ratios as specs', () => {
    for (const step of Object.values(TORQUE_HUD_STEPS)) expect(step.label).not.toMatch(/3250|rpm|:1/i)
  })
})
