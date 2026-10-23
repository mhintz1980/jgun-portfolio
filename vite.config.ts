import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { PAGES } from './src/shared/pages'
import { excludePublicAssets } from './build/excludePublicAssets'

// One HTML entry per registered page that has one (src/shared/pages.ts). Vite writes each to
// dist/<its path relative to root>, so the key is only a label.
const input = Object.fromEntries(
  PAGES.filter((page) => page.htmlEntry).map((page) => [page.id, fileURLToPath(new URL(page.htmlEntry!, import.meta.url))]),
)

// three's DRACOLoader has `new URL('../libs/draco/...', import.meta.url)` defaults, so Vite emits
// hashed copies of the decoders (~1.3 MB). Every loader here calls setDecoderPath('/draco/'), which
// serves the vendored public/draco/ files, so the hashed copies are never fetched. Drop them.
function dropBundledDracoDecoders(): Plugin {
  return {
    name: 'drop-bundled-draco-decoders',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const item = bundle[fileName]
        if (item.type === 'asset' && /(^|\/)draco_(decoder|wasm_wrapper)-[\w-]+\.(js|wasm)$/.test(fileName)) delete bundle[fileName]
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dropBundledDracoDecoders(), excludePublicAssets()],
  // Multi-page: HTML middlewares without the SPA fallback, so /quiet-machine/ is its own document.
  appType: 'mpa',
  build: {
    rollupOptions: { input },
  },
  test: {
    // Playwright specs under tests/e2e run through `npx playwright test`, not vitest.
    // Keep working scratch (replica harnesses under .scratch/) out of the repo test gate.
    exclude: [...configDefaults.exclude, '**/.scratch/**', '**/output/**', 'tests/e2e/**'],
  },
})
