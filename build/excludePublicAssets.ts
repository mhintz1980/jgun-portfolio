// Launch exclusion: public/ files that stay in git but must never ship in dist/.
// Vite copies public/ verbatim, so this plugin deletes the listed copies after the bundle is
// written and fails the build if any survive. verify-launch-dist.mjs independently checks M249;
// the exact local-only exclusions and source preservation are covered by the plugin test.
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

/** Exact build-copy exclusions. Preserve source media and concurrent showreel/logo assets. */
export const EXCLUDED_PUBLIC_ASSETS: readonly string[] = [
  'models/m249-transformed.glb',
  'fonts/gentilis_bold.typeface.json',
  'video/studiomark-showcase-precision-revealed-poster.jpg',
  'video/studiomark-showcase-precision-revealed.mp4',
  'video/studiomark-showcase-precision-revealed.webm',
]

export function excludePublicAssets(paths: readonly string[] = EXCLUDED_PUBLIC_ASSETS): Plugin {
  let config: ResolvedConfig
  return {
    name: 'jg:exclude-public-assets',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir)
      for (const relative of paths) {
        const file = path.join(outDir, relative)
        rmSync(file, { force: true })
        if (existsSync(file)) throw new Error(`[jg:exclude-public-assets] ${relative} is still in ${outDir}`)
      }
    },
  }
}
