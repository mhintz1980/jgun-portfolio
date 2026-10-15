#!/usr/bin/env node
/**
 * JG-038 bounded diagnostic: overhead of the existing performance observer.
 *
 * This is not a G8 performance producer and never turns a pilot into acceptance. One invocation
 * runs at most a few explicitly scheduled baseline/observer pairs. Every arm is a fresh browser
 * process and context against the same parent-owned preview/build, using the same canonical
 * 20 s forward / 20 s reverse / 20 s hold phase fixture and the same readiness/prewarm sequence.
 *
 * The baseline arm installs only an rAF sentinel equivalent to the existing observer's sentinel.
 * The instrumented arm installs the live torquePerformanceObserverInit before navigation. Both
 * collectors run in-page and return once, so no per-frame Playwright RPC participates in the
 * measurement. Raw interval rows, hidden rows, invalid rows, actual observed durations and actual
 * create/link program events are retained; no net program count is invented.
 *
 * Boundaries: the parent owns build, server, GPU scheduling, visibility and serialization. This
 * file starts no server/build, applies no network/CPU throttling, captures no image/video/trace,
 * never adds qualityLock, and writes one unique JSON report under the Stage-4 evidence root. AC
 * power is not accepted by declaration. A completed diagnostic is not a performance PASS.
 *
 * Exit: 0 diagnostic completed, 1 diagnostic integrity failure, 2 usage, 10 required observable
 * missing/unverifiable, 11 environment blocked, 12 report-write failure.
 */
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeLaunch, launchConfig } from './lib/browser-launch.mjs'
import {
  TORQUE_PERFORMANCE_PHASES,
  deriveHardwareGl,
  phaseWindow,
  torquePerformanceObserverInit,
} from './lib/torque-performance-observers.mjs'
import { pageMeasurementSweep, resolveServedTargets } from './verify-torque-performance-contract.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OBSERVER_PATH = fileURLToPath(new URL('./lib/torque-performance-observers.mjs', import.meta.url))
const CONTRACT_PATH = fileURLToPath(new URL('./verify-torque-performance-contract.mjs', import.meta.url))
const EVIDENCE = path.join(ROOT, 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery')
const DEFAULT_OUT = path.join(EVIDENCE, 'performance-overhead')
const SCRATCH = path.join(ROOT, '.scratch')
const PRIVATE_PATH = '/torque-wrench/'
const VIEWPORTS = {
  D: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  N: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}
const FORWARD_SECONDS = 20
const REVERSE_SECONDS = 20
const HOLD_SECONDS = 20
const GUARD_MS = 250
const PHASE_WINDOW_TOLERANCE = 0.01
const READINESS_TIMEOUT_MS = 30000
const PREWARM_SETTLE_MS = 5000
const TAIL_THRESHOLD_MS = 33.4
const SOURCE_PATHS = [
  'src/scene/torque-wrench/RuntimeWorld.tsx',
  'src/scene/torque-wrench/Scene.tsx',
  'src/scene/torque-wrench/ScrollConductor.tsx',
  'src/scene/torque-wrench/beats.ts',
  'src/scene/torque-wrench/conductorRuntime.ts',
  'src/state/torqueWrenchStore.ts',
  'src/state/qualityStore.ts',
  'scripts/lib/torque-performance-observers.mjs',
  'scripts/verify-torque-performance-contract.mjs',
  'scripts/verify-torque-performance-overhead.mjs',
]

const HELP = `usage: node scripts/verify-torque-performance-overhead.mjs --url=http://localhost:<parent-port>${PRIVATE_PATH} --build-dir=.scratch/<stable-build> [options]

Runs bounded paired diagnostics for the existing performance observer. The parent supplies and
serializes the stable preview/build; this command starts no server and no build.

Options
  --url=<url>                 required loopback origin or exact ${PRIVATE_PATH} path (no query/hash)
  --build-dir=<dir>           required existing production output under this worktree's .scratch
  --out=<dir>                 evidence directory (default ${path.relative(ROOT, DEFAULT_OUT)})
  --viewport=D|N              contract viewport case (default D; N is emulated)
  --tier=full|lite            requested natural starting tier (default full)
  --phase=<name>              narrative phase (default breakthrough)
  --pairs=<1..4>              independent paired observations (default 1)
  --arm-order=<order>         baseline-first, observer-first, or alternate (default alternate)
  --hold-progress=<0..1>      hold progress inside the phase window (default window midpoint)
  --prewarm-seconds=<n>       each prewarm direction (default 6; range 1..30)
  --inter-arm-settle=<n>      seconds between arms in a pair (default 2; range 0..30)
  --device=<label>            optional device label, recorded only as operator-declared
  --os=<label>                optional OS label, recorded only as operator-declared
  --help                      print this text

Each arm is: fresh browser/context -> contract phase readiness -> 6 s forward + 6 s reverse
prewarm -> 5 s settle -> phase seek/settle -> one in-page rAF collector -> the full canonical
20 s forward / 20 s reverse / separate settle / 20 s hold fixture. Served/build identity is fetched
before and after each arm. No screenshots, video, tracing, CDP throttling, or qualityLock are used.

This diagnostic never records AC from an operator declaration. Browser battery state is observed in
both arms; primary AC/external power remains UNVERIFIED, and a charging-state change invalidates a
pair comparison. Headless document visibility is not owner-visible proof.

Phases: ${TORQUE_PERFORMANCE_PHASES.join(', ')}
Exit: 0 diagnostic completed, 1 integrity failure, 2 usage, 10 missing observable,
11 environment blocked, 12 report write error. Exit 0 is not G8 or performance acceptance.`

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
const round = (value, digits = 3) => (finite(value) ? Number(value.toFixed(digits)) : null)
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

function inside(parent, target) {
  const relative = path.relative(parent, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function checkedPath(value, parent) {
  const absolute = path.resolve(ROOT, value)
  if (!inside(parent, absolute)) throw new Error(`path must be inside ${parent}: ${absolute}`)
  let ancestor = absolute
  while (!existsSync(ancestor)) ancestor = path.dirname(ancestor)
  if (!inside(realpathSync(parent), realpathSync(ancestor))) throw new Error(`path/junction escapes ${parent}`)
  return absolute
}

function parseArgs(argv) {
  const args = {
    viewport: 'D', tier: 'full', phase: 'breakthrough', pairs: 1, 'arm-order': 'alternate',
    out: DEFAULT_OUT, 'hold-progress': null, 'prewarm-seconds': 6, 'inter-arm-settle': 2,
  }
  const keys = new Set(['url', 'build-dir', 'out', 'viewport', 'tier', 'phase', 'pairs', 'arm-order', 'hold-progress', 'prewarm-seconds', 'inter-arm-settle', 'device', 'os'])
  for (let index = 0; index < argv.length; index++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[index])
    if (!match || !keys.has(match[1])) throw new Error(`unknown argument: ${argv[index]}`)
    const value = match[2] ?? argv[++index]
    if (value === undefined || value.startsWith('--')) throw new Error(`value missing for --${match[1]}`)
    args[match[1]] = value
  }
  if (!nonempty(args.url)) throw new Error('--url is required (the parent supplies the serialized preview)')
  if (!nonempty(args['build-dir'])) throw new Error('--build-dir is required so served bytes can be bound to one local build')
  const url = new URL(args.url)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password || url.search || url.hash) {
    throw new Error('--url must be a loopback http origin or /torque-wrench/ URL without query, hash or credentials')
  }
  if (!['/', PRIVATE_PATH, PRIVATE_PATH.replace(/\/$/, '')].includes(url.pathname)) throw new Error(`--url path must be ${PRIVATE_PATH}`)
  if (url.pathname === '/') url.pathname = PRIVATE_PATH
  if (!VIEWPORTS[args.viewport]) throw new Error('--viewport must be D or N')
  if (!['full', 'lite'].includes(args.tier)) throw new Error('--tier must be full or lite')
  if (!TORQUE_PERFORMANCE_PHASES.includes(args.phase)) throw new Error(`--phase must be one of ${TORQUE_PERFORMANCE_PHASES.join('|')}`)
  const pairs = Number(args.pairs)
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > 4) throw new Error('--pairs must be an integer from 1 through 4')
  if (!['baseline-first', 'observer-first', 'alternate'].includes(args['arm-order'])) throw new Error('--arm-order must be baseline-first, observer-first or alternate')
  const hold = args['hold-progress'] === null ? null : Number(args['hold-progress'])
  if (hold !== null && (!finite(hold) || hold < 0 || hold > 1)) throw new Error('--hold-progress must be a number in 0..1')
  const prewarm = Number(args['prewarm-seconds'])
  if (!finite(prewarm) || prewarm < 1 || prewarm > 30) throw new Error('--prewarm-seconds must be a number from 1 through 30')
  const settle = Number(args['inter-arm-settle'])
  if (!finite(settle) || settle < 0 || settle > 30) throw new Error('--inter-arm-settle must be a number from 0 through 30')
  const out = checkedPath(args.out, EVIDENCE)
  const buildDir = checkedPath(args['build-dir'], SCRATCH)
  if (!existsSync(path.join(buildDir, '.vite/manifest.json'))) throw new Error(`build manifest missing: ${path.join(buildDir, '.vite/manifest.json')}`)
  return { ...args, pairs, out, buildDir, 'hold-progress': hold, 'prewarm-seconds': prewarm, 'inter-arm-settle': settle, url: url.href, origin: url.origin }
}

