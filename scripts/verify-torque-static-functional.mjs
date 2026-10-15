// JG-038 static-functional family: copy of frozen verify-torque-static.mjs.
// Source SHA256 at copy: 794cb9a92590ed9c99c2374999f05a74fa5e2ffc61eb17dc30a1d5ccf76a6e1d
// Correction: MQL starts from an observed ready live world; initialization CAD requests
// are retained, while NEW Scene/CAD/decoder requests after downgrade/restoration fail.
// Static poster cases still require zero CAD/decoder requests from initialization.
//
// Modes:
//   node scripts/verify-torque-static-functional.mjs --help
//   node scripts/verify-torque-static-functional.mjs --preflight
//   node scripts/verify-torque-static-functional.mjs --url=http://localhost:<port>/torque-wrench/ [--out=<report.json>] [--only=<id,id>] [--viewport=D|N] [--build-dir=<scratch build root>]
//
// Contract sources: docs/torque-wrench-rebuild/18 (case matrix: D 1440x900 DPR1 desktop,
// N 390x844 DPR3 touch/mobile), 04-stage1-foundation/shell-activation-packet.md (HTML pins),
// src/shared/pageTopology.test.ts (fade-block hash + real-head noindex logic), and the parent
// interface contract: Playwright route interception of the exact lazy Scene module
// (route.abort = import rejection; fulfilled controlled ESM whose default export throws =
// render failure), serviceWorkers:'block', response release only AFTER DOM identity /
// disclosure / focus capture, response-status auditing, finite timeouts only.
//
// Scene module identity is EXACT, never a filename guess: dev mode matches the exact source
// path /src/scene/torque-wrench/Scene.tsx; built mode (--build-dir) reads the Vite manifest,
// requires the torque-wrench/index.html entry, and requires its dynamicImports to contain the
// Scene source key, then uses that chunk's served file. Requests that merely look Scene-shaped
// but do not match the derived identity are recorded and fail the case.
// In built mode the entry and Scene asset bytes are sha256-verified against the served
// documents before any browser launch; byte-identity claims are made only from that check.
//
// --build-dir is optional, must resolve inside this worktree's .scratch (realpath checked),
// and is read-only for the harness; the harness never runs a build subprocess.
//
// The harness targets ONLY the real coordinated private HTML: --url must be a loopback host
// with the exact /torque-wrench path and no query/hash; case URLs are derived with the URL
// API. The served document must carry the pinned fade-block markers, a real head robots
// noindex meta, and exactly the expected module src. Anything else fails closed.
//
// Deliberate limits (reported, never dropped silently): no actual WebGL initialization or
// context-loss acceptance - the Stage 1 Scene is a zero-Canvas placeholder, so those cases
// are deferred until the narrative renderer exists. OffscreenCanvas constructions are counted
// in the window; worker-internal OffscreenCanvas use is not page-observable. Document
// canvases (mounts and removals) are observed from document start via an init script observing
// document (documentElement-independent). GL renderer is unmeasured: the launch configuration
// is reported as configuration only and never as a hardware-rendering claim. No production
// hooks: every failure is induced through route interception only.
//
// Exit codes: 0 all cases PASS | 1 at least one case FAIL | 2 usage error |
// 10 preflight blocked (activation absent or mismatched; nothing ran) |
// 11 environment blocked (playwright/browser/server/build manifest; nothing concluded) |
// 12 internal error writing the report.

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const RUNTIME_DIR = path.join(ROOT, 'project', 'work', 'evidence', 'torque-wrench-rebuild', '08-stage4-opening-recovery')
const COPIED_SOURCE_SHA256 = '794cb9a92590ed9c99c2374999f05a74fa5e2ffc61eb17dc30a1d5ccf76a6e1d'
const SCRATCH_ROOT = path.resolve(ROOT, '.scratch')

const TORQUE_HTML = path.join(ROOT, 'torque-wrench', 'index.html')
const MODULE_SRC = '/src/torque-wrench-main.tsx'
const MODULE_FILE = path.join(ROOT, 'src', 'torque-wrench-main.tsx')
const DEV_SCENE_PATH = '/src/scene/torque-wrench/Scene.tsx'
// Pinned fade sub-block hash from pageTopology.test.ts (CRLF-normalized sha256).
const FADE_BLOCK_SHA256 = 'e30f6045d8cfdb71a93e4c8a3af806e9699fa7f13da28720a3f507ce79bfc05b'

// Contract 18 approved primary viewports (H/L supplemental are out of this harness scope).
const VIEWPORTS = {
  D: { key: 'D', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false, label: 'D 1440x900 DPR1 desktop' },
  N: { key: 'N', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true, label: 'N 390x844 DPR3 touch/mobile' },
}

const CHAPTER_ORDER = ['drafting', 'breakthrough', 'mechanism', 'inspection', 'close']

// Filename-shape heuristic only: used to detect Scene-shaped requests that do NOT match the
// exact derived identity (dev source path or manifest chunk file). Never used to accept.
const SCENE_SHAPE_RE = /(?:^|\/)(?:src\/scene\/torque-wrench\/Scene(?:\.[tj]sx?)?|assets\/Scene-[\w.-]+\.js)$/
const SCENE_SOURCE_KEY_RE = /^src\/scene\/torque-wrench\/Scene\.[tj]sx?$/
// Narrative bytes only. A shared DRACOLoader *code chunk* is not a CAD/decoder asset;
// Vite's dynamic-import helper can start that code request before an intercepted Scene
// request fails, especially under route-held module graphs.
const CAD_REQUEST_RE = /(\.glb($|\?)|\.gltf($|\?)|\.bin($|\?)|\/draco\/(?:draco_decoder(?:_geometry)?\.wasm|draco_wasm_wrapper\.js)|ktx2|basis|\/models\/)/i

const EXIT = { PASS: 0, FAIL: 1, USAGE: 2, PREFLIGHT: 10, BLOCKED: 11, INTERNAL: 12 }
const NAV_TIMEOUT_MS = 30000
const STAGE_TIMEOUT_MS = 20000
const UI_TIMEOUT_MS = 5000
const FLUSH_TIMEOUT_MS = 2000
const CASE_WATCHDOG_MS = 180000
// Bounded post-failure observation window proving no further Scene/CAD fetches (a seal
// signal, not a readiness sleep; fallback state itself is awaited event-driven above).
const SEAL_WINDOW_MS = 750

const KNOWN_FLAGS = new Set(['help', 'preflight', 'url', 'out', 'only', 'viewport', 'build-dir'])
const KNOWN_CASE_SUFFIXES = ['static-full', 'lite', 'poster-explicit', 'reduced-motion', 'scene-import-abort', 'scene-render-throw', 'scene-mql-downgrade']

