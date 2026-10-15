// JG-038 Lane A lifecycle/failure verifier — harness-only, read-only against the served build.
// No product/source changes: every injection is an addInitScript on a private namespace
// (window.__torqueLifecycleProbe). Native input only (page.mouse.wheel); no store setters,
// no synthetic visibility overrides, no playback clocks (contract18 section 3).
//
// Cases:
//   init-failure   Actual renderer-construction-failure observation. Gates getContext on
//                  CONNECTED canvases only; the app detached capability-probe canvas
//                  (Scene.tsx rendererSupported) passes first, so a PASS proves the real
//                  bundled WebGLRenderer construction failed after a passed precheck.
//                  Distinct from import abort, render throw, and WEBGL_lose_context loss.
//   churn-scroll   MutationObserver over .torque-page during same-beat native wheel plus the
//                  contract18 abrupt-reversal roster. Zero-DOM-churn proxy only; NOT
//                  React-commit proof.
//   low-rate       Controlled 30 Hz then 15 Hz wheel delivery; continuity observations only;
//                  excluded from performance distributions per contract18 section 3.
//   hidden-resume  Real second-tab hidden attempt. Requires observed document.hidden === true;
//                  if headless Chrome stays visible the case is UNVERIFIED. Visibility is
//                  never faked.
//
// Provenance binds per report, separately: harness sha256, frozen source-manifest sha256, and
// served build assets observed over HTTP. Reports refuse overwrite and are path-guarded to
// project/work/evidence/torque-wrench-rebuild/ — never inside the frozen build directory.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HARNESS_PATH = fileURLToPath(import.meta.url)
const EVIDENCE_ROOT = 'project/work/evidence/torque-wrench-rebuild'
const EVIDENCE_DIR = EVIDENCE_ROOT + '/08-stage4-opening-recovery'
const DEFAULT_MANIFEST = EVIDENCE_DIR + '/review-manifest-20261013-s.json'
const ALL_CASES = ['init-failure', 'churn-scroll', 'low-rate', 'hidden-resume']

const CASE_DURATIONS = {
  'init-failure': 'bounded ~35 s worst case: navigation + 20 s poster wait + 1.5 s error settle',
  'churn-scroll': '~15 s plus readiness waits (up to 90 s ready / 120 s bake / 60 s frames): 12x120px @100ms same-beat, 4x(-1200px) reversal @100ms, 1.2 s settle',
  'low-rate': '~8 s: 30 updates at 30 Hz then 15 updates at 15 Hz, 1 s settle',
  'hidden-resume': '~3 s when headless stays visible (UNVERIFIED); 5 s hidden hold + ~4 s resume window when a real hidden document is obtainable',
}

const USAGE = [
  'JG-038 Lane A lifecycle/failure verifier (harness-only; no product changes)',
  '',
  'usage:',
  '  node scripts/verify-torque-lifecycle-functional.mjs --help',
  '  node scripts/verify-torque-lifecycle-functional.mjs --self-check',
  '  node scripts/verify-torque-lifecycle-functional.mjs --url=http://localhost:5288/torque-wrench/ [options]',
  '',
  'options:',
  '  --url=...              Required for runtime cases. Torque-wrench origin or page root on the frozen build preview.',
  '  --build-dir=...        Frozen build directory (identity guard only; nothing is written there).',
  '  --out=...              Report JSON path. Must stay under ' + EVIDENCE_ROOT + '/, must not already exist, never inside --build-dir.',
  '  --source-manifest=...  Frozen source manifest bound into provenance (default: review-manifest-20261013-s.json).',
  '  --only=A,B             Bounded subset of: ' + ALL_CASES.join(',') + ' (default: all four, serially).',
  '  --headed=true          Separate real-visibility observation using headed Chrome; default false.',
  '  --self-check           Pure local check: hashes, output guards. No network, no browser.',
  '  --help                 This text.',
  '',
  'case durations (bounded):',
  ...Object.entries(CASE_DURATIONS).map(([k, v]) => '  ' + k.padEnd(14) + v),
  '',
  'exit code: 0 when no case FAILs (UNVERIFIED does not fail); 1 when any case FAILs; 2 on usage/guard errors.',
].join('\n')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const sha256File = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const sha256Buffer = (buffer) => createHash('sha256').update(buffer).digest('hex')

