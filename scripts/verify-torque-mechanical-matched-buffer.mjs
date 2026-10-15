// JG-038 matched-buffer transform diagnostic, derived from frozen parity harness.
// Only legacy renderer resolution is intervened on; private tier remains natural.
// Not natural legacy behavior, performance/G8 evidence, or owner acceptance.
// No imports of product applicators, no writes to a rig/store, no module interception.
// See evidence/07-autonomous-2026-10-12/stage3-mechanical-parity-method.md for probe contracts.
import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchConfig } from './lib/browser-launch.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EVIDENCE = path.join(ROOT, 'project/work/evidence/torque-wrench-rebuild/07-autonomous-2026-10-12')
const STAGES = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5']
const PARTS = ['A000591/P001836', 'A000592/P001837', 'A000860/P003045', 'A000861/P003047', 'A000606/P001849']
const OFFSETS = [-0.255, -0.230, -0.142, -0.099, -0.177]
const TURNS = [8, 5.2, 2.2, 1.43, 3.38]
const POSITION_EPS = 1e-4 // contract18: 0.1 mm
const ANGLE_EPS = Math.PI / 180 * 0.01 // contract18: 0.01 degree; unwrapped Euler angles
const CHANNEL_EPS = 1e-4
const INPUT_EPS = 1e-7 // tighter than transform acceptance; never estimate inputs from outputs
const VIEWPORTS = {
  D: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  N: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
}
const CASES = [
  { id: 'rest', p: 0 },
  { id: 'shift-half', p: 0.4875 },
  { id: 'shift-full', p: 0.515 },
  { id: 'ghost-partial', p: 0.5375 }, // opacity .575: exposes legacy/private depthWrite discrepancy
  { id: 'ghost-minimum', p: 0.575 },
  { id: 'explode-leading', p: 0.59375 },
  { id: 'explode-half', p: 0.6125 },
  { id: 'explode-late', p: 0.63125 },
  { id: 'full-ladder', p: 0.65 },
  { id: 'full-gear-sweep', p: 0.94 }, // inspection has retired; shift/explode/gear all saturated
]
const FIELDS = ['handleZ', 'outputZ', 'clutchZ', 'slidingZ', 'ringSwitchZ', 'ringSwitchRotZ',
  'stageZ', 'stageRot', 'planetRot', 'gearRotation', 'shift', 'explodeFactor', 'ghostOpacity', 'ghostCount']
const CHANNELS = ['shift', 'explode', 'gearAngle', 'idle', 'ghostOpacity']
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const finite = Number.isFinite
const close = (a, b, eps) => finite(a) && finite(b) && Math.abs(a - b) <= eps
const smooth = u => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x) }

// Independent reference for scheduling/input validation, NOT runtime evidence or an applicator.
export function mechanismAt(p) {
  const retire = 1 - smooth((p - 0.94) / 0.04)
  return { shift: smooth((p - 0.46) / 0.055) * retire,
    explode: smooth((p - 0.575) / 0.075) * retire,
    gearAngle: Math.PI * 8 * smooth((p - 0.52) / 0.17) * retire, idle: 0,
    ghostOpacity: 1 - smooth((p - 0.52) / 0.035) * (1 - smooth((p - 0.64) / 0.03)) * 0.85 }
}

const HELP = `usage: node scripts/verify-torque-mechanical-matched-buffer.mjs --url=http://localhost:<fresh-parent-port> [--out=<evidence-directory>]
  [--viewport=D|N|all] [--tier=full|lite|all] [--browser=chrome|msedge|chromium] [--executable=<browser-path>]
  [--build-dir=<current-worktree/.scratch/production-output>]
Defaults: D/full, existing browser-launch contract, task-local runtime-mechanical-parity output.
Both / and /torque-wrench/ come from the SAME loopback origin. Production entries only.
Four independent documents per viewport/tier, serialized: private A/B, legacy A/B.
Diagnostic only: legacy renderer buffer is matched to actual private samples; not natural legacy behavior or performance proof.
Missing parent probes are UNVERIFIED, never PASS. No builds/servers/installations are started.
Exit: 0 PASS, 1 FAIL, 2 usage, 10 UNVERIFIED (probe absent), 11 environment blocked, 12 report-write error.`

