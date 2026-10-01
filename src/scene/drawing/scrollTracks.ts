/**
 * JG-026 scroll-track derivation — the document geometry behind `Chapters.tsx`.
 *
 * Two axes are in play (see `./introTimeline`): RAW document scroll, where the empty sections in
 * `Chapters.tsx` decide how much distance an element travels, and PACED progress, where every
 * downstream window is authored (`CHAPTER_RANGES`, `PATH_SEGMENTS`, `STAGE_TRANSITIONS`,
 * `LCD_REVEAL_WINDOW`, the hero timeline's retained beats). `pacedProgress()` stretches the
 * intro's 0–0.120 of progress over `INTRO_SCROLL_SHARE` of the document, which couples them:
 * move the share and the DOM transits slide under the fixed paced windows. The historical
 * literals were measured for a 0.30 share (JG-026, 2026-09-05) and never re-derived when the
 * share moved to 0.40 and 0.50, so `[data-chapter="1"]` — the element the hero ScrollTrigger
 * measures — began its transit at paced 0.082887 and closed at 0.241801 instead of the
 * 0.177029 / 0.458429 the retained CH.02 timeline was authored against. The intro also released
 * at raw 0.50, 69% into that transit, so the first frame after the drawing handed off carried a
 * partially scrubbed mechanism (explode ≈ .47 — animation-spec §4.1).
 *
 * Derivation. Let σ be `INTRO_SCROLL_SHARE`, `V = 100vh` the viewport, `D = 3020vh` the scroll
 * distance, `R = 0.120` the intro release, `f = (1 - σ) / (1 - 0.30)` the compression of the
 * post-intro band, and `y` a document offset in vh. Past the handoff band the map is linear:
 *
 *     paced(y) = R + ((1 - R) / (1 - σ)) · (y / D - σ)
 *
 * so a PACED anchor keeps its value when it moves to `D·σ + f · (y - 906)` — the historical intro
 * boundary is `D · 0.30 = 906vh`, and raw distances in the post-intro band contract by exactly
 * `f`. Place every track boundary with that map. The anchors that matter are viewport-relative
 * (`top bottom` reads `y - V`, `bottom top` reads `y + H`), which is why chapters 0 and 1 carry a
 * `-V` / `+V` correction that cancels from chapter 2 onward:
 *
 *     intro    = D · σ                    the share lands on the boundary by construction
 *     chapter0 = V + (H₀ - V) · f          absorbs V so ch.1's `top bottom` edge maps
 *     chapter1 = (H₁ + V) · f - V          gives V back so its `bottom top` edge maps
 *     chapter2 = H₂ · f, chapter3 = H₃ · f plain contraction, the V pair already balanced
 *     footer   = V + (H_f - V) · f         the remainder of the fixed-height document
 *
 * with `H₀ = 237, H₁ = 576, H₂ = 541, H₃ = 811, H_f = 49` the historical heights. The V terms sum
 * to zero, so the document height is `V + D·σ + f · (D - 906) = V + D = 3120vh` at every share.
 * The split is not preserved: a higher share moves raw distance OUT of the post-intro band, which
 * keeps only `f` of what it had at 0.30 (1510vh against 2114vh at σ = 0.50, behind a 1510vh
 * intro). Downstream sections therefore travel less raw scroll; what they keep is their PACED
 * anchor, the axis every downstream constant is authored on.
 *
 * What moves: the whole `V · (1 - f)` correction (28.571vh at σ = 0.50, ≈0.0166 of paced
 * progress) is spent pinning CH.02's start edge, so chapter 0's `top bottom` edge and its
 * closing boundary, CH.02's `top`, and chapters 2–3's `top bottom` edges shift by that same
 * amount — start edges earlier, DOM boundaries later. Nothing downstream hangs on the shifted
 * set: chapter 0's edge is still inside the intro band (paced 0.112053 < releaseEnd 0.120, so
 * the CH.01 section opens before the drawing releases and its card stays behind the
 * `afterIntro` gate), and the chapter index ScrollRig derives from those sections keeps every
 * switch point within 0.01 of the paced value it had at the 0.30 share.
 *
 * Contract (`scrollTracks.test.ts`): document 3120vh / distance 3020vh at any share; the intro
 * boundary exactly on `INTRO_SCROLL_SHARE`; the hero transit on paced 0.177029 → 0.458429; and
 * that transit opening after the intro release, so the first post-handoff frame carries no
 * partially advanced mechanism. Each chapter's `bottom top` edge from CH.02 onward is likewise
 * the affine image of its historical boundary. The hero's start edge sits at raw 0.532403, past
 * the handoff band's right edge (σ + 0.025 = 0.525) — widen that band past ≈0.032 raw and the
 * pinned numbers stop being exact, which is the failure this module exists to make loud.
 */
import { clamp01, INTRO_SCROLL_SHARE, pacedProgress } from './introTimeline'

/** Track heights, in vh, for the stacked pacing blocks rendered by `Chapters.tsx`. */
export interface ScrollTracksVh {
  /** The intro track (`[data-intro="b1b2"]`); it deliberately carries no `data-chapter`. */
  readonly intro: number
  /** The four `[data-chapter]` sections, indexed by chapter. */
  readonly chapters: readonly number[]
  /** The trailing footer block. */
  readonly footer: number
}

/** One viewport, in vh. Both ScrollTrigger viewport edges below are read against it. */
export const VIEWPORT_VH = 100

