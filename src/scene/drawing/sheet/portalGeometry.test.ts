import { beforeAll, describe, expect, it } from 'vitest'
import { Vector2 } from 'three'
// @ts-ignore — node builtins: the torn contour is read from the tracked precompute asset.
import { gunzipSync } from 'node:zlib'
// @ts-ignore — node builtins, see above.
import { readFileSync } from 'node:fs'
// @ts-ignore — node builtins, see above.
import { fileURLToPath } from 'node:url'
import {
  PORTAL_CLEARANCE_M, PORTAL_CLEARANCE_RAMP_M, PORTAL_CLOSURE_Z, PORTAL_FISSURE_HEX,
  PORTAL_FISSURE_RGB, PORTAL_MOUTH_Z, PORTAL_RELIEF_BOUND_M, PORTAL_RELIEF_M,
  PORTAL_RING_DEVIATION_BOUND_M, PORTAL_RING_DEPTHS,
  PORTAL_SHAFT_DEPTH_M, PORTAL_SIGHTLINE_FLOOR_DEG,
  buildPortalShaftProfile, makePortalShaftGeometry,
  portalClearanceM, portalDeepHazeM, portalOcclusionGuarantee, portalReliefM, portalRingPoint,
  portalRgb8Bit, portalRockRadianceM, portalRockTermM, portalSightlineDepthM,
} from './portalGeometry'

/**
 * The real torn contour the sheet ships with, decoded from the tracked precompute asset
 * (v3 container: header, sidecar, then f64 segs, fills and profile pairs — see drawingCodec).
 */
function loadTrackedProfile(): number[][] {
  const url = new URL('../../../../public/drawing/jgun-sheet-v2.bin.gz', import.meta.url)
  const bytes = gunzipSync(readFileSync(fileURLToPath(url)))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  expect([view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)]).toEqual([0x4a, 0x47, 0x44, 0x33])
  const segNumbers = view.getUint32(12, true)
  const fillNumbers = view.getUint32(16, true)
  const profilePoints = view.getUint32(20, true)
  const sidecarBytes = view.getUint32(24, true)
  const start = ((28 + sidecarBytes + 7) & ~7) + (segNumbers + fillNumbers) * 8
  const points: number[][] = []
  for (let i = 0; i < profilePoints; i += 1) {
    points.push([view.getFloat64(start + i * 16, true), view.getFloat64(start + i * 16 + 8, true)])
  }
  return points
}

/** A concave, torn-looking ring with a finger notch, for tests that must not depend on assets. */
const SYNTHETIC_RING: number[][] = (() => {
  const points: number[][] = []
  const steps = 240
  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * Math.PI * 2
    const notch = Math.exp(-Math.pow((a - 3.6) / 0.35, 2)) * 0.05
    const r = 0.14 + 0.012 * Math.sin(a * 7.0) + 0.006 * Math.sin(a * 19.0) - notch
    points.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return points
})()

const signedArea = (ring: number[][]): number => {
  let area = 0
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    area += a[0] * b[1] - b[0] * a[1]
  }
  return area / 2
}

/** Proper-crossing search over one ring, bucketed on a uniform grid. Returns a violating pair. */
function findFold(ring: number[][]): [number, number] | null {
  const n = ring.length
  const bounds = ring.reduce((acc, p) => [
    Math.min(acc[0], p[0]), Math.min(acc[1], p[1]),
    Math.max(acc[2], p[0]), Math.max(acc[3], p[1]),
  ], [Infinity, Infinity, -Infinity, -Infinity])
  const span = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1])
  const cell = Math.max(span / 96, 1e-4)
  const buckets = new Map<string, number[]>()
  const cellOf = (x: number, y: number) => `${Math.floor(x / cell)}:${Math.floor(y / cell)}`
  for (let i = 0; i < n; i += 1) {
    const a = ring[i], b = ring[(i + 1) % n]
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const steps = Math.max(1, Math.ceil(length / (cell * 0.5)))
    const seen = new Set<string>()
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps
      const key = cellOf(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
      if (seen.has(key)) continue
      seen.add(key)
      const bucket = buckets.get(key)
      if (bucket) bucket.push(i)
      else buckets.set(key, [i])
    }
  }
  const epsilon = 1e-11
  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
  for (const bucket of buckets.values()) {
    for (let m = 0; m < bucket.length; m += 1) {
      for (let k = m + 1; k < bucket.length; k += 1) {
        const i = bucket[m], j = bucket[k]
        if (i === j) continue
        if (j === (i + 1) % n || i === (j + 1) % n) continue
        const a = ring[i], b = ring[(i + 1) % n], c = ring[j], d = ring[(j + 1) % n]
        const d1 = cross(a[0], a[1], b[0], b[1], c[0], c[1])
        const d2 = cross(a[0], a[1], b[0], b[1], d[0], d[1])
        const d3 = cross(c[0], c[1], d[0], d[1], a[0], a[1])
        const d4 = cross(c[0], c[1], d[0], d[1], b[0], b[1])
        const straddles = (p: number, q: number) =>
          (p > epsilon && q < -epsilon) || (p < -epsilon && q > epsilon)
        if (straddles(d1, d2) && straddles(d3, d4)) return [i, j]
      }
    }
  }
  return null
}

