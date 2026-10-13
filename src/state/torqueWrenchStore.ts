// Page-local store for the private /torque-wrench/ document. Lifecycle snapshots feed React;
// narrative progress and beat samples are imperative reads for the conductor and useFrame. The
// store never imports React components or Three.js objects and is created once per document.
import type { TierParam } from '../shared/pages'
import { sampleTorqueBeat, type TorqueBeatSample } from '../scene/torque-wrench/beatTimeline'

/** Scene-layer lifecycle. `failed` is terminal for this document: no later status can revive it. */
export type TorqueSceneStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface TorqueWrenchPageState {
  readonly tier: TierParam
  readonly sceneStatus: TorqueSceneStatus
}

export type TorqueBeatSampler = (progress: number) => TorqueBeatSample
export type TorqueBeatListener = (sample: TorqueBeatSample) => void

export type TorqueConductorLagSmoothingMode = 'disabled' | 'configured-once' | 'already-configured'

/** Read-only browser diagnostics. Counters survive conductor remounts on the same store. */
export interface TorqueConductorDiagnostics {
  readonly activeConductors: number
  readonly mountCount: number
  readonly lenisInstances: number
  readonly lenisScrollHandlers: number
  readonly tickerCallbacks: number
  readonly scrollTriggers: number
  readonly domListeners: number
  readonly storeLifecycleSubscriptions: number
  readonly disposeCount: number
  readonly refreshCount: number
  readonly visibilityResamples: number
  readonly pageShowResamples: number
  readonly invalidProgressInputs: number
  readonly startupFailureCount: number
  readonly cleanupFailureCount: number
  readonly lagSmoothingMode: TorqueConductorLagSmoothingMode
}

export interface TorqueWrenchStore {
  getState(): TorqueWrenchPageState
  subscribe(listener: () => void): () => void
  setTier(tier: TierParam): void
  setSceneStatus(status: TorqueSceneStatus): void
  getProgress(): number
  getNarrativeSample(): TorqueBeatSample
  setProgress(progress: number): void
  subscribeBeat(listener: TorqueBeatListener): () => void
  getActiveBeatId(): string
  /** Returns a frozen, store-owned snapshot; conductor writes use the internal recorder below. */
  getConductorDiagnostics(): TorqueConductorDiagnostics
}

export interface TorqueWrenchStoreInitial {
  tier: TierParam
  /** Dependency injection keeps beat-boundary store tests independent of the production timeline. */
  sample?: TorqueBeatSampler
}

const emptyDiagnostics: TorqueConductorDiagnostics = Object.freeze({
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

const diagnosticsByStore = new WeakMap<TorqueWrenchStore, TorqueConductorDiagnostics>()

export function getTorqueConductorDiagnostics(store: TorqueWrenchStore): TorqueConductorDiagnostics {
  return diagnosticsByStore.get(store) ?? emptyDiagnostics
}

/** Conductor-runtime-only write path; page/Scene consumers receive only the frozen getter. */
export function recordTorqueConductorDiagnostics(
  store: TorqueWrenchStore,
  diagnostics: TorqueConductorDiagnostics,
): void {
  diagnosticsByStore.set(store, Object.freeze({ ...diagnostics }))
}

function finiteClamp(progress: number): number | null {
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : null
}

export function createTorqueWrenchStore(initial: TorqueWrenchStoreInitial): TorqueWrenchStore {
  const sampleProgress = initial.sample ?? sampleTorqueBeat
  let state: TorqueWrenchPageState = Object.freeze({ tier: initial.tier, sceneStatus: 'idle' })
  let progress = 0
  let narrativeSample = Object.freeze(sampleProgress(0)) as TorqueBeatSample
  let activeBeatId = narrativeSample.beat.id
  const listeners = new Set<() => void>()
  const beatListeners = new Set<TorqueBeatListener>()

  const emitLifecycle = () => {
    for (const listener of listeners) listener()
  }

  const store: TorqueWrenchStore = {
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
      emitLifecycle()
    },
    setSceneStatus(status) {
      // Terminal failure: once the scene path has failed, later writes are ignored so no
      // transition can mount narrative CAD again in this document.
      if (status === state.sceneStatus || state.sceneStatus === 'failed') return
      state = Object.freeze({ ...state, sceneStatus: status })
      emitLifecycle()
    },
    getProgress: () => progress,
    getNarrativeSample: () => narrativeSample,
    setProgress(input) {
      const next = finiteClamp(input)
      if (next === null || next === progress) return

      const nextSample = Object.freeze(sampleProgress(next)) as TorqueBeatSample
      const nextBeatId = nextSample.beat.id
      const beatChanged = nextBeatId !== activeBeatId
      progress = next
      narrativeSample = nextSample
      activeBeatId = nextBeatId

      // Deliberately no lifecycle emit: progress is not React state and must not rerender the
      // page, canvas, or story while the user scrolls.
      if (beatChanged) {
        for (const listener of [...beatListeners]) listener(narrativeSample)
      }
    },
    subscribeBeat(listener) {
      beatListeners.add(listener)
      return () => {
        beatListeners.delete(listener)
      }
    },
    getActiveBeatId: () => activeBeatId,
    getConductorDiagnostics: () => getTorqueConductorDiagnostics(store),
  }

  return store
}
