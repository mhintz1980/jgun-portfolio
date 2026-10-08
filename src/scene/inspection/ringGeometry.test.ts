import { describe, expect, it } from 'vitest'
import { BufferAttribute, BufferGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from 'three'
import { createInspectionRing, seamSplitCylindricalUv } from './ringGeometry'

describe('inspection material ownership across narrative modes', () => {
  it('owns a physical finish when the source is a Blueprint mesh', () => {
    const geometry = new CylinderGeometry(.037722, .037722, .027204, 32).rotateX(Math.PI / 2)
    const blueprint = new MeshBasicMaterial({ wireframe: true, transparent: true, opacity: .35 })
    const mesh = new Mesh(geometry, blueprint), unit = new Group()
    unit.add(mesh); unit.updateMatrixWorld(true)
    const ring = createInspectionRing(unit, [mesh])
    expect(ring.material).toBeInstanceOf(MeshPhysicalMaterial)
    expect(ring.material.wireframe).toBe(false)
    expect(ring.material.normalMap).toBeTruthy()
    expect(mesh.material).toBe(blueprint)
    expect(blueprint.opacity).toBe(.35)
    ring.dispose(); geometry.dispose(); blueprint.dispose()
  })
})

/** CAD-style welded cylinder: the seam vertices are SHARED, so one triangle row straddles the UV cut. */
function weldedCylinder(segments: number, radius: number, width: number, phase = 0) {
  const positions: number[] = [], normals: number[] = [], index: number[] = []
  for (const z of [-width / 2, width / 2]) for (let k = 0; k < segments; k++) {
    const a = phase + (k / segments) * Math.PI * 2
    positions.push(radius * Math.cos(a), radius * Math.sin(a), z); normals.push(Math.cos(a), Math.sin(a), 0)
  }
  for (let k = 0; k < segments; k++) {
    const k1 = (k + 1) % segments
    index.push(k, k1, segments + k, k1, segments + k1, segments + k)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  g.setIndex(index)
  return g
}
const maxTriangleU = (g: BufferGeometry) => {
  const uv = g.getAttribute('uv'), index = g.getIndex()!
  let worst = 0
  for (let t = 0; t < index.count; t += 3) {
    const us = [0, 1, 2].map(c => uv.getX(index.getX(t + c)))
    worst = Math.max(worst, Math.max(...us) - Math.min(...us))
  }
  return worst
}

describe('cylindrical UV branch cut (R2: un-knurled strip)', () => {
  it('reproduces the defect: an unsplit atan2 map spans nearly the whole U range inside one triangle', () => {
    const g = weldedCylinder(20, 0.0377, 0.0272)
    const position = g.getAttribute('position'), uvs: number[] = []
    for (let i = 0; i < position.count; i++) uvs.push(Math.atan2(position.getY(i), position.getX(i)) / (2 * Math.PI) + 0.5)
    const index = g.getIndex()!
    let worst = 0
    for (let t = 0; t < index.count; t += 3) { const us = [0, 1, 2].map(c => uvs[index.getX(t + c)]); worst = Math.max(worst, Math.max(...us) - Math.min(...us)) }
    expect(worst).toBeGreaterThan(0.9)
  })

  it.each([0, 0.013, 0.31, 1.7])('splits the cut so no triangle spans more than one segment of U (phase %f rad)', phase => {
    const g = weldedCylinder(20, 0.0377, 0.0272, phase)
    const before = g.getAttribute('position').count, triangles = g.getIndex()!.count
    const added = seamSplitCylindricalUv(g, 0.0272)
    expect(added).toBeGreaterThan(0)
    expect(g.getAttribute('position').count).toBe(before + added)
    expect(g.getIndex()!.count).toBe(triangles)
    expect(maxTriangleU(g)).toBeLessThanOrEqual(1 / 20 + 1e-6)
    // Duplicated vertices carry identical position and normal; only U changes (by exactly +1).
    const position = g.getAttribute('position'), normal = g.getAttribute('normal'), uv = g.getAttribute('uv')
    for (let i = before; i < position.count; i++) {
      let match = -1
      for (let j = 0; j < before && match < 0; j++) if (position.getX(i) === position.getX(j) && position.getY(i) === position.getY(j) && position.getZ(i) === position.getZ(j)) match = j
      expect(match).toBeGreaterThanOrEqual(0)
      expect(normal.getX(i)).toBe(normal.getX(match)); expect(normal.getY(i)).toBe(normal.getY(match))
      expect(uv.getX(i) - uv.getX(match)).toBeCloseTo(1, 6)
    }
  })

  it('keeps total U coverage at one turn and phase continuous across the cut', () => {
    const g = weldedCylinder(24, 0.0377, 0.0272)
    seamSplitCylindricalUv(g, 0.0272)
    const uv = g.getAttribute('uv')
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < uv.count; i++) { lo = Math.min(lo, uv.getX(i)); hi = Math.max(hi, uv.getX(i)) }
    expect(hi - lo).toBeGreaterThan(1 - 1e-6)
    expect(hi - lo).toBeLessThanOrEqual(1 + 1 / 24 + 1e-6)
  })

  it('leaves a non-indexed mesh topology alone and fixes U per triangle', () => {
    const indexed = weldedCylinder(20, 0.0377, 0.0272).toNonIndexed()
    expect(seamSplitCylindricalUv(indexed, 0.0272)).toBe(0)
    const uv = indexed.getAttribute('uv')
    let worst = 0
    for (let t = 0; t < uv.count; t += 3) { const us = [0, 1, 2].map(c => uv.getX(t + c)); worst = Math.max(worst, Math.max(...us) - Math.min(...us)) }
    expect(worst).toBeLessThanOrEqual(1 / 20 + 1e-6)
  })

  it('createInspectionRing wires the corrected map into every owned geometry', () => {
    const geometry = weldedCylinder(20, 0.0377, 0.0272)
    const mesh = new Mesh(geometry, new MeshBasicMaterial()), unit = new Group()
    unit.add(mesh); unit.updateMatrixWorld(true)
    const ring = createInspectionRing(unit, [mesh])
    for (const owned of ring.geometries) expect(maxTriangleU(owned)).toBeLessThanOrEqual(1 / 20 + 1e-6)
    expect(geometry.getAttribute('uv')).toBeUndefined() // source CAD geometry untouched
    ring.dispose(); geometry.dispose()
  })
})
