// CPU-testable lifecycle core for the private torque document's one scroll conductor.
// React owns nothing here; ScrollConductor passes browser implementations in and disposes the
// returned handle on unmount. Startup is transactional and every API object is injectable.
import type {
  TorqueConductorDiagnostics,
  TorqueWrenchStore,
} from '../../state/torqueWrenchStore'
import { recordTorqueConductorDiagnostics } from '../../state/torqueWrenchStore'

export interface TorqueLenisLike {
  on(event: 'scroll', callback: () => void): () => void
  raf(time: number): void
  resize(): void
  destroy(): void
}

export type TorqueLenisConstructor = new (options: {
  duration: number
  smoothWheel: boolean
  autoRaf: boolean
}) => TorqueLenisLike

export interface TorqueTickerLike {
  add(callback: (time: number) => void): unknown
  remove(callback: (time: number) => void): void
  lagSmoothing(threshold: number | boolean, adjustedLag?: number): void
}

export interface TorqueGSAPLike {
  ticker: TorqueTickerLike
}

export interface TorqueScrollTriggerLike {
  readonly progress: number
  refresh(): void
  kill(): void
}

export interface TorqueScrollTriggerVars {
  id?: string
  start?: number | string
  end?: number | string
  onUpdate?: (trigger: TorqueScrollTriggerLike) => void
  onRefresh?: (trigger: TorqueScrollTriggerLike) => void
}

export interface TorqueScrollTriggerStaticLike {
  create(vars: TorqueScrollTriggerVars): TorqueScrollTriggerLike
  update(): void
}

export interface TorqueConductorWindowLike {
  addEventListener(type: 'resize' | 'pageshow', listener: () => void): void
  removeEventListener(type: 'resize' | 'pageshow', listener: () => void): void
}

