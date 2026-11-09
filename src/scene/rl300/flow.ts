import { clamp01, smoothWindow } from './shot'
import { WINDOWS } from './beats'

/** Air draw-on: a fast leading edge that arrives gently, so the path is visible from the start of
 *  its beat and holds finished for the rest of it. 0 at the window start and 1 at its end, like
 *  `smoothWindow`; sound strips keep `smoothWindow` (they draw on from their own windows). */
const drawOnWindow = (w: readonly [number, number], x: number) => {
  const t = clamp01((x - w[0]) / (w[1] - w[0]))
  return 1 - (1 - t) * (1 - t) * (1 - t)
}

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
    [-0.4, 1.44, 1.55], // entry, level approach from outboard of the intake end panel
    [-0.4, 1.45, 1.4], // arriving at the hex openings of the intake end panel (z 1.295-1.355)
    [-0.4, 1.6, 1.23], // through the panel, rising off the slanted floor
    [-0.4, 1.75, 1.056], // under the ceiling, clear of the slanted floor face
    [-0.4, 1.76, 0.86], // ceiling run toward the apex
    [-0.4, 1.763, 0.719], // apex just aft of the cut
    [-0.4, 1.748, 0.613], // descending forward to the hairpin tip
    [-0.4, 1.671, 0.57], // hairpin tip under the canopy leading edge
    [-0.4, 1.607, 0.585], // looping back up from the tip
    [-0.4, 1.522, 0.631], // the loop running up and aft
    [-0.4, 1.466, 0.625], // dropping out through the pocket mouth (y < 1.479)
    [-0.4, 1.413, 0.566], // turning aft under the canopy lip
    [-0.4, 1.378, 0.494], // under the canopy lip, running aft
    [-0.4, 1.349, 0.414], // clear of the lip on the aft run
    [-0.4, 1.272, 0.171], // the long aft descent the owner drew
    [-0.4, 1.197, -0.068], // long aft descent, continuing
    [-0.4, 1.13, -0.285], // long aft descent, easing aft
    [-0.36, 1.045, -0.55], // continuing that descent
    [-0.327, 1.003, -0.727], // joining the merged discharge tangentially-near (z -.727)
  ],
  lower: [
    // wp0-5 ride the intake group (world offset (0, +.205, +.030) — the owner's skid-bay + engine-side moves)
    [-0.18, 0.105, 0.682], // drawn from the skid bay directly under the forward louver gap (band z .678-.697)
    [-0.18, 0.255, 0.678], // through the gap into the open-bottom collector (crosses the panel plane y .172 at z ~.687)
    [-0.18, 0.31, 0.54], // easing aft inside the collector, under the duct top's leading edge
    [-0.18, 0.297, 0.3], // the shallow duct run (top panel bottom y .334, floor top y .196)
    [-0.18, 0.303, -0.07], // aft end of the duct, past the top panel
    [-0.17, 0.505, -0.27], // up through the riser, clear of its left wall (inner face x -.204)
    [-0.21, 0.62, -0.32], // the climb through the lower interior on the lane clear of the EMG panel band
    [-0.26, 0.78, -0.375], // bending outboard toward the discharge root
    [-0.305, 0.898, -0.414], // ON the merged spine (its curve at t=.06): the second feed, one exit
  ],
  merged: [
    [-0.3, 0.88, -0.35],
    [-0.32, 0.96, -0.62],
    [-0.34, 1.1, -0.95],
    [-0.36, 1.26, -1.35],
    [-0.38, 1.4, -1.88],
  ],
}

/** Measured AABB of the rebuilt DUCT_INTAKE_AIRWAY volume in the shipped GLB; the corridor waypoints above are tested against it. */
export const AIRWAY_BOUNDS = {
  min: [-0.6, 1.348, 0.434],
  max: [0.6, 1.855, 1.3],
} as const

/** Y-Z cross-section of the airway prism (web frame). The corridor is L-shaped, so
 *  AIRWAY_BOUNDS alone admits a corner that is actually solid sheet metal. */
export const AIRWAY_SECTION: readonly (readonly [number, number])[] = [
  [1.855, 1.3],
  [1.855, 0.564],
  [1.776, 0.496],
  [1.479, 0.434],
  [1.479, 0.714],
  [1.652, 0.714],
  [1.348, 1.3],
]

