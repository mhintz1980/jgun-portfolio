/**
 * Production-only, native-scroll cinematography evidence. Does not build, serve,
 * lock quality, set narrative clocks, change materials, or hide subject pixels.
 * Run AFTER owner visual direction review:
 * node scripts/verify-page-cinematography.mjs --url=http://localhost:4173/torque-wrench/ --out=output/playwright/page-cinematography/run-01
 * --cases=desktop-full,narrow-lite selects work, but omitted cases keep aggregate INCOMPLETE.
 * --oracle=path/to/existing-oracle.ts is optional (bundled in memory via esbuild).
 * It exports expected({shot,sample,previous}) returning:
 *   {orbitFrame:[16]?, subjects:[{name,matrixWorld:[16]}]?,
 *    physicalRates:[{name,mode:'rotation'|'translation',axis:[x,y,z],
 *      normalUnitsPerCameraSecond,ratio,expectedDelta,cameraDelta?}]?}
 * Rotation axes are mesh-local; translation axes are WORLD unit vectors.
 * expectedDelta is signed radians/metres. ratio is the source-integrated
 * INTERVAL AVERAGE of the canonical rate (not a midpoint guess on a knee).
 * cameraDelta defaults to inspection.cameraTime difference; shatter must supply
 * its opening camera delta because inspection clocks only cover the shaft study.
 * orbitFrame is a rigid assembly-to-world matrix, independent of the animated
 * subject. Expected matrices/rates must come from source, not fitted live data.
 * Source imports are observations, NOT proof that dist was built from that source.
 * Built-in source oracles cover all five shots. --oracle optionally supplies
 * additional independent evidence; missing built-in inputs remain INCOMPLETE.
 * RGBA hashes decode PNG screenshots of the entire presentation canvas. No HUD
 * counters or other DOM are suppressed. Therefore a nondeterministic overlay
 * that paints over the canvas correctly makes exact beauty replay FAIL.
 * Exit: 0 PASS, 1 FAIL, 2 INCOMPLETE/usage. Samples append to a JSONL journal;
 * full reports checkpoint every 11 samples and on case completion/errors.
 */
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import { Euler, Matrix4, Quaternion, Vector3 } from 'three'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
export const CASES = ['desktop-full', 'desktop-lite', 'desktop-reduced', 'narrow-full', 'narrow-lite', 'narrow-reduced']
export const LIMITS = Object.freeze({ replay: 1e-5, stable: 1e-7, stableMs: 500, stableFrames: 8,
  seekTimeoutMs: 45000, ndc: .84, hudPx: 8, poleDot: .98, minDegPerVp: 35, minVp: 2, maxVp: 4.5 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const finite = x => typeof x === 'number' && Number.isFinite(x)
const vec = (x, n) => Array.isArray(x) && x.length === n && x.every(finite)
const maxDiff = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.length
  && a.every(finite) && b.every(finite) ? Math.max(...a.map((x, i) => Math.abs(x - b[i]))) : Infinity
const relativeInside = (base, file) => { const r = path.relative(base, file); return r && r !== '..' && !r.startsWith(`..${path.sep}`) && !path.isAbsolute(r) }
const gate = (name, pass, evidence) => ({ name, status: pass === null ? 'INCOMPLETE' : pass ? 'PASS' : 'FAIL', evidence })

export function canonicalGate(specs) {
  const minimums = { shatter: 355, ringSwitch: 45, shaperContact: 60, hobContact: 60, stage1Ignition: 165 }
  const pass = specs && Object.entries(minimums).every(([id, min]) => specs[id]?.minCameraSweepDeg >= min
    && specs[id]?.rate === .1 && specs[id]?.rampFraction >= .1 && specs[id]?.rampFraction <= .15
    && vec(specs[id]?.window, 2) && specs[id].window[1] > specs[id].window[0])
    && specs.ringSwitch.maxRevolutions === .15 && specs.stage1Ignition.maxRevolutions === .2
  return gate('canonical targets preserved (including .15 die / .2 sun rev budgets)', !!pass, specs)
}

export function classify(gates, errors = [], omissions = []) {
  if (errors.length || gates.some(g => g.status === 'FAIL')) return 'FAIL'
  if (!gates.length || omissions.length || gates.some(g => g.status !== 'PASS')) return 'INCOMPLETE'
  return 'PASS'
}

export function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const match = /^--(url|out|cases|oracle|help)(?:=(.*))?$/.exec(argv[i])
    if (!match || match[1] in args) throw new Error(`Unknown/duplicate argument: ${argv[i]}`)
    const key = match[1]
    args[key] = key === 'help' ? true : match[2] ?? argv[++i]
    if (key !== 'help' && (!args[key] || args[key].startsWith('--'))) throw new Error(`Missing --${key}`)
  }
  if (args.help) return args
  if (!args.url || !args.out) throw new Error('--url and --out are required')
  const url = new URL(args.url)
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || !/^\/torque-wrench\/?$/.test(url.pathname) || url.search || url.hash || url.username || url.password) {
    throw new Error('--url must be loopback /torque-wrench/ without query/hash/credentials')
  }
  args.url = url.href
  args.cases = args.cases ? args.cases.split(',') : [...CASES]
  if (!args.cases.length || new Set(args.cases).size !== args.cases.length || args.cases.some(c => !CASES.includes(c))) throw new Error(`--cases must select unique names from ${CASES}`)
  args.out = path.resolve(args.out)
  const allowed = path.join(ROOT, 'output', 'playwright')
  if (!relativeInside(allowed, args.out)) throw new Error('--out must be a new directory below output/playwright')
  if (existsSync(args.out)) throw new Error('--out already exists; preserve previous evidence')
  let parent = path.dirname(args.out)
  while (!existsSync(parent)) parent = path.dirname(parent)
  if (!relativeInside(realpathSync(ROOT), realpathSync(parent)) && realpathSync(parent) !== realpathSync(ROOT)) throw new Error('--out resolves outside workspace')
  if (args.oracle) {
    args.oracle = realpathSync(path.resolve(args.oracle))
    if (!relativeInside(realpathSync(ROOT), args.oracle) || /(?:^|[\\/])\.scratch(?:[\\/]|$)/.test(args.oracle)) throw new Error('--oracle must be an existing workspace file outside .scratch')
  }
  return args
}

function validTelemetry(s) {
  return s && vec(s.camera?.position, 3) && vec(s.camera?.target, 3) && vec(s.camera?.up, 3)
    && vec(s.camera?.quaternion, 4) && Math.abs(Math.hypot(...s.camera.quaternion) - 1) < 1e-6
    && Math.hypot(...s.camera.up) > 0 && finite(s.camera.fov) && s.camera.fov > 0 && s.camera.fov < 180
    && finite(s.progress) && vec(s.viewport, 2) && s.viewport.every(x => x > 0) && finite(s.poleDot) && s.poleDot >= 0
    && finite(s.inspection?.subjectTime) && finite(s.inspection?.cameraTime)
    && (s.ringTime === null || finite(s.ringTime))
    && (s.shatter == null || finite(s.shatter.subjectTime) && vec(s.shatter.frame, 16))
    && Array.isArray(s.subjects) && s.subjects.length > 0
    && s.subjects.every(x => typeof x.name === 'string' && vec(x.matrixWorld, 16))
    && new Set(s.subjects.map(x => x.name)).size === s.subjects.length
}

