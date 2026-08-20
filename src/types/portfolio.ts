/**
 * Module 4 — data contracts for the case studies, HUD vocabulary, and the
 * role-map.json anchor source produced by the GLB optimization pipeline.
 */

export type MaterialMode = 'solid' | 'blueprint' | 'exploded'

export type ChapterIndex = 0 | 1 | 2 | 3

export type DatumLabel = 'A' | 'B' | 'C'

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

export interface HotspotDef {
  id: string
  /**
   * Exact `occurrence` name in role-map.json — the authoritative name/anchor
   * source (316 part occurrences with world-space bbox centers). Never a
   * guessed mesh name: mesh names in the GLB are generic `meshN_mesh`.
   */
  occurrence: string
  kind: HotspotKind
  label: string
  detail: string
  /** Chapters in which this hotspot is rendered. */
  chapters: ChapterIndex[]
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
