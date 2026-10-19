import { newElectricalSample, type BurstKey, type ElectricalSample } from '../drawing/electricalScore'

const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const u = clamp(x); return u * u * (3 - 2 * u) }

/**
 * Private 4-burst earthquake/ice-crack score (Fix E, owner correction 2026-10-18).
 * Four fast snap-fronts that advance a long way with progressively shortening holds
 * (hold durations 0.26 -> 0.18 -> 0.12 calibration seconds), completing the profile at
 * 1.25 s, followed immediately by the 4-burst interior fracture web over [1.25, 2.50] s.
 */
export const PRIVATE_OUTLINE_BURST_SECONDS = 1.25
export const PRIVATE_BRANCH_START_SECONDS = 1.25
export const PRIVATE_SPARK_START_T = 0.575
export const PRIVATE_OUTLINE_START_T = 0.612
export const PRIVATE_WEB_START_T = 0.746
export const PRIVATE_WEB_COMPLETE_T = 0.8135

export const PRIVATE_BURST_KEYS: readonly BurstKey[] = Object.freeze([
  { t0: 0.00, t1: 0.18, from: 0.00, to: 0.24 },
  { t0: 0.44, t1: 0.62, from: 0.24, to: 0.52 },
  { t0: 0.80, t1: 0.96, from: 0.52, to: 0.82 },
  { t0: 1.08, t1: 1.25, from: 0.82, to: 1.00 },
])

/**
 * Monotone piecewise-linear clock mapping intro time t to private calibration seconds.
 * Every interior knot sits at a burst boundary (t0 or t1) where smoothstep slope is zero,
 * so composed outline/branch completion is C1 everywhere with exact zero-slope plateaus.
 */
const PRIVATE_CLOCK_KNOTS: ReadonlyArray<readonly [number, number]> = [
  [0.5750, -0.18],
  [0.6120, 0.00],
  [0.6480, 0.18],
  [0.6660, 0.44],
  [0.6870, 0.62],
  [0.7117, 0.80],
  [0.7300, 0.96],
  [0.7415, 1.08],
  [0.7545, 1.25],
  [0.7755, 1.43],
  [0.7860, 1.69],
  [0.78985, 1.87],
  [0.7918, 2.05],
  [0.7975, 2.21],
  [0.8036, 2.33],
  [0.8135, 2.50],
]

export function privateElectricalClock(t: number): number {
  const first = PRIVATE_CLOCK_KNOTS[0]
  if (t <= first[0]) return first[1] + (t - first[0]) * 4.864864864864865
  const last = PRIVATE_CLOCK_KNOTS[PRIVATE_CLOCK_KNOTS.length - 1]
  if (t >= last[0]) return last[1] + (t - last[0]) * 17.17171717171717
  let i = 0
  while (i < PRIVATE_CLOCK_KNOTS.length - 2 && t >= PRIVATE_CLOCK_KNOTS[i + 1][0]) i++
  const [a, s0] = PRIVATE_CLOCK_KNOTS[i], [b, s1] = PRIVATE_CLOCK_KNOTS[i + 1]
  return s0 + (s1 - s0) * ((t - a) / (b - a))
}

export function privateElectricalTimeAt(seconds: number): number {
  const first = PRIVATE_CLOCK_KNOTS[0]
  if (seconds <= first[1]) return first[0] + (seconds - first[1]) / 4.864864864864865
  const last = PRIVATE_CLOCK_KNOTS[PRIVATE_CLOCK_KNOTS.length - 1]
  if (seconds >= last[1]) return last[0] + (seconds - last[1]) / 17.17171717171717
  let i = 0
  while (i < PRIVATE_CLOCK_KNOTS.length - 2 && seconds >= PRIVATE_CLOCK_KNOTS[i + 1][1]) i++
  const [a, s0] = PRIVATE_CLOCK_KNOTS[i], [b, s1] = PRIVATE_CLOCK_KNOTS[i + 1]
  return a + (b - a) * ((seconds - s0) / (s1 - s0))
}

