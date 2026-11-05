import manifest from '../../public/home/armament-showcase/manifest.json'

export type ShowcaseImage = { id: number; file: string; label: 'mine' | 'representative'; w: number; h: number }

const BY_FILE = new Map((manifest as ShowcaseImage[]).map((m) => [m.file, m]))

/** The only armament imagery the film may use (owner rule): public/home/armament-showcase/. */
export function showcase(file: string): ShowcaseImage & { src: string } {
  const m = BY_FILE.get(file)
  if (!m) throw new Error(`${file} is not in armament-showcase/manifest.json`)
  return { ...m, src: `home/armament-showcase/${file}` }
}

/** Every armament image the film puts on screen, in order of appearance. */
export const FILM_ARMAMENT = ['ar-20.webp', 'ar-18.webp', 'ar-17.webp', 'ar-23.webp', 'ar-05.webp', 'ar-07.webp', 'ar-06.webp'] as const
