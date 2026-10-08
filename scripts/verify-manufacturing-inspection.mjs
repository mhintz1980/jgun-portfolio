/**
 * G1 runtime lifecycle verifier (W6, independent producer).
 * Spec: project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle-verifier-spec.md
 *
 * Real-browser lifecycle + ring evidence against the shared integration (ring story only).
 * Authored windows are parsed from src/scene/inspection/timeline.ts, never hard-coded.
 * Owned files: this script + the --out evidence directory. No src changes.
 */
import { chromium } from 'playwright'
import { launchBrowser } from './lib/browser-launch.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { pixels } from './lib/preview-pixels.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const url = process.argv.find(arg => arg.startsWith('--url='))?.slice(6) || 'http://localhost:4173'
const out = path.resolve(process.argv.find(arg => arg.startsWith('--out='))?.slice(6)
  || path.join('project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/lifecycle'))
await fs.mkdir(out, { recursive: true })

/** Authored ring windows read from the live timeline source (spec: no stale hard-coding). */
function parseTimeline(source) {
  const values = {}
  for (const match of source.replace(/\r\n/g, '\n').matchAll(/^export const ([A-Z][A-Z0-9_]*) = ([^\n]+)$/gm)) {
    const [, name, raw] = match
    const expression = raw.trim()
    if (!/^[\w\s+\-*/().]+$/.test(expression)) throw new Error(`timeline expression for ${name} is not arithmetic: ${expression}`)
    const bare = expression.replace(/Math\.[A-Za-z_$][\w$]*/g, ' ')
    const identifiers = [...bare.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map(m => m[0])
    const allowed = new Set([...Object.keys(values), 'Math'])
    if (!identifiers.every(id => allowed.has(id))) throw new Error(`timeline const ${name} references unknown identifiers: ${expression}`)
    values[name] = Function(...Object.keys(values), `return (${expression})`)(...Object.values(values))
  }
  const required = ['INSPECTION_DURATION', 'CONTACT_START', 'TRAVERSE_START', 'TRAVERSE_END', 'CONTACT_END',
    'TOOL_FADE_START', 'TOOL_FADE_END', 'TOOL_FADE_MIN_CLEARANCE', 'BLACK_FINISH_START', 'RETURN_START', 'FINAL_ANGLE', 'COVERAGE_TIME', 'FORMING_END']
  for (const name of required) if (!(name in values)) throw new Error(`timeline export missing: ${name}`)
  return values
}
const timeline = parseTimeline(await fs.readFile(path.join(rootDir, 'src/scene/inspection/timeline.ts'), 'utf8'))

const report = {
  url,
  started: new Date().toISOString(),
  command: `node scripts/verify-manufacturing-inspection.mjs --url=${url} --out=${out}`,
  timeline,
  cases: [],
  failures: [],
  defects: [],
  gates: {},
}
report.verifierSha256 = createHash('sha256').update(await fs.readFile(fileURLToPath(import.meta.url))).digest('hex')
const defects = []
const noteDefect = defect => { if (!defects.some(d => d.id === defect.id)) defects.push(defect) }
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify({ ...report, running: true }, null, 2))

