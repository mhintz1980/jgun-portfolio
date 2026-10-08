import { BufferAttribute, BufferGeometry } from 'three'

/**
 * Drilled-hole apertures of the P003068 ring, measured from the actual CAD triangles (JG-035 R1).
 *
 * A through-hole interrupts two smooth cylindrical faces: the OD and the bore. On each face the
 * hole's edge is a closed loop of boundary edges of the "face triangles" (triangles whose three
 * vertices all sit on that cylinder). Loops that circle the axis are the shoulder edges and are
 * ignored; the remaining small closed loops are the apertures. Everything is measured in the
 * ring's own coordinates (axis = Z), so the patches built from them register to the source mesh
 * exactly instead of being authored by hand.
 */

export interface Aperture {
  surface: 'od' | 'bore'
  /** Cylinder radius the loop lies on (metres). */
  radius: number
  /** Loop in unwrapped (theta, z) pairs, theta in radians, continuous around `theta`. */
  loop: Float64Array
  /** Centre angle (bounding box centre of the unwrapped loop), radians in (-pi, pi]. */
  theta: number
  z: number
  /** Arc-length extents of the loop, metres (theta extent * radius, z extent). */
  arcExtent: number
  axialExtent: number
  /** Enclosed area on the unrolled cylinder, m^2. */
  area: number
  /** Radius of the circle with the same area, metres. */
  equivalentRadius: number
}

export interface ApertureOptions {
  radius: number
  boreRadius: number
  /** Distance a vertex may sit off the nominal cylinder and still count as on it. */
  tolerance?: number
}

const KEY = 1e7

function weld(position: ArrayLike<number>, count: number) {
  const ids = new Int32Array(count)
  const map = new Map<string, number>()
  for (let i = 0; i < count; i++) {
    const key = `${Math.round(position[i * 3] * KEY)},${Math.round(position[i * 3 + 1] * KEY)},${Math.round(position[i * 3 + 2] * KEY)}`
    let id = map.get(key)
    if (id === undefined) { id = map.size; map.set(key, id) }
    ids[i] = id
  }
  return { ids, unique: map.size }
}

export function findApertures(geometry: BufferGeometry, options: ApertureOptions): Aperture[] {
  const { radius, boreRadius, tolerance = 2e-5 } = options
  const position = geometry.getAttribute('position')
  const raw = position.array as ArrayLike<number>
  const index = geometry.getIndex()
  const triangles = index ? index.count / 3 : position.count / 3
  const at = (corner: number) => index ? index.getX(corner) : corner
  const { ids } = weld(raw, position.count)
  const out: Aperture[] = []
  for (const [surface, surfaceRadius] of [['od', radius], ['bore', boreRadius]] as const) {
    const onSurface = new Uint8Array(position.count)
    for (let i = 0; i < position.count; i++) onSurface[i] = Math.abs(Math.hypot(raw[i * 3], raw[i * 3 + 1]) - surfaceRadius) <= tolerance ? 1 : 0
    // Boundary edges of the face-triangle set (edge used by exactly one such triangle, by welded id).
    const edgeUse = new Map<string, number>()
    const edgeVerts = new Map<string, [number, number]>()
    for (let t = 0; t < triangles; t++) {
      const v = [at(t * 3), at(t * 3 + 1), at(t * 3 + 2)]
      if (!(onSurface[v[0]] && onSurface[v[1]] && onSurface[v[2]])) continue
      for (let e = 0; e < 3; e++) {
        const a = v[e], b = v[(e + 1) % 3]
        const wa = ids[a], wb = ids[b]
        if (wa === wb) continue
        const key = wa < wb ? `${wa}:${wb}` : `${wb}:${wa}`
        edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1)
        if (!edgeVerts.has(key)) edgeVerts.set(key, [a, b])
      }
    }
    const neighbours = new Map<number, number[]>()
    const representative = new Map<number, number>()
    for (const [key, uses] of edgeUse) {
      if (uses !== 1) continue
      const [a, b] = edgeVerts.get(key)!
      const wa = ids[a], wb = ids[b]
      representative.set(wa, a); representative.set(wb, b)
      if (!neighbours.has(wa)) neighbours.set(wa, [])
      if (!neighbours.has(wb)) neighbours.set(wb, [])
      neighbours.get(wa)!.push(wb); neighbours.get(wb)!.push(wa)
    }
    const visited = new Set<number>()
    for (const start of neighbours.keys()) {
      if (visited.has(start)) continue
      // Walk the loop; on a vertex touched by two loops, prefer the unvisited neighbour.
      const chain: number[] = [start]
      visited.add(start)
      let current = start
      for (;;) {
        const next = neighbours.get(current)!.find(n => !visited.has(n))
        if (next === undefined) break
        chain.push(next); visited.add(next); current = next
      }
      if (chain.length < 6) continue
      // Unwrap theta along the chain.
      const theta = new Float64Array(chain.length), z = new Float64Array(chain.length)
      let previous = 0
      for (let i = 0; i < chain.length; i++) {
        const v = representative.get(chain[i])!
        let a = Math.atan2(raw[v * 3 + 1], raw[v * 3])
        if (i > 0) { while (a - previous > Math.PI) a -= 2 * Math.PI; while (a - previous < -Math.PI) a += 2 * Math.PI }
        theta[i] = a; previous = a; z[i] = raw[v * 3 + 2]
      }
      const thetaSpan = Math.max(...theta) - Math.min(...theta)
      if (thetaSpan > Math.PI * 0.5) continue // shoulder / full-circumference loop
      // A real aperture closes on itself: the last vertex must neighbour the first.
      if (!neighbours.get(chain[chain.length - 1])!.includes(start)) continue
      const pairs = new Float64Array(chain.length * 2)
      let area = 0
      for (let i = 0; i < chain.length; i++) {
        pairs[i * 2] = theta[i]; pairs[i * 2 + 1] = z[i]
        const j = (i + 1) % chain.length
        area += (theta[i] * surfaceRadius) * z[j] - (theta[j] * surfaceRadius) * z[i]
      }
      area = Math.abs(area) / 2
      const thetaMid = (Math.max(...theta) + Math.min(...theta)) / 2
      const wrapped = Math.atan2(Math.sin(thetaMid), Math.cos(thetaMid))
      out.push({
        surface, radius: surfaceRadius, loop: pairs, theta: wrapped, z: (Math.max(...z) + Math.min(...z)) / 2,
        arcExtent: thetaSpan * surfaceRadius, axialExtent: Math.max(...z) - Math.min(...z), area, equivalentRadius: Math.sqrt(area / Math.PI),
      })
    }
  }
  return out.sort((a, b) => (a.surface === b.surface ? a.theta - b.theta : a.surface === 'od' ? -1 : 1))
}

