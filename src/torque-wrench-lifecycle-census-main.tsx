// JG-038 dev-only lifecycle census. This document deliberately reuses the real page, store,
// tier resolution, fade, and StrictMode root; it never imports into the production page entry.
import { Profiler, StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import './index.css'
import { TorqueWrenchPage } from './scene/torque-wrench/TorqueWrenchPage'
import { readReducedMotion } from './scene/torque-wrench/tier'
import { resolveEntryTier } from './shared/pages'
import { installPageFade } from './shared/pageFade'
import { createTorqueWrenchStore } from './state/torqueWrenchStore'

type CensusPhase = 'startup' | 'steady' | 'same-beat-scroll' | 'post-scroll'
type EffectPhase = 'setup' | 'cleanup'

interface ContextCall {
  index: number
  requestedType: string
  connectedAtCall: boolean
  returnedContext: boolean
  canvasId: number
  phase: CensusPhase
  timestamp: number
}

interface EffectEvent {
  name: string
  phase: EffectPhase
  censusPhase: CensusPhase
  timestamp: number
}

interface DomCommit {
  id: string
  reactPhase: string
  censusPhase: CensusPhase
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
}

interface R3fCommit {
  rendererId: number | string
  knownR3fRenderer: boolean
  censusPhase: CensusPhase
  timestamp: number
  didError: boolean | null
}

interface RendererRegistration {
  rendererId: number | string
  packageName: unknown
  version: unknown
  reconcilerVersion: unknown
  observedBy: 'initial-roster' | 'inject-wrapper'
}

interface StatusEvent {
  status: string
  tier: string
  censusPhase: CensusPhase
  timestamp: number
}

interface ResourceCensus {
  name: string
  initiatorType: string
  nextHopProtocol: string
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  duration: number
  responseStatus: number | null
  cacheState: 'UNVERIFIED'
}

interface CensusBridge {
  presentBeforeReactImports: boolean
  supportsFiber: boolean | null
  disabled: boolean | null
  injectWrapped: boolean
  onCommitFiberRootWrapped: boolean
  missingReason: string | null
  registrations: RendererRegistration[]
  commits: R3fCommit[]
}

type HookSource = 'existing-extension-hook' | 'harness-passive-fallback' | 'unobserved'

interface DevtoolsHookCensus {
  installedBeforeReactImports: boolean
  presentAtInstrumentation: boolean
  supportsFiber: boolean | null
  disabled: boolean | null
  onCommitFiberRootWrapped: boolean
  injectWrapped: boolean
  source: HookSource
  missingReason: string | null
}

interface CensusState {
  startedAt: string
  phase: CensusPhase
  importMetaHot: boolean
  contexts: ContextCall[]
  contextTruncated: boolean
  effects: EffectEvent[]
  effectTruncated: boolean
  domCommits: DomCommit[]
  domCommitTruncated: boolean
  r3fCommits: R3fCommit[]
  r3fCommitTruncated: boolean
  rendererRegistrations: RendererRegistration[]
  status: StatusEvent[]
  statusTruncated: boolean
  devtoolsHook: DevtoolsHookCensus
  limits: { events: number }
}

declare global {
  interface Window {
    __torqueCensusHookSource?: 'existing-extension-hook' | 'harness-passive-fallback'
    __torqueCensusBridge?: CensusBridge
    __torqueCensus?: {
      state: CensusState
      setPhase(phase: CensusPhase): void
      collect(): {
        startedAt: string
        phase: CensusPhase
        importMetaHot: boolean
        contexts: ContextCall[]
        contextSummary: {
          totalCalls: number
          connectedCalls: number
          connectedContextReturns: number
          detachedCalls: number
          detachedContextReturns: number
          distinctCanvases: number
        }
        effects: EffectEvent[]
        domCommits: DomCommit[]
        domCommitSummary: ReturnType<typeof summarizeCommits>
        r3fCommits: R3fCommit[]
        r3fCommitSummary: ReturnType<typeof summarizeCommits>
        rendererRegistrations: RendererRegistration[]
        status: StatusEvent[]
        domCommitTruncated: boolean
        r3fCommitTruncated: boolean
        resources: ResourceCensus[]
        documentCanvasCount: number
        devtoolsHook: CensusState['devtoolsHook']
        limitations: string[]
      }
    }
  }
}

const MAX_EVENTS = 512
type TruncatedFlag = 'contextTruncated' | 'effectTruncated' | 'domCommitTruncated' | 'r3fCommitTruncated' | 'statusTruncated'
const state: CensusState = {
  startedAt: new Date().toISOString(),
  phase: 'startup',
  importMetaHot: Boolean(import.meta.hot),
  contexts: [],
  contextTruncated: false,
  effects: [],
  effectTruncated: false,
  domCommits: [],
  domCommitTruncated: false,
  r3fCommits: [],
  r3fCommitTruncated: false,
  rendererRegistrations: [],
  status: [],
  statusTruncated: false,
  devtoolsHook: {
    presentAtInstrumentation: false,
    installedBeforeReactImports: false,
    supportsFiber: null,
    disabled: null,
    onCommitFiberRootWrapped: false,
    injectWrapped: false,
    source: 'unobserved',
    missingReason: null,
  },
  limits: { events: MAX_EVENTS },
}

function push<T>(list: T[], value: T, truncatedKey: TruncatedFlag): void {
  if (list.length >= MAX_EVENTS) {
    state[truncatedKey] = true
    return
  }
  list.push(value)
}

function now(): number {
  return typeof performance === 'object' && typeof performance.now === 'function' ? performance.now() : Date.now()
}

function hookSource(value: Window['__torqueCensusHookSource']): HookSource {
  return value === 'existing-extension-hook' || value === 'harness-passive-fallback' ? value : 'unobserved'
}

// Pass-through context census. isConnected at the moment of the call is the only detached/connected
// classification; successful calls still do not prove later disposal or current liveness.
const originalGetContext = HTMLCanvasElement.prototype.getContext
const canvasIds = new WeakMap<HTMLCanvasElement, number>()
let nextCanvasId = 1
HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  requestedType: string,
  ...options: unknown[]
) {
  const connectedAtCall = this.isConnected
  let canvasId = canvasIds.get(this)
  if (canvasId === undefined) {
    canvasId = nextCanvasId++
    canvasIds.set(this, canvasId)
  }
  let result: unknown
  try {
    result = (originalGetContext as (type: string, ...opts: unknown[]) => unknown).apply(this, [
      requestedType,
      ...options,
    ])
    return result
  } finally {
    if (/^webgl2?$/i.test(requestedType)) {
      push(state.contexts, {
        index: state.contexts.length,
        requestedType: requestedType.toLowerCase(),
        connectedAtCall,
        returnedContext: result !== null && result !== undefined,
        canvasId,
        phase: state.phase,
        timestamp: now(),
      }, 'contextTruncated')
    }
  }
} as HTMLCanvasElement['getContext']

