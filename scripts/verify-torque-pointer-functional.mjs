// JG-038 pointer-functional verifier, canonical invariance scope (contract18 §3 pointer
// roster + §6 invariance limits only).
//
// Interrupted Ohm scope reassigned to the receiving local session under the 2026-10-14
// local-session handoff. Authoring is static only; runtime scheduling stays parent-owned.
//
// Usage:
//   node scripts/verify-torque-pointer-functional.mjs --help
//   node scripts/verify-torque-pointer-functional.mjs --url=http://localhost:5288/torque-wrench/ \
//     --build-dir=.scratch/jg038-integration-20261014-v [--viewport=D|N] [--tier=full|lite] \
//     [--source-report=<evidence-json>] [--out=<new-json>]
//
// Scope (owner-clarified 2026-10-14): prove canonical/camera invariance for CURRENT behavior.
// The product implements no optional pointer dynamics (plan13 §Stage5 lists pointerDynamics.ts
// as optional and unstarted; RuntimeWorld installs no pointer handlers). This harness therefore
// runs the §3 pointer roster (center -> four corners -> center, 500ms per leg, then 5s hold,
// native trusted CDP mouse moves) and gates the §6 invariance limits:
//   projected displacement <= 1% of the shorter viewport dimension
//   angular offset <= 0.5 degrees
//   center return within .8s
//   reading/fracture suppression residual <= 0.25 CSS pixels (drafting = reading roster,
//   breakthrough midpoint = fracture micro-roster)
// and the §6 hold tolerances during the fixed-progress 5s hold (position <= .0001m,
// quaternion angle <= .01 deg, FOV <= .01 deg). Pointer response must not modify canonical
// beat/director state (§6): progress/beatId/stateKey are asserted constant throughout.
//
// Explicit non-claims: no pointer dynamics exist to discriminate, so this is invariance-only
// evidence; any future pointer-dynamics integration requires a §6 offset-discrimination rerun
// (pointer-active vs pointer-absent difference) and must re-derive this preflight basis.
// Touch swipes (§3) stay owned by verify-torque-input-response; 30/15Hz update delivery stays
// owned by the parent update-stress harness; native-controls/.815 restoration and reduced-motion
// media transition are separate parent-verified categories. None are claimed here.

import { createHash } from 'node:crypto'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const EVIDENCE_ROOT = path.join(ROOT, 'project', 'work', 'evidence', 'torque-wrench-rebuild', '08-stage4-opening-recovery')
const SCRATCH_ROOT = path.resolve(ROOT, '.scratch')
const HARNESS_PATH = path.join(HERE, 'verify-torque-pointer-functional.mjs')
const CONTRACT_PATH = path.join(ROOT, 'docs', 'torque-wrench-rebuild', '18-stage0-verification-contract-proposal.md')
const PLAN_PATH = path.join(ROOT, 'docs', 'torque-wrench-rebuild', '13-implementation-plan.md')

const VIEWPORTS = {
  D: { key: 'D', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, label: 'D 1440x900 DPR1 desktop' },
  N: { key: 'N', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, label: 'N 390x844 DPR3 touch/mobile' },
}
const TIERS = ['full', 'lite']
const KNOWN_FLAGS = new Set(['help', 'url', 'out', 'viewport', 'tier', 'build-dir', 'source-report'])
const EXIT = { PASS: 0, FAIL: 1, USAGE: 2, BLOCKED: 10, INTERNAL: 12 }

// Contract §3 pointer roster geometry/timing.
const LEG_MS = 500
const HOLD_MS = 5000
const MOVE_STEPS_PER_LEG = 12
// Contract §6 invariance limits. These are the only numerical pointer limits used.
const PROJECTED_FRACTION = 0.01
const ANGLE_LIMIT_DEG = 0.5
const RETURN_LIMIT_MS = 800
const SUPPRESSION_RESIDUAL_PX = 0.25
// Contract §6 hold tolerances, applied to the fixed-progress 5s hold window.
const HOLD_POSITION_M = 0.0001
const HOLD_ANGLE_DEG = 0.01
const HOLD_FOV_DEG = 0.01
const PROGRESS_EPS = 1e-9
const SEEK_PROGRESS_TOL = 0.001
const TOTAL_SETTLE_LIMIT_MS = 1700
const SETTLE_WAIT_MS = TOTAL_SETTLE_LIMIT_MS + 500
const READY_TIMEOUT_MS = 120000
const CASE_TIMEOUT_MS = 240000
const MAX_PROBE_FRAMES = 16000

const USAGE = [
  'usage: node scripts/verify-torque-pointer-functional.mjs --help',
  '       node scripts/verify-torque-pointer-functional.mjs --url=http://localhost:<port>/torque-wrench/ --build-dir=<scratch-build> [--out=<new-report.json>] [--viewport=D|N] [--tier=full|lite] [--source-report=<evidence-json>]',
  '',
  '--viewport defaults to D. --tier defaults to full.',
  '--source-report optionally binds the parent build/source JSON bytes (read-only); it is not automatically a causality proof.',
  'Default output is a unique guarded JSON file under ' + EVIDENCE_ROOT + '; existing files are never overwritten.',
  'Scope: contract18 §3 pointer roster + §6 invariance limits only. No pointer dynamics exist in the',
  'product; absent optional pointer behavior is an honest non-claim, not a pass.',
  'Not claimed here: touch swipe roster, 30/15Hz update delivery, native-controls/.815 restoration, reduced-motion media transition.',
  'Exit: 0 PASS | 1 FAIL/UNVERIFIED | 2 usage | 10 blocked | 12 report write error.',
]

function usage(message, code = EXIT.USAGE) {
  if (message) console.error('USAGE: ' + message)
  for (const line of USAGE) console.error(line)
  process.exit(code)
}

function parseArgs() {
  if (process.argv.includes('--help')) usage('', EXIT.PASS)
  const args = {}
  for (const raw of process.argv.slice(2)) {
    const value = /^--([a-z][a-z-]*)=(.*)$/i.exec(raw)
    const flag = /^--([a-z][a-z-]*)$/i.exec(raw)
    if (!value && !flag) usage('unknown argument: ' + raw)
    const key = (value || flag)[1].toLowerCase()
    if (!KNOWN_FLAGS.has(key)) usage('unknown flag: --' + key)
    if (args[key] !== undefined) usage('duplicate flag: --' + key)
    args[key] = value ? value[2] : true
  }
  return args
}

function requireValue(args, key) {
  const value = args[key]
  if (typeof value !== 'string' || !value.trim()) usage('--' + key + ' requires a non-empty value')
  return value
}

function validateUrl(raw) {
  let url
  try { url = new URL(raw) } catch (error) { usage('bad --url: ' + error.message) }
  const loopback = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
  if (!/^https?:$/.test(url.protocol)) usage('--url must use http(s)')
  if (!loopback.has(url.hostname)) usage('--url host must be loopback')
  if (url.pathname !== '/torque-wrench' && url.pathname !== '/torque-wrench/') usage('--url path must be /torque-wrench/')
  if (url.search || url.hash) usage('--url must not carry query/hash; the harness adds quality')
  return url
}

function validateBuildDir(raw) {
  const resolved = path.resolve(raw)
  if (resolved !== SCRATCH_ROOT && !resolved.startsWith(SCRATCH_ROOT + path.sep)) usage('--build-dir must resolve inside ' + SCRATCH_ROOT)
  if (!existsSync(resolved)) usage('--build-dir does not exist')
  const real = realpathSync(resolved)
  if (real !== SCRATCH_ROOT && !real.startsWith(SCRATCH_ROOT + path.sep)) usage('--build-dir resolves outside .scratch')
  return resolved
}