// Harness-served controlled ESM for the render-failure case. Not a production hook.
const RENDER_THROW_MARKER = 'TORQUE_STATIC_RENDER_FAILURE_INJECTION'
const RENDER_THROW_MODULE = [
  '// verify-torque-static-functional controlled render-failure injection (harness-served only).',
  'const FAILURE = new Error(' + JSON.stringify(RENDER_THROW_MARKER) + ')',
  'export default function TorqueScene() { throw FAILURE }',
].join('\n')

// Injected cases allow ONLY console errors correlated to the exact Scene failure: text
// containing the injection marker or the exact Scene URL (Chromium import-failure text embeds
// the failing module URL), or a console location on the Scene URL. Anything unrelated fails.
// Uncaught page errors fail in EVERY case: SceneBoundary must catch render throws.

const USAGE = [
  'usage: node scripts/verify-torque-static-functional.mjs --help',
  '       node scripts/verify-torque-static-functional.mjs --preflight',
  '       node scripts/verify-torque-static-functional.mjs --url=http://localhost:<port>/torque-wrench/ [--out=<report.json>] [--only=<id,id>] [--viewport=D|N] [--build-dir=<scratch build root>]',
  '',
  '--url: loopback host only, exact /torque-wrench path, no query/hash (modes add quality via the URL API).',
  '--build-dir: optional scratch production build root inside this worktree .scratch (read-only, manifest-based Scene identity).',
  'Cases per viewport: ' + KNOWN_CASE_SUFFIXES.join(', ') + '.',
  'Exit codes: 0 PASS, 1 FAIL, 2 usage, 10 preflight blocked, 11 environment blocked, 12 internal.',
].join('\n')

function usage(why, code) {
  const exitCode = code === undefined ? EXIT.USAGE : code
  if (why) console.error(why)
  console[exitCode === EXIT.PASS ? 'log' : 'error'](USAGE)
  process.exit(exitCode)
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

function stripHtmlComments(text) {
  return text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\n)[ \t]*\/\/[^\n]*/g, '$1')
}

