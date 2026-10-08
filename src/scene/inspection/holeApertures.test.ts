import { beforeAll, describe, expect, it } from 'vitest'
import { BufferGeometry, Mesh } from 'three'
import { createInspectionRing, PATCH_LIFT } from './ringGeometry'
import { buildAperturePatch, findApertures } from './holeApertures'
import { loadRingSource } from './testing/loadRig'

type Ring = ReturnType<typeof createInspectionRing>
let ring: Ring, sourcePositions: Float32Array, sourceMesh: Mesh
let boreRadius = Infinity

beforeAll(async () => {
  const { source, meshes } = await loadRingSource()
  sourceMesh = meshes[0]
  sourcePositions = Float32Array.from(sourceMesh.geometry.getAttribute('position').array as Float32Array)
  ring = createInspectionRing(source, meshes)
  const p = ring.geometries[0].getAttribute('position')
  for (let i = 0; i < p.count; i++) boreRadius = Math.min(boreRadius, Math.hypot(p.getX(i), p.getY(i)))
}, 120000)

const deg = (r: number) => r * 180 / Math.PI
/** Area of a patch on the unrolled cylinder, from its own triangles. */
function patchArea(geometry: BufferGeometry, radius: number) {
  const p = geometry.getAttribute('position'), index = geometry.getIndex()!
  let area = 0
  const q = (i: number): [number, number] => [Math.atan2(p.getY(i), p.getX(i)) * radius, p.getZ(i)]
  for (let t = 0; t < index.count; t += 3) {
    const a = q(index.getX(t)), b = q(index.getX(t + 1)), c = q(index.getX(t + 2))
    // Unwrap across the branch cut relative to the first vertex.
    for (const v of [b, c]) while (v[0] - a[0] > Math.PI * radius) v[0] -= 2 * Math.PI * radius
    for (const v of [b, c]) while (v[0] - a[0] < -Math.PI * radius) v[0] += 2 * Math.PI * radius
    area += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
  }
  return area
}

