// JG-038 full native input/response verifier, minimum bounded roster.
//
// Interrupted Erdos scope transferred to the receiving local parent under the
// 2026-10-14 local-session handoff. Runtime scheduling remains parent-owned.
//
// Usage:
//   node scripts/verify-torque-input-response.mjs --help
//   node scripts/verify-torque-input-response.mjs --url=http://localhost:5288/torque-wrench/ \
//     --build-dir=.scratch/jg038-integration-20261014-u2 [--viewport=D|N] \
//     [--tier=full|lite] [--only-categories=wheel,touch,keyboard,scrollbar] [--out=<new-json>]
//
// Contract: docs/torque-wrench-rebuild/18-stage0-verification-contract-proposal.md §3/§6.
// Native input only: mouse wheel, installed-CDP Input.dispatchTouchEvent, keyboard,
// scrollbar mouse drag and native direct scrollTo. No qualityLock, store setter, port setter,
// playback API, synthetic progress clock or accumulative playback clock is used.
//
// C1 boundary: raw installed RuntimeWorld camera poses and finite differences are recorded at
// every beat boundary and explicit camera-domain seam ±.001, forward and reverse. NO numerical
// whole-path C1 threshold is invented or asserted. Existing InspectionDirector CPU C1 tests
// cover only the private leaf and are not expanded into a whole-path claim.

import { createHash } from 'node:crypto'
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const EVIDENCE_ROOT = path.join(ROOT, 'project', 'work', 'evidence', 'torque-wrench-rebuild', '08-stage4-opening-recovery')
const SCRATCH_ROOT = path.resolve(ROOT, '.scratch')
const HARNESS_PATH = path.join(HERE, 'verify-torque-input-response.mjs')
const CONTRACT_PATH = path.join(ROOT, 'docs', 'torque-wrench-rebuild', '18-stage0-verification-contract-proposal.md')

const VIEWPORTS = {
  D: { key: 'D', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, label: 'D 1440x900 DPR1 desktop' },
  N: { key: 'N', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, label: 'N 390x844 DPR3 touch/mobile' },
}
const TIERS = ['full', 'lite']
const CATEGORIES = ['wheel', 'touch', 'keyboard', 'scrollbar']
const DOMAIN_SEAMS = [0.46, 0.69, 0.735, 0.94]
const HANDOFF_STARTS = [0.675, 0.72, 0.925]
const CAMERA_BOUNDARIES = [...DOMAIN_SEAMS, ...HANDOFF_STARTS].sort((a, b) => a - b)
const SEEK_TARGETS = [0, 0.25, 0.5, 0.75, 1]
const KNOWN_FLAGS = new Set(['help', 'url', 'out', 'viewport', 'tier', 'only', 'only-categories', 'onlycategories', 'build-dir', 'source-report'])
const EXIT = { PASS: 0, FAIL: 1, USAGE: 2, BLOCKED: 10, INTERNAL: 12 }

// Contract §6 response tolerances. These are the only numerical response tolerances used.
const NATIVE_REST_LIMIT_MS = 1200
const NATIVE_REST_PX_PER_FRAME = 0.5
const NATIVE_REST_WINDOW_MS = 300
const CAMERA_LAMP_ADDITIONAL_MS = 500
const TOTAL_SETTLE_LIMIT_MS = 1700
const HOLD_MS = 5000
const HOLD_POSITION_M = 0.0001
const HOLD_ANGLE_DEG = 0.01
const HOLD_FOV_DEG = 0.01
const HOLD_CHANNEL = 1e-4
const PROGRESS_EPS = 1e-9
const SEEK_PROGRESS_TOL = 0.001
const READY_TIMEOUT_MS = 120000
const CASE_TIMEOUT_MS = 240000
const MAX_PROBE_FRAMES = 16000

