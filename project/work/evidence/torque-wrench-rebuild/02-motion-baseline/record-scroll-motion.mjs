// Evidence only: wheel input, DOM observations, and exposed LOCAL probes. No tuning or clicking.
import { chromium } from 'playwright'
import { launchConfig } from '../../../../../scripts/lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const arg = name => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const traverseIntervalMs = Number(arg('traverse-interval') ?? 350)
if (!Number.isFinite(traverseIntervalMs) || traverseIntervalMs < 16 || traverseIntervalMs > 1000) throw new Error('Expected traversal interval in [16,1000] ms')
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../../..')
const url = new URL(arg('url') ?? 'http://localhost:5199/?qualityLock=1')
const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
if (local) url.searchParams.set('qualityLock', '1')
const out = path.resolve(arg('out') ?? path.join(here, `${local ? 'local' : 'reference'}-${Date.now()}`)), viewport = { width: 1440, height: 900 }
fs.mkdirSync(out, { recursive: true })
if (fs.readdirSync(out).length) throw new Error(`Output must be empty; preserving existing evidence: ${out}`)
const stamp = () => new Date().toISOString(), sha = b => createHash('sha256').update(b).digest('hex')
const json = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 2) + '\n')
const bounded = async (promise, ms, label) => { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms) })]) } finally { clearTimeout(timer) } }
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const raw = { frames: [], observedWheels: [], sentWheels: [] }
const report = { started: stamp(), url: url.href, mode: local ? 'local locked diagnostic' : 'DOM-only reference', viewport, dpr: 1, launch: launchConfig(), process: { node: process.version, versions: process.versions, platform: os.platform(), release: os.release(), cpu: os.cpus()[0]?.model }, git: { head: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'), dirty: git('status', '--porcelain=v1') }, harnessSha256: sha(fs.readFileSync(fileURLToPath(import.meta.url))), errors: [], network: [], scriptEvidence: [], segments: [], pngs: [], limitations: ['Video, per-rAF snapshots, polling and screenshots add overhead; frame intervals are not performance certification.', 'Local qualityLock=1 does not prove natural tier selection or sustained full-tier performance.', 'The fixed slow/fast/reversal wheel profile is nominally identical across sites; adaptive traverse chunks depend on measured document extent.', 'Different layouts and distances are not equivalent screen geometry. Reference samples are DOM-only; script text markers do not prove runtime execution or exact Lenis/GSAP settings.'] }
const persist = () => { json('raw.json', raw); json('report.json', report) }
persist()
let browser, context, page, video, closing, watchdog, deadline = Infinity, activeSegment = 'startup'
const pending = new Set(), inflight = new Map()
const left = () => Math.max(0, deadline - Date.now())
const evaluate = (fn, data) => bounded(page.evaluate(fn, data), Math.max(1, Math.min(5000, left() || 1000)), 'page evaluate')
const closeContext = () => closing ??= context ? context.close() : Promise.resolve()
async function segment(name, action, metadata = {}) {
  if (left() < 2500) { report.segments.push({ name, skipped: 'video time bound' }); return }
  activeSegment = name
  const item = { name, ...metadata, started: stamp(), start: await evaluate(n => { window.__motionSegment = n; return performance.now() }, name) }
  report.segments.push(item)
  try { await action(item) } finally { item.end = await evaluate(() => performance.now()); item.finished = stamp(); persist() }
}
async function wheel(deltaY) {
  if (left() < 2500) return false
  const event = { segment: activeSegment, deltaX: 0, deltaY, sentAt: stamp(), clockBefore: await evaluate(() => performance.now()) }
  raw.sentWheels.push(event)
  await bounded(page.mouse.wheel(0, deltaY), 3000, 'wheel input')
  event.returnedAt = stamp(); return true
}
const pause = ms => page.waitForTimeout(Math.min(ms, left()))
async function still(name) {
  if (left() < 2500) { report.pngs.push({ name, skipped: 'video time bound' }); return }
  const file = `${name}.png`, at = await evaluate(() => ({ clock: performance.now(), scrollY, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }))
  const b = await page.screenshot({ type: 'png', fullPage: false, timeout: Math.min(5000, left()) })
  fs.writeFileSync(path.join(out, file), b)
  report.pngs.push({ file, at, size: b.length, sha256: sha(b) })
}
async function renderer() {
  return evaluate(isLocal => {
    const r = isLocal ? window.__threeRenderer : null, g = r?.getContext(), ext = g?.getExtension('WEBGL_debug_renderer_info')
    return { at: performance.now(), url: location.href, title: document.title, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, documentHeight: document.documentElement.scrollHeight, scrollY, canvases: [...document.querySelectorAll('canvas')].map(c => ({ attached: c.isConnected, size: [c.width, c.height], rect: c.getBoundingClientRect().toJSON(), display: getComputedStyle(c).display })), internalProbe: isLocal ? 'explicit local hooks only' : 'unavailable by design: DOM-only reference', renderer: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null, vendor: ext ? g.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null, contextAlive: g ? !g.isContextLost() : null, tier: isLocal ? window.__telemetry?.performance?.tier ?? null : null, qualityLock: new URLSearchParams(location.search).get('qualityLock'), scriptUrls: [...document.scripts].map(s => s.src).filter(Boolean) }
  }, local)
}
async function traverse(target, item) {
  const until = Date.now() + Math.min(24000, Math.max(0, left() - 6000))
  let steps = 0, stalled = 0, previous = null
  while (Date.now() < until && left() > 6000) {
    const measure = await evaluate(() => ({ y: scrollY, height: document.documentElement.scrollHeight, viewport: innerHeight, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }))
    const distance = measure.max * target - measure.y
    item.lastMeasured = measure
    if (!measure.max || Math.abs(distance) < Math.max(25, measure.max * .005)) break
    stalled = previous !== null && Math.abs(measure.y - previous) < .5 ? stalled + 1 : 0
    if (stalled >= 8) { item.stalled = true; break }
    previous = measure.y
    // Distinct measured-traverse segment: adaptive chunks, never a proof-hook seek.
    const delta = Math.sign(distance) * Math.min(3200, Math.max(120, Math.abs(distance) * .35))
    item.traverseIntervalMs = traverseIntervalMs
    await wheel(delta); steps++; await pause(traverseIntervalMs)
  }
  await pause(2000)
  item.final = await evaluate(() => ({ y: scrollY, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }))
  item.steps = steps; item.targetFraction = target; item.observedFraction = item.final.max ? item.final.y / item.final.max : null
  item.reached = item.observedFraction !== null && Math.abs(item.observedFraction - target) < .02
}
const percentile = (values, p) => { const a = values.filter(Number.isFinite).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.ceil(a.length * p) - 1)] : null }
function metrics(item) {
  const frames = raw.frames.filter(f => f.segment === item.name), first = frames[0], last = frames.at(-1)
  const wheels = raw.observedWheels.filter(w => w.segment === item.name), lastInput = raw.observedWheels.filter(w => w.clock <= (last?.clock ?? -1)).at(-1)
  let restStart = null, timeToRestMs = null
  for (const f of frames) {
    if (!lastInput || f.clock < lastInput.clock) continue
    if (Math.abs(f.scrollDelta ?? Infinity) > .5) restStart = null
    else { restStart ??= f.clock; if (f.clock - restStart >= 300) { timeToRestMs = Math.max(0, restStart - lastInput.clock); break } }
  }
  const max = key => { const a = frames.map(f => f[key]).filter(Number.isFinite); return a.length ? Math.max(...a) : null }
  return { samples: frames.length, durationMs: first && last ? last.clock - first.clock : null, scrollDisplacement: first && last ? last.scrollY - first.scrollY : null, lastWheelClock: lastInput?.clock ?? null, timeToRestMs, restDefinition: 'scroll delta <=0.5px/frame for >=300ms after last observed wheel; null means unavailable/unrested within segment', observedWheels: wheels.length, wheelDeltaY: wheels.reduce((n, w) => n + w.deltaY, 0), p50FrameIntervalMs: percentile(frames.map(f => f.intervalMs), .5), p95FrameIntervalMs: percentile(frames.map(f => f.intervalMs), .95), maxScrollFrameDelta: max('absoluteScrollDelta'), maxCameraPositionDelta: max('positionDelta'), maxCameraQuaternionDeltaRad: max('quaternionDelta'), maxCameraFovDelta: max('fovDelta') }
}
try {
  if (process.platform !== 'win32') throw new Error('Installed Windows Chrome required for this baseline')
  browser = await chromium.launch({ ...report.launch, timeout: 20000 }); report.browserVersion = browser.version()
  report.videoStarted = stamp(); deadline = Date.now() + 85000
  watchdog = setTimeout(() => { report.videoBudgetExpired = true; void closeContext().catch(e => report.errors.push({ kind: 'budget-close', error: String(e) })) }, 90000)
  context = await bounded(browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block', recordVideo: { dir: path.join(out, 'video'), size: viewport } }), 10000, 'video context')
  page = await bounded(context.newPage(), 5000, 'new page'); video = page.video()
  await page.exposeBinding('__motionBatch', (_, batch) => { raw.frames.push(...batch.frames); raw.observedWheels.push(...batch.wheels) })
  page.on('pageerror', e => report.errors.push({ at: stamp(), kind: 'pageerror', error: String(e) }))
  page.on('console', m => { if (m.type() === 'error') report.errors.push({ at: stamp(), kind: 'console', error: m.text() }) })
  page.on('crash', () => report.errors.push({ at: stamp(), kind: 'crash' }))
  page.on('request', r => { if (/^https?:/.test(r.url())) inflight.set(r, r.url()) })
  page.on('requestfinished', r => inflight.delete(r))
  page.on('requestfailed', r => { inflight.delete(r); report.errors.push({ at: stamp(), kind: 'requestfailed', url: r.url(), failure: r.failure() }) })
  page.on('response', r => {
    const entry = { at: stamp(), url: r.url(), type: r.request().resourceType(), status: r.status() }; report.network.push(entry)
    if (r.status() >= 400) report.errors.push({ kind: 'http', ...entry })
    if (entry.type !== 'script' || !/^https?:/.test(entry.url)) return
    const job = (async () => { const evidence = { url: entry.url, status: entry.status, markers: [] }; report.scriptEvidence.push(evidence)
      try { const body = await bounded(r.body(), 5000, 'script marker read'); evidence.size = body.length; const text = body.toString('utf8'); for (const marker of ['Lenis', 'gsap', 'ScrollTrigger']) { const at = text.toLowerCase().indexOf(marker.toLowerCase()); if (at >= 0) evidence.markers.push({ marker, excerpt: text.slice(Math.max(0, at - 35), at + 65), meaning: 'literal text in a loaded script; settings and execution not inferred' }) } } catch (e) { evidence.markerReadUnavailable = String(e) }
    })(); pending.add(job); job.finally(() => pending.delete(job))
  })
  await page.addInitScript(({ local }) => {
    let frames = [], wheels = [], previous = null, raf, count = 0, active = true
    window.__motionSegment = 'startup'; window.__motionContextEvents = []
    const flush = () => { const batch = { frames, wheels }; frames = []; wheels = []; return window.__motionBatch(batch) }
    const onWheel = e => wheels.push({ clock: performance.now(), segment: window.__motionSegment, deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, trusted: e.isTrusted })
    const onContext = e => window.__motionContextEvents.push({ type: e.type, clock: performance.now() })
    document.addEventListener('wheel', onWheel, { capture: true, passive: true })
    for (const type of ['webglcontextlost', 'webglcontextrestored', 'webglcontextcreationerror']) document.addEventListener(type, onContext, true)
    const clone = value => value === undefined ? null : JSON.parse(JSON.stringify(value))
    const tick = clock => {
      if (!active) return
      if (count < 5000) {
        const t = local ? window.__telemetry : null, cam = local ? window.__threeCamera : null, tc = t?.camera
        const position = cam?.position?.toArray() ?? (tc && [tc.x, tc.y, tc.z].every(Number.isFinite) ? [tc.x, tc.y, tc.z] : null)
        const quaternion = cam?.quaternion?.toArray() ?? null, fov = cam?.fov ?? tc?.fov ?? null
        const sample = { clock, segment: window.__motionSegment, scrollY, viewport: [innerWidth, innerHeight], documentHeight: document.documentElement.scrollHeight, max: Math.max(0, document.documentElement.scrollHeight - innerHeight), intervalMs: previous ? clock - previous.clock : null, progress: t?.progress ?? t?.scroll?.progress ?? null, camera: local ? { position, quaternion, fov, telemetry: clone(tc) } : null, rig: local ? clone(t?.rig) : null, tier: t?.performance?.tier ?? null }
        sample.scrollDelta = previous ? scrollY - previous.scrollY : null; sample.absoluteScrollDelta = sample.scrollDelta === null ? null : Math.abs(sample.scrollDelta)
        sample.positionDelta = position && previous?.camera?.position ? Math.hypot(...position.map((v, i) => v - previous.camera.position[i])) : null
        sample.fovDelta = Number.isFinite(fov) && Number.isFinite(previous?.camera?.fov) ? Math.abs(fov - previous.camera.fov) : null
        const q = previous?.camera?.quaternion
        sample.quaternionDelta = q && quaternion ? 2 * Math.acos(Math.min(1, Math.abs(quaternion.reduce((n, v, i) => n + v * q[i], 0)) / (Math.hypot(...q) * Math.hypot(...quaternion)))) : null
        frames.push(sample); previous = sample; count++
        if (frames.length >= 120) flush().catch(() => {})
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.__motionStop = async () => { active = false; cancelAnimationFrame(raf); document.removeEventListener('wheel', onWheel, true); for (const type of ['webglcontextlost', 'webglcontextrestored', 'webglcontextcreationerror']) document.removeEventListener(type, onContext, true); await flush(); return { count, cap: 5000, capped: count >= 5000, contextEvents: window.__motionContextEvents } }
  }, { local })
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: Math.min(30000, left()) })
  report.actualUrl = page.url(); await page.locator('body').waitFor({ state: 'visible', timeout: 5000 })
  if (local) { try { await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady && window.__telemetry?.performance?.warmReady !== false, null, { timeout: Math.min(15000, left()) }) } catch (e) { report.readinessUnavailable = String(e) } }
  else await pause(1500)
  report.before = await renderer()
  await segment('slow-wheel', async () => { for (let i = 0; i < 12 && left() > 6000; i++) { await wheel(120); await pause(180) } }, { nominal: { count: 12, deltaY: 120, intervalMs: 180 } })
  await segment('slow-stop', async () => { await pause(2000); await still('slow-stop') }, { holdMs: 2000 })
  await segment('fast-wheel', async () => { for (let i = 0; i < 4 && left() > 6000; i++) { await wheel(1200); await pause(80) } }, { nominal: { count: 4, deltaY: 1200, intervalMs: 80 } })
  await segment('abrupt-stop', async () => { await pause(2000); await still('abrupt-stop') }, { holdMs: 2000 })
  await segment('reversal', async () => { for (let i = 0; i < 4 && left() > 6000; i++) { await wheel(-1200); await pause(80) } await pause(2000); await still('reversal') }, { nominal: { count: 4, deltaY: -1200, intervalMs: 80 }, holdMs: 2000 })
  await segment('document-forward', async item => { await traverse(.90, item); await still('forward-stop') }, { inputMeasure: true, measuredChunkTraversal: true })
  await segment('document-retrace', async item => { await traverse(.02, item); await still('retrace-stop') }, { inputMeasure: true, measuredChunkTraversal: true })
  report.after = await renderer()
} catch (e) {
  report.errors.push({ at: stamp(), kind: 'run', error: String(e) })
  if (/ffmpeg|video.*executable/i.test(String(e))) report.encoderRequirement = 'Playwright ffmpeg installation required; parent may run npx playwright install ffmpeg. Recorder does not install it.'
} finally {
  if (page && !page.isClosed()) { try { report.sampler = await bounded(page.evaluate(() => window.__motionStop?.()), 3000, 'flush sampler') } catch (e) { report.errors.push({ kind: 'sampler-flush', error: String(e) }) } }
  try { await bounded(closeContext(), 10000, 'close video context'); report.videoStopped = stamp(); if (video) { report.video = { path: await bounded(video.path(), 2000, 'video path'), dimensions: viewport }; report.video.size = fs.statSync(report.video.path).size } } catch (e) { report.errors.push({ kind: 'video-close', error: String(e) }) }
  clearTimeout(watchdog)
  try { if (browser) await bounded(browser.close(), 10000, 'browser close') } catch (e) { report.errors.push({ kind: 'browser-close', error: String(e) }) }
  try { await bounded(Promise.allSettled([...pending]), 6000, 'script marker handlers') } catch (e) { report.errors.push({ kind: 'script-evidence', error: String(e) }) }
  report.inflightAtClose = [...inflight.values()]
  raw.frames.sort((a, b) => a.clock - b.clock); raw.observedWheels.sort((a, b) => a.clock - b.clock)
  for (const item of report.segments) item.metrics = metrics(item)
  report.samples = raw.frames.length; report.finished = stamp(); report.cpuUsage = process.cpuUsage()
  report.completeProfile = report.segments.length === 7 && report.segments.every(s => !s.skipped && (!s.nominal || raw.sentWheels.filter(w => w.segment === s.name && w.returnedAt).length === s.nominal.count)) && report.segments.filter(s => s.measuredChunkTraversal).every(s => s.reached)
  report.recorded = !!report.video?.size && report.samples > 0; report.success = report.recorded && report.completeProfile && !report.videoBudgetExpired && !report.errors.length
  persist(); console.log(JSON.stringify({ success: report.success, recorded: report.recorded, completeProfile: report.completeProfile, samples: report.samples, video: report.video?.path ?? null, report: path.join(out, 'report.json'), errors: report.errors.length }, null, 2))
  if (!report.success) process.exitCode = 1
}
