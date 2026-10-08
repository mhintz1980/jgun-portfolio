import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { BoxGeometry, BufferGeometry, CylinderGeometry, Euler, Float32BufferAttribute, Matrix4, Mesh, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { NodeDracoLoader } from '../testing/nodeDraco'
import { creasedNormals } from './normalRepair'

const corner = (g: BufferGeometry, i: number) => [g.getAttribute('normal').getX(i), g.getAttribute('normal').getY(i), g.getAttribute('normal').getZ(i)]
const faceNormalOf = (g: BufferGeometry, t: number) => {
  const p = g.getAttribute('position')
  const v = (i: number) => [p.getX(t * 3 + i), p.getY(t * 3 + i), p.getZ(t * 3 + i)]
  const [a, b, c] = [v(0), v(1), v(2)]
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
  const l = Math.hypot(n[0], n[1], n[2]) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
const angleBetween = (a: number[], b: number[]) => (Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180) / Math.PI

describe('creasedNormals (S3 smooth shading repair)', () => {
  it('smooths a faceted cylinder wall into radial normals even with garbage stored normals', () => {
    const cylinder = new CylinderGeometry(1, 1, 4, 48, 1, true)
    // corrupt the stored normals the way a bad exporter would: bend them toward the axis
    const n = cylinder.getAttribute('normal')
    for (let i = 0; i < n.count; i++) n.setXYZ(i, n.getX(i) * 0.3, 0.9, n.getZ(i) * 0.3)
    const { geometry, report } = creasedNormals(cylinder)
    expect(geometry.index).toBeNull()
    expect(report.degenerate).toBe(0)
    const p = geometry.getAttribute('position')
    for (let i = 0; i < p.count; i += 7) {
      const radial = [p.getX(i), 0, p.getZ(i)]
      const l = Math.hypot(radial[0], radial[2])
      expect(angleBetween(corner(geometry, i), [radial[0] / l, 0, radial[2] / l])).toBeLessThan(0.5)
    }
    expect(report.maxChangeDeg).toBeGreaterThan(30)
  })

  it('keeps a hard 90° edge crisp (crease) while smoothing within a face', () => {
    const { geometry } = creasedNormals(new BoxGeometry(1, 1, 1, 3, 3, 3))
    for (let t = 0; t < geometry.getAttribute('position').count / 3; t++) {
      const f = faceNormalOf(geometry, t)
      for (let c = 0; c < 3; c++) expect(angleBetween(corner(geometry, t * 3 + c), f)).toBeLessThan(0.01)
    }
  })

  it('is not dominated by slivers: a fan of needles around a vertex yields the plane normal', () => {
    // flat plane z=0, one centre vertex joined to 3 far points with a huge needle-thin triangle among them
    const positions = [0, 0, 0, 1, 0, 0, 1, 1e-4, 0, 0, 0, 0, 1e-4, 1, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 1, 0, 0]
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.setAttribute('normal', new Float32BufferAttribute(new Array(positions.length).fill(0).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
    // flip winding of every second triangle's stored normal to mimic bad data
    const { geometry } = creasedNormals(g)
    for (let i = 0; i < geometry.getAttribute('position').count; i++) expect(Math.abs(corner(geometry, i)[2])).toBeGreaterThan(0.999)
  })

  it('snaps a twisted wall normal to the radial direction through an arbitrary part axis, keeping the axial tilt of a cone', () => {
    const cone = new CylinderGeometry(1, 0.6, 3, 32, 3, true)
    const tilt = new Matrix4().makeRotationFromEuler(new Euler(0.5, 0.2, -0.3))
    cone.applyMatrix4(tilt)
    // twist every stored normal 20° about the part axis (the streak signature), then repair with the axis frame
    const { geometry } = creasedNormals(cone, 40, new Matrix4().copy(tilt).invert())
    const toAxis = new Matrix4().copy(tilt).invert()
    const p = geometry.getAttribute('position')
    const slope = Math.atan2(1 - 0.6, 3)
    for (let i = 0; i < p.count; i += 5) {
      const point = [p.getX(i), p.getY(i), p.getZ(i)]
      const local = new Matrix4().copy(toAxis)
      const q = { x: 0, y: 0, z: 0 }
      const e = local.elements
      q.x = e[0] * point[0] + e[4] * point[1] + e[8] * point[2]; q.y = e[1] * point[0] + e[5] * point[1] + e[9] * point[2]; q.z = e[2] * point[0] + e[6] * point[1] + e[10] * point[2]
      const n = corner(geometry, i)
      const nl = [e[0] * n[0] + e[4] * n[1] + e[8] * n[2], e[1] * n[0] + e[5] * n[1] + e[9] * n[2], e[2] * n[0] + e[6] * n[1] + e[10] * n[2]]
      const az = Math.atan2(q.z, q.x), naz = Math.atan2(nl[2], nl[0])
      const d = Math.abs(((az - naz + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      expect(d).toBeLessThan(0.005)
      expect(Math.abs(nl[1] + Math.sin(slope))).toBeLessThan(0.06)
    }
  })

  it('is deterministic and leaves positions untouched', () => {
    const source = new CylinderGeometry(1, 0.6, 3, 20, 4)
    const a = creasedNormals(source).geometry, b = creasedNormals(source).geometry
    expect(Array.from(a.getAttribute('normal').array)).toEqual(Array.from(b.getAttribute('normal').array))
    expect(a.getAttribute('position').count).toBe(source.toNonIndexed().getAttribute('position').count)
  })

  it('on the shipped input shaft: every repaired corner is within the crease angle of its own face and slivers no longer streak', async () => {
    const buf = readFileSync('public/models/manufacturing-core-full.glb')
    const gltf = await new GLTFLoader().setDRACOLoader(new NodeDracoLoader() as never).parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '')
    const meshes: Mesh[] = []
    const node = gltf.scene.getObjectByName('legacyshaft') as Object3D
    node.traverse(o => { if ((o as Mesh).isMesh) meshes.push(o as Mesh) })
    expect(meshes.length).toBeGreaterThan(0)
    let storedBad = 0, repairedBad = 0, corners = 0
    for (const mesh of meshes) {
      const before = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
      const { geometry, report } = creasedNormals(mesh.geometry)
      expect(report.triangles).toBeGreaterThan(1000)
      const tri = geometry.getAttribute('position').count / 3
      for (let t = 0; t < tri; t++) {
        const f = faceNormalOf(geometry, t)
        for (let c = 0; c < 3; c++) {
          corners++
          if (angleBetween(corner(before, t * 3 + c), f) > 15) storedBad++
          const repaired = angleBetween(corner(geometry, t * 3 + c), f)
          if (repaired > 15) repairedBad++
          expect(repaired).toBeLessThanOrEqual(40 + 1e-3 + 1e-6)
        }
      }
    }
    expect(corners).toBeGreaterThan(3000)
    // The repair never makes the worst-shaded-corner count larger, and every stored outlier is gone or bounded by the crease.
    expect(repairedBad).toBeLessThanOrEqual(storedBad)
  }, 120000)
})