const USAGE = [
  'usage: node scripts/verify-torque-input-response.mjs --help',
  '       node scripts/verify-torque-input-response.mjs --url=http://localhost:<port>/torque-wrench/ --build-dir=<scratch-build> [--out=<new-report.json>] [--viewport=D|N] [--tier=full|lite] [--only-categories=wheel,touch,keyboard,scrollbar]',
  '',
  '--viewport defaults to D. --tier defaults to full. --only-categories (aliases: --onlycategories, --only) selects a bounded subset.',
  '--source-report optionally binds the parent build/source JSON bytes (read-only); it is not automatically a causality proof.',
  'Default output is a unique guarded JSON file under ' + EVIDENCE_ROOT + '; existing files are never overwritten.',
  'Minimum roster: wheel, touch, keyboard, scrollbar. Pointer and functional-stress remain explicit non-claims in every report.',
  'Exit: 0 selected categories PASS | 1 selected FAIL/UNVERIFIED | 2 usage | 10 blocked | 12 report write error.',
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
  if (args.only !== undefined || args['only-categories'] !== undefined || args.onlycategories !== undefined) {
    const raw = args.only ?? args['only-categories'] ?? args.onlycategories
    if (typeof raw !== 'string' || !raw.trim()) usage('--only-categories requires a comma-separated value')
    const selected = [...new Set(raw.split(',').map(v => v.trim().toLowerCase()).filter(Boolean))]
    const bad = selected.filter(v => !CATEGORIES.includes(v))
    if (bad.length) usage('unknown category: ' + bad.join(',') + ' (use ' + CATEGORIES.join(',') + ')')
    args.categories = selected
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
  return path.join(EVIDENCE_ROOT, 'input-response-' + viewport + '-' + tier + '-' + stamp + '-' + random + '.json')
}

const sha256 = data => createHash('sha256').update(data).digest('hex')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const finite = value => typeof value === 'number' && Number.isFinite(value)
const check = (assertions, name, status, actual) => {
  const normalized = status === 'UNVERIFIED' ? 'UNVERIFIED' : status ? 'PASS' : 'FAIL'
  assertions.push({ name, status: normalized, actual })
  return normalized
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
    'torque-wrench/index.html',
    'src/torque-wrench-main.tsx',
    'src/scene/torque-wrench/TorqueWrenchPage.tsx',
    'src/scene/torque-wrench/Scene.tsx',
    'src/scene/torque-wrench/RuntimeWorld.tsx',
    'src/scene/torque-wrench/CameraHandoff.ts',
    'src/scene/torque-wrench/InspectionDirector.ts',
    'src/scene/torque-wrench/OpeningCamera.ts',
    'src/scene/torque-wrench/OpeningDirector.ts',
    'src/scene/torque-wrench/privateSheetRuntime.ts',
    'src/scene/torque-wrench/beats.ts',
    'src/scene/torque-wrench/ScrollConductor.tsx',
    'src/scene/torque-wrench/conductorRuntime.ts',
    'src/scene/torque-wrench/Story.tsx',
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

  const manifestIdentity = {
    path: '.vite/manifest.json',
    bytes: manifestBytes.length,
    sha256: sha256(manifestBytes),
  }
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
  const servedHtml = assets.html.served.sha256 === assets.html.local.sha256 ? htmlText : null
  if (!servedHtml) throw new Error('BLOCKED: served HTML cannot be interpreted')

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
  const add = (name, pass, detail) => checks.push({ name, status: pass ? 'PASS' : 'FAIL', detail: detail || '' })
  const require = createRequire(import.meta.url)
  try {
    const playwrightVersion = JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')).version
    add('installed playwright resolvable', Boolean(playwrightVersion), 'version ' + playwrightVersion)
  } catch (error) { add('installed playwright resolvable', false, String(error)) }
  const browserLaunch = path.join(ROOT, 'scripts', 'lib', 'browser-launch.mjs')
  add('browser-launch helper present', existsSync(browserLaunch), browserLaunch)
  const scene = path.join(ROOT, 'src', 'scene', 'torque-wrench', 'Scene.tsx')
  const runtime = path.join(ROOT, 'src', 'scene', 'torque-wrench', 'RuntimeWorld.tsx')
  add('Scene narrative port present', existsSync(scene) && readFileSync(scene, 'utf8').includes('__torqueNarrative'), scene)
  const runtimeText = existsSync(runtime) ? readFileSync(runtime, 'utf8') : ''
  add('RuntimeWorld world port present', runtimeText.includes('__torqueWorld'), runtime)
  add('RuntimeWorld camera quaternion/target/FOV telemetry present',
    runtimeText.includes('camera.quaternion.toArray') && runtimeText.includes('target.toArray') && runtimeText.includes('probe.camera.fov'), runtime)
  const seamMarker = seam => seam === 0.46
    ? runtimeText.includes('progress < 0.46') && runtimeText.includes('progress - 0.46')
    : seam === 0.94 ? runtimeText.includes('progress < 0.94') : runtimeText.includes('progress >= ' + seam)
  // These are observation targets, not brittle assertions about the current branch syntax.
  add('RuntimeWorld observation source present', Boolean(runtimeText), CAMERA_BOUNDARIES.join(','))
  add('contract18 present', existsSync(CONTRACT_PATH), CONTRACT_PATH)
  return { checks, ok: checks.every(item => item.status === 'PASS') }
}

function inputProbeInit() {
  const probe = {
    started: false,
    origin: 0,
    capture: false,
    marker: 'pre-start',
    markers: [],
    frames: [],
    dropped: 0,
    errors: [],
    seen: {},
    nativeEvents: [],
    consumedNativeEvents: {},
    lastNativeY: null,
    start(label) {
      this.started = true; this.origin = performance.now(); this.capture = true
      this.marker = label; this.markers.length = 0; this.frames.length = 0; this.dropped = 0
      this.nativeEvents.length = 0; this.lastNativeY = null
      this.consumedNativeEvents = {}
      this.mark(label)
    },
    mark(label) {
      this.marker = String(label)
      const eventType = label.startsWith('wheel:') && label.endsWith(':end') ? 'wheel' : label.startsWith('touch:end:') ? 'touchend'
        : label.startsWith('keyboard:') && label.endsWith(':end') ? 'keyup'
          : label.startsWith('scrollbar:') && label.endsWith(':end') ? 'mouseup' : null
      const candidate = eventType ? this.nativeEvents.filter(event => event.type === eventType).at(-1) ?? null : null
      // A marker cannot borrow an earlier gesture's last trusted event. Direct
      // scrollTo/reload observations retain marker-relative, unverified timing.
      const nativeEvent = candidate && candidate.sequence > (this.consumedNativeEvents[eventType] ?? -1) ? candidate : null
      if (nativeEvent) this.consumedNativeEvents[eventType] = nativeEvent.sequence
      this.markers.push({ label, t: performance.now() - this.origin, nativeEvent,
        markerLatencyMs: nativeEvent ? performance.now() - this.origin - nativeEvent.t : null })
    },
    drain() {
      const copy = { frames: this.frames.slice(), dropped: this.dropped, markers: this.markers.slice(), nativeEvents: this.nativeEvents.slice(), seen: { ...this.seen }, errors: this.errors.slice() }
      this.frames.length = 0; this.dropped = 0; this.markers.length = 0
      this.nativeEvents.length = 0
      return copy
    },
  }
  Object.defineProperty(window, '__jg038InputResponseProbe', { value: probe, configurable: false })
  for (const type of ['wheel', 'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup', 'mouseup']) {
    window.addEventListener(type, event => {
      if (!probe.capture || !event.isTrusted) return
      const timestamp = event.timeStamp
      const timestampOnPerformanceClock = Number.isFinite(timestamp) && timestamp >= probe.origin && timestamp <= performance.now()
      probe.nativeEvents.push({ type, sequence: probe.eventSequence = (probe.eventSequence ?? 0) + 1,
        t: timestampOnPerformanceClock ? timestamp - probe.origin : null,
        receivedT: performance.now() - probe.origin, timestampOnPerformanceClock, isTrusted: event.isTrusted,
        key: event.key ?? null, deltaY: event.deltaY ?? null, deltaMode: event.deltaMode ?? null })
    }, { capture: true, passive: true })
  }

  const inverseRotate = (q, v) => {
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

  const lampValue = (source, stats, key) => {
    if (source && typeof source[key] === 'number' && Number.isFinite(source[key])) return source[key]
    if (stats && typeof stats[key] === 'number' && Number.isFinite(stats[key])) return stats[key]
    return null
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
      const nativeY = Number.isFinite(window.scrollY) ? window.scrollY : null
      const nativeDelta = probe.lastNativeY !== null && nativeY !== null ? nativeY - probe.lastNativeY : null
      probe.lastNativeY = nativeY
      const camera = snapshot?.camera ?? null
      const opening = snapshot?.opening ?? null
      const stats = snapshot?.sheet?.stats ?? null
      let rollRad = null
      let rollDeg = null
      if (camera && Array.isArray(camera.quaternion) && camera.quaternion.length === 4 && camera.quaternion.every(Number.isFinite)) {
        const upLocal = inverseRotate(camera.quaternion, [0, 1, 0])
        if (Math.hypot(upLocal[0], upLocal[1]) > 1e-9) {
          rollRad = Math.atan2(upLocal[0], upLocal[1])
          rollDeg = rollRad * 180 / Math.PI
        }
      }
      const drawingBuffer = snapshot?.renderer?.drawingBuffer ?? null
      const frame = {
        t: now - probe.origin,
        marker: probe.marker,
        nativeScrollY: nativeY,
        maxScroll,
        nativeProgress: maxScroll > 0 && nativeY !== null ? nativeY / maxScroll : null,
        nativeDeltaCssPx: nativeDelta,
        nativeDeltaDevicePxDerived: nativeDelta === null || !Number.isFinite(devicePixelRatio) ? null : nativeDelta * devicePixelRatio,
        devicePixelRatio,
        progress: Number.isFinite(snapshot?.progress) ? snapshot.progress : Number.isFinite(narrativeSample?.progress) ? narrativeSample.progress : null,
        narrative: narrativeSample ? {
          beatId: narrativeSample.beatId ?? null, localProgress: narrativeSample.localProgress ?? null,
          phase: narrativeSample.phase ?? null, stateKey: narrativeSample.stateKey ?? null,
        } : null,
        worldFrame: Number.isFinite(snapshot?.frames) ? snapshot.frames : null,
        camera: camera ? {
          position: camera.position ?? null,
          target: camera.target ?? null,
          quaternion: camera.quaternion ?? null,
          fov: Number.isFinite(camera.fov) ? camera.fov : null,
          rollRadDerivedFromQuaternion: rollRad,
          rollDegDerivedFromQuaternion: rollDeg,
        } : null,
        lampChannels: {
          lampPower: lampValue(opening, null, 'lampPower'),
          blackout: lampValue(opening, null, 'blackout'),
          illumination: lampValue(opening, null, 'illumination'),
          lightSweep: lampValue(opening, null, 'lightSweep'),
          lightSweepPosition: lampValue(opening, null, 'lightSweepPosition'),
          portalLight: lampValue(null, stats, 'portalLight'),
          portalPulse: lampValue(null, stats, 'portalPulse'),
        },
        renderer: snapshot?.renderer ? {
          backend: snapshot.renderer.backend ?? null,
          effectiveDpr: snapshot.renderer.effectiveDpr ?? null,
          drawingBuffer,
          drawingBufferPixelsDerived: Array.isArray(drawingBuffer) ? drawingBuffer[0] * drawingBuffer[1] : null,
        } : null,
      }
      probe.seen.cameraPosition = probe.seen.cameraPosition || Boolean(frame.camera?.position?.every(Number.isFinite))
      probe.seen.cameraTarget = probe.seen.cameraTarget || Boolean(frame.camera?.target?.every(Number.isFinite))
      probe.seen.cameraQuaternion = probe.seen.cameraQuaternion || Boolean(frame.camera?.quaternion?.every(Number.isFinite))
      probe.seen.cameraFov = probe.seen.cameraFov || Number.isFinite(frame.camera?.fov)
      probe.seen.cameraRoll = probe.seen.cameraRoll || Number.isFinite(frame.camera?.rollRadDerivedFromQuaternion)
      probe.seen.progress = probe.seen.progress || Number.isFinite(frame.progress)
      probe.seen.nativePixels = probe.seen.nativePixels || Boolean(frame.renderer?.drawingBufferPixelsDerived)
      for (const [key, value] of Object.entries(frame.lampChannels)) {
        probe.seen['lamp.' + key] = probe.seen['lamp.' + key] || Number.isFinite(value)
      }
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
      scrollY,
      maxScroll,
      nativeProgress: maxScroll > 0 ? scrollY / maxScroll : null,
      frames: snapshot?.frames ?? null,
      mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode') ?? null,
      scene: document.querySelector('.torque-scene')?.getAttribute('data-torque-scene') ?? null,
      tier: snapshot?.mechanical?.tier ?? snapshot?.sheet?.tier ?? null,
      camera: snapshot?.camera ?? null,
      lampChannels: {
        lampPower: snapshot?.opening?.lampPower ?? null,
        blackout: snapshot?.opening?.blackout ?? null,
        illumination: snapshot?.opening?.illumination ?? null,
        lightSweep: snapshot?.opening?.lightSweep ?? null,
        lightSweepPosition: snapshot?.opening?.lightSweepPosition ?? null,
        portalLight: snapshot?.sheet?.stats?.portalLight ?? null,
        portalPulse: snapshot?.sheet?.stats?.portalPulse ?? null,
      },
      renderer: snapshot?.renderer ?? null,
      narrative: window.__torqueNarrative?.snapshot?.() ?? null,
      beats: Array.isArray(window.__torqueNarrative?.beats) ? window.__torqueNarrative.beats.map(beat => ({ id: beat.id, start: beat.start, end: beat.end })) : [],
      viewport: {
        innerWidth, innerHeight, devicePixelRatio,
        canvasCss: canvas ? [canvas.clientWidth, canvas.clientHeight] : null,
        canvasBuffer: canvas ? [canvas.width, canvas.height] : null,
      },
    }
  })
}

async function drainProbe(page) {
  await page.evaluate(() => new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))
    else setTimeout(() => resolve(true), 50)
  }))
  return page.evaluate(() => window.__jg038InputResponseProbe.drain())
}

async function markInput(page, label) {
  await page.evaluate(name => window.__jg038InputResponseProbe.mark(name), label)
}

