import { shaftBeat, shaftBeats, type ShaftBeatId } from './story'

const ISOLATE = shaftBeat('isolate'), SHAPING = shaftBeat('shaping'), RECAP = shaftBeat('recap')
const WIPE = shaftBeat('revised-blank'), HOB = shaftBeat('hobbing'), SUPPORTS = shaftBeat('supports'), FINALE = shaftBeat('finale')
export const clamp01 = (x: number): number => x < 0 ? 0 : x > 1 ? 1 : x
export const shaftEase = (x: number): number => { const u = clamp01(x); return u * u * (3 - 2 * u) }

export interface ShaftSchedule {
  time: number; beat: ShaftBeatId; beatIndex: number
  legacyShaft: number; approvedShaft: number; shaper: number; hob: number
  housing: number; legacyHousing: number; legacyBearing: number; legacyRing: number
  approvedBearing: number; approvedRing: number; neighbours: number
  wipe: boolean; wipeProgress: number; section: boolean
  supportBlend: number; witnesses: boolean; endpointHeld: boolean
  narrativeAlpha: number; finaleAngle: number
}
export function createShaftSchedule(): ShaftSchedule {
  return { time: 0, beat: 'isolate', beatIndex: 0, legacyShaft: 0, approvedShaft: 0,
    shaper: 0, hob: 0, housing: 0, legacyHousing: 0, legacyBearing: 0, legacyRing: 0,
    approvedBearing: 0, approvedRing: 0, neighbours: 0, wipe: false, wipeProgress: 0,
    section: false, supportBlend: 0, witnesses: false, endpointHeld: false,
    narrativeAlpha: 1, finaleAngle: 0 }
}

/** Pure closed-form visibility. Both wipe shafts stay opaque with complementary planes. */
export function sampleShaftSchedule(time: number, out: ShaftSchedule): ShaftSchedule {
  const t = Number.isFinite(time) ? Math.max(0, Math.min(FINALE.end, time)) : 0
  let i = shaftBeats.length - 1
  while (i > 0 && t < shaftBeats[i].start) i--
  out.time = t; out.beatIndex = i; out.beat = shaftBeats[i].id
  out.legacyShaft = t < WIPE.end ? shaftEase((t - ISOLATE.start) / 1.2) : 0
  out.approvedShaft = t >= WIPE.start ? 1 : 0
  out.shaper = t >= SHAPING.start && t < RECAP.end
    ? shaftEase((t - SHAPING.start) / 0.35) * shaftEase((RECAP.end - t) / 0.35) : 0
  out.hob = t >= HOB.start && t < HOB.end
    ? shaftEase((t - HOB.start) / 0.25) * shaftEase((HOB.end - t) / 0.25) : 0
  out.wipe = t >= WIPE.start && t < WIPE.end
  out.wipeProgress = shaftEase((t - WIPE.start) / (WIPE.end - WIPE.start))
  out.section = t >= SUPPORTS.start && t < FINALE.start
  const supports = shaftEase((t - SUPPORTS.start) / 0.5)
  const witness = 0.16 * supports * shaftEase((FINALE.start - t) / 0.4)
  out.housing = supports; out.legacyHousing = out.section ? witness * 0.5 : 0
  out.legacyBearing = out.section ? witness : 0; out.legacyRing = out.legacyBearing
  out.approvedBearing = supports; out.approvedRing = supports
  // >=0.5 s witness establishment; 2 s slide; >=0.8 s endpoint before witness fade.
  out.supportBlend = shaftEase((t - (SUPPORTS.start + 0.6)) / 2)
  out.witnesses = out.legacyBearing > 0
  out.endpointHeld = t >= SUPPORTS.start + 2.6
  out.neighbours = shaftEase((t - FINALE.start) / 1.5)
  out.narrativeAlpha = 1 - shaftEase(t / 1.2)
  const dt = Math.max(0, t - FINALE.start)
  // Closed-form integral of a 1 s spin-rate ramp, then 0.10 rev/s display rate.
  const u = Math.min(1, dt)
  out.finaleAngle = 0.2 * Math.PI * (dt <= 1 ? u ** 3 - 0.5 * u ** 4 : dt - 0.5)
  return out
}
