// One fresh GPU page per checkpoint: a lost context must never masquerade as a still.
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, ...value] = arg.replace(/^--/, '').split('=')
  return [key, value.join('=')]
}))
const url = args.url || 'http://localhost:5211'
const points = (args.points || '0.048,0.06,0.063,0.066,0.069,0.072,0.078,0.084,0.096,0.108,0.12').split(',').map(Number)
const width = Number(args.width || 1600)
const height = Number(args.height || 900)
if (points.some((p) => !Number.isFinite(p) || p < 0 || p > 1) || !Number.isFinite(width + height) || width <= 0 || height <= 0) {
  throw new Error('Expected finite progress in [0,1] and positive viewport dimensions')
}
const out = args.out || `project/work/evidence/JG-035-opening-drafting-table/camera-pressure-${new Date().toISOString().replaceAll(':', '-')}`
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11', '--enable-gpu'] })
const results = []

async function capture(progress) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  let contextLost = false
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
    if (/context lost/i.test(message.text())) contextLost = true
  })
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 90000 })
    await page.evaluate((p) => window.__drawingProof.setProgress(p), progress)
    await page.waitForFunction((p) => {
      const t = window.__telemetry
      const c = t?.camera
      const g = c?.goal
      return !!document.querySelector('canvas') && Math.abs((t?.drawing?.phase ?? -1) - Math.min(p / 0.12, 1)) < 1e-5 &&
        g && Math.hypot(c.x - g.position[0], c.y - g.position[1], c.z - g.position[2]) < 1e-5 && Math.abs(c.fov - g.fov) < 1e-4
    }, progress, { timeout: 20000 })
    const reading = await page.evaluate(() => {
      const api = window.__drawingProof
      const t = window.__telemetry
      const c = window.__threeCamera
      const reg = api.captureRegistration()
      return {
        canvas: !!document.querySelector('canvas'), phase: t.drawing.phase,
        camera: t.camera, drawing: t.drawing, performance: t.performance,
        stats: api.sheetStats(), maxRegistrationPx: Math.max(...reg.projectedFeatures.map((f) => f.errorPixels)),
        pulseRegistration: api.capturePulseRegistration(),
        projection: c.projectionMatrix.toArray(),
      }
    })
    if (contextLost || !reading.canvas) throw new Error('WebGL context lost before capture')
    const file = `p${progress.toFixed(4)}-${width}x${height}.png`
    await page.screenshot({ path: path.join(out, file) })
    return { progress, file, ok: errors.length === 0, errors, ...reading }
  } finally {
    await page.close()
  }
}

try {
  for (const progress of points) {
    let result
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        result = { ...await capture(progress), attempt }
        break
      } catch (error) {
        result = { progress, ok: false, attempt, error: String(error) }
      }
    }
    results.push(result)
    await writeFile(path.join(out, 'frames.json'), JSON.stringify({ url, width, height, results }, null, 2))
    console.log(JSON.stringify({ progress, ok: result.ok, file: result.file, phase: result.phase, tier: result.performance?.tier, flex: result.stats?.flexPeakDisplacement, registration: result.maxRegistrationPx, error: result.error }))
  }
} finally {
  await browser.close()
}
if (results.some((r) => !r.ok)) process.exitCode = 1
console.log(`Evidence: ${out}`)