async function sleepUntil(start, offset) {
  const remaining = start + offset - Date.now()
  if (remaining > 0) await sleep(remaining)
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

function quaternionRollDeg(quaternion) {
  if (!Array.isArray(quaternion) || quaternion.length !== 4 || !quaternion.every(Number.isFinite)) return null
  const qx = -quaternion[0], qy = -quaternion[1], qz = -quaternion[2], qw = quaternion[3]
  const v = [0, 1, 0]
  const tx = 2 * (qy * v[2] - qz * v[1])
  const ty = 2 * (qz * v[0] - qx * v[2])
  const tz = 2 * (qx * v[1] - qy * v[0])
  const upLocal = [
    v[0] + qw * tx + (qy * tz - qz * ty),
    v[1] + qw * ty + (qz * tx - qx * tz),
    v[2] + qw * tz + (qx * ty - qy * tx),
  ]
  return Math.hypot(upLocal[0], upLocal[1]) > 1e-9 ? Math.atan2(upLocal[0], upLocal[1]) * 180 / Math.PI : null
}

function withDerivedRoll(runtime) {
  if (!runtime?.camera) return runtime
  const rollDeg = quaternionRollDeg(runtime.camera.quaternion)
  return { ...runtime, camera: { ...runtime.camera, rollDegDerivedFromQuaternion: rollDeg, rollRadDerivedFromQuaternion: rollDeg === null ? null : rollDeg * Math.PI / 180 } }
}

function channelDelta(a, b) {
  return finite(a) && finite(b) ? Math.abs(a - b) : null
}

function stableBetween(a, b) {
  const position = dist3(a?.camera?.position, b?.camera?.position)
  const target = dist3(a?.camera?.target, b?.camera?.target)
  const quaternion = quatAngleDeg(a?.camera?.quaternion, b?.camera?.quaternion)
  const fov = channelDelta(a?.camera?.fov, b?.camera?.fov)
  const roll = channelDelta(a?.camera?.rollDegDerivedFromQuaternion, b?.camera?.rollDegDerivedFromQuaternion)
  const lamp = {}
  for (const key of Object.keys(a?.lampChannels ?? {})) lamp[key] = channelDelta(a.lampChannels[key], b?.lampChannels?.[key])
  const unavailableLampChannels = Object.entries(lamp).filter(([, value]) => value === null).map(([key]) => key)
  const missing = [
    ...(position === null ? ['camera.position'] : []),
    ...(target === null ? ['camera.target'] : []),
    ...(quaternion === null ? ['camera.quaternion'] : []),
    ...(fov === null ? ['camera.fov'] : []),
    ...Object.entries(lamp).filter(([, value]) => value === null).map(([key]) => 'lamp.' + key),
  ]
  const cameraStable = position !== null && target !== null && quaternion !== null && fov !== null
    && position <= HOLD_POSITION_M && target <= HOLD_POSITION_M && quaternion <= HOLD_ANGLE_DEG && fov <= HOLD_FOV_DEG
  const gatedLampChannels = Object.entries(lamp).filter(([, value]) => value !== null)
  const lampStable = gatedLampChannels.length > 0 && gatedLampChannels.every(([, value]) => value <= HOLD_CHANNEL)
  return { position, target, quaternion, fov, roll, lamp, missing, unavailableLampChannels, cameraStable, lampStable,
    stable: cameraStable && lampStable,
    tolerances: { positionAndTargetM: HOLD_POSITION_M, quaternionDeg: HOLD_ANGLE_DEG, fovDeg: HOLD_FOV_DEG, lampChannel: HOLD_CHANNEL } }
}

function inputMarker(captured, label) {
  return captured.markers.filter(marker => marker.label === label).at(-1) ?? null
}

function observedTiming(frames) {
  const intervals = frames.slice(1).map((frame, i) => frame.t - frames[i].t).filter(value => finite(value) && value > 0)
  const sorted = [...intervals].sort((a, b) => a - b)
  const medianMs = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
  const observedHz = medianMs ? 1000 / medianMs : null
  // Nominal classification only. Nearest integer Hz is recorded; no new timing acceptance budget.
  const nominalHz = observedHz === null ? null : Math.round(observedHz)
  return { medianMs, observedHz, nominalHz, intervalCount: intervals.length,
    classification: nominalHz === 60 ? 'observed nominal 60Hz rAF' : 'non-60Hz or unavailable',
    status: nominalHz === 60 ? 'PASS' : 'UNVERIFIED',
    note: 'Observed rAF cadence, not independently measured physical display refresh or GPU execution time.' }
}

function responseAnalysis(captured, label) {
  const marker = inputMarker(captured, label)
  const trustedAnchor = marker?.nativeEvent?.isTrusted === true && finite(marker.nativeEvent.t)
  const anchorT = trustedAnchor ? marker.nativeEvent.t : marker?.t
  const frames = marker ? captured.frames.filter(frame => frame.t >= anchorT) : []
  if (!marker || frames.length < 2) return { status: 'FAIL', reason: 'missing explicit input marker or following per-rAF samples', label }
  let restIndex = -1
  for (let start = 0; start < frames.length; start++) {
    const end = frames.findIndex((frame, index) => index > start && frame.t - frames[start].t >= NATIVE_REST_WINDOW_MS)
    if (end < 0) break
    // The starting sample's delta originates outside this declared window; ignore it.
    const deltas = frames.slice(start + 1, end + 1)
    if (deltas.every(frame => finite(frame.nativeDeltaCssPx) && Math.abs(frame.nativeDeltaCssPx) <= NATIVE_REST_PX_PER_FRAME)) {
      restIndex = end; break
    }
  }
  const restFrame = restIndex >= 0 ? frames[restIndex] : null
  const restMs = restFrame ? restFrame.t - anchorT : null
  const finalTarget = frames.at(-1)
  let settleFrame = null
  let settleResidual = null
  if (restFrame) {
    for (let i = restIndex; i < frames.length; i++) {
      const stableEnd = frames.find(frame => frame.t >= frames[i].t + NATIVE_REST_WINDOW_MS) ?? null
      const stableWindow = stableEnd ? frames.filter(frame => frame.t >= frames[i].t && frame.t <= stableEnd.t) : []
      const residuals = stableWindow.map(frame => stableBetween(frame, finalTarget))
      const progressValues = stableWindow.map(frame => frame.progress).filter(Number.isFinite)
      const progressStable = stableWindow.length > 0 && progressValues.length === stableWindow.length
        && progressValues.every(value => finite(finalTarget.progress) && Math.abs(value - finalTarget.progress) <= PROGRESS_EPS)
      const nativeTargetStable = stableWindow.every(frame => finite(frame.nativeProgress) && finite(finalTarget.nativeProgress)
        && Math.abs(frame.nativeProgress - finalTarget.nativeProgress) <= PROGRESS_EPS)
      if (stableEnd && residuals.length && residuals.every(residual => residual.missing.length === 0 && residual.cameraStable && residual.lampStable) && progressStable && nativeTargetStable) {
        settleFrame = stableEnd
        settleResidual = {
          maxPositionM: Math.max(...residuals.map(residual => residual.position ?? 0)),
          maxTargetM: Math.max(...residuals.map(residual => residual.target ?? 0)),
          maxQuaternionDeg: Math.max(...residuals.map(residual => residual.quaternion ?? 0)),
          maxFovDeg: Math.max(...residuals.map(residual => residual.fov ?? 0)),
          maxLampChannel: Math.max(...residuals.flatMap(residual => Object.values(residual.lamp).filter(value => value !== null))),
          unavailableLampChannels: [...new Set(residuals.flatMap(residual => residual.unavailableLampChannels))],
          progressDrift: progressValues.length ? Math.max(...progressValues) - Math.min(...progressValues) : null,
          everyFrameInWindowStable: true,
          tolerances: residuals[0].tolerances,
        }
        break
      }
    }
  }
  const settleMs = settleFrame ? settleFrame.t - anchorT : null
  const additionalMs = settleFrame && restFrame ? settleFrame.t - restFrame.t : null
  const requiredObservability = ['cameraPosition', 'cameraTarget', 'cameraQuaternion', 'cameraFov', 'progress', 'nativePixels', 'nativeDelta']
  const missingObservability = requiredObservability.filter(key => !frames.some(frame => {
    if (key === 'cameraPosition') return frame.camera?.position?.every(Number.isFinite)
    if (key === 'cameraTarget') return frame.camera?.target?.every(Number.isFinite)
    if (key === 'cameraQuaternion') return frame.camera?.quaternion?.every(Number.isFinite)
    if (key === 'cameraFov') return Number.isFinite(frame.camera?.fov)
    if (key === 'progress') return Number.isFinite(frame.progress)
    if (key === 'nativeDelta') return Number.isFinite(frame.nativeDeltaCssPx)
    return Number.isFinite(frame.renderer?.drawingBufferPixelsDerived)
  }))
  const lampSeen = Object.keys(frames[0]?.lampChannels ?? {}).filter(key => frames.every(frame => Number.isFinite(frame.lampChannels[key])))
  const lampMissing = Object.keys(frames[0]?.lampChannels ?? {}).filter(key => !lampSeen.includes(key))
  const timing = observedTiming(frames)
  const status = !trustedAnchor || timing.status !== 'PASS' || missingObservability.length || !lampSeen.length || lampMissing.length ? 'UNVERIFIED'
    : restMs === null || restMs > NATIVE_REST_LIMIT_MS || additionalMs === null || additionalMs > CAMERA_LAMP_ADDITIONAL_MS
      || settleMs === null || settleMs > TOTAL_SETTLE_LIMIT_MS ? 'FAIL' : 'PASS'
  return {
    label,
    frameCount: frames.length,
    explicitInputMarker: marker,
    timing,
    anchor: { trustedNativeTimestamp: trustedAnchor, anchorT, markerLatencyMs: marker.markerLatencyMs,
      status: trustedAnchor ? 'PASS' : 'UNVERIFIED', note: 'Without trusted timestamp, marker-relative diagnostic latency cannot certify response.' },
    finalTarget,
    nativeRest: {
      threshold: { limitMs: NATIVE_REST_LIMIT_MS, pxPerFrame: NATIVE_REST_PX_PER_FRAME, windowMs: NATIVE_REST_WINDOW_MS },
      observedMs: restMs,
      restFrameNativeY: restFrame?.nativeScrollY ?? null,
    },
    cameraLampSettle: {
      additionalLimitMs: CAMERA_LAMP_ADDITIONAL_MS,
      totalLimitMs: TOTAL_SETTLE_LIMIT_MS,
      observedTotalMs: settleMs,
      observedAfterNativeRestMs: additionalMs,
      stableWindowMs: NATIVE_REST_WINDOW_MS,
      residual: settleResidual,
    },
    lampChannelsSeen: lampSeen,
    lampChannelsMissing: lampMissing,
    missingObservability,
    status,
  }
}

function holdAnalysis(captured, label) {
  const marker = inputMarker(captured, label)
  const frames = captured.frames
  if (!marker) return { status: 'FAIL', reason: 'no final input marker' }
  const start = frames.find(frame => frame.t >= marker.t + TOTAL_SETTLE_LIMIT_MS) ?? null
  const windowFrames = start ? frames.filter(frame => frame.t >= start.t && frame.t <= start.t + HOLD_MS + 100) : []
  if (!start || windowFrames.length < 2) return { status: 'FAIL', reason: 'hold window has insufficient per-rAF samples' }
  const end = windowFrames.at(-1)
  if (!end || end.t - start.t < HOLD_MS) return { status: 'FAIL', reason: 'hold window is shorter than 5000ms', observedDurationMs: end ? end.t - start.t : null }
  const residuals = windowFrames.map(frame => stableBetween(frame, start))
  const progressValues = windowFrames.map(frame => frame.progress).filter(Number.isFinite)
  const progressDrift = progressValues.length === windowFrames.length && finite(start.progress)
    ? Math.max(...progressValues.map(value => Math.abs(value - start.progress))) : null
  const nativeProgressValues = windowFrames.map(frame => frame.nativeProgress)
  const nativeProgressDrift = nativeProgressValues.every(finite) && finite(start.nativeProgress)
    ? Math.max(...nativeProgressValues.map(value => Math.abs(value - start.nativeProgress))) : null
  const lampKeys = Object.keys(windowFrames[0]?.lampChannels ?? {})
  const lampSeen = lampKeys.filter(key => windowFrames.some(frame => Number.isFinite(frame.lampChannels[key])))
  const lampMissing = lampKeys.filter(key => !lampSeen.includes(key))
  const missing = [...new Set([
    ...residuals.flatMap(residual => residual.missing),
    ...(progressDrift === null ? ['progress'] : []),
    ...(nativeProgressDrift === null ? ['nativeProgress'] : []),
    ...lampMissing.map(key => 'lamp.' + key),
  ])]
  const cameraStable = residuals.every(residual => residual.cameraStable)
  const lampStable = lampSeen.length > 0 && residuals.every(residual => residual.lampStable)
  const status = missing.length ? 'UNVERIFIED'
    : progressDrift > PROGRESS_EPS || nativeProgressDrift > PROGRESS_EPS || !cameraStable || !lampStable ? 'FAIL' : 'PASS'
  return {
    label,
    startProbeTimeMs: start.t,
    endProbeTimeMs: end.t,
    observedDurationMs: end.t - start.t,
    requestedDurationMs: HOLD_MS,
    frameCount: windowFrames.length,
    progressDrift,
    nativeProgressDrift,
    declaredStart: start,
    everyFrameExtrema: {
      maxPositionM: Math.max(...residuals.map(residual => residual.position ?? 0)),
      maxTargetM: Math.max(...residuals.map(residual => residual.target ?? 0)),
      maxQuaternionDeg: Math.max(...residuals.map(residual => residual.quaternion ?? 0)),
      maxFovDeg: Math.max(...residuals.map(residual => residual.fov ?? 0)),
      maxLampChannel: Math.max(...residuals.flatMap(residual => Object.values(residual.lamp).filter(value => value !== null))),
      unavailableLampChannels: [...new Set(residuals.flatMap(residual => residual.unavailableLampChannels))],
      cameraStable,
      lampStable,
    },
    missingObservability: missing,
    status,
  }
}

async function wheelSequence(page, label, deltas, gapMs, waitMs) {
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  await page.mouse.move(Math.round(viewport.width / 2), Math.round(viewport.height / 2))
  const before = await readRuntime(page)
  const start = Date.now()
  const dispatches = []
  for (let i = 0; i < deltas.length; i++) {
    await sleepUntil(start, i * gapMs)
    const scheduledOffset = i * gapMs
    const beforeOffset = Date.now() - start
    await page.mouse.wheel(0, deltas[i])
    dispatches.push({ index: i, deltaCssPx: deltas[i], scheduledOffsetMs: scheduledOffset, beforeDispatchOffsetMs: beforeOffset, afterDispatchOffsetMs: Date.now() - start })
  }
  await markInput(page, label + ':end')
  await sleep(waitMs)
  const after = await readRuntime(page)
  const captured = await drainProbe(page)
  const displacementPx = finite(before.scrollY) && finite(after.scrollY) ? after.scrollY - before.scrollY : null
  return {
    label,
    input: 'Playwright page.mouse.wheel (native wheel)',
    cadence: { requestedGapMs: gapMs, requestedCount: deltas.length, requestedDeltaPx: deltas[0] },
    dispatches,
    before: { progress: before.progress, nativeProgress: before.nativeProgress, scrollY: before.scrollY },
    after: { progress: after.progress, nativeProgress: after.nativeProgress, scrollY: after.scrollY },
    nativeDisplacementPx: displacementPx,
    response: responseAnalysis(captured, label + ':end'),
    probe: captured,
  }
}

async function touchSwipe(client, index, direction, width, height, rosterStart) {
  const label = 'touch:' + direction + ':' + index
  const startOffset = index * 1000
  const startX = Math.round(width / 2)
  const startY = Math.round(height * (direction === 'forward' ? 0.8 : 0.2))
  const endY = Math.round(height * (direction === 'forward' ? 0.2 : 0.8))
  const scheduledStart = rosterStart + startOffset
  await sleepUntil(rosterStart, startOffset)
  const events = []
  const send = async (type, y, offset, moveIndex = null) => {
    const before = Date.now() - rosterStart
    await client.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x: startX, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }],
    })
    events.push({ type, x: startX, y, moveIndex, scheduledOffsetMs: offset, beforeDispatchOffsetMs: before, afterDispatchOffsetMs: Date.now() - rosterStart })
  }
  await send('touchStart', startY, startOffset)
  const moveCount = 30
  for (let i = 1; i <= moveCount; i++) {
    const offset = startOffset + Math.round(i * 500 / moveCount)
    await sleepUntil(rosterStart, offset)
    const y = startY + (endY - startY) * (i / moveCount)
    await send('touchMove', Math.round(y), offset, i)
  }
  await send('touchEnd', endY, startOffset + 500)
  return { label, direction, index, start: { x: startX, y: startY }, end: { x: startX, y: endY }, requestedDurationMs: 500, events }
}

