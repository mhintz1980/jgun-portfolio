import { shaftBeat, shaftBeats, type ShaftBeatId } from './story'
import { BULLET_TIME_SHOT_SPECS, sampleBulletTimeWarp, sampleBulletTimeRate } from '../../torque-wrench/bulletTime'
import { SUN_TO_STAGE1_CARRIER_RATIO } from './cascadeConfig'

const ISOLATE = shaftBeat('isolate'), SHAPING = shaftBeat('shaping'), RECAP = shaftBeat('recap')
const WIPE = shaftBeat('revised-blank'), HOB = shaftBeat('hobbing'), MESH = shaftBeat('stage1-mesh'), FINALE = shaftBeat('cascade-finale')
export const clamp01 = (x: number): number => x < 0 ? 0 : x > 1 ? 1 : x
export const shaftEase = (x: number): number => { const u = clamp01(x); return u * u * (3 - 2 * u) }

/** v51.1: stage1, stage2, stage5, bearing, stage3, stage4, output, outerHousing. */
export const CASCADE_UNIT_COUNT = 8
export type CascadeTuple = [number, number, number, number, number, number, number, number]
const CASCADE_START = [35, 52.2, 55.5, 56.4, 59.1, 62.25, 63.15, 65.4] as const
const CASCADE_SEAT = [38.2, 53.1, 56.4, 57, 60, 63.15, 64.65, 66.9] as const
const CASCADE_RATE = 0.5 * Math.PI
const IGNITION = BULLET_TIME_SHOT_SPECS.stage1Ignition
const IGNITION_START = 38.5, IGNITION_END = 40.2
const IGNITION_DURATION = IGNITION_END - IGNITION_START
const IGNITION_AREA = IGNITION.rate + IGNITION.rampFraction * (1 - IGNITION.rate)
// Readability override is two sun tooth pitches, including both full-speed
// knees. Gear ratios remain unchanged; normal speed is explicitly calibrated.
export const IGNITION_NORMAL_RATE = IGNITION.maxRevolutions * 2 * Math.PI
  / (SUN_TO_STAGE1_CARRIER_RATIO * IGNITION_DURATION * IGNITION_AREA)
const IGNITION_ANGLE = IGNITION_NORMAL_RATE * IGNITION_DURATION * IGNITION_AREA
const IGNITION_ENTRY_ANGLE = IGNITION_NORMAL_RATE * .3 / 2

/** Retimed reveals; driveRate records the eventual Stage 1 carrier rate.
 * No orbit-count requirement. Frozen records are the verifier's contract.
 */
export const CASCADE_REVEAL_EVENTS = Object.freeze([
  Object.freeze({ index: 1, planetStart: 43.5, planetFull: 44.4, carrierStart: 45.3, carrierFull: 46.2, driveRate: Math.PI / 2 }),
  Object.freeze({ index: 2, planetStart: 53.1, planetFull: 54, carrierStart: 55.5, carrierFull: 56.4, driveRate: 1.5 * Math.PI }),
  Object.freeze({ index: 4, planetStart: 57, planetFull: 57.9, carrierStart: 59.1, carrierFull: 60, driveRate: 7 * Math.PI / 3 }),
  Object.freeze({ index: 5, planetStart: 60, planetFull: 60.9, carrierStart: 62.25, carrierFull: 63.15, driveRate: 50 * Math.PI / 9 }),
] as const)

/** Visibility is independent of the approved mechanical clock. Showing the
 * owning carrier sooner must not advance acceleration or takeover phase. */
export const CASCADE_DRIVE_EVENTS = Object.freeze([
  Object.freeze({ start: 52.2, end: 53.1, rate: Math.PI / 2 }),
  Object.freeze({ start: 55.5, end: 56.4, rate: 1.5 * Math.PI }),
  Object.freeze({ start: 59.1, end: 60, rate: 7 * Math.PI / 3 }),
  Object.freeze({ start: 62.25, end: 63.15, rate: 50 * Math.PI / 9 }),
] as const)

/** Quintic travel: zero velocity and acceleration at both axial datums. */
export function axialSlideProgress(time: number, start: number, seat: number): number {
  const u = clamp01((time - start) / (seat - start))
  return u * u * u * (10 + u * (-15 + 6 * u))
}

