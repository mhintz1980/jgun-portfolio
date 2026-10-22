import { defineConfig, devices } from '@playwright/test'

// The Vite dev server refuses 127.0.0.1 (see AGENTS.md), so address it as localhost throughout.
const PORT = 5199

export default defineConfig({
  testDir: 'tests/e2e',
  // Software GL renders the DoF + MSAA composer at a fraction of a frame per second, so the
  // viewport stays small and the budgets generous.
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 640, height: 360 },
    launchOptions: {
      // Headless CI has no GPU: software GL keeps WebGL2 available for the R3F canvas.
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  webServer: {
    command: `npx vite --host localhost --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