describe('measured drilled-hole apertures of the real P003068 CAD (R1)', () => {
  it('finds exactly the four through-holes on both the OD and the bore, with the measured sizes and positions', () => {
    const od = ring.apertures.filter(a => a.surface === 'od'), bore = ring.apertures.filter(a => a.surface === 'bore')
    expect(od).toHaveLength(4)
    expect(bore).toHaveLength(4)
    const expected = [[-104.54, 3.453], [-44.54, 2.487], [75.46, 2.488], [135.46, 3.453]] as const
    od.forEach((a, i) => {
      expect(deg(a.theta)).toBeCloseTo(expected[i][0], 1)
      expect(a.equivalentRadius * 1000).toBeCloseTo(expected[i][1], 2)
      expect(a.z * 1000).toBeCloseTo(-2.704, 2)
    })
    // The bore opening of each hole sits on the same radial axis (same angle and height).
    bore.forEach((a, i) => { expect(deg(a.theta)).toBeCloseTo(expected[i][0], 1); expect(a.z * 1000).toBeCloseTo(-2.704, 1) })
    // No shoulder/full-circumference loop may be mistaken for an aperture.
    for (const a of ring.apertures) expect(a.arcExtent).toBeLessThan(0.0075)
  })

  it('builds one runtime-owned cover per aperture and never touches the source CAD', () => {
    expect(ring.patchGeometries).toHaveLength(8)
    expect(ring.group.children.filter(c => c.name.startsWith('P003068-hole-cover-'))).toHaveLength(8)
    expect(ring.patchMaterial).not.toBe(ring.material)
    expect(ring.patchMaterial.transparent).toBe(true)
    const after = sourceMesh.geometry.getAttribute('position').array as Float32Array
    expect(after.length).toBe(sourcePositions.length)
    for (let i = 0; i < after.length; i += 997) expect(after[i]).toBe(sourcePositions[i])
    for (const g of ring.patchGeometries) expect(ring.geometries).not.toContain(g)
  })

  it('covers each aperture exactly: patch area equals the measured opening and the rim vertices are the loop', () => {
    ring.apertures.forEach((a, i) => {
      const geometry = ring.patchGeometries[i], radius = a.radius + (a.surface === 'od' ? PATCH_LIFT : -PATCH_LIFT)
      expect(patchArea(geometry, radius) / (a.area * (radius / a.radius))).toBeCloseTo(1, 3)
      const p = geometry.getAttribute('position'), n = a.loop.length / 2, ringStart = 1 + (3 - 1) * n
      for (let k = 0; k < n; k++) {
        const x = p.getX(ringStart + k), y = p.getY(ringStart + k), z = p.getZ(ringStart + k)
        const theta = Math.atan2(y, x), want = a.loop[k * 2]
        const dTheta = Math.atan2(Math.sin(theta - want), Math.cos(theta - want))
        expect(Math.abs(dTheta * a.radius)).toBeLessThan(1e-8) // float32 positions
        expect(Math.abs(z - a.loop[k * 2 + 1])).toBeLessThan(1e-8)
      }
    })
  })

  it('is genuinely curved: every vertex sits on the cylinder (a flat disc would sag ~r^2/2R, >100 um)', () => {
    const flatSag = (3.453e-3) ** 2 / (2 * ring.radius)
    expect(flatSag).toBeGreaterThan(1e-4)
    ring.apertures.forEach((a, i) => {
      const expectedRadius = a.radius + (a.surface === 'od' ? PATCH_LIFT : -PATCH_LIFT)
      const p = ring.patchGeometries[i].getAttribute('position')
      for (let v = 0; v < p.count; v++) expect(Math.abs(Math.hypot(p.getX(v), p.getY(v)) - expectedRadius)).toBeLessThan(2e-9)
    })
  })

  it('faces the viewer on each surface: outward on the OD, toward the axis in the bore', () => {
    ring.apertures.forEach((a, i) => {
      const g = ring.patchGeometries[i], p = g.getAttribute('position'), index = g.getIndex()!, normal = g.getAttribute('normal')
      for (let t = 0; t < index.count; t += 3) {
        const [ia, ib, ic] = [index.getX(t), index.getX(t + 1), index.getX(t + 2)]
        const ux = p.getX(ib) - p.getX(ia), uy = p.getY(ib) - p.getY(ia), uz = p.getZ(ib) - p.getZ(ia)
        const vx = p.getX(ic) - p.getX(ia), vy = p.getY(ic) - p.getY(ia), vz = p.getZ(ic) - p.getZ(ia)
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz
        const geometric = nx * normal.getX(ia) + ny * normal.getY(ia)
        expect(geometric).toBeGreaterThan(0)
        const radial = (p.getX(ia) * normal.getX(ia) + p.getY(ia) * normal.getY(ia)) / Math.hypot(p.getX(ia), p.getY(ia))
        expect(a.surface === 'od' ? radial : -radial).toBeCloseTo(1, 6)
      }
    })
  })

  it('every point inside every measured opening is covered by a patch triangle (no pinholes)', () => {
    ring.apertures.forEach((a, i) => {
      const g = ring.patchGeometries[i], p = g.getAttribute('position'), index = g.getIndex()!
      const n = a.loop.length / 2
      const cTheta = [...Array(n).keys()].reduce((s, k) => s + a.loop[k * 2], 0) / n
      const inside = (u: number, z: number) => {
        let c = false
        for (let k = 0, j = n - 1; k < n; j = k++) {
          const xi = a.loop[k * 2], yi = a.loop[k * 2 + 1], xj = a.loop[j * 2], yj = a.loop[j * 2 + 1]
          if ((yi > z) !== (yj > z) && u < (xj - xi) * (z - yi) / (yj - yi) + xi) c = !c
        }
        return c
      }
      const covered = (u: number, z: number) => {
        for (let t = 0; t < index.count; t += 3) {
          const pts = [0, 1, 2].map(c => { const v = index.getX(t + c); let th = Math.atan2(p.getY(v), p.getX(v)); while (th - cTheta > Math.PI) th -= 2 * Math.PI; while (th - cTheta < -Math.PI) th += 2 * Math.PI; return [th, p.getZ(v)] })
          const d = (pts[1][1] - pts[2][1]) * (pts[0][0] - pts[2][0]) + (pts[2][0] - pts[1][0]) * (pts[0][1] - pts[2][1])
          const l1 = ((pts[1][1] - pts[2][1]) * (u - pts[2][0]) + (pts[2][0] - pts[1][0]) * (z - pts[2][1])) / d
          const l2 = ((pts[2][1] - pts[0][1]) * (u - pts[2][0]) + (pts[0][0] - pts[2][0]) * (z - pts[2][1])) / d
          if (l1 >= -1e-9 && l2 >= -1e-9 && 1 - l1 - l2 >= -1e-9) return true
        }
        return false
      }
      let sampled = 0
      const us = Array.from({ length: n }, (_, k) => a.loop[k * 2]), zs = Array.from({ length: n }, (_, k) => a.loop[k * 2 + 1])
      const [u0, u1, z0, z1] = [Math.min(...us), Math.max(...us), Math.min(...zs), Math.max(...zs)]
      for (let s = 0; s < 400; s++) {
        const u = u0 + ((s * 0.6180339887) % 1) * (u1 - u0), z = z0 + ((s * 0.7548776662) % 1) * (z1 - z0)
        if (!inside(u, z)) continue
        sampled++
        expect(covered(u, z)).toBe(true)
      }
      expect(sampled).toBeGreaterThan(150)
    })
  })

  it('repairs the knurl seam on the real mesh: 22 straddling CAD triangles in the source, none after the split', () => {
    const raw = sourceMesh.geometry, rp = raw.getAttribute('position'), ri = raw.getIndex()!
    const u = (i: number) => Math.atan2(rp.getY(i), rp.getX(i)) / (2 * Math.PI) + 0.5
    let rawStraddle = 0
    for (let t = 0; t < ri.count; t += 3) { const us = [u(ri.getX(t)), u(ri.getX(t + 1)), u(ri.getX(t + 2))]; if (Math.max(...us) - Math.min(...us) > 0.5) rawStraddle++ }
    expect(rawStraddle).toBe(22)
    const g = ring.geometries[0], uv = g.getAttribute('uv'), index = g.getIndex()!
    let worst = 0
    for (let t = 0; t < index.count; t += 3) { const us = [0, 1, 2].map(c => uv.getX(index.getX(t + c))); worst = Math.max(worst, Math.max(...us) - Math.min(...us)) }
    expect(worst).toBeLessThan(0.2)
    expect(g.getAttribute('position').count).toBe(rp.count + 22)
  })

  it('disposes every owned geometry, both materials and the shared normal map', () => {
    let disposed = 0
    for (const g of [...ring.geometries, ...ring.patchGeometries]) g.addEventListener('dispose', () => { disposed++ })
    ring.material.addEventListener('dispose', () => { disposed++ })
    ring.patchMaterial.addEventListener('dispose', () => { disposed++ })
    ring.normalMap.addEventListener('dispose', () => { disposed++ })
    ring.dispose()
    expect(disposed).toBe(ring.geometries.length + ring.patchGeometries.length + 3)
  })
})

describe('aperture detector on a ring without holes', () => {
  it('reports nothing for the plain cylinder', async () => {
    const { CylinderGeometry } = await import('three')
    const g = new CylinderGeometry(0.0377, 0.0377, 0.0272, 48, 1).rotateX(Math.PI / 2)
    expect(findApertures(g, { radius: 0.0377, boreRadius: 0.0319 })).toHaveLength(0)
    expect(buildAperturePatch).toBeTypeOf('function')
  })
})