function validateOut(raw) {
  const resolved = path.resolve(raw)
  const parent = path.dirname(resolved)
  if (!existsSync(parent)) usage('--out parent does not exist (explicit outputs do not create directories)')
  const realRoot = realpathSync(EVIDENCE_ROOT)
  const realParent = realpathSync(parent)
  if (realParent !== realRoot && !realParent.startsWith(realRoot + path.sep)) usage('--out must stay inside ' + EVIDENCE_ROOT)
  try {
    lstatSync(resolved) // Includes dangling symlinks: no existing directory entry may be replaced.
    usage('--out already exists; guarded reports refuse overwrite: ' + resolved)
  } catch (error) {
    if (error.code !== 'ENOENT') usage('--out cannot be inspected: ' + error.message)
  }
  if (path.extname(resolved).toLowerCase() !== '.json') usage('--out must name a new JSON file')
  return resolved
}

function defaultOut(viewport, tier) {
  mkdirSync(EVIDENCE_ROOT, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const random = createHash('sha256').update(process.pid + ':' + Date.now() + ':' + Math.random()).digest('hex').slice(0, 8)
  return path.join(EVIDENCE_ROOT, 'pointer-functional-' + viewport + '-' + tier + '-' + stamp + '-' + random + '.json')
}

const sha256 = data => createHash('sha256').update(data).digest('hex')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const finite = value => typeof value === 'number' && Number.isFinite(value)
const check = (assertions, name, status, actual) => {
  const normalized = status === 'UNVERIFIED' ? 'UNVERIFIED' : status ? 'PASS' : 'FAIL'
  assertions.push({ name, status: normalized, actual })
  return normalized
}
const aggregateStatus = statuses => statuses.includes('FAIL') ? 'FAIL' : statuses.includes('UNVERIFIED') ? 'UNVERIFIED' : statuses.length > 0 && statuses.every(status => status === 'PASS') ? 'PASS' : 'FAIL'

function sleepUntil(start, offset) {
  const remaining = start + offset - Date.now()
  if (remaining > 0) return sleep(remaining)
  return Promise.resolve()
}

async function fetchBytes(url) {
  const client = new URL(url).protocol === 'https:' ? https : http
  return new Promise((resolve, reject) => {
    const request = client.get(url, { headers: { 'Accept-Encoding': 'identity' }, timeout: READY_TIMEOUT_MS }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve({ status: response.statusCode ?? 0, bytes: Buffer.concat(chunks), contentEncoding: response.headers['content-encoding'] ?? null }))
      response.on('error', reject)
    })
    request.on('timeout', () => request.destroy(new Error('fetch timeout')))
    request.on('error', reject)
  })
}

function collectModuleSrcs(html) {
  const srcs = []
  const re = /<script\b[^>]*>/gi
  for (const tag of html.matchAll(re)) {
    const src = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag[0])
    if (src) srcs.push((src[1] || src[2] || src[3] || '').trim())
  }
  return srcs
}