/** Browser initializer: the baseline equivalent of the existing observer's sentinel only. */
export function overheadBaselineCollectorInit() {
  const PORT = '__torqueOverheadBaselineCollector'
  const globalThis = window
  if (globalThis[PORT]) return
  const state = {
    installedAt: performance.now(), measurement: null, samples: [], visibilityChanges: [],
    battery: { status: 'UNVERIFIED', reason: 'navigator.getBattery result not observed yet' },
  }
  document.addEventListener('visibilitychange', () => {
    state.visibilityChanges.push({ at: performance.now(), hidden: document.hidden, visibilityState: document.visibilityState })
    if (state.measurement && document.hidden) state.measurement.hiddenDuringMeasurement = true
  })
  if (navigator.getBattery) navigator.getBattery().then((battery) => {
    state.battery = {
      status: battery.charging ? 'charging observed by navigator.getBattery' : 'battery/discharge observed by navigator.getBattery',
      charging: battery.charging, level: battery.level, chargingTime: battery.chargingTime, dischargingTime: battery.dischargingTime,
    }
  }, (error) => { state.battery = { status: 'UNVERIFIED', reason: String(error) } })
  else state.battery = { status: 'UNVERIFIED', reason: 'navigator.getBattery unavailable in this browser context' }
  globalThis[PORT] = {
    beginMeasurement() {
      if (state.measurement) return { ok: false, error: 'Measurement already active' }
      state.samples = []
      state.visibilityChanges = []
      const measurement = { startedAt: performance.now(), hiddenDuringMeasurement: false }
      state.measurement = measurement
      let previous = null
      const sentinel = (now) => {
        if (!state.measurement) return
        state.samples.push({
          sequence: state.samples.length + 1, timestamp: now, interval: previous === null ? 0 : now - previous,
          hidden: document.hidden === true, visibilityState: document.visibilityState,
        })
        previous = now
        requestAnimationFrame(sentinel)
      }
      requestAnimationFrame(sentinel)
      return { ok: true, startedAt: measurement.startedAt, note: 'rAF-only sentinel registered after existing loops; no WebGL API is wrapped' }
    },
    finishMeasurement() {
      const measurement = state.measurement
      state.measurement = null
      if (!measurement) return { ok: false, error: 'No active measurement' }
      const finishedAt = performance.now()
      return {
        ok: true, startedAt: measurement.startedAt, finishedAt,
        observationSeconds: (finishedAt - measurement.startedAt) / 1000,
        frameSamples: state.samples, hiddenDuringMeasurement: measurement.hiddenDuringMeasurement,
        visibilityChanges: state.visibilityChanges.slice(-64), battery: state.battery,
        collectorIdentity: 'rAF-only baseline sentinel; shape-equivalent timing row, no draw/memory/program observer',
      }
    },
  }
}

