import { describe, expect, it } from 'vitest'
import { MeshStandardMaterial } from 'three'
import { copyMaterialFade } from './surroundingFade'

describe('surrounding fade depth policy', () => {
  it('keeps restored exterior in one render pass until private geometry relinquishes ownership', () => {
    const source = new MeshStandardMaterial(), clone = source.clone()
    for (const fade of [.25, .5, .999, 1]) {
      copyMaterialFade(source, clone, fade, true)
      expect(clone.transparent).toBe(true); expect(clone.depthWrite).toBe(false)
    }
    copyMaterialFade(source, clone, 1, false)
    expect(clone.transparent).toBe(false); expect(clone.depthWrite).toBe(true)
    source.dispose(); clone.dispose()
  })
  it('has no half-opacity depth switch in forward, reverse or shuffled seeks', () => {
    const source = new MeshStandardMaterial(), clone = source.clone()
    for (const fade of [1, .999, .75, .501, .5, .499, .25, 0, .25, .499, .5, .501, .75, 1, .7, .3, 1]) {
      copyMaterialFade(source, clone, fade)
      expect(clone.opacity).toBe(fade)
      expect(clone.depthWrite).toBe(fade === 1)
      expect(clone.transparent).toBe(fade < 1)
    }
    source.dispose(); clone.dispose()
  })
  it('uses effective ghost opacity and preserves source state', () => {
    const source = new MeshStandardMaterial({ opacity: .28, transparent: true }), clone = source.clone()
    for (const fade of [1, .9, .51, .49, .1, 0, 1]) {
      copyMaterialFade(source, clone, fade)
      expect(clone.opacity).toBeCloseTo(.28 * fade)
      expect(clone.depthWrite).toBe(false)
      expect(source.opacity).toBe(.28)
      expect(source.depthWrite).toBe(true)
    }
    source.dispose(); clone.dispose()
  })
})