function parseArgs(argv) {
  const args = { url: null, buildDir: null, out: null, sourceManifest: null, only: null, selfCheck: false, help: false }
  for (const raw of argv) {
    if (raw === '--help') { args.help = true; continue }
    if (raw === '--self-check') { args.selfCheck = true; continue }
    const m = /^--([a-z-]+)=(.*)$/i.exec(raw)
    if (!m) { console.error('unrecognized argument: ' + raw + ' (see --help)'); process.exit(2) }
    if (m[1] === 'url') args.url = m[2]
    else if (m[1] === 'build-dir') args.buildDir = m[2]
    else if (m[1] === 'out') args.out = m[2]
    else if (m[1] === 'source-manifest') args.sourceManifest = m[2]
    else if (m[1] === 'headed') {
      if (!['true', 'false'].includes(m[2])) { console.error('--headed must be true or false'); process.exit(2) }
      args.headed = m[2] === 'true'
    }
    else if (m[1] === 'only') {
      args.only = m[2].split(',').map((s) => s.trim()).filter(Boolean)
      if (args.only.length === 0) { console.error('--only must select at least one case'); process.exit(2) }
    }
    else { console.error('unknown flag --' + m[1] + ' (see --help)'); process.exit(2) }
  }
  return args
}

function isInside(childAbs, parentAbs) {
  const rel = path.relative(parentAbs.toLowerCase(), childAbs.toLowerCase())
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/** Reports live only under the task-owned evidence root and never inside the frozen build. */
function guardOutPath(out, buildDir) {
  const outAbs = path.resolve(out)
  const evidenceAbs = path.resolve(EVIDENCE_ROOT)
  if (!isInside(outAbs, evidenceAbs)) throw new Error('output path is outside the task-owned evidence root ' + EVIDENCE_ROOT + ': ' + out)
  if (outAbs.toLowerCase().replace(/\\/g, '/').includes('/.scratch/')) throw new Error('output path must never live inside a scratch/build directory: ' + out)
  if (buildDir && isInside(outAbs, path.resolve(buildDir))) throw new Error('output path is inside the frozen build directory: ' + out)
  if (existsSync(outAbs)) throw new Error('refusing to overwrite existing report: ' + out)
  return outAbs
}

function defaultOutName() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  return EVIDENCE_DIR + '/lifecycle-functional-' + stamp + '.json'
}

/** Observed build identity: served HTML plus same-origin script/style assets, hashed as served. */
async function observeBuildAssets(base, buildDir) {
  if (!buildDir) throw new Error('--build-dir is required for served-build provenance')
  const headUrl = base + '/torque-wrench/'
  const res = await fetch(headUrl)
  if (!res.ok) throw new Error('HTML provenance HTTP ' + res.status)
  const html = Buffer.from(await res.arrayBuffer())
  if (sha256Buffer(html) !== sha256File(path.join(buildDir, 'torque-wrench/index.html'))) throw new Error('Served HTML differs from supplied build')
  const assets = [{ url: headUrl, status: res.status, bytes: html.length, sha256: sha256Buffer(html) }]
  const refs = new Set()
  for (const m of html.toString('utf8').matchAll(/(?:src|href)="([^"]+)"/g)) {
    const ref = m[1]
    if (!/\.(js|mjs|css)(?:$|\?)/i.test(ref)) continue
    const abs = new URL(ref, headUrl).href
    if (abs.startsWith(base + '/')) refs.add(abs)
  }
  const list = [...refs]
  if (list.length === 0 || list.length > 48) throw new Error('Missing or incomplete same-origin asset roster')
  for (const url of list.slice(0, 48)) {
    try {
      const asset = await fetch(url)
      if (!asset.ok) throw new Error('Asset provenance HTTP ' + asset.status + ': ' + url)
      const body = Buffer.from(await asset.arrayBuffer())
      const local = path.resolve(buildDir, '.' + decodeURIComponent(new URL(url).pathname))
      if (!isInside(local, path.resolve(buildDir)) || sha256Buffer(body) !== sha256File(local)) throw new Error('Served asset differs from supplied build: ' + url)
      assets.push({ url, status: asset.status, bytes: body.length, sha256: sha256Buffer(body) })
    } catch (error) { throw new Error('Asset provenance failed: ' + String(error)) }
  }
  return { headUrl, servedAssetCount: assets.length, truncated: list.length > 48, assets }
}