const browser = await launchBrowser(chromium)
const check = (condition, message) => { if (!condition) throw new Error(message) }
const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance
const read = async page => {
  await page.waitForFunction(() => Boolean(window.__inspection), null, { timeout: 15000 })
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__inspection)))
}
/** Live GPU resource census straight from the renderer probe (SceneCanvas.tsx:336). */
const rendererInfo = page => page.evaluate(() => {
  const info = window.__threeRenderer?.info
  return { hasRenderer: !!window.__threeRenderer, programs: info?.programs?.length ?? null, geometries: info?.memory?.geometries ?? null, textures: info?.memory?.textures ?? null }
})
const waitRendererSettled = page => page.evaluate(() => new Promise((resolve, reject) => {
  let previous = '', stable = 0, total = 0
  const tick = () => {
    const info = window.__threeRenderer?.info
    if (!info) return reject(new Error('renderer probe missing during warm census'))
    const current = JSON.stringify([info.programs.length, info.memory.geometries, info.memory.textures])
    stable = current === previous ? stable + 1 : 0; previous = current; total++
    if (stable >= 60) return resolve({ stableFrames: stable, totalFrames: total, counts: JSON.parse(current) })
    if (total >= 1200) return reject(new Error('renderer census never stabilized for 60 frames'))
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}))
const seek = async (page, time, entryElapsed = 2) => {
  if (!Number.isFinite(time)) throw new Error(`verifier seek called with non-finite time: ${time}`)
  await waitLoaded(page)
  await page.evaluate(({ time, entryElapsed }) => window.__inspectionProof.seek(time, entryElapsed), { time, entryElapsed })
  await page.waitForTimeout(250)
  return read(page)
}
const loseContext = page => page.evaluate(() => {
  const canvas = document.querySelector('canvas[data-engine]') || document.querySelector('canvas')
  const gl = canvas?.getContext('webgl2')
  if (!gl) throw new Error('Live WebGL context is missing')
  const ext = gl.getExtension('WEBGL_lose_context')
  if (!ext) throw new Error('WEBGL_lose_context extension unavailable')
  ext.loseContext()
})

/** Wait until the narrative camera damping residual is at the rest-orbit scale. */
const waitForCameraSettled = page => page.evaluate(() => new Promise(resolve => {
  let count = 0
  let last = null
  const tick = () => {
    const c = window.__telemetry?.camera
    count++
    if (!c) { if (count > 200) return resolve({ settled: false }); return setTimeout(tick, 100) }
    // The resting view orbits 0.3 deg/s by design; "settled" means the damping residual
    // has fallen to that orbit scale, not that the camera is frozen.
    const moved = last ? Math.max(Math.abs(last[0] - c.x), Math.abs(last[1] - c.y), Math.abs(last[2] - c.z)) : Infinity
    if (moved < 5e-6) return resolve({ settled: true, waited: count })
    last = [c.x, c.y, c.z]
    if (count > 200) return resolve({ settled: false })
    setTimeout(tick, 140)
  }
  tick()
}))
const setHidden = (page, hidden) => page.evaluate(hidden => {
  if (hidden) {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  } else {
    delete document.visibilityState
    delete document.hidden
  }
  document.dispatchEvent(new Event('visibilitychange'))
}, hidden)
const installFrameObserver = async page => {
  await page.waitForFunction(() => !!window.__threeRenderer, null, { timeout: 120000 })
  await page.evaluate(() => {
    if (window.__g1Rendered) return
    window.__g1Rendered = { callbacks: new Set(), sequence: 0, last: null }
    const renderer = window.__threeRenderer, original = renderer.render
    renderer.render = function (scene, camera, ...args) {
      const value = original.call(this, scene, camera, ...args)
      if (scene === window.__threeScene) {
        const hooks = window.__g1Rendered, p = window.__inspection
        hooks.sequence++
        const frame = { sequence: hooks.sequence, sampleStamp: p?.sampleStamp, cameraSampleStamp: p?.cameraSampleStamp, sampledTime: p?.sampledTime, cameraSampleTime: p?.cameraSampleTime, drawCalls: this.info.render.calls, backgroundInsideRender: scene.background?.getHexString?.() ?? null }
        // The compositor temporarily clears scene.background around renderer.render.
        // A microtask runs after the full R3F rAF stack, when that transient state is restored.
        queueMicrotask(() => {
          hooks.last = { ...frame, backgroundAfterFrame: scene.background?.getHexString?.() ?? null }
          for (const callback of hooks.callbacks) callback()
        })
      }
      return value
    }
  })
}

/** rAF recorder: verifier-owned page instrumentation, reads telemetry only. */
const installRecorder = async page => {
  await installFrameObserver(page)
  return page.evaluate(() => {
  const w = window
  if (w.__g1Recorder) return
  const rec = w.__g1Recorder = { statuses: [], tuples: [], synchronousTuples: [], programFrames: [], lastProgramStamp: -1, readyFrame: null, framesAfterReady: 0, programsAfter60: null, playBeforeReady: false, recorderErrors: [] }
  const seen = new Set()
  const recordStatus = p => {
    if (!seen.has(p.status)) { seen.add(p.status); rec.statuses.push({ status: p.status, playing: p.playing, compileReady: p.compileReady, warmReady: p.warmReady, at: performance.now() }) }
  }
  // Record even a compiling transition that completes between rendered frames.
  const p = w.__inspection
  let status = p.status
  Object.defineProperty(p, 'status', { configurable: true, enumerable: true,
    get: () => status, set: value => { status = value; recordStatus(p) } })
  rec.resetSeen = () => seen.clear()
  const tick = () => {
    try {
      const p = w.__inspection
      if (p) {
        if (Number.isNaN(p.time)) {
          rec.sawNaNTime = true
          if (!rec.nanFirst) rec.nanFirst = { at: performance.now(), status: p.status, playing: p.playing, playing2: p.playing, time: p.time, sampledTime: p.sampledTime, chapter: p.chapter }
        }
        recordStatus(p)
        if (p.playing && p.status !== 'ready') rec.playBeforeReady = true
        if (p.status === 'ready' && p.active && !rec.readyFrame) rec.readyFrame = { playing: p.playing, compileReady: p.compileReady, warmReady: p.warmReady, programs: w.__threeRenderer?.info.programs?.length ?? null }
        if (p.active && p.sampleStamp > 0 && (rec.tuples.length === 0 || p.sampleStamp !== rec.tuples[rec.tuples.length - 1].sampleStamp)) {
          rec.tuples.push({ sampleStamp: p.sampleStamp, cameraSampleStamp: p.cameraSampleStamp, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, playing: p.playing })
          rec.synchronousTuples.push({ ...w.__g1Rendered.last, playing: p.playing })
        }
        if (rec.readyFrame && rec.framesAfterReady <= 60 && p.sampleStamp !== rec.lastProgramStamp) {
          rec.lastProgramStamp = p.sampleStamp
          rec.framesAfterReady++
          rec.programFrames.push(w.__threeRenderer?.info.programs?.length ?? null)
          if (rec.framesAfterReady === 61) rec.programsAfter60 = w.__threeRenderer?.info.programs?.length ?? null
        }
      }
    } catch (error) { rec.recorderErrors.push(String(error)) }
  }
  w.__g1Rendered.callbacks.add(tick)
  })
}
const resetRecorder = page => page.evaluate(() => {
  const r = window.__g1Recorder
  r.resetSeen()
  r.programFrames.length = 0
  r.synchronousTuples.length = 0; r.lastProgramStamp = -1
  r.statuses.length = 0; r.tuples.length = 0; r.readyFrame = null; r.framesAfterReady = 0; r.programsAfter60 = null; r.playBeforeReady = false; r.sawNaNTime = false; r.nanFirst = null
})
const recorderSnapshot = page => page.evaluate(() => JSON.parse(JSON.stringify(window.__g1Recorder)))

/** Three consecutive end-of-frame camera matrixWorld reads. */
const cameraMatrices = page => page.evaluate(() => new Promise(resolve => {
  const mats = []
  const stamps = []
  const tick = () => {
    const stamp = window.__g1Rendered.last.sampleStamp
    if (!Number.isFinite(stamp) || stamps.includes(stamp)) return
    stamps.push(stamp)
    mats.push(window.__threeCamera ? Array.from(window.__threeCamera.matrixWorld.elements) : null)
    if (mats.length === 3) { window.__g1CameraFrameSamples = stamps; window.__g1Rendered.callbacks.delete(tick); resolve(mats) }
  }
  window.__g1Rendered.callbacks.add(tick)
}))

/** Scene-graph resource census (owned-resource proxy while renderer.info is not exposed). */
const census = page => page.evaluate(() => {
  const scene = window.__threeScene
  if (!scene) return { error: '__threeScene missing' }
  const geometries = new Set(), materials = new Set(), textures = new Set(), meshes = new Set()
  let objects = 0, inspectionRoots = 0
  scene.traverse(object => {
    objects++
    if (object.name === 'ring-inspection-world') inspectionRoots++
    if (object.isMesh) {
      meshes.add(object.uuid)
      if (object.geometry) geometries.add(object.geometry.uuid)
      const mats = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
      for (const material of mats) {
        materials.add(material.uuid)
        for (const value of Object.values(material)) if (value && value.isTexture) textures.add(value.uuid)
      }
    }
  })
  return { objects, inspectionRoots, geometries: geometries.size, materials: materials.size, textures: textures.size, meshes: meshes.size }
})

const sceneContext = (page, options = {}) => page.evaluate(options => {
  const scene = window.__threeScene, cam = window.__threeCamera
  if (!scene || !cam) return { error: 'scene/camera probe missing' }
  const lights = []
  scene.traverse(object => {
    if (!object.isLight) return
    lights.push({ type: object.type, name: object.name || '', visible: object.visible, intensity: object.intensity, color: object.color ? object.color.getHexString() : null })
  })
  lights.sort((a, b) => (a.type + '|' + a.name).localeCompare(b.type + '|' + b.name))
  const background = scene.background, fog = scene.fog
  const context = {
    scrollY,
    fov: cam.fov,
    camera: Array.from(cam.matrixWorld.elements),
    projection: Array.from(cam.projectionMatrix.elements),
    inverseProjection: Array.from(cam.projectionMatrixInverse.elements),
    cameraState: { near: cam.near, far: cam.far, zoom: cam.zoom, aspect: cam.aspect, focus: cam.focus, filmGauge: cam.filmGauge, filmOffset: cam.filmOffset, view: cam.view ? { ...cam.view } : null },
    materialMode: window.__telemetry?.scroll?.materialMode ?? null,
    progress: window.__telemetry?.scroll?.progress ?? null,
    chapter: window.__telemetry?.scroll?.chapter ?? null,
    stage: JSON.parse(JSON.stringify(window.__telemetry?.stage ?? null)),
    background: background && background.isColor ? background.getHexString() : String(background),
    fog: fog ? { type: fog.type, color: fog.color.getHexString(), near: fog.near, far: fog.far } : null,
    environment: scene.environment ? scene.environment.uuid : null,
    environmentIntensity: scene.environmentIntensity,
    lights,
  }
  // With clickEntry, capture and entry happen in one synchronous task: the store's
  // first-frame camera snapshot then equals this reference exactly (no orbit/parallax gap).
  if (options.clickEntry) {
    const button = document.querySelector('.ring-inspection-entry button')
    if (!button) return { error: 'inspection trigger missing' }
    button.click()
  }
  return context
}, options)

/** Atomic per-frame state digest: telemetry + camera in one synchronous read. */
const atomicState = page => page.evaluate(() => {
  const p = window.__inspection, cam = window.__threeCamera
  const r12 = v => Math.round(v * 1e12) / 1e12
  const safe = v => (Number.isFinite(v) ? r12(v) : 'NON_FINITE')
  return {
    time: p.sampledTime,
    phase: p.phase,
    ringAngle: safe(p.ringAngle),
    odKnurlProgress: safe(p.odKnurlProgress),
    aluminiumBlend: safe(p.aluminiumBlend),
    toolClipTime: safe(p.toolClipTime),
    toolVisible: p.toolVisible,
    toolOpacity: safe(p.toolOpacity ?? -1),
    trueSpin: safe(p.trueSpin ?? -1),
    narrativeAlpha: safe(p.narrativeAlpha),
    camera: cam ? Array.from(cam.matrixWorld.elements).map(safe) : null,
  }
})

/** Deterministic restore snapshot: taken inside the same rAF that sets restoreObserved. */
const installRestoreWatcher = async page => {
  await installFrameObserver(page)
  return page.evaluate(() => {
  const w = window
  if (w.__g1RestoreWatcherInstalled) return
  w.__g1RestoreWatcherInstalled = true
  w.__g1RestoreSnap = null
  w.__g1RestorePending = false
  const tick = () => {
    try {
      const p = w.__inspection, scene = w.__threeScene, cam = w.__threeCamera
      if (p && p.active === false && p.restoreObserved === true && w.__g1RestorePending && scene && cam) {
        const lights = []
        scene.traverse(object => {
          if (!object.isLight) return
          lights.push({ type: object.type, name: object.name || '', visible: object.visible, intensity: object.intensity, color: object.color ? object.color.getHexString() : null })
        })
        lights.sort((a, b) => (a.type + '|' + a.name).localeCompare(b.type + '|' + b.name))
        const background = scene.background, fog = scene.fog
        w.__g1RestoreSnap = {
          scrollY,
          fov: cam.fov,
          camera: Array.from(cam.matrixWorld.elements),
          projection: Array.from(cam.projectionMatrix.elements),
          inverseProjection: Array.from(cam.projectionMatrixInverse.elements),
          cameraState: { near: cam.near, far: cam.far, zoom: cam.zoom, aspect: cam.aspect, focus: cam.focus, filmGauge: cam.filmGauge, filmOffset: cam.filmOffset, view: cam.view ? { ...cam.view } : null },
          materialMode: w.__telemetry?.scroll?.materialMode ?? null,
          progress: w.__telemetry?.scroll?.progress ?? null,
          chapter: w.__telemetry?.scroll?.chapter ?? null,
          stage: JSON.parse(JSON.stringify(w.__telemetry?.stage ?? null)),
          background: background && background.isColor ? background.getHexString() : String(background),
          fog: fog ? { type: fog.type, color: fog.color.getHexString(), near: fog.near, far: fog.far } : null,
          environment: scene.environment ? scene.environment.uuid : null,
          environmentIntensity: scene.environmentIntensity,
          lights,
        }
        w.__g1RestorePending = false
      }
    } catch { /* keep watching */ }
  }
  w.__g1Rendered.callbacks.add(tick)
  })
}
const armRestoreWatcher = page => page.evaluate(() => { window.__g1RestoreSnap = null; window.__g1RestorePending = true })
const readRestoreSnap = page => page.evaluate(() => window.__g1RestoreSnap)

function imageStats(buffer) {
  const image = pixels(buffer)
  const { data, channels } = image
  const histogram = new Map()
  let sum = 0, sum2 = 0, n = 0
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
    sum += l; sum2 += l * l; n++
    const key = `${r >> 3},${g >> 3},${b >> 3}`
    histogram.set(key, (histogram.get(key) || 0) + 1)
  }
  const mean = sum / n, variance = Math.max(0, sum2 / n - mean * mean)
  let modal = 0
  for (const count of histogram.values()) modal = Math.max(modal, count)
  return { pixels: n, meanLuma: Math.round(mean * 100) / 100, stdDevLuma: Math.round(Math.sqrt(variance) * 1000) / 1000, distinctBuckets: histogram.size, nonModalFraction: Math.round(((n - modal) / n) * 10000) / 10000 }
}

