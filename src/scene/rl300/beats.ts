/** RL300 "The Quiet Machine" beat records. Plain data: no `three`, no imports. One record per
 *  beat carries its length, copy, camera keys, poster and the named windows it owns.
 *
 *  Authoring is beat-local. A beat has a `len` in ticks; its keys and windows are ticks from the
 *  beat's own start (a window may run past `len`: the cut and the stubs do). `resolveBeats`
 *  turns that into absolute `u` as `(start + tick) / total`, so inserting, removing or resizing a
 *  beat touches only that beat's data and every other beat keeps its own windows. At the
 *  authored total of 1000 ticks one tick is exactly the old `.001` of `u`, and an integer over
 *  1000 is the nearest double to the old literal, so the resolved values match the authored
 *  sequence bit for bit. */
export type Vec3 = [number, number, number]
/** A progress window `[from, to]`: ticks in a `BeatSpec`, absolute RL300-local `u` once resolved. */
export type Win = readonly [number, number]

export interface CameraKey { at: number; position: Vec3; target: Vec3; fov: number }

export type PosterId = 'exterior' | 'section' | 'intake'

/** Every named window the sequence uses. A window lives on the beat where it starts; each name
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
  /** Spans past a front window's end (lengths, not positions). */
  stubIgnition?: number
  contactCollapse?: number
  contactFlashIn?: number
  contactFlashOutFrom?: number
  contactFlashOutTo?: number
}

/** One beat as authored: `len` and every `keys[].at` and window value are ticks from this beat's start. */
export interface BeatSpec {
  id: string
  len: number
  title: string
  note: string
  caption: string
  poster: PosterId
  /** Camera keys this beat owns, in order. The flattened list drives `evaluateShot`'s pairwise interpolation. */
  keys: CameraKey[]
  windows: BeatWindows
}

/** A resolved beat: absolute progress `u`, the shape every consumer reads. */
export interface Beat extends Omit<BeatSpec, 'len'> {
  from: number
  to: number
}

