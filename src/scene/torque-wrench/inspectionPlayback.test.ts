import { expect, it } from 'vitest'
import { createInspectionPlayback } from './inspectionPlayback'

it('explicit play advances only the inspection while visible, clamps drops, and exit freezes', () => {
  const playback = createInspectionPlayback()
  playback.open(); playback.play()
  expect(playback.advance(12, false)).toBe(0)
  expect(playback.advance(12, true)).toBeCloseTo(0.1 / 43)
  playback.pause()
  const hold = playback.snapshot().progress
  expect(playback.advance(0.1, true)).toBe(hold)
  playback.seek(0.8); playback.close()
  expect(playback.advance(0.1, true)).toBe(0.8)
  expect(playback.snapshot()).toEqual({ open: false, playing: false, progress: 0.8 })
  expect(() => playback.seek(NaN)).toThrow()
})
