import { PORTAL_MOUTH_Z, makePortalShaftGeometry, portalClearanceM,
  type PortalShaftGeometry } from '../drawing/sheet/portalGeometry'

export const PRIVATE_PIT_RELIEF_M = 0.018
export const PRIVATE_PIT_MAX_DEVIATION_M = 0.13
const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u) }
/** Triangle wave in [-1, 1]; its corners survive normal-based faceting better than sines. */
const tri = (u: number) => 4 * Math.abs(u - Math.floor(u) - 0.5) - 1
const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** Exact torn mouth opens into a cavern with independent near-wall relief.
 *
 * Low angular frequencies keep every displaced ring fold-free, while depth-stepped
 * triangle facets and bounded per-vertex strata warp make adjacent wall quads non-planar.
 * Radial displacement remains outward, same-column depth remains strictly descending, and
 * the registered mouth/source CAD are untouched.
 */
export function makePrivatePitGeometry(outline: number[][]): PortalShaftGeometry {
  const ringDepthsM = [0, .004, .009, .016, .026, .038, .054, .075, .10, .13, .17,
    .22, .29, .38, .50, .66, .86, 1.12, 1.45, 1.85, 2.35, 3.2]
  const shaft = makePortalShaftGeometry(outline, { ringDepthsM })
  const attribute = shaft.wallGeometry.getAttribute('position')
  const positions = attribute.array
  let maxDeviation = 0
  for (let k = 1; k < shaft.ringCount; k++) {
    const depth = shaft.ringDepthsM[k]
    const deepStrata = tri(depth / .19 + .23)
    const stratumCell = Math.floor(depth / .085)
    for (let i = 0; i < outline.length; i++) {
      const [x, y] = outline[i]
      const rx = x - shaft.profile.centroid[0], ry = y - shaft.profile.centroid[1]
      const radius = Math.hypot(rx, ry)
      const angle = Math.atan2(ry, rx)
      const sector = angle / (Math.PI * 2) + .5
      // Discrete cliff cells make adjacent wall quads intersect as real angular steps.
      // The count stays far below the contour sampling density, so outward-only displacement
      // cannot fold a ring; the mouth ring and final closure ring remain untouched.
      const cellSector = Math.floor(sector * 16 + stratumCell * .37)
      const cell = hash(cellSector, stratumCell)
      const cellEdge = Math.abs(2 * (sector * 16 - Math.floor(sector * 16)) - 1)
      const facet = .72 * cell + .16 * cellEdge + .12 * tri(sector * 5 - deepStrata)
      const chamber = .052 * smooth(depth / .30)
        * (.88 + .12 * tri(sector * 2 + deepStrata * .5))
      const buttress = (PRIVATE_PIT_RELIEF_M + .006) * smooth(depth / .10)
        * (.58 + .42 * facet)
      const clearance = portalClearanceM(depth) + chamber + buttress
      const o = (k * outline.length + i) * 3
      positions[o] = x + (radius > 1e-9 ? rx / radius * clearance : 0)
      positions[o + 1] = y + (radius > 1e-9 ? ry / radius * clearance : 0)
      // Two adjacent strata bounds total 0.62 of their shared nominal gap, so every
      // column stays descending; the last ring remains on the 3.2m closure plane.
      const gapBefore = depth - shaft.ringDepthsM[k - 1]
      const gapAfter = k + 1 < shaft.ringCount ? shaft.ringDepthsM[k + 1] - depth : gapBefore
      const localGap = Math.min(gapBefore, gapAfter)
      const strataRelief = k + 1 < shaft.ringCount
        ? .31 * localGap * smooth(depth / .025)
          * (.55 + .45 * hash(cellSector, stratumCell + 17))
        : 0
      positions[o + 2] = PORTAL_MOUTH_Z - depth - strataRelief
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