function between(text, begin, end) {
  const from = text.indexOf(begin)
  const to = text.indexOf(end)
  if (from === -1 || to === -1 || to < from) return null
  return text.slice(from, to + end.length)
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex')

function hasNoindex(html) {
  const head = (/<head\b[\s\S]*?<\/head>/i.exec(stripHtmlComments(html)) || [])[0] || ''
  return /<meta\s+name="robots"\s+content="[^"]*noindex[^"]*"/i.test(head)
}

// External module-script srcs, tolerant of attribute order, extra attributes (crossorigin
// etc.), and quote style. Inline module scripts (no src) are skipped. Vite dev injects
// /@vite/client as its own module tag, so consumers select the expected entry among
// candidates instead of requiring exactly one module tag overall.
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

const VITE_DEV_CLIENT_RE = /(^|\/)(@vite\/|@react-refresh)|@vite\/client/i

function entrySrcVerdict(html, expected) {
  const srcs = collectModuleSrcs(html)
  const candidates = srcs.filter((s) => !VITE_DEV_CLIENT_RE.test(s))
  return { srcs, candidates, ok: candidates.length === 1 && candidates[0] === expected }
}

// ---- Preflight: fail-closed activation audit. Pure filesystem + package resolve. No browser. ----

function registryTorqueRow() {
  const src = readFileSync(path.join(ROOT, 'src', 'shared', 'pages.ts'), 'utf8')
  const start = src.indexOf("id: 'torque-wrench'")
  if (start === -1) return null
  const end = src.indexOf('},', start)
  return end === -1 ? null : src.slice(start, end)
}

export function runPreflight() {
  const checks = []
  const add = (name, pass, detail) => check(checks, name, pass, detail)

  let playwrightVersion = null
  try {
    const require = createRequire(import.meta.url)
    const pkgPath = require.resolve('playwright/package.json')
    playwrightVersion = JSON.parse(readFileSync(pkgPath, 'utf8')).version || null
    add('playwright package resolvable', true, 'version ' + (playwrightVersion || 'unknown'))
  } catch (error) {
    add('playwright package resolvable', false, String(error))
  }

  if (!existsSync(TORQUE_HTML)) {
    add('torque-wrench/index.html exists (activation applied)', false, 'BLOCKED: activation is owner-coordinated and not applied in this worktree yet')
    return { ok: false, blockedActivation: true, checks, playwrightVersion }
  }
  add('torque-wrench/index.html exists (activation applied)', true)

  const html = readFileSync(TORQUE_HTML, 'utf8')
  const count = (text, needle) => text.split(needle).length - 1
  add('exactly one shell block', count(html, '<!-- shell:begin -->') === 1 && count(html, '<!-- shell:end -->') === 1)
  const shell = between(html, '<!-- shell:begin -->', '<!-- shell:end -->')
  add('shell block found', shell !== null)
  const fade = between(html, '<!-- shell:fade:begin -->', '<!-- shell:fade:end -->')
  add('fade sub-block present', fade !== null)
  if (fade) {
    const normalized = fade.replace(/\r\n/g, '\n')
    add('fade sub-block matches pinned sha256', sha256(normalized) === FADE_BLOCK_SHA256, sha256(normalized))
  }
  add('real head robots noindex meta (comments stripped)', hasNoindex(html))
  const entryVerdict = entrySrcVerdict(html, MODULE_SRC)
  add('module entry is exactly ' + MODULE_SRC + ' (attr-order tolerant, dev client excluded)', entryVerdict.ok, 'candidates=' + entryVerdict.candidates.join(','))
  add('private module file exists', existsSync(MODULE_FILE), MODULE_FILE)
  add('no legacy redirect block (root index.html only)', between(html, '<!-- shell:redirect:begin -->', '<!-- shell:redirect:end -->') === null)

  const row = registryTorqueRow()
  add('registry row torque-wrench found', row !== null)
  if (row) {
    add("registry row active: href '/torque-wrench/'", /href:\s*'\/torque-wrench\/'/.test(row))
    add("registry row active: htmlEntry 'torque-wrench/index.html'", /htmlEntry:\s*'torque-wrench\/index\.html'/.test(row))
    add('registry row active: reserved false', /reserved:\s*false/.test(row))
    add('registry row keeps private true (never in public nav)', /private:\s*true/.test(row))
    add('registry row keeps fadeIn true', /fadeIn:\s*true/.test(row))
  }

  // Post-activation pins per shell-activation-packet.md; they change WITH the registry row via
  // the shell owner. A mismatch fails closed naming the exact expectation.
  const pagesTest = readFileSync(path.join(ROOT, 'src', 'shared', 'pages.test.ts'), 'utf8')
  add('pages.test.ts torque pin updated to the active row', pagesTest.includes("htmlEntry: 'torque-wrench/index.html'") && pagesTest.includes("href: '/torque-wrench/'") && !pagesTest.includes('private and inactive'))
  const topologyTest = readFileSync(path.join(ROOT, 'src', 'shared', 'pageTopology.test.ts'), 'utf8')
  add("pageTopology.test.ts entries pin includes 'torque-wrench/index.html'", topologyTest.includes("'torque-wrench/index.html'"))

  return { ok: checks.every((c) => c.pass), blockedActivation: false, checks, playwrightVersion }
}

// ---- Argument validation (usage errors take precedence over preflight) ----

function validateStrictUrl(raw) {
  let u
  try {
    u = new URL(raw)
  } catch (e) {
    usage('bad --url: ' + e.message)
  }
  const loopback = new Set(['localhost', '127.0.0.1', '::1'])
  if (!/^https?:$/.test(u.protocol)) usage('--url must be http(s) on a loopback host')
  if (!loopback.has(u.hostname)) usage('--url host must be loopback (localhost, 127.0.0.1, or ::1); got ' + u.hostname)
  if (u.pathname !== '/torque-wrench' && u.pathname !== '/torque-wrench/') usage('--url path must be exactly /torque-wrench (no extra segments)')
  if (u.search || u.hash) usage('--url must not carry a query or hash; modes add quality via the URL API')
  return new URL(u.origin + '/torque-wrench/')
}

function validateOut(outArg) {
  const resolved = path.resolve(outArg)
  const parent = path.dirname(resolved)
  if (!existsSync(parent)) usage('--out parent directory does not exist (no directories are created for explicit --out): ' + parent)
  let realParent
  try {
    realParent = realpathSync(parent)
  } catch (e) {
    usage('--out parent cannot be resolved: ' + e.message)
  }
  let realRuntime = RUNTIME_DIR
  try {
    realRuntime = realpathSync(RUNTIME_DIR)
  } catch {
    usage('owned runtime directory is missing: ' + RUNTIME_DIR)
  }
  if (realParent !== realRuntime && !realParent.startsWith(realRuntime + path.sep)) usage('--out must stay inside the owned runtime dir: ' + RUNTIME_DIR)
  if (existsSync(resolved)) usage('--out already exists; preserve evidence and choose a NEW file: ' + resolved)
  if (existsSync(resolved)) {
    const st = lstatSync(resolved)
    if (st.isDirectory()) usage('--out must be a file path, not a directory: ' + resolved)
    const realTarget = realpathSync(resolved)
    if (realTarget !== realRuntime && !realTarget.startsWith(realRuntime + path.sep)) usage('--out resolves through a symlink outside the owned runtime dir: ' + realTarget)
    if (!st.isFile() && !st.isSymbolicLink()) usage('--out target is not a regular file: ' + resolved)
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

// Built-mode graph identity from the Vite manifest (read-only; no build subprocess here).
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
  return {
    mode: 'built',
    buildDir,
    expectedModuleSrc: '/' + entry.file,
    scenePath: '/' + manifest[sceneKey].file,
    entryAsset: '/' + entry.file,
  }
}

// ---- Runtime collectors ----

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
    const contentType = res.headers()['content-type'] || ''
    state.responses.push({ url, status: res.status(), contentType })
    if (res.status() >= 400) state.httpErrors.push({ url, status: res.status() })
    if (p === scenePath) {
      state.sceneModule.responses.push({ url, status: res.status(), contentType })
      try {
        state.sceneModule.bodies.push(await res.text())
      } catch {
        state.sceneModule.bodies.push('')
      }
    }
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

// Init script: observes document (documentElement-independent) BEFORE any page script runs,
// recording document canvas mounts AND removals; same-delivery subtree removals are counted in
// the same mutation record batch. OffscreenCanvas is counted in the window only.
const PROBE_INIT = () => {
  const probe = { canvasMounts: [], canvasRemovals: 0, offscreenCanvasConstructions: 0 }
  Object.defineProperty(window, '__torqueProbe', { value: probe, configurable: false })
  const isCanvas = (node) => Boolean(node && node.nodeName === 'CANVAS')
  const record = (node) => probe.canvasMounts.push({ t: Math.round(performance.now()), id: node.id || null, cls: (node.getAttribute && node.getAttribute('class')) || null })
  const scan = (root) => {
    if (root && root.querySelectorAll) {
      const found = root.querySelectorAll('canvas')
      for (const c of found) record(c)
    }
  }
  scan(document)
  const observer = new MutationObserver((mutations) => {
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
  })
  observer.observe(document, { childList: true, subtree: true })
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

// MutationObserver deliveries are async; flush pending deliveries with two animation frames
// (bounded) before any probe assertion reads counts.
async function flushProbe(page) {
  await Promise.race([
    page.evaluate(() => new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))
      else setTimeout(() => resolve(true), 50)
    })),
    new Promise((resolve) => setTimeout(() => resolve(false), FLUSH_TIMEOUT_MS)),
  ])
}

// Bounded Node-side condition wait (for async collectors such as response bodies). Finite only.
async function waitForCondition(fn, timeoutMs) {
  const started = Date.now()
  let ok = fn()
  while (!ok && Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    ok = fn()
  }
  return ok
}

const stageIs = (page, value) =>
  page.waitForFunction(
    (v) => {
      const stage = document.querySelector('.torque-stage')
      return Boolean(stage) && stage.getAttribute('data-torque-stage') === v
    },
    value,
    { timeout: STAGE_TIMEOUT_MS, polling: 100 },
  )

const chaptersReady = (page) =>
  page.waitForFunction(() => document.querySelectorAll('.torque-chapter').length === 5, undefined, { timeout: NAV_TIMEOUT_MS, polling: 100 })

// Real keyboard only: no helper focus() evaluation anywhere in this harness.
async function keyboardFocus(page, selector, maxTabs) {
  const cap = maxTabs || 14
  for (let presses = 1; presses <= cap; presses++) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate((sel) => Boolean(document.activeElement && document.activeElement.matches(sel)), selector)
    if (focused) return presses
  }
  return -1
}

// Retains actual in-page Element refs (identity witness) plus disclosure/focus state.
async function captureStoryState(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    window.__torqueIdentity = {
      story: document.getElementById('torque-story'),
      chapters: Array.prototype.slice.call(document.querySelectorAll('.torque-chapter')),
      toggle: q('.torque-inspection__toggle'),
      panel: document.getElementById('torque-inspection-detail'),
      stage: q('.torque-stage'),
      footer: q('.torque-footer'),
    }
    return {
      captured: Boolean(window.__torqueIdentity.story && window.__torqueIdentity.toggle),
      expanded: q('.torque-inspection__toggle') ? q('.torque-inspection__toggle').getAttribute('aria-expanded') : null,
      focusedIsToggle: document.activeElement === q('.torque-inspection__toggle'),
    }
  })
}

