import { describe, expect, it, vi } from 'vitest'
import { createTorqueWrenchStore } from '../../state/torqueWrenchStore'
import { runSceneLifecycle } from './sceneLifecycle'

const flush = () => new Promise<void>((done) => setTimeout(done, 0))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const SceneStub = () => null

describe('sceneLifecycle', () => {
  it('drives idle to loading synchronously, then mounts the resolved component once ready', async () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    const gate = deferred<{ default: () => null }>()
    const onReady = vi.fn()
    const onFailure = vi.fn()
    runSceneLifecycle({ store, load: () => gate.promise, onReady, onFailure })
    expect(store.getState().sceneStatus).toBe('loading')
    gate.resolve({ default: SceneStub })
    await flush()
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onReady).toHaveBeenCalledWith(SceneStub)
    expect(onFailure).not.toHaveBeenCalled()
    expect(store.getState().sceneStatus).toBe('ready')
  })

  it('reports failure through the store as terminal', async () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    const gate = deferred<{ default: () => null }>()
    const failure = new Error('load failed')
    const onReady = vi.fn()
    const onFailure = vi.fn()
    runSceneLifecycle({ store, load: () => gate.promise, onReady, onFailure })
    gate.reject(failure)
    await flush()
    expect(onFailure).toHaveBeenCalledTimes(1)
    expect(onFailure).toHaveBeenCalledWith(failure)
    expect(onReady).not.toHaveBeenCalled()
    expect(store.getState().sceneStatus).toBe('failed')
    store.setSceneStatus('ready')
    expect(store.getState().sceneStatus).toBe('failed')
  })

  it('discards a disposed run: no callbacks and no status change after resolution', async () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    const gate = deferred<{ default: () => null }>()
    const onReady = vi.fn()
    const onFailure = vi.fn()
    const handle = runSceneLifecycle({ store, load: () => gate.promise, onReady, onFailure })
    handle.dispose()
    gate.resolve({ default: SceneStub })
    await flush()
    expect(onReady).not.toHaveBeenCalled()
    expect(onFailure).not.toHaveBeenCalled()
    expect(store.getState().sceneStatus).toBe('loading')
  })

  it('never drives a terminal document: a failed store skips the load entirely', () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    store.setSceneStatus('failed')
    const load = vi.fn(() => Promise.resolve({ default: SceneStub }))
    const onReady = vi.fn()
    const onFailure = vi.fn()
    const handle = runSceneLifecycle({ store, load, onReady, onFailure })
    handle.dispose()
    expect(load).not.toHaveBeenCalled()
    expect(store.getState().sceneStatus).toBe('failed')
  })

  it('skips poster documents before evaluating the loader', async () => {
    const store = createTorqueWrenchStore({ tier: 'poster' })
    const load = vi.fn(() => Promise.resolve({ default: SceneStub }))
    runSceneLifecycle({ store, load, onReady: vi.fn(), onFailure: vi.fn() })
    await flush()
    expect(load).not.toHaveBeenCalled()
    expect(store.getState().sceneStatus).toBe('idle')
  })

  it('reattaches a ready cached module after the page remounts', async () => {
    const store = createTorqueWrenchStore({ tier: 'lite' })
    const module = { default: SceneStub }
    const load = vi.fn(() => Promise.resolve(module))
    const first = runSceneLifecycle({ store, load, onReady: vi.fn(), onFailure: vi.fn() })
    await flush()
    first.dispose()
    expect(store.getState().sceneStatus).toBe('ready')
    const onReady = vi.fn()
    runSceneLifecycle({ store, load, onReady, onFailure: vi.fn() })
    expect(store.getState().sceneStatus).toBe('ready')
    await flush()
    expect(onReady).toHaveBeenCalledWith(SceneStub)
  })

  it('does not attach a pending scene after a poster downgrade', async () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    const gate = deferred<{ default: () => null }>()
    const onReady = vi.fn()
    runSceneLifecycle({ store, load: () => gate.promise, onReady, onFailure: vi.fn() })
    await Promise.resolve()
    store.setTier('poster')
    gate.resolve({ default: SceneStub })
    await flush()
    expect(onReady).not.toHaveBeenCalled()
  })
})
