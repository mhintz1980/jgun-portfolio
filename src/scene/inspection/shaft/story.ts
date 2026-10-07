import type { StoryMetadata } from '../story'

/**
 * Authored story data for the P001835 Input Shaft inspection (JG-035 manufacturing leaf).
 * Beat anchors are the single source for phase boundaries; runtime code reads this table
 * instead of scattering constants. 3D machining states, tools and camera curves are not
 * part of this file (they wait for G0/G2).
 */
export type ShaftBeatId =
  | 'isolate'
  | 'shaping'
  | 'slow-exit'
  | 'recap'
  | 'materials'
  | 'revised-blank'
  | 'hobbing'
  | 'runout-hold'
  | 'supports'
  | 'finale'

export interface ShaftBeat { readonly id: ShaftBeatId; readonly start: number; readonly end: number }

const beat = (id: ShaftBeatId, start: number, end: number): ShaftBeat => Object.freeze({ id, start, end })

/** Contiguous authored beats covering 0..43 s. */
export const shaftBeats: readonly ShaftBeat[] = Object.freeze([
  beat('isolate', 0, 2),
  beat('shaping', 2, 6),
  beat('slow-exit', 6, 11),
  beat('recap', 11, 15),
  beat('materials', 15, 22.6),
  beat('revised-blank', 22.6, 25),
  beat('hobbing', 25, 32),
  beat('runout-hold', 32, 35),
  beat('supports', 35, 39),
  beat('finale', 39, 43),
])

export function shaftBeat(id: ShaftBeatId): ShaftBeat {
  const found = shaftBeats.find(entry => entry.id === id)
  if (!found) throw new Error('Unknown shaft beat: ' + id)
  return found
}

export const shaftStory: StoryMetadata = Object.freeze({
  id: 'shaft-p001835',
  kind: 'shaft',
  version: 1,
  duration: 43,
  chapters: Object.freeze([
    Object.freeze({ id: 'why-groove', label: 'Why the groove was needed', start: 0, end: 15 }),
    Object.freeze({ id: 'materials', label: 'Material attempts', start: 15, end: 22.6 }),
    Object.freeze({ id: 'process', label: 'Changing the process', start: 22.6, end: 35 }),
    Object.freeze({ id: 'supports', label: 'Moving the supports', start: 35, end: 43 }),
  ]),
  assets: Object.freeze([
    Object.freeze({ id: 'manufacturing-core', url: 'models/manufacturing-core-full.glb', tier: 'full', required: true, maxBytes: 2 * 1024 * 1024, sha256: null }),
    Object.freeze({ id: 'manufacturing-core', url: 'models/manufacturing-core-lite.glb', tier: 'lite', required: false, maxBytes: 2 * 1024 * 1024, sha256: null }),
  ]),
  entryWindow: Object.freeze([0.12, 0.525] as const),
  staticAlt: 'shaft-study',
})
