import { describe, expect, it } from 'vitest'
import type { TorqueWrenchBeat } from './beatTimeline'
import { createTorqueWrenchStore } from '../../state/torqueWrenchStore'
import {
  createTorqueScrollConductor,
  TORQUE_SCROLL_TRIGGER_ID,
  type TorqueConductorDependencies,
  type TorqueLenisConstructor,
  type TorqueLenisLike,
  type TorqueScrollTriggerLike,
  type TorqueScrollTriggerStaticLike,
  type TorqueScrollTriggerVars,
  type TorqueTickerLike,
} from './conductorRuntime'

const draftingBeat: TorqueWrenchBeat = {
  id: 'drafting',
  start: 0,
  end: 0.5,
  camera: 'registered',
  scene: 'drawing',
  director: 'opening',
}

const closeBeat: TorqueWrenchBeat = {
  id: 'close',
  start: 0.5,
  end: 1,
  camera: 'close',
  scene: 'close',
  director: 'close',
}

function sample(progress: number) {
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
    phase: localProgress < 0.1 ? ('entering' as const) : localProgress >= 0.9 ? ('exiting' as const) : ('active' as const),
    stateKey: `${beat.id}:${localProgress.toFixed(6)}`,
  }
}

class FakeEventTarget<T extends string> {
  readonly listeners = new Map<T, Set<() => void>>()

  constructor(private readonly faultStage: string | null) {}

  addEventListener(type: T, listener: () => void): void {
    if (`on-${type}` === this.faultStage) throw new Error(`fault:${this.faultStage}`)
    const set = this.listeners.get(type) ?? new Set<() => void>()
    set.add(listener)
    this.listeners.set(type, set)
  }

  removeEventListener(type: T, listener: () => void): void {
    this.listeners.get(type)?.delete(listener)
  }

  dispatch(type: T): void {
    for (const listener of [...this.listeners.get(type) ?? []]) listener()
  }

  get listenerCount(): number {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0)
  }
}

class FakeWindow extends FakeEventTarget<'resize' | 'pageshow'> {}
class FakeDocument extends FakeEventTarget<'visibilitychange'> {
  visibilityState: 'visible' | 'hidden' = 'visible'
}

class FakeTicker implements TorqueTickerLike {
  readonly callbacks = new Set<(time: number) => void>()
  readonly lagSmoothingCalls: Array<[number | boolean, number | undefined]> = []

  add(callback: (time: number) => void): unknown {
    if (this.faultStage === 'ticker.add') throw new Error('fault:ticker.add')
    this.callbacks.add(callback)
    return callback
  }

  remove(callback: (time: number) => void): void {
    this.callbacks.delete(callback)
  }

  lagSmoothing(threshold: number | boolean, adjustedLag?: number): void {
    if (this.faultStage === 'ticker.lagSmoothing') throw new Error('fault:ticker.lagSmoothing')
    this.lagSmoothingCalls.push([threshold, adjustedLag])
  }

  emit(time: number): void {
    for (const callback of [...this.callbacks]) callback(time)
  }

  constructor(private readonly faultStage: string | null = null) {}
}

class FakeLenis implements TorqueLenisLike {
  readonly options: { duration: number; smoothWheel: boolean; autoRaf: boolean }
  readonly scrollHandlers = new Set<() => void>()
  readonly rafCalls: number[] = []
  resizeCount = 0
  destroyed = false

  on(_event: 'scroll', callback: () => void): () => void {
    if (this.faultStage === 'lenis.on') throw new Error('fault:lenis.on')
    this.scrollHandlers.add(callback)
    return () => this.scrollHandlers.delete(callback)
  }

  raf(time: number): void {
    this.rafCalls.push(time)
  }

  resize(): void {
    this.resizeCount += 1
  }

  destroy(): void {
    this.destroyed = true
  }

  scroll(): void {
    for (const handler of [...this.scrollHandlers]) handler()
  }

  constructor(
    options: { duration: number; smoothWheel: boolean; autoRaf: boolean },
    private readonly faultStage: string | null = null,
  ) {
    this.options = options
  }
}

class FakeScrollTrigger implements TorqueScrollTriggerLike {
  refreshCount = 0
  killed = false

  constructor(
    readonly vars: TorqueScrollTriggerVars,
    public progress: number,
  ) {}

  refresh(): void {
    this.refreshCount += 1
    this.vars.onRefresh?.(this)
  }

  kill(): void {
    this.killed = true
  }