async function storyStatePreserved(page) {
  return page.evaluate(() => {
    const d = window.__torqueIdentity
    const q = (s) => document.querySelector(s)
    if (!d || !d.story) return { preserved: false, reason: 'identity was not captured before the transition', disclosureStillOpen: false, focusedStillToggle: false }
    const chaptersNow = Array.prototype.slice.call(document.querySelectorAll('.torque-chapter'))
    const preserved =
      d.story === document.getElementById('torque-story') &&
      d.toggle === q('.torque-inspection__toggle') &&
      d.panel === document.getElementById('torque-inspection-detail') &&
      d.stage === q('.torque-stage') &&
      d.footer === q('.torque-footer') &&
      d.chapters.length === chaptersNow.length &&
      d.chapters.every((c, i) => c === chaptersNow[i])
    return {
      preserved,
      reason: preserved ? '' : 'retained Element refs no longer match the live DOM (Story remounted)',
      disclosureStillOpen: Boolean(q('.torque-inspection__toggle')) && q('.torque-inspection__toggle').getAttribute('aria-expanded') === 'true',
      focusedStillToggle: document.activeElement === q('.torque-inspection__toggle'),
    }
  })
}

async function assertSharedStructure(page, c) {
  const order = await page.evaluate(() =>
    Array.prototype.slice.call(document.querySelectorAll('.torque-chapter')).map((s) => {
      const m = /torque-chapter-([a-z]+)-title/.exec(s.getAttribute('aria-labelledby') || '')
      return m ? m[1] : ''
    }),
  )
  c('chapter order drafting,breakthrough,mechanism,inspection,close', order.join(',') === CHAPTER_ORDER.join(','), order.join(','))
  const nav = await page.evaluate(() => ({
    torqueLinks: document.querySelectorAll('a[href^="/torque-wrench"]').length,
    headerNav: Boolean(document.querySelector('header .shell-nav')),
    m249Reserved: Array.prototype.some.call(document.querySelectorAll('.shell-nav .shell-nav-reserved'), (el) => /m249/i.test(el.textContent || '')),
  }))
  c('private page excluded from public nav (no torque anchors)', nav.torqueLinks === 0 && nav.headerNav, 'torqueLinks=' + nav.torqueLinks)
  c('m249 still rendered as reserved text', nav.m249Reserved)
  const footer = await page.evaluate(() => {
    const f = document.querySelector('.torque-footer')
    if (!f) return { present: false }
    f.scrollIntoView({ block: 'center' })
    const r = f.getBoundingClientRect()
    return {
      present: true,
      inViewport: r.top < window.innerHeight && r.bottom > 0,
      anchors: f.querySelectorAll('a[href]').length,
      colophon: Boolean(f.querySelector('.torque-colophon')),
    }
  })
  c('footer reachable (in flow, enters viewport on scroll)', footer.present && footer.inViewport && footer.anchors >= 1, JSON.stringify(footer))
  c('footer colophon present', footer.present && footer.colophon)
}

async function assertCanvasActivity(page, c, state, { live = false, removedLive = false } = {}) {
  await flushProbe(page)
  const probe = await page.evaluate(() => window.__torqueProbe || null)
  c('canvas probe installed from init', Boolean(probe))
  if (probe) {
    if (live) {
      c('one live document canvas mounted and none removed', probe.canvasMounts.length === 1 && probe.canvasRemovals === 0, JSON.stringify(probe.canvasMounts))
    } else if (removedLive) {
      c('the live document canvas is removed after downgrade', probe.canvasMounts.length === 1 && probe.canvasRemovals === 1, JSON.stringify(probe.canvasMounts))
    } else {
      c('zero document canvas mounts incl. removed', probe.canvasMounts.length === 0 && probe.canvasRemovals === 0, JSON.stringify(probe.canvasMounts))
    }
    c('at most one auxiliary OffscreenCanvas construction', probe.offscreenCanvasConstructions <= 1, String(probe.offscreenCanvasConstructions))
  }
  if (live) {
    c('live narrative CAD asset initialized (request observed or browser-cached world ready)', state.worldReady === true, 'worldReady=' + String(state.worldReady) + ' requests=' + state.cadRequests.join(', '))
  } else if (removedLive) {
    c('downgrade started from a ready live world', state.worldReady === true, JSON.stringify(state.mqlTransition?.liveBeforeDowngrade || null))
    c('zero NEW narrative CAD/decoder requests after downgrade/restoration',
      Boolean(state.mqlTransition) && state.mqlTransition.afterRestore.newCadRequests.length === 0,
      JSON.stringify(state.mqlTransition?.afterRestore || null))
  } else {
    c('zero narrative CAD/decoder byte requests from initialization', state.cadRequests.length === 0, state.cadRequests.join(', '))
  }
  c('no Scene-shaped request outside the exact derived identity', state.sceneShaped.length === 0, JSON.stringify(state.sceneShaped))
}

async function assertCleanSignals(c, state) {
  c('zero HTTP error responses (>=400)', state.httpErrors.length === 0, JSON.stringify(state.httpErrors))
  c('zero console errors', state.consoleErrors.length === 0, state.consoleErrors.map((e) => e.text).join(' | '))
  c('zero uncaught page errors', state.pageErrors.length === 0, state.pageErrors.join(' | '))
}

async function assertFailureSignals(c, state, scenePath) {
  c('zero unrelated HTTP error responses (>=400)', state.httpErrors.length === 0, JSON.stringify(state.httpErrors))
  const correlated = (entry) => entry.text.indexOf(RENDER_THROW_MARKER) !== -1 || entry.text.indexOf(scenePath) !== -1 || (entry.url || '').endsWith(scenePath)
  c('console errors all correlate to the exact Scene failure', state.consoleErrors.every(correlated), JSON.stringify(state.consoleErrors))
  c('zero uncaught page errors (SceneBoundary must catch render throws)', state.pageErrors.length === 0, state.pageErrors.join(' | '))
}

async function assertPosterSlots(page, c) {
  const slots = await page.evaluate(() => ({
    ids: Array.prototype.map.call(document.querySelectorAll('[data-torque-poster]'), (el) => el.getAttribute('data-torque-poster')),
    allPending: Array.prototype.every.call(document.querySelectorAll('[data-torque-poster]'), (el) => el.getAttribute('data-torque-poster-pending') === 'stage-6'),
    canvas: document.querySelectorAll('canvas').length,
  }))
  c('five explicit poster slots in chapter order', JSON.stringify(slots.ids) === JSON.stringify(CHAPTER_ORDER), JSON.stringify(slots.ids))
  c('poster slots are explicit Stage 6 placeholders', slots.allPending)
  c('poster layer has zero live canvas elements', slots.canvas === 0, String(slots.canvas))
}

