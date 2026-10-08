import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const base = process.argv.find(value => value.startsWith('--url='))?.slice(6) ?? 'http://localhost:5199'
const out = path.dirname(new URL(import.meta.url).pathname.slice(1))
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11'] })
const report = { cases: [], errors: [], pass: false }
try {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport })
    page.on('pageerror', error => report.errors.push(error.message))
    await page.goto(`${base}/project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/integration/harness.html`)
    await page.waitForFunction(() => window.integrationProof)
    await page.waitForTimeout(400)
    await page.evaluate(() => window.integrationProof.open())
    await page.waitForTimeout(100)
    await page.evaluate(() => window.integrationProof.play())
    await page.waitForTimeout(500)
    await page.evaluate(() => window.integrationProof.seek(5.2))
    await page.waitForTimeout(100)
    const result = await page.evaluate(() => ({ ...window.integrationProof.proof, viewport: [innerWidth, innerHeight] }))
    await page.screenshot({ path: path.join(out, `ordering-${viewport.width}.png`) })
    await page.evaluate(() => window.integrationProof.close())
    await page.waitForFunction(() => window.integrationProof.inspectionTelemetry.restoreObserved)
    result.restore = await page.evaluate(() => ({ pose: window.integrationProof.inspectionTelemetry.restoredPoseError, projection: window.integrationProof.inspectionTelemetry.restoreProjectionError, state: window.integrationProof.inspectionTelemetry.restoreStateError }))
    // Deliberately perturb between restore and observation. A vacuous residual stays zero.
    await page.evaluate(() => {
      const api = window.integrationProof
      api.open(); api.seek(5)
      requestAnimationFrame(() => { api.close(); requestAnimationFrame(() => { api.perturb() }) })
    })
    await page.waitForTimeout(150)
    result.perturbedResidual = await page.evaluate(() => window.integrationProof.inspectionTelemetry.restoredPoseError)
    result.pass = result.checked > 10 && result.lag === 0 && result.doubleAdvance === 0 && result.poseError < 1e-7 && result.registration.indexOf(-10) < result.registration.indexOf(0) && result.restore.pose < 1e-7 && result.restore.projection === 0 && result.restore.state === 0 && result.perturbedResidual > .0009
    report.cases.push(result)
    await page.close()
  }
  report.pass = report.errors.length === 0 && report.cases.every(value => value.pass)
} finally { await browser.close(); await fs.writeFile(path.join(out, 'ordering-report.json'), JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ pass: report.pass, cases: report.cases.map(value => ({ viewport: value.viewport, pass: value.pass, lag: value.lag, doubleAdvance: value.doubleAdvance, residual: value.perturbedResidual })), errors: report.errors }))
if (!report.pass) process.exitCode = 1
