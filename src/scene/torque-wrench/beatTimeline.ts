import { TORQUE_BEATS, type TorqueWrenchBeat } from './beats'
import { TORQUE_DIRECTOR_IDS } from './directorRegistry'

// Existing store/conductor fixtures consume this type from the resolver module.
export type { TorqueWrenchBeat } from './beats'

export interface TorqueBeatSample {
  readonly progress: number
  readonly beat: TorqueWrenchBeat
  readonly index: number
  readonly localProgress: number
  readonly previousId: string | null
  readonly nextId: string | null
  readonly phase: 'entering' | 'active' | 'exiting'
  readonly stateKey: string
}

export interface TorqueBeatTimeline {
  sample(progress: number): TorqueBeatSample
}

function requireId(id: string, field: string): void {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`${field} must be a nonempty ID`)
  }
}

/** Validate once, then retain only frozen copies of the scalar metadata contract. */
export function createBeatTimeline(
  beats: readonly TorqueWrenchBeat[],
  knownDirectorIds: readonly string[],
): TorqueBeatTimeline {
  if (beats.length === 0) throw new Error('Beat timeline requires complete coverage from 0 to 1')
  const known = new Set<string>()
  for (const id of knownDirectorIds) {
    requireId(id, 'Director')
    if (known.has(id)) throw new Error(`Duplicate director ID: ${id}`)
    known.add(id)
  }

  const ids = new Set<string>()
  let coveredEnd = 0
  const inventory = Object.freeze(beats.map((beat) => {
    requireId(beat.id, 'Beat')
    if (ids.has(beat.id)) throw new Error(`Duplicate beat ID: ${beat.id}`)
    ids.add(beat.id)
    if (!Number.isFinite(beat.start) || !Number.isFinite(beat.end)
      || beat.start < 0 || beat.start >= beat.end || beat.end > 1) {
      throw new Error(`Invalid normalized window for beat: ${beat.id}`)
    }
    if (beat.start !== coveredEnd) {
      throw new Error(`${beat.start < coveredEnd ? 'Overlap' : 'Gap'} before beat: ${beat.id}`)
    }
    requireId(beat.director, 'Director')
    if (!known.has(beat.director)) throw new Error(`Unknown director ID: ${beat.director}`)
    requireId(beat.camera, 'Camera')
    requireId(beat.scene, 'Scene')
    coveredEnd = beat.end
    // Explicit scalar copy: caller-owned arrays/objects and extra properties never enter sampling.
    return Object.freeze({
      id: beat.id, start: beat.start, end: beat.end,
      title: beat.title, copy: beat.copy, camera: beat.camera, scene: beat.scene,
      director: beat.director, interaction: beat.interaction, poster: beat.poster,
    })
  }))
  if (coveredEnd !== 1) throw new Error('Gap after final beat: coverage must end at 1')

  return Object.freeze({
    sample(input: number): TorqueBeatSample {
      if (!Number.isFinite(input)) throw new Error('Narrative progress must be finite')
      // Math.max canonicalizes negative zero as well as clamping finite overscroll.
      const progress = Math.max(0, Math.min(1, input))
      // Upper-bound search on starts: next beat owns every shared boundary, including reverse.
      let low = 0
      let high = inventory.length
      while (low < high) {
        const mid = Math.floor((low + high) / 2)
        if (inventory[mid].start <= progress) low = mid + 1
        else high = mid
      }
      const index = low - 1
      const beat = inventory[index]
      const localProgress = Math.max(0, Math.min(1, (progress - beat.start) / (beat.end - beat.start)))
      const phase = localProgress < 0.1 ? 'entering' : localProgress >= 0.9 ? 'exiting' : 'active'
      const previousId = inventory[index - 1]?.id ?? null
      const nextId = inventory[index + 1]?.id ?? null
      return Object.freeze({
        progress, beat, index, localProgress, previousId, nextId, phase,
        // JSON's exact number serialization avoids rounded-key collisions and ID delimiters.
        // Include metadata so keys also distinguish differently authored injected timelines.
        stateKey: JSON.stringify([progress, index, beat, localProgress, previousId, nextId, phase]),
      })
    },
  })
}

const torqueTimeline = createBeatTimeline(TORQUE_BEATS, TORQUE_DIRECTOR_IDS)

export function sampleTorqueBeat(progress: number): TorqueBeatSample {
  return torqueTimeline.sample(progress)
}
