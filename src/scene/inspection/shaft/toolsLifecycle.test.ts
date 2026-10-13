import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExtrudeGeometry, Mesh, MeshStandardMaterial } from 'three'
import { buildHob, buildShaperCutter } from './tools'

afterEach(() => vi.restoreAllMocks())

describe('shaft tool partial-construction ownership', () => {
  it('rolls the shaper back when its registered disc transform fails', () => {
    const material = new MeshStandardMaterial()
    const materialDispose = vi.spyOn(material, 'dispose')
    const geometryDispose = vi.spyOn(ExtrudeGeometry.prototype, 'dispose').mockImplementation(() => {})
    vi.spyOn(ExtrudeGeometry.prototype, 'translate').mockImplementation(() => { throw new Error('disc transform failed') })
    expect(() => buildShaperCutter(material)).toThrow('disc transform failed')
    expect(geometryDispose).toHaveBeenCalledOnce()
    expect(materialDispose).not.toHaveBeenCalled()
    material.dispose()
  })

  it('attempts every hob geometry when one cleanup fails and never disposes the borrowed material', () => {
    const material = new MeshStandardMaterial()
    const failures: unknown[] = []
    const hob = buildHob(material, {
      onCleanupFailure: errors => { failures.push(...errors); throw new Error('reporter failed') },
    })
    const materialDispose = vi.spyOn(material, 'dispose')
    const geometries = new Set()
    hob.root.traverse(object => {
      if (object instanceof Mesh) geometries.add(object.geometry)
    })
    expect(geometries.size).toBeGreaterThan(2)
    const disposers = [...geometries].map((geometry, index) => vi.spyOn(geometry as { dispose(): void }, 'dispose').mockImplementation(() => {
      if (index === 0) throw new Error('first hob cleanup failed')
    }))
    expect(() => hob.dispose()).not.toThrow()
    for (const dispose of disposers) expect(dispose).toHaveBeenCalledOnce()
    expect(materialDispose).not.toHaveBeenCalled()
    expect(failures).toHaveLength(1)
    material.dispose()
  })
})
