import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { PAGES } from './src/shared/pages'

// One HTML entry per registered page that has one (src/shared/pages.ts). Vite writes each to
// dist/<its path relative to root>, so the key is only a label.
const input = Object.fromEntries(
  PAGES.filter((page) => page.htmlEntry).map((page) => [page.id, fileURLToPath(new URL(page.htmlEntry!, import.meta.url))]),
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Multi-page: HTML middlewares without the SPA fallback, so /quiet-machine/ is its own document.
  appType: 'mpa',
  build: {
    rollupOptions: { input },
  },
  test: {
    // Keep working scratch (replica harnesses under .scratch/) out of the repo test gate.
    exclude: [...configDefaults.exclude, '**/.scratch/**'],
  },
})
