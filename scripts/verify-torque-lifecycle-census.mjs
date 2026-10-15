// JG-038 dev-only lifecycle/React commit census. Parent-owned runtime: no build, server, browser,
// or GPU work happens merely by reading this file. Reports are fresh, path-guarded, and never overwrite.
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const HARNESS_PATH = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const EVIDENCE_DIR = resolve(REPO_ROOT, 'project/work/evidence/torque-wrench-rebuild/08-stage4-opening-recovery')

const USAGE = [
  'JG-038 dev-only lifecycle and React commit census',
  '',
  'usage:',
  '  node scripts/verify-torque-lifecycle-census.mjs --help',
  '  node scripts/verify-torque-lifecycle-census.mjs --url=http://localhost:<port>/lifecycle-census.html [options]',
  '',
  'options:',
  '  --url=...                 Vite dev-server URL for lifecycle-census.html (required for runtime).',
  '  --out=...                 Fresh JSON path inside the 08 evidence directory (default is unique UTC).',
  '  --tag=...                 Safe report tag (default D).',
  '  --ready-timeout-ms=...    Default 90000.',
  '  --bake-timeout-ms=...     Default 120000.',
  '  --frames-timeout-ms=...   Default 60000.',
  '  --help                    Show this text.',
  '',
  'runtime contract:',
  '  Parent starts one fresh Vite dev server and schedules the only browser job.',
  '  Native wheel input only; no store setters, visibility overrides, playback clocks, or synthetic commits.',
  '  Exit 0 when no check FAILs; UNVERIFIED does not fail. Exit 1 on FAIL/runtime exception; 2 on usage/guard error.',
].join('\n')

function parseArgs(argv) {
  const args = { url: null, out: null, tag: 'D', help: false, readyTimeoutMs: 90000, bakeTimeoutMs: 120000, framesTimeoutMs: 60000 }
  for (const raw of argv) {
    if (raw === '--help') { args.help = true; continue }
    const match = /^--([a-z-]+)=(.*)$/i.exec(raw)
    if (!match) throw new Error('unrecognized argument: ' + raw)
    const key = match[1]
    const value = match[2]
    if (key === 'url') args.url = value
    else if (key === 'out') args.out = value
    else if (key === 'tag') args.tag = value
    else if (key === 'ready-timeout-ms') args.readyTimeoutMs = Number(value)
    else if (key === 'bake-timeout-ms') args.bakeTimeoutMs = Number(value)
    else if (key === 'frames-timeout-ms') args.framesTimeoutMs = Number(value)
    else throw new Error('unknown flag --' + key)
  }
  if (!args.help) {
    if (!args.url) throw new Error('--url is required')
    parseCensusUrl(args.url)
    if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/.test(args.tag)) throw new Error('--tag must be 1-32 ASCII letters, digits, or dashes')
    for (const key of ['readyTimeoutMs', 'bakeTimeoutMs', 'framesTimeoutMs']) {
      if (!Number.isFinite(args[key]) || args[key] <= 0) throw new Error('--' + key.replace(/([A-Z])/g, '-$1').toLowerCase() + ' must be positive')
    }
  }
  return args
}

function isInside(child, parent) {
  const rel = relative(parent.toLowerCase(), child.toLowerCase())
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

function defaultReportPath(tag) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').replace('Z', 'z').replace('.', '-')
  return resolve(EVIDENCE_DIR, 'lifecycle-census-' + stamp + '-' + tag + '.json')
}

function guardReportPath(pathname) {
  const absolute = resolve(pathname)
  if (!isInside(absolute, EVIDENCE_DIR)) throw new Error('report must be inside ' + EVIDENCE_DIR + ': ' + absolute)
  if (absolute.toLowerCase().replace(/\\/g, '/').includes('/.scratch/')) throw new Error('report must never be inside .scratch')
  if (!/\.json$/i.test(absolute)) throw new Error('report must be a .json file')
  if (existsSync(absolute)) throw new Error('refusing to overwrite existing report: ' + absolute)
  return absolute
}