async function touchCategory(page, client) {
  const segments = []
  const before = await readRuntime(page)
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
  const rosterStart = Date.now()
  const swipes = []
  for (let i = 0; i < 20; i++) {
    const direction = i < 10 ? 'forward' : 'reverse'
    await markInput(page, 'touch:start:' + i)
    const swipe = await touchSwipe(client, i, direction, viewport.width, viewport.height, rosterStart)
    swipes.push(swipe)
    await markInput(page, 'touch:end:' + i)
  }
  const label = 'touch:end:19'
  await sleep(TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS)
  const after = await readRuntime(page)
  const captured = await drainProbe(page)
  const movementAssertions = []
  segments.push({
    label: 'touch',
    input: 'installed CDP Input.dispatchTouchEvent (emulated gesture; not physical touch)',
    cdpSchema: {
      method: 'Input.dispatchTouchEvent',
      types: ['touchStart', 'touchMove', 'touchEnd', 'touchCancel'],
      touchPointRequiredFields: ['x', 'y'],
      endRule: 'touchEnd touchPoints=[]; start/move touchPoints have one id=1 point',
      source: 'installed playwright-core/types/protocol.d.ts',
    },
    cadence: { swipes: 10, reverseSwipes: 10, requestedDurationMs: 500, requestedGapMs: 500, moveEventCountPerSwipe: 30 },
    swipes,
    before: { progress: before.progress, nativeProgress: before.nativeProgress, scrollY: before.scrollY },
    after: { progress: after.progress, nativeProgress: after.nativeProgress, scrollY: after.scrollY },
    response: responseAnalysis(captured, label),
    hold: holdAnalysis(captured, label),
    probe: captured,
  })
  for (let i = 0; i < 20; i++) {
    const start = inputMarker(captured, 'touch:start:' + i)
    const end = inputMarker(captured, 'touch:end:' + i)
    const swipeFrames = start && end ? captured.frames.filter(frame => frame.t >= start.t && frame.t <= end.t) : []
    const firstY = swipeFrames.find(frame => frame.nativeScrollY !== null)?.nativeScrollY ?? null
    const lastY = swipeFrames.findLast(frame => frame.nativeScrollY !== null)?.nativeScrollY ?? null
    const displacement = firstY !== null && lastY !== null ? lastY - firstY : null
    const direction = i < 10 ? 1 : -1
    check(movementAssertions, 'touch swipe ' + i + ' produces native movement in requested direction',
      displacement !== null && Math.abs(displacement) > 0 && Math.sign(displacement) === direction,
      { firstY, lastY, displacementPx: displacement, direction })
  }
  return { status: aggregateStatus([...segments.flatMap(segment => [segment.response.status, segment.hold.status]), ...movementAssertions.map(item => item.status)]), assertions: movementAssertions, segments }
}