const results = []
const record = (id, status, detail) => {
  results.push({ id, status, detail })
  console.log(status.padEnd(10) + '  ' + id + '  ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)))
}

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return +(sorted[Math.floor(sorted.length / 2)]).toFixed(1)
}

function selfCheck() {
  const checks = []
  const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail })
  try { check('harness-sha256', true, sha256File(HARNESS_PATH)) } catch (e) { check('harness-sha256', false, String(e)) }
  try { check('source-manifest-sha256', true, sha256File(path.resolve(DEFAULT_MANIFEST))) } catch (e) { check('source-manifest-sha256', false, 'manifest missing: ' + String(e)) }
  const refusals = [
    ['outside-evidence-root', 'project/work/evidence/somewhere-else/x.json'],
    ['inside-frozen-build', '.scratch/jg038-stage4-20261013-s/x.json'],
    ['existing-report', DEFAULT_MANIFEST],
  ]
  for (const [name, candidate] of refusals) {
    try { guardOutPath(candidate, '.scratch/jg038-stage4-20261013-s'); check('refuses-' + name, false, 'guard did not refuse: ' + candidate) }
    catch (e) { check('refuses-' + name, true, String(e.message)) }
  }
  try { guardOutPath(EVIDENCE_DIR + '/__self-check-fresh-path.json', '.scratch/jg038-stage4-20261013-s'); check('accepts-fresh-owned-path', true, 'guard accepted a fresh path under the owned evidence dir') }
  catch (e) { check('accepts-fresh-owned-path', false, String(e.message)) }
  const ok = checks.every((c) => c.ok)
  console.log(JSON.stringify({ selfCheck: 'done', ok, checks }, null, 2))
  process.exit(ok ? 0 : 1)
}

// ---- case: init-failure (own context; terminal for the page) -------------------------------
async function caseInitFailure(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const pageErrors = [], consoleErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  await page.addInitScript(() => {
    const probe = (window.__torqueLifecycleProbe = { injected: 'init-failure', getContextCalls: [], denied: [], precheckPassed: false })
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const isGl = type === 'webgl2' || type === 'webgl'
      if (!isGl) return original.call(this, type, ...rest)
      const connected = Boolean(this.isConnected)
      probe.getContextCalls.push({ type, connected })
      if (connected) { probe.denied.push({ type }); return null }
      const context = original.call(this, type, ...rest)
      if (context) probe.precheckPassed = true
      return context
    }
  })
  let probe = null, dom = null, posterObserved = false
  try {
    await page.goto(base + '/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    try {
      await page.waitForFunction(() => document.querySelector('.torque-stage')?.getAttribute('data-torque-stage') === 'poster', null, { timeout: 20000 })
      posterObserved = true
    } catch { posterObserved = false }
    await page.waitForTimeout(1500)
    probe = await page.evaluate(() => {
      const p = window.__torqueLifecycleProbe
      return p ? { ...p, getContextCalls: p.getContextCalls.slice(0, 40), denied: p.denied.slice(0, 40) } : null
    })
    dom = await page.evaluate(() => ({
      mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode') ?? null,
      stage: document.querySelector('.torque-stage')?.getAttribute('data-torque-stage') ?? null,
      canvases: document.querySelectorAll('canvas').length,
      storyText: (document.querySelector('#torque-story')?.textContent ?? '').length,
      footer: Boolean(document.querySelector('.torque-footer')),
      worldProbe: Boolean(window.__torqueWorld),
    }))
  } finally {
    await context.close()
  }
  const failureText = [...pageErrors, ...consoleErrors].join(' | ')
  const precheckMessageSeen = failureText.includes('Private WebGL renderer unavailable')
  const constructionErrorSeen = /creating WebGL context|WebGLRenderer/i.test(failureText)
  let route = 'none'
  if (probe?.precheckPassed && (probe?.denied.length ?? 0) > 0) route = 'renderer-construction'
  else if (precheckMessageSeen || probe?.precheckPassed === false) route = 'capability-precheck'
  const detail = {
    route,
    posterObserved,
    precheckPassed: probe?.precheckPassed ?? null,
    deniedConnectedContextCalls: probe?.denied.length ?? null,
    getContextCalls: probe?.getContextCalls ?? null,
    dom,
    worldProbePresent: dom?.worldProbe ?? null,
    pageErrors,
    consoleErrors,
    constructionErrorSeen,
    precheckMessageSeen,
    note: 'PASS requires the detached capability-probe canvas to obtain a context (precheck passed) BEFORE a connected canvas context is denied at renderer construction; this is an actual renderer-construction-failure observation, distinct from import abort (static verifier), render throw, and WEBGL_lose_context loss (drawing-integration F). A capability-precheck route means the gate reached the precheck and must never be labeled construction evidence.',
  }
  let status
  if (route === 'capability-precheck') status = 'FAIL'
  else if (route === 'renderer-construction' && posterObserved && dom?.stage === 'poster' && dom.storyText > 0 && !dom.worldProbe) status = 'PASS'
  else if (!posterObserved && dom?.worldProbe) status = 'UNVERIFIED'
  else status = 'FAIL'
  if (status === 'UNVERIFIED') detail.unverifiedReason = 'injection did not intersect renderer construction; the scene booted live, so this run proves nothing about the construction-failure path'
  if (status === 'FAIL' && route === 'none' && !dom?.worldProbe) detail.failReason = 'neither a live world nor a poster fallback was observed within bounds'
  record('init-failure-renderer-construction', status, detail)
}

