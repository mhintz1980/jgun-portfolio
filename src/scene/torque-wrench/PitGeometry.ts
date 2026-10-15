import { PORTAL_MOUTH_Z, makePortalShaftGeometry, portalClearanceM,
  type PortalShaftGeometry } from '../drawing/sheet/portalGeometry'

export const PRIVATE_PIT_RELIEF_M = 0.004
export const PRIVATE_PIT_MAX_DEVIATION_M = 0.018
const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }

/** Private cavern: irregular depth/perimeter relief, exact shared mouth and open tube.
 * Positive radial clearance plus a bounded low-gradient warp replaces the repeating
 * depth-strata triangle field. 1.4A radial allowance leaves >0 clearance even at
 * the worst warp; the extra field's XY Jacobian norm is bounded by .18.
 */
export function makePrivatePitGeometry(outline: number[][]): PortalShaftGeometry {
  const shaft = makePortalShaftGeometry(outline)
  const attribute = shaft.wallGeometry.getAttribute('position')
  const positions = attribute.array
  let maxDeviation = 0
  for (let k = 1; k < shaft.ringCount; k++) {
    const depth = shaft.ringDepthsM[k]
    const a = PRIVATE_PIT_RELIEF_M * smooth(depth / 0.14)
    const phase = Math.sin(depth * 5.7) * 1.8
    for (let i = 0; i < outline.length; i++) {
      const [x, y] = outline[i]
      const rx = x - shaft.profile.centroid[0], ry = y - shaft.profile.centroid[1]
      const radius = Math.hypot(rx, ry)
      const clearance = portalClearanceM(depth) + 1.4 * a
      const dx = a * (0.65 * Math.sin(x * 18 + phase) + 0.35 * Math.cos(y * 22 - phase))
      const dy = a * (0.6 * Math.sin(y * 19 + phase + 0.3) + 0.4 * Math.sin(x * 17 - phase))
      const o = (k * outline.length + i) * 3
      positions[o] = x + (radius > 1e-9 ? rx / radius * clearance : 0) + dx
      positions[o + 1] = y + (radius > 1e-9 ? ry / radius * clearance : 0) + dy
      // Break the common horizontal ring bands without moving the mouth or deep closure.
      const gap = Math.min(depth - shaft.ringDepthsM[k - 1],
        k + 1 < shaft.ringCount ? shaft.ringDepthsM[k + 1] - depth : 0)
      const reliefDepth = 0.08 * gap * Math.sin(x * 23 + y * 17 + phase)
      positions[o + 2] = PORTAL_MOUTH_Z - depth - reliefDepth
      maxDeviation = Math.max(maxDeviation, Math.hypot(positions[o] - x, positions[o + 1] - y))
    }
  }
  // The closure shares the final ring byte-for-byte. It remains at 3.2m beyond sight.
  const last = (shaft.ringCount - 1) * outline.length * 3
  shaft.closureGeometry.getAttribute('position').array.set(Array.from(positions).slice(last))
  attribute.needsUpdate = true
  shaft.wallGeometry.computeVertexNormals()
  shaft.closureGeometry.computeVertexNormals()
  shaft.maxRingDeviationM = maxDeviation
  return shaft
}
