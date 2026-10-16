// JG-038 controlled render-update delivery diagnostic. Real rAF timestamps,
// native scroll only; no store/director setters or accumulative playback clock.
// Not an unthrottled performance distribution or owner motion acceptance.
import { createHash } from 'node:crypto'
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { launchConfig } from './lib/browser-launch.mjs'
import { resolveServedTargets } from './verify-torque-performance-contract.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidence = path.join(root, 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery')
const args = {}
for (const arg of process.argv.slice(2)) {
  const m = /^--(url|build-dir|out|viewport)=(.+)$/.exec(arg)
  if (!m || args[m[1]]) throw Error('Use --url= --build-dir= --out= [--viewport=D|N]')
  args[m[1]] = m[2]
}
const url = new URL(args.url)
if (url.hostname !== 'localhost' || url.pathname !== '/torque-wrench/' || url.search || url.hash) throw Error('Local private URL required')
const build = realpathSync(path.resolve(root, args['build-dir']))
if (!build.startsWith(realpathSync(path.join(root, '.scratch')) + path.sep)) throw Error('Build outside task scratch')
const out = path.resolve(root, args.out)
const outputParent = realpathSync(path.dirname(out)), evidenceReal = realpathSync(evidence)
if ((outputParent !== evidenceReal && !outputParent.startsWith(evidenceReal + path.sep)) || path.extname(out) !== '.json') throw Error('New task evidence JSON required')
try { lstatSync(out); throw Error('Output exists') } catch (e) { if (e.code !== 'ENOENT') throw e }
const viewportKey = args.viewport ?? 'D'
if (!['D', 'N'].includes(viewportKey)) throw Error('Bad viewport')
const viewport = viewportKey === 'D' ? { width: 1440, height: 900 } : { width: 390, height: 844 }
const sha = b => createHash('sha256').update(b).digest('hex')
const report = { scope: 'Controlled actual rAF callback delivery; real timestamps. Functional continuity only, not G8 or analytical C1.',
  startedAt: new Date().toISOString(), url: url.toString(), out, viewportKey, build, harnessSha256: sha(readFileSync(fileURLToPath(import.meta.url))),
  checks: [], windows: [], errors: [], limitations: ['No approved cadence tolerance; observed delivery rates are retained without nominal-rate acceptance.',
    'Finite sampled poses and hold/retrace checks do not establish analytical full-path C1.', 'Hidden-tab/BFCache and physical mobile behavior are not tested.'] }
