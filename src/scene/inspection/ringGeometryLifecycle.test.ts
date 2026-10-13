import { afterEach, describe, expect, it, vi } from 'vitest'
import { CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, type BufferGeometry, type Object3D } from 'three'
import { createInspectionRing, type RingGeometryCleanupReport } from './ringGeometry'
import type { Aperture } from './holeApertures'

const apertureMocks = vi.hoisted(() => ({
  findApertures: vi.fn(),
  buildAperturePatch: vi.fn(),
}))

vi.mock('./holeApertures', async importOriginal => {
  const actual = await importOriginal<typeof import('./holeApertures')>()
  apertureMocks.findApertures.mockImplementation((...args: Parameters<typeof actual.findApertures>) => actual.findApertures(...args))
  apertureMocks.buildAperturePatch.mockImplementation((...args: Parameters<typeof actual.buildAperturePatch>) => actual.buildAperturePatch(...args))
  return { ...actual, findApertures: apertureMocks.findApertures, buildAperturePatch: apertureMocks.buildAperturePatch }
})

afterEach(() => { vi.clearAllMocks() })

function sourceWith(geometry: BufferGeometry): { source: Object3D; mesh: Mesh } {
  const mesh = new Mesh(geometry, new MeshBasicMaterial()), source = new Group()
  source.add(mesh); source.updateWorldMatrix(true, true)
  return { source, mesh }
}

function plainRingGeometry(): BufferGeometry {
  return new CylinderGeometry(.037722, .037722, .027204217025541766, 48).rotateX(Math.PI / 2)
}

function syntheticAperture(theta: number): Aperture {
  const loop = new Float64Array(16)
  for (let index = 0; index < 8; index++) {
    const angle = theta + (index / 8 - .5) * .18
    loop[index * 2] = angle; loop[index * 2 + 1] = Math.sin(index / 7 * Math.PI * 2) * .0005
  }
  return {
    surface: 'od', radius: .037722, loop, theta, z: 0,
    arcExtent: .037722 * .18, axialExtent: .001, area: 1e-6, equivalentRadius: Math.sqrt(1e-6 / Math.PI),
  }
}

