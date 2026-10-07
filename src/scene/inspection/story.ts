import type { Color, Object3D, Scene, Vector3, WebGLRenderer } from 'three'
import type { StorySession } from './session'
import { shaftStory } from './shaft/story'

export type StoryKind = 'ring' | 'shaft'
export type StoryId = 'ring-p003068' | 'shaft-p001835'
export interface StoryChapter { readonly id: string; readonly label: string; readonly start: number; readonly end: number }
export interface StoryAsset {
  readonly id: string
  readonly url: string
  readonly tier: 'full' | 'lite' | 'both'
  readonly required: boolean
  readonly maxBytes: number
  readonly sha256: string | null
}
export interface StoryContext { gl: WebGLRenderer; scene: Scene; hero: Object3D; rig: unknown; tier: 'full' | 'lite'; aspect: number }
export interface StoryFrame {
  time: number; chapter: number; phase: string; discrete: number
  narrativeAlpha: number; returnBlend: number; ownsNarrative: boolean
}
export interface InspectionCameraSample { valid: boolean; position: Vector3; target: Vector3; up: Vector3; fov: number }
export interface RenderSample {
  background: Color; fogNear: number; fogFar: number; envIntensity: number; envRotationY: number
  bloom: number; aberration: number; dofBokeh: number; exposure: number
}
export interface StoryRuntime {
  readonly root: Object3D
  readonly ready: Promise<void>
  readonly frame: StoryFrame
  readonly camera: InspectionCameraSample
  readonly render: RenderSample
  sample(time: number): void
  apply(): void
  telemetry(out: Record<string, unknown>): void
  readonly resources: { geometries: number; materials: number; textures: number; meshes: number }
  dispose(): void
}
export interface StoryDescriptor {
  readonly id: StoryId
  readonly kind: StoryKind
  readonly version: 1
  readonly duration: number
  readonly chapters: readonly StoryChapter[]
  readonly assets: readonly StoryAsset[]
  readonly entryWindow: readonly [number, number]
  readonly staticAlt: string
  create(session: StorySession, ctx: StoryContext): StoryRuntime
}
export type StoryMetadata = Omit<StoryDescriptor, 'create'>

// The existing ring scene is the adapter until integration registers its factory.
export const ringStory: StoryMetadata = Object.freeze({
  id: 'ring-p003068', kind: 'ring', version: 1, duration: 12,
  chapters: Object.freeze([Object.freeze({ id: 'finish', label: 'Finish study', start: 0, end: 12 })]),
  assets: Object.freeze([Object.freeze({ id: 'knurling-tool', url: 'models/knurling-tool.glb', tier: 'both', required: true, maxBytes: 2 * 1024 * 1024, sha256: 'e5bff99439eb6655ea9eda3929fcca2f3e388b98c5742dcef95c371423c8fbd8' })]),
  entryWindow: Object.freeze([0.12, 0.525] as const), staticAlt: 'ring-finish',
})
const stories = new Map<StoryId, StoryDescriptor>()

export function registerStory(descriptor: StoryDescriptor): () => void {
  if ((descriptor.id === 'ring-p003068') !== (descriptor.kind === 'ring') || descriptor.version !== 1 || typeof descriptor.create !== 'function') throw new Error('Invalid inspection story')
  if (!Number.isFinite(descriptor.duration) || descriptor.duration <= 0 || !descriptor.chapters.length) throw new Error('Invalid inspection duration')
  let end = 0
  for (const chapter of descriptor.chapters) {
    if (!chapter.id || !chapter.label || chapter.start !== end || !Number.isFinite(chapter.end) || chapter.end <= chapter.start) throw new Error('Inspection chapters must be contiguous')
    end = chapter.end
  }
  if (end !== descriptor.duration) throw new Error('Inspection chapters must cover the duration')
  if (descriptor.kind === 'shaft' && !descriptor.assets.some(asset => asset.required)) throw new Error('Shaft inspection requires its asset bundle')
  for (const asset of descriptor.assets) {
    if (!asset.id || !asset.url || !Number.isFinite(asset.maxBytes) || asset.maxBytes <= 0) throw new Error('Invalid inspection asset')
  }
  if (stories.has(descriptor.id)) throw new Error('Inspection story already registered')
  const registered: StoryDescriptor = Object.freeze({ ...descriptor,
    chapters: Object.freeze(descriptor.chapters.map(chapter => Object.freeze({ ...chapter }))),
    assets: Object.freeze(descriptor.assets.map(asset => Object.freeze({ ...asset }))),
    entryWindow: Object.freeze([...descriptor.entryWindow] as [number, number]),
  })
  stories.set(descriptor.id, registered)
  return () => { if (stories.get(descriptor.id) === registered) stories.delete(descriptor.id) }
}
export function getStoryDescriptor(id: StoryId): StoryDescriptor | undefined { return stories.get(id) }
export function getStory(id: StoryId): StoryMetadata {
  const descriptor = stories.get(id)
  if (descriptor) return descriptor
  if (id === ringStory.id) return ringStory
  if (id === shaftStory.id) return shaftStory
  throw new Error('The shaft inspection is not available yet')
}
export function storyChapterAt(story: StoryMetadata, time: number): number {
  for (let index = story.chapters.length - 1; index > 0; index--) if (time >= story.chapters[index].start) return index
  return 0
}