const sha256File = (pathname) => createHash('sha256').update(readFileSync(pathname)).digest('hex')

function identity(pathname) {
  const absolute = resolve(REPO_ROOT, pathname)
  if (!existsSync(absolute)) return { path: pathname.replace(/\\/g, '/'), exists: false, sha256: null }
  return { path: pathname.replace(/\\/g, '/'), exists: true, sha256: sha256File(absolute) }
}

async function provenance() {
  const sourcePaths = [
    'lifecycle-census.html',
    'src/torque-wrench-lifecycle-census-main.tsx',
    'scripts/verify-torque-lifecycle-census.mjs',
    'src/torque-wrench-main.tsx',
    'src/scene/torque-wrench/TorqueWrenchPage.tsx',
    'src/scene/torque-wrench/Scene.tsx',
    'src/scene/torque-wrench/ScrollConductor.tsx',
    'src/scene/torque-wrench/conductorRuntime.ts',
    'src/scene/torque-wrench/createPrivateRenderer.ts',
    'src/scene/torque-wrench/RuntimeWorld.tsx',
    'src/scene/torque-wrench/PrivateSheet.tsx',
    'src/scene/torque-wrench/sceneLifecycle.ts',
    'src/scene/torque-wrench/resourceScope.ts',
    'src/state/torqueWrenchStore.ts',
    'package.json',
    'package-lock.json',
    'node_modules/react/package.json',
    'node_modules/react-dom/package.json',
    'node_modules/@react-three/fiber/package.json',
    'node_modules/react-dom/cjs/react-dom-client.development.js',
    'node_modules/@react-three/fiber/dist/events-156d8d12.esm.js',
    'node_modules/@types/react/index.d.ts',
  ]
  const packages = {}
  for (const name of ['react', 'react-dom', '@react-three/fiber', 'three', '@react-three/drei', 'playwright', 'vite']) {
    const packagePath = resolve(REPO_ROOT, 'node_modules', name, 'package.json')
    packages[name] = { version: JSON.parse(readFileSync(packagePath, 'utf8')).version, packageJsonSha256: sha256File(packagePath) }
  }
  let git = null
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, windowsHide: true })
    git = { head: stdout.trim() }
  } catch (error) {
    git = { head: null, error: String(error) }
  }
  return {
    harness: { path: 'scripts/verify-torque-lifecycle-census.mjs', sha256: sha256File(HARNESS_PATH) },
    sources: sourcePaths.map(identity),
    packages,
    git,
    runtimeNode: { version: process.version, execPath: process.execPath },
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
function isLoopbackHostname(hostname) {
  const unprefixed = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
  return unprefixed === 'localhost' || unprefixed === '127.0.0.1' || unprefixed === '::1'
}

function parseCensusUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('--url must be a valid http loopback dev URL ending in /lifecycle-census.html')
  }
  if (parsed.protocol !== 'http:') throw new Error('--url must use http')
  if (!isLoopbackHostname(parsed.hostname)) throw new Error('--url hostname must be localhost, 127.0.0.1, or ::1')
  if (parsed.username !== '' || parsed.password !== '') throw new Error('--url must not contain credentials')
  if (parsed.pathname !== '/lifecycle-census.html') throw new Error('--url path must be exactly /lifecycle-census.html')
  if (parsed.search !== '') throw new Error('--url must not contain a query string')
  if (parsed.hash !== '') throw new Error('--url must not contain a fragment')
  return parsed
}

