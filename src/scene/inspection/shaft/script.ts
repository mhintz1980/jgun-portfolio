import { shaftBeat } from './story'

export type ShaftCardId = 'none' | '4140' | '4340' | 'c300' | '4340-ht'
export type ShaftStampState = 'none' | 'in' | 'settled'
export type ShaftStressKind = 'none' | 'warm' | 'cool'

/** Exact authored card strings. Hardness-range hyphens are ASCII U+002D; never normalize them. */
export const SHAFT_CARD_TEXT = Object.freeze({
  '4140': 'AISI 4140 (40-45 HRC)',
  '4340': 'AISI 4340 (48-50 HRC)',
  'c300': 'C300 (56-58 HRC)',
  '4340-ht': 'AISI 4340 (H.T. 48-50 HRC)',
} as const)
export const SHAFT_STAMP_TEXT = 'FAILED'
export const SHAFT_ATTRIBUTION_TEXT = 'Earlier material attempts, as recounted by the designer.'
export const SHAFT_STRESS_CAPTION_TEXT = 'Illustrative stress concentration'
/** Recap caption; the separator is an em dash (U+2014) exactly as pinned in the manufacturing plan. */
export const SHAFT_RECAP_CAPTION_TEXT = 'Remaining teeth — time compressed'

export const SHAFT_DURATION = 43
/** Card cross-fades are distinct: fade-out completes CARD_GAP before the beat end; the next card starts fading in at the next beat start. */
export const SHAFT_CARD_FADE = 0.14
export const SHAFT_CARD_GAP = 0.02
/** Fully readable alloy text held this long before FAILED; the spec floor is 1.0 s. */
export const SHAFT_READABLE = 1.02
/** Stamp impulse; the spec ceiling is 0.18 s. */
export const SHAFT_IMPULSE = 0.15
/** Unobstructed runout hold after hob withdrawal at 32 s before the cool scan; spec floor 0.8 s. */
export const SHAFT_RUNOUT_HOLD = 0.8
export const SHAFT_WARM_SCAN = 1.2
export const SHAFT_COOL_SCAN = 1.2

const STAMP_OVERSHOOT = 0.5
const REDUCED_FADE = 0.4
const COOL_SCAN_START = 32.8
const FINAL_CARD_START = 33.2
const COOL_HOLD_END = 34.7

const MATERIALS = shaftBeat('materials')
const RECAP = shaftBeat('recap')
const WARM_LEAVE_START = MATERIALS.end
const WARM_LEAVE_END = shaftBeat('revised-blank').end
const STUDY_END = shaftBeat('runout-hold').end

export interface ShaftMaterialAttempt { readonly card: '4140' | '4340' | 'c300'; readonly start: number; readonly end: number }
/** 2.8 + 2.5 + 2.3 = 7.6 s of attempts inside the materials beat (15..22.6). */
export const SHAFT_MATERIAL_ATTEMPTS: readonly ShaftMaterialAttempt[] = Object.freeze([
  Object.freeze({ card: '4140', start: 15, end: 17.8 }),
  Object.freeze({ card: '4340', start: 17.8, end: 20.3 }),
  Object.freeze({ card: 'c300', start: 20.3, end: 22.6 }),
])

const CARD_INDEX: Readonly<Record<ShaftCardId, number>> = { none: 0, '4140': 1, '4340': 2, c300: 3, '4340-ht': 4 }
const STAMP_INDEX: Readonly<Record<ShaftStampState, number>> = { none: 0, in: 1, settled: 2 }
const STRESS_INDEX: Readonly<Record<ShaftStressKind, number>> = { none: 0, warm: 1, cool: 2 }

export interface ShaftScriptFrame {
  card: ShaftCardId
  cardText: string
  cardOpacity: number
  stamp: ShaftStampState
  stampScale: number
  attribution: boolean
  remainingTeeth: boolean
  stressIllustrative: boolean
  stress: ShaftStressKind
  stressMix: number
  scanProgress: number
  discrete: number
}

