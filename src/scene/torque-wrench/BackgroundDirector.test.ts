import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_LAYERS,
  createBackgroundSample,
  sampleBackground,
} from './backgroundLayers'
import { createPostProfile, samplePostProfile } from './postProfile'
import { computeRenderBudget } from './renderBudget'

describe('Torque wrench background state', () => {
  it('has three distinct depth planes and mutates one reusable sample deterministically', () => {
    expect(BACKGROUND_LAYERS.map((layer) => [layer.id, layer.depth, layer.parallaxRate])).toEqual([
      ['cavern-far', 24, 0.16],
      ['cavern-middle', 18, 0.28],
      ['atmosphere-near', 12, 0.42],
    ])

    const sample = createBackgroundSample()
    const layers = sample.layers
    const arrays = layers.flatMap((layer) => [layer.offset, layer.color])
    expect(sampleBackground(0.46, sample)).toBe(sample)
    const emergence = layers.map((layer) => ({ ...layer, offset: [...layer.offset], color: [...layer.color] }))
    sampleBackground(0.2, sample)
    sampleBackground(1, sample)
    sampleBackground(0.46, sample)
    expect(sample.layers).toBe(layers)
    expect(sample.layers.map((layer) => layer.offset)).toEqual(arrays.filter((_, index) => index % 2 === 0))
    expect(sample.layers.map((layer) => layer.color)).toEqual(arrays.filter((_, index) => index % 2 === 1))
    expect(sample.layers.map((layer) => layer.opacity)).toEqual(emergence.map((layer) => layer.opacity))
    expect(sample.layers.map((layer) => layer.offset)).toEqual(emergence.map((layer) => layer.offset))
    expect(sample.layers.map((layer) => layer.color)).toEqual(emergence.map((layer) => layer.color))
    expect(sample.active).toBe(true)
    expect(sample.pointerWeight).toBe(0)
  })

  it('keeps three distinct ordered source luminances below the pit highlight', () => {
    const sample = createBackgroundSample()
    const luminance = (color: readonly number[]) =>
      0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]
    for (const progress of [0, 0.46, 0.69, 1]) {
      sampleBackground(progress, sample)
      const [far, middle, near] = sample.layers.map(layer => luminance(layer.color))
      expect(middle).toBeGreaterThan(far * 2)
      expect(near).toBeGreaterThan(middle * 2)
      expect(near).toBeLessThan(0.2)
    }
  })

  it('keeps profile joins continuous and reading/fracture exposure at unity', () => {
    const background = createBackgroundSample()
    const post = createPostProfile()
    for (const progress of [0, 0.2, 0.32, 0.46, 0.65, 0.835, 0.94, 1]) {
      sampleBackground(progress, background)
      samplePostProfile(progress, post)
      const near = createBackgroundSample()
      const nearPost = createPostProfile()
      sampleBackground(progress + 0.001, near)
      samplePostProfile(progress + 0.001, nearPost)
      for (let index = 0; index < 3; index += 1) {
        expect(Math.abs(background.layers[index].opacity - near.layers[index].opacity)).toBeLessThan(0.01)
        expect(Math.abs(background.layers[index].scale - near.layers[index].scale)).toBeLessThan(0.01)
        expect(Math.hypot(
          background.layers[index].color[0] - near.layers[index].color[0],
          background.layers[index].color[1] - near.layers[index].color[1],
          background.layers[index].color[2] - near.layers[index].color[2],
        )).toBeLessThan(0.01)
      }
      expect(Math.abs(post.exposure - nearPost.exposure)).toBeLessThan(0.001)
    }

    for (const progress of [0, 0.16, 0.32, 0.46]) {
      const identity = samplePostProfile(progress, post)
      expect(identity.exposure).toBe(1)
      expect(identity.saturation).toBe(1)
      expect(identity.vignette).toBe(0)
    }
  })

  it('rejects invalid state while clamping finite narrative overshoot', () => {
    const background = createBackgroundSample()
    const post = createPostProfile()
    sampleBackground(-2, background)
    sampleBackground(2, background)
    expect(background.layers[2].offset[0]).toBe(0.42)
    samplePostProfile(-2, post)
    samplePostProfile(2, post)
    expect(post.exposure).toBe(1)
    expect(() => sampleBackground(Number.NaN, background)).toThrow(RangeError)
    expect(() => samplePostProfile(Number.POSITIVE_INFINITY, post)).toThrow(RangeError)
    expect(() => computeRenderBudget(0, 900, 1, 'full')).toThrow(RangeError)
    expect(() => computeRenderBudget(1440, 900, Number.NaN, 'full')).toThrow(RangeError)
    const invalidTier = 'poster' as unknown as Parameters<typeof computeRenderBudget>[3]
    expect(() => computeRenderBudget(1440, 900, 1, invalidTier)).toThrow(TypeError)
  })

  it('computes authoritative floor buffers within full and lite caps', () => {
    const cases = [
      { width: 1440, height: 900, deviceDpr: 1, tier: 'full' as const, dpr: 1, widthPx: 1440, heightPx: 900 },
      { width: 390, height: 844, deviceDpr: 3, tier: 'full' as const, dpr: 1.5, widthPx: 585, heightPx: 1266 },
      { width: 2560, height: 1440, deviceDpr: 2, tier: 'full' as const, dpr: 1, widthPx: 2560, heightPx: 1440 },
      { width: 2560, height: 1440, deviceDpr: 2, tier: 'lite' as const, dpr: 1, widthPx: 2560, heightPx: 1440 },
      { width: 3840.5, height: 2160.25, deviceDpr: 2, tier: 'full' as const, dpr: 0.6665846937399963, widthPx: 2560, heightPx: 1439 },
    ]
    for (const expected of cases) {
      const budget = computeRenderBudget(expected.width, expected.height, expected.deviceDpr, expected.tier)
      expect(budget).toMatchObject({
        dpr: expected.dpr,
        widthPx: expected.widthPx,
        heightPx: expected.heightPx,
      })
      expect(budget.pixels).toBe(budget.widthPx * budget.heightPx)
      expect(budget.pixels).toBeLessThanOrEqual(budget.pixelLimit)
      expect(Math.floor(expected.width * budget.dpr)).toBe(budget.widthPx)
      expect(Math.floor(expected.height * budget.dpr)).toBe(budget.heightPx)
      expect(budget.deviceDpr).toBe(expected.deviceDpr)
      expect(budget.tier).toBe(expected.tier)
      expect(budget.pixelLimit).toBe(2560 * 1440)
    }

    expect(computeRenderBudget(844, 390, 3, 'lite').pixels).toBeLessThanOrEqual(2560 * 1440)
  })
})