async function expandedWaits(page, value) {
  await page.waitForFunction(
    (v) => {
      const t = document.querySelector('.torque-inspection__toggle')
      return Boolean(t) && t.getAttribute('aria-expanded') === v
    },
    value,
    { timeout: UI_TIMEOUT_MS, polling: 50 },
  )
}

// Skip link is tested on the fresh page BEFORE any scroll or blur helper, so the first Tab
// claim is non-vacuous.
async function assertSkipLink(page, c) {
  const tabs = await keyboardFocus(page, '.torque-skip', 2)
  c('skip link is the first Tab stop', tabs === 1, 'tabs=' + tabs)
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => window.location.hash === '#torque-story', undefined, { timeout: UI_TIMEOUT_MS, polling: 50 })
  const focusTarget = await page.evaluate(() => (document.activeElement ? document.activeElement.id : ''))
  c('activating skip link moves focus to the story container', focusTarget === 'torque-story', 'activeElement=' + focusTarget)
}

async function assertDisclosureKeyboard(page, c) {
  const tabs = await keyboardFocus(page, '.torque-inspection__toggle')
  c('inspection toggle reachable by Tab order', tabs >= 0, 'tabs=' + tabs)
  if (tabs < 0) return
  c('disclosure initially closed', (await page.getAttribute('.torque-inspection__toggle', 'aria-expanded')) === 'false')
  c('panel initially hidden', await page.evaluate(() => Boolean(document.getElementById('torque-inspection-detail')) && document.getElementById('torque-inspection-detail').hidden === true))
  await page.keyboard.press('Enter')
  await expandedWaits(page, 'true')
  c('Enter opens disclosure', await page.evaluate(() => document.getElementById('torque-inspection-detail').hidden === false))
  await page.keyboard.press('Space')
  await expandedWaits(page, 'false')
  c('Space closes disclosure', await page.evaluate(() => document.getElementById('torque-inspection-detail').hidden === true))
  await page.keyboard.press('Space')
  await expandedWaits(page, 'true')
  c('Space reopens disclosure', true)
  // Non-vacuous Escape restoration: move focus to a different naturally reachable element
  // first, prove it moved, and only then assert Escape restores the trigger and closed state.
  await page.keyboard.press('Tab')
  const movedAway = await page.evaluate(() => {
    const t = document.querySelector('.torque-inspection__toggle')
    return Boolean(document.activeElement) && document.activeElement !== t && !(t && t.contains(document.activeElement))
  })
  c('focus moved off the trigger before Escape', movedAway)
  await page.keyboard.press('Escape')
  await expandedWaits(page, 'false')
  const restored = await page.evaluate(() => {
    const t = document.querySelector('.torque-inspection__toggle')
    const panel = document.getElementById('torque-inspection-detail')
    return Boolean(t) && document.activeElement === t && t.getAttribute('aria-expanded') === 'false' && Boolean(panel) && panel.hidden === true
  })
  c('Escape restores trigger focus and closed panel state (expanded false, hidden true)', restored)
}

// ---- Case steps ----

async function stepCleanScene(page, state, c) {
  await chaptersReady(page)
  await stageIs(page, 'scene')
  let worldReady = false
  try {
    await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready === true, undefined, { timeout: STAGE_TIMEOUT_MS, polling: 50 })
    worldReady = true
    state.worldReady = true
  } catch {
    worldReady = false
  }
  const scene = await page.evaluate(() => ({
    placeholder: Boolean(document.querySelector('[data-torque-scene="placeholder"]')),
    stage: document.querySelector('.torque-stage') ? document.querySelector('.torque-stage').getAttribute('data-torque-stage') : null,
  }))
  const liveScene = await page.evaluate(() => document.querySelector('[data-torque-scene]')?.getAttribute('data-torque-scene') === 'live')
  c('tier resolves to the ready live renderer scene', liveScene && scene.stage === 'scene', JSON.stringify(scene))
  c('lazy Scene module requested exactly once (lazy-load evidence)', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  c('no poster layer in scene mode', (await page.locator('[data-torque-poster]').count()) === 0)
  await assertSkipLink(page, c)
  await assertDisclosureKeyboard(page, c)
  await assertSharedStructure(page, c)
  await assertCanvasActivity(page, c, state, { live: true })
  await assertCleanSignals(c, state)
}

async function stepPoster(page, state, c) {
  await chaptersReady(page)
  await stageIs(page, 'poster')
  await assertPosterSlots(page, c)
  c('poster tier never requests the lazy Scene module', state.sceneModule.requests.length === 0, JSON.stringify(state.sceneModule.requests))
  await assertSkipLink(page, c)
  await assertDisclosureKeyboard(page, c)
  await assertSharedStructure(page, c)
  await assertCanvasActivity(page, c, state)
  await assertCleanSignals(c, state)
}

async function openDisclosureAndCapture(page, c) {
  const tabs = await keyboardFocus(page, '.torque-inspection__toggle')
  c('inspection toggle reachable by Tab order before the transition', tabs >= 0, 'tabs=' + tabs)
  await page.keyboard.press('Enter')
  await expandedWaits(page, 'true')
  const pre = await captureStoryState(page)
  c('DOM identity + disclosure + focus captured pre-transition', pre.captured && pre.expanded === 'true' && pre.focusedIsToggle, JSON.stringify(pre))
  return pre
}

