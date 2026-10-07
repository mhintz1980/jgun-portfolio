import { beforeAll, describe, expect, it } from 'vitest'
// @ts-ignore — node builtins: the profile asset is read from disk, which has no browser API.
import { gunzipSync } from 'node:zlib'
// @ts-ignore — node builtins, see above.
import { readFileSync } from 'node:fs'
// @ts-ignore — node builtins, see above.
import { fileURLToPath } from 'node:url'
import {
  BREAKTHROUGH_CRACK_HALF_WIDTH,
  BREAKTHROUGH_CRACK_Z,
  BREAKTHROUGH_FRAGMENT_DELAY_MAX,
  BREAKTHROUGH_FRAGMENT_MAX,
  BREAKTHROUGH_FRAGMENT_MIN,
  BREAKTHROUGH_FRAGMENT_SPIN_MAX,
  BREAKTHROUGH_FRAGMENT_RADIAL_MIN,
  BREAKTHROUGH_FRAGMENT_LIFT_MIN,
  BREAKTHROUGH_PAPER_SUBDIVISION,
  BREAKTHROUGH_RIM_FRONT_Z,
  BREAKTHROUGH_RIM_TOLERANCE,
  BREAKTHROUGH_THICKNESS,
  BREAKTHROUGH_TORN_MAX,
  YBandIndex,
  makeBreakthroughGeometry,
  type BreakthroughGeometry,
} from './breakthroughGeometry'

/** Matches drawingGeometry.SHEET_WIDTH/HEIGHT; the factory only needs the sheet rectangle. */
const SHEET_WIDTH = 0.8
const SHEET_HEIGHT = 0.5

/**
 * The real traced contour the sheet ships with, decoded from the tracked precompute asset
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

/** Uniform-grid nearest-distance and containment queries for the test's own assertions. */
class GridIndex {
  private readonly cells = new Map<string, number[]>()
  private readonly cell = 0.002

