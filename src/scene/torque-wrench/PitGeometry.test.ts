import { expect, it } from 'vitest'
import { makePrivatePitGeometry } from './PitGeometry'
import { makePortalShaftGeometry, PORTAL_SHAFT_DEPTH_M } from '../drawing/sheet/portalGeometry'
const outline = Array.from({ length: 240 }, (_, i) => {
  const a = i / 240 * Math.PI * 2
  const r = 0.14 + 0.012 * Math.sin(a * 7) - 0.05 * Math.exp(-Math.pow((a - 3.6) / 0.35, 2))
  return [Math.cos(a) * r, Math.sin(a) * r]
})
it('preserves exact mouth, wall topology, steep walls and extinct matched closure', () => {
  const current = makePortalShaftGeometry(outline), pit = makePrivatePitGeometry(outline)
  const a = current.wallGeometry.getAttribute('position').array, b = pit.wallGeometry.getAttribute('position').array
  expect(Array.from(b).slice(0, outline.length * 3)).toEqual(Array.from(a).slice(0, outline.length * 3))
  expect(Array.from(pit.wallGeometry.index!.array)).toEqual(Array.from(current.wallGeometry.index!.array))
  expect(Array.from(b).every(Number.isFinite)).toBe(true)
  expect(pit.ringDepthsM.at(-1)).toBe(PORTAL_SHAFT_DEPTH_M)
  expect(pit.maxRingDeviationM).toBeLessThan(0.018)
  expect(Array.from(pit.closureGeometry.getAttribute('position').array)).toEqual(Array.from(b).slice(-outline.length * 3))
  let maxSlope = 0
  for (let k = 1; k < pit.ringCount; k++) for (let i = 0; i < outline.length; i++) {
    const v = (k * outline.length + i) * 3, p = v - outline.length * 3
    expect(b[v + 2]).toBeLessThan(b[p + 2])
    maxSlope = Math.max(maxSlope, Math.hypot(b[v] - b[p], b[v + 1] - b[p + 1]) / (b[p + 2] - b[v + 2]))
  }
  expect(Math.atan(maxSlope) * 180 / Math.PI).toBeLessThan(25)
  current.wallGeometry.dispose(); current.closureGeometry.dispose(); pit.wallGeometry.dispose(); pit.closureGeometry.dispose()
})
