// Page-owned scene load lifecycle, extracted from the page effect so the idle-to-loading-to-ready
// and failure-sealing transitions are testable without a DOM. The store stays the single source
// of truth; React only mounts what onReady hands it.
import type { ComponentType } from 'react'
import type { TorqueWrenchStore } from '../../state/torqueWrenchStore'
import { loadTorqueScene, type TorqueSceneModule, type TorqueSceneProps } from './cadGate'

export type LoadTorqueScene = () => Promise<TorqueSceneModule>

export interface SceneLifecycleOptions {
  store: TorqueWrenchStore
  onReady: (sceneComponent: ComponentType<TorqueSceneProps>) => void
  onFailure: (error: unknown) => void
  /** Injectable for tests; production uses the sealing cadGate. */
  load?: LoadTorqueScene
}

export interface SceneLifecycleHandle {
  dispose(): void
}

const noopHandle: SceneLifecycleHandle = { dispose() {} }

export function runSceneLifecycle(options: SceneLifecycleOptions): SceneLifecycleHandle {
  const { store, onReady, onFailure } = options
  const load = options.load ?? loadTorqueScene
  const { sceneStatus, tier } = store.getState()
  if (tier === 'poster' || sceneStatus === 'failed') return noopHandle

  let live = true
  // A ready store may belong to a newly mounted page. Reattach the cached module without
  // restarting the real import or changing readiness back to loading.
  if (sceneStatus !== 'ready') store.setSceneStatus('loading')
  const canAttach = () => live && store.getState().tier !== 'poster' && store.getState().sceneStatus !== 'failed'
  Promise.resolve().then(() => canAttach() ? load() : null).then(
    (module) => {
      if (!module || !canAttach()) return
      onReady(module.default)
      store.setSceneStatus('ready')
    },
    (error) => {
      if (!canAttach()) return
      onFailure(error)
      store.setSceneStatus('failed')
    },
  )
  return {
    dispose() {
      live = false
    },
  }
}
