// QM6: the Quiet Machine half of the cross-page fade (JG-033). Runtime telemetry, not vision.
// Cases (7): fade-out, synthetic-arrival, back, reduced-motion-cut, legacy-redirect, no-white-frame,
// reduced-motion-arrival.
// A case that cannot be proven reports UNVERIFIED, never a silent pass. FAIL exits 1; UNVERIFIED
// alone exits 0. UNVERIFIED IS NOT A GATE PASS: an UNVERIFIED case other than `back` is a failed
// gate and whoever reads the GPU-3 result must treat it as one. The run prints
// `GATE-INCOMPLETE: <case names>` for that and repeats it on the RESULT line. Only `back` may stay
// UNVERIFIED (a bfcache restore cannot always be provoked under Playwright).
// Mutations (plan QM6) are run by hand at GPU-3, not by this script.
// reduced-motion-arrival is the runtime proof of the QM6a reduced-motion fix. A build without QM6a
// (a pre-QM6a inline head script) sets data-fade="in" and then the page sets "release" under reduced
// motion, so the case FAILS there on the values data-fade took; a QM6a build never sets it. The flag
// is consumed by both builds (the old script also called removeItem), so the flag-absent check is not
// what tells them apart.
// Deviations from the plan table:
//  - legacy-redirect compares the history length with a same-harness direct-load calibration, not
//    with the absolute 1 (a direct load already reports 2 under this Playwright setup).
//  - no-white-frame is NOT the plan's CDP screencast with 400 ms delayed stylesheets. That design
//    could not go red (render-blocking CSS yields no new-document frame during the delay, and the
//    bundled CSS also paints the dark background) and could pass on old-page frames. It is a still:
//    every stylesheet is answered with an empty body, the page arrives synthetically with the fade
//    flag preset, and one screenshot of the new document is judged. Only the inline head block of
//    quiet-machine/index.html can then provide a background. The screencast and its clock logic were
//    removed: once the judged image is the new document by construction they add no guarantee.
//  - synthetic-arrival bounds the attribute removal at cap 2500 + fade 600 + slack 500 = 3600 ms
//    after mount; the plan's figure is 2500 + 600 = 3100 ms (the extra 500 ms is scheduling slack).
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { pixels } from './lib/preview-pixels.mjs'

const USAGE = 'usage: node scripts/verify-page-transition.mjs --url=http://localhost:<port> [--viewport=1440x900|390x844] [--out=<dir>]'
const usage = (why, code = 2) => { if (why) console.error(why); console[code ? 'error' : 'log'](USAGE); process.exit(code) }
if (process.argv.includes('--help')) usage('', 0)
const args = {}
for (const a of process.argv.slice(2)) {
  const m = /^--(url|viewport|out)=(.*)$/.exec(a)
  if (!m) usage(`unknown argument: ${a}`)
  args[m[1]] = m[2]
}
if (!args.url) usage('missing --url')
let origin
try { const u = new URL(args.url); if (!/^https?:$/.test(u.protocol)) throw new Error('not http(s)'); origin = u.origin } catch (e) { usage(`bad --url: ${e.message}`) }
const vm = /^(\d+)x(\d+)$/.exec(args.viewport || '1440x900')
if (!vm) usage(`bad --viewport: ${args.viewport}`)
const viewport = { width: Number(vm[1]), height: Number(vm[2]) }
const out = path.resolve(args.out || 'output/playwright/page-transition')
fs.mkdirSync(path.join(out, 'videos'), { recursive: true })

// Constants are read from the product source so the gate cannot drift from it; the literals are the
// values at QM4 (src/shared/pageFade.ts:16-28) and are used only if the file cannot be parsed.
const constants = (() => {
  const c = { FADE_KEY: 'jg:fade', FADE_OUT_ANIMATION: 'shell-fade-out', FADE_FALLBACK_MS: 450, FADE_IN_MS: 600, HOLD_CAP_MS: 2500, source: 'hardcoded' }
  try {
    const src = fs.readFileSync(new URL('../src/shared/pageFade.ts', import.meta.url), 'utf8')
    const num = name => Number(new RegExp(`export const ${name} = (\\d+)`).exec(src)?.[1])
    const str = name => new RegExp(`export const ${name} = '([^']+)'`).exec(src)?.[1]
    const key = str('FADE_KEY'), anim = str('FADE_OUT_ANIMATION')
    const parsed = { FADE_FALLBACK_MS: num('FADE_FALLBACK_MS'), FADE_IN_MS: num('FADE_IN_MS'), HOLD_CAP_MS: num('HOLD_CAP_MS') }
    if (key && anim && Object.values(parsed).every(Number.isFinite)) Object.assign(c, parsed, { FADE_KEY: key, FADE_OUT_ANIMATION: anim, source: 'src/shared/pageFade.ts' })
  } catch {}
  return c
})()
const { FADE_KEY, FADE_OUT_ANIMATION, FADE_FALLBACK_MS, FADE_IN_MS, HOLD_CAP_MS } = constants
const ANIM_KEY = 'jg:vpt-anim'        // the recorder's own sessionStorage key (animationend records); never FADE_KEY
const ACTION_WINDOW_MS = 100          // plan: data-fade="out" and the flag within 100 ms of the click
const CAP_SLACK_MS = 500              // scheduling slack on the 2.5 s + 600 ms release bound (3600 ms against the plan's 3100)
const READY_TOLERANCE_MS = 200        // a release may precede the __quietMachine.ready mirror flipping by at most this
const ASSIGN_ORDER_SLACK_MS = 10      // clock slack: an assign may be measured this much before the animationend it follows
const ASSIGN_FOLLOW_MS = 20           // the event-driven assign follows the animationend within this (same task)
const BRIGHT_LUMA = .85, BRIGHT_FRACTION = .2 // plan: a frame with >= 20% of pixels above 0.85 is a flash
const EXPECTED_CASES = 7              // fewer case results than this is a FAIL (a case that never ran proves nothing)
const QM = `${origin}/quiet-machine/`
const BRAND = '.qm-header > a[data-fade]'
const GL_ARGS = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] // as verify-jg033-preview.mjs
const launch = extra => chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true, args: GL_ARGS, ...extra })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const isRoot = u => new URL(String(u)).pathname === '/'
const round = (n, d = 1) => n === null || n === undefined ? null : Math.round(n * 10 ** d) / 10 ** d
async function until(fn, ms, what) {
  const end = Date.now() + ms
  for (;;) {
    const v = await fn()
    if (v) return v
    if (Date.now() > end) throw new Error(`timed out after ${ms} ms waiting for ${what}`)
    await sleep(25)
  }
}

