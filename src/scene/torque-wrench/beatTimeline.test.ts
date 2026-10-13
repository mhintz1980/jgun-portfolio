import { describe, expect, it } from 'vitest'
import { TORQUE_BEATS, type TorqueWrenchBeat } from './beats'
import { createBeatTimeline, sampleTorqueBeat } from './beatTimeline'
import { TORQUE_DIRECTOR_IDS } from './directorRegistry'

function fixture(): TorqueWrenchBeat[] {
  return [
    { id: 'first', start: 0, end: 0.5, camera: 'registered', scene: 'drawing', director: 'opening' },
    { id: 'last', start: 0.5, end: 1, camera: 'close', scene: 'close', director: 'close' },
  ]
}

describe('createBeatTimeline', () => {
  it('uses half-open windows, with the final endpoint included', () => {
    const timeline = createBeatTimeline(fixture(), ['opening', 'close'])
    expect(timeline.sample(0)).toMatchObject({ index: 0, localProgress: 0, previousId: null, nextId: 'last', phase: 'entering' })
    expect(timeline.sample(0.5 - Number.EPSILON).beat.id).toBe('first')
    expect(timeline.sample(0.5)).toMatchObject({ index: 1, localProgress: 0, previousId: 'first', nextId: null, phase: 'entering' })
    expect(timeline.sample(1)).toMatchObject({ index: 1, localProgress: 1, phase: 'exiting' })
    // Reverse arrival at a boundary has the same owner as forward arrival.
    timeline.sample(0.75)
    expect(timeline.sample(0.5).beat.id).toBe('last')
  })

  it('assigns the next beat at every production boundary', () => {
    for (const [index, beat] of TORQUE_BEATS.entries()) {
      expect(sampleTorqueBeat(beat.start)).toMatchObject({ index, localProgress: 0, beat: { id: beat.id } })
      if (index < TORQUE_BEATS.length - 1) {
        expect(sampleTorqueBeat(beat.end).beat.id).toBe(TORQUE_BEATS[index + 1].id)
      }
    }
    expect(sampleTorqueBeat(1).beat.id).toBe(TORQUE_BEATS.at(-1)?.id)
  })

  it.each([
    [0, 'entering'], [0.099999, 'entering'], [0.1, 'active'],
    [0.899999, 'active'], [0.9, 'exiting'], [1, 'exiting'],
  ] as const)('derives phase at local progress %s as %s', (progress, phase) => {
    const beat = { ...fixture()[0], end: 1 }
    expect(createBeatTimeline([beat], ['opening']).sample(progress).phase).toBe(phase)
  })

  it('clamps finite overscroll and canonicalizes negative zero', () => {
    expect(sampleTorqueBeat(-100)).toEqual(sampleTorqueBeat(0))
    expect(sampleTorqueBeat(100)).toEqual(sampleTorqueBeat(1))
    expect(sampleTorqueBeat(-0)).toEqual(sampleTorqueBeat(0))
    expect(Object.is(sampleTorqueBeat(-0).progress, -0)).toBe(false)
  })

  it.each([NaN, Infinity, -Infinity])('rejects nonfinite progress %s', (progress) => {
    expect(() => sampleTorqueBeat(progress)).toThrow(/finite/)
  })

  it('gives identical samples on forward, reverse, seek, reload, and repeated holds', () => {
    const checkpoints = [...new Set([
      0, 1, 0.000001, 0.999999,
      ...TORQUE_BEATS.flatMap((beat) => [beat.start, (beat.start + beat.end) / 2, beat.end]),
    ])].sort((a, b) => a - b)
    const expected = new Map(checkpoints.map((progress) => [progress, sampleTorqueBeat(progress)]))
    const timeline = createBeatTimeline(TORQUE_BEATS, TORQUE_DIRECTOR_IDS)
    const seeks = [...checkpoints.filter((_, index) => index % 2 === 1), ...checkpoints.filter((_, index) => index % 2 === 0)]
    for (const order of [checkpoints, [...checkpoints].reverse(), seeks]) {
      for (const progress of order) {
        expect(timeline.sample(progress)).toEqual(expected.get(progress))
        expect(timeline.sample(progress)).toEqual(timeline.sample(progress))
        expect(createBeatTimeline(TORQUE_BEATS, TORQUE_DIRECTOR_IDS).sample(progress)).toEqual(expected.get(progress))
      }
    }
  })

  it('retains immutable snapshots after caller mutation and returned-sample mutation attempts', () => {
    const beats = fixture()
    const known = ['opening', 'close']
    const timeline = createBeatTimeline(beats, known)
    const before = timeline.sample(0.25)
    expect(before.beat).not.toBe(beats[0])
    Object.assign(beats[0], { id: 'changed', end: 0.1, director: 'missing', title: 'changed' })
    beats.reverse()
    beats.push({ ...beats[0], id: 'extra' })
    known.splice(0, known.length, 'missing')
    expect(timeline.sample(0.25)).toEqual(before)
    expect(Object.isFrozen(timeline)).toBe(true)
    expect(Object.isFrozen(before)).toBe(true)
    expect(Object.isFrozen(before.beat)).toBe(true)
    expect(Reflect.set(before, 'localProgress', 1)).toBe(false)
    expect(Reflect.set(before.beat, 'id', 'mutated')).toBe(false)
    expect(timeline.sample(0.25)).toEqual(before)
  })

  it('does not collapse nearby progress inputs into a rounded state key', () => {
    const a = sampleTorqueBeat(0.123456789)
    const b = sampleTorqueBeat(0.123456789 + Number.EPSILON)
    expect(a.beat.id).toBe(b.beat.id)
    expect(a.stateKey).not.toBe(b.stateKey)
    expect(sampleTorqueBeat(a.progress).stateKey).toBe(a.stateKey)
    const changed = fixture().map((beat) => ({ ...beat, title: 'new metadata' }))
    expect(createBeatTimeline(changed, ['opening', 'close']).sample(0.25).stateKey)
      .not.toBe(createBeatTimeline(fixture(), ['opening', 'close']).sample(0.25).stateKey)
    const changedNeighbor = fixture()
    Object.assign(changedNeighbor[1], { id: 'different-next' })
    expect(createBeatTimeline(changedNeighbor, ['opening', 'close']).sample(0.25).stateKey)
      .not.toBe(createBeatTimeline(fixture(), ['opening', 'close']).sample(0.25).stateKey)
  })

  it('rejects an empty inventory and blank or duplicate beat IDs', () => {
    expect(() => createBeatTimeline([], ['opening'])).toThrow(/coverage/)
    for (const id of ['', '   ', 'first']) {
      const beats = fixture()
      Object.assign(beats[1], { id })
      expect(() => createBeatTimeline(beats, ['opening', 'close'])).toThrow(/nonempty|Duplicate/)
    }
  })

  it.each([
    [-0.1, 0.5], [0, 1.1], [0.5, 0.5], [0.7, 0.5],
    [NaN, 0.5], [0, NaN], [-Infinity, 0.5], [0, Infinity],
  ])('rejects invalid normalized window [%s, %s]', (start, end) => {
    const beats = fixture()
    Object.assign(beats[0], { start, end })
    expect(() => createBeatTimeline(beats, ['opening', 'close'])).toThrow(/window/)
  })

  it('rejects missing endpoints, gaps, overlaps, and out-of-order windows without sorting', () => {
    const cases: Array<[TorqueWrenchBeat[], RegExp]> = [
      [fixture().slice(1), /Gap/],
      [fixture().slice(0, 1), /Gap/],
      [fixture().reverse(), /Gap/],
      [[fixture()[0], { ...fixture()[1], start: 0.5 + Number.EPSILON }], /Gap/],
      [[fixture()[0], { ...fixture()[1], start: 0.5 - Number.EPSILON }], /Overlap/],
    ]
    for (const [beats, error] of cases) {
      expect(() => createBeatTimeline(beats, ['opening', 'close'])).toThrow(error)
    }
  })

  it('rejects unknown directors and invalid director inventories', () => {
    expect(() => createBeatTimeline(fixture(), ['opening'])).toThrow(/Unknown.*close/)
    expect(() => createBeatTimeline(fixture(), ['opening', 'close', 'close'])).toThrow(/Duplicate/)
    expect(() => createBeatTimeline(fixture(), ['opening', 'close', ' '])).toThrow(/nonempty/)
  })
})