// ---- live-context shared driver -------------------------------------------------------------
async function openLivePage(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const pageErrors = [], consoleErrors = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  await page.addInitScript(() => {
    const probe = (window.__torqueLifecycleProbe = { injected: 'lifecycle-live', mutations: [], truncated: false })
    const install = () => {
      const host = document.querySelector('.torque-page')
      if (!host) { setTimeout(install, 50); return }
      const observer = new MutationObserver((records) => {
        for (const r of records) {
          if (probe.mutations.length >= 500) { probe.truncated = true; break }
          probe.mutations.push({
            ts: performance.now(),
            type: r.type,
            target: r.target.nodeName + (r.target.getAttribute && r.target.getAttribute('data-torque-chapter') ? '[' + r.target.getAttribute('data-torque-chapter') + ']' : ''),
            added: r.addedNodes.length,
            removed: r.removedNodes.length,
            attr: r.attributeName,
          })
        }
      })
      observer.observe(host, { subtree: true, childList: true, attributes: true, characterData: true })
    }
    install()
  })
  await page.goto(base + '/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(() => window.__torqueWorld && window.__torqueWorld.snapshot && window.__torqueWorld.snapshot().ready === true, null, { timeout: 90000 })
  await page.waitForFunction(() => window.__torqueWorld.snapshot().sheet.baked === true, null, { timeout: 120000 })
  await page.waitForFunction(() => window.__torqueWorld.snapshot().frames > 8, null, { timeout: 60000 })
  return { context, page, pageErrors, consoleErrors }
}

const snapshotProbe = (page) => page.evaluate(() => {
  const p = window.__torqueLifecycleProbe
  return p ? { mutations: p.mutations, truncated: p.truncated } : null
})

// ---- case: churn-scroll (same-beat zero-DOM-churn proxy + abrupt reversal) ------------------
async function caseChurnScroll(page, errors) {
  const errorCountBefore = errors.length
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollable: document.documentElement.scrollHeight - window.innerHeight,
    progress: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().progress : null,
    beatId: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().beatId : null,
    beats: (window.__torqueNarrative && window.__torqueNarrative.beats) || [],
    frames: window.__torqueWorld.snapshot().frames,
  }))
  const beat = before.beats.find((b) => before.progress >= b.start && before.progress < b.end) || before.beats[before.beats.length - 1]
  const roomDown = Math.max(0, (beat.end - before.progress) * before.scrollable)
  const roomUp = Math.max(0, (before.progress - beat.start) * before.scrollable)
  const forward = roomDown >= roomUp || roomDown >= 60
  const room = forward ? roomDown : roomUp
  if (room < 12) { record('churn-scroll-same-beat', 'UNVERIFIED', { reason: 'less than 12px of same-beat scroll room at current position', before }); return }
  const dir = forward ? 1 : -1
  const total = Math.min(room - 8, 600)
  const dy = Math.max(5, Math.floor(total / 12))
  const windowStart = await page.evaluate(() => performance.now())
  const t0 = Date.now()
  const wheelMarks = []
  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, dir * dy)
    wheelMarks.push(Date.now() - t0)
    await sleep(100)
  }
  await sleep(1200)
  const windowEnd = await page.evaluate(() => performance.now())
  const after = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().progress : null,
    beatId: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().beatId : null,
    frames: window.__torqueWorld.snapshot().frames,
  }))
  const probe = await snapshotProbe(page)
  const windowMutations = probe.mutations.filter((m) => m.ts >= windowStart && m.ts <= windowEnd)
  const sameBeat = before.beatId === after.beatId
  const displaced = Math.abs(after.scrollY - before.scrollY) > 0
  const intervalGaps = wheelMarks.map((v, i) => (i ? v - wheelMarks[i - 1] : null)).slice(1)
  const detail = {
    beatBefore: before.beatId,
    beatAfter: after.beatId,
    sameBeatWindow: sameBeat,
    displacementPx: +(after.scrollY - before.scrollY).toFixed(2),
    progressBefore: before.progress,
    progressAfter: after.progress,
    wheel: { steps: 12, dyPx: dir * dy, plannedGapMs: 100, actualGapMs: { median: median(intervalGaps), max: Math.max.apply(null, intervalGaps) } },
    sameBeatMutations: windowMutations,
    sameBeatMutationCount: windowMutations.length,
    mutationLogTruncated: probe.truncated,
    framesBefore: before.frames,
    framesAfter: after.frames,
    pageErrorsDuringCase: errors.slice(errorCountBefore),
    note: 'zero same-beat DOM mutation is a functional churn proxy over .torque-page; DOM mutations are not React-commit proof and no React-commit claim is made. Abrupt reversal follows as its own observation.',
  }
  const reverseMarks = []
  const r0 = Date.now()
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel(0, dir * -1200)
    reverseMarks.push(Date.now() - r0)
    await sleep(100)
  }
  await sleep(800)
  const reversed = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().progress : null,
    beatId: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().beatId : null,
    frames: window.__torqueWorld.snapshot().frames,
  }))
  detail.reversal = { displacementPx: +(reversed.scrollY - after.scrollY).toFixed(2), progress: reversed.progress, beatId: reversed.beatId, wheelMarksMs: reverseMarks }
  let status
  if (!sameBeat) { status = 'UNVERIFIED'; detail.unverifiedReason = 'beat changed during the same-beat window; re-run from a position with more in-beat room' }
  else if (windowMutations.length === 0 && displaced && errors.length === errorCountBefore) status = 'PASS'
  else { status = 'FAIL'; detail.failReason = windowMutations.length > 0 ? 'DOM mutations observed during same-beat native scroll' : 'no displacement or page errors during window' }
  record('churn-scroll-same-beat', status, detail)
}

