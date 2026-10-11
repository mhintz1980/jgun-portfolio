/** RL300 "The Quiet Machine" beat records. Plain data: no `three`, no imports. One record per
 *  beat carries its progress span, copy, camera keys, poster and the named windows it owns.
 *  Every `u` literal here is copied verbatim from the authored sequence; they are NOT derived
 *  from `from`/`to`, because that would change float rounding and so the rendered bytes. */
export type Vec3 = [number, number, number]
/** A progress window `[from, to]` in RL300-local `u`. */
export type Win = readonly [number, number]

export interface CameraKey { at: number; position: Vec3; target: Vec3; fov: number }

export type PosterId = 'exterior' | 'section' | 'intake'

/** Every named `u` window the sequence uses. A window lives on the beat where it starts; each name
 *  is owned by exactly one beat. */
export interface BeatWindows {
  /** Section reveal opens (shot.ts `cutAt`). */
  cutOpen?: Win
  /** Section reveal closes. */
  cutClose?: Win
  /** Shot 04 underside pass entered / left (shot.ts `undersideAt`). */
  undersideIn?: Win
  undersideOut?: Win
  /** Flow is exact zero at or below / at or above these (flow.ts closed-shell endpoints). */
  flowClosedBelow?: number
  flowClosedAbove?: number
  /** Flow draw-on per bundle. */
  mainExtent?: Win
  lowerExtent?: Win
  mergedExtent?: Win
  soundExtent?: Win
  /** Shot 06 dims the air bundles. */
  handoff?: Win
  fade?: Win
  /** Main bundle steps back while the lower intake is introduced, then returns. */
  mainDim?: Win
  mainRestore?: Win
  /** Heat ramp up / down. */
  heatRise?: Win
  heatFall?: Win
  /** Per-front draw windows (the staggered arrival sweep) and the isolation chevrons' draw window. */
  soundFronts?: readonly Win[]
  chevrons?: Win
  /** Chevron response after the last contact resolves: rise, then settle. */
  chevronResponseIn?: Win
  chevronResponseOut?: Win
  /** Deflection stubs extinguish. */
  stubOut?: Win
  /** Relative spans in `u` past a front window's end (not absolute positions). */
  stubIgnition?: number
  contactCollapse?: number
  contactFlashIn?: number
  contactFlashOutFrom?: number
  contactFlashOutTo?: number
}

export interface Beat {
  id: string
  from: number
  to: number
  title: string
  note: string
  caption: string
  poster: PosterId
  /** Camera keys this beat owns, in order. The flattened list drives `evaluateShot`'s pairwise interpolation. */
  keys: CameraKey[]
  windows: BeatWindows
}

