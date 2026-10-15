/**
 * JG-038 G8 performance-contract producer - Lane B minimum, owner-approved contract 18.
 *
 * Produces ONE contract-validated phase sample for the private torque page: a 60 s presented
 * frame measurement with separate 20 s forward / 20 s reverse / 20 s hold input portions
 * confined to a single narrative phase, plus measured hardware, tier and served byte identity.
 * The pure validator in scripts/lib/torque-verification-contract.mjs decides PASS/FAIL/UNVERIFIED;
 * this producer never substitutes a declared value, a pooled average or a lowered threshold for a
 * missing observable.
 *
 * Observables that cannot be measured honestly here stay absent, so the validator reports them
 * UNVERIFIED:
 *   - wall power unless --power names AC explicitly; navigator charging is supporting evidence and an
 *     arbitrary operator label or a reported discharge leaves it UNVERIFIED;
 *   - driver memory residency always, and the whole texture/target total whenever the WebGL format,
 *     dimension, mipmap, compressed or 3D storage estimate is incomplete;
 *   - instrumentation overhead (no non-perturbing total is observable);
 *   - startup cache and shader budgets, which are separate five-trial conditions;
 *   - GPU execution time (rAF intervals are presented-frame timing, not GPU time).
 *
 * Boundaries: the parent owns browser/build/GPU scheduling, preview serving and the full 60-report
 * roster. This script starts no server and no build, runs only when invoked, writes its report to a
 * task-owned evidence directory (never inside the served build directory), and modifies no product
 * source, frozen evidence or another lane's files. Served identity is bound to the local build for
 * the HTML document, the manifest-selected entry chunk, the lazy scene chunk and Default.glb: a
 * non-200 response, an unresolved target or a sha mismatch fails the run.
 *
 * Exit codes: 0 PASS, 1 FAIL, 2 usage, 10 UNVERIFIED (missing observable), 11 environment blocked,
 * 12 report-write failure.
 */
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeLaunch, launchConfig } from './lib/browser-launch.mjs'
import { TORQUE_BUDGETS, TORQUE_PHASE_BUDGETS, validateTorquePerformanceSample } from './lib/torque-verification-contract.mjs'
import { TORQUE_PERFORMANCE_PHASES, deriveHardwareGl, percentile, phaseWindow, summarizeFrameSamples, torquePerformanceObserverInit } from './lib/torque-performance-observers.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OBSERVER_PATH = fileURLToPath(new URL('./lib/torque-performance-observers.mjs', import.meta.url))
const EVIDENCE = path.join(ROOT, 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery')
const DEFAULT_OUT = path.join(EVIDENCE, 'runtime-performance')
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
const TAIL_THRESHOLD_MS = 33.4
const DPR_RATIO_TOLERANCE = 0.02
const PHASE_WINDOW_TOLERANCE = 0.01
const READINESS_TIMEOUT_MS = 30000
const PREWARM_SETTLE_MS = 5000
const SOURCE_PATHS = [
  'src/scene/torque-wrench/RuntimeWorld.tsx',
  'src/scene/torque-wrench/Scene.tsx',
  'src/scene/torque-wrench/ScrollConductor.tsx',
  'src/scene/torque-wrench/beats.ts',
  'src/scene/torque-wrench/conductorRuntime.ts',
  'src/state/torqueWrenchStore.ts',
  'src/state/qualityStore.ts',
]
const HELP = `usage: node scripts/verify-torque-performance-contract.mjs --url=http://localhost:<parent-port>${PRIVATE_PATH} [options]

Runs one contract-18 phase sample for the private torque page and writes a single JSON report.
Browser/build/GPU scheduling belongs to the parent; this command starts no server and no build.

Options
  --url=<url>                required; loopback origin or ${PRIVATE_PATH} (no query/hash/credentials)
  --out=<dir>                evidence directory (default ${path.relative(ROOT, DEFAULT_OUT)})
  --build-dir=<dir>          worktree .scratch production output, for served/build byte identity
  --viewport=D|N             contract viewport case (default D; N is emulated, not physical mobile)
  --tier=full|lite           requested tier, must equal the observed effective tier (default full)
  --phase=<name>             narrative phase (default breakthrough)
  --run=1|2|3                independent run index (default 1)
  --hold-progress=<0..1>     hold position inside the phase window (default: window midpoint)
  --prewarm-seconds=<n>      forward and reverse prewarm duration, each (default 6)
  --device=<label>           reference device label recorded verbatim as operator-declared
  --os=<label>               OS label (default derived from the browser user agent)
  --power=<label>            AC declaration, e.g. \"AC\"; a label that does not name AC leaves the
                             primary power requirement UNVERIFIED (battery charging is supporting evidence only)
  --help                     print this text

Phases: ${TORQUE_PERFORMANCE_PHASES.join(', ')}
Exit: 0 PASS, 1 FAIL, 2 usage, 10 UNVERIFIED (missing observable), 11 environment blocked,
12 report write error.`

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const finite = (value) => typeof value === 'number' && Number.isFinite(value)
const round = (value, digits) => Number(value.toFixed(digits))
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

function inside(parent, target) {
  const relative = path.relative(parent, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

// Resolve existing ancestors so a junction in an output path cannot leave the owned root.
function checkedPath(value, parent) {
  const absolute = path.resolve(ROOT, value)
  if (!inside(parent, absolute)) throw new Error(`path must be inside ${parent}: ${absolute}`)
  let ancestor = absolute
  while (!existsSync(ancestor)) ancestor = path.dirname(ancestor)
  if (!inside(realpathSync(parent), realpathSync(ancestor))) throw new Error(`path/junction escapes ${parent}`)
  return absolute
}

function parseArgs(argv) {
  const args = { viewport: 'D', tier: 'full', phase: 'breakthrough', run: 1, out: DEFAULT_OUT, 'prewarm-seconds': 6 }
  const keys = new Set(['url', 'out', 'build-dir', 'viewport', 'tier', 'phase', 'run', 'hold-progress', 'prewarm-seconds', 'device', 'os', 'power'])
  for (let index = 0; index < argv.length; index++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[index])
    if (!match || !keys.has(match[1])) throw new Error(`unknown argument: ${argv[index]}`)
    const value = match[2] ?? argv[++index]
    if (value === undefined || value.startsWith('--')) throw new Error(`value missing for --${match[1]}`)
    args[match[1]] = value
  }
  if (!args.url) throw new Error('--url is required (the parent supplies the preview)')
  const url = new URL(args.url)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password || url.search || url.hash) {
    throw new Error('--url must be a loopback http origin or a /torque-wrench/ URL without query, hash or credentials')
  }
  if (!['/', PRIVATE_PATH, PRIVATE_PATH.replace(/\/$/, '')].includes(url.pathname)) throw new Error(`--url path must be ${PRIVATE_PATH}`)
  if (url.pathname === '/') url.pathname = PRIVATE_PATH
  if (!VIEWPORTS[args.viewport]) throw new Error('--viewport must be D or N')
  if (!['full', 'lite'].includes(args.tier)) throw new Error('--tier must be full or lite')
  if (!TORQUE_PERFORMANCE_PHASES.includes(args.phase)) throw new Error(`--phase must be one of ${TORQUE_PERFORMANCE_PHASES.join('|')}`)
  const run = Number(args.run)
  if (!Number.isInteger(run) || run < 1 || run > 3) throw new Error('--run must be 1, 2 or 3')
  const hold = args['hold-progress'] === undefined ? null : Number(args['hold-progress'])
  if (hold !== null && (!finite(hold) || hold < 0 || hold > 1)) throw new Error('--hold-progress must be a number in 0..1')
  const prewarm = Number(args['prewarm-seconds'])
  if (!finite(prewarm) || prewarm < 0) throw new Error('--prewarm-seconds must be a non-negative number')
  const out = checkedPath(args.out, EVIDENCE)
  const buildDir = args['build-dir'] ? checkedPath(args['build-dir'], SCRATCH) : null
  return { ...args, run, out, buildDir, 'hold-progress': hold, 'prewarm-seconds': prewarm, url: url.href, origin: url.origin }
}

/** Runs in the page. One linear canonical-progress sweep, used for the prewarm legs. */
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

/** Runs in the page. Display-refresh estimate from idle presented rAF intervals. */
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

/**
 * Runs in the page. Drives the measured input: a linear forward sweep of the phase window, a
 * linear reverse sweep back, then a hold with no further scroll input. Each frame writes only the
 * scroll position; narrative progress is sampled on a ~1 Hz clock so the sampler does not dominate
 * the measured frame. The trailing guard keeps the observation window at or above 60 s.
 */
export function pageMeasurementSweep(options) {
  const { start, end, hold, forwardMs, reverseMs, holdMs, guardMs, sampleEveryMs } = options
  return new Promise((resolve) => {
    const readProgress = () => {
      const narrative = window.__torqueNarrative?.snapshot?.()
      return { at: performance.now(), portion: stage, progress: narrative?.progress ?? null, beatId: narrative?.beatId ?? null, phase: narrative?.phase ?? null, hidden: document.hidden === true }
    }
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const toY = (progress) => Math.max(0, Math.min(1, progress)) * maxScroll
    const portions = {
      forward: { requestedMs: forwardMs, startedAt: null, endedAt: null, scrollYMin: null, scrollYMax: null, boundaries: [] },
      reverse: { requestedMs: reverseMs, startedAt: null, endedAt: null, scrollYMin: null, scrollYMax: null, boundaries: [] },
      transition: { startedAt: null, endedAt: null, settledAt: null, timeoutMs: 5000, boundaries: [] },
      hold: { requestedMs: holdMs, startedAt: null, endedAt: null, scrollYMin: null, scrollYMax: null, boundaries: [] },
    }
    const samples = []
    let stage = 'forward'
    let stageStartedAt = null
    let lastSampleAt = null
    let hiddenDuringSweep = false
    const startedAt = performance.now()
    const track = (name) => {
      const row = portions[name]
      const y = window.scrollY
      row.scrollYMin = row.scrollYMin === null ? y : Math.min(row.scrollYMin, y)
      row.scrollYMax = row.scrollYMax === null ? y : Math.max(row.scrollYMax, y)
    }
    const step = (now) => {
      if (stageStartedAt === null) { stageStartedAt = now; portions[stage].startedAt = now }
      if (document.hidden) hiddenDuringSweep = true
      let done = false
      if (stage === 'forward') {
        const u = Math.min(1, (now - stageStartedAt) / forwardMs)
        window.scrollTo(0, toY(start + (end - start) * u))
        track('forward')
        if (u >= 1) {
          portions.forward.endedAt = now
          portions.forward.boundaries.push(readProgress())
          stage = 'reverse'
          stageStartedAt = null
          lastSampleAt = null
        }
      } else if (stage === 'reverse') {
        const u = Math.min(1, (now - stageStartedAt) / reverseMs)
        window.scrollTo(0, toY(end - (end - start) * u))
        track('reverse')
        if (u >= 1) {
          portions.reverse.endedAt = now
          portions.reverse.boundaries.push(readProgress())
          window.scrollTo(0, toY(hold))
          stage = 'transition'
          stageStartedAt = now
          portions.transition.startedAt = now
          portions.transition.boundaries.push(readProgress())
          lastSampleAt = null
        }
      } else if (stage === 'transition') {
        const witness = readProgress()
        const atTarget = typeof witness.progress === 'number' && Number.isFinite(witness.progress) && Math.abs(witness.progress - hold) * maxScroll <= 0.5
        if (!atTarget) portions.transition.settledAt = null
        else if (portions.transition.settledAt === null) portions.transition.settledAt = now
        if (atTarget && now - portions.transition.settledAt >= 300) {
          portions.transition.endedAt = now
          portions.transition.boundaries.push(witness)
          stage = 'hold'
          stageStartedAt = now
          portions.hold.startedAt = now
          portions.hold.boundaries.push(readProgress())
          lastSampleAt = null
        } else if (now - stageStartedAt >= portions.transition.timeoutMs) {
          resolve({ ok: false, error: 'reverse-to-hold target did not settle', maxScroll, window: { start, end, hold }, portions, samples, hiddenDuringSweep })
          return
        }
      } else {
        track('hold')
        if (now - stageStartedAt >= holdMs + guardMs) done = true
      }
      if (lastSampleAt === null || now - lastSampleAt >= sampleEveryMs) { lastSampleAt = now; samples.push(readProgress()) }
      if (done) {
        portions.hold.endedAt = now
        portions.hold.boundaries.push(readProgress())
        samples.push(readProgress())
        resolve({ ok: true, driver: 'harness native scrollTo rAF sweep (window.scrollTo each frame, instant)', maxScroll, window: { start, end, hold }, elapsedMs: now - startedAt, portions, samples, hiddenDuringSweep })
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

function browserReportedOs(userAgent) {
  const ua = String(userAgent ?? '')
  const windows = /Windows NT ([\d.]+)/.exec(ua)
  if (windows) return `Windows NT ${windows[1]} (browser-reported)`
  if (/Mac OS X/.test(ua)) return 'macOS (browser-reported)'
  if (/Android/.test(ua)) return 'Android (browser-reported)'
  if (/Linux/.test(ua)) return 'Linux (browser-reported)'
  return 'unreported (browser user agent names no OS)'
}

// Charging is supporting evidence only; primary AC requires an explicit noninstrumented declaration.
const AC_DECLARATION = /^(ac|a\/c|ac power|ac adapter|ac supply|mains|mains power|line power|line-powered|wall power|wall socket)$/i
function resolvePower(declared, battery) {
  if (nonempty(declared)) {
    const label = declared.trim()
    if (AC_DECLARATION.test(label)) return { value: `AC (operator-declared: ${label})`, basis: 'operator declaration naming AC power; the declaration is not instrumented', ac: true }
    return { value: null, basis: `operator label ${JSON.stringify(label)} does not explicitly declare AC power`, ac: false }
  }
  if (battery?.charging === true) return { value: null, basis: 'navigator.getBattery reports charging as supporting evidence only; an explicit operator AC declaration is required', ac: false }
  if (battery?.charging === false) return { value: null, basis: 'navigator.getBattery reports battery discharge; AC power is not established', ac: false }
  return { value: null, basis: nonempty(battery?.reason) ? battery.reason : 'no battery or power observable in this browser context', ac: false }
}

function baseProvenance(args) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const branch = execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim()
  const sourceFiles = SOURCE_PATHS.map((file) => ({ file, sha256: sha256(readFileSync(path.join(ROOT, file))) }))
  let buildHash = null
  let buildManifest = null
  if (args.buildDir) {
    const manifestPath = path.join(args.buildDir, '.vite/manifest.json')
    if (existsSync(manifestPath)) {
      const bytes = readFileSync(manifestPath)
      buildHash = sha256(bytes)
      buildManifest = { path: manifestPath, bytes: bytes.length }
    }
  }
  return {
    workspace: ROOT, head, branch, launch: describeLaunch(), sourceFiles,
    sourceHash: sha256(sourceFiles.map((entry) => `${entry.file}:${entry.sha256}`).join('\n')),
    buildHash, buildManifest, buildDir: args.buildDir,
    verifierSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    observerSha256: sha256(readFileSync(OBSERVER_PATH)),
    node: process.version,
  }
}

const SERVED_ROLES = Object.freeze({
  html: 'served HTML document',
  entry: 'manifest-selected entry chunk',
  lazyScene: 'manifest-selected lazy scene chunk',
  asset: 'Default.glb asset',
})

/**
 * Served-identity targets. The HTML document and the GLB are fixed; the entry chunk and the lazy
 * torque scene chunk come from the build manifest so the hashed filenames are read from the build
 * rather than assumed. Pure: reads the manifest and returns the fetch plan.
 */
export function resolveServedTargets(buildDir) {
  const targets = [
    { role: 'html', pathname: PRIVATE_PATH, localRelative: 'torque-wrench/index.html', source: 'fixed' },
    { role: 'asset', pathname: '/models/Default.glb', localRelative: 'models/Default.glb', source: 'fixed' },
  ]
  if (!buildDir) return targets
  const manifestPath = path.join(buildDir, '.vite/manifest.json')
  if (!existsSync(manifestPath)) return targets
  let manifest = null
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch (error) { return targets }
  const entryKey = Object.keys(manifest).find((key) => manifest[key]?.isEntry === true && /(^|\/)torque-wrench\/index\.html$/.test(key))
  const entry = entryKey ? manifest[entryKey] : null
  if (entry?.file) targets.push({ role: 'entry', pathname: `/${entry.file}`, localRelative: entry.file, source: `manifest:${entryKey}` })
  const declared = [...(entry?.dynamicImports ?? [])].find((key) => /torque-wrench\/Scene\.tsx$/.test(key))
  const lazyKey = declared ?? Object.keys(manifest).find((key) => manifest[key]?.isDynamicEntry === true && /torque-wrench\/Scene\.tsx$/.test(key))
  const lazy = lazyKey ? manifest[lazyKey] : null
  if (lazy?.file) targets.push({ role: 'lazyScene', pathname: `/${lazy.file}`, localRelative: lazy.file, source: `manifest:${lazyKey}` })
  return targets
}

async function fetchServedIdentity(context, origin, buildDir) {
  const entries = []
  for (const target of resolveServedTargets(buildDir)) {
    const entry = { role: target.role, roleLabel: SERVED_ROLES[target.role] ?? target.role, pathname: target.pathname, source: target.source, status: null, bytes: null, sha256: null, localFile: target.localRelative ?? null, localFilePresent: false, localSha256: null, match: null }
    try {
      const response = await context.request.get(new URL(target.pathname, origin).href, { timeout: 15000 })
      const body = await response.body()
      entry.status = response.status()
      entry.bytes = body.length
      entry.sha256 = sha256(body)
    } catch (error) { entry.error = String(error) }
    if (buildDir && target.localRelative) {
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

/**
 * Pure report assembly. Everything measured arrives as data; the contract validator decides the
 * verdict and anything this harness cannot observe is omitted so it stays UNVERIFIED.
 */
export function composePerformanceReport(input) {
  const { config, provenance, page, measurement, sweep, served, errors } = input
  const sample = measurement ?? {}
  const summary = summarizeFrameSamples(sample.frameSamples, TAIL_THRESHOLD_MS)
  const memory = sample.memory ?? {}
  const draw = sample.draw ?? {}
  const environment = page?.observerEnvironment ?? {}
  const snapshot = page?.observerSnapshot ?? {}
  const hardware = deriveHardwareGl(environment.webglRenderer)
  const buffer = Array.isArray(environment.drawingBuffer) ? environment.drawingBuffer : null
  const viewport = page?.actualViewport ?? null
  const phaseInfo = page?.phaseWindow ?? null
  const requestedTier = config.tier
  const power = resolvePower(config.power, environment.battery)
  const device = nonempty(config.device) ? `${config.device} (operator-declared)` : `unreported device model (browser platform: ${environment.platform ?? 'unknown'})`
  const os = nonempty(config.os) ? `${config.os} (operator-declared)` : browserReportedOs(environment.userAgent)
  const refreshIntervals = (page?.refresh?.intervals ?? []).filter((value) => finite(value) && value > 0)
  const refreshMedian = percentile(refreshIntervals, 0.5)
  // Every narrative witness is retained: a missing or non-finite sample is a recorded failure, never
  // a silently dropped row, so a phase window can never be "confined" by omission.
  const progressRows = Array.isArray(sweep?.samples) ? sweep.samples : []
  const progressWitnesses = progressRows.map((row, index) => ({
    index,
    at: finite(Number(row?.at)) ? Number(row.at) : null,
    beatId: row?.beatId ?? null,
    phase: row?.phase ?? null,
    progress: finite(row?.progress) ? row.progress : null,
  }))
  const finiteWitnesses = progressWitnesses.filter((row) => finite(row.progress))
  const missingWitnesses = progressWitnesses.filter((row) => !finite(row.progress))
  const progressValues = finiteWitnesses.map((row) => row.progress)
  const outOfWindowWitnesses = phaseInfo?.ok
    ? finiteWitnesses.filter((row) => row.progress < phaseInfo.start - PHASE_WINDOW_TOLERANCE || row.progress > phaseInfo.end + PHASE_WINDOW_TOLERANCE)
    : []
  const confined = Boolean(phaseInfo?.ok) && progressWitnesses.length > 0 && missingWitnesses.length === 0 && outOfWindowWitnesses.length === 0
  const holdBoundaries = sweep?.portions?.hold?.boundaries ?? []
  const holdProgressValue = (row) => finite(row?.progress) ? row.progress : null
  const holdEntry = holdBoundaries.length ? holdProgressValue(holdBoundaries[0]) : null
  const holdExit = holdBoundaries.length ? holdProgressValue(holdBoundaries[holdBoundaries.length - 1]) : null
  const holdInsideWindow = (value) => finite(value) && Boolean(phaseInfo?.ok) && value >= phaseInfo.start - PHASE_WINDOW_TOLERANCE && value <= phaseInfo.end + PHASE_WINDOW_TOLERANCE
  const holdPortion = sweep?.portions?.hold ?? {}
  const holdTarget = sweep?.window?.hold
  const holdTolerance = finite(sweep?.maxScroll) && sweep.maxScroll > 0 ? 0.5 / sweep.maxScroll : null
  const holdSamples = progressRows.filter((row) => row?.portion === 'hold' || (finite(row?.at) && finite(holdPortion.startedAt) && finite(holdPortion.endedAt) && row.at >= holdPortion.startedAt && row.at <= holdPortion.endedAt))
  const holdWitnesses = [...holdBoundaries, ...holdSamples]
  const invalidHoldWitnesses = holdWitnesses.filter((row) => !holdInsideWindow(row?.progress) || !finite(holdTarget) || !finite(holdTolerance) || Math.abs(row.progress - holdTarget) > holdTolerance)
  const transition = sweep?.portions?.transition
  const transitionValid = finite(transition?.startedAt) && finite(transition?.settledAt) && finite(transition?.endedAt)
    && transition.startedAt <= transition.settledAt && transition.endedAt - transition.settledAt >= 300
    && transition.endedAt === holdPortion.startedAt
  const holdWitnessesValid = holdBoundaries.length >= 2 && holdSamples.length > 0 && invalidHoldWitnesses.length === 0
    && finite(holdPortion.startedAt) && finite(holdPortion.endedAt) && holdPortion.endedAt - holdPortion.startedAt >= HOLD_SECONDS * 1000

  const frameRows = Array.isArray(sample.frameSamples) ? sample.frameSamples : []
  const invalidSentinels = frameRows.filter((row, index) => !Number.isInteger(row?.sequence) || row.sequence !== index + 1
    || !finite(row?.timestamp) || (index > 0 && row.timestamp <= frameRows[index - 1]?.timestamp))
  const inactiveFrames = frameRows.slice(1).filter((row) => !finite(row?.liveCalls) || row.liveCalls <= 0)

  // The device pixel ratio is reported only when the drawing buffer scales both viewport dimensions
  // by the same ratio, and pixels always use both buffer dimensions.
  const dprWidthRatio = buffer && finite(viewport?.width) && viewport.width > 0 ? buffer[0] / viewport.width : null
  const dprHeightRatio = buffer && finite(viewport?.height) && viewport.height > 0 ? buffer[1] / viewport.height : null
  const dprLengthDelta = finite(dprWidthRatio) && finite(dprHeightRatio) ? round(Math.abs(dprWidthRatio - dprHeightRatio), 6) : null
  const dprLengthsAgree = dprLengthDelta !== null && dprLengthDelta <= DPR_RATIO_TOLERANCE
  const dpr = dprLengthsAgree ? round((dprWidthRatio + dprHeightRatio) / 2, 4) : null
  const pixels = buffer ? buffer[0] * buffer[1] : null
  const summaryTextures = memory.textureAndRenderbufferBytes

  const report = {
    schema: 'JG-038-g8-performance-sample-v1',
    runId: randomUUID(),
    viewportCase: config.viewport,
    run: config.run,
    requestedTier,
    effectiveTier: page?.tierEnd ?? page?.tierStart ?? null,
    qualityLock: false,
    phase: config.phase,
    phaseInput: { forwardSeconds: FORWARD_SECONDS, reverseSeconds: REVERSE_SECONDS, holdSeconds: HOLD_SECONDS },
    url: config.url,
    ready: page?.readiness?.ready === true,
    prewarmComplete: page?.prewarm?.complete === true,
    captureActive: false,
    captures: 0,
    throttled: false,
    hardwareGL: hardware.hardwareGL,
    renderer: environment.webglRenderer ?? '',
    backend: `${(environment.contextTypes ?? []).join(',') || 'unreported-context'} / ${environment.webglVendor ?? 'vendor-unreported'}`,
    device,
    os,
    browser: `${provenance.browserVersion ?? 'unreported'} (${provenance.launch})`,
    sourceHash: provenance.sourceHash,
    assetHash: null,
    servedHash: null,
    buildHash: provenance.buildHash ?? null,
    inputScript: `harness native scrollTo rAF sweep confined to the ${config.phase} window; ${FORWARD_SECONDS}s forward, ${REVERSE_SECONDS}s reverse, ${HOLD_SECONDS}s hold at canonical progress ${sweep?.window?.hold ?? 'unknown'}`,
    observationSeconds: sample.observationSeconds,
    refreshHz: finite(refreshMedian) && refreshMedian > 0 ? round(1000 / refreshMedian, 3) : null,
    p50: summary.p50,
    p95: summary.p95,
    p99: summary.p99,
    tailPercent: summary.tailPercent,
    maximum: summary.maximum,
    presentedFrames: summary.presentedFrames,
    peakFrameCalls: summary.peakFrameCalls,
    peakFrameTriangles: summary.peakFrameTriangles,
    lineSegments: summary.peakFrameLineSegments,
    points: summary.peakFramePoints,
    geometryBufferBytes: memory.geometryBufferBytes,
    memoryMethod: memory.method ?? 'unavailable: no observer memory summary',
    allPassTotals: draw.allDrawPathsObserved === true,
    programCreationObserved: sample.programCreationObserved === true,
    newWarmPrograms: sample.newWarmPrograms,
    hardwareBasis: hardware.basis,
    power: power.value,
    powerBasis: power.basis,
    acPowerVerified: power.ac === true,
    dpr,
    dprMethod: 'narrative drawingBuffer / CSS viewport size from the live private context; the width and height ratios must agree before a device pixel ratio is reported, and it is never a requested or assumed value',
    dprWidthRatio: finite(dprWidthRatio) ? round(dprWidthRatio, 6) : null,
    dprHeightRatio: finite(dprHeightRatio) ? round(dprHeightRatio, 6) : null,
    dprRatioDelta: dprLengthDelta,
    dprReportedByBrowser: finite(viewport?.dpr) ? viewport.dpr : null,
    pixels: finite(pixels) ? pixels : null,
  }

  if (memory.estimateComplete === true && finite(summaryTextures)) report.residentTextureTargetMiB = round(summaryTextures / 1048576, 3)

  const servedEntries = Array.isArray(served) ? served : []
  const servedDocument = servedEntries.find((entry) => entry.role === 'html') ?? null
  const servedAsset = servedEntries.find((entry) => entry.role === 'asset') ?? null
  if (servedDocument?.sha256) report.servedHash = servedDocument.sha256
  if (servedAsset?.sha256) report.assetHash = servedAsset.sha256

  const unverifiedObservables = []
  if (!nonempty(report.power)) unverifiedObservables.push({ observable: 'power', reason: power.basis })
  if (report.acPowerVerified !== true) unverifiedObservables.push({ observable: 'acPowerPrimary', reason: power.basis })
  if (!nonempty(report.buildHash)) unverifiedObservables.push({ observable: 'buildHash', reason: 'no --build-dir supplied: served identity proves stable served bytes, not their correspondence to local build files' })
  if (!config.buildDir) unverifiedObservables.push({ observable: 'servedLocalBinding', reason: 'no --build-dir supplied: the HTML document, the manifest entry chunk, the lazy scene chunk and Default.glb cannot be bound to local build files' })
  if (memory.physicalResidencyObserved !== true) unverifiedObservables.push({ observable: 'physicalMemoryResidency', reason: 'WebGL API instrumentation estimates texture/renderbuffer storage; driver residency is not observable' })
  if (!finite(report.residentTextureTargetMiB)) unverifiedObservables.push({ observable: 'residentTextureTargetMiB', reason: `texture/target byte estimate incomplete (unknownFormatEvents=${memory.unknownFormatEvents ?? 'unreported'}, unsupportedAllocationEvents=${memory.unsupportedAllocationEvents ?? 'unreported'})` })
  if (!finite(report.instrumentationOverheadMs)) unverifiedObservables.push({ observable: 'instrumentationOverheadMs', reason: snapshot.instrumentationOverhead?.reason ?? 'instrumentation overhead was not observable' })
  unverifiedObservables.push({ observable: 'startupCacheAndShaderBudgets', reason: 'startup budgets require five fresh-context trials per cache condition; this producer covers the measured phase window only' })
  unverifiedObservables.push({ observable: 'gpuExecutionTime', reason: 'rAF intervals are presented-frame timing, not GPU execution time' })
  unverifiedObservables.push({ observable: 'physicalMobile', reason: 'viewport N is emulated on the reference laptop; no physical narrow device is named' })

  report.pageMode = page?.pageMode ?? null
  report.measurementEnvironment = {
    contextCount: environment.contextCount ?? 0,
    contexts: environment.contexts ?? [],
    narrativeContextId: environment.narrativeContextId ?? null,
    narrativeContextAvailable: environment.narrativeContextAvailable === true,
    narrativeContextBasis: environment.narrativeContextBasis ?? null,
    contextAttributes: environment.contextAttributes ?? null,
    drawingBuffer: buffer,
    viewport,
    deviceMemoryGB: environment.deviceMemoryGB ?? null,
    hardwareConcurrency: environment.hardwareConcurrency ?? null,
    battery: environment.battery ?? null,
    visibilityChanges: environment.visibilityChanges ?? [],
  }
  report.memoryEstimate = {
    textureAndRenderbufferBytes: finite(memory.textureAndRenderbufferBytes) ? memory.textureAndRenderbufferBytes : null,
    geometryBufferBytes: finite(memory.geometryBufferBytes) ? memory.geometryBufferBytes : null,
    textureCount: memory.textureCount ?? null,
    renderbufferCount: memory.renderbufferCount ?? null,
    bufferCount: memory.bufferCount ?? null,
    framebufferCount: memory.framebufferCount ?? null,
    unknownFormatEvents: memory.unknownFormatEvents ?? null,
    unsupportedAllocationEvents: memory.unsupportedAllocationEvents ?? null,
    unsupportedAllocationPaths: memory.unsupportedAllocationPaths ?? [],
    estimateComplete: memory.estimateComplete === true,
    physicalResidencyObserved: memory.physicalResidencyObserved === true,
    method: memory.method ?? null,
  }
  report.refresh = {
    observedHz: report.refreshHz,
    sampleCount: refreshIntervals.length,
    medianIntervalMs: finite(refreshMedian) ? round(refreshMedian, 3) : null,
    p95IntervalMs: finite(percentile(refreshIntervals, 0.95)) ? round(percentile(refreshIntervals, 0.95), 3) : null,
    method: 'idle presented rAF intervals before the measured window; 1/median is an estimate, not a display-mode read',
  }
  report.readiness = page?.readiness ?? { ready: false, reason: 'not attempted' }
  report.prewarm = page?.prewarm ?? { complete: false, reason: 'not attempted' }
  report.input = {
    driver: sweep?.driver ?? 'not run',
    phaseWindow: phaseInfo?.ok ? { phase: phaseInfo.phase, start: phaseInfo.start, end: phaseInfo.end, beats: phaseInfo.beats } : { error: phaseInfo?.error ?? 'phase window unavailable' },
    portions: sweep?.portions ?? null,
    progressSampleCount: progressWitnesses.length,
    progressWitnessMissing: missingWitnesses.length,
    hiddenDuringSweep: sweep?.hiddenDuringSweep === true,
    note: 'input is a harness native-scroll fixture (window.scrollTo per frame); it is not CDP wheel or touch input',
  }
  report.phaseConfinement = {
    confined,
    windowStart: phaseInfo?.start ?? null,
    windowEnd: phaseInfo?.end ?? null,
    tolerance: PHASE_WINDOW_TOLERANCE,
    observedMin: progressValues.length ? round(Math.min(...progressValues), 6) : null,
    observedMax: progressValues.length ? round(Math.max(...progressValues), 6) : null,
    sampleCount: progressWitnesses.length,
    missingWitnessCount: missingWitnesses.length,
    outOfWindowCount: outOfWindowWitnesses.length,
    basis: 'canonical progress from __torqueNarrative.snapshot(), sampled about once per second inside the measured window; every witness is retained and a missing witness fails the gate',
  }
  report.hold = {
    targetProgress: finite(holdTarget) ? holdTarget : null,
    targetTolerance: holdTolerance,
    sampleCount: holdSamples.length,
    invalidWitnessCount: invalidHoldWitnesses.length,
    transition,
    transitionValid,
    entryProgress: finite(holdEntry) ? round(holdEntry, 6) : null,
    exitProgress: finite(holdExit) ? round(holdExit, 6) : null,
    progressDrift: finite(holdEntry) && finite(holdExit) ? round(Math.abs(holdExit - holdEntry), 6) : null,
    boundaryCount: holdBoundaries.length,
    witnessesValid: holdWitnessesValid,
    tolerance: holdTolerance,
    note: 'every hold witness must remain within 0.5 CSS pixels of the fixed target; the 20s hold starts after a separate 300ms target settle',
  }
  report.budgets = {
    requestedTier: TORQUE_BUDGETS[requestedTier] ?? null,
    phase: TORQUE_PHASE_BUDGETS[config.phase]?.[requestedTier] ?? null,
    phaseBudgetFields: ['peakFrameCalls', 'peakFrameTriangles', 'residentTextureTargetMiB'],
  }
  report.servedIdentity = servedEntries
  report.observerSnapshot = {
    installedAt: snapshot.installedAt ?? null,
    drawCallsTotal: snapshot.drawCallsTotal ?? null,
    unsupportedDrawCalls: snapshot.unsupportedDrawCalls ?? null,
    drawPaths: snapshot.drawPaths ?? null,
    unsupportedAllocationEvents: snapshot.unsupportedAllocationEvents ?? null,
    instrumentationOverhead: snapshot.instrumentationOverhead ?? null,
  }
  report.programEvents = {
    count: sample.programEvents?.length ?? 0,
    retention: sample.programEventRetention ?? { truncated: null, countsAreLowerBounds: true },
    recent: (sample.programEvents ?? []).slice(0, 32),
    identityMethod: 'program object sequence plus attached shader source hashes at create/attach/link; deletes stay in event identity and are never netted out',
  }
  report.draw = {
    totalObservedCalls: draw.totalObservedCalls ?? null,
    unsupportedDrawCalls: draw.unsupportedDrawCalls ?? null,
    multiDrawCalls: draw.multiDrawCalls ?? null,
    wrappedMethods: draw.wrappedMethods ?? [],
    extensionDrawPaths: draw.extensionDrawPaths ?? [],
    nonDrawMethods: draw.nonDrawMethods ?? [],
    unsupportedMethods: draw.unsupportedMethods ?? [],
    allDrawPathsObserved: draw.allDrawPathsObserved === true,
  }
  report.frames = sample.frameSamples ?? []
  report.sentinelIntegrity = { sampleCount: frameRows.length, invalidSequenceOrTimestampCount: invalidSentinels.length, inactivePostboundaryCount: inactiveFrames.length, initialBoundaryExcluded: true }
  report.textures = memory.textures ?? []
  report.renderTargets = { renderbuffers: memory.renderbuffers ?? [], buffers: memory.buffers ?? [], framebuffers: memory.framebuffers ?? [] }
  report.tierIdentity = {
    requested: requestedTier,
    observedStart: page?.tierStart ?? null,
    observedEnd: page?.tierEnd ?? null,
    sheetBakeTier: page?.sheetTier ?? null,
    note: 'the tier ladder is one-way, so a start/end pair that matches the request excludes a mid-run step down',
  }
  report.provenance = provenance
  report.errors = errors ?? []
  report.unverifiedObservables = unverifiedObservables
  report.limitations = [
    'No driver memory residency, GPU execution time or instrumentation overhead is claimed.',
    'Input is a harness native-scroll fixture; the contract repeatable wheel and touch rosters are separate.',
    'Startup cache and shader budgets and the full 60-report roster are out of scope for this single sample.',
    'Viewport N is emulated on the reference laptop; physical mobile performance remains unverified.',
  ]

  const validation = validateTorquePerformanceSample(report)
  if (report.acPowerVerified !== true) validation.unverified.push('Primary AC power requires an explicit noninstrumented operator declaration; battery charging is supporting evidence only')
  const extraGateFailures = []
  if (sweep?.ok === false) extraGateFailures.push(`measurement sweep failed: ${sweep.error ?? 'unknown sweep error'}`)
  if (!transitionValid) extraGateFailures.push('reverse-to-hold transition did not settle separately before the 20s hold')
  if (frameRows.length < 2 || invalidSentinels.length > 0) extraGateFailures.push('sentinel sequence/timestamp missing or non-monotonic')
  if (inactiveFrames.length > 0) extraGateFailures.push(`${inactiveFrames.length} postboundary sentinel sample(s) have no live narrative draw calls`)
  if (!Boolean(phaseInfo?.ok)) extraGateFailures.push(`phase window unavailable: ${phaseInfo?.error ?? 'no window resolved'}`)
  if (progressWitnesses.length === 0) extraGateFailures.push('no narrative progress witnesses were recorded inside the measured window')
  if (missingWitnesses.length > 0) extraGateFailures.push(`progress witness missing or non-finite for ${missingWitnesses.length} of ${progressWitnesses.length} samples; a missing witness is never filtered out`)
  if (outOfWindowWitnesses.length > 0) extraGateFailures.push(`${outOfWindowWitnesses.length} progress witness(es) left the ${config.phase} window: ${JSON.stringify(outOfWindowWitnesses.slice(0, 4).map((row) => row.progress))}`)
  if (!holdWitnessesValid) extraGateFailures.push(`hold progress witness invalid: entry=${JSON.stringify(holdEntry)} exit=${JSON.stringify(holdExit)} over ${holdBoundaries.length} boundaries`)
  if (environment.narrativeContextAvailable !== true) extraGateFailures.push(`no live narrative WebGL context was selected: ${environment.narrativeContextBasis ?? 'no selection basis'} (contextCount=${environment.contextCount ?? 0})`)
  if (!buffer) extraGateFailures.push('no narrative drawing buffer was observed for the live context')
  else if (!dprLengthsAgree) extraGateFailures.push(`drawing buffer ${JSON.stringify(buffer)} does not scale both viewport dimensions by one ratio: width ${dprWidthRatio} vs height ${dprHeightRatio}`)
  for (const entry of servedEntries) if (entry.status !== 200) extraGateFailures.push(`served ${entry.role} ${entry.pathname} returned status ${entry.status ?? 'none'}`)
  if (config.buildDir) {
    for (const role of ['html', 'entry', 'lazyScene', 'asset']) {
      const entry = servedEntries.find((row) => row.role === role)
      if (!entry) { extraGateFailures.push(`served identity target ${role} was not resolved from the build directory`); continue }
      if (!entry.localFilePresent) extraGateFailures.push(`served identity ${role} local file missing: ${entry.localFile ?? 'unresolved'}`)
      else if (entry.match !== true) extraGateFailures.push(`served identity ${role} mismatch: served ${entry.sha256 ?? 'none'} vs local ${entry.localSha256 ?? 'none'}`)
    }
  }
  if ((errors ?? []).length > 0) extraGateFailures.push(`${errors.length} page error(s) recorded during the run`)
  if (sample.hiddenDuringMeasurement === true || sweep?.hiddenDuringSweep === true) extraGateFailures.push('the tab was hidden during the measured window')
  if (page?.tierStart && page?.tierEnd && page.tierStart !== page.tierEnd) extraGateFailures.push(`observed tier changed during measurement: ${page.tierStart} -> ${page.tierEnd}`)
  if (nonempty(page?.sheetTier) && page.sheetTier !== requestedTier) extraGateFailures.push(`sheet bake tier ${page.sheetTier} differs from requested ${requestedTier}`)
  if (page?.pageMode !== 'live') extraGateFailures.push(`page mode ${page?.pageMode ?? 'absent'} is not live`)
  report.contractValidation = validation
  report.extraGateFailures = extraGateFailures
  report.counts = { errors: validation.errors.length, unverified: validation.unverified.length, extraGateFailures: extraGateFailures.length }
  report.status = validation.errors.length || extraGateFailures.length ? 'FAIL' : validation.unverified.length ? 'UNVERIFIED' : 'PASS'
  return report
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(HELP); return }
  let args
  try { args = parseArgs(process.argv.slice(2)) } catch (error) { console.error(`${error.message}\n${HELP}`); process.exitCode = 2; return }

  const errors = []
  const page = {}
  const served = []
  let browser = null
  let measurement = null
  let sweep = null
  let provenance = null
  let exitCode = 11
  try {
    provenance = baseProvenance(args)
    if (provenance.branch !== 'torque-wrench/rebuild') throw new Error(`wrong branch ${provenance.branch}; expected torque-wrench/rebuild`)
    const { chromium } = await import('playwright')
    provenance.playwrightVersion = createRequire(import.meta.url)('playwright/package.json').version
    const launch = launchConfig()
    provenance.launchConfig = launch
    browser = await chromium.launch(launch)
    provenance.browserVersion = browser.version()
    const context = await browser.newContext({ ...VIEWPORTS[args.viewport], serviceWorkers: 'block', reducedMotion: 'no-preference' })
    const tab = await context.newPage()
    tab.on('pageerror', (error) => errors.push(`pageerror: ${String(error)}`))
    tab.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
    tab.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`))
    await context.addInitScript(torquePerformanceObserverInit)
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
    page.ready = ready
    page.readinessSpanMs = Date.now() - navigationStartedAt
    page.readiness = {
      ready,
      spanMs: page.readinessSpanMs,
      timeoutMs: READINESS_TIMEOUT_MS,
      requirement: '__torqueWorld.ready and sheet.baked inside the readiness timeout',
      startupBudgetSeconds: 10,
      startupBudgetEvaluated: false,
      reason: 'startup budgets require five fresh-context trials per valid/stale/missing cache condition',
    }
    page.actualViewport = await tab.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio }))
    if (ready) {
      page.refresh = await tab.evaluate(pageRefreshProbe, 1200)
      const beats = await tab.evaluate(() => window.__torqueNarrative?.beats ?? null)
      const windowInfo = phaseWindow(beats, args.phase)
      page.phaseWindow = windowInfo
      if (windowInfo.ok) {
        const holdProgress = args['hold-progress'] === null ? (windowInfo.start + windowInfo.end) / 2 : args['hold-progress']
        if (holdProgress < windowInfo.start || holdProgress > windowInfo.end) throw new Error(`--hold-progress ${holdProgress} is outside the ${args.phase} window ${windowInfo.start}..${windowInfo.end}`)
        await tab.evaluate(pageLinearSweep, { from: 0, to: 1, durationMs: args['prewarm-seconds'] * 1000 })
        await tab.evaluate(pageLinearSweep, { from: 1, to: 0, durationMs: args['prewarm-seconds'] * 1000 })
        await tab.waitForTimeout(PREWARM_SETTLE_MS)
        page.prewarm = {
          complete: true,
          directions: ['forward', 'reverse'],
          secondsPerDirection: args['prewarm-seconds'],
          settleMs: PREWARM_SETTLE_MS,
          order: 'readiness wait, then forward/reverse prewarm, then settle; the settle is the contract 5 s idle gap',
        }
        const before = await tab.evaluate(() => { const world = window.__torqueWorld?.snapshot?.(); return { tier: world?.mechanical?.tier ?? null, sheetTier: world?.opening?.tier ?? null } })
        page.tierStart = before.tier
        page.sheetTier = before.sheetTier
        // The prewarm ends at zero; enter and settle the measured phase before starting its clock.
        await tab.evaluate(start => scrollTo(0, start * (document.documentElement.scrollHeight - innerHeight)), windowInfo.start)
        await tab.waitForFunction(start => {
          const progress = window.__torqueNarrative?.snapshot?.().progress
          const max = document.documentElement.scrollHeight - innerHeight
          return typeof progress === 'number' && Math.abs(progress - start) * max <= 0.5
        }, windowInfo.start, { timeout: 5000 })
        await tab.waitForTimeout(300)
        const measurementStart = await tab.evaluate(() => window.__torquePerformanceObserver.beginMeasurement())
        if (!measurementStart?.ok) throw new Error('Observer measurement did not start: ' + JSON.stringify(measurementStart))
        await tab.evaluate(pageMeasurementSweep, {
          start: windowInfo.start, end: windowInfo.end, hold: holdProgress,
          forwardMs: FORWARD_SECONDS * 1000, reverseMs: REVERSE_SECONDS * 1000, holdMs: HOLD_SECONDS * 1000,
          guardMs: GUARD_MS, sampleEveryMs: 1000,
        }).then((trace) => { sweep = trace })
        measurement = await tab.evaluate(() => window.__torquePerformanceObserver.finishMeasurement())
        const after = await tab.evaluate(() => { const world = window.__torqueWorld?.snapshot?.(); return { tier: world?.mechanical?.tier ?? null, sheetTier: world?.opening?.tier ?? null } })
        page.tierEnd = after.tier
        page.sheetTier = after.sheetTier ?? page.sheetTier
        page.pageMode = await tab.evaluate(() => document.querySelector('.torque-page')?.dataset.torqueMode ?? null)
        const snapshot = await tab.evaluate(() => window.__torquePerformanceObserver.snapshot())
        page.observerSnapshot = snapshot
        page.observerEnvironment = snapshot.environment
        served.push(...await fetchServedIdentity(context, args.origin, args.buildDir))
      } else {
        errors.push(`phase window unavailable: ${windowInfo.error}`)
        page.pageMode = await tab.evaluate(() => document.querySelector('.torque-page')?.dataset.torqueMode ?? null)
        const snapshot = await tab.evaluate(() => window.__torquePerformanceObserver.snapshot())
        page.observerSnapshot = snapshot
        page.observerEnvironment = snapshot.environment
        served.push(...await fetchServedIdentity(context, args.origin, args.buildDir))
      }
    } else {
      page.pageMode = await tab.evaluate(() => document.querySelector('.torque-page')?.dataset.torqueMode ?? null).catch(() => null)
      const snapshot = await tab.evaluate(() => window.__torquePerformanceObserver.snapshot()).catch(() => null)
      if (snapshot) { page.observerSnapshot = snapshot; page.observerEnvironment = snapshot.environment }
      served.push(...await fetchServedIdentity(context, args.origin, args.buildDir))
    }
    await context.close()
  } catch (error) {
    errors.push(`environment: ${String(error?.stack ?? error)}`)
  } finally {
    if (browser) await browser.close().catch((error) => errors.push(`browser close: ${String(error)}`))
  }

  const config = { ...args, url: args.url }
  const report = composePerformanceReport({ config, provenance: provenance ?? { workspace: ROOT }, page, measurement, sweep, served, errors })
  if (!provenance || !page.readiness) {
    report.status = 'BLOCKED'
    report.blockedReason = provenance
      ? 'no readiness observation: the browser flow never reached the private page'
      : 'provenance unavailable'
  }
  report.finishedAt = new Date().toISOString()
  exitCode = report.status === 'PASS' ? 0 : report.status === 'UNVERIFIED' ? 10 : report.status === 'BLOCKED' ? 11 : 1
  try {
    mkdirSync(args.out, { recursive: true })
    const stamp = report.finishedAt.replace(/[:.]/g, '-')
    const output = path.join(args.out, `performance-contract-${args.viewport}-${args.tier}-run${args.run}-${args.phase}-${stamp}-${report.runId.slice(0, 8)}.json`)
    writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
    report.reportPath = output
    console.log(`${report.status}: errors=${report.counts?.errors ?? 0} unverified=${report.counts?.unverified ?? 0} extraGateFailures=${report.counts?.extraGateFailures ?? 0}`)
    console.log(`report=${output}`)
    if (report.contractValidation?.errors?.length) console.log(`contract errors: ${JSON.stringify(report.contractValidation.errors)}`)
    if (report.contractValidation?.unverified?.length) console.log(`contract unverified: ${JSON.stringify(report.contractValidation.unverified)}`)
    if (report.extraGateFailures?.length) console.log(`extra gate failures: ${JSON.stringify(report.extraGateFailures)}`)
    if (report.errors?.length) console.log(`page errors: ${JSON.stringify(report.errors.slice(0, 8))}`)
  } catch (error) { console.error(`report write failed: ${String(error)}`); exitCode = 12 }
  process.exitCode = exitCode
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()

