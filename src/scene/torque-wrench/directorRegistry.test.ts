import { describe, expect, it } from 'vitest'
import { TORQUE_BEATS, type TorqueWrenchBeat } from './beats'
import { createBeatTimeline, type TorqueBeatSample } from './beatTimeline'
import {
  createDirectorRegistry, TORQUE_DIRECTOR_IDS,
  type TorqueDirectorRegistration,
} from './directorRegistry'

// Deliberately plain transport state: no geometry, effect, subject-stop, or camera acceptance.
interface FixtureState {
  readonly director: string
  readonly beatId: string
  readonly progress: number
  readonly value: number
}

const registrations = (): TorqueDirectorRegistration<FixtureState>[] => TORQUE_DIRECTOR_IDS.map((id) => ({
  id,
  sample: (sample) => ({ director: id, beatId: sample.beat.id, progress: sample.progress, value: sample.localProgress }),
}))

describe('pure director registry', () => {
  it('exports frozen, unique built-in metadata and dispatches injected samplers', () => {
    expect(Object.isFrozen(TORQUE_DIRECTOR_IDS)).toBe(true)
    expect(new Set(TORQUE_DIRECTOR_IDS).size).toBe(5)
    const registry = createDirectorRegistry(TORQUE_DIRECTOR_IDS, registrations())
    const timeline = createBeatTimeline(TORQUE_BEATS, registry.ids)
    for (const beat of TORQUE_BEATS) {
      const sample = timeline.sample((beat.start + beat.end) / 2)
      expect(registry.sample(sample)).toEqual({
        director: beat.director, beatId: beat.id, progress: sample.progress, value: sample.localProgress,
      })
      expect(registry.get(beat.director)(sample)).toEqual(registry.sample(sample))
    }
  })

  it('rejects duplicate inventory IDs and duplicate, unknown, or missing registrations', () => {
    expect(() => createDirectorRegistry(['opening', 'opening'], [])).toThrow(/Duplicate/)
    expect(() => createDirectorRegistry([' '], [])).toThrow(/nonempty/)
    const entries = registrations()
    expect(() => createDirectorRegistry(TORQUE_DIRECTOR_IDS, [...entries, entries[0]])).toThrow(/Duplicate/)
    expect(() => createDirectorRegistry(TORQUE_DIRECTOR_IDS, [...entries, { ...entries[0], id: 'external' }])).toThrow(/Unknown/)
    expect(() => createDirectorRegistry(TORQUE_DIRECTOR_IDS, entries.slice(1))).toThrow(/Missing.*opening/)
    const missingSampler = { id: 'opening', sample: undefined } as unknown as TorqueDirectorRegistration<FixtureState>
    expect(() => createDirectorRegistry(['opening'], [missingSampler])).toThrow(/Missing sampler/)
  })

  it('rejects unknown lookups and samples rather than silently using another director', () => {
    const registry = createDirectorRegistry(TORQUE_DIRECTOR_IDS, registrations())
    expect(() => registry.get('external')).toThrow(/Unknown/)
    const sample = createBeatTimeline(TORQUE_BEATS, TORQUE_DIRECTOR_IDS).sample(0)
    expect(() => registry.sample({ ...sample, beat: { ...sample.beat, director: 'external' } })).toThrow(/Unknown/)
  })

  it('snapshots registration arrays, IDs, and functions against later caller mutation', () => {
    const ids: string[] = [...TORQUE_DIRECTOR_IDS]
    const entries = registrations()
    const registry = createDirectorRegistry(ids, entries)
    const timeline = createBeatTimeline(TORQUE_BEATS, registry.ids)
    const sample = timeline.sample(0.02)
    const expected = registry.sample(sample)
    Object.assign(entries[0], { id: 'changed', sample: () => { throw new Error('changed') } })
    entries.splice(0, entries.length)
    ids.splice(0, ids.length, 'changed')
    expect(registry.sample(sample)).toEqual(expected)
    expect(registry.ids).toEqual(TORQUE_DIRECTOR_IDS)
    expect(Object.isFrozen(registry)).toBe(true)
    expect(Object.isFrozen(registry.ids)).toBe(true)
    expect(Reflect.set(registry.ids, '0', 'changed')).toBe(false)
  })

  it('adds a beat and external director through data and registration alone, for every traversal', () => {
    const externalId = 'cutter-detail-fixture'
    // Only data additions/change plus a new pure director/registration. Resolver and transport
    // are the same production facilities; this fixture imports no conductor, Scene, or page.
    const data: TorqueWrenchBeat[] = TORQUE_BEATS.flatMap((beat) => beat.id === 'inspection-bullet-time'
      ? [
        { ...beat, end: 0.7 },
        { ...beat, id: 'inspection-added-detail', start: 0.7, director: externalId, camera: 'external-detail', scene: 'external-detail' },
      ]
      : [beat])
    const addedDirector = (sample: TorqueBeatSample): FixtureState => ({
      director: externalId, beatId: sample.beat.id, progress: sample.progress,
      value: sample.localProgress * sample.localProgress,
    })
    const known = [...TORQUE_DIRECTOR_IDS, externalId]
    const entries = [...registrations(), { id: externalId, sample: addedDirector }]
    const registry = createDirectorRegistry(known, entries)
    const timeline = createBeatTimeline(data, registry.ids)
    const atBoundary = timeline.sample(0.7)
    expect(atBoundary).toMatchObject({ beat: { id: 'inspection-added-detail', poster: 'inspection' }, localProgress: 0 })
    expect(atBoundary).toMatchObject({ previousId: 'inspection-bullet-time', nextId: 'inspection-materials', phase: 'entering' })
    expect(atBoundary.stateKey).toBe(timeline.sample(0.7).stateKey)
    expect(atBoundary.stateKey).not.toBe(timeline.sample(0.71).stateKey)
    expect(timeline.sample(0.71).phase).toBe('active')
    expect(registry.sample(atBoundary).director).toBe(externalId)
    expect(timeline.sample(0.7 - Number.EPSILON).beat.id).toBe('inspection-bullet-time')
    expect(timeline.sample(0.72).beat.id).toBe('inspection-materials')
    expect(() => createBeatTimeline(data, TORQUE_DIRECTOR_IDS)).toThrow(/Unknown/)

    const points = [...new Set([0, 1, 0.7, 0.71, 0.72,
      ...data.flatMap((beat) => [beat.start, (beat.start + beat.end) / 2, beat.end]),
    ])].sort((a, b) => a - b)
    const expected = new Map(points.map((progress) => [progress, registry.sample(timeline.sample(progress))]))
    const seeks = [...points.filter((_, index) => index % 2 === 0), ...points.filter((_, index) => index % 2 === 1)]
    for (const order of [points, [...points].reverse(), seeks]) {
      for (const progress of order) {
        const state = registry.sample(timeline.sample(progress))
        expect(state).toEqual(expected.get(progress))
        // Hold and reconstruction/reload exercise the injected director, not just the resolver.
        expect(registry.sample(timeline.sample(progress))).toEqual(state)
        const reloadedRegistry = createDirectorRegistry(known, entries)
        const reloadedTimeline = createBeatTimeline(data, reloadedRegistry.ids)
        expect(reloadedRegistry.sample(reloadedTimeline.sample(progress))).toEqual(state)
      }
    }
    expect(expected.get(0.71)?.director).toBe(externalId)
  })
})