  emitUpdate(): void {
    this.vars.onUpdate?.(this)
  }
}

type RuntimeFaultStage =
  | 'lenis.constructor'
  | 'lenis.on'
  | 'ticker.add'
  | 'ticker.lagSmoothing'
  | 'scrollTrigger.create'
  | 'on-resize'
  | 'on-pageshow'
  | 'on-visibilitychange'
  | 'store.subscribe'
  | 'initial-sample'

interface RuntimeFixture {
  deps: TorqueConductorDependencies
  window: FakeWindow
  document: FakeDocument
  ticker: FakeTicker
  lenisInstances: FakeLenis[]
  scrollTrigger: FakeScrollTriggerStatic
}

class FakeScrollTriggerStatic implements TorqueScrollTriggerStaticLike {
  readonly triggers: FakeScrollTrigger[] = []
  updateCount = 0

  constructor(private readonly faultStage: string | null = null) {}

  create(vars: TorqueScrollTriggerVars): TorqueScrollTriggerLike {
    if (this.faultStage === 'scrollTrigger.create') throw new Error('fault:scrollTrigger.create')
    const trigger = new FakeScrollTrigger(vars, 0.25)
    this.triggers.push(trigger)
    return trigger
  }

  update(): void {
    this.updateCount += 1
  }
}

function makeRuntimeDeps(faultStage: RuntimeFaultStage | null = null): RuntimeFixture {
  const fakeWindow = new FakeWindow(faultStage)
  const fakeDocument = new FakeDocument(faultStage)
  const ticker = new FakeTicker(faultStage)
  const lenisInstances: FakeLenis[] = []
  const Lenis = function Lenis(options: { duration: number; smoothWheel: boolean; autoRaf: boolean }) {
    if (faultStage === 'lenis.constructor') throw new Error('fault:lenis.constructor')
    const instance = new FakeLenis(options, faultStage)
    lenisInstances.push(instance)
    return instance
  } as unknown as TorqueLenisConstructor
  const scrollTrigger = new FakeScrollTriggerStatic(faultStage)

  const deps: TorqueConductorDependencies = {
    window: fakeWindow,
    document: fakeDocument,
    gsap: { ticker },
    scrollTrigger,
    Lenis,
    // Registration belongs to the browser wrapper, outside this runtime fault inventory.
    registerPlugin: () => {},
  }

  return { deps, window: fakeWindow, document: fakeDocument, ticker, lenisInstances, scrollTrigger }
}

function makeStore(faultStage: RuntimeFaultStage | null = null) {
  return createTorqueWrenchStore({
    tier: 'full',
    sample: (progress) => {
      if (faultStage === 'initial-sample' && progress > 0) throw new Error('fault:initial-sample')
      return sample(progress)
    },
  })
}

