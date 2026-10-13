// JG-038 Stage 2 - private /torque-wrench/ narrative timeline/conductor browser verifier.
// Owned file of the Stage 2 verification worker. No tests, build, server, or browser run has
// been executed from this authoring session; the parent schedules the bounded execution window.
//
// Usage:
//   node scripts/verify-torque-timeline.mjs --help
//   node scripts/verify-torque-timeline.mjs --url=http://localhost:<port>/torque-wrench/ [--out=<report.json>] [--only=<id,id>] [--viewport=D|N] [--build-dir=<scratch build root>]
//
// Contract sources: plan13 (13-implementation-plan.md, Stage 2 exit + G2), contract18
// (18-stage0-verification-contract-proposal.md: case matrix D/N, input roster, settle and
// equality tolerances), contract-v1 (evidence 07 store/conductor interface), motion-baseline
// (evidence 07), and the parent-saved runtime port:
//   window.__torqueNarrative = { snapshot(): {progress, beatId, localProgress, phase,
//     stateKey, previousId, nextId}, beats: [{id,start,end}], diagnostics(): {
//     activeConductors, lenisInstances, tickerCallbacks, scrollTriggers, mountCount,
//     disposeCount, refreshCount, visibilityResamples, pageShowResamples,
//     invalidProgressInputs, lagSmoothingMode } }
// The port is installed by the lazy Scene (src/scene/torque-wrench/Scene.tsx) and DELETED on
// Scene unmount; static paths never install it. data-torque-mode is live|static|pending on
// .torque-page; data-torque-scene="placeholder" marks the Stage 2 zero-GPU Scene.
//
// Input contract: native input only - page.mouse.wheel, page.keyboard,
// page.emulateMedia (real MQL emulation), window.scrollTo (native direct seek), and scrollbar
// mouse drag. Store setters, port mutation, and any setter that would bypass the actual
// scroll mapping are never called. Every await is bounded; a per-case watchdog owns and
// closes its context on timeout; collectors are real observations, never synthetic success.
// Failure cases are induced harness-only via Playwright route interception of the exact
// derived Scene module identity (abort = import rejection; controlled ESM whose default
// export throws = render failure) and page.emulateMedia for the mid-session MQL step-down.
//
// Diagnostics are scoped lifecycle accounting from the page store, not an independent
// browser-global census; global-instance absence is not claimed from them. The MQL case
// retains a read-only handle to the original getter and checks owned counters after teardown.
// The public port is still deleted. visibilityResamples and
// pageShowResamples are recorded when they occur but hidden-tab resumption is not inducible
// without faking browser state, so that functional case stays with the parent's separate
// contract18 stress roster. invalidProgressInputs is expected stable across native input;
// induced-invalid-input proof belongs to conductor-runtime CPU tests. lagSmoothingMode is
// recorded verbatim for reviewer judgment, with no semantic assertion.
//
// Exit codes: 0 all cases PASS | 1 at least one case FAIL | 2 usage error |
// 10 preflight blocked (parent integration markers absent; nothing ran) |
// 11 environment blocked (playwright/browser/server/build manifest/identity; nothing concluded) |
// 12 internal error writing the report.

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const EVIDENCE_STAGE = path.join(ROOT, 'project', 'work', 'evidence', 'torque-wrench-rebuild', '07-autonomous-2026-10-12')
const DEFAULT_OUT_DIR = path.join(EVIDENCE_STAGE, 'runtime-timeline')
const SCRATCH_ROOT = path.resolve(ROOT, '.scratch')

const TORQUE_HTML = path.join(ROOT, 'torque-wrench', 'index.html')
const MODULE_SRC = '/src/torque-wrench-main.tsx'
const DEV_SCENE_PATH = '/src/scene/torque-wrench/Scene.tsx'
const SCENE_FILE = path.join(ROOT, 'src', 'scene', 'torque-wrench', 'Scene.tsx')
const STORE_FILE = path.join(ROOT, 'src', 'state', 'torqueWrenchStore.ts')

// Contract 18 approved primary viewports (H/L supplemental stay out of this roster).
const VIEWPORTS = {
  D: { key: 'D', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false, label: 'D 1440x900 DPR1 desktop' },
  N: { key: 'N', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true, label: 'N 390x844 DPR3 touch/mobile' },
}

const SCENE_SHAPE_RE = /(?:^|\/)(?:src\/scene\/torque-wrench\/Scene(?:\.[tj]sx?)?|assets\/Scene-[\w.-]+\.js)$/
const SCENE_SOURCE_KEY_RE = /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/
// Narrative bytes only; shared DRACOLoader code chunks are not CAD/decoder assets.
const CAD_REQUEST_RE = /(\.glb($|\?)|\.gltf($|\?)|\.bin($|\?)|\/draco\/(?:draco_decoder(?:_geometry)?\.wasm|draco_wasm_wrapper\.js)|ktx2|basis|\/models\/)/i
const VITE_DEV_CLIENT_RE = /(^|\/)(@vite\/|@react-refresh)|@vite\/client/i

const EXIT = { PASS: 0, FAIL: 1, USAGE: 2, PREFLIGHT: 10, BLOCKED: 11, INTERNAL: 12 }
const NAV_TIMEOUT_MS = 30000
const STAGE_TIMEOUT_MS = 20000
const SETTLE_TIMEOUT_MS = 3000 // <= contract18 1.7s settle + .5s stability window, bounded
const SETTLE_STABLE_MS = 500
const SETTLE_POLL_MS = 100
const INPUT_GAP_MS = 100
const HOLD_MS = 5000 // contract18 fixed-progress hold
const HOLD_POLL_MS = 1000
const SEAL_WINDOW_MS = 750
const CASE_WATCHDOG_MS = 150000
const FLUSH_TIMEOUT_MS = 2000
const PROGRESS_EPS = 1e-9
const MAPPING_TOL = 0.01 // 1% relative, recorded actuals

const KNOWN_FLAGS = new Set(['help', 'url', 'out', 'only', 'viewport', 'build-dir'])
const CHAPTER_IDS = ['drafting', 'breakthrough', 'mechanism', 'inspection', 'close']
const KNOWN_CASE_SUFFIXES = [
  'live-conductor-forward',
  'live-keyboard-inputs',
  'live-scrollbar-drag',
  'live-equality',
  'poster-explicit',
  'reduced-motion',
  'mql-downgrade',
  'scene-import-abort',
  'scene-render-throw',
]

const RENDER_THROW_MARKER = 'TORQUE_TIMELINE_RENDER_THROW_INJECTION'
const RENDER_THROW_MODULE = [
  '// verify-torque-timeline controlled render-failure injection (harness-served only).',
  'const FAILURE = new Error(' + JSON.stringify(RENDER_THROW_MARKER) + ')',
  'export default function TorqueScene() { throw FAILURE }',
].join('\n')

const DIAGNOSTIC_FIELDS = ['activeConductors', 'lenisInstances', 'lenisScrollHandlers', 'tickerCallbacks', 'scrollTriggers', 'domListeners', 'storeLifecycleSubscriptions', 'mountCount', 'disposeCount', 'refreshCount', 'visibilityResamples', 'pageShowResamples', 'invalidProgressInputs', 'startupFailureCount', 'cleanupFailureCount', 'lagSmoothingMode']

const DEPENDENCIES = [
  'Runtime port dependency: window.__torqueNarrative (parent-saved) is the only narrative state source; snapshot()/beats/diagnostics() per the parent contract. No production hooks were added by this verifier.',
  'Diagnostics are scoped lifecycle accounting owned by the page store; they are not an independent browser-global census, so no global instance-absence claim is made from them.',
  'Single-conductor evidence combines diagnostics identity (active/lenis/ticker/trigger = 1) with functional mapping proof (settled progress vs native displacement).',
  'Beat windows are read from the live port beats array; production beats.ts/beatTimeline.ts are owned by the timeline worker and are not imported here.',
]

const LIMITS = [
  'MQL teardown counters are read through a retained read-only getter handle, separately from public port deletion; scoped accounting is not a browser-global resource census.',
  'visibilityResamples/pageShowResamples are recorded when they occur; hidden-tab resumption is not inducible without faking browser state and remains a separate contract18 functional-stress case.',
  'invalidProgressInputs is expected stable across this roster (native input cannot produce nonfinite progress without bypassing the mapping, which is forbidden); induced invalid-input proof belongs to conductor-runtime CPU tests.',
  'lagSmoothingMode is recorded verbatim; its accepted representation is owned by the conductor worker, so no semantic assertion is made.',
  'Duplicate-lease protection is observable only through conductor counters; this roster asserts actives stay 1 and counters do not drift during native input. Induced double-mount would require production-hook edits (forbidden here) or a parent-scheduled dev-server StrictMode window (deferred; production preview has no StrictMode double-mount).',
  'Scrollbar drag requires classic (non-overlay) scrollbars in headless Chrome; zero native displacement is a FAIL with recorded evidence, never a silent skip. Case is D-viewport only (N is touch emulation).',
  'Physical hold-drift tolerances (position/quaternion/FOV/shader channels) are unmeasurable at the Stage 2 zero-GPU placeholder; hold equality is asserted at progress/beat/sample level.',
  'No hardware or software rendering claim: launch configuration and browser version are recorded as configuration only; Stage 2 Scene is zero-GPU (data-torque-scene="placeholder").',
]

