import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { advanceInspectionPlayhead, enterInspection, exitInspection, inspection, inspectionFailed, inspectionTelemetry, playInspection, retryInspection, seekChapter, seekInspection, setInspectionRuntime, setInspectionStatus, setInspectionSuspend, subscribeInspection } from './inspectionStore'
import { getScrollState, setScrollState } from './scrollStore'
import { registerStory, ringStory, type StoryDescriptor, type StoryRuntime } from '../scene/inspection/story'
import { Color, Group, Vector3 } from 'three'

beforeEach(() => { vi.stubGlobal('window', { scrollY: 0, scrollX: 0 }) })
afterEach(() => { exitInspection(); vi.unstubAllGlobals() })
describe('inspection context ownership', () => {
  it('snapshots full narrative context independently and restores it on exit/reentry', () => {
    vi.stubGlobal('window', { scrollY: 12450, scrollX: 0 })
    setScrollState({ progress: .35, chapter: 1, chapterProgress: .6, hotspotId: 'rotor', materialMode: 'blueprint', velocity: 0 })
    const trigger = {} as HTMLElement
    enterInspection(trigger, false)
    expect(inspection.entry).not.toBe(getScrollState())
    expect(inspection.entry?.hotspotId).toBe('rotor')
    expect(inspectionTelemetry.entryScroll).toBe(12450)
    setScrollState({ progress: .8, hotspotId: null, materialMode: 'solid' })
    exitInspection()
    expect(getScrollState().progress).toBe(.35)
    expect(getScrollState().hotspotId).toBe('rotor')
    expect(getScrollState().materialMode).toBe('blueprint')
    const epoch = inspection.epoch
    enterInspection(trigger, false)
    expect(inspection.epoch).toBe(epoch + 1)
    expect(inspection.time).toBe(0)
    expect(inspection.playing).toBe(false)
  })
  it('never automatically spins and disallows play in static and failed modes', () => {
    vi.stubGlobal('window', { scrollY: 0, scrollX: 0 })
    enterInspection({} as HTMLElement, true); playInspection(true)
    expect(inspection.playing).toBe(false)
    exitInspection(); enterInspection({} as HTMLElement, false)
    inspection.status = 'error'; playInspection(true)
    expect(inspection.playing).toBe(false)
    inspection.status = 'ready'; playInspection()
    expect(inspection.playing).toBe(true)
    playInspection(); expect(inspection.playing).toBe(false)
  })
})

