import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const out = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const report = { started: new Date().toISOString(), cases: [] }

try {
  for (const mode of ['poster', 'reduced-motion']) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
    })
    if (mode === 'poster') {
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return String(type).includes('webgl') ? null : original.call(this, type, args)
        }
      })
    }
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('http://localhost:4173/?station=2', { waitUntil: 'load' })
    await page.waitForTimeout(2500)
    const snap = await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      return { scrollY: window.scrollY, max, fraction: max > 0 ? window.scrollY / max : 0 }
    })
    // ?station=2 carries paced 0.60; rawScrollFor(0.60)=0.6818181818 (verified
    // against src/scene/drawing/introTimeline.ts). ±0.005 tolerance.
    const expected = 0.6818181818
    const pass = Math.abs(snap.fraction - expected) <= 0.005 && errors.length === 0
    report.cases.push({ mode, ...snap, expected, pass, errors })
    console.log(JSON.stringify({ mode, ...snap, expected, pass, errors }))
    await context.close()
  }
} finally {
  await browser.close()
  report.finished = new Date().toISOString()
  report.passed = report.cases.every((c) => c.pass)
  fs.writeFileSync(path.join(out, 'deep-link-results.json'), JSON.stringify(report, null, 2))
}
process.exitCode = report.passed ? 0 : 1