function compareRestore(result, before, after, label) {
  check(!before.error && !after.error, `${label}: scene probe missing (${before.error || after.error})`)
  for (const field of ['materialMode', 'progress', 'chapter', 'stage']) {
    if (before[field] == null || after[field] == null) {
      noteDefect({ id: `missing-narrative-${field}`, kind: 'missing-probe', gate: 'V3', file: 'src/state/scrollStore.ts', line: 380, detail: `window.__telemetry does not expose required ${field} state in the served build` })
      check(false, `${label}: missing narrative ${field} probe`)
    }
  }
  const maxCamera = Math.max(...before.camera.map((v, i) => Math.abs(v - after.camera[i])))
  check(maxCamera < 1e-6, `${label}: camera matrixWorld delta ${maxCamera} exceeds 1e-6`)
  for (const field of ['projection', 'inverseProjection']) check(before[field].every((v, i) => v === after[field][i]), `${label}: ${field} changed`)
  check(JSON.stringify(before.cameraState) === JSON.stringify(after.cameraState), `${label}: camera state changed`)
  check(before.scrollY === after.scrollY, `${label}: scrollY not restored (${before.scrollY} -> ${after.scrollY})`)
  check(before.fov === after.fov, `${label}: camera fov not restored (${before.fov} -> ${after.fov})`)
  check(before.materialMode === after.materialMode, `${label}: materialMode ${before.materialMode} -> ${after.materialMode}`)
  check(before.progress === after.progress, `${label}: progress ${before.progress} -> ${after.progress}`)
  check(before.chapter === after.chapter, `${label}: chapter ${before.chapter} -> ${after.chapter}`)
  check(JSON.stringify(before.stage) === JSON.stringify(after.stage), `${label}: stage state changed`)
  check(before.background === after.background, `${label}: background ${before.background} -> ${after.background}`)
  check(JSON.stringify(before.fog) === JSON.stringify(after.fog), `${label}: fog changed ${JSON.stringify(before.fog)} -> ${JSON.stringify(after.fog)}`)
  check(before.environment === after.environment, `${label}: environment texture changed`)
  check(before.environmentIntensity === after.environmentIntensity, `${label}: environmentIntensity ${before.environmentIntensity} -> ${after.environmentIntensity}`)
  check(before.lights.length === after.lights.length, `${label}: light census ${before.lights.length} -> ${after.lights.length}`)
  for (let i = 0; i < before.lights.length; i++) {
    const a = before.lights[i], b = after.lights[i]
    check(a.type === b.type && a.name === b.name, `${label}: light order/type changed at ${i}`)
    check(a.visible === b.visible, `${label}: light ${a.type}/${a.name} visibility ${a.visible} -> ${b.visible}`)
    check(a.intensity === b.intensity, `${label}: light ${a.type}/${a.name} intensity ${a.intensity} -> ${b.intensity}`)
    check(a.color === b.color, `${label}: light ${a.type}/${a.name} color ${a.color} -> ${b.color}`)
  }
  return { maxCameraDelta: maxCamera }
}

async function freshPage(result, config = {}) {
  const context = await browser.newContext({
    viewport: config.mobile ? { width: 390, height: 844 } : { width: 1440, height: 960 },
    reducedMotion: config.reduced ? 'reduce' : 'no-preference',
    isMobile: !!config.mobile,
    hasTouch: !!config.mobile,
    deviceScaleFactor: 1,
  })
  if (config.poster) await context.addInitScript(() => { Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }) })
  await context.addInitScript(() => {
    window.__g1Env = { contextLost: 0 }
    document.addEventListener('webglcontextlost', event => { if (event.target?.isConnected) window.__g1Env.contextLost++ }, true)
  })
  if (config.countPrograms) {
    await context.addInitScript(() => {
      const counter = { created: 0 }
      window.__g1Programs = counter
      const proto = window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype
      if (!proto) return
      const original = proto.createProgram
      const wrapped = function (...args) { counter.created++; return original.apply(this, args) }
      wrapped.__g1Wrapped = true
      proto.createProgram = wrapped
    })
  }
  const page = await context.newPage()
  let entered = false
  let navigationArmed = false
  result.navigations = []
  page.on('pageerror', error => result.errors.push(error.stack || error.message))
  page.on('console', message => {
    if (message.type() === 'error' && result.injectingLoadFailure && result.expectedFailedUrls?.includes(message.location().url) && /Failed to load resource: net::ERR_FAILED/.test(message.text())) (result.expectedErrors ||= []).push({ text: message.text(), url: message.location().url })
    else if (message.type() === 'error') result.errors.push(message.text())
    else if (message.type() === 'warning' || /context lost/i.test(message.text())) result.warnings.push(message.text())
  })
  page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) result.requests.push({ url: request.url(), phase: entered ? 'session' : 'page-load' }) })
  page.on('framenavigated', frame => {
    if (navigationArmed && frame === page.mainFrame()) result.navigations.push({ url: frame.url(), at: new Date().toISOString() })
  })
  Object.defineProperties(result, { page: { value: page }, context: { value: context }, markEntered: { value: () => { entered = true } } })
  await page.goto(`${url}/?chapter=1&inspectionProof=1`, { waitUntil: 'domcontentloaded' })
  navigationArmed = true
  const trigger = page.getByRole('button', { name: 'Inspect the finish' })
  await trigger.waitFor({ state: 'visible', timeout: 120000 })
  Object.defineProperty(result, 'trigger', { value: trigger })
  return page
}