// ---- case: low-rate (controlled 30/15 Hz delivery; continuity observations only) ------------
async function deliverAtInner(page, count, intervalMs, dy) {
  const marks = []
  const start = Date.now()
  for (let i = 0; i < count; i += 1) {
    await page.mouse.wheel(0, dy)
    marks.push(Date.now() - start)
    const wait = start + (i + 1) * intervalMs - Date.now()
    if (wait > 0) await sleep(wait)
  }
  return marks
}

async function caseLowRate(page, errors) {
  const errorCountBefore = errors.length
  const startScrollY = await page.evaluate(() => window.scrollY)
  const marks30 = await deliverAtInner(page, 30, 1000 / 30, 240)
  await sleep(500)
  const mid = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().progress : null,
    frames: window.__torqueWorld.snapshot().frames,
  }))
  const marks15 = await deliverAtInner(page, 15, 1000 / 15, 240)
  await sleep(1000)
  const end = await page.evaluate(() => ({
    scrollY: window.scrollY,
    progress: window.__torqueNarrative && window.__torqueNarrative.snapshot ? window.__torqueNarrative.snapshot().progress : null,
    frames: window.__torqueWorld.snapshot().frames,
    ready: window.__torqueWorld.snapshot().ready,
  }))
  const gaps = (marks) => marks.map((v, i) => (i ? v - marks[i - 1] : null)).slice(1)
  const detail = {
    windows: {
      '30hz': { plannedHz: 30, updates: 30, dyPx: 240, actualGapMs: { median: median(gaps(marks30)), max: Math.max.apply(null, gaps(marks30)) } },
      '15hz': { plannedHz: 15, updates: 15, dyPx: 240, actualGapMs: { median: median(gaps(marks15)), max: Math.max.apply(null, gaps(marks15)) } },
    },
    startScrollY,
    mid,
    end,
    displacementPx: +(end.scrollY - startScrollY).toFixed(2),
    pageErrorsDuringCase: errors.slice(errorCountBefore),
    note: 'controlled-rate input delivery continuity observation; excluded from unthrottled performance distributions per contract18 section 3; no frame-time or performance claims.',
  }
  const status = end.ready === true && errors.length === errorCountBefore && end.frames > mid.frames ? 'PASS' : 'FAIL'
  if (status === 'FAIL') detail.failReason = 'world not ready, no frame advance, or page errors during controlled delivery'
  record('low-rate-controlled-delivery', status, detail)
}

