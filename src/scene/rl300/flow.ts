import { clamp01, smooth } from './shot'

export type Bundle = 'main' | 'lower' | 'merged' | 'sound'
export type Vec3 = readonly [number, number, number]

export interface FlowState {
  /** 0..1 draw-on fraction along each bundle's arc. */
  extent: Record<Bundle, number>
  /** 0..1 opacity multiplier. Shot 06 dims the air bundles; it does not retract them. */
  weight: Record<Bundle, number>
  /** 0..1 global heat weight, driving the colour ramp. */
  heat: number
  /** Deterministic dash phase. MUST be a pure function of progress. */
  phase: number
}

export const SPINES: Record<Exclude<Bundle, 'sound'>, readonly Vec3[]> = {
  // Baffle labyrinth: G2RL300-SAF-1003-2 intake panel -> up the GRRL200-SAF-1172-1 slanted face -> aft under the ceiling -> down at the canopy leading edge -> U-turn under the lip, then aft to the engine.
  main: [
    [-.40, 1.42,  1.40],  // entry, approaching the hex openings, outboard of the panel
    [-.40, 1.36,  1.33],  // through the intake end panel (z 1.295-1.355)
    [-.40, 1.47,  1.14],  // inside the corridor, climbing the slanted face
    [-.40, 1.62,   .84],  // still on the slant, nearing the apex
    [-.40, 1.74,   .70],  // ceiling corridor, running aft
    [-.40, 1.79,   .60],  // approaching the canopy leading edge
    [-.40, 1.72,   .55],  // turning down at the canopy leading edge (z .564)
    [-.39, 1.62,   .52],  // descending clear of the canopy fore face
    [-.38, 1.56,   .58],  // the U-turn, held off the aft wall for ribbon fan clearance
    [-.36,  .98,   .22],  // running aft toward the engine
    [-.34,  .90,  -.10],  // into the equipment region
    [-.32,  .88,  -.32],  // hands off to the merged discharge
  ],
  lower: [
    [-.18, -.14, .80], [-.18, .06, .78], [-.18, .14, .62], [-.18, .10, .30],
    [-.18, .10, -.10], [-.20, .30, -.30], [-.22, .62, -.34], [-.25, .87, -.32],
  ],
  merged: [
    [-.30, .88, -.35], [-.32, .96, -.62], [-.34, 1.10, -.95], [-.36, 1.26, -1.35], [-.38, 1.40, -1.88],
  ],
}

/** Measured AABB of the rebuilt DUCT_INTAKE_AIRWAY volume in the shipped GLB; the corridor waypoints above are tested against it. */
export const AIRWAY_BOUNDS = {
  min: [-.600, 1.348,  .434],
  max: [ .600, 1.855, 1.300],
} as const

/** Y-Z cross-section of the airway prism (web frame). The corridor is L-shaped, so
 *  AIRWAY_BOUNDS alone admits a corner that is actually solid sheet metal. */
export const AIRWAY_SECTION: readonly (readonly [number, number])[] = [
  [1.855, 1.300], [1.855, .564], [1.776, .496], [1.479, .434],
  [1.479, .714], [1.652, .714], [1.348, 1.300],
]

/** True when (y, z) lies inside AIRWAY_SECTION. Ray-casting point-in-polygon. */
export function insideAirwaySection(y: number, z: number): boolean {
  let inside = false
  for (let i = 0, j = AIRWAY_SECTION.length - 1; i < AIRWAY_SECTION.length; j = i++) {
    const [yi, zi] = AIRWAY_SECTION[i]
    const [yj, zj] = AIRWAY_SECTION[j]
    if ((zi > z) !== (zj > z) && y < (yj - yi) * (z - zi) / (zj - zi) + yi) inside = !inside
  }
  return inside
}

export const SOUND_ORIGIN: Vec3 = [-.20, .95, .10]
/** TOTAL hero ribbons across main+lower+merged, not per bundle. Plan allows 12-24 desktop, 6-10 mobile. */
export const RIBBON_COUNT = { desktop: 18, mobile: 9 } as const

/** Splits the total ribbon budget across the three air bundles. Sums exactly to the budget. */
export function ribbonSplit(total: number): Record<'main' | 'lower' | 'merged', number> {
  if (!Number.isInteger(total) || total < 6) throw new RangeError('Ribbon budget must be an integer of at least six.')
  const minimum = 2
  const remaining = total - minimum * 3
  const proportions = [1, 1, 1] as const
  const additions = proportions.map(proportion => Math.floor(remaining * proportion / 3))
  let remainder = remaining - additions.reduce((sum, count) => sum + count, 0)
  for (let i = 0; remainder > 0; i++, remainder--) additions[i % additions.length]++
  return {
    main: minimum + additions[0],
    lower: minimum + additions[1],
    merged: minimum + additions[2],
  }
}
export const HEAT_RAMP: readonly [string, string] = ['#72DBFF', '#FF7A24']
export const SOUND_FRONTS = 4

const ZERO_EXTENT: Record<Bundle, number> = { main: 0, lower: 0, merged: 0, sound: 0 }
const ZERO_WEIGHT: Record<Bundle, number> = { main: 0, lower: 0, merged: 0, sound: 0 }

function zeroState(progress: number): FlowState {
  return {
    extent: { ...ZERO_EXTENT },
    weight: { ...ZERO_WEIGHT },
    heat: 0,
    phase: progress * 12,
  }
}

/**
 * Evaluate the authored RL300 airflow beat without a clock. The explicit outer
 * branches are intentional: the closed-shell endpoints must be exact zeros,
 * not values that merely converge toward zero through nested smoothsteps.
 */
export function evaluateFlow(progress: number): FlowState {
  const u = clamp01(progress)
  if (u <= .26 || u >= .90) return zeroState(u)

  const extent: Record<Bundle, number> = {
    main: smooth(.27, .40, u),
    lower: smooth(.41, .60, u),
    merged: smooth(.61, .68, u),
    sound: smooth(.76, .86, u),
  }

  const handoff = smooth(.76, .86, u)
  const fade = 1 - smooth(.86, .90, u)
  const airWeight = (value: number) => value > 0 ? (1 - .65 * handoff) * fade : 0
  const mainIntroduction = 1 - .5 * smooth(.41, .47, u) + .5 * smooth(.58, .64, u)

  return {
    extent,
    weight: {
      main: airWeight(extent.main) * mainIntroduction,
      lower: airWeight(extent.lower),
      merged: airWeight(extent.merged),
      sound: extent.sound * fade,
    },
    heat: smooth(.55, .66, u) * (1 - smooth(.82, .89, u)),
    phase: u * 12,
  }
}