function localAsset(build, assetPath, required = true) {
  const relative = assetPath === '/torque-wrench/' ? 'torque-wrench/index.html' : assetPath.replace(/^\//, '')
  const file = path.join(build.buildDir, relative)
  const realBuild = realpathSync(build.buildDir)
  if (!existsSync(file)) {
    if (!required) return { path: relative, present: false }
    throw new Error('BLOCKED: build asset missing: ' + relative)
  }
  const realFile = realpathSync(file)
  if (realFile !== realBuild && !realFile.startsWith(realBuild + path.sep)) throw new Error('BLOCKED: asset resolves outside build: ' + relative)
  const bytes = readFileSync(file)
  return { path: relative, present: true, bytes: bytes.length, sha256: sha256(bytes) }
}

async function servedAsset(origin, assetPath, required = true) {
  const result = await fetchBytes(new URL(assetPath, origin).toString())
  if (result.status !== 200) {
    if (!required) return { path: assetPath, present: false, status: result.status }
    throw new Error('BLOCKED: served asset ' + assetPath + ' returned HTTP ' + result.status)
  }
  return { path: assetPath, present: true, status: result.status, bytes: result.bytes.length, sha256: sha256(result.bytes), contentEncoding: result.contentEncoding }
}

function sourceIdentity() {
  const files = [
    'docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md',
    'docs/torque-wrench-rebuild/13-implementation-plan.md',
    'torque-wrench/index.html',
    'src/torque-wrench-main.tsx',
    'src/scene/torque-wrench/TorqueWrenchPage.tsx',
    'src/scene/torque-wrench/Scene.tsx',
    'src/scene/torque-wrench/RuntimeWorld.tsx',
    'src/scene/torque-wrench/Story.tsx',
    'src/scene/torque-wrench/inspectionPlayback.ts',
    'src/scene/torque-wrench/tier.ts',
    'src/scene/torque-wrench/torque-wrench.css',
    'src/scene/torque-wrench/beats.ts',
    'scripts/lib/browser-launch.mjs',
  ]
  const hashes = {}
  const aggregate = createHash('sha256')
  for (const relative of files) {
    const file = path.join(ROOT, relative)
    if (!existsSync(file)) throw new Error('BLOCKED: source input missing: ' + relative)
    const bytes = readFileSync(file)
    hashes[relative] = sha256(bytes)
    aggregate.update(relative).update(Buffer.from([0])).update(bytes)
  }
  const harnessBytes = readFileSync(HARNESS_PATH)
  return { files: hashes, aggregateSha256: aggregate.digest('hex'), harnessSha256: sha256(harnessBytes) }
}

async function loadBuildGraph(buildDir, origin) {
  const manifestPath = path.join(buildDir, '.vite', 'manifest.json')
  if (!existsSync(manifestPath)) throw new Error('BLOCKED: .vite/manifest.json missing; rebuild with manifest enabled')
  const manifestBytes = readFileSync(manifestPath)
  let manifest
  try { manifest = JSON.parse(manifestBytes.toString('utf8')) } catch (error) { throw new Error('BLOCKED: invalid manifest JSON: ' + error.message) }
  const entryKey = 'torque-wrench/index.html'
  const entry = manifest[entryKey]
  if (!entry?.isEntry || !entry.file) throw new Error('BLOCKED: manifest has no torque-wrench entry')
  const sceneKey = Object.keys(manifest).find(key => /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/.test(key))
  if (!sceneKey) throw new Error('BLOCKED: manifest has no RuntimeWorld Scene chunk')
  if (!Array.isArray(entry.dynamicImports) || !entry.dynamicImports.includes(sceneKey)) throw new Error('BLOCKED: entry does not dynamically import Scene chunk ' + sceneKey)
  const htmlPath = '/torque-wrench/'
  const entryPath = '/' + entry.file
  const scenePath = '/' + manifest[sceneKey].file

  const manifestIdentity = { path: '.vite/manifest.json', bytes: manifestBytes.length, sha256: sha256(manifestBytes) }
  const pairs = [
    ['html', htmlPath, true],
    ['entry', entryPath, true],
    ['scene', scenePath, true],
    ['cad', '/models/Default.glb', true],
    ['dracoWasm', '/draco/draco_decoder.wasm', true],
    ['dracoWrapper', '/draco/draco_wasm_wrapper.js', true],
  ]
  const assets = {}
  for (const [name, assetPath, required] of pairs) {
    const local = localAsset({ buildDir }, assetPath, required)
    const served = await servedAsset(origin, assetPath, required)
    const match = local.present && served.present && local.sha256 === served.sha256
    assets[name] = { assetPath, local, served, localServedMatch: match }
    if (!match) throw new Error('BLOCKED: served/local ' + name + ' mismatch at ' + assetPath)
  }

  const htmlText = readFileSync(path.join(buildDir, 'torque-wrench', 'index.html'), 'utf8')
  const srcs = collectModuleSrcs(htmlText)
  const candidates = srcs.filter(src => !src.includes('@vite/client'))
  if (candidates.length !== 1 || candidates[0] !== entryPath) throw new Error('BLOCKED: HTML entry is not exact manifest entry: ' + candidates.join(','))

  return {
    mode: 'built',
    buildDir,
    manifestKey: entryKey,
    sceneManifestKey: sceneKey,
    htmlModuleSrcs: srcs,
    expectedEntry: entryPath,
    scenePath,
    manifestIdentity,
    assets,
  }
}

function preflight() {
  const checks = []
  const add = (name, pass, detail) => checks.push({ name, status: pass === 'UNVERIFIED' ? 'UNVERIFIED' : pass ? 'PASS' : 'FAIL', detail: detail || '' })
  const require = createRequire(import.meta.url)
  try {
    const playwrightVersion = JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')).version
    add('installed playwright resolvable', Boolean(playwrightVersion), 'version ' + playwrightVersion)
  } catch (error) { add('installed playwright resolvable', false, String(error)) }
  const browserLaunch = path.join(ROOT, 'scripts', 'lib', 'browser-launch.mjs')
  add('browser-launch helper present', existsSync(browserLaunch), browserLaunch)
  add('contract18 present', existsSync(CONTRACT_PATH), CONTRACT_PATH)
  add('plan13 present', existsSync(PLAN_PATH), PLAN_PATH)
  const read = relative => existsSync(path.join(ROOT, relative)) ? readFileSync(path.join(ROOT, relative), 'utf8') : ''
  const storyText = read('src/scene/torque-wrench/Story.tsx')
  add('Story inspection control source present', storyText.includes('torque-inspection__toggle') && storyText.includes('aria-expanded'), 'src/scene/torque-wrench/Story.tsx')
  const cssText = read('src/scene/torque-wrench/torque-wrench.css')
  add('live-mode pointer-inert scene CSS present', cssText.includes(".torque-page[data-torque-mode='live'] .torque-scene") && cssText.includes('pointer-events: none'), 'src/scene/torque-wrench/torque-wrench.css')
  const runtimeText = read('src/scene/torque-wrench/RuntimeWorld.tsx')
  const pageText = read('src/scene/torque-wrench/TorqueWrenchPage.tsx')
  add('reduced-motion media listener source present (observation only; transition NOT claimed here)', pageText.includes('REDUCED_MOTION_QUERY') && pageText.includes("addEventListener('change'"), 'src/scene/torque-wrench/TorqueWrenchPage.tsx')
  // Invariance-only basis: this harness is valid only while the product installs no pointer
  // dynamics. If pointer-dynamics source appears, the §6 offset-discrimination rerun is
  // required and this preflight must FAIL so invariance evidence is never reused for it.
  const pointerDynamicsPath = path.join(ROOT, 'src', 'scene', 'torque-wrench', 'pointerDynamics.ts')
  const dynamicsPattern = /pointerdown|pointermove|pointerup|pointercancel|onPointer|setPointerCapture|releasePointerCapture/i
  const dynamicsAbsent = !existsSync(pointerDynamicsPath) && !dynamicsPattern.test(runtimeText)
  add('no pointer-dynamics source in RuntimeWorld/pointerDynamics (invariance-only basis)', dynamicsAbsent,
    dynamicsAbsent ? 'invariance scope valid; pointerDynamics.ts absent and RuntimeWorld has no pointer handlers'
      : 'pointer-dynamics source detected; §6 offset-discrimination rerun required before any pointer claims')
  add('RuntimeWorld world/camera telemetry source present', runtimeText.includes('__torqueWorld') && runtimeText.includes('camera.quaternion.toArray') && runtimeText.includes('target.toArray'), 'src/scene/torque-wrench/RuntimeWorld.tsx')
  return { checks, ok: checks.every(item => item.status === 'PASS') }
}

function pointerProbeInit() {
  const probe = {
    started: false,
    origin: 0,
    capture: false,
    marker: 'pre-start',
    markers: [],
    frames: [],
    dropped: 0,
    errors: [],
    nativeEvents: [],
    seen: {},
    start(label) {
      this.started = true; this.origin = performance.now(); this.capture = true
      this.marker = label; this.markers.length = 0; this.frames.length = 0; this.dropped = 0
      this.nativeEvents.length = 0
      this.mark(label)
    },
    mark(label) {
      this.marker = String(label)
      this.markers.push({ label, t: performance.now() - this.origin })
    },
    drain() {
      const copy = { frames: this.frames.slice(), dropped: this.dropped, markers: this.markers.slice(), nativeEvents: this.nativeEvents.slice(), errors: this.errors.slice() }
      this.frames.length = 0; this.dropped = 0; this.markers.length = 0; this.nativeEvents.length = 0
      return copy
    },
  }
  Object.defineProperty(window, '__jg038PointerProbe', { value: probe, configurable: false })
  for (const type of ['pointermove', 'pointerdown', 'pointerup', 'pointercancel']) {
    window.addEventListener(type, event => {
      if (!probe.capture || !event.isTrusted) return
      probe.nativeEvents.push({ type, t: performance.now() - probe.origin, isTrusted: event.isTrusted,
        clientX: Number.isFinite(event.clientX) ? event.clientX : null, clientY: Number.isFinite(event.clientY) ? event.clientY : null,
        pointerId: event.pointerId ?? null, pointerType: event.pointerType ?? null })
    }, { capture: true, passive: true })
  }
  const sample = now => {
    requestAnimationFrame(sample)
    if (!probe.capture) return
    try {
      const world = window.__torqueWorld
      const narrative = window.__torqueNarrative
      let snapshot = null
      let narrativeSample = null
      try { snapshot = world && typeof world.snapshot === 'function' ? world.snapshot() : null } catch (error) { probe.errors.push(String(error)) }
      try { narrativeSample = narrative && typeof narrative.snapshot === 'function' ? narrative.snapshot() : null } catch (error) { probe.errors.push(String(error)) }
      const scrollingElement = document.scrollingElement || document.documentElement
      const maxScroll = Math.max(0, (scrollingElement.scrollHeight || 0) - (scrollingElement.clientHeight || 0))
      const camera = snapshot?.camera ?? null
      const frame = {
        t: now - probe.origin,
        marker: probe.marker,
        scrollY: Number.isFinite(window.scrollY) ? window.scrollY : null,
        maxScroll,
        nativeProgress: maxScroll > 0 ? window.scrollY / maxScroll : null,
        lamps: { lampPower: snapshot?.opening?.lampPower, blackout: snapshot?.opening?.blackout,
          illumination: snapshot?.opening?.illumination, lightSweep: snapshot?.opening?.lightSweep,
          lightSweepPosition: snapshot?.opening?.lightSweepPosition,
          portalLight: snapshot?.sheet?.stats?.portalLight, portalPulse: snapshot?.sheet?.stats?.portalPulse },
        progress: Number.isFinite(snapshot?.progress) ? snapshot.progress : Number.isFinite(narrativeSample?.progress) ? narrativeSample.progress : null,
        narrative: narrativeSample ? {
          beatId: narrativeSample.beatId ?? null, localProgress: narrativeSample.localProgress ?? null,
          phase: narrativeSample.phase ?? null, stateKey: narrativeSample.stateKey ?? null,
        } : null,
        camera: camera ? {
          position: camera.position ?? null,
          target: camera.target ?? null,
          quaternion: camera.quaternion ?? null,
          fov: Number.isFinite(camera.fov) ? camera.fov : null,
        } : null,
      }
      probe.seen.cameraPosition = probe.seen.cameraPosition || Boolean(frame.camera?.position?.every(Number.isFinite))
      probe.seen.cameraQuaternion = probe.seen.cameraQuaternion || Boolean(frame.camera?.quaternion?.every(Number.isFinite))
      probe.seen.cameraFov = probe.seen.cameraFov || Number.isFinite(frame.camera?.fov)
      probe.seen.progress = probe.seen.progress || Number.isFinite(frame.progress)
      probe.seen.narrative = probe.seen.narrative || Boolean(frame.narrative)
      if (probe.frames.length < 16000) probe.frames.push(frame)
      else probe.dropped += 1
    } catch (error) {
      probe.errors.push(String(error))
    }
  }
  requestAnimationFrame(sample)
}

async function waitForReady(page) {
  await page.waitForFunction(() => {
    const snapshot = window.__torqueWorld?.snapshot?.()
    return snapshot?.ready === true && snapshot?.sheet?.baked === true
      && Array.isArray(snapshot?.camera?.quaternion) && document.querySelector('.torque-scene canvas') !== null
  }, null, { timeout: READY_TIMEOUT_MS, polling: 100 })
}

async function readRuntime(page) {
  return page.evaluate(() => {
    const world = window.__torqueWorld
    let snapshot = null
    try { snapshot = world?.snapshot?.() ?? null } catch (error) { return { error: String(error) } }
    const canvas = document.querySelector('.torque-scene canvas')
    const scrollingElement = document.scrollingElement || document.documentElement
    const maxScroll = Math.max(0, (scrollingElement.scrollHeight || 0) - (scrollingElement.clientHeight || 0))
    return {
      progress: snapshot?.progress ?? null,
      scrollY: Number.isFinite(window.scrollY) ? window.scrollY : null,
      maxScroll,
      nativeProgress: maxScroll > 0 ? window.scrollY / maxScroll : null,
      mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode') ?? null,
      tier: snapshot?.mechanical?.tier ?? snapshot?.sheet?.tier ?? null,
      camera: snapshot?.camera ?? null,
      renderer: snapshot?.renderer ?? null,
      ready: snapshot?.ready === true, baked: snapshot?.sheet?.baked === true,
      visibility: document.visibilityState, canvasPresent: Boolean(canvas),
      narrative: window.__torqueNarrative?.snapshot?.() ?? null,
      beats: Array.isArray(window.__torqueNarrative?.beats) ? window.__torqueNarrative.beats.map(beat => ({ id: beat.id, start: beat.start, end: beat.end })) : [],
      viewport: {
        innerWidth, innerHeight, devicePixelRatio,
        canvasCss: canvas ? [canvas.clientWidth, canvas.clientHeight] : null,
      },
      scenePointerEvents: getComputedStyle(document.querySelector('.torque-scene') ?? document.body).pointerEvents,
    }
  })
}

async function drainProbe(page) {
  await page.evaluate(() => new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))
    else setTimeout(() => resolve(true), 50)
  }))
  return page.evaluate(() => window.__jg038PointerProbe.drain())
}