// ---- case: hidden-resume (real visibility only; never faked) --------------------------------
async function caseHiddenResume(context, page, errors) {
  const errorCountBefore = errors.length
  const readState = () => page.evaluate(() => ({
    visibility: document.visibilityState,
    hasFocus: document.hasFocus(),
    frames: window.__torqueWorld && window.__torqueWorld.snapshot ? window.__torqueWorld.snapshot().frames : null,
    hiddenFrames: window.__torqueWorld && window.__torqueWorld.snapshot ? window.__torqueWorld.snapshot().hiddenFrames : null,
    ready: window.__torqueWorld && window.__torqueWorld.snapshot ? window.__torqueWorld.snapshot().ready : null,
  }))
  const pre = await readState()
  const page2 = await context.newPage()
  await page2.goto('about:blank', { waitUntil: 'domcontentloaded' })
  await page2.bringToFront()
  await page.waitForTimeout(800)
  const hiddenState = await readState()
  const detail = { before: pre, duringAttempt: hiddenState, secondTab: 'about:blank activated via bringToFront' }
  if (hiddenState.visibility !== 'hidden') {
    await page2.close()
    detail.observed = 'page stayed ' + hiddenState.visibility + ' after a real second-tab activation; Chrome did not produce a genuinely hidden document'
    detail.note = 'the 5 s hidden-tab resume roster requires a real hidden document; visibility is never faked by this harness (no property overrides, no CDP frozen state relabeled as hidden). UNVERIFIED is the honest result.'
    record('hidden-resume-real-hidden', 'UNVERIFIED', detail)
    return
  }
  await page.waitForTimeout(5000)
  const stillHidden = await readState()
  await page2.close()
  await page.bringToFront()
  await page.waitForTimeout(2000)
  const resumed = await readState()
  detail.hiddenHold = stillHidden
  detail.resumed = resumed
  detail.pageErrorsDuringCase = errors.slice(errorCountBefore)
  const pass = resumed.visibility === 'visible' && resumed.ready === true
    && Number.isFinite(stillHidden.frames) && Number.isFinite(resumed.frames) && resumed.frames >= stillHidden.frames
    && errors.length === errorCountBefore
  record('hidden-resume-real-hidden', pass ? 'PASS' : 'FAIL', detail)
}