function inside(parent, target) {
  const relative = path.relative(parent, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}
// Resolve existing ancestors so an output/build junction cannot enter another checkout.
function checkedPath(value, parent) {
  const absolute = path.resolve(ROOT, value)
  if (!inside(parent, absolute)) throw new Error(`path must be inside ${parent}: ${absolute}`)
  let ancestor = absolute
  while (!existsSync(ancestor)) ancestor = path.dirname(ancestor)
  if (!inside(realpathSync(parent), realpathSync(ancestor))) throw new Error(`path/junction escapes ${parent}`)
  return absolute
}
function parseArgs(argv) {
  const args = { viewport: 'D', tier: 'full', out: path.join(EVIDENCE, 'runtime-mechanical-matched-buffer') }
  const keys = new Set(['url', 'out', 'viewport', 'tier', 'browser', 'executable', 'build-dir'])
  for (let i = 0; i < argv.length; i++) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(argv[i])
    if (!match || !keys.has(match[1])) throw new Error(`unknown argument: ${argv[i]}`)
    const value = match[2] ?? argv[++i]
    if (!value || value.startsWith('--')) throw new Error(`value missing for --${match[1]}`)
    args[match[1]] = value
  }
  if (!args.url) throw new Error('--url is required (fresh preview is supplied by parent)')
  const url = new URL(args.url)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)
    || url.username || url.password || url.search || url.hash || !['/', '/torque-wrench', '/torque-wrench/'].includes(url.pathname)) {
    throw new Error('--url must be a loopback origin or /torque-wrench/ URL without query/hash/credentials')
  }
  args.origin = url.origin
  if (!['D', 'N', 'all'].includes(args.viewport) || !['full', 'lite', 'all'].includes(args.tier)) throw new Error('invalid viewport/tier')
  if (args.browser && !['chrome', 'msedge', 'chromium'].includes(args.browser)) throw new Error('invalid browser')
  args.out = checkedPath(args.out, EVIDENCE)
  if (args['build-dir']) args['build-dir'] = checkedPath(args['build-dir'], path.join(ROOT, '.scratch'))
  return args
}

// Harness-owned observation only. Tracks real connected GL contexts/draws before application boot.
function installObserver() {
  const contexts = []
  window.__mechanicalParityObserver = {
    snapshot: () => contexts.filter(c => c.canvas.isConnected).map(c => {
      const gl = c.gl, debug = gl.getExtension('WEBGL_debug_renderer_info')
      const rect = c.canvas.getBoundingClientRect()
      return { draws: c.draws, lost: gl.isContextLost(), api: c.api,
        vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
        version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        width: c.canvas.width, height: c.canvas.height, cssWidth: rect.width, cssHeight: rect.height,
        attributes: gl.getContextAttributes() }
    }),
  }
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    const gl = original.call(this, kind, ...args)
    if (gl && /^webgl2?$/.test(kind) && !contexts.some(c => c.gl === gl)) {
      const record = { canvas: this, gl, api: kind, draws: 0 }
      contexts.push(record)
      for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        if (typeof gl[method] !== 'function') continue
        const draw = gl[method].bind(gl)
        gl[method] = (...params) => { record.draws++; return draw(...params) }
      }
    }
    return gl
  }
}