const enterDialog = async page => {
  await page.getByRole('button', { name: 'Inspect the finish' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor({ timeout: 30000 })
}
const waitLoaded = page => page.waitForFunction(() => window.__inspection?.loaded && window.__inspectionProof && window.__inspection.status === 'ready', null, { timeout: 60000 })
const returnKey = async page => {
  await page.getByRole('button', { name: /Return/ }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
  await page.waitForTimeout(150)
}
const compareFreshMirror = async (page, before, label) => {
  // CameraRig refreshes its scroll mirror only after its two restore-frame returns.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))))
  const mirror = await sceneContext(page)
  for (const field of ['materialMode', 'progress', 'chapter']) check(mirror[field] === before[field], `${label}: refreshed ${field} ${before[field]} -> ${mirror[field]}`)
  return { materialMode: mirror.materialMode, progress: mirror.progress, chapter: mirror.chapter }
}
const restoreAndCompare = async (page, before, label, escape = false) => {
  await page.getByRole('button', { name: /Return/ }).focus()
  await armRestoreWatcher(page)
  await page.keyboard.press(escape ? 'Escape' : 'Enter')
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
  await page.waitForFunction(() => window.__g1RestoreSnap !== null, null, { timeout: 10000 })
  const after = await readRestoreSnap(page)
  const comparison = compareRestore(null, before, after, label)
  const refreshedMirror = await compareFreshMirror(page, before, label)
  const probe = await read(page)
  check(probe.restoreObserved === true && probe.restoreProjectionError === 0 && probe.restoreStateError === 0, `${label}: restore projection/state probes failed`)
  check(await page.getByRole('button', { name: 'Inspect the finish' }).evaluate(el => document.activeElement === el), `${label}: focus not restored`)
  return { before, after, refreshedMirror, ...comparison }
}

// ---------- Case 1: ordering / readiness (V1) ----------
async function caseOrderingReadiness(mobile = false) {
  const result = { name: `readiness-ordering-${mobile ? 'narrow' : 'desktop'}`, gates: ['V1'], errors: [], warnings: [], requests: [], failures: [], measures: {} }
  report.cases.push(result)
  const page = await freshPage(result, { mobile })
  await installRestoreWatcher(page)
  let toolDelay = true
  await page.route('**/models/knurling-tool.glb', async route => {
    if (toolDelay) await new Promise(resolve => setTimeout(resolve, 1200))
    await route.continue()
  })
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    await installRecorder(page)
    result.measures.rendererProbe = await page.evaluate(() => ({ hasThreeRenderer: !!window.__threeRenderer }))
    if (!result.measures.rendererProbe.hasThreeRenderer) {
      noteDefect({
        id: 'missing-three-renderer-probe',
        kind: 'missing-probe',
        gate: 'V1/V4',
        file: 'src/scene/SceneCanvas.tsx',
        line: '334',
        detail: 'window.__threeRenderer is missing from the served production build; renderer.info program/memory gates cannot be proved.',
      })
    }
    check(result.measures.rendererProbe.hasThreeRenderer, 'missing renderer probe in served production build')
    await resetRecorder(page)
    await enterDialog(page)
    const play = page.getByRole('button', { name: 'Play sequence', exact: true })
    await play.waitFor({ timeout: 10000 })
    const preReady = await read(page)
    check(['loading', 'compiling'].includes(preReady.status), `pre-ready status was ${preReady.status}, expected loading/compiling`)
    check(await play.isDisabled(), 'Play control must be unavailable (disabled) before ready')
    result.measures.preReady = { status: preReady.status, playDisabled: true }
    toolDelay = false
    await waitLoaded(page)
    // Frame-based wait: under load rAF may run at ~30 fps, so a fixed delay cannot
    // guarantee the 61-frame program window.
    await page.waitForFunction(() => window.__g1Recorder && window.__g1Recorder.programsAfter60 !== null, null, { timeout: 30000 })
    const rec = await recorderSnapshot(page)
    result.measures.recorder = { statuses: rec.statuses, readyFrame: rec.readyFrame, programsAfter60: rec.programsAfter60, tupleCount: rec.tuples.length, playBeforeReady: rec.playBeforeReady, recorderErrors: rec.recorderErrors }
    const order = ['idle', 'loading', 'compiling', 'ready', 'error']
    const observed = rec.statuses.map(s => s.status)
    let last = -1
    for (const status of observed) {
      const index = order.indexOf(status)
      check(index >= 0, `unexpected status ${status}`)
      check(index >= last, `status ordering violation in ${JSON.stringify(observed)}`)
      last = index
    }
    check(['loading', 'compiling', 'ready'].every(s => observed.includes(s)), `did not observe loading -> compiling -> ready: ${JSON.stringify(observed)}`)
    check(!rec.playBeforeReady, 'playing was true before status ready')
    check(rec.readyFrame, 'no ready frame captured')
    check(rec.readyFrame.compileReady === true && rec.readyFrame.warmReady === true, 'compile/warm readiness did not precede the ready status')
    check(rec.readyFrame.playing === false, 'playback began on the ready frame before user input')
    check(Number.isInteger(rec.readyFrame.programs) && Number.isInteger(rec.programsAfter60), 'program counter missing at/after ready')
    check(rec.readyFrame.programs === rec.programsAfter60, `programs grew after ready: ${rec.readyFrame.programs} -> ${rec.programsAfter60} over 60 frames`)
    result.measures.programFrames = rec.programFrames
    check(rec.programFrames.every(n => n === rec.readyFrame.programs), 'program count changed within the 60 post-ready rendered frames')
    check(rec.tuples.length >= 10, `only ${rec.tuples.length} frame tuples captured`)
    const mismatched = rec.tuples.filter(t => t.sampleStamp !== t.cameraSampleStamp || t.sampledTime !== t.cameraSampleTime)
    check(mismatched.length === 0, `${mismatched.length}/${rec.tuples.length} frames had sample/camera time or stamp mismatch; first ${JSON.stringify(mismatched[0])}`)
    result.measures.frameTuples = { total: rec.tuples.length, matched: rec.tuples.length - mismatched.length }
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    await page.waitForTimeout(1400)
    const probePaused = await read(page)
    check(probePaused.playing === false && probePaused.active === true, 'paused state not held')
    check(probePaused.cameraOwner === 'CameraRig', `cameraOwner ${probePaused.cameraOwner}`)
    const mats = await cameraMatrices(page)
    check(mats.every(m => Array.isArray(m)), 'camera probe missing for stability capture')
    const stable = mats[0].every((v, i) => mats.every(m => m[i] === v))
    result.measures.pausedCamera = { stable, matrices: mats, stamps: await page.evaluate(() => window.__g1CameraFrameSamples) }
    check(stable, `paused camera matrixWorld moved across 3 frames: ${JSON.stringify(mats.map(m => m.slice(0, 3)))}`)
    const recFinal = await recorderSnapshot(page)
    const playingFrames = recFinal.tuples.filter(t => t.playing)
    const playingMismatch = playingFrames.filter(t => t.sampleStamp !== t.cameraSampleStamp || t.sampledTime !== t.cameraSampleTime)
    result.measures.playingFrameSamples = playingFrames
    result.measures.synchronousPlayingSamples = recFinal.synchronousTuples.filter(t => t.playing)
    check(playingFrames.length >= 5, `only ${playingFrames.length} playing frames sampled`)
    check(playingMismatch.length === 0, `${playingMismatch.length} playing frame ordering mismatches`)
    check(playingFrames.every((t, i) => Number.isFinite(t.sampleStamp) && Number.isFinite(t.sampledTime) && (i === 0 || t.sampleStamp > playingFrames[i - 1].sampleStamp)), 'playing frame stamps are not finite and advancing')
    check(recFinal.recorderErrors.length === 0, `recorder internal errors: ${JSON.stringify(recFinal.recorderErrors)}`)
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  return result
}

// ---------- Case 2: pause/hidden + seek/replay determinism + endpoint (V2) ----------
async function casePauseHiddenSeek(mobile = false) {
  const result = { name: `pause-hidden-seek-${mobile ? 'narrow' : 'desktop'}`, gates: ['V2'], errors: [], warnings: [], requests: [], failures: [], measures: {} }
  report.cases.push(result)
  const page = await freshPage(result, { mobile })
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    await installRecorder(page)
    await resetRecorder(page)
    await enterDialog(page)
    await waitLoaded(page)
    await seek(page, 0, 2)
    // Manual pause preserved across hidden/visible.
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForTimeout(400)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    const beforeHide = await read(page)
    check(beforeHide.playing === false, 'not paused before hide test')
    await setHidden(page, true)
    await page.waitForTimeout(2000)
    await setHidden(page, false)
    await page.waitForTimeout(300)
    const afterShow = await read(page)
    result.measures.hiddenPaused = { timeBefore: beforeHide.time, timeAfter: afterShow.time, playing: afterShow.playing, suspend: afterShow.suspend }
    check(afterShow.time === beforeHide.time, `hidden preserved time failed: ${beforeHide.time} -> ${afterShow.time}`)
    check(afterShow.playing === false, 'manual pause was cleared by hide/show')
    check(afterShow.suspend === 'none', `suspend not restored: ${afterShow.suspend}`)
    // Playing story hidden 3 s: advance must stay below 0.1 s.
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForTimeout(300)
    const playingBefore = await read(page)
    check(playingBefore.playing === true, 'story did not resume before hidden-play test')
    await setHidden(page, true)
    await page.waitForTimeout(3000)
    // Measure the hidden-period contribution while still hidden: post-visible time legitimately resumes.
    const duringHidden = await read(page)
    await setHidden(page, false)
    await page.waitForTimeout(250)
    const playingAfter = await read(page)
    const hiddenAdvance = duringHidden.time - playingBefore.time
    result.measures.hiddenPlaying = { timeBefore: playingBefore.time, timeWhileHidden: duringHidden.time, timeAfterVisible: playingAfter.time, hiddenAdvance, playing: playingAfter.playing, suspend: playingAfter.suspend }
    check(hiddenAdvance >= 0 && hiddenAdvance < 0.1, `playing-hidden advance ${hiddenAdvance} not below 0.1 s`)
    check(playingAfter.suspend === 'none', `suspend stuck after visible: ${playingAfter.suspend}`)
    // Direct-seek determinism at authored landmarks, repeated in reverse order and via the DOM seek control.
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    const times = [0, 1.5, timeline.CONTACT_START + 0.1, (timeline.TRAVERSE_START + timeline.TRAVERSE_END) / 2, timeline.TOOL_FADE_END, (timeline.BLACK_FINISH_START + timeline.RETURN_START) / 2, timeline.INSPECTION_DURATION - 0.1, timeline.INSPECTION_DURATION]
    const digests = new Map()
    for (const time of times) {
      await seek(page, time)
      digests.set(time, await atomicState(page))
    }
    for (const time of [...times].reverse()) {
      await seek(page, time)
      const repeat = await atomicState(page)
      check(JSON.stringify(repeat) === JSON.stringify(digests.get(time)), `direct seek to ${time} not deterministic across seek orders`)
    }
    // DOM slider (store seekInspection path) must land on the same state.
    const slider = page.locator('#inspection-seek')
    for (const time of [timeline.TRAVERSE_START + 0.5, timeline.BLACK_FINISH_START]) {
      await slider.evaluate((el, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value))
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      }, time)
      await page.waitForTimeout(300)
      const viaSlider = await atomicState(page)
      await seek(page, time)
      const viaProof = await atomicState(page)
      check(JSON.stringify(viaSlider) === JSON.stringify(viaProof), `DOM slider seek to ${time} differs from direct seek`)
      const probe = await read(page)
      check(probe.playing === false, `slider seek at ${time} did not pause`)
    }
    // Continuous playback vs direct seek at the captured instant.
    await seek(page, 2)
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForFunction(() => { const t = window.__inspection.time; return t > 4.6 && t < 9 }, null, { timeout: 30000 })
    const live = await atomicState(page)
    await seek(page, live.time)
    const pausedAtLive = await atomicState(page)
    result.measures.continuousVsSeek = { liveTime: live.time, live, seek: pausedAtLive, equal: JSON.stringify(live) === JSON.stringify(pausedAtLive) }
    check(JSON.stringify(live) === JSON.stringify(pausedAtLive), `continuous playback state at ${live.time} differs from direct seek digest`)
    // Endpoint ownership: seek to duration holds active with Return available, no auto-exit.
    await seek(page, timeline.INSPECTION_DURATION)
    await page.waitForTimeout(400)
    let endpoint = await read(page)
    check(endpoint.active === true, 'seek to duration ended the session (ownership must hold until Return)')
    check(endpoint.playing === false, 'endpoint must hold paused')
    check(await page.getByRole('button', { name: /Return/ }).isEnabled(), 'Return unavailable at endpoint')
    await page.waitForTimeout(1200)
    endpoint = await read(page)
    check(endpoint.active === true, 'auto-exit occurred at endpoint')
    check(Math.abs(endpoint.ringAngle - timeline.FINAL_ANGLE) < 1e-9, `endpoint ringAngle ${endpoint.ringAngle} != FINAL_ANGLE ${timeline.FINAL_ANGLE}`)
    result.measures.endpoint = { active: endpoint.active, time: endpoint.time, ringAngle: endpoint.ringAngle }
    // Replay resets deterministically.
    const replaying = await page.getByRole('button', { name: 'Replay', exact: true }).evaluate(button => {
      button.click()
      return { time: window.__inspection.time, playing: window.__inspection.playing }
    })
    result.measures.replay = { time: replaying.time, playing: replaying.playing }
    check(replaying.time === 0, `replay did not synchronously reset to zero (time ${replaying.time})`)
    check(replaying.playing === true, 'replay did not start playback')
    await page.waitForFunction(() => window.__inspection.time > 1.5, null, { timeout: 15000 })
    const liveReplay = await atomicState(page)
    await seek(page, liveReplay.time)
    const replaySeek = await atomicState(page)
    result.measures.replayVsSeek = { time: liveReplay.time, equal: JSON.stringify(liveReplay) === JSON.stringify(replaySeek) }
    check(JSON.stringify(liveReplay) === JSON.stringify(replaySeek), `replay state at ${liveReplay.time} differs from direct seek digest`)
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
    const rec = await recorderSnapshot(page)
    result.measures.recorder = { sawNaNTime: rec.sawNaNTime === true, nanFirst: rec.nanFirst ?? null }
    check(rec.sawNaNTime !== true, `inspection.time became NaN during the case (first: ${JSON.stringify(rec.nanFirst)})`)
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  return result
}

// ---------- Case 3: restore matrix, stale completion, error/retry (V3 desktop) ----------
async function caseRestoreDesktop(mobile = false) {
  const result = { name: `restore-${mobile ? 'narrow' : 'desktop'}`, gates: ['V3'], errors: [], warnings: [], requests: [], failures: [], measures: {}, subs: [] }
  report.cases.push(result)
  const page = await freshPage(result, { mobile })
  await installRestoreWatcher(page)
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    for (const [mode, exit] of [['blueprint', 'Return'], ['blueprint', 'Escape'], ['exploded', 'Return'], ['exploded', 'Escape']]) {
      const sub = { name: `entry-${mode}-${exit}` }
      result.subs.push(sub)
      await page.getByRole('button', { name: mode === 'blueprint' ? /BLUEPRINT WIREFRAME/ : /EXPLODED ASSEMBLY/ }).click()
      await page.waitForTimeout(500)
      const settled = await waitForCameraSettled(page)
      sub.cameraSettled = settled
      check(settled.settled, `narrative camera did not settle before ${sub.name} entry`)
      const before = await sceneContext(page, { clickEntry: true })
      check(before.materialMode === mode, `requested ${mode} entry did not take effect: ${before.materialMode}`)
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await waitLoaded(page)
      await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
      await page.waitForTimeout(1500)
      // Activate Return by keyboard: the pointer stays parked, so post-restore goal
      // parallax cannot masquerade as restore error.
      await page.getByRole('button', { name: /Return/ }).focus()
      await armRestoreWatcher(page)
      await page.keyboard.press(exit === 'Escape' ? 'Escape' : 'Enter')
      await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
      // Deterministic frame-2 snapshot (the rAF that sets restoreObserved), then a
      // settled read for the store-mirrored telemetry fields only.
      await page.waitForFunction(() => window.__g1RestoreSnap !== null, null, { timeout: 10000 })
      const after = await readRestoreSnap(page)
      await page.waitForFunction(() => Boolean(window.__threeScene && window.__threeCamera) && window.__telemetry?.scroll?.materialMode !== undefined, null, { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(300)
      const settledMirror = await sceneContext(page)
      sub.before = before; sub.after = after; sub.settledMirror = settledMirror
      sub.refreshedMirror = await compareFreshMirror(page, before, sub.name)
      sub.compare = compareRestore(result, before, after, sub.name)
      const probe = await read(page)
      sub.restore = { restoredPoseError: probe.restoredPoseError, restoreProjectionError: probe.restoreProjectionError, restoreStateError: probe.restoreStateError, restoreObserved: probe.restoreObserved, disposed: probe.disposed, loaded: probe.loaded }
      check(probe.restoredPoseError < 1e-7, `${sub.name}: restoredPoseError ${probe.restoredPoseError}`)
      check(probe.restoreProjectionError < 1e-9 && probe.restoreStateError < 1e-9, `${sub.name}: projection/state restore error ${probe.restoreProjectionError}/${probe.restoreStateError}`)
      check(probe.restoreObserved === true && probe.disposed > 0 && probe.loaded === false, `${sub.name}: restore observation flags wrong`)
      const trigger = page.getByRole('button', { name: 'Inspect the finish' })
      check(await trigger.evaluate(button => document.activeElement === button), `${sub.name}: trigger focus was not restored`)
    }
    // Delayed-load Return: stale completion must not corrupt the new session.
    {
      const sub = { name: 'delayed-load-stale-completion' }
      result.subs.push(sub)
      let hold = true
      const held = []
      const routeTool = async route => { if (hold) { held.push(route); return } await route.continue() }
      await page.route('**/models/knurling-tool.glb', routeTool)
      const beforeLoading = await sceneContext(page, { clickEntry: true })
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await page.waitForRequest('**/models/knurling-tool.glb', { timeout: 10000 }).catch(() => {})
      const loading = await read(page)
      check(loading.status === 'loading' && loading.loaded === false, 'route-hold did not keep session A in loading')
      sub.loadingRestore = await restoreAndCompare(page, beforeLoading, sub.name)
      hold = false
      await page.getByRole('button', { name: 'Inspect the finish' }).click()
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      const epochB = (await read(page)).session
      await waitLoaded(page)
      check(held.length > 0, 'delayed-load scenario did not actually intercept a tool request')
      await page.waitForTimeout(1500)
      const cameraBefore = await page.evaluate(() => window.__threeCamera.matrixWorld.elements.slice())
      const toolBytes = await fs.readFile(path.join(rootDir, 'public/models/knurling-tool.glb'))
      sub.releasedResponses = []
      for (const route of held) {
        try { await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: toolBytes }); sub.releasedResponses.push('fulfilled') }
        catch (error) { sub.releasedResponses.push(`already canceled: ${error.message}`) }
      }
      await page.waitForTimeout(400)
      const probe = await read(page)
      const sceneNow = await census(page)
      const cameraAfter = await page.evaluate(() => window.__threeCamera.matrixWorld.elements.slice())
      const cameraDelta = Math.max(...cameraBefore.map((v, i) => Math.abs(v - cameraAfter[i])))
      sub.stale = { heldRequests: held.length, epochB, session: probe.session, status: probe.status, inspectionRoots: sceneNow.inspectionRoots, cameraDelta }
      check(probe.session === epochB, `telemetry session ${probe.session} != re-entry epoch ${epochB}`)
      check(probe.status === 'ready' && probe.loaded === true, `stale completion corrupted session: status ${probe.status}`)
      check(sceneNow.inspectionRoots === 1, `${sceneNow.inspectionRoots} inspection roots attached (expected exactly 1)`)
      check(cameraDelta === 0, `camera moved ${cameraDelta} when stale completion resolved`)
      await page.keyboard.press('Escape')
      await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
      await page.unroute('**/models/knurling-tool.glb', routeTool)
    }
    // Successful stale completion after bytes arrive: abort cannot prevent this deferred delivery.
    {
      const sub = { name: 'late-successful-byte-completion' }
      result.subs.push(sub)
      await page.evaluate(() => {
        const original = Response.prototype.arrayBuffer
        window.__g1ByteGate = { armed: true, pending: false, released: false }
        Response.prototype.arrayBuffer = async function (...args) {
          const data = await original.apply(this, args)
          const gate = window.__g1ByteGate
          if (gate.armed && this.url.includes('knurling-tool.glb')) {
            gate.armed = false; gate.pending = true; gate.bytes = data.byteLength
            await new Promise(resolve => { gate.release = () => { gate.released = true; resolve() } })
          }
          return data
        }
      })
      const before = await sceneContext(page, { clickEntry: true })
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => window.__g1ByteGate.pending, null, { timeout: 20000 })
      const epochA = (await read(page)).session
      sub.restoreA = await restoreAndCompare(page, before, sub.name)
      await enterDialog(page); await waitLoaded(page); await seek(page, 0)
      const epochB = (await read(page)).session
      const beforeRelease = await sceneContext(page), censusBefore = await census(page)
      await page.evaluate(() => window.__g1ByteGate.release())
      await page.waitForTimeout(500)
      const afterRelease = await sceneContext(page), censusAfter = await census(page), probe = await read(page)
      sub.stale = { epochA, epochB, gate: await page.evaluate(() => ({ pending: window.__g1ByteGate.pending, released: window.__g1ByteGate.released, bytes: window.__g1ByteGate.bytes })), censusBefore, censusAfter, cameraDelta: Math.max(...beforeRelease.camera.map((v, i) => Math.abs(v - afterRelease.camera[i]))), session: probe.session, status: probe.status }
      check(sub.stale.gate.released && sub.stale.gate.bytes > 0, 'late successful response was not released')
      check(epochB > epochA && probe.session === epochB && probe.status === 'ready', 'late successful completion corrupted the newer epoch')
      check(censusAfter.inspectionRoots === 1 && JSON.stringify(censusBefore) === JSON.stringify(censusAfter), 'late completion attached duplicate resources')
      check(sub.stale.cameraDelta === 0, `late completion moved camera ${sub.stale.cameraDelta}`)
      await returnKey(page)
    }
    // Error/retry: aborted (invalid) tool response -> error status; Return works; Try again recovers.
    {
      const sub = { name: 'error-retry' }
      result.subs.push(sub)
      result.expectedFailedUrls = []
      const failTool = route => { result.expectedFailedUrls.push(route.request().url()); return route.abort('failed') }
      result.injectingLoadFailure = true
      await page.route('**/models/knurling-tool.glb', failTool)
      const beforeError = await sceneContext(page, { clickEntry: true })
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => window.__inspection?.status === 'error', null, { timeout: 120000 })
      const errored = await read(page)
      sub.firstError = { status: errored.status, error: errored.error, playing: errored.playing, suspend: errored.suspend }
      sub.firstError.message = await page.locator('p[role="status"]').innerText()
      check(errored.status === 'error' && sub.firstError.message.includes('could not load'), 'loading failure did not surface error status/UI')
      check(errored.playing === false && errored.suspend === 'error', 'error state kept playing or wrong suspend')
      const tryAgain = page.getByRole('button', { name: 'Try again', exact: true })
      check(await tryAgain.isEnabled(), 'Try again not offered in error state')
      sub.errorRestore = await restoreAndCompare(page, beforeError, 'error-Return')
      check((await read(page)).active === false, 'Return failed from error state')
      const beforeRetry = await sceneContext(page, { clickEntry: true })
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => window.__inspection?.status === 'error', null, { timeout: 120000 })
      await page.unroute('**/models/knurling-tool.glb', failTool)
      await page.getByRole('button', { name: 'Try again', exact: true }).click()
      await waitLoaded(page)
      result.injectingLoadFailure = false
      const recovered = await read(page)
      sub.recovery = { status: recovered.status, session: recovered.session }
      check(recovered.status === 'ready' && recovered.loaded === true, 'Try again did not recover the study')
      sub.retryRestore = await restoreAndCompare(page, beforeRetry, 'retry-Return')
    }
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  return result
}

