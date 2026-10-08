import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pixels } from '../../../../../../../scripts/lib/preview-pixels.mjs'

// Parent smoke probe for the integrated shaft inspection (not acceptance evidence on its own).
const url = process.argv.find(a => a.startsWith('--url='))?.slice(6) || 'http://localhost:5199'
const out = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || 'shaft-smoke')
const times = (process.argv.find(a => a.startsWith('--times='))?.slice(8) || '1,4,8,9,12,16.5,23.8,28,33.5,37,41,43').split(',').map(Number)
const viewports = (process.argv.find(a => a.startsWith('--viewports='))?.slice(12) || 'desktop,narrow').split(',')
await fs.mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] })
const report = { url, cases: [] }
const sizes = { desktop: { width: 1440, height: 900 }, narrow: { width: 390, height: 844 } }
for (const name of viewports) {
  const result = { name, errors: [], requests: [], frames: [] }
  report.cases.push(result)
  const context = await browser.newContext({ viewport: sizes[name], deviceScaleFactor: 1, isMobile: name === 'narrow', hasTouch: name === 'narrow' })
  const page = await context.newPage()
  page.on('pageerror', e => result.errors.push('pageerror ' + e.message))
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') result.errors.push(m.type() + ' ' + m.text().slice(0, 300)) })
  page.on('request', r => { if (/\.glb/.test(r.url())) result.requests.push(r.url()) })
  try {
    await page.goto(url + '/?chapter=1&inspectionProof=1', { waitUntil: 'domcontentloaded' })
    const trigger = page.getByRole('button', { name: 'Inspect the input shaft' })
    await trigger.waitFor({ state: 'visible', timeout: 120000 })
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(1000)
    const t0 = Date.now()
    await trigger.focus(); await page.keyboard.press('Enter')
    await page.getByRole('dialog').waitFor()
    await page.waitForFunction(() => ['ready', 'error'].includes(window.__inspection?.status), null, { timeout: 90000 })
    result.readyMs = Date.now() - t0
    result.status = await page.evaluate(() => ({ status: window.__inspection.status, error: window.__inspection.error ?? null, kind: window.__inspection.kind, storyId: window.__inspection.storyId, duration: window.__inspection.duration }))
    if (result.status.status !== 'ready') throw new Error('not ready: ' + JSON.stringify(result.status))
    await page.waitForTimeout(1500)
    const seek = page.locator('#inspection-seek')
    for (const t of times) {
      await seek.fill(String(t)); await page.waitForTimeout(400)
      const probe = await page.evaluate(() => { const p = window.__inspection; return JSON.parse(JSON.stringify({ time: p.time, phase: p.phase, chapter: p.chapter, discrete: p.discrete, narrativeAlpha: p.narrativeAlpha, narrativeVisibleMeshes: p.narrativeVisibleMeshes, cameraOwner: p.cameraOwner, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, shaft: p.shaft, resources: p.resources })) })
      const file = path.join(out, name + '-t' + String(t).replace('.', '_') + '.png')
      const buffer = await page.screenshot({ path: file })
      const img = pixels(buffer); let lit = 0, n = 0
      for (let i = 0; i < img.data.length; i += img.channels * 7) { n++; if (img.data[i] + img.data[i + 1] + img.data[i + 2] > 60) lit++ }
      result.frames.push({ t, file: path.basename(file), litFraction: +(lit / n).toFixed(4), probe })
    }
    await page.getByRole('button', { name: /Return to narrative/ }).click()
    await page.waitForTimeout(800)
    result.afterReturn = await page.evaluate(() => ({ active: window.__inspection.active, restoredPoseError: window.__inspection.restoredPoseError, restoreObserved: window.__inspection.restoreObserved, focus: document.activeElement?.textContent?.trim().slice(0, 40) }))
  } catch (e) { result.failure = String(e).slice(0, 500) }
  await context.close()
}
await browser.close()
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 1))
for (const c of report.cases) {
  console.log(c.name, 'ready', c.readyMs, JSON.stringify(c.status), 'errors', c.errors.length, c.failure || '')
  for (const e of c.errors.slice(0, 6)) console.log('  ', e)
  for (const f of c.frames) console.log('  t', f.t, 'lit', f.litFraction, 'phase', f.probe.phase, 'alpha', f.probe.narrativeAlpha, 'vis', f.probe.narrativeVisibleMeshes, 'cam', f.probe.sampledTime === f.probe.cameraSampleTime, 'teeth', f.probe.shaft?.teethFormed, 'cutter', f.probe.shaft?.cutter?.visible, 'hob', f.probe.shaft?.hob?.visible, 'card', f.probe.shaft?.card?.id, 'dY', f.probe.shaft?.supports?.deltaYmm, 'fin', f.probe.shaft?.finale?.assembled)
  console.log('  return', JSON.stringify(c.afterReturn))
}

