import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigateToStation, SPATIAL_STATIONS } from './scrollStore'
import { rawScrollFor } from '../scene/drawing/introTimeline'

describe('navigateToStation (paced-axis conversion)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('converts the paced station progress to raw scroll before scrolling', () => {
    const maxScroll = 27_180
    const scrollTo = vi.fn()
    vi.stubGlobal('window', { innerHeight: 900, scrollTo })
    vi.stubGlobal('document', { documentElement: { scrollHeight: maxScroll + 900 } })

    navigateToStation(1) // STATION 02, paced 0.60

    expect(scrollTo).toHaveBeenCalledTimes(1)
    const call = scrollTo.mock.calls[0][0]
    expect(call.top).toBeCloseTo(maxScroll * rawScrollFor(SPATIAL_STATIONS[1].scrollProgress), 9)
    // The regression this pins: the old raw multiply landed 0.60 * maxScroll,
    // which pacedProgress maps back to ~0.497 — chapter 1, just under chapter
    // 2's paced 0.50 start, so station 2 never highlighted.
    expect(call.top).not.toBeCloseTo(maxScroll * SPATIAL_STATIONS[1].scrollProgress, 3)
    expect(call.behavior).toBe('smooth')
  })

  it('is a no-op without a window (SSR safety)', () => {
    expect(() => navigateToStation(0)).not.toThrow()
  })
})