// ---------- Case 4: narrow entry + Escape restore (V3) ----------
async function caseRestoreNarrow() {
  const result = { name: 'restore-narrow-escape', gates: ['V3'], errors: [], warnings: [], requests: [], failures: [], measures: {} }
  report.cases.push(result)
  const page = await freshPage(result, { mobile: true })
  await installRestoreWatcher(page)
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    const settled = await waitForCameraSettled(page)
    result.measures.cameraSettled = settled
    check(settled.settled, 'narrative camera did not settle before narrow entry')
    const before = await sceneContext(page, { clickEntry: true })
    await page.getByRole('dialog').waitFor({ timeout: 30000 })
    await waitLoaded(page)
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForTimeout(1000)
    await armRestoreWatcher(page)
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
    await page.waitForFunction(() => window.__g1RestoreSnap !== null, null, { timeout: 10000 })
    const after = await readRestoreSnap(page)
    await page.waitForFunction(() => Boolean(window.__threeScene && window.__threeCamera) && window.__telemetry?.scroll?.materialMode !== undefined, null, { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(300)
    const settledMirror = await sceneContext(page)
    after.materialMode = settledMirror.materialMode
    after.progress = settledMirror.progress
    after.chapter = settledMirror.chapter
    result.measures.compare = compareRestore(result, before, after, 'narrow-escape')
    const probe = await read(page)
    result.measures.restore = { restoredPoseError: probe.restoredPoseError, restoreObserved: probe.restoreObserved }
    check(probe.restoredPoseError < 1e-7, 'narrow escape restoredPoseError too high')
    const trigger = page.getByRole('button', { name: 'Inspect the finish' })
    check(await trigger.evaluate(button => document.activeElement === button), 'narrow escape did not restore trigger focus')
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  return result
}

// ---------- Case 5: lifecycle census, reduced/poster, context loss (V4) ----------
async function caseCensusLifecycle(mobile = false) {
  const result = { name: `census-lifecycle-${mobile ? 'narrow' : 'desktop'}`, gates: ['V4'], errors: [], warnings: [], requests: [], failures: [], measures: { cycles: [] } }
  report.cases.push(result)
  const subResults = []
  const page = await freshPage(result, { mobile })
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    // Warm both the inspection and restored narrative shader variants before the census.
    result.measures.warmups = []
    for (let warmup = 0; warmup < 2; warmup++) {
      await page.getByRole('button', { name: 'Inspect the finish' }).click()
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await waitLoaded(page)
      await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
      await page.waitForTimeout(1000)
      await returnKey(page)
      await page.waitForTimeout(500)
      await waitRendererSettled(page)
      result.measures.warmups.push(await rendererInfo(page))
    }
    result.markEntered()
    result.measures.warmCensus = await waitRendererSettled(page)
    const baseline = await census(page)
    const gpuBaseline = await rendererInfo(page)
    check(gpuBaseline.hasRenderer, 'missing renderer.info census probe')
    let disposedBefore = (await read(page)).disposed
    for (let cycle = 1; cycle <= 5; cycle++) {
      const before = await census(page)
      await page.getByRole('button', { name: 'Inspect the finish' }).click()
      await page.getByRole('dialog').waitFor({ timeout: 30000 })
      await waitLoaded(page)
      await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
      await page.waitForTimeout(1000)
      const during = await census(page)
      const gpuDuring = await rendererInfo(page)
      const ownedTelemetry = await read(page)
      await page.getByRole('button', { name: /Return/ }).click()
      await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
      await page.waitForTimeout(500)
      const after = await census(page)
      const gpuAfter = await rendererInfo(page)
      for (const sample of [before, during, after, gpuDuring, gpuAfter]) for (const [key, value] of Object.entries(sample)) {
        if (key === 'hasRenderer') continue
        check(Number.isInteger(value) && value >= 0, `cycle ${cycle}: invalid census ${key}=${value}`)
      }
      const probe = await read(page)
      result.measures.cycles.push({ cycle, before, during, after, gpuDuring, gpuAfter, ownedTelemetry: { ringMeshes: ownedTelemetry.ringMeshes, toolMeshes: ownedTelemetry.toolMeshes, disposed: ownedTelemetry.disposed }, disposed: probe.disposed })
      check(during.inspectionRoots === 1, `cycle ${cycle}: ${during.inspectionRoots} inspection roots during session`)
      check(after.inspectionRoots === 0, `cycle ${cycle}: inspection root survived Return`)
      check(probe.disposed === disposedBefore + 1, `cycle ${cycle}: disposed counter ${disposedBefore} -> ${probe.disposed} (expected +1)`)
      disposedBefore = probe.disposed
    }
    const dimensions = ['objects', 'geometries', 'materials', 'textures', 'meshes']
    result.measures.trend = {}
    for (const dimension of dimensions) {
      const during = result.measures.cycles.map(c => c.during[dimension])
      const after = result.measures.cycles.map(c => c.after[dimension])
      const strictlyIncreasing = values => values.every((v, i) => i === 0 || v >= values[i - 1]) && values.at(-1) > values[0]
      result.measures.trend[dimension] = { during, after }
      check(!strictlyIncreasing(during), `monotonic ${dimension} growth across sessions: ${JSON.stringify(during)}`)
      check(!strictlyIncreasing(after), `monotonic ${dimension} growth across cycles: ${JSON.stringify(after)}`)
      check(after[after.length - 1] <= baseline[dimension], `net ${dimension} growth after 5 cycles: baseline ${baseline[dimension]} -> ${after[after.length - 1]}`)
    }
    result.measures.gpuBaseline = gpuBaseline
    for (const dimension of ['geometries', 'textures', 'programs']) {
      const during = result.measures.cycles.map(c => c.gpuDuring[dimension])
      const after = result.measures.cycles.map(c => c.gpuAfter[dimension])
      const growing = values => values.every((v, i) => i === 0 || v >= values[i - 1]) && values.at(-1) > values[0]
      result.measures.trend[`renderer-${dimension}`] = { during, after }
      check(!growing(during) && !growing(after), `renderer ${dimension} monotonically grew: ${JSON.stringify({ during, after })}`)
      check(after.at(-1) <= gpuBaseline[dimension], `renderer ${dimension} net growth ${gpuBaseline[dimension]} -> ${after.at(-1)}`)
    }
    const sessionToolRequests = result.requests.filter(r => r.phase === 'session' && r.url.includes('knurling-tool'))
    check(sessionToolRequests.length === 5, `expected 5 session tool fetches (one per cycle), saw ${sessionToolRequests.length}`)
    result.measures.sessionToolRequests = sessionToolRequests.length
    // Context loss mid-play: exit once, dialog closes, no console errors.
    await page.getByRole('button', { name: 'Inspect the finish' }).click()
    await page.getByRole('dialog').waitFor({ timeout: 30000 })
    await waitLoaded(page)
    await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
    await page.waitForTimeout(600)
    const beforeLoss = await read(page)
    await loseContext(page)
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 20000 })
    await page.waitForTimeout(1000)
    const afterLoss = await read(page)
    check(afterLoss.disposed === beforeLoss.disposed + 1, `context loss disposal must happen once: ${beforeLoss.disposed} -> ${afterLoss.disposed}`)
    check(await page.evaluate(() => window.__g1Env.contextLost) === 1, 'expected exactly one live context loss')
    result.measures.contextLoss = { active: afterLoss.active, status: afterLoss.status, dialogCount: await page.getByRole('dialog').count(), bodyOpen: await page.evaluate(() => document.body.classList.contains('ring-inspection-open')), warnings: result.warnings.slice() }
    check(afterLoss.active === false, 'context loss did not exit the session')
    check(await page.getByRole('dialog').count() === 0, 'dialog survived context loss')
    check(await page.evaluate(() => !document.body.classList.contains('ring-inspection-open') && !document.getElementById('root').inert), 'quality teardown left narrative chrome hidden/inert')
    result.measures.contextLoss.disposedDelta = afterLoss.disposed - beforeLoss.disposed
    await page.waitForTimeout(500)
    check((await read(page)).disposed === afterLoss.disposed, 'context loss exited/disposed twice')
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  // Reduced motion: static study, no inspection fetches.
  {
    const sub = { name: `reduced-motion-static-${mobile ? 'narrow' : 'desktop'}`, gates: ['V4'], errors: [], warnings: [], requests: [], failures: [], measures: {} }
    report.cases.push(sub)
    subResults.push(sub)
    const reducedPage = await freshPage(sub, { reduced: true, mobile })
    try {
      await reducedPage.waitForTimeout(1500)
      sub.markEntered()
      await enterDialog(reducedPage)
      check(await reducedPage.locator('.ring-static').count() === 1, 'static finish equivalent missing in reduced motion')
      await reducedPage.waitForTimeout(800)
      const probe = await read(reducedPage)
      sub.measures.probe = { time: probe.time, ringAngle: probe.ringAngle, status: probe.status, phase: probe.phase }
      check(probe.status === 'ready', `reduced-motion static study status ${probe.status}`)
      check(probe.time === 0 && probe.ringAngle === 0, 'static inspection advanced the rapid spin')
      // Station CAD (Default/msp-enclosure/m249) is narrative page-load work; the static
      // inspection must never fetch its own tool asset.
      sub.measures.glbRequests = sub.requests.slice()
      if (sub.requests.length) noteDefect({ id: 'reduced-motion-cad-fetches', kind: 'app', gate: 'V4', file: 'src/App.tsx', line: 37, detail: 'canvasActive only checks poster tier, so reduced-motion production pages mount SceneCanvas and fetch narrative CAD. V4 requires reduced/poster states to avoid CAD/tool fetches. Exact request URLs are retained in reduced-motion case evidence.' })
      check(sub.requests.length === 0, `reduced-motion page fetched ${sub.requests.length} CAD/tool GLBs: ${JSON.stringify(sub.requests)}`)
      await returnKey(reducedPage)
      check(sub.errors.length === 0, `${sub.errors.length} console/page errors; first: ${sub.errors[0]}`)
      sub.pass = true
    } catch (error) {
      sub.failures.push(error.stack || String(error))
      report.failures.push(`${sub.name}: ${error}`)
      sub.pass = false
    } finally {
      await sub.context.close()
    }
  }
  // Poster tier (WebGL2 undefined): no canvas, no CAD/tool fetches at all.
  {
    const sub = { name: `poster-static-${mobile ? 'narrow' : 'desktop'}`, gates: ['V4'], errors: [], warnings: [], requests: [], failures: [], measures: {} }
    report.cases.push(sub)
    subResults.push(sub)
    const posterPage = await freshPage(sub, { poster: true, mobile })
    try {
      await posterPage.waitForTimeout(1500)
      // __telemetry.performance.tier is only written inside the live canvas, so observe the
      // poster tier through its authoritative DOM/env effects instead.
      sub.measures.posterObservables = await posterPage.evaluate(() => ({
        webgl2Undefined: typeof window.WebGL2RenderingContext === 'undefined',
        glCanvasCount: document.querySelectorAll('canvas[data-engine]').length,
        threeScene: window.__threeScene ?? null,
        telemetryTierField: window.__telemetry?.performance?.tier ?? null,
      }))
      const o = sub.measures.posterObservables
      check(o.webgl2Undefined, 'WebGL2RenderingContext override did not apply')
      check(o.glCanvasCount === 0, `${o.glCanvasCount} WebGL canvases mounted in poster tier`)
      check(!o.threeScene, '__threeScene present in poster tier')
      sub.markEntered()
      await enterDialog(posterPage)
      check(await posterPage.locator('.ring-static').count() === 1, 'static finish equivalent missing in poster tier')
      await posterPage.waitForTimeout(800)
      const probe = await read(posterPage)
      sub.measures.probe = { time: probe.time, ringAngle: probe.ringAngle, status: probe.status }
      check(probe.time === 0, 'poster static inspection advanced time')
      check(sub.requests.length === 0, `poster page fetched GLB assets: ${JSON.stringify(sub.requests)}`)
      await returnKey(posterPage)
      check(sub.errors.length === 0, `${sub.errors.length} console/page errors; first: ${sub.errors[0]}`)
      sub.pass = true
    } catch (error) {
      sub.failures.push(error.stack || String(error))
      report.failures.push(`${sub.name}: ${error}`)
      sub.pass = false
    } finally {
      await sub.context.close()
    }
  }
  return [result, ...subResults]
}

