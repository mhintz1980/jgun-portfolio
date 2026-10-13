import type { TorqueBeatSample } from './beatTimeline'

/** Safe eager metadata only. Real CAD-bearing registrations belong behind cadGate. */
export const TORQUE_DIRECTOR_IDS = Object.freeze([
  'opening', 'pit', 'mechanism', 'inspection', 'close',
] as const)

export type TorqueDirectorSampler<State> = (sample: TorqueBeatSample) => State

export interface TorqueDirectorRegistration<State> {
  readonly id: string
  readonly sample: TorqueDirectorSampler<State>
}

export interface TorqueDirectorRegistry<State> {
  readonly ids: readonly string[]
  get(id: string): TorqueDirectorSampler<State>
  sample(sample: TorqueBeatSample): State
}

/**
 * Inject pure samplers against an explicit ID inventory, including external IDs. Construction
 * rejects incomplete registries; sampling has no history, clock, store, or registration effects.
 * Purity of the injected functions is the caller's contract, not a CAD/effects acceptance claim.
 */
export function createDirectorRegistry<State>(
  knownDirectorIds: readonly string[],
  registrations: readonly TorqueDirectorRegistration<State>[],
): TorqueDirectorRegistry<State> {
  const known = new Set<string>()
  for (const id of knownDirectorIds) {
    if (typeof id !== 'string' || id.trim().length === 0) throw new Error('Director must have a nonempty ID')
    if (known.has(id)) throw new Error(`Duplicate director ID: ${id}`)
    known.add(id)
  }
  const samplers = new Map<string, TorqueDirectorSampler<State>>()
  for (const registration of registrations) {
    if (!known.has(registration.id)) throw new Error(`Unknown director ID: ${registration.id}`)
    if (samplers.has(registration.id)) throw new Error(`Duplicate director registration: ${registration.id}`)
    if (typeof registration.sample !== 'function') throw new Error(`Missing sampler for director: ${registration.id}`)
    samplers.set(registration.id, registration.sample)
  }
  for (const id of known) {
    if (!samplers.has(id)) throw new Error(`Missing director registration: ${id}`)
  }
  const get = (id: string): TorqueDirectorSampler<State> => {
    const sampler = samplers.get(id)
    if (!sampler) throw new Error(`Unknown director ID: ${id}`)
    return sampler
  }
  return Object.freeze({
    ids: Object.freeze([...known]),
    get,
    sample: (sample: TorqueBeatSample): State => get(sample.beat.director)(sample),
  })
}
