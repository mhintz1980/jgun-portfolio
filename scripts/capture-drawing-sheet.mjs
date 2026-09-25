// Captures the intro drawing sheet at a few scroll points. Usage: node scripts/capture-drawing-sheet.mjs [base] [outDir]
import fs from 'node:fs'
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:5199'
const out = process.argv[3] ?? '.scratch/drawing-sheet'
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  page.on('pageerror', (e) => console.error('pageerror', String(e)))
  await page.goto(`${base}/`)
  await page.waitForFunction(
    () => window.__drawingProof?.scrollToProgress && window.__telemetry?.drawing?.annotationsReady,
    { timeout: 120000, polling: 500 },
  )
  for (const p of [0, 0.03, 0.06, 0.1]) {
    await page.evaluate((p) => window.__drawingProof.scrollToProgress(p), p)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${out}/sheet-${String(p).replace('.', '_')}.png` })
  }
} finally {
  await browser.close()
}
