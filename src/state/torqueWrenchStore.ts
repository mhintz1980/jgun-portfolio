// Page-local store for the private /torque-wrench/ document. External store shape for
// useSyncExternalStore: frozen snapshots replaced on change, subscribe returns an unsubscribe.
// It must not import React components or Three.js objects, and it deliberately carries no
// canonical timeline/progress yet — that lands with the Stage 2 conductor.
import type { TierParam } from '../shared/pages'

/** Scene-layer lifecycle. `failed` is terminal for this document: no later status can revive it. */
export type TorqueSceneStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface TorqueWrenchPageState {
  readonly tier: TierParam
  readonly sceneStatus: TorqueSceneStatus
}

export interface TorqueWrenchStore {
  getState(): TorqueWrenchPageState
  subscribe(listener: () => void): () => void
  setTier(tier: TierParam): void
  setSceneStatus(status: TorqueSceneStatus): void
}

export function createTorqueWrenchStore(initial: { tier: TierParam }): TorqueWrenchStore {
  let state: TorqueWrenchPageState = Object.freeze({ tier: initial.tier, sceneStatus: 'idle' })
  const listeners = new Set<() => void>()
  const emit = () => {
    for (const listener of listeners) listener()
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setTier(tier) {
      if (tier === state.tier) return
      state = Object.freeze({ ...state, tier })
      emit()
    },
    setSceneStatus(status) {
      // Terminal failure: once the scene path has failed, later writes are ignored so no
      // transition can mount narrative CAD again in this document.
      if (status === state.sceneStatus || state.sceneStatus === 'failed') return
      state = Object.freeze({ ...state, sceneStatus: status })
      emit()
    },
  }
}
