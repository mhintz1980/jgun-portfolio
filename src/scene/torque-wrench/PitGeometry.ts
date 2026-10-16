import { PORTAL_MOUTH_Z, makePortalShaftGeometry, portalClearanceM,
  type PortalShaftGeometry } from '../drawing/sheet/portalGeometry'

export const PRIVATE_PIT_RELIEF_M = 0.018
export const PRIVATE_PIT_MAX_DEVIATION_M = 0.13
const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }

/** Exact torn mouth opens into a cavern, with broad irregular shelves and rock faces.
 * Radial displacement stays outward; depth ordering and the remote matched closure
 * stay intact. The source CAD and the registered paper aperture are never changed.
 */
export function makePrivatePitGeometry(outline: number[][]): PortalShaftGeometry {
  const shaft = makePortalShaftGeometry(outline, { ringDepthsM: [0, .008, .018, .032, .052, .078,
    .11, .15, .2, .27, .35, .45, .58, .75, 1, 1.35, 1.75, 2.4, 3.2] })
  const attribute = shaft.wallGeometry.getAttribute('position')
  const positions = attribute.array
  let maxDeviation = 0
  for (let k = 1; k < shaft.ringCount; k++) {
    const depth = shaft.ringDepthsM[k]
    const a = PRIVATE_PIT_RELIEF_M * smooth(depth / 0.12)
    const phase = Math.sin(depth * 7.3) * 1.2
    for (let i = 0; i < outline.length; i++) {
      const [x, y] = outline[i]
      const rx = x - shaft.profile.centroid[0], ry = y - shaft.profile.centroid[1]
      const radius = Math.hypot(rx, ry)
      const angle = Math.atan2(ry, rx)
      const chamber = .052 * smooth(depth / .3)
        * (.82 + .18 * Math.sin(angle * 3 + .6) * Math.cos(depth * 3.1))
      const buttress = a * (1 + .48 * Math.sin(angle * 7 + phase)
        + .3 * Math.sin(angle * 13 - depth * 11.7))
      const clearance = portalClearanceM(depth) + chamber + buttress
      const o = (k * outline.length + i) * 3
      positions[o] = x + (radius > 1e-9 ? rx / radius * clearance : 0)
      positions[o + 1] = y + (radius > 1e-9 ? ry / radius * clearance : 0)
      // Break the common horizontal ring bands without moving the mouth or deep closure.
      const gap = Math.min(depth - shaft.ringDepthsM[k - 1],
        k + 1 < shaft.ringCount ? shaft.ringDepthsM[k + 1] - depth : 0)
      const reliefDepth = 0.16 * gap * Math.sin(angle * 9 + phase)
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