// Runs in every document of a case context at document start (addInitScript). It observes only:
// data-fade mutations (with the flag and poster state at that moment), clicks, pageshow, storage
// writes of the flag, DOMContentLoaded, and when window.__quietMachine appears and becomes ready.
// Events are kept in window.__vpt and also sent to Node through the exposed binding so they survive
// navigation. `preset` seeds the fade flag on the Quiet Machine page only (the synthetic arrival).
function recorder(opts) {
  if (window.__vpt) return
  const vpt = (window.__vpt = { events: [], mountedAt: null, readyAt: null })
  const queue = []
  const flush = () => {
    const sink = window.__vptSink
    if (typeof sink !== 'function') return
    while (queue.length) { try { const r = sink(JSON.stringify(queue.shift())); if (r && r.catch) r.catch(() => {}) } catch {} }
  }
  const store = () => { try { return sessionStorage.getItem(opts.key) } catch { return 'unreadable' } }
  const attr = () => document.documentElement ? document.documentElement.getAttribute('data-fade') : null
  const snap = () => ({ canvas: document.querySelectorAll('canvas').length, ready: !!(window.__quietMachine && window.__quietMachine.ready), mounted: !!window.__quietMachine, poster: !!document.querySelector('.qm-poster'), flag: store() })
  const rec = (kind, data) => {
    const e = Object.assign({ kind, t: performance.now(), wall: Date.now(), url: location.href }, data)
    vpt.events.push(e); queue.push(e); flush()
  }
  if (opts.preset) { try { if (location.pathname === opts.qmPath) sessionStorage.setItem(opts.key, String(Date.now())) } catch {} }
  try {
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (k, v) { if (k === opts.key) rec('flag-set', { v: String(v) }); return set.apply(this, arguments) }
  } catch {}
  try {
    let proof
    Object.defineProperty(window, '__quietMachine', { configurable: true, enumerable: true,
      get() { return proof }, set(v) { if (vpt.mountedAt === null) vpt.mountedAt = performance.now(); proof = v } })
  } catch {}
  const poll = setInterval(() => { const q = window.__quietMachine; if (q && q.ready) { vpt.readyAt = performance.now(); clearInterval(poll) } }, 20)
  setTimeout(() => clearInterval(poll), 90000)
  // The root element does not exist yet at init-script time, so the observer sits on the document.
  // Only mutations of <html> count: a[data-fade] links carry the same attribute name, and their
  // records would break the oldValue chain that recovers each value.
  new MutationObserver(records => {
    const mine = records.filter(r => r.target === document.documentElement)
    mine.forEach((r, i) => {
      const v = i + 1 < mine.length ? mine[i + 1].oldValue : attr() // the value this mutation set
      rec('fade', Object.assign({ v, was: r.oldValue }, snap()))
    })
  }).observe(document, { attributes: true, attributeFilter: ['data-fade'], attributeOldValue: true, subtree: true })
  addEventListener('click', e => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null
    rec('click', { href: a ? a.getAttribute('href') : null, fadeLink: a ? a.hasAttribute('data-fade') : null, flag: store() })
  }, true)
  // Animation ends. The root element does not exist yet at init-script time, so a capture listener on
  // window stands in for one on <html>: capture runs before the product's own listener on the root,
  // and each record says whether the target was the root element. Records are also appended to
  // sessionStorage[opts.animKey] synchronously, so a page that unloads right after the event still
  // leaves them for the next document's DOMContentLoaded record (`anim`).
  addEventListener('animationend', e => {
    const r = { animationName: e.animationName, targetIsRoot: e.target === document.documentElement, pseudoElement: e.pseudoElement || '', path: location.pathname }
    try {
      const prev = JSON.parse(sessionStorage.getItem(opts.animKey) || '[]')
      prev.push(Object.assign({ t: performance.now(), wall: Date.now() }, r))
      sessionStorage.setItem(opts.animKey, JSON.stringify(prev))
    } catch {}
    rec('animationend', r)
  }, true)
  const savedAnim = () => { try { return JSON.parse(sessionStorage.getItem(opts.animKey) || '[]') } catch { return [] } }
  document.addEventListener('DOMContentLoaded', () => rec('dcl', Object.assign({ fade: attr(), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, anim: savedAnim() }, snap())))
  addEventListener('pageshow', e => {
    rec('pageshow', { persisted: e.persisted })
    // Next task: after the product's own pageshow listener has run (the init script registered first).
    setTimeout(() => rec('pageshow-settled', Object.assign({ persisted: e.persisted, fade: attr() }, snap())), 0)
  })
}

// One isolated context per case: no sessionStorage or history leaks between cases.
async function openCase(name, { browser, reducedMotion = false, preset = false, video = true }) {
  const log = [], errors = []
  let videoNote = video ? null : 'not recorded: video is off for this case'
  const make = async withVideo => {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
      ...(withVideo ? { recordVideo: { dir: path.join(out, 'videos', name), size: viewport } } : {}) })
    try {
      await context.exposeBinding('__vptSink', (_src, s) => { try { log.push(JSON.parse(s)) } catch {} })
      await context.addInitScript(recorder, { preset, key: FADE_KEY, animKey: ANIM_KEY, qmPath: '/quiet-machine/' })
      const page = await context.newPage()
      page.setDefaultTimeout(30000)
      page.on('pageerror', e => errors.push(String(e)))
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
      return { context, page }
    } catch (e) { await context.close().catch(() => {}); throw e }
  }
  let made
  if (video) {
    try { made = await make(true) } catch (e) { videoNote = `not recorded: ${String(e.message).split('\n')[0]}` }
  }
  if (!made) made = await make(false)
  const { context, page } = made
  return {
    browser, context, page, log, errors,
    async close() {
      const v = page.video()
      await context.close().catch(() => {})
      let file = null
      if (v) try { file = path.relative(process.cwd(), await v.path()) } catch (e) { videoNote = `video path unavailable: ${e.message}` }
      return { file, note: file ? null : videoNote }
    },
  }
}

