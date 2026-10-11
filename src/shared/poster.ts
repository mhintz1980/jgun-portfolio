// Poster interface: the shared types and checks for authored, offline-rendered poster stills.
// A page keeps its own map (beat or chapter id to entry) and its own story; the shell owns the shape
// of an entry, the narrow-viewport convention and the validation. Rendering is PosterImage.tsx.
// It carries no scroll length and never reads page progress.
import { isCadUrl } from './posterGuard'

/** The viewport at which a poster switches to its narrow crop (matches StaticShaftStory). */
export const POSTER_NARROW_MEDIA = '(max-width: 600px)'

/** `temporary` art may ship; only `final` art carries provenance and can pass poster acceptance. */
export type PosterStatus = 'temporary' | 'final'

export interface PosterFile {
  /** Root-relative path to a raster in /public. */
  src: string
  width: number
  height: number
}

/** The offline-render record the torque plan asks for: scene, settings, asset versions. */
export interface PosterProvenance {
  origin: 'offline-render'
  sourceScene: string
  settings: string
  assetVersions: Readonly<Record<string, string>>
}

export interface PosterEntry {
  /** The beat or chapter id this still stands for. */
  id: string
  alt: string
  desktop: PosterFile
  narrow?: PosterFile
  status: PosterStatus
  provenance: PosterProvenance | null
}

const RASTER = /\.(?:png|jpe?g|webp|avif)$/i

const isDimension = (value: number) => Number.isInteger(value) && value > 0

function fileProblems(label: string, file: PosterFile | undefined): string[] {
  if (!file) return [`${label}: missing`]
  const problems: string[] = []
  if (!file.src.startsWith('/')) problems.push(`${label}: src must be root-relative`)
  if (!RASTER.test(file.src)) problems.push(`${label}: src must be a raster image`)
  if (isCadUrl(file.src)) problems.push(`${label}: src is a CAD asset`)
  if (!isDimension(file.width) || !isDimension(file.height)) problems.push(`${label}: width and height must be positive integers`)
  return problems
}

/**
 * Problems with a poster map, as readable lines. An empty list is a valid map. `expectedIds` are the
 * beat or chapter ids the page needs a still for, so a missing one is a problem, not a blank frame.
 */
export function validatePosterMap(map: readonly PosterEntry[], expectedIds: readonly string[] = []): string[] {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const entry of map) {
    const at = `poster "${entry.id}"`
    if (entry.id.trim() === '') problems.push('poster with an empty id')
    if (seen.has(entry.id)) problems.push(`${at}: duplicate id`)
    seen.add(entry.id)
    if (entry.alt.trim() === '') problems.push(`${at}: alt text is empty`)
    for (const line of fileProblems('desktop', entry.desktop)) problems.push(`${at}: ${line}`)
    if (entry.narrow) for (const line of fileProblems('narrow', entry.narrow)) problems.push(`${at}: ${line}`)
    if (entry.status === 'final') {
      const record = entry.provenance
      if (!record) problems.push(`${at}: final art needs provenance`)
      else {
        if (record.origin !== 'offline-render') problems.push(`${at}: provenance origin must be offline-render`)
        if (record.sourceScene.trim() === '') problems.push(`${at}: provenance sourceScene is empty`)
        if (record.settings.trim() === '') problems.push(`${at}: provenance settings is empty`)
        if (Object.keys(record.assetVersions).length === 0) problems.push(`${at}: provenance assetVersions is empty`)
      }
    }
  }
  for (const id of expectedIds) if (!seen.has(id)) problems.push(`no poster for "${id}"`)
  return problems
}

/** The entry for an id, or null. Never throws. */
export function posterFor(map: readonly PosterEntry[], id: string): PosterEntry | null {
  return map.find((entry) => entry.id === id) ?? null
}