async function markInput(page, label) {
  await page.evaluate(name => window.__jg038PointerProbe.mark(name), label)
}

async function probeNow(page) {
  return page.evaluate(() => performance.now() - window.__jg038PointerProbe.origin)
}

function dist3(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === 3 && b.length === 3 && a.every(finite) && b.every(finite)
    ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : null
}

function quatAngleDeg(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 4 || b.length !== 4 || !a.every(finite) || !b.every(finite)) return null
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])
  return 2 * Math.acos(Math.min(1, Math.max(-1, dot))) * 180 / Math.PI
}

function inverseRotate(q, v) {
  const qx = -q[0], qy = -q[1], qz = -q[2], qw = q[3]
  const tx = 2 * (qy * v[2] - qz * v[1])
  const ty = 2 * (qz * v[0] - qx * v[2])
  const tz = 2 * (qx * v[1] - qy * v[0])
  return [
    v[0] + qw * tx + (qy * tz - qz * ty),
    v[1] + qw * ty + (qz * tx - qx * tz),
    v[2] + qw * tz + (qx * ty - qy * tx),
  ]
}

function cameraObservablesComplete(camera) {
  return Boolean(camera
    && Array.isArray(camera.position) && camera.position.length === 3 && camera.position.every(finite)
    && Array.isArray(camera.target) && camera.target.length === 3 && camera.target.every(finite)
    && Array.isArray(camera.quaternion) && camera.quaternion.length === 4 && camera.quaternion.every(finite)
    && finite(camera.fov))
}

// Harness computation of the §6 'projected displacement' observable: project one fixed
// reference world point through the installed camera pose (position/quaternion/fov) with a
// perspective projection and report CSS-px screen position. Not a product-reported value.
function projectPointToCssPx(camera, point, viewportWidth, viewportHeight) {
  if (!cameraObservablesComplete(camera) || !Array.isArray(point) || point.length !== 3 || !point.every(finite)) return null
  const rel = [point[0] - camera.position[0], point[1] - camera.position[1], point[2] - camera.position[2]]
  const cam = inverseRotate(camera.quaternion, rel)
  if (!(cam[2] < -1e-6)) return null // point behind the camera plane; projection undefined
  const tanHalfFov = Math.tan(camera.fov * Math.PI / 360)
  const aspect = viewportWidth / viewportHeight
  const ndcX = (cam[0] / -cam[2]) / (tanHalfFov * aspect)
  const ndcY = (cam[1] / -cam[2]) / tanHalfFov
  return [(ndcX + 1) / 2 * viewportWidth, (1 - ndcY) / 2 * viewportHeight]
}

function pointerWindowStats(frames, baseline, referencePoint, viewport) {
  const stats = {
    framesConsidered: 0, projectedSamples: 0, projectedNulls: 0,
    maxProjectedPx: null, maxAngleDeg: null, maxPositionM: null, maxFovDeg: null, incompleteFrames: 0,
    projectedBasis: 'UNVERIFIED', baselineProjectedPx: null,
  }
  if (!cameraObservablesComplete(baseline.camera)) return stats
  stats.baselineProjectedPx = projectPointToCssPx(baseline.camera, referencePoint, viewport.width, viewport.height)
  stats.projectedBasis = stats.baselineProjectedPx ? 'PASS' : 'UNVERIFIED'
  for (const frame of frames) {
    if (!cameraObservablesComplete(frame.camera)) { stats.incompleteFrames++; continue }
    stats.framesConsidered += 1
    if (stats.baselineProjectedPx) {
      const projected = projectPointToCssPx(frame.camera, referencePoint, viewport.width, viewport.height)
      if (projected) {
        stats.projectedSamples += 1
        const delta = Math.hypot(projected[0] - stats.baselineProjectedPx[0], projected[1] - stats.baselineProjectedPx[1])
        if (stats.maxProjectedPx === null || delta > stats.maxProjectedPx) stats.maxProjectedPx = delta
      } else stats.projectedNulls += 1
    }
    const angle = quatAngleDeg(baseline.camera.quaternion, frame.camera.quaternion)
    if (angle !== null && (stats.maxAngleDeg === null || angle > stats.maxAngleDeg)) stats.maxAngleDeg = angle
    const posDelta = dist3(baseline.camera.position, frame.camera.position)
    if (posDelta !== null && (stats.maxPositionM === null || posDelta > stats.maxPositionM)) stats.maxPositionM = posDelta
    if (finite(baseline.camera.fov) && finite(frame.camera.fov)) {
      const fovDelta = Math.abs(frame.camera.fov - baseline.camera.fov)
      if (stats.maxFovDeg === null || fovDelta > stats.maxFovDeg) stats.maxFovDeg = fovDelta
    }
  }
  return stats
}

function canonicalInvarianceStats(frames, baseline) {
  const stats = {
    framesConsidered: 0, narrativeFrames: 0, maxProgressDelta: null,
    beatIdChanges: [], stateKeyChanges: [], basis: 'UNVERIFIED',
  }
  if (!baseline.narrative?.beatId || !baseline.narrative?.stateKey || !finite(baseline.progress)) return stats
  stats.basis = 'PASS'
  for (const frame of frames) {
    if (!frame.narrative?.beatId || !frame.narrative?.stateKey) { stats.basis = 'UNVERIFIED'; continue }
    stats.framesConsidered += 1
    if (!finite(frame.progress)) { stats.basis = 'UNVERIFIED'; continue }
    stats.narrativeFrames += 1
    const delta = Math.abs(frame.progress - baseline.progress)
    if (stats.maxProgressDelta === null || delta > stats.maxProgressDelta) stats.maxProgressDelta = delta
    if (frame.narrative.beatId !== baseline.narrative.beatId) stats.beatIdChanges.push({ t: frame.t, from: baseline.narrative.beatId, to: frame.narrative.beatId })
    if (frame.narrative.stateKey !== baseline.narrative.stateKey) stats.stateKeyChanges.push({ t: frame.t, from: baseline.narrative.stateKey, to: frame.narrative.stateKey })
  }
  return stats
}