const results = []
function record(id, status, detail) {
  results.push({ id, status, detail })
  console.log(status.padEnd(11) + ' ' + id + ' ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)))
}

async function servedIdentity(url) {
  const response = await fetch(url, { cache: 'no-store' })
  const body = Buffer.from(await response.arrayBuffer())
  return { url, status: response.status, bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') }
}

function expectedEffectSequence(census, name) {
  const events = census.effects.filter((entry) => entry.name === name).map((entry) => entry.phase)
  const expected = ['setup', 'cleanup', 'setup']
  if (events.length === 0) return { status: 'UNVERIFIED', events, reason: 'probe produced no effect events' }
  return events.length === expected.length && events.every((phase, index) => phase === expected[index])
    ? { status: 'PASS', events }
    : { status: 'FAIL', events, expected }
}

function conductorCheck(before, after) {
  const expected = {
    activeConductors: 1,
    mountCount: 2,
    disposeCount: 1,
    lenisInstances: 1,
    lenisScrollHandlers: 1,
    tickerCallbacks: 1,
    scrollTriggers: 1,
    domListeners: 3,
    storeLifecycleSubscriptions: 1,
    invalidProgressInputs: 0,
    startupFailureCount: 0,
    cleanupFailureCount: 0,
  }
  const mismatches = Object.entries(expected)
    .filter(([key, value]) => before?.[key] !== value || after?.[key] !== value)
    .map(({ 0: key, 1: value }) => key + ' expected ' + value + ', steady=' + before?.[key] + ', final=' + after?.[key])
  const lagModes = [before?.lagSmoothingMode, after?.lagSmoothingMode].filter(Boolean)
  if (lagModes.length && !lagModes.every((mode) => mode === 'configured-once' || mode === 'already-configured')) {
    mismatches.push('unexpected lagSmoothingMode: ' + lagModes.join(','))
  }
  return { expected, mismatches }
}

async function run(args, reportPath) {
  const { chromium } = await import('playwright')
  const { launchBrowser, launchConfig, describeLaunch } = await import('./lib/browser-launch.mjs')
  report.launch = { described: describeLaunch(), config: launchConfig(), playwrightVersion: require('playwright/package.json').version }
  const browser = await launchBrowser(chromium)
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  // Installed React/reconciler calls inject and onCommitFiberRoot when supportsFiber
  // is true. A passive dev-only sink observes actual commits without a browser
  // extension; preserve any existing hook. No fiber state or scheduling mutation.
  await context.addInitScript(() => {
    const existingHook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    window.__torqueCensusHookSource = existingHook ? 'existing-extension-hook' : 'harness-passive-fallback'
    if (existingHook) return
    let nextId = 0
    const renderers = new Map()
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, isDisabled: false, renderers,
      inject(renderer) { const id = ++nextId; renderers.set(id, renderer); return id },
      onCommitFiberRoot() {}, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    }
    window.__torqueCensusHarnessHook = true
  })
  const page = await context.newPage()
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(String(error)))
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })

  try {
    await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => Boolean(window.__torqueCensus), null, { timeout: 30000 })
    await page.waitForFunction(() => Boolean(window.__torqueWorld?.snapshot?.() && window.__torqueNarrative?.diagnostics), null, { timeout: args.readyTimeoutMs })
    await page.waitForFunction(() => window.__torqueWorld.snapshot().ready === true, null, { timeout: args.readyTimeoutMs })
    await page.waitForFunction(() => window.__torqueWorld.snapshot().sheet.baked === true, null, { timeout: args.bakeTimeoutMs })
    await page.waitForFunction(() => window.__torqueWorld.snapshot().frames > 8, null, { timeout: args.framesTimeoutMs })

    const startup = await page.evaluate(() => window.__torqueCensus.collect())
    await page.evaluate(() => window.__torqueCensus.setPhase('steady'))
    await sleep(1000)
    const steady = await page.evaluate(() => ({
      census: window.__torqueCensus.collect(),
      diagnostics: window.__torqueNarrative.diagnostics(),
      world: window.__torqueWorld.snapshot(),
      narrative: window.__torqueNarrative.snapshot(),
      scrollY: window.scrollY,
      scrollable: document.documentElement.scrollHeight - window.innerHeight,
    }))

    const scrollPlan = await page.evaluate((input) => {
      const beat = input.beats.find((entry) => input.progress >= entry.start && input.progress < entry.end) ?? input.beats.at(-1)
      const roomDown = beat ? Math.max(0, (beat.end - input.progress) * input.scrollable) : 0
      const roomUp = beat ? Math.max(0, (input.progress - beat.start) * input.scrollable) : 0
      const forward = roomDown >= roomUp || roomDown >= 60
      return { beatId: beat?.id ?? null, forward, room: Math.max(roomDown, roomUp) }
    }, { beats: await page.evaluate(() => window.__torqueNarrative.beats), progress: steady.narrative.progress, scrollable: steady.scrollable })

    let scroll = { status: 'UNVERIFIED', reason: 'less than 16px of same-beat room', plan: scrollPlan }
    if (scrollPlan.room >= 16) {
      await page.evaluate(() => window.__torqueCensus.setPhase('same-beat-scroll'))
      const beforeScroll = await page.evaluate(() => ({
        scrollY: window.scrollY,
        progress: window.__torqueNarrative.snapshot().progress,
        beatId: window.__torqueNarrative.snapshot().beatId,
      }))
      const direction = scrollPlan.forward ? 1 : -1
      const total = Math.min(scrollPlan.room - 8, 240)
      const stepCount = 6
      const delta = Math.max(4, Math.floor(total / stepCount))
      const wheelTimes = []
      for (let index = 0; index < stepCount; index += 1) {
        await page.mouse.wheel(0, direction * delta)
        wheelTimes.push(Date.now())
        await sleep(100)
      }
      await sleep(500)
      await page.evaluate(() => window.__torqueCensus.setPhase('post-scroll'))
      const observed = await page.evaluate(() => ({
        scrollY: window.scrollY,
        progress: window.__torqueNarrative.snapshot().progress,
        beatId: window.__torqueNarrative.snapshot().beatId,
      }))
      const scrollYDelta = observed.scrollY - beforeScroll.scrollY
      const progressDelta = observed.progress - beforeScroll.progress
      const sameBeat = beforeScroll.beatId === scrollPlan.beatId && observed.beatId === beforeScroll.beatId
      const nativeScrollMoved = Number.isFinite(observed.scrollY) && observed.scrollY !== 0
        && Number.isFinite(scrollYDelta) && Math.sign(scrollYDelta) === direction
      const canonicalProgressMoved = Number.isFinite(progressDelta) && Math.sign(progressDelta) === direction
      scroll = {
        status: sameBeat && nativeScrollMoved && canonicalProgressMoved ? 'PASS' : 'FAIL',
        plan: scrollPlan,
        direction,
        stepCount,
        delta,
        wheelTimes,
        before: beforeScroll,
        observed,
        movement: { scrollYDelta, progressDelta, nativeScrollMoved, canonicalProgressMoved, sameBeat },
      }
    }

    const final = await page.evaluate(() => ({
      census: window.__torqueCensus.collect(),
      diagnostics: window.__torqueNarrative.diagnostics(),
      world: window.__torqueWorld.snapshot(),
      narrative: window.__torqueNarrative.snapshot(),
      visibility: document.visibilityState,
      scrollY: window.scrollY,
    }))
    report.hookProvenance = final.census.devtoolsHook
    report.observations = { startup, steady, scroll, final, pageErrors, consoleErrors }

    for (const name of ['dom-before-page', 'dom-after-page']) {
      const outcome = expectedEffectSequence(final.census, name)
      record('strictmode-' + name, outcome.status, outcome)
    }

    const conductor = conductorCheck(steady.diagnostics, final.diagnostics)
    record('steady-one-conductor', conductor.mismatches.length ? 'FAIL' : 'PASS', conductor)
    const worldPass = steady.world.ready === true && final.world.ready === true
      && final.world.frames > steady.world.frames && final.world.hiddenFrames === 0 && final.world.sheet.baked === true
    record('steady-runtime-world', worldPass ? 'PASS' : 'FAIL', {
      steady: { ready: steady.world.ready, frames: steady.world.frames, hiddenFrames: steady.world.hiddenFrames, baked: steady.world.sheet.baked },
      final: { ready: final.world.ready, frames: final.world.frames, hiddenFrames: final.world.hiddenFrames, baked: final.world.sheet.baked },
    })

    const statusSequence = final.census.status.map((entry) => entry.status)
    const deduped = [...new Set(statusSequence)]
    const statusPass = deduped.join(',') === 'idle,loading,ready'
    record('scene-status-timeline', statusPass ? 'PASS' : 'FAIL', { statusSequence, deduped })

    const contextSummary = final.census.contextSummary
    const contextPass = contextSummary.connectedContextReturns === 1 && final.census.documentCanvasCount === 1
    record('connected-context-census', contextPass ? 'PASS' : 'FAIL', {
      contextSummary,
      documentCanvasCount: final.census.documentCanvasCount,
      note: 'detached capability calls are reported separately and never counted as connected construction',
    })
    record('context-disposal', 'UNVERIFIED', { reason: 'getContext pass-through calls cannot prove live disposal or current context liveness' })

    const domAvailable = final.census.domCommitSummary.total > 0
    const commitCensusComplete = !final.census.domCommitTruncated && !final.census.r3fCommitTruncated
    if (!domAvailable) record('direct-dom-profiler', 'UNVERIFIED', { reason: 'React Profiler emitted no callback' })
    else if (scroll.status !== 'PASS') record('same-beat-direct-dom-commits', scroll.status, { scroll, summary: final.census.domCommitSummary })
    else if (!commitCensusComplete) record('same-beat-direct-dom-commits', 'FAIL', {
      reason: 'commit census truncated before final observation',
      domCommitTruncated: final.census.domCommitTruncated,
      r3fCommitTruncated: final.census.r3fCommitTruncated,
      summary: final.census.domCommitSummary,
    })
    else record('same-beat-direct-dom-commits',
      final.census.domCommitSummary.sameBeatScroll === 0 ? 'PASS' : 'FAIL', {
        summary: final.census.domCommitSummary,
        observedCallbacks: final.census.domCommitSummary.total,
      })

    const r3fRegistered = final.census.rendererRegistrations.some((entry) => entry.packageName === '@react-three/fiber')
    const r3fInstrumentation = {
      injectWrapped: final.census.devtoolsHook.injectWrapped,
      onCommitFiberRootWrapped: final.census.devtoolsHook.onCommitFiberRootWrapped,
      r3fRegistered,
      observedCallbacks: final.census.r3fCommitSummary.total,
      domCommitTruncated: final.census.domCommitTruncated,
      r3fCommitTruncated: final.census.r3fCommitTruncated,
      hook: final.census.devtoolsHook,
    }
    if (!final.census.devtoolsHook.presentAtInstrumentation) {
      record('direct-r3f-commits', 'UNVERIFIED', { reason: final.census.devtoolsHook.missingReason, registrations: final.census.rendererRegistrations })
    } else if (!r3fInstrumentation.injectWrapped || !r3fInstrumentation.onCommitFiberRootWrapped || !r3fRegistered || r3fInstrumentation.observedCallbacks === 0) {
      const missing = []
      if (!r3fInstrumentation.injectWrapped) missing.push('inject was not wrapped')
      if (!r3fInstrumentation.onCommitFiberRootWrapped) missing.push('onCommitFiberRoot was not wrapped')
      if (!r3fRegistered) missing.push('@react-three/fiber was not registered')
      if (r3fInstrumentation.observedCallbacks === 0) missing.push('no R3F commit callback was observed')
      record('direct-r3f-commits', 'UNVERIFIED', {
        reason: 'R3F commit evidence is incomplete: ' + missing.join('; '),
        instrumentation: r3fInstrumentation,
        registrations: final.census.rendererRegistrations,
      })
    } else if (scroll.status !== 'PASS') {
      record('same-beat-direct-r3f-commits', scroll.status, { scroll, instrumentation: r3fInstrumentation })
    } else if (!commitCensusComplete) {
      record('same-beat-direct-r3f-commits', 'FAIL', {
        reason: 'commit census truncated before final observation',
        instrumentation: r3fInstrumentation,
        summary: final.census.r3fCommitSummary,
      })
    } else {
      record('same-beat-direct-r3f-commits',
        final.census.r3fCommitSummary.sameBeatScroll === 0 ? 'PASS' : 'FAIL', {
          summary: final.census.r3fCommitSummary,
          instrumentation: r3fInstrumentation,
        })
    }

    const relevantResources = final.census.resources.filter((entry) => /Default\.glb|\/draco\/|Scene\.tsx|RuntimeWorld|drawing|sheet/i.test(entry.name))
    const glb = relevantResources.filter((entry) => /Default\.glb$/i.test(entry.name))
    if (glb.length === 1) record('narrative-resource-request-census', 'PASS', { count: glb.length, relevantResources })
    else if (glb.length === 0) record('narrative-resource-request-census', 'UNVERIFIED', { reason: 'no Default.glb PerformanceResourceTiming entry', relevantResources })
    else record('narrative-resource-request-census', 'FAIL', { count: glb.length, relevantResources })
    record('resource-cache-and-import-invocation', 'UNVERIFIED', {
      reason: 'PerformanceResourceTiming has no reliable cache verdict and does not count dynamic-import invocations',
    })
    record('hmr-silence', 'UNVERIFIED', { reason: 'Vite HMR activity is not directly observable from the census boundary' })
    record('page-errors', pageErrors.length || consoleErrors.length ? 'FAIL' : 'PASS', { pageErrors, consoleErrors })
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