export function compareState(a, b) {
  if (!validTelemetry(a) || !validTelemetry(b)) return { cameraError: Infinity, subjectError: Infinity, reason: 'Missing/malformed telemetry' }
  // Quaternion q and -q describe the same rotation; do not mistake a sign for motion.
  const qError = Math.min(maxDiff(a.camera.quaternion, b.camera.quaternion), maxDiff(a.camera.quaternion, b.camera.quaternion.map(x => -x)))
  const cameraError = Math.max(qError, ...['position', 'target', 'up'].map(k => maxDiff(a.camera[k], b.camera[k])), Math.abs(a.camera.fov - b.camera.fov))
  const map = new Map(b.subjects.map(x => [x.name, x.matrixWorld]))
  if (map.size !== a.subjects.length || a.subjects.some(x => !map.has(x.name))) return { cameraError, subjectError: Infinity, reason: 'Visible subject identity set changed' }
  if ((a.ringTime === null) !== (b.ringTime === null)) return { cameraError, subjectError: Infinity, reason: 'Ring clock presence changed' }
  if ((a.shatter == null) !== (b.shatter == null)) return { cameraError, subjectError: Infinity, reason: 'Shatter clock/frame presence changed' }
  const subjectError = Math.max(Math.abs(a.inspection.subjectTime - b.inspection.subjectTime),
    Math.abs(a.inspection.cameraTime - b.inspection.cameraTime),
    a.ringTime === null ? 0 : Math.abs(a.ringTime - b.ringTime),
    a.shatter == null ? 0 : Math.abs(a.shatter.subjectTime - b.shatter.subjectTime),
    a.shatter == null ? 0 : maxDiff(a.shatter.frame, b.shatter.frame),
    ...a.subjects.map(x => maxDiff(x.matrixWorld, map.get(x.name))))
  return { cameraError, subjectError }
}

export function replayGates(records, label) {
  if (!records.length) return [gate(`${label}: evidence`, null, 'No replay samples')]
  return [gate(`${label}: camera <1e-5`, records.every(x => x.cameraError < LIMITS.replay), records),
    gate(`${label}: subject matrices and clocks <1e-5`, records.every(x => x.subjectError < LIMITS.replay), records),
    gate(`${label}: decoded beauty RGBA identical`, records.every(x => typeof x.forwardHash === 'string' && x.forwardHash === x.replayHash), records)]
}

export function chooseWitnesses(witnesses, machining = false, relevantNames = []) {
  if (!Array.isArray(witnesses)) return { scope: 'missing', witnesses: [] }
  const relevant = relevantNames.length ? witnesses.filter(w => relevantNames.includes(w.name)) : witnesses
  const contact = relevant.filter(w => w.kind === 'contact')
  if (machining && contact.length) return { scope: 'contact: actual real-vertex ROI', witnesses: contact }
  const active = relevant.filter(w => w.kind === 'active')
  if (active.length) return { scope: machining ? 'fallback: active subject (no contact ROI)' : 'active narrative subject', witnesses: active }
  return { scope: machining ? 'fallback: full relevant subjects (no contact ROI)' : 'full relevant subjects', witnesses: relevant.filter(w => w.kind !== 'contact') }
}

export function projectWorld(camera, point, viewport) {
  if (!vec(camera?.position, 3) || !vec(camera?.quaternion, 4) || !vec(point, 3) || !vec(viewport, 2) || !finite(camera?.fov)) return null
  const [x, y, z, w] = camera.quaternion, v = point.map((p, i) => p - camera.position[i])
  const tx = 2 * (-y * v[2] + z * v[1]), ty = 2 * (-z * v[0] + x * v[2]), tz = 2 * (-x * v[1] + y * v[0])
  const local = [v[0] + w * tx - y * tz + z * ty, v[1] + w * ty - z * tx + x * tz, v[2] + w * tz - x * ty + y * tx]
  const f = 1 / Math.tan(camera.fov * Math.PI / 360), depth = -local[2]
  const ndc = [f * local[0] / depth / (viewport[0] / viewport[1]), f * local[1] / depth]
  return { ndc, depth, pixel: [(ndc[0] + 1) * viewport[0] / 2, (1 - ndc[1]) * viewport[1] / 2] }
}

export function clearanceGates(sample, machining = false) {
  // Ordinary machining approaches, material inspection and runout remain
  // telephoto feature views even outside the bullet-time windows. The full
  // stock/tool fixture remains recorded as context, not silently discarded.
  const featureView = sample.telemetry?.progress >= .56 && sample.telemetry?.progress < .815
  const selected = chooseWitnesses(sample.telemetry?.witnesses, machining || featureView)
  const evidence = { scope: selected.scope, names: selected.witnesses.map(x => x.name), count: 0, maxNdc: 0, minHudPx: null, violations: [] }
  if (!selected.witnesses.length) return [gate('real-witness safe frame', null, evidence), gate('measured DOM HUD clearance', null, evidence)]
  let valid = true, safe = true, clear = true, minHud = Infinity
  const validHud = Array.isArray(sample.hud) && sample.hud.length > 0
    && sample.hud.every(r => ['left', 'right', 'top', 'bottom'].every(k => finite(r[k])) && r.right >= r.left && r.bottom >= r.top)
  for (const witness of selected.witnesses) {
    if (!Array.isArray(witness.points) || !witness.points.length) { valid = false; continue }
    for (const point of witness.points) {
      const p = projectWorld(sample.telemetry.camera, point, sample.telemetry.viewport)
      if (!p || !p.ndc.every(finite) || !finite(p.depth)) { valid = false; continue }
      evidence.count++
      evidence.maxNdc = Math.max(evidence.maxNdc, ...p.ndc.map(Math.abs))
      if (p.depth <= 0 || p.ndc.some(n => Math.abs(n) > LIMITS.ndc)) {
        safe = false; if (evidence.violations.length < 30) evidence.violations.push({ name: witness.name, point, ...p })
      }
      const pixel = sample.canvas ? [sample.canvas.left + p.pixel[0] * sample.canvas.width / sample.telemetry.viewport[0], sample.canvas.top + p.pixel[1] * sample.canvas.height / sample.telemetry.viewport[1]] : p.pixel
      for (const rect of validHud ? sample.hud : []) {
        const dx = Math.max(rect.left - pixel[0], 0, pixel[0] - rect.right)
        const dy = Math.max(rect.top - pixel[1], 0, pixel[1] - rect.bottom)
        const distance = Math.hypot(dx, dy)
        minHud = Math.min(minHud, distance)
        if (distance < LIMITS.hudPx) { clear = false; if (evidence.violations.length < 30) evidence.violations.push({ name: witness.name, hud: rect, distance, point }) }
      }
    }
  }
  evidence.minHudPx = finite(minHud) ? minHud : null
  return [gate('real-witness |ndc| <=.84 and positive depth', valid && evidence.count ? safe : null, evidence),
    gate('measured DOM HUD clearance >=8px', valid && evidence.count && validHud ? clear : null, { ...evidence, hud: sample.hud })]
}