/**
 * Document height the JG-026 pacing ruling fixed: 3020vh of scroll distance plus one viewport.
 * Re-deriving the tracks only ever redistributes that distance between the intro and the
 * post-intro band; the total must never change.
 */
export const DOCUMENT_HEIGHT_VH = 3120

/** Scroll distance (`scrollHeight - innerHeight`) in vh — invariant under the share. */
export const SCROLL_DISTANCE_VH = DOCUMENT_HEIGHT_VH - VIEWPORT_VH

/** The share `HISTORICAL_TRACK_VH` was measured at (JG-026, 2026-09-05). */
export const HISTORICAL_INTRO_SCROLL_SHARE = 0.3

/**
 * The original 0.30-share heights. They are this module's derivation anchors, not live geometry:
 * `deriveScrollTracks(HISTORICAL_INTRO_SCROLL_SHARE)` reproduces them exactly.
 */
export const HISTORICAL_TRACK_VH: ScrollTracksVh = {
  intro: SCROLL_DISTANCE_VH * HISTORICAL_INTRO_SCROLL_SHARE, // 906
  chapters: [237, 576, 541, 811],
  footer: 49,
}

/**
 * The chapter section the hero timeline measures — `trigger: '[data-chapter="1"]'` with
 * `start: 'top bottom'` / `end: 'bottom top'` in `TorqueWrenchHero.tsx`. Its two viewport edges
 * are what chapters 0 and 1 trade the `VIEWPORT_VH` correction for.
 */
export const HERO_CHAPTER_INDEX = 1

/** Height ratio that keeps the post-intro band's paced slope: `(1 - σ) / (1 - 0.30)`. */
export function trackScaleFactor(share: number = INTRO_SCROLL_SHARE): number {
  return (1 - share) / (1 - HISTORICAL_INTRO_SCROLL_SHARE)
}

/** Re-derive the track ladder for `share` — the derivation is in this module's header. */
export function deriveScrollTracks(share: number = INTRO_SCROLL_SHARE): ScrollTracksVh {
  const factor = trackScaleFactor(share)
  const [ch0, ch1, ...laterChapters] = HISTORICAL_TRACK_VH.chapters
  const intro = SCROLL_DISTANCE_VH * share
  const chapters = [
    // Chapter 0 absorbs one viewport so chapter 1's `top bottom` edge maps exactly…
    VIEWPORT_VH + (ch0 - VIEWPORT_VH) * factor,
    // …and chapter 1 gives it back so its `bottom top` edge maps too.
    (ch1 + VIEWPORT_VH) * factor - VIEWPORT_VH,
    ...laterChapters.map((height) => height * factor),
  ]
  const footer = VIEWPORT_VH + (HISTORICAL_TRACK_VH.footer - VIEWPORT_VH) * factor
  return { intro, chapters, footer }
}

/** Live track ladder, derived from the current `INTRO_SCROLL_SHARE`. */
export const SCROLL_TRACK_VH: ScrollTracksVh = deriveScrollTracks()

/** Sum of the stack's heights in vh — the document height the browser lays out. */
export function documentHeightVh(tracks: ScrollTracksVh = SCROLL_TRACK_VH): number {
  return tracks.intro + tracks.chapters.reduce((sum, height) => sum + height, 0) + tracks.footer
}

/** `scrollHeight - innerHeight` for a track set, in vh. */
export function scrollDistanceVh(tracks: ScrollTracksVh = SCROLL_TRACK_VH): number {
  return documentHeightVh(tracks) - VIEWPORT_VH
}

/**
 * Cumulative document offsets of the stack's boundaries, in vh, in DOM order:
 * `[intro top, chapter 0 top … chapter 3 top, footer top, document end]`.
 */
export function trackOffsetsVh(tracks: ScrollTracksVh = SCROLL_TRACK_VH): number[] {
  const offsets = [0]
  for (const height of [tracks.intro, ...tracks.chapters, tracks.footer]) {
    offsets.push(offsets[offsets.length - 1] + height)
  }
  return offsets
}

/**
 * Raw scroll offsets (vh) at which `[data-chapter="<chapterIndex>"]` crosses the viewport:
 * `top bottom` fires at `y = top - viewport`, `bottom top` at `y = top + height`.
 */
export function chapterTransitVh(
  chapterIndex: number,
  tracks: ScrollTracksVh = SCROLL_TRACK_VH,
): { startVh: number; endVh: number } {
  const height = tracks.chapters[chapterIndex]
  if (height === undefined) throw new RangeError(`no chapter section at index ${chapterIndex}`)
  const top = trackOffsetsVh(tracks)[chapterIndex + 1]
  return { startVh: top - VIEWPORT_VH, endVh: top + height }
}

/** Raw document scroll fraction (`scrollY / maxScroll`) for a vh offset. */
export function rawScrollFraction(
  offsetVh: number,
  tracks: ScrollTracksVh = SCROLL_TRACK_VH,
): number {
  return clamp01(offsetVh / scrollDistanceVh(tracks))
}

/** Paced window a chapter section's DOM transit scrubs across. */
export function chapterTransitPaced(
  chapterIndex: number,
  tracks: ScrollTracksVh = SCROLL_TRACK_VH,
): { start: number; end: number } {
  const { startVh, endVh } = chapterTransitVh(chapterIndex, tracks)
  return {
    start: pacedProgress(rawScrollFraction(startVh, tracks)),
    end: pacedProgress(rawScrollFraction(endVh, tracks)),
  }
}

