import { describe, expect, it } from 'vitest'
import { REDUCED_MOTION_QUERY, downgradeForReducedMotion } from './tier'

describe('torque tier policy', () => {
  it('steps any non-poster tier down to poster for reduced motion', () => {
    expect(downgradeForReducedMotion('full', true)).toBe('poster')
    expect(downgradeForReducedMotion('lite', true)).toBe('poster')
  })

  it('never upgrades: a poster tier stays poster and no reduced motion changes nothing', () => {
    expect(downgradeForReducedMotion('poster', true)).toBeNull()
    expect(downgradeForReducedMotion('full', false)).toBeNull()
    expect(downgradeForReducedMotion('lite', false)).toBeNull()
  })

  it('uses the shared reduced-motion query string for entry and mid-session listeners', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)')
  })
})