describe('torque wrench conductor runtime', () => {
  it('creates one native input owner, one ticker callback, and one global trigger', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps })

    expect(fixture.lenisInstances).toHaveLength(1)
    expect(fixture.lenisInstances[0].options).toEqual({ duration: 0.8, smoothWheel: true, autoRaf: false })
    expect(fixture.ticker.callbacks).toHaveLength(1)
    expect(fixture.ticker.lagSmoothingCalls).toEqual([[0, undefined]])
    expect(fixture.scrollTrigger.triggers).toHaveLength(1)
    expect(fixture.scrollTrigger.triggers[0].vars).toMatchObject({
      id: TORQUE_SCROLL_TRIGGER_ID,
      start: 0,
      end: 'max',
    })
    expect('scrub' in fixture.scrollTrigger.triggers[0].vars).toBe(false)
    expect(store.getProgress()).toBe(0.25)

    fixture.ticker.emit(1)
    expect(fixture.lenisInstances[0].rafCalls).toEqual([1000])
    fixture.lenisInstances[0].scroll()
    expect(fixture.scrollTrigger.updateCount).toBe(1)
    fixture.scrollTrigger.triggers[0].progress = 0.62
    fixture.scrollTrigger.triggers[0].emitUpdate()
    expect(store.getProgress()).toBe(0.62)

    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 1,
      mountCount: 1,
      lenisInstances: 1,
      lenisScrollHandlers: 1,
      tickerCallbacks: 1,
      scrollTriggers: 1,
      domListeners: 3,
      storeLifecycleSubscriptions: 1,
      refreshCount: 0,
      visibilityResamples: 0,
      pageShowResamples: 0,
      startupFailureCount: 0,
      cleanupFailureCount: 0,
      lagSmoothingMode: 'configured-once',
    })

    handle.dispose()
    handle.dispose()
    expect(fixture.window.listenerCount).toBe(0)
    expect(fixture.document.listenerCount).toBe(0)
    expect(fixture.ticker.callbacks).toHaveLength(0)
    expect(fixture.scrollTrigger.triggers[0].killed).toBe(true)
    expect(fixture.lenisInstances[0].destroyed).toBe(true)
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 0,
      mountCount: 1,
      disposeCount: 1,
      lenisInstances: 0,
      lenisScrollHandlers: 0,
      tickerCallbacks: 0,
      scrollTriggers: 0,
      domListeners: 0,
      storeLifecycleSubscriptions: 0,
    })
  })

  it('refreshes and resamples on resize, visibility return, and pageshow', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps })
    const trigger = fixture.scrollTrigger.triggers[0]

    trigger.progress = 0.7
    fixture.window.dispatch('resize')
    expect(fixture.lenisInstances[0].resizeCount).toBe(1)
    expect(trigger.refreshCount).toBe(1)
    expect(store.getProgress()).toBe(0.7)

    fixture.document.visibilityState = 'hidden'
    fixture.document.dispatch('visibilitychange')
    expect(store.getProgress()).toBe(0.7)

    trigger.progress = 0.82
    fixture.document.visibilityState = 'visible'
    fixture.document.dispatch('visibilitychange')
    expect(trigger.refreshCount).toBe(2)
    expect(store.getProgress()).toBe(0.82)

    trigger.progress = 0.9
    fixture.window.dispatch('pageshow')
    expect(store.getProgress()).toBe(0.9)

    expect(store.getConductorDiagnostics()).toMatchObject({
      refreshCount: 2,
      visibilityResamples: 1,
      pageShowResamples: 1,
    })
    handle.dispose()
  })

  it('supports one StrictMode-style dispose/remount without a second lag-smoothing mutation', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const first = createTorqueScrollConductor({ store, ...fixture.deps })
    first.dispose()
    const second = createTorqueScrollConductor({ store, ...fixture.deps })

    expect(fixture.lenisInstances).toHaveLength(2)
    expect(fixture.lenisInstances[0].destroyed).toBe(true)
    expect(fixture.lenisInstances[1].destroyed).toBe(false)
    expect(fixture.scrollTrigger.triggers[0].killed).toBe(true)
    expect(fixture.scrollTrigger.triggers[1].killed).toBe(false)
    expect(fixture.ticker.callbacks).toHaveLength(1)
    expect(fixture.ticker.lagSmoothingCalls).toEqual([[0, undefined]])
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 1,
      mountCount: 2,
      disposeCount: 1,
      lenisInstances: 1,
      tickerCallbacks: 1,
      scrollTriggers: 1,
      lagSmoothingMode: 'already-configured',
    })

    second.dispose()
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 0,
      mountCount: 2,
      disposeCount: 2,
    })
  })

  it('rejects a duplicate owner before allocating resources or changing diagnostics', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps })
    const diagnosticsBefore = store.getConductorDiagnostics()

    expect(() => createTorqueScrollConductor({ store, ...fixture.deps })).toThrow(
      'already active for this store',
    )
    expect(fixture.lenisInstances).toHaveLength(1)
    expect(fixture.ticker.callbacks).toHaveLength(1)
    expect(fixture.scrollTrigger.triggers).toHaveLength(1)
    expect(store.getConductorDiagnostics()).toBe(diagnosticsBefore)

    handle.dispose()
  })

  it('can opt out of the shared lag-smoothing mutation in coordinated environments', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps, configureLagSmoothing: false })
    expect(fixture.ticker.lagSmoothingCalls).toEqual([])
    expect(store.getConductorDiagnostics().lagSmoothingMode).toBe('disabled')
    handle.dispose()
  })

  it('rejects nonfinite trigger progress and clamps finite runtime input without clocks', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps })
    const trigger = fixture.scrollTrigger.triggers[0]

    trigger.progress = Number.NaN
    trigger.emitUpdate()
    expect(store.getProgress()).toBe(0.25)
    expect(store.getConductorDiagnostics().invalidProgressInputs).toBe(1)

    trigger.progress = 2
    trigger.emitUpdate()
    expect(store.getProgress()).toBe(1)
    trigger.progress = -1
    trigger.emitUpdate()
    expect(store.getProgress()).toBe(0)

    fixture.ticker.emit(2)
    expect(fixture.lenisInstances[0].rafCalls).toEqual([2000])
    handle.dispose()
  })

  it('disposes its resources when terminal poster or failure state is reached', () => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const handle = createTorqueScrollConductor({ store, ...fixture.deps })
    store.setSceneStatus('failed')

    expect(fixture.window.listenerCount).toBe(0)
    expect(fixture.document.listenerCount).toBe(0)
    expect(fixture.ticker.callbacks).toHaveLength(0)
    expect(fixture.scrollTrigger.triggers[0].killed).toBe(true)
    expect(fixture.lenisInstances[0].destroyed).toBe(true)
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 0,
      disposeCount: 1,
      lenisInstances: 0,
      tickerCallbacks: 0,
      scrollTriggers: 0,
    })
    handle.dispose()
  })

  it.each(['ticker', 'trigger', 'lenis', 'listener'] as const)('seals the failed document and preserves a poisoned lease when %s cleanup throws', (owner) => {
    const fixture = makeRuntimeDeps()
    const store = makeStore()
    const failures: Error[] = []
    const handle = createTorqueScrollConductor({ store, ...fixture.deps, onCleanupFailure: (error) => failures.push(error) })
    const fault = () => { throw new Error('fault:cleanup') }
    if (owner === 'ticker') fixture.ticker.remove = fault
    if (owner === 'trigger') fixture.scrollTrigger.triggers[0].kill = fault
    if (owner === 'lenis') fixture.lenisInstances[0].destroy = fault
    if (owner === 'listener') fixture.window.removeEventListener = fault
    handle.dispose()
    const diagnostics = store.getConductorDiagnostics()
    expect(diagnostics.activeConductors).toBe(1)
    expect(diagnostics.cleanupFailureCount).toBeGreaterThan(0)
    expect(diagnostics.disposeCount).toBe(1)
    expect(store.getState().sceneStatus).toBe('failed')
    expect(failures).toHaveLength(1)
    handle.dispose()
    expect(store.getConductorDiagnostics()).toEqual(diagnostics)
    // Attempting to overwrite a terminal failure cannot allocate another owner.
    store.setSceneStatus('ready')
    createTorqueScrollConductor({ store, ...fixture.deps }).dispose()
    expect(fixture.lenisInstances).toHaveLength(1)
    fixture.ticker.emit(3)
    expect(fixture.lenisInstances[0].rafCalls).toEqual([])
    const frozenProgress = store.getProgress()
    fixture.scrollTrigger.triggers[0].progress = 1
    fixture.scrollTrigger.triggers[0].emitUpdate()
    fixture.lenisInstances[0].scroll()
    expect(store.getProgress()).toBe(frozenProgress)
  })

  it.each([
    'lenis.constructor',
    'lenis.on',
    'ticker.add',
    'ticker.lagSmoothing',
    'scrollTrigger.create',
    'on-resize',
    'on-pageshow',
    'on-visibilitychange',
    'store.subscribe',
    'initial-sample',
  ] satisfies RuntimeFaultStage[])('rolls back every acquired resource when %s throws', (faultStage) => {
    const fixture = makeRuntimeDeps(faultStage)
    const store = makeStore(faultStage)
    if (faultStage === 'store.subscribe') {
      store.subscribe = () => {
        throw new Error('fault:store.subscribe')
      }
    }

    expect(() => createTorqueScrollConductor({ store, ...fixture.deps })).toThrow(`fault:${faultStage}`)
    expect(fixture.lenisInstances.map((lenis) => lenis.destroyed)).toEqual(
      fixture.lenisInstances.map(() => true),
    )
    expect(fixture.ticker.callbacks).toHaveLength(0)
    expect(fixture.scrollTrigger.triggers.every((trigger) => trigger.killed)).toBe(true)
    expect(fixture.window.listenerCount).toBe(0)
    expect(fixture.document.listenerCount).toBe(0)
    expect(store.getConductorDiagnostics()).toMatchObject({
      activeConductors: 0,
      mountCount: 0,
      disposeCount: 0,
      lenisInstances: 0,
      lenisScrollHandlers: 0,
      tickerCallbacks: 0,
      scrollTriggers: 0,
      domListeners: 0,
      storeLifecycleSubscriptions: 0,
      startupFailureCount: 1,
      cleanupFailureCount: 0,
    })
  })
})
