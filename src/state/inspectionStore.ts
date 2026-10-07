import { useSyncExternalStore } from 'react'
import type { Object3D, Mesh } from 'three'
import { getScrollState, setScrollState, type ScrollState } from './scrollStore'
import { getStory, ringStory, storyChapterAt, type StoryId, type StoryKind, type StoryMetadata, type StoryRuntime } from '../scene/inspection/story'
import { createStorySession, type StorySession } from '../scene/inspection/session'

export type InspectionStatus = 'idle' | 'loading' | 'compiling' | 'ready' | 'error'
export type Suspend = 'none' | 'hidden' | 'context' | 'error'
let story: StoryMetadata = ringStory
let lastStamp = -Infinity

export const inspection = {
  active: false, epoch: 0, time: 0, entryElapsed: 0, static: false,
  kind: 'ring' as StoryKind, storyId: 'ring-p003068' as StoryId, duration: ringStory.duration,
  session: null as StorySession | null, userPlaying: false, suspend: 'none' as Suspend, exiting: false,
  runtime: null as StoryRuntime | null,
  get playing(): boolean { return this.active && !this.static && this.userPlaying && this.suspend === 'none' && this.status === 'ready' && this.time < this.duration },
  // The legacy driver/proof hook still writes playing until integration replaces it.
  set playing(value: boolean) { this.userPlaying = value },
  status: 'idle' as InspectionStatus, error: '',
  source: null as Object3D | null, entry: null as ScrollState | null,
  meshes: [] as Mesh[],
  scrollY: 0, scrollX: 0, trigger: null as HTMLElement | null,
}
export const inspectionTelemetry = {
  schema: 1, kind: 'ring' as StoryKind, storyId: 'ring-p003068' as StoryId, session: 0,
  status: 'idle' as InspectionStatus, suspend: 'none' as Suspend, chapter: 0, duration: ringStory.duration, playing: false,
  active: false, phase: 'idle', time: 0, ringBounds: { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], radius: 0, width: 0 },
  worldBounds: { min: [0, 0, 0], max: [0, 0, 0] },
  odKnurlProgress: 0, normalStrength: 0, aluminiumBlend: 0, ringAngle: 0,
  toolClipTime: 0, toolVisible: false, ringMeshes: 0, toolMeshes: 0,
  rollerClearance: [0, 0], rollerAxial: [0, 0], rollerCenters: [[0, 0, 0], [0, 0, 0]],
  wheelAxis: [[0, 0, 1], [0, 0, 1]], wheelHands: ['RH', 'LH'],
  entryScroll: 0, restoredScroll: 0, cameraOwner: 'CameraRig',
  disposed: 0, loaded: false, restoredPoseError: 0, entryContext: null as ScrollState | null,
  narrativeAlpha: 1, narrativeVisibleMeshes: 0, narrativeOriginalsIntact: true,
  maskSamples: { bore: 0, shoulder: 0, odStart: 0, odEnd: 0 },
}
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__inspection = inspectionTelemetry
const listeners = new Set<() => void>()
let revision = 0
function syncLifecycleTelemetry() {
  inspectionTelemetry.kind = inspection.kind; inspectionTelemetry.storyId = inspection.storyId
  inspectionTelemetry.session = inspection.epoch; inspectionTelemetry.status = inspection.status
  inspectionTelemetry.suspend = inspection.suspend; inspectionTelemetry.duration = inspection.duration
  inspectionTelemetry.chapter = storyChapterAt(story, inspection.time); inspectionTelemetry.playing = inspection.playing
}
function notifyListener(fn: () => void) { fn() }
export function notifyInspection() { syncLifecycleTelemetry(); revision++; listeners.forEach(notifyListener) }
export function subscribeInspection(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
export function useInspection() { useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn) } }, () => revision, () => revision); return inspection }
export function getInspectionStory(): StoryMetadata { return story }
export function enterInspection(trigger: HTMLElement, staticMode: boolean, storyId: StoryId = 'ring-p003068', chapter = 0) {
  if (inspection.active) return
  const descriptor = getStory(storyId)
  if (!Number.isInteger(chapter) || !descriptor.chapters[chapter]) return
  story = descriptor
  inspection.entry = { ...getScrollState() }
  inspection.scrollY = typeof window === 'undefined' ? 0 : window.scrollY
  inspection.scrollX = typeof window === 'undefined' ? 0 : window.scrollX
  inspection.trigger = trigger; inspection.active = true; inspection.static = staticMode
  inspection.epoch++; inspection.time = descriptor.chapters[chapter].start; inspection.entryElapsed = 0; inspection.userPlaying = false
  inspection.kind = descriptor.kind; inspection.storyId = descriptor.id; inspection.duration = descriptor.duration
  inspection.suspend = typeof document !== 'undefined' && document.hidden ? 'hidden' : 'none'
  inspection.exiting = false; lastStamp = -Infinity
  inspection.runtime = null
  const epoch = inspection.epoch
  inspection.session = createStorySession(descriptor.kind, {
    id: epoch, current: () => inspection.active && inspection.epoch === epoch,
    fail: error => inspectionFailed(error, epoch),
  })
  inspection.status = staticMode ? 'ready' : 'loading'; inspection.error = ''
  inspectionTelemetry.active = true; inspectionTelemetry.loaded = false
  inspectionTelemetry.time = inspection.time; inspectionTelemetry.ringAngle = 0
  inspectionTelemetry.toolVisible = false; inspectionTelemetry.odKnurlProgress = 0
  inspectionTelemetry.aluminiumBlend = 0
  inspectionTelemetry.phase = staticMode ? (descriptor.kind === 'shaft' ? 'Static shaft study' : 'Static finish study') : descriptor.chapters[chapter].label
  if (descriptor.kind === 'ring' && !staticMode) inspectionTelemetry.phase = 'Smooth black'
  if (descriptor.kind === 'shaft') {
    const probe = inspectionTelemetry
    probe.ringBounds.min.fill(0); probe.ringBounds.max.fill(0); probe.ringBounds.center.fill(0)
    probe.ringBounds.radius = 0; probe.ringBounds.width = 0
    probe.worldBounds.min.fill(0); probe.worldBounds.max.fill(0)
    probe.normalStrength = 0; probe.toolClipTime = 0; probe.ringMeshes = 0; probe.toolMeshes = 0
    probe.rollerClearance.fill(0); probe.rollerAxial.fill(0)
    for (let index = 0; index < 2; index++) { probe.rollerCenters[index].fill(0); probe.wheelAxis[index].fill(0); probe.wheelAxis[index][2] = 1 }
    probe.maskSamples.bore = 0; probe.maskSamples.shoulder = 0; probe.maskSamples.odStart = 0; probe.maskSamples.odEnd = 0
  }
  inspectionTelemetry.entryScroll = inspection.scrollY
  inspectionTelemetry.entryContext = { ...inspection.entry }
  notifyInspection()
}
export function exitInspection() {
  if (!inspection.active) return
  const entry = inspection.entry, session = inspection.session
  inspection.active = false; inspection.userPlaying = false; inspection.exiting = true
  inspection.entry = null; inspection.session = null; inspection.runtime = null; inspection.trigger = null
  inspection.status = 'idle'; inspection.error = ''; inspection.suspend = 'none'
  session?.cancel()
  if (entry) setScrollState(entry)
  inspectionTelemetry.active = false; inspectionTelemetry.loaded = false
  inspectionTelemetry.restoredScroll = typeof window === 'undefined' ? 0 : window.scrollY
  notifyInspection()
}
function current(epoch: number) { return inspection.active && inspection.epoch === epoch }
export function playInspection(replay = false, epoch = inspection.epoch) {
  if (!current(epoch) || inspection.static || inspection.status !== 'ready' || inspection.suspend === 'error' || inspection.suspend === 'context') return
  if (replay || inspection.time >= inspection.duration) inspection.time = 0
  inspection.userPlaying = !inspection.userPlaying || replay
  inspectionTelemetry.time = inspection.time
  notifyInspection()
}
export function seekInspection(time: number, epoch = inspection.epoch) {
  if (!current(epoch) || inspection.static || !Number.isFinite(time)) return
  const before = storyChapterAt(story, inspection.time), wasPlaying = inspection.userPlaying, wasEnd = inspection.time >= inspection.duration
  inspection.time = Math.max(0, Math.min(inspection.duration, time)); inspection.userPlaying = false
  inspectionTelemetry.time = inspection.time; syncLifecycleTelemetry()
  if (before !== inspectionTelemetry.chapter || wasPlaying || wasEnd !== (inspection.time >= inspection.duration)) notifyInspection()
}
export function seekChapter(index: number, epoch = inspection.epoch) {
  if (!current(epoch) || !Number.isInteger(index) || !story.chapters[index]) return
  seekInspection(story.chapters[index].start, epoch)
}
export function setInspectionSuspend(reason: Suspend, epoch = inspection.epoch) {
  if (!current(epoch) || reason === inspection.suspend) return
  // Visibility must not clear a terminal failure/context suspension.
  if ((reason === 'none' || reason === 'hidden') && (inspection.suspend === 'error' || inspection.suspend === 'context')) return
  inspection.suspend = reason
  notifyInspection()
}
export function inspectionFailed(error: unknown, epoch = inspection.epoch) {
  if (!current(epoch) || inspection.status === 'error') return
  inspection.status = 'error'; inspection.userPlaying = false; inspection.suspend = 'error'
  inspection.error = error instanceof Error ? error.message : String(error)
  notifyInspection()
}
export function setInspectionStatus(status: 'loading' | 'compiling' | 'ready', epoch = inspection.epoch) {
  if (!current(epoch) || inspection.status === 'error' || inspection.status === status) return
  inspection.status = status
  notifyInspection()
}
export function setInspectionRuntime(runtime: StoryRuntime, epoch = inspection.epoch): boolean {
  if (!current(epoch) || inspection.status === 'error' || !inspection.session?.current()) { runtime.dispose(); return false }
  if (inspection.runtime === runtime) return true
  if (inspection.runtime) throw new Error('Inspection runtime already assigned')
  inspection.runtime = inspection.session.own(runtime)
  notifyInspection()
  return true
}
export function retryInspection(epoch = inspection.epoch) {
  if (!current(epoch) || inspection.status !== 'error' || !inspection.trigger) return
  const trigger = inspection.trigger, staticMode = inspection.static, id = inspection.storyId
  exitInspection()
  enterInspection(trigger, staticMode, id)
}

/** Integration alone installs the -10 driver. The legacy ring driver still advances time. */
export function advanceInspectionPlayhead(delta: number, stamp: number) {
  if (!inspection.active) { inspection.exiting = false; return }
  if (!Number.isFinite(stamp) || stamp <= lastStamp || !Number.isFinite(delta) || delta < 0) return
  lastStamp = stamp
  if (inspection.static || inspection.suspend !== 'none') return
  const safeDelta = Math.min(delta, 0.05), chapter = storyChapterAt(story, inspection.time), wasPlaying = inspection.playing
  inspection.entryElapsed += safeDelta
  if (wasPlaying) {
    inspection.time = Math.min(inspection.duration, inspection.time + safeDelta)
    if (inspection.time >= inspection.duration) inspection.userPlaying = false
  }
  inspectionTelemetry.time = inspection.time; syncLifecycleTelemetry()
  if (chapter !== inspectionTelemetry.chapter || wasPlaying !== inspection.playing) notifyInspection()
}