async function pressCadence(page, label, key, count, gapMs, waitMs) {
  const before = await readRuntime(page)
  const start = Date.now()
  const dispatches = []
  for (let i = 0; i < count; i++) {
    await sleepUntil(start, i * gapMs)
    const beforeOffset = Date.now() - start
    await page.keyboard.press(key)
    dispatches.push({ key, index: i, scheduledOffsetMs: i * gapMs, beforeDispatchOffsetMs: beforeOffset, afterDispatchOffsetMs: Date.now() - start })
  }
  await markInput(page, label + ':end')
  await sleep(waitMs)
  const after = await readRuntime(page)
  const captured = await drainProbe(page)
  return {
    label,
    input: 'Playwright page.keyboard.press (native key events)',
    cadence: { key, count, requestedGapMs: gapMs },
    dispatches,
    before: { progress: before.progress, scrollY: before.scrollY },
    after: { progress: after.progress, scrollY: after.scrollY },
    response: responseAnalysis(captured, label + ':end'),
    probe: captured,
  }
}

async function focusState(page) {
  return page.evaluate(() => {
    const active = document.activeElement
    const style = active ? getComputedStyle(active) : null
    const trigger = document.querySelector('.torque-inspection__toggle')
    return {
      activeElement: active ? {
        tag: active.tagName.toLowerCase(), id: active.id || null, className: String(active.className || ''),
        text: (active.textContent || '').trim().slice(0, 120),
        focusVisible: active.matches(':focus-visible'),
      } : null,
      activeIsInspectionToggle: active === trigger,
      triggerExpanded: trigger?.getAttribute('aria-expanded') ?? null,
      panelHidden: document.querySelector('#torque-inspection-detail')?.hidden ?? null,
      focusOutline: style ? { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow } : null,
      visibilityState: document.visibilityState,
    }
  })
}

async function keyboardCategory(page) {
  const segments = []
  const append = async (key, count, gap, wait, final = false) => {
    const label = 'keyboard:' + key
    const segment = await pressCadence(page, label, key, count, gap, wait)
    if (final) {
      await markInput(page, label + ':hold')
      await sleep(TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS)
      const holdFrames = await drainProbe(page)
      segment.hold = holdAnalysis(holdFrames, label + ':hold')
      segment.probe = { ...segment.probe, hold: holdFrames }
    }
    segments.push(segment)
  }
  await append('ArrowDown', 10, 100, 2200)
  await append('PageDown', 3, 500, 2200)
  await append('ArrowUp', 10, 100, 2200)
  await append('PageUp', 3, 500, 2200)
  await append('Home', 1, 100, 2200)
  await append('End', 1, 100, TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS, true)
  const movementAssertions = []
  for (const segment of segments) {
    const direction = segment.label === 'keyboard:Home' ? -1
      : segment.label === 'keyboard:ArrowUp' || segment.label === 'keyboard:PageUp' ? -1 : 1
    const displacement = segment.before.scrollY !== null && segment.after.scrollY !== null ? segment.after.scrollY - segment.before.scrollY : null
    const alreadyAtHome = segment.label === 'keyboard:Home' && Math.abs(segment.before.scrollY) <= .5
    check(movementAssertions, segment.label + ' produces native movement in requested direction',
      displacement !== null && (alreadyAtHome ? Math.abs(displacement) <= .5 : Math.abs(displacement) > 0 && Math.sign(displacement) === direction),
      { beforeScrollY: segment.before.scrollY, afterScrollY: segment.after.scrollY, displacementPx: displacement, direction })
  }

  const focus = { attempts: [], assertions: [] }
  const record = (name, state) => focus.attempts.push({ name, state })
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Shift+Tab')
    const state = await focusState(page)
    record('Shift+Tab:' + i, state)
    if (state.activeIsInspectionToggle) break
  }
  const found = focus.attempts.at(-1)?.state.activeIsInspectionToggle === true
  check(focus.assertions, 'keyboard: native Shift+Tab reaches inspection control', found, focus.attempts.map(item => item.state.activeElement))
  if (found) {
    await page.keyboard.press('Tab')
    const tabForward = await focusState(page)
    record('Tab-forward', tabForward)
    await page.keyboard.press('Shift+Tab')
    const tabBack = await focusState(page)
    record('Shift+Tab-back', tabBack)
    check(focus.assertions, 'keyboard: Tab/Shift+Tab move focus and return', tabForward.activeIsInspectionToggle === false && tabBack.activeIsInspectionToggle === true, { forward: tabForward.activeElement, back: tabBack.activeElement })
    check(focus.assertions, 'keyboard: trigger has visible focus state', tabBack.activeElement?.focusVisible === true || /[^0]\s*px/.test(String(tabBack.focusOutline?.outlineWidth)) || tabBack.focusOutline?.boxShadow !== 'none', tabBack)

    await page.keyboard.press('Enter')
    const enterOpen = await focusState(page)
    record('Enter-open', enterOpen)
    check(focus.assertions, 'keyboard: Enter opens disclosure', enterOpen.triggerExpanded === 'true' && enterOpen.panelHidden === false, enterOpen)
    await page.keyboard.press('Escape')
    const escapeClose = await focusState(page)
    record('Escape-close', escapeClose)
    check(focus.assertions, 'keyboard: Escape closes and returns trigger focus', escapeClose.triggerExpanded === 'false' && escapeClose.panelHidden === true && escapeClose.activeIsInspectionToggle === true, escapeClose)
    await page.keyboard.press('Enter')
    const reopen = await focusState(page)
    await page.keyboard.press('Space')
    await markInput(page, 'keyboard:Space:end')
    const spaceClose = await focusState(page)
    record('Space-close', spaceClose)
    check(focus.assertions, 'keyboard: Space activates trigger and closes disclosure', reopen.triggerExpanded === 'true' && spaceClose.triggerExpanded === 'false' && spaceClose.panelHidden === true, { reopen, spaceClose })
    await sleep(TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS)
    const captured = await drainProbe(page)
    const response = responseAnalysis(captured, 'keyboard:Space:end')
    const hold = holdAnalysis(captured, 'keyboard:Space:end')
    segments.push({ label: 'keyboard:focus-controls', input: 'native Tab/Shift+Tab/Enter/Space/Escape', focus, response, hold, probe: captured })
    return { status: aggregateStatus([...segments.flatMap(segment => [segment.response?.status ?? 'PASS', segment.hold?.status ?? 'PASS']), ...movementAssertions.map(item => item.status), ...focus.assertions.map(item => item.status)]), assertions: [...movementAssertions, ...focus.assertions], segments }
  }
  await markInput(page, 'keyboard:focus-fallback:end')
  await sleep(TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS)
  const captured = await drainProbe(page)
  segments.push({ label: 'keyboard:focus-controls', input: 'native Tab/Shift+Tab/Enter/Space/Escape', focus, response: responseAnalysis(captured, 'keyboard:focus-fallback:end'), hold: holdAnalysis(captured, 'keyboard:focus-fallback:end'), probe: captured })
  return { status: aggregateStatus([...segments.flatMap(segment => [segment.response?.status ?? 'PASS', segment.hold?.status ?? 'PASS']), ...movementAssertions.map(item => item.status), ...focus.assertions.map(item => item.status)]), assertions: [...movementAssertions, ...focus.assertions], segments }
}

async function scrollbarDragTo(page, target) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth, height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    scrollY,
  }))
  const scrollbarPx = 17
  const track = Math.max(1, geometry.height - scrollbarPx * 2)
  const thumb = Math.max(scrollbarPx, track * geometry.clientHeight / Math.max(1, geometry.scrollHeight))
  const thumbCenter = scrollbarPx + thumb / 2 + (track - thumb) * target
  const currentFraction = geometry.scrollY / Math.max(1, geometry.scrollHeight - geometry.clientHeight)
  const currentThumbCenter = scrollbarPx + thumb / 2 + (track - thumb) * currentFraction
  const x = Math.max(1, geometry.width - Math.ceil(scrollbarPx / 2))
  const events = []
  const start = Date.now()
  await page.mouse.move(x, Math.round(currentThumbCenter), { steps: 2 })
  await page.mouse.down()
  events.push({ type: 'down', x, y: currentThumbCenter, offsetMs: Date.now() - start })
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(x, Math.round(thumbCenter), { steps: 1 })
    await sleep(20)
    events.push({ type: 'move', x, y: thumbCenter, step: i, offsetMs: Date.now() - start })
  }
  await page.mouse.up()
  events.push({ type: 'up', x, y: thumbCenter, offsetMs: Date.now() - start })
  return { target, thumbModel: { assumedScrollbarPx: scrollbarPx, trackPx: track, thumbPx: thumb, thumbCenter }, events }
}

async function nativeScrollbarOrDirectSeek(page, target, viewportKey) {
  if (viewportKey === 'D') {
    const drag = await scrollbarDragTo(page, target)
    return { method: 'classic-scrollbar mouse drag', drag }
  }
  await page.evaluate(progress => {
    const element = document.scrollingElement || document.documentElement
    const max = Math.max(0, element.scrollHeight - element.clientHeight)
    window.scrollTo(0, Math.round(max * progress))
  }, target)
  return { method: 'native direct seek (N has no classic-scrollbar assumption)', drag: null }
}

