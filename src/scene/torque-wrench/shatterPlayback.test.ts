import { describe, expect, it } from 'vitest'
import { createShatterPlayback, SHATTER_PLAYBACK_SECONDS } from './shatterPlayback'

describe('authored shatter playback', () => {
  it('starts only on a forward crossing with deliberate input, never reload/seek/reverse', () => {
    for (const [a,b,intent] of [[.44,.439,true],[.429,.44,false],[.5,.44,true]] as const) {
      const c = createShatterPlayback(); c.update(a, 0, false, false)
      expect(c.update(b,.016,intent,false)).toBeNull(); expect(c.active).toBe(false)
    }
    const c = createShatterPlayback()
    expect(c.update(.44, 0, true, false)).toBeNull()
    c.update(.429,0,false,false)
    expect(c.update(.431,.016,true,false)).toBe(.43)
    expect(c.active).toBe(true)
  })
  it('ignores wheel jitter while active and completes exactly at .452', () => {
    const c = createShatterPlayback(); c.update(.429,0,false,false); c.update(.431,0,true,false)
    let p = .43
    for (let i=0;i<SHATTER_PLAYBACK_SECONDS*60+2;i++) {
      const next = c.update(i%2 ? .439 : .431,1/60,true,false)
      if (next !== null) { expect(next).toBeGreaterThanOrEqual(p); p = next }
    }
    expect(p).toBe(.452); expect(c.active).toBe(false)
  })
  it('lets Free Look cancel immediately and rearms only after backing out', () => {
    const c=createShatterPlayback(); c.update(.429,0,false,false); c.update(.431,0,true,false)
    expect(c.update(.434,.016,true,true)).toBeNull(); expect(c.active).toBe(false)
    expect(c.update(.435,.016,true,false)).toBeNull()
    c.update(.425,0,false,false); expect(c.update(.431,0,true,false)).toBe(.43)
  })
  it('caps long frames so a stalled tab cannot skip the sweep', () => {
    const c=createShatterPlayback(); c.update(.429,0,false,false); c.update(.431,0,true,false)
    c.update(.43,10,false,false); expect(c.elapsed).toBe(.1)
  })
})
