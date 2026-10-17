import { createServer } from 'vite'
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launchBrowser, describeLaunch } from '../../scripts/lib/browser-launch.mjs'
import { pixels, compare } from '../../scripts/lib/preview-pixels.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const mode = process.argv[2] ?? 'candidate'
if (!['baseline', 'candidate'].includes(mode)) throw new Error('Use baseline or candidate')
const output = path.join(HERE, process.argv[3] ?? mode)
const perfOnly = process.argv.includes('--perf-only')
mkdirSync(output, { recursive: true })
const baseline = JSON.parse(readFileSync(path.join(ROOT, 'docs/webgl-review-2026-10-16/evidence/runtime-telemetry-probe.json')))
const owned = ['src/scene/SceneCanvas.tsx', 'src/scene/PostProcessingComposer.tsx', 'src/scene/rig/materials.ts', 'src/components/ToleranceStations.tsx', 'src/scene/TorqueWrenchHero.tsx']
const frozen = new Map(owned.map(f => [f, mode === 'baseline' ? execFileSync('git', ['show', `1d66ff2b91e8a55d21ea1afb401a3ad995553f4a:${f}`], { cwd: ROOT, encoding: 'utf8' }) : readFileSync(path.join(ROOT, f), 'utf8')]))
const hash = text => createHash('sha256').update(text).digest('hex')
const report = {
  mode, capturedAt: new Date().toISOString(), launchDescription: describeLaunch(),
  viewport: baseline.viewport, sourceHashes: Object.fromEntries([...frozen].map(([f, s]) => [f, hash(s)])),
  method: 'Frozen five source modules through a Vite pre-load plugin; candidate freezes worktree bytes, baseline freezes clean pre-task HEAD. Identical observation and diagnostic closure exposure in both. Matching real Lenis seeks use rawScrollFor(p), with historical explode/ghost-state gates. qualityLock prevents tier degradation but preserves adaptive DPR. Diagnostic DPR/tier/R5 probes are explicitly forced, separate from matching capture sweep.',
  historicalBaselineActualDpr: baseline.baseline.webgl.pixelRatio,
  errors: [], checks: [], stops: [],
}
function record(name, pass, details) { report.checks.push({ name, pass: Boolean(pass), details }) }
let browser, server
try {
  server = await createServer({ root: ROOT, logLevel: 'warn', server: { host: 'localhost', port: 5199, strictPort: true, hmr: false, watch: null }, plugins: [{
    name: 'review-frozen-source-and-observation', enforce: 'pre',
    load(id) {
      const normalized = id.split('?')[0].replaceAll('\\', '/')
      const file = owned.find(f => normalized === path.join(ROOT, f).replaceAll('\\', '/'))
      if (!file) return null
      let source = frozen.get(file)
      if (file.endsWith('PostProcessingComposer.tsx')) source = source.replace('<EffectComposer ', '<EffectComposer ref={(value: any) => { (window as any).__reviewComposer = value }} ')
      if (file.endsWith('rig/materials.ts')) source += '\nexport { MeshBasicMaterial as ReviewBasic, WebGLRenderTarget as ReviewTarget, NoToneMapping as ReviewNoTone, Color as ReviewColor } from "three"\n'
      if (file.endsWith('SceneCanvas.tsx')) {
        const component = source.indexOf('export function SceneCanvas()')
        const returned = source.indexOf('  return (', component)
        source = source.slice(0, returned) + '  ;(window as any).__reviewSetDprStep = setDprStep\n' + source.slice(returned)
      }
      return source
    },
  }] })
  await server.listen()
  browser = await launchBrowser(chromium)
  report.browserVersion = browser.version()
  const context = await browser.newContext({ viewport: { width: baseline.viewport.width, height: baseline.viewport.height }, deviceScaleFactor: baseline.viewport.deviceScaleFactor })
  const page = await context.newPage()
  page.on('pageerror', e => report.errors.push({ kind: 'pageerror', message: String(e) }))
  page.on('console', m => { if (m.type() === 'error') report.errors.push({ kind: 'console', message: m.text() }) })
  page.on('response', r => { if (r.status() >= 400) report.errors.push({ kind: 'http', message: `${r.status()} ${r.url()}` }) })
  await page.addInitScript(() => {
    window.__reviewContextLoss = []
    document.addEventListener('webglcontextlost', e => { if (e.target.isConnected) window.__reviewContextLoss.push({ tag: e.target.tagName, at: performance.now() }) }, true)
  })
  await page.addInitScript(mode => { window.__reviewMode = mode }, mode)
  const start = Date.now()
  await page.goto('http://localhost:5199/?qualityLock=1&qualityDiagnostics=1', { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__telemetry?.performance?.warmReady && window.__threeRenderer && window.__reviewComposer, null, { timeout: 240000 })
  report.warmMs = Date.now() - start
  console.log(`${mode}: warm ready after ${report.warmMs}ms`)
  const snapshot = () => page.evaluate(() => {
    const renderer = window.__threeRenderer, scene = window.__threeScene, composer = window.__reviewComposer
    const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const sampleList = format => Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, format, gl.SAMPLES) ?? [])
    const mats = new Map()
    scene.traverse(o => { if (o.isMesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && !mats.has(m.uuid)) { const uniforms = renderer.properties.get(m).uniforms; mats.set(m.uuid, { uuid: m.uuid, name: m.name, type: m.type, envMapIntensity: m.envMapIntensity, compiledSceneEnvIntensity: uniforms?.envMapIntensity?.value, compiledRoleEnvGain: uniforms?.uRoleEnvGain?.value, roughness: m.roughness, key: m.customProgramCacheKey(), transparent: m.transparent }) } })
    const buffer = b => b && ({ width: b.width, height: b.height, samples: b.samples, stencilBuffer: b.stencilBuffer, type: b.texture.type })
    return {
      telemetry: structuredClone(window.__telemetry), qualityEvents: window.__qualityEvents?.(),
      webgl: { vendor: dbg && gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL), renderer: dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL), contextAttributes: gl.getContextAttributes(), maxSamples: gl.getParameter(gl.MAX_SAMPLES), rgba16fSamples: sampleList(gl.RGBA16F), drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], pixelRatio: renderer.getPixelRatio() },
      scene: { environmentIntensity: scene.environmentIntensity, environment: scene.environment && { uuid: scene.environment.uuid, width: scene.environment.image?.width, height: scene.environment.image?.height }, fogNear: scene.fog?.near, fogFar: scene.fog?.far },
      composer: composer && { input: buffer(composer.inputBuffer), output: buffer(composer.outputBuffer), passes: composer.passes.map(p => ({ type: p.constructor.name, enabled: p.enabled, renderToScreen: p.renderToScreen, dithering: p.dithering, effects: p.effects?.map(e => e.name) })) },
      materials: [...mats.values()], programs: renderer.info.programs?.map(p => ({ id: p.id, cacheKey: p.cacheKey, runnable: p.diagnostics?.runnable })),
      contextLoss: window.__reviewContextLoss,
    }
  })
  report.baseline = await snapshot()
  if (perfOnly) {
    await page.evaluate(() => window.__reviewSetDprStep(window.__reviewMode === 'candidate' ? 2 : 3))
    await page.waitForTimeout(500)
    report.perfRuns = []
    for (let run = 0; run < 4; run++) {
      await page.evaluate(async () => { const { rawScrollFor } = await import('/src/scene/drawing/introTimeline.ts'); window.__lenis.scrollTo((document.documentElement.scrollHeight - innerHeight) * rawScrollFor(0.12), { immediate: true }) })
      await page.waitForTimeout(1500)
      const sweep = await page.evaluate(async () => {
        const { rawScrollFor } = await import('/src/scene/drawing/introTimeline.ts')
        const max = document.documentElement.scrollHeight - innerHeight, deltas = []; let previous
        for (let i=0;i<120;i++) { const now=await new Promise(requestAnimationFrame); if(previous!==undefined)deltas.push(now-previous);previous=now;window.__lenis.scrollTo(max*rawScrollFor(.12+i/119*.85),{immediate:true}) }
        const sorted=[...deltas].sort((a,b)=>a-b),q=f=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*f))]
        return {intervals:deltas.length,p50Ms:q(.5),p95Ms:q(.95),p99Ms:q(.99),maxMs:Math.max(...deltas)}
      })
      report.perfRuns.push({run,warmup:run===0,...sweep});console.log(`${mode} symmetric perf ${JSON.stringify(report.perfRuns.at(-1))}`)
    }
    report.final = await snapshot()
    record('symmetric perf captured',report.perfRuns.length===4,{runs:report.perfRuns,webgl:report.final.webgl,composer:report.final.composer})
    await context.close()
  } else {
  record('hardware GL', /AMD|NVIDIA|Intel/i.test(report.baseline.webgl.renderer ?? '') && !/SwiftShader|llvmpipe|software/i.test(report.baseline.webgl.renderer ?? ''), report.baseline.webgl)
  const warmFinish = report.baseline.qualityEvents.filter(e => e.type === 'warmfinish').at(-1)
  record('no cold warmup decline or fallback', !report.baseline.qualityEvents.some(e => ['ondecline', 'onfallback'].includes(e.type) && !e.warmReady), { warmFinish, events: report.baseline.qualityEvents })
  for (const stop of baseline.stops) {
    await page.evaluate(async p => {
      delete window.__drawingProofProgress
      const store = await import('/src/state/scrollStore.ts')
      const { rawScrollFor } = await import('/src/scene/drawing/introTimeline.ts')
      const max = document.documentElement.scrollHeight - innerHeight
      window.__lenis.scrollTo(max * rawScrollFor(p), { immediate: true })
      store.setScrollState({ progress: p, velocity: 0 })
    }, stop.p)
    await page.waitForTimeout(3300)
    const s = await snapshot()
    record(`stop ${stop.p} matches historical mechanism`, Math.abs(s.telemetry.rig.explodeFactor - stop.rig.explodeFactor) < 0.003 && Math.abs(s.telemetry.rig.ghostOpacity - stop.rig.ghostOpacity) < 0.003, { expected: stop.rig, actual: s.telemetry.rig })
    const screenshot = path.join(output, `${stop.id}.png`)
    await page.screenshot({ path: screenshot, animations: 'disabled' })
    const image = pixels(readFileSync(screenshot))
    const historical = path.join(ROOT, 'docs/webgl-review-2026-10-16/evidence', `${stop.id}.png`)
    let historicalPixelComparison
    try { historicalPixelComparison = compare(readFileSync(historical), readFileSync(screenshot)) } catch (e) { historicalPixelComparison = { error: String(e) } }
    let freshPixelComparison
    if (mode === 'candidate') {
      try { freshPixelComparison = compare(readFileSync(path.join(HERE, 'baseline-matched', `${stop.id}.png`)), readFileSync(screenshot)) } catch (e) { freshPixelComparison = { error: String(e) } }
    }
    report.stops.push({ id: stop.id, p: stop.p, screenshot, dimensions: [image.width, image.height], snapshot: s, historicalPixelComparison, freshPixelComparison })
    if (mode === 'candidate' && [0.15, 0.35, 0.47, 0.65].includes(stop.p)) {
      // Flat-ID depth render supplies subject/role masks, not a whole-frame brightness proxy.
      const mask = await page.evaluate(async ({ width, height, p }) => {
        const { ReviewBasic: Basic, ReviewTarget: Target, ReviewNoTone: NoTone, ReviewColor: Color, roleMaterial } = await import('/src/scene/rig/materials.ts')
        const roles = ['toolSteel', 'cageSteel', 'planetSteel', 'clutchSteel', 'rotorSteel', 'stainlessSteel', 'blackOxideSteel']
        const colors = roles.map(r => roleMaterial(r).color.getHex())
        const renderer = window.__threeRenderer, scene = window.__threeScene, camera = window.__threeCamera
        const enclosureNames = ['ENCLOSURE_CHASSIS','COMPOSITE_PANELS','PUMP_HOUSING','ACOUSTIC_BAFFLES','ISOLATION_MOUNTS','DUCT_INTAKE','DUCT_EXHAUST']
        const records = [], materials = new Map()
        const flat = id => {
          if (!materials.has(id)) { const m = new Basic({ toneMapped: false }); m.color.setRGB(id / 255, 0, 0); materials.set(id, m) }
          return materials.get(id)
        }
        scene.traverse(o => {
          if (!(o.isMesh || o.isLine || o.isPoints)) return
          records.push([o, o.visible, o.material])
          let subject = false
          for (let parent = o; parent; parent = parent.parent) if (p < 0.6 ? parent.name === 'jgun-live-registered-model' : enclosureNames.includes(parent.name)) { subject = true; break }
          if (!subject || !o.isMesh) { o.visible = false; return }
          // Ambiguous translucent composites must not be attributed to the steel
          // behind them: ghost surfaces write a black depth-occluder in the mask.
          const replace = m => { if (m.transparent && m.opacity < 0.5) return flat(0); const i = m.color ? colors.indexOf(m.color.getHex()) : -1; return flat(i < 0 ? 8 : i + 1) }
          const mapped = Array.isArray(o.material) ? o.material.map(replace) : replace(o.material)
          if (!mapped || Array.isArray(mapped) && mapped.some(m => !m)) o.visible = false
          else o.material = mapped
        })
        const target = new Target(width, height), previousTarget = renderer.getRenderTarget()
        const previousBackground = scene.background, previousFog = scene.fog, previousTone = renderer.toneMapping, previousAutoClear = renderer.autoClear
        const clearColor = renderer.getClearColor(new Color()).clone(), clearAlpha = renderer.getClearAlpha()
        let png
        try {
          scene.background = null; scene.fog = null; renderer.toneMapping = NoTone; renderer.autoClear = true; renderer.setClearColor(0, 1)
          renderer.setRenderTarget(target); renderer.clear(); renderer.render(scene, camera)
          const data = new Uint8Array(width * height * 4); renderer.readRenderTargetPixels(target, 0, 0, width, height, data)
          const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
          const ctx = canvas.getContext('2d'), img = ctx.createImageData(width, height)
          for (let y = 0; y < height; y++) img.data.set(data.subarray((height - y - 1) * width * 4, (height - y) * width * 4), y * width * 4)
          ctx.putImageData(img, 0, 0); png = canvas.toDataURL('image/png').split(',')[1]
        } finally {
          for (const [o, visible, material] of records) { o.visible = visible; o.material = material }
          scene.background = previousBackground; scene.fog = previousFog; renderer.toneMapping = previousTone; renderer.autoClear = previousAutoClear
          renderer.setClearColor(clearColor, clearAlpha); renderer.setRenderTarget(previousTarget); target.dispose(); for (const m of materials.values()) m.dispose()
        }
        return { png, roles, note: 'Geometric flat-ID mask; two-pixel erosion excludes silhouettes; translucent ghosts are black depth-occluders so composite pixels behind them are excluded. DOM overlays are retained in matching screenshot and may affect interior measurements.' }
      }, { width: image.width, height: image.height, p: stop.p })
      const maskBuffer = Buffer.from(mask.png, 'base64'), decoded = pixels(maskBuffer)
      writeFileSync(path.join(output, `${stop.id}-role-mask.png`), maskBuffer)
      const hist = Array.from({ length: 9 }, () => new Uint32Array(256))
      const idAt = (x, y) => decoded.data[(y * decoded.width + x) * decoded.channels]
      for (let y = 2; y < image.height - 2; y++) for (let x = 2; x < image.width - 2; x++) {
        const id = idAt(x, y)
        if (id < 1 || id > 8 || idAt(x - 2, y) !== id || idAt(x + 2, y) !== id || idAt(x, y - 2) !== id || idAt(x, y + 2) !== id) continue
        const i = (y * image.width + x) * image.channels
        const lum = Math.round(0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2])
        hist[id][lum]++; hist[0][lum]++
      }
      const stats = h => { const n = h.reduce((a, b) => a + b, 0); const quantile = q => { let count = 0; for (let i = 0; i < 256; i++) { count += h[i]; if (count >= n * q) return i } }; return { pixels: n, median: n ? quantile(0.5) : null, p99: n ? quantile(0.99) : null, clippedFraction: n ? h.slice(253).reduce((a, b) => a + b, 0) / n : null } }
      const measurements = { subject: stats(hist[0]), roles: Object.fromEntries(mask.roles.map((r, i) => [r, stats(hist[i + 1])])), note: mask.note }
      report.stops.at(-1).lighting = measurements
      console.log(`${mode}: lighting ${stop.id} ${JSON.stringify(measurements)}`)
    }
    console.log(`${mode}: captured ${stop.id}, DPR ${s.webgl.pixelRatio}, FBO ${s.composer?.input?.width}x${s.composer?.input?.height}`)
  }
  // Same pinned progress sequence in each A/B arm. CPU rAF intervals are not GPU timer-query measurements.
  report.perfSweep = await page.evaluate(async () => {
    const { setScrollState } = await import('/src/state/scrollStore.ts')
    const { rawScrollFor } = await import('/src/scene/drawing/introTimeline.ts')
    delete window.__drawingProofProgress
    const max = document.documentElement.scrollHeight - innerHeight
    const deltas = []; let previous
    for (let i = 0; i < 120; i++) {
      const now = await new Promise(requestAnimationFrame)
      if (previous !== undefined) deltas.push(now - previous)
      previous = now
      const p = 0.12 + (i / 119) * 0.85
      window.__lenis.scrollTo(max * rawScrollFor(p), { immediate: true })
      setScrollState({ progress: p, velocity: 0 })
    }
    const sorted = [...deltas].sort((a, b) => a - b)
    const q = f => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * f))]
    return { frames: 120, intervals: deltas.length, p50Ms: q(0.5), p95Ms: q(0.95), p99Ms: q(0.99), maxMs: Math.max(...deltas), over16_7Count: deltas.filter(d => d > 16.7).length, over33_3Count: deltas.filter(d => d > 33.3).length }
  })
  report.dprSteps = []
  for (const dpr of [1.5, 1.25, 1]) {
    const result = await page.evaluate(async dpr => {
      const state = window.__threeScene.__r3f?.root?.getState()
      if (!state) return { error: 'R3F root state unavailable' }
      // Exercise the actual component staircase through a harness-only closure exposure.
      if (window.__reviewMode === 'candidate') window.__reviewSetDprStep([1.5, 1.25, 1].indexOf(dpr))
      else state.setDpr(dpr)
      await new Promise(r => setTimeout(r, 350))
      const c = window.__reviewComposer, r = window.__threeRenderer
      return { requested: dpr, actual: r.getPixelRatio(), drawingBuffer: [r.getContext().drawingBufferWidth, r.getContext().drawingBufferHeight], composer: [c.inputBuffer.width, c.inputBuffer.height], samples: c.inputBuffer.samples }
    }, dpr)
    report.dprSteps.push(result)
  }
  if (mode === 'candidate') {
    record('DPR/FBO physical-size synchronization', report.dprSteps.every(s => !s.error && s.composer[0] === Math.floor(1440 * s.requested) && s.composer[1] === Math.floor(900 * s.requested)), report.dprSteps)
    record('root canvas redundant AA/stencil disabled', report.baseline.webgl.contextAttributes.antialias === false && report.baseline.webgl.contextAttributes.stencil === false, report.baseline.webgl.contextAttributes)
    record('full composer supported 4x MSAA', report.baseline.composer.input.samples === 4 && report.baseline.webgl.rgba16fSamples.includes(4), report.baseline.composer)
    record('full output dithering', report.baseline.composer.passes.filter(p => p.effects).every(p => p.dithering === true), report.baseline.composer.passes)
    report.r5 = await page.evaluate(async () => {
      const state = window.__threeScene.__r3f.root.getState()
      state.setFrameloop('never')
      const { stationFrame: f, pushStationFrame } = await import('/src/scene/stations/stationStore.ts')
      const { STATIONS } = await import('/src/scene/stations/stationData.ts')
      const { setScrollState } = await import('/src/state/scrollStore.ts')
      const initialFrame = structuredClone(f)
      const overlay = document.querySelector('.station-card').parentElement
      const children = [...overlay.querySelector(':scope > svg').children]
      const visible = () => children.filter(e => getComputedStyle(e).visibility !== 'hidden').length
      const cycles = []
      try {
        for (const index of [...STATIONS.keys(), ...STATIONS.keys()].map((_, i) => i < STATIONS.length ? i : STATIONS.length * 2 - 1 - i)) {
          Object.assign(f, { index, u: 0.55, width: 1440, height: 900, anchor: [700,400,1], secondary: [650,350,1], model: [550,250,850,650], axis: [550,450,850,450,1] })
          pushStationFrame(); await new Promise(r => setTimeout(r, 30)); pushStationFrame()
          const active = visible()
          f.index = -1; pushStationFrame()
          cycles.push({ index, activeVisible: active, hiddenVisible: visible() })
        }
        const subscriber = state.internal.subscribers.find(s => /pointerDamp/.test(String(s.ref.current)))
        const responses = []
        if (subscriber) {
          const group = window.__threeScene.getObjectByName('jgun-live-registered-model')
          for (const hz of [30,60,120,144]) {
            window.__drawingProofProgress = 0; setScrollState({ progress: 0, velocity: 0 })
            subscriber.ref.current({ ...state, pointer: { x:0,y:0 } }, 1/60)
            window.__drawingProofProgress = 0.2; setScrollState({ progress:0.2, velocity:0 })
            for (let i=0;i<hz;i++) subscriber.ref.current({ ...state, pointer: {x:1,y:1} }, 1/hz)
            responses.push({ hz, yaw: group.rotation.y, pitch:group.rotation.x })
          }
        }
        return { cycles, pointerResponses: responses, subscriberFound: Boolean(subscriber), synthetic: true }
      } finally { Object.assign(f, initialFrame); pushStationFrame(); state.setFrameloop('always') }
    })
    record('R5 forward/reverse child visibility reset', report.r5.cycles.length === 14 && report.r5.cycles.every(c => c.hiddenVisible === 0) && report.r5.cycles.some(c => c.activeVisible > 0), report.r5.cycles)
    const responses = report.r5.pointerResponses
    record('R5 actual hero frame pointer response at 30/60/120/144Hz', responses.length === 4 && responses.every(r => Math.abs(r.pitch - 0.05 * (1 - Math.exp(-8))) < 1e-8 && Math.abs(r.yaw - 0.08 * (1 - Math.exp(-8))) < 1e-8), responses)
  }
  // Explicit diagnostic tier transition exercises actual public store path. These are forced proof cases.
  await page.evaluate(async () => { const q = await import('/src/state/qualityStore.ts'); q.degradeQuality(true) })
  await page.waitForTimeout(2000)
  report.lite = await snapshot()
  if (mode === 'candidate') {
    record('lite zero MSAA, DPR1, SMAA and dithering', report.lite.composer.input.samples === 0 && report.lite.webgl.pixelRatio === 1 && report.lite.composer.passes.some(p => p.effects?.some(e => /SMAA/i.test(e))) && report.lite.composer.passes.filter(p => p.effects).every(p => p.dithering === true), { webgl: report.lite.webgl, composer: report.lite.composer })
  }
  await page.evaluate(async () => { const q = await import('/src/state/qualityStore.ts'); q.forcePoster() })
  await page.waitForTimeout(750)
  report.poster = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, composer: Boolean(window.__reviewComposer) }))
  record('poster canvas/composer unmounted', report.poster.canvases === 0 && !report.poster.composer, report.poster)
  await context.close()
  const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const rp = await reduced.newPage()
  await rp.goto('http://localhost:5199/?qualityDiagnostics=1', { waitUntil: 'networkidle' })
  report.reducedMotion = await rp.evaluate(() => ({ reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, canvases: document.querySelectorAll('canvas').length, composer: Boolean(window.__reviewComposer) }))
  record('reduced-motion canvas/composer absent', report.reducedMotion.reduced && report.reducedMotion.canvases === 0 && !report.reducedMotion.composer, report.reducedMotion)
  await reduced.close()
  record('zero connected canvas context loss', report.baseline.contextLoss.length === 0 && report.stops.every(s => s.snapshot.contextLoss.length === 0), report.baseline.contextLoss)
  record('zero unrunnable shader programs', report.stops.every(s => s.snapshot.programs.every(p => p.runnable !== false)), report.stops.map(s => ({ p:s.p, programs:s.snapshot.programs.length, failed:s.snapshot.programs.filter(p => p.runnable === false) })))
  record('zero page/console/http errors', report.errors.length === 0, report.errors)
  }
} catch (e) {
  report.fatal = String(e.stack ?? e)
  record('harness completes', false, report.fatal)
} finally {
  await browser?.close().catch(() => {})
  await server?.close().catch(() => {})
  report.passed = report.checks.every(c => c.pass) && !report.fatal
  writeFileSync(path.join(output, 'telemetry.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ mode, passed: report.passed, checks: report.checks.map(c => ({ name: c.name, pass: c.pass })), fatal: report.fatal, perfSweep: report.perfSweep }))
  if (!report.passed && mode === 'candidate') process.exitCode = 1
}
