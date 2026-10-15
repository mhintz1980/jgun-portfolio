import { BRANCH_START_SECONDS, BURST_KEYS, electricalElapsed, newElectricalSample,
  sampleElectrical, type ElectricalSample } from '../drawing/electricalScore'

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u) }

/** Emission is separate from accumulated path growth: holds have exactly zero energy. */
export function burstEnergy(seconds: number): number {
  for (const key of BURST_KEYS) {
    if (seconds > key.t0 && seconds < key.t1) {
      return Math.pow(Math.sin(Math.PI * (seconds - key.t0) / (key.t1 - key.t0)), 2)
    }
  }
  return 0
}

export interface PrivateElectricalSample extends ElectricalSample {
  energy: number
  pitEnergy: number
  pitGrowth: number
}

/** One score for the profile, interior branches and exposed wall fissures. No clock. */
export function samplePrivateElectrical(t: number, fracture: number): PrivateElectricalSample {
  if (!Number.isFinite(t) || !Number.isFinite(fracture)) throw new RangeError('Electrical inputs must be finite')
  const score = sampleElectrical(t, newElectricalSample())
  const seconds = electricalElapsed(t)
  const energy = Math.max(burstEnergy(seconds), burstEnergy(seconds - BRANCH_START_SECONDS))
  // Fissures continue the same six accelerating bursts through the opening, rather than
  // inheriting a permanently-on fracture scalar. Local .845 start follows first rupture.
  const pitSeconds = (t - 0.845) * 50
  const pitEnergy = burstEnergy(pitSeconds) * smooth(fracture / 0.08)
  return { ...score, energy: Math.max(energy, pitEnergy), pitEnergy,
    pitGrowth: clamp(pitSeconds / BURST_KEYS.at(-1)!.t1) }
}
