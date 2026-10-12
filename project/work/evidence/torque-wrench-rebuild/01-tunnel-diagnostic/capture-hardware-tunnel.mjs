// Evidence only. Parent runs this after review; qualityLock proves a LOOK, never natural tier/performance.
import { chromium } from 'playwright'
import { launchConfig } from '../../../../../scripts/lib/browser-launch.mjs'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { gunzipSync } from 'node:zlib'

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../../..')
const outputArg = process.argv.find(a => a.startsWith('--out='))?.slice(6)
if (outputArg && !path.isAbsolute(outputArg)) throw new Error('--out must be absolute')
const out = outputArg ? path.resolve(outputArg) : path.join(here, 'full'), phases = [.84, .86, .90, .94, .98], viewport = { width: 1440, height: 900 }
const url = new URL(process.argv.find(a => a.startsWith('--url='))?.slice(6) ?? 'http://localhost:5199/')
url.searchParams.set('qualityLock', '1')
const stamp = () => new Date().toISOString(), sha = b => createHash('sha256').update(b).digest('hex')
const json = (file, data) => fs.writeFileSync(path.join(out, file), JSON.stringify(data, null, 2) + '\n')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const state = () => ({ branch: git('branch', '--show-current'), head: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain=v1'), diffSha256: sha(git('diff', 'HEAD', '--binary')) })
const hashFile = relative => { try { const b = fs.readFileSync(path.resolve(root, relative)); return { path: relative, size: b.length, sha256: sha(b) } } catch (e) { return { path: relative, unavailable: String(e) } } }
fs.mkdirSync(out, { recursive: true })
// Refuse to overwrite an earlier diagnostic packet; parent can explicitly choose a fresh evidence folder later.
if (fs.readdirSync(out).length) throw new Error(`Output directory must be empty: ${out}`)
const sourcePaths = ['scripts/capture-owner-revisions.mjs', 'scripts/lib/browser-launch.mjs', 'src/scene/drawing/sheet/portal.ts', 'src/scene/drawing/DrawingLinework.tsx', 'src/scene/SceneCanvas.tsx', 'src/scene/CameraRig.tsx', 'src/state/qualityStore.ts', 'src/state/scrollStore.ts']
const evidenceBase = 'project/work/evidence/JG-035-opening-drafting-table/'
const comparison = [evidenceBase + 'blue-trace-tunnel-2026-10-03/concept-media/03-deep-tunnel-feedback.png', evidenceBase + 'owner-revisions-2026-10-07/after-o1b/opening-desktop-t0p9.png']
const manifest = { started: stamp(), root, url: url.href, runtimeMode: 'dev expected; served response hashes are authoritative', query: Object.fromEntries(url.searchParams), viewport, dpr: 1, phases, git: state(), launch: launchConfig(), node: process.version, process: { pid: process.pid, arch: process.arch, versions: process.versions }, device: { platform: os.platform(), release: os.release(), hostname: os.hostname(), memory: os.totalmem(), cpus: os.cpus() }, files: [...sourcePaths, path.relative(root, fileURLToPath(import.meta.url)), ...comparison].map(hashFile) }
try { manifest.device.windows = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-Command', '$d = @{ computer = Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model; gpu = @(Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion,PNPDeviceID); os = Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber }; $d | ConvertTo-Json -Depth 5'], { encoding: 'utf8' })) } catch (e) { manifest.device.windowsUnavailable = String(e) }
json('manifest.json', manifest)
const report = { manifest: { file: 'manifest.json', sha256: sha(fs.readFileSync(path.join(out, 'manifest.json'))) }, started: manifest.started, captures: [], resources: [], errors: [], limitations: ['qualityLock=1 is a full-quality look diagnostic, not natural tier selection or sustained performance evidence.', 'Renderer wrapping, polling, body hashing and screenshots add instrumentation overhead; render intervals are observations, not benchmark FPS.', 'Each attempt uses a fresh context; this packet does not measure continuous traversal.', 'Visual comparison and motion research remain parent/owner work.'] }
const persist = () => json('report.json', report)
persist()
let browser, seat, requestId = 0
const bounded = async (promise, ms, label) => { let timer; try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms) })]) } finally { clearTimeout(timer) } }
const networkUrl = value => /^https?:/i.test(value)
function localResource(value) {
  const u = new URL(value)
  if (u.origin !== url.origin || !networkUrl(value)) return null
  const name = decodeURIComponent(u.pathname), candidate = name.startsWith('/@fs/') ? path.resolve(name.slice(5)) : path.resolve(root, name.replace(/^\//, ''))
  for (const file of [path.resolve(root, 'public', name.replace(/^\//, '')), candidate]) {
    const relative = path.relative(root, file)
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return { ...hashFile(relative), staticPublic: file.startsWith(path.join(root, 'public') + path.sep) }
  }
  return null
}
async function hashResponse(response, entry, s) {
  try { const b = await bounded(response.body(), 10000, 'original response.body'); Object.assign(entry, { size: b.length, sha256: sha(b), source: 'original-response body' }); return } catch (e) { entry.originalBodyUnavailable = String(e) }
  const originalLocal = entry.localBefore
  if (!originalLocal?.sha256 || !networkUrl(entry.url) || new URL(entry.url).origin !== url.origin) { entry.hashUnavailable = 'No same-origin immutable local source for refetch'; return }
  try {
    const until = Date.now() + 10000
    while (!s.finished.has(response.request()) && Date.now() < until) await new Promise(r => setTimeout(r, 50))
    if (!s.finished.has(response.request())) throw new Error('Actual request did not finish; refetch prohibited')
    const before = hashFile(originalLocal.path), controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10000)
    let fetched, body
    try { fetched = await fetch(entry.url, { signal: controller.signal, cache: 'no-store', redirect: 'error' }); body = Buffer.from(await fetched.arrayBuffer()) } finally { clearTimeout(timer) }
    const after = hashFile(originalLocal.path), headers = Object.fromEntries(fetched.headers)
    entry.refetch = { source: 'same-URL refetch', at: stamp(), status: fetched.status, headers, size: body.length, sha256: sha(body), localBefore: before, localAfter: after }
    const stable = before.sha256 === originalLocal.sha256 && after.sha256 === originalLocal.sha256
    const guardHeaders = ['etag', 'content-length'].map(key => ({ key, original: entry.headers[key] ?? null, refetch: headers[key] ?? null, same: !entry.headers[key] || entry.headers[key] === headers[key] }))
    // Node fetch returns decoded entity bytes; compare like representations when Vite
    // serves a .gz cache with Content-Encoding:gzip. Keep wire-file identity separately.
    const encoding = headers['content-encoding']?.toLowerCase() ?? 'identity'
    const localWire = originalLocal.staticPublic ? fs.readFileSync(path.resolve(root, originalLocal.path)) : null
    const localEntity = localWire && encoding === 'gzip' ? gunzipSync(localWire) : localWire
    entry.refetch.comparisonRepresentation = { encoding, body: 'decoded entity', localWireSha256: originalLocal.sha256, localEntitySha256: localEntity ? sha(localEntity) : null, localEntitySize: localEntity?.length ?? null }
    entry.refetch.guard = { localUnchanged: stable, headers: guardHeaders, samePublicBytes: !originalLocal.staticPublic || sha(body) === sha(localEntity) }
    if (!fetched.ok || !stable || guardHeaders.some(h => !h.same) || !entry.refetch.guard.samePublicBytes || (!originalLocal.staticPublic && !guardHeaders.some(h => h.original && h.refetch && h.same))) throw new Error('Same-URL identity guard failed')
    Object.assign(entry, { size: body.length, sha256: sha(body), source: 'same-URL refetch (original inspector body unavailable)' })
  } catch (e) { entry.hashUnavailable = String(e) }
}
async function drain(s) {
  const deadline = Date.now() + 30000
  while ((s.pending.size || s.inflight.size) && Date.now() < deadline) await Promise.race([Promise.allSettled([...s.pending]), new Promise(r => setTimeout(r, 100))]).then(() => new Promise(r => setTimeout(r, 20)))
  s.attempt.resourceDrain = { pending: s.pending.size, inflight: [...s.inflight.values()], complete: !s.pending.size && !s.inflight.size }
}
async function open(attempt) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block' })
  seat = { context, page: await context.newPage(), pending: new Set(), inflight: new Map(), finished: new Set(), sources: new Map(), attempt }
  const s = seat, page = s.page
  page.on('console', m => { if (m.type() === 'error') attempt.errors.push({ at: stamp(), kind: 'console', text: m.text() }) })
  page.on('pageerror', e => attempt.errors.push({ at: stamp(), kind: 'pageerror', text: String(e) }))
  page.on('crash', () => attempt.errors.push({ at: stamp(), kind: 'crash' }))
  page.on('request', r => { if (networkUrl(r.url())) { s.inflight.set(r, { url: r.url(), method: r.method(), type: r.resourceType() }); s.sources.set(r, localResource(r.url())) } else report.resources.push({ id: ++requestId, checkpoint: attempt.phase, attempt: attempt.number, url: r.url(), type: r.resourceType(), internal: true, source: 'internal/transient transport', identityUnavailable: 'Creator/source not exposed; blob/data worker transport is not a network asset', parentDocument: page.url(), candidateParentResourceIds: report.resources.filter(e => /draco|three|stdlib/i.test(e.url) && !e.internal).map(e => e.id) }) })
  page.on('requestfinished', r => { s.inflight.delete(r); s.finished.add(r) })
  page.on('requestfailed', r => { s.inflight.delete(r); if (networkUrl(r.url())) attempt.errors.push({ at: stamp(), kind: 'requestfailed', url: r.url(), failure: r.failure() }); else report.resources.push({ id: ++requestId, internal: true, url: r.url(), source: 'internal/transient transport failure', failure: r.failure() }) })
  page.on('response', response => {
    if (!networkUrl(response.url())) return
    const entry = { id: ++requestId, checkpoint: attempt.phase, attempt: attempt.number, at: stamp(), requestUrl: response.request().url(), url: response.url(), method: response.request().method(), type: response.request().resourceType(), status: response.status(), fromServiceWorker: response.fromServiceWorker(), headers: response.headers() }
    entry.localBefore = s.sources.get(response.request()) ?? null
    report.resources.push(entry)
    const job = hashResponse(response, entry, s).catch(e => { entry.hashUnavailable = String(e) })
    s.pending.add(job); job.finally(() => s.pending.delete(job))
    if (response.status() >= 400) attempt.errors.push({ at: stamp(), kind: 'http', url: entry.url, status: entry.status })
  })
  await page.addInitScript(() => {
    window.__tunnelContextEvents = []
    const handlers = ['webglcontextlost', 'webglcontextrestored', 'webglcontextcreationerror'].map(type => { const handler = e => window.__tunnelContextEvents.push({ type, at: performance.now(), message: e.statusMessage ?? null }); document.addEventListener(type, handler, true); return [type, handler] })
    window.__tunnelRestoreEvents = () => { for (const [type, handler] of handlers) document.removeEventListener(type, handler, true); delete window.__tunnelRestoreEvents }
  })
  await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 240000 })
  attempt.actualUrl = page.url()
  await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady && window.__threeRenderer && window.__telemetry?.performance?.warmReady !== false, null, { timeout: 240000 })
  await page.evaluate(() => {
    const r = window.__threeRenderer, c = r.domElement, g = r.getContext(), descriptor = Object.getOwnPropertyDescriptor(r, 'render'), original = r.render
    const probe = { renderer: r, canvas: c, context: g, calls: 0, sceneCalls: 0, intervals: [], last: null, lastRendered: null }
    r.render = function (...args) {
      const result = original.apply(this, args)
      if (!g.isContextLost()) {
        probe.calls++; probe.lastRendered = performance.now()
        if (args[0] === window.__threeScene) { probe.sceneCalls++; if (probe.last !== null) { probe.intervals.push(probe.lastRendered - probe.last); if (probe.intervals.length > 120) probe.intervals.shift() } probe.last = probe.lastRendered }
      }
      return result
    }
    probe.restore = () => { if (descriptor) Object.defineProperty(r, 'render', descriptor); else delete r.render }
    window.__tunnelProbe = probe
  })
  return s
}
async function close(s) {
  if (!s) return
  try { await bounded(s.page.evaluate(() => { window.__tunnelProbe?.restore(); window.__drawingProof?.release(); window.__tunnelRestoreEvents?.(); delete window.__tunnelProbe }), 5000, 'restore') ; s.attempt.restored = true } catch (e) { s.attempt.restoreUnavailable = String(e) }
  await drain(s)
  await bounded(s.context.close(), 10000, 'context close')
  await bounded(Promise.allSettled([...s.pending]), 10000, 'remaining body handlers')
  seat = null
}
const sample = page => page.evaluate(() => {
  const p = window.__tunnelProbe, r = window.__threeRenderer, c = r?.domElement, g = r?.getContext(), ext = g?.getExtension('WEBGL_debug_renderer_info'), rect = c?.getBoundingClientRect()
  let visible = !!c?.isConnected && !!rect && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight
  for (let n = c; n; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) visible = false }
  const scene = window.__threeScene, portal = []
  scene?.traverse(o => { for (const m of (Array.isArray(o.material) ? o.material : [o.material])) if (m?.uniforms?.uPortalLite) portal.push({ object: o.name, uuid: o.uuid, lite: m.uniforms.uPortalLite.value, visible: o.visible }) })
  const telemetry = window.__telemetry, camera = window.__threeCamera, t = telemetry?.camera, pos = camera?.position.toArray(), goal = t?.goal
  const positionResidual = pos && goal?.position ? Math.hypot(...pos.map((v, i) => v - goal.position[i])) : null
  const fovResidual = camera && Number.isFinite(goal?.fov) ? Math.abs(camera.fov - goal.fov) : null
  let orientationResidual = null
  if (camera && goal?.target) { const desired = camera.clone(); desired.lookAt(...goal.target); orientationResidual = camera.quaternion.angleTo(desired.quaternion) }
  return { at: new Date().toISOString(), clock: performance.now(), url: location.href, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], qualityLock: new URLSearchParams(location.search).get('qualityLock'), tier: telemetry?.performance?.tier ?? null, phase: telemetry?.drawing?.phase ?? null, progress: telemetry?.scroll?.progress ?? null, pin: window.__drawingProofProgress ?? null, proofReady: !!window.__drawingProof?.ready, canvas: { attached: !!c?.isConnected, visible, size: c ? [c.width, c.height] : null, rect: rect?.toJSON(), same: r === p?.renderer && c === p?.canvas && g === p?.context }, contextAlive: !!g && !g.isContextLost(), renderer: ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null, vendor: ext ? g.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null, glVersion: g?.getParameter(g.VERSION), contextEvents: window.__tunnelContextEvents ?? [], render: { calls: p?.calls ?? 0, sceneCalls: p?.sceneCalls ?? 0, infoFrame: r?.info?.render?.frame ?? null, info: r?.info?.render, lastRendered: p?.lastRendered, intervalsMs: p?.intervals ?? [] }, portal: { exposure: scene ? 'live __threeScene traversal' : 'unavailable: scene hook missing', uniforms: portal, unavailable: !portal.length }, camera: { position: pos ?? null, fov: camera?.fov ?? null, quaternion: camera?.quaternion.toArray() ?? null, goal: goal ?? null, up: t?.up ?? null, target: 'actual look target not exposed; quaternion residual uses goal target', positionResidual, fovResidual, orientationResidual }, drawing: telemetry?.drawing ?? null, performance: telemetry?.performance ?? null, sheetStats: window.__drawingProof?.sheetStats?.() ?? null }
})
function validate(s, phase) {
  const failures = [], renderer = s.renderer ?? '', software = /swiftshader|warp|software|llvmpipe|lavapipe|softpipe|basic render|microsoft|mesa|virtual|remote/i
  const backend = renderer.match(/Direct3D\d+|D3D\d+|OpenGL|Vulkan|Metal/i)?.[0] ?? null
  const hardware = !!s.vendor && !software.test(renderer) && /NVIDIA|AMD|ATI|Radeon|Intel|Qualcomm|Adreno|Apple/i.test(renderer) && !!backend
  s.hardware = { accepted: hardware, namedAdapter: hardware ? renderer : null, backend, attribution: 'unmasked active renderer; launch flags alone are not evidence' }
  if (!hardware) failures.push('hardware attribution missing/software/ambiguous')
  if (!s.contextAlive || s.contextEvents.length) failures.push('context not alive or context-loss/restoration/error span')
  if (!s.canvas.same || !s.canvas.attached || !s.canvas.visible || !s.canvas.size?.every(n => n > 0)) failures.push('canvas replaced/detached/hidden/zero')
  if (s.tier !== 'full' || s.qualityLock !== '1') failures.push('effective tier not full or lock missing')
  if (s.dpr !== 1 || s.viewport[0] !== 1440 || s.viewport[1] !== 900) failures.push('viewport/DPR mismatch')
  if (!s.proofReady || !Number.isFinite(s.phase) || Math.abs(s.phase - phase) > 1e-6 || !Number.isFinite(s.pin) || Math.abs(s.pin - phase * .12) > 1e-6 || !Number.isFinite(s.progress) || Math.abs(s.progress - phase * .12) > 1e-6) failures.push('phase/progress/pin mismatch')
  if (s.portal.uniforms.some(u => u.lite !== 0)) failures.push('live portal uses lite shading')
  return failures
}
async function capture(s, attempt) {
  const page = s.page, phase = attempt.phase
  await page.evaluate(progress => window.__drawingProof.setProgress(progress), phase * .12)
  await page.waitForFunction(t => Number.isFinite(window.__telemetry?.drawing?.phase) && Math.abs(window.__telemetry.drawing.phase - t) < 1e-6, phase, { timeout: 20000 })
  const start = await sample(page); attempt.start = start
  const deadline = Date.now() + 20000, history = []; let previous = start, stable = 0, converged = false
  while (Date.now() < deadline) {
    await page.waitForFunction(n => window.__tunnelProbe?.calls > n, previous.render.calls, { timeout: Math.max(1, Math.min(5000, deadline - Date.now())) })
    const current = await sample(page), failures = validate(current, phase)
    const motionDelta = current.camera.position && previous.camera.position ? Math.hypot(...current.camera.position.map((v, i) => v - previous.camera.position[i])) : null
    history.push({ elapsedMs: current.clock - start.clock, calls: current.render.calls, infoFrame: current.render.infoFrame, phase: current.phase, pin: current.pin, positionResidual: current.camera.positionResidual, fovResidual: current.camera.fovResidual, orientationResidual: current.camera.orientationResidual, motionDelta })
    attempt.history = history.length <= 20 ? [...history] : Array.from({ length: 20 }, (_, i) => history[Math.round(i * (history.length - 1) / 19)])
    attempt.last = current
    if (failures.length) throw new Error(failures.join('; '))
    stable = current.camera.positionResidual !== null && current.camera.positionResidual < .00005 && current.camera.fovResidual !== null && current.camera.fovResidual < .005 ? stable + 1 : 0
    previous = current
    if (stable >= 3 && history.length >= 10) { converged = true; break }
    await page.waitForTimeout(100)
  }
  attempt.settle = { converged, boundMs: 20000, elapsedMs: previous.clock - start.clock, label: converged ? 'position/FOV converged' : 'unconverged; residuals retained', thresholds: { position: .00005, fov: .005 }, orientationGated: false }
  attempt.before = await sample(page)
  let failures = validate(attempt.before, phase)
  if (attempt.before.render.calls <= start.render.calls || (attempt.before.render.sceneCalls <= start.render.sceneCalls && !attempt.before.portal.unavailable)) failures.push('no fresh actual scene render during settling')
  if (failures.length) throw new Error(failures.join('; '))
  const pngStarted = stamp(), buffer = await page.screenshot({ type: 'png', fullPage: false, timeout: 30000 })
  attempt.pngCandidate = { started: pngStarted, finished: stamp(), size: buffer.length, sha256: sha(buffer) }
  await page.waitForFunction(n => window.__tunnelProbe?.calls > n, attempt.before.render.calls, { timeout: 5000 })
  attempt.after = await sample(page)
  failures = validate(attempt.after, phase)
  if (attempt.after.render.calls <= attempt.before.render.calls || (attempt.after.render.sceneCalls <= attempt.before.render.sceneCalls && !attempt.after.portal.unavailable)) failures.push('no fresh actual scene render across PNG bracket')
  await drain(s)
  if (!attempt.resourceDrain.complete) failures.push('resource handlers did not drain')
  attempt.finalTelemetry = await sample(page)
  failures.push(...validate(attempt.finalTelemetry, phase))
  attempt.resources = report.resources.filter(r => r.checkpoint === phase && r.attempt === attempt.number).map(r => r.id)
  for (const r of report.resources.filter(r => attempt.resources.includes(r.id) && r.localBefore)) { r.localAfter = hashFile(r.localBefore.path); if (r.localAfter.sha256 !== r.localBefore.sha256) failures.push(`Loaded local source changed: ${r.url}`) }
  if (report.resources.some(r => attempt.resources.includes(r.id) && !r.internal && r.status >= 200 && r.status < 300 && !r.sha256)) failures.push('loaded HTTP resource identity unavailable')
  if (attempt.errors.length) failures.push('console/page/context/request/HTTP errors recorded')
  if (failures.length) throw new Error(failures.join('; '))
  const file = `opening-desktop-t${String(phase).replace('.', 'p')}.png`
  fs.writeFileSync(path.join(out, file), buffer)
  attempt.png = { file, ...attempt.pngCandidate }; attempt.status = 'accepted-conditions'
}
try {
  if (process.platform !== 'win32') throw new Error('Windows hardware capture required; shared helper uses software GL elsewhere')
  if (manifest.git.branch !== 'torque-wrench/rebuild') throw new Error('Expected torque-wrench/rebuild worktree branch')
  browser = await chromium.launch({ ...manifest.launch, timeout: 30000 })
  report.browserVersion = browser.version()
  persist()
  let cdp
  try { cdp = await bounded(browser.newBrowserCDPSession(), 10000, 'optional CDP session'); report.browserDevice = await bounded(cdp.send('SystemInfo.getInfo'), 10000, 'optional SystemInfo') } catch (e) { report.browserDeviceUnavailable = String(e) }
  finally { if (cdp) { try { await bounded(cdp.detach(), 2000, 'optional CDP detach') } catch (e) { report.cdpDetachUnavailable = String(e) } } }
  for (const phase of phases) {
    const checkpoint = { phase, requestedProgress: phase * .12, json: `checkpoint-${phase}.json`, manifest: report.manifest, runtimeResources: 'report.json resources (IDs recorded per attempt)', attempts: [] }
    report.captures.push(checkpoint)
    persist()
    for (let number = 1; number <= 2; number++) {
      const attempt = { phase, number, started: stamp(), errors: [], status: 'running' }; checkpoint.attempts.push(attempt)
      json(checkpoint.json, checkpoint); persist()
      try { await capture(await open(attempt), attempt) } catch (e) { attempt.status = 'rejected'; attempt.failure = String(e); if (seat) { try { attempt.failureTelemetry = await sample(seat.page) } catch (probeError) { attempt.telemetryUnavailable = String(probeError) } } }
      finally { try { await close(seat) } catch (e) { attempt.cleanupError = String(e); attempt.status = 'rejected' } attempt.finished = stamp(); json(checkpoint.json, checkpoint); persist() }
      if (attempt.cleanupError) throw new Error('Cleanup failed; no new GPU context may be opened')
      if (attempt.status === 'accepted-conditions') break
    }
    checkpoint.status = checkpoint.attempts.some(a => a.status === 'accepted-conditions') ? 'captured' : 'failed'
    json(checkpoint.json, checkpoint); persist()
  }
} catch (e) { report.errors.push({ at: stamp(), error: String(e) }) }
finally {
  try { await close(seat) } catch (e) { report.errors.push({ at: stamp(), cleanupError: String(e) }) }
  try { if (browser) await bounded(browser.close(), 10000, 'browser close') } catch (e) { report.errors.push({ at: stamp(), cleanupError: String(e) }) }
  report.finished = stamp(); report.gitAfter = state(); report.cpuUsage = process.cpuUsage(); report.processMemory = process.memoryUsage()
  report.success = report.errors.length === 0 && report.captures.length === 5 && report.captures.every(c => c.status === 'captured')
  report.defaultGlbResponses = report.resources.filter(r => /\/models\/Default\.glb(?:\?|$)/.test(r.url)).map(r => ({ id: r.id, size: r.size, sha256: r.sha256, source: r.source, originalBodyUnavailable: r.originalBodyUnavailable, hashUnavailable: r.hashUnavailable }))
  if (!report.defaultGlbResponses.length || report.defaultGlbResponses.some(r => !r.sha256)) { report.success = false; report.errors.push({ error: 'Loaded Default.glb body identity unavailable' }) }
  persist(); console.log(JSON.stringify({ success: report.success, captures: report.captures.map(c => ({ phase: c.phase, status: c.status })), report: path.join(out, 'report.json') }, null, 2))
  if (!report.success) process.exitCode = 1
}
