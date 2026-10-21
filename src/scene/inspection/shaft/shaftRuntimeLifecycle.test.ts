import { afterEach, describe, expect, it, vi } from 'vitest'
import { BufferGeometry, DirectionalLight, Group, Mesh, MeshStandardMaterial, Scene, type Object3D } from 'three'
import { createStorySession } from '../session'
import type { StoryContext } from '../story'
import { createShaftRuntime } from './shaftRuntime'
import type { ShaftCleanupFailure } from './tools'

afterEach(() => vi.restoreAllMocks())

function context(): StoryContext {
  return {
    gl: { toneMappingExposure: 1 } as StoryContext['gl'],
    scene: new Scene(), hero: new Scene(), rig: null, tier: 'full', aspect: 16 / 9,
  }
}

describe('shaft runtime synchronous construction ownership', () => {
  it.each(['shaper-clamp-nut', 'hob-arbor'] as const)(
    'forwards partial %s factory cleanup faults and still releases runtime siblings when the reporter throws', faultMesh => {
      const primary = new Error(`${faultMesh} attachment failed`)
      const toolCleanup = new Error('partial tool geometry cleanup failed')
      const hostCleanup = new Error('runtime light cleanup failed')
      const reporterError = new Error('cleanup reporter failed')
      const allocations = new Set<BufferGeometry>()
      const releases: BufferGeometry[] = []
      const mutableReports: Array<readonly ShaftCleanupFailure[]> = []
      const add = Group.prototype.add
      let failedGeometry: BufferGeometry | undefined
      // Let both factories allocate their actual meshes/geometries. Fail only after the
      // target geometry has been registered by its factory, before attaching the mesh.
      vi.spyOn(Group.prototype, 'add').mockImplementation(function (this: Group, ...objects: Object3D[]) {
        for (const object of objects) {
          if (object instanceof Mesh && (this.name === 'shaper-cutter' || this.name === 'hob')) {
            allocations.add(object.geometry)
            if (this.name === (faultMesh === 'shaper-clamp-nut' ? 'shaper-cutter' : 'hob')) {
              failedGeometry ??= object.geometry
            }
            if (object.name === faultMesh) {
              throw primary
            }
          }
        }
        return add.apply(this, objects)
      })
      vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(function (this: BufferGeometry) {
        releases.push(this)
        if (this === failedGeometry) throw toolCleanup
      })
      const lights = vi.spyOn(DirectionalLight.prototype, 'dispose').mockImplementation(() => { throw hostCleanup })
      const materials = vi.spyOn(MeshStandardMaterial.prototype, 'dispose').mockImplementation(() => {})
      const reporter = vi.fn((failures: readonly ShaftCleanupFailure[]) => {
        mutableReports.push(failures)
        throw reporterError
      })
      const fail = vi.fn()
      const session = createStorySession('shaft', { id: 72, current: () => true, fail })
      let caught: unknown
      try { createShaftRuntime(session, context(), { onCleanupFailure: reporter }) }
      catch (error) { caught = error }
      expect(caught).toBe(primary)
      // Shaper: disc/hub/clamp. Hob: the already completed shaper plus body/collar/arbor.
      expect(allocations.size).toBe(faultMesh === 'shaper-clamp-nut' ? 3 : 7)
      expect(releases).toHaveLength(allocations.size)
      for (const geometry of allocations) expect(releases.filter(value => value === geometry)).toHaveLength(1)
      expect(lights).toHaveBeenCalledTimes(2)
      expect(materials).toHaveBeenCalledTimes(8) // shaper flank plus hob gold/steel surfaces
      expect(reporter).toHaveBeenCalledTimes(2)
      expect(mutableReports[0]).toEqual([{ resource: 'tool-geometry', error: toolCleanup }])
      expect(mutableReports[1]).toEqual([
        { resource: 'graze-light', error: hostCleanup },
        { resource: 'key-light', error: hostCleanup },
      ])
      expect(mutableReports[0][0].error).toBe(toolCleanup)
      for (const failure of mutableReports[1]) expect(failure.error).toBe(hostCleanup)
      for (const failures of mutableReports) {
        expect(Object.isFrozen(failures)).toBe(true)
        for (const failure of failures) expect(Object.isFrozen(failure)).toBe(true)
      }
      expect(fail).not.toHaveBeenCalled() // synchronous construction throws to its caller
      session.cancel() // registered runtime rollback is idempotent after the factory fault
      expect(releases).toHaveLength(allocations.size)
      expect(lights).toHaveBeenCalledTimes(2)
      expect(materials).toHaveBeenCalledTimes(8)
      expect(reporter).toHaveBeenCalledTimes(2)
    },
  )

  it('cleans every early allocation despite light-cleanup and reporter faults', () => {
    const constructionError = new Error('first material clone failed')
    const failures: unknown[] = []
    const materialDispose = vi.spyOn(MeshStandardMaterial.prototype, 'dispose').mockImplementation(() => {})
    vi.spyOn(MeshStandardMaterial.prototype, 'clone').mockImplementation(() => { throw constructionError })
    vi.spyOn(DirectionalLight.prototype, 'dispose').mockImplementation(() => { throw new Error('light cleanup failed') })
    const session = createStorySession('shaft', { id: 71, current: () => true, fail: vi.fn() })
    expect(() => createShaftRuntime(session, context(), {
      onCleanupFailure: errors => { failures.push(...errors); throw new Error('reporter failed') },
    })).toThrow(constructionError)
    expect(materialDispose).toHaveBeenCalledOnce()
    expect(failures).toHaveLength(2)
  })
})