export function roiGate(sample, shot) {
  const contacts = sample.telemetry?.witnesses?.filter(w => w.kind === 'contact') ?? []
  const names = contacts.map(w => w.name)
  const tools = { shaperContact: /shaper-cutter-disc/i, hobContact: /hob-(?:body|thread|flute|cutter|tool)/i }
  const stage1 = shot?.id === 'stage1Ignition'
  if (!stage1 && !(shot?.id in tools)) return null
  const work = names.some(n => /(?:legacy|approved)shaft/i.test(n))
  // Parent labels real selected-planet flank witnesses from its authenticated
  // Stage 1 ancestor (stage1CascadeIndex=0). CAD Mesh.name may be empty; neither
  // generic "planet" text nor another P00183x part establishes this identity.
  const tool = stage1 ? contacts.some(w => typeof w.name === 'string' && w.name.split('/').includes('planetP000247')
    && Array.isArray(w.points) && w.points.length > 0 && w.points.every(p => vec(p, 3)))
    : names.some(n => tools[shot.id].test(n))
  return gate(`${shot.id}: actual work and tool contact identity present`, work && tool ? true : null,
    { chosenScope: contacts.length ? 'contact' : 'full subjects fallback', workVerticesPresent: work, toolVerticesPresent: tool, names,
      ...(stage1 ? { requiredToolIdentity: 'planetP000247', identitySource: 'explicit parent telemetry path segment; no Mesh.name/unknown-part inference' } : {}),
      limitation: 'Geometric ROI coverage is separate from installed engineering engagement; no claim of tooth meshing from ROI presence.' })
}

// Fixed assembly frame is required for canonical sweep proof. World Y diagnostic
// is still reported when absent, but cannot accidentally pass a local-orbit gate.
function azimuth(sample, frame, shaft = false) {
  const v = sample.telemetry.camera.position.map((x, i) => x - sample.telemetry.camera.target[i])
  const local = frame ? [0, 1, 2].map(i => {
    const column = frame.slice(i * 4, i * 4 + 3), scaleSquared = column.reduce((sum, x) => sum + x * x, 0)
    return column.reduce((sum, x, j) => sum + x * v[j], 0) / scaleSquared
  }) : v
  // Shaft frame is glTF study space: shaftMetrePoint(x,y,z)=(x,z,-y).
  // Authored machine azimuth is atan2(machine.z,machine.x)=atan2(study.y,study.x).
  return Math.atan2(local[shaft ? 1 : 2], local[0]) * 180 / Math.PI
}
const signedDelta = (a, b) => ((b - a + 540) % 360) - 180
export function sweepGates(samples, shot, orbitFrame) {
  if (samples.length < 3) return [gate(`${shot.id}: sweep`, null, 'Too few samples')]
  const shaft = shot.progressSpace === 'shaft-study'
  const frames = samples.map(s => orbitFrame ?? (shaft ? s.telemetry.frame : shot.id === 'ringSwitch' ? s.snapshot?.ring?.rootMatrix : s.snapshot?.opening?.modelMatrix))
  const hasFrame = frames.every(f => vec(f, 16))
  const angles = samples.map((s, i) => azimuth(s, frames[i], shaft)), delta = angles.slice(1).map((x, i) => signedDelta(angles[i], x))
  const sweep = delta.reduce((a, b) => a + b, 0), sign = Math.sign(sweep)
  const nativeHeight = samples[0].nativeViewport?.[1] ?? samples[0].telemetry.viewport[1]
  const speeds = delta.map((d, i) => Math.abs(d / ((samples[i + 1].scrollY - samples[i].scrollY) / nativeHeight)))
  const span = Math.abs(samples.at(-1).scrollY - samples[0].scrollY) / nativeHeight
  const evidence = { basis: hasFrame ? shaft ? 'installed shaft frame, study XY -> machine XZ' : 'installed ring/source oracle assembly frame' : 'WORLD-Y DIAGNOSTIC ONLY', signedSweepDeg: sweep,
    deltas: delta, peakDegPerNativeVp: Math.max(...speeds), nativeViewportSpan: span, threshold: shot.minCameraSweepDeg }
  const clock = s => shot.id === 'ringSwitch' ? s.snapshot?.ring?.time : s.telemetry.inspection.cameraTime
  const duration = clock(samples.at(-1)) - clock(samples[0])
  const plateauSpeeds = speeds.filter((_, i) => {
    const u = duration > 0 ? ((clock(samples[i]) + clock(samples[i + 1])) / 2 - clock(samples[0])) / duration : (i + .5) / (samples.length - 1)
    return u >= shot.rampFraction && u <= 1 - shot.rampFraction
  })
  return [gate(`${shot.id}: signed sweep and no counter-swings`, hasFrame ? Math.abs(sweep) >= shot.minCameraSweepDeg && delta.every(d => sign * d >= -1e-4) : null, evidence),
    gate(`${shot.id}: plateau camera >=35deg/native-vp`, hasFrame ? plateauSpeeds.length > 0 && plateauSpeeds.every(finite) && Math.max(...plateauSpeeds) >= LIMITS.minDegPerVp : null, { ...evidence, plateauSpeeds }),
    gate(`${shot.id}: compact 2..4.5 native-vp`, span >= LIMITS.minVp && span <= LIMITS.maxVp, evidence)]
}

function distManifest() {
  const files = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`dist symlink not accepted: ${full}`)
      if (entry.isDirectory()) walk(full)
      else if (/\.(?:html|js|css|glb|gltf|bin|wasm|hdr|exr|ktx2|png|jpe?g|webp|avif|basis|woff2?|json)$/i.test(entry.name)) { const bytes = readFileSync(full); files.push({ path: path.relative(DIST, full).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha(bytes) }) }
    }
  }
  walk(DIST)
  if (!files.some(f => f.path === 'torque-wrench/index.html') || !files.some(f => f.path.startsWith('assets/') && f.path.endsWith('.js'))) throw new Error('dist lacks production page/bundles')
  return { files, sha256: sha(JSON.stringify(files)) }
}

async function servedIdentity(api, url, manifest) {
  const results = []
  for (const file of manifest.files) {
    // Hash the route response too; /index.html alone does not prove page navigation.
    const remote = file.path === 'torque-wrench/index.html' ? url : new URL('/' + file.path, url).href
    try {
      const response = await api.get(remote, { timeout: 30000, headers: { 'Cache-Control': 'no-cache' } })
      const servedSha256 = sha(await response.body())
      results.push({ path: file.path, url: remote, status: response.status(), servedSha256, localSha256: file.sha256,
        pass: response.status() === 200 && servedSha256 === file.sha256 })
    } catch (error) { results.push({ path: file.path, pass: false, error: String(error) }) }
  }
  return results
}

export async function sourceModule(entry) {
  const { buildSync } = await import('esbuild')
  const result = buildSync({ entryPoints: [entry], absWorkingDir: ROOT, bundle: true, platform: 'node', format: 'cjs', packages: 'external', write: false, logLevel: 'silent', metafile: true })
  const module = { exports: {} }
  Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(path.resolve(ROOT, entry)), module, module.exports)
  return { exports: module.exports, inputs: Object.keys(result.metafile.inputs).map(file => ({ file, sha256: sha(readFileSync(path.resolve(ROOT, file))) })) }
}