async function directSeek(page, target, settleMs = 300) {
  const beforeFrame = await page.evaluate(() => window.__jg038InputResponseProbe.frames.at(-1)?.worldFrame ?? 0)
  const pixels = await page.evaluate(progress => {
    const element = document.scrollingElement || document.documentElement
    const max = Math.max(0, element.scrollHeight - element.clientHeight)
    const requestedPixel = Math.round(max * progress)
    window.scrollTo(0, requestedPixel)
    return { maxScrollAtDispatch: max, unquantizedPixel: max * progress, requestedPixel,
      quantizedProgress: requestedPixel / max, quantizationErrorPx: requestedPixel - max * progress }
  }, target)
  await page.waitForFunction(({ pixels, beforeFrame }) => {
    const element = document.scrollingElement || document.documentElement
    const max = Math.max(0, element.scrollHeight - element.clientHeight)
    const snapshot = window.__torqueWorld?.snapshot?.()
    return (snapshot?.frames ?? 0) > beforeFrame && max > 0
      && Math.abs(scrollY - pixels.requestedPixel) <= 0.5
      && Number.isFinite(snapshot?.progress) && Math.abs(snapshot.progress - scrollY / max) <= 0.5 / max
  }, { pixels, beforeFrame }, { timeout: 15000, polling: 50 })
  await sleep(CAMERA_BOUNDARIES.some(seam => Math.abs(target - seam) <= 0.001) ? 1000 : settleMs)
  const observed = withDerivedRoll(await readRuntime(page))
  return { ...observed, observedProgress: observed.progress, pixels,
    landingErrorPx: observed.scrollY - pixels.requestedPixel,
    canonicalLandingErrorPx: (observed.progress - observed.scrollY / observed.maxScroll) * observed.maxScroll }
}

function boundaryTargets(beats) {
  const values = new Set(SEEK_TARGETS)
  for (const seam of CAMERA_BOUNDARIES) {
    values.add(Math.max(0, seam - 0.001)); values.add(seam); values.add(Math.min(1, seam + 0.001))
  }
  for (const beat of beats) {
    for (const value of [beat.start, beat.end]) {
      values.add(Math.max(0, value - 0.001)); values.add(value); values.add(Math.min(1, value + 0.001))
    }
  }
  return [...values].map(value => Math.round(value * 1000000) / 1000000).sort((a, b) => a - b)
}

function boundaryAnalysis(forward, reverse) {
  const derivative = (a, b) => {
    const dp = finite(a.observedProgress) && finite(b.observedProgress) ? b.observedProgress - a.observedProgress : null
    const denominator = dp !== null && Math.abs(dp) > 1e-12 ? Math.abs(dp) : null
    const position = dist3(a.camera?.position, b.camera?.position)
    const target = dist3(a.camera?.target, b.camera?.target)
    const quaternion = quatAngleDeg(a.camera?.quaternion, b.camera?.quaternion)
    const fov = channelDelta(a.camera?.fov, b.camera?.fov)
    const roll = channelDelta(a.camera?.rollDegDerivedFromQuaternion, b.camera?.rollDegDerivedFromQuaternion)
    return {
      from: a.requested, to: b.requested,
      observedProgressDelta: dp,
      positionDeltaM: position, targetDeltaM: target, quaternionDeltaDeg: quaternion,
      fovDeltaDeg: fov, rollDeltaDegDerived: roll,
      perCanonicalProgress: denominator === null ? null : {
        positionM: position !== null ? position / denominator : null,
        targetM: target !== null ? target / denominator : null,
        quaternionDeg: quaternion !== null ? quaternion / denominator : null,
        fovDeg: fov !== null ? fov / denominator : null,
        rollDegDerived: roll !== null ? roll / denominator : null,
      },
    }
  }
  const derivatives = forward.slice(1).map((sample, i) => derivative(forward[i], sample))
  const reverseDerivatives = reverse.slice(1).map((sample, i) => derivative(reverse[i], sample))
  const seams = CAMERA_BOUNDARIES.map(seam => {
    const near = value => forward.find(sample => Math.abs(sample.requested - value) <= 5e-7)
    const left = near(Math.max(0, seam - 0.001))
    const at = near(seam)
    const right = near(Math.min(1, seam + 0.001))
    const samples = [left, at, right].filter(Boolean)
    return {
      seam,
      poseSamples: samples,
      leftDerivative: left && at ? derivative(left, at) : null,
      rightDerivative: at && right ? derivative(at, right) : null,
      interpretation: 'raw finite-difference evidence only; no whole-path C1 numerical threshold is asserted',
    }
  })
  const reverseByTarget = new Map(reverse.map(sample => [sample.requested, sample]))
  const matched = forward.map(sample => {
    const other = reverseByTarget.get(sample.requested)
    return other ? { requested: sample.requested, forward: sample, reverse: other, residual: stableBetween(sample, other) } : null
  }).filter(Boolean)
  return {
    forwardCount: forward.length,
    reverseCount: reverse.length,
    derivatives,
    reverseDerivatives,
    seams,
    largestPositionDelta: derivatives.length && derivatives.every(item => finite(item.positionDeltaM))
      ? Math.max(...derivatives.map(item => item.positionDeltaM)) : null,
    largestQuaternionDeltaDeg: derivatives.length && derivatives.every(item => finite(item.quaternionDeltaDeg))
      ? Math.max(...derivatives.map(item => item.quaternionDeltaDeg)) : null,
    matchedProgressResiduals: matched,
    c1Claim: 'NONE: raw poses/finite differences only; InspectionDirector CPU C1 coverage is not whole-path RuntimeWorld coverage',
  }
}