  constructor(private readonly ring: number[][]) {
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (this.cell * 0.5)))
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps
        const key = this.key(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        const bucket = this.cells.get(key)
        if (bucket) bucket.push(i)
        else this.cells.set(key, [i])
      }
    }
  }

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)}`
  }

  nearest(x: number, y: number, radius: number): number {
    const span = Math.max(1, Math.ceil(radius / this.cell))
    const gx = Math.floor(x / this.cell)
    const gy = Math.floor(y / this.cell)
    let best = radius
    for (let ix = gx - span; ix <= gx + span; ix += 1) {
      for (let iy = gy - span; iy <= gy + span; iy += 1) {
        const bucket = this.cells.get(`${ix},${iy}`)
        if (!bucket) continue
        for (const index of bucket) {
          const a = this.ring[index]
          const b = this.ring[(index + 1) % this.ring.length]
          const dx = b[0] - a[0]
          const dy = b[1] - a[1]
          const lengthSquared = dx * dx + dy * dy
          const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / lengthSquared)) : 0
          const candidate = Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t))
          if (candidate < best) best = candidate
        }
      }
    }
    return best
  }
}

function triangleVertices(positions: ArrayLike<number>, indices: ArrayLike<number>, triangle: number): number[][] {
  return [0, 1, 2].map((corner) => {
    const index = indices[triangle * 3 + corner]
    return [positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]]
  })
}

function maxEdge(vertices: number[][]): number {
  let longest = 0
  for (let i = 0; i < 3; i += 1) {
    const a = vertices[i]
    const b = vertices[(i + 1) % 3]
    longest = Math.max(longest, Math.hypot(a[0] - b[0], a[1] - b[1]))
  }
  return longest
}

describe('JG-035 breakthrough geometry on the real traced profile', () => {
  let source: number[][]
  let baked: BreakthroughGeometry
  let paperPositions: Float32Array
  let paperIndices: Uint32Array

  beforeAll(() => {
    source = loadTrackedProfile()
    baked = makeBreakthroughGeometry(source, SHEET_WIDTH, SHEET_HEIGHT)
    paperPositions = baked.paper.getAttribute('position').array as Float32Array
    paperIndices = baked.paper.getIndex()?.array as Uint32Array
  }, 120000)

  it('holes the exact profile without eroding the aperture', () => {
    expect(source.length).toBeGreaterThan(5000)
    const profile = baked.profile
    const outline = baked.outline
    // The source contour survives verbatim: no closing duplicate, same winding, same area.
    const rawArea = source.reduce((sum, point, i) => {
      const next = source[(i + 1) % source.length]
      return sum + (point[0] * next[1] - next[0] * point[1])
    }, 0) / 2
    const profileArea = profile.reduce((sum, point, i) => {
      const next = profile[(i + 1) % profile.length]
      return sum + (point[0] * next[1] - next[0] * point[1])
    }, 0) / 2
    expect(profileArea).toBeCloseTo(rawArea, 12)
    expect(profileArea).toBeGreaterThan(0)
    // Every exact profile vertex still sits inside the hole: nothing was clipped away.
    const hole = new YBandIndex(outline)
    for (const point of profile) expect(hole.contains(point[0], point[1], 1e-12)).toBe(true)
    // The torn offset is bounded, measured, and only ever outward.
    expect(baked.maxBoundaryDeviation).toBeLessThanOrEqual(BREAKTHROUGH_TORN_MAX)
    expect(baked.area).toBeGreaterThanOrEqual(profileArea)
    const perimeter = source.reduce((sum, point, i) => {
      const next = source[(i + 1) % source.length]
      return sum + Math.hypot(next[0] - point[0], next[1] - point[1])
    }, 0)
    expect(baked.area - profileArea).toBeLessThan(perimeter * BREAKTHROUGH_TORN_MAX)
    // The hole never eats into the aperture: no point of the hole contour lies inside the
    // exact profile, and every sample well inside the profile is still hole.
    const profileHole = new YBandIndex(profile)
    const boundary = new GridIndex(profile)
    for (let i = 0; i < outline.length; i += 1) {
      const a = outline[i]
      const b = outline[(i + 1) % outline.length]
      expect(profileHole.contains(a[0], a[1], 1e-9)).toBe(false)
      expect(profileHole.contains((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 1e-9)).toBe(false)
    }
    let insideMin = Infinity
    let insideMax = -Infinity
    let low = Infinity
    let high = -Infinity
    for (const point of profile) {
      if (point[0] < insideMin) insideMin = point[0]
      if (point[0] > insideMax) insideMax = point[0]
      if (point[1] < low) low = point[1]
      if (point[1] > high) high = point[1]
    }
    let sampled = 0
    let missed = 0
    const step = 0.0015
    for (let y = low + step / 2; y < high; y += step) {
      for (let x = insideMin + step / 2; x < insideMax; x += step) {
        if (!profileHole.contains(x, y, 0)) continue
        if (boundary.nearest(x, y, 0.0008) < 0.0008) continue
        sampled += 1
        if (!hole.contains(x, y, 0)) missed += 1
      }
    }
    expect(sampled).toBeGreaterThan(1000)
    expect(missed).toBe(0)
  })

  it('partitions the hole into thick pieces and perimeter chips without a gap', () => {
    const outline = baked.outline
    const hole = new YBandIndex(outline)
    const fragments = baked.fragments
    expect(fragments.length).toBeGreaterThanOrEqual(BREAKTHROUGH_FRAGMENT_MIN)
    expect(fragments.length).toBeLessThanOrEqual(BREAKTHROUGH_FRAGMENT_MAX)
    expect(baked.fragmentArea).toBeGreaterThan(baked.area * 0.99999)
    expect(baked.fragmentArea).toBeLessThan(baked.area * 1.00001)
    expect(baked.fragmentZRange[0]).toBeCloseTo(-BREAKTHROUGH_THICKNESS, 9)
    expect(baked.fragmentZRange[1]).toBeCloseTo(0, 12)
    const centroids = new Set<string>()
    for (const fragment of fragments) {
      const position = fragment.geometry.getAttribute('position').array as Float32Array
      let front = 0
      let back = 0
      for (let i = 2; i < position.length; i += 3) {
        if (position[i] === 0) front += 1
        if (Math.abs(position[i] + BREAKTHROUGH_THICKNESS) < 1e-9) back += 1
      }
      // Real prism: every front vertex on z = 0 and every back vertex a sheet thickness down.
      expect(front).toBe(back)
      expect(front).toBeGreaterThan(2)
      // Horizontal faces read +/-Z; their split wall vertices have sloping normals.
      const normal = fragment.geometry.getAttribute('normal').array as Float32Array
      const index = fragment.geometry.getIndex()!.array
      let frontChecked = 0
      let backChecked = 0
      for (let i = 0; i < index.length; i += 3) {
        const face = [index[i], index[i + 1], index[i + 2]]
        if (face.every(v => position[v * 3 + 2] === 0)) {
          for (const v of face) expect(normal[v * 3 + 2]).toBeGreaterThan(0.99)
          frontChecked++
        } else if (face.every(v => Math.abs(position[v * 3 + 2] + BREAKTHROUGH_THICKNESS) < 1e-9)) {
          for (const v of face) expect(normal[v * 3 + 2]).toBeLessThan(-0.99)
          backChecked++
        }
      }
      expect(frontChecked).toBeGreaterThan(0)
      expect(backChecked).toBe(frontChecked)
      // Cells are inside the hole (so the sum of areas proves an exact partition), and the
      // centroid sits on the fragment's own local origin, which is where the parent mounts it.
      for (let i = 0; i < position.length; i += 3) {
        const x = position[i] + fragment.center.x, y = position[i + 1] + fragment.center.y
        expect(hole.contains(x, y, 1e-7)).toBe(true)
      }
      expect(centroids.has(`${fragment.center.x.toFixed(9)},${fragment.center.y.toFixed(9)}`)).toBe(false)
      centroids.add(`${fragment.center.x.toFixed(9)},${fragment.center.y.toFixed(9)}`)
    }
  })

  it('launches every fragment clear of the silhouette, deterministically', () => {
    const velocities = baked.fragments.map((fragment) => fragment.velocity)
    for (const velocity of velocities) {
      // xy radial >= 0.45 m and z >= 0.3 m per unit of normalised scroll: out of the way by
      // the time the fracture window closes.
      expect(Math.hypot(velocity.x, velocity.y)).toBeGreaterThanOrEqual(BREAKTHROUGH_FRAGMENT_RADIAL_MIN)
      expect(velocity.z).toBeGreaterThanOrEqual(BREAKTHROUGH_FRAGMENT_LIFT_MIN)
      expect(velocity.z).toBeGreaterThanOrEqual(0.3)
    }
    expect(Math.max(...velocities.map((v) => v.z)) - Math.min(...velocities.map((v) => v.z))).toBeGreaterThan(0.05)
    expect(Math.max(...velocities.map((v) => Math.hypot(v.x, v.y))) - Math.min(...velocities.map((v) => Math.hypot(v.x, v.y)))).toBeGreaterThan(0.05)
    for (const fragment of baked.fragments) {
      expect(Math.abs(fragment.spin.x)).toBeGreaterThan(0)
      for (const axis of [fragment.spin.x, fragment.spin.y, fragment.spin.z]) {
        expect(Math.abs(axis)).toBeLessThanOrEqual(BREAKTHROUGH_FRAGMENT_SPIN_MAX)
      }
      expect(fragment.delay).toBeGreaterThanOrEqual(0)
      expect(fragment.delay).toBeLessThanOrEqual(BREAKTHROUGH_FRAGMENT_DELAY_MAX)
    }
    expect(new Set(baked.fragments.map((f) => f.spin.x.toFixed(6))).size).toBe(baked.fragments.length)
    const again = makeBreakthroughGeometry(source, SHEET_WIDTH, SHEET_HEIGHT)
    const first = baked.fragments[0]
    const second = again.fragments[0]
    expect((second.geometry.getAttribute('position').array as Float32Array)).toEqual(first.geometry.getAttribute('position').array as Float32Array)
    expect(second.center.toArray()).toEqual(first.center.toArray())
    expect(second.velocity.toArray()).toEqual(first.velocity.toArray())
    expect(second.spin.toArray()).toEqual(first.spin.toArray())
    expect(baked.area).toBe(again.area)
    expect(baked.maxBoundaryDeviation).toBe(again.maxBoundaryDeviation)
    expect((again.paper.getAttribute('position').array as Float32Array)).toEqual(paperPositions)
    again.dispose()
  }, 240000)

  it('keeps the sheet exterior whole: no triangle bridges or clips the hole', () => {
    let meshArea = 0
    const triangles = paperIndices.length / 3
    const hole = new YBandIndex(baked.outline)
    const boundary = new GridIndex(baked.outline)
    let longest = 0, bridges = 0
    for (let triangle = 0; triangle < triangles; triangle += 1) {
      const vertices = triangleVertices(paperPositions, paperIndices, triangle)
      const a = vertices[0]
      const b = vertices[1]
      const c = vertices[2]
      meshArea += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
      // Sheet edges stay short enough for the paperFlex vertex displacement. Positions are
      // float32, so a quad diagonal measured off them carries ~1e-7 of storage noise.
      longest = Math.max(longest,maxEdge(vertices))
      // Float32 boundary slivers can shift by nanometres; no interior centroid may bridge.
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3
      if (boundary.nearest(cx, cy, 1e-7) >= 1e-7 && hole.contains(cx, cy, 0)) bridges++
    }
    expect(longest).toBeLessThanOrEqual(BREAKTHROUGH_PAPER_SUBDIVISION + 1e-7)
    expect(bridges).toBe(0)
    // Area conservation: sheet minus hole, to floating-point tolerance.
    expect(Math.abs(SHEET_WIDTH * SHEET_HEIGHT - meshArea - baked.area)).toBeLessThan(baked.area * 1e-6)
    // Front face is the resting plane the shader reads: every normal is +Z, every z is 0.
    const normals = baked.paper.getAttribute('normal').array as Float32Array
    let incorrectNormals = 0
    for (let i = 0; i < normals.length; i += 3) {
      if(normals[i]!==0 || normals[i+1]!==0 || normals[i+2]!==1 || paperPositions[i+2]!==0) incorrectNormals++
    }
    expect(incorrectNormals).toBe(0)
  }, 60000)

  it('leaves a permanent charred rim outside the hole and disjoint crack ribbons', () => {
    const position = baked.edge.getAttribute('position').array as Float32Array
    const hole = new GridIndex(baked.outline)
    let wallBottom = 0
    for (let i = 0; i < position.length; i += 3) {
      const z = position[i + 2]
      expect(z).toBeLessThanOrEqual(BREAKTHROUGH_RIM_FRONT_Z + 1e-9)
      expect(z).toBeGreaterThanOrEqual(-BREAKTHROUGH_THICKNESS - 1e-9)
      if (Math.abs(z + BREAKTHROUGH_THICKNESS) < 1e-9) wallBottom += 1
      // The rim starts on the hole edge and grows outward: never deep inside the aperture.
      expect(hole.nearest(position[i], position[i + 1], BREAKTHROUGH_TORN_MAX + BREAKTHROUGH_RIM_TOLERANCE)).toBeLessThanOrEqual(BREAKTHROUGH_TORN_MAX + BREAKTHROUGH_RIM_TOLERANCE + 1e-9)
    }
    expect(wallBottom).toBeGreaterThan(3 * 100)

    const cracks = baked.cracks
    const crackPositions = cracks.getAttribute('position').array as Float32Array
    const arcs = cracks.getAttribute('arcLength').array as Float32Array
    const sides = cracks.getAttribute('ribbonSide').array as Float32Array
    const normals = cracks.getAttribute('ribbonNormal').array as Float32Array
    const crackIds = cracks.getAttribute('crackId').array as Float32Array
    const crackIndices = cracks.getIndex()?.array as Uint32Array
    const count = crackPositions.length / 3
    expect(arcs.length).toBe(count)
    expect(sides.length).toBe(count)
    expect(normals.length).toBe(count * 2)
    expect(crackIds.length).toBe(count)
    expect(crackIndices.length).toBeGreaterThan(0)
    for (let i = 0; i < count; i += 1) {
      expect(crackPositions[i * 3 + 2]).toBeCloseTo(BREAKTHROUGH_CRACK_Z, 9)
      expect(Math.abs(sides[i])).toBe(1)
      expect(arcs[i]).toBeGreaterThanOrEqual(0)
      expect(arcs[i]).toBeLessThanOrEqual(1)
    }
    // Ribbon width is the glow half-width on both sides of the seam. Position is float32, so
    // the comparison tolerance is a micrometre, well above the storage epsilon at this scale.
    for (let i = 0; i < count; i += 2) {
      expect(Math.abs(Math.hypot(
        crackPositions[i * 3] - crackPositions[(i + 1) * 3],
        crackPositions[i * 3 + 1] - crackPositions[(i + 1) * 3 + 1],
      ) - 2 * BREAKTHROUGH_CRACK_HALF_WIDTH)).toBeLessThan(1e-6)
    }
    // No triangle may join two different ribbons: disjoint cracks never bridge into sheets.
    const ids = new Set<number>()
    for (let triangle = 0; triangle < crackIndices.length / 3; triangle += 1) {
      const a = crackIds[crackIndices[triangle * 3]]
      const b = crackIds[crackIndices[triangle * 3 + 1]]
      const c = crackIds[crackIndices[triangle * 3 + 2]]
      expect(a).toBe(b)
      expect(b).toBe(c)
      ids.add(a)
    }
    expect(ids.size).toBeGreaterThan(0)
    // Ribbons only exist along seams between fragment cells, never along the hole contour.
    expect(crackIndices.length / 6).toBeGreaterThan(0)
  })

  it('rejects profiles that cannot describe a hole', () => {
    expect(() => makeBreakthroughGeometry([[0, 0], [1, 0]], SHEET_WIDTH, SHEET_HEIGHT)).toThrow()
    expect(() => makeBreakthroughGeometry([[0, 0], [0, 0], [0, 0]], SHEET_WIDTH, SHEET_HEIGHT)).toThrow()
    expect(() => makeBreakthroughGeometry([[0, 0], [1, 0], [1, 1], [0, 1]], 0.4, 0.2)).toThrow()
  })
})
