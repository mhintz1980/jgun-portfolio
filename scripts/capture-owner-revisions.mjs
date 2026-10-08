// JG-035 owner-revision before/after capture: exact-time ring/shaft frames and
// opening frames through the existing proof hooks (no verifier flags added).
// node scripts/capture-owner-revisions.mjs --url=http://localhost:5199 --out=<dir> [--only=ring,shaft,opening]
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const url = arg('url') ?? 'http://localhost:5199'
const out = path.resolve(arg('out') ?? 'capture-out')
const only = (arg('only') ?? 'ring,shaft,opening').split(',')
fs.mkdirSync(out, { recursive: true })
const report = { qualityLock: true, url, started: new Date().toISOString(), head: execSync('git rev-parse HEAD').toString().trim(), launch: describeLaunch(), only, captures: [], errors: [] }
const browser = await launchBrowser(chromium)
report.browserVersion = browser.version()
const shot = async (page, name, meta = {}) => {
  const file = path.join(out, name + '.png')
  await page.screenshot({ path: file, timeout: 300000 })
  report.captures.push({ file: path.basename(file), ...meta })
}
async function open(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, serviceWorkers: 'block' })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
  return { context, page }
}
/** Wait until the sampled playhead (and, when published, the camera) equals t, then let several real frames render. */
const settled = async (page, t, frames = 4) => {
  await page.waitForFunction(time => { const p = window.__inspection; return p?.active && Math.abs((p.sampledTime ?? p.time) - time) < 1e-6 && (p.cameraSampleTime === undefined || Math.abs(p.cameraSampleTime - time) < 1e-6) }, t, { timeout: 120000 })
  await page.evaluate(n => new Promise(resolve => { let k = 0; const tick = () => (++k >= n ? resolve() : requestAnimationFrame(tick)); requestAnimationFrame(tick) }), frames)
}
const renderer = page => page.evaluate(() => { const g = (window.__threeRenderer ?? null)?.getContext?.(); const e = g?.getExtension('WEBGL_debug_renderer_info'); return { renderer: e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : null, tier: window.__telemetry?.performance?.tier ?? null } })

if (only.includes('ring')) {
  const { context, page } = await open({ width: 1440, height: 960 })
  await page.goto(`${url}/?chapter=1&inspectionProof=1&qualityLock=1`, { waitUntil: 'domcontentloaded' })
  const trigger = page.getByRole('button', { name: 'Inspect the finish' })
  await trigger.waitFor({ state: 'visible', timeout: 180000 })
  await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 180000 })
  await page.waitForTimeout(1500)
  await trigger.focus(); await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor()
  await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof, null, { timeout: 180000 })
  const env = await renderer(page)
  for (const t of [1.2, 2.6, 4.2, 5.2, 8, 8.575, 9.3, 12]) {
    await page.waitForFunction(() => window.__inspectionProof && window.__inspection?.loaded && window.__inspection?.status === "ready", null, { timeout: 240000 })
    await page.evaluate(time => window.__inspectionProof.seek(time, 2), t)
    await settled(page, t)
    await shot(page, `ring-${String(t).replace('.', 'p')}s`, { kind: 'ring', t, ...env, probe: await page.evaluate(() => JSON.parse(JSON.stringify(window.__inspection))) })
  }
  await context.close()
}
if (only.includes('ringmask')) {
  // R2 diagnosis: green = shader knurl mask live, red = masked out. Compare with the beauty frame at the same time.
  const { context, page } = await open({ width: 1440, height: 960 })
  await page.goto(`${url}/?chapter=1&inspectionProof=1&qualityLock=1`, { waitUntil: 'domcontentloaded' })
  const trigger = page.getByRole('button', { name: 'Inspect the finish' })
  await trigger.waitFor({ state: 'visible', timeout: 180000 })
  await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 180000 })
  await page.waitForTimeout(1500)
  await trigger.focus(); await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor()
  await page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof, null, { timeout: 180000 })
  for (const t of [8]) {
    await page.evaluate(time => window.__inspectionProof.seek(time, 2), t)
    await page.waitForTimeout(800)
    await page.evaluate(() => window.__inspectionProof.mask(true))
    await page.waitForTimeout(800)
    await shot(page, `ring-${t}s-mask`, { kind: 'ringmask', t })
    await page.evaluate(() => window.__inspectionProof.mask(false))
  }
  await context.close()
}
if (only.includes('shaft')) {
  const { context, page } = await open({ width: 1440, height: 900 })
  await page.goto(`${url}/?chapter=1&inspectionProof=1&qualityLock=1`, { waitUntil: 'domcontentloaded' })
  const trigger = page.getByRole('button', { name: 'Inspect the input shaft' })
  await trigger.waitFor({ state: 'visible', timeout: 180000 })
  await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 180000 })
  await page.waitForTimeout(1500)
  await trigger.click()
  await page.getByRole('dialog').waitFor()
  await page.waitForFunction(() => ['ready', 'error'].includes(window.__inspection?.status), null, { timeout: 180000 })
  await page.waitForTimeout(1400)
  const env = await renderer(page)
  for (const t of (arg('times') ?? '1.3,3,6.5,10.9,13,16,19,21.5,25.4,28,33.5,37,41').split(',').map(Number)) {
    await page.locator('#inspection-seek').evaluate((e, value) => {
      e.step = 'any'
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, String(value))
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }))
    }, t)
    await settled(page, t, 6)
    await shot(page, `shaft-${String(t).replace('.', 'p')}s`, { kind: 'shaft', t, ...env, probeTime: await page.evaluate(() => window.__inspection?.time) })
  }
  await context.close()
}
if (only.includes('opening')) {
  const viewports = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, narrow: { width: 390, height: 844 } }
  for (const name of (arg('viewports') ?? 'desktop,narrow').split(',')) {
    const viewport = viewports[name]
    const { context, page } = await open(viewport)
    await page.goto(url + '/?qualityLock=1', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 240000 })
    const env = await renderer(page)
    for (const t of (arg('times') ?? '0.03,0.12,0.19,0.29,0.38,0.77,0.80,0.86').split(',').map(Number)) {
      await page.evaluate(p => window.__drawingProof.setProgress(p), t * 0.12)
      // The scroll camera damps toward its goal: capture only once position and fov have converged (as capture-jgun-drawing-review does).
      await page.waitForFunction(phase => {
        const c = window.__telemetry?.camera
        return window.__telemetry?.drawing?.phase !== undefined && Math.abs(window.__telemetry.drawing.phase - phase) < 1e-6 && c &&
          Math.hypot(c.x - c.goal.position[0], c.y - c.goal.position[1], c.z - c.goal.position[2]) < 0.00005 && Math.abs(c.fov - c.goal.fov) < 0.005
      }, t, { timeout: 180000 })
      await page.waitForTimeout(600)
      await shot(page, `opening-${name}-t${String(t).replace('.', 'p')}`, { kind: 'opening', viewport: name, t, ...env, camera: await page.evaluate(() => window.__telemetry?.camera ?? null) })
    }
    await context.close()
  }
}
await browser.close()
report.finished = new Date().toISOString()
fs.writeFileSync(path.join(out, `capture-report-${only.join('+')}.json`), JSON.stringify(report, null, 2))
console.log(JSON.stringify({ captures: report.captures.length, errors: report.errors.slice(0, 5), launch: report.launch }, null, 2))