const USAGE = [
  'usage: node scripts/verify-torque-timeline.mjs --help',
  '       node scripts/verify-torque-timeline.mjs --url=http://localhost:<port>/torque-wrench/ [--out=<report.json>] [--only=<id,id>] [--viewport=D|N] [--build-dir=<scratch build root>]',
  '',
  '--url: loopback host only, exact /torque-wrench path, no query/hash (modes add quality via the URL API).',
  '--out: optional report path; explicit paths must resolve inside ' + EVIDENCE_STAGE,
  '--build-dir: optional scratch production build root inside this worktree .scratch (read-only; manifest-based Scene identity).',
  'Cases per viewport: ' + KNOWN_CASE_SUFFIXES.join(', ') + ' (live-scrollbar-drag is D-viewport only).',
  'Exit codes: 0 pass | 1 fail | 2 usage | 10 preflight blocked | 11 environment blocked | 12 report write error.',
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
    const withValue = /^--([a-z][a-z-]*)=(.*)$/i.exec(raw)
    const flag = /^--([a-z][a-z-]*)$/i.exec(raw)
    if (!withValue && !flag) usage('unknown argument: ' + raw)
    const key = (withValue || flag)[1].toLowerCase()
    if (!KNOWN_FLAGS.has(key)) usage('unknown flag: --' + key)
    args[key] = withValue ? withValue[2] : true
  }
  return args
}

function check(list, name, pass, detail) {
  list.push({ name, pass: Boolean(pass), detail: detail || '' })
  return Boolean(pass)
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')
const sha256Buffer = (buf) => createHash('sha256').update(buf).digest('hex')

function collectModuleSrcs(html) {
  const srcs = []
  const tagRe = /<script\b[^>]*>/gi
  let tag
  while ((tag = tagRe.exec(html))) {
    if (!/\btype\s*=\s*["']?module["']?/i.test(tag[0])) continue
    const src = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag[0])
    if (!src) continue
    srcs.push((src[1] || src[2] || src[3] || '').trim())
  }
  return srcs
}

function entrySrcVerdict(html, expected) {
  const srcs = collectModuleSrcs(html)
  const candidates = srcs.filter((s) => !VITE_DEV_CLIENT_RE.test(s))
  return { srcs, candidates, ok: candidates.length === 1 && candidates[0] === expected }
}

// ---- Preflight: fail-closed parent-integration marker audit. Filesystem + package only. ----

function fileContains(file, needles) {
  if (!existsSync(file)) return { ok: false, reason: 'missing file: ' + file }
  const text = readFileSync(file, 'utf8')
  const missing = needles.filter((n) => !text.includes(n))
  return missing.length === 0 ? { ok: true } : { ok: false, reason: 'missing markers: ' + missing.join(', ') }
}

function runPreflight() {
  const checks = []
  const add = (name, pass, detail) => check(checks, name, pass, detail)
  let playwrightVersion = null
  try {
    const require = createRequire(import.meta.url)
    playwrightVersion = JSON.parse(readFileSync(require.resolve('playwright/package.json'), 'utf8')).version || null
    add('playwright package resolvable', true, 'version ' + (playwrightVersion || 'unknown'))
  } catch (error) {
    add('playwright package resolvable', false, String(error))
  }
  add('browser-launch contract present', existsSync(path.join(ROOT, 'scripts', 'lib', 'browser-launch.mjs')))
  add('private torque entry present', existsSync(TORQUE_HTML), TORQUE_HTML)
  const scene = fileContains(SCENE_FILE, ['__torqueNarrative', 'ScrollConductor', 'TORQUE_BEATS'])
  add('Scene.tsx carries parent port integration markers', scene.ok, scene.reason || '')
  const store = fileContains(STORE_FILE, ['getNarrativeSample', 'getConductorDiagnostics'])
  add('torqueWrenchStore carries narrative + diagnostics contract markers', store.ok, store.reason || '')
  return { ok: checks.every((c) => c.pass), checks, playwrightVersion }
}

// ---- Arg validation (mirrors the static harness common choices) ----

function validateStrictUrl(raw) {
  let u
  try {
    u = new URL(raw)
  } catch (e) {
    usage('bad --url: ' + e.message)
  }
  const loopback = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
  if (!/^https?:$/.test(u.protocol)) usage('--url must be http(s) on a loopback host')
  if (!loopback.has(u.hostname)) usage('--url host must be loopback (localhost, 127.0.0.1, or ::1); got ' + u.hostname)
  if (u.pathname !== '/torque-wrench' && u.pathname !== '/torque-wrench/') usage('--url path must be exactly /torque-wrench (no extra segments)')
  if (u.search || u.hash) usage('--url must not carry a query or hash; modes add quality via the URL API')
  return u
}

function validateOut(raw) {
  const resolved = path.resolve(raw)
  const realStage = realpathSync(EVIDENCE_STAGE)
  if (!existsSync(path.dirname(resolved))) usage('--out parent directory does not exist (no directories are created for explicit --out): ' + path.dirname(resolved))
  let realParent
  try {
    realParent = realpathSync(path.dirname(resolved))
  } catch (e) {
    usage('--out parent cannot be resolved: ' + e.message)
  }
  if (realParent !== realStage && !realParent.startsWith(realStage + path.sep)) usage('--out must stay inside the owned evidence stage dir: ' + EVIDENCE_STAGE)
  let st
  try {
    st = lstatSync(resolved)
  } catch (e) {
    // A new report is expected not to exist; its real parent was checked above.
    // lstat still catches dangling symlinks so they cannot bypass target validation.
    if (e.code !== 'ENOENT') usage('--out target cannot be inspected: ' + e.message)
    return resolved
  }
  if (st.isDirectory()) usage('--out must be a file path, not a directory: ' + resolved)
  if (!st.isFile() && !st.isSymbolicLink()) usage('--out target is not a regular file: ' + resolved)
  if (st.isSymbolicLink() || st.isFile()) {
    let realTarget
    try {
      realTarget = realpathSync(resolved)
    } catch (e) {
      usage('--out target cannot be resolved: ' + e.message)
    }
    if (realTarget !== realStage && !realTarget.startsWith(realStage + path.sep)) usage('--out resolves through a symlink outside the owned evidence stage dir: ' + realTarget)
    if (!lstatSync(realTarget).isFile()) usage('--out target does not resolve to a regular file: ' + resolved)
  }
  return resolved
}

function validateViewport(raw) {
  const key = String(raw).toUpperCase()
  if (!VIEWPORTS[key]) usage('bad --viewport: ' + raw + ' (use D or N)')
  return key
}

function validateOnly(raw) {
  const ids = String(raw).split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) usage('--only listed no case ids')
  for (const id of ids) {
    const parts = id.split('-')
    const vp = parts[0]
    const suffix = parts.slice(1).join('-')
    if (!VIEWPORTS[vp] || !KNOWN_CASE_SUFFIXES.includes(suffix)) usage('--only case id not in roster: ' + id)
  }
  return new Set(ids)
}

function validateBuildDir(raw) {
  const resolved = path.resolve(raw)
  if (resolved !== SCRATCH_ROOT && !resolved.startsWith(SCRATCH_ROOT + path.sep)) usage('--build-dir must resolve inside this worktree .scratch: ' + SCRATCH_ROOT)
  if (existsSync(resolved)) {
    let real
    try {
      real = realpathSync(resolved)
    } catch (e) {
      usage('--build-dir cannot be resolved: ' + e.message)
    }
    if (real !== resolved && real !== SCRATCH_ROOT && !real.startsWith(SCRATCH_ROOT + path.sep)) usage('--build-dir resolves through a symlink outside .scratch: ' + real)
  }
  return resolved
}

function buildPlans(viewportKeys, only) {
  const plans = []
  for (const vp of viewportKeys) {
    const suffixes = KNOWN_CASE_SUFFIXES.filter((s) => s !== 'live-scrollbar-drag' || vp === 'D')
    for (const suffix of suffixes) {
      const id = vp + '-' + suffix
      if (only && !only.has(id)) continue
      plans.push({ id, viewport: vp, suffix })
    }
  }
  return plans
}

// ---- Built-mode identity (read-only; no build subprocess) ----

function loadBuildGraph(buildDir) {
  const manifestPath = path.join(buildDir, '.vite', 'manifest.json')
  if (!existsSync(manifestPath)) return { error: 'BLOCKED: manifest missing (run the scratch production build first): ' + manifestPath }
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (e) {
    return { error: 'BLOCKED: manifest is not valid JSON: ' + e.message }
  }
  const entry = manifest['torque-wrench/index.html']
  if (!entry || entry.isEntry !== true || !entry.file) return { error: 'BLOCKED: manifest has no torque-wrench/index.html entry chunk' }
  const sceneKey = Object.keys(manifest).find((k) => SCENE_SOURCE_KEY_RE.test(k))
  if (!sceneKey) return { error: 'BLOCKED: manifest has no src/scene/torque-wrench/Scene.* dynamic chunk' }
  if (!Array.isArray(entry.dynamicImports) || !entry.dynamicImports.includes(sceneKey)) {
    return { error: 'BLOCKED: torque entry dynamicImports does not include the Scene chunk (graph identity mismatch): ' + sceneKey }
  }
  return { mode: 'built', buildDir, expectedModuleSrc: '/' + entry.file, scenePath: '/' + manifest[sceneKey].file, entryAsset: '/' + entry.file }
}

function localAssetSha(build, assetPath) {
  const rel = assetPath.replace(/^\//, '')
  const filePath = path.join(build.buildDir, rel)
  let realBuild
  let realFile
  try {
    realBuild = realpathSync(build.buildDir)
    realFile = realpathSync(filePath)
  } catch (e) {
    return { error: 'asset cannot be resolved inside the build dir (' + assetPath + '): ' + e.message }
  }
  if (realFile !== realBuild && !realFile.startsWith(realBuild + path.sep)) return { error: 'asset resolves outside the build dir: ' + realFile }
  return { filePath, sha256: sha256Buffer(readFileSync(filePath)) }
}

async function fetchSha256(playwright, url) {
  const api = await playwright.request.newContext()
  try {
    const res = await api.get(url, { timeout: NAV_TIMEOUT_MS })
    const body = await res.body()
    return { status: res.status(), sha256: sha256Buffer(body) }
  } finally {
    await api.dispose().catch(() => {})
  }
}

async function verifyBuiltAssets(playwright, baseUrl, build) {
  const origin = new URL(baseUrl).origin
  const identity = {}
  for (const [name, assetPath] of [['entryAsset', build.expectedModuleSrc], ['sceneAsset', build.scenePath]]) {
    const local = localAssetSha(build, assetPath)
    if (local.error) return { error: 'BLOCKED: ' + local.error }
    const remote = await fetchSha256(playwright, origin + assetPath)
    if (remote.status !== 200) return { error: 'BLOCKED: served ' + name + ' returned status ' + remote.status + ' at ' + assetPath }
    const verified = remote.sha256 === local.sha256
    identity[name] = { url: origin + assetPath, localSha256: local.sha256, servedSha256: remote.sha256, servedShaVerified: verified }
    if (!verified) return { error: 'BLOCKED: served ' + name + ' bytes do not match the manifest build output (' + assetPath + ')' }
  }
  return { identity }
}

async function servedPreflight(playwright, baseUrl, expectedModuleSrc) {
  const api = await playwright.request.newContext()
  try {
    const res = await api.get(baseUrl, { timeout: NAV_TIMEOUT_MS })
    const body = await res.text()
    const finalUrl = res.url()
    const verdict = entrySrcVerdict(body, expectedModuleSrc)
    const pathOk = finalUrl.includes('/torque-wrench')
    return { ok: res.status() === 200 && verdict.ok && pathOk, status: res.status(), finalUrl, candidates: verdict.candidates }
  } finally {
    await api.dispose().catch(() => {})
  }
}

// ---- Runtime collectors (harness-common choices; probe named for this harness) ----

function safePathname(url) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function newCollectors() {
  return {
    requests: [],
    responses: [],
    requestFailed: [],
    sceneModule: { requests: [], responses: [], requestFailed: [], bodies: [] },
    sceneShaped: [],
    cadRequests: [],
    httpErrors: [],
    consoleErrors: [],
    pageErrors: [],
  }
}

function attachCollectors(page, state, scenePath) {
  page.on('request', (r) => {
    const url = r.url()
    const p = safePathname(url)
    state.requests.push({ method: r.method(), url })
    if (p === scenePath) state.sceneModule.requests.push(url)
    else if (SCENE_SHAPE_RE.test(p)) state.sceneShaped.push(url)
    if (CAD_REQUEST_RE.test(url)) state.cadRequests.push(url)
  })
  page.on('response', async (res) => {
    const url = res.url()
    const p = safePathname(url)
    state.responses.push({ url, status: res.status() })
    if (res.status() >= 400) state.httpErrors.push({ url, status: res.status() })
    if (p === scenePath) state.sceneModule.responses.push({ url, status: res.status() })
  })
  page.on('requestfailed', (r) => {
    const url = r.url()
    const failure = { url, error: (r.failure() && r.failure().errorText) || 'unknown' }
    state.requestFailed.push(failure)
    if (safePathname(url) === scenePath) state.sceneModule.requestFailed.push(failure)
  })
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const location = m.location ? m.location() : null
      state.consoleErrors.push({ text: m.text(), url: (location && location.url) || '' })
    }
  })
  page.on('pageerror', (e) => state.pageErrors.push(String((e && e.message) || e)))
}