async function runCase(name, opts, fn) {
  let c = null, result
  try { c = await openCase(name, opts); result = await fn(c) }
  catch (e) { result = { status: 'FAIL', measurements: {}, message: `error: ${String(e && e.message || e).split('\n')[0]}` } }
  finally {
    if (c) {
      result = result || { status: 'FAIL', measurements: {}, message: 'no result' }
      result.measurements = { ...result.measurements, pageErrors: c.errors.slice(0, 5) }
      result.video = await c.close()
    }
  }
  return { name, ...result }
}

// A case body collects `checks` and turns them into a verdict. `unverified` names why a clean
// run still cannot be called a pass.
function verdict(checks, measurements, { unverified = null, finding = null } = {}) {
  const failed = checks.filter(c => !c.ok).map(c => c.msg)
  if (failed.length) return { status: 'FAIL', measurements, message: [...failed, finding].filter(Boolean).join('; '), ...(finding ? { finding } : {}) }
  if (unverified) return { status: 'UNVERIFIED', measurements, message: unverified }
  return { status: 'PASS', measurements, message: checks.map(c => c.msg).join('; ') }
}

const fadeEvents = log => log.filter(e => e.kind === 'fade')
// Node Date.now() and page Date.now() share one clock; performance.timeOrigin is never compared with either.
const navStartWall = e => e.wall - e.t

// ---- cases ---------------------------------------------------------------------------------

async function caseFadeOut(c) {
  const { page, log } = c
  const navs = []
  page.on('framenavigated', f => { if (f === page.mainFrame()) navs.push({ wall: Date.now(), url: f.url() }) })
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector(BRAND, { timeout: 60000 })
  // Click only once the scene is ready (or the poster stands in): a long task from GLB parsing or shader
  // compilation inside the ~50 ms between the animation end and the fallback would otherwise decide the verdict.
  await page.waitForFunction(() => (window.__quietMachine && window.__quietMachine.ready) || !!document.querySelector('.qm-poster'), null, { timeout: 60000 })
  const polledFrom = Date.now()
  await page.locator(BRAND).click({ timeout: 30000, noWaitAfter: true })
  // The documented window: poll html[data-fade="out"] and the flag immediately after the click.
  const seenFromNode = await page.waitForFunction(key => document.documentElement.getAttribute('data-fade') === 'out' && sessionStorage.getItem(key) !== null,
    FADE_KEY, { polling: 'raf', timeout: 1000 }).then(() => true, () => false)
  const nodeLatencyMs = Date.now() - polledFrom
  await page.waitForURL(isRoot, { timeout: 15000, waitUntil: 'commit' })
  const rootDcl = await until(() => log.find(e => e.kind === 'dcl' && isRoot(e.url)), 30000, 'DOMContentLoaded of /').catch(() => null)
  await until(() => log.some(e => e.kind === 'click'), 5000, 'click record')
  const click = log.find(e => e.kind === 'click')
  const outEv = fadeEvents(log).find(e => e.v === 'out')
  const nav = navs.find(n => isRoot(n.url))
  const latency = outEv && click ? outEv.t - click.t : null
  const toRoot = nav && click ? nav.wall - click.wall : null
  const budget = FADE_FALLBACK_MS + 1000
  // QM6a: the navigation must be driven by the cover's own animationend on the root, not by the
  // fallback timer. The records come from the Node-side log; the sessionStorage copy the next document
  // reported is used only if the log has none (events lost to the unload).
  const assignWall = rootDcl ? navStartWall(rootDcl) : null
  const assignAfterClick = assignWall !== null && click ? assignWall - click.wall : null
  const logAnim = log.filter(e => e.kind === 'animationend' && new URL(e.url).pathname === '/quiet-machine/')
  const savedAnim = Array.isArray(rootDcl?.anim) ? rootDcl.anim.filter(e => e.path === '/quiet-machine/') : []
  const animSource = logAnim.length ? 'log' : savedAnim.length ? 'sessionStorage' : 'none'
  const anims = logAnim.length ? logAnim : savedAnim
  const outEnds = anims.filter(e => e.animationName === FADE_OUT_ANIMATION && e.targetIsRoot === true)
  const endAfterClick = outEnds.length && click ? outEnds[0].wall - click.wall : null
  const m = { clickHref: click?.href ?? null, clickOnFadeLink: click?.fadeLink ?? null, outLatencyMs: round(latency), flagAtOut: outEv?.flag ?? null,
    polledFromNode: seenFromNode, nodeObservedLatencyMs: nodeLatencyMs, urlBecameRootMs: round(toRoot), urlBudgetMs: budget,
    assignAfterClickMs: round(assignAfterClick), animationEndAfterClickMs: round(endAfterClick), animationEndSource: animSource,
    animationEnds: anims.map(e => ({ name: e.animationName, root: e.targetIsRoot, pseudo: e.pseudoElement, afterClickMs: click ? round(e.wall - click.wall) : null })),
    finalUrl: page.url() }
  const checks = [
    { ok: !!click && click.fadeLink === true, msg: 'click landed on an a[data-fade] link' },
    { ok: latency !== null && latency <= ACTION_WINDOW_MS, msg: `data-fade="out" ${latency === null ? 'never set' : `${round(latency)} ms after the click`} (limit ${ACTION_WINDOW_MS})` },
    { ok: !!outEv && outEv.flag !== null && outEv.flag !== 'unreadable', msg: `sessionStorage['${FADE_KEY}'] ${outEv && outEv.flag ? 'set with the attribute' : 'missing at fade-out'}` },
    { ok: seenFromNode, msg: 'html[data-fade="out"] with the flag observed from the test side' },
    { ok: toRoot !== null && toRoot <= budget, msg: `URL became / ${toRoot === null ? 'never' : `${round(toRoot)} ms`} after the click (limit ${budget})` },
    { ok: outEnds.length === 1,
      msg: outEnds.length === 1 ? `exactly one ${FADE_OUT_ANIMATION} animationend on the root, ${round(endAfterClick)} ms after the click (${animSource})`
        : outEnds.length === 0 ? `no ${FADE_OUT_ANIMATION} animationend reached the root before the navigation committed: it went through the ${FADE_FALLBACK_MS} ms fallback (assign ${round(assignAfterClick)} ms after the click)`
        : `${outEnds.length} ${FADE_OUT_ANIMATION} animationend events on the root, want exactly 1` },
    // The fallback timer is armed inside the product's click handler, after the recorder's capture-phase click record, so a
    // fallback assign cannot land before about FADE_FALLBACK_MS after the click, while the cover's own animationend (400 ms) lands
    // earlier and the event-driven assign follows it in the same task. Ordering alone cannot tell the two apart (the event always
    // precedes a 450 ms fallback), so the assign time itself is bounded.
    { ok: outEnds.length !== 1 || (assignWall !== null && assignAfterClick < FADE_FALLBACK_MS - 1
        && assignWall - outEnds[0].wall >= -ASSIGN_ORDER_SLACK_MS && assignWall - outEnds[0].wall <= ASSIGN_FOLLOW_MS),
      msg: assignWall === null ? 'the navigation start of / was not observed, so the animationend cannot be ordered before the assign'
        : outEnds.length !== 1 ? 'no single animationend to order'
        : (assignAfterClick < FADE_FALLBACK_MS - 1 && assignWall - outEnds[0].wall >= -ASSIGN_ORDER_SLACK_MS && assignWall - outEnds[0].wall <= ASSIGN_FOLLOW_MS)
          ? `the assign (${round(assignAfterClick)} ms after the click) followed the animationend (${round(endAfterClick)} ms) within ${ASSIGN_FOLLOW_MS} ms and before the ${FADE_FALLBACK_MS} ms fallback: the event drove the navigation`
        : `the assign (${round(assignAfterClick)} ms after the click) does not follow the animationend (${round(endAfterClick)} ms) within ${ASSIGN_FOLLOW_MS} ms or came at/after the ${FADE_FALLBACK_MS} ms fallback: the fallback, not the event, drove the navigation` },
  ]
  return verdict(checks, m)
}