async function stepInjectedFailure(page, state, c, kind, hold, build, sceneRequestSeen) {
  await chaptersReady(page)
  await stageIs(page, 'pending')
  const seen = sceneRequestSeen ? await sceneRequestSeen : null
  c('exact Scene module request observed before assertions', Boolean(seen), seen ? seen.url() : 'never observed (timeout)')
  c('Scene module intercepted exactly once and held pending', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  await openDisclosureAndCapture(page, c)
  hold.resolve()
  await stageIs(page, 'poster')
  const post = await storyStatePreserved(page)
  c('Story DOM identity preserved through failure (retained Element refs)', post.preserved, post.reason)
  c('disclosure open state preserved through failure', post.disclosureStillOpen)
  c('focused control preserved through failure', post.focusedStillToggle)
  await assertPosterSlots(page, c)
  if (kind === 'abort') {
    c('import rejection: exactly one Scene request, no response', state.sceneModule.requests.length === 1 && state.sceneModule.responses.length === 0, JSON.stringify(state.sceneModule.responses))
    c('import rejection observed as requestfailed', state.sceneModule.requestFailed.length === 1 && /ERR_FAILED|net::/.test(state.sceneModule.requestFailed[0].error), JSON.stringify(state.sceneModule.requestFailed))
  } else {
    await waitForCondition(() => state.sceneModule.bodies.length > 0, UI_TIMEOUT_MS * 2)
    const res = state.sceneModule.responses[0]
    c('render-throw injection served with HTTP 200 + JS content type', Boolean(res) && res.status === 200 && /text\/javascript|application\/javascript/.test(res.contentType), JSON.stringify(res || null))
    c('injection body is the controlled throwing ESM (non-vacuous)', state.sceneModule.bodies.some((b) => b.indexOf(RENDER_THROW_MARKER) !== -1))
  }
  c('exactly one Scene request total after failure (cadGate seal)', state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  await assertCanvasActivity(page, c, state)
  await assertFailureSignals(c, state, build.scenePath)
  await page.waitForTimeout(SEAL_WINDOW_MS)
  c('no further Scene/CAD requests in the bounded post-failure window', state.sceneModule.requests.length === 1 && state.cadRequests.length === 0, 'scene=' + state.sceneModule.requests.length + ' cad=' + state.cadRequests.length)
}

async function stepMqlDowngrade(page, state, c) {
  await chaptersReady(page)
  await stageIs(page, 'scene')
  // Stage='scene' alone can describe loading: require the installed live world.
  const readinessStarted = Date.now()
  let readyDrawWitness = null
  try {
  const readinessHandle = await page.waitForFunction(() => {
    const world = window.__torqueWorld?.snapshot?.()
    const ready = world?.ready === true && world.sheet?.baked === true
      && Number.isFinite(world.frames) && world.frames > 0
      && Number.isFinite(world.renderer?.calls) && world.renderer.calls > 0
      && document.querySelector('[data-torque-scene="live"] canvas')
    return ready ? { frames: world.frames, calls: world.renderer.calls, observedAt: performance.now() } : false
  }, undefined, { timeout: 90000, polling: 50 })
  readyDrawWitness = await readinessHandle.jsonValue()
  await readinessHandle.dispose()
  } catch (error) {
    state.mqlReadiness = await page.evaluate(() => {
      const world = window.__torqueWorld?.snapshot?.()
      return { ready: world?.ready ?? null, sheetBaked: world?.sheet?.baked ?? null,
        frames: world?.frames ?? null, calls: world?.renderer?.calls ?? null,
        stage: document.querySelector('.torque-stage')?.getAttribute('data-torque-stage') ?? null,
        canvas: Boolean(document.querySelector('[data-torque-scene="live"] canvas')) }
    }).catch(() => ({ probeUnavailable: true }))
    state.mqlReadiness.elapsedMs = Date.now() - readinessStarted
    c('MQL live readiness completed before transition', false, JSON.stringify(state.mqlReadiness))
    throw error
  }
  state.mqlReadiness = { elapsedMs: Date.now() - readinessStarted, pass: true, readyDrawWitness }
  await assertSkipLink(page, c)
  await openDisclosureAndCapture(page, c)
  const liveBeforeDowngrade = await page.evaluate(() => {
    const world = window.__torqueWorld?.snapshot?.()
    return {
      ready: world?.ready === true, sheetBaked: world?.sheet?.baked === true,
      frames: world?.frames ?? null, calls: world?.renderer?.calls ?? null,
      live: Boolean(document.querySelector('[data-torque-scene="live"] canvas')),
      stage: document.querySelector('.torque-stage')?.getAttribute('data-torque-stage') ?? null,
    }
  })
  state.worldReady = liveBeforeDowngrade.ready && liveBeforeDowngrade.sheetBaked
    && Number.isFinite(liveBeforeDowngrade.frames) && liveBeforeDowngrade.frames > 0
    && Number.isFinite(liveBeforeDowngrade.calls) && liveBeforeDowngrade.calls >= 0
    && Number.isFinite(readyDrawWitness?.calls) && readyDrawWitness.calls > 0
    && liveBeforeDowngrade.frames >= readyDrawWitness.frames
    && liveBeforeDowngrade.live && liveBeforeDowngrade.stage === 'scene'
  c('MQL downgrade requires actual ready live world before transition', state.worldReady, JSON.stringify(liveBeforeDowngrade))
  if (!state.worldReady) throw new Error('MQL live-world prerequisite failed; downgrade not attempted')
  // The boundary is immediately BEFORE the action, so requests during the downgrade
  // itself cannot be mistaken for initialization traffic. Request events (not response
  // completion) assign each Scene/CAD/decoder request to its side of the boundary.
  const boundary = { scene: state.sceneModule.requests.length, cad: state.cadRequests.length,
    unidentifiedScene: state.sceneShaped.length }
  state.mqlTransition = {
    liveBeforeDowngrade, sealWindowMs: SEAL_WINDOW_MS, transitionStartedAt: new Date().toISOString(),
    beforeTransition: {
      sceneRequests: state.sceneModule.requests.slice(), cadRequests: state.cadRequests.slice(),
      unidentifiedSceneRequests: state.sceneShaped.slice(),
    },
  }
  const windowRequests = () => ({
    newSceneRequests: state.sceneModule.requests.slice(boundary.scene),
    newCadRequests: state.cadRequests.slice(boundary.cad),
    newUnidentifiedSceneRequests: state.sceneShaped.slice(boundary.unidentifiedScene),
  })
  const noNewRequests = r => r.newSceneRequests.length === 0 && r.newCadRequests.length === 0
    && r.newUnidentifiedSceneRequests.length === 0
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await stageIs(page, 'poster')
  const post = await storyStatePreserved(page)
  c('Story DOM identity preserved through MQL downgrade (retained Element refs)', post.preserved, post.reason)
  c('disclosure open state preserved through MQL downgrade', post.disclosureStillOpen)
  c('focused control preserved through MQL downgrade', post.focusedStillToggle)
  await assertPosterSlots(page, c)
  await page.waitForTimeout(SEAL_WINDOW_MS)
  const afterDowngrade = windowRequests()
  state.mqlTransition.afterDowngrade = afterDowngrade
  c('no NEW Scene/CAD/decoder requests through downgrade and bounded poster window',
    noNewRequests(afterDowngrade), JSON.stringify(afterDowngrade))
  c('exactly one initialization Scene request and no additional Scene requests after downgrade',
    state.sceneModule.requests.length === 1, JSON.stringify(state.sceneModule.requests))
  // One-way floor: restoring motion must not fetch any new Scene/CAD/decoder bytes.
  state.mqlTransition.restoreStartedAt = new Date().toISOString()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await flushProbe(page)
  await page.waitForTimeout(SEAL_WINDOW_MS)
  const stillPoster = await page.evaluate(() => {
    const s = document.querySelector('.torque-stage')
    return Boolean(s) && s.getAttribute('data-torque-stage') === 'poster'
  })
  c('one-way floor: restoring motion preference never re-enters the scene tier', stillPoster)
  state.mqlTransition.afterRestore = windowRequests()
  state.mqlTransition.windowEndedAt = new Date().toISOString()
  c('no NEW Scene/CAD/decoder requests through bounded restore-motion window',
    noNewRequests(state.mqlTransition.afterRestore), JSON.stringify(state.mqlTransition.afterRestore))
  await assertCanvasActivity(page, c, state, { removedLive: true })
  await assertCleanSignals(c, state)
}

// ---- Runner ----


function deferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const MODES = [
  { suffix: 'static-full', kind: 'clean', quality: null, reduced: false },
  { suffix: 'lite', kind: 'clean', quality: 'lite', reduced: false },
  { suffix: 'poster-explicit', kind: 'poster', quality: 'poster', reduced: false },
  { suffix: 'reduced-motion', kind: 'poster', quality: null, reduced: true },
  { suffix: 'scene-import-abort', kind: 'abort', quality: null, reduced: false },
  { suffix: 'scene-render-throw', kind: 'throw', quality: null, reduced: false },
  { suffix: 'scene-mql-downgrade', kind: 'mql', quality: null, reduced: false },
]

function buildPlans(viewportKeys, only) {
  const plans = []
  for (const vp of viewportKeys) {
    for (const m of MODES) {
      const id = vp + '-' + m.suffix
      if (only && !only.has(id)) continue
      plans.push({ id, viewport: vp, kind: m.kind, quality: m.quality, reduced: m.reduced })
    }
  }
  return plans
}

function caseUrl(plan, baseUrl) {
  const u = new URL(baseUrl)
  if (plan.quality) u.searchParams.set('quality', plan.quality)
  return u
}

async function runCaseOnContext(context, page, plan, baseUrl, build, state, c, hold, control) {
  if (control.cancelled) throw new Error('watchdog cancelled before case work')
  attachCollectors(page, state, build.scenePath)
  await page.addInitScript(PROBE_INIT)
  let sceneRequestSeen = null
  if (plan.kind === 'abort' || plan.kind === 'throw') {
    await context.route((url) => url.pathname === build.scenePath, async (route) => {
      await hold.promise
      if (plan.kind === 'abort') await route.abort()
      else await route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: RENDER_THROW_MODULE })
    })
    // Register the exact-Scene request waiter BEFORE goto so observing it is not a post-hoc
    // race; the route holds the response, so observation also proves the hold engaged.
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
  c('served HTML carries fade markers + noindex', served.indexOf('shell:fade:begin') !== -1 && served.indexOf('noindex') !== -1)
  if (plan.kind === 'clean') await stepCleanScene(page, state, c)
  else if (plan.kind === 'poster') await stepPoster(page, state, c)
  else if (plan.kind === 'mql') await stepMqlDowngrade(page, state, c)
  else await stepInjectedFailure(page, state, c, plan.kind, hold, build, sceneRequestSeen)
}

// The watchdog owns the case: cancellation covers a context created after the timeout, every
// path releases the injected hold and closes its context, the timer is always cleared, and a
// case exception is a FAIL (never mislabeled as an environment BLOCKED).
async function runCaseGuarded(browser, plan, baseUrl, build) {
  const state = newCollectors()
  const assertions = []
  const c = (name, pass, detail) => check(assertions, name, pass, detail)
  const vp = VIEWPORTS[plan.viewport]
  const started = Date.now()
  const control = { cancelled: false }
  let context = null
  const hold = plan.kind === 'abort' || plan.kind === 'throw' ? deferred() : null
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
        reducedMotion: plan.reduced ? 'reduce' : 'no-preference',
      })
      if (control.cancelled) return true
      const page = await context.newPage()
      if (control.cancelled) return true
      await runCaseOnContext(context, page, plan, baseUrl, build, state, c, hold, control)
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
    // Drain the abandoned case promise (bounded) so nothing leaks into the next case.
    await Promise.race([inner.catch(() => {}), new Promise((resolve) => setTimeout(resolve, 2000))])
    return {
      id: plan.id,
      viewport: vp.label,
      kind: plan.kind,
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
    kind: plan.kind,
    url: caseUrl(plan, baseUrl).toString(),
    status: ok ? 'PASS' : 'FAIL',
    durationMs: Date.now() - started,
    assertions,
    observations: {
      sceneIdentity: build.scenePath,
      sceneModuleRequests: state.sceneModule.requests,
      sceneModuleResponses: state.sceneModule.responses,
      sceneModuleRequestFailed: state.sceneModule.requestFailed,
      sceneShapedUnidentified: state.sceneShaped,
      cadRequests: state.cadRequests,
      mqlTransition: state.mqlTransition || null,
      mqlReadiness: state.mqlReadiness || null,
      httpErrors: state.httpErrors,
      consoleErrors: state.consoleErrors,
      pageErrors: state.pageErrors,
      requests: state.requests,
      responses: state.responses,
      requestFailed: state.requestFailed,
    },
  }
}