// Init script: canvas/OffscreenCanvas census from document start. Read-only observation; it
// never touches __torqueNarrative.
const PROBE_INIT = () => {
  const probe = { canvasMounts: [], canvasRemovals: 0, offscreenCanvasConstructions: 0 }
  Object.defineProperty(window, '__torqueTimelineProbe', { value: probe, configurable: false })
  const isCanvas = (node) => Boolean(node && node.nodeName === 'CANVAS')
  const record = (node) => probe.canvasMounts.push({ t: Math.round(performance.now()), id: node.id || null, cls: (node.getAttribute && node.getAttribute('class')) || null })
  const scan = (root) => {
    if (root && root.querySelectorAll) for (const c of root.querySelectorAll('canvas')) record(c)
  }
  scan(document)
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (isCanvas(n)) record(n)
        else scan(n)
      }
      for (const n of m.removedNodes) {
        if (isCanvas(n)) probe.canvasRemovals += 1
        else if (n && n.querySelectorAll) probe.canvasRemovals += n.querySelectorAll('canvas').length
      }
    }
  }).observe(document, { childList: true, subtree: true })
  const NativeOffscreen = window.OffscreenCanvas
  if (NativeOffscreen) {
    window.OffscreenCanvas = class extends NativeOffscreen {
      constructor(...args) {
        probe.offscreenCanvasConstructions += 1
        super(...args)
      }
    }
  }
}

async function flushProbe(page) {
  await Promise.race([
    page.evaluate(() => new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))
      else setTimeout(() => resolve(true), 50)
    })),
    new Promise((resolve) => setTimeout(() => resolve(false), FLUSH_TIMEOUT_MS)),
  ])
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ---- Narrative observation ----

async function readNarrative(page) {
  return page.evaluate(() => {
    const port = window.__torqueNarrative
    const se = document.scrollingElement || document.documentElement
    const max = se ? Math.max(0, (se.scrollHeight || 0) - (se.clientHeight || 0)) : 0
    const pageEl = document.querySelector('.torque-page')
    const stageEl = document.querySelector('.torque-stage')
    const sceneEl = document.querySelector('.torque-scene')
    let diagnostics = null
    let diagnosticsError = null
    if (port && typeof port.diagnostics === 'function') {
      try {
        diagnostics = port.diagnostics()
      } catch (e) {
        diagnosticsError = String((e && e.message) || e)
      }
    }
    return {
      present: Boolean(port),
      hasSnapshot: Boolean(port && typeof port.snapshot === 'function'),
      hasDiagnostics: Boolean(port && typeof port.diagnostics === 'function'),
      diagnosticsError,
      sample: port && typeof port.snapshot === 'function' ? port.snapshot() : null,
      diagnostics,
      beats: port && Array.isArray(port.beats) ? port.beats.map((b) => ({ id: b.id, start: b.start, end: b.end, chapter: b.chapter })) : null,
      scrollY: window.scrollY,
      maxScroll: max,
      innerHeight: window.innerHeight,
      mode: pageEl ? pageEl.getAttribute('data-torque-mode') : null,
      stage: stageEl ? stageEl.getAttribute('data-torque-stage') : null,
      scenePlaceholder: sceneEl ? sceneEl.getAttribute('data-torque-scene') : null,
      sceneCount: document.querySelectorAll('.torque-scene').length,
      probe: window.__torqueTimelineProbe || null,
    }
  })
}

