// The single lazy boundary between the torque page and every narrative dependency. The page may
// call loadTorqueScene; nothing else may dynamic-import, and nothing may statically import the
// scene tree. After any import failure the gate seals: every later call rejects the same error
// and no further imports are attempted, so a failed document never fetches narrative CAD again.
import type { ComponentType } from 'react'

export interface TorqueSceneProps {
  /** Initialization, context-loss and asynchronous renderer failures share the static fallback. */
  onFailure: (error: unknown) => void
}

export interface TorqueSceneModule {
  default: ComponentType<TorqueSceneProps>
}

export type TorqueSceneImporter = () => Promise<TorqueSceneModule>

const defaultImporter: TorqueSceneImporter = () => import('./Scene')

let cachedImport: Promise<TorqueSceneModule> | null = null
let sealedError: unknown = null

function seal(error: unknown): unknown {
  sealedError = error ?? new Error('Torque scene failed to load')
  cachedImport = null
  return sealedError
}

/**
 * Resolves the page-local scene module. Without an importer this uses the module-level cache, so
 * the real dynamic import happens at most once per document. An explicit importer (tests, failure
 * injection) bypasses the cache but obeys the same seal.
 */
export function loadTorqueScene(importer?: TorqueSceneImporter): Promise<TorqueSceneModule> {
  if (sealedError !== null) return Promise.reject(sealedError)
  if (importer) {
    return importer().catch((error) => {
      throw seal(error)
    })
  }
  if (!cachedImport) {
    cachedImport = defaultImporter().catch((error) => {
      throw seal(error)
    })
  }
  return cachedImport
}

/** Test-only: clears the cached module and the failure seal between tests. */
export function resetTorqueCadGateForTests(): void {
  cachedImport = null
  sealedError = null
}