async function scrollbarCategory(page, viewportKey) {
  const segments = []
  const samples = { forward: [], reverse: [] }
  for (const direction of ['forward', 'reverse']) {
    const targets = direction === 'forward' ? SEEK_TARGETS : [...SEEK_TARGETS].reverse()
    for (const target of targets) {
      const before = await readRuntime(page)
      const seek = await nativeScrollbarOrDirectSeek(page, target, viewportKey)
      const label = 'scrollbar:' + direction + ':' + target
      await markInput(page, label + ':end')
      await sleep(TOTAL_SETTLE_LIMIT_MS + 500)
      const after = await readRuntime(page)
      const captured = await drainProbe(page)
      const sample = { direction, requested: target, before: { nativeProgress: before.nativeProgress, scrollY: before.scrollY }, observedProgress: after.progress, ...after }
      samples[direction].push(sample)
      segments.push({
        label,
        input: seek.method,
        drag: seek.drag,
        response: responseAnalysis(captured, label + ':end'),
        observed: sample,
        probe: captured,
      })
    }
  }

  const reloadSeek = await nativeScrollbarOrDirectSeek(page, 0.5, viewportKey)
  await markInput(page, 'scrollbar:reload:before')
  await sleep(TOTAL_SETTLE_LIMIT_MS + 500)
  const beforeReload = await readRuntime(page)
  const beforeReloadProbe = await drainProbe(page)
  segments.push({ label: 'reload-pre-navigation', input: reloadSeek.method, probe: beforeReloadProbe })
  const reloadStarted = Date.now()
  await page.reload({ waitUntil: 'domcontentloaded', timeout: READY_TIMEOUT_MS })
  await waitForReady(page)
  await page.evaluate(() => window.__jg038InputResponseProbe.start('scrollbar:reload:after'))
  await sleep(TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS)
  const afterReload = await readRuntime(page)
  const reloadFrames = await drainProbe(page)
  segments.push({
    label: 'scrollbar:reload@0.5',
    input: reloadSeek.method + ' to .5 followed by page.reload',
    beforeReload, afterReload, reloadDurationMs: Date.now() - reloadStarted,
    response: responseAnalysis(reloadFrames, 'scrollbar:reload:after'),
    hold: holdAnalysis(reloadFrames, 'scrollbar:reload:after'),
    probe: reloadFrames,
  })

  const runtime = await readRuntime(page)
  const targets = boundaryTargets(runtime.beats ?? [])
  const forward = []
  for (const target of targets) forward.push({ requested: target, ...(await directSeek(page, target)) })
  const reverse = []
  for (const target of [...targets].reverse()) reverse.push({ requested: target, ...(await directSeek(page, target)) })
  const boundary = boundaryAnalysis(forward, reverse)
  const boundaryProbe = await drainProbe(page)
  segments.push({ label: 'whole-path-boundaries', input: 'native direct seeks', probe: boundaryProbe })

  const assertions = []
  const reloadResidual = stableBetween(beforeReload, afterReload)
  check(assertions, 'reload: actual before and after canonical/native progress stay at .5',
    [beforeReload, afterReload].every(sample => finite(sample.progress) && finite(sample.nativeProgress)
      && Math.abs(sample.progress - .5) <= SEEK_PROGRESS_TOL && Math.abs(sample.nativeProgress - .5) <= SEEK_PROGRESS_TOL),
    { before: beforeReload, after: afterReload })
  check(assertions, 'reload: camera and available lamps reproduce pre-reload pose',
    reloadResidual.cameraStable && reloadResidual.lampStable, reloadResidual)
  check(assertions, 'reload: unavailable lamp channels explicitly unverified',
    reloadResidual.missing.length ? 'UNVERIFIED' : true, reloadResidual.missing)
  const allBoundarySamples = [...forward, ...reverse]
  check(assertions, 'boundaries: finite camera/progress, pixel landing and canonical mapping',
    allBoundarySamples.length > 0 && allBoundarySamples.every(sample => finite(sample.observedProgress)
      && dist3(sample.camera?.position, sample.camera?.position) === 0
      && dist3(sample.camera?.target, sample.camera?.target) === 0
      && quatAngleDeg(sample.camera?.quaternion, sample.camera?.quaternion) !== null && finite(sample.camera?.fov)
      && finite(sample.landingErrorPx) && Math.abs(sample.landingErrorPx) <= .5
      && finite(sample.canonicalLandingErrorPx) && Math.abs(sample.canonicalLandingErrorPx) <= .5
      && finite(sample.pixels?.quantizationErrorPx) && Math.abs(sample.pixels.quantizationErrorPx) <= .5),
    allBoundarySamples.map(sample => ({ requested: sample.requested, observed: sample.observedProgress,
      pixels: sample.pixels, nativePixel: sample.scrollY, landingErrorPx: sample.landingErrorPx,
      canonicalLandingErrorPx: sample.canonicalLandingErrorPx })))
  check(assertions, 'boundaries: distinct adjacent pixel targets and finite derivatives',
    forward.slice(1).every((sample, i) => sample.pixels.requestedPixel !== forward[i].pixels.requestedPixel)
      && reverse.slice(1).every((sample, i) => sample.pixels.requestedPixel !== reverse[i].pixels.requestedPixel)
      && boundary.derivatives.length > 0 && boundary.reverseDerivatives.length > 0
      && [...boundary.derivatives, ...boundary.reverseDerivatives].every(item => item.perCanonicalProgress
        && ['positionM', 'targetM', 'quaternionDeg', 'fovDeg'].every(key => finite(item.perCanonicalProgress[key]))),
    { forward: boundary.derivatives, reverse: boundary.reverseDerivatives })
  boundary.rollObservability = {
    status: [...boundary.derivatives, ...boundary.reverseDerivatives].some(item => item.rollDeltaDegDerived === null) ? 'UNVERIFIED' : 'PASS',
    note: 'World-up-derived roll is undefined at a top-down view; null is retained. Quaternion orientation remains the nonsingular angular witness.',
  }
  for (const direction of ['forward', 'reverse']) {
    check(assertions, 'scrollbar ' + direction + ': every requested canonical seek lands within ±.001',
      samples[direction].every(sample => finite(sample.observedProgress) && Math.abs(sample.observedProgress - sample.requested) <= SEEK_PROGRESS_TOL),
      samples[direction].map(sample => ({ requested: sample.requested, observed: sample.observedProgress })))
  }
  for (const sample of [...samples.forward, ...samples.reverse]) {
    const requestedDelta = sample.requested - (sample.before.nativeProgress ?? sample.requested)
    const displacement = finite(sample.scrollY) && finite(sample.before.scrollY) ? sample.scrollY - sample.before.scrollY : null
    check(assertions, 'scrollbar seek ' + sample.requested + ' native movement matches no-op/change expectation',
      displacement !== null && (Math.abs(requestedDelta) <= SEEK_PROGRESS_TOL ? Math.abs(displacement) <= 0.5 : Math.abs(displacement) > 0 && Math.sign(displacement) === Math.sign(requestedDelta)),
      { requestedDelta, displacementPx: displacement, before: sample.before, after: { progress: sample.observedProgress, scrollY: sample.scrollY } })
  }
  const targetSamples = forward.filter(sample => SEEK_TARGETS.includes(sample.requested))
  check(assertions, 'boundary roster includes exact 0/.25/.5/.75/1 coverage', SEEK_TARGETS.every(target => targetSamples.some(sample => sample.requested === target)), targetSamples.map(sample => sample.requested))
  check(assertions, 'boundary roster covers every beat boundary ±.001',
    runtime.beats?.length > 0 && runtime.beats.every(beat => [beat.start, beat.end].every(value => [Math.max(0, value - .001), value, Math.min(1, value + .001)].every(target => forward.some(sample => Math.abs(sample.requested - target) <= 5e-7)))),
    (runtime.beats ?? []).map(beat => ({ id: beat.id, start: beat.start, end: beat.end })))
  check(assertions, 'boundary roster covers every explicit RuntimeWorld seam ±.001',
    CAMERA_BOUNDARIES.every(seam => [seam - .001, seam, seam + .001].every(target => forward.some(sample => Math.abs(sample.requested - target) <= 5e-7))), CAMERA_BOUNDARIES)
  check(assertions, 'forward/reverse matched-progress camera/lamp residuals within contract hold tolerances',
    boundary.matchedProgressResiduals.some(item => item.residual.missing.length) ? 'UNVERIFIED'
      : boundary.matchedProgressResiduals.every(item => item.residual.cameraStable && item.residual.lampStable),
    boundary.matchedProgressResiduals.map(item => ({ requested: item.requested, residual: item.residual })))

  const responseStatuses = segments.flatMap(segment => [segment.response?.status, segment.hold?.status].filter(Boolean))
  return { status: aggregateStatus([...responseStatuses, ...assertions.map(item => item.status)]), segments, boundary, assertions }
}

function aggregateStatus(statuses) {
  return statuses.includes('FAIL') ? 'FAIL' : statuses.includes('UNVERIFIED') ? 'UNVERIFIED' : statuses.length > 0 && statuses.every(status => status === 'PASS') ? 'PASS' : 'FAIL'
}

function probeRecords(segments) {
  return segments.flatMap(segment => [segment.probe, segment.probe?.hold].filter(Boolean))
}

function runtimeIdentityAssertions(assertions, runtime, viewport, tier, label, initial = null) {
  check(assertions, label + ': actual viewport and device DPR', runtime.viewport?.innerWidth === viewport.width
    && runtime.viewport?.innerHeight === viewport.height && runtime.viewport?.devicePixelRatio === viewport.deviceScaleFactor, runtime.viewport)
  check(assertions, label + ': actual live tier', runtime.tier === tier && runtime.mode === 'live', { tier: runtime.tier, mode: runtime.mode })
  const backend = runtime.renderer?.backend
  check(assertions, label + ': observed backend', typeof backend === 'string' && backend.length > 0 ? true : 'UNVERIFIED', backend ?? null)
  if (initial) check(assertions, label + ': backend/DPR consistent with start',
    backend && initial.renderer?.backend ? backend === initial.renderer.backend
      && runtime.renderer?.effectiveDpr === initial.renderer?.effectiveDpr : 'UNVERIFIED',
    { start: initial.renderer, end: runtime.renderer })
}