const check = (name, pass, actual) => report.checks.push({ name, status: pass ? 'PASS' : 'FAIL', actual })
async function identity() {
  const rows = []
  for (const target of resolveServedTargets(build)) {
    const response = await fetch(new URL(target.pathname, url))
    const bytes = Buffer.from(await response.arrayBuffer())
    const local = readFileSync(path.join(build, target.localRelative))
    rows.push({ ...target, status: response.status, sha256: sha(bytes), localSha256: sha(local), match: sha(bytes) === sha(local) })
  }
  if (rows.length < 4 || rows.some(r => r.status !== 200 || !r.match)) throw Error('Served identity mismatch')
  return rows
}
function init() {
  const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window)
  const pending = new Map()
  let next = 0, last = -Infinity, pumpId = null
  const probe = { hz: 0, rows: [], dropped: 0, errors: [] }
  Object.defineProperty(window, '__jg038UpdateStress', { value: probe })
  const pump = now => {
    pumpId = raf(pump)
    if (probe.hz && now - last + .2 < 1000 / probe.hz) return
    last = now
    const batch = [...pending.entries()]
    for (const [id, callback] of batch) {
      if (!pending.delete(id)) continue
      try { callback(now) } catch (e) { probe.errors.push(String(e)); throw e }
    }
    const world = window.__torqueWorld?.snapshot?.()
    if (probe.hz && world?.ready) {
      if (probe.rows.length < 12000) probe.rows.push({ t: now, worldFrame: world.frames, progress: world.progress,
        camera: world.camera, opening: world.opening, tier: document.querySelector('.torque-page')?.dataset.torqueTier,
        lamps: { lampPower: world.opening?.lampPower, blackout: world.opening?.blackout,
          illumination: world.opening?.illumination, lightSweep: world.opening?.lightSweep,
          lightSweepPosition: world.opening?.lightSweepPosition, portalLight: world.sheet?.stats?.portalLight,
          portalPulse: world.sheet?.stats?.portalPulse },
        scrollY, maxScroll: document.documentElement.scrollHeight - innerHeight,
        nativeProgress: scrollY / (document.documentElement.scrollHeight - innerHeight),
        narrative: window.__torqueNarrative?.snapshot?.() })
      else probe.dropped++
    }
  }
  window.requestAnimationFrame = callback => { const id = ++next; pending.set(id, callback); if (pumpId === null) pumpId = raf(pump); return id }
  window.cancelAnimationFrame = id => { pending.delete(id) }
  // Preserve native cancel solely as provenance; task scheduler never cancels unrelated callbacks.
  probe.scheduler = { source: 'native requestAnimationFrame timestamps', cancelAvailable: typeof cancel === 'function' }
}
let browser
try {
  report.servedBefore = await identity()
  report.launch = launchConfig()
  browser = await chromium.launch(report.launch)
  const context = await browser.newContext({ viewport, deviceScaleFactor: viewportKey === 'D' ? 1 : 3,
    isMobile: viewportKey === 'N', hasTouch: viewportKey === 'N', reducedMotion: 'no-preference' })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
  page.on('requestfailed', r => report.errors.push(r.url() + ': ' + r.failure()?.errorText))
  page.on('response', r => { if (r.status() >= 400) report.errors.push(r.status() + ': ' + r.url()) })
  await page.addInitScript(init)
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready && window.__torqueWorld.snapshot().sheet?.baked, null, { timeout: 120000 })
  const seek = async p => {
    await page.evaluate(p => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * p)), p)
    await page.waitForFunction(p => Math.abs(window.__torqueWorld.snapshot().progress - p) < .001, p, { timeout: 15000 })
    await page.waitForTimeout(350)
  }
  // Warm actual private resources before controlled windows; no readiness substitution.
  await seek(.70); await seek(.82); await seek(.97)
  report.start = await page.evaluate(() => ({ viewport: [innerWidth, innerHeight, devicePixelRatio],
    tier: document.querySelector('.torque-page')?.dataset.torqueTier, renderer: window.__torqueWorld.snapshot().renderer }))
  for (const hz of [30, 15]) {
    await page.evaluate(hz => { const p = window.__jg038UpdateStress; p.hz = hz; p.rows = []; p.dropped = 0 }, hz)
    for (const p of [0, .32, .42, .435, .46, .65, .675, .69, .72, .735, .795, .835, .925, .94, 1,
      .94, .925, .835, .795, .735, .72, .69, .675, .65, .46, .435, .42, .32, 0]) await seek(p)
    await seek(.815)
    await page.waitForTimeout(1700)
    const holdStart = await page.evaluate(() => window.__jg038UpdateStress.rows.length)
    await page.waitForFunction(index => {
      const rows = window.__jg038UpdateStress.rows
      return rows[index] && rows.at(-1).t - rows[index].t >= 5000
    }, holdStart, { timeout: 10000, polling: 100 })
    const captured = await page.evaluate(() => { const p = window.__jg038UpdateStress; p.hz = 0; return { rows: p.rows, dropped: p.dropped, errors: p.errors } })
    const unique = captured.rows.filter((r, i, a) => i === 0 || r.worldFrame !== a[i - 1].worldFrame)
    const intervals = unique.slice(1).map((r, i) => r.t - unique[i].t).sort((a, b) => a - b)
    const holdAnchor = captured.rows[holdStart]
    const hold = captured.rows.filter(r => r.t >= holdAnchor.t)
    const dist = (a, b) => Array.isArray(a) && Array.isArray(b) ? Math.hypot(...a.map((v, i) => v - b[i])) : Infinity
    const angle = (a, b) => Array.isArray(a) && Array.isArray(b) ? 2 * Math.acos(Math.min(1, Math.abs(a.reduce((s, v, i) => s + v * b[i], 0)))) * 180 / Math.PI : Infinity
    const baseline = holdAnchor
    const residuals = hold.map(r => ({ position: dist(r.camera.position, baseline.camera.position), target: dist(r.camera.target, baseline.camera.target),
      angle: angle(r.camera.quaternion, baseline.camera.quaternion), fov: Math.abs(r.camera.fov - baseline.camera.fov), progress: Math.abs(r.progress - baseline.progress),
      nativeProgress: Math.abs(r.nativeProgress - baseline.nativeProgress),
      lamps: Object.fromEntries(Object.keys(baseline.lamps).map(k => [k, Number.isFinite(r.lamps[k]) && Number.isFinite(baseline.lamps[k]) ? Math.abs(r.lamps[k] - baseline.lamps[k]) : null])) }))
    const observed = { requestedHz: hz, observedMedianMs: intervals[Math.floor(intervals.length / 2)] ?? null,
      cadenceConformance: 'UNVERIFIED: no approved cadence tolerance', holdAnchor, residuals, ...captured }
    report.windows.push(observed)
    check(hz + 'Hz finite actual update samples', unique.length > 100 && captured.rows.every(r => Number.isFinite(r.t)
      && Number.isFinite(r.worldFrame) && Number.isFinite(r.progress)
      && Number.isFinite(r.nativeProgress) && r.camera.position.every(Number.isFinite) && r.camera.target.every(Number.isFinite)
      && r.camera.quaternion.every(Number.isFinite) && Number.isFinite(r.camera.fov) && Object.values(r.lamps).every(Number.isFinite)), unique.length)
    check(hz + 'Hz zero dropped/errors', captured.dropped === 0 && captured.errors.length === 0, { dropped: captured.dropped, errors: captured.errors })
    check(hz + 'Hz full five-second held pose', hold.length > 1 && hold.at(-1).t - hold[0].t >= 5000
      && residuals.every(r => r.position <= .0001 && r.target <= .0001 && r.angle <= .01 && r.fov <= .01 && r.progress <= 1e-9
        && Number.isFinite(r.nativeProgress) && r.nativeProgress <= 1e-9
        && Object.values(r.lamps).every(v => Number.isFinite(v) && v <= 1e-4)),
      { duration: hold.length ? hold.at(-1).t - hold[0].t : null, residuals })
  }
  report.end = await page.evaluate(() => ({ viewport: [innerWidth, innerHeight, devicePixelRatio],
    tier: document.querySelector('.torque-page')?.dataset.torqueTier, renderer: window.__torqueWorld.snapshot().renderer }))
  check('environment stable', JSON.stringify(report.start.viewport) === JSON.stringify(report.end.viewport)
    && report.start.tier === report.end.tier && report.start.renderer.backend === report.end.renderer.backend
    && report.start.renderer.effectiveDpr === report.end.renderer.effectiveDpr
    && JSON.stringify(report.start.renderer.drawingBuffer) === JSON.stringify(report.end.renderer.drawingBuffer), { start: report.start, end: report.end })
  check('zero page/console/request/HTTP errors', report.errors.length === 0, report.errors)
  report.servedAfter = await identity()
  check('served bytes stable', JSON.stringify(report.servedBefore) === JSON.stringify(report.servedAfter), null)
} catch (e) { report.exception = String(e.stack ?? e); check('completed', false, report.exception) }
finally { await browser?.close() }
report.finishedAt = new Date().toISOString()
report.status = report.checks.length && report.checks.every(c => c.status === 'PASS') ? 'PASS' : 'FAIL'
writeFileSync(out, JSON.stringify(report, null, 2), { flag: 'wx' })
console.log(JSON.stringify({ out, status: report.status, checks: report.checks.map(({ name, status }) => ({ name, status })) }))
process.exitCode = report.status === 'PASS' ? 0 : 1
