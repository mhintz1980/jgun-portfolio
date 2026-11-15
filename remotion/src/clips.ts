import manifest from '../clips/armament/manifest.json'

// Armament spin clips wired into the film. Data only (no webpack calls): the root vitest imports
// this from rules.test.ts. Frames are loaded by clipFrames.ts, which only ui/ClipSpin.tsx imports.

export type FilmClip = {
  id: string
  /** Key into manifest.models; decides the label. */
  model: keyof typeof manifest.models
  frames: number
  degPerFrame: number
}

export const FILM_CLIPS = {
  carbine: { id: 'ar15-pattern-carbine-a', model: 'ar15-pattern-carbine-a', frames: 180, degPerFrame: 2 },
} as const satisfies Record<string, FilmClip>

export function clipLabelRequired(clip: FilmClip): boolean {
  return manifest.models[clip.model].label_required
}
