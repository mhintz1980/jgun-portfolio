// Shared Playwright launch contract for the verifiers.
// Windows (the authoring host): installed Chrome, D3D11/ANGLE — unchanged.
// Other platforms (cloud/Linux): Playwright's bundled Chromium with SwiftShader
// software GL. This is NOT a full-tier GPU pass; callers record `describeLaunch()`
// in their reports so software rendering is never mistaken for hardware evidence.
const base = ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

export function launchConfig({ extraArgs = [] } = {}) {
  if (process.platform === 'win32') return { channel: 'chrome', headless: true, args: ['--use-angle=d3d11', ...base, ...extraArgs] }
  const config = { headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...base, ...extraArgs] }
  if (process.env.JGUN_CHROME_PATH) config.executablePath = process.env.JGUN_CHROME_PATH
  return config
}

export const launchBrowser = (chromium, options) => chromium.launch(launchConfig(options))

// Variant for callers whose historical Windows arg list was shorter (capture-jgun-drawing-review).
export const launchBrowserMinimal = (chromium) => {
  const config = launchConfig()
  if (process.platform === 'win32') config.args = ['--use-angle=d3d11', '--disable-background-timer-throttling']
  return chromium.launch(config)
}

export const describeLaunch = () => process.platform === 'win32' ? 'installed Chrome, ANGLE/D3D11 (hardware)' : 'bundled Chromium, ANGLE/SwiftShader (software GL — not a hardware full-tier pass)'