async function settleBounded(page) {
  const started = Date.now()
  let last = null
  let stableSince = null
  const trace = []
  let obs = null
  while (Date.now() - started < SETTLE_TIMEOUT_MS) {
    obs = await readNarrative(page)
    const p = obs.sample ? obs.sample.progress : null
    trace.push({ t: Date.now() - started, progress: p })
    if (typeof p === 'number' && Number.isFinite(p)) {
      if (last !== null && Math.abs(p - last) <= PROGRESS_EPS) {
        if (stableSince === null) stableSince = Date.now()
        if (Date.now() - stableSince >= SETTLE_STABLE_MS) {
          return { settled: true, convergenceMs: Date.now() - started, obs, trace: trace.slice(-64) }
        }
      } else {
        stableSince = null
      }
      last = p
    }
    await sleep(SETTLE_POLL_MS)
  }
  return { settled: false, convergenceMs: SETTLE_TIMEOUT_MS, obs: obs || (await readNarrative(page)), trace: trace.slice(-64) }
}

async function waitLive(page) {
  const started = Date.now()
  while (Date.now() - started < STAGE_TIMEOUT_MS) {
    const obs = await readNarrative(page)
    if (obs.mode === 'live' && obs.present && obs.hasSnapshot && obs.scenePlaceholder === 'live') return { ok: true, obs }
    await sleep(SETTLE_POLL_MS)
  }
  return { ok: false, obs: await readNarrative(page) }
}

async function waitTerminalStatic(page) {
  const started = Date.now()
  while (Date.now() - started < STAGE_TIMEOUT_MS) {
    const obs = await readNarrative(page)
    if (obs.mode === 'static' && obs.stage === 'poster' && !obs.present) return { ok: true, obs }
    await sleep(SETTLE_POLL_MS)
  }
  return { ok: false, obs: await readNarrative(page) }
}

async function seekFraction(page, fraction) {
  await page.evaluate((f) => {
    const se = document.scrollingElement || document.documentElement
    const max = Math.max(0, (se.scrollHeight || 0) - (se.clientHeight || 0))
    window.scrollTo(0, Math.round(max * f))
  }, fraction)
  return settleBounded(page)
}

async function wheelBurst(page, deltas, gapMs = INPUT_GAP_MS) {
  for (const dy of deltas) {
    await page.mouse.wheel(0, dy)
    await sleep(gapMs)
  }
}

function validateBeats(beats) {
  const errors = []
  if (!Array.isArray(beats) || beats.length < 5) return { ok: false, errors: ['beats array missing or shorter than the five-chapter coverage'], ids: [] }
  const ids = beats.map((b) => b.id)
  if (ids.some((id) => typeof id !== 'string' || id === '')) errors.push('non-string or empty beat id')
  if (new Set(ids).size !== ids.length) errors.push('duplicate beat ids')
  for (const b of beats) {
    if (![b.start, b.end].every((n) => typeof n === 'number' && Number.isFinite(n)) || !(b.start >= 0 && b.start < b.end && b.end <= 1)) {
      errors.push('invalid window for beat ' + JSON.stringify(b))
    }
  }
  if (errors.length) return { ok: false, errors, ids }
  if (beats[0].start !== 0) errors.push('first beat start != 0')
  if (beats[beats.length - 1].end !== 1) errors.push('last beat end != 1')
  for (let i = 1; i < beats.length; i++) {
    if (beats[i - 1].end !== beats[i].start) errors.push('gap/overlap at boundary ' + i)
  }
  const chapters = beats.map((b) => b.chapter).filter((chapter, i, all) => i === 0 || chapter !== all[i - 1])
  if (JSON.stringify(chapters) !== JSON.stringify(CHAPTER_IDS)) errors.push('semantic chapter associations must follow the complete story order: ' + JSON.stringify(chapters))
  return { ok: errors.length === 0, errors, ids }
}

function derivePhase(localProgress) {
  if (localProgress < 0.1) return 'entering'
  if (localProgress >= 0.9) return 'exiting'
  return 'active'
}

function diagnosticsIdentityOk(d, errors) {
  if (!d || typeof d !== 'object') {
    errors.push('diagnostics() missing or not an object')
    return false
  }
  const missing = DIAGNOSTIC_FIELDS.filter((f) => d[f] === undefined)
  if (missing.length) errors.push('diagnostics missing fields: ' + missing.join(','))
  const identity = { activeConductors: 1, lenisInstances: 1, lenisScrollHandlers: 1, tickerCallbacks: 1, scrollTriggers: 1, domListeners: 3, storeLifecycleSubscriptions: 1, startupFailureCount: 0, cleanupFailureCount: 0 }
  let ok = true
  for (const [field, expected] of Object.entries(identity)) {
    if (d[field] !== expected) {
      errors.push(field + '=' + JSON.stringify(d[field]) + ' expected ' + expected)
      ok = false
    }
  }
  return ok
}

function mappingDelta(before, after) {
  const dPx = after.scrollY - before.scrollY
  const dProg = after.sample && before.sample ? after.sample.progress - before.sample.progress : null
  const expected = after.maxScroll > 0 ? dPx / after.maxScroll : 0
  return { dPx, dProg, expected }
}

function checkMapping(name, before, after, c, tol = MAPPING_TOL) {
  const { dPx, dProg, expected } = mappingDelta(before, after)
  const ok = dProg !== null && Math.abs(dProg - expected) <= tol * Math.max(Math.abs(expected), 1e-9)
  return c(name, ok, 'dPx=' + dPx + ' expectedDProgress=' + expected + ' actualDProgress=' + dProg)
}

function sameSnapshot(a, b) {
  const diffs = []
  for (const key of ['beatId', 'phase', 'stateKey', 'previousId', 'nextId']) {
    if (a[key] !== b[key]) diffs.push(key + ': ' + JSON.stringify(a[key]) + ' vs ' + JSON.stringify(b[key]))
  }
  for (const key of ['progress', 'localProgress']) {
    if (!(typeof a[key] === 'number' && typeof b[key] === 'number' && Math.abs(a[key] - b[key]) <= PROGRESS_EPS)) {
      diffs.push(key + ': ' + a[key] + ' vs ' + b[key] + ' (|d|=' + (typeof a[key] === 'number' && typeof b[key] === 'number' ? Math.abs(a[key] - b[key]) : 'n/a') + ')')
    }
  }
  return { equal: diffs.length === 0, diffs }
}

function consoleErrorsCorrelated(state, marker, scenePath) {
  return state.consoleErrors.every((e) => {
    if (marker && e.text.includes(marker)) return true
    if (e.url && safePathname(e.url) === scenePath) return true
    return e.text.includes(scenePath)
  })
}

// ---- Case steps ----

async function assertCommonLive(obs, state, c, failureCorrelation = null) {
  if (obs.mode === 'live') {
    c('one live document canvas mounted and none removed', obs.probe.canvasMounts.length === 1 && obs.probe.canvasRemovals === 0, JSON.stringify(obs.probe))
    c('at most one auxiliary OffscreenCanvas construction', obs.probe.offscreenCanvasConstructions <= 1, String(obs.probe.offscreenCanvasConstructions))
    c('live initialization requests narrative CAD assets', state.cadRequests.some((url) => url.endsWith('/models/Default.glb')), JSON.stringify(state.cadRequests))
  } else if (obs.probe.canvasMounts.length === 1 && obs.probe.canvasRemovals === 1) {
    c('downgraded live document canvas removed exactly once', obs.probe.canvasRemovals === 1, JSON.stringify(obs.probe))
    c('at most one auxiliary OffscreenCanvas construction', obs.probe.offscreenCanvasConstructions <= 1, String(obs.probe.offscreenCanvasConstructions))
    c('downgrade follows initialized narrative CAD assets', state.cadRequests.some((url) => url.endsWith('/models/Default.glb')), JSON.stringify(state.cadRequests))
  } else {
    c('zero document canvas mounts incl. removed', obs.probe.canvasMounts.length === 0 && obs.probe.canvasRemovals === 0, JSON.stringify(obs.probe))
    c('at most one auxiliary OffscreenCanvas construction', obs.probe.offscreenCanvasConstructions <= 1, String(obs.probe.offscreenCanvasConstructions))
    c('zero narrative CAD/decoder byte requests from initialization', state.cadRequests.length === 0, JSON.stringify(state.cadRequests))
  }
  c('zero HTTP error responses (>=400)', state.httpErrors.length === 0, JSON.stringify(state.httpErrors))
  const consoleOk = failureCorrelation
    ? consoleErrorsCorrelated(state, failureCorrelation.marker, failureCorrelation.scenePath)
    : state.consoleErrors.length === 0
  c('zero unrelated console errors', consoleOk, JSON.stringify(state.consoleErrors))
  c('zero uncaught page errors', state.pageErrors.length === 0, JSON.stringify(state.pageErrors))
}

