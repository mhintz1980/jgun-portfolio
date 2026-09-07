/**
 * Static exploded-mode A/B capture (throwaway): ?view=exploded keeps the gear
 * train at rest (stageRot all 0), so screenshot diffs isolate material changes
 * from gear-spin phase residue. Usage: node jg028-static-ab.mjs
 */
import fs from 'node:fs'
const { chromium } = await import(
  'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const capture = async (base, out) => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  })
  try {
    const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage()
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e)))
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    await page.goto(base + '/?view=exploded', { waitUntil: 'networkidle' })
    await page.waitForFunction(() => Boolean(window.__rig?.meshes?.length && window.__telemetry), null, { timeout: 60000 })
    // settle: wait until stageRot all ~0 and camera quiet
    await page.evaluate(async () => {
      const t = window.__telemetry
      const snap = () => [t.camera.x, t.camera.y, t.camera.z, ...t.rig.stageRot]
      let previous = snap()
      let quiet = 0
      const start = performance.now()
      while (performance.now() - start < 15000 && quiet < 30) {
        await new Promise((r) => requestAnimationFrame(() => r()))
        const current = snap()
        let delta = 0
        for (let i = 0; i < current.length; i += 1) delta = Math.max(delta, Math.abs(current[i] - previous[i]))
        previous = current
        quiet = delta <= 1e-6 ? quiet + 1 : 0
      }
    })
    const tele = await page.evaluate(() => ({
      stageRot: window.__telemetry.rig.stageRot,
      explodeFactor: window.__telemetry.rig.explodeFactor,
      ghostOpacity: window.__telemetry.rig.ghostOpacity,
      handleZ: window.__telemetry.rig.handleZ,
      materialMode: window.__telemetry.scroll.materialMode,
    }))
    await page.screenshot({ path: out })
    console.log(base, '→', out, 'errors:', errs.length, JSON.stringify(tele))
    return errs
  } finally {
    await browser.close()
  }
}

const e1 = await capture('http://localhost:4174', '.scratch/jg028-regression/static-exploded-baseline.png')
const e2 = await capture('http://localhost:4173', '.scratch/jg028-regression/static-exploded-current.png')
fs.writeFileSync(
  '.scratch/jg028-regression/static-ab-errors.json',
  JSON.stringify({ baseline: e1, current: e2 }, null, 1)
)
