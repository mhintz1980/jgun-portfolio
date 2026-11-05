import { continueRender, delayRender, staticFile } from 'remotion'

// Site tokens (src/home/layout.css): paper + ink for the drawing world, the dark theme's navy
// for the 3D studio, and Revision Orange for the thread that runs through the whole film.
export const C = {
  paper: '#f4f1ea',
  paperSurface: '#fbf9f4',
  ink: '#14181d',
  inkMuted: '#4a5260',
  rule: 'rgba(20, 24, 29, 0.16)',
  grid: 'rgba(29, 78, 137, 0.07)',
  ghostInk: '#1d4e89',
  orange: '#c2410c',
  navy: '#0b1622',
  navyDeep: '#070f18',
  cream: '#e8e4da',
  creamMuted: '#a9b4c2',
  orangeLit: '#f0703a',
  gridDark: 'rgba(207, 224, 242, 0.05)',
} as const

export const F = {
  hero: '"Michroma", "Archivo", sans-serif',
  display: '"Archivo", sans-serif',
  body: '"Space Grotesk", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const

// The site's self-hosted fonts (public/fonts/home, SIL OFL — see src/home/FONTS.md).
const FONT_FILES: [string, string, string][] = [
  ['Michroma', 'fonts/home/Michroma.woff2', '400'],
  ['Archivo', 'fonts/home/Archivo.woff2', '100 900'],
  ['Space Grotesk', 'fonts/home/SpaceGrotesk.woff2', '300 700'],
  ['JetBrains Mono', 'fonts/home/JetBrainsMono.woff2', '100 800'],
]

let fontsRequested = false
export function loadFonts() {
  if (fontsRequested || typeof document === 'undefined') return
  fontsRequested = true
  const handle = delayRender('Loading site fonts')
  Promise.all(
    FONT_FILES.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight })
      await face.load()
      document.fonts.add(face)
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err)
      continueRender(handle)
    })
}
