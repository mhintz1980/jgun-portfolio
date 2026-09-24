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
  // Baffle labyrinth: G2RL300-SAF-1003-2 intake panel -> up the GRRL200-SAF-1172-1 slanted face -> aft under the ceiling -> hairpin under the canopy leading edge -> out the pocket mouth -> long aft descent -> joins the merged discharge.
  main: [
    [-.40, 1.44,  1.55],  // entry, level approach from outboard of the intake end panel
    [-.40, 1.45,  1.40],  // arriving at the hex openings of the intake end panel (z 1.295-1.355)
    [-.40, 1.60,  1.23],  // through the panel, rising off the slanted floor
    [-.40, 1.75, 1.056],  // under the ceiling, clear of the slanted floor face
    [-.40, 1.76,   .86],  // ceiling run toward the apex
    [-.40, 1.763,  .719],  // apex just aft of the cut
    [-.40, 1.748,  .613],  // descending forward to the hairpin tip
    [-.40, 1.671,  .57],  // hairpin tip under the canopy leading edge
    [-.40, 1.607,  .585],  // looping back up from the tip
    [-.40, 1.522,  .631],  // the loop running up and aft
    [-.40, 1.466,  .625],  // dropping out through the pocket mouth (y < 1.479)
    [-.40, 1.413,  .566],  // turning aft under the canopy lip
    [-.40, 1.378,  .494],  // under the canopy lip, running aft
    [-.40, 1.349,  .414],  // clear of the lip on the aft run
    [-.40, 1.272,  .171],  // the long aft descent the owner drew
    [-.40, 1.197, -.068],  // long aft descent, continuing
    [-.40, 1.13,  -.285],  // long aft descent, easing aft
    [-.36, 1.045, -.55],  // continuing that descent
    [-.327, 1.003, -.727],  // joining the merged discharge tangentially-near (z -.727)
  ],
  lower: [
    [-.18, -.10, .774],  // drawn from the crawl space directly under the open louver gap (band z .770-.789)
    [-.18, .05, .772],  // through the gap into the open-bottom collector (crosses the panel plane at z ~.780)
    [-.18, .105, .640],  // easing aft inside the collector, below the duct top's leading edge
    [-.18, .092, .300],  // the shallow duct run (top panel bottom y .129, floor top y -.009)
    [-.18, .098, -.100],  // aft end of the duct, past the top panel
    [-.17, .30, -.300],  // up through the riser, clear of its left wall (inner face x -.204)
    [-.21, .62, -.320],  // the climb through the lower interior on the lane clear of the EMG panel band
    [-.26, .78, -.375],  // bending outboard toward the discharge root
    [-.305, .898, -.414],  // ON the merged spine (its curve at t=.06): the second feed, one exit
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
