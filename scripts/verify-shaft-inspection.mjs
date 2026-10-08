/** Independent shaft S1..S8 real-browser verifier; source and queue files are never modified. */
import { chromium } from 'playwright'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'
import { build } from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { pixels } from './lib/preview-pixels.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const url = (process.argv.find(a => a.startsWith('--url='))?.slice(6) || 'http://localhost:5199').replace(/\/$/, '')
const out = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || 'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/runtime/shaft')
await fs.mkdir(out, { recursive: true })
const sha256 = data => createHash('sha256').update(data).digest('hex')
const sources = [...['story', 'script', 'schedule', 'kinematics', 'toolSpec', 'progression', 'shaftRuntime', 'camera'].map(n => `src/scene/inspection/shaft/${n}.ts`), 'src/scene/inspection/InspectionScene.tsx', 'src/scene/inspection/story.ts', 'src/scene/inspection/shaft/fosPresentation.ts', 'src/scene/inspection/shaft/frame.ts', 'src/components/StaticShaftStory.tsx', 'src/state/inspectionStore.ts', 'src/state/qualityStore.ts', 'src/scene/CameraRig.tsx', 'src/scene/PostProcessingComposer.tsx', 'src/components/RingInspection.tsx', 'src/components/ShaftStoryLayer.tsx', 'src/App.tsx']
const sourceHashes = Object.fromEntries(await Promise.all(sources.map(async f => [f, sha256(await fs.readFile(path.join(root, f)))])))
// Pure authored samplers supply expectations; the actual state always comes from the browser.
async function module(name) {
  const b = await build({ entryPoints: [path.join(root, `src/scene/inspection/shaft/${name}.ts`)], bundle: true, platform: 'node', format: 'esm', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString('base64')}`)
}
const [story, script, kin, tool] = await Promise.all(['story', 'script', 'kinematics', 'toolSpec'].map(module))
const kSource = await fs.readFile(path.join(root, 'src/scene/inspection/shaft/kinematics.ts'), 'utf8')
const slow = ['T_SLOW_START', 'T_SLOW_END'].map(n => Number(kSource.match(new RegExp(`const ${n} = ([\\d.]+)`))?.[1]))
if (slow.some(x => !Number.isFinite(x))) throw new Error('Authored slow-exit bounds missing')
// Authored closed-form machining model. The runtime's documented clamps (t<2 uncut,
// t>=15 finished) mirror sampleShaftKinematics exactly; uniforms must track this model.
const modelFrame = kin.createShaftKinematicsFrame()
const modelState = { mode: 'none', spaceDepth: new Float32Array(modelFrame.spaceDepth.length), engagedSpace: -1, engagedPreviousDepth: 0, edgeY: 0, hobYc: 0, hobA: 0, hobR: 0 }
function modelAt(t) {
  kin.sampleShaftKinematics(t, modelFrame)
  kin.writeShaftProgression(modelFrame, modelState)
  const raw = Array.from(modelState.spaceDepth)
  const depths = t < 2 ? raw.map(() => 0) : t >= 15 ? raw.map(() => 1) : raw
  return { t, depths, engaged: modelState.engagedSpace, previousDepth: modelState.engagedPreviousDepth ?? 0, edgeY: modelState.edgeY, cutting: modelFrame.cutting && modelFrame.engagedSpace >= 0, strokeCentreY: modelFrame.strokeCentreY, machining: modelFrame.machining }
}
// Fine scan of one sweep interval: active cutting needs a cutting stroke AND an engaged space.
function intervalScan(t1, t2, step = 0.002) {
  const cuts = []
  let whollyDisengaged = true
  for (let t = t1; t <= t2 + 1e-9; t = Math.min(t2, t + step)) {
    kin.sampleShaftKinematics(t, modelFrame)
    if (modelFrame.cutting && modelFrame.engagedSpace >= 0) { whollyDisengaged = false; cuts.push({ t, engaged: modelFrame.engagedSpace }) }
    if (t === t2) break
  }
  return { whollyDisengaged, cuts }
}
const report = { schema: 'shaft-verifier/1', browser: describeLaunch(), url, started: new Date().toISOString(), command: `node scripts/verify-shaft-inspection.mjs --url=${url} --out=${out}`, verifierSha256: sha256(await fs.readFile(fileURLToPath(import.meta.url))), sourceHashes, slowExit: slow, cases: [], defects: [], harnessLimitations: [], gates: {} }
const browser = await launchBrowser(chromium)
const persist = () => fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
const near = (a, b, eps = 1e-8) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps
const clone = x => JSON.parse(JSON.stringify(x))
// Independent owner/spec copy and timing oracle: never import these expectations
// from the sampler used by the DOM. Keep sampler agreement as a separate check.
const copyOracle = Object.freeze({
  cards: { '4140': 'AISI 4140 (40-45 HRC)', '4340': 'AISI 4340 (48-50 HRC)', c300: 'C300 (56-58 HRC)', '4340-ht': 'AISI 4340 (H.T. 48-50 HRC)' },
  attempts: [{ id: '4140', start: 15, end: 17.8 }, { id: '4340', start: 17.8, end: 20.3 }, { id: 'c300', start: 20.3, end: 22.6 }],
  attribution: 'Earlier material attempts, as recounted by the designer.',
  recap: 'Remaining teeth — time compressed',
  fade: .14, readable: 1.02, impulse: .15,
})
// JG-035 S2 (owner revision 2026-10-07): the stress era has NO caption and NO disclaimer. Its copy is the
// two DOM panels instead. Authored retrospective FOS values (owner copy, recorded here as literals so the
// verifier never imports them from the sampler or from fosPresentation.ts): every attempt < 1.0, strictly
// ordered 4140 < 4340 < C300. The marker eases between alloys over a 0.28 s smoothstep centred on the two
// attempt boundaries, so a plain card -> value map is wrong inside those windows; the oracle models it.
const fosOracle = Object.freeze({
  attempts: { '4140': 0.55, '4340': 0.72, c300: 0.90 }, boundaries: [17.8, 20.3], swap: 0.28, barMax: 3,
  model: 'Input Shaft', plot: 'Factor of safety',
  study: { attempt: 'Grooved blank (cutter runout groove)', revised: 'Revised, rotary hobbed' },
  // Revised study is blue-only: the printed range starts in the blue band of the bar (cyan-blue stop at 2.35).
  revisedBlueFloor: 2.35,
  // Nothing in the dialog may read as a disclaimer (owner asked for none).
  disclaimer: /illustrative|disclaimer|for illustration|not (?:a )?(?:real|actual|executed|newly)|solver/i,
})
const smooth = x => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u) }
function independentFosValue(t) {
  const a = fosOracle.attempts, [b1, b2] = fosOracle.boundaries, h = fosOracle.swap / 2
  return a['4140'] + (a['4340'] - a['4140']) * smooth((t - (b1 - h)) / fosOracle.swap) + (a.c300 - a['4340']) * smooth((t - (b2 - h)) / fosOracle.swap)
}
function independentCopyAt(t) {
  const attempt = copyOracle.attempts.find(a => t >= a.start && t < a.end)
  const id = attempt?.id ?? (t >= 33.2 && t < 35 ? '4340-ht' : 'none')
  const stampStart = attempt ? attempt.start + copyOracle.fade + copyOracle.readable : Infinity
  const stampState = t < stampStart ? 'none' : t < stampStart + copyOracle.impulse ? 'in' : 'settled'
  const stressKind = t >= 15 && t < 25 ? 'warm' : t >= 32.8 && t < 35 ? 'cool' : 'none'
  // Panels exist exactly while the stress field does. Attempt material = the card on screen, else C300 (22.6..25 s
  // has no card); the revised study always names the heat-treated 4340.
  const fos = stressKind === 'warm'
    ? { kind: 'attempt', value: independentFosValue(t), material: copyOracle.cards[id] || copyOracle.cards.c300, study: fosOracle.study.attempt }
    : stressKind === 'cool' ? { kind: 'revised', value: null, material: copyOracle.cards['4340-ht'], study: fosOracle.study.revised }
    : { kind: 'none', value: null, material: '', study: '' }
  return { id, stampState, stressKind, card: copyOracle.cards[id] ?? '', stamp: stampState === 'none' ? '' : 'FAILED', attribution: t >= 15 && t < 22.6 ? copyOracle.attribution : '', recap: t >= 11 && t < 15 ? copyOracle.recap : '', fos }
}
function assertion(r, gate, condition, text, anchor = null) {
  const g = r.gates[gate] ||= { pass: true, checks: 0, failures: [], failureCount: 0 }
  g.checks++
  if (condition) return
  g.pass = false; g.failureCount++
  if (g.failures.length < 30) g.failures.push(text)
  if (anchor && !report.defects.some(d => d.gate === gate && d.detail === text)) report.defects.push({ case: r.name, gate, kind: 'app', ...anchor, detail: text })
}
async function step(r, gate, fn) {
  r.gates[gate] ||= { pass: true, checks: 0, failures: [], failureCount: 0 }
  try { await fn() } catch (e) {
    assertion(r, gate, false, e.stack || String(e))
    report.harnessLimitations.push({ case: r.name, gate, detail: String(e) })
  }
  await persist()
}
const runtimeAnchors = Object.fromEntries(Object.entries({ stock: 421, cutter: 422, hob: 424, card: 425, stress: 426, supports: 427, endpoint: 428, finale: 429, narrative: 434, progression: 327, dispose: 439 }).map(([field, line]) => [field, { file: 'src/scene/inspection/shaft/shaftRuntime.ts', line }]))

// This function is also called from the post-render hook, at the restore frame.
function browserSnapshot() {
  const scene = window.__threeScene, cam = window.__threeCamera
  if (!scene || !cam) return { error: 'scene/camera probe missing' }
  const lights = []
  scene.traverse(o => { if (o.isLight) lights.push({ type: o.type, name: o.name || '', visible: o.visible, intensity: o.intensity, color: o.color?.getHexString() ?? null }) })
  lights.sort((a, b) => (a.type + '|' + a.name).localeCompare(b.type + '|' + b.name))
  return { scrollY, fov: cam.fov, camera: [...cam.matrixWorld.elements], projection: [...cam.projectionMatrix.elements], inverseProjection: [...cam.projectionMatrixInverse.elements], cameraState: { near: cam.near, far: cam.far, zoom: cam.zoom, aspect: cam.aspect, focus: cam.focus, filmGauge: cam.filmGauge, filmOffset: cam.filmOffset, view: cam.view ? { ...cam.view } : null }, materialMode: window.__telemetry?.scroll?.materialMode ?? null, progress: window.__telemetry?.scroll?.progress ?? null, chapter: window.__telemetry?.scroll?.chapter ?? null, stage: JSON.parse(JSON.stringify(window.__telemetry?.stage ?? null)), background: scene.background?.isColor ? scene.background.getHexString() : String(scene.background), fog: scene.fog ? { type: scene.fog.type, color: scene.fog.color.getHexString(), near: scene.fog.near, far: scene.fog.far } : null, environment: scene.environment?.uuid ?? null, environmentIntensity: scene.environmentIntensity, lights }
}
async function fresh(r, cfg = {}) {
  const narrow = r.name.includes('narrow')
  const context = await browser.newContext({ viewport: narrow ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: narrow, hasTouch: narrow, reducedMotion: cfg.reduced ? 'reduce' : 'no-preference' })
  const page = await context.newPage()
  r.errors = []; r.warnings = []; r.requests = []; r.allCAD = []; r.inspectionRequests = []; r.narrativeRequests = []; r.navigations = []
  page.on('pageerror', e => r.errors.push({ type: 'pageerror', text: e.stack || e.message }))
  page.on('console', m => { if (m.type() === 'error') r.errors.push({ type: 'console', text: m.text(), location: m.location() }); else if (m.type() === 'warning') r.warnings.push({ text: m.text(), location: m.location() }) })
  // Attach before navigation and retain through dialog exit/context close. All CAD
  // and tool model requests count, including non-core/knurling/narrative assets.
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname
    if (!/\.(?:glb|gltf|bin|obj|stl|fbx|ply)$/i.test(pathname)) return
    const item = { url: request.url(), pathname, at: Date.now(), resourceType: request.resourceType() }
    r.allCAD.push(item)
    if (/manufacturing|knurl/i.test(pathname)) r.inspectionRequests.push(item); else r.narrativeRequests.push(item)
    if (/manufacturing-core[^/]*\.glb$/i.test(pathname)) r.requests.push(item)
  })
  if (cfg.poster) await context.addInitScript(() => Object.defineProperty(window, 'WebGL2RenderingContext', { value: undefined }))
  await context.addInitScript(() => {
    window.__shaftVerify = { transitions: [], prematurePlay: [], frames: 0, last: null, pendingRestore: false, restore: null, restoreReady: false, raf: [], captured: null, captureRequest: false, capturePending: false, entries: [], factories: [], targetDraws: [], targetCapture: null, targetCaptureRequest: false }
    const originalFetch = window.fetch
    window.fetch = function(input, ...args) {
      const address = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href).href
      const match = new URL(address).pathname.match(/manufacturing-core-(full|lite)\.glb$/)
      if (match) {
        const p = window.__inspection, v = window.__shaftVerify
        // This is the runtime-owned asset selection, before bytes/compilation and
        // before any later adaptive downgrade. It authoritatively binds ctx.tier.
        v.factories.push({ url: address, effectiveTier: match[1], session: p?.session ?? null, status: p?.status ?? null, kind: p?.kind ?? null, entry: v.entries.at(-1) ?? null, observedTierAtFetch: window.__telemetry?.performance?.tier ?? null, at: performance.now() })
      }
      return originalFetch.call(this, input, ...args)
    }
  })
  r.navigationStartedAt = Date.now()
  await page.goto(`${url}/?chapter=1&inspectionProof=1`, { waitUntil: 'domcontentloaded' })
  let armed = true
  page.on('framenavigated', f => { if (armed && f === page.mainFrame()) r.navigations.push(f.url()) })
  await page.getByRole('button', { name: 'Inspect the input shaft' }).waitFor({ state: 'visible', timeout: 120000 })
  if (!cfg.poster && !cfg.reduced) {
    await page.waitForFunction(() => window.__rig && window.__threeRenderer && window.__telemetry?.performance?.warmReady, null, { timeout: 120000 })
    await page.evaluate(browserSnapshot).then(() => {})
    await page.evaluate(source => { window.__shaftSnapshot = (0, eval)(`(${source})`) }, browserSnapshot.toString())
    await page.evaluate(() => {
      const v = window.__shaftVerify, p = window.__inspection
      let status = p.status
      Object.defineProperty(p, 'status', { configurable: true, enumerable: true, get: () => status, set: value => {
        const changed = status !== value || v.transitions.length === 0
        status = value
        if (changed) v.transitions.push({ status: value, playing: p.playing, playDisabled: document.querySelector('.ring-inspection-controls button')?.disabled ?? null, at: performance.now() })
      } })
      const renderer = window.__threeRenderer, original = renderer.render
      renderer.render = function(scene, camera, ...args) {
        const isMain = scene === window.__threeScene
        if (isMain) { v.activeRenderFrame = v.frames + 1; v.targetDraws = [] }
        const result = original.call(this, scene, camera, ...args)
        if (isMain) {
          v.frames++
          v.last = { frames: v.frames, session: p.session, time: p.time, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, sampleStamp: p.sampleStamp, cameraSampleStamp: p.cameraSampleStamp, drawCalls: this.info.render.calls, matrix: [...camera.matrixWorld.elements] }
          if (v.targetCaptureRequest && !scene.overrideMaterial) {
            v.targetCaptureRequest = false
            const frame = { ...v.last }, targets = JSON.parse(JSON.stringify(v.targetDraws)), engine = this
            // The color scene pass targets the composer's offscreen buffer. Wait
            // only until this synchronous render stack finishes its output passes,
            // then read the displayed canvas before the browser clears it. Depth
            // override passes cannot stand in for the target color draw witness.
            queueMicrotask(() => {
              const readback = { session: p.session, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, sampleStamp: p.sampleStamp, cameraSampleStamp: p.cameraSampleStamp }
              try { v.targetCapture = { frame, targets, readback, canvas: { width: engine.domElement.width, height: engine.domElement.height }, dataUrl: engine.domElement.toDataURL('image/png') } }
              catch (error) { v.targetCapture = { error: String(error), frame, readback } }
            })
          }
          v.activeRenderFrame = null
          if (p.active && p.status !== 'ready') {
            const play = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Play sequence')
            v.prematurePlay.push({ status: p.status, playing: p.playing, disabled: play?.disabled ?? null })
          }
          if (!p.active && p.restoreObserved && v.pendingRestore) {
            v.pendingRestore = false
            // CameraRig returns without a narrative write on restoreObserved's
            // frame. Read after all render-state leases finish this same stack;
            // waiting for later narrative frames would resume its intentional orbit.
            queueMicrotask(() => { v.restore = window.__shaftSnapshot(); v.restoreReady = true })
          }
          if (v.captureRequest && !v.capturePending) {
            // Consistent-phase snapshots: both entry-baseline and post-restore reads
            // come from the same point - a completed render, after the microtask queue.
            v.capturePending = true; v.captureRequest = false
            queueMicrotask(() => { try { v.captured = window.__shaftSnapshot() } finally { v.capturePending = false } })
          }
        }
        return result
      }
    })
  }
  return { page, context, close: async () => { armed = false; await context.close() } }
}
async function settle(page, t) {
  await page.waitForFunction(t => { const p = window.__inspection, v = window.__shaftVerify.last; return p?.active && p.status === 'ready' && p.playing === false && Math.abs(p.sampledTime - t) < 1e-8 && v && v.sampledTime === p.sampledTime && v.cameraSampleTime === p.sampledTime && v.sampleStamp === v.cameraSampleStamp }, t, { timeout: 30000 })
  const start = await page.evaluate(() => window.__shaftVerify.frames)
  await page.waitForFunction(start => window.__shaftVerify.frames >= start + 2, start, { timeout: 30000 })
}
async function read(page) {
  return page.evaluate(() => {
    const p = window.__inspection, scene = window.__threeScene
    const chip = scene?.getObjectByName('shaft-single-rake-chip')
    const card = document.querySelector('[data-shaft-card]')
    const progression = {}
    for (const kind of ['legacy', 'approved']) {
      const u = window.__shaftProgression?.[kind]?.uniforms
      if (u?.uSpaceDepth) progression[kind] = { depth: Array.from(u.uSpaceDepth.value), engaged: u.uEngagedSpace.value, previousDepth: u.uEngagedPreviousDepth.value, edgeY: u.uEdgeY.value, mode: u.uProgressionMode.value, kind: u.uShaftKind.value }
    }
    // FOS panels (ShaftStoryLayer.tsx): left model block + right bar. Text via textContent so the narrow layout's
    // display:none labels are still read; geometry/visibility is recorded separately for the visible-number check.
    function fosSnapshot() {
      const model = document.querySelector('[data-shaft-fos-model]'), bar = document.querySelector('[data-shaft-fos-bar]')
      const marker = bar?.querySelector('[data-shaft-fos-marker]'), range = bar?.querySelector('[data-shaft-fos-range]')
      const rect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, display: getComputedStyle(el).display } }
      const clone = bar ? bar.cloneNode(true) : null
      clone?.querySelectorAll('.shaft-fos-tick').forEach(n => n.remove())
      return {
        modelCount: document.querySelectorAll('[data-shaft-fos-model]').length, barCount: document.querySelectorAll('[data-shaft-fos-bar]').length,
        kind: model?.getAttribute('data-shaft-fos-kind') ?? null, barKind: bar?.getAttribute('data-shaft-fos-kind') ?? null,
        modelOpacity: model ? parseFloat(getComputedStyle(model).opacity) : null, barOpacity: bar ? parseFloat(getComputedStyle(bar).opacity) : null,
        lines: model ? [...model.querySelectorAll('p')].map(x => (x.textContent ?? '').replace(/\s+/g, ' ').trim()) : [],
        minValueText: model?.querySelector('[data-shaft-fos-value]')?.textContent ?? null, minRect: rect(model?.querySelector('.shaft-fos-min')),
        markerCount: document.querySelectorAll('[data-shaft-fos-marker]').length, markerText: marker?.querySelector('em')?.textContent ?? null,
        markerPos: marker ? parseFloat(marker.style.getPropertyValue('--fos-pos')) : null, markerRect: rect(marker?.querySelector('em')),
        rangeCount: document.querySelectorAll('[data-shaft-fos-range]').length, rangePos: range ? parseFloat(range.style.getPropertyValue('--fos-pos')) : null,
        barTextNoTicks: (clone?.textContent ?? '').replace(/\s+/g, ' ').trim(), viewport: { width: innerWidth, height: innerHeight },
      }
    }
    return { probe: JSON.parse(JSON.stringify(p)), renderFrame: window.__shaftVerify.last, chip: chip ? { visible: chip.visible, opacity: chip.material.opacity, position: chip.position.toArray() } : null, progression, dom: { card: card?.querySelector('.shaft-card-text')?.textContent ?? '', stamp: card?.querySelector('.shaft-stamp')?.textContent ?? '', attribution: document.querySelector('[data-shaft-attribution]')?.textContent ?? '', fos: fosSnapshot(), recap: document.querySelector('[data-shaft-recap]')?.textContent ?? '', status: document.querySelector('[data-shaft-status]')?.textContent ?? '', dialogText: document.querySelector('[role=dialog]')?.textContent ?? '' } }
  })
}
// Wrap the progression materials' onBeforeCompile so the live uniform objects (the
// shader's actual measurement surface) are addressable from the verifier.
async function instrumentProgression(page) {
  await page.evaluate(() => {
    const store = window.__shaftProgression = { legacy: null, approved: null }
    const rootObj = window.__threeScene.getObjectByName('manufacturing-study-root')
    if (!rootObj) throw new Error('manufacturing-study-root missing')
    let wrapped = 0
    const materialKeys = [], untouched = new Set()
    rootObj.traverse(o => {
      if (!o.isMesh) return
      for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
        if (typeof mat.onBeforeCompile !== 'function' || mat.__shaftWrapped) continue
        const originalCacheKey = mat.customProgramCacheKey
        const authoredKey = originalCacheKey.call(mat)
        // applyProgression owns this explicit marker. Default/tool/support shader
        // callbacks must keep their original cache identity and remain untouched.
        if (!authoredKey.startsWith('jgun-shaft-progression-')) { untouched.add(mat.uuid); continue }
        const original = mat.onBeforeCompile
        mat.__shaftWrapped = true; wrapped++
        mat.onBeforeCompile = function (shader, renderer) {
          const result = original.call(this, shader, renderer)
          try { const u = shader.uniforms; if (u && u.uSpaceDepth) store[u.uShaftKind?.value === 1 ? 'approved' : 'legacy'] = { uniforms: u } } catch { }
          return result
        }
        // Preserve every authored cache distinction, appending one stable witness
        // suffix only to progression materials to capture their live uniforms.
        mat.customProgramCacheKey = function() { return originalCacheKey.call(this) + '|shaft-verifier-uniform-witness-v1' }
        materialKeys.push({ material: mat.uuid, mesh: o.name, authoredKey, witnessKey: mat.customProgramCacheKey() })
        mat.needsUpdate = true
      }
    })
    return { wrapped, materialKeys, untouchedMaterials: untouched.size }
  })
}
async function seek(page, t) {
  const slider = page.locator('#inspection-seek')
  // Exact-float seek through real DOM events: Playwright's fill() rejects values off
  // the authored 0.01 grid, so drive the native value setter + input/change events
  // (what the React onChange handler consumes) with a transient step=any.
  await slider.evaluate((e, value) => {
    const originalStep = e.getAttribute('step')
    e.step = 'any'
    try {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, String(value))
      e.dispatchEvent(new Event('input', { bubbles: true }))
      e.dispatchEvent(new Event('change', { bubbles: true }))
    } finally { if (originalStep === null) e.removeAttribute('step'); else e.setAttribute('step', originalStep) }
  }, t)
  await settle(page, t)
  return await read(page)
}
async function snapshotAfterRender(page) {
  await page.evaluate(() => { const v = window.__shaftVerify; v.captured = null; v.captureRequest = true })
  await page.waitForFunction(() => !!window.__shaftVerify.captured, null, { timeout: 15000 })
  return page.evaluate(() => window.__shaftVerify.captured)
}
async function enter(page, mode = null) {
  if (mode) { await page.getByRole('button', { name: mode === 'blueprint' ? /BLUEPRINT WIREFRAME/ : /EXPLODED ASSEMBLY/ }).click(); await page.waitForTimeout(800) }
  // The narrative intentionally orbits at rest (CameraRig.tsx:530–539). Capture
  // and click atomically: CameraRig's first inspection frame saves this exact
  // matrix, before any further narrative orbit/parallax write can occur.
  const before = await page.evaluate(requestedMode => { const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Inspect the input shaft')); if (!button) throw new Error('Shaft entry trigger missing'); window.__shaftTriggerEl = button; const v = window.__shaftVerify; v.transitions = []; v.prematurePlay = []; v.entries.push({ requestedMode, actualMode: window.__telemetry?.scroll?.materialMode ?? null, requestedTier: window.__telemetry?.performance?.tier ?? null, at: performance.now() }); button.focus({ preventScroll: true }); const snapshot = window.__shaftSnapshot(); button.click(); return snapshot }, mode)
  await page.getByRole('dialog').waitFor()
  await page.waitForFunction(() => ['ready', 'error'].includes(window.__inspection?.status), null, { timeout: 120000 })
  const p = await page.evaluate(() => ({ status: window.__inspection.status, error: window.__inspection.error }))
  if (p.status !== 'ready') throw new Error(`App readiness failure ${JSON.stringify(p)}`)
  await page.waitForTimeout(1400)
  await settle(page, 0)
  return before
}
async function leave(page, key = 'Return') {
  await page.evaluate(() => { const v = window.__shaftVerify; v.pendingRestore = true; v.restore = null; v.restoreReady = false })
  if (key === 'Escape') await page.keyboard.press('Escape'); else await page.getByRole('button', { name: /Return to narrative/ }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 15000 })
  await page.waitForFunction(() => !!window.__shaftVerify.restoreReady, null, { timeout: 15000 })
  return page.evaluate(() => ({ snapshot: window.__shaftVerify.restore, probe: JSON.parse(JSON.stringify(window.__inspection)), focus: document.activeElement?.textContent?.trim() ?? '', triggerFocused: !!window.__shaftTriggerEl && document.activeElement === window.__shaftTriggerEl, triggerConnected: window.__shaftTriggerEl?.isConnected ?? null }))
}
function compareRestore(r, before, after, label) {
  const a = after.snapshot
  assertion(r, 'S7', !before?.error && !a?.error, `${label}: snapshot available`)
  const maxCameraDelta = Math.max(...before.camera.map((v, i) => Math.abs(v - a.camera[i])))
  assertion(r, 'S7', maxCameraDelta <= 1e-6, `${label}: camera delta ${maxCameraDelta}`, { file: 'src/scene/CameraRig.tsx', line: 229 })
  // Recomputed camera matrices carry float64 ULP noise between settled frames; compare
  // continuous camera fields numerically and keep discrete scene state exact.
  const numericDelta = (x, y) => Array.isArray(x) ? Math.max(...x.map((v, i) => Math.abs(v - (y?.[i] ?? 0)))) : Math.abs((x ?? 0) - (y ?? 0))
  for (const f of ['projection', 'inverseProjection']) {
    const d = numericDelta(before[f], a[f])
    assertion(r, 'S7', d <= 1e-9, `${label}: ${f} delta ${d} ${JSON.stringify(before[f])} -> ${JSON.stringify(a[f])}`)
  }
  const cameraNumeric = ['near', 'far', 'zoom', 'aspect', 'focus', 'filmGauge', 'filmOffset']
  const csDelta = Math.max(...cameraNumeric.map(k => numericDelta(before.cameraState?.[k], a.cameraState?.[k])), 0)
  assertion(r, 'S7', csDelta <= 1e-9 && JSON.stringify(before.cameraState?.view ?? null) === JSON.stringify(a.cameraState?.view ?? null), `${label}: cameraState delta ${csDelta} ${JSON.stringify(before.cameraState)} -> ${JSON.stringify(a.cameraState)}`)
  for (const [f, eps] of [['scrollY', 1e-6], ['fov', 1e-9], ['environmentIntensity', 1e-9]]) {
    const d = numericDelta(before[f], a[f])
    assertion(r, 'S7', d <= eps, `${label}: ${f} delta ${d} ${JSON.stringify(before[f])} -> ${JSON.stringify(a[f])}`)
  }
  for (const f of ['materialMode', 'progress', 'chapter', 'stage', 'background', 'fog', 'environment', 'lights']) assertion(r, 'S7', JSON.stringify(before[f]) === JSON.stringify(a[f]), `${label}: ${f} mismatch ${JSON.stringify(before[f])} -> ${JSON.stringify(a[f])}`)
  assertion(r, 'S7', after.triggerFocused === true, `${label}: focus ${JSON.stringify({ text: after.focus, connected: after.triggerConnected })}`)
  assertion(r, 'S7', after.probe.restoreObserved && after.probe.restoredPoseError <= 1e-6 && after.probe.restoreProjectionError === 0 && after.probe.restoreStateError === 0, `${label}: restore probe errors ${JSON.stringify({ pose: after.probe.restoredPoseError, projection: after.probe.restoreProjectionError, state: after.probe.restoreStateError })}`)
  return { label, maxCameraDelta, before, after }
}
async function census(page) {
  return page.evaluate(() => new Promise((resolve, reject) => { let prev = '', stable = 0, n = 0; function tick() { const i = window.__threeRenderer?.info; if (!i) return reject(new Error('Renderer missing')); const v = { geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length }; const s = JSON.stringify(v); stable = s === prev ? stable + 1 : 0; prev = s; n++; if (stable >= 60) return resolve({ ...v, stableFrames: stable }); if (n >= 1200) return reject(new Error('Renderer census unstable')); requestAnimationFrame(tick) } requestAnimationFrame(tick) }))
}
function imageStats(buffer) {
  const { data, channels } = pixels(buffer), h = new Map(); let sum = 0, sum2 = 0, n = 0
  for (let i = 0; i < data.length; i += channels) { const l = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2]; sum += l; sum2 += l * l; n++; const k = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`; h.set(k, (h.get(k) || 0) + 1) }
  const mean = sum / n, modal = Math.max(...h.values())
  return { pixels: n, meanLuma: mean, stdDevLuma: Math.sqrt(Math.max(0, sum2 / n - mean * mean)), nonModalFraction: (n - modal) / n, distinctBuckets: h.size }
}
async function assertFactoryBinding(page, r, requestedMode, before) {
  const observed = await page.evaluate(() => { const v = window.__shaftVerify, session = window.__inspection.session; return { entry: v.entries.at(-1), session, factories: v.factories.filter(f => f.session === session), tierNow: window.__telemetry?.performance?.tier ?? null } })
  const factory = observed.factories[0], entry = observed.entry
  r.measures.factoryBindings ||= []; r.measures.factoryBindings.push({ requestedMode, beforeMode: before.materialMode, ...observed })
  assertion(r, 'S1', entry?.requestedMode === requestedMode && entry?.actualMode === requestedMode && before.materialMode === requestedMode, `${requestedMode} entry did not observe actual mode: ${JSON.stringify({ entry, beforeMode: before.materialMode })}`, { file: 'src/state/inspectionStore.ts', line: 58 })
  assertion(r, 'S1', observed.factories.length === 1 && factory?.kind === 'shaft' && factory.session === observed.session && factory.entry?.at === entry?.at, `runtime creation asset not bound to entry epoch: ${JSON.stringify(observed)}`, { file: 'src/scene/inspection/InspectionScene.tsx', line: 110 })
  const expectedAsset = story.shaftStory.assets.find(a => a.tier === factory?.effectiveTier)
  const selectedMatches = expectedAsset && new URL(factory.url).pathname.endsWith(`/${expectedAsset.url}`)
  // The entry request can be stepped down before factory creation. Its selected
  // runtime URL (not the current tier after creation) is the effective tier proof.
  const validTierTransition = entry?.requestedTier === 'full' ? ['full', 'lite'].includes(factory?.effectiveTier) : entry?.requestedTier === 'lite' && factory?.effectiveTier === 'lite'
  const networkMatches = factory && r.requests.filter(q => q.url === factory.url && q.at >= r.navigationStartedAt).length >= 1
  assertion(r, 'S1', !!selectedMatches && validTierTransition && networkMatches, `requested entry tier/effective factory asset mismatch: ${JSON.stringify({ requestedTier: entry?.requestedTier, effectiveTier: factory?.effectiveTier, factoryUrl: factory?.url, expectedAsset: expectedAsset?.url, tierNow: observed.tierNow })}`, { file: 'src/scene/inspection/shaft/shaftRuntime.ts', line: 271 })
  return observed
}
async function instrumentTargetDraws(page) {
  return page.evaluate(() => {
    const root = window.__threeScene?.getObjectByName('manufacturing-study-root')
    if (!root) throw new Error('Study root missing for shaft draw witness')
    const targets = []
    root.traverse(o => {
      if (!o.isMesh || o.__shaftDrawWrapped) return
      let kind = null
      for (let a = o; a && a !== root; a = a.parent) {
        if (a.name === 'study-legacyshaft') kind = 'legacy'
        if (a.name === 'study-approvedshaft') kind = 'approved'
      }
      if (!kind || o.name === 'study-section-backface') return
      targets.push({ name: o.name, kind }); o.__shaftDrawWrapped = true
      const original = o.onBeforeRender
      o.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
        const result = original.call(this, renderer, scene, camera, geometry, material, group)
        const v = window.__shaftVerify, p = window.__inspection
        if (!v.activeRenderFrame || scene !== window.__threeScene || scene.overrideMaterial) return result
        const ancestors = []; let visible = true
        for (let a = this; a; a = a.parent) { ancestors.push({ name: a.name, visible: a.visible }); if (!a.visible) visible = false }
        if (!geometry.boundingBox) geometry.computeBoundingBox()
        const box = geometry.boundingBox.clone().applyMatrix4(this.matrixWorld)
        const points = [], rect = renderer.domElement.getBoundingClientRect()
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
          const world = camera.position.clone().set(x, y, z), view = world.clone().applyMatrix4(camera.matrixWorldInverse), ndc = world.project(camera)
          points.push({ x: (ndc.x + 1) * rect.width / 2, y: (1 - ndc.y) * rect.height / 2, z: ndc.z, depth: -view.z })
        }
        const projected = { xMin: Math.min(...points.map(a => a.x)), xMax: Math.max(...points.map(a => a.x)), yMin: Math.min(...points.map(a => a.y)), yMax: Math.max(...points.map(a => a.y)), zMin: Math.min(...points.map(a => a.z)), zMax: Math.max(...points.map(a => a.z)) }
        const finite = Object.values(projected).every(Number.isFinite)
        const intersectsViewport = finite && projected.xMax > 0 && projected.xMin < rect.width && projected.yMax > 0 && projected.yMin < rect.height && projected.zMax >= -1 && projected.zMin <= 1 && points.some(a => a.depth >= camera.near && a.depth <= camera.far)
        v.targetDraws.push({ kind, name: this.name, uuid: this.uuid, ancestors, visible, materialVisible: material.visible, opacity: material.opacity, vertices: geometry.attributes.position?.count ?? 0, layersMatch: this.layers.test(camera.layers), projected, intersectsViewport, viewport: { width: rect.width, height: rect.height }, frame: v.activeRenderFrame, session: p.session, sampledTime: p.sampledTime, cameraSampleTime: p.cameraSampleTime, sampleStamp: p.sampleStamp, cameraSampleStamp: p.cameraSampleStamp })
        return result
      }
    })
    return targets
  })
}
async function capture(page, r, label, t) {
  const tuple = await seek(page, t)
  const file = `${r.name}-${label}.png`
  const uiFile = `${r.name}-${label}-ui.png`
  await page.screenshot({ path: path.join(out, uiFile) })
  const uiFrame = await page.evaluate(() => window.__shaftVerify.last)
  await instrumentTargetDraws(page)
  await page.evaluate(() => { const v = window.__shaftVerify; v.targetCapture = null; v.targetCaptureRequest = true })
  await page.waitForFunction(() => !!window.__shaftVerify.targetCapture, null, { timeout: 15000 })
  const captured = await page.evaluate(() => window.__shaftVerify.targetCapture)
  if (captured.error) throw new Error(`Frame capture failed: ${captured.error}`)
  if (!captured.dataUrl?.startsWith('data:image/png;base64,')) throw new Error('Completed framebuffer did not produce PNG')
  const buffer = Buffer.from(captured.dataUrl.slice('data:image/png;base64,'.length), 'base64')
  await fs.writeFile(path.join(out, file), buffer)
  const { dataUrl, ...witness } = captured, frame = captured.frame
  const meshCensus = { studyMeshes: captured.targets.filter(o => o.visible && o.materialVisible && o.opacity > 0).length, targets: captured.targets, canvas: captured.canvas }
  const stats = imageStats(buffer)
  const requiredKinds = t < 22.6 ? ['legacy'] : t < 25 ? ['legacy', 'approved'] : ['approved']
  r.measures.shots.push({ label, t, file, uiFile, tuple, uiFrame, frame, stats, meshCensus, witness, requiredKinds, pngSha256: sha256(buffer) })
  assertion(r, 'S8', uiFrame.sampledTime === t && uiFrame.cameraSampleTime === t && uiFrame.session === tuple.probe.session, `${label}: UI same-playhead/session evidence missing`)
  assertion(r, 'S8', frame.sampledTime === t && frame.cameraSampleTime === t && frame.sampleStamp === frame.cameraSampleStamp && frame.session === tuple.probe.session && frame.drawCalls > 0, `${label}: same-session rendered tuple ${JSON.stringify(frame)}`)
  assertion(r, 'S8', ['session', 'sampledTime', 'cameraSampleTime', 'sampleStamp', 'cameraSampleStamp'].every(field => captured.readback[field] === frame[field]), `${label}: framebuffer readback lost its target-draw frame tuple ${JSON.stringify(captured.readback)}`)
  for (const kind of requiredKinds) {
    const targets = captured.targets.filter(o => o.kind === kind)
    const drawn = targets.some(o => o.visible && o.materialVisible && o.opacity > 0 && o.vertices > 0 && o.layersMatch && o.intersectsViewport && o.frame === frame.frames && o.session === frame.session && o.sampledTime === t && o.cameraSampleTime === t && o.sampleStamp === frame.sampleStamp && o.cameraSampleStamp === frame.cameraSampleStamp && o.ancestors.some(a => a.name === 'manufacturing-study-root') && o.ancestors.some(a => a.name === `${kind}shaft`))
    assertion(r, 'S8', drawn, `${label}: ${kind} shaft has no visible, projected study-owned draw in captured frame ${frame.frames}: ${JSON.stringify(targets)}`, { file: 'src/scene/inspection/shaft/shaftRuntime.ts', line: 349 })
  }
  assertion(r, 'S8', stats.stdDevLuma > 1 && stats.nonModalFraction > .01 && stats.distinctBuckets > 10, `${label}: blank canvas ${JSON.stringify(stats)}`, { file: 'src/scene/inspection/shaft/shaftRuntime.ts', line: 349 })
}
function digest(tuple) {
  const p = tuple.probe
  const quantize = x => typeof x === 'number' ? Math.round(x * 1e10) / 1e10 : Array.isArray(x) ? x.map(quantize) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, quantize(v)])) : x
  return quantize({ time: p.sampledTime, phase: p.phase, chapter: p.chapter, discrete: p.discrete, narrativeAlpha: p.narrativeAlpha, narrativeVisibleMeshes: p.narrativeVisibleMeshes, shaft: p.shaft, chip: tuple.chip, camera: tuple.renderFrame.matrix })
}
async function playWindow(page, start, end) {
  await seek(page, start)
  await page.evaluate(() => { const v = window.__shaftVerify; v.raf = []; v.lastRaf = null; v.collectRaf = true; const tick = t => { if (!v.collectRaf) return; if (v.lastRaf !== null) v.raf.push(t - v.lastRaf); v.lastRaf = t; requestAnimationFrame(tick) }; requestAnimationFrame(tick) })
  await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
  await page.waitForFunction(end => window.__inspection.sampledTime >= end, end, { timeout: 60000 })
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  const intervals = await page.evaluate(() => { window.__shaftVerify.collectRaf = false; return window.__shaftVerify.raf })
  const sorted = intervals.slice().sort((a, b) => a - b), pct = q => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]
  return { start, end, samples: intervals.length, p50ms: pct(.5), p95ms: pct(.95), p99ms: pct(.99), maxMs: sorted.at(-1) }
}
// FOS panel oracle check ([data-shaft-fos-model] + [data-shaft-fos-bar]). Returns the measured marker for ordering checks.
function checkFosPanels(r, t, tuple, independent) {
  const f = tuple.dom.fos, o = independent.fos, mix = tuple.probe.shaft.stress.mix, anchor = { file: 'src/components/ShaftStoryLayer.tsx', line: 18 }
  const num = x => { const m = /-?\d+(?:\.\d+)?/.exec(x ?? ''); return m ? Number(m[0]) : NaN }
  const ctx = `t=${t}`
  if (o.kind === 'none') {
    assertion(r, 'S3', f.modelCount === 0 && f.barCount === 0 && f.markerCount === 0 && f.rangeCount === 0, `${ctx}: FOS panels present outside the stress era ${JSON.stringify({ model: f.modelCount, bar: f.barCount, marker: f.markerCount, range: f.rangeCount })}`, anchor)
    return null
  }
  assertion(r, 'S3', f.modelCount === 1 && f.barCount === 1 && f.kind === o.kind && f.barKind === o.kind, `${ctx}: expected one ${o.kind} model block and bar, got ${JSON.stringify({ model: f.modelCount, bar: f.barCount, kind: f.kind, barKind: f.barKind })}`, anchor)
  assertion(r, 'S3', f.lines[0] === `Model Name: ${fosOracle.model}` && f.lines[1] === `Study: ${o.study}` && f.lines[2] === `Plot type: ${fosOracle.plot}` && f.lines[3] === `Material: ${o.material}`, `${ctx}: model block lines ${JSON.stringify(f.lines)}`, anchor)
  // Panels share the stress field's opacity (appear within one frame of the colours).
  assertion(r, 'S3', Number.isFinite(f.modelOpacity) && Math.abs(f.modelOpacity - mix) <= 2e-3 && Math.abs(f.barOpacity - mix) <= 2e-3, `${ctx}: panel opacity ${f.modelOpacity}/${f.barOpacity} != stress mix ${mix}`, anchor)
  const viewport = f.viewport
  if (o.kind === 'attempt') {
    const minLine = f.lines[4] ?? '', min = num(f.minValueText), marker = num(f.markerText)
    assertion(r, 'S3', f.lines.length === 5 && /^Min FOS = \d\.\d\d$/.test(minLine) && minLine === `Min FOS = ${f.minValueText}`, `${ctx}: Min FOS line ${JSON.stringify(f.lines)}`, anchor)
    // Printed value is rounded to 2 dp; marker position is exact. Both must follow the independent eased oracle.
    assertion(r, 'S3', Math.abs(min - o.value) <= .0051 && Math.abs(marker - o.value) <= .0051 && f.markerText === f.minValueText, `${ctx}: printed FOS ${f.minValueText}/${f.markerText} != independent ${o.value.toFixed(4)}`, anchor)
    assertion(r, 'S3', f.markerCount === 1 && f.rangeCount === 0 && Math.abs(f.markerPos * fosOracle.barMax - o.value) <= 1e-5, `${ctx}: marker/range ${JSON.stringify({ marker: f.markerCount, range: f.rangeCount, pos: f.markerPos })} vs value ${o.value}`, anchor)
    assertion(r, 'S3', min < 1 && marker < 1, `${ctx}: attempt FOS must stay < 1.0 (${f.minValueText})`, anchor)
    assertion(r, 'S3', /^\d\.\d\d$/.test(f.barTextNoTicks.replace(/^FOS\s*/, '')), `${ctx}: bar prints something besides ticks and the marker value: ${JSON.stringify(f.barTextNoTicks)}`, anchor)
    // The number must be on screen once the panel is opaque (desktop: Min FOS line; every layout: the bar marker).
    if (mix >= .99) {
      const mr = f.markerRect
      assertion(r, 'S3', !!mr && mr.width > 0 && mr.height > 0 && mr.x >= 0 && mr.y >= 0 && mr.x + mr.width <= viewport.width + 1 && mr.y + mr.height <= viewport.height + 1, `${ctx}: marker value not visible on screen ${JSON.stringify(mr)}`, anchor)
      if (!r.name.includes('narrow')) assertion(r, 'S3', !!f.minRect && f.minRect.width > 0 && f.minRect.height > 0 && f.minRect.display !== 'none', `${ctx}: desktop Min FOS line not visible ${JSON.stringify(f.minRect)}`, anchor)
    }
    return { marker, min, opacity: f.modelOpacity }
  }
  // Revised kind: blue range only, no number printed anywhere in the panels.
  assertion(r, 'S3', f.lines.length === 4 && !/FOS\s*=/.test(f.lines.join(' ')) && f.minValueText === null, `${ctx}: revised block must not print Min FOS ${JSON.stringify(f.lines)}`, anchor)
  assertion(r, 'S3', f.markerCount === 0 && f.rangeCount === 1 && f.markerText === null, `${ctx}: revised bar must show a range and no marker ${JSON.stringify({ marker: f.markerCount, range: f.rangeCount })}`, anchor)
  assertion(r, 'S3', Number.isFinite(f.rangePos) && f.rangePos * fosOracle.barMax >= fosOracle.revisedBlueFloor - 1e-9 && f.rangePos <= 1, `${ctx}: revised range floor ${f.rangePos * fosOracle.barMax} is not in the blue end (>= ${fosOracle.revisedBlueFloor})`, anchor)
  assertion(r, 'S3', !/\d/.test(f.barTextNoTicks), `${ctx}: revised bar prints a number besides ticks: ${JSON.stringify(f.barTextNoTicks)}`, anchor)
  return null
}
// S1 (owner revision): during machining the shaper cutter sits to the viewer's RIGHT of the shaft at equal depth.
// No screen-side field exists in the probe, so this projects live scene-graph objects through the live camera
// (scene-graph projection, not telemetry): cutter disc centre vs the shaft axis point at the cutter's stroke height.
// Mirrors camera.test.ts S1 (NDC dx > 0.1, depth difference <= 1.55 mm).
async function cutterComposition(page, t) {
  return page.evaluate(() => {
    const scene = window.__threeScene, cam = window.__threeCamera, rootObj = scene.getObjectByName('manufacturing-study-root'), shaper = scene.getObjectByName('shaper-cutter')
    if (!rootObj || !shaper) return { error: 'study root or shaper-cutter missing' }
    scene.updateMatrixWorld(true); cam.updateMatrixWorld(true)
    const stroke = window.__inspection.shaft.cutter.stroke
    const c = cam.position.clone(), a = cam.position.clone()
    shaper.getWorldPosition(c)
    // Study frame: CAD mm (x, y, z) -> metres (x, z, -y); the shaft axis is CAD y at x = z = 0.
    a.set(0, 0, -stroke * 0.001); rootObj.localToWorld(a)
    const ndc = p => p.clone().project(cam), depth = p => -p.clone().applyMatrix4(cam.matrixWorldInverse).z
    return { cutterNdcX: ndc(c).x, axisNdcX: ndc(a).x, cutterNdcY: ndc(c).y, depthDiffMm: Math.abs(depth(c) - depth(a)) * 1000, shaperVisible: shaper.visible, stroke, aspect: cam.aspect }
  })
}
async function dynamic(narrow) {
  const r = { name: narrow ? 'narrow' : 'desktop', gates: {}, measures: { readiness: [], sweep: [], cards: [], slowExit: [], shots: [], determinism: [], restores: [], census: [], playback: [] } }
  report.cases.push(r)
  let session
  try {
    session = await fresh(r); const { page } = session
    await step(r, 'S1', async () => {
      r.before = await enter(page, 'blueprint')
      await assertFactoryBinding(page, r, 'blueprint', r.before)
      const observation = await page.evaluate(() => ({ transitions: window.__shaftVerify.transitions, prematurePlay: window.__shaftVerify.prematurePlay, probe: JSON.parse(JSON.stringify(window.__inspection)) }))
      r.measures.readiness.push({ mode: 'blueprint', ...observation })
      const names = observation.transitions.map(x => x.status)
      assertion(r, 'S1', names.indexOf('loading') >= 0 && names.indexOf('compiling') > names.indexOf('loading') && names.indexOf('ready') > names.indexOf('compiling'), `blueprint readiness order ${names}`)
      assertion(r, 'S1', observation.prematurePlay.length > 0 && observation.prematurePlay.every(x => !x.playing && x.disabled === true), `Play before readiness ${JSON.stringify(observation.prematurePlay.slice(0, 4))}`, { file: 'src/components/RingInspection.tsx', line: 173 })
      // Exactly one core bundle per session. Full vs lite is the app's adaptive quality
      // choice (same dist served both across preview-run-1 and this run); record it.
      const qualityTier = await page.evaluate(() => window.__telemetry?.performance?.tier ?? null)
      r.measures.readiness.at(-1).coreRequest = r.requests[0]?.url ?? null; r.measures.readiness.at(-1).qualityTierAfterReady = qualityTier
      assertion(r, 'S1', r.requests.length === 1 && /manufacturing-core-(full|lite)\.glb$/.test(r.requests[0]?.url ?? ''), `core request count/url ${JSON.stringify(r.requests)}`)
    })
    if ((await page.getByRole('dialog').count()) === 0) await enter(page)
    await step(r, 'S2', async () => {
      r.measures.progressionInstrumentation = await instrumentProgression(page)
      // The isolate beat does not render the legacy shaft, so nothing would recompile;
      // render a visible shaping moment first, then confirm the uniform capture.
      await seek(page, 4)
      await page.waitForFunction(() => window.__shaftProgression?.legacy?.uniforms?.uSpaceDepth, null, { timeout: 30000 })
      let last = -1
      for (let i = 0; i <= 300; i++) {
        const t = i / 20, tuple = await seek(page, t), s = tuple.probe.shaft
        const model = modelAt(t), uni = tuple.progression.legacy
        // October 6 corrected contract: teethPartial counts retained partial stock
        // (previous-pass depths persist through return strokes); it is compared with
        // the live uniform depths, never zeroed on return.
        const partial = uni ? uni.depth.filter(d => d > 0 && d < 1).length : -1
        const formed = uni ? uni.depth.filter(d => d >= 1).length : -1
        r.measures.sweep.push({ t, teethFormed: s.teethFormed, teethPartial: s.teethPartial, uniform: uni, model: { depths: model.depths, engaged: model.engaged, previousDepth: model.previousDepth, edgeY: model.edgeY }, cutter: s.cutter, activeCut: model.cutting, chip: tuple.chip, edgeY: s.cutter.stroke + tool.SHAPER_THICKNESS_MM / 2, sampleStamp: tuple.probe.sampleStamp, cameraSampleStamp: tuple.probe.cameraSampleStamp })
        assertion(r, 'S2', !!uni, `progression uniforms not captured at ${t}`)
        if (uni) {
          assertion(r, 'S2', uni.depth.length === model.depths.length && uni.depth.every((d, j) => Math.abs(d - model.depths[j]) <= 1e-7), `uniform depth departs from authored model at ${t}: ${JSON.stringify(uni.depth)} vs ${JSON.stringify(model.depths)}`, runtimeAnchors.progression)
          assertion(r, 'S2', uni.engaged === model.engaged && Math.abs(uni.edgeY - model.edgeY) <= 1e-7 && Math.abs(uni.previousDepth - model.previousDepth) <= 1e-7, `engagement surface at ${t}: uniform ${JSON.stringify({ engaged: uni.engaged, edgeY: uni.edgeY, previousDepth: uni.previousDepth })} vs model ${JSON.stringify({ engaged: model.engaged, edgeY: model.edgeY, previousDepth: model.previousDepth })}`, runtimeAnchors.progression)
          if (model.engaged >= 0) assertion(r, 'S2', uni.previousDepth >= 0 && uni.previousDepth <= uni.depth[model.engaged] + 1e-7, `shader mask depth ahead of leading face at ${t}: previous ${uni.previousDepth} vs stored ${uni.depth[model.engaged]}`, { file: 'src/scene/inspection/shaft/progression.ts', line: 286 })
          assertion(r, 'S2', s.teethPartial === partial && s.teethFormed === formed, `telemetry stock counts at ${t}: formed ${s.teethFormed}/${formed} partial ${s.teethPartial}/${partial}`, runtimeAnchors.stock)
        }
        assertion(r, 'S2', s.teethFormed >= last, `teeth regression at ${t}: ${last} -> ${s.teethFormed}`, runtimeAnchors.stock); last = s.teethFormed
        assertion(r, 'S2', s.cutter.visible === (t > 2 && t < 15), `cutter visibility at ${t}: ${s.cutter.visible}`, runtimeAnchors.cutter)
        assertion(r, 'S2', !!tuple.chip && (!tuple.chip.visible || (s.cutter.visible && model.cutting && model.engaged >= 0)), `chip visible outside material removal at ${t}`, { file: 'src/scene/inspection/shaft/shaftRuntime.ts', line: 395 })
      }
      assertion(r, 'S2', last === 10, `teeth formed by 15: ${last}`, runtimeAnchors.stock)
      // Causal no-removal pass: inside wholly disengaged intervals nothing may advance and
      // engagement must be absent; every depth gain must map to a counted engagement.
      for (let i = 0; i + 1 < r.measures.sweep.length; i++) {
        const a = r.measures.sweep[i], b = r.measures.sweep[i + 1]
        if (!a.uniform || !b.uniform) continue
        const scan = intervalScan(a.t, b.t)
        if (scan.whollyDisengaged) {
          const drift = Math.max(...a.uniform.depth.map((d, j) => Math.abs(d - b.uniform.depth[j])))
          assertion(r, 'S2', drift <= 1e-7 && a.uniform.engaged === -1 && b.uniform.engaged === -1 && a.teethPartial === b.teethPartial, `wholly disengaged interval ${a.t}..${b.t} advanced stock: drift ${drift}, engaged ${a.uniform.engaged}/${b.uniform.engaged}`, { file: 'src/scene/inspection/shaft/kinematics.ts', line: 489 })
        }
        for (let space = 0; space < a.uniform.depth.length; space++) {
          if (b.uniform.depth[space] > a.uniform.depth[space] + 1e-7) {
            const engaged = scan.cuts.some(cut => cut.engaged === space)
            assertion(r, 'S2', engaged, `space ${space} gained depth ${a.uniform.depth[space]} -> ${b.uniform.depth[space]} at ${a.t}..${b.t} without counted engagement`, { file: 'src/scene/inspection/shaft/kinematics.ts', line: 224 })
          }
        }
      }
      for (const t of [slow[0], (slow[0] + slow[1]) / 2, slow[1]]) {
        const tuple = await seek(page, t)
        const matrices = await page.evaluate(() => new Promise(resolve => { const a = []; let last = -1; function tick() { const f = window.__shaftVerify.last; if (f.frames !== last) { last = f.frames; a.push(f.matrix) } if (a.length === 3) return resolve(a); requestAnimationFrame(tick) } requestAnimationFrame(tick) }))
        const delta = Math.max(...matrices.flatMap(m => m.map((v, i) => Math.abs(v - matrices[0][i]))))
        r.measures.slowExit.push({ t, stroke: tuple.probe.shaft.cutter.stroke, edgeY: tuple.probe.shaft.cutter.stroke + tool.SHAPER_THICKNESS_MM / 2, cameraDelta: delta, matrices })
        assertion(r, 'S2', delta <= 1e-12, `paused slow-exit camera moved ${delta} at ${t}`, { file: 'src/scene/inspection/shaft/camera.ts', line: 141 })
      }
      const edges = r.measures.sweep.filter(f => f.t >= slow[0] && f.t <= slow[1]).map(f => f.edgeY)
      assertion(r, 'S2', Math.min(...edges) < 9.875 && Math.max(...edges) > 9.875, `slow exit did not cross last tooth 9.875 mm: ${Math.min(...edges)}..${Math.max(...edges)}`, { file: 'src/scene/inspection/shaft/kinematics.ts', line: 472 })
      // Report-only: the authored camera blends its 7.2 and 9.7 anchors (dist 0.2 -> 0.2035,
      // fov 5.4 -> 5.5), so a small drift across the window is intended; per-time paused
      // stability above is the spec check.
      r.measures.slowExitDrift = Math.max(...r.measures.slowExit.flatMap(s => s.matrices[0].map((v, i) => Math.abs(v - r.measures.slowExit[0].matrices[0][i]))))
      // JG-035 S1 composition: cutter on the viewer's right through the isolate/shaping/slow-exit beats (incl. 8.4 s).
      r.measures.cutterComposition = []
      for (const t of [3, 4, 6, 8.4, 10.5]) {
        await seek(page, t)
        const comp = await cutterComposition(page, t)
        r.measures.cutterComposition.push({ t, method: 'scene-graph projection (shaper-cutter vs shaft axis through live camera)', ...comp })
        assertion(r, 'S2', !comp.error && comp.shaperVisible === true, `cutter composition probe unavailable at ${t}: ${JSON.stringify(comp)}`, { file: 'src/scene/inspection/shaft/camera.ts', line: 49 })
        if (!comp.error) {
          assertion(r, 'S2', comp.cutterNdcX - comp.axisNdcX > 0.1, `cutter not to the viewer's right of the shaft at ${t}: dx ${comp.cutterNdcX - comp.axisNdcX}`, { file: 'src/scene/inspection/shaft/camera.ts', line: 49 })
          assertion(r, 'S2', comp.depthDiffMm <= 1.55, `cutter and shaft not at equal camera depth at ${t}: ${comp.depthDiffMm} mm`, { file: 'src/scene/inspection/shaft/camera.ts', line: 49 })
        }
      }
    })
    await step(r, 'S3', async () => {
      const times = new Set([0, 11, 12, 14.9, 15, 17.79, 17.8, 20.29, 20.3, 22.59, 22.6, 24.9, 25, 32, 32.79, 32.8, 33.19, 33.2, 33.4, 34.7, 35, 40])
      for (const a of copyOracle.attempts) for (const offset of [.14, .8, copyOracle.fade + copyOracle.readable - .01, copyOracle.fade + copyOracle.readable + .01, copyOracle.fade + copyOracle.readable + copyOracle.impulse + .01, 1.5]) times.add(a.start + offset)
      // Settled mid-attempt samples (clear of both 0.28 s marker-ease windows) carry the authored per-alloy FOS.
      const fosMid = {}
      for (const a of copyOracle.attempts) times.add(+((a.start + a.end) / 2).toFixed(3))
      for (const t of [...times].sort((a, b) => a - b)) {
        const tuple = await seek(page, t), expected = script.sampleShaftScript(t, false, script.createShaftScriptFrame()), s = tuple.probe.shaft, dom = tuple.dom
        const independent = independentCopyAt(t)
        r.measures.cards.push({ t, independent, expected: clone(expected), shaft: s, dom })
        // The stress era has no caption: card/stamp/attribution/recap remain exact copy; the old
        // [data-shaft-stress] caption must not exist (its replacement is the FOS panel set below).
        for (const field of ['card', 'stamp', 'attribution', 'recap']) assertion(r, 'S3', dom[field] === independent[field], `${field} at ${t}: ${JSON.stringify(dom[field])} != independent literal ${JSON.stringify(independent[field])}`, { file: 'src/components/ShaftStoryLayer.tsx', line: 60 })
        assertion(r, 'S3', await page.locator('[data-shaft-stress]').count() === 0, `removed stress caption element [data-shaft-stress] is back at ${t}`, { file: 'src/components/ShaftStoryLayer.tsx', line: 108 })
        assertion(r, 'S3', s.card.id === independent.id && s.card.stamp === independent.stampState, `independent card/FAILED timing mismatch at ${t}: ${JSON.stringify(s.card)} vs ${JSON.stringify(independent)}`, runtimeAnchors.card)
        assertion(r, 'S3', s.stress.kind === independent.stressKind, `independent stress timing mismatch at ${t}: ${s.stress.kind}/${independent.stressKind}`, runtimeAnchors.stress)
        assertion(r, 'S3', s.card.id === expected.card && s.card.stamp === expected.stamp && s.stress.kind === expected.stress && dom.card === expected.cardText, `DOM/telemetry sampler agreement mismatch at ${t}`, runtimeAnchors.card)
        assertion(r, 'S3', !/\b(?:MPa|GPa|psi|ksi|von\s+mises|FEA\s*[:=]?\s*\d)|\d+(?:\.\d+)?\s*(?:MPa|GPa|psi|ksi|N\/mm)/i.test(dom.dialogText), `FEA numbers in dialog at ${t}`, { file: 'src/components/ShaftStoryLayer.tsx', line: 71 })
        // Owner asked for no disclaimer: textContent (hidden transcript and live-region included) must not contain one.
        assertion(r, 'S3', !fosOracle.disclaimer.test(dom.dialogText), `disclaimer/'illustrative' text present at ${t}: ${(dom.dialogText.match(fosOracle.disclaimer) || [''])[0]}`, { file: 'src/components/ShaftStoryLayer.tsx', line: 108 })
        const measuredFos = checkFosPanels(r, t, tuple, independent)
        const mid = copyOracle.attempts.find(a => +((a.start + a.end) / 2).toFixed(3) === t)
        if (mid) fosMid[mid.id] = measuredFos
      }
      r.measures.fosMid = fosMid
      // Authored values and ordering, from the DOM the viewer actually reads: all attempts < 1.0 and 4140 < 4340 < C300.
      for (const a of copyOracle.attempts) {
        const m = fosMid[a.id]
        assertion(r, 'S3', !!m && Number.isFinite(m.marker) && Math.abs(m.marker - fosOracle.attempts[a.id]) <= .0051 && m.marker < 1 && m.opacity >= .99, `${a.id} mid-attempt FOS panel ${JSON.stringify(m)} != authored ${fosOracle.attempts[a.id]} (<1.0, opaque)`, { file: 'src/scene/inspection/shaft/fosPresentation.ts', line: 18 })
      }
      assertion(r, 'S3', fosMid['4140']?.marker < fosMid['4340']?.marker && fosMid['4340']?.marker < fosMid.c300?.marker && fosMid.c300?.marker < 1, `FOS not ordered 4140 < 4340 < C300 < 1.0: ${JSON.stringify(Object.fromEntries(Object.entries(fosMid).map(([k, v]) => [k, v?.marker])))}`, { file: 'src/scene/inspection/shaft/fosPresentation.ts', line: 18 })
    })
    await step(r, 'S4', async () => {
      r.measures.hobbing = []
      for (const t of [24.9, 25, 25.1, 28, 31.9, 31.99, 32, 32.2, 32.6, 32.79, 32.8, 35]) {
        const tuple = await seek(page, t), s = tuple.probe.shaft
        r.measures.hobbing.push({ t, shaft: s })
        assertion(r, 'S4', s.hob.visible === (t > 25 && t < 32), `hob visibility at ${t}: ${s.hob.visible}`, runtimeAnchors.hob)
        if (t >= 32) assertion(r, 'S4', s.teethFormed === 10, `approved teeth at ${t}: ${s.teethFormed}`, runtimeAnchors.stock)
        if (t >= 32 && t < 32.8) {
          assertion(r, 'S4', !s.cutter.visible, `cutter obscures runout at ${t}`, runtimeAnchors.cutter)
          assertion(r, 'S4', !s.hob.visible, `hob obscures runout at ${t}`, runtimeAnchors.hob)
          assertion(r, 'S4', s.stress.kind === 'none' && s.stress.mix === 0 && tuple.dom.fos.modelCount === 0 && tuple.dom.fos.barCount === 0, `stress field or FOS panels obscure runout at ${t}: ${JSON.stringify({ kind: s.stress.kind, mix: s.stress.mix, model: tuple.dom.fos.modelCount, bar: tuple.dom.fos.barCount })}`, runtimeAnchors.stress)
        }
      }
    })
    await step(r, 'S5', async () => {
      r.measures.supports = []
      for (const t of [1.2, 2, 15, 25, 35, 35.6, 36.6, 37.6, 38.5, 39, 40, 41, 43]) {
        const tuple = await seek(page, t), p = tuple.probe, s = p.shaft
        r.measures.supports.push({ t, shaft: s, narrativeAlpha: p.narrativeAlpha, narrativeVisibleMeshes: p.narrativeVisibleMeshes })
        assertion(r, 'S5', p.narrativeAlpha === 0 && p.narrativeVisibleMeshes === 0 && s.narrative.alpha === 0, `narrative visible after entry fade at ${t}: ${p.narrativeAlpha}/${p.narrativeVisibleMeshes}`, runtimeAnchors.narrative)
        if (t >= 37.6) { assertion(r, 'S5', near(s.supports.deltaYmm, 2.75, .005), `support shift at ${t}: ${s.supports.deltaYmm} mm`, runtimeAnchors.supports); assertion(r, 'S5', s.supports.endpointHeld === true, `support endpoint not held at ${t}`, runtimeAnchors.endpoint) }
        if (t >= 40) assertion(r, 'S5', s.finale.assembled === true && s.finale.shaftCount === 1, `finale at ${t}: ${JSON.stringify(s.finale)}`, runtimeAnchors.finale)
      }
    })
    await step(r, 'S6', async () => {
      for (const [i, chapter] of story.shaftStory.chapters.entries()) {
        await page.getByRole('button', { name: chapter.label, exact: true }).click(); await settle(page, chapter.start)
        const start = await read(page)
        assertion(r, 'S6', start.probe.chapter === i && near(start.probe.time, chapter.start), `${chapter.label} start ${start.probe.time}/${start.probe.chapter}`)
        await page.getByRole('button', { name: 'Play sequence', exact: true }).click()
        await page.waitForFunction(target => window.__inspection.sampledTime >= target, chapter.start + 1, { timeout: 15000 })
        await page.getByRole('button', { name: 'Pause', exact: true }).click()
        const t = await page.evaluate(() => window.__inspection.time); await settle(page, t)
        const played = digest(await read(page)), direct = digest(await seek(page, t))
        r.measures.determinism.push({ chapter: chapter.id, t, played, direct })
        assertion(r, 'S6', JSON.stringify(played) === JSON.stringify(direct), `play versus seek differs in ${chapter.id} at ${t}`)
      }
      // Click and snapshot in one browser task, before a playback rAF can advance zero.
      const reset = await page.evaluate(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Replay'); if (!button) throw new Error('Replay control missing'); button.click(); return { time: window.__inspection.time, playing: window.__inspection.playing } })
      await page.getByRole('button', { name: 'Pause', exact: true }).click()
      r.measures.replay = reset
      assertion(r, 'S6', reset.time === 0 && reset.playing, `Replay reset ${JSON.stringify(reset)}`)
    })
    await step(r, 'S8', async () => {
      const shotTimes = { isolate: 1.5, shaping: 4, 'slow-exit': 8.4, 'cutter-exit': 9.2, recap: 12, materials: 16.5, 'revised-blank': 23.8, hobbing: 28, runout: 32.4, 'cool-stress': 34, 'support-before': 35.5, supports: 38, finale: 41 }
      for (const [label, t] of Object.entries(shotTimes)) await capture(page, r, label, t)
    })
    if (!narrow) {
      try { for (const [a, b] of [[2, 15], [25, 32]]) r.measures.playback.push(await playWindow(page, a, b)) }
      catch (e) { r.measures.playbackFailure = String(e); report.harnessLimitations.push({ case: r.name, reportOnly: true, detail: `rAF interval sampling: ${e}` }) }
    }
    await step(r, 'S7', async () => {
      r.measures.restores.push(compareRestore(r, r.before, await leave(page), 'blueprint Return'))
      for (const [mode, exit] of [['blueprint', 'Escape'], ['exploded', 'Return'], ['exploded', 'Escape']]) {
        const requestsBefore = r.requests.length, before = await enter(page, mode)
        await assertFactoryBinding(page, r, mode, before)
        const transitions = await page.evaluate(() => window.__shaftVerify.transitions)
        r.measures.readiness.push({ mode, transitions })
        if (mode === 'exploded') { const names = transitions.map(x => x.status); assertion(r, 'S1', names.indexOf('loading') >= 0 && names.indexOf('compiling') > names.indexOf('loading') && names.indexOf('ready') > names.indexOf('compiling'), `exploded readiness order ${names}`); assertion(r, 'S1', r.requests.length - requestsBefore <= 1, `multiple core requests in exploded session ${r.requests.length - requestsBefore}`) }
        await seek(page, 38)
        r.measures.restores.push(compareRestore(r, before, await leave(page, exit), `${mode} ${exit}`))
      }
      // Warm once, then census three subsequent complete enter/play/Return cycles.
      await enter(page); await seek(page, 41); await leave(page); const baseline = await census(page)
      r.measures.census.push({ label: 'warmed baseline', ...baseline })
      for (let i = 1; i <= 3; i++) {
        await enter(page); await page.getByRole('button', { name: 'Play sequence', exact: true }).click(); await page.waitForTimeout(1100); await page.getByRole('button', { name: 'Pause', exact: true }).click(); await seek(page, 41); await leave(page)
        const count = await census(page); r.measures.census.push({ label: `cycle ${i}`, ...count })
        for (const field of ['geometries', 'textures', 'programs']) assertion(r, 'S7', count[field] <= baseline[field], `renderer ${field} grew ${baseline[field]} -> ${count[field]} cycle ${i}`, runtimeAnchors.dispose)
      }
    })
    assertion(r, 'S1', r.errors.length === 0, `${r.errors.length} console/page errors: ${JSON.stringify(r.errors.slice(0, 3))}`)
    assertion(r, 'S1', r.navigations.length === 0, `unexpected navigations ${JSON.stringify(r.navigations)}`)
  } catch (e) { report.harnessLimitations.push({ case: r.name, detail: e.stack || String(e) }); for (const id of ['S1','S2','S3','S4','S5','S6','S7','S8']) assertion(r, id, false, `Case setup/continuation failed: ${e}`) }
  finally { await session?.close() }
  console.log(JSON.stringify({ case: r.name, gates: Object.fromEntries(Object.entries(r.gates).map(([k, g]) => [k, { pass: g.pass, failureCount: g.failureCount, first: g.failures[0] }])) }))
  await persist()
}
async function staticCase(narrow, kind) {
  const r = { name: `${narrow ? 'narrow' : 'desktop'}-${kind}-static`, gates: {}, measures: {} }; report.cases.push(r)
  let session
  try {
    session = await fresh(r, { reduced: kind === 'reduced', poster: kind === 'poster' }); const { page } = session
    await step(r, 'S8', async () => {
      await page.getByRole('button', { name: 'Inspect the input shaft' }).focus(); await page.keyboard.press('Enter')
      let dialogOpen = true
      try { await page.getByRole('dialog').waitFor({ timeout: 15000 }) } catch { dialogOpen = false }
      r.measures.dialogOpened = dialogOpen
      r.measures.entryErrors = r.errors.slice(0, 5)
      const storyMissing = r.errors.some(e => /shaft inspection is not available/i.test(e.text ?? ''))
      assertion(r, 'S8', dialogOpen, storyMissing
        ? 'poster shaft entry threw before the static dialog: story.ts:88 via inspectionStore.ts:53 / RingInspection.tsx:155; canvas-only registration InspectionScene.tsx:16'
        : `static dialog did not open in ${kind} mode`, { file: storyMissing ? 'src/scene/inspection/story.ts' : 'src/components/RingInspection.tsx', line: storyMissing ? 88 : 155 })
      if (!dialogOpen) { await page.screenshot({ path: path.join(out, `${r.name}-entry-failure.png`) }); return }
      await page.locator('.shaft-static').waitFor({ state: 'visible', timeout: 15000 }); await page.waitForTimeout(1000)
      Object.assign(r.measures, await page.evaluate(() => ({ staticCount: document.querySelectorAll('.shaft-static').length, transcript: document.querySelector('.shaft-static')?.textContent, probe: JSON.parse(JSON.stringify(window.__inspection)), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, webgl2Undefined: typeof WebGL2RenderingContext === 'undefined' })))
      const text = r.measures.transcript || ''
      assertion(r, 'S8', r.measures.staticCount === 1 && text.includes('AISI 4140') && text.includes('AISI 4340') && text.includes('C300') && text.includes('2.75'), `static transcript incomplete ${JSON.stringify(text)}`)
      assertion(r, 'S8', !fosOracle.disclaimer.test(text) && /below 1\.0/.test(text), `static shaft copy must state FOS below 1.0 and carry no disclaimer ${JSON.stringify(text.slice(0, 400))}`)
      r.measures.livePanels = await page.evaluate(() => ({ fosModel: document.querySelectorAll('[data-shaft-fos-model]').length, fosBar: document.querySelectorAll('[data-shaft-fos-bar]').length, canvases: document.querySelectorAll('canvas').length }))
      assertion(r, 'S8', r.measures.livePanels.fosModel === 0 && r.measures.livePanels.fosBar === 0, `static shaft dialog mounted live FOS panels (stills only) ${JSON.stringify(r.measures.livePanels)}`)
      assertion(r, 'S8', r.errors.length === 0, `${kind} static console/page errors ${JSON.stringify(r.errors.slice(0, 3))}`)
      await page.screenshot({ path: path.join(out, `${r.name}.png`) })
      await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' })
      await page.waitForTimeout(300)
    })
    r.measures.network = { allCAD: r.allCAD, inspection: r.inspectionRequests, narrative: r.narrativeRequests, throughExit: true, reducedNarrativeV4: kind === 'reduced' && r.narrativeRequests.length ? 'Owner choice unresolved; this S8 inspection-only check does not waive lifecycle V4 zero-CAD policy.' : null }
    if (kind === 'poster') assertion(r, 'S8', r.allCAD.length === 0, `poster requested CAD/tool assets navigation through exit ${JSON.stringify(r.allCAD)}`, { file: 'src/App.tsx', line: 37 })
    else assertion(r, 'S8', r.inspectionRequests.length === 0, `reduced static requested inspection manufacturing/knurling assets navigation through exit ${JSON.stringify(r.inspectionRequests)}`, { file: 'src/components/RingInspection.tsx', line: 52 })
  } catch (e) { assertion(r, 'S8', false, String(e)); report.harnessLimitations.push({ case: r.name, detail: String(e) }) }
  finally { await session?.close() }
  console.log(JSON.stringify({ case: r.name, gate: r.gates.S8 }))
  await persist()
}
async function explodedReadiness(narrow) {
  const r = { name: `${narrow ? 'narrow' : 'desktop'}-exploded-readiness`, gates: {}, measures: {} }; report.cases.push(r)
  let session
  try {
    session = await fresh(r); const { page } = session
    await step(r, 'S1', async () => {
      const before = await enter(page, 'exploded')
      await assertFactoryBinding(page, r, 'exploded', before)
      r.measures = await page.evaluate(() => ({ transitions: window.__shaftVerify.transitions, prematurePlay: window.__shaftVerify.prematurePlay, materialMode: window.__telemetry.scroll.materialMode }))
      const names = r.measures.transitions.map(x => x.status)
      assertion(r, 'S1', r.measures.materialMode === 'exploded', `entry mode ${r.measures.materialMode}`)
      assertion(r, 'S1', names.indexOf('loading') >= 0 && names.indexOf('compiling') > names.indexOf('loading') && names.indexOf('ready') > names.indexOf('compiling'), `fresh exploded readiness ${names}`)
      assertion(r, 'S1', r.measures.prematurePlay.length > 0 && r.measures.prematurePlay.every(x => !x.playing && x.disabled === true), `fresh exploded Play before readiness ${JSON.stringify(r.measures.prematurePlay.slice(0, 4))}`)
      assertion(r, 'S1', r.requests.length === 1 && /manufacturing-core-(full|lite)\.glb$/.test(r.requests[0]?.url ?? ''), `fresh exploded core requests ${JSON.stringify(r.requests)}`)
      assertion(r, 'S1', r.errors.length === 0, `fresh exploded errors ${JSON.stringify(r.errors)}`)
      await leave(page)
    })
  } catch (e) { assertion(r, 'S1', false, String(e)); report.harnessLimitations.push({ case: r.name, detail: String(e) }) }
  finally { await session?.close() }
  console.log(JSON.stringify({ case: r.name, gate: r.gates.S1 })); await persist()
}
async function negative(narrow, kind, gate) {
  const r = { name: `${narrow ? 'narrow' : 'desktop'}-${kind}`, gates: {}, measures: {} }; report.cases.push(r)
  let session
  try {
    session = await fresh(r); const { page } = session
    await step(r, gate, async () => {
      const trigger = page.getByRole('button', { name: 'Inspect the input shaft' })
      if (kind === 'denied-fetch') {
        const denied = []
        const abort = route => { denied.push(route.request().url()); return route.abort('failed') }
        await page.route('**/models/manufacturing-core-*.glb', abort)
        await trigger.click(); await page.getByRole('dialog').waitFor()
        await page.waitForFunction(() => window.__inspection?.status === 'error', null, { timeout: 120000 })
        const failed = await read(page)
        assertion(r, gate, denied.length > 0 && !failed.probe.playing && failed.probe.suspend === 'error', `denied shaft error state ${JSON.stringify(failed.probe)}`)
        const visibleError = page.getByRole('dialog').locator('p[role="status"]').filter({ hasText: 'The study could not load. Return or try again.' })
        const errorCount = await visibleError.count(), errorVisible = errorCount === 1 && await visibleError.isVisible(), errorText = errorCount === 1 ? await visibleError.textContent() : null
        assertion(r, gate, errorVisible && errorText === 'The study could not load. Return or try again.', `denied load has no visible exact error content: ${JSON.stringify({ errorVisible, errorText })}`, { file: 'src/components/RingInspection.tsx', line: 165 })
        await page.screenshot({ path: path.join(out, `${r.name}-visible-error.png`) })
        assertion(r, gate, await page.getByRole('button', { name: 'Try again', exact: true }).isEnabled(), 'retry unavailable after denied shaft load')
        await leave(page)
        assertion(r, gate, await trigger.evaluate(b => document.activeElement === b), 'denied shaft Return focus not restored')
        await trigger.click(); await page.getByRole('dialog').waitFor(); await page.waitForFunction(() => window.__inspection.status === 'error', null, { timeout: 120000 })
        await page.unroute('**/models/manufacturing-core-*.glb', abort)
        await page.getByRole('button', { name: 'Try again', exact: true }).click()
        await page.waitForFunction(() => window.__inspection.status === 'ready', null, { timeout: 120000 }); await settle(page, 0)
        const recovered = await read(page)
        assertion(r, gate, recovered.probe.loaded && recovered.probe.kind === 'shaft', 'retry did not recover the shaft runtime')
        await leave(page)
        // Only the network errors tied to deliberately denied URLs are expected.
        r.expectedErrors = r.errors.filter(e => e.type === 'console' && denied.includes(e.location?.url) && /Failed to load resource: net::ERR_FAILED/.test(e.text))
        r.errors = r.errors.filter(e => !r.expectedErrors.includes(e))
        r.measures = { denied, failed, recovered, visibleError: { visible: errorVisible, text: errorText, file: `${r.name}-visible-error.png` } }
      } else if (kind === 'late-successful-bytes') {
        await page.evaluate(() => { const original = Response.prototype.arrayBuffer; window.__shaftByteGate = { armed: true, pending: false, released: false }; Response.prototype.arrayBuffer = async function(...args) { const data = await original.apply(this, args); const gate = window.__shaftByteGate; if (gate.armed && this.url.includes('manufacturing-core')) { gate.armed = false; gate.pending = true; gate.bytes = data.byteLength; await new Promise(resolve => { gate.release = () => { gate.released = true; resolve() } }) } return data } })
        await trigger.click(); await page.getByRole('dialog').waitFor(); await page.waitForFunction(() => window.__shaftByteGate.pending, null, { timeout: 30000 })
        const epochA = await page.evaluate(() => window.__inspection.session)
        await leave(page)
        await enter(page); await seek(page, 8.4)
        const before = await read(page), beforeCensus = await census(page)
        const sceneCensus = () => page.evaluate(() => { let roots = 0, meshes = 0; window.__threeScene.traverse(o => { if (o.name === 'manufacturing-study-root') roots++; if (o.isMesh) meshes++ }); return { roots, meshes } })
        const beforeScene = await sceneCensus()
        await page.evaluate(() => window.__shaftByteGate.release()); await page.waitForTimeout(800)
        const after = await read(page), afterCensus = await census(page), afterScene = await sceneCensus()
        const cameraDelta = Math.max(...before.renderFrame.matrix.map((v, i) => Math.abs(v - after.renderFrame.matrix[i])))
        const byteGate = await page.evaluate(() => ({ released: window.__shaftByteGate.released, bytes: window.__shaftByteGate.bytes }))
        assertion(r, gate, byteGate.released && byteGate.bytes > 0, 'late successful shaft bytes were not delivered')
        assertion(r, gate, before.probe.session > epochA && after.probe.session === before.probe.session && after.probe.status === 'ready' && after.probe.kind === 'shaft', 'late success corrupted new shaft epoch')
        const censusFields = c => ({ geometries: c.geometries, textures: c.textures, programs: c.programs })
        assertion(r, gate, cameraDelta === 0 && JSON.stringify(beforeScene) === JSON.stringify(afterScene) && beforeScene.roots === 1 && JSON.stringify(censusFields(beforeCensus)) === JSON.stringify(censusFields(afterCensus)), `late success changed camera/resources ${cameraDelta}/${JSON.stringify({ beforeScene, afterScene, beforeCensus, afterCensus })}`)
        r.measures = { epochA, before, after, cameraDelta, byteGate, beforeScene, afterScene, beforeCensus, afterCensus }
        await leave(page)
      } else if (kind === 'paused-hidden-visible') {
        await enter(page); await seek(page, 8.4)
        await page.getByRole('button', { name: 'Play sequence', exact: true }).click(); await page.waitForTimeout(500); await page.getByRole('button', { name: 'Pause', exact: true }).click()
        const t = await page.evaluate(() => window.__inspection.time); await settle(page, t); const before = await read(page)
        await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
        await page.waitForTimeout(600); const hidden = await read(page)
        await page.evaluate(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
        await page.waitForTimeout(600); const visible = await read(page)
        assertion(r, gate, !hidden.probe.playing && !visible.probe.playing && hidden.probe.time === before.probe.time && visible.probe.time === before.probe.time, `manual pause lost across hidden/visible ${JSON.stringify({ before: before.probe.time, hidden: hidden.probe.time, visible: visible.probe.time, playing: visible.probe.playing })}`)
        r.measures = { before, hidden, visible }; await leave(page)
      } else if (kind === 'real-context-loss') {
        await enter(page); await seek(page, 28); await page.getByRole('button', { name: 'Play sequence', exact: true }).click(); await page.waitForTimeout(400)
        const before = await read(page)
        // Instrument the shaft-owned resources themselves: the study root's removal and
        // one owned geometry's disposal. The legacy ring 'disposed' counter never moves
        // for shaft sessions and must not be used as evidence.
        await page.evaluate(() => {
          window.__shaftLost = 0
          document.addEventListener('webglcontextlost', e => { if (e.target?.isConnected) window.__shaftLost++ }, true)
          const root = window.__threeScene.getObjectByName('manufacturing-study-root')
          if (!root) throw new Error('manufacturing-study-root missing before context loss')
          const disposal = window.__shaftDisposal = { removals: 0, chipGeometryDisposals: 0 }
          const originalRemove = root.removeFromParent.bind(root)
          root.removeFromParent = () => { disposal.removals++; return originalRemove() }
          const chip = root.getObjectByName('shaft-single-rake-chip')
          if (!chip) throw new Error('shaft chip mesh missing before context loss')
          const originalDispose = chip.geometry.dispose.bind(chip.geometry)
          chip.geometry.dispose = () => { disposal.chipGeometryDisposals++; return originalDispose() }
          const c = document.querySelector('canvas[data-engine]'); const ext = c?.getContext('webgl2')?.getExtension('WEBGL_lose_context'); if (!ext) throw new Error('WEBGL_lose_context unavailable'); ext.loseContext()
        })
        await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 20000 }); await page.waitForTimeout(1000)
        const after = await read(page)
        const environment = await page.evaluate(() => ({ contextLost: window.__shaftLost, disposal: window.__shaftDisposal ?? null, rootAttached: !!window.__threeScene?.getObjectByName?.('manufacturing-study-root'), resources: window.__inspection.resources ?? null, focus: document.activeElement?.textContent?.trim() ?? '', triggerFocused: !!window.__shaftTriggerEl && document.activeElement === window.__shaftTriggerEl, rootInert: document.getElementById('root').inert, bodyOpen: document.body.classList.contains('ring-inspection-open') }))
        const resourcesZeroed = !environment.resources || Object.values(environment.resources).every(v => v === 0)
        assertion(r, gate, environment.contextLost === 1 && !after.probe.active, `real shaft context loss did not exit ${JSON.stringify({ contextLost: environment.contextLost, active: after.probe.active })}`)
        assertion(r, gate, environment.disposal?.removals === 1 && environment.disposal?.chipGeometryDisposals === 1 && !environment.rootAttached && resourcesZeroed, `real shaft context loss did not dispose owned resources exactly once ${JSON.stringify({ disposal: environment.disposal, rootAttached: environment.rootAttached, resources: environment.resources })}`, runtimeAnchors.dispose)
        assertion(r, gate, !environment.rootInert && !environment.bodyOpen && environment.triggerFocused, `context loss chrome/focus not restored ${JSON.stringify(environment)}`)
        await page.waitForTimeout(600); const later = await read(page)
        const laterEnvironment = await page.evaluate(() => ({ disposal: window.__shaftDisposal ?? null, rootAttached: !!window.__threeScene?.getObjectByName?.('manufacturing-study-root') }))
        assertion(r, gate, !later.probe.active && laterEnvironment.disposal?.removals === 1 && laterEnvironment.disposal?.chipGeometryDisposals === 1 && !laterEnvironment.rootAttached, 'real context loss double disposal/reentry')
        r.measures = { before, after, later, environment }
      }
      assertion(r, gate, r.errors.length === 0, `unexpected errors in ${kind}: ${JSON.stringify(r.errors.slice(0, 3))}`)
    })
  } catch (e) { assertion(r, gate, false, String(e)); report.harnessLimitations.push({ case: r.name, gate, detail: String(e) }) }
  finally { await session?.close() }
  console.log(JSON.stringify({ case: r.name, gate: r.gates[gate] })); await persist()
}
try { for (const narrow of [false, true]) { await dynamic(narrow); await explodedReadiness(narrow); await staticCase(narrow, 'reduced'); await staticCase(narrow, 'poster'); for (const [kind, gate] of [['denied-fetch','N1'],['late-successful-bytes','N2'],['real-context-loss','N3'],['paused-hidden-visible','N4']]) await negative(narrow, kind, gate) } }
finally { await browser.close(); report.finished = new Date().toISOString() }
for (const id of ['S1','S2','S3','S4','S5','S6','S7','S8','N1','N2','N3','N4']) {
  const cases = report.cases.filter(c => c.gates[id])
  report.gates[id] = { pass: cases.length >= 2 && cases.every(c => c.gates[id].pass), cases: cases.map(c => ({ name: c.name, ...c.gates[id] })) }
}
await persist()
await fs.writeFile(path.join(out, 'README.md'), `# Shaft runtime browser verification\n\n${report.command}\n\nRun ${report.started} to ${report.finished}. ${report.browser}; desktop 1440×900 and narrow 390×844.\n\n| Gate | Result |\n|---|---|\n${Object.entries(report.gates).map(([id, g]) => `| ${id} | ${g.pass ? 'PASS' : 'FAIL'} |`).join('\n')}\n\nFOS panels ([data-shaft-fos-model]/[data-shaft-fos-bar]/marker/range) are asserted against independent literals (4140 0.55, 4340 0.72, C300 0.90, eased over 0.28 s at the alloy swaps; revised study blue range with no number; no caption, no disclaimer). Cutter-right composition at 3/4/6/8.4/10.5 s is a scene-graph projection through the live camera (no screen-side telemetry field exists).\n\nreport.json preserves <=0.05 s shaping samples, exact cards, deterministic play/seek digests, restore snapshots, warmed renderer census, report-only desktop rAF percentiles and same-session screenshot tuples. Canvas PNGs are synchronous completed-frame readbacks with study-owned shaft draw callbacks and projected world bounds bound to the same session/time/render stamp. Literal owner-copy/timing expectations remain independent of the authored sampler. Node inventories all CAD/tool requests from navigation through exit: poster zero allCAD; reduced zero inspection manufacturing/knurling requests. Reduced narrative requests are reported separately and do not waive lifecycle V4. Entry mode and runtime-owned core asset selection bind requested/effective tier to creation, distinct from later adaptive tier.\n\nApp assertions and harness exceptions are retained separately. Authored-source SHA256 and verifier SHA256 identify this execution; source changes during a dev run can invalidate its acceptance provenance.\n`)
console.log(JSON.stringify({ report: path.join(out, 'report.json'), gates: Object.fromEntries(Object.entries(report.gates).map(([k, g]) => [k, g.pass])), defectCount: report.defects.length, harnessLimitations: report.harnessLimitations.length }))
if (Object.values(report.gates).some(g => !g.pass)) process.exitCode = 1