function framesBetween(frames, startT, endT) {
  return frames.filter(frame => frame.t >= startT && (endT === null || frame.t <= endT))
}

async function dispatchLeg(page, label, from, to, rosterStartDate, probeT0, legIndex) {
  const nativeStart = await probeNow(page)
  await page.mouse.move(from[0], from[1])
  const legStart = Date.now()
  const startOffset = legStart - rosterStartDate
  const dispatches = []
  for (let i = 1; i <= MOVE_STEPS_PER_LEG; i++) {
    await sleepUntil(legStart, Math.round(i * LEG_MS / MOVE_STEPS_PER_LEG))
    const fraction = i / MOVE_STEPS_PER_LEG
    const x = from[0] + (to[0] - from[0]) * fraction
    const y = from[1] + (to[1] - from[1]) * fraction
    const beforeOffset = Date.now() - rosterStartDate
    await page.mouse.move(x, y)
    dispatches.push({ step: i, x, y, beforeDispatchOffsetMs: beforeOffset, afterDispatchOffsetMs: Date.now() - rosterStartDate })
    await sleepUntil(legStart, Math.round(i * LEG_MS / MOVE_STEPS_PER_LEG))
  }
  const endOffset = Date.now() - rosterStartDate
  return {
    label, legIndex,
    from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] },
    requestedDurationMs: LEG_MS,
    windowProbeT: { start: nativeStart, end: await probeNow(page) },
    dispatches,
  }
}

function trustedMovesInWindow(nativeEvents, window) {
  return nativeEvents.filter(event => event.type === 'pointermove' && event.isTrusted
    && event.pointerType === 'mouse' && finite(event.clientX) && finite(event.clientY) && finite(event.t)
    && event.t >= window.start - 50 && event.t <= window.end + 50)
}

async function settleAndBaseline(page, label) {
  await sleep(SETTLE_WAIT_MS)
  await markInput(page, label + ':baseline')
  const probeT0 = await probeNow(page)
  const captured = await drainProbe(page)
  const baselineFrame = [...captured.frames].reverse().find(frame => frame.camera) ?? null
  return { captured, baselineFrame, probeT0 }
}

