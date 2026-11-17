import { describe, expect, it } from 'vitest'
import { MeshStandardMaterial } from 'three'
import { copyMaterialFade } from './surroundingFade'

describe('surrounding fade depth policy', () => {
  it('keeps restored exterior in one render pass until private geometry relinquishes ownership', () => {
    const source = new MeshStandardMaterial(),
      clone = source.clone()
    for (const fade of [0.25, 0.5, 0.999, 1]) {
      copyMaterialFade(source, clone, fade, true)
      expect(clone.transparent).toBe(true)
      expect(clone.depthWrite).toBe(false)
    }
    copyMaterialFade(source, clone, 1, false)
    expect(clone.transparent).toBe(false)
    expect(clone.depthWrite).toBe(true)
    source.dispose()
    clone.dispose()
  })
  it('has no half-opacity depth switch in forward, reverse or shuffled seeks', () => {
    const source = new MeshStandardMaterial(),
      clone = source.clone()
    for (const fade of [1, 0.999, 0.75, 0.501, 0.5, 0.499, 0.25, 0, 0.25, 0.499, 0.5, 0.501, 0.75, 1, 0.7, 0.3, 1]) {
      copyMaterialFade(source, clone, fade)
      expect(clone.opacity).toBe(fade)
      expect(clone.depthWrite).toBe(fade === 1)
      expect(clone.transparent).toBe(fade < 1)
    }
    source.dispose()
    clone.dispose()
  })
  it('uses effective ghost opacity and preserves source state', () => {
    const source = new MeshStandardMaterial({ opacity: 0.28, transparent: true }),
      clone = source.clone()
    for (const fade of [1, 0.9, 0.51, 0.49, 0.1, 0, 1]) {
      copyMaterialFade(source, clone, fade)
      expect(clone.opacity).toBeCloseTo(0.28 * fade)
      expect(clone.depthWrite).toBe(false)
      expect(source.opacity).toBe(0.28)
      expect(source.depthWrite).toBe(true)
    }
    source.dispose()
    clone.dispose()
  })
})