const args = parseArgs(process.argv.slice(2))
if (args.help) {
  console.log(USAGE)
  process.exit(0)
}

let reportPath
try {
  reportPath = guardReportPath(args.out ?? defaultReportPath(args.tag))
} catch (error) {
  console.error('output guard: ' + error.message)
  process.exit(2)
}

const report = {
  schema: 'jgun-jg038-lifecycle-census/1',
  startedAt: new Date().toISOString(),
  lane: 'JG-038 dev-only lifecycle + React commit census',
  url: args.url,
  timeouts: { ready: args.readyTimeoutMs, bake: args.bakeTimeoutMs, frames: args.framesTimeoutMs },
  boundaries: [
    'Dev document under StrictMode, using the same actual TorqueWrenchPage and document-local store API.',
    'No production source edits and no product spine changes.',
    'DOM Profiler and R3F custom renderer commits are reported as separate observables.',
    'The pre-React hook source is disclosed as an existing extension hook or the harness passive fallback.',
    'Missing or unwrapped DevTools hooks, cache state, import invocation count, HMR silence, and resource disposal remain UNVERIFIED.',
  ],
  provenance: await provenance(),
  served: null,
  launch: null,
  hookProvenance: null,
  observations: null,
  checks: results,
  summary: null,
}

try {
  report.served = await servedIdentity(args.url)
  if (report.served.status !== 200) throw new Error('census document HTTP ' + report.served.status)
  await run(args, reportPath)
} catch (error) {
  record('harness-exception', 'FAIL', String(error && error.stack ? error.stack : error))
} finally {
  report.completedAt = new Date().toISOString()
  report.summary = {
    pass: results.filter((entry) => entry.status === 'PASS').length,
    fail: results.filter((entry) => entry.status === 'FAIL').length,
    unverified: results.filter((entry) => entry.status === 'UNVERIFIED').length,
  }
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  try {
    writeFileSync(reportPath, JSON.stringify(report, null, 2), { flag: 'wx' })
  } catch (error) {
    console.error('refused report write: ' + String(error))
    process.exit(2)
  }
  const reportHash = sha256File(reportPath)
  console.log(JSON.stringify(report.summary))
  console.log('report: ' + reportPath + ' sha256 ' + reportHash)
  process.exit(report.summary.fail === 0 ? 0 : 1)
}