async function runPointerRoster(page, options, provenance) {
  const assertions = []
  const segments = []
  const viewport = await page.evaluate(() => { const c = document.querySelector('.torque-scene canvas'); return { width: c?.clientWidth ?? 0, height: c?.clientHeight ?? 0 } })
  const runtimeStart = await readRuntime(page)

  // ---- Segment 1: full §3 roster at the drafting (reading) beat, scroll untouched. ----
  await page.evaluate(() => window.scrollTo(0, 0))
  const drafting = await settleAndBaseline(page, 'roster:drafting')
  if (!drafting.baselineFrame) {
    check(assertions, 'drafting: baseline camera observable exists', 'UNVERIFIED', null)
  } else {
    const baseline = drafting.baselineFrame
    const referencePoint = Array.isArray(baseline.camera?.target) && baseline.camera.target.every(finite)
      ? baseline.camera.target : [0, 0, 0]
    const referenceBasis = referencePoint === baseline.camera?.target ? 'baseline camera target' : 'world origin (baseline target unavailable)'
    const corners = [
      [0, 0], [viewport.width - 1, 0], [viewport.width - 1, viewport.height - 1], [0, viewport.height - 1],
    ]
    const center = [Math.round(viewport.width / 2), Math.round(viewport.height / 2)]
    const rosterStart = Date.now()
    await markInput(page, 'roster:drafting:legs')
    const legs = []
    const points = [center, corners[0], corners[1], corners[2], corners[3], center]
    for (let i = 1; i < points.length; i++) {
      legs.push(await dispatchLeg(page, 'drafting:leg:' + i, points[i - 1], points[i], rosterStart, drafting.probeT0, i))
    }
    const legsEndProbeT = await probeNow(page)
    await markInput(page, 'roster:drafting:hold')
    const holdIndex = await page.evaluate(() => window.__jg038PointerProbe.frames.length)
    await page.waitForFunction(index => {
      const rows = window.__jg038PointerProbe.frames
      return rows[index] && rows.at(-1).t - rows[index].t >= 5000
    }, holdIndex, { timeout: 10000, polling: 100 })
    await markInput(page, 'roster:drafting:end')
    const captured = await drainProbe(page)
    const endProbeT = await probeNow(page)

    const legFrames = framesBetween(captured.frames, drafting.probeT0, legsEndProbeT)
    const returnFrames = framesBetween(captured.frames, legsEndProbeT, legsEndProbeT + RETURN_LIMIT_MS)
    const holdFrames = captured.frames.slice(holdIndex)
    const legStats = pointerWindowStats(legFrames, baseline, referencePoint, viewport)
    const returnStats = pointerWindowStats(returnFrames, baseline, referencePoint, viewport)
    const holdStats = pointerWindowStats(holdFrames, baseline, referencePoint, viewport)
    const canonical = canonicalInvarianceStats(captured.frames, baseline)
    const projectedLimit = PROJECTED_FRACTION * Math.min(viewport.width, viewport.height)
    check(assertions, 'drafting: observed raw hold spans five seconds', holdFrames.length > 1 && holdFrames.at(-1).t - holdFrames[0].t >= HOLD_MS,
      { frames: holdFrames.length, spanMs: holdFrames.length ? holdFrames.at(-1).t - holdFrames[0].t : null })
    check(assertions, 'drafting: all camera/narrative observations complete',
      legFrames.length > 1 && captured.frames.every(f => finite(f.t) && cameraObservablesComplete(f.camera)
        && finite(f.progress) && finite(f.nativeProgress) && f.narrative?.beatId && f.narrative?.stateKey), captured.frames.length)
    const holdBase = holdFrames[0]
    const holdLampNative = holdBase && holdFrames.every(f => finite(f.nativeProgress) && Math.abs(f.nativeProgress - holdBase.nativeProgress) <= PROGRESS_EPS
      && Object.keys(holdBase.lamps).every(k => finite(f.lamps[k]) && finite(holdBase.lamps[k]) && Math.abs(f.lamps[k] - holdBase.lamps[k]) <= 1e-4))
    check(assertions, 'drafting: finite lamp/native hold invariance', Boolean(holdLampNative), holdBase?.lamps)
    for (const leg of legs) {
      const events = trustedMovesInWindow(captured.nativeEvents, leg.windowProbeT)
      check(assertions, leg.label + ': observed mouse endpoints', events.some(e => Math.abs(e.clientX - leg.from.x) <= 1 && Math.abs(e.clientY - leg.from.y) <= 1)
        && events.some(e => Math.abs(e.clientX - leg.to.x) <= 1 && Math.abs(e.clientY - leg.to.y) <= 1), events)
      check(assertions, leg.label + ': observed dispatch window at least requested500ms',
        leg.windowProbeT.end - leg.windowProbeT.start >= LEG_MS, leg.windowProbeT)
    }

    check(assertions, 'drafting: baseline narrative observable exists', baseline.narrative ? true : 'UNVERIFIED', baseline.narrative)
    check(assertions, 'drafting: trusted pointermove delivered in every leg',
      legs.every(leg => trustedMovesInWindow(captured.nativeEvents, leg.windowProbeT).length >= 1),
      legs.map(leg => ({ label: leg.label, trustedMoves: trustedMovesInWindow(captured.nativeEvents, leg.windowProbeT).length })))
    check(assertions, 'drafting: projected displacement during legs <= 1% of shorter viewport (' + projectedLimit.toFixed(2) + 'px)',
      legStats.maxProjectedPx === null ? 'UNVERIFIED' : legStats.maxProjectedPx <= projectedLimit,
      { maxProjectedPx: legStats.maxProjectedPx, limitPx: projectedLimit, projectedSamples: legStats.projectedSamples, projectedNulls: legStats.projectedNulls })
    check(assertions, 'drafting: reading suppression residual <= ' + SUPPRESSION_RESIDUAL_PX + ' CSS px',
      legStats.maxProjectedPx === null ? 'UNVERIFIED' : legStats.maxProjectedPx <= SUPPRESSION_RESIDUAL_PX,
      { maxProjectedPx: legStats.maxProjectedPx, limitPx: SUPPRESSION_RESIDUAL_PX })
    check(assertions, 'drafting: projected observable complete (no behind-camera/unprojectable frames)',
      legStats.projectedNulls === 0 && legStats.projectedBasis === 'PASS' ? true : 'UNVERIFIED',
      { projectedNulls: legStats.projectedNulls, baselineProjectedPx: legStats.baselineProjectedPx, referenceBasis })
    check(assertions, 'drafting: angular offset during legs <= ' + ANGLE_LIMIT_DEG + ' deg',
      legStats.maxAngleDeg === null ? 'UNVERIFIED' : legStats.maxAngleDeg <= ANGLE_LIMIT_DEG,
      { maxAngleDeg: legStats.maxAngleDeg, limitDeg: ANGLE_LIMIT_DEG })
    check(assertions, 'drafting: center return within ' + RETURN_LIMIT_MS + 'ms of final center-leg end',
      returnStats.maxProjectedPx === null || returnStats.maxAngleDeg === null ? 'UNVERIFIED'
        : (returnStats.maxProjectedPx <= projectedLimit && returnStats.maxAngleDeg <= ANGLE_LIMIT_DEG ? true : false),
      { maxProjectedPx: returnStats.maxProjectedPx, maxAngleDeg: returnStats.maxAngleDeg, windowMs: RETURN_LIMIT_MS, frames: returnFrames.length })
    check(assertions, 'drafting: 5s hold position drift <= ' + HOLD_POSITION_M + 'm',
      holdStats.maxPositionM === null ? 'UNVERIFIED' : holdStats.maxPositionM <= HOLD_POSITION_M, { maxPositionM: holdStats.maxPositionM })
    check(assertions, 'drafting: 5s hold quaternion drift <= ' + HOLD_ANGLE_DEG + 'deg',
      holdStats.maxAngleDeg === null ? 'UNVERIFIED' : holdStats.maxAngleDeg <= HOLD_ANGLE_DEG, { maxAngleDeg: holdStats.maxAngleDeg })
    check(assertions, 'drafting: 5s hold FOV drift <= ' + HOLD_FOV_DEG + 'deg',
      holdStats.maxFovDeg === null ? 'UNVERIFIED' : holdStats.maxFovDeg <= HOLD_FOV_DEG, { maxFovDeg: holdStats.maxFovDeg })
    check(assertions, 'drafting: canonical progress constant during roster (pointer cannot modify canonical state)',
      canonical.basis === 'UNVERIFIED' ? 'UNVERIFIED' : (canonical.maxProgressDelta !== null && canonical.maxProgressDelta <= PROGRESS_EPS && canonical.beatIdChanges.length === 0),
      { maxProgressDelta: canonical.maxProgressDelta, eps: PROGRESS_EPS, beatIdChanges: canonical.beatIdChanges })
    check(assertions, 'drafting: canonical stateKey constant during roster',
      canonical.basis === 'UNVERIFIED' ? 'UNVERIFIED' : (canonical.narrativeFrames > 0 && canonical.stateKeyChanges.length === 0),
      { narrativeFrames: canonical.narrativeFrames, stateKeyChanges: canonical.stateKeyChanges })
    segments.push({
      label: 'drafting-reading-roster',
      phase: 'drafting (reading)',
      cornerPoints: { center, corners },
      referencePoint, referenceBasis,
      legs, legWindowsMs: { legs: drafting.probeT0, legsEnd: legsEndProbeT, end: endProbeT },
      legStats, returnStats, holdStats, canonical,
      ambientDriftControl: pointerWindowStats(drafting.captured.frames, baseline, referencePoint, viewport),
      probe: captured,
    })
  }

  // ---- Segment 2: fracture suppression micro-roster at the breakthrough midpoint. ----
  const runtimeForBeats = runtimeStart.beats?.length ? runtimeStart : await readRuntime(page)
  const fractureBeat = (runtimeForBeats.beats ?? []).find(beat => beat.id === 'breakthrough-rupture') ?? null
  if (!fractureBeat) {
    check(assertions, 'fracture: breakthrough beat exposed via narrative port', 'UNVERIFIED', runtimeForBeats.beats)
    segments.push({ label: 'fracture-suppression-roster', phase: 'breakthrough', status: 'UNVERIFIED', reason: 'breakthrough beat not exposed' })
  } else {
    const targetProgress = (fractureBeat.start + fractureBeat.end) / 2
    await page.evaluate(target => {
      const scrollingElement = document.scrollingElement || document.documentElement
      const maxScroll = Math.max(0, (scrollingElement.scrollHeight || 0) - (scrollingElement.clientHeight || 0))
      window.scrollTo(0, target * maxScroll)
    }, targetProgress)
    const fracture = await settleAndBaseline(page, 'roster:fracture')
    const runtimeAtFracture = await readRuntime(page)
    check(assertions, 'fracture: native seek reached breakthrough midpoint (+/- ' + SEEK_PROGRESS_TOL + ')',
      finite(runtimeAtFracture.progress) ? Math.abs(runtimeAtFracture.progress - targetProgress) <= SEEK_PROGRESS_TOL : 'UNVERIFIED',
      { targetProgress, observedProgress: runtimeAtFracture.progress })
    if (!fracture.baselineFrame) {
      check(assertions, 'fracture: baseline camera observable exists', 'UNVERIFIED', null)
      segments.push({ label: 'fracture-suppression-roster', phase: 'breakthrough', status: 'UNVERIFIED', reason: 'no camera baseline' })
    } else {
      const baseline = fracture.baselineFrame
      const referencePoint = Array.isArray(baseline.camera?.target) && baseline.camera.target.every(finite)
        ? baseline.camera.target : [0, 0, 0]
      const viewportNow = await page.evaluate(() => { const c = document.querySelector('.torque-scene canvas'); return { width: c?.clientWidth ?? 0, height: c?.clientHeight ?? 0 } })
      const corner = [viewportNow.width - 1, 0]
      const center = [Math.round(viewportNow.width / 2), Math.round(viewportNow.height / 2)]
      const rosterStart = Date.now()
      await markInput(page, 'roster:fracture:legs')
      const legs = []
      const points = [center, corner, center]
      for (let i = 1; i < points.length; i++) {
        legs.push(await dispatchLeg(page, 'fracture:leg:' + i, points[i - 1], points[i], rosterStart, fracture.probeT0, i))
      }
      await markInput(page, 'roster:fracture:end')
      const captured = await drainProbe(page)
      const legFrames = framesBetween(captured.frames, fracture.probeT0, null)
      const stats = pointerWindowStats(legFrames, baseline, referencePoint, viewportNow)
      const canonical = canonicalInvarianceStats(captured.frames, baseline)
      const projectedLimit = PROJECTED_FRACTION * Math.min(viewportNow.width, viewportNow.height)
      check(assertions, 'fracture: complete finite camera/narrative observations', legFrames.length > 1
        && legFrames.every(f => finite(f.t) && cameraObservablesComplete(f.camera) && finite(f.progress)
          && f.narrative?.beatId && f.narrative?.stateKey), legFrames.length)
      check(assertions, 'fracture: trusted pointermove delivered in every leg',
        legs.every(leg => trustedMovesInWindow(captured.nativeEvents, leg.windowProbeT).length >= 1),
        legs.map(leg => ({ label: leg.label, trustedMoves: trustedMovesInWindow(captured.nativeEvents, leg.windowProbeT).length })))
      check(assertions, 'fracture: suppression residual <= ' + SUPPRESSION_RESIDUAL_PX + ' CSS px',
        stats.maxProjectedPx === null ? 'UNVERIFIED' : stats.maxProjectedPx <= SUPPRESSION_RESIDUAL_PX,
        { maxProjectedPx: stats.maxProjectedPx, limitPx: SUPPRESSION_RESIDUAL_PX })
      check(assertions, 'fracture: projected displacement during legs <= 1% of shorter viewport',
        stats.maxProjectedPx === null ? 'UNVERIFIED' : stats.maxProjectedPx <= projectedLimit,
        { maxProjectedPx: stats.maxProjectedPx, limitPx: projectedLimit, projectedSamples: stats.projectedSamples, projectedNulls: stats.projectedNulls })
      check(assertions, 'fracture: angular offset during legs <= ' + ANGLE_LIMIT_DEG + ' deg',
        stats.maxAngleDeg === null ? 'UNVERIFIED' : stats.maxAngleDeg <= ANGLE_LIMIT_DEG,
        { maxAngleDeg: stats.maxAngleDeg, limitDeg: ANGLE_LIMIT_DEG })
      check(assertions, 'fracture: canonical progress/beatId constant during micro-roster',
        canonical.basis === 'UNVERIFIED' ? 'UNVERIFIED' : (canonical.maxProgressDelta !== null && canonical.maxProgressDelta <= PROGRESS_EPS && canonical.beatIdChanges.length === 0),
        { maxProgressDelta: canonical.maxProgressDelta, eps: PROGRESS_EPS, beatIdChanges: canonical.beatIdChanges })
      segments.push({
        label: 'fracture-suppression-roster',
        phase: 'breakthrough midpoint ' + targetProgress,
        cornerPoints: { center, corner },
        referencePoint,
        legs, legStats: stats, canonical,
        probe: captured,
      })
    }
  }

  const runtimeEnd = await readRuntime(page)
  return { assertions, segments, runtimeStart, runtimeEnd, viewport }
}