describe('inspection ring factory partial-allocation ownership', () => {
  it('disposes the first owned clone when the second source clone fails', () => {
    const firstGeometry = plainRingGeometry(), secondGeometry = plainRingGeometry()
    const first = sourceWith(firstGeometry), second = sourceWith(secondGeometry)
    first.source.add(second.mesh); first.source.updateWorldMatrix(true, true)
    const ownedClones: BufferGeometry[] = []
    const originalFirstClone = firstGeometry.clone.bind(firstGeometry)
    let ownedCloneDispose: ReturnType<typeof vi.spyOn> | undefined
    const firstSourceDispose = vi.spyOn(firstGeometry, 'dispose'), secondSourceDispose = vi.spyOn(secondGeometry, 'dispose')
    const firstClone = vi.spyOn(firstGeometry, 'clone').mockImplementation(function (this: BufferGeometry) {
      const clone = originalFirstClone(); ownedClones.push(clone)
      ownedCloneDispose = vi.spyOn(clone, 'dispose'); return clone
    })
    const failure = new Error('second source clone failed')
    const secondClone = vi.spyOn(secondGeometry, 'clone').mockImplementation(() => { throw failure })
    expect(() => createInspectionRing(first.source, [first.mesh, second.mesh])).toThrow(failure)
    expect(ownedClones).toHaveLength(1)
    expect(ownedCloneDispose).toHaveBeenCalledOnce()
    expect(firstSourceDispose).not.toHaveBeenCalled(); expect(secondSourceDispose).not.toHaveBeenCalled()
    firstClone.mockRestore(); secondClone.mockRestore()
    firstGeometry.dispose(); secondGeometry.dispose()
  })

  it('preserves the material construction fault when first-material cleanup and reporting both fail', () => {
    const geometry = plainRingGeometry(), { source, mesh } = sourceWith(geometry)
    const sourceDispose = vi.spyOn(geometry, 'dispose')
    const originalClone = MeshPhysicalMaterial.prototype.clone
    const ownedMaterials: MeshPhysicalMaterial[] = []
    let cloneCalls = 0
    const constructionFailure = new Error('second material failed')
    const cleanupFailure = new Error('first material cleanup failed')
    const materialClone = vi.spyOn(MeshPhysicalMaterial.prototype, 'clone').mockImplementation(function (this: MeshPhysicalMaterial) {
      const material = originalClone.call(this) as MeshPhysicalMaterial
      if (++cloneCalls === 1) {
        ownedMaterials.push(material)
        material.dispose = () => { throw cleanupFailure }
      }
      if (cloneCalls === 2) throw constructionFailure
      return material
    })
    const reports: RingGeometryCleanupReport[] = []
    const callback = vi.fn((report: RingGeometryCleanupReport) => {
      reports.push(report); throw new Error('cleanup report channel failed')
    })
    expect(() => createInspectionRing(source, [mesh], callback)).toThrow(constructionFailure)
    expect(callback).toHaveBeenCalledOnce()
    expect(reports[0]).toMatchObject({ phase: 'construction', resource: 'material', error: cleanupFailure })
    expect(sourceDispose).not.toHaveBeenCalled()
    materialClone.mockRestore(); geometry.dispose()
  })

  it('disposes an earlier patch when a later patch construction fails', async () => {
    const geometry = plainRingGeometry(), { source, mesh } = sourceWith(geometry)
    const sourceDispose = vi.spyOn(geometry, 'dispose')
    const actual = await vi.importActual<typeof import('./holeApertures')>('./holeApertures')
    const firstAperture = syntheticAperture(-.1), secondAperture = syntheticAperture(.12)
    let firstPatch: BufferGeometry | undefined, firstPatchDispose: ReturnType<typeof vi.spyOn> | undefined
    const patchFailure = new Error('second patch failed')
    apertureMocks.findApertures.mockImplementationOnce(() => [firstAperture, secondAperture])
    apertureMocks.buildAperturePatch
      .mockImplementationOnce((aperture: Aperture, width: number) => {
        firstPatch = actual.buildAperturePatch(aperture, width, { lift: 6e-6 })
        firstPatchDispose = vi.spyOn(firstPatch, 'dispose'); return firstPatch
      })
      .mockImplementationOnce(() => { throw patchFailure })
    expect(() => createInspectionRing(source, [mesh])).toThrow(patchFailure)
    expect(firstPatchDispose).toHaveBeenCalledOnce()
    expect(sourceDispose).not.toHaveBeenCalled()
    geometry.dispose()
  })

  it('keeps successful disposal idempotent when a disposal report callback throws', () => {
    const geometry = plainRingGeometry(), { source, mesh } = sourceWith(geometry)
    const reports: RingGeometryCleanupReport[] = []
    const callback = vi.fn((report: RingGeometryCleanupReport) => {
      reports.push(report); throw new Error('cleanup report channel failed')
    })
    const ring = createInspectionRing(source, [mesh], callback)
    const geometryDispose = vi.spyOn(ring.geometries[0], 'dispose')
    const materialDispose = vi.spyOn(ring.material, 'dispose')
    const patchMaterialDispose = vi.spyOn(ring.patchMaterial, 'dispose')
    const normalMapFailure = new Error('normal map cleanup failed')
    ring.normalMap.dispose = () => { throw normalMapFailure }
    ring.dispose()
    ring.dispose()
    expect(geometryDispose).toHaveBeenCalledOnce(); expect(materialDispose).toHaveBeenCalledOnce()
    expect(patchMaterialDispose).toHaveBeenCalledOnce()
    expect(reports).toEqual([{ phase: 'dispose', resource: 'normal-map', error: normalMapFailure }])
    geometry.dispose()
  })
})
