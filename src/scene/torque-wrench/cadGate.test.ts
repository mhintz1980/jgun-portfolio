import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTorqueScene, resetTorqueCadGateForTests, type TorqueSceneModule } from './cadGate'

afterEach(() => resetTorqueCadGateForTests())

describe('cadGate', () => {
  it('resolves the page-local Scene through the default path and caches the module', async () => {
    const first: TorqueSceneModule = await loadTorqueScene()
    expect(typeof first.default).toBe('function')
    const second = await loadTorqueScene()
    expect(second).toBe(first)
  }, 15000)

  it('seals after an import failure: no later call imports anything, all reject the same error', async () => {
    const failure = new Error('scene chunk failed')
    const failing = vi.fn(() => Promise.reject(failure))
    await expect(loadTorqueScene(failing)).rejects.toBe(failure)
    expect(failing).toHaveBeenCalledTimes(1)

    const good = vi.fn(() => Promise.resolve({ default: () => null }))
    await expect(loadTorqueScene(good)).rejects.toBe(failure)
    await expect(loadTorqueScene()).rejects.toBe(failure)
    expect(good).not.toHaveBeenCalled()
    expect(failing).toHaveBeenCalledTimes(1)
  })
})
