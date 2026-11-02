import { describe, expect, it } from 'vitest'
import { rollingIndex } from './rolling'

describe('rollingIndex', () => {
  it('cycles through the phrases in order', () => {
    expect([0, 1, 2, 3, 4].map((t) => rollingIndex(t, 4).index)).toEqual([0, 1, 2, 3, 0])
  })

  it('stops on the first phrase after the set number of rounds', () => {
    expect(rollingIndex(7, 4, 2)).toEqual({ index: 3, done: false })
    expect(rollingIndex(8, 4, 2)).toEqual({ index: 0, done: true })
    expect(rollingIndex(50, 4, 2)).toEqual({ index: 0, done: true })
  })

  it('never rotates a single phrase', () => {
    expect(rollingIndex(3, 1)).toEqual({ index: 0, done: true })
  })
})
