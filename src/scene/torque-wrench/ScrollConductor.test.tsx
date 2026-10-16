import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTorqueWrenchStore } from '../../state/torqueWrenchStore'
import { installScrollConductor, ScrollConductor } from './ScrollConductor'
import type { TorqueConductorDependencies } from './conductorRuntime'
import { torqueNarrativeProgress } from './scrollPacing'

const beat = {
  id: 'drafting',
  start: 0,
  end: 1,
  camera: 'registered' as const,
  scene: 'drawing' as const,
  director: 'opening' as const,
}

function sample(progress: number) {
  return {
    progress,
    beat,
    index: 0,
    localProgress: progress,
    previousId: null,
    nextId: null,
    phase: 'active' as const,
    stateKey: `drafting:${progress.toFixed(6)}`,
  }
}

class MiniEventTarget {
  readonly listeners = new Set<() => void>()

  addEventListener(_type: string, listener: () => void): void {
    this.listeners.add(listener)
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener)
  }
}

function makeDependencies(failTriggerCreate = false): TorqueConductorDependencies {
  const windowTarget = new MiniEventTarget()
  const documentTarget = new MiniEventTarget()
  const tickerCallbacks = new Set<(time: number) => void>()

  return {
    window: windowTarget,
    document: {
      visibilityState: 'visible' as const,
      addEventListener: (type: string, listener: () => void) =>
        documentTarget.addEventListener(type, listener),
      removeEventListener: (type: string, listener: () => void) =>
        documentTarget.removeEventListener(type, listener),
    },
    gsap: {
      ticker: {
        add: (callback: (time: number) => void) => tickerCallbacks.add(callback),
        remove: (callback: (time: number) => void) => tickerCallbacks.delete(callback),
        lagSmoothing: vi.fn(),
      },
    },
    scrollTrigger: {
      create: () => {
        if (failTriggerCreate) throw new Error('fault:trigger-create')
        return { progress: 0.25, refresh: () => {}, kill: () => {} }
      },
      update: () => {},
    },
    Lenis: class {
      constructor() {
        return {
          on: () => () => {},
          raf: () => {},
          resize: () => {},
          destroy: () => {},
        }
      }
    } as unknown as TorqueConductorDependencies['Lenis'],
    registerPlugin: () => {},
  }
}

describe('ScrollConductor React wrapper', () => {
  it('renders no DOM and accepts the explicit failure callback', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    const onFailure = vi.fn()
    expect(renderToStaticMarkup(<ScrollConductor store={store} onFailure={onFailure} />)).toBe('')
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('returns idempotent cleanup for the effect body', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    const onFailure = vi.fn()
    const cleanup = installScrollConductor(store, onFailure, makeDependencies())
    expect(store.getConductorDiagnostics().activeConductors).toBe(1)
    expect(store.getProgress()).toBeCloseTo(torqueNarrativeProgress(.25), 10)
    cleanup()
    cleanup()
    expect(store.getConductorDiagnostics().activeConductors).toBe(0)
    expect(onFailure).not.toHaveBeenCalled()
  })

  it('routes synchronous startup faults through onFailure without leaking a conductor', () => {
    const store = createTorqueWrenchStore({ tier: 'full', sample })
    const onFailure = vi.fn()
    const cleanup = installScrollConductor(store, onFailure, makeDependencies(true))

    expect(onFailure).toHaveBeenCalledWith(new Error('fault:trigger-create'))
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 0,
      mountCount: 0,
      startupFailureCount: 1,
    })
    expect(() => cleanup()).not.toThrow()
  })
})
