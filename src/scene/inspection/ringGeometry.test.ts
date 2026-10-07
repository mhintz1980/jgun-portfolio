import { describe, expect, it } from 'vitest'
import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial } from 'three'
import { createInspectionRing } from './ringGeometry'

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