async function stepLiveLoad(page, state, c, build) {
  const live = await waitLive(page)
  c('page resolves to live mode with narrative port', live.ok, JSON.stringify({ mode: live.obs.mode, present: live.obs.present, stage: live.obs.stage, scenePlaceholder: live.obs.scenePlaceholder }))
  const obs = live.obs
  let worldReady = false
  try {
    await page.waitForFunction(() => {
      const world = window.__torqueWorld?.snapshot?.()
      return world?.ready === true && world?.sheet?.baked === true
    }, undefined, { timeout: 90_000, polling: 50 })
    worldReady = true
  } catch {
    worldReady = false
  }
  c('live renderer and initial sheet bake ready before input', worldReady, 'worldReady=' + String(worldReady))
  c('exactly one .torque-scene live host element', obs.sceneCount === 1 && obs.scenePlaceholder === 'live', 'count=' + obs.sceneCount)
  c('lazy Scene module requested exactly once', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  c('port exposes snapshot()/beats/diagnostics()', obs.hasSnapshot && Array.isArray(obs.beats) && obs.hasDiagnostics, 'snapshot=' + obs.hasSnapshot + ' beats=' + Array.isArray(obs.beats) + ' diagnostics=' + obs.hasDiagnostics + (obs.diagnosticsError ? ' diagnosticsError=' + obs.diagnosticsError : ''))
  const beatsVerdict = validateBeats(obs.beats)
  c('beat windows valid: unique ids, ordered 0..1 coverage, five semantic chapters present', beatsVerdict.ok, JSON.stringify(beatsVerdict.errors))
  const diagErrors = []
  const identityOk = diagnosticsIdentityOk(obs.diagnostics, diagErrors)
  c('single conductor via diagnostics (active/lenis/ticker/trigger = 1)', identityOk, JSON.stringify({ diagnostics: obs.diagnostics, errors: diagErrors }))
  const initial = await settleBounded(page)
  c('initial progress settles at 0 with first beat entering', initial.settled && initial.obs.sample && Math.abs(initial.obs.sample.progress) <= PROGRESS_EPS && initial.obs.sample.beatId === obs.beats[0].id && initial.obs.sample.phase === 'entering', JSON.stringify(initial.obs.sample))
  return { obs: initial.obs, beats: obs.beats, diagnostics: obs.diagnostics }
}

async function stepLiveConductorForward(page, state, c, plan, baseUrl, build) {
  const loaded = await stepLiveLoad(page, state, c, build)
  const beats = loaded.beats
  const d0 = loaded.diagnostics

  const beforeA = await readNarrative(page)
  await wheelBurst(page, Array(12).fill(120))
  const settledA = await settleBounded(page)
  c('wheel 12x120px settles within bound', settledA.settled, 'convergenceMs=' + settledA.convergenceMs)
  const afterA = settledA.obs
  c('wheel 12x120px advances progress via native mapping', afterA.sample && afterA.sample.progress > beforeA.sample.progress, JSON.stringify(mappingDelta(beforeA, afterA)))
  checkMapping('wheel 12x120px mapping within 1% of native displacement', beforeA, afterA, c)

  const beforeB = await readNarrative(page)
  await wheelBurst(page, Array(4).fill(1200))
  const settledB = await settleBounded(page)
  c('wheel 4x1200px settles within bound', settledB.settled, 'convergenceMs=' + settledB.convergenceMs)
  const afterB = settledB.obs
  checkMapping('wheel 4x1200px mapping within 1% of native displacement', beforeB, afterB, c)
  const beatAfterB = afterB.sample ? afterB.sample.beatId : null
  const expectedBeat = beats.find((b) => afterB.sample && afterB.sample.progress >= b.start && afterB.sample.progress < b.end)
  const lastBeat = beats[beats.length - 1]
  const beatOk = afterB.sample && (afterB.sample.progress >= 1 ? beatAfterB === lastBeat.id : expectedBeat && beatAfterB === expectedBeat.id)
  c('settled beatId matches the [start,end) beat table', Boolean(beatOk), 'progress=' + (afterB.sample && afterB.sample.progress) + ' beatId=' + beatAfterB + ' expected=' + (expectedBeat ? expectedBeat.id : lastBeat.id))
  if (afterB.sample) {
    c('phase matches contract derivation from localProgress', afterB.sample.phase === derivePhase(afterB.sample.localProgress), JSON.stringify(afterB.sample))
  }

  const repeatAnchor = await readNarrative(page)
  await wheelBurst(page, Array(4).fill(-1200))
  const settledBack = await settleBounded(page)
  checkMapping('wheel 4x-1200px reverse mapping within 1%', repeatAnchor, settledBack.obs, c)
  const beforeRepeat = await readNarrative(page)
  await wheelBurst(page, Array(4).fill(1200))
  const settledRepeat = await settleBounded(page)
  const repeatDelta = Math.abs((settledRepeat.obs.sample ? settledRepeat.obs.sample.progress : NaN) - (afterB.sample ? afterB.sample.progress : NaN))
  c('repeat identical wheel burst settles to the same progress (deterministic single mapping)', settledRepeat.settled && repeatDelta <= 1e-6, 'repeatDelta=' + repeatDelta)
  checkMapping('repeat burst mapping within 1%', beforeRepeat, settledRepeat.obs, c)

  const d1 = (await readNarrative(page)).diagnostics
  c('diagnostics unchanged by native input (no conductor churn, no invalid inputs)', d1 && d0 && d1.activeConductors === d0.activeConductors && d1.mountCount === d0.mountCount && d1.disposeCount === d0.disposeCount && d1.invalidProgressInputs === d0.invalidProgressInputs, JSON.stringify({ before: d0, after: d1 }))

  // Bounded resize: conductor must resample canonical progress on refresh.
  const beforeResize = await readNarrative(page)
  const h0 = VIEWPORTS[plan.viewport].height
  await page.setViewportSize({ width: VIEWPORTS[plan.viewport].width, height: h0 - 50 })
  const settledR = await settleBounded(page)
  await page.setViewportSize({ width: VIEWPORTS[plan.viewport].width, height: h0 })
  const settledBackR = await settleBounded(page)
  const d2 = settledBackR.obs.diagnostics
  c('resize triggers conductor refresh accounting and resamples mapping', Boolean(d2) && Boolean(d0) && d2.refreshCount > d0.refreshCount, JSON.stringify({ refreshBefore: d0 && d0.refreshCount, refreshAfter: d2 && d2.refreshCount }))
  const resizedExpected = settledR.obs.maxScroll > 0 ? settledR.obs.scrollY / settledR.obs.maxScroll : 0
  const resizedActual = settledR.obs.sample ? settledR.obs.sample.progress : null
  c('post-resize progress re-derived from native document metrics', resizedActual !== null && Math.abs(resizedActual - resizedExpected) <= 0.01 * Math.max(Math.abs(resizedExpected), 1e-9), 'scrollY=' + settledR.obs.scrollY + ' max=' + settledR.obs.maxScroll + ' expected=' + resizedExpected + ' actual=' + resizedActual)
  c('progress returns to pre-resize value after viewport restore', Math.abs((settledBackR.obs.sample ? settledBackR.obs.sample.progress : NaN) - (beforeResize.sample ? beforeResize.sample.progress : NaN)) <= 1e-6, JSON.stringify({ before: beforeResize.sample && beforeResize.sample.progress, after: settledBackR.obs.sample && settledBackR.obs.sample.progress }))

  await flushProbe(page)
  const final = await readNarrative(page)
  await assertCommonLive(final, state, c)
}

async function stepLiveKeyboard(page, state, c, build) {
  await stepLiveLoad(page, state, c, build)
  const presses = async (key, times, gapMs) => {
    for (let i = 0; i < times; i++) {
      await page.keyboard.press(key)
      await sleep(gapMs)
    }
  }
  const pressAndCheck = async (name, key, times, gapMs) => {
    const before = await readNarrative(page)
    await presses(key, times, gapMs)
    const settled = await settleBounded(page)
    c(name + ' settles within bound', settled.settled, 'convergenceMs=' + settled.convergenceMs)
    checkMapping(name + ' mapping within 1% of native displacement', before, settled.obs, c)
    return settled.obs
  }
  await pressAndCheck('ArrowDown x10 @100ms', 'ArrowDown', 10, INPUT_GAP_MS)
  await pressAndCheck('PageDown x3 @500ms', 'PageDown', 3, 500)
  await pressAndCheck('ArrowUp x10 @100ms', 'ArrowUp', 10, INPUT_GAP_MS)
  await pressAndCheck('PageUp x3 @500ms', 'PageUp', 3, 500)
  const home = await pressAndCheck('Home', 'Home', 1, INPUT_GAP_MS)
  c('Home returns progress to 0', home.sample && Math.abs(home.sample.progress) <= PROGRESS_EPS, JSON.stringify(home.sample))
  const end = await pressAndCheck('End', 'End', 1, INPUT_GAP_MS)
  c('End reaches progress 1 with final beat exiting', end.sample && Math.abs(end.sample.progress - 1) <= PROGRESS_EPS && end.sample.phase === 'exiting', JSON.stringify(end.sample))
  await flushProbe(page)
  const final = await readNarrative(page)
  c('keyboard roster leaves exactly one Scene request (no re-import)', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  await assertCommonLive(final, state, c)
}

async function stepLiveScrollbarDrag(page, state, c, build) {
  await stepLiveLoad(page, state, c, build)
  const vp = VIEWPORTS.D
  const before = await readNarrative(page)
  const x = vp.width - 3
  await page.mouse.move(x, Math.round(vp.height * 0.55))
  await page.mouse.down()
  for (let step = 1; step <= 8; step++) {
    await page.mouse.move(x, Math.round(vp.height * 0.55) - step * 40)
    await sleep(40)
  }
  await page.mouse.up()
  const settled = await settleBounded(page)
  const { dPx, dProg, expected } = mappingDelta(before, settled.obs)
  c('scrollbar drag produced native displacement', settled.settled && dPx > 0, 'dPx=' + dPx + ' (classic scrollbars required; overlay/absent scrollbars fail here by design)')
  c('scrollbar drag mapping within 2% of native displacement', dProg !== null && Math.abs(dProg - expected) <= 0.02 * Math.max(Math.abs(expected), 1e-9), 'expected=' + expected + ' actual=' + dProg)
  await flushProbe(page)
  const final = await readNarrative(page)
  c('scrollbar roster leaves exactly one Scene request', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  await assertCommonLive(final, state, c)
}

async function stepLiveEquality(page, state, c, build) {
  const loaded = await stepLiveLoad(page, state, c, build)
  const beats = loaded.beats
  const targets = [0, 0.25, 0.5, 0.75, 1]
  const reference = {}
  for (const t of targets) {
    const s = await seekFraction(page, t)
    c('reference seek ' + t + ' settles', s.settled, 'convergenceMs=' + s.convergenceMs)
    reference[t] = s.obs.sample
  }
  // Forward approach: from 0 upward through ascending targets.
  const forwardSamples = {}
  await seekFraction(page, 0)
  for (const t of targets) {
    const s = await seekFraction(page, t)
    forwardSamples[t] = s.obs.sample
  }
  // Reverse approach: from 1 downward through descending targets.
  const reverseSamples = {}
  await seekFraction(page, 1)
  for (const t of [...targets].reverse()) {
    const s = await seekFraction(page, t)
    reverseSamples[t] = s.obs.sample
  }
  let maxDelta = 0
  const diffLog = []
  for (const t of targets) {
    for (const [label, set] of [['forward', forwardSamples], ['reverse', reverseSamples]]) {
      const verdict = sameSnapshot(reference[t], set[t])
      if (!verdict.equal) diffLog.push(label + '@' + t + ': ' + verdict.diffs.join('; '))
      if (reference[t] && set[t]) maxDelta = Math.max(maxDelta, Math.abs(reference[t].progress - set[t].progress))
    }
  }
  c('forward/reverse approaches equal direct-seek reference at matched progress', diffLog.length === 0, JSON.stringify(diffLog))
  c('progress equality within 1e-9 across approaches', maxDelta <= PROGRESS_EPS, 'maxDelta=' + maxDelta)

  // Boundary ownership: shared boundary belongs to the NEXT beat; final beat includes 1.
  let boundaryOk = true
  const boundaryLog = []
  for (let i = 1; i < beats.length; i++) {
    const b = beats[i].start
    const max = (await readNarrative(page)).maxScroll
    const upperPixel = Math.ceil(b * max)
    const lowerPixel = upperPixel - 1
    // Native CSS-pixel quantization: nearest attainable position below the boundary,
    // then the first at/above it (the exact boundary when b*max is integral).
    const low = await seekFraction(page, lowerPixel / max)
    const high = await seekFraction(page, upperPixel / max)
    const separable = max > 0 && low.settled && high.settled && low.obs.scrollY === lowerPixel && high.obs.scrollY === upperPixel && low.obs.sample?.progress < b && high.obs.sample?.progress >= b
    if (!separable || !low.obs.sample || low.obs.sample.beatId !== beats[i - 1].id) {
      boundaryOk = false
      boundaryLog.push('b-' + b + '-0.001 beatId=' + (low.obs.sample && low.obs.sample.beatId) + ' expected ' + beats[i - 1].id)
    }
    if (!separable || !high.obs.sample || high.obs.sample.beatId !== beats[i].id) {
      boundaryOk = false
      boundaryLog.push('b+' + b + '+0.001 beatId=' + (high.obs.sample && high.obs.sample.beatId) + ' expected ' + beats[i].id)
    }
  }
  const top = await seekFraction(page, 0)
  const bottom = await seekFraction(page, 1)
  boundaryOk = boundaryOk && top.obs.sample.beatId === beats[0].id && bottom.obs.sample.beatId === beats[beats.length - 1].id
  c('beat boundary ownership follows [start,end) with final beat including 1', boundaryOk, JSON.stringify(boundaryLog))

  // Reload at .5: initial scroll restoration respected, narrative state re-derived identically.
  const half = await seekFraction(page, 0.5)
  const beforeReload = half.obs.sample
  await page.reload({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
  const liveAgain = await waitLive(page)
  c('after reload page returns to live mode with port', liveAgain.ok, JSON.stringify({ mode: liveAgain.obs.mode, present: liveAgain.obs.present }))
  const afterReload = await settleBounded(page)
  const verdictReload = sameSnapshot(beforeReload, afterReload.obs.sample)
  c('post-reload sample equals pre-reload sample at the same position (restoration respected, no forced top)', verdictReload.equal, JSON.stringify(verdictReload.diffs) + ' scrollY=' + afterReload.obs.scrollY + ' max=' + afterReload.obs.maxScroll)
  const diagErrors = []
  c('post-reload diagnostics identity fresh mount (1/1/1/1)', diagnosticsIdentityOk(afterReload.obs.diagnostics, diagErrors), JSON.stringify({ diagnostics: afterReload.obs.diagnostics, errors: diagErrors }))
  c('reload produced exactly two Scene requests total (one per document load)', state.sceneModule.requests.length === 2, JSON.stringify(state.sceneModule.requests))

  // Hold: fixed canonical progress for 5s (contract18); drift asserted at sample level.
  const holdAnchor = await seekFraction(page, 0.5)
  const holdSamples = [holdAnchor.obs.sample]
  const holdStart = Date.now()
  while (Date.now() - holdStart < HOLD_MS) {
    await sleep(Math.min(HOLD_POLL_MS, HOLD_MS - (Date.now() - holdStart)))
    const obs = await readNarrative(page)
    holdSamples.push(obs.sample)
  }
  let holdDrift = 0
  let holdIdentity = true
  for (const s of holdSamples) {
    if (!s) continue
    holdDrift = Math.max(holdDrift, Math.abs(s.progress - holdAnchor.obs.sample.progress))
    if (s.beatId !== holdAnchor.obs.sample.beatId || s.phase !== holdAnchor.obs.sample.phase || s.stateKey !== holdAnchor.obs.sample.stateKey) holdIdentity = false
  }
  c('5s fixed-progress hold: progress drift <= 1e-9 and beat/phase/stateKey constant', holdDrift <= PROGRESS_EPS && holdIdentity, 'drift=' + holdDrift + ' identityOk=' + holdIdentity + ' samples=' + holdSamples.length)
  const dHold = (await readNarrative(page)).diagnostics
  c('hold produces no conductor churn (mount/dispose/refresh stable)', Boolean(dHold) && Boolean(holdAnchor.obs.diagnostics) && dHold.mountCount === holdAnchor.obs.diagnostics.mountCount && dHold.disposeCount === holdAnchor.obs.diagnostics.disposeCount && dHold.refreshCount === holdAnchor.obs.diagnostics.refreshCount, JSON.stringify({ anchor: holdAnchor.obs.diagnostics, final: dHold }))
  await flushProbe(page)
  const final = await readNarrative(page)
  await assertCommonLive(final, state, c)
}

async function stepStaticNoPort(page, state, c, build, caseName, zeroSceneRequests) {
  const terminal = await waitTerminalStatic(page)
  c(caseName + ': terminal static poster state', terminal.ok, JSON.stringify({ mode: terminal.obs.mode, stage: terminal.obs.stage, present: terminal.obs.present }))
  c(caseName + ': no telemetry port on static path', !terminal.obs.present && terminal.obs.sceneCount === 0, JSON.stringify({ present: terminal.obs.present, sceneCount: terminal.obs.sceneCount }))
  if (zeroSceneRequests) c(caseName + ': zero Scene module requests (tier decided before narrative imports)', state.sceneModule.requests.length === 0, JSON.stringify(state.sceneModule.requests))
  // Native wheel burst: semantic flow normal, narrative port stays absent, nothing re-imports.
  const sceneRequestsBefore = state.sceneModule.requests.length
  await wheelBurst(page, Array(6).fill(240))
  await settleBounded(page)
  await flushProbe(page)
  const after = await readNarrative(page)
  c(caseName + ': port stays absent and mode stays static across native scroll', !after.present && after.mode === 'static', JSON.stringify({ present: after.present, mode: after.mode }))
  c(caseName + ': no additional Scene requests after scroll', state.sceneModule.requests.length === sceneRequestsBefore, JSON.stringify(state.sceneModule.requests))
  await assertCommonLive(after, state, c)
}

async function stepPosterExplicit(page, state, c, build) {
  await stepStaticNoPort(page, state, c, build, 'poster-explicit', true)
}

async function stepReducedFresh(page, state, c, build) {
  await stepStaticNoPort(page, state, c, build, 'reduced-motion(fresh)', true)
}

async function stepMqlDowngrade(page, state, c, build) {
  const loaded = await stepLiveLoad(page, state, c, build)
  // Retain a read-only handle to the original getter while the public port is removed.
  const retainedPort = await page.evaluateHandle(() => window.__torqueNarrative)
  const finalDiagnostics = loaded.diagnostics
  state.finalDiagnostics = finalDiagnostics
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const terminal = await waitTerminalStatic(page)
  c('mql-downgrade: mid-session MQL step-down reaches terminal static poster', terminal.ok, JSON.stringify({ mode: terminal.obs.mode, stage: terminal.obs.stage, present: terminal.obs.present }))
  const portDeleted = await page.evaluate(() => typeof window.__torqueNarrative === 'undefined')
  c('mql-downgrade: telemetry port deleted on terminal teardown', Boolean(portDeleted) && terminal.obs.sceneCount === 0, 'deleted=' + portDeleted + ' sceneCount=' + terminal.obs.sceneCount)
  const disposedDiagnostics = await retainedPort.evaluate((port) => port.diagnostics())
  state.disposedDiagnostics = disposedDiagnostics
  const ownedFields = ['activeConductors', 'lenisInstances', 'lenisScrollHandlers', 'tickerCallbacks', 'scrollTriggers', 'domListeners', 'storeLifecycleSubscriptions']
  c('mql-downgrade: all scoped owned conductor resources released', ownedFields.every((field) => disposedDiagnostics[field] === 0) && disposedDiagnostics.disposeCount === finalDiagnostics.disposeCount + 1 && disposedDiagnostics.cleanupFailureCount === 0, JSON.stringify(disposedDiagnostics))
  await retainedPort.dispose()
  c('mql-downgrade: exactly one Scene request total (no re-import after downgrade)', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  c('mql-downgrade: last readable diagnostics show one mount, zero actives-candidate churn markers preserved', Boolean(finalDiagnostics) && finalDiagnostics.mountCount === 1, JSON.stringify(finalDiagnostics))
  // Terminal seal: scroll after downgrade never resurrects the conductor.
  await wheelBurst(page, Array(6).fill(240))
  await settleBounded(page)
  await sleep(SEAL_WINDOW_MS)
  await flushProbe(page)
  const after = await readNarrative(page)
  c('mql-downgrade: port stays deleted and no Scene re-request after post-downgrade scroll (terminal path)', !after.present && state.sceneModule.requests.length === 1, JSON.stringify({ present: after.present, sceneRequests: state.sceneModule.requests.length }))
  await assertCommonLive(after, state, c)
}

async function stepInjectedFailure(page, state, c, plan, hold, build, sceneRequestSeen, kind) {
  // While the Scene response is held, capture the pre-fallback document state.
  const heldObs = await readNarrative(page)
  c('failure case: port absent while the Scene response is held', Boolean(heldObs) && !heldObs.present, JSON.stringify({ mode: heldObs.mode, present: heldObs.present }))
  const seen = await sceneRequestSeen
  c('failure case: exact Scene request observed before release', Boolean(seen), seen ? seen.url() : 'never observed (timeout)')
  hold.resolve()
  const terminal = await waitTerminalStatic(page)
  c(kind + ': semantic fallback reaches terminal static poster', terminal.ok, JSON.stringify({ mode: terminal.obs.mode, stage: terminal.obs.stage, present: terminal.obs.present }))
  c(kind + ': telemetry port absent after terminal fallback (never installed or deleted)', !terminal.obs.present && terminal.obs.sceneCount === 0, JSON.stringify({ present: terminal.obs.present, sceneCount: terminal.obs.sceneCount }))
  c(kind + ': exactly one Scene request and no response body committed', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  const correlated = consoleErrorsCorrelated(state, kind === 'throw' ? RENDER_THROW_MARKER : null, build.scenePath)
  c(kind + ': console errors all correlate to the exact Scene failure', correlated, JSON.stringify(state.consoleErrors))
  c(kind + ': zero uncaught page errors (SceneBoundary catches)', state.pageErrors.length === 0, JSON.stringify(state.pageErrors))
  // Terminal seal: nothing re-imports after fallback + scroll.
  await wheelBurst(page, Array(6).fill(240))
  await settleBounded(page)
  await sleep(SEAL_WINDOW_MS)
  await flushProbe(page)
  const after = await readNarrative(page)
  c(kind + ': no additional Scene requests after post-failure scroll (cadGate seal)', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  c(kind + ': port stays absent across post-failure scroll', !after.present, 'present=' + after.present)
  await assertCommonLive(after, state, c, { marker: kind === 'throw' ? RENDER_THROW_MARKER : null, scenePath: build.scenePath })
}

// ---- Case runner (watchdog owns the case; every path closes its context) ----

function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function caseUrl(plan, baseUrl) {
  const u = new URL(baseUrl)
  if (plan.suffix === 'poster-explicit') u.searchParams.set('quality', 'poster')
  return u
}

async function runCaseOnContext(context, page, plan, baseUrl, build, state, c, hold) {
  attachCollectors(page, state, build.scenePath)
  await page.addInitScript(PROBE_INIT)
  let sceneRequestSeen = null
  const kind = plan.suffix === 'scene-import-abort' ? 'abort' : plan.suffix === 'scene-render-throw' ? 'throw' : null
  if (kind) {
    await context.route((url) => url.pathname === build.scenePath, async (route) => {
      await hold.promise
      if (kind === 'abort') await route.abort()
      else await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: RENDER_THROW_MODULE })
    })
    sceneRequestSeen = page.waitForRequest((r) => {
      try {
        return new URL(r.url()).pathname === build.scenePath
      } catch {
        return false
      }
    }, { timeout: STAGE_TIMEOUT_MS }).catch(() => null)
  }
  const response = await page.goto(caseUrl(plan, baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
  c('document responds 200', Boolean(response) && response.status() === 200, 'status=' + (response ? response.status() : 'none'))
  const finalUrl = new URL(page.url())
  c('document is the private /torque-wrench page', finalUrl.pathname === '/torque-wrench' || finalUrl.pathname === '/torque-wrench/', page.url())
  const served = await page.content()
  const verdict = entrySrcVerdict(served, build.expectedModuleSrc)
  c('served module entry is the exact expected identity (dev client ignored)', verdict.ok, 'candidates=' + verdict.candidates.join(','))
  if (plan.suffix === 'live-conductor-forward') await stepLiveConductorForward(page, state, c, plan, baseUrl, build)
  else if (plan.suffix === 'live-keyboard-inputs') await stepLiveKeyboard(page, state, c, build)
  else if (plan.suffix === 'live-scrollbar-drag') await stepLiveScrollbarDrag(page, state, c, build)
  else if (plan.suffix === 'live-equality') await stepLiveEquality(page, state, c, build)
  else if (plan.suffix === 'poster-explicit') await stepPosterExplicit(page, state, c, build)
  else if (plan.suffix === 'reduced-motion') await stepReducedFresh(page, state, c, build)
  else if (plan.suffix === 'mql-downgrade') await stepMqlDowngrade(page, state, c, build)
  else await stepInjectedFailure(page, state, c, plan, hold, build, sceneRequestSeen, kind)
}

async function runCaseGuarded(browser, plan, baseUrl, build) {
  const state = newCollectors()
  const assertions = []
  const c = (name, pass, detail) => check(assertions, name, pass, detail)
  const vp = VIEWPORTS[plan.viewport]
  const started = Date.now()
  const control = { cancelled: false }
  let context = null
  const hold = plan.suffix === 'scene-import-abort' || plan.suffix === 'scene-render-throw' ? deferred() : null
  const releaseHold = () => {
    if (hold) hold.resolve()
  }
  let timer = null
  const inner = (async () => {
    try {
      context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        serviceWorkers: 'block',
        reducedMotion: plan.suffix === 'reduced-motion' ? 'reduce' : 'no-preference',
      })
      if (control.cancelled) return true
      const page = await context.newPage()
      if (control.cancelled) return true
      if (plan.suffix === 'mql-downgrade') await page.emulateMedia({ reducedMotion: 'no-preference' })
      await runCaseOnContext(context, page, plan, baseUrl, build, state, c, hold)
      return true
    } catch (error) {
      c('case completed without harness exception', false, String((error && error.stack) || error))
      return false
    } finally {
      releaseHold()
      if (context) await context.close().catch(() => {})
    }
  })()
  const watchdog = new Promise((resolve) => {
    timer = setTimeout(() => {
      control.cancelled = true
      resolve({ watchdog: true })
    }, CASE_WATCHDOG_MS)
  })
  let raced
  try {
    raced = await Promise.race([inner, watchdog])
  } finally {
    clearTimeout(timer)
  }
  if (raced && raced.watchdog) {
    releaseHold()
    control.cancelled = true
    if (context) await context.close().catch(() => {})
    await Promise.race([inner.catch(() => {}), sleep(2000)])
    return {
      id: plan.id,
      viewport: vp.label,
      kind: plan.suffix,
      url: caseUrl(plan, baseUrl).toString(),
      status: 'FAIL',
      durationMs: CASE_WATCHDOG_MS,
      assertions: [{ name: 'case watchdog', pass: false, detail: 'exceeded ' + CASE_WATCHDOG_MS + 'ms; hold released and context closed by watchdog' }],
      observations: { note: 'watchdog; partial collectors discarded' },
    }
  }
  const ok = assertions.length > 0 && assertions.every((a) => a.pass)
  return {
    id: plan.id,
    viewport: vp.label,
    kind: plan.suffix,
    url: caseUrl(plan, baseUrl).toString(),
    status: ok ? 'PASS' : 'FAIL',
    durationMs: Date.now() - started,
    assertions,
    observations: {
      sceneIdentity: build.scenePath,
      finalDiagnostics: state.finalDiagnostics || null,
      disposedDiagnostics: state.disposedDiagnostics || null,
      sceneModuleRequests: state.sceneModule.requests,
      sceneModuleResponses: state.sceneModule.responses,
      sceneModuleRequestFailed: state.sceneModule.requestFailed,
      sceneShapedUnidentified: state.sceneShaped,
      cadRequests: state.cadRequests,
      httpErrors: state.httpErrors,
      consoleErrors: state.consoleErrors,
      pageErrors: state.pageErrors,
      requestFailed: state.requestFailed,
    },
  }
}

function defaultReportPath() {
  return path.join(DEFAULT_OUT_DIR, 'report-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')
}

async function writeReport(report, outPath) {
  try {
    mkdirSync(path.dirname(outPath), { recursive: true })
    writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n')
    return outPath
  } catch (error) {
    console.error('INTERNAL: cannot write report ' + outPath + ' - ' + error)
    process.exit(EXIT.INTERNAL)
  }
}

async function main() {
  const args = parseArgs()
  const requireValue = (key) => {
    const value = args[key]
    if (typeof value !== 'string' || value.trim() === '') usage('--' + key + ' requires a non-empty value')
    return value
  }
  const rejectValue = (key) => {
    if (args[key] !== undefined && args[key] !== true) usage('--' + key + ' is a flag and takes no value')
  }
  rejectValue('help')
  const urlArg = args.url !== undefined ? requireValue('url') : null
  if (!urlArg) usage('runtime mode requires --url')
  const outArg = args.out !== undefined ? requireValue('out') : null
  const onlyArg = args.only !== undefined ? requireValue('only') : null
  const viewportArg = args.viewport !== undefined ? requireValue('viewport') : null
  const buildDirArg = args['build-dir'] !== undefined ? requireValue('build-dir') : null
  const baseUrl = validateStrictUrl(urlArg)
  const outPath = outArg ? validateOut(outArg) : null
  const viewportKeys = viewportArg ? [validateViewport(viewportArg)] : Object.keys(VIEWPORTS)
  const only = onlyArg ? validateOnly(onlyArg) : null
  const buildDir = buildDirArg ? validateBuildDir(buildDirArg) : null
  // A filtered roster that selects nothing is a usage error, never an empty passing run.
  const plans = buildPlans(viewportKeys, only)
  if (plans.length === 0) usage('--viewport/--only combination selects no case')

  const pre = runPreflight()
  if (!pre.ok) {
    for (const c of pre.checks) if (!c.pass) console.error('PREFLIGHT BLOCKED  ' + c.name + (c.detail ? ' - ' + c.detail : ''))
    console.error('PREFLIGHT: BLOCKED - parent integration markers absent; refusing to run cases (fail-closed, exit 10).')
    process.exit(EXIT.PREFLIGHT)
  }

  let playwright
  let launchConfig
  try {
    playwright = await import('playwright')
    const lib = await import('./lib/browser-launch.mjs')
    launchConfig = lib.launchConfig
  } catch (error) {
    console.error('BLOCKED: playwright/browser-launch unavailable - ' + error)
    process.exit(EXIT.BLOCKED)
  }

  const build = buildDir ? loadBuildGraph(buildDir) : { mode: 'dev', expectedModuleSrc: MODULE_SRC, scenePath: DEV_SCENE_PATH, entryAsset: null }
  if (build.error) {
    console.error(build.error)
    process.exit(EXIT.BLOCKED)
  }

  let assetIdentity = null
  if (build.mode === 'built') {
    try {
      const verified = await verifyBuiltAssets(playwright, baseUrl.toString(), build)
      if (verified.error) {
        console.error(verified.error)
        process.exit(EXIT.BLOCKED)
      }
      assetIdentity = verified.identity
    } catch (error) {
      console.error('BLOCKED: asset identity verification failed - ' + error)
      process.exit(EXIT.BLOCKED)
    }
  }

  try {
    const served = await servedPreflight(playwright, baseUrl.toString(), build.expectedModuleSrc)
    if (!served.ok) {
      console.error('BLOCKED: served document is not the coordinated private torque page (status ' + served.status + ', url ' + served.finalUrl + ', module candidates ' + served.candidates.join(',') + ', expected ' + build.expectedModuleSrc + ').')
      process.exit(EXIT.BLOCKED)
    }
  } catch (error) {
    console.error('BLOCKED: cannot reach ' + baseUrl.toString() + ' - ' + error)
    process.exit(EXIT.BLOCKED)
  }

  let browser = null
  const report = {
    harness: 'verify-torque-timeline',
    capturedAt: new Date().toISOString(),
    url: baseUrl.toString(),
    mode: build.mode,
    buildDir: build.buildDir || null,
    sceneIdentity: build.scenePath,
    expectedModuleSrc: build.expectedModuleSrc,
    viewports: viewportKeys.map((k) => VIEWPORTS[k].label),
    roster: plans.map((p) => p.id),
    inputContract: 'native input only: page.mouse.wheel, page.keyboard, scrollbar mouse drag, page.emulateMedia (real MQL), window.scrollTo direct seek; store setters and port mutation are never called; samples taken only after bounded settling',
    diagnosticsContract: {
      fields: DIAGNOSTIC_FIELDS,
      scope: 'scoped lifecycle accounting from the page store; NOT an independent browser-global census',
      teardownNote: 'public port deleted on unmount; MQL retains a read-only getter handle for scoped post-teardown diagnostics',
    },
    playwrightVersion: pre.playwrightVersion,
    launchConfig: { ...launchConfig(), ignoreDefaultArgs: ['--hide-scrollbars'] },
    glRenderer: 'unmeasured (Stage 2 Scene is zero-GPU placeholder; no hardware or software rendering claim; configuration only)',
    assetIdentity: assetIdentity || { mode: 'dev', note: 'dev source-graph identity only; no byte-hash claim' },
    browserVersion: null,
    dependencies: DEPENDENCIES,
    limits: LIMITS,
    preflight: pre.checks,
    cases: [],
    result: null,
  }
  try {
    browser = await playwright.chromium.launch(report.launchConfig)
    report.browserVersion = browser.version()
    for (const plan of plans) {
      const entry = await runCaseGuarded(browser, plan, baseUrl.toString(), build)
      report.cases.push(entry)
      console.log(entry.status + '  ' + entry.id + ' (' + entry.durationMs + 'ms)')
    }
  } catch (error) {
    console.error('BLOCKED: browser environment - ' + error)
    report.result = 'BLOCKED'
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // leaving; nothing to conclude from a close failure
      }
    }
  }

  if (report.result === 'BLOCKED') {
    const written = await writeReport(report, outPath || defaultReportPath())
    console.log('report: ' + written)
    process.exit(EXIT.BLOCKED)
  }

  const failed = report.cases.filter((c) => c.status !== 'PASS')
  report.summary = { total: report.cases.length, passed: report.cases.length - failed.length, failed: failed.length }
  report.result = failed.length === 0 && report.cases.length > 0 ? 'PASS' : 'FAIL'
  const written = await writeReport(report, outPath || defaultReportPath())
  console.log('result: ' + report.result + ' (' + report.summary.passed + '/' + report.summary.total + ' cases PASS)')
  console.log('report: ' + written)
  process.exit(report.result === 'PASS' ? EXIT.PASS : EXIT.FAIL)
}

main().catch((error) => {
  console.error('INTERNAL: ' + String((error && error.stack) || error))
  process.exit(EXIT.INTERNAL)
})
