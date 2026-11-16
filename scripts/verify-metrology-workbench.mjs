#!/usr/bin/env node
/**
 * Metrology workbench browser verifier (feat/metrology-models).
 *
 * Scope (exact): drives the live /torque-wrench/ page through Playwright and reports what the RUNTIME
 * exposes: window.__metrologyWorkbench (snapshot footprints, nudgeProp, moveCursorNdc) and
 * window.__torqueWorld.snapshot() (ready, sheet.baked, renderer, opening). Footprint checks are
 * recomputed here independently from the runtime-reported oriented footprints; they are NOT a pixel
 * or mesh-vertex proof. Screenshots are captured evidence, not an acceptance judgement.
 *
 * Per case (viewport x progress), in a FRESH context/page:
 *   1. load at scroll 0; wait for ready && sheet.baked && workbench loaded === true, loadError null,
 *      all 14 props with localBounds (actual GLB meshes swapped in) -- nothing is sampled before that;
 *   2. install an in-page per-frame monitor (violations, displacement, opening.fracture);
 *   3. seek via __torqueNarrative.scrollFraction(p) + scrollTo (behavior instant), settle ~3 s;
 *   4. capture loaded telemetry, console/page/network errors, screenshot;
 *   5. renderer metrics WITH props, then with props hidden (material.visible only, never
 *      mesh.visible -- the frame loop rewrites that) then restored; restoration is verified;
 *   6. stress: cursor sweep, hostile nudges (keep-out / off-plate / onto neighbours), observed
 *      shockwave (opening.fracture > 0.04) -- violations must stay empty at every settled frame.
 *
 * Browser launch uses scripts/lib/browser-launch.mjs (launchBrowser). Use http://localhost:<port>
 * (vite refuses 127.0.0.1). Boundaries: starts no server/build; writes only under the output dir
 * (default <repo>/.scratch/metrology-review). No commit/push/deploy.
 *
 * Exit: 0 all checks passed, 1 a check failed, 2 usage, 10 required observable missing,
 * 11 browser/environment blocked, 12 report-write failure.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { describeLaunch, launchBrowser } from './lib/browser-launch.mjs'
import { footprintViolations } from './lib/metrology-footprint-audit.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_OUT = path.join(ROOT, '.scratch', 'metrology-review')
const ASSET = path.join(ROOT, 'public', 'models', 'metrology-tools.glb')
const VIEWPORTS = {
  desktop: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  narrow: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
}
const DEFAULTS = { url: 'http://localhost:5199/torque-wrench/', progress: [0.2, 0.445], viewports: ['desktop', 'narrow'],
  expectProps: 14, maxTriangles: 120000, readyTimeoutMs: 150000, settleMs: 3000, sweepCols: 11, sweepRows: 7 }


function usage(code, message) {
  if (message) console.error(message)
  console.error('usage: node scripts/verify-metrology-workbench.mjs [--url=http://localhost:5199/torque-wrench/] [--out=DIR]\n' +
    '  [--progress=0.2,0.445] [--viewports=desktop,narrow] [--expect-props=14] [--max-triangles=120000]\n' +
    '  [--ready-timeout-ms=150000] [--settle-ms=3000] [--sweep=11x7]')
  process.exit(code)
}

function parseArgs(argv) {
  const o = { ...DEFAULTS, out: DEFAULT_OUT }
  for (const arg of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(arg)
    if (!m) usage(2, 'unrecognised argument ' + arg)
    const [, k, v] = m
    if (k === 'help') usage(0)
    else if (k === 'url') o.url = v
    else if (k === 'out') o.out = path.resolve(v)
    else if (k === 'progress') o.progress = v.split(',').map(Number)
    else if (k === 'viewports') o.viewports = v.split(',')
    else if (k === 'expect-props') o.expectProps = Number(v)
    else if (k === 'max-triangles') o.maxTriangles = Number(v)
    else if (k === 'ready-timeout-ms') o.readyTimeoutMs = Number(v)
    else if (k === 'settle-ms') o.settleMs = Number(v)
    else if (k === 'sweep') { const [c, r] = v.split('x').map(Number); o.sweepCols = c; o.sweepRows = r }
    else usage(2, 'unknown option --' + k)
  }
  if (!o.progress.every(p => Number.isFinite(p) && p >= 0 && p <= 1)) usage(2, 'progress values must be within 0..1')
  for (const v of o.viewports) if (!VIEWPORTS[v]) usage(2, 'unknown viewport ' + v)
  let u
  try { u = new URL(o.url) } catch { usage(2, 'invalid --url') }
  if (u.hostname === '127.0.0.1') usage(2, 'use http://localhost:<port>; vite refuses 127.0.0.1')
  return o
}

// ---- page-side helpers (each is self-contained and serialised by Playwright) -------------------

const READY_EXPR = '(() => { const w = window.__torqueWorld?.snapshot?.(); const m = window.__metrologyWorkbench?.snapshot?.();' +
  ' return Boolean(w && w.ready && w.sheet && w.sheet.baked && m && m.loaded === true && !m.loadError && !m.disposed) })()'

function describeReadiness() {
  const w = window.__torqueWorld?.snapshot?.(), m = window.__metrologyWorkbench?.snapshot?.()
  return { world: Boolean(w), ready: w?.ready ?? null, baked: w?.sheet?.baked ?? null, probe: Boolean(window.__metrologyWorkbench),
    loaded: m?.loaded ?? null, loadError: m?.loadError ?? null, disposed: m?.disposed ?? null, propCount: m?.props?.length ?? null,
    boundsLoaded: m ? m.props.filter(p => p.localBounds).length : null, narrative: Boolean(window.__torqueNarrative) }
}

function installMonitor(checkSource) {
  const check = (0, eval)('(' + checkSource + ')')
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const st = { running: true, phase: 'seek', frames: 0, perPhase: {}, maxDisplacedMm: {}, maxFracture: 0, shockFrames: 0, maxDisplacedInShockMm: 0,
    firstViolations: [], lastVisible: null, hiddenFrames: 0, lastFracture: 0, fractureFirst: null, shockSeekFrames: 0, shockSeekMaxMm: {},
    interactionAtInstall: window.__metrologyWorkbench.snapshot().interactionCount }
  const phaseOf = name => (st.perPhase[name] ||= { frames: 0, runtimeViolationFrames: 0, independentViolationFrames: 0, violations: {}, maxDisplacedMm: {}, maxAbsRoll: {}, nonFiniteFrames: 0 })
  window.__mv = { st, set phase(v) { st.phase = v }, get phase() { return st.phase } }
  ;(async () => {
    let tick = 0
    while (st.running) {
      await raf()
      const probe = window.__metrologyWorkbench
      if (!probe) continue
      const m = probe.snapshot()
      const ph = phaseOf(st.phase)
      st.frames++; ph.frames++
      st.lastVisible = m.visible
      if (!m.visible) st.hiddenFrames++
      const indep = check(m.props)
      if (m.violations.length) { ph.runtimeViolationFrames++; for (const v of m.violations) ph.violations['runtime ' + v] = (ph.violations['runtime ' + v] || 0) + 1 }
      if (indep.length) { ph.independentViolationFrames++; for (const v of indep) ph.violations[v] = (ph.violations[v] || 0) + 1
        if (st.firstViolations.length < 8) st.firstViolations.push({ phase: st.phase, frame: st.frames, violations: indep }) }
      let maxD = 0, finite = true
      for (const p of m.props) {
        st.maxDisplacedMm[p.id] = Math.max(st.maxDisplacedMm[p.id] || 0, p.displacedMm); maxD = Math.max(maxD, p.displacedMm)
        ph.maxDisplacedMm[p.id] = Math.max(ph.maxDisplacedMm[p.id] || 0, p.displacedMm)
        ph.maxAbsRoll[p.id] = Math.max(ph.maxAbsRoll[p.id] || 0, Math.abs(p.rollAngle))
        if (![p.displacedMm, p.rotationZ, p.rollAngle, ...p.position].every(Number.isFinite) || p.footprint.some(v => !Number.isFinite(v[0]) || !Number.isFinite(v[1]))) finite = false
      }
      if (!finite) ph.nonFiniteFrames++
      if (st.lastFracture > 0.04) {
        st.shockFrames++; st.maxDisplacedInShockMm = Math.max(st.maxDisplacedInShockMm, maxD)
        // Shock evidence uncontaminated by cursor/nudge input: only frames of the seek phase (no pointer events yet).
        if (st.phase === 'seek') { st.shockSeekFrames++; for (const p of m.props) st.shockSeekMaxMm[p.id] = Math.max(st.shockSeekMaxMm[p.id] || 0, p.displacedMm) }
      }
      if (++tick % 3 === 0) {
        const w = window.__torqueWorld?.snapshot?.()
        const f = w?.opening?.fracture
        if (typeof f === 'number') { if (st.fractureFirst === null) st.fractureFirst = f; st.lastFracture = f; st.maxFracture = Math.max(st.maxFracture, f) }
      }
    }
  })()
}

async function pageRendererSample(frames) {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const rows = []
  for (let i = 0; i < frames; i++) { await raf(); const r = window.__torqueWorld.snapshot().renderer; rows.push({ calls: r.calls, triangles: r.triangles, geometries: r.geometries, textures: r.textures }) }
  const med = key => { const a = rows.map(r => r[key]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)] }
  const range = key => { const a = rows.map(r => r[key]); return [Math.min(...a), Math.max(...a)] }
  const keys = ['calls', 'triangles', 'geometries', 'textures']
  return { frames, median: Object.fromEntries(keys.map(k => [k, med(k)])), range: Object.fromEntries(keys.map(k => [k, range(k)])) }
}

function pageSetPropsHidden(hidden) {
  const probe = window.__metrologyWorkbench
  if (typeof probe.setMeasurementHidden === 'function') { probe.setMeasurementHidden(hidden); return { mechanism: 'setMeasurementHidden', materials: null } }
  const group = probe.group || (typeof probe.debugGroup === 'function' ? probe.debugGroup() : null)
  if (!group || typeof group.traverse !== 'function') return { mechanism: null, materials: 0 }
  const saved = (window.__mvHiddenMaterials ||= new Map())
  let count = 0
  if (hidden) {
    group.traverse(o => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of ms) { if (!saved.has(m)) saved.set(m, m.visible); m.visible = false; count++ } })
  } else {
    for (const [m, v] of saved) { m.visible = v; count++ }
    saved.clear()
  }
  return { mechanism: 'material.visible', materials: count }
}

function pageMaterialsRestored() {
  const probe = window.__metrologyWorkbench
  const group = probe.group || (typeof probe.debugGroup === 'function' ? probe.debugGroup() : null)
  if (!group) return null
  let hiddenLeft = 0
  group.traverse(o => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) if (m.visible === false) hiddenLeft++ })
  return { hiddenMaterialsLeft: hiddenLeft, savedMapEmpty: !(window.__mvHiddenMaterials && window.__mvHiddenMaterials.size) }
}

async function pageCursorSweep({ cols, rows }) {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const probe = window.__metrologyWorkbench
  const base = new Map(probe.snapshot().props.map(p => [p.id, { x: p.position[0], y: p.position[1], roll: p.rollAngle, th: p.rotationZ, kind: p.kind }]))
  const maxMoveMm = {}, maxRollDelta = {}, maxThetaDelta = {}, kinds = {}
  const track = () => {
    for (const p of probe.snapshot().props) {
      const b = base.get(p.id); kinds[p.id] = b.kind
      maxMoveMm[p.id] = Math.max(maxMoveMm[p.id] || 0, Math.hypot(p.position[0] - b.x, p.position[1] - b.y) * 1000)
      maxRollDelta[p.id] = Math.max(maxRollDelta[p.id] || 0, Math.abs(p.rollAngle - b.roll))
      maxThetaDelta[p.id] = Math.max(maxThetaDelta[p.id] || 0, Math.abs(p.rotationZ - b.th))
    }
  }
  let moves = 0
  const cursor = async (nx, ny) => {
    probe.moveCursorNdc(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny))); moves++
    await raf(); await raf(); track()
    return probe.snapshot().lastCursorLocal
  }
  // Targeted pass: calibrate NDC -> sheet-local from the runtime's own raycast (lastCursorLocal), then steer the
  // cursor onto each prop (quasi-Newton) and swipe across it, so the sweep really touches every reachable tool.
  const targeted = { calibrated: false, reached: [], unreachable: [] }
  const l0 = await cursor(0, 0), lx = await cursor(0.2, 0), ly = await cursor(0, 0.2)
  if (l0 && lx && ly) {
    const a = (lx[0] - l0[0]) / 0.2, c = (lx[1] - l0[1]) / 0.2, b = (ly[0] - l0[0]) / 0.2, d = (ly[1] - l0[1]) / 0.2
    const det = a * d - b * c
    if (Math.abs(det) > 1e-9) {
      targeted.calibrated = true
      const toNdc = (ex, ey) => [(d * ex - b * ey) / det, (-c * ex + a * ey) / det]
      for (const id of [...base.keys()]) {
        const cur = probe.snapshot().props.find(p => p.id === id)
        const tx = cur.position[0], ty = cur.position[1]
        let n = toNdc(tx - l0[0], ty - l0[1]), l = null, err = Infinity
        for (let it = 0; it < 6; it++) {
          l = await cursor(n[0], n[1]); if (!l) break
          const ex = tx - l[0], ey = ty - l[1]; err = Math.hypot(ex, ey)
          if (err < 0.004) break
          const dn = toNdc(ex, ey); n = [n[0] + dn[0], n[1] + dn[1]]
        }
        if (l && err < 0.01 && Math.abs(n[0]) <= 1 && Math.abs(n[1]) <= 1) {
          targeted.reached.push(id)
          for (const dir of [[1, 0], [0, 1]]) for (let s = 0; s <= 8; s++) {
            const k = (s / 8 * 2 - 1) * 0.025, dn = toNdc(dir[0] * k, dir[1] * k)
            await cursor(n[0] + dn[0], n[1] + dn[1])
          }
        } else targeted.unreachable.push(id + ' err=' + (Number.isFinite(err) ? Math.round(err * 1000) + 'mm' : 'no-hit') + ' ndc=' + n.map(v => Math.round(v * 100) / 100).join(','))
      }
    }
  }
  // Coarse grid + Lissajous pass over the whole viewport.
  for (let r = 0; r < rows; r++) {
    const y = rows === 1 ? 0 : -0.95 + (1.9 * r) / (rows - 1)
    for (let c = 0; c < cols; c++) {
      const cc = r % 2 ? cols - 1 - c : c
      const x = cols === 1 ? 0 : -0.95 + (1.9 * cc) / (cols - 1)
      await cursor(x, y)
    }
  }
  for (let i = 0; i < 60; i++) { const t = i / 60 * Math.PI * 2; probe.moveCursorNdc(0.8 * Math.sin(3 * t), 0.7 * Math.sin(2 * t + 0.6)); moves++; await raf(); track() }
  return { moves, kinds, maxMoveMm, maxRollDelta, maxThetaDelta, targeted }
}

async function pageHostileNudges(homes) {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const check = window.__mvCheck
  const probe = window.__metrologyWorkbench
  const mv = window.__mv
  const results = []
  const ids = homes.map(h => h.id)
  const targetsFor = (h, i) => {
    const next = homes[(i + 1) % homes.length]
    return [['keep-out', 0, -0.2, h.theta + 0.5], ['off-plate-corner', 0.9, 0.6, 0], ['off-plate-left', -0.9, -0.3, 1.2], ['onto-neighbour', next.x, next.y, 0.3]]
  }
  for (let i = 0; i < homes.length; i++) {
    const h = homes[i]
    for (const [label, x, y, th] of targetsFor(h, i)) {
      mv.phase = 'nudge-transient'
      const beforeProp = probe.snapshot().props.find(p => p.id === h.id)
      const before = [beforeProp.position[0], beforeProp.position[1]]
      const accepted = probe.nudgeProp(h.id, x, y, th)
      for (let k = 0; k < 3; k++) await raf()
      mv.phase = 'nudge-settled'
      for (let k = 0; k < 24; k++) await raf()
      const snap = probe.snapshot()
      const me = snap.props.find(p => p.id === h.id)
      results.push({ id: h.id, target: label, requested: [x, y], accepted, before, resultingXY: me ? [me.position[0], me.position[1]] : null,
        movedMm: me ? Math.hypot(me.position[0] - before[0], me.position[1] - before[1]) * 1000 : null,
        independentViolations: check(snap.props), runtimeViolations: snap.violations })
    }
    probe.nudgeProp(h.id, h.x, h.y, h.theta)
    mv.phase = 'nudge-transient'
    for (let k = 0; k < 6; k++) await raf()
  }
  mv.phase = 'nudge-settled'
  for (let k = 0; k < 30; k++) await raf()
  return { count: results.length, ids, results }
}

// ---- node side ----------------------------------------------------------------------------------

const sleep = ms => new Promise(r => setTimeout(r, ms))
const gitHead = () => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim() } catch { return null } }

function assetFacts() {
  if (!existsSync(ASSET)) return { path: path.relative(ROOT, ASSET), present: false }
  const buf = readFileSync(ASSET)
  return { path: path.relative(ROOT, ASSET), present: true, bytes: buf.length, gzipBytes: gzipSync(buf, { level: 9 }).length,
    sha256: createHash('sha256').update(buf).digest('hex') }
}

async function runCase({ browser, opts, viewportName, progress, outDir }) {
  const tag = viewportName + '-p' + String(progress).replace('.', '_').replace(/^0_/, '')
  const record = { tag, viewport: viewportName, progress, checks: [], errors: { console: [], page: [], requestFailed: [], http: [], foreignOrigin: [] }, warnings: [] }
  const add = (name, pass, detail) => { record.checks.push({ name, pass: Boolean(pass), detail }); return Boolean(pass) }
  const context = await browser.newContext({ ...VIEWPORTS[viewportName], reducedMotion: 'no-preference' })
  const page = await context.newPage()
  page.setDefaultTimeout(180000)
  // Survives any navigation/reload (vite dev re-optimisation can reload the page mid-case).
  await context.addInitScript({ content: 'window.__mvCheck = ' + footprintViolations.toString() })
  let navigations = 0, navigationsAtReady = null
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++ })
  const origin = new URL(opts.url).origin
  page.on('console', msg => { const t = msg.type(); if (t === 'error') record.errors.console.push(msg.text().slice(0, 400)); else if (t === 'warning') record.warnings.push(msg.text().slice(0, 300)) })
  page.on('pageerror', err => record.errors.page.push(String(err && err.message || err).slice(0, 400)))
  page.on('requestfailed', req => { const f = req.failure()?.errorText || ''; if (!/ERR_ABORTED/.test(f)) record.errors.requestFailed.push(req.url().slice(0, 200) + ' ' + f) })
  page.on('response', res => { if (res.status() >= 400) record.errors.http.push(res.status() + ' ' + res.url().slice(0, 200)) })
  page.on('request', req => { const u = req.url(); if (/^https?:/.test(u) && new URL(u).origin !== origin) record.errors.foreignOrigin.push(u.slice(0, 200)) })
  try {
    await page.goto(opts.url, { waitUntil: 'domcontentloaded' })
    try { await page.waitForFunction(READY_EXPR, null, { timeout: opts.readyTimeoutMs, polling: 500 }) }
    catch (error) {
      record.readiness = await page.evaluate(describeReadiness).catch(() => null)
      add('ready: world ready + sheet baked + workbench loaded', false, 'timeout; ' + JSON.stringify(record.readiness))
      return record
    }
    // Every prop must have its actual GLB meshes swapped in (localBounds) before anything is sampled.
    try { await page.waitForFunction(count => { const m = window.__metrologyWorkbench.snapshot(); return m.props.length === count && m.props.every(p => p.localBounds) }, opts.expectProps, { timeout: 60000, polling: 500 }) } catch { /* reported below */ }
    record.readiness = await page.evaluate(describeReadiness)
    navigationsAtReady = navigations
    add('ready: all ' + opts.expectProps + ' props present with loaded asset bounds', record.readiness.propCount === opts.expectProps && record.readiness.boundsLoaded === opts.expectProps, JSON.stringify(record.readiness))
    if (!record.readiness.narrative) { add('required observable: window.__torqueNarrative', false, 'missing'); return record }
    const homes = await page.evaluate(() => window.__metrologyWorkbench.snapshot().props.map(p => ({ id: p.id, x: p.position[0], y: p.position[1], theta: p.rotationZ })))
    record.homes = homes
    await page.evaluate(installMonitor, footprintViolations.toString())

    // Seek.
    const seekTop = await page.evaluate(p => { const top = Math.round(window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight)); window.scrollTo({ top, behavior: 'instant' }); return top }, progress)
    await sleep(opts.settleMs)
    let narrative = null
    for (let i = 0; i < 20; i++) {
      narrative = await page.evaluate(() => window.__torqueNarrative.snapshot())
      if (Math.abs(narrative.progress - progress) < 0.015) break
      await sleep(500)
    }
    record.seek = { requested: progress, scrollTop: seekTop, narrative }
    add('seek reached requested progress (+-0.015)', Math.abs(narrative.progress - progress) < 0.015, 'actual ' + narrative.progress)

    // Loaded telemetry.
    const tel = await page.evaluate(() => { const m = window.__metrologyWorkbench.snapshot(); const w = window.__torqueWorld.snapshot()
      return { metrology: m, world: { ready: w.ready, sheet: w.sheet, renderer: w.renderer, opening: w.opening, progress: w.progress } } })
    record.telemetry = { visible: tel.metrology.visible, loaded: tel.metrology.loaded, loadError: tel.metrology.loadError, tier: tel.metrology.tier,
      assetTriangles: tel.metrology.assetTriangles, interactionCount: tel.metrology.interactionCount, violations: tel.metrology.violations,
      props: tel.metrology.props, world: tel.world }
    add('loaded telemetry: loaded true, no loadError, not disposed', tel.metrology.loaded === true && !tel.metrology.loadError && !tel.metrology.disposed, JSON.stringify({ loaded: tel.metrology.loaded, loadError: tel.metrology.loadError }))
    add('props visible at this progress', tel.metrology.visible === true, 'visible=' + tel.metrology.visible)
    add('assetTriangles within (0, ' + opts.maxTriangles + ']', tel.metrology.assetTriangles > 0 && tel.metrology.assetTriangles <= opts.maxTriangles, 'assetTriangles=' + tel.metrology.assetTriangles)
    const zMin = Math.min(...tel.metrology.props.map(p => p.localBounds ? p.localBounds.min[2] : 0))
    add('asset local z >= 0 (no prop below table plane / not on its side)', zMin >= -1e-4, 'min z ' + zMin)
    const restViolations = await page.evaluate(() => window.__mvCheck(window.__metrologyWorkbench.snapshot().props))
    add('rest: no independent footprint violations', restViolations.length === 0 && tel.metrology.violations.length === 0, JSON.stringify({ independent: restViolations, runtime: tel.metrology.violations }))
    await page.screenshot({ path: path.join(outDir, tag + '.png') })

    // Renderer metrics with / without props (hide only for the metric, then restore).
    const withProps = await page.evaluate(pageRendererSample, 30)
    const hideInfo = await page.evaluate(pageSetPropsHidden, true)
    let without = null, afterRestore = null, restoreInfo = null, restoreCheck = null
    if (hideInfo.mechanism) {
      try { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))) ; without = await page.evaluate(pageRendererSample, 30) }
      finally { restoreInfo = await page.evaluate(pageSetPropsHidden, false) }
      restoreCheck = await page.evaluate(pageMaterialsRestored)
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))))
      afterRestore = await page.evaluate(pageRendererSample, 30)
    }
    const delta = (a, b) => a && b ? Object.fromEntries(Object.keys(a.median).map(k => [k, a.median[k] - b.median[k]])) : null
    record.renderer = { withProps, withoutProps: without, afterRestore, hide: hideInfo, restore: restoreInfo, restoreCheck, propsContribution: delta(withProps, without) }
    if (!hideInfo.mechanism) add('renderer subtraction available (probe.setMeasurementHidden or probe.group)', false, 'no hide hook on window.__metrologyWorkbench; with-props metrics only')
    else {
      add('renderer subtraction: props hidden then restored', Boolean(restoreCheck ? restoreCheck.hiddenMaterialsLeft === 0 && restoreCheck.savedMapEmpty : true) && afterRestore.median.calls === withProps.median.calls,
        'with ' + JSON.stringify(withProps.median) + ' hidden ' + JSON.stringify(without.median) + ' restored ' + JSON.stringify(afterRestore.median))
      add('props contribute renderer work when visible', record.renderer.propsContribution.calls > 0 || record.renderer.propsContribution.triangles > 0, JSON.stringify(record.renderer.propsContribution))
    }

    // Stress.
    const afterSeek = await page.evaluate(() => { const m = window.__metrologyWorkbench.snapshot(); window.__mv.phase = 'sweep'; return { n: m.interactionCount, cursor: m.lastCursorLocal } })
    record.interactionAfterSeek = afterSeek.n; record.cursorAfterSeek = afterSeek.cursor
    const sweep = await page.evaluate(pageCursorSweep, { cols: opts.sweepCols, rows: opts.sweepRows })
    const moves = sweep.moves
    record.sweep = sweep
    await page.evaluate(() => { window.__mv.phase = 'settle-after-sweep' })
    await sleep(1500)
    record.sweepMoves = moves
    record.nudge = await page.evaluate(pageHostileNudges, homes)
    const nudgeBad = record.nudge.results.filter(r => r.independentViolations.length || r.runtimeViolations.length)
    add('hostile nudges (' + record.nudge.count + ') report no synchronous violation', nudgeBad.length === 0, nudgeBad.length ? JSON.stringify(nudgeBad.slice(0, 4)) : 'ok')
    const r1 = n => Math.round(n * 10) / 10
    // Shock: world snapshot spreads the intro state into opening, so opening.fracture is the field. Evidence uses seek-phase frames only (no pointer input).
    // Read without stopping the monitor; the same monitor keeps recording transient and recovery frames below.
    const monBeforeRecovery = await page.evaluate(() => window.__mv.st)
    const fractureAtSeek = tel.world.opening ? tel.world.opening.fracture : null
    const shockExpected = typeof fractureAtSeek === 'number' && fractureAtSeek > 0.04
    const seekMax = Math.max(0, ...Object.values((monBeforeRecovery.perPhase.seek || {}).maxDisplacedMm || {}))
    const shockPeak = Math.max(0, ...Object.values(monBeforeRecovery.shockSeekMaxMm))
    record.shock = { fractureAtSeek, fractureFirstSample: monBeforeRecovery.fractureFirst, maxFracture: monBeforeRecovery.maxFracture, framesAboveThreshold: monBeforeRecovery.shockFrames, shockSeekFrames: monBeforeRecovery.shockSeekFrames,
      shockSeekPeakMm: r1(shockPeak), shockSeekMaxMmByProp: monBeforeRecovery.shockSeekMaxMm, seekPhaseMaxMm: r1(seekMax), interactionAtInstall: monBeforeRecovery.interactionAtInstall, interactionAfterSeek: record.interactionAfterSeek }
    if (shockExpected) {
      add('shock (opening.fracture ' + r1(fractureAtSeek * 1000) / 1000 + ' > 0.04, before any cursor input): >=1 prop jolted by 0.5..200 mm', monBeforeRecovery.shockSeekFrames > 0 && shockPeak > 0.5 && shockPeak <= 200, JSON.stringify({ frames: monBeforeRecovery.shockSeekFrames, peakMm: r1(shockPeak), byProp: monBeforeRecovery.shockSeekMaxMm }))
      // The runtime counts its own shock impulses in interactionCount (one per prop), so cursor-freedom is proven by lastCursorLocal staying null and at most one impulse per prop.
      const seekImpulses = record.interactionAfterSeek - monBeforeRecovery.interactionAtInstall
      add('shock is not cursor-driven (no cursor sample during seek; <= one impulse per prop)', record.cursorAfterSeek === null && seekImpulses >= 1 && seekImpulses <= homes.length, 'lastCursorLocal ' + JSON.stringify(record.cursorAfterSeek) + '; impulses ' + seekImpulses + ' for ' + homes.length + ' props')
    } else {
      add('no shock before breakthrough (opening.fracture ' + fractureAtSeek + '): props stay at rest <= 0.5 mm through seek', seekMax <= 0.5, 'max displacement ' + r1(seekMax) + ' mm; interactionCount ' + monBeforeRecovery.interactionAtInstall + ' -> ' + record.interactionAfterSeek)
    }
    const sweepMoved = Object.entries(sweep.maxMoveMm).filter(e => e[1] > 0.5)
    const reached = sweep.targeted.reached.length
    if (reached === 0) {
      add('cursor coverage classified: no tool reachable in this camera framing', true, 'movement/rolling not asserted in this case; the report requires proof from at least one reachable checkpoint; calibration=' + sweep.targeted.calibrated + '; unreachable=' + JSON.stringify(sweep.targeted.unreachable))
      record.warnings.push('no cursor-reachable tool in this camera framing; cursor movement/rolling deferred to the global reachable-checkpoint requirement')
    } else {
      add('cursor sweep (' + sweep.moves + ' moves, ' + reached + ' reached) displaced >= 1 prop by > 0.5 mm relative to sweep start', sweepMoved.length >= 1, JSON.stringify({ reached: sweep.targeted.reached, unreachable: sweep.targeted.unreachable, calibrated: sweep.targeted.calibrated, moveMm: Object.fromEntries(Object.entries(sweep.maxMoveMm).map(e => [e[0], r1(e[1])])) }))
    }
    const rollers = Object.keys(sweep.kinds).filter(id => sweep.kinds[id] === 'roller')
    const rolled = rollers.filter(id => sweep.maxRollDelta[id] > 1e-3)
    if (reached > 0) add('roller coupling among reached tools: >= 1 roller rolled (> 1e-3 rad) during cursor sweep', rolled.length >= 1, JSON.stringify(Object.fromEntries(rollers.map(id => [id, { moveMm: r1(sweep.maxMoveMm[id]), rollRad: Math.round(sweep.maxRollDelta[id] * 1e4) / 1e4 }]))))
    const nudgeAccepted = record.nudge.results.filter(r => r.accepted === true).length
    add('every hostile nudge accepted (' + nudgeAccepted + '/' + record.nudge.count + ')', nudgeAccepted === record.nudge.count, 'accepted ' + nudgeAccepted)
    const nudgeMoved = record.nudge.results.filter(r => typeof r.movedMm === 'number' && r.movedMm > 0.5).length
    add('hostile nudges actually moved props (>= 50% by > 0.5 mm)', nudgeMoved >= record.nudge.count * 0.5, nudgeMoved + '/' + record.nudge.count)
    // Spring leash returns props home slowly: monitor recovery, then stop only after the final settled frame.
    await page.evaluate(() => { window.__mv.phase = 'recovery' })
    const homePoll = await page.evaluate(async () => {
      const t0 = performance.now(), rows = []
      const read = () => { const s = window.__metrologyWorkbench.snapshot(); return { max: Math.max(...s.props.map(p => p.displacedMm)), by: Object.fromEntries(s.props.map(p => [p.id, p.displacedMm])) } }
      let cur = read()
      while (cur.max > 5 && performance.now() - t0 < 25000) { await new Promise(r => setTimeout(r, 500)); cur = read(); rows.push([Math.round(performance.now() - t0), Math.round(cur.max * 10) / 10]) }
      return { elapsedMs: Math.round(performance.now() - t0), max: cur.max, by: cur.by, rows: rows.filter((_, i) => i % 6 === 0) }
    })
    record.finalDisplacedMm = homePoll.by; record.homePoll = { elapsedMs: homePoll.elapsedMs, max: homePoll.max, rows: homePoll.rows }
    add('props return home after stress (max residual <= 5 mm within 25 s)', homePoll.max <= 5, 'max ' + r1(homePoll.max) + ' mm after ' + homePoll.elapsedMs + ' ms; trajectory ' + JSON.stringify(homePoll.rows) + ' ' + JSON.stringify(Object.fromEntries(Object.entries(homePoll.by).map(e => [e[0], r1(e[1])]))))
    const mon = await page.evaluate(() => { window.__mv.st.running = false; return window.__mv.st })
    record.monitor = mon
    const nonFinite = Object.entries(mon.perPhase).filter(e => e[1].nonFiniteFrames > 0)
    add('all prop positions/rotations/roll/footprints finite in every frame', nonFinite.length === 0, JSON.stringify(nonFinite.map(e => [e[0], e[1].nonFiniteFrames])))
    for (const [phase, v] of Object.entries(mon.perPhase)) {
      add('monitor phase "' + phase + '": no violation frames (' + v.frames + ' frames)', v.independentViolationFrames === 0 && v.runtimeViolationFrames === 0, JSON.stringify(v.violations))
    }

    add('no console errors / page errors', record.errors.console.length === 0 && record.errors.page.length === 0, JSON.stringify({ console: record.errors.console.slice(0, 3), page: record.errors.page.slice(0, 3) }))
    add('no failed requests / HTTP >= 400', record.errors.requestFailed.length === 0 && record.errors.http.length === 0, JSON.stringify({ failed: record.errors.requestFailed.slice(0, 3), http: record.errors.http.slice(0, 3) }))
    add('no requests outside ' + origin + ' (no CDN)', record.errors.foreignOrigin.length === 0, JSON.stringify(record.errors.foreignOrigin.slice(0, 3)))
  } catch (error) {
    if (/Execution context was destroyed|navigation|Target (page|closed)/i.test(String(error && error.message || error))) record.contextDestroyed = true
    add('case completed without script exception', false, String(error && error.stack || error).slice(0, 800))
  } finally {
    record.reloadedAfterReady = Boolean(record.contextDestroyed) || (navigationsAtReady !== null && navigations > navigationsAtReady)
    if (record.reloadedAfterReady) record.checks.push({ name: 'page was not reloaded after ready (a reload invalidates the monitor and telemetry)', pass: false, detail: 'navigations ' + navigations + ' vs ' + navigationsAtReady + ' at ready' })
    await context.close().catch(() => {})
  }
  return record
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  try { mkdirSync(opts.out, { recursive: true }) } catch (error) { console.error('cannot create output dir: ' + error.message); process.exit(12) }
  let playwright
  try { playwright = await import('playwright') } catch (error) { console.error('playwright not resolvable: ' + error.message); process.exit(11) }
  let browser
  try { browser = await launchBrowser(playwright.chromium) } catch (error) { console.error('browser launch failed: ' + error.message); process.exit(11) }
  const started = new Date().toISOString()
  const cases = []
  try {
    for (const viewportName of opts.viewports) for (const progress of opts.progress) {
      console.log('case ' + viewportName + ' p=' + progress)
      let c = await runCase({ browser, opts, viewportName, progress, outDir: opts.out })
      const attempts = [{ reloadedAfterReady: Boolean(c.reloadedAfterReady), failed: c.checks.filter(x => !x.pass).map(x => x.name) }]
      // A mid-case page reload is an environment event (dev-server re-optimisation), not a product result: rerun that case in a fresh page, keeping every attempt in the report.
      while (c.reloadedAfterReady && attempts.length < 3) {
        console.log('  page reloaded after ready; rerunning case (attempt ' + (attempts.length + 1) + ')')
        c = await runCase({ browser, opts, viewportName, progress, outDir: opts.out })
        attempts.push({ reloadedAfterReady: Boolean(c.reloadedAfterReady), failed: c.checks.filter(x => !x.pass).map(x => x.name) })
      }
      c.attempts = attempts
      const failed = c.checks.filter(x => !x.pass)
      console.log('  ' + (failed.length ? 'FAIL ' + failed.length + '/' + c.checks.length : 'PASS ' + c.checks.length) + (failed.length ? ': ' + failed.map(f => f.name).join(' | ') : ''))
      cases.push(c)
    }
  } finally { await browser.close().catch(() => {}) }
  const cursorProofCases = cases.filter(c => {
    const sweep = c.sweep
    if (!sweep || !sweep.targeted.reached.length) return false
    const moved = Object.values(sweep.maxMoveMm).some(v => v > 0.5)
    const rollerIds = Object.keys(sweep.kinds).filter(id => sweep.kinds[id] === 'roller')
    return moved && rollerIds.some(id => sweep.maxRollDelta[id] > 1e-3)
  })
  const globalCursorFailure = cursorProofCases.length ? null : 'global: no reachable checkpoint proved cursor-driven translation plus roller coupling'
  const failedChecks = cases.flatMap(c => c.checks.filter(x => !x.pass).map(x => c.tag + ': ' + x.name))
  if (globalCursorFailure) failedChecks.push(globalCursorFailure)
  const report = { tool: 'verify-metrology-workbench', startedAt: started, finishedAt: new Date().toISOString(), head: gitHead(), url: opts.url, launch: describeLaunch(),
    options: { progress: opts.progress, viewports: opts.viewports, expectProps: opts.expectProps, maxTriangles: opts.maxTriangles },
    asset: assetFacts(), cursorProofCases: cursorProofCases.map(c => c.tag), scope: 'runtime-reported oriented footprints + renderer.info; not pixel or mesh-vertex proof; software GL is not a hardware pass',
    passed: failedChecks.length === 0, failedChecks, cases }
  const reportPath = path.join(opts.out, 'metrology-workbench-report.json')
  try { writeFileSync(reportPath, JSON.stringify(report, null, 2)) } catch (error) { console.error('report write failed: ' + error.message); process.exit(12) }
  console.log((report.passed ? 'PASS' : 'FAIL') + ' report ' + reportPath)
  if (!report.passed) console.log(failedChecks.map(f => ' - ' + f).join('\n'))
  process.exit(report.passed ? 0 : 1)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