async function observe(page, includeWitnesses = false) {
  return page.evaluate(includeWitnesses => {
    const port = window.__torqueWorld, telemetry = port?.cinematography?.(includeWitnesses)
    const snapshot = port?.snapshot?.()
    const hud = []
    // torque-shaft-hud itself is an empty inset:0 positioning wrapper. Measure
    // its visible children, including captions and the separate FOS bar.
    const selectors = '.torque-header,.torque-footer,.torque-nav,.torque-hud,.torque-chapter__title,.torque-chapter__lede,.torque-chapter__body,.torque-inspection__panel,.torque-inspection__toggle,.torque-inspection__footer,.torque-freelook-toggle,[data-shaft-card],[data-shaft-fos-model],.shaft-fos-bar,[data-shaft-attribution],[data-shaft-recap],[data-shaft-caption],[data-torque-hotspot]'
    for (const el of document.querySelectorAll(selectors)) {
      let visible = true
      for (let parent = el; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= .01) { visible = false; break }
      }
      const r = el.getBoundingClientRect()
      if (visible && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight) {
        hud.push({ selector: el.id ? '#' + el.id : el.className, left: r.left, top: r.top, right: r.right, bottom: r.bottom })
      }
    }
    return { telemetry, frames: snapshot?.frames, tier: snapshot?.mechanical?.tier, renderer: snapshot?.renderer,
      scrollY, nativeViewport: [innerWidth, innerHeight], hud,
      snapshot: { ring: snapshot?.ring && { time: snapshot.ring.time, rootMatrix: snapshot.ring.rootMatrix, subjectMatrix: snapshot.ring.subjectMatrix },
        opening: snapshot?.opening, inspection: snapshot?.inspection, isolation: snapshot?.isolation }, motion: port?.motionSample?.(),
      canvas: document.querySelector('.torque-scene canvas')?.getBoundingClientRect().toJSON() ?? null }
  }, includeWitnesses)
}

async function seek(page, progress, reachablePixel = null, includeWitnesses = true) {
  const requested = await page.evaluate(({ p, pixel }) => {
    const y = pixel ?? Math.round(window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight))
    window.scrollTo({ top: y, behavior: 'instant' })
    return { y, requested: p }
  }, { p: progress, pixel: reachablePixel })
  const start = Date.now(), history = []
  let anchor = null, previous = null, stableAt = 0, count = 0
  while (Date.now() - start < LIMITS.seekTimeoutMs) {
    // New rendered frames, not arbitrary wall-time sleeps. Heavy vertex scans are
    // outside useFrame and may take more than one renderer frame themselves.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())))
    const current = await observe(page)
    const error = previous ? compareState(previous.telemetry, current.telemetry) : null
    const anchorError = anchor ? compareState(anchor.telemetry, current.telemetry) : null
    const atScroll = Math.abs(current.scrollY - requested.y) < .01
    const atProgress = finite(current.telemetry?.progress) && Math.abs(current.telemetry.progress - progress) <= 5e-5
    const newFrame = finite(current.frames) && current.frames > (previous?.frames ?? -1)
    const stable = atScroll && atProgress && newFrame && error && error.cameraError < LIMITS.stable && error.subjectError < LIMITS.stable
      && anchorError && anchorError.cameraError < LIMITS.stable && anchorError.subjectError < LIMITS.stable
    if (stable) count++
    else { count = 0; stableAt = Date.now(); anchor = current }
    history.push({ ms: Date.now() - start, frames: current.frames, scrollY: current.scrollY, progress: current.telemetry?.progress, ...error })
    if (count >= LIMITS.stableFrames && Date.now() - stableAt >= LIMITS.stableMs) {
      const complete = await observe(page, includeWitnesses)
      return { ...complete, requestedProgress: progress, settling: { elapsedMs: Date.now() - start, stableFrames: count, stableMs: Date.now() - stableAt, last: history.slice(-12), method: 'rendered-frame camera/subject/clocks stability against previous AND window anchor' } }
    }
    previous = current
  }
  throw new Error(`Native seek did not measurably settle: ${JSON.stringify({ progress, requested, history: history.slice(-15) })}`)
}