/** Integral of cubic smoothstep speed, evaluated directly for reversible seeks. */
function smoothRateIntegral(time: number, start: number, end: number): number {
  const dt = Math.max(0, time - start)
  const duration = end - start
  if (dt >= duration) return dt - duration * 0.5
  const u = dt / duration
  return duration * (u * u * u - 0.5 * u * u * u * u)
}

/** Analytic integral of the shared drive, never accumulated frame-by-frame. */
export function sampleFinaleAngle(time: number): number {
  const t = Number.isFinite(time) ? Math.max(0, Math.min(FINALE.end, time)) : 0
  let angle: number
  if (t < IGNITION_START) angle = IGNITION_NORMAL_RATE * smoothRateIntegral(t, 38.2, IGNITION_START)
  else if (t <= IGNITION_END) angle = IGNITION_ENTRY_ANGLE + IGNITION_ANGLE
    * sampleBulletTimeWarp((t - IGNITION_START) / IGNITION_DURATION, IGNITION.rate, IGNITION.rampFraction)
  else angle = IGNITION_ENTRY_ANGLE + IGNITION_ANGLE + IGNITION_NORMAL_RATE * (t - IGNITION_END)
    + (CASCADE_RATE - IGNITION_NORMAL_RATE) * smoothRateIntegral(t, IGNITION_END, 40.6)
  let previousRate = CASCADE_RATE
  for (let i = 0; i < CASCADE_DRIVE_EVENTS.length; i++) {
    const event = CASCADE_DRIVE_EVENTS[i]
    angle += (event.rate - previousRate) * smoothRateIntegral(t, event.start, event.end)
    previousRate = event.rate
  }
  return angle
}

/** Nonnegative shared Stage 1 carrier rad/s; input sun rad/s is this times 5.2.
 * At 66.9 s this is the incoming drive rate; the source takes over its held phase.
 */
export function sampleFinaleDriveRate(time: number): number {
  const t = Number.isFinite(time) ? Math.max(0, Math.min(FINALE.end, time)) : 0
  let rate = t < IGNITION_START ? IGNITION_NORMAL_RATE * shaftEase((t - 38.2) / .3)
    : t <= IGNITION_END ? IGNITION_NORMAL_RATE
      * sampleBulletTimeRate((t - IGNITION_START) / IGNITION_DURATION, IGNITION.rate, IGNITION.rampFraction)
      : IGNITION_NORMAL_RATE + (CASCADE_RATE - IGNITION_NORMAL_RATE) * shaftEase((t - IGNITION_END) / .4)
  let previousRate = CASCADE_RATE
  for (let i = 0; i < CASCADE_DRIVE_EVENTS.length; i++) {
    const event = CASCADE_DRIVE_EVENTS[i]
    rate += (event.rate - previousRate) * shaftEase((t - event.start) / (event.end - event.start))
    previousRate = event.rate
  }
  return rate
}