// ---------- Case 6: ring rendering evidence (V5) ----------
async function caseRingRendering(mobile = false) {
  const result = { name: `ring-rendering-${mobile ? 'narrow' : 'desktop'}`, gates: ['V5'], errors: [], warnings: [], requests: [], failures: [], measures: { frames: [], shots: [] } }
  report.cases.push(result)
  const page = await freshPage(result, { mobile })
  try {
    await page.waitForFunction(() => window.__rig && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.waitForTimeout(800)
    await enterDialog(page)
    await waitLoaded(page)
    await installFrameObserver(page)
    await seek(page, 0, 2)
    // Contact window from authored timeline exports.
    const contactTimes = [timeline.CONTACT_START + 0.05, (timeline.TRAVERSE_START + timeline.TRAVERSE_END) / 2, timeline.CONTACT_END - 0.05]
    for (const time of contactTimes) {
      const frame = await seek(page, time)
      result.measures.frames.push({ window: 'contact', time: frame.time, rollerClearance: frame.rollerClearance, rollerAxial: frame.rollerAxial, toolVisible: frame.toolVisible, toolOpacity: frame.toolOpacity, maskSamples: frame.maskSamples })
      check(frame.toolVisible === true, `tool absent during authored contact at ${time}`)
      check(frame.rollerClearance.every(gap => Math.abs(gap) < 2e-5), `actual roller radial contact failed at ${time}: ${JSON.stringify(frame.rollerClearance)}`)
      check(frame.wheelAxis.every(axis => Math.abs(axis[2]) > 0.9999), `roller spin axis not on ring Z at ${time}: ${JSON.stringify(frame.wheelAxis)}`)
    }
    // OD-only relief: bore and shoulder stay smooth while the OD band forms.
    for (const time of [timeline.TRAVERSE_START + timeline.COVERAGE_TIME + 0.05, timeline.CONTACT_END - 0.05, timeline.FORMING_END + 0.05]) {
      const frame = await seek(page, time)
      result.measures.frames.push({ window: 'od-relief', time: frame.time, maskSamples: frame.maskSamples, odKnurlProgress: frame.odKnurlProgress })
      check(frame.maskSamples.bore === 0 && frame.maskSamples.shoulder === 0, `relief spilled onto bore/shoulders at ${time}: ${JSON.stringify(frame.maskSamples)}`)
      check(frame.maskSamples.odStart > 0, `OD relief absent at ${time}: ${JSON.stringify(frame.maskSamples)}`)
      if (time >= timeline.FORMING_END) check(frame.maskSamples.odEnd > 0, `OD band incomplete after forming end at ${time}: ${JSON.stringify(frame.maskSamples)}`)
    }
    // Withdrawal before fade, then tool invisible.
    const atFadeStart = await seek(page, timeline.TOOL_FADE_START)
    result.measures.frames.push({ window: 'withdrawal', time: atFadeStart.time, rollerClearance: atFadeStart.rollerClearance, toolOpacity: atFadeStart.toolOpacity, minClearanceAuthored: timeline.TOOL_FADE_MIN_CLEARANCE })
    check(atFadeStart.rollerClearance.every(gap => gap >= timeline.TOOL_FADE_MIN_CLEARANCE), `rollers had not cleared the OD when the fade begins at ${timeline.TOOL_FADE_START}: ${JSON.stringify(atFadeStart.rollerClearance)}`)
    const midFade = await seek(page, (timeline.TOOL_FADE_START + timeline.TOOL_FADE_END) / 2)
    check(midFade.toolOpacity > 0 && midFade.toolOpacity < 1, `tool not fading between authored boundaries: opacity ${midFade.toolOpacity}`)
    const fadeDone = await seek(page, timeline.TOOL_FADE_END)
    check(fadeDone.toolVisible === false, `tool visible after ${timeline.TOOL_FADE_END}`)
    // Finished black hold and end hold.
    for (const time of [timeline.BLACK_FINISH_START + 0.05, (timeline.BLACK_FINISH_START + timeline.RETURN_START) / 2]) {
      const frame = await seek(page, time)
      result.measures.frames.push({ window: 'black-hold', time: frame.time, aluminiumBlend: frame.aluminiumBlend, toolVisible: frame.toolVisible })
      check(frame.aluminiumBlend === 0, `finished black hold showed aluminium at ${time}: ${frame.aluminiumBlend}`)
      check(frame.toolVisible === false, `tool visible during black hold at ${time}`)
    }
    const end = await seek(page, timeline.INSPECTION_DURATION)
    result.measures.frames.push({ window: 'end-hold', time: end.time, ringAngle: end.ringAngle, trueSpin: end.trueSpin, active: end.active, narrativeAlpha: end.narrativeAlpha })
    check(end.active === true && end.playing === false, 'end hold lost ownership or kept playing')
    check(Math.abs(end.ringAngle - timeline.FINAL_ANGLE) < 1e-9, `end ringAngle ${end.ringAngle} != ${timeline.FINAL_ANGLE}`)
    check(end.trueSpin === 0, `ring still spinning at end hold: ${end.trueSpin}`)
    check(end.narrativeAlpha === 1, `narrative not fully returned at end: ${end.narrativeAlpha}`)
    // Nonblank rendered evidence at contact, black hold, and end.
    for (const [label, time] of [['contact', (timeline.TRAVERSE_START + timeline.TRAVERSE_END) / 2], ['black-finish', (timeline.BLACK_FINISH_START + timeline.RETURN_START) / 2], ['end-hold', timeline.INSPECTION_DURATION]]) {
      await seek(page, time)
      const filename = path.join(out, `v5-${mobile ? 'narrow' : 'desktop'}-${label}.png`)
      // Hide DOM overlays only for capture, so text/chrome cannot pass the canvas gate.
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-engine]')
        if (!canvas) throw new Error('Live rendered canvas missing')
        window.__g1CaptureStyles = []
        for (const el of document.body.querySelectorAll('*')) {
          if (!(el instanceof HTMLElement) || el === canvas || el.contains(canvas)) continue
          window.__g1CaptureStyles.push([el, el.style.visibility])
          el.style.visibility = 'hidden'
        }
      })
      let buffer
      try { buffer = await page.locator('canvas[data-engine]').screenshot({ path: filename }) }
      finally { await page.evaluate(() => { for (const [el, visibility] of window.__g1CaptureStyles) el.style.visibility = visibility; delete window.__g1CaptureStyles }) }
      const stats = imageStats(buffer)
      const renderFrame = await page.evaluate(() => window.__g1Rendered.last)
      result.measures.shots.push({ label, time, filename: path.basename(filename), stats, renderFrame })
      check(renderFrame.sampledTime === time && renderFrame.cameraSampleTime === time && renderFrame.drawCalls > 0, `${label}: screenshot has no matching rendered frame`)
      check(stats.stdDevLuma > 1 && stats.nonModalFraction > 0.01 && stats.distinctBuckets > 10, `blank rendered evidence at ${label}: ${JSON.stringify(stats)}`)
    }
    await page.keyboard.press('Escape')
    await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
    check(result.errors.length === 0, `${result.errors.length} console/page errors; first: ${result.errors[0]}`)
    result.pass = true
  } catch (error) {
    result.failures.push(error.stack || String(error))
    report.failures.push(`${result.name}: ${error}`)
    result.pass = false
  } finally {
    await result.context.close()
  }
  return result
}