// The HTML preamble owns DevTools-hook timing. It wraps an already-present hook before React's
// static imports and preserves every original call; this module only reads that bridge.
const bridge = window.__torqueCensusBridge
state.devtoolsHook = {
  presentAtInstrumentation: bridge?.presentBeforeReactImports ?? false,
  installedBeforeReactImports: bridge?.presentBeforeReactImports ?? false,
  supportsFiber: bridge?.supportsFiber ?? null,
  disabled: bridge?.disabled ?? null,
  injectWrapped: bridge?.injectWrapped ?? false,
  onCommitFiberRootWrapped: bridge?.onCommitFiberRootWrapped ?? false,
  source: hookSource(window.__torqueCensusHookSource),
  missingReason: bridge ? bridge.missingReason : 'HTML pre-React census bridge did not run',
}

function summarizeCommits(commits: Array<{ censusPhase: CensusPhase }>) {
  return {
    total: commits.length,
    startup: commits.filter((entry) => entry.censusPhase === 'startup').length,
    steady: commits.filter((entry) => entry.censusPhase === 'steady').length,
    sameBeatScroll: commits.filter((entry) => entry.censusPhase === 'same-beat-scroll').length,
    postScroll: commits.filter((entry) => entry.censusPhase === 'post-scroll').length,
  }
}

