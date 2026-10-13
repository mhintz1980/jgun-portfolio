import { describe, expect, it } from 'vitest'
import type { TorqueWrenchBeat } from '../scene/torque-wrench/beatTimeline'
import type { TorqueBeatSample } from '../scene/torque-wrench/beatTimeline'
import {
  createTorqueWrenchStore,
  recordTorqueConductorDiagnostics,
  type TorqueBeatSampler,
} from './torqueWrenchStore'

const draftingBeat: TorqueWrenchBeat = Object.freeze({
  id: 'drafting',
  start: 0,
  end: 0.5,
  camera: 'registered',
  scene: 'drawing',
  director: 'opening',
})

const closeBeat: TorqueWrenchBeat = Object.freeze({
  id: 'close',
  start: 0.5,
  end: 1,
  camera: 'close',
  scene: 'close',
  director: 'close',
})

function fixtureSample(progress: number): TorqueBeatSample {
  const drafting = progress < 0.5
  const beat = drafting ? draftingBeat : closeBeat
  const localProgress = drafting ? progress / 0.5 : (progress - 0.5) / 0.5
  return {
    progress,
    beat,
    index: drafting ? 0 : 1,
    localProgress,
    previousId: drafting ? null : draftingBeat.id,
    nextId: drafting ? closeBeat.id : null,
    phase: localProgress < 0.1 ? 'entering' : localProgress >= 0.9 ? 'exiting' : 'active',
    stateKey: `${beat.id}:${localProgress.toFixed(6)}`,
  }
}

const sample: TorqueBeatSampler = fixtureSample

describe('torqueWrenchStore', () => {
  it('starts from the given tier with an idle scene and a cached snapshot', () => {
    const store = createTorqueWrenchStore({ tier: 'lite', sample })
    const first = store.getState()
    expect(first).toEqual({ tier: 'lite', sceneStatus: 'idle' })
    expect(store.getState()).toBe(first)
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
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
    const store = createTorqueWrenchStore({ tier: 'full', sample })
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
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    store.setSceneStatus('loading')
    store.setSceneStatus('failed')
    const failed = store.getState()
    store.setSceneStatus('ready')
    store.setSceneStatus('loading')
    expect(store.getState()).toBe(failed)
    expect(store.getState().sceneStatus).toBe('failed')
  })

  it('keeps progress out of lifecycle snapshots and never emits lifecycle listeners for it', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    let lifecycleCalls = 0
    store.subscribe(() => {
      lifecycleCalls += 1
    })

    store.setProgress(0.25)
    store.setProgress(0.49)
    store.setProgress(0.75)

    expect(store.getState()).toEqual({ tier: 'full', sceneStatus: 'idle' })
    expect(store.getProgress()).toBe(0.75)
    expect(lifecycleCalls).toBe(0)
  })

  it('ignores nonfinite input, clamps finite input, and holds identical progress without sampling', () => {
    const calls: number[] = []
    const store = createTorqueWrenchStore({
      tier: 'full',
      sample: (progress) => {
        calls.push(progress)
        return fixtureSample(progress)
      },
    })

    store.setProgress(Number.POSITIVE_INFINITY)
    store.setProgress(Number.NaN)
    expect(store.getProgress()).toBe(0)
    expect(calls).toEqual([0])

    store.setProgress(-2)
    expect(store.getProgress()).toBe(0)
    expect(calls).toEqual([0])

    store.setProgress(0.25)
    store.setProgress(0.25)
    expect(calls).toEqual([0, 0.25])
    store.setProgress(2)
    expect(store.getProgress()).toBe(1)
    expect(calls).toEqual([0, 0.25, 1])
  })

  it('exposes imperative narrative samples and the active beat id', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    store.setProgress(0.75)
    expect(store.getNarrativeSample()).toEqual(fixtureSample(0.75))
    expect(store.getActiveBeatId()).toBe('close')
  })

  it('emits beat listeners only when the active beat identity crosses a boundary', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    const received: TorqueBeatSample[] = []
    const unsubscribe = store.subscribeBeat((next) => {
      received.push(next)
    })

    store.setProgress(0.25)
    store.setProgress(0.49)
    expect(received).toEqual([])

    store.setProgress(0.5)
    expect(received).toEqual([fixtureSample(0.5)])
    store.setProgress(0.75)
    expect(received).toHaveLength(1)

    store.setProgress(0.25)
    expect(received).toEqual([fixtureSample(0.5), fixtureSample(0.25)])
    unsubscribe()
    store.setProgress(0.75)
    expect(received).toHaveLength(2)
  })

  it('returns frozen conductor diagnostics and records new snapshots without lifecycle emits', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    let lifecycleCalls = 0
    store.subscribe(() => {
      lifecycleCalls += 1
    })

    const initial = store.getConductorDiagnostics()
    expect(initial).toEqual({
      activeConductors: 0,
      mountCount: 0,
      lenisInstances: 0,
      lenisScrollHandlers: 0,
      tickerCallbacks: 0,
      scrollTriggers: 0,
      domListeners: 0,
      storeLifecycleSubscriptions: 0,
      disposeCount: 0,
      refreshCount: 0,
      visibilityResamples: 0,
      pageShowResamples: 0,
      invalidProgressInputs: 0,
      startupFailureCount: 0,
      cleanupFailureCount: 0,
      lagSmoothingMode: 'disabled',
    })
    expect(Object.isFrozen(initial)).toBe(true)

    recordTorqueConductorDiagnostics(store, {
      ...initial,
      activeConductors: 1,
      mountCount: 1,
      lenisInstances: 1,
      lenisScrollHandlers: 1,
      tickerCallbacks: 1,
      scrollTriggers: 1,
      domListeners: 3,
      storeLifecycleSubscriptions: 1,
      lagSmoothingMode: 'configured-once',
    })
    expect(store.getConductorDiagnostics().activeConductors).toBe(1)
    expect(lifecycleCalls).toBe(0)
  })
})
