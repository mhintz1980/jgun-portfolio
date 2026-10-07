import { describe, expect, it, vi } from 'vitest'
import { getStory, getStoryDescriptor, registerStory, ringStory, storyChapterAt, type StoryDescriptor } from './story'
import { shaftStory } from './shaft/story'

describe('story descriptor registry', () => {
  const descriptor = (): StoryDescriptor => ({ ...ringStory, create: vi.fn<StoryDescriptor['create']>() })
  it('keeps legacy ring metadata independent of runtime factories and rejects absent shaft assets/runtime', () => {
    expect(getStory('ring-p003068')).toBe(ringStory); expect(getStoryDescriptor('ring-p003068')).toBeUndefined()
    expect(() => registerStory({ ...descriptor(), id: 'shaft-p001835', kind: 'shaft', assets: [] })).toThrow('asset bundle')
    expect(() => registerStory({ ...descriptor(), create: undefined } as unknown as StoryDescriptor)).toThrow('Invalid inspection story')
  })
  it('provides authored shaft metadata in a cold registry without loading a runtime factory', async () => {
    vi.resetModules()
    const coldRegistry = await import('./story')
    const authored = await import('./shaft/story')
    const metadata = coldRegistry.getStory('shaft-p001835')
    expect(coldRegistry.getStoryDescriptor('shaft-p001835')).toBeUndefined()
    expect(metadata).toBe(authored.shaftStory)
    expect(metadata).not.toHaveProperty('create')
    expect(metadata.duration).toBe(43)
    expect(metadata.chapters).toEqual([
      { id: 'why-groove', label: 'Why the groove was needed', start: 0, end: 15 },
      { id: 'materials', label: 'Material attempts', start: 15, end: 22.6 },
      { id: 'process', label: 'Changing the process', start: 22.6, end: 35 },
      { id: 'supports', label: 'Moving the supports', start: 35, end: 43 },
    ])
    expect(metadata.assets.map(asset => asset.url)).toEqual([
      'models/manufacturing-core-full.glb', 'models/manufacturing-core-lite.glb',
    ])
    expect(Object.isFrozen(metadata)).toBe(true)
    expect(Object.isFrozen(metadata.chapters)).toBe(true)
    expect(metadata.chapters.every(Object.isFrozen)).toBe(true)
    expect(Object.isFrozen(metadata.assets)).toBe(true)
    expect(metadata.assets.every(Object.isFrozen)).toBe(true)
    expect(Object.isFrozen(metadata.entryWindow)).toBe(true)
  })
  it('uses a registered shaft runtime and restores authored metadata when unregistered', () => {
    const input: StoryDescriptor = { ...shaftStory, create: vi.fn<StoryDescriptor['create']>() }
    const unregister = registerStory(input)
    try {
      expect(getStoryDescriptor(input.id)?.create).toBe(input.create)
      expect(getStory(input.id)).toBe(getStoryDescriptor(input.id))
      expect(() => registerStory(input)).toThrow('already registered')
    } finally { unregister(); unregister() }
    expect(getStoryDescriptor(input.id)).toBeUndefined()
    expect(getStory(input.id)).toBe(shaftStory)
    expect(getStory(input.id)).not.toHaveProperty('create')
  })
  it('validates complete chapter coverage and duration', () => {
    expect(() => registerStory({ ...descriptor(), duration: NaN })).toThrow('duration')
    expect(() => registerStory({ ...descriptor(), duration: 20 })).toThrow('cover the duration')
    expect(() => registerStory({ ...descriptor(), chapters: [{ id: 'bad', label: 'Gap', start: 1, end: 12 }] })).toThrow('contiguous')
    expect(() => registerStory({ ...descriptor(), chapters: [{ id: 'bad', label: 'Bad', start: 0, end: NaN }] })).toThrow('contiguous')
  })
  it('copies mutable authored metadata so later edits cannot change a live playhead contract', () => {
    const input = descriptor(), unregister = registerStory(input)
    try {
      expect(getStory(input.id)).not.toBe(input); expect(getStory(input.id).chapters).not.toBe(input.chapters)
      expect(Object.isFrozen(getStory(input.id).chapters[0])).toBe(true)
      expect(() => registerStory(input)).toThrow('already registered')
      expect(storyChapterAt(getStory(input.id), 12)).toBe(0)
    } finally { unregister(); unregister() }
    expect(getStoryDescriptor(input.id)).toBeUndefined()
  })
})