export const BEAT_SPECS: readonly BeatSpec[] = [
  {
    id: 'object', len: 120,
    title: 'The object', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'A blue shell. A complex machine. One considered envelope.',
    poster: 'exterior',
    keys: [
      // 01 The object — low, long-lens three-quarter; the approach reveals the chamber's depth.
      { at: 0, position: [4.3, .92, 4.55], target: [0, 1, .05], fov: 30 },
      { at: 120, position: [3.62, 1.06, 3.78], target: [0, 1.02, .05], fov: 30 },
    ],
    windows: {},
  },
  {
    id: 'incision', len: 150,
    title: 'The incision', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'A finished section edge reveals shell, insulation, equipment and the wall that carries them.',
    poster: 'section',
    keys: [
      // 02 The incision — rise toward the section-facing side, equipment and wall together.
      { at: 150, position: [3.28, 1.78, 2.34], target: [0, 1.18, .1], fov: 34 },
    ],
    windows: { cutOpen: [10, 180], flowClosedBelow: 140 },
  },
  {
    id: 'main-intake', len: 140,
    title: 'The main intake', note: 'RL300-SAFE · SUPPLY AIR',
    caption: 'The existing supply: one continuous path from louvre to plenum, with a direction you can read.',
    poster: 'section',
    keys: [
      // 03 The main intake — track the existing intake/plenum side (DUCT_INTAKE, z .43…1.36).
      { at: 140, position: [3.95, 1.75, 3.15], target: [0, 1.25, .95], fov: 32 },
    ],
    windows: { mainExtent: [0, 130] },
  },
  {
    id: 'second-breath', len: 200,
    title: 'A second breath', note: 'LOWER INTAKE · DESIGN CONCEPT',
    caption: 'Proposed lower intake: open louvres feed a shallow duct and an outlet beneath the engine.',
    poster: 'intake',
    keys: [
      // 04 A second breath — drop below the louver panel (y .172, z .48….78) and look up into the
      // sectioned skid bay: slats, collector, duct and the lower supply read together (owner, 2026-09-24).
      { at: 100, position: [1.05, -.13, 1.05], target: [-.2, .2, .6], fov: 38 },
      // …then arc back toward the engine.
      { at: 200, position: [4.05, .95, .45], target: [0, 1, .1], fov: 34 },
    ],
    windows: {
      undersideIn: [20, 100], undersideOut: [100, 210],
      lowerExtent: [0, 190],
      mainDim: [0, 60], mainRestore: [170, 230],
      heatRise: [140, 250],
    },
  },
  {
    id: 'two-feeds', len: 150,
    title: 'Two feeds, one exit', note: 'RL300-SAFE · AIR PATH',
    caption: 'Both supplies warm through the equipment region and join a single shared discharge.',
    poster: 'section',
    keys: [
      // 05 Two feeds, one exit — wider, carrying both supplies to the shared discharge (DUCT_EXHAUST, z −1.68…−.30).
      { at: 150, position: [4.75, 1.55, -1.15], target: [0, 1.15, -.3], fov: 38 },
    ],
    windows: { mergedExtent: [0, 70] },
  },
  {
    id: 'control-noise', len: 130,
    title: 'Control the noise', note: 'RL300-SAFE · ACOUSTIC STRUCTURE',
    caption: 'Two distinct mechanisms: absorptive structure for the air path, isolation for the machine.',
    poster: 'section',
    keys: [
      // 06 Control the noise — the exposed acoustic structure (ACOUSTIC_BAFFLES, y 1.32…1.86) over the mounts.
      { at: 130, position: [3.45, 2.35, 2.45], target: [.05, 1.45, .85], fov: 31 },
    ],
    windows: {
      soundExtent: [0, 100],
      handoff: [0, 100],
      fade: [100, 140],
      heatFall: [60, 130],
      // The last contact resolves at tick 96, before the chevron isolation response begins.
      soundFronts: [[0, 60], [12, 72], [24, 84], [36, 96]],
      chevrons: [0, 100],
      chevronResponseIn: [96, 112],
      chevronResponseOut: [114, 134],
      stubOut: [110, 135],
      stubIgnition: 6,
      contactCollapse: 6,
      contactFlashIn: 1,
      contactFlashOutFrom: 2,
      contactFlashOutTo: 4,
    },
  },
  {
    id: 'resolve', len: 110,
    title: 'Resolve', note: 'RL300-SAFE · ACOUSTIC ENCLOSURE',
    caption: 'The section closes, and the downstream transition takes ownership of the story.',
    poster: 'exterior',
    keys: [
      // 07 Resolve — pull back into the chamber for an exterior close.
      { at: 110, position: [4.26, 1.34, 4.06], target: [0, 1.05, .05], fov: 34 },
    ],
    windows: { cutClose: [10, 100], flowClosedAbove: 10 },
  },
]

/** Window fields that are spans past a front's end, not positions inside the beat. */
const SPAN_FIELDS: ReadonlySet<string> = new Set(['stubIgnition', 'contactCollapse', 'contactFlashIn', 'contactFlashOutFrom', 'contactFlashOutTo'])

/** Lays beats end to end and resolves every beat-local tick to absolute `u`. */
export function resolveBeats(specs: readonly BeatSpec[]): Beat[] {
  const total = specs.reduce((sum, spec) => sum + spec.len, 0)
  let start = 0
  return specs.map(({ len, keys, windows, ...rest }) => {
    const base = start
    start += len
    const at = (tick: number) => (base + tick) / total
    const win = (w: Win): Win => [at(w[0]), at(w[1])]
    const resolved: Record<string, number | Win | Win[]> = {}
    for (const [name, value] of Object.entries(windows) as [string, number | Win | readonly Win[]][]) {
      resolved[name] = typeof value === 'number'
        ? (SPAN_FIELDS.has(name) ? value / total : at(value))
        : Array.isArray(value[0]) ? (value as readonly Win[]).map(win) : win(value as Win)
    }
    return {
      ...rest,
      from: at(0), to: at(len),
      keys: keys.map(key => ({ ...key, at: at(key.at) })),
      windows: resolved as BeatWindows,
    }
  })
}

export const BEATS: readonly Beat[] = resolveBeats(BEAT_SPECS)

/** Merges every beat's named windows into one lookup. Names are unique across beats. */
export function collectWindows(beats: readonly Beat[]): Required<BeatWindows> {
  return Object.assign({}, ...beats.map(beat => beat.windows)) as Required<BeatWindows>
}

/** The camera keys of all beats in beat order. */
export const collectKeys = (beats: readonly Beat[]): CameraKey[] => beats.flatMap(beat => beat.keys)

export const WINDOWS = collectWindows(BEATS)