export interface ShaftSchedule {
  time: number; beat: ShaftBeatId; beatIndex: number
  legacyShaft: number; approvedShaft: number; shaper: number; hob: number
  housing: number; legacyHousing: number; legacyBearing: number; legacyRing: number
  approvedBearing: number; approvedRing: number; neighbours: number
  wipe: boolean; wipeProgress: number; section: boolean
  supportBlend: number; witnesses: boolean; endpointHeld: boolean
  narrativeAlpha: number; finaleAngle: number; finaleDriveRate: number
  stage1SlideProgress: number; datumPulseAlpha: number
  contactGlintMix: number; contactGlintYmm: number; bulletTimeActive: boolean
  /** Carrier-only alpha; planets retain their carrier pivot but own separate materials. */
  cascadeAlpha: CascadeTuple; cascadePlanetAlpha: CascadeTuple
  cascadeOffsetZ: CascadeTuple; housingGhostAlpha: number
}
export function createShaftSchedule(): ShaftSchedule {
  return { time: 0, beat: 'isolate', beatIndex: 0, legacyShaft: 0, approvedShaft: 0,
    shaper: 0, hob: 0, housing: 0, legacyHousing: 0, legacyBearing: 0, legacyRing: 0,
    approvedBearing: 0, approvedRing: 0, neighbours: 0, wipe: false, wipeProgress: 0,
    section: false, supportBlend: 0, witnesses: false, endpointHeld: false,
    narrativeAlpha: 1, finaleAngle: 0, finaleDriveRate: 0,
    stage1SlideProgress: 0, datumPulseAlpha: 0, contactGlintMix: 0, contactGlintYmm: 3.175,
    bulletTimeActive: false, cascadeAlpha: [0, 0, 0, 0, 0, 0, 0, 0],
    cascadePlanetAlpha: [0, 0, 0, 0, 0, 0, 0, 0],
    cascadeOffsetZ: [0.028, 0, 0, 0, 0, 0, 0, 0], housingGhostAlpha: 0 }
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
  out.stage1SlideProgress = axialSlideProgress(t, MESH.start, CASCADE_SEAT[0])
  for (let k = 0; k < CASCADE_UNIT_COUNT; k++) {
    out.cascadeAlpha[k] = shaftEase((t - CASCADE_START[k]) / (k === 0 ? 0.8 : CASCADE_SEAT[k] - CASCADE_START[k]))
    out.cascadePlanetAlpha[k] = k === 0 ? out.cascadeAlpha[k] : 0
    // Only the approved Stage 1 engagement travels. Every downstream clone is
    // faded at its measured assembled datum, including while fully invisible.
    out.cascadeOffsetZ[k] = k === 0 ? 0.028 * (1 - out.stage1SlideProgress) : 0
  }
  for (let k = 0; k < CASCADE_REVEAL_EVENTS.length; k++) {
    const event = CASCADE_REVEAL_EVENTS[k]
    out.cascadeAlpha[event.index] = shaftEase((t - event.carrierStart) / (event.carrierFull - event.carrierStart))
    out.cascadePlanetAlpha[event.index] = shaftEase((t - event.planetStart) / (event.planetFull - event.planetStart))
  }
  // Owner approved these exact upstream fades on 2026-10-27 after both
  // near-axis trials exposed over-limit features through perforated cages.
  const inputRetirement = 1 - shaftEase((t - 52.2) / .9)
  out.approvedShaft *= inputRetirement
  out.cascadePlanetAlpha[0] *= inputRetirement
  out.cascadeAlpha[0] *= 1 - shaftEase((t - 55.5) / .9)
  // Oil-film compression is separate from monotonic travel. Squared sine makes
  // the 80 micrometre envelope C1 at first contact as well as at release.
  if (t > 38.2 && t < 38.45) {
    const settle = (t - 38.2) / 0.25
    const wave = Math.sin(Math.PI * settle)
    out.cascadeOffsetZ[0] -= 0.00008 * wave * wave * (1 - settle) * (1 - settle)
  }
  const pulse = clamp01((t - 38.15) / 0.35)
  out.datumPulseAlpha = t > 38.15 && t < 38.5 ? 0.55 * Math.sin(Math.PI * pulse) ** 2 : 0
  out.contactGlintYmm = 3.175 + 6.35 * shaftEase((out.stage1SlideProgress - 0.65) / 0.35)
  out.contactGlintMix = shaftEase((t - 36) / 0.6) * (1 - shaftEase((t - 39.8) / 0.4))
  out.bulletTimeActive = t >= FINALE.start && t < 40.2
  // Parent restores authenticated source externals once output is rotating.
  // Retain the intended envelope for integration, without a duplicate private
  // shell/housing fade (the registered clone stays available for diagnostics).
  out.housingGhostAlpha = out.cascadeAlpha[7]
  out.cascadeAlpha[7] = 0
  out.section = false
  out.legacyHousing = 0; out.legacyBearing = 0; out.legacyRing = 0
  out.housing = 0
  out.approvedBearing = out.cascadeAlpha[3]; out.approvedRing = out.approvedBearing
  // Supports are already baked at the approved datum; their old slide/witness
  // choreography is retired. The parent runtime holds the pair at the origin.
  out.supportBlend = t >= MESH.start ? 1 : 0
  out.witnesses = false
  out.endpointHeld = t >= CASCADE_SEAT[3]
  out.neighbours = out.cascadeAlpha[0]
  out.narrativeAlpha = 1 - shaftEase(t / 1.2)
  out.finaleAngle = sampleFinaleAngle(t)
  out.finaleDriveRate = sampleFinaleDriveRate(t)
  return out
}