async function runCategory(browser, category, options, provenance) {
  const viewport = VIEWPORTS[options.viewport]
  const tier = options.tier
  const started = Date.now()
  let context = null
  let client = null
  const collectors = { consoleErrors: [], pageErrors: [], requestFailed: [], httpErrors: [] }
  const result = { category, requestedViewport: viewport.label, requestedTier: tier, assertions: [], status: 'FAIL' }
  const inner = async () => {
    context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      isMobile: viewport.isMobile,
      hasTouch: viewport.key === 'N' || category === 'touch',
      serviceWorkers: 'block',
      reducedMotion: 'no-preference',
    })
    const page = await context.newPage()
    page.on('console', message => { if (message.type() === 'error') collectors.consoleErrors.push(message.text()) })
    page.on('pageerror', error => collectors.pageErrors.push(String(error)))
    page.on('requestfailed', request => collectors.requestFailed.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }))
    page.on('response', response => { if (response.status() >= 400) collectors.httpErrors.push({ url: response.url(), status: response.status() }) })
    await page.addInitScript(inputProbeInit)
    const url = new URL(options.url)
    url.searchParams.set('quality', tier)
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: READY_TIMEOUT_MS })
    await waitForReady(page)
    await page.evaluate(() => window.__jg038InputResponseProbe.start('ready'))
    const runtime = await readRuntime(page)
    result.runtimeStart = runtime
    result.actualViewport = runtime.viewport
    result.actualTier = runtime.tier
    result.renderer = runtime.renderer
    runtimeIdentityAssertions(result.assertions, runtime, viewport, tier, category + ' start')
    const scripts = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map(element => new URL(element.src).pathname))
    check(result.assertions, category + ': loaded entry identity', scripts.includes(provenance.expectedEntry), scripts)
    check(result.assertions, category + ': requested tier is active', runtime.tier === tier, { requested: tier, observed: runtime.tier })
    check(result.assertions, category + ': installed world reports a renderer backend', typeof runtime.renderer?.backend === 'string' && runtime.renderer.backend.length > 0 ? true : 'UNVERIFIED', runtime.renderer?.backend ?? null)
    if (category === 'wheel') {
      const wheel = await wheelCategory(page)
      result.segments = wheel.segments
      result.assertions.push(...wheel.assertions)
    } else if (category === 'touch') {
      client = await context.newCDPSession(page)
      const touch = await touchCategory(page, client)
      result.segments = touch.segments
      result.assertions.push(...touch.assertions)
    } else if (category === 'keyboard') {
      const keyboard = await keyboardCategory(page)
      result.segments = keyboard.segments
      result.assertions.push(...keyboard.assertions)
    } else if (category === 'scrollbar') {
      const scrollbar = await scrollbarCategory(page, viewport.key)
      result.segments = scrollbar.segments
      result.boundary = scrollbar.boundary
      result.assertions.push(...scrollbar.assertions)
    }
    await page.evaluate(() => window.__jg038InputResponseProbe.mark('ending-refresh:start'))
    await sleep(1200)
    result.runtimeEnd = await readRuntime(page)
    runtimeIdentityAssertions(result.assertions, result.runtimeEnd, viewport, tier, category + ' end', runtime)
    const leftover = await drainProbe(page)
    result.segments.push({ label: 'end-seal', probe: leftover })
    const endingMarker = inputMarker(leftover, 'ending-refresh:start')
    result.endingTiming = observedTiming(endingMarker ? leftover.frames.filter(frame => frame.t >= endingMarker.t) : [])
    check(result.assertions, category + ': ending observed reference rAF cadence',
      result.endingTiming.status === 'PASS' ? true : 'UNVERIFIED', result.endingTiming)
    const probes = probeRecords(result.segments)
    check(result.assertions, category + ': zero probe errors', probes.every(probe => probe.errors?.length === 0), probes.flatMap(probe => probe.errors ?? ['missing errors field']))
    check(result.assertions, category + ': zero dropped samples', probes.every(probe => probe.dropped === 0), probes.map(probe => probe.dropped))
    result.observedTiming = observedTiming(probes.flatMap(probe => probe.frames ?? []))
    result.cadence = { status: 'UNVERIFIED', tolerance: null, note: 'Actual dispatch/native event offsets retained; no approved cadence tolerance exists.' }
    for (const segment of result.segments) {
      if (segment.cadence) Object.assign(segment.cadence, { status: 'UNVERIFIED', tolerance: null })
    }
    check(result.assertions, category + ': zero console errors', collectors.consoleErrors.length === 0, collectors.consoleErrors)
    check(result.assertions, category + ': zero uncaught page errors', collectors.pageErrors.length === 0, collectors.pageErrors)
    check(result.assertions, category + ': zero failed requests', collectors.requestFailed.length === 0, collectors.requestFailed)
    check(result.assertions, category + ': zero HTTP errors', collectors.httpErrors.length === 0, collectors.httpErrors)
    const segmentStatuses = result.segments?.flatMap(segment => [segment.response?.status, segment.hold?.status].filter(Boolean)) ?? []
    result.selectedFunctionalStatus = aggregateStatus([...result.assertions.map(item => item.status),
      ...result.segments.flatMap(segment => [segment.hold?.status].filter(Boolean))])
    result.responseTimingStatus = aggregateStatus([result.observedTiming.status, ...result.segments.flatMap(segment => [segment.response?.status].filter(Boolean))])
    result.status = aggregateStatus([...result.assertions.map(item => item.status), ...segmentStatuses, result.cadence.status, result.observedTiming.status])
  }
  let timer
  const watchdog = new Promise(resolve => {
    timer = setTimeout(() => { result.watchdog = true; resolve({ watchdog: true }) }, CASE_TIMEOUT_MS)
  })
  try {
    const raced = await Promise.race([inner(), watchdog])
    if (raced?.watchdog) result.watchdog = true
  } catch (error) {
    check(result.assertions, category + ': category completed without harness exception', false, String(error?.stack ?? error))
    result.status = 'FAIL'
  } finally {
    clearTimeout(timer)
    if (client) await client.detach().catch(() => {})
    if (context) await context.close().catch(() => {})
  }
  if (result.watchdog) {
    check(result.assertions, category + ': bounded watchdog', false, 'exceeded ' + CASE_TIMEOUT_MS + 'ms; context closed')
    result.status = 'FAIL'
  }
  result.durationMs = Date.now() - started
  result.collectors = collectors
  result.provenanceBindings = { buildDir: provenance.buildDir, scenePath: provenance.scenePath }
  return result
}

async function wheelCategory(page) {
  const segments = []
  const assertions = []
  const runs = [
    ['small', Array(12).fill(120), 100, 3200],
    ['large', Array(4).fill(1200), 100, 3200],
    ['reverse', Array(4).fill(-1200), 100, TOTAL_SETTLE_LIMIT_MS + 500 + HOLD_MS],
  ]
  for (const [name, deltas, gap, wait] of runs) {
    const segment = await wheelSequence(page, 'wheel:' + name, deltas, gap, wait)
    segments.push(segment)
    check(assertions, 'wheel ' + name + ': requested count/deltas dispatched', segment.dispatches.length === deltas.length, segment.dispatches)
    check(assertions, 'wheel ' + name + ': actual cadence offsets are recorded', segment.dispatches.every(event => finite(event.afterDispatchOffsetMs)), segment.dispatches.map(event => event.afterDispatchOffsetMs))
    check(assertions, 'wheel ' + name + ': native displacement is nonzero with requested sign',
      segment.nativeDisplacementPx !== null && Math.abs(segment.nativeDisplacementPx) > 0 && Math.sign(segment.nativeDisplacementPx) === Math.sign(deltas[0]),
      { beforeScrollY: segment.before.scrollY, afterScrollY: segment.after.scrollY, displacementPx: segment.nativeDisplacementPx })
    if (name === 'reverse') {
      segment.hold = holdAnalysis(segment.probe, 'wheel:reverse:end')
    }
  }
  return { segments, assertions }
}

async function main() {
  const args = parseArgs()
  const url = validateUrl(requireValue(args, 'url'))
  const buildDir = validateBuildDir(requireValue(args, 'build-dir'))
  const viewport = args.viewport !== undefined ? requireValue(args, 'viewport').toUpperCase() : 'D'
  if (!VIEWPORTS[viewport]) usage('--viewport must be D or N')
  const tier = args.tier !== undefined ? requireValue(args, 'tier') : 'full'
  if (!TIERS.includes(tier)) usage('--tier must be full or lite')
  const categories = args.categories ?? [...CATEGORIES]
  const outPath = args.out !== undefined ? validateOut(requireValue(args, 'out')) : defaultOut(viewport, tier)
  const selectedCategories = CATEGORIES.filter(category => categories.includes(category))
  if (!selectedCategories.length) usage('category selection is empty')

  const report = {
    harness: 'verify-torque-input-response',
    release: {
      id: 'JG038-local-resumption-W1',
      checkpoint: 'C:/Users/Markimus/AppData/Local/Temp/JG-038-next-local-session-handoff-2026-10-14.md',
      parentRuntimeOwner: 'receiving local integration session',
      authorSeat: 'Erdos interrupted snapshot; receiving parent corrections',
      writeOwnership: 'receiving parent owns input verifier and serialized runtime',
    },
    capturedAt: new Date().toISOString(),
    url: url.toString(),
    requestedViewport: VIEWPORTS[viewport].label,
    requestedTier: tier,
    selectedCategories,
    inputContract: {
      nativeOnly: true,
      forbiddenBypassesUsed: [],
      methods: ['page.mouse.wheel', 'CDP Input.dispatchTouchEvent', 'page.keyboard.press', 'classic scrollbar page.mouse drag', 'window.scrollTo direct seek'],
      note: 'No qualityLock, store/port setter, playback API, synthetic progress clock or accumulative playback clock is used.',
    },
    responseTolerances: {
      nativeRestMs: NATIVE_REST_LIMIT_MS, nativeRestPxPerFrame: NATIVE_REST_PX_PER_FRAME, nativeRestWindowMs: NATIVE_REST_WINDOW_MS,
      cameraLampAdditionalMs: CAMERA_LAMP_ADDITIONAL_MS, totalSettleMs: TOTAL_SETTLE_LIMIT_MS,
      holdPositionM: HOLD_POSITION_M, holdAngleDeg: HOLD_ANGLE_DEG, holdFovDeg: HOLD_FOV_DEG, holdChannel: HOLD_CHANNEL,
    },
    c1BoundaryContract: {
      runtimeSeams: DOMAIN_SEAMS,
      handoffStarts: HANDOFF_STARTS,
      sampling: 'every narrative beat boundary and every explicit RuntimeWorld seam at ±.001, forward and reverse',
      numericalThreshold: null,
      claim: 'NONE. Raw installed camera pose and finite differences only. Existing InspectionDirector C1 tests cover the private leaf, not whole RuntimeWorld.',
    },
    coverage: {
      completeForSelectedCategories: false,
      contractSectionsNotClaimed: ['§3 pointer roster', '§3 functional stress/hidden-tab resume'],
      note: 'A filtered PASS never claims complete §3 coverage. Pointer and functional stress remain separate parent-owned categories.',
    },
    categories: [],
    limitations: [
      'Touch is an installed-CDP emulated gesture, never physical touch.',
      'Scrollbar drag depends on classic non-overlay scrollbars; zero native displacement is a failure, not a skip.',
      'Missing camera, native-pixel or lamp observables are UNVERIFIED and never filled with invented values.',
      'Boundary finite differences are diagnostic raw evidence and do not establish or fail C1.',
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
    for (const category of selectedCategories) {
      const result = await runCategory(browser, category, { url, viewport, tier }, report.build)
      report.categories.push(result)
      console.log(JSON.stringify({ category, functional: result.selectedFunctionalStatus, response: result.responseTimingStatus, status: result.status }))
    }
    report.sourceEnd = sourceIdentity()
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
    report.coverage.selectedFunctionalStatus = aggregateStatus(report.categories.map(category => category.selectedFunctionalStatus ?? 'FAIL'))
    report.coverage.completeForSelectedCategories = report.coverage.selectedFunctionalStatus === 'PASS'
    report.coverage.responseTimingStatus = aggregateStatus(report.categories.map(category => category.responseTimingStatus ?? 'FAIL'))
    report.overallStatus = aggregateStatus([...report.categories.map(category => category.status),
      report.servedIdentityAfterRuntime.status, report.sourceBuildCausality.status])
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

await main()
