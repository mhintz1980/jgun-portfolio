// Launch exclusion: public/ files that stay in git but must never ship in dist/.
// Vite copies public/ verbatim, so this plugin deletes the listed copies after the bundle is
// written and fails the build if any survive. scripts/verify-launch-dist.mjs re-checks dist/.
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

/** Paths relative to public/ (and so to dist/). M249 is held back for the initial launch. */
export const EXCLUDED_PUBLIC_ASSETS: readonly string[] = ['models/m249-transformed.glb']

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