async function writeReport(report, outPath) {
  try {
    mkdirSync(path.dirname(outPath), { recursive: true })
    writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
  } catch (error) {
    console.error('INTERNAL: cannot write report ' + outPath + ' - ' + error)
    process.exit(EXIT.INTERNAL)
  }
}

async function servedPreflight(playwright, baseUrl, expectedModuleSrc) {
  const api = await playwright.request.newContext()
  try {
    const res = await api.get(baseUrl)
    const text = await res.text()
    const status = res.status()
    const final = new URL(res.url())
    const verdict = entrySrcVerdict(text, expectedModuleSrc)
    const pathOk = final.pathname === '/torque-wrench' || final.pathname === '/torque-wrench/'
    const ok = status === 200 && pathOk && !final.search && !final.hash && verdict.ok && text.indexOf('shell:fade:begin') !== -1 && hasNoindex(text)
    return { ok, status, finalUrl: res.url(), candidates: verdict.candidates }
  } finally {
    await api.dispose().catch(() => {})
  }
}

async function fetchSha256(playwright, url) {
  const api = await playwright.request.newContext()
  try {
    const res = await api.get(url)
    const body = await res.body()
    return { status: res.status(), sha256: createHash('sha256').update(body).digest('hex') }
  } finally {
    await api.dispose().catch(() => {})
  }
}

// Built mode only: sha256 the manifest entry and Scene asset files locally (realpath-confined
// to the build dir) so served bytes can be verified before any browser launch. Byte-identity
// claims in the report come only from this verification.
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
  return { filePath, sha256: sha256(readFileSync(filePath)) }
}