async function caseSyntheticArrival(c) {
  const { page } = c
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__vpt && window.__vpt.events.some(e => e.kind === 'fade' && e.v === null), null, { timeout: 30000 })
  // The scene may become ready after the attribute is gone (cap) or never (poster); wait for either
  // so readyAt is known before the release is classified.
  const readyOrPoster = await page.waitForFunction(() => (window.__quietMachine && window.__quietMachine.ready) || !!document.querySelector('.qm-poster'),
    null, { timeout: 60000 }).then(() => true, () => false)
  const vpt = await page.evaluate(() => JSON.parse(JSON.stringify(window.__vpt)))
  const flagLeft = await page.evaluate(key => sessionStorage.getItem(key), FADE_KEY)
  const ev = vpt.events.filter(e => e.kind === 'fade')
  const dcl = vpt.events.find(e => e.kind === 'dcl')
  const inEv = ev.find(e => e.v === 'in'), rel = ev.find(e => e.v === 'release'), rem = ev.find(e => e.v === null)
  const at = rel || rem
  let reason = 'unobserved'
  if (at && vpt.mountedAt !== null) {
    if (at.ready || (vpt.readyAt !== null && vpt.readyAt <= at.t + READY_TOLERANCE_MS)) reason = 'ready'
    else if (at.poster) reason = 'poster'
    else if (at.t - vpt.mountedAt >= HOLD_CAP_MS - 100) reason = 'cap'
    else reason = 'early'
  }
  const bound = HOLD_CAP_MS + FADE_IN_MS + CAP_SLACK_MS
  const sinceMount = rem && vpt.mountedAt !== null ? rem.t - vpt.mountedAt : null
  const m = { dclFade: dcl?.fade ?? null, timeToReleaseMs: rem && inEv ? round(rem.t - inEv.t) : null, inAtMs: round(inEv?.t), releaseAtMs: round(rel?.t),
    removedAtMs: round(rem?.t), mountedAtMs: round(vpt.mountedAt), readyAtMs: round(vpt.readyAt), holdMs: at && vpt.mountedAt !== null ? round(at.t - vpt.mountedAt) : null,
    removedSinceMountMs: round(sinceMount), removalBoundMs: bound, releaseReason: reason, sceneReadyOrPoster: readyOrPoster, flagLeftInStorage: flagLeft,
    // The 'ready' classification above tolerates a release up to READY_TOLERANCE_MS (200 ms) before the
    // __quietMachine.ready mirror flips (the product gates on its own state, the mirror updates in the
    // frame loop). This number shows how much of that tolerance a run actually used.
    releaseBeforeReadyMs: at && vpt.readyAt !== null && !at.ready ? round(vpt.readyAt - at.t) : (at && at.ready ? 0 : null) }
  const checks = [
    { ok: !!inEv, msg: 'data-fade="in" was set by the head shell script' },
    { ok: dcl?.fade === 'in', msg: `data-fade at DOMContentLoaded was ${JSON.stringify(dcl?.fade ?? null)} (want "in")` },
    { ok: !!rem, msg: 'the attribute was removed' },
    { ok: sinceMount === null || sinceMount <= bound, msg: `removed ${round(sinceMount)} ms after mount (bound ${bound} = cap ${HOLD_CAP_MS} + fade ${FADE_IN_MS} + slack ${CAP_SLACK_MS})` },
    { ok: reason !== 'early', msg: `released for reason "${reason}"` },
    { ok: flagLeft === null, msg: flagLeft === null ? `sessionStorage['${FADE_KEY}'] consumed on arrival` : `sessionStorage['${FADE_KEY}'] still present after arrival (${JSON.stringify(flagLeft)})` },
  ]
  const unverified = reason === 'poster' ? 'QM was on the poster path (scene never ready): the hold-until-ready behaviour was not exercised'
    : reason === 'unobserved' ? 'the mount of window.__quietMachine was not observed, so the release cannot be classified' : null
  return verdict(checks, m, { unverified })
}