export interface TorqueConductorDocumentLike {
  visibilityState: 'visible' | 'hidden'
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export interface TorqueConductorDependencies {
  window: TorqueConductorWindowLike
  document: TorqueConductorDocumentLike
  gsap: TorqueGSAPLike
  scrollTrigger: TorqueScrollTriggerStaticLike
  Lenis: TorqueLenisConstructor
  registerPlugin(): void
}

export interface TorqueConductorOptions extends TorqueConductorDependencies {
  store: TorqueWrenchStore
  /** Browser-private physical pacing; omitted by isolated lifecycle callers. */
  mapScrollProgress?: (fraction: number) => number
  onCleanupFailure?: (error: Error) => void
  /**
   * The accepted Lenis/GSAP clock requires lag smoothing off. This is a shared GSAP ticker
   * setting, so the default configures each ticker object only once and never restores it on
   * remount. Dependency-injected callers can disable it for isolated tests or coordinated pages.
   */
  configureLagSmoothing?: boolean
}

export interface TorqueConductorHandle {
  dispose(): void
}

export const TORQUE_SCROLL_TRIGGER_ID = 'torque-wrench-narrative'

interface TorqueConductorLease {
  readonly store: TorqueWrenchStore
}

const conductorLeases = new WeakMap<TorqueWrenchStore, TorqueConductorLease>()
const lagSmoothingConfiguredTickers = new WeakSet<TorqueTickerLike>()

function isTerminal(store: TorqueWrenchStore): boolean {
  const { tier, sceneStatus } = store.getState()
  return tier === 'poster' || sceneStatus === 'failed'
}

const noopHandle: TorqueConductorHandle = { dispose() {} }

export function createTorqueScrollConductor(options: TorqueConductorOptions): TorqueConductorHandle {
  const { store } = options
  const dependencies = options

  if (isTerminal(store)) return noopHandle

  // One active owner per document-local store. Reject before reading diagnostics or allocating
  // any browser resource; duplicate mounts are an integration defect, not a second conductor.
  if (conductorLeases.has(store)) {
    throw new Error('A torque wrench scroll conductor is already active for this store')
  }

  const baseline = store.getConductorDiagnostics()
  const lease: TorqueConductorLease = { store }
  conductorLeases.set(store, lease)

  let active = true
  let startupComplete = false
  let refreshCount = 0
  let visibilityResamples = 0
  let pageShowResamples = 0
  let invalidProgressInputs = 0
  let lagSmoothingMode: TorqueConductorDiagnostics['lagSmoothingMode'] = 'disabled'

  const ownedLenis = new Set<TorqueLenisLike>()
  const ownedLenisScrollHandlers = new Set<() => void>()
  const ownedTickerCallbacks = new Set<(time: number) => void>()
  const ownedTriggers = new Set<TorqueScrollTriggerLike>()
  const ownedDomRemovals = new Map<() => void, () => void>()
  const ownedLifecycleUnsubscribers = new Set<() => void>()

  function currentDiagnostics(): TorqueConductorDiagnostics {
    return {
      activeConductors: conductorLeases.has(store) ? 1 : 0,
      lenisInstances: ownedLenis.size,
      lenisScrollHandlers: ownedLenisScrollHandlers.size,
      tickerCallbacks: ownedTickerCallbacks.size,
      scrollTriggers: ownedTriggers.size,
      domListeners: ownedDomRemovals.size,
      storeLifecycleSubscriptions: ownedLifecycleUnsubscribers.size,
      mountCount: baseline.mountCount + (startupComplete ? 1 : 0),
      disposeCount: baseline.disposeCount,
      refreshCount: baseline.refreshCount + refreshCount,
      visibilityResamples: baseline.visibilityResamples + visibilityResamples,
      pageShowResamples: baseline.pageShowResamples + pageShowResamples,
      invalidProgressInputs: baseline.invalidProgressInputs + invalidProgressInputs,
      startupFailureCount: baseline.startupFailureCount,
      cleanupFailureCount: baseline.cleanupFailureCount,
      lagSmoothingMode,
    }
  }

  function publishDiagnostics(): void {
    recordTorqueConductorDiagnostics(store, currentDiagnostics())
  }

  function releaseAcquiredResources(): number {
    let cleanupFailures = 0
    active = false

    for (const tick of [...ownedTickerCallbacks]) {
      try {
        dependencies.gsap.ticker.remove(tick)
        ownedTickerCallbacks.delete(tick)
      } catch {
        cleanupFailures += 1
      }
    }

    for (const unsubscribe of [...ownedLifecycleUnsubscribers]) {
      try {
        unsubscribe()
        ownedLifecycleUnsubscribers.delete(unsubscribe)
      } catch {
        cleanupFailures += 1
      }
    }

    for (const [listener, remove] of [...ownedDomRemovals]) {
      try {
        remove()
        ownedDomRemovals.delete(listener)
      } catch {
        cleanupFailures += 1
      }
    }

    for (const unsubscribe of [...ownedLenisScrollHandlers]) {
      try {
        unsubscribe()
        ownedLenisScrollHandlers.delete(unsubscribe)
      } catch {
        cleanupFailures += 1
      }
    }

    for (const trigger of [...ownedTriggers]) {
      try {
        trigger.kill()
        ownedTriggers.delete(trigger)
      } catch {
        cleanupFailures += 1
      }
    }

    for (const lenis of [...ownedLenis]) {
      try {
        lenis.destroy()
        ownedLenis.delete(lenis)
      } catch {
        cleanupFailures += 1
      }
    }

    // Failed cleanup cannot prove a resource is gone. Keep a poisoned lease until
    // this store is collected, so even an attempted recovery cannot duplicate it.
    if (cleanupFailures === 0 && conductorLeases.get(store) === lease) conductorLeases.delete(store)
    return cleanupFailures
  }

  function dispose(): void {
    if (!active) return
    const cleanupFailures = releaseAcquiredResources()
    recordTorqueConductorDiagnostics(store, {
      ...currentDiagnostics(),
      disposeCount: baseline.disposeCount + 1,
      cleanupFailureCount: baseline.cleanupFailureCount + cleanupFailures,
    })
    if (cleanupFailures > 0) {
      store.setSceneStatus('failed')
      options.onCleanupFailure?.(new Error(`Torque conductor cleanup failed for ${cleanupFailures} owned resources`))
    }
  }

  try {
    // Private-page response tuning: the 1.1s baseline exceeded the contract's
    // 1.2s confirmed-rest budget (including its sustained 300ms rest window).
    const lenis = new dependencies.Lenis({ duration: 0.8, smoothWheel: true, autoRaf: false })
    ownedLenis.add(lenis)

    const removeLenisScrollHandler = lenis.on('scroll', () => { if (active) dependencies.scrollTrigger.update() })
    ownedLenisScrollHandlers.add(removeLenisScrollHandler)

    const ticker = dependencies.gsap.ticker
    const tick = (time: number): void => {
      if (active) lenis.raf(time * 1000)
    }
    ticker.add(tick)
    ownedTickerCallbacks.add(tick)

    if (options.configureLagSmoothing !== false) {
      if (lagSmoothingConfiguredTickers.has(ticker)) {
        lagSmoothingMode = 'already-configured'
      } else {
        ticker.lagSmoothing(0)
        lagSmoothingConfiguredTickers.add(ticker)
        lagSmoothingMode = 'configured-once'
      }
    }

    let trigger: TorqueScrollTriggerLike | null = null
    const commitProgress = (progress: number): void => {
      if (!active) return
      if (!Number.isFinite(progress)) {
        invalidProgressInputs += 1
        if (startupComplete) publishDiagnostics()
        return
      }
      const fraction = Math.min(1, Math.max(0, progress))
      store.setProgress(options.mapScrollProgress ? options.mapScrollProgress(fraction) : fraction)
    }

    trigger = dependencies.scrollTrigger.create({
      id: TORQUE_SCROLL_TRIGGER_ID,
      start: 0,
      end: 'max',
      onUpdate: (self) => commitProgress(self.progress),
      onRefresh: (self) => commitProgress(self.progress),
    })
    ownedTriggers.add(trigger)

    const resample = (): void => {
      if (active && trigger) commitProgress(trigger.progress)
    }

    const onResize = (): void => {
      if (!active) return
      lenis.resize()
      refreshCount += 1
      trigger?.refresh()
      publishDiagnostics()
    }
    const onVisibilityChange = (): void => {
      if (!active || dependencies.document.visibilityState !== 'visible') return
      visibilityResamples += 1
      refreshCount += 1
      // Refresh this instance before sampling so a stale cached position cannot survive tab return.
      trigger?.refresh()
      resample()
      publishDiagnostics()
    }
    const onPageShow = (): void => {
      if (!active) return
      pageShowResamples += 1
      resample()
      publishDiagnostics()
    }

    dependencies.window.addEventListener('resize', onResize)
    ownedDomRemovals.set(onResize, () => dependencies.window.removeEventListener('resize', onResize))
    dependencies.window.addEventListener('pageshow', onPageShow)
    ownedDomRemovals.set(onPageShow, () => dependencies.window.removeEventListener('pageshow', onPageShow))
    dependencies.document.addEventListener('visibilitychange', onVisibilityChange)
    ownedDomRemovals.set(
      onVisibilityChange,
      () => dependencies.document.removeEventListener('visibilitychange', onVisibilityChange),
    )

    const unsubscribeLifecycle = store.subscribe(() => {
      if (isTerminal(store)) dispose()
    })
    ownedLifecycleUnsubscribers.add(unsubscribeLifecycle)

    commitProgress(trigger.progress)
    startupComplete = true
    publishDiagnostics()

    return { dispose }
  } catch (error) {
    startupComplete = false
    const cleanupFailures = releaseAcquiredResources()
    try {
      recordTorqueConductorDiagnostics(store, {
        ...currentDiagnostics(),
        startupFailureCount: baseline.startupFailureCount + 1,
        cleanupFailureCount: baseline.cleanupFailureCount + cleanupFailures,
      })
      if (cleanupFailures > 0) store.setSceneStatus('failed')
    } catch {
      // The original initialization error is the useful failure; diagnostics must not replace it.
    }
    throw error
  }
}
