import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { gunzipSync, gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { launchBrowser } from '../scripts/lib/browser-launch.mjs'
import { resolveServedTargets } from '../scripts/verify-torque-performance-contract.mjs'
import { deriveHardwareGl } from '../scripts/lib/torque-performance-observers.mjs'
const args = Object.fromEntries(process.argv.slice(2).map(v => v.replace(/^--/, '').split('=')))
if (!args.out) throw new Error('--out required')
if (existsSync(args.out)) throw new Error('Refusing to overwrite existing report')
const hash = b => createHash('sha256').update(b).digest('hex')
const build = args['build-dir'] ?? '.scratch/jg038-two-findings-20261015-f'
const origin = 'http://localhost:5288'
const raw = gunzipSync(readFileSync(build + '/drawing/jgun-sheet-v2.bin.gz'))
if (raw.toString('ascii', 0, 4) !== 'JGD3' || raw.readUInt32LE(8) !== 8) throw new Error('Expected source cache JGD3/version8')
const stale = Buffer.from(raw); stale.writeUInt32LE(7, 8)
const staleBytes = gzipSync(stale)
const result = { createdAt: new Date().toISOString(), scope: 'JG038 LeanV1 three primary startup conditions plus required repeats',
  harnessSha256: hash(readFileSync(new URL(import.meta.url))), build, browser: null, trials: [], servedIdentity: [], status: 'UNVERIFIED',
  limitations: ['Fresh browser context does not imply OS/driver cold cache', 'Harness polling and GL wrappers have unisolated observer cost', 'Exact decode/parse, upload and GPU shader completion spans are unobservable and remain UNVERIFIED', 'No physical mobile, hidden-start, owner or wider gate acceptance'] }
const power = () => JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus | Select-Object PowerOnline,Charging,Discharging | ConvertTo-Json -Compress'], { encoding: 'utf8' }))
function startupProbe() {
  const state = window.__acStartup = { events: [], initial: null }
  const original = HTMLCanvasElement.prototype.getContext
  const wrapped = new WeakSet()
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const gl = original.apply(this, args)
    if (gl && /webgl/.test(args[0]) && !wrapped.has(gl)) {
      wrapped.add(gl)
      for (const name of ['compileShader', 'linkProgram']) {
        const fn = gl[name]
        gl[name] = function (...a) {
          const start = performance.now()
          try { return fn.apply(this, a) }
          finally { if (state.events.length < 4096) state.events.push({ name, start, end: performance.now() }); else state.truncated = true }
        }
      }
    }
    return gl
  }
  let bakeFrames = null
  const poll = () => {
    if (state.initial) return
    const w = window.__torqueWorld?.snapshot?.(), b = window.__torqueBackground?.snapshot?.()
    if (w?.sheet.baked && bakeFrames === null) { bakeFrames = b?.frames ?? 0; state.bakedAt = performance.now() }
    if (w?.ready && w.sheet.baked && w.sheet.stats.annotationsReady === 1 && w.sheet.stats.shaderWarmReady === 1
      && document.fonts.status === 'loaded' && document.querySelector('[data-torque-scene="live"] canvas')?.isConnected
      && b?.frames > bakeFrames) state.initial = { at: performance.now(), world: w, backgroundFrames: b.frames, bakeFrames }
    else requestAnimationFrame(poll)
  }
  requestAnimationFrame(poll)
}
const browser = await launchBrowser(chromium)
result.browser = browser.version()
async function trial(condition, index) {
  const row = { condition, index, primary: index === 1, powerBefore: power(), errors: [], expectedErrors: [], routeHits: 0, budgets: {}, unverified: [] }
  if (!row.powerBefore.PowerOnline || row.powerBefore.Discharging) throw new Error('Native AC required')
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
  await context.addInitScript(startupProbe)
  await context.route('**/drawing/jgun-sheet-v2.bin.gz', async route => {
    row.routeHits++
    if (condition === 'missing') await route.fulfill({ status: 404, contentType: 'application/octet-stream', body: '' })
    else if (condition === 'stale') await route.fulfill({ status: 200, contentType: 'application/octet-stream', body: staleBytes })
    else await route.continue()
  })
  const page = await context.newPage()
  page.on('pageerror', e => row.errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') {
    const entry = { text: m.text(), location: m.location() }
    if (condition === 'missing' && entry.location.url.includes('/drawing/jgun-sheet-v2.bin.gz') && /404/.test(entry.text)) row.expectedErrors.push(entry)
    else row.errors.push(entry)
  } })
  try {
    await page.goto(origin + '/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => window.__acStartup.initial, null, { timeout: 30000 })
    row.initial = await page.evaluate(() => window.__acStartup)
    const w = row.initial.initial.world, stats = w.sheet.stats
    row.navigationToFullyReadyMs = row.initial.initial.at
    row.cache = { basePrecomputed: stats.basePrecomputed, privateContentVariant: stats.privateContentVariant,
      expected: condition === 'valid' ? 1 : 0, cacheMs: stats.cacheMs, extractMs: stats.extractMs, bakeMs: stats.bakeMs,
      staleVersionWritten: condition === 'stale' ? 7 : null }
    row.renderer = w.renderer
    row.hardware = deriveHardwareGl(w.renderer.backend)
    row.tierBefore = w.mechanical.tier
    row.budgets.navigation = { observedMs: row.navigationToFullyReadyMs, ceilingMs: condition === 'valid' ? 10000 : 15000 }
    row.budgets.bake = { observedMs: stats.bakeMs, ceilingMs: condition === 'valid' ? 4000 : 8000 }
    const initEvents = row.initial.events
    row.shaderCpu = { initialBlockingMs: initEvents.reduce((n, e) => n + e.end - e.start, 0),
      initialObservedWallMs: initEvents.length ? initEvents.at(-1).end - initEvents[0].start : null,
      method: 'Wrapped compileShader/linkProgram synchronous CPU calls; neither GPU completion nor isolated preparation wall span' }
    row.unverified.push('Exact initial shader preparation completion <=3s; only CPU call durations observed')
    row.unverified.push('Rig consolidation, snapshot, cache decode, Troika/font and upload spans not independently exposed; aggregate cacheMs/extractMs/bakeMs and ResourceTiming retained')
    const before = await page.evaluate(() => ({ at: performance.now(), eventIndex: window.__acStartup.events.length }))
    await page.evaluate(() => scrollTo(0, window.__torqueNarrative.scrollFraction(.815) * (document.documentElement.scrollHeight - innerHeight)))
    await page.waitForFunction(() => window.__torqueWorld.snapshot().inspection.ready, null, { timeout: 30000 })
    row.inspection = await page.evaluate(before => {
      const at = performance.now()
      const resources = performance.getEntriesByType('resource').map(r => r.toJSON())
      const asset = resources.filter(r => /input.?shaft|knurling|cutter|shaft.*glb/i.test(r.name)).sort((a, b) => b.responseEnd - a.responseEnd)[0]
      return { at, triggerToReadyMs: at - before.at, fetchBodyCompleteToReadyUpperBoundMs: asset ? at - asset.responseEnd : null,
        sourceResource: asset?.name ?? null, events: window.__acStartup.events.slice(before.eventIndex), resources }
    }, before)
    row.tierAfter = await page.evaluate(() => window.__torqueWorld.snapshot().mechanical.tier)
    row.unverified.push('Exact selected-inspection decode/parse->ready <=3s and shader preparation <=1.5s; trigger and resource-body->ready upper bounds are retained, not substituted')
    row.refresh = await page.evaluate(() => new Promise(resolve => { const a = []; let last; const start = performance.now(); function f(t) { if (last != null) a.push(t-last); last=t; if(t-start>=1000) resolve(a); else requestAnimationFrame(f) } requestAnimationFrame(f) }))
    row.passObservableBudgets = Object.values(row.budgets).every(b => Number.isFinite(b.observedMs) && b.observedMs <= b.ceilingMs)
      && row.hardware.hardwareGL && row.tierBefore === 'full' && row.tierAfter === 'full'
      && row.routeHits > 0 && row.cache.basePrecomputed === row.cache.expected && row.errors.length === 0 && !row.initial.truncated
    row.status = row.passObservableBudgets ? 'UNVERIFIED' : 'FAIL'
  } catch (e) { row.status = 'FAIL'; row.exception = String(e.stack) }
  finally { row.powerAfter = power(); if (!row.powerAfter.PowerOnline || row.powerAfter.Discharging) { row.status = 'FAIL'; row.errors.push('Native AC changed') } await context.close() }
  result.trials.push(row)
  console.log(`${condition}/R${index}: ${row.status} navigation=${row.navigationToFullyReadyMs?.toFixed(1)}ms bake=${row.cache?.bakeMs?.toFixed(1)}ms`)
  writeFileSync(args.out, JSON.stringify(result, null, 2))
  return row
}
try {
  const retryPlan = []
  for (const condition of ['valid', 'missing', 'stale']) {
    const r = await trial(condition, 1)
    const near = Object.values(r.budgets).some(b => Number.isFinite(b.observedMs) && b.observedMs >= .9*b.ceilingMs && b.observedMs <= b.ceilingMs)
    if (r.status === 'FAIL' || near) retryPlan.push({ condition, count: near ? 2 : 1 })
  }
  for (const r of retryPlan) for (let i = 2; i < 2+r.count; i++) await trial(r.condition, i)
  for (const target of resolveServedTargets(build)) {
    const response = await browser.newContext().then(async c => { try { const r = await c.request.get(origin + target.pathname); return { status: r.status(), bytes: await r.body() } } finally { await c.close() } })
    result.servedIdentity.push({ role: target.role, status: response.status, servedSha256: hash(response.bytes), buildSha256: hash(readFileSync(build + '/' + target.localRelative)), matched: hash(response.bytes) === hash(readFileSync(build + '/' + target.localRelative)) })
  }
  result.status = result.trials.some(r => r.status === 'FAIL') || result.servedIdentity.some(r => !r.matched) ? 'FAIL' : 'UNVERIFIED'
} catch (e) { result.status = 'FAIL'; result.exception = String(e.stack) }
finally { await browser.close(); result.finishedAt = new Date().toISOString(); writeFileSync(args.out, JSON.stringify(result, null, 2)); console.log(result.status + ' ' + args.out); process.exitCode = result.status === 'FAIL' ? 1 : 10 }
