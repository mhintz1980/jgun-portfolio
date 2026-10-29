import { describe, expect, it } from 'vitest'
import {
  TORQUE_HOTSPOTS, isTorqueHotspotActive, isTorqueHotspotActiveForSample, layoutTorqueCallouts, leadersIntersect, segmentsIntersect,
  torqueCalloutReveal, type CalloutInput,
} from './hotspotData'

const ids = TORQUE_HOTSPOTS.map(item => item.id)
const activeAt = (p: number, explode = 1, surroundings = 1, ring = false, study = false, manual = false) =>
  ids.filter(id => isTorqueHotspotActive(id, p, explode, surroundings, ring, study, manual))

describe('torque hotspot gate (doc45 issue 5)', () => {
  it('shows no callout during the ring-switch knurling sequence', () => {
    for (let p = 0.46; p < 0.506; p += 0.0005) expect(activeAt(p)).toEqual([])
    expect(activeAt(0.48)).toEqual([])
  })

  it('shows no callout during input-shaft isolation and study', () => {
    for (let p = 0.56; p <= 0.855; p += 0.001) expect(activeAt(p)).toEqual([])
    expect(activeAt(0.59)).toEqual([])
    expect(activeAt(0.9, 1, 1, false, true)).toEqual([])
  })

  it('never has more than one callout active at any scroll position', () => {
    for (let p = 0; p <= 1; p += 0.0005) expect(activeAt(p).length).toBeLessThanOrEqual(1)
  })

  it('keeps suspended callouts inactive throughout the narrative', () => {
    for (let p = 0; p <= 1; p += 0.0005) {
      for (const id of ['clutch-housing', 'ring-switch', 'stage2-planet']) {
        expect(isTorqueHotspotActive(id, p, 1, 1, false, false, false)).toBe(false)
      }
    }
    expect(activeAt(0.52)).toEqual([])
    expect(activeAt(0.545)).toEqual([])
    expect(activeAt(0.905)).toEqual([])
    expect(activeAt(0.925)).toEqual([])
  })

  it('retains the LCD callout at its existing verifier checkpoint', () => {
    expect(activeAt(0.99)).toEqual(['lcd-manometer'])
    expect(activeAt(0.98)).toEqual([])
  })

  it('uses the same suspension gate for DOM samples even with visible anchors and existing focus', () => {
    for (const hotspot of TORQUE_HOTSPOTS) {
      const sample = {
        progress: (hotspot.window[0] + hotspot.window[1]) / 2, subjectTime: 0,
        studyVisible: false, manual: false, focusId: hotspot.id,
        anchors: [{ id: hotspot.id, x: 500, y: 400, visible: true, reason: '', occluder: '' }],
      }
      expect(isTorqueHotspotActiveForSample(hotspot.id, sample)).toBe(hotspot.id === 'lcd-manometer')
    }
  })

  it('blocks on manual, study, ring isolation, faded surroundings, unknown id and planet explode', () => {
    expect(activeAt(0.99, 1, 1, true)).toEqual([])
    expect(activeAt(0.99, 1, 0.5)).toEqual([])
    expect(activeAt(0.99, 1, 1, false, true)).toEqual([])
    expect(activeAt(0.99, 1, 1, false, false, true)).toEqual([])
    expect(activeAt(0.905, 0.4)).toEqual([])
    expect(isTorqueHotspotActive('not-a-part', 0.52, 1, 1, false, false, false)).toBe(false)
    expect(isTorqueHotspotActive('lcd-manometer', Number.NaN, 1, 1, false, false, false)).toBe(false)
  })

  it('draws the leader in and retracts it inside each window', () => {
    for (const hotspot of TORQUE_HOTSPOTS) {
      const [a, b] = hotspot.window
      expect(torqueCalloutReveal(hotspot.id, a)).toBe(0)
      expect(torqueCalloutReveal(hotspot.id, (a + b) / 2)).toBe(1)
      expect(torqueCalloutReveal(hotspot.id, b)).toBe(0)
    }
  })
})

describe('callout leader layout', () => {
  const viewport = { width: 1440, height: 900, top: 24, bottom: 96, side: 28 }

  it('detects crossing and non-crossing segments', () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true)
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false)
  })

  it('reproduces 05-2: three anchors near the gearbox centre get non-crossing leaders', () => {
    // Anchors from the screenshot: clutch, ring and LCD all near mid-frame.
    const inputs: CalloutInput[] = [
      { id: 'clutch-housing', anchor: { x: 735, y: 480 }, width: 300, height: 140 },
      { id: 'ring-switch', anchor: { x: 655, y: 478 }, width: 300, height: 110 },
      { id: 'lcd-manometer', anchor: { x: 20, y: 462 }, width: 300, height: 110 },
    ]
    const placed = layoutTorqueCallouts(inputs, viewport)
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) expect(leadersIntersect(placed[i].leader, placed[j].leader)).toBe(false)
    }
  })

  it('puts the card on the anchor side with a 3-point anchor -> elbow -> shelf leader', () => {
    const [right] = layoutTorqueCallouts([{ id: 'a', anchor: { x: 900, y: 500 }, width: 320, height: 150 }], viewport)
    expect(right.side).toBe(1)
    expect(right.left).toBeGreaterThan(900)
    expect(right.leader[2].x).toBe(right.left)
    expect(right.leader[1].y).toBe(right.leader[2].y)
    const [left] = layoutTorqueCallouts([{ id: 'b', anchor: { x: 500, y: 500 }, width: 320, height: 150 }], viewport)
    expect(left.side).toBe(-1)
    expect(left.left + left.width).toBeLessThan(500)
  })

  it('keeps cards inside the safe viewport', () => {
    for (const anchor of [{ x: 5, y: 5 }, { x: 1435, y: 895 }, { x: 720, y: 450 }]) {
      const [card] = layoutTorqueCallouts([{ id: 'c', anchor, width: 320, height: 150 }], viewport)
      expect(card.left).toBeGreaterThanOrEqual(28)
      expect(card.left + card.width).toBeLessThanOrEqual(1440 - 28)
      expect(card.top).toBeGreaterThanOrEqual(24)
      expect(card.top + card.height).toBeLessThanOrEqual(900 - 96)
    }
  })

  it('never returns crossing leaders or overlapping cards (randomised)', () => {
    let seed = 12345
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
    let kept = 0, total = 0
    for (let trial = 0; trial < 2000; trial++) {
      const narrow = trial % 3 === 0
      const vp = narrow ? { width: 390, height: 844, top: 16, bottom: 104, side: 12 } : viewport
      const count = 2 + Math.floor(rand() * 3)
      const inputs: CalloutInput[] = Array.from({ length: count }, (_, i) => ({
        id: `h${i}`, anchor: { x: rand() * vp.width, y: rand() * vp.height },
        width: narrow ? 200 : 260 + rand() * 80, height: 90 + rand() * 80,
      }))
      const placed = layoutTorqueCallouts(inputs, vp)
      total += count; kept += placed.length
      expect(placed.length).toBeGreaterThanOrEqual(1)
      expect(placed[0].id).toBe('h0')
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          expect(leadersIntersect(placed[i].leader, placed[j].leader)).toBe(false)
          const a = placed[i], b = placed[j]
          const overlap = a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
          expect(overlap).toBe(false)
        }
      }
    }
    // Same-side sorting should keep most callouts, not just drop the crossings.
    expect(kept / total).toBeGreaterThan(0.6)
  })
})