/** True when (y, z) lies inside AIRWAY_SECTION. Ray-casting point-in-polygon. */
export function insideAirwaySection(y: number, z: number): boolean {
  let inside = false
  for (let i = 0, j = AIRWAY_SECTION.length - 1; i < AIRWAY_SECTION.length; j = i++) {
    const [yi, zi] = AIRWAY_SECTION[i]
    const [yj, zj] = AIRWAY_SECTION[j]
    if (zi > z !== zj > z && y < ((yj - yi) * (z - zi)) / (zj - zi) + yi) inside = !inside
  }
  return inside
}

export const SOUND_ORIGIN: Vec3 = [-0.2, 0.95, 0.1]
/** TOTAL hero ribbons across main+lower+merged, not per bundle. Plan allows 12-24 desktop, 6-10 mobile. */
export const RIBBON_COUNT = { desktop: 18, mobile: 9 } as const

/** Splits the total ribbon budget across the three air bundles. Sums exactly to the budget. */
export function ribbonSplit(total: number): Record<'main' | 'lower' | 'merged', number> {
  if (!Number.isInteger(total) || total < 6) throw new RangeError('Ribbon budget must be an integer of at least six.')
  const minimum = 2
  const remaining = total - minimum * 3
  const proportions = [1, 1, 1] as const
  const additions = proportions.map((proportion) => Math.floor((remaining * proportion) / 3))
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

export const SOUND_TARGETS: readonly Vec3[] = [
  [-0.2, 1.365, 0.545], // A: baffle top face, near-vertical absorption hit
  [-0.2, 1.6, 0.714], // B: +z slab face, angled hit
  [-0.2, 1.639, 0.939], // C: slanted face, grazing encounter
  [0.19, 1.458, 1.24], // D: far-side face, cross-duct absorption
]
/** Measured 2026-09-24 from msp-enclosure.glb ACOUSTIC_BAFFLES (evidence 24): the face
 *  each front terminates on — plane point + outward normal. Contacts are tested against
 *  these planes; AIRWAY-style measured constants, not prose. */
export const SOUND_FACES: readonly { point: Vec3; normal: Vec3 }[] = [
  { point: [-0.171, 1.365, 0.559], normal: [0, 1, 0] },
  { point: [-0.207, 1.638, 0.714], normal: [0, 0, 1] },
  { point: [-0.204, 1.639, 0.939], normal: [0.169, -0.697, 0.697] },
  { point: [0.207, 1.449, 1.249], normal: [0, -0.703, -0.711] },
]
/** Per-front draw windows in u (the staggered arrival sweep). The last contact resolves
 *  at .856 — before the chevron isolation response begins (AirRibbons shaders).
 *  Authored on the "Control the noise" beat record in `beats.ts`. */
export const SOUND_WINDOWS: readonly (readonly [number, number])[] = WINDOWS.soundFronts

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
  if (u <= WINDOWS.flowClosedBelow || u >= WINDOWS.flowClosedAbove) return zeroState(u)

  const extent: Record<Bundle, number> = {
    main: drawOnWindow(WINDOWS.mainExtent, u),
    lower: drawOnWindow(WINDOWS.lowerExtent, u),
    merged: drawOnWindow(WINDOWS.mergedExtent, u),
    sound: smoothWindow(WINDOWS.soundExtent, u),
  }

  const handoff = smoothWindow(WINDOWS.handoff, u)
  const fade = 1 - smoothWindow(WINDOWS.fade, u)
  const airWeight = (value: number) => (value > 0 ? (1 - 0.65 * handoff) * fade : 0)
  const mainIntroduction = 1 - 0.5 * smoothWindow(WINDOWS.mainDim, u) + 0.5 * smoothWindow(WINDOWS.mainRestore, u)

  return {
    extent,
    weight: {
      main: airWeight(extent.main) * mainIntroduction,
      lower: airWeight(extent.lower),
      merged: airWeight(extent.merged),
      sound: extent.sound * fade,
    },
    heat: smoothWindow(WINDOWS.heatRise, u) * (1 - smoothWindow(WINDOWS.heatFall, u)),
    phase: u * 12,
  }
}