async function beauty(page, file) {
  const canvas = page.locator('.torque-scene canvas')
  if (await canvas.count() !== 1) throw new Error('Exactly one presentation canvas required')
  const bytes = await canvas.screenshot({ type: 'png', animations: 'allow', caret: 'initial', timeout: 30000 })
  writeFileSync(file, bytes)
  const decoded = await page.evaluate(async encoded => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${encoded}`)).blob())
    const surface = new OffscreenCanvas(bitmap.width, bitmap.height), ctx = surface.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const rgba = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
    const digest = await crypto.subtle.digest('SHA-256', rgba)
    let min = 255, max = 0, opaque = 0
    for (let i = 0; i < rgba.length; i += 4) { min = Math.min(min, rgba[i], rgba[i + 1], rgba[i + 2]); max = Math.max(max, rgba[i], rgba[i + 1], rgba[i + 2]); if (rgba[i + 3]) opaque++ }
    const result = { width: bitmap.width, height: bitmap.height, minRgb: min, maxRgb: max, opaquePixels: opaque, rgbaSha256: [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('') }
    bitmap.close(); return result
  }, bytes.toString('base64'))
  return { ...decoded, pngSha256: sha(bytes), file: path.basename(file), hudSuppression: 'none', scope: 'entire presentation canvas screenshot, including any DOM painted over its bounds' }
}

export function makePlan(specs) {
  const shots = Object.values(specs).map(s => ({ ...s, nativeWindow: s.window.map(p => p - (s.progressSpace === 'shaft-study' ? .115 : 0)), machining: ['ringSwitch', 'shaperContact', 'hobContact', 'stage1Ignition'].includes(s.id) }))
  const ordinary = [0, .0456, .0792, .0948, .1008, .1056, .12, .2, .395, .418, .46, .469, .4725, .495, .505, .52, .545, .56, .587, .6, .62, .64, .66, .735, .76, .79, .805, .815, .817, .82, .825, .845, .87, .9, .924, .94, .955, .965, .98, .99, .995]
  const fractions = [0, .05, .15, .25, .375, .5, .625, .75, .85, .95, 1]
  const points = [...new Set([...ordinary, ...shots.flatMap(s => fractions.map(u => s.nativeWindow[0] + u * (s.nativeWindow[1] - s.nativeWindow[0])))].map(p => Number(p.toFixed(12))))].sort((a, b) => a - b)
  return { shots, points }
}

function shotAt(plan, progress) { return plan.shots.find(s => progress >= s.nativeWindow[0] - 1e-10 && progress <= s.nativeWindow[1] + 1e-10) }

async function reducedCase(page, result, save, dir) {
  const narrow = result.name.startsWith('narrow')
  await page.waitForFunction(() => document.querySelector('.torque-page[data-torque-mode="static"]') && document.querySelector('.torque-posters') && document.querySelectorAll('[data-torque-chapter]').length > 0, null, { timeout: 90000 })
  for (const fraction of [0, .5, 1, .5, 0]) {
    const probe = await page.evaluate(async f => {
      const y = Math.round(f * (document.documentElement.scrollHeight - innerHeight))
      window.scrollTo({ top: y, behavior: 'instant' })
      let stable = 0, last = null
      const started = performance.now()
      while (performance.now() - started < 10000) {
        await new Promise(resolve => requestAnimationFrame(resolve))
        if (scrollY === last && Math.abs(scrollY - y) <= 1) stable++; else stable = 0
        last = scrollY
        if (stable >= 8) break
      }
      const images = [...document.querySelectorAll('.torque-posters img')].map(img => ({ src: img.currentSrc, complete: img.complete, width: img.naturalWidth }))
      return { fraction: f, y, scrollY, stable, mode: document.querySelector('.torque-page')?.dataset.torqueMode,
        viewport: [innerWidth, innerHeight],
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, canvasCount: document.querySelectorAll('.torque-scene canvas').length,
        posters: document.querySelectorAll('.torque-poster,.torque-poster-slot').length, images,
        chapters: document.querySelectorAll('[data-torque-chapter]').length, lenis: !!window.__lenis || document.documentElement.classList.contains('lenis') }
    }, fraction)
    result.samples.push(probe)
    result.gates.push(gate(`static native path ${fraction}`, probe.reduced && probe.mode === 'static' && probe.canvasCount === 0 && !probe.lenis && probe.posters > 0 && probe.chapters > 0 && probe.stable >= 8 && probe.images.every(i => i.complete && i.width > 0) && probe.viewport[0] === (narrow ? 390 : 1440) && probe.viewport[1] === (narrow ? 844 : 900), probe))
    await page.screenshot({ path: path.join(dir, `static-${result.samples.length}.png`), animations: 'allow' })
    save()
  }
  const cad = result.requests.filter(u => /\.(glb|gltf)(?:\?|$)/i.test(u))
  result.gates.push(gate('static reduced path loads no CAD/tool assets', cad.length === 0, cad))
}

export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  if (args.help) { console.log('Usage: --url=http://localhost:4173/torque-wrench/ --out=output/playwright/NEW --cases=' + CASES.join(',') + ' [--oracle=existing-source.ts]'); return }
  mkdirSync(args.out, { recursive: true })
  const report = { status: 'INCOMPLETE', startedAt: new Date().toISOString(), url: args.url, launch: describeLaunch(), limits: LIMITS,
    selected: args.cases, omitted: CASES.filter(c => !args.cases.includes(c)), cases: [], gates: [], errors: [],
    limitations: ['Sampled trajectory evidence is not continuous collision or meshing proof.', 'Source/pixel/runtime/owner acceptance are separate; owner acceptance is OPEN.', 'Local source oracle imports do not establish build-from-source provenance.', 'No HUD counters or subject pixels are masked.'],
  }
  const save = () => {
    report.status = classify([...report.gates, ...report.cases.flatMap(c => c.gates)], [...report.errors, ...report.cases.flatMap(c => c.errors)], [...report.omitted, ...args.cases.filter(name => !report.cases.find(c => c.name === name && c.completed))])
    writeFileSync(path.join(args.out, 'report.json'), JSON.stringify(report, (_, value) => typeof value === 'number' && !Number.isFinite(value) ? String(value) : value, 2) + '\n')
  }
  let browser, api
  save()
  try {
    const manifest = distManifest(); report.build = manifest
    const contract = await sourceModule('src/scene/torque-wrench/bulletTime.ts')
    report.contractInputs = contract.inputs
    report.gates.push(canonicalGate(contract.exports.BULLET_TIME_SHOT_SPECS))
    if (report.gates.at(-1).status !== 'PASS') throw new Error('Source shot specs weaken/change required canonical targets')
    const plan = makePlan(contract.exports.BULLET_TIME_SHOT_SPECS); report.plan = plan
    const sources = {}
    for (const [key, entry] of Object.entries({ clock: 'src/scene/torque-wrench/InspectionDirector.ts',
      ring: 'src/scene/torque-wrench/RingInspection.ts', timeline: 'src/scene/inspection/timeline.ts',
      kinematics: 'src/scene/inspection/shaft/kinematics.ts', schedule: 'src/scene/inspection/shaft/schedule.ts',
      cascade: 'src/scene/inspection/shaft/cascadeConfig.ts', opening: 'src/scene/torque-wrench/OpeningDirector.ts',
      dome: 'src/scene/torque-wrench/shardDome.ts', intro: 'src/scene/drawing/introTimeline.ts', geometry: 'src/scene/drawing/drawingGeometry.ts' })) {
      const source = await sourceModule(entry); sources[key] = source.exports
      report.contractInputs.push(...source.inputs)
    }
    sources.contract = contract.exports
    const oracle = args.oracle ? await sourceModule(args.oracle) : null
    if (oracle && typeof oracle.exports.expected !== 'function') throw new Error('Oracle must export expected({shot,sample,previous})')
    report.oracleInputs = oracle?.inputs ?? []
    const { chromium, request } = await import('playwright')
    api = await request.newContext()
    report.servedBefore = await servedIdentity(api, args.url, manifest)
    report.gates.push(gate('served HTML and all local production HTML/JS/CSS match dist bytes', report.servedBefore.every(r => r.pass), report.servedBefore)); save()
    if (report.gates.at(-1).status === 'FAIL') throw new Error('Production identity mismatch; refusing mixed-build roster')
    browser = await launchBrowser(chromium)
    for (const name of args.cases) {
      const narrow = name.startsWith('narrow'), reduced = name.endsWith('reduced'), quality = name.endsWith('lite') ? 'lite' : 'full'
      const dir = path.join(args.out, name); mkdirSync(dir)
      const expectedViewport = narrow ? [390, 844] : [1440, 900]
      const result = { name, expectedViewport, status: 'INCOMPLETE', completed: false, errors: [], requests: [], resources: [], samples: [], reverse: [], random: [], gates: [] }
      report.cases.push(result); save()
      let context
      try {
        context = await browser.newContext({ viewport: { width: narrow ? 390 : 1440, height: narrow ? 844 : 900 }, deviceScaleFactor: 1,
          reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
        const page = await context.newPage(), pending = new Set()
        page.on('pageerror', e => result.errors.push(String(e)))
        page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()) })
        page.on('request', r => result.requests.push(r.url()))
        page.on('requestfailed', r => result.errors.push(`${r.url()}: ${r.failure()?.errorText}`))
        page.on('response', response => {
          const u = new URL(response.url())
          if (u.origin !== new URL(args.url).origin || !/\.(?:html|js|css|glb|gltf|bin|wasm|hdr|exr|ktx2|png|jpe?g|webp|avif|basis|woff2?|json)$/i.test(u.pathname)) return
          const task = (async () => {
            const file = decodeURIComponent(u.pathname).replace(/^\//, ''), expected = manifest.files.find(f => f.path === file)
            try { const servedSha256 = sha(await response.body()); result.resources.push({ file, status: response.status(), servedSha256, localSha256: expected?.sha256 ?? null, pass: response.status() === 200 && !!expected && servedSha256 === expected.sha256 }) }
            catch (error) { result.resources.push({ file, pass: false, error: String(error) }) }
          })()
          pending.add(task); task.finally(() => pending.delete(task))
        })
        const caseUrl = new URL(args.url); caseUrl.searchParams.set('quality', quality)
        const nav = await page.goto(caseUrl.href, { waitUntil: 'domcontentloaded', timeout: 90000 })
        const navHash = sha(await nav.body()), entryHash = manifest.files.find(f => f.path === 'torque-wrench/index.html').sha256
        result.gates.push(gate('actual navigation HTML matches same dist', nav.status() === 200 && navHash === entryHash, { status: nav.status(), servedSha256: navHash, localSha256: entryHash }))
        if (reduced) await reducedCase(page, result, save, dir)
        else {
          await page.waitForFunction(() => {
            const snapshot = window.__torqueWorld?.snapshot?.()
            return snapshot?.ready && snapshot.sheet?.baked && snapshot.sheet?.stats?.annotationsReady === 1
              && window.__torqueWorld?.cinematography && window.__torqueNarrative?.scrollFraction
          }, null, { timeout: 180000 })
          await page.evaluate(() => document.fonts.ready)
          // Warm all installed variants before the recorded ascending pass.
          result.warmup = []
          for (const p of [.99, .82, .78, .701, .48, .44, 0]) {
            // Warm resources and clocks without rebuilding every CAD hull.
            const sample = await seek(page, p, null, false)
            result.warmup.push({ progress: p, settling: sample.settling, tier: sample.tier }); save()
          }
          for (let i = 0; i < plan.points.length; i++) {
            const sample = await seek(page, plan.points[i]), shot = shotAt(plan, sample.requestedProgress)
            sample.shot = shot?.id ?? 'ordinary'
            sample.beauty = await beauty(page, path.join(dir, `forward-${i}.png`))
            const after = await observe(page), drift = compareState(sample.telemetry, after.telemetry)
            result.gates.push(gate(`capture stable ${i}`, drift.cameraError < LIMITS.replay && drift.subjectError < LIMITS.replay, drift))
            result.samples.push(sample)
            const roi = roiGate(sample, shot)
            if (roi) result.gates.push(roi)
            result.gates.push(gate(`sample ${i}: live requested ${quality}`, sample.tier === quality && validTelemetry(sample.telemetry), { tier: sample.tier, renderer: sample.renderer }))
            result.gates.push(gate(`sample ${i}: expected native viewport`, sample.nativeViewport?.[0] === expectedViewport[0] && sample.nativeViewport?.[1] === expectedViewport[1]
              && sample.telemetry?.viewport?.[0] === expectedViewport[0] && sample.telemetry?.viewport?.[1] === expectedViewport[1],
            { expected: expectedViewport, native: sample.nativeViewport, telemetry: sample.telemetry?.viewport }))
            result.gates.push(gate(`sample ${i}: horizon pole guard`, finite(sample.telemetry.poleDot) && sample.telemetry.poleDot < LIMITS.poleDot, sample.telemetry.poleDot))
            result.gates.push(gate(`sample ${i}: nonblank decoded beauty`, sample.beauty.maxRgb > sample.beauty.minRgb && sample.beauty.opaquePixels > 0, sample.beauty))
            result.gates.push(...clearanceGates(sample, shot?.machining).map(g => ({ ...g, name: `sample ${i}: ${g.name}` })))
            appendFileSync(path.join(dir, 'samples.jsonl'), JSON.stringify({ order: 'forward', index: i, sample }) + '\n')
            if ((i + 1) % 11 === 0 || i === plan.points.length - 1) save()
          }
          for (const label of ['reverse', 'random']) {
            const indices = label === 'reverse' ? plan.points.map((_, i) => i).reverse() : primeOrder(plan.points.length)
            for (const i of indices) {
              const forward = result.samples[i]
              // Replay compares exact matrices/clocks/camera and beauty. Hull
              // projection is unchanged for an identical installed state.
              const sample = await seek(page, plan.points[i], forward.scrollY, false)
              const capture = await beauty(page, path.join(dir, `${label}-${i}.png`))
              const after = await observe(page), drift = compareState(sample.telemetry, after.telemetry)
              const record = { index: i, progress: plan.points[i], ...compareState(forward.telemetry, sample.telemetry),
                forwardHash: `${forward.beauty.width}x${forward.beauty.height}:${forward.beauty.rgbaSha256}`, replayHash: `${capture.width}x${capture.height}:${capture.rgbaSha256}`,
                settling: sample.settling, captureDrift: drift, telemetry: sample.telemetry, beauty: capture }
              result[label].push(record)
              result.gates.push(gate(`${label} same reachable CSS scroll pixel ${i}`, Math.abs(sample.scrollY - forward.scrollY) < .01, { forward: forward.scrollY, replay: sample.scrollY, requestedProgress: plan.points[i], actualProgress: sample.telemetry.progress }))
              result.gates.push(gate(`${label} capture stable ${i}`, drift.cameraError < LIMITS.replay && drift.subjectError < LIMITS.replay, drift))
              appendFileSync(path.join(dir, 'samples.jsonl'), JSON.stringify({ order: label, ...record }) + '\n')
              if (result[label].length % 11 === 0) save()
            }
            result.gates.push(...replayGates(result[label], label)); save()
          }
          for (const shot of plan.shots) {
            const samples = result.samples.filter(s => s.shot === shot.id)
            const expected = oracle ? await oracle.exports.expected({ shot, sample: samples[0], previous: null }) : null
            const frame = vec(expected?.orbitFrame, 16) ? expected.orbitFrame : null
            result.gates.push(...sweepGates(samples, shot, frame))
            result.gates.push(...builtinPhysicalGates(samples, shot, sources))
            if (oracle) result.gates.push(...await physicalGates(samples, shot, oracle.exports.expected))
          }
          result.gates.push(gate('full forward/reverse/random roster recorded', result.samples.length === plan.points.length && result.reverse.length === plan.points.length && result.random.length === plan.points.length, { points: plan.points.length, forward: result.samples.length, reverse: result.reverse.length, random: result.random.length }))
        }
        await Promise.all([...pending])
        result.gates.push(gate('browser-loaded bundles match SAME production build', result.resources.length > 0 && result.resources.every(r => r.pass), result.resources))
        result.gates.push(gate('zero browser errors', result.errors.length === 0, result.errors))
        result.completed = true
      } catch (error) { result.errors.push(error.stack ?? String(error)); result.gates.push(gate('case execution', false, String(error))) }
      finally {
        if (context) await context.close().catch(e => result.errors.push(String(e)))
        result.status = classify(result.gates, result.errors); save()
        console.log(`${name}: ${result.status}`)
      }
    }
    const after = distManifest(); report.buildAfter = after.sha256
    report.servedAfter = await servedIdentity(api, args.url, manifest)
    report.gates.push(gate('same local and served build remains after all cases', after.sha256 === manifest.sha256 && report.servedAfter.every(r => r.pass), { localBefore: manifest.sha256, localAfter: after.sha256, served: report.servedAfter }))
    report.gates.push(gate('source contract/oracle inputs unchanged during roster', [...report.contractInputs, ...report.oracleInputs].every(x => sha(readFileSync(path.resolve(ROOT, x.file))) === x.sha256), [...report.contractInputs, ...report.oracleInputs]))
  } catch (error) { report.errors.push(error.stack ?? String(error)) }
  finally {
    if (browser) await browser.close().catch(e => report.errors.push(String(e)))
    if (api) await api.dispose().catch(e => report.errors.push(String(e)))
    report.finishedAt = new Date().toISOString(); save()
  }
  console.log(`${report.status}: ${path.join(args.out, 'report.json')}; omitted=${report.omitted.join(',') || 'none'}`)
  process.exitCode = report.status === 'PASS' ? 0 : report.status === 'FAIL' ? 1 : 2
  return report
}

export function primeOrder(n) {
  const gcd = (a, b) => b ? gcd(b, a % b) : a
  if (!Number.isInteger(n) || n < 1) throw new Error('Nonempty roster required')
  if (gcd(n, 613) !== 1) throw new Error('Roster length must be coprime with 613 for exact prime-stride replay')
  return Array.from({ length: n }, (_, i) => (i * 613) % n)
}

export function builtinPhysicalGates(samples, shot, sources) {
  if (samples.length < 3) return [gate(`${shot.id}: installed physical motion`, null, 'Insufficient samples')]
  if (shot.id === 'shatter') return shatterPhysicalGates(samples, shot, sources)
  const { clock, ring, timeline, kinematics: kin, schedule, cascade, contract } = sources
  const choose = s => shot.id === 'ringSwitch' ? { name: 'installed-ring-spin', matrixWorld: s.snapshot?.ring?.subjectMatrix }
    : s.telemetry.subjects.find(x => x.name.endsWith(shot.id === 'shaperContact' ? '/legacyshaft' : '/approvedshaft'))
  const scalar = p => {
    if (shot.id === 'ringSwitch') return timeline.sampleInspection(ring.ringMechanicalTimeAt(clock.ringTimeAt(p)), timeline.newFrame()).angle
    const time = clock.subjectTimeAt(p + .115)
    if (shot.id === 'shaperContact') return -kin.WORK_RATE * kin.machiningTimeAt(time)
    if (shot.id === 'hobContact') return kin.hobPhiAt(time) / 10
    return -cascade.SUN_TO_STAGE1_CARRIER_RATIO * schedule.sampleFinaleAngle(time)
  }
  const cameraClock = s => shot.id === 'ringSwitch' ? clock.ringTimeAt(s.telemetry.progress) : clock.cameraTimeAt(s.telemetry.progress + .115)
  const startClock = shot.id === 'ringSwitch' ? shot.displayWindow[0] : clock.cameraTimeAt(shot.window[0])
  const duration = shot.id === 'ringSwitch' ? shot.displayWindow[1] - startClock : clock.cameraTimeAt(shot.window[1]) - startClock
  const normal = shot.id === 'ringSwitch' ? timeline.SPIN_RATE * ring.RING_NORMAL_RATE
    : shot.id === 'shaperContact' ? -kin.WORK_RATE : shot.id === 'hobContact' ? Math.PI / 10 : -cascade.SUN_TO_STAGE1_CARRIER_RATIO * schedule.IGNITION_NORMAL_RATE
  const ratio = shot.id === 'ringSwitch' ? ring.RING_BULLET_RATIO : shot.rate
  const area = ratio + shot.rampFraction * (1 - ratio)
  const physical = s => {
    const u = (cameraClock(s) - startClock) / duration
    // The nearest reachable scroll pixel can lie just outside the nominal
    // window. Include its normal-speed shoulder instead of clamping movement.
    if (u < 0) return normal * duration * u
    if (u > 1) return normal * duration * (area + u - 1)
    return normal * duration * area * contract.sampleBulletTimeWarp(u, ratio, shot.rampFraction)
  }
  const records = [], clockRecords = []
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i], am = choose(a), bm = choose(b)
    const actual = am && bm && am.name === bm.name ? signedMatrixRotation(am.matrixWorld, bm.matrixWorld, [0, 0, 1]) : NaN
    const expected = scalar(b.telemetry.progress) - scalar(a.telemetry.progress)
    const canonical = physical(b) - physical(a)
    records.push({ fromProgress: a.telemetry.progress, toProgress: b.telemetry.progress, subject: bm?.name,
      installedRadians: actual, sourceRadians: expected, canonicalIntegratedRadians: canonical,
      sourceError: Math.abs(actual - expected), canonicalError: Math.abs(actual - canonical),
      cameraDelta: cameraClock(b) - cameraClock(a), normalRadiansPerCameraSecond: normal, plateauRatio: ratio })
    const expectedTime = shot.id === 'ringSwitch' ? clock.ringTimeAt(b.telemetry.progress) : clock.subjectTimeAt(b.telemetry.progress + .115)
    const observedTime = shot.id === 'ringSwitch' ? b.snapshot?.ring?.time : b.telemetry.inspection.subjectTime
    clockRecords.push({ observedTime, expectedTime, error: Math.abs(observedTime - expectedTime) })
  }
  const complete = records.every(r => finite(r.installedRadians))
  const gates = [gate(`${shot.id}: installed rotary matrices match exact source at reachable pixels`, complete ? records.every(r => r.sourceError < 1e-5 && Math.abs(r.sourceRadians) < Math.PI) : null, records),
    gate(`${shot.id}: physical integrated rate including knees (no stacked ease)`, complete ? records.every(r => r.canonicalError < 1e-5 && r.cameraDelta > 0 && Math.sign(r.installedRadians) === Math.sign(normal)) : null, records),
    gate(`${shot.id}: installed subject clock matches source`, clockRecords.every(r => finite(r.error) && r.error < 1e-5), clockRecords)]
  if (shot.maxRevolutions !== undefined) {
    const ratioToFeature = shot.id === 'ringSwitch' ? timeline.RING_RADIUS / timeline.WHEEL_RADIUS : 1
    const measuredTurns = Math.abs(records.reduce((sum, r) => sum + r.installedRadians, 0)) * ratioToFeature / (2 * Math.PI)
    const pixelSourceTurns = Math.abs(scalar(samples.at(-1).telemetry.progress) - scalar(samples[0].telemetry.progress)) * ratioToFeature / (2 * Math.PI)
    const exactSourceTurns = Math.abs(scalar(shot.nativeWindow[1]) - scalar(shot.nativeWindow[0])) * ratioToFeature / (2 * Math.PI)
    const boundary = { requestedWindow: shot.nativeWindow, actualWindow: [samples[0].telemetry.progress, samples.at(-1).telemetry.progress],
      nominalBudget: shot.maxRevolutions, measuredTurns, expectedAtReachablePixels: pixelSourceTurns, exactSourceTurns,
      boundaryPixelCorrectionTurns: pixelSourceTurns - exactSourceTurns }
    gates.push(gate(`${shot.id}: exact source revolution budget`, Math.abs(exactSourceTurns - shot.maxRevolutions) < 1e-10, boundary))
    gates.push(gate(`${shot.id}: installed budget at reachable boundary pixels`, complete ? Math.abs(measuredTurns - pixelSourceTurns) < 1e-5 : null, boundary))
  }
  return gates
}

/** Independent reconstruction from immutable bake inputs, never fitted live poses. */
export function shatterPhysicalGates(samples, shot, sources) {
  const { opening, dome, intro, geometry } = sources
  const inputs = samples[0]?.telemetry?.shatter
  if (!opening || !dome || !intro || !vec(inputs?.frame, 16) || !inputs?.fragments?.length)
    return [gate('shatter: source and installed shard physical motion', null, 'Missing immutable bake inputs, rigid sheet frame or source clocks')]
  const fragments = inputs.fragments
  const valid = fragments.every(f => vec(f.center, 2) && vec(f.velocity, 3) && vec(f.spin, 3) && finite(f.delay) && f.delay >= 0 && f.delay < 1)
    && finite(inputs.primaryCenter?.x) && finite(inputs.primaryCenter?.y)
  if (!valid) return [gate('shatter: valid immutable bake inputs', false, 'Malformed shard launch data')]
  const domes = dome.createShardDome(fragments.map(f => ({ center: new Vector3(...f.center, 0), velocity: new Vector3(...f.velocity) })), inputs.primaryCenter)
  const rows = [], clocks = [], motions = []
  const sourceFrame = s => {
    const extraction = s.snapshot?.opening?.extraction, crossing = s.snapshot?.opening?.crossing
    if (!geometry?.SHEET_ROTATION || !finite(crossing) || !finite(extraction?.initialZ) || !finite(extraction?.travel)) return null
    const t = opening.sampleOpening(s.telemetry.progress, crossing).poseT
    const release = t <= .5 ? intro.smooth01((t - .7) / .3) : t >= 1 ? 1 : Math.pow((t - .5) / .5, 1.4)
    return geometry.SHEET_ROTATION.clone().multiply(new Matrix4().makeTranslation(-inputs.primaryCenter.x * release,
      -inputs.primaryCenter.y * release, -(extraction.initialZ + extraction.travel) * release))
  }
  const expectedAt = (s, i) => {
    const p = s.telemetry.progress, frame = sourceFrame(s)
    if (!frame) return null
    const f = fragments[i], d = domes[i], t = opening.breakthroughSubjectTimeAt(p)
    const e = Math.max(0, Math.min(1, ((t - intro.INTRO_PHASES.fractureStart)
      / (intro.INTRO_PHASES.fractureEnd - intro.INTRO_PHASES.fractureStart) - f.delay) / (1 - f.delay)))
    const u = e * e * (3 - 2 * e), fallU = Math.max(0, Math.min(1, (e - .76) / .24))
    const position = new Vector3(f.center[0] + d.vx * u * .95, f.center[1] + d.vy * u * .95 - .055 * e * e,
      .00002 + d.apex * Math.sin(Math.PI * e) - .035 * e * e - .18 * fallU * fallU * (3 - 2 * fallU))
    const q = new Quaternion().setFromEuler(new Euler(...f.spin.map(x => x * u), 'XYZ'))
    return frame.multiply(new Matrix4().compose(position, q, new Vector3(1, 1, 1))).toArray()
  }
  for (let j = 0; j < samples.length; j++) {
    const s = samples[j], p = s.telemetry.progress, prior = samples[j - 1]
    const data = s.telemetry.shatter
    const sameInputs = data && JSON.stringify(data.fragments) === JSON.stringify(fragments)
      && JSON.stringify(data.primaryCenter) === JSON.stringify(inputs.primaryCenter)
    const expectedFrame = sourceFrame(s)?.toArray()
    clocks.push({ progress: p, error: Math.abs(data?.subjectTime - opening.breakthroughSubjectTimeAt(p)), sameInputs: !!sameInputs,
      registrationError: maxDiff(data?.frame, expectedFrame) })
    const actuals = new Map(s.telemetry.subjects.filter(x => x.name.startsWith('shatter/')).map(x => [x.name.split('/').at(-1), x.matrixWorld]))
    for (let i = 0; i < fragments.length; i++) {
      const expected = expectedAt(s, i), actual = actuals.get('paper-fragment-' + i)
      rows.push({ progress: p, shard: i, error: maxDiff(actual, expected) })
      if (prior && actual && expected) {
        const previous = prior.telemetry.subjects.find(x => x.name.startsWith('shatter/') && x.name.endsWith('/paper-fragment-' + i))
        const oldExpected = expectedAt(prior, i)
        if (previous && oldExpected) motions.push({ shard: i, progress: p,
          expectedDistance: Math.hypot(...expected.slice(12, 15).map((x, k) => x - oldExpected[12 + k])),
          installedDistance: Math.hypot(...actual.slice(12, 15).map((x, k) => x - previous.matrixWorld[12 + k])) })
      }
    }
  }
  const plateau = samples.filter(s => s.telemetry.progress >= shot.plateauWindow[0] && s.telemetry.progress <= shot.plateauWindow[1])
  const rates = plateau.slice(1).map((s, i) => {
    const a = plateau[i].telemetry, b = s.telemetry
    return (b.shatter.subjectTime - a.shatter.subjectTime) / (opening.openingTimeAt(b.progress) - opening.openingTimeAt(a.progress))
  })
  return [gate('shatter: installed matrices match source-derived dome trajectories <1e-5', rows.length > 0 && rows.every(r => r.error < LIMITS.replay), rows),
    gate('shatter: immutable launch inputs, source extraction registration and installed subject clock', clocks.every(c => c.sameInputs && c.error < LIMITS.replay && c.registrationError < LIMITS.replay), clocks),
    gate('shatter: physical motion remains positive and matches integrated trajectory', motions.length > 0 && motions.every(m => m.expectedDistance > 0 && m.installedDistance > 0 && Math.abs(m.expectedDistance - m.installedDistance) < LIMITS.replay), motions),
    gate('shatter: installed plateau clock is exactly canonical .10 of normal opening clock', rates.length > 0 && rates.every(r => finite(r) && Math.abs(r - shot.rate) < 1e-8), rates)]
}

export async function physicalGates(samples, shot, expectedFn) {
  if (!expectedFn || samples.length < 2) return [gate(`${shot.id}: source/installed physical rate and budget`, null, 'Requires source oracle with stable subject names and reference normal physical rates/matrices')]
  const evidence = [], matrices = [], missingIntervals = []
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i], previous = samples[i - 1] ?? null
    const expected = await expectedFn({ shot, sample, previous })
    for (const subject of expected?.subjects ?? []) {
      const actual = sample.telemetry.subjects.find(s => s.name === subject.name)
      matrices.push({ progress: sample.requestedProgress, name: subject.name, error: actual ? maxDiff(actual.matrixWorld, subject.matrixWorld) : Infinity })
    }
    if (!previous) continue
    if (!expected?.physicalRates?.length) missingIntervals.push(i)
    for (const ref of expected?.physicalRates ?? []) {
      const a = previous.telemetry.subjects.find(s => s.name === ref.name), b = sample.telemetry.subjects.find(s => s.name === ref.name)
      const axis = ref.axis, axisValid = vec(axis, 3) && Math.abs(Math.hypot(...axis) - 1) < 1e-6
      let actualDelta = NaN
      if (a && b && axisValid) {
        if (ref.mode === 'rotation') actualDelta = signedMatrixRotation(a.matrixWorld, b.matrixWorld, axis)
        if (ref.mode === 'translation') actualDelta = axis.reduce((sum, x, j) => sum + x * (b.matrixWorld[12 + j] - a.matrixWorld[12 + j]), 0)
      }
      const cameraDelta = ref.cameraDelta ?? sample.telemetry.inspection.cameraTime - previous.telemetry.inspection.cameraTime
      const expectedRate = ref.normalUnitsPerCameraSecond * ref.ratio
      evidence.push({ progress: sample.requestedProgress, name: ref.name, mode: ref.mode, axis, actualDelta, cameraDelta,
        measuredRate: actualDelta / cameraDelta, expectedRate, ratio: ref.ratio, expectedDelta: ref.expectedDelta,
        canonicalIntegralError: Math.abs(ref.expectedDelta - expectedRate * cameraDelta), error: Math.abs(actualDelta - ref.expectedDelta) })
    }
  }
  const gates = []
  // Full expected matrices are optional when installed physical rate rows supply
  // complete proof; replay always compares ALL live matrices independently.
  if (matrices.length) gates.push(gate(`${shot.id}: source expected installed matrices <1e-5`, matrices.every(x => x.error < 1e-5), matrices))
  gates.push(gate(`${shot.id}: installed physical motion matches integrated canonical rate`, evidence.length && !missingIntervals.length ? evidence.every(x => finite(x.actualDelta)
    && x.cameraDelta > 0 && finite(x.expectedRate) && x.expectedRate !== 0 && x.ratio > 0 && x.ratio <= 1
    && x.canonicalIntegralError < 1e-8 && x.error < 1e-5 && Math.sign(x.actualDelta) === Math.sign(x.expectedRate)) : null,
  { intervals: evidence, missingIntervals }))
  return gates
}

export function signedMatrixRotation(a, b, axis) {
  if (!vec(a, 16) || !vec(b, 16) || !vec(axis, 3) || Math.abs(Math.hypot(...axis) - 1) > 1e-6) return NaN
  const normalized = m => [0, 1, 2].map(c => { const v = m.slice(c * 4, c * 4 + 3), length = Math.hypot(...v); return v.map(x => x / length) })
  const ac = normalized(a), bc = normalized(b)
  const r = ac.map(col => bc.map(other => col.reduce((sum, x, i) => sum + x * other[i], 0)))
  const sine = ((r[2][1] - r[1][2]) * axis[0] + (r[0][2] - r[2][0]) * axis[1] + (r[1][0] - r[0][1]) * axis[2]) / 2
  const cosine = (r[0][0] + r[1][1] + r[2][2] - 1) / 2
  return Math.atan2(sine, cosine)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await run() } catch (error) { console.error(error.stack ?? String(error)); process.exitCode = 2 }
}