async function verifyBuiltAssets(playwright, baseUrl, build) {
  const origin = new URL(baseUrl).origin
  const identity = {}
  const assets = [['entryAsset', build.expectedModuleSrc], ['sceneAsset', build.scenePath]]
  for (const pair of assets) {
    const name = pair[0]
    const assetPath = pair[1]
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

function defaultReportPath() {
  return path.join(RUNTIME_DIR, 'static-functional-report-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')
}

async function main() {
  const args = parseArgs()

  // Usage validation ALWAYS precedes the local preflight so a bad flag never masquerades as
  // an activation failure. Required values must be non-empty strings; mode flags are flag-only.
  const requireValue = (key) => {
    const value = args[key]
    if (typeof value !== 'string' || value.trim() === '') usage('--' + key + ' requires a non-empty value')
    return value
  }
  const rejectValue = (key) => {
    if (args[key] !== undefined && args[key] !== true) usage('--' + key + ' is a flag and takes no value')
  }
  rejectValue('help')
  rejectValue('preflight')
  const outArg = args.out !== undefined ? requireValue('out') : null
  const onlyArg = args.only !== undefined ? requireValue('only') : null
  const viewportArg = args.viewport !== undefined ? requireValue('viewport') : null
  const buildDirArg = args['build-dir'] !== undefined ? requireValue('build-dir') : null
  const urlArg = args.url !== undefined ? requireValue('url') : null
  if (args.preflight && urlArg) usage('--preflight takes no --url')
  if (!args.preflight && !urlArg) usage('runtime mode requires --url')
  const outPath = outArg ? validateOut(outArg) : null
  const viewportKeys = viewportArg ? [validateViewport(viewportArg)] : Object.keys(VIEWPORTS)
  const only = onlyArg ? validateOnly(onlyArg) : null
  const buildDir = buildDirArg ? validateBuildDir(buildDirArg) : null
  const baseUrl = urlArg ? validateStrictUrl(urlArg) : null
  // A filtered roster that selects nothing is a usage error, never an empty passing run.
  if (!args.preflight && buildPlans(viewportKeys, only).length === 0) usage('--viewport/--only combination selects no case')

  if (args.preflight) {
    const pre = runPreflight()
    for (const c of pre.checks) console.log((c.pass ? 'PASS' : 'FAIL') + '  ' + c.name + (c.detail ? ' - ' + c.detail : ''))
    if (pre.ok) {
      console.log('PREFLIGHT: PASS')
      process.exit(EXIT.PASS)
    }
    if (pre.blockedActivation) console.log('PREFLIGHT: BLOCKED - activation not applied (exit 10; nothing ran)')
    else console.log('PREFLIGHT: FAIL - activation state mismatch (exit 10; nothing ran)')
    process.exit(EXIT.PREFLIGHT)
  }

  const pre = runPreflight()
  if (!pre.ok) {
    for (const c of pre.checks) if (!c.pass) console.error('PREFLIGHT ' + (pre.blockedActivation ? 'BLOCKED' : 'FAIL') + '  ' + c.name + (c.detail ? ' - ' + c.detail : ''))
    console.error(pre.blockedActivation
      ? 'PREFLIGHT: BLOCKED - activation is not applied; refusing to run cases (fail-closed, exit 10).'
      : 'PREFLIGHT: FAIL - activation state mismatch; refusing to run cases (fail-closed, exit 10).')
    process.exit(EXIT.PREFLIGHT)
  }

  let playwright
  let launchBrowser
  let launchConfig
  try {
    playwright = await import('playwright')
    const lib = await import('./lib/browser-launch.mjs')
    launchBrowser = lib.launchBrowser
    launchConfig = lib.launchConfig
  } catch (error) {
    console.error('BLOCKED: playwright unavailable - ' + error)
    process.exit(EXIT.BLOCKED)
  }

  const build = buildDir ? loadBuildGraph(buildDir) : { mode: 'dev', expectedModuleSrc: MODULE_SRC, scenePath: DEV_SCENE_PATH, entryAsset: null }
  if (build.error) {
    console.error(build.error)
    process.exit(EXIT.BLOCKED)
  }

  // Built mode: verify entry and Scene asset BYTES (local manifest output vs served) before
  // any browser launch. Dev mode makes no byte claim.
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

  // Served-marker preflight against the real server before any browser launch: exact module
  // identity (dev TSX source or manifest entry asset), no generic assets accepted.
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
  const plans = buildPlans(viewportKeys, only)
  const report = {
    harness: 'verify-torque-static-functional',
    reportFamily: 'JG-038-static-functional',
    harnessSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    copiedSource: { path: 'scripts/verify-torque-static.mjs', sha256AtCopy: COPIED_SOURCE_SHA256,
      currentSha256AtRun: sha256(readFileSync(path.join(ROOT, 'scripts/verify-torque-static.mjs'))) },
    correction: 'MQL ready-live prerequisite; initialization requests retained; zero NEW Scene/CAD/decoder requests through downgrade and bounded restoration windows. Static poster zero-from-init gate retained.',
    capturedAt: new Date().toISOString(),
    url: baseUrl.toString(),
    mode: build.mode,
    buildDir: build.buildDir || null,
    sceneIdentity: build.scenePath,
    expectedModuleSrc: build.expectedModuleSrc,
    viewports: viewportKeys.map((k) => VIEWPORTS[k].label),
    roster: plans.map((p) => p.id),
    playwrightVersion: pre.playwrightVersion,
    launchConfig: launchConfig(),
    glRenderer: 'unmeasured (no hardware or software rendering claim; configuration only)',
    assetIdentity: assetIdentity || { mode: 'dev', note: 'dev source-graph identity only; no byte-hash claim' },
    browserVersion: null,
    preflight: pre.checks,
    cases: [],
    result: null,
  }
  try {
    browser = await launchBrowser(playwright.chromium)
    report.browserVersion = browser.version()
    for (const plan of plans) {
      const entry = await runCaseGuarded(browser, plan, baseUrl.toString(), build)
      report.cases.push(entry)
      console.log(entry.status + '  ' + entry.id + ' (' + entry.durationMs + 'ms)')
    }
  } catch (error) {
    console.error('BLOCKED: browser environment - ' + error)
    report.result = 'BLOCKED'
    await writeReport(report, outPath || defaultReportPath())
    process.exit(EXIT.BLOCKED)
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch {
        // leaving; nothing to conclude from a close failure
      }
    }
  }

  const failed = report.cases.filter((c) => c.status !== 'PASS')
  report.result = failed.length === 0 ? 'PASS' : 'FAIL'
  const finalOutPath = outPath || defaultReportPath()
  await writeReport(report, finalOutPath)
  console.log('report: ' + finalOutPath)
  console.log('RESULT: ' + report.result + ' (' + (report.cases.length - failed.length) + '/' + report.cases.length + ' cases)')
  process.exit(failed.length === 0 ? EXIT.PASS : EXIT.FAIL)
}

await main()