async function caseBack(c) {
  const { page, log } = c
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector(BRAND, { timeout: 60000 })
  const first = await page.waitForFunction(() => (window.__quietMachine && window.__quietMachine.ready) ? 'ready' : document.querySelector('.qm-poster') ? 'poster' : false,
    null, { timeout: 60000 }).then(h => h.jsonValue(), () => 'timeout')
  if (first !== 'ready') return { status: 'UNVERIFIED', measurements: { firstLoad: first }, message: `QM was not ready on first load (${first}); Back to a working scene cannot be proven here` }
  await page.locator(BRAND).click({ timeout: 30000, noWaitAfter: true })
  await page.waitForURL(isRoot, { timeout: 30000, waitUntil: 'domcontentloaded' })
  // Why the browser did or did not restore from the bfcache (informational; never a verdict).
  const notRestored = []
  try {
    const cdp = await c.context.newCDPSession(page)
    cdp.on('Page.backForwardCacheNotUsed', ev => notRestored.push(...(ev.notRestoredExplanations || []).map(x => `${x.type}:${x.reason}`)))
    await cdp.send('Page.enable')
  } catch {}
  const backAt = Date.now()
  // Playwright ships with bfcache off and has little restore handling: a goBack that throws or hangs
  // is a harness fact, not product evidence, so the pageshow log decides what happened.
  const backError = await page.goBack({ timeout: 30000, waitUntil: 'commit' }).then(() => null, e => String(e.message).split(String.fromCharCode(10))[0])
  const findSettled = events => events.find(e => e.kind === 'pageshow-settled' && new URL(e.url).pathname === '/quiet-machine/' && e.wall >= backAt - 50)
  let settled = await until(() => findSettled(log), 30000, 'pageshow after Back').catch(() => null)
  if (!settled) settled = findSettled(await page.evaluate(() => (window.__vpt ? window.__vpt.events : [])).catch(() => []))
  if (!settled) {
    // A product cannot suppress pageshow, so a missing event is not evidence against it.
    return { status: 'UNVERIFIED', measurements: { goBackError: backError, url: page.url(), bfcacheNotUsed: notRestored },
      message: `harness could not observe a pageshow on the Quiet Machine page after Back${backError ? ` (goBack: ${backError})` : ''}` }
  }
  const persisted = settled.persisted === true
  let state, cleared = null, end = null
  if (persisted) {
    // Judged from the in-page snapshot taken right after the product's pageshow handlers ran.
    state = { fade: settled.fade, canvas: settled.canvas, ready: settled.ready, poster: settled.poster ? 1 : 0 }
  } else {
    // A fresh load may legitimately carry data-fade="in" for a moment (the flag is younger than 5 s).
    cleared = await page.waitForFunction(() => !document.documentElement.hasAttribute('data-fade'), null, { timeout: 15000 }).then(() => true, () => false)
    end = await page.waitForFunction(() => (window.__quietMachine && window.__quietMachine.ready) ? 'ready' : document.querySelector('.qm-poster') ? 'poster' : false,
      null, { timeout: 60000 }).then(h => h.jsonValue(), () => 'timeout')
    state = await page.evaluate(() => ({ fade: document.documentElement.getAttribute('data-fade'), canvas: document.querySelectorAll('canvas').length,
      ready: !!(window.__quietMachine && window.__quietMachine.ready), poster: document.querySelectorAll('.qm-poster').length }))
  }
  const m = { persisted, goBackError: backError, pageshowFadeAfterSettle: settled.fade, pageshowFlag: settled.flag, judgedFrom: persisted ? 'pageshow snapshot' : 'live page',
    fadeClearedWithin15s: cleared, ...state, end, bfcacheNotUsed: notRestored }
  const checks = [
    { ok: state.fade === null && cleared !== false, msg: state.fade === null ? 'no data-fade after Back' : `data-fade=${JSON.stringify(state.fade)} left after Back${persisted ? ' (bfcache restore)' : ''}` },
    { ok: state.canvas > 0, msg: `${state.canvas} canvas present` },
    { ok: state.ready, msg: '__quietMachine.ready holds' },
    { ok: state.poster === 0, msg: state.poster ? 'QM shows the poster after Back' : 'no .qm-poster' },
  ]
  const finding = state.poster ? 'FINDING: QM shows the poster after Back (it showed the scene before leaving); raise with owner, no silent patch' : null
  return verdict(checks, m, { finding, unverified: persisted ? null
    : `bfcache not used (pageshow persisted=false${notRestored.length ? `; ${notRestored.slice(0, 3).join(', ')}` : ''}): the restore path was not exercised; this was a fresh load` })
}

async function caseReducedMotion(c) {
  const { page, log } = c
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  await page.waitForSelector(BRAND, { timeout: 60000 })
  // Observer proof: "no data-fade=out" is only evidence if the recorder can see a data-fade write on
  // <html>. A throwaway value is written and removed before the click, then ignored by the checks.
  await page.evaluate(() => { document.documentElement.setAttribute('data-fade', 'probe'); document.documentElement.removeAttribute('data-fade') })
  const observerLive = await until(() => fadeEvents(log).some(e => e.v === 'probe'), 3000, 'observer probe').then(() => true, () => false)
  await page.locator(BRAND).click({ timeout: 30000, noWaitAfter: true })
  await page.waitForURL(isRoot, { timeout: 15000, waitUntil: 'commit' })
  const rootDcl = await until(() => log.find(e => e.kind === 'dcl' && isRoot(e.url)), 30000, 'DOMContentLoaded of /').catch(() => null)
  const click = log.find(e => e.kind === 'click')
  const outs = fadeEvents(log).filter(e => e.v === 'out')
  const sets = log.filter(e => e.kind === 'flag-set')
  const m = { reducedMotionMatches: reduced, observerLive, clickSeen: !!click, outEvents: outs.length, flagWrites: sets.length, flagAtClick: click?.flag ?? null,
    flagAtRootDcl: rootDcl?.flag ?? null, assignAfterClickMs: rootDcl && click ? round(navStartWall(rootDcl) - click.wall) : null, finalUrl: page.url() }
  const checks = [
    { ok: !!click, msg: 'click recorded' },
    { ok: isRoot(page.url()), msg: 'click navigated to /' },
    { ok: outs.length === 0, msg: outs.length ? `data-fade="out" was set ${outs.length} time(s) under reduced motion` : 'no data-fade="out"' },
    // The proof is the Storage.prototype.setItem patch (no write of the key at all) plus the key read
    // at the root document's DOMContentLoaded; the click-time read is kept only as a measurement.
    { ok: sets.length === 0 && !!rootDcl && rootDcl.flag === null,
      msg: sets.length ? `flag written ${sets.length} time(s)` : !rootDcl ? 'DOMContentLoaded of / not observed, so the key at arrival is unknown' : 'no storage key' },
  ]
  return verdict(checks, m, { unverified: !reduced ? 'prefers-reduced-motion did not match in the page; the reduced-motion path was not exercised'
    : !observerLive ? 'the data-fade recorder did not see a probe write on <html>; "no data-fade=out" cannot be trusted' : null })
}

