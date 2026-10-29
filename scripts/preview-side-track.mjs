/** Three owner-review stills only; no acceptance gates or production verification. */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { launchBrowser } from './lib/browser-launch.mjs'

const url = 'http://localhost:5199/torque-wrench/?quality=full'
const out = 'output/playwright/side-track-preview-2026-10-27'
mkdirSync(out, { recursive: true })
const clockSource = buildSync({
  entryPoints: ['src/scene/torque-wrench/InspectionDirector.ts'],
  bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
}).outputFiles[0].text
const clock = await import(`data:text/javascript;base64,${Buffer.from(clockSource).toString('base64')}`)
const browser = await launchBrowser(chromium)
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  page.on('pageerror', error => console.log(`Preview page error: ${error.message}`))
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__torqueWorld?.snapshot().ready, null, { timeout: 120000 })
  for (const time of [54.9, 58.7, 63.8]) {
    const progress = clock.cascadeProgressAtTime(time) - .115
    await page.evaluate(p => {
      window.scrollTo({ top: window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' })
    }, progress)
    await page.waitForFunction(() => window.__torqueWorld?.snapshot().inspection?.ready, null, { timeout: 90000 })
    await page.waitForTimeout(1800)
    const state = await page.evaluate(() => window.__torqueWorld.motionSample())
    const filename = `${out}/side-track-${String(time).replace('.', 'p')}.png`
    await page.screenshot({ path: filename })
    console.log(JSON.stringify({ filename, requestedTime: time, shownTime: state.time, progress: state.progress }))
  }
} finally {
  await browser.close()
}