export function privateBurstProgress(elapsed: number): number {
  if (elapsed <= 0) return 0
  let value = 0
  for (const key of PRIVATE_BURST_KEYS) {
    if (elapsed >= key.t1) { value = key.to; continue }
    if (elapsed > key.t0) return key.from + (key.to - key.from) * smooth((elapsed - key.t0) / (key.t1 - key.t0))
    return value
  }
  return value
}

/** Emission is separate from accumulated path growth: holds have exactly zero energy. */
export function burstEnergy(seconds: number): number {
  for (const key of PRIVATE_BURST_KEYS) {
    if (seconds > key.t0 && seconds < key.t1) {
      return Math.pow(Math.sin(Math.PI * (seconds - key.t0) / (key.t1 - key.t0)), 2)
    }
  }
  return 0
}

/**
 * Decaying filament afterglow across holds (.68 -> .46 of peak) so already-grown cracks
 * stay readable between bursts without turning holds into sustained full-power emission.
 */
export function holdAfterglow(seconds: number): number {
  if (seconds <= 0) return 0
  for (let i = 0; i < PRIVATE_BURST_KEYS.length; i++) {
    const key = PRIVATE_BURST_KEYS[i]
    if (seconds > key.t0 && seconds < key.t1) return 0.56
    const nextStart = i + 1 < PRIVATE_BURST_KEYS.length ? PRIVATE_BURST_KEYS[i + 1].t0 : key.t1 + 0.45
    if (seconds >= key.t1 && seconds <= nextStart) {
      const u = clamp((seconds - key.t1) / Math.max(1e-6, nextStart - key.t1))
      return 0.68 - 0.22 * smooth(u)
    }
  }
  return seconds > PRIVATE_BURST_KEYS[PRIVATE_BURST_KEYS.length - 1].t1 ? 0.52 : 0
}

export function samplePrivateElectricalScore(t: number, out: ElectricalSample = newElectricalSample()): ElectricalSample {
  const raw = privateElectricalClock(t)
  out.elapsed = Math.max(0, Math.min(PRIVATE_OUTLINE_BURST_SECONDS, raw))
  out.outline = privateBurstProgress(raw)
  const branchRaw = raw - PRIVATE_BRANCH_START_SECONDS
  out.branchElapsed = Math.max(0, Math.min(PRIVATE_OUTLINE_BURST_SECONDS, branchRaw))
  out.branch = privateBurstProgress(branchRaw)
  out.anticipation = t > PRIVATE_SPARK_START_T && t < PRIVATE_OUTLINE_START_T
    ? smooth((t - PRIVATE_SPARK_START_T) / (PRIVATE_OUTLINE_START_T - PRIVATE_SPARK_START_T))
    : 0
  return out
}

export interface PrivateElectricalSample extends ElectricalSample {
  energy: number
  afterglow: number
  pitEnergy: number
  pitGrowth: number
}

/** One score for the profile, interior branches and exposed wall fissures. No clock. */
export function samplePrivateElectrical(t: number, fracture: number): PrivateElectricalSample {
  if (!Number.isFinite(t) || !Number.isFinite(fracture)) throw new RangeError('Electrical inputs must be finite')
  const score = samplePrivateElectricalScore(t, newElectricalSample())
  const seconds = privateElectricalClock(t)
  const branchSeconds = seconds - PRIVATE_BRANCH_START_SECONDS
  const energy = t < 0.84 ? Math.max(burstEnergy(seconds), burstEnergy(branchSeconds)) : 0
  const afterglow = t < 0.88
    ? Math.max(holdAfterglow(seconds), holdAfterglow(branchSeconds)) * (1 - smooth((t - 0.84) / 0.04))
    : 0
  // Fissures continue the same four accelerating bursts through the opening, rather than
  // inheriting a permanently-on fracture scalar. Local .845 start follows first rupture.
  const pitSeconds = (t - 0.845) * 45
  const pitEnergy = burstEnergy(pitSeconds) * smooth(fracture / 0.08)
  return { ...score, energy: Math.max(energy, pitEnergy), afterglow, pitEnergy,
    pitGrowth: clamp(pitSeconds / PRIVATE_BURST_KEYS.at(-1)!.t1) }
}