function runtimeIdentityAssertions(assertions, runtime, viewport, tier, label) {
  check(assertions, label + ': actual viewport and device DPR', runtime.viewport?.innerWidth === viewport.width
    && runtime.viewport?.innerHeight === viewport.height && runtime.viewport?.devicePixelRatio === viewport.deviceScaleFactor, runtime.viewport)
  check(assertions, label + ': actual live tier', runtime.tier === tier && runtime.mode === 'live', { tier: runtime.tier, mode: runtime.mode })
  check(assertions, label + ': actual canvas basis and liveness', runtime.canvasPresent && runtime.ready && runtime.baked
    && runtime.visibility === 'visible' && runtime.scenePointerEvents === 'none'
    && runtime.viewport?.canvasCss?.[0] > 0 && runtime.viewport.canvasCss[0] <= viewport.width
    && runtime.viewport?.canvasCss?.[1] > 0 && runtime.viewport.canvasCss[1] <= viewport.height, runtime)
  const backend = runtime.renderer?.backend
  check(assertions, label + ': observed renderer backend', typeof backend === 'string' && backend.length > 0 ? true : 'UNVERIFIED', backend ?? null)
}

async function runCategory(browser, options, provenance) {
  const viewport = VIEWPORTS[options.viewport]
  const tier = options.tier
  const started = Date.now()
  let context = null
  const collectors = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [] }
  const result = { category: 'pointer-roster', requestedViewport: viewport.label, requestedTier: tier, assertions: [], status: 'FAIL' }
  const inner = async () => {
    context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: false,
      serviceWorkers: 'block',
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    page.on('console', message => { if (message.type() === 'error') collectors.consoleErrors.push(message.text()) })
    page.on('pageerror', error => collectors.pageErrors.push(String(error)))
    page.on('requestfailed', request => collectors.requestFailed.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))
    page.on('response', response => { if (response.status() >= 400) collectors.httpErrors.push({ url: response.url(), status: response.status() }) })
    await page.addInitScript(pointerProbeInit)
    const url = new URL(options.url)
    url.searchParams.set('quality', tier)
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: READY_TIMEOUT_MS })
    await waitForReady(page)
    await page.evaluate(() => window.__jg038PointerProbe.start('ready'))
    const scripts = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map(element => new URL(element.src).pathname))
    check(result.assertions, 'pointer-roster: loaded entry identity', scripts.includes(provenance.expectedEntry), scripts)
    const runtimeProbe = await readRuntime(page)
    runtimeIdentityAssertions(result.assertions, runtimeProbe, viewport, tier, 'pointer-roster start')
    check(result.assertions, 'pointer-roster: live-mode scene layer is pointer-inert per source CSS contract',
      runtimeProbe.scenePointerEvents === 'none' ? true : 'UNVERIFIED', { scenePointerEvents: runtimeProbe.scenePointerEvents })
    const roster = await runPointerRoster(page, options, provenance)
    result.segments = roster.segments
    result.assertions.push(...roster.assertions)
    result.runtimeStart = roster.runtimeStart
    result.runtimeEnd = roster.runtimeEnd
    runtimeIdentityAssertions(result.assertions, roster.runtimeEnd, viewport, tier, 'pointer-roster end')
    const probes = result.segments.flatMap(segment => [segment.probe].filter(Boolean))
    check(result.assertions, 'pointer-roster: zero probe errors', probes.every(probe => probe.errors.length === 0), probes.flatMap(probe => probe.errors))
    check(result.assertions, 'pointer-roster: zero dropped samples', probes.every(probe => probe.dropped === 0), probes.map(probe => probe.dropped))
    check(result.assertions, 'pointer-roster: zero console errors', collectors.consoleErrors.length === 0, collectors.consoleErrors)
    check(result.assertions, 'pointer-roster: zero uncaught page errors', collectors.pageErrors.length === 0, collectors.pageErrors)
    check(result.assertions, 'pointer-roster: zero failed requests', collectors.requestFailed.length === 0, collectors.requestFailed)
    check(result.assertions, 'pointer-roster: zero HTTP errors', collectors.httpErrors.length === 0, collectors.httpErrors)
    result.status = aggregateStatus(result.assertions.map(item => item.status))
  }
  let timer
  const watchdog = new Promise(resolve => {
    timer = setTimeout(() => { result.watchdog = true; resolve({ watchdog: true }) }, CASE_TIMEOUT_MS)
  })
  try {
    const raced = await Promise.race([inner(), watchdog])
    if (raced?.watchdog) result.watchdog = true
  } catch (error) {
    check(result.assertions, 'pointer-roster: category completed without harness exception', false, String(error?.stack ?? error))
    result.status = 'FAIL'
  } finally {
    clearTimeout(timer)
    if (context) await context.close().catch(() => {})
  }
  if (result.watchdog) {
    check(result.assertions, 'pointer-roster: bounded watchdog', false, 'exceeded ' + CASE_TIMEOUT_MS + 'ms; context closed')
    result.status = 'FAIL'
  }
  result.durationMs = Date.now() - started
  result.collectors = collectors
  result.provenanceBindings = { buildDir: provenance.buildDir, expectedEntry: provenance.expectedEntry, scenePath: provenance.scenePath }
  return result
}