function resourceCensus(): ResourceCensus[] {
  return (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map((entry) => ({
    name: entry.name,
    initiatorType: entry.initiatorType,
    nextHopProtocol: entry.nextHopProtocol,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    duration: entry.duration,
    responseStatus: (entry as PerformanceResourceTiming & { responseStatus?: number }).responseStatus ?? null,
    cacheState: 'UNVERIFIED',
  }))
}

window.__torqueCensus = {
  state,
  setPhase(phase: CensusPhase) {
    state.phase = phase
  },
  collect() {
    const connected = state.contexts.filter((entry) => entry.connectedAtCall)
    const detached = state.contexts.filter((entry) => !entry.connectedAtCall)
    return {
      startedAt: state.startedAt,
      phase: state.phase,
      importMetaHot: state.importMetaHot,
      contexts: [...state.contexts],
      contextSummary: {
        totalCalls: state.contexts.length,
        connectedCalls: connected.length,
        connectedContextReturns: connected.filter((entry) => entry.returnedContext).length,
        detachedCalls: detached.length,
        detachedContextReturns: detached.filter((entry) => entry.returnedContext).length,
        distinctCanvases: new Set(state.contexts.map((entry) => entry.canvasId)).size,
      },
      effects: [...state.effects],
      domCommits: [...state.domCommits],
      domCommitSummary: summarizeCommits(state.domCommits),
      r3fCommits: (bridge?.commits ?? []).filter((entry) => entry.knownR3fRenderer),
      r3fCommitSummary: summarizeCommits((bridge?.commits ?? []).filter((entry) => entry.knownR3fRenderer)),
      rendererRegistrations: [...(bridge?.registrations ?? [])],
      status: [...state.status],
      domCommitTruncated: state.domCommitTruncated,
      r3fCommitTruncated: state.r3fCommitTruncated,
      resources: resourceCensus(),
      documentCanvasCount: document.querySelectorAll('canvas').length,
      devtoolsHook: { ...state.devtoolsHook },
      limitations: [
        'The React Profiler covers only this DOM root subtree; it does not cover R3F Canvas createRoot(canvas).',
        'R3F commits are observable only when inject and onCommitFiberRoot were wrapped before React and @react-three/fiber registered a renderer.',
        'The hook source records whether an extension hook already existed or the harness supplied a passive fallback; it does not validate extension identity.',
        'getContext call counts distinguish detached capability probes from connected calls, but cannot prove current context liveness or disposal.',
        'PerformanceResourceTiming does not expose a reliable cache-hit verdict; every resource cacheState remains UNVERIFIED.',
        'Per-resource create/dispose calls, Story-chapter commit proof, and HMR silence are not directly observable from this boundary.',
      ],
    }
  },
}

function CensusProbe({ name }: { name: string }) {
  useEffect(() => {
    push(state.effects, { name, phase: 'setup', censusPhase: state.phase, timestamp: now() }, 'effectTruncated')
    return () => {
      push(state.effects, { name, phase: 'cleanup', censusPhase: state.phase, timestamp: now() }, 'effectTruncated')
    }
  }, [name])
  return null
}

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')
const uninstallPageFade = installPageFade(document)
const store = createTorqueWrenchStore({
  tier: resolveEntryTier(window.location.search, readReducedMotion()),
})
push(state.status, {
  status: store.getState().sceneStatus,
  tier: store.getState().tier,
  censusPhase: state.phase,
  timestamp: now(),
}, 'statusTruncated')
store.subscribe(() => {
  push(state.status, {
    status: store.getState().sceneStatus,
    tier: store.getState().tier,
    censusPhase: state.phase,
    timestamp: now(),
  }, 'statusTruncated')
})

const root = createRoot(container)
flushSync(() => {
  root.render(
    <StrictMode>
      <Profiler
        id="torque-dom-subtree"
        onRender={(id, reactPhase, actualDuration, baseDuration, startTime, commitTime) => {
          push(state.domCommits, {
            id,
            reactPhase,
            censusPhase: state.phase,
            actualDuration,
            baseDuration,
            startTime,
            commitTime,
          }, 'domCommitTruncated')
        }}
      >
        <CensusProbe name="dom-before-page" />
        <TorqueWrenchPage store={store} />
        <CensusProbe name="dom-after-page" />
      </Profiler>
    </StrictMode>,
  )
})

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount()
    uninstallPageFade()
    HTMLCanvasElement.prototype.getContext = originalGetContext
  })
}