/** One execution and one report entry per case; unexpected navigation remains a failure. */
const runCase = async fn => {
  const start = report.cases.length
  let outcome
  try { outcome = await fn() }
  catch (error) {
    const pending = report.cases.slice(start)
    if (!pending.length) pending.push({ name: `harness-setup-${start}`, gates: [], errors: [], warnings: [], requests: [], failures: [], measures: {} }), report.cases.push(pending[0])
    for (const r of pending) {
      r.pass = false; r.failures.push(`Harness setup failure: ${error.stack || error}`)
      await r.context?.close().catch(() => {})
      report.failures.push(`${r.name}: harness setup failure: ${error}`)
    }
    outcome = pending
  }
  for (const r of Array.isArray(outcome) ? outcome : [outcome]) if (r.navigations?.length) {
    r.pass = false; r.failures.push('Unexpected navigation during case'); report.failures.push(`${r.name}: unexpected navigation`)
  }
  console.log(JSON.stringify((Array.isArray(outcome) ? outcome : [outcome]).map(r => ({ case: r.name, pass: r.pass, failures: r.failures }))))
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify({ ...report, running: true }, null, 2))
  return outcome
}

try {
  for (const mobile of [false, true]) {
    await runCase(() => caseOrderingReadiness(mobile))
    await runCase(() => casePauseHiddenSeek(mobile))
    await runCase(() => caseRestoreDesktop(mobile))
    await runCase(() => caseCensusLifecycle(mobile))
    await runCase(() => caseRingRendering(mobile))
  }
} catch (error) {
  report.harnessFatal = error.stack || String(error)
  report.failures.push(`harness fatal: ${error}`)
} finally {
  await browser.close().catch(error => { report.harnessFatal = String(error); report.failures.push(`browser teardown: ${error}`) })
  report.finished = new Date().toISOString()
}