async function main() {
  const args = parseArgs()
  const url = validateUrl(requireValue(args, 'url'))
  const buildDir = validateBuildDir(requireValue(args, 'build-dir'))
  const viewport = args.viewport !== undefined ? requireValue(args, 'viewport').toUpperCase() : 'D'
  if (!VIEWPORTS[viewport]) usage('--viewport must be D or N')
  const tier = args.tier !== undefined ? requireValue(args, 'tier') : 'full'
  if (!TIERS.includes(tier)) usage('--tier must be full or lite')
  const outPath = args.out !== undefined ? validateOut(requireValue(args, 'out')) : defaultOut(viewport, tier)

  const report = {
    harness: 'verify-torque-pointer-functional',
    release: {
      id: 'TempJG038release20261014',
      checkpoint: 'C:/Users/Markimus/AppData/Local/Temp/JG-038-release-checkpoint-2026-10-14.md',
      parentRuntimeOwner: 'chat:01a13b10-6d9b-7f80-9ce8-3fd20d86fbe1',
      authorSeat: 'Ohm pointer-harness scope reassigned to the receiving local session (GLM-5.3-Flash high)',
      writeOwnership: 'scripts/verify-torque-pointer-functional.mjs only; parent owns runtime, integration and every other file',
    },
    capturedAt: new Date().toISOString(),
    url: url.toString(),
    requestedViewport: VIEWPORTS[viewport].label,
    requestedTier: tier,
    inputContract: {
      nativeOnly: true,
      forbiddenBypassesUsed: [],
      methods: ['page.mouse.move (native trusted CDP mouse)'],
      note: 'No qualityLock, store/port setter, playback API, synthetic progress clock or accumulative playback clock is used.',
    },
    pointerContract: {
      source: 'docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md §3/§6',
      roster: 'center -> four corners -> center, 500ms per leg, then 5s hold; fracture micro-roster at breakthrough midpoint',
      limits: {
        projectedDisplacementFractionOfShorterViewport: PROJECTED_FRACTION,
        angularOffsetDeg: ANGLE_LIMIT_DEG,
        centerReturnMs: RETURN_LIMIT_MS,
        suppressionResidualCssPx: SUPPRESSION_RESIDUAL_PX,
        holdPositionM: HOLD_POSITION_M, holdAngleDeg: HOLD_ANGLE_DEG, holdFovDeg: HOLD_FOV_DEG,
      },
    },
    pointerDynamicsBasis: {
      implemented: false,
      rerunRequirement: 'When pointer dynamics are integrated, rerun with §6 offset discrimination (pointer-active vs pointer-absent difference). This invariance report must not be reused for that claim.',
    },
    coverage: {
      completeForSelectedScope: false,
      contractSectionsNotClaimed: [
        '§3 touch swipe roster (owned by verify-torque-input-response)',
        '§3 functional stress / 30-15Hz update delivery (owned by parent update-stress harness)',
        'native controls pointer/keyboard interaction and .815 restoration (parent-verified separately)',
        'reduced-motion media transition',
        '§6 optional pointer-offset discrimination (no pointer dynamics implemented; invariance-only evidence)',
      ],
      note: 'A PASS proves canonical/camera invariance under the §3 pointer roster for current behavior only.',
    },
    limitations: [
      'Projected displacement is the harness computation of the §6 observable from installed camera pose (position/quaternion/fov) over one fixed reference world point; it is not a product-reported value.',
      'Mouse input is real trusted CDP pointer input, still emulation rather than physical hardware.',
      'Ambient (no-pointer) camera drift is recorded per segment as ambientDriftControl; it is context, not a gate.',
      'Missing camera/narrative observables are UNVERIFIED and never filled with invented values.',
      'The fracture micro-roster is a bounded suppression probe at the breakthrough midpoint, not the full §3 corner roster repeated per beat.',
    ],
  }

  let browser = null
  let exitCode = EXIT.FAIL
  try {
    const pre = preflight()
    report.preflight = pre
    if (!pre.ok) throw new Error('BLOCKED: preflight failed')

    report.source = sourceIdentity()
    if (args['source-report'] !== undefined) {
      const sourceReportPath = path.resolve(requireValue(args, 'source-report'))
      const evidence = realpathSync(EVIDENCE_ROOT)
      const actual = realpathSync(sourceReportPath)
      if (!actual.startsWith(evidence + path.sep)) throw new Error('source-report must stay inside task evidence root')
      const bytes = readFileSync(actual)
      JSON.parse(bytes.toString('utf8'))
      report.sourceReport = { path: actual, bytes: bytes.length, sha256: sha256(bytes),
        interpretation: 'Parent record bytes bound only; build/source causality requires independent interpretation of this record.' }
    } else report.sourceReport = { status: 'UNVERIFIED', reason: 'No --source-report supplied.' }
    report.build = await loadBuildGraph(buildDir, url.origin)

    const playwright = await import('playwright')
    const launchModule = await import('./lib/browser-launch.mjs')
    const config = launchModule.launchConfig()
    config.ignoreDefaultArgs = ['--hide-scrollbars']
    browser = await playwright.chromium.launch(config)
    report.browser = {
      playwrightConfiguredVersion: JSON.parse(readFileSync(createRequire(import.meta.url).resolve('playwright/package.json'), 'utf8')).version,
      observedVersion: browser.version(),
      launchDescription: launchModule.describeLaunch(),
      launchConfig: config,
      note: 'Windows installed Chrome/ANGLE/D3D11 is launch configuration; report.renderer.backend is the actual runtime observation.',
    }
    report.categories = [await runCategory(browser, { url, viewport, tier }, report.build)]
    report.sourceEnd = sourceIdentity()
    report.harnessStable = { status: report.source.harnessSha256 === report.sourceEnd.harnessSha256 ? 'PASS' : 'FAIL' }
    report.sourceBuildCausality = {
      status: 'UNVERIFIED',
      liveSourceChangedDuringRun: Object.keys(report.source.files).filter(file => report.source.files[file] !== report.sourceEnd.files[file]),
      note: 'Live source hashes do not establish build-time source causality. A parent-authored build/source record is required; post-build product drift cannot inherit served-build claims.',
    }
    try {
      report.buildEnd = await loadBuildGraph(buildDir, url.origin)
      const before = report.build
      const after = report.buildEnd
      report.servedIdentityAfterRuntime = {
        status: before.manifestIdentity.sha256 === after.manifestIdentity.sha256
          && Object.keys(before.assets).every(key => before.assets[key].served.sha256 === after.assets[key].served.sha256
            && before.assets[key].local.sha256 === after.assets[key].local.sha256) ? 'PASS' : 'FAIL',
        note: 'HTML/entry/Scene/CAD/decoder served and local bytes fetched again after runtime.',
      }
    } catch (error) {
      report.servedIdentityAfterRuntime = { status: 'FAIL', error: String(error) }
    }
    report.coverage.selectedFunctionalStatus = aggregateStatus(report.categories.map(category => category.status))
    report.coverage.completeForSelectedScope = report.coverage.selectedFunctionalStatus === 'PASS'
    report.overallStatus = aggregateStatus([report.coverage.selectedFunctionalStatus,
      report.servedIdentityAfterRuntime.status, report.sourceBuildCausality.status, report.harnessStable.status])
    exitCode = report.overallStatus === 'PASS' ? EXIT.PASS : EXIT.FAIL
  } catch (error) {
    report.overallStatus = 'BLOCKED'
    report.blocked = String(error?.stack ?? error)
    exitCode = EXIT.BLOCKED
  } finally {
    if (browser) await browser.close().catch(() => {})
  }

  try {
    mkdirSync(path.dirname(outPath), { recursive: true })
    const fd = openSync(outPath, 'wx')
    try {
      writeFileSync(fd, JSON.stringify(report, null, 2) + '\n')
    } finally {
      closeSync(fd)
    }
    const written = readFileSync(outPath)
    console.log(JSON.stringify({ out: outPath, sha256: sha256(written), overallStatus: report.overallStatus }, null, 2))
  } catch (error) {
    if (error?.code === 'EEXIST') console.error('INTERNAL: guarded report path already exists: ' + outPath)
    else console.error('INTERNAL: cannot write guarded report: ' + (error?.stack ?? error))
    process.exit(EXIT.INTERNAL)
  }
  process.exit(exitCode)
}

main().catch(error => {
  console.error('INTERNAL: ' + (error?.stack ?? String(error)))
  process.exit(EXIT.INTERNAL)
})
