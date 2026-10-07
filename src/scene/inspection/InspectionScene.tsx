import { Component, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { inspection, advanceInspectionPlayhead, inspectionFailed, inspectionTelemetry as probe, notifyInspection, setInspectionRuntime, setInspectionStatus, subscribeInspection, useInspection } from '../../state/inspectionStore'
import { getQuality } from '../../state/qualityStore'
import { captureNarrativeFade } from './narrativeFade'
import { captureRenderLease, prepareRuntime, renderOwnership } from './renderLease'
import { createRingRuntime } from './ringRuntime'
import { createVisibleLoadDeadline } from './session'
import { createShaftRuntime } from './shaft/shaftRuntime'
import { shaftStory } from './shaft/story'
import { getStoryDescriptor, registerStory, ringStory, type StoryContext } from './story'
import { ease } from './timeline'

// One module registration per story; HMR removes only this module's own descriptors.
const unregisterRing = getStoryDescriptor(ringStory.id) ? null : registerStory({ ...ringStory, create: createRingRuntime })
const unregisterShaft = getStoryDescriptor(shaftStory.id) ? null : registerStory({ ...shaftStory, create: createShaftRuntime })
if (import.meta.hot) import.meta.hot.dispose(() => { unregisterRing?.(); unregisterShaft?.() })

const integration = Object.assign(probe as unknown as Record<string, unknown>, {
  runtimeVersion: 2, sampledTime: 0, sampleStamp: 0, cameraSampleTime: 0, cameraSampleStamp: 0,
  renderOwned: false, restoreObserved: false, restoreProjectionError: 0, restoreStateError: 0,
  compileReady: false, warmReady: false,
})

/** One store advance and one absolute runtime sample, before every camera/mesh writer. */
export function InspectionDriver({ context }: { context: React.RefObject<StoryContext | null> }) {
  useFrame((state, delta) => {
    advanceInspectionPlayhead(delta, state.clock.elapsedTime)
    if (!inspection.active || inspection.static) return
    const runtime = inspection.runtime
    if (!runtime) return
    if (context.current) context.current.aspect = state.size.width / Math.max(1, state.size.height)
    runtime.sample(inspection.time)
    integration.sampledTime = runtime.frame.time; integration.sampleStamp = state.clock.elapsedTime
    const prior = integration.discrete
    integration.discrete = runtime.frame.discrete
    if (prior !== undefined && prior !== runtime.frame.discrete) notifyInspection()
  }, -10)
  return null
}

export function InspectionScene() {
  const state = useInspection(), { scene, gl, camera } = useThree()
  const lease = useRef<ReturnType<typeof captureRenderLease> | null>(null)
  const fade = useRef<ReturnType<typeof captureNarrativeFade> | null>(null)
  const context = useRef<StoryContext | null>(null)
  const epoch = useRef(-1)
  function restore(lost = false) {
    if (!lease.current) return
    if (lost) lease.current.contextLost()
    fade.current?.restore(); fade.current = null
    lease.current.restore(); lease.current = null
    renderOwnership.owned = false; renderOwnership.restoring = !lost; renderOwnership.restoreObserved = false
    integration.renderOwned = false; probe.narrativeAlpha = 1
    context.current = null
  }
  const capture = () => {
    if (!inspection.active || inspection.static) return
    if (lease.current && epoch.current !== inspection.epoch) restore()
    if (!lease.current) {
      const hero = scene.getObjectByName('jgun-live-registered-model') ?? null
      lease.current = captureRenderLease(scene, gl, hero, inspection.runtime?.root ?? null)
      epoch.current = inspection.epoch
      renderOwnership.owned = true; renderOwnership.restoring = false; renderOwnership.restoreObserved = false
      integration.renderOwned = true; integration.restoreObserved = false; integration.compileReady = false; integration.warmReady = false
    }
  }
  useLayoutEffect(() => {
    capture()
    const remove = subscribeInspection(() => {
      if (!inspection.active || inspection.static || epoch.current !== inspection.epoch) restore(gl.getContext().isContextLost())
    })
    return () => { remove(); restore(gl.getContext().isContextLost()); renderOwnership.restoring = false }
  }, [scene, gl])
  // Capture before advance/sample and before StudioRig/FxDriver can overwrite entry state.
  useFrame(() => {
    if (renderOwnership.restoreObserved) { renderOwnership.restoring = false; renderOwnership.restoreObserved = false }
    capture()
    if (!inspection.active || inspection.static) restore(gl.getContext().isContextLost())
  }, -20)

  useEffect(() => {
    const session = inspection.session
    if (!state.active || state.static || !session) return
    const deadline = createVisibleLoadDeadline(session, 15000)
    let last = performance.now(), visible = !document.hidden && inspection.suspend !== 'hidden'
    const visibility = () => { last = performance.now(); visible = !document.hidden && inspection.suspend !== 'hidden' }
    const timer = setInterval(() => {
      const now = performance.now(), nextVisible = !document.hidden && inspection.suspend !== 'hidden'
      if (inspection.status === 'loading' || inspection.status === 'compiling') deadline.advance(now - last, visible && nextVisible)
      last = now; visible = nextVisible
    }, 100)
    document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility) }
  }, [state.active, state.static, state.epoch])

  useEffect(() => {
    const session = inspection.session
    if (!state.active || state.static || !session || inspection.runtime || inspection.status === 'error') return
    const hero = scene.getObjectByName('jgun-live-registered-model')
    if (!hero || (inspection.kind === 'ring' && !inspection.source)) return
    const descriptor = getStoryDescriptor(inspection.storyId)
    if (!descriptor) { session.fail(new Error('The inspection study is unavailable')); return }
    capture()
    lease.current!.setHero(hero)
    fade.current = captureNarrativeFade(hero, inspection.kind === 'ring' ? inspection.meshes : [])
    // The rig is cached on the GLTF scene inside the registered wrapper, not on the wrapper itself.
    let rig: unknown = hero.userData.wrenchRig
    if (!rig) hero.traverse(object => { if (!rig && object.userData.wrenchRig) rig = object.userData.wrenchRig })
    const ctx: StoryContext = { gl, scene, hero, rig, tier: getQuality().tier === 'lite' ? 'lite' : 'full', aspect: camera instanceof Object && 'aspect' in camera ? Number(camera.aspect) : 1 }
    context.current = ctx
    try {
      const runtime = descriptor.create(session, ctx)
      if (!setInspectionRuntime(runtime, session.id)) return
      lease.current!.setRoot(runtime.root); scene.add(runtime.root)
      runtime.sample(inspection.time); runtime.apply(); lease.current!.apply(runtime.render)
      void runtime.ready.then(async () => {
        if (!session.current() || inspection.status === 'error' || gl.getContext().isContextLost()) return
        setInspectionStatus('compiling', session.id)
        runtime.sample(inspection.time); runtime.apply(); lease.current?.apply(runtime.render)
        if (!(await prepareRuntime(session, gl, scene, camera, runtime.root))) return
        if (!session.current() || inspection.suspend === 'error') return
        integration.compileReady = true; integration.warmReady = true; probe.loaded = true
        setInspectionStatus('ready', session.id)
      }).catch(error => session.fail(error))
    } catch (error) { session.fail(error) }
  }, [state.active, state.static, state.epoch, state.source, scene, gl, camera])

  useFrame(() => {
    if (!inspection.active || inspection.static) return
    const runtime = inspection.runtime
    if (!runtime) { lease.current?.discover(); return }
    runtime.apply(); lease.current?.apply(runtime.render)
    const alpha = Math.max(1 - ease(inspection.entryElapsed / 1.2), runtime.frame.narrativeAlpha)
    fade.current?.apply(alpha, runtime.frame.returnBlend > 0)
    const first = fade.current?.measured
    probe.narrativeAlpha = first ? first.clone.opacity / first.opacity : alpha
    probe.narrativeVisibleMeshes = 0; probe.narrativeOriginalsIntact = true
    if (fade.current) for (const record of fade.current.records) {
      if (record.mesh.visible) probe.narrativeVisibleMeshes++
      for (const finish of record.finishes) if (finish.original.opacity !== finish.opacity || finish.original.transparent !== finish.transparent || finish.original.depthWrite !== finish.depthWrite) probe.narrativeOriginalsIntact = false
    }
    runtime.telemetry(integration)
  })
  return <InspectionBoundary key={state.epoch} epoch={state.epoch}><InspectionDriver context={context} /></InspectionBoundary>
}

class InspectionBoundary extends Component<{ children: ReactNode; epoch: number }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error) { inspectionFailed(error, this.props.epoch) }
  render() { return this.state.failed ? null : this.props.children }
}
