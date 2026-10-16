/**
 * JG-038 Stage 5 runtime verifier (contract18 section 2 case matrix).
 *
 * One canonical run drives ONE case (or the whole matrix with --case=all) against the
 * SERVED production build, with no synthetic forcing of any kind:
 *   - no quality lock, no store setter. Owner-approved requested-lite cases enter via
 *     the supported public ?quality=lite URL before allocation and compare against
 *     actual tier telemetry. No playback clock,
 *     no synthetic progress -- motion is produced only by real window.scrollTo seeks.
 *   - static cases (d-static/n-static) reach the page's designed static path naturally
 *     via prefers-reduced-motion: reduce (resolveEntryTier -> poster -> data-torque-mode
 *     "static"). Confirmed against src/scene/torque-wrench/tier.ts and
 *     TorqueWrenchPage.tsx (posterLayer ? 'static' : stage === 'scene' ? 'live' : 'pending').
 *   - resolveEntryTier defaults to full; lite uses the designed entry approved by the
 *     owner on 2026-10-15. Tier mismatches remain failures with both values recorded.
 *
 * Telemetry surfaces (confirmed against src/scene/torque-wrench/RuntimeWorld.tsx,
 * BackgroundWorld.tsx and Scene.tsx):
 *   window.__torqueWorld.snapshot() -> ready, frames, hiddenFrames, progress,
 *     camera{position[3],target[3],quaternion[4],fov}, renderer{calls,triangles,geometries,
 *     textures,backend,effectiveDpr,drawingBuffer[2]}, sheet{baked,tier,precomputed,stats},
 *     mechanical{tier,...}, opening{...}
 *   window.__torqueBackground.snapshot() -> progress, active, hidden, frames,
 *     actualLayers[{id,depth,position[3],visible,opacity}], post{exposure,saturation,vignette},
 *     budget{tier,dpr,...}, actualBuffer[2], calls, triangles, ...
 *     (calls/triangles are the whole-frame renderer.info sum: BackgroundWorld sets
 *     gl.info.autoReset=false, resets, renders the full composer chain, then reads --
 *     never a mid-frame sample)
 *   window.__torqueNarrative.snapshot() -> progress, beatId, localProgress, phase, stateKey
 *   document.querySelector('.torque-page')?.dataset.torqueMode -> 'live'|'static'|'pending'
 *
 * Served identity: the page HTML, the manifest entry script, the lazy Scene chunk
 * (manifest key src/scene/torque-wrench/Scene.tsx, required to appear in the entry's
 * dynamicImports), /models/Default.glb and /draco/draco_wasm_wrapper.js are fetched over
 * HTTP with Accept-Encoding identity, SHA-256'd, and byte-compared with the files under
 * --build-dir (default .scratch/jg038-stage5-20261015-c).
 *
 * Aggregation (the V1 defect class, fixed by construction): every check is created
 * through one record() helper that normalizes pass to a boolean and derives the display
 * status string from it. Top-level and per-case status are computed ONLY from the pass
 * booleans (check.pass === true); the status strings are never compared. Malformed
 * records fail the aggregation with an explicit shape violation instead of being trusted.
 *
 * CLI:
 *   node scripts/verify-torque-stage5-runtime.mjs --case=<case|all|comma,list> --out=<report.json>
 *        [--url=http://127.0.0.1:5288] [--build-dir=.scratch/jg038-stage5-20261015-c] [--timeout=120000]
 *   Cases: d-full d-lite n-full n-lite h-full h-lite l-full l-lite d-static n-static
 *   Matrix: D 1440x900 DPR1 desktop; N 390x844 DPR3 touch (hasTouch);
 *           H 2560x1440 DPR2 desktop; L 844x390 DPR3 landscape touch.
 *   Exit codes: 0 PASS | 1 FAIL | 2 usage/--out conflict. The report is ALWAYS written
 *   (finally block) with exclusive create ('wx'); an existing --out fails loudly up front.
 *   Missing telemetry degrades to explicit FAIL/UNVERIFIED records, never a crash.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_URL = 'http://127.0.0.1:5288'
const DEFAULT_BUILD_DIR = '.scratch/jg038-stage5-20261015-c'
const DEFAULT_TIMEOUT_MS = 120000

const VIEWPORTS = {
  D: { key: 'D', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false, label: 'D 1440x900 DPR1 desktop' },
  N: { key: 'N', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true, label: 'N 390x844 DPR3 touch emulation' },
  H: { key: 'H', width: 2560, height: 1440, deviceScaleFactor: 2, isMobile: false, hasTouch: false, label: 'H 2560x1440 DPR2 desktop' },
  L: { key: 'L', width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, label: 'L 844x390 DPR3 landscape touch' },
}

const CASE_MATRIX = {
  'd-full': { viewport: 'D', tier: 'full' },
  'd-lite': { viewport: 'D', tier: 'lite' },
  'n-full': { viewport: 'N', tier: 'full' },
  'n-lite': { viewport: 'N', tier: 'lite' },
  'h-full': { viewport: 'H', tier: 'full' },
  'h-lite': { viewport: 'H', tier: 'lite' },
  'l-full': { viewport: 'L', tier: 'full' },
  'l-lite': { viewport: 'L', tier: 'lite' },
  'd-static': { viewport: 'D', tier: null },
  'n-static': { viewport: 'N', tier: null },
}
const CASE_ORDER = Object.keys(CASE_MATRIX)

const SEEK_POINTS = [0, 0.32, 0.46, 0.69, 0.815, 0.94, 1]
const PROGRESS_TOLERANCE = 0.001
const SEEK_SETTLE_MS = 1800
const SEEK_WAIT_TIMEOUT_MS = 15000
const HOLD_SPAN_MS = 5200
const HOLD_POSITION_DRIFT_M = 1e-4
const HOLD_QUAT_DRIFT_DEG = 0.01
const HOLD_FOV_DRIFT_DEG = 0.01
const IDENTITY_GRADE_MAX_PROGRESS = 0.46
// Achieved progress may sit within seek tolerance just past .46, where the next stop
// blend introduces 1e-9-scale float noise around the identity values.
const IDENTITY_GRADE_EPSILON = 1e-6
const DRAWING_BUFFER_PIXEL_BUDGET = 2560 * 1440
const STATIC_LATE_REQUEST_WINDOW_MS = 1500
// Narrative CAD/decoder bytes only (verify-torque-static convention). A shared
// DRACOLoader code chunk is not a CAD asset.
const CAD_REQUEST_RE = /(\.glb($|\?)|\.gltf($|\?)|\.bin($|\?)|\/draco\/(?:draco_decoder(?:_geometry)?\.wasm|draco_wasm_wrapper\.js)|ktx2|basis|\/models\/)/i

const LIVE_CHECK_NAMES = [
  'page loads (HTTP 200)',
  'viewport observed matches case matrix',
  'telemetry surfaces present',
  'live mode reached',
  'requested tier matches effective tier (store, sheet, background budget)',
  'readiness: world ready, sheet baked, background rendering',
  'canonical seeks settle within 0.001',
  'held state stable over five seconds',
  'world and background frames advance together',
  'three live depth layers present, visible, finite',
  'identity grade through 0.46',
  'drawing buffer exactly 2 finite dims within 2560x1440 budget',
  'renderer frame stats captured (whole-frame calls and triangles)',
  'zero page/console/network/HTTP errors',
  'served identity byte-matches build dir',
]
const STATIC_CHECK_NAMES = [
  'page loads (HTTP 200)',
  'viewport observed matches case matrix',
  'static mode active (semantic static path present)',
  'zero narrative WebGL canvases',
  'zero narrative CAD requests',
  'zero background allocation',
  'zero page/console/network/HTTP errors',
  'served identity byte-matches build dir',
]

class UsageError extends Error {}

function usage() {
  return 'usage: node scripts/verify-torque-stage5-runtime.mjs --case=<case|all|comma,list> --out=<report.json>'
    + ' [--url=' + DEFAULT_URL + '] [--build-dir=' + DEFAULT_BUILD_DIR + '] [--timeout=' + DEFAULT_TIMEOUT_MS + ']'
}

function resolveCases(raw) {
  const wanted = raw.trim().toLowerCase() === 'all'
    ? [...CASE_ORDER]
    : raw.split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
  if (!wanted.length) throw new UsageError('--case listed no cases')
  const seen = new Set()
  const cases = []
  for (const id of wanted) {
    if (!CASE_MATRIX[id]) throw new UsageError('unknown --case value: ' + id + ' (valid: ' + CASE_ORDER.join('|') + '|all)')
    if (!seen.has(id)) { seen.add(id); cases.push(id) }
  }
  return cases
}

function normalizePageUrl(raw) {
  let parsed
  try { parsed = new URL(raw) } catch { throw new UsageError('--url is not a valid URL: ' + raw) }
  if (!/^https?:$/.test(parsed.protocol)) throw new UsageError('--url must be http(s): ' + raw)
  const requested = parsed.href
  if (parsed.pathname === '' || parsed.pathname === '/') parsed.pathname = '/torque-wrench/'
  // Natural-tier rule: never add or forward a query/hash (no ?quality forcing).
  parsed.search = ''
  parsed.hash = ''
  return { requested, pageUrl: parsed }
}

function parseArgs(argv) {
  const args = { url: DEFAULT_URL, buildDir: DEFAULT_BUILD_DIR, buildDirGiven: false, timeoutRaw: String(DEFAULT_TIMEOUT_MS), case: null, out: null }
  for (const raw of argv) {
    const match = /^--([a-z][a-z-]*)=(.*)$/i.exec(raw)
    if (!match) throw new UsageError('unexpected argument (expected --key=value): ' + raw)
    const key = match[1].toLowerCase()
    const value = match[2]
    if (key === 'url') args.url = value
    else if (key === 'case') args.case = value
    else if (key === 'out') args.out = value
    else if (key === 'timeout') args.timeoutRaw = value
    else if (key === 'build-dir') { args.buildDir = value; args.buildDirGiven = true }
    else throw new UsageError('unknown flag: --' + key)
  }
  if (!args.case) throw new UsageError('--case is required (' + CASE_ORDER.join('|') + ' | all | comma-separated list)')
  if (!args.out) throw new UsageError('--out is required (report JSON path; exclusive create, must not already exist)')
  const timeout = Number(args.timeoutRaw)
  if (!Number.isInteger(timeout) || timeout < 1000) throw new UsageError('--timeout must be an integer >= 1000 ms')
  args.timeout = timeout
  args.cases = resolveCases(args.case)
  args.buildDir = path.isAbsolute(args.buildDir) ? path.resolve(args.buildDir) : path.resolve(ROOT, args.buildDir)
  args.out = path.resolve(args.out)
  const normalized = normalizePageUrl(args.url)
  args.requestedUrl = normalized.requested
  args.pageUrl = normalized.pageUrl
  return args
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

function makeChecks() {
  const checks = []
  return {
    checks,
    // Single construction point: pass is ALWAYS a boolean; status is display-only and
    // derived from it. Aggregation never compares status strings (V1 defect class).
    record(name, pass, actual) {
      const normalized = Boolean(pass)
      checks.push({ name, pass: normalized, status: normalized ? 'PASS' : 'FAIL', actual: actual ?? null })
    },
  }
}

function aggregateStatus(checks) {
  const shapeViolations = []
  for (const check of checks) {
    const passOk = typeof check?.pass === 'boolean'
    const statusOk = check?.status === (check?.pass === true ? 'PASS' : 'FAIL')
    if (!passOk || !statusOk) shapeViolations.push(check?.name ?? '<unnamed>')
  }
  // Read ONLY the pass booleans. An empty check list is a FAIL, never a vacuous PASS.
  const pass = checks.length > 0 && shapeViolations.length === 0 && checks.every(check => check.pass === true)
  return { pass, shapeViolations }
}

function fillMissingChecks(checks, expected, reason) {
  const present = new Set(checks.map(check => check.name))
  for (const name of expected) {
    if (!present.has(name)) checks.push({ name, pass: false, status: 'FAIL', actual: 'UNVERIFIED: ' + reason })
  }
}

const safeDist3 = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 3 || b.length !== 3) return null
  return [...a, ...b].every(Number.isFinite) ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : null
}
const safeQuatAngleDegrees = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 4 || b.length !== 4) return null
  if (![...a, ...b].every(Number.isFinite)) return null
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])
  return 2 * Math.acos(Math.min(1, dot)) * 180 / Math.PI
}

function rawResponse(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const client = new URL(url).protocol === 'https:' ? https : http
    const request = client.get(url, { headers: { 'Accept-Encoding': 'identity' }, timeout: timeoutMs }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve({
        ok: response.statusCode === 200,
        status: response.statusCode ?? null,
        bytes: Buffer.concat(chunks),
        contentEncoding: response.headers['content-encoding'] ?? null,
      }))
      response.on('error', reject)
    })
    request.on('timeout', () => request.destroy(new Error('response timeout after ' + timeoutMs + 'ms')))
    request.on('error', reject)
  })
}

const originUrl = (pageUrl, relative) => new URL('/' + relative, pageUrl.origin).href

function buildServedIdentity(pageUrl, buildDir, timeoutMs) {
  const run = async () => {
    const manifestPath = path.join(buildDir, '.vite', 'manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const entry = manifest['torque-wrench/index.html']
    if (!entry || entry.isEntry !== true || typeof entry.file !== 'string') {
      throw new Error('build manifest has no torque-wrench/index.html entry: ' + manifestPath)
    }
    const sceneKey = Object.keys(manifest).find(key => /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/.test(key))
    const scene = sceneKey ? manifest[sceneKey] : null
    if (!scene || typeof scene.file !== 'string') throw new Error('build manifest has no src/scene/torque-wrench/Scene chunk')
    if (!Array.isArray(entry.dynamicImports) || !entry.dynamicImports.includes(sceneKey)) {
      throw new Error('entry dynamicImports does not include the Scene chunk (' + sceneKey + ')')
    }
    const targets = [
      { name: 'page HTML', url: pageUrl.href, localPath: path.join(buildDir, 'torque-wrench', 'index.html') },
      { name: 'entry script', url: originUrl(pageUrl, entry.file), localPath: path.join(buildDir, ...entry.file.split('/')) },
      { name: 'Scene chunk', url: originUrl(pageUrl, scene.file), localPath: path.join(buildDir, ...scene.file.split('/')) },
      { name: 'CAD Default.glb', url: originUrl(pageUrl, 'models/Default.glb'), localPath: path.join(buildDir, 'models', 'Default.glb') },
      { name: 'draco decoder', url: originUrl(pageUrl, 'draco/draco_wasm_wrapper.js'), localPath: path.join(buildDir, 'draco', 'draco_wasm_wrapper.js') },
    ]
    const records = []
    for (const target of targets) {
      try {
        const served = await rawResponse(target.url, timeoutMs)
        const servedSha256 = sha256(served.bytes)
        const buildSha256 = sha256(readFileSync(target.localPath))
        const record = {
          name: target.name,
          url: target.url,
          buildPath: path.relative(ROOT, target.localPath),
          httpStatus: served.status,
          contentEncoding: served.contentEncoding,
          servedSha256,
          buildSha256,
          matched: served.ok && servedSha256 === buildSha256,
        }
        if (target.name === 'page HTML') record.referencesEntryFile = served.bytes.toString('utf8').includes(entry.file)
        records.push(record)
      } catch (error) {
        records.push({
          name: target.name,
          url: target.url,
          buildPath: path.relative(ROOT, target.localPath),
          matched: false,
          error: String(error?.message ?? error),
        })
      }
    }
    return { buildDir, entryFile: entry.file, sceneFile: scene.file, records, pass: records.every(record => record.matched === true), error: null }
  }
  // Degrade, never crash: an unreadable manifest or unreachable asset is a FAIL record.
  return run().catch(error => ({ buildDir, entryFile: null, sceneFile: null, records: [], pass: false, error: String(error?.message ?? error) }))
}

async function readObservation(page) {
  return page.evaluate(() => {
    const worldPort = window.__torqueWorld
    const backgroundPort = window.__torqueBackground
    const narrativePort = window.__torqueNarrative
    return {
      mode: document.querySelector('.torque-page')?.dataset.torqueMode ?? null,
      torqueStage: document.querySelector('.torque-stage')?.dataset.torqueStage ?? null,
      visibility: document.visibilityState,
      narrativeCanvasCount: document.querySelectorAll('.torque-scene canvas').length,
      sceneRootCount: document.querySelectorAll('[data-torque-scene]').length,
      canvasCount: document.querySelectorAll('canvas').length,
      world: typeof worldPort?.snapshot === 'function' ? worldPort.snapshot() : null,
      background: typeof backgroundPort?.snapshot === 'function' ? backgroundPort.snapshot() : null,
      narrative: typeof narrativePort?.snapshot === 'function' ? narrativePort.snapshot() : null,
      allocation: {
        world: typeof window.__torqueWorld,
        background: typeof window.__torqueBackground,
        narrative: typeof window.__torqueNarrative,
      },
      viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
    }
  })
}

async function attachCollectors(page, errors, collected) {
  page.on('pageerror', error => errors.push({ kind: 'pageerror', message: String(error) }))
  page.on('console', message => { if (message.type() === 'error') errors.push({ kind: 'console', message: message.text() }) })
  page.on('requestfailed', request => errors.push({ kind: 'requestfailed', message: request.url() + ': ' + (request.failure()?.errorText ?? 'failed') }))
  page.on('response', response => { if (response.status() >= 400) errors.push({ kind: 'http', message: response.status() + ' ' + response.url() }) })
  page.on('request', request => {
    collected.requestsObserved += 1
    if (CAD_REQUEST_RE.test(request.url())) collected.cadRequests.push(request.url())
  })
}

async function runLiveObservations(page, args, spec, record, collected) {
  const view = VIEWPORTS[spec.viewport]
  try {
    await page.waitForFunction(() => {
      const world = window.__torqueWorld
      const background = window.__torqueBackground
      return document.querySelector('.torque-page')?.dataset.torqueMode === 'live'
        && typeof world?.snapshot === 'function' && world.snapshot().ready === true
        && world.snapshot().sheet?.baked === true
        && typeof background?.snapshot === 'function' && background.snapshot().frames > 1
    }, null, { timeout: args.timeout, polling: 100 })
  } catch {
    // Boot never completed; the checks below record the observed state honestly.
  }
  const first = await readObservation(page)
  collected.renderer = first.world?.renderer ?? null
  record('viewport observed matches case matrix',
    first.viewport.innerWidth === view.width && first.viewport.innerHeight === view.height
      && first.viewport.devicePixelRatio === view.deviceScaleFactor,
    { requested: { width: view.width, height: view.height, deviceScaleFactor: view.deviceScaleFactor }, observed: first.viewport })
  record('telemetry surfaces present',
    Boolean(first.world && first.background && first.narrative),
    { world: Boolean(first.world), background: Boolean(first.background), narrative: Boolean(first.narrative) })
  record('live mode reached', first.mode === 'live',
    { mode: first.mode, torqueStage: first.torqueStage, narrativeCanvasCount: first.narrativeCanvasCount, visibility: first.visibility })
  if (!first.world || !first.background) {
    record('requested tier matches effective tier (store, sheet, background budget)', false, 'UNVERIFIED: telemetry surfaces missing')
    record('readiness: world ready, sheet baked, background rendering', false, 'UNVERIFIED: telemetry surfaces missing')
    return
  }
  const tierActual = {
    requested: spec.tier,
    storeTier: first.world.mechanical?.tier ?? null,
    sheetTier: first.world.sheet?.tier ?? null,
    backgroundBudgetTier: first.background.budget?.tier ?? null,
    rendererEffectiveDpr: first.world.renderer?.effectiveDpr ?? null,
    rendererDrawingBuffer: first.world.renderer?.drawingBuffer ?? null,
    backgroundBudgetDpr: first.background.budget?.dpr ?? null,
  }
  record('requested tier matches effective tier (store, sheet, background budget)',
    tierActual.storeTier === spec.tier && tierActual.sheetTier === spec.tier && tierActual.backgroundBudgetTier === spec.tier,
    tierActual)
  let readiness = { ok: false, error: null }
  try {
    await page.waitForFunction(() => {
      const world = window.__torqueWorld?.snapshot?.()
      const background = window.__torqueBackground?.snapshot?.()
      return Boolean(world?.ready && world.sheet?.baked && background && background.frames > 1)
    }, null, { timeout: args.timeout, polling: 100 })
    readiness.ok = true
  } catch (error) { readiness.error = String(error?.message ?? error) }
  record('readiness: world ready, sheet baked, background rendering', readiness.ok,
    readiness.ok ? { worldReady: true, sheetBaked: true, backgroundFrames: first.background.frames } : { timeoutMs: args.timeout, error: readiness.error })

  const samples = []
  const seekTimeoutMs = Math.min(args.timeout, SEEK_WAIT_TIMEOUT_MS)
  for (const requested of SEEK_POINTS) {
    try {
      // NATURAL motion only: a real scroll of the live document. No store writes, no
      // playback clock, no synthetic progress injection.
      await page.evaluate(value => {
        const fraction = window.__torqueNarrative?.scrollFraction?.(value) ?? value
        window.scrollTo(0, Math.round((document.documentElement.scrollHeight - window.innerHeight) * fraction))
      }, requested)
      await page.waitForFunction(value => {
        const snapshot = window.__torqueWorld?.snapshot?.()
        return typeof snapshot?.progress === 'number' && Math.abs(snapshot.progress - value) < 0.001
      }, requested, { timeout: seekTimeoutMs, polling: 50 })
      await page.waitForTimeout(SEEK_SETTLE_MS)
      const observation = await readObservation(page)
      samples.push({
        requested,
        achieved: typeof observation.world?.progress === 'number' ? observation.world.progress : null,
        world: observation.world,
        background: observation.background,
        narrative: observation.narrative,
      })
    } catch (error) {
      samples.push({ requested, achieved: null, error: String(error?.message ?? error) })
    }
  }
  collected.samples = samples
  record('canonical seeks settle within 0.001',
    samples.length === SEEK_POINTS.length && samples.every(sample => sample.achieved !== null),
    samples.map(sample => ({ requested: sample.requested, achieved: sample.achieved, error: sample.error ?? null })))

  let beforeHold = null
  let afterHold = null
  let holdError = null
  try {
    beforeHold = await readObservation(page)
    await page.waitForTimeout(HOLD_SPAN_MS)
    afterHold = await readObservation(page)
  } catch (error) { holdError = String(error?.message ?? error) }
  collected.hold = beforeHold && afterHold
    ? { before: { world: beforeHold.world, background: beforeHold.background }, after: { world: afterHold.world, background: afterHold.background } }
    : null
  const positionDrift = safeDist3(beforeHold?.world?.camera?.position, afterHold?.world?.camera?.position)
  const quatDriftDeg = safeQuatAngleDegrees(beforeHold?.world?.camera?.quaternion, afterHold?.world?.camera?.quaternion)
  const fovDriftDeg = Number.isFinite(beforeHold?.world?.camera?.fov) && Number.isFinite(afterHold?.world?.camera?.fov)
    ? Math.abs(afterHold.world.camera.fov - beforeHold.world.camera.fov) : null
  const backgroundProgressBefore = beforeHold?.background?.progress ?? null
  const backgroundProgressAfter = afterHold?.background?.progress ?? null
  const holdActual = {
    positionDrift,
    quatDriftDeg,
    fovDriftDeg,
    backgroundProgress: [backgroundProgressBefore, backgroundProgressAfter],
    atProgress: afterHold?.world?.progress ?? null,
    worldFrames: [beforeHold?.world?.frames ?? null, afterHold?.world?.frames ?? null],
    backgroundFrames: [beforeHold?.background?.frames ?? null, afterHold?.background?.frames ?? null],
    error: holdError,
  }
  record('held state stable over five seconds',
    holdError === null
      && positionDrift !== null && positionDrift <= HOLD_POSITION_DRIFT_M
      && quatDriftDeg !== null && quatDriftDeg <= HOLD_QUAT_DRIFT_DEG
      && fovDriftDeg !== null && fovDriftDeg <= HOLD_FOV_DRIFT_DEG
      && backgroundProgressBefore !== null && backgroundProgressAfter === backgroundProgressBefore,
    holdActual)
  record('world and background frames advance together',
    holdError === null
      && (afterHold?.world?.frames ?? -1) > (beforeHold?.world?.frames ?? Infinity)
      && (afterHold?.background?.frames ?? -1) > (beforeHold?.background?.frames ?? Infinity),
    { worldFrames: holdActual.worldFrames, backgroundFrames: holdActual.backgroundFrames })

  const finalBackground = afterHold?.background ?? [...samples].reverse().find(sample => sample.background)?.background ?? null
  const layers = finalBackground?.actualLayers ?? null
  record('three live depth layers present, visible, finite',
    Array.isArray(layers) && layers.length === 3 && layers.every(layer =>
      layer?.visible === true && Array.isArray(layer.position) && layer.position.every(Number.isFinite)),
    layers)
  const gradeSamples = samples
    .filter(sample => sample.requested <= IDENTITY_GRADE_MAX_PROGRESS && sample.achieved !== null)
    .map(sample => ({
      requested: sample.requested,
      achieved: sample.achieved,
      exposure: sample.background?.post?.exposure ?? null,
      saturation: sample.background?.post?.saturation ?? null,
      vignette: sample.background?.post?.vignette ?? null,
    }))
  record('identity grade through 0.46',
    gradeSamples.length === 3 && gradeSamples.every(sample =>
      Math.abs(sample.exposure - 1) <= IDENTITY_GRADE_EPSILON
      && Math.abs(sample.saturation - 1) <= IDENTITY_GRADE_EPSILON
      && Math.abs(sample.vignette) <= IDENTITY_GRADE_EPSILON),
    { samples: gradeSamples, epsilon: IDENTITY_GRADE_EPSILON })
  const actualBuffer = finalBackground?.actualBuffer ?? null
  record('drawing buffer exactly 2 finite dims within 2560x1440 budget',
    Array.isArray(actualBuffer) && actualBuffer.length === 2 && actualBuffer.every(Number.isFinite)
      && actualBuffer[0] * actualBuffer[1] <= DRAWING_BUFFER_PIXEL_BUDGET,
    { actualBuffer, budget: finalBackground?.budget ?? null, pixelBudget: DRAWING_BUFFER_PIXEL_BUDGET })
  const frameStats = samples
    .filter(sample => sample.achieved !== null)
    .map(sample => ({ requested: sample.requested, calls: sample.background?.calls ?? null, triangles: sample.background?.triangles ?? null }))
  record('renderer frame stats captured (whole-frame calls and triangles)',
    frameStats.length > 0 && frameStats.every(sample =>
      Number.isFinite(sample.calls) && sample.calls > 0 && Number.isFinite(sample.triangles) && sample.triangles > 0),
    { samples: frameStats, note: 'whole-frame renderer.info sum across composer passes (BackgroundWorld resets gl.info, renders the full chain, then reads); actual values only, no ceiling asserted' })
}

async function runStaticObservations(page, args, spec, record, collected) {
  let modeWaitError = null
  try {
    await page.waitForFunction(() => document.querySelector('.torque-page')?.dataset.torqueMode === 'static',
      null, { timeout: args.timeout, polling: 100 })
  } catch (error) { modeWaitError = String(error?.message ?? error) }
  // Bounded late-request window: proves no narrative CAD fetch trails the static flip.
  await page.waitForTimeout(STATIC_LATE_REQUEST_WINDOW_MS)
  const observation = await readObservation(page)
  const view = VIEWPORTS[spec.viewport]
  record('viewport observed matches case matrix',
    observation.viewport.innerWidth === view.width && observation.viewport.innerHeight === view.height
      && observation.viewport.devicePixelRatio === view.deviceScaleFactor,
    { requested: { width: view.width, height: view.height, deviceScaleFactor: view.deviceScaleFactor }, observed: observation.viewport })
  record('static mode active (semantic static path present)',
    modeWaitError === null && observation.mode === 'static',
    { mode: observation.mode, torqueStage: observation.torqueStage, waitError: modeWaitError })
  record('zero narrative WebGL canvases',
    observation.narrativeCanvasCount === 0,
    { narrativeCanvasCount: observation.narrativeCanvasCount, sceneRootCount: observation.sceneRootCount, canvasCount: observation.canvasCount })
  record('zero narrative CAD requests',
    collected.cadRequests.length === 0,
    { cadRequests: collected.cadRequests, requestsObserved: collected.requestsObserved, observationWindowMs: STATIC_LATE_REQUEST_WINDOW_MS })
  record('zero background allocation',
    observation.allocation.world === 'undefined' && observation.allocation.background === 'undefined' && observation.allocation.narrative === 'undefined',
    observation.allocation)
}

async function runCase(browser, caseId, spec, pageUrl, args, identity) {
  const view = VIEWPORTS[spec.viewport]
  const isStatic = spec.tier === null
  const expected = isStatic ? STATIC_CHECK_NAMES : LIVE_CHECK_NAMES
  const { checks, record } = makeChecks()
  const errors = []
  const collected = { samples: [], hold: null, cadRequests: [], requestsObserved: 0, renderer: null }
  const contextOptions = {
    viewport: { width: view.width, height: view.height },
    deviceScaleFactor: view.deviceScaleFactor,
    isMobile: view.isMobile,
    hasTouch: view.hasTouch,
    reducedMotion: isStatic ? 'reduce' : 'no-preference',
    serviceWorkers: 'block',
  }
  let context = null
  try {
    context = await browser.newContext(contextOptions)
    const page = await context.newPage()
    await attachCollectors(page, errors, collected)
    const entryUrl = new URL(pageUrl.href)
    if (spec.tier === 'lite') entryUrl.searchParams.set('quality', 'lite')
    const response = await page.goto(entryUrl.href, { waitUntil: 'domcontentloaded', timeout: args.timeout })
    record('page loads (HTTP 200)', response?.status() === 200, { status: response?.status() ?? null })
    if (isStatic) await runStaticObservations(page, args, spec, record, collected)
    else await runLiveObservations(page, args, spec, record, collected)
  } catch (error) {
    record('case completed without harness exception', false, String(error?.stack ?? error))
  } finally {
    await context?.close().catch(() => {})
  }
  record('zero page/console/network/HTTP errors', errors.length === 0, errors)
  record('served identity byte-matches build dir', identity.pass === true,
    { mismatches: (identity.records ?? []).filter(item => item.matched !== true).map(item => item.name), error: identity.error ?? null })
  fillMissingChecks(checks, expected, 'case did not reach this check (earlier failure)')
  const verdict = aggregateStatus(checks)
  return {
    id: caseId,
    kind: isStatic ? 'static' : 'live',
    requestedTier: spec.tier,
    viewport: view,
    contextOptions,
    url: pageUrl.href,
    checks,
    shapeViolations: verdict.shapeViolations,
    status: verdict.pass ? 'PASS' : 'FAIL',
    summary: {
      total: checks.length,
      passed: checks.filter(check => check.pass === true).length,
      failed: checks.filter(check => check.pass !== true).length,
      pass: verdict.pass,
    },
    errors,
    ...collected,
  }
}

async function main() {
  let args
  try {
    args = parseArgs(process.argv.slice(2))
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(usage())
      console.error(error.message)
      process.exitCode = 2
      return
    }
    throw error
  }
  if (existsSync(args.out)) {
    console.error('--out already exists; exclusive create requires a new path: ' + args.out)
    process.exitCode = 2
    return
  }
  const report = {
    schema: 'JG-038-stage5-runtime-v1',
    startedAt: new Date().toISOString(),
    requestedUrl: args.requestedUrl,
    pageUrl: args.pageUrl,
    timeoutMs: args.timeout,
    buildDir: args.buildDir,
    buildDirSource: args.buildDirGiven ? 'cli' : 'default',
    casesRequested: args.cases,
    cases: [],
    launch: describeLaunch(),
    note: 'Designed entry runs: full default, owner-approved ?quality=lite, reduced-motion poster path. No quality lock/store/playback forcing. Native scroll seeks use the read-only canonical-to-physical pacing map. Status aggregates ONLY per-check pass booleans; status strings are display-only.',
  }
  try {
    report.servedIdentity = await buildServedIdentity(args.pageUrl, args.buildDir, args.timeout)
    const { chromium } = await import('playwright')
    const browser = await launchBrowser(chromium)
    try {
      report.browserVersion = browser.version()
      for (const caseId of args.cases) {
        const entry = await runCase(browser, caseId, CASE_MATRIX[caseId], args.pageUrl, args, report.servedIdentity)
        report.cases.push(entry)
        console.log(entry.status + '  ' + caseId + ' (' + entry.summary.passed + '/' + entry.summary.total + ' checks)')
      }
    } finally {
      await browser.close().catch(() => {})
    }
  } catch (error) {
    report.exception = String(error?.stack ?? error)
    report.cases.push({
      id: 'harness',
      kind: 'harness',
      checks: [{ name: 'harness completed', pass: false, status: 'FAIL', actual: report.exception }],
      status: 'FAIL',
      summary: { total: 1, passed: 0, failed: 1, pass: false },
    })
  } finally {
    report.finishedAt = new Date().toISOString()
    const allChecks = report.cases.flatMap(entry => entry.checks ?? [])
    const verdict = aggregateStatus(allChecks)
    report.status = verdict.pass ? 'PASS' : 'FAIL'
    report.shapeViolations = verdict.shapeViolations
    report.summary = {
      totalChecks: allChecks.length,
      passedChecks: allChecks.filter(check => check.pass === true).length,
      failedChecks: allChecks.filter(check => check.pass !== true).length,
      pass: verdict.pass,
    }
    report.failedChecks = report.cases
      .flatMap(entry => (entry.checks ?? []).filter(check => check.pass !== true).map(check => entry.id + ':' + check.name))
    try {
      writeFileSync(args.out, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
      console.log('report: ' + args.out)
      console.log('RESULT: ' + report.status + ' (' + report.summary.passedChecks + '/' + report.summary.totalChecks + ' checks)')
      if (report.failedChecks.length) console.log('failed: ' + report.failedChecks.join(' | '))
      process.exitCode = report.status === 'PASS' ? 0 : 1
    } catch (error) {
      console.error('cannot write report (exclusive create, --out must not exist): ' + args.out + ' - ' + (error?.message ?? error))
      process.exitCode = 2
    }
  }
}

main().catch(error => {
  console.error('fatal harness error: ' + (error?.stack ?? error))
  process.exitCode = 1
})