export const BEATS: readonly Beat[] = [
  {
    id: 'object', from: 0, to: .12,
    title: 'The object', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'A blue shell. A complex machine. One considered envelope.',
    poster: 'exterior',
    keys: [
      // 01 The object — low, long-lens three-quarter; the approach reveals the chamber's depth.
      { at: 0, position: [4.3, .92, 4.55], target: [0, 1, .05], fov: 30 },
      { at: .12, position: [3.62, 1.06, 3.78], target: [0, 1.02, .05], fov: 30 },
    ],
    windows: {},
  },
  {
    id: 'incision', from: .12, to: .27,
    title: 'The incision', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'A finished section edge reveals shell, insulation, equipment and the wall that carries them.',
    poster: 'section',
    keys: [
      // 02 The incision — rise toward the section-facing side, equipment and wall together.
      { at: .27, position: [3.28, 1.78, 2.34], target: [0, 1.18, .1], fov: 34 },
    ],
    windows: { cutOpen: [.13, .3], flowClosedBelow: .26 },
  },
  {
    id: 'main-intake', from: .27, to: .41,
    title: 'The main intake', note: 'RL300-SAFE · SUPPLY AIR',
    caption: 'The existing supply: one continuous path from louvre to plenum, with a direction you can read.',
    poster: 'section',
    keys: [
      // 03 The main intake — track the existing intake/plenum side (DUCT_INTAKE, z .43…1.36).
      { at: .41, position: [3.95, 1.75, 3.15], target: [0, 1.25, .95], fov: 32 },
    ],
    windows: { mainExtent: [.27, .40] },
  },
  {
    id: 'second-breath', from: .41, to: .61,
    title: 'A second breath', note: 'LOWER INTAKE · DESIGN CONCEPT',
    caption: 'Proposed lower intake: open louvres feed a shallow duct and an outlet beneath the engine.',
    poster: 'intake',
    keys: [
      // 04 A second breath — drop below the louver panel (y .172, z .48….78) and look up into the
      // sectioned skid bay: slats, collector, duct and the lower supply read together (owner, 2026-09-24).
      { at: .51, position: [1.05, -.13, 1.05], target: [-.2, .2, .6], fov: 38 },
      // …then arc back toward the engine.
      { at: .61, position: [4.05, .95, .45], target: [0, 1, .1], fov: 34 },
    ],
    windows: {
      undersideIn: [.43, .51], undersideOut: [.51, .62],
      lowerExtent: [.41, .60],
      mainDim: [.41, .47], mainRestore: [.58, .64],
      heatRise: [.55, .66],
    },
  },
  {
    id: 'two-feeds', from: .61, to: .76,
    title: 'Two feeds, one exit', note: 'RL300-SAFE · AIR PATH',
    caption: 'Both supplies warm through the equipment region and join a single shared discharge.',
    poster: 'section',
    keys: [
      // 05 Two feeds, one exit — wider, carrying both supplies to the shared discharge (DUCT_EXHAUST, z −1.68…−.30).
      { at: .76, position: [4.75, 1.55, -1.15], target: [0, 1.15, -.3], fov: 38 },
    ],
    windows: { mergedExtent: [.61, .68] },
  },
  {
    id: 'control-noise', from: .76, to: .89,
    title: 'Control the noise', note: 'RL300-SAFE · ACOUSTIC STRUCTURE',
    caption: 'Two distinct mechanisms: absorptive structure for the air path, isolation for the machine.',
    poster: 'section',
    keys: [
      // 06 Control the noise — the exposed acoustic structure (ACOUSTIC_BAFFLES, y 1.32…1.86) over the mounts.
      { at: .89, position: [3.45, 2.35, 2.45], target: [.05, 1.45, .85], fov: 31 },
    ],
    windows: {
      soundExtent: [.76, .86],
      handoff: [.76, .86],
      fade: [.86, .90],
      heatFall: [.82, .89],
      // The last contact resolves at .856 — before the chevron isolation response begins.
      soundFronts: [[.760, .820], [.772, .832], [.784, .844], [.796, .856]],
      chevrons: [.76, .86],
      chevronResponseIn: [.856, .872],
      chevronResponseOut: [.874, .894],
      stubOut: [.87, .895],
      stubIgnition: .006,
      contactCollapse: .006,
      contactFlashIn: .001,
      contactFlashOutFrom: .002,
      contactFlashOutTo: .004,
    },
  },
  {
    id: 'resolve', from: .89, to: 1,
    title: 'Resolve', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'The section closes, and the downstream transition takes ownership of the story.',
    poster: 'exterior',
    keys: [
      // 07 Resolve — pull back into the chamber for an exterior close.
      { at: 1, position: [4.26, 1.34, 4.06], target: [0, 1.05, .05], fov: 34 },
    ],
    windows: { cutClose: [.9, .99], flowClosedAbove: .90 },
  },
]

/** Merges every beat's named windows into one lookup. Names are unique across beats. */
export function collectWindows(beats: readonly Beat[]): Required<BeatWindows> {
  return Object.assign({}, ...beats.map(beat => beat.windows)) as Required<BeatWindows>
}

/** The camera keys of all beats in beat order. */
export const collectKeys = (beats: readonly Beat[]): CameraKey[] => beats.flatMap(beat => beat.keys)

export const WINDOWS = collectWindows(BEATS)