export interface PatchOptions {
  /** Concentric rings between the loop and its centre. */
  rings?: number
  /** Radial lift off the cylinder in metres; positive = toward the viewer on that face. */
  lift: number
}

/**
 * Curved cover for one aperture: polar-interpolated rings from the loop to its centre, each point
 * projected back onto the cylinder (the straight chords of a flat disc would sag by r^2/2R).
 * OD patches face outward, bore patches face the axis. UV phase is the ring's own
 * `atan2/2pi + .5` (continuous across the branch cut inside the patch; the 96x repeat is integral).
 */
export function buildAperturePatch(aperture: Aperture, width: number, options: PatchOptions): BufferGeometry {
  const rings = options.rings ?? 3
  const n = aperture.loop.length / 2
  const outward = aperture.surface === 'od'
  const r = aperture.radius + (outward ? options.lift : -options.lift)
  const cTheta = (Math.max(...Array.from({ length: n }, (_, i) => aperture.loop[i * 2])) + Math.min(...Array.from({ length: n }, (_, i) => aperture.loop[i * 2]))) / 2
  const cZ = aperture.z
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [], index: number[] = []
  const push = (theta: number, z: number) => {
    positions.push(r * Math.cos(theta), r * Math.sin(theta), z)
    const s = outward ? 1 : -1
    normals.push(s * Math.cos(theta), s * Math.sin(theta), 0)
    uvs.push(theta / (2 * Math.PI) + 0.5, (z + width / 2) / width)
  }
  push(cTheta, cZ)
  for (let k = 1; k <= rings; k++) {
    const f = k / rings
    for (let i = 0; i < n; i++) push(cTheta + (aperture.loop[i * 2] - cTheta) * f, cZ + (aperture.loop[i * 2 + 1] - cZ) * f)
  }
  // Winding: the loop orientation is arbitrary, so choose the side whose geometric normal agrees
  // with the surface normal (the first fan triangle decides for all).
  const flip = (() => {
    const a = 0, b = 1, c = 2
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2]
    const bx = positions[b * 3] - ax, by = positions[b * 3 + 1] - ay, bz = positions[b * 3 + 2] - az
    const cx = positions[c * 3] - ax, cy = positions[c * 3 + 1] - ay, cz = positions[c * 3 + 2] - az
    const nx = by * cz - bz * cy, ny = bz * cx - bx * cz
    return nx * normals[0] + ny * normals[1] < 0
  })()
  const tri = (a: number, b: number, c: number) => flip ? index.push(a, c, b) : index.push(a, b, c)
  for (let i = 0; i < n; i++) tri(0, 1 + i, 1 + ((i + 1) % n))
  for (let k = 1; k < rings; k++) {
    const inner = 1 + (k - 1) * n, outer = 1 + k * n
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      tri(inner + i, outer + i, outer + j)
      tri(inner + i, outer + j, inner + j)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  geometry.setIndex(index)
  return geometry
}
