// Focused ring-sampler runtime probe: seeks the refined landmarks in the real scene and records telemetry.
// node ring-runtime-probe.mjs --url=http://localhost:5199 --out=<dir>
import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
const url = process.argv.find(a => a.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const out = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || 'ring-probe')
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
const report = { url, started: new Date().toISOString(), frames: [], errors: [] }
const read = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__inspection)))
const seek = async (page, time) => { await page.evaluate(t => window.__inspectionProof.seek(t, 2), time); await page.waitForTimeout(300); return read(page) }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
  await page.goto(url + '/?chapter=1&inspectionProof=1', { waitUntil: 'domcontentloaded' })
  const trigger = page.getByRole('button', { name: 'Inspect the finish' })
  await trigger.waitFor({ state: 'visible', timeout: 120000 })
  await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
  await page.waitForTimeout(1500)
  await trigger.focus(); await page.keyboard.press('Enter'); await page.getByRole('dialog').waitFor()
  await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof, null, { timeout: 60000 })
  await seek(page, 0)
  await page.getByRole('button', { name: 'Play sequence', exact: true }).click(); await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const shots = new Set([3.7, 3.9, 4.1, 4.2, 6.2, 7.7, 9.4, 10.2])
  for (const time of [2.8, 3.0, 3.4, 3.7, 3.8, 3.9, 4.0, 4.1, 4.2, 5.2, 6.2, 6.4, 6.6, 7.0, 7.6, 7.7, 7.9, 8.1, 8.2, 9.4, 10.2, 10.5]) {
    const f = await seek(page, time)
    report.frames.push({ time: f.time, phase: f.phase, toolVisible: f.toolVisible, toolClipTime: f.toolClipTime, ringAngle: f.ringAngle, odKnurlProgress: f.odKnurlProgress, aluminiumBlend: f.aluminiumBlend, rollerClearance: f.rollerClearance, rollerAxial: f.rollerAxial, maskSamples: f.maskSamples })
    if (shots.has(time)) await page.screenshot({ path: path.join(out, 't' + time.toFixed(1) + '.png') })
  }
} finally { await browser.close(); report.finished = new Date().toISOString(); await fs.writeFile(path.join(out, 'runtime-probe.json'), JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ errors: report.errors, frames: report.frames.map(f => [f.time, f.toolVisible, f.rollerClearance.map(x => +x.toFixed(6)), f.rollerAxial.map(x => +x.toFixed(5)), +f.ringAngle.toFixed(4), +f.odKnurlProgress.toFixed(3), +f.aluminiumBlend.toFixed(3)]) }))

