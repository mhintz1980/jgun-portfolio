import { describe, expect, it } from 'vitest'
import { DRAWING_LAYERS } from './content'
import {
  DIM_OPACITY,
  FOCUS_OPACITY,
  FOCUS_SCALE,
  MAX_REST_OPACITY,
  REST_OPACITY,
  focusRole,
  focusTransform,
  ghostOpacity,
  layerBox,
  scrollTransform,
  sweepPosition,
  transformCss,
  visibleLayers,
} from './vaultMath'

const viewport = { width: 1440, height: 900 }
const housing = DRAWING_LAYERS.find((layer) => layer.id === 'gearbox-housing')!

describe('visibleLayers', () => {
  it('shows 6 on desktop and the 3 primary ones on phones and with reduced motion', () => {
    expect(visibleLayers(DRAWING_LAYERS, { phone: false, reduced: false })).toHaveLength(6)
    const phone = visibleLayers(DRAWING_LAYERS, { phone: true, reduced: false })
    expect(phone).toHaveLength(3)
    expect(phone.every((layer) => layer.primary)).toBe(true)
    expect(new Set(phone.map((layer) => layer.project)).size).toBe(3)
    expect(visibleLayers(DRAWING_LAYERS, { phone: false, reduced: true })).toHaveLength(3)
  })
})

describe('layerBox', () => {
  it('sizes from w and the mask aspect ratio, centred at cx, cy', () => {
    const box = layerBox(housing, viewport, false)
    expect(box.width).toBeCloseTo(720)
    expect(box.height).toBeCloseTo(720 * (750 / 1440))
    expect(box.left + box.width / 2).toBeCloseTo(0.7 * 1440)
    expect(box.top + box.height / 2).toBeCloseTo(0.3 * 900)
  })
  it('uses wPhone on phones', () => {
    expect(layerBox(housing, { width: 390, height: 844 }, true).width).toBeCloseTo(390 * 1.15)
  })
})

describe('scrollTransform', () => {
  it('is identity at scroll 0', () => {
    expect(scrollTransform(housing, 0)).toEqual({ x: 0, y: 0, scale: 1 })
  })
  it('drifts dx, dy px and ds scale per 1000 px', () => {
    const t = scrollTransform(housing, 2000)
    expect(t.x).toBeCloseTo(120)
    expect(t.y).toBeCloseTo(-280)
    expect(t.scale).toBeCloseTo(1.1)
  })
  it('stays static with reduced motion', () => {
    expect(scrollTransform(housing, 5000, true)).toEqual({ x: 0, y: 0, scale: 1 })
  })
  it('never collapses the scale on very long pages', () => {
    const shrinking = DRAWING_LAYERS.find((layer) => layer.ds < 0)!
    expect(scrollTransform(shrinking, 1e6).scale).toBeGreaterThanOrEqual(0.5)
  })
})

describe('focus', () => {
  it('keeps resting opacity in 0.10-0.14 and under the 0.18 cap', () => {
    expect(REST_OPACITY).toBeGreaterThanOrEqual(0.1)
    expect(REST_OPACITY).toBeLessThanOrEqual(0.14)
    expect(REST_OPACITY).toBeLessThanOrEqual(MAX_REST_OPACITY)
  })
  it('brings the focused project forward and dims the others', () => {
    expect(focusRole(housing, null)).toBe('rest')
    expect(focusRole(housing, 'torque-wrench')).toBe('focused')
    expect(focusRole(housing, 'armament')).toBe('dimmed')
    expect(ghostOpacity('focused')).toBe(FOCUS_OPACITY)
    expect(ghostOpacity('dimmed')).toBe(DIM_OPACITY)
    expect(FOCUS_OPACITY).toBeLessThanOrEqual(0.3)
  })
  it('eases the focused layer 20% toward the centre and scales it', () => {
    const t = focusTransform(housing, 'focused', viewport)
    expect(t.x).toBeCloseTo((0.5 - 0.7) * 1440 * 0.2)
    expect(t.y).toBeCloseTo((0.5 - 0.3) * 900 * 0.2)
    expect(t.scale).toBe(FOCUS_SCALE)
  })
  it('does not move with reduced motion or when not focused', () => {
    expect(focusTransform(housing, 'focused', viewport, true)).toEqual({ x: 0, y: 0, scale: 1 })
    expect(focusTransform(housing, 'dimmed', viewport)).toEqual({ x: 0, y: 0, scale: 1 })
  })
})

describe('transformCss', () => {
  it('writes a translate3d + scale', () => {
    expect(transformCss({ x: 1, y: -2.25, scale: 1.06 })).toBe('translate3d(1.0px, -2.3px, 0) scale(1.0600)')
  })
})

describe('sweepPosition', () => {
  it('is a pure function of scroll', () => {
    expect(sweepPosition(1234, viewport)).toEqual(sweepPosition(1234, viewport))
  })
  it('stays inside the viewport and moves with scroll', () => {
    const phone = { width: 390, height: 844 }
    for (let y = 0; y <= 20000; y += 137) {
      const p = sweepPosition(y, phone)
      expect(p.x).toBeGreaterThanOrEqual(0.15 * 390 - 1e-9)
      expect(p.x).toBeLessThanOrEqual(0.85 * 390 + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(0.2 * 844 - 1e-9)
      expect(p.y).toBeLessThanOrEqual(0.8 * 844 + 1e-9)
    }
    const a = sweepPosition(0, phone)
    const b = sweepPosition(400, phone)
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(20)
  })
})
