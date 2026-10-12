import { describe, expect, it } from 'vitest'
import { createTorqueWrenchStore } from './torqueWrenchStore'

describe('torqueWrenchStore', () => {
  it('starts from the given tier with an idle scene and a cached snapshot', () => {
    const store = createTorqueWrenchStore({ tier: 'lite' })
    const first = store.getState()
    expect(first).toEqual({ tier: 'lite', sceneStatus: 'idle' })
    expect(store.getState()).toBe(first)
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    let calls = 0
    const unsubscribe = store.subscribe(() => {
      calls += 1
    })
    store.setSceneStatus('loading')
    expect(calls).toBe(1)
    unsubscribe()
    store.setSceneStatus('ready')
    expect(calls).toBe(1)
  })

  it('keeps the snapshot identical for same-value writes and replaces it for real changes', () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    let calls = 0
    store.subscribe(() => {
      calls += 1
    })
    store.setTier('full')
    expect(calls).toBe(0)
    const before = store.getState()
    store.setTier('poster')
    expect(calls).toBe(1)
    expect(store.getState().tier).toBe('poster')
    expect(store.getState()).not.toBe(before)
  })

  it('treats scene failure as terminal: no later status write can revive it', () => {
    const store = createTorqueWrenchStore({ tier: 'full' })
    store.setSceneStatus('loading')
    store.setSceneStatus('failed')
    const failed = store.getState()
    store.setSceneStatus('ready')
    store.setSceneStatus('loading')
    expect(store.getState()).toBe(failed)
    expect(store.getState().sceneStatus).toBe('failed')
  })
})