/** In-page prewarm leg, identical in both arms. */
function pageLinearSweep(options) {
  const { from, to, durationMs } = options
  return new Promise((resolve) => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const toY = (progress) => Math.max(0, Math.min(1, progress)) * maxScroll
    const startedAt = performance.now()
    const step = (now) => {
      const u = Math.min(1, (now - startedAt) / durationMs)
      window.scrollTo(0, toY(from + (to - from) * u))
      if (u >= 1) { resolve({ ok: true, from, to, durationMs, elapsedMs: now - startedAt, maxScroll, scrollY: window.scrollY }); return }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

/** In-page idle refresh estimate, identical in both arms and outside the measured window. */
function pageRefreshProbe(durationMs) {
  return new Promise((resolve) => {
    const intervals = []
    let previous = null
    const startedAt = performance.now()
    const step = (now) => {
      if (previous !== null) intervals.push(now - previous)
      previous = now
      if (now - startedAt >= durationMs) { resolve({ intervals, durationMs: now - startedAt }); return }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

function pageWorldEnvironment() {
  const world = window.__torqueWorld?.snapshot?.()
  return {
    ready: world?.ready === true, sheetBaked: world?.sheet?.baked === true,
    tier: world?.mechanical?.tier ?? null, sheetTier: world?.opening?.tier ?? null,
    rendererBackend: world?.renderer?.backend ?? null, effectiveDpr: world?.renderer?.effectiveDpr ?? null,
    drawingBuffer: world?.renderer?.drawingBuffer ?? null,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    pageMode: document.querySelector('.torque-page')?.dataset.torqueMode ?? null,
    documentHidden: document.hidden === true, visibilityState: document.visibilityState,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

function sourceIdentity() {
  const sourceFiles = SOURCE_PATHS.map((file) => ({ file, sha256: sha256(readFileSync(path.join(ROOT, file))) }))
  return {
    sourceFiles, sourceHash: sha256(sourceFiles.map((entry) => `${entry.file}:${entry.sha256}`).join('\n')),
    observerSha256: sha256(readFileSync(OBSERVER_PATH)),
    contractProducerSha256: sha256(readFileSync(CONTRACT_PATH)),
  }
}

function baseProvenance(args) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim()
  if (branch !== 'torque-wrench/rebuild') throw new Error(`wrong branch ${branch}; expected torque-wrench/rebuild`)
  const manifestPath = path.join(args.buildDir, '.vite/manifest.json')
  const manifestBytes = readFileSync(manifestPath)
  const source = sourceIdentity()
  const targets = resolveServedTargets(args.buildDir)
  const missing = ['entry', 'lazyScene'].filter((role) => !targets.some((target) => target.role === role))
  if (missing.length) throw new Error(`build manifest did not resolve: ${missing.join(', ')}`)
  return {
    workspace: ROOT, head, branch, source, buildDir: args.buildDir,
    buildManifest: { path: manifestPath, bytes: manifestBytes.length, sha256: sha256(manifestBytes) },
    servedTargetPlan: targets, verifierSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    node: process.version, launch: describeLaunch(), launchConfig: launchConfig(),
    sourceBuildCausality: 'UNVERIFIED: live source and build/served bytes are identified; this diagnostic does not prove the build was produced from these exact post-build worktree bytes',
  }
}

async function fetchServedIdentity(context, origin, buildDir) {
  const entries = []
  for (const target of resolveServedTargets(buildDir)) {
    const entry = { role: target.role, pathname: target.pathname, source: target.source, status: null, bytes: null, sha256: null, localFile: target.localRelative ?? null, localFilePresent: false, localSha256: null, match: null }
    try {
      const response = await context.request.get(new URL(target.pathname, origin).href, { timeout: 15000 })
      const body = await response.body()
      entry.status = response.status()
      entry.bytes = body.length
      entry.sha256 = sha256(body)
    } catch (error) { entry.error = String(error) }
    if (target.localRelative) {
      const local = path.join(buildDir, target.localRelative)
      entry.localFilePresent = existsSync(local)
      if (entry.localFilePresent) {
        entry.localSha256 = sha256(readFileSync(local))
        entry.match = entry.sha256 !== null && entry.localSha256 === entry.sha256
      }
    }
    entries.push(entry)
  }
  return entries
}

function servedMap(rows) {
  return new Map((Array.isArray(rows) ? rows : []).map((row) => [row.role, row]))
}

function intervalSummary(samples) {
  const rows = Array.isArray(samples) ? samples : []
  const intervals = rows.map((row) => Number(row?.interval)).filter((value) => finite(value) && value > 0)
  const sorted = [...intervals].sort((a, b) => a - b)
  const at = (fraction) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1))] : null)
  const invalid = rows.filter((row) => !finite(Number(row?.interval)) || Number(row?.interval) <= 0)
  const hidden = rows.filter((row) => row?.hidden === true || row?.visibilityState === 'hidden')
  const tailCount = intervals.filter((value) => value > TAIL_THRESHOLD_MS).length
  const mean = intervals.length ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length : null
  return {
    sampleCount: rows.length, summarizedIntervalCount: intervals.length,
    nonPositiveOrInvalidIntervalCount: invalid.length, hiddenIntervalCount: hidden.length,
    p50: round(at(0.5)), p95: round(at(0.95)), p99: round(at(0.99)), maximum: round(at(1)),
    minimum: sorted.length ? round(sorted[0]) : null, mean: round(mean),
    tailPercent: intervals.length ? round((100 * tailCount) / intervals.length) : null,
    invalidIntervalRows: invalid, hiddenIntervalRows: hidden,
    method: 'all finite positive presented-rAF intervals, including hidden rows; the initial zero-length boundary row is retained and counted as non-summarized, never silently discarded',
  }
}

function frameIntegrity(samples, includeLiveCalls) {
  const rows = Array.isArray(samples) ? samples : []
  const sequence = rows.filter((row, index) => row?.sequence !== index + 1 || !finite(Number(row?.timestamp)) || (index > 0 && Number(row.timestamp) <= Number(rows[index - 1]?.timestamp)))
  const inactive = includeLiveCalls
    ? rows.slice(1).filter((row) => !finite(Number(row?.liveCalls)) || Number(row.liveCalls) <= 0)
    : []
  return {
    sampleCount: rows.length, invalidSequenceOrTimestampCount: sequence.length,
    inactivePostboundaryCount: includeLiveCalls ? inactive.length : null,
    livenessObserved: includeLiveCalls === true, invalidSequenceRows: sequence,
    basis: includeLiveCalls ? 'observer liveCalls rows' : 'baseline has no draw observer; liveness is not inferred',
  }
}

function fixtureIntegrity(sweep, windowInfo, holdTarget, maxScroll) {
  const failures = []
  const samples = Array.isArray(sweep?.samples) ? sweep.samples : []
  const missing = samples.filter((row) => !finite(Number(row?.progress)))
  const outOfWindow = samples.filter((row) => finite(Number(row.progress)) && (row.progress < windowInfo.start - PHASE_WINDOW_TOLERANCE || row.progress > windowInfo.end + PHASE_WINDOW_TOLERANCE))
  const hold = sweep?.portions?.hold ?? {}
  const transition = sweep?.portions?.transition ?? {}
  const tolerance = finite(maxScroll) && maxScroll > 0 ? 0.5 / maxScroll : null
  const holdBoundaries = Array.isArray(hold.boundaries) ? hold.boundaries : []
  const invalidHold = holdBoundaries.filter((row) => !finite(Number(row?.progress)) || !finite(Number(holdTarget)) || !finite(Number(tolerance)) || Math.abs(row.progress - holdTarget) > tolerance)
  if (windowInfo?.ok !== true) failures.push(`phase window unavailable: ${windowInfo?.error ?? 'not resolved'}`)
  if (sweep?.ok !== true) failures.push(`fixture failed: ${sweep?.error ?? 'unknown'}`)
  if (samples.length === 0 || missing.length > 0) failures.push(`missing progress witness: ${missing.length}/${samples.length}`)
  if (outOfWindow.length > 0) failures.push(`${outOfWindow.length} progress witnesses left the phase window`)
  if (!finite(transition.startedAt) || !finite(transition.settledAt) || !finite(transition.endedAt) || transition.endedAt - transition.settledAt < 300 || transition.endedAt !== hold.startedAt) failures.push('reverse-to-hold transition did not settle separately')
  if (holdBoundaries.length < 2 || invalidHold.length > 0 || !finite(hold.startedAt) || !finite(hold.endedAt) || hold.endedAt - hold.startedAt < HOLD_SECONDS * 1000) failures.push('hold witnesses or 20 s hold span invalid')
  return { failures, progressSampleCount: samples.length, missingWitnessCount: missing.length, outOfWindowCount: outOfWindow.length, holdBoundaryCount: holdBoundaries.length, invalidHoldWitnessCount: invalidHold.length, targetTolerance: tolerance }
}

function actualProgramEvents(measurement) {
  const rows = Array.isArray(measurement?.programEvents) ? measurement.programEvents : []
  return {
    available: rows.length > 0 || measurement?.programCreationObserved === true,
    retainedEventCount: rows.length,
    retention: measurement?.programEventRetention ?? { truncated: null, countsAreLowerBounds: true },
    createEventCount: rows.filter((row) => row?.kind === 'create').length,
    linkEventCount: rows.filter((row) => row?.kind === 'link').length,
    deleteEventCount: rows.filter((row) => row?.kind === 'delete').length,
    identityMethod: measurement?.programIdentityMethod ?? 'unavailable',
    basis: 'actual retained create/link/delete event rows in the measured interval; no net renderer.programs or end-state count is substituted',
    recent: rows,
  }
}

function pairArmOrder(args, pairIndex) {
  if (args['arm-order'] === 'baseline-first') return ['baseline', 'observer']
  if (args['arm-order'] === 'observer-first') return ['observer', 'baseline']
  return pairIndex % 2 === 1 ? ['baseline', 'observer'] : ['observer', 'baseline']
}

async function runArm({ chromium, args, arm, pair, order, provenance, pairStartedAt }) {
  const errors = []
  const result = { arm, pair, order, startedAt: new Date().toISOString(), browserProcess: 'fresh per arm', errors }
  let browser = null
  try {
    const launch = launchConfig()
    browser = await chromium.launch(launch)
    result.browserVersion = browser.version()
    result.launchConfig = launch
    const context = await browser.newContext({ ...VIEWPORTS[args.viewport], serviceWorkers: 'block', reducedMotion: 'no-preference' })
    if (arm === 'observer') await context.addInitScript(torquePerformanceObserverInit)
    else await context.addInitScript(overheadBaselineCollectorInit)
    const tab = await context.newPage()
    tab.on('pageerror', (error) => errors.push(`pageerror: ${String(error)}`))
    tab.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
    tab.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`))
    const target = new URL(args.url)
    target.searchParams.set('quality', args.tier)
    const navigationStartedAt = Date.now()
    const navigation = await tab.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (!navigation?.ok()) throw new Error(`document status ${navigation?.status()}`)
    let ready = false
    try {
      await tab.waitForFunction(() => window.__torqueWorld?.snapshot?.()?.ready === true && window.__torqueWorld?.snapshot?.()?.sheet?.baked === true, null, { timeout: READINESS_TIMEOUT_MS })
      ready = true
    } catch (error) { errors.push(`readiness timeout after ${READINESS_TIMEOUT_MS} ms: ${error.message}`) }
    result.readiness = {
      ready, spanMs: Date.now() - navigationStartedAt, timeoutMs: READINESS_TIMEOUT_MS,
      requirement: 'existing phase-producer readiness only: __torqueWorld.ready and sheet.baked',
      fullStartupReadiness: 'UNVERIFIED: fonts/annotation/inspection/full shader readiness and startup budgets are out of scope',
    }
    result.environmentBefore = await tab.evaluate(pageWorldEnvironment)
    if (!ready) throw new Error('phase readiness was not observed')
    result.refresh = await tab.evaluate(pageRefreshProbe, 1200)
    const beats = await tab.evaluate(() => window.__torqueNarrative?.beats ?? null)
    const windowInfo = phaseWindow(beats, args.phase)
    result.phaseWindow = windowInfo
    if (!windowInfo.ok) throw new Error(`phase window unavailable: ${windowInfo.error}`)
    const holdProgress = args['hold-progress'] === null ? (windowInfo.start + windowInfo.end) / 2 : args['hold-progress']
    if (holdProgress < windowInfo.start || holdProgress > windowInfo.end) throw new Error(`hold progress ${holdProgress} is outside ${args.phase} ${windowInfo.start}..${windowInfo.end}`)
    result.holdProgress = holdProgress
    await tab.evaluate(pageLinearSweep, { from: 0, to: 1, durationMs: args['prewarm-seconds'] * 1000 })
    await tab.evaluate(pageLinearSweep, { from: 1, to: 0, durationMs: args['prewarm-seconds'] * 1000 })
    await tab.waitForTimeout(PREWARM_SETTLE_MS)
    result.prewarm = {
      complete: true, secondsPerDirection: args['prewarm-seconds'], settleMs: PREWARM_SETTLE_MS,
      order: 'readiness, idle refresh probe, forward full-range sweep, reverse full-range sweep, idle settle, phase seek, 300 ms settle, measurement',
    }
    const before = await tab.evaluate(pageWorldEnvironment)
    result.tierStart = before.tier
    result.sheetTierStart = before.sheetTier
    await tab.evaluate((start) => scrollTo(0, start * (document.documentElement.scrollHeight - innerHeight)), windowInfo.start)
    await tab.waitForFunction((start) => {
      const progress = window.__torqueNarrative?.snapshot?.().progress
      const max = document.documentElement.scrollHeight - innerHeight
      return typeof progress === 'number' && Math.abs(progress - start) * max <= 0.5
    }, windowInfo.start, { timeout: 5000 })
    await tab.waitForTimeout(300)
    result.servedBeforeMeasurement = await fetchServedIdentity(context, args.origin, args.buildDir)
    const collectionStart = arm === 'observer'
      ? await tab.evaluate(() => window.__torquePerformanceObserver.beginMeasurement())
      : await tab.evaluate(() => window.__torqueOverheadBaselineCollector.beginMeasurement())
    if (collectionStart?.ok !== true) throw new Error(`${arm} collector did not start: ${JSON.stringify(collectionStart)}`)
    const sweep = await tab.evaluate(pageMeasurementSweep, {
      start: windowInfo.start, end: windowInfo.end, hold: holdProgress,
      forwardMs: FORWARD_SECONDS * 1000, reverseMs: REVERSE_SECONDS * 1000, holdMs: HOLD_SECONDS * 1000,
      guardMs: GUARD_MS, sampleEveryMs: 1000,
    })
    const measurement = arm === 'observer'
      ? await tab.evaluate(() => window.__torquePerformanceObserver.finishMeasurement())
      : await tab.evaluate(() => window.__torqueOverheadBaselineCollector.finishMeasurement())
    if (measurement?.ok !== true) throw new Error(`${arm} collector did not finish: ${JSON.stringify(measurement)}`)
    const after = await tab.evaluate(pageWorldEnvironment)
    result.sweep = sweep
    result.measurement = measurement
    result.environmentAfter = after
    result.tierEnd = after.tier
    result.sheetTierEnd = after.sheetTier
    result.servedAfterMeasurement = await fetchServedIdentity(context, args.origin, args.buildDir)
    if (arm === 'observer') {
      const snapshot = await tab.evaluate(() => window.__torquePerformanceObserver.snapshot())
      result.observerSnapshot = snapshot
      result.observerEnvironment = snapshot.environment
      result.battery = snapshot.environment.battery ?? null
    } else {
      result.observerSnapshot = null
      result.observerEnvironment = null
      result.battery = measurement.battery ?? null
    }
    await context.close()
  } catch (error) {
    errors.push(`environment: ${String(error?.stack ?? error)}`)
  } finally {
    if (browser) await browser.close().catch((error) => errors.push(`browser close: ${String(error)}`))
  }
  result.finishedAt = new Date().toISOString()
  result.pairStartedAt = pairStartedAt
  result.intervalSummary = intervalSummary(result.measurement?.frameSamples)
  result.frameIntegrity = frameIntegrity(result.measurement?.frameSamples, result.arm === 'observer')
  result.fixtureIntegrity = fixtureIntegrity(result.sweep, result.phaseWindow, result.holdProgress, result.sweep?.maxScroll)
  result.actualProgramEvents = result.arm === 'observer'
    ? actualProgramEvents(result.measurement)
    : { available: false, retainedEventCount: 0, createEventCount: null, linkEventCount: null, deleteEventCount: null, identityMethod: 'unavailable without the observer', basis: 'UNVERIFIED: the baseline deliberately has no program instrumentation; zero is never inferred', recent: [] }
  result.capture = { captureActive: false, captures: 0, screenshots: 0, videos: 0, traces: 0, method: 'capture-free telemetry only' }
  result.throttle = { harnessNetworkThrottling: false, harnessCpuThrottling: false, cdpThrottlingApplied: false, externalThrottling: 'UNVERIFIED', serviceWorkers: 'blocked' }
  return result
}

function compareServedArm(rowsBefore, rowsAfter) {
  const failures = []
  const before = servedMap(rowsBefore)
  const after = servedMap(rowsAfter)
  for (const role of ['html', 'entry', 'lazyScene', 'asset']) {
    const first = before.get(role)
    const second = after.get(role)
    if (!first || !second) { failures.push(`served identity ${role} missing before/after measurement`); continue }
    if (first.status !== 200 || second.status !== 200) failures.push(`served ${role} status ${first.status}/${second.status}`)
    if (first.sha256 !== second.sha256) failures.push(`served ${role} changed during arm`)
    if (first.match !== true || second.match !== true) failures.push(`served/build mismatch for ${role}`)
  }
  return failures
}

function armBattery(arm) {
  return arm?.battery ?? arm?.measurement?.battery ?? {}
}

function analyzePair(pair) {
  const baseline = pair.arms.find((arm) => arm.arm === 'baseline')
  const observer = pair.arms.find((arm) => arm.arm === 'observer')
  const failures = []
  const unverified = []
  if (!baseline || !observer) return { comparable: false, failures: ['pair does not contain both arms'], unverified: ['one or both arms absent'] }
  for (const arm of [baseline, observer]) {
    failures.push(...arm.errors.map((error) => `${arm.arm}: ${error}`))
    failures.push(...compareServedArm(arm.servedBeforeMeasurement, arm.servedAfterMeasurement).map((error) => `${arm.arm}: ${error}`))
    failures.push(...arm.fixtureIntegrity.failures.map((error) => `${arm.arm}: ${error}`))
    if (arm.readiness?.ready !== true) failures.push(`${arm.arm}: phase readiness missing`)
    if (arm.intervalSummary.summarizedIntervalCount < 2 || !['p50', 'p95', 'p99', 'maximum', 'mean'].every(field => finite(arm.intervalSummary[field]))) failures.push(`${arm.arm}: no valid summarized frame-interval distribution`)
    if (arm.sweep?.hiddenDuringSweep === true || arm.environmentAfter?.documentHidden === true || arm.measurement?.hiddenDuringMeasurement === true || arm.intervalSummary.hiddenIntervalCount > 0) failures.push(`${arm.arm}: hidden interval retained; diagnostic pair invalid`)
    if (arm.frameIntegrity.invalidSequenceOrTimestampCount > 0) failures.push(`${arm.arm}: sentinel sequence/timestamp invalid`)
    if (arm.intervalSummary.nonPositiveOrInvalidIntervalCount > 1) failures.push(`${arm.arm}: more than the one initial boundary interval is non-positive/invalid`)
    if (!finite(arm.measurement?.observationSeconds) || arm.measurement.observationSeconds < 60) failures.push(`${arm.arm}: observed duration is below the true 60 s fixture`)
    if (arm.environmentAfter?.pageMode !== 'live') failures.push(`${arm.arm}: page mode ${arm.environmentAfter?.pageMode ?? 'absent'} is not live`)
    if (arm.tierStart !== argsTier(arm) || arm.tierEnd !== argsTier(arm)) failures.push(`${arm.arm}: natural tier ${arm.tierStart}..${arm.tierEnd} differs from requested ${argsTier(arm)}`)
    if (arm.sheetTierStart !== argsTier(arm) || arm.sheetTierEnd !== argsTier(arm)) failures.push(`${arm.arm}: sheet tier differs from requested natural tier`)
    const hardware = deriveHardwareGl(arm.environmentAfter?.rendererBackend)
    if (hardware.hardwareGL !== true) failures.push(`${arm.arm}: hardware GL not observed (${arm.environmentAfter?.rendererBackend ?? 'no renderer'})`)
    if (arm.actualProgramEvents.available !== true && arm.arm === 'observer') failures.push('observer: actual program event stream missing')
  }
  if (baseline.measurement?.collectorIdentity !== 'rAF-only baseline sentinel; shape-equivalent timing row, no draw/memory/program observer') failures.push('baseline collector identity missing or altered')
  if (baseline.environmentAfter?.rendererBackend !== observer.environmentAfter?.rendererBackend) failures.push('actual renderer backend differs between arms')
  if (JSON.stringify(baseline.environmentAfter?.drawingBuffer) !== JSON.stringify(observer.environmentAfter?.drawingBuffer)) failures.push('drawing buffer differs between arms')
  if (baseline.environmentAfter?.effectiveDpr !== observer.environmentAfter?.effectiveDpr) failures.push('effective DPR differs between arms')
  if (baseline.phaseWindow?.ok !== true || observer.phaseWindow?.ok !== true || baseline.phaseWindow.start !== observer.phaseWindow.start || baseline.phaseWindow.end !== observer.phaseWindow.end || JSON.stringify(baseline.phaseWindow.beats) !== JSON.stringify(observer.phaseWindow.beats)) failures.push('phase-window identity differs between arms')
  if (baseline.holdProgress !== observer.holdProgress) failures.push('hold-progress identity differs between arms')
  const refresh = { baseline: refreshClass(baseline.refresh), observer: refreshClass(observer.refresh) }
  if (!refresh.baseline.classHz || !refresh.observer.classHz) unverified.push('refresh class absent or ambiguous in at least one arm')
  else if (refresh.baseline.classHz !== refresh.observer.classHz) failures.push('observed refresh class differs between arms')
  if (observer.actualProgramEvents.retention.truncated !== false) unverified.push('observer program event window truncated or retention unobserved; counts are lower bounds')
  const baselineBattery = armBattery(baseline)
  const observerBattery = armBattery(observer)
  if (typeof baselineBattery.charging !== 'boolean' || typeof observerBattery.charging !== 'boolean') unverified.push('battery charging state absent in at least one arm')
  else if (baselineBattery.charging !== observerBattery.charging) failures.push(`power charging state changed across arms: baseline=${baselineBattery.charging} observer=${observerBattery.charging}`)
  const before = servedMap(baseline.servedBeforeMeasurement)
  const observerBefore = servedMap(observer.servedBeforeMeasurement)
  for (const role of ['html', 'entry', 'lazyScene', 'asset']) if (before.get(role)?.sha256 !== observerBefore.get(role)?.sha256) failures.push(`baseline/observer served ${role} identity differs`)
  if (baseline.frameIntegrity.livenessObserved !== false) failures.push('baseline unexpectedly claims draw liveness')
  if (observer.frameIntegrity.inactivePostboundaryCount > 0) failures.push(`${observer.frameIntegrity.inactivePostboundaryCount} observer postboundary samples have no live narrative calls`)
  const delta = {
    observationSeconds: round(observer.measurement?.observationSeconds - baseline.measurement?.observationSeconds),
    p50: round(observer.intervalSummary.p50 - baseline.intervalSummary.p50),
    p95: round(observer.intervalSummary.p95 - baseline.intervalSummary.p95),
    p99: round(observer.intervalSummary.p99 - baseline.intervalSummary.p99),
    maximum: round(observer.intervalSummary.maximum - baseline.intervalSummary.maximum),
    mean: round(observer.intervalSummary.mean - baseline.intervalSummary.mean),
    presentedFrames: (observer.intervalSummary.summarizedIntervalCount ?? 0) - (baseline.intervalSummary.summarizedIntervalCount ?? 0),
  }
  return {
    comparable: failures.length === 0 && unverified.length === 0,
    failures, unverified, delta, refresh,
    baselineDurationSeconds: round(baseline.measurement?.observationSeconds),
    observerDurationSeconds: round(observer.measurement?.observationSeconds),
    battery: { baseline: baselineBattery, observer: observerBattery, changed: baselineBattery.charging !== observerBattery.charging },
  }
}

function argsTier(arm) { return arm.requestedTier }

function median(values) {
  const rows = values.filter(finite).sort((a, b) => a - b)
  if (!rows.length) return null
  const middle = Math.floor(rows.length / 2)
  return rows.length % 2 ? rows[middle] : (rows[middle - 1] + rows[middle]) / 2
}

// Environment classification only: never a product frame-time acceptance budget.
function refreshClass(probe) {
  const interval = median(probe?.intervals ?? [])
  const measuredHz = interval > 0 ? 1000 / interval : null
  const classes = [24, 30, 40, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 200, 240, 360]
  const nearest = measuredHz ? classes.reduce((a, b) => Math.abs(a - measuredHz) < Math.abs(b - measuredHz) ? a : b) : null
  return { medianIntervalMs: round(interval), measuredHz: round(measuredHz), classHz: nearest && Math.abs(nearest - measuredHz) / nearest <= 0.05 && probe.intervals.length >= 10 ? nearest : null, basis: 'idle rAF median nearest nominal refresh within 5%; environment comparison only' }
}

function aggregateDeltas(pairs) {
  const fields = ['observationSeconds', 'p50', 'p95', 'p99', 'maximum', 'mean', 'presentedFrames']
  const aggregate = {}
  for (const field of fields) {
    const values = pairs.filter((pair) => pair.analysis?.comparable === true).map((pair) => pair.analysis?.delta?.[field]).filter(finite)
    aggregate[field] = {
      values: values.map((value) => round(value)), median: round(median(values)),
      minimum: values.length ? round(Math.min(...values)) : null, maximum: values.length ? round(Math.max(...values)) : null,
    }
  }
  return aggregate
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(HELP); return }
  let args
  try { args = parseArgs(process.argv.slice(2)) } catch (error) { console.error(`${error.message}\n${HELP}`); process.exitCode = 2; return }

  const runId = randomUUID()
  const startedAt = new Date().toISOString()
  let provenance = null
  const pairs = []
  let chromium = null
  try {
    provenance = baseProvenance(args)
    ;({ chromium } = await import('playwright'))
    provenance.playwrightVersion = createRequire(import.meta.url)('playwright/package.json').version
    for (let pairIndex = 1; pairIndex <= args.pairs; pairIndex++) {
      const order = pairArmOrder(args, pairIndex)
      const pairStartedAt = new Date().toISOString()
      const arms = []
      for (const [position, armName] of order.entries()) {
        if (position > 0 && args['inter-arm-settle'] > 0) await new Promise((resolve) => setTimeout(resolve, args['inter-arm-settle'] * 1000))
        arms.push(await runArm({ chromium, args, arm: armName, pair: pairIndex, order: position + 1, provenance, pairStartedAt }))
      }
      const pair = { pair: pairIndex, order, startedAt: pairStartedAt, finishedAt: new Date().toISOString(), arms }
      for (const arm of pair.arms) arm.requestedTier = args.tier
      pair.analysis = analyzePair(pair)
      pairs.push(pair)
    }
  } catch (error) {
    pairs.push({ pair: pairs.length + 1, order: [], startedAt: new Date().toISOString(), arms: [], analysis: { comparable: false, failures: [String(error?.stack ?? error)], unverified: [], delta: null } })
  }

  const afterSource = (() => { try { return sourceIdentity() } catch (error) { return { error: String(error) } } })()
  const sourceStable = afterSource?.sourceHash === provenance?.source?.sourceHash && afterSource?.observerSha256 === provenance?.source?.observerSha256
  const allPairFailures = pairs.flatMap((pair) => pair.analysis?.failures ?? [])
  const allPairUnverified = pairs.flatMap((pair) => pair.analysis?.unverified ?? [])
  const comparablePairs = pairs.filter((pair) => pair.analysis?.comparable === true).length
  const status = !provenance || pairs.some((pair) => pair.arms.length === 0)
    ? 'BLOCKED'
    : !sourceStable
      ? 'BLOCKED'
      : allPairFailures.length
        ? 'FAIL'
        : comparablePairs !== pairs.length || allPairUnverified.length
          ? 'UNVERIFIED'
          : 'DIAGNOSTIC_COMPLETE'
  const report = {
    schema: 'JG-038-performance-observer-overhead-diagnostic-v1',
    runId, startedAt, finishedAt: new Date().toISOString(),
    status, performanceAcceptance: 'UNVERIFIED: bounded diagnostic only; no G8, product performance, startup, physical-mobile or owner acceptance is claimed',
    config: {
      ...args, url: args.url, requestedTier: args.tier, armOrderPolicy: args['arm-order'],
      fixedPhaseInput: { forwardSeconds: FORWARD_SECONDS, reverseSeconds: REVERSE_SECONDS, holdSeconds: HOLD_SECONDS, guardMs: GUARD_MS },
      qualityLock: false, powerDeclarationAccepted: false,
    },
    provenance, sourceStability: {
      stable: sourceStable, before: provenance?.source ?? null, after: afterSource,
      basis: 'all bound product/observer/contract files are rehashed after the final arm; concurrent drift blocks the diagnostic',
    },
    measurementDesign: {
      arms: ['baseline rAF-only sentinel', 'existing full torque performance observer'],
      collectorLocation: 'in page; one begin RPC, one fixture-completion RPC already required by the fixture, one finish RPC',
      perFramePlaywrightRpc: 0, fixture: 'canonical phase-confined 20 s forward / 20 s reverse / separate settle / 20 s hold',
      repeatSchedule: pairs.map((pair) => ({ pair: pair.pair, order: pair.order })),
      programAccounting: 'observer event rows only; baseline program identity is UNVERIFIED and never filled with zero or a net count',
      samplePolicy: 'raw rows retained; only the first zero-length boundary is excluded from interval statistics, hidden/invalid rows are counted and fail comparability',
    },
    power: {
      primaryAcPowerVerified: false,
      reason: 'this diagnostic accepts no operator AC declaration; navigator.getBattery is supporting runtime evidence only',
      operatorNote: 'owner reported a power interruption and Win32_Battery BatteryStatus=1/72% charge before scheduling; treat external power as changed/UNVERIFIED unless re-observed at run time',
      byPair: pairs.map((pair) => pair.analysis?.battery ?? null),
    },
    visibility: {
      headless: provenance?.launchConfig?.headless === true, documentHiddenRequired: false,
      ownerActuallyVisible: 'UNVERIFIED: headless document.visibilityState is not owner-visible proof',
      hiddenSamplePolicy: 'retained and counted; any hidden measured row invalidates its pair',
    },
    pairs,
    aggregate: { comparablePairs, requestedPairs: pairs.length, observerMinusBaseline: aggregateDeltas(pairs) },
    unverifiedObservables: [
      ...allPairUnverified,
      { observable: 'primaryACPower', reason: 'no AC declaration is accepted; battery observations do not establish external power' },
      { observable: 'exactCausalInstrumentationOverheadMs', reason: 'paired observer-minus-baseline deltas are diagnostic observations under run-to-run noise, not an isolated nonperturbing wrapper cost' },
      { observable: 'sourceBuildCausality', reason: provenance?.sourceBuildCausality ?? 'provenance unavailable' },
      { observable: 'baselineProgramEvents', reason: 'baseline deliberately has no program instrumentation; no zero count is inferred' },
      { observable: 'driverMemoryResidency', reason: 'out of scope for this overhead diagnostic' },
      { observable: 'gpuExecutionTime', reason: 'presented-rAF timing is not GPU execution time' },
      { observable: 'G8PerformanceAcceptance', reason: 'bounded diagnostic only; the pilot deficit is not attributed to product or observer behavior' },
    ],
    limitations: [
      'Observer-minus-baseline quantiles include scheduling, display, thermal, cache and OS noise; a negative or small delta is not proof of zero observer cost.',
      'The baseline sentinel matches the observer sentinel shape but cannot remove the rAF callback cost common to both arms.',
      'Arms are separate fresh browser processes; order alternation reduces drift but cannot eliminate first/second-position effects.',
      'No startup readiness, cache/shader budget, repeatable wheel/touch roster, physical mobile, driver residency or GPU-time claim is made.',
    ],
    errors: allPairFailures,
  }

  exitCode = status === 'DIAGNOSTIC_COMPLETE' ? 0 : status === 'UNVERIFIED' ? 10 : status === 'BLOCKED' ? 11 : 1
  try {
    mkdirSync(args.out, { recursive: true })
    const stamp = report.finishedAt.replace(/[:.]/g, '-')
    const output = path.join(args.out, `performance-observer-overhead-${args.viewport}-${args.tier}-${args.phase}-p${args.pairs}-${stamp}-${runId.slice(0, 8)}.json`)
    writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
    report.reportPath = output
    console.log(`${status}: comparablePairs=${comparablePairs}/${pairs.length} failures=${allPairFailures.length} unverified=${report.unverifiedObservables.length}`)
    console.log(`report=${output}`)
    if (allPairFailures.length) console.log(`failures=${JSON.stringify(allPairFailures.slice(0, 12))}`)
    if (allPairUnverified.length) console.log(`pair unverified=${JSON.stringify(allPairUnverified)}`)
  } catch (error) {
    console.error(`report write failed: ${String(error)}`)
    exitCode = 12
  }
  process.exitCode = exitCode
}

let exitCode = 11
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
