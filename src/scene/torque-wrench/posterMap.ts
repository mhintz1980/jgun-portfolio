// Chapter/poster identity for the private torque page. Story sections and poster slots key off
// these ids; the shared poster contract (src/shared/poster.ts) owns the entry shape and checks.
import type { PosterEntry } from '../../shared/poster'

export const TORQUE_POSTER_CHAPTERS = [
  { id: 'drafting', label: 'Drafting' },
  { id: 'breakthrough', label: 'Breakthrough' },
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'close', label: 'Close' },
] as const

export type TorquePosterChapter = (typeof TORQUE_POSTER_CHAPTERS)[number]
export type TorquePosterChapterId = TorquePosterChapter['id']

/**
 * Stage 1 has no poster art: Stage 6 owns the high-quality offline renders and fills this map.
 * It stays empty rather than inventing asset paths or provenance; the poster path renders
 * labeled placeholders until real entries land here.
 */
export const torquePosterMap: readonly PosterEntry[] = []
