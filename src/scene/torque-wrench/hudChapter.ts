import type { TorquePosterChapterId } from './posterMap'

/** Owner ruling 2026-11-04: chrome follows JourneyDirector's isolated-shaft window.
 * Poster/rail semantics retain the broader Inspection chapter, including its transitions. */
export function torqueHudChapter(chapter: TorquePosterChapterId, studyVisible: boolean): TorquePosterChapterId {
  return chapter === 'inspection' && !studyVisible ? 'mechanism' : chapter
}

export function torqueHudSeekStart(chapter: TorquePosterChapterId, beatStart: number): number {
  return chapter === 'inspection' ? 0.62 : beatStart
}