const ringAt = (geometry: { getAttribute: (name: string) => { array: ArrayLike<number> } }, n: number, k: number) => {
  const positions = geometry.getAttribute('position').array
  const ring: number[][] = []
  for (let i = 0; i < n; i += 1) {
    const o = (k * n + i) * 3
    ring.push([positions[o], positions[o + 1]])
  }
  return ring
}

describe('portal vertical rock shaft geometry', () => {
  let profilePoints: number[][]
  beforeAll(() => { profilePoints = loadTrackedProfile() })

  it('extrudes the exact torn contour: ring 0 is the outline itself', () => {
    const shaft = makePortalShaftGeometry(SYNTHETIC_RING)
    const positions = shaft.wallGeometry.getAttribute('position').array
    for (let i = 0; i < SYNTHETIC_RING.length; i += 1) {
      const exact = portalRingPoint(shaft.profile, i, 0)
      expect(exact[0]).toBe(SYNTHETIC_RING[i][0])
      expect(exact[1]).toBe(SYNTHETIC_RING[i][1])
      expect(exact[2]).toBe(PORTAL_MOUTH_Z)
      expect(positions[i * 3]).toBe(Math.fround(SYNTHETIC_RING[i][0]))
      expect(positions[i * 3 + 1]).toBe(Math.fround(SYNTHETIC_RING[i][1]))
    }
    // Real contour, same contract, and it must hold for all of its hundreds of points.
    const real = makePortalShaftGeometry(profilePoints)
    const realPositions = real.wallGeometry.getAttribute('position').array
    let worst = 0
    for (let i = 0; i < profilePoints.length; i += 1) {
      worst = Math.max(worst, Math.abs(realPositions[i * 3] - Math.fround(profilePoints[i][0])))
      worst = Math.max(worst, Math.abs(realPositions[i * 3 + 1] - Math.fround(profilePoints[i][1])))
    }
    expect(worst).toBe(0)
  })

  it('keeps every deeper ring within millimetres of the contour — vertical, not a cone', () => {
    const shaft = makePortalShaftGeometry(profilePoints)
    expect(shaft.maxRingDeviationM).toBeGreaterThan(0)
    expect(shaft.maxRingDeviationM).toBeLessThanOrEqual(PORTAL_RING_DEVIATION_BOUND_M + 1e-9)
    expect(PORTAL_RING_DEVIATION_BOUND_M).toBeLessThanOrEqual(PORTAL_CLEARANCE_M + 1.5 * Math.hypot(PORTAL_RELIEF_M, PORTAL_RELIEF_M))
    // The rejected build flared rings by 65% of the profile radius; a vertical shaft must not.
    const mouth = buildPortalShaftProfile(profilePoints)
    const deepest = ringAt(shaft.wallGeometry, profilePoints.length, shaft.ringCount - 1)
    let maxGrowth = 0
    const centre = mouth.centroid
    for (let i = 0; i < deepest.length; i += 1) {
      const p = profilePoints[i]
      const before = Math.hypot(p[0] - centre[0], p[1] - centre[1])
      const after = Math.hypot(deepest[i][0] - centre[0], deepest[i][1] - centre[1])
      maxGrowth = Math.max(maxGrowth, after - before)
    }
    expect(maxGrowth).toBeLessThan(0.02)
    expect(PORTAL_SHAFT_DEPTH_M / Math.max(mouth.extentM, 1e-9)).toBeGreaterThan(4)
  })

  it('carries metric depth: strictly descending rings at their declared metres', () => {
    const shaft = makePortalShaftGeometry(profilePoints)
    const positions = shaft.wallGeometry.getAttribute('position').array
    const n = profilePoints.length
    expect([...PORTAL_RING_DEPTHS]).toEqual([...shaft.ringDepthsM])
    for (let k = 0; k < shaft.ringCount; k += 1) {
      expect(PORTAL_RING_DEPTHS[k]).toBeGreaterThan(k === 0 ? -1 : PORTAL_RING_DEPTHS[k - 1])
      expect(portalRingPoint(shaft.profile, 0, PORTAL_RING_DEPTHS[k])[2]).toBe(PORTAL_MOUTH_Z - PORTAL_RING_DEPTHS[k])
      for (let i = 0; i < n; i += 1) {
        const z = positions[(k * n + i) * 3 + 2]
        expect(Math.abs((PORTAL_MOUTH_Z - z) - PORTAL_RING_DEPTHS[k])).toBeLessThan(1e-5)
      }
    }
    expect(PORTAL_CLOSURE_Z).toBeCloseTo(PORTAL_MOUTH_Z - PORTAL_SHAFT_DEPTH_M, 12)
    expect(PORTAL_SHAFT_DEPTH_M).toBeGreaterThanOrEqual(2)
  })

  it('has no floor topology: an open tube whose only boundary loops are lip and far closure', () => {
    const shaft = makePortalShaftGeometry(profilePoints)
    const n = profilePoints.length
    const rings = shaft.ringCount
    const wallIndices = Array.from(shaft.wallGeometry.getIndex()!.array as ArrayLike<number>)
    const closureIndices = Array.from(shaft.closureGeometry.getIndex()!.array as ArrayLike<number>)
    // Lateral surface only: 2 triangles per ring gap, no fan across the tube.
    expect(wallIndices.length).toBe((rings - 1) * n * 6)
    // Every wall triangle spans exactly two adjacent rings: nothing closes the bore higher up.
    const ringOf = (vertex: number) => Math.floor(vertex / n)
    let invalidTriangles = 0
    for (let t = 0; t < wallIndices.length; t += 3) {
      const spans = new Set([ringOf(wallIndices[t]), ringOf(wallIndices[t + 1]), ringOf(wallIndices[t + 2])])
      const sorted = [...spans].sort((a, b) => a - b)
      if (spans.size !== 2 || sorted[1] - sorted[0] !== 1 || sorted[0] < 0 || sorted[1] > rings - 1) invalidTriangles++
    }
    expect(invalidTriangles).toBe(0)
    // Manifold tube: every edge is shared by two triangles, except the two boundary loops.
    const edges = new Map<string, number>()
    for (let t = 0; t < wallIndices.length; t += 3) {
      const tri = [wallIndices[t], wallIndices[t + 1], wallIndices[t + 2]]
      for (let e = 0; e < 3; e += 1) {
        const a = tri[e], b = tri[(e + 1) % 3]
        const key = a < b ? `${a}:${b}` : `${b}:${a}`
        edges.set(key, (edges.get(key) ?? 0) + 1)
      }
    }
    const counts = new Map<number, number>()
    for (const count of edges.values()) counts.set(count, (counts.get(count) ?? 0) + 1)
    expect([...counts.keys()].sort()).toEqual([1, 2])
    expect(counts.get(1)).toBe(2 * n)
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n
      const lip = i < j ? `${i}:${j}` : `${j}:${i}`
      const deepA = (rings - 1) * n + i, deepB = (rings - 1) * n + j
      const deep = deepA < deepB ? `${deepA}:${deepB}` : `${deepB}:${deepA}`
      expect(edges.get(lip)).toBe(1)
      expect(edges.get(deep)).toBe(1)
    }
    // Closure triangulates the deepest ring: same vertices, same winding, full area, no extras.
    const deepest = ringAt(shaft.wallGeometry, n, rings - 1)
    const closurePositions = shaft.closureGeometry.getAttribute('position').array
    for (let i = 0; i < n; i += 1) {
      expect(closurePositions[i * 3]).toBe(Math.fround(deepest[i][0]))
      expect(closurePositions[i * 3 + 1]).toBe(Math.fround(deepest[i][1]))
    }
    expect(closureIndices.length).toBeGreaterThan(0)
    expect(closureIndices.length % 3).toBe(0)
    expect(Math.max(...closureIndices)).toBeLessThan(n)
    expect(closureIndices.length).toBeLessThanOrEqual((n - 2) * 3)
    const orientation = Math.sign(signedArea(deepest))
    let area = 0
    for (let t = 0; t < closureIndices.length; t += 3) {
      const a = deepest[closureIndices[t]], b = deepest[closureIndices[t + 1]], c = deepest[closureIndices[t + 2]]
      const double = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
      expect(Math.sign(double) * orientation).toBeGreaterThanOrEqual(0)
      area += Math.abs(double) / 2
    }
    expect(area / Math.abs(signedArea(deepest))).toBeCloseTo(1, 2)
  })

  it('cannot be photographed below: closure depth clears every plausible sight line', () => {
    const profile = buildPortalShaftProfile(profilePoints)
    const guarantee = portalOcclusionGuarantee(profile.extentM)
    expect(guarantee.offNormalDeg).toBe(PORTAL_SIGHTLINE_FLOOR_DEG)
    expect(guarantee.closureOccluded).toBe(true)
    expect(guarantee.margin).toBeGreaterThan(2)
    // Shallowest ray the guarantee claims: a ray crossing the full caliper width still lands
    // on rock metres before the closure.
    expect(portalSightlineDepthM(profile.extentM, PORTAL_SIGHTLINE_FLOOR_DEG)).toBeLessThan(PORTAL_SHAFT_DEPTH_M / 2)
    // And the guarantee holds with margin at the drafting camera's own worst rake (>= 38 deg
    // elevation in sheetCamera's shot list, i.e. <= 52 deg off the sheet normal).
    expect(portalOcclusionGuarantee(profile.extentM, 52).margin).toBeGreaterThan(4)
  })

  it('extinguishes the far closure: no relief texture, no glow, no void', () => {
    // The closure disc carries no relief field and no fissures: only the deep rock and haze.
    expect(Math.max(...portalRgb8Bit(portalRockTermM(PORTAL_SHAFT_DEPTH_M)))).toBeLessThan(0.5)
    const closure = portalRgb8Bit(portalRockRadianceM(PORTAL_SHAFT_DEPTH_M))
    expect(Math.max(...closure)).toBeLessThan(8)
    // Never a void: the deep end keeps a blue-black floor value instead of pure black.
    expect(Math.max(...portalRgb8Bit(portalDeepHazeM(PORTAL_SHAFT_DEPTH_M)))).toBeGreaterThanOrEqual(1)
    const [r, g, b] = portalDeepHazeM(PORTAL_SHAFT_DEPTH_M)
    expect(r).toBeLessThan(g)
    expect(g).toBeLessThan(b)
    // Monotone extinction: rock only ever gets darker with depth.
    let previous = Infinity
    for (const depth of PORTAL_RING_DEPTHS) {
      const lum = Math.max(...portalRockRadianceM(depth))
      expect(lum).toBeLessThanOrEqual(previous + 1e-12)
      previous = lum
    }
    // The lip is still readable rock, so the shaft reads as stone rather than a void.
    expect(Math.max(...portalRockRadianceM(0))).toBeGreaterThan(0.1)
  })

  it('carries the approved trace blue as fissure colour, with no neutral white', () => {
    expect(PORTAL_FISSURE_HEX).toBe(0x79cfff)
    expect(PORTAL_FISSURE_RGB[0]).toBeCloseTo(0x79 / 255, 12)
    expect(PORTAL_FISSURE_RGB[1]).toBeCloseTo(0xcf / 255, 12)
    expect(PORTAL_FISSURE_RGB[2]).toBe(1)
    const [r, g, b] = PORTAL_FISSURE_RGB
    expect(r).toBeLessThan(g)
    expect(g).toBeLessThan(b)
    // Saturation: no scaling of the fissure colour can reach neutral white.
    expect(r / b).toBeLessThan(0.6)
  })

  it('is deterministic and fold-free on the real torn contour', () => {
    const a = makePortalShaftGeometry(profilePoints)
    const b = makePortalShaftGeometry(profilePoints)
    expect(Array.from(a.wallGeometry.getAttribute('position').array as ArrayLike<number>))
      .toEqual(Array.from(b.wallGeometry.getAttribute('position').array as ArrayLike<number>))
    expect(Array.from(a.closureGeometry.getIndex()!.array as ArrayLike<number>))
      .toEqual(Array.from(b.closureGeometry.getIndex()!.array as ArrayLike<number>))
    // Relief and clearance must not fold the jagged torn contour at any ring.
    for (let k = 0; k < a.ringCount; k += 1) {
      const ring = ringAt(a.wallGeometry, profilePoints.length, k)
      expect(findFold(ring), `ring ${k} folds`).toBeNull()
    }
    expect(findFold([...SYNTHETIC_RING].reverse())).toBeNull()
  })

  it('keeps the relief and clearance neutral at the lip and bounded below it', () => {
    expect(portalReliefM(0.05, -0.02, 0)).toEqual([0, 0])
    expect(portalClearanceM(0)).toBe(0)
    expect(portalClearanceM(PORTAL_CLEARANCE_RAMP_M)).toBeCloseTo(PORTAL_CLEARANCE_M, 12)
    let worst = 0
    for (let d = 0; d <= PORTAL_SHAFT_DEPTH_M; d += 0.05) {
      for (let x = -0.2; x <= 0.2; x += 0.02) {
        for (let y = -0.15; y <= 0.15; y += 0.02) {
          const [dx, dy] = portalReliefM(x, y, d)
          worst = Math.max(worst, Math.hypot(dx, dy))
        }
      }
    }
    expect(worst).toBeLessThanOrEqual(PORTAL_RELIEF_BOUND_M + 1e-12)
    expect(worst).toBeGreaterThan(0.9 * PORTAL_RELIEF_BOUND_M)
  })
})