// ---- main -----------------------------------------------------------------------------------
const args = parseArgs(process.argv.slice(2))
if (args.help) { console.log(USAGE); process.exit(0) }
if (args.selfCheck) { selfCheck() }
if (!args.url) { console.error('--url is required (see --help)'); process.exit(2) }
const base = args.url.replace(/\/$/, '').replace(/\/torque-wrench$/, '')
const only = args.only || ALL_CASES
const unknown = only.filter((c) => !ALL_CASES.includes(c))
if (unknown.length) { console.error('unknown --only case(s): ' + unknown.join(',') + ' (see --help)'); process.exit(2) }

let outAbs
try { outAbs = guardOutPath(args.out || defaultOutName(), args.buildDir) } catch (e) { console.error('output guard: ' + e.message); process.exit(2) }
if (existsSync(outAbs)) { console.error('refusing to overwrite existing report: ' + outAbs); process.exit(2) }
const manifestAbs = path.resolve(args.sourceManifest || DEFAULT_MANIFEST)
if (!existsSync(manifestAbs)) { console.error('source manifest missing: ' + manifestAbs); process.exit(2) }

const report = {
  startedAt: new Date().toISOString(),
  lane: 'A-lifecycle',
  url: base,
  only,
  caseDurations: CASE_DURATIONS,
  notes: [
    'React-commit absence is NOT verified: the churn case observes DOM mutations only, a functional proxy.',
    'StrictMode integrated remount proof requires a dev harness and remains separate; the production build cannot exercise it.',
    'BFCache restore remains UNVERIFIED (persisted=false observed historically); this harness does not attempt BFCache.',
    'No qualityLock, no tier forcing, no invented thresholds; controlled-rate cases are excluded from performance distributions per contract18 section 3.',
  ],
  provenance: {
    harness: { path: HARNESS_PATH, sha256: sha256File(HARNESS_PATH) },
    sourceManifest: { path: manifestAbs, sha256: sha256File(manifestAbs) },
    observedBuildAssets: null,
  },
  cases: {},
}
try { report.provenance.observedBuildAssets = await observeBuildAssets(base, args.buildDir) }
catch (e) { console.error('BLOCKED: served-build provenance failed: ' + String(e)); process.exit(2) }

const { chromium } = await import('playwright')
const { launchBrowser, launchConfig, describeLaunch } = await import('./lib/browser-launch.mjs')
const actualLaunch = { ...launchConfig(), headless: !args.headed }
report.launch = { described: describeLaunch(), config: actualLaunch, playwrightVersion: createRequire(import.meta.url)('playwright/package.json').version }
const browser = await chromium.launch(actualLaunch)

try {
  if (only.includes('init-failure')) await caseInitFailure(browser, base)
  const liveCases = ['churn-scroll', 'low-rate', 'hidden-resume'].filter((c) => only.includes(c))
  if (liveCases.length) {
    const live = await openLivePage(browser, base)
    try {
      if (liveCases.includes('churn-scroll')) await caseChurnScroll(live.page, live.pageErrors)
      if (liveCases.includes('low-rate')) await caseLowRate(live.page, live.pageErrors)
      if (liveCases.includes('hidden-resume')) await caseHiddenResume(live.context, live.page, live.pageErrors)
    } finally {
      report.cases.live = { finalPageErrors: live.pageErrors, finalConsoleErrors: live.consoleErrors }
      await live.context.close()
    }
  }
} catch (error) {
  record('harness-exception', 'FAIL', String(error && error.stack ? error.stack : error))
} finally {
  await browser.close()
}

report.checks = results
report.summary = {
  pass: results.filter((r) => r.status === 'PASS').length,
  fail: results.filter((r) => r.status === 'FAIL').length,
  unverified: results.filter((r) => r.status === 'UNVERIFIED').length,
}
mkdirSync(path.dirname(outAbs), { recursive: true })
writeFileSync(outAbs, JSON.stringify(report, null, 2), { flag: 'wx' })
console.log(JSON.stringify(report.summary))
console.log('report: ' + outAbs + ' sha256 ' + sha256Buffer(readFileSync(outAbs)))
process.exit(report.summary.fail === 0 ? 0 : 1)
