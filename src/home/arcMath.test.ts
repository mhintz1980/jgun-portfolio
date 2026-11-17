import { describe, expect, it } from 'vitest'
import {
  ARC_STEP,
  arcGeometry,
  arcPlace,
  arcVisible,
  indexAt,
  positionForProgress,
  ringOffset,
  ringSize,
  scrollTopForIndex,
  smoothToward,
  trackStages,
} from './arcMath'

describe('arc geometry', () => {
  it('puts the equator card flat, left of centre, on the hub line', () => {
    const g = arcGeometry(1440, 900)
    const flat = arcPlace(0, ARC_STEP, g)
    expect(flat.rot).toBeCloseTo(0)
    expect(flat.y).toBeCloseTo(g.hubY)
    expect(flat.x - g.cardW / 2).toBeGreaterThan(0)
    expect(flat.x + g.cardW / 2).toBeLessThan(1440 * 0.5)
  })

  it('sends later cards up the wheel and earlier cards down, symmetric about the equator', () => {
    const g = arcGeometry(1440, 900)
    const next = arcPlace(1, ARC_STEP, g)
    const prev = arcPlace(-1, ARC_STEP, g)
    expect(next.y).toBeLessThan(g.hubY)
    expect(prev.y).toBeGreaterThan(g.hubY)
    expect(next.x).toBeCloseTo(prev.x)
    expect(next.rot).toBeCloseTo(-prev.rot)
  })

  it('sizes cards from the stage height, shrinking only when the stage is very narrow', () => {
    const wide = arcGeometry(2000, 800)
    const phone = arcGeometry(390, 800)
    const sliver = arcGeometry(300, 800)
    expect(phone.cardW).toBeLessThan(wide.cardW)
    expect(phone.hubX + phone.radius + phone.cardW / 2).toBeLessThan(390)
    expect(sliver.cardW).toBeLessThan(wide.cardW)
    expect(sliver.cardW).toBeCloseTo(360 * (300 / 495))
  })

  it('matches the saved design sliders at the desktop stage size', () => {
    const g = arcGeometry(1440, 900)
    expect(g.cardW).toBe(360)
    expect(g.cardH).toBeCloseTo(360 / 1.3)
    expect(g.radius).toBe(1140)
    expect(arcPlace(0, ARC_STEP, g).x).toBe(300)
    expect(ARC_STEP).toBe(15)
  })

  it('stops painting cards far around the wheel or off the stage', () => {
    const g = arcGeometry(1440, 900)
    expect(arcVisible(arcPlace(0, ARC_STEP, g), g, 900)).toBe(true)
    expect(arcVisible(arcPlace(2, ARC_STEP, g), g, 900)).toBe(true)
    expect(arcVisible(arcPlace(3, ARC_STEP, g), g, 900)).toBe(false)
    expect(arcVisible(arcPlace(-7, ARC_STEP, g), g, 900)).toBe(false)
    expect(arcVisible(arcPlace(7, ARC_STEP, g), g, 900)).toBe(false)
  })

  it('fills the ring with repeats of a short set and wraps offsets about the equator', () => {
    expect(ringSize(0)).toBe(0)
    expect(ringSize(4)).toBe(12)
    expect(ringSize(6)).toBe(12)
    expect(ringSize(10)).toBe(10)
    expect(ringOffset(0, 0, 12)).toBe(0)
    expect(ringOffset(11, 0, 12)).toBe(-1)
    expect(ringOffset(5, 0, 12)).toBe(5)
    expect(ringOffset(6, 0, 12)).toBe(-6)
    expect(ringOffset(2, 3, 12)).toBe(-1)
  })
})

describe('arc scroll mapping', () => {
  it('maps progress to wheel position and back to a page scroll offset', () => {
    expect(positionForProgress(0, 5)).toBe(0)
    expect(positionForProgress(1, 5)).toBe(4)
    expect(positionForProgress(2, 5)).toBe(4)
    expect(scrollTopForIndex(2, 5, 1000, 2400)).toBe(2200)
    expect(scrollTopForIndex(9, 5, 1000, 2400)).toBe(3400)
    expect(scrollTopForIndex(0, 1, 1000, 0)).toBe(1000)
  })

  it('rounds to the nearest card and stays in range', () => {
    expect(indexAt(1.49, 5)).toBe(1)
    expect(indexAt(1.5, 5)).toBe(2)
    expect(indexAt(-3, 5)).toBe(0)
    expect(indexAt(9, 5)).toBe(4)
  })

  it('smooths toward the target and lands exactly on it', () => {
    const a = smoothToward(0, 1, 16)
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThan(1)
    expect(smoothToward(0.9995, 1, 16)).toBe(1)
  })

  it('gives each card step 0.6 stage heights of pinned scroll', () => {
    expect(trackStages(1)).toBe(1)
    expect(trackStages(5)).toBeCloseTo(1 + 4 * 0.6)
  })
})
