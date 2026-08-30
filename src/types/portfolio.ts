/**
 * Module 4 — data contracts for the case studies, HUD vocabulary, and the
 * role-map.json anchor source produced by the GLB optimization pipeline.
 */

export type MaterialMode = 'solid' | 'blueprint' | 'exploded'

export type ChapterIndex = 0 | 1 | 2 | 3

export type DatumLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface ChapterDef {
  index: ChapterIndex
  /** HUD chapter label, e.g. `CH.01 ASSEMBLY`. */
  label: string
  title: string
  subtitle: string
  /** Tolerance callouts the HUD cycles while this chapter is active. */
  callouts: string[]
  /** Active datum reference shown in the HUD, e.g. `DATUM: A`. */
  datum: DatumLabel
}

export type CaseStudyId = 'gearbox' | 'm249' | 'safe-enclosure'

export interface CaseStudy {
  id: CaseStudyId
  /** Scroll chapter this study is presented in. */
  chapter: ChapterIndex
  headline: string
  oneLiner: string
  bullets: string[]
  tags: string[]
}

export type HotspotKind = 'inspect' | 'datum'

export interface FeatureControlFrame {
  /**
   * Leading characteristic cell — a Y14.5 symbol KEY ('RUNOUT', 'POSITION', 'FLATNESS', 'PROFILE', 'PARALLELISM') rendered as its canonical glyph (GdtSymbols.tsx), or a non-Y14.5 spec word that renders as text.
   * Literal glyph transcription requires the exact frame verified in the
   * source drawing at readable scale (gdt-annotation-style.md) — use the
   * owner-approved HUD callout vocabulary otherwise.
   */
  characteristic?: string
  /** Cell contents in print order — approved vocabulary only. */
  cells: string[]
  /** Optional drawing-verified datum sequence. */
  datums?: DatumLabel[]
}

export interface HotspotAnnotation {
  datum?: DatumLabel
  frame?: FeatureControlFrame
  processNote?: string
}

export interface HotspotDef {
  id: string
  /**
   * Exact `occurrence` name in role-map.json — the authoritative name/anchor
   * source (316 part occurrences with world-space bbox centers). Never a
   * guessed mesh name: mesh names in the GLB are generic `meshN_mesh`.
   */
  occurrence: string
  /**
   * When the occurrence name matches multiple role-map rows (FLANGE-1 exists
   * at both the motor-to-gearbox mount face AND the rear cap), pick the row
   * whose bbox center is nearest this measured model-frame point. Without it
   * the resolver falls back to the last matching row — a silent anchor jump.
   */
  pickNear?: [number, number, number]
  kind: HotspotKind
  label: string
  detail: string
  annotation?: HotspotAnnotation
  /** Chapters in which this hotspot is rendered. */
  chapters: ChapterIndex[]
  /**
   * Optional global-scroll-progress visibility window [start, end]. When set,
   * the hotspot is visible only inside this window REGARDLESS of chapter —
   * used to align a hotspot with a camera beat that does not line up with
   * the DOM chapter triggers (e.g. the rear-LCD orbit dwell runs while the
   * chapter trigger already reports chapter 2).
   */
  window?: readonly [number, number]
}

/** One entry of public/models/role-map.json. */
export interface RoleMapEntry {
  assembly: string
  occurrence: string
  tris: number
  bboxCenter: [number, number, number]
  bboxSize: [number, number, number]
}

/** A keyframe of the camera trajectory state machine (Module 1). */
export interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}
