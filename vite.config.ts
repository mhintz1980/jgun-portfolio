import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Keep working scratch (replica harnesses under .scratch/) out of the repo test gate.
    exclude: [...configDefaults.exclude, '**/.scratch/**'],
  },
})
