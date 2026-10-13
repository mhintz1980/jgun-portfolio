import { afterEach, describe, expect, it, vi } from 'vitest'
import { DirectionalLight, MeshStandardMaterial, Scene } from 'three'
import { createStorySession } from '../session'
import type { StoryContext } from '../story'
import { createShaftRuntime } from './shaftRuntime'

afterEach(() => vi.restoreAllMocks())

function context(): StoryContext {
  return {
    gl: { toneMappingExposure: 1 } as StoryContext['gl'],
    scene: new Scene(), hero: new Scene(), rig: null, tier: 'full', aspect: 16 / 9,
  }
}

describe('shaft runtime synchronous construction ownership', () => {
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