const gateIds = ['V1', 'V2', 'V3', 'V4', 'V5']
for (const gate of gateIds) {
  const cases = report.cases.filter(c => c.gates?.includes(gate) && !c.superseded)
  report.gates[gate] = {
    cases: cases.map(c => ({ name: c.name, pass: c.pass })),
    pass: !report.harnessFatal && cases.length > 0 && cases.every(c => c.pass),
  }
}
report.gates.V6 = { cases: [], pass: null, pending: 'parent rerun + different-provider review' }
report.defects = defects
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
const descriptions = report.cases.map(c => `| ${c.name} | ${c.pass ? 'PASS' : 'FAIL'} | ${c.failures.length ? c.failures.map(f => f.split('\n')[0]).join('; ').replaceAll('|', '/') : `${c.errors.length} unexpected errors`} |`)
await fs.writeFile(path.join(out, 'README.md'), [
  '# Independent lifecycle verification', '',
  `Run: ${report.started} to ${report.finished}. Server: ${url}.`, '',
  'Ring story only. Fresh report per execution; desktop 1440×960 and narrow 390×844. No source changes or server restart.', '',
  '```powershell', report.command, '```', '',
  '| Case | Result | Deciding failure / errors |', '|---|---|---|', ...descriptions, '',
  'See report.json for same-frame playing tuples, readiness transitions, exact restore snapshots, deterministic seek digests, five-cycle renderer/scene census and pixel statistics. v5-*.png captures exclude DOM overlays.', '',
  'Expected injected network failures are retained separately from unexpected errors. A canceled stale request is labeled canceled rather than a successfully delivered stale parse. V6 is reserved for the parent rerun and different-provider review.', '',
  '## App defects and missing probes', '', ...defects.map(d => `- ${d.kind}: ${d.file}:${d.line} — ${d.detail}`), defects.length ? '' : 'None established by this run.', '',
  '## Harness limitations', '',
  'Production evidence applies to the served build; source anchors describe the live checkout. V4 applies the stronger gate wording: reduced-motion and poster pages must issue zero CAD/tool GLB requests throughout navigation and inspection.', '',
].join('\n'))
const failed = gateIds.filter(gate => !report.gates[gate].pass)
console.log(JSON.stringify({
  report: path.join(out, 'report.json'),
  timeline: timeline,
  cases: report.cases.map(c => ({ name: c.name, pass: c.pass, failures: c.failures, errorCount: c.errors.length, firstErrors: c.errors.slice(0, 2) })),
  gates: Object.fromEntries(gateIds.map(g => [g, report.gates[g].pass])),
  defects,
  failures: report.failures,
}, null, 2))
if (failed.length) process.exitCode = 1
