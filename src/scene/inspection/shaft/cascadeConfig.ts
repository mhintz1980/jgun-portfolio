/** Shaft study only. Exploded-view ROTATION_TURNS is an independent display sweep. */
export const SUN_TO_STAGE1_CARRIER_RATIO = 5.2
/** Stage 2/P001836 is owner-confirmed. Remaining local reductions are cinematic. */
export const CASCADE_LOCAL_REDUCTION = .2
/** Physical order: 1, 2, 5, bearing, 3, 4, output, shell. */
export const CASCADE_RATIOS = Object.freeze([
  1, .2, .04, 0, .008, .0016, .0016, 0,
] as const)
export const INPUT_TURNS_PER_OUTPUT_TURN = SUN_TO_STAGE1_CARRIER_RATIO / CASCADE_RATIOS[6]
/** Positive magnitudes: runtime applies -carrierAngle * multiplier. */
export const CASCADE_PLANET_MULTIPLIERS = Object.freeze([3.5, 10 / 3, 36 / 13, 0, 52 / 11, 6, 0, 0] as const)
/** Feature periods and absolute rotation per Stage 1 carrier radian. No global RPM cap. */
export const CASCADE_ALIAS_FEATURES = Object.freeze([
  Object.freeze({ id: 'inputSunTeeth', periods: 10, rate: 5.2 }),
  Object.freeze({ id: 'inputSixfold', periods: 6, rate: 5.2 }),
  Object.freeze({ id: 'stage1Planets', periods: 12, rate: 2.5 }),
  Object.freeze({ id: 'stage1Sun', periods: 10, rate: 1 }),
  Object.freeze({ id: 'stage2Planets', periods: 12, rate: .2 * (10 / 3 - 1) }),
  Object.freeze({ id: 'stage2Sun', periods: 9, rate: .2 }),
  Object.freeze({ id: 'stage5Planets', periods: 13, rate: .04 * (36 / 13 - 1) }),
] as const)
export const ALIAS_DESIGN_PERIOD = .35
export const ALIAS_HARD_PERIOD = .5
export function featureStepPeriods(carrierStep: number, feature: typeof CASCADE_ALIAS_FEATURES[number]): number {
  return Math.abs(carrierStep) * feature.rate * feature.periods / (2 * Math.PI)
}
export const inputRpmToCarrierRate = (rpm: number): number => rpm * 2 * Math.PI / (60 * SUN_TO_STAGE1_CARRIER_RATIO)