// Legacy entry: /?study=rl300&quality=lite must replace itself with /quiet-machine/?quality=lite and
// add no history entry. The plan's absolute value does not hold in this harness (a direct load already
// reports a length of 2: the initial about:blank entry plus the page), so the length is calibrated
// against a direct load of the destination, in a fresh context, measured by the same helper.
const LEGACY_WANT = '/quiet-machine/?quality=lite'
async function loadForHistory(browser, url) {
  const r = { url, finalUrl: null, historyLength: null, error: null }
  let context = null
  try {
    context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
    const page = await context.newPage()
    page.setDefaultTimeout(30000)
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 60000 }).catch(() => {}) // a redirect may interrupt this goto
      await page.waitForURL(u => new URL(String(u)).pathname === '/quiet-machine/', { timeout: 30000, waitUntil: 'domcontentloaded' })
      await sleep(300)
      r.historyLength = await page.evaluate(() => history.length)
    } catch (e) { r.error = String(e && e.message || e).split('\n')[0] }
    try { const u = new URL(page.url()); if (u.origin === origin) r.finalUrl = u.pathname + u.search } catch {}
  } catch (e) { r.error = r.error || String(e && e.message || e).split('\n')[0] }
  finally { if (context) await context.close().catch(() => {}) }
  return r
}

async function caseLegacyRedirect(c) {
  const direct = await loadForHistory(c.browser, `${origin}${LEGACY_WANT}`)
  const redirected = await loadForHistory(c.browser, `${origin}/?study=rl300&quality=lite`)
  const directOk = direct.error === null && direct.finalUrl === LEGACY_WANT && Number.isInteger(direct.historyLength)
  const m = { direct: { finalUrl: direct.finalUrl, historyLength: direct.historyLength, error: direct.error },
    redirected: { finalUrl: redirected.finalUrl, historyLength: redirected.historyLength, error: redirected.error }, wantUrl: LEGACY_WANT }
  const checks = []
  let unverified = null
  // A null final URL means the page was unreachable (an unreachable page is a failure, not a gap).
  if (redirected.finalUrl === null) checks.push({ ok: false, msg: `the legacy URL never reached a page on ${origin}: the page was unreachable${redirected.error ? ` (${redirected.error})` : ''}` })
  else checks.push({ ok: redirected.finalUrl === LEGACY_WANT, msg: redirected.finalUrl === LEGACY_WANT ? `ended at ${redirected.finalUrl}` : `ended at ${redirected.finalUrl}, want ${LEGACY_WANT}` })
  if (direct.finalUrl === null) checks.push({ ok: false, msg: `the direct load of ${LEGACY_WANT} never reached a page on ${origin}: the page was unreachable${direct.error ? ` (${direct.error})` : ''}` })
  if (!directOk && direct.finalUrl !== null) {
    unverified = unverified || `history calibration failed: direct load of ${LEGACY_WANT} ended at ${direct.finalUrl}, length ${direct.historyLength}${direct.error ? ` (${direct.error})` : ''}`
  } else if (directOk && redirected.finalUrl === LEGACY_WANT) {
    if (!Number.isInteger(redirected.historyLength)) unverified = unverified || 'history length of the redirected page could not be read'
    else checks.push({ ok: redirected.historyLength === direct.historyLength,
      msg: `history length ${redirected.historyLength} after the redirect vs ${direct.historyLength} for a direct load (equal means the redirect added no entry)` })
  }
  return verdict(checks, m, { unverified })
}