describe('session controls and absolute playhead', () => {
  const trigger = {} as HTMLElement
  function ready() { enterInspection(trigger, false); setInspectionStatus('ready') }

  it('keeps the two-argument ring entry and never starts playback on readiness', () => {
    enterInspection(trigger, false)
    expect(inspection.kind).toBe('ring'); expect(inspection.storyId).toBe('ring-p003068')
    expect(inspection.duration).toBe(ringStory.duration); expect(ringStory.assets[0].url).toBe('models/knurling-tool.glb')
    expect(inspection.session?.id).toBe(inspection.epoch); expect(inspection.session?.current()).toBe(true)
    setInspectionStatus('compiling'); expect(inspection.playing).toBe(false)
    setInspectionStatus('ready'); expect(inspection.playing).toBe(false)
  })
  it('restores once, aborts owned resources once and drops saved session references', () => {
    setScrollState({ progress: .35, chapter: 1, materialMode: 'exploded' })
    ready()
    const session = inspection.session!, dispose = vi.fn()
    session.own({ dispose })
    exitInspection()
    expect(session.signal.aborted).toBe(true); expect(session.current()).toBe(false); expect(dispose).toHaveBeenCalledTimes(1)
    expect(inspection.entry).toBeNull(); expect(inspection.session).toBeNull(); expect(inspection.trigger).toBeNull()
    setScrollState({ progress: .7, chapter: 2, materialMode: 'solid' })
    const notify = vi.fn(), unsubscribe = subscribeInspection(notify)
    exitInspection(); unsubscribe()
    expect(getScrollState().progress).toBe(.7); expect(getScrollState().materialMode).toBe('solid'); expect(notify).not.toHaveBeenCalled()
    expect(inspection.exiting).toBe(true)
    advanceInspectionPlayhead(.01, 1); expect(inspection.exiting).toBe(false)
  })
  it('rejects stale failures, readiness, retry, seek and playback after immediate re-entry', () => {
    ready(); const epoch = inspection.epoch, session = inspection.session!
    exitInspection(); ready()
    inspectionFailed(new Error('late boundary'), epoch); session.fail('late parse')
    setInspectionStatus('compiling', epoch); seekInspection(5, epoch); playInspection(true, epoch); retryInspection(epoch)
    expect(inspection.status).toBe('ready'); expect(inspection.time).toBe(0); expect(inspection.userPlaying).toBe(false)
    expect(inspection.error).toBe(''); expect(inspection.epoch).toBe(epoch + 1)
  })
  it('retries a failed session with a new epoch and the saved narrative context', () => {
    setScrollState({ progress: .4, hotspotId: 'rotor', materialMode: 'blueprint' })
    ready(); const session = inspection.session!, epoch = inspection.epoch
    inspectionFailed('download denied', epoch)
    expect(inspection.suspend).toBe('error'); expect(inspection.playing).toBe(false)
    setInspectionSuspend('none'); expect(inspection.suspend).toBe('error')
    retryInspection(epoch)
    expect(session.signal.aborted).toBe(true); expect(inspection.epoch).toBe(epoch + 1)
    expect(inspection.status).toBe('loading'); expect(inspection.entry?.materialMode).toBe('blueprint')
    expect(inspection.entry?.hotspotId).toBe('rotor'); expect(inspection.trigger).toBe(trigger)
  })
  it('keeps manual pause across hiding and suspends entry blending as well as playback', () => {
    ready(); playInspection(); playInspection()
    setInspectionSuspend('hidden'); advanceInspectionPlayhead(5, 1)
    expect(inspection.entryElapsed).toBe(0); expect(inspection.time).toBe(0)
    setInspectionSuspend('none'); expect(inspection.userPlaying).toBe(false); expect(inspection.playing).toBe(false)
    advanceInspectionPlayhead(.02, 2)
    expect(inspection.entryElapsed).toBe(.02); expect(inspection.time).toBe(0)
  })
  it('retains playback intent while hidden and resumes by at most one clamped delta', () => {
    ready(); playInspection(); advanceInspectionPlayhead(.02, 1)
    setInspectionSuspend('hidden'); advanceInspectionPlayhead(500, 2)
    expect(inspection.userPlaying).toBe(true); expect(inspection.playing).toBe(false)
    expect(inspection.time).toBe(.02); expect(inspection.entryElapsed).toBe(.02)
    setInspectionSuspend('none'); advanceInspectionPlayhead(500, 3)
    expect(inspection.playing).toBe(true); expect(inspection.time).toBeCloseTo(.07); expect(inspection.entryElapsed).toBeCloseTo(.07)
  })
  it('advances once per frame stamp, rejects bad delta/stamps and never broadcasts continuous ticks', () => {
    ready(); playInspection()
    const notify = vi.fn(), unsubscribe = subscribeInspection(notify)
    advanceInspectionPlayhead(.02, 1); advanceInspectionPlayhead(.02, 1); advanceInspectionPlayhead(.02, 0)
    advanceInspectionPlayhead(NaN, 2); advanceInspectionPlayhead(-1, 2); advanceInspectionPlayhead(.02, NaN)
    expect(inspection.time).toBe(.02); expect(inspection.entryElapsed).toBe(.02); expect(notify).not.toHaveBeenCalled()
    advanceInspectionPlayhead(1, 2); unsubscribe()
    expect(inspection.time).toBeCloseTo(.07)
  })
  it('seeks absolutely without starting play and replays from zero after holding the end', () => {
    ready(); playInspection(); seekInspection(11.98)
    expect(inspection.time).toBe(11.98); expect(inspection.playing).toBe(false)
    playInspection(); advanceInspectionPlayhead(.05, 1)
    expect(inspection.time).toBe(12); expect(inspection.active).toBe(true); expect(inspection.playing).toBe(false)
    playInspection(true); expect(inspection.time).toBe(0); expect(inspection.playing).toBe(true)
    seekInspection(-10); expect(inspection.time).toBe(0); expect(inspection.userPlaying).toBe(false)
    seekInspection(500); expect(inspection.time).toBe(12)
    seekChapter(0); expect(inspection.time).toBe(0)
    seekInspection(NaN); seekChapter(-1); seekChapter(1); expect(inspection.time).toBe(0)
  })
  it('does not broadcast same-chapter paused seeks but does broadcast chapter/end transitions', () => {
    ready()
    const notify = vi.fn(), unsubscribe = subscribeInspection(notify)
    seekInspection(3); seekInspection(5); expect(notify).not.toHaveBeenCalled()
    seekInspection(12); expect(notify).toHaveBeenCalledTimes(1)
    seekInspection(10); expect(notify).toHaveBeenCalledTimes(2)
    unsubscribe()
  })
  it('uses a registered story duration and absolute chapter data without mounting a shaft runtime', () => {
    const descriptor: StoryDescriptor = {
      ...ringStory, id: 'shaft-p001835', kind: 'shaft', duration: 43,
      chapters: [{ id: 'groove', label: 'Why the groove was needed', start: 0, end: 15 }, { id: 'materials', label: 'Material attempts', start: 15, end: 22.6 }, { id: 'process', label: 'Changing the process', start: 22.6, end: 35 }, { id: 'supports', label: 'Moving the supports', start: 35, end: 43 }],
      assets: [{ ...ringStory.assets[0], id: 'test-bundle', url: 'test-only.glb' }],
      create: vi.fn<StoryDescriptor['create']>(),
    }
    const unregister = registerStory(descriptor)
    try {
      inspectionTelemetry.ringBounds.radius = .1; inspectionTelemetry.toolMeshes = 2; inspectionTelemetry.maskSamples.bore = 1
      // Static (poster / reduced-motion) shaft entry is a DOM-only study: ready immediately, no runtime.
      enterInspection(trigger, true, descriptor.id)
      expect(inspection.active).toBe(true); expect(inspection.static).toBe(true); expect(inspection.status).toBe('ready')
      expect(inspectionTelemetry.phase).toBe('Static shaft study'); expect(descriptor.create).not.toHaveBeenCalled()
      exitInspection(); expect(inspection.active).toBe(false)
      enterInspection(trigger, false, descriptor.id, 2)
      expect(inspection.duration).toBe(43); expect(inspection.kind).toBe('shaft'); expect(inspection.time).toBe(22.6)
      expect(inspectionTelemetry.ringBounds.radius).toBe(0); expect(inspectionTelemetry.toolMeshes).toBe(0); expect(inspectionTelemetry.maskSamples.bore).toBe(0)
      expect(inspectionTelemetry.chapter).toBe(2); expect(descriptor.create).not.toHaveBeenCalled()
      seekChapter(3); expect(inspection.time).toBe(35); expect(inspection.playing).toBe(false)
      setInspectionStatus('ready'); seekInspection(42.98); playInspection(); advanceInspectionPlayhead(.05, 1)
      expect(inspection.time).toBe(43); expect(inspection.active).toBe(true); expect(inspection.playing).toBe(false)
      playInspection(true); expect(inspection.time).toBe(0)
    } finally { exitInspection(); unregister() }
  })
  it('enters a static shaft chapter from cold metadata and restores its narrative context on exit', async () => {
    vi.resetModules()
    vi.stubGlobal('window', { scrollY: 0, scrollX: 0, location: { search: '' } })
    const cold = await import('./inspectionStore')
    const registry = await import('../scene/inspection/story')
    const scroll = await import('./scrollStore')
    scroll.setScrollState({ progress: .35, chapter: 1, hotspotId: 'rotor', materialMode: 'blueprint', velocity: 0 })
    const entry = { ...scroll.getScrollState() }, epoch = cold.inspection.epoch
    expect(registry.getStoryDescriptor('shaft-p001835')).toBeUndefined()
    try {
      cold.enterInspection(trigger, true, 'shaft-p001835', 2)
      expect(cold.inspection.active).toBe(true); expect(cold.inspection.static).toBe(true)
      expect(cold.inspection.epoch).toBe(epoch + 1); expect(cold.inspection.status).toBe('ready')
      expect(cold.inspection.kind).toBe('shaft'); expect(cold.inspection.storyId).toBe('shaft-p001835')
      expect(cold.inspection.duration).toBe(43); expect(cold.inspection.time).toBe(22.6)
      expect(cold.inspectionTelemetry.chapter).toBe(2); expect(cold.inspectionTelemetry.phase).toBe('Static shaft study')
      expect(cold.inspection.runtime).toBeNull(); expect(cold.inspection.playing).toBe(false)
      expect(cold.getInspectionStory()).not.toHaveProperty('create')
      expect(registry.getStoryDescriptor('shaft-p001835')).toBeUndefined()
      expect(cold.inspection.entry).toEqual(entry); expect(cold.inspection.entry).not.toBe(scroll.getScrollState())
      const session = cold.inspection.session!
      expect(session.current()).toBe(true)
      scroll.setScrollState({ progress: .8, hotspotId: null, materialMode: 'solid' })
      cold.exitInspection()
      expect(session.signal.aborted).toBe(true); expect(session.current()).toBe(false)
      expect(cold.inspection.active).toBe(false); expect(cold.inspection.status).toBe('idle')
      expect(cold.inspection.runtime).toBeNull(); expect(cold.inspection.session).toBeNull()
      expect(cold.inspection.entry).toBeNull(); expect(cold.inspection.trigger).toBeNull()
      expect(scroll.getScrollState()).toEqual(entry)
    } finally { cold.exitInspection() }
  })
  it('publishes a synchronous runtime once, owns its disposal, and rejects stale mount attempts', async () => {
    const runtime = (ready: Promise<void>): StoryRuntime => ({
      root: new Group(), ready, frame: { time: 0, chapter: 0, phase: 'test', discrete: 0, narrativeAlpha: 1, returnBlend: 0, ownsNarrative: true },
      camera: { valid: false, position: new Vector3(), target: new Vector3(), up: new Vector3(0, 1, 0), fov: 42 },
      render: { background: new Color(), fogNear: 0, fogFar: 10, envIntensity: 1, envRotationY: 0, bloom: 0, aberration: 0, dofBokeh: 0, exposure: 1 },
      resources: { geometries: 0, materials: 0, textures: 0, meshes: 0 },
      sample: vi.fn(), apply: vi.fn(), telemetry: vi.fn(), dispose: vi.fn(),
    })
    enterInspection(trigger, false)
    const epoch = inspection.epoch, session = inspection.session!
    let complete!: () => void
    const study = runtime(new Promise(resolve => { complete = resolve }))
    const notify = vi.fn(), unsubscribe = subscribeInspection(notify)
    expect(setInspectionRuntime(study, epoch)).toBe(true); expect(inspection.runtime).toBe(study)
    expect(setInspectionRuntime(study, epoch)).toBe(true); expect(notify).toHaveBeenCalledTimes(1)
    expect(inspection.status).toBe('loading'); expect(inspection.playing).toBe(false)
    exitInspection(); expect(inspection.runtime).toBeNull(); expect(study.dispose).toHaveBeenCalledTimes(1)
    enterInspection(trigger, false)
    complete(); await study.ready
    expect(session.current()).toBe(false); expect(inspection.status).toBe('loading'); expect(inspection.runtime).toBeNull()
    const stale = runtime(Promise.resolve())
    expect(setInspectionRuntime(stale, epoch)).toBe(false); expect(stale.dispose).toHaveBeenCalledTimes(1)
    unsubscribe()
  })
})
