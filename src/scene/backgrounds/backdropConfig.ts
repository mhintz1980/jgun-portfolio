import { STAGE_TRANSITIONS } from '../stages/stageWindows'

/** JG-023 master switch. Documented revert value: false (plan §Revert). */
export const SCRUBBED_BACKGROUNDS = true

/** Per-chapter gate, chapter-indexed. Owner ruling 2026-08-31: CH.01 accepted,
 * CH.02 + CH.04 armed. CH.03 (index 2) stays FALSE until the JG-021 Station-2
 * materials ruling closes — arming it there would confound that ruling. Flip
 * index 2 to true once JG-021 is checked. Revert value: [true, false, false, false]. */
export const BACKDROP_CHAPTER_FLAGS: readonly boolean[] = [true, true, false, true]

export interface BackdropPaletteSet {
  top: string; bottom: string; accent: string; accentAlpha: number
}

/** sRGB hex, authored dark under the bloom constraint (combined authored peak
 * linear luminance < 0.45 vs the 0.6 bloom threshold). Chapter-indexed. */
export const BACKDROP_PALETTES: readonly BackdropPaletteSet[] = [
  { top: '#0b0d12', bottom: '#1a1108', accent: '#ffb454', accentAlpha: 0.10 }, // CH.01 warm key pool
  { top: '#060a10', bottom: '#0a141d', accent: '#38e8ff', accentAlpha: 0.08 }, // CH.02 cyan blueprint wash
  { top: '#04100f', bottom: '#0a1a18', accent: '#2dd4bf', accentAlpha: 0.07 }, // CH.03 deep teal hush
  { top: '#05060c', bottom: '#100b16', accent: '#8b7cf6', accentAlpha: 0.06 }, // CH.04 point-dust nebula
]

/**
 * Chapter palette blend windows on the global scroll timeline, in chapter
 * order: BackdropRig lerps BACKDROP_PALETTES[i] → BACKDROP_PALETTES[i+1]
 * across window i and drives the visibility envelope with the same ts.
 *
 * Window 1 mirrors the CH.01→CH.02 gap in CHAPTER_RANGES
 * (src/components/Chapters.tsx:11-16) — keep in sync with that table.
 * Windows 2–3 reuse the stage cross-fades so the palette blend rides the
 * station swap (StudioRig pattern); they are imported from stageWindows —
 * never re-type those numbers.
 */
export const CHAPTER_BLEND_12: readonly [number, number] = [0.22, 0.24]
export const CHAPTER_BLEND_23 = STAGE_TRANSITIONS.wrenchOut
export const CHAPTER_BLEND_34 = STAGE_TRANSITIONS.enclosureOut