// A still, not a stream. Every stylesheet is answered with an empty body, so the bundled CSS (which
// also sets html{background:#05070a}) cannot paint anything and only the inline head block of
// quiet-machine/index.html can provide a background or the cover. The page arrives synthetically
// (the init script presets the fade flag, as in synthetic-arrival), the case waits for
// DOMContentLoaded plus two animation frames, asserts the cover is up (data-fade="in", read before
// and after the screenshot) and judges one screenshot of the new document, which is the new document
// by construction. Expected: unmutated build = opaque dark cover (about 0% bright); removing
// html{background} and the ::after background from the inline block (the plan mutation) = the default
// white canvas (about 100% bright), because the empty stylesheet removes the bundled background too.
// FAIL only on a measured bright frame (>= BRIGHT_FRACTION of pixels above BRIGHT_LUMA). Evidence that
// is missing is UNVERIFIED, never PASS: no stylesheet intercepted, a linked stylesheet that still has
// rules, the cover not up at the screenshot, an undecodable image, or the wrong document.
async function caseNoWhiteFrame(c) {
  const { page } = c
  const css = { requests: 0, urls: [] }
  await page.route(u => new URL(String(u)).pathname.endsWith('.css'), route => {
    css.requests++
    if (css.urls.length < 5) css.urls.push(new URL(route.request().url()).pathname)
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 }) // synthetic arrival (init script seeds the flag)
  const fadeBefore = await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(document.documentElement.getAttribute('data-fade'))))))
  const png = await page.screenshot({ type: 'png' }) // no `animations`, no `omitBackground`: both would hide a white canvas
  const state = await page.evaluate(() => {
    const el = document.documentElement
    const linked = [...document.styleSheets].filter(s => s.ownerNode && s.ownerNode.tagName === 'LINK')
    let rules = 0, unreadable = 0
    for (const s of linked) { try { rules += s.cssRules.length } catch { unreadable++ } }
    return { fade: el.getAttribute('data-fade'), path: location.pathname, linkedSheets: linked.length, linkedRules: rules, linkedUnreadable: unreadable,
      htmlBackground: getComputedStyle(el).backgroundColor, coverBackground: getComputedStyle(el, '::after').backgroundColor }
  })
  const shot = path.join(out, 'no-white-frame.png')
  fs.writeFileSync(shot, png)
  let bright = null, dark = null, decodeError = null, size = null
  try {
    const { width, height, channels, data } = pixels(png)
    let b = 0, d = 0
    for (let i = 0; i < data.length; i += channels) {
      const luma = (.2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]) / 255
      if (luma > BRIGHT_LUMA) b++
      else if (luma < .1) d++
    }
    bright = b / (width * height); dark = d / (width * height); size = `${width}x${height}`
  } catch (e) { decodeError = String(e && e.message || e).split('\n')[0] }
  const m = { screenshot: path.relative(process.cwd(), shot), size, brightFraction: round(bright, 4), darkFraction: round(dark, 4), brightFractionLimit: BRIGHT_FRACTION, lumaLimit: BRIGHT_LUMA,
    fadeBeforeShot: fadeBefore, fadeAfterShot: state.fade, documentPath: state.path, cssRequestsEmptied: css.requests, cssUrls: css.urls,
    linkedSheets: state.linkedSheets, linkedRulesAfterEmptying: state.linkedRules, linkedUnreadable: state.linkedUnreadable,
    htmlBackground: state.htmlBackground, coverBackground: state.coverBackground, decodeError }
  const why = []
  if (state.path !== '/quiet-machine/') why.push(`the judged document was ${state.path}, not the Quiet Machine page`)
  if (css.requests === 0) why.push('no stylesheet request was intercepted, so the bundled CSS may still be painting the background and the mutation cannot go red from this run')
  else if (state.linkedRules !== 0 || state.linkedUnreadable) why.push(`a linked stylesheet still has ${state.linkedRules} rule(s) (${state.linkedUnreadable} unreadable) after the stylesheets were emptied`)
  if (fadeBefore !== 'in' || state.fade !== 'in') why.push(`the cover was not up: data-fade was ${JSON.stringify(fadeBefore)} before and ${JSON.stringify(state.fade)} after the screenshot (want "in" both)`)
  if (decodeError) why.push(`the screenshot could not be decoded by pixels() (${decodeError})`)
  if (why.length) return { status: 'UNVERIFIED', measurements: m, message: why.join('; ') }
  const checks = [
    { ok: bright < BRIGHT_FRACTION, msg: `bright fraction ${m.brightFraction} (limit ${BRIGHT_FRACTION}, luma > ${BRIGHT_LUMA}) with the stylesheets emptied and the cover up${bright >= BRIGHT_FRACTION ? '; the inline head block does not cover the page on its own' : ''}` },
  ]
  return verdict(checks, m)
}