export function createShaftScriptFrame(): ShaftScriptFrame {
  return {
    card: 'none', cardText: '', cardOpacity: 0, stamp: 'none', stampScale: 1,
    attribution: false, remainingTeeth: false, stressIllustrative: false,
    stress: 'none', stressMix: 0, scanProgress: 0, discrete: 0,
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ease = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }

/**
 * Closed-form sample of the authored card/stamp/caption/stress schedule.
 * Pure function of time: identical output for any seek order, no clocks, no randomness,
 * no allocation. Writes only into the caller-owned out frame and returns it.
 */
export function sampleShaftScript(time: number, reducedMotion: boolean, out: ShaftScriptFrame): ShaftScriptFrame {
  const t = time < 0 ? 0 : time > SHAFT_DURATION ? SHAFT_DURATION : time
  let card: ShaftCardId = 'none'
  let cardOpacity = 0
  let stamp: ShaftStampState = 'none'
  let stampScale = 1
  for (let index = 0; index < SHAFT_MATERIAL_ATTEMPTS.length; index++) {
    const attempt = SHAFT_MATERIAL_ATTEMPTS[index]
    if (t < attempt.start || t >= attempt.end) continue
    card = attempt.card
    const stampIn = attempt.start + SHAFT_CARD_FADE + SHAFT_READABLE
    const settledAt = stampIn + SHAFT_IMPULSE
    const fadeOutStart = attempt.end - SHAFT_CARD_GAP - SHAFT_CARD_FADE
    cardOpacity = t < attempt.start + SHAFT_CARD_FADE
      ? ease((t - attempt.start) / SHAFT_CARD_FADE)
      : t < fadeOutStart ? 1 : 1 - ease((t - fadeOutStart) / SHAFT_CARD_FADE)
    stamp = t >= settledAt ? 'settled' : t >= stampIn ? 'in' : 'none'
    stampScale = reducedMotion || stamp === 'none' || stamp === 'settled' ? 1 : 1 + STAMP_OVERSHOOT * (1 - ease((t - stampIn) / SHAFT_IMPULSE))
    break
  }
  if (t >= FINAL_CARD_START && t < STUDY_END) {
    card = '4340-ht'
    cardOpacity = t < FINAL_CARD_START + SHAFT_CARD_FADE
      ? ease((t - FINAL_CARD_START) / SHAFT_CARD_FADE)
      : t < STUDY_END - SHAFT_CARD_FADE ? 1 : 1 - ease((t - (STUDY_END - SHAFT_CARD_FADE)) / SHAFT_CARD_FADE)
    stamp = 'none'
    stampScale = 1
  }
  out.card = card
  out.cardText = card === 'none' ? '' : SHAFT_CARD_TEXT[card]
  out.cardOpacity = cardOpacity
  out.stamp = stamp
  out.stampScale = stampScale
  out.attribution = t >= MATERIALS.start && t < MATERIALS.end
  out.remainingTeeth = t >= RECAP.start && t < RECAP.end
  let stress: ShaftStressKind = 'none'
  let stressMix = 0
  let scanProgress = 0
  if (t >= MATERIALS.start && t < WARM_LEAVE_END) {
    stress = 'warm'
    if (reducedMotion) {
      scanProgress = 1
      stressMix = ease((t - MATERIALS.start) / REDUCED_FADE)
    } else {
      scanProgress = clamp01((t - MATERIALS.start) / SHAFT_WARM_SCAN)
      stressMix = ease(scanProgress)
    }
    if (t >= WARM_LEAVE_START) stressMix = 1 - ease((t - WARM_LEAVE_START) / (WARM_LEAVE_END - WARM_LEAVE_START))
  } else if (t >= COOL_SCAN_START && t < STUDY_END) {
    stress = 'cool'
    if (reducedMotion) {
      scanProgress = 1
      stressMix = ease((t - COOL_SCAN_START) / REDUCED_FADE)
    } else {
      scanProgress = clamp01((t - COOL_SCAN_START) / SHAFT_COOL_SCAN)
      stressMix = ease(scanProgress)
    }
    if (t >= COOL_HOLD_END) stressMix = 1 - ease((t - COOL_HOLD_END) / (STUDY_END - COOL_HOLD_END))
  }
  out.stress = stress
  out.stressMix = stressMix
  out.scanProgress = scanProgress
  out.stressIllustrative = stress !== 'none'
  out.discrete = ((((CARD_INDEX[card] * 3 + STAMP_INDEX[stamp]) * 2 + (out.attribution ? 1 : 0)) * 2 + (out.remainingTeeth ? 1 : 0)) * 2 + (out.stressIllustrative ? 1 : 0)) * 3 + STRESS_INDEX[stress]
  return out
}