// Serializes nodes/materials, never constructs a rig or applies a channel in the browser.
function observe(kind) {
  const clone = value => value == null ? null : JSON.parse(JSON.stringify(value))
  const world = kind === 'private' ? window.__torqueWorld?.snapshot?.() : null
  const rig = kind === 'legacy' ? window.__rig : null
  const telemetry = kind === 'legacy' ? clone(window.__telemetry?.rig) : world?.rig ?? null
  let mechanical = world?.mechanical ?? null
  if (rig) {
    const ids = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5']
    const z = node => node?.position?.z ?? null
    const base = node => rig.basePositions?.get(node)?.z ?? null
    mechanical = {
      channels: clone(window.__torqueMechanicalProof?.snapshot?.()?.channels),
      bearingZ: z(rig.bearing),
      baseZ: { handleZ: base(rig.handleRoot), outputZ: base(rig.outputShaft), clutchZ: base(rig.clutch?.static),
        slidingZ: base(rig.clutch?.sliding), ringSwitchZ: base(rig.clutch?.ringSwitch), bearingZ: base(rig.bearing),
        stageZ: ids.map(id => base(rig.stages?.[id]?.carrier)) },
      present: { handle: !!rig.handleRoot, output: !!rig.outputShaft, clutch: !!rig.clutch?.static,
        sliding: !!rig.clutch?.sliding, ringSwitch: !!rig.clutch?.ringSwitch, bearing: !!rig.bearing,
        stages: ids.map(id => !!rig.stages?.[id]?.carrier) },
      planetRotByStage: ids.map(id => (rig.stages?.[id]?.planets ?? []).map(planet => planet.rotation.z)),
      ghostMaterials: [...(rig.ghostMaterials ?? [])].map(([mesh, material]) => ({
        mesh: mesh.name, opacity: material.opacity, transparent: material.transparent,
        depthWrite: material.depthWrite, attached: Array.isArray(mesh.material) ? mesh.material.includes(material) : mesh.material === material,
      })).sort((a, b) => a.mesh.localeCompare(b.mesh)),
      nodeRig: { handleZ: z(rig.handleRoot), outputZ: z(rig.outputShaft), clutchZ: z(rig.clutch?.static),
        slidingZ: z(rig.clutch?.sliding), ringSwitchZ: z(rig.clutch?.ringSwitch),
        ringSwitchRotZ: rig.clutch?.ringSwitch?.rotation?.z ?? null,
        stageZ: ids.map(id => z(rig.stages?.[id]?.carrier)),
        stageRot: ids.map(id => rig.stages?.[id]?.carrier?.rotation?.z ?? null),
        planetRot: rig.stages?.stage1?.planets?.[0]?.rotation?.z ?? null },
    }
  }
  const rootPort = window.__torqueMechanicalProof
  return {
    rig: telemetry, mechanical: clone(mechanical), world,
    proof: kind === 'legacy' ? clone(rootPort?.snapshot?.()) : null,
    rootSeekAvailable: !!(rootPort?.version === 1 && typeof rootPort.seek === 'function'
      && typeof rootPort.snapshot === 'function' && typeof rootPort.release === 'function'),
    drawingProofReady: !!window.__drawingProof?.ready,
    // sheet tier is the completed bake input, not proof of the current store tier.
    tier: kind === 'private' ? world?.mechanical?.tier ?? null : window.__telemetry?.performance?.tier ?? null,
    bakedTier: world?.sheet?.tier ?? null,
    progress: kind === 'private' ? world?.progress ?? null : window.__telemetry?.scroll?.progress ?? null,
    narrative: kind === 'private' ? clone(window.__torqueNarrative?.snapshot?.()) : null,
    live: kind === 'private' ? document.querySelector('.torque-page')?.dataset.torqueMode === 'live' && world?.ready === true : !!rig,
    backends: window.__mechanicalParityObserver.snapshot(),
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    document: location.pathname, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

function inputDiff(a, b) {
  return CHANNELS.filter(key => !close(a?.[key], b?.[key], INPUT_EPS)).map(key => ({ key, a: a?.[key] ?? null, b: b?.[key] ?? null }))
}
export function rigDiff(a, b) {
  const result = []
  for (const field of FIELDS) {
    const av = a?.[field], bv = b?.[field]
    const eps = field === 'ghostCount' ? 0 : /Rot|gearRotation/.test(field) ? ANGLE_EPS : /Z/.test(field) ? POSITION_EPS : CHANNEL_EPS
    if (Array.isArray(av) && Array.isArray(bv) && av.length === 5 && bv.length === 5) {
      av.forEach((value, index) => { if (!close(value, bv[index], eps)) result.push({ field, index, a: value, b: bv[index], eps }) })
    } else if (!close(av, bv, eps)) result.push({ field, a: av ?? null, b: bv ?? null, eps })
  }
  return result
}

async function settle(page, kind, target, expected, timeout = 5000, released = false) {
  const start = Date.now()
  let previous = null, stableSince = null, first = null, current = null
  while (Date.now() - start < timeout) {
    current = await page.evaluate(observe, kind)
    first ??= current
    const channels = current.mechanical?.channels
    const progressOK = kind === 'private' ? Math.abs(current.progress - target) <= 0.0001
      : released ? current.proof?.active === false && Math.abs(current.progress) <= 0.0001 && inputDiff(channels, expected).length === 0
      : target === 0 && !current.rootSeekAvailable ? Math.abs(current.progress) <= 0.0001
        : current.proof?.active === true && current.proof?.source === 'TorqueWrenchHero/useFrame' && inputDiff(channels, expected).length === 0
    const stable = previous && rigDiff(previous.rig, current.rig).length === 0 && progressOK
    if (stable) stableSince ??= Date.now()
    else stableSince = null
    const backend = current.backends[0], firstBackend = first.backends[0]
    const frameAlive = kind === 'private' ? current.world?.frames > first.world?.frames : !current.rootSeekAvailable || current.proof?.frames > first.proof?.frames
    if (stableSince && Date.now() - stableSince >= 500 && current.live && current.backends.length === 1
      && backend.draws > (firstBackend?.draws ?? 0) && !backend.lost && frameAlive) {
      return { settled: true, elapsedMs: Date.now() - start, observation: current, first }
    }
    previous = current
    await page.waitForTimeout(100)
  }
  return { settled: false, elapsedMs: Date.now() - start, observation: current, first }
}

async function captureLane(browser, args, viewport, tier, kind, name, reference) {
  const context = await browser.newContext({ ...VIEWPORTS[viewport], serviceWorkers: 'block', reducedMotion: 'no-preference' })
  const lane = { name, kind, viewport, requestedTier: tier, samples: [], assets: [], errors: [], limitations: [] }
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  const pending = []
  page.on('pageerror', error => lane.errors.push({ type: 'pageerror', message: String(error) }))
  page.on('console', message => { if (message.type() === 'error') lane.errors.push({ type: 'console', message: message.text() }) })
  page.on('requestfailed', request => lane.errors.push({ type: 'requestfailed', url: request.url(), message: request.failure()?.errorText }))
  page.on('response', response => {
    const pathname = new URL(response.url()).pathname
    if (!/\.(?:m?js|glb)$/.test(pathname) && response.request().resourceType() !== 'document') return
    pending.push((async () => {
      try { const bytes = await response.body(); lane.assets.push({ url: response.url(), pathname, status: response.status(), bytes: bytes.length, sha256: sha(bytes) }) }
      catch (error) { lane.errors.push({ type: 'response-body', url: response.url(), message: String(error) }) }
    })())
  })
  try {
    await context.addInitScript(installObserver)
    const url = new URL(kind === 'private' ? '/torque-wrench/' : '/', args.origin)
    url.searchParams.set('quality', tier)
    if (kind === 'legacy') {
      url.searchParams.set('qualityLock', '')
      url.searchParams.set('mechanicalProof', '1')
    }
    lane.url = url.href
    lane.qualityLock = kind === 'legacy' // determinism only; never a performance/tier-capability pass
    const navigation = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
    if (!navigation?.ok()) throw new Error(`document status ${navigation?.status()}`)
    await page.waitForFunction(kind => kind === 'private'
      ? window.__torqueWorld?.snapshot?.()?.ready && window.__torqueWorld.snapshot().sheet?.baked && window.__torqueWorld.snapshot().frames > 0
      : window.__rig && window.__drawingProof?.ready, kind, { timeout: 90000 })
    if (kind === 'legacy' && tier === 'lite') {
      await page.evaluate(() => window.__drawingProof.setTier('lite'))
    }
    lane.initial = await page.evaluate(observe, kind)
    for (const test of CASES) {
      const privateReference = reference?.find(s => s.id === test.id)
      const desired = kind === 'legacy' ? privateReference?.observation?.mechanical?.channels
        ?? (test.id === 'rest' ? mechanismAt(0) : null) : mechanismAt(test.p)
      const record = { id: test.id, canonicalTarget: test.p, expected: desired, input: null, settled: false }
      lane.samples.push(record)
      if (!desired || (kind === 'legacy' && !privateReference?.settled)) {
        record.unverified = 'settled private live channel tuple unavailable; CPU sampler is not a comparator input witness'
        continue
      }
      if (kind === 'private') {
        record.input = { method: 'native scrollTo on private start:0/end:max conductor', canonicalTarget: test.p }
        record.scroll = await page.evaluate(p => {
          const max = document.documentElement.scrollHeight - innerHeight
          scrollTo(0, max * p)
          return { max, requestedY: max * p }
        }, test.p)
      } else if (lane.initial.rootSeekAvailable) {
        record.input = { method: '__torqueMechanicalProof.seek', channels: desired, canonicalProgressUsedAsLegacyScroll: false }
        await page.evaluate(frame => window.__torqueMechanicalProof.seek(frame), desired)
      } else if (test.id === 'rest') {
        record.input = { method: '__drawingProof.setProgress', legacyPacedProgress: 0, branch: 'drawing rest', canonicalProgressUsedAsLegacyScroll: false }
        await page.evaluate(() => window.__drawingProof.setProgress(0))
      } else {
        record.unverified = 'root channel seek probe absent; drawing progress is not proxy time and cannot freeze legacy idle'
        continue
      }
      Object.assign(record, await settle(page, kind, kind === 'private' ? test.p : 0, desired))
      if (kind === 'legacy' && privateReference?.observation?.backends?.[0]) {
        const target = privateReference.observation.backends[0]
        const beforeIntervention = record.observation
        record.beforeRendererDprIntervention = beforeIntervention
        record.rendererDprIntervention = await page.evaluate(target => {
          const renderer = window.__threeRenderer
          const canvas = renderer?.domElement
          const rect = canvas?.getBoundingClientRect()
          if (!renderer || !rect || !target.cssWidth || !target.cssHeight) return { applied: false, reason: 'renderer or private buffer witness missing' }
          const ratioX = target.width / target.cssWidth
          const ratioY = target.height / target.cssHeight
          if (!Number.isFinite(ratioX) || Math.abs(ratioX - ratioY) > 1e-6) return { applied: false, reason: 'nonuniform private buffer ratio' }
          renderer.setPixelRatio(ratioX)
          renderer.setSize(target.cssWidth, target.cssHeight, false)
          return { applied: true, source: 'actual private sample', target, browserDpr: devicePixelRatio,
            viewport: { width: innerWidth, height: innerHeight }, beforeCss: { width: rect.width, height: rect.height } }
        }, target)
        // Observe after one real frame; never suppress PerformanceMonitor or alter private input.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())))
        record.observation = await page.evaluate(observe, kind)
        const actual = record.observation?.backends?.[0]
        if (!record.rendererDprIntervention.applied || actual?.width !== target.width || actual?.height !== target.height
          || actual?.cssWidth !== target.cssWidth || actual?.cssHeight !== target.cssHeight
          || !(actual?.draws > beforeIntervention?.backends?.[0]?.draws)
          || !(record.observation?.proof?.frames > beforeIntervention?.proof?.frames)) {
          record.settled = false
          record.unverified = 'legacy renderer did not retain observed private buffer match with post-intervention live draw/frame advance'
        }
      }
      if (kind === 'private') record.expected = mechanismAt(record.observation?.progress ?? test.p)
    }
    if (kind === 'legacy' && lane.initial.rootSeekAvailable) {
      await page.evaluate(() => window.__torqueMechanicalProof.release())
      lane.released = await settle(page, kind, 0, mechanismAt(0), 5000, true)
    }
  } catch (error) { lane.errors.push({ type: 'lane', message: String(error) }) }
  finally {
    try { await page.evaluate(() => { window.__torqueMechanicalProof?.release?.(); window.__drawingProof?.release?.() }) }
    catch (error) { lane.limitations.push(`release unavailable: ${error}`) }
    await page.close()
    await Promise.all(pending)
    await context.close()
  }
  return lane
}

function assess(report) {
  const check = (name, pass, actual) => report.assertions.push({ name, status: pass ? 'PASS' : 'FAIL', actual })
  const pending = (name, reason) => report.assertions.push({ name, status: 'UNVERIFIED', reason })
  const near = (name, actual, expected, eps) => check(name, close(actual, expected, eps), { actual, expected, tolerance: eps })
  const validArray = (value, length) => Array.isArray(value) && (length === undefined || value.length === length) && value.every(finite)
  const channelsFor = obs => obs?.mechanical?.channels
  function supplemental(label, obs, expected) {
    const m = obs?.mechanical
    if (!m) { pending(`${label}/live-mechanical-census`, 'private snapshot.mechanical absent'); return }
    check(`${label}/required-rig-units-present`, m.present && ['handle', 'output', 'clutch', 'sliding', 'ringSwitch', 'bearing'].every(k => m.present[k] === true)
      && m.present.stages?.length === 5 && m.present.stages.every(v => v === true), m.present)
    near(`${label}/K000004-bearing`, m.bearingZ, (m.baseZ?.bearingZ ?? NaN) - 0.197 * expected.explode, POSITION_EPS)
    const planets = m.planetRotByStage
    check(`${label}/five-populated-planet-lists`, Array.isArray(planets) && planets.length === 5 && planets.every(v => validArray(v) && v.length > 0), planets)
    if (Array.isArray(planets)) planets.forEach((list, index) => {
      if (index >= 5 || !Array.isArray(list)) return
      list.forEach((angle, j) => near(`${label}/${PARTS[index]}/planet-${j}`, angle,
        -(expected.gearAngle / (Math.PI * 8) + expected.idle) * TURNS[index] * Math.PI * 2 * 3.5, ANGLE_EPS))
    })
    const ghosts = m.ghostMaterials
    check(`${label}/attached-ghost-material-census`, Array.isArray(ghosts) && ghosts.length === obs.rig?.ghostCount && ghosts.length > 0
      && new Set(ghosts.map(g => g.mesh)).size === ghosts.length && ghosts.every(g => g.attached === true && typeof g.transparent === 'boolean' && typeof g.depthWrite === 'boolean'), ghosts)
    if (Array.isArray(ghosts)) ghosts.forEach((g, i) => near(`${label}/ghost-${i}/actual-opacity`, g.opacity, expected.ghostOpacity, CHANNEL_EPS))
  }
  function laws(label, obs, expected, rest) {
    const rig = obs?.rig
    check(`${label}/finite-live-rig`, rig && FIELDS.every(f => ['stageZ', 'stageRot'].includes(f) ? validArray(rig[f], 5) : finite(rig[f])), rig)
    if (!rig || !rest?.rig) return
    for (const [key, offset] of Object.entries({ handleZ: -0.354, outputZ: 0.050, clutchZ: -0.291, slidingZ: -0.291, ringSwitchZ: -0.291 })) {
      const travel = key === 'slidingZ' ? -0.015 * expected.shift : key === 'ringSwitchZ' ? 0.009525 * expected.shift : 0
      near(`${label}/${key}/rest-relative-law`, rig[key] - rest.rig[key], offset * expected.explode + travel, POSITION_EPS)
    }
    near(`${label}/P003068-positive-120-degree-law`, rig.ringSwitchRotZ, expected.shift * Math.PI * 2 / 3, ANGLE_EPS)
    STAGES.forEach((stage, i) => {
      near(`${label}/${PARTS[i]}/ladder`, rig.stageZ?.[i] - rest.rig.stageZ?.[i], OFFSETS[i] * expected.explode, POSITION_EPS)
      near(`${label}/${PARTS[i]}/display-gear-law`, rig.stageRot?.[i],
        (expected.gearAngle / (Math.PI * 8) + expected.idle) * TURNS[i] * Math.PI * 2, ANGLE_EPS)
    })
    near(`${label}/stage1-first-planet-law`, rig.planetRot, -rig.stageRot?.[0] * 3.5, ANGLE_EPS)
    for (const [field, channel] of [['shift', 'shift'], ['explodeFactor', 'explode'], ['gearRotation', 'gearAngle'], ['ghostOpacity', 'ghostOpacity']]) {
      near(`${label}/${field}/command`, rig[field], expected[channel], INPUT_EPS)
    }
    check(`${label}/nonzero-ghost-count`, Number.isInteger(rig.ghostCount) && rig.ghostCount > 0, rig.ghostCount)
    supplemental(label, obs, expected)
  }
  function censusPair(label, a, b) {
    if (!a?.mechanical || !b?.mechanical) { pending(`${label}/bearing-all-planets-ghost-flags`, 'supplemental private live census missing'); return }
    near(`${label}/bearing-parity`, a.mechanical.bearingZ, b.mechanical.bearingZ, POSITION_EPS)
    for (let i = 0; i < 5; i++) {
      const aa = a.mechanical.planetRotByStage?.[i], bb = b.mechanical.planetRotByStage?.[i]
      check(`${label}/${PARTS[i]}/dynamic-planet-count`, Array.isArray(aa) && aa.length > 0 && aa.length === bb?.length, { a: aa?.length, b: bb?.length })
      if (Array.isArray(aa)) aa.forEach((angle, j) => near(`${label}/${PARTS[i]}/planet-${j}-parity`, angle, bb?.[j], ANGLE_EPS))
    }
    const aa = a.mechanical.ghostMaterials, bb = b.mechanical.ghostMaterials
    check(`${label}/ghost-material-keys`, Array.isArray(aa) && Array.isArray(bb) && aa.length > 0
      && JSON.stringify(aa.map(g => g.mesh)) === JSON.stringify(bb.map(g => g.mesh)), { a: aa, b: bb })
    if (Array.isArray(aa)) aa.forEach((g, i) => {
      near(`${label}/ghost-${i}/opacity-parity`, g.opacity, bb?.[i]?.opacity, CHANNEL_EPS)
      for (const flag of ['transparent', 'depthWrite', 'attached']) check(`${label}/ghost-${i}/${flag}-parity`,
        typeof g[flag] === 'boolean' && g[flag] === bb?.[i]?.[flag], { a: g[flag], b: bb?.[i]?.[flag] })
    })
  }
  const backendKey = b => b && JSON.stringify([b.api, b.vendor, b.renderer, b.version, b.shadingLanguage])
  function environmentPair(label, a, b) {
    const backend = !!(a?.backends?.[0]?.renderer && a.backends[0].vendor
      && backendKey(a.backends[0]) === backendKey(b?.backends?.[0]))
    const tier = ['full', 'lite'].includes(a?.tier) && a.tier === b?.tier
    const viewport = !!a?.viewport && JSON.stringify(a.viewport) === JSON.stringify(b?.viewport)
    const buffer = !!a?.backends?.[0] && a.backends[0].width === b?.backends?.[0]?.width
      && a.backends[0].height === b?.backends?.[0]?.height
    check(`${label}/same-observed-backend`, backend, { a: a?.backends, b: b?.backends })
    if (a?.tier == null || b?.tier == null) pending(`${label}/same-live-tier`, 'current tier witness missing')
    else check(`${label}/same-live-tier`, tier, { a: a.tier, b: b.tier })
    check(`${label}/same-actual-viewport-and-DPR`, viewport, { a: a?.viewport, b: b?.viewport })
    check(`${label}/same-render-buffer`, buffer, { a: a?.backends?.[0], b: b?.backends?.[0] })
    return backend && tier && viewport && buffer
  }
  const groups = new Map()
  for (const lane of report.lanes) {
    const key = `${lane.viewport}/${lane.requestedTier}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(lane)
    check(`${lane.name}/no-browser-errors`, lane.errors.length === 0, lane.errors)
    if (lane.kind === 'legacy' && lane.initial?.rootSeekAvailable) {
      check(`${lane.name}/release-resumes-ordinary-rest-frame`, lane.released?.settled === true
        && lane.released.observation?.proof?.active === false, lane.released)
    }
    const glbs = lane.assets.filter(a => a.pathname.endsWith('.glb'))
    check(`${lane.name}/actual-Default-glb-loaded`, glbs.some(a => a.pathname === '/models/Default.glb' && a.status === 200 && a.sha256 === report.provenance.localGlbSha256), glbs)
    check(`${lane.name}/production-document-loaded`, lane.assets.some(a => a.pathname === (lane.kind === 'private' ? '/torque-wrench/' : '/') && a.status === 200)
      && lane.assets.some(a => /^\/assets\/.*\.js$/.test(a.pathname)) && !lane.assets.some(a => /^\/(?:src\/|@vite\/)/.test(a.pathname)), lane.assets)
    for (const sample of lane.samples) {
      const label = `${lane.name}/${sample.id}`
      if (sample.unverified) { pending(`${label}/matched-capture`, sample.unverified); continue }
      check(`${label}/settled-live-draw-and-frame-advance`, sample.settled, { elapsedMs: sample.elapsedMs, first: sample.first, final: sample.observation })
      const obs = sample.observation
      if (obs?.tier == null) pending(`${label}/requested-tier-live`, 'current private store tier observable absent; sheet bake tier is not a current tier witness')
      else check(`${label}/requested-tier-live`, obs.tier === lane.requestedTier && obs.live && !obs.reducedMotion && obs.backends?.length === 1 && !obs.backends[0].lost, obs.tier)
      const applied = channelsFor(obs)
      if (applied) check(`${label}/applied-inputs-match-target`, inputDiff(applied, sample.expected).length === 0, inputDiff(applied, sample.expected))
      else pending(`${label}/independently-observed-inputs-including-idle`, 'snapshot.mechanical.channels missing; gear-law outputs are not input evidence')
      if (lane.kind === 'private') near(`${label}/actual-progress-matches-target`, obs?.progress, sample.canonicalTarget, 0.0001)
      laws(label, obs, sample.expected, lane.samples.find(s => s.id === 'rest')?.observation)
      if (lane.kind === 'legacy' && obs?.mechanical?.nodeRig) {
        for (const [field, value] of Object.entries(obs.mechanical.nodeRig)) {
          const live = obs.rig?.[field], eps = /Rot/.test(field) ? ANGLE_EPS : POSITION_EPS
          check(`${label}/telemetry-equals-__rig/${field}`, Array.isArray(value)
            ? value.length === 5 && value.every((v, i) => close(v, live?.[i], eps)) : close(value, live, eps), { telemetry: live, node: value })
        }
      }
    }
  }
  for (const [key, lanes] of groups) {
    const get = name => lanes.find(l => l.name.endsWith(name))
    const privateA = get('private-A'), privateB = get('private-B'), legacyA = get('legacy-A'), legacyB = get('legacy-B')
    for (const [label, left, right] of [['private-control', privateA, privateB], ['legacy-control', legacyA, legacyB], ['parity', privateA, legacyA]]) {
      check(`${key}/${label}/independent-documents-present`, !!left && !!right, [left?.name, right?.name])
      if (!left || !right) continue
      const glb = lane => lane.assets.filter(a => a.pathname === '/models/Default.glb').map(a => a.sha256)
      check(`${key}/${label}/same-actual-GLB-hash`, glb(left).length > 0 && glb(right).length > 0
        && new Set([...glb(left), ...glb(right)]).size === 1, { a: glb(left), b: glb(right) })
      if (label !== 'parity') {
        const graph = lane => [...new Set(lane.assets.filter(a => /\.js$/.test(a.pathname)).map(a => `${a.pathname}:${a.sha256}`))].sort()
        check(`${key}/${label}/same-build-control-module-graph`, graph(left).length > 0 && JSON.stringify(graph(left)) === JSON.stringify(graph(right)), { a: graph(left), b: graph(right) })
      }
      for (const test of CASES) {
        const a = left.samples.find(s => s.id === test.id), b = right.samples.find(s => s.id === test.id)
        const name = `${key}/${label}/${test.id}`
        if (!a?.settled || !b?.settled) { pending(`${name}/comparison`, 'both settled live captures required'); continue }
        const matchedEnvironment = environmentPair(name, a.observation, b.observation)
        const ac = channelsFor(a.observation), bc = channelsFor(b.observation)
        if (!ac || !bc) { pending(`${name}/matched-channel-comparison`, 'independent per-frame channels including idle missing'); continue }
        const delta = inputDiff(ac, bc)
        check(`${name}/matched-inputs`, delta.length === 0, delta)
        if (delta.length) { pending(`${name}/transform-comparison`, 'unequal input tuples; no parity claim'); continue }
        if (!matchedEnvironment) { pending(`${name}/transform-comparison`, 'unmatched renderer/tier/viewport/buffer; no parity claim'); continue }
        const differences = rigDiff(a.observation.rig, b.observation.rig)
        check(`${name}/live-rig-parity`, differences.length === 0, differences)
        censusPair(name, a.observation, b.observation)
      }
    }
  }
  // All observed modules are re-fetched, including distinct root/private entries. Shared URLs
  // must have a single hash across every context; different entry hashes are expected.
  for (const item of report.provenance.servedAssets) check(`served-build-stability/${item.pathname}`,
    item.hashes.length === 1 && item.recheckSha256 === item.hashes[0] && item.status === 200, item)
  if (report.provenance.buildVerification) {
    for (const item of report.provenance.buildVerification) check(`local-build-served-identity/${item.pathname}`, item.match, item)
  }
  check('complete-four-lane-roster', report.lanes.length === report.expectedLaneCount, { actual: report.lanes.length, expected: report.expectedLaneCount })
}

async function main() {
  if (process.argv.includes('--help')) { console.log(HELP); return }
  let args
  try { args = parseArgs(process.argv.slice(2)) } catch (error) { console.error(`${error.message}\n${HELP}`); process.exitCode = 2; return }
  const report = { schema: 'JG-038-matched-buffer-mechanical-diagnostic-v1', runId: randomUUID(), startedAt: new Date().toISOString(),
    status: 'UNVERIFIED', url: args.origin, assertions: [], lanes: [], provenance: { servedAssets: [] },
    tolerances: { positionMetres: POSITION_EPS, angleRadians: ANGLE_EPS, channel: CHANNEL_EPS, input: INPUT_EPS },
    comparator: 'current checkout legacy root entry from same served production output; not a pre-extraction historical control',
    limits: [
      'CPU reference values schedule and validate channels only; all acceptance observations come from live browser ports and draw calls.',
      'Root qualityLock suppresses tier degradation only; DPR PerformanceMonitor remains active. This is no hardware capability/performance/visual-visibility gate.',
      'Matched-buffer diagnostic: legacy __threeRenderer resolution is set from each actual private sample. Root DPR monitor remains active; exact buffer preconditions retained. Not natural legacy behavior or G8 performance proof.',
      'Private snapshot.mechanical and root __torqueMechanicalProof v1 are optional parent dependencies: absent means UNVERIFIED.',
      'Ghost opacity, transparent, depthWrite and material attachment are compared without waivers.',
      'No screenshots, visibility/clearance, cleanup stress, or Stage 3 exit is certified by this harness.',
    ] }
  let browser, exitCode = 11
  try {
    const sourcePaths = ['src/scene/torque-wrench/MechanismDirector.ts', 'src/scene/torque-wrench/RuntimeWorld.tsx',
      'src/scene/TorqueWrenchHero.tsx', 'src/scene/rig/wrenchMechanics.ts', 'src/scene/rig/nodeRoles.ts', 'src/data/caseStudies.ts']
    report.provenance.source = sourcePaths.map(file => ({ file, sha256: sha(readFileSync(path.join(ROOT, file))) }))
    report.provenance.verifierSha256 = sha(readFileSync(fileURLToPath(import.meta.url)))
    report.provenance.localGlbSha256 = sha(readFileSync(path.join(ROOT, 'public/models/Default.glb')))
    report.provenance.workspace = ROOT
    report.provenance.head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
    report.provenance.branch = execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim()
    report.provenance.worktreeStatus = execFileSync('git', ['status', '--short'], { cwd: ROOT, encoding: 'utf8' }).trim()
    if (report.provenance.branch !== 'torque-wrench/rebuild') throw new Error('wrong branch; expected torque-wrench/rebuild')
    const { chromium } = await import('playwright')
    report.playwrightVersion = createRequire(import.meta.url)('playwright/package.json').version
    const config = launchConfig()
    if (args.browser) {
      if (args.browser === 'chromium') delete config.channel
      else config.channel = args.browser
    }
    const executable = args.executable || process.env.JGUN_CHROME_PATH
    if (executable) { delete config.channel; config.executablePath = executable }
    report.launchConfig = config
    browser = await chromium.launch(config)
    report.browserVersion = browser.version()
    const viewports = args.viewport === 'all' ? ['D', 'N'] : [args.viewport]
    const tiers = args.tier === 'all' ? ['full', 'lite'] : [args.tier]
    report.expectedLaneCount = viewports.length * tiers.length * 4
    for (const viewport of viewports) for (const tier of tiers) {
      console.log(`Observing ${viewport}/${tier}: serialized private A/B and same-build legacy A/B`)
      const prefix = `${viewport}/${tier}/`
      const privateA = await captureLane(browser, args, viewport, tier, 'private', prefix + 'private-A')
      report.lanes.push(privateA)
      report.lanes.push(await captureLane(browser, args, viewport, tier, 'private', prefix + 'private-B'))
      report.lanes.push(await captureLane(browser, args, viewport, tier, 'legacy', prefix + 'legacy-A', privateA.samples))
      report.lanes.push(await captureLane(browser, args, viewport, tier, 'legacy', prefix + 'legacy-B', privateA.samples))
    }
    const assets = new Map()
    for (const lane of report.lanes) for (const asset of lane.assets) {
      if (!/\.(?:m?js|glb)$/.test(asset.pathname) && !['/', '/torque-wrench/'].includes(asset.pathname)) continue
      if (!assets.has(asset.pathname)) assets.set(asset.pathname, new Set())
      assets.get(asset.pathname).add(asset.sha256)
    }
    const api = await browser.newContext({ serviceWorkers: 'block' })
    try {
      for (const [pathname, hashes] of assets) {
        const response = await api.request.get(new URL(pathname, args.origin).href, { timeout: 15000 })
        report.provenance.servedAssets.push({ pathname, hashes: [...hashes], status: response.status(), recheckSha256: sha(await response.body()) })
      }
    } finally { await api.close() }
    if (args['build-dir']) {
      report.provenance.buildDir = args['build-dir']
      report.provenance.buildVerification = report.provenance.servedAssets.map(asset => {
        const file = asset.pathname.endsWith('/') ? asset.pathname.slice(1) + 'index.html' : asset.pathname.slice(1)
        const local = checkedPath(path.join(args['build-dir'], file), args['build-dir'])
        const localHash = existsSync(local) ? sha(readFileSync(local)) : null
        return { pathname: asset.pathname, localSha256: localHash, servedSha256: asset.recheckSha256, match: localHash !== null && localHash === asset.recheckSha256 }
      })
    } else report.limits.push('No --build-dir: identity proves stable served production bytes, not their correspondence to local source hashes; source hashes are authoring provenance only.')
    assess(report)
    report.counts = Object.fromEntries(['PASS', 'FAIL', 'UNVERIFIED'].map(status => [status, report.assertions.filter(a => a.status === status).length]))
    report.status = report.counts.FAIL ? 'FAIL' : report.counts.UNVERIFIED ? 'UNVERIFIED' : 'PASS'
    exitCode = report.status === 'PASS' ? 0 : report.status === 'FAIL' ? 1 : 10
  } catch (error) { report.status = 'BLOCKED'; report.environmentError = String(error.stack ?? error) }
  finally {
    if (browser) await browser.close().catch(error => { report.cleanupError = String(error); report.status = 'FAIL'; exitCode = 1 })
    report.finishedAt = new Date().toISOString()
    report.exitCode = exitCode
    try {
      mkdirSync(args.out, { recursive: true })
      const output = path.join(args.out, `matched-buffer-diagnostic-${report.startedAt.replace(/[:.]/g, '-')}-${report.runId}.json`)
      writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
      console.log(`${report.status}: ${JSON.stringify(report.counts ?? {})}; report=${output}`)
      if (report.environmentError) console.error(report.environmentError)
    } catch (error) { console.error(`report write failed: ${error}`); exitCode = 12 }
    process.exitCode = exitCode
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