// Reduced motion on arrival: the reduced-motion cut covers leaving; this covers arriving. A fresh
// flag is seeded before the document starts and a MutationObserver on <html> records every value
// data-fade ever takes, from document start. Under reduced motion the page must set none and consume
// the flag. This is the runtime proof of the QM6a fix. Against a pre-QM6a build the inline head
// script sets data-fade="in" and the page then sets "release" under reduced motion, so the values
// check fails and the case is expected to FAIL; a QM6a build never sets it. The flag-absent check
// holds for both builds (the old script also removed the key) and is not the differentiator.
async function caseReducedMotionArrival(c) {
  const { page, context } = c
  await context.addInitScript(opts => {
    if (location.pathname !== opts.qmPath) return
    const rm = (window.__rmFade = { seeded: null, values: [], mutations: 0 })
    try { sessionStorage.setItem(opts.key, String(Date.now())); rm.seeded = sessionStorage.getItem(opts.key) } catch { rm.seeded = 'unwritable' }
    new MutationObserver(records => {
      const mine = records.filter(r => r.target === document.documentElement)
      mine.forEach((r, i) => {
        const v = i + 1 < mine.length ? mine[i + 1].oldValue : document.documentElement.getAttribute('data-fade')
        rm.mutations++
        if (v !== null) rm.values.push(v)
      })
    }).observe(document, { attributes: true, attributeFilter: ['data-fade'], attributeOldValue: true, subtree: true })
  }, { key: FADE_KEY, qmPath: '/quiet-machine/' })
  await page.goto(QM, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const rendered = await page.waitForFunction(() => document.querySelector('.qm-poster') ? 'poster' : document.querySelector('canvas') ? 'canvas' : false,
    null, { timeout: 60000 }).then(h => h.jsonValue(), () => 'timeout')
  await sleep(1000) // late writers (a release timer, a cap) must have had their chance
  const snap = await page.evaluate(key => ({ rm: window.__rmFade ? { seeded: window.__rmFade.seeded, values: window.__rmFade.values.slice(), mutations: window.__rmFade.mutations } : null,
    attrNow: document.documentElement.getAttribute('data-fade'), flag: sessionStorage.getItem(key),
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, poster: document.querySelectorAll('.qm-poster').length, canvas: document.querySelectorAll('canvas').length }), FADE_KEY)
  // Observer proof, after the snapshot: a probe write must be seen, or "never took a value" is vacuous.
  const probeSeen = await page.evaluate(async () => {
    const el = document.documentElement, before = window.__rmFade ? window.__rmFade.values.length : 0
    el.setAttribute('data-fade', 'probe')
    await new Promise(r => setTimeout(r, 50))
    const seen = !!window.__rmFade && window.__rmFade.values.slice(before).includes('probe')
    el.removeAttribute('data-fade')
    return seen
  })
  const seeded = snap.rm ? snap.rm.seeded : null
  const values = snap.rm ? snap.rm.values : []
  const m = { reducedMotionMatches: snap.reduced, seededFlag: seeded, observerProbeSeen: probeSeen, dataFadeValuesEverTaken: values, dataFadeMutations: snap.rm ? snap.rm.mutations : null,
    dataFadeAtEnd: snap.attrNow, flagAfterLoad: snap.flag, rendered, posterCount: snap.poster, canvasCount: snap.canvas }
  const checks = [
    { ok: values.length === 0, msg: values.length ? `data-fade took ${JSON.stringify(values)} under reduced motion` : 'data-fade never took a value' },
    { ok: snap.flag === null, msg: snap.flag === null ? `sessionStorage['${FADE_KEY}'] absent after load` : `sessionStorage['${FADE_KEY}'] still present after load (${snap.flag})` },
    { ok: snap.poster > 0 || snap.canvas > 0, msg: snap.poster > 0 || snap.canvas > 0 ? `page rendered (${snap.poster ? 'poster' : 'canvas'})` : 'neither .qm-poster nor a canvas rendered' },
  ]
  const unverified = !snap.reduced ? 'prefers-reduced-motion did not match in the page; the reduced-motion path was not exercised'
    : !/^\d+$/.test(String(seeded)) ? `the fade flag was not seeded before the document started (${seeded})`
    : !snap.rm ? 'the data-fade recorder never installed in the page'
    : !probeSeen ? 'the data-fade observer did not see a probe write on <html>; "never took a value" cannot be trusted' : null
  return verdict(checks, m, { unverified,
    finding: 'expected to FAIL against a build without QM6a: its inline head script sets data-fade="in" under reduced motion and the page then sets "release" (QM6a never sets data-fade under reduced motion; both builds consume the flag, so the flag is not what differs); on a QM6a build this is a real regression of the reduced-motion fix' })
}

// ---- run -----------------------------------------------------------------------------------

// Reads the launched browser's own command line from chrome://version, so a Back case that claims
// bfcache was enabled can show the flag is really gone. null means the page could not be read.
async function commandLineHasFlag(b, flag) {
  let ctx = null
  try {
    ctx = await b.newContext()
    const p = await ctx.newPage()
    await p.goto('chrome://version', { timeout: 10000 })
    return (await p.locator('#command_line').innerText({ timeout: 5000 })).includes(flag)
  } catch { return null } finally { if (ctx) await ctx.close().catch(() => {}) }
}

const report = { capturedAt: new Date().toISOString(), url: origin, viewport: `${viewport.width}x${viewport.height}`, out, constants, expectedCases: EXPECTED_CASES, cases: [], result: null }
let browser = null
try {
  browser = await launch()
  report.browserVersion = browser.version()
  const plan = [
    ['fade-out', { browser }, caseFadeOut],
    ['synthetic-arrival', { browser, preset: true }, caseSyntheticArrival],
    ['back', null, caseBack], // its own browser: Playwright disables bfcache by default
    ['reduced-motion-cut', { browser, reducedMotion: true }, caseReducedMotion],
    ['legacy-redirect', { browser, video: false }, caseLegacyRedirect], // opens its own contexts; no page of its own is used
    ['no-white-frame', { browser, preset: true, video: false }, caseNoWhiteFrame],
    ['reduced-motion-arrival', { browser, reducedMotion: true, video: false }, caseReducedMotionArrival], // seeds its own flag; proof of QM6a
  ]
  if (plan.length !== EXPECTED_CASES) throw new Error(`plan has ${plan.length} cases, expected ${EXPECTED_CASES}`)
  for (const [name, opts, fn] of plan) {
    let bf = null, entry
    try {
      if (opts) entry = await runCase(name, opts, fn)
      else {
        // --disable-back-forward-cache is a Playwright default launch arg (playwright-core
        // chromiumSwitches.js, a standalone arg, not part of --disable-features); drop it for this case
        // only, so a restore can actually happen. persisted=false in the result still means UNVERIFIED.
        bf = await launch({ ignoreDefaultArgs: ['--disable-back-forward-cache'] })
        const flagPresent = await commandLineHasFlag(bf, '--disable-back-forward-cache')
        entry = await runCase(name, { browser: bf }, fn)
        entry.measurements = { ...entry.measurements, disableBackForwardCacheFlagStillOnCommandLine: flagPresent } // null: chrome://version unreadable
      }
    } catch (e) { entry = { name, status: 'FAIL', measurements: {}, message: `error: ${String(e.message).split('\n')[0]}` } }
    finally { if (bf) await bf.close().catch(() => {}) }
    report.cases.push(entry)
    console.log(`${entry.status.padEnd(10)} ${name.padEnd(23)} ${entry.message}`)
  }
} catch (e) {
  report.error = String(e && e.stack || e)
  console.error(`run error: ${String(e && e.message || e).split('\n')[0]}`)
  process.exitCode = 1
} finally {
  if (browser) await browser.close().catch(() => {})
  const failed = report.cases.some(c => c.status === 'FAIL') || !!report.error || report.cases.length < EXPECTED_CASES
  const unverified = report.cases.some(c => c.status === 'UNVERIFIED')
  report.result = failed ? 'FAIL' : unverified ? 'UNVERIFIED-PRESENT' : 'PASS'
  // UNVERIFIED is not a gate pass: only `back` may stay UNVERIFIED without failing the gate.
  const incomplete = report.cases.filter(c => c.status === 'UNVERIFIED' && c.name !== 'back').map(c => c.name)
  report.gateIncomplete = incomplete
  report.videos = report.cases.map(c => ({ case: c.name, ...(c.video || {}) }))
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
  console.log(`report: ${path.join(out, 'report.json')}`)
  for (const v of report.videos) console.log(`video ${v.case}: ${v.file || `none (${v.note || 'n/a'})`}`)
  if (incomplete.length) console.log(`GATE-INCOMPLETE: ${incomplete.join(', ')}`)
  console.log(`RESULT: ${report.result}${!unverified ? ''
    : incomplete.length ? ` (GATE-INCOMPLETE: ${incomplete.join(', ')}; UNVERIFIED is not a pass, an UNVERIFIED case other than back is a failed gate)`
    : ' (only back is UNVERIFIED; not a failed gate)'}`)
  if (failed) process.exitCode = 1
}