describe('makePortal contract (parent integration)', () => {
  let profilePoints: number[][]
  beforeAll(() => { profilePoints = loadTrackedProfile() })

  it('keeps the shape of the API the sheet drives, with an honest closure report', async () => {
    const { makePortal, portalPulse } = await import('./portal')
    const sharedLight = { value: 0 }
    const portal = makePortal(profilePoints, -0.24, new Vector2(0, 0), sharedLight)
    // Parent reads these directly in DrawingLinework's capturePortal/stats hooks.
    expect(portal.cap.material.depthTest).toBe(true)
    expect(portal.cap.material.depthWrite).toBe(true)
    expect(portal.walls.material.depthTest).toBe(true)
    expect(portal.walls.material.depthWrite).toBe(true)
    expect(portal.capZ).toBe(portal.closureZ)
    expect(portal.capZ).toBeCloseTo(PORTAL_MOUTH_Z - PORTAL_SHAFT_DEPTH_M, 12)
    expect(portal.mouthZ).toBe(PORTAL_MOUTH_Z)
    expect(portal.initialModelBottom).toBe(-0.24)
    expect(portal.wallLevels).toBe(PORTAL_RING_DEPTHS.length)
    expect(portal.profilePoints).toBe(profilePoints.length)
    expect(portal.closureBehindInitialModel).toBe(true)
    // Honest cap reporting: the closure exists, is unreachable by any sight line, and its
    // silhouette carries no relief texture to read as a plane.
    expect(portal.capVisible).toBe(false)
    expect(portal.occlusion.closureOccluded).toBe(true)
    expect(portal.maxRingDeviationM).toBeLessThanOrEqual(PORTAL_RING_DEVIATION_BOUND_M + 1e-9)
    // Both meshes share one fragment body; only the wall gate differs, so the closure shades
    // to the value the walls already hold at its depth.
    expect(portal.cap.material.fragmentShader).toBe(portal.walls.material.fragmentShader)
    expect(portal.cap.material.uniforms.uPortalWall.value).toBe(0)
    expect(portal.walls.material.uniforms.uPortalWall.value).toBe(1)
    // The fissure colour the shader emits is the approved trace blue, and the emission is
    // capped below neutral white.
    const fissure = portal.walls.material.uniforms.uPortalFissure.value
    expect([fissure.x, fissure.y, fissure.z]).toEqual([...PORTAL_FISSURE_RGB])
    const walls = portal.walls.material.uniforms
    expect(walls.uPortalRockAlive.value).toBeGreaterThan(0)
    expect(walls.uPortalRockAlive.value).toBeLessThanOrEqual(1)
    // update() keeps its signature: pulse out, shared light and lite tier set.
    const pulse = portal.update(0.9, 0.5, true, false)
    expect(pulse).toBe(portalPulse(0.9, false))
    expect(sharedLight.value).toBeCloseTo(0.5 * pulse, 12)
    expect(walls.uPortalLite.value).toBe(1)
    expect(portal.update(0.9, 0.5, false, true)).toBe(1)
    expect(walls.uPortalLite.value).toBe(0)
    expect(walls.uPortalTime.value).toBe(0)
    portal.dispose()
  })
})
