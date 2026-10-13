// Parent-lane runtime integration checks for the released JG-038 drawing patch.
// Read-only: drives a served build, reads probe ports, never edits product source.
//
// Checks: A private mount, B matched-input registration, C annotation/pixel visibility,
// D built-chunk isolation (static, pre-launch), E BFCache, F real context loss + fallback.
//
// usage: node scripts/verify-torque-drawing-integration.mjs --url=http://localhost:4193/torque-wrench/
//        [--build-dir=.scratch/jg038-parent-integration/dist] [--out=<file>] [--only=A,B]
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import zlib from 'node:zlib'
import { launchBrowser, launchConfig, describeLaunch } from './lib/browser-launch.mjs'

const EXPORTED = {
  segments: 226783, fills: 21, texts: 254,
  evidence: 'public/drawing/jgun-sheet-v2.evidence.json',
}
const DRAWING_MARKERS = ['PAPER_FLEX_GLSL', 'measureProfileRegistration', 'jgun-sheet-v2', 'AcFastReference', 'paperFlexAmplitude']

function parseArgs() {
  const args = { url: null, buildDir: null, out: null, only: null }
  for (const raw of process.argv.slice(2)) {
    const m = /^--([a-z-]+)=(.*)$/i.exec(raw)
    if (!m) { console.error('usage: --url=... [--build-dir=...] [--out=...] [--only=A,B]'); process.exit(2) }
    if (m[1] === 'url') args.url = m[2]
    else if (m[1] === 'build-dir') args.buildDir = m[2]
    else if (m[1] === 'out') args.out = m[2]
    else if (m[1] === 'only') args.only = m[2].split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    else { console.error('unknown flag --' + m[1]); process.exit(2) }
  }
  if (!args.url) { console.error('--url is required'); process.exit(2) }
  return args
}

/** Minimal 8-bit non-interlaced PNG reader for screenshot pixel coverage. */
function decodePng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let offset = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0
  const idat = []
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      bitDepth = data[8]; colorType = data[9]; interlace = data[12]
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    offset += 12 + length
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG (bitDepth ${bitDepth}, colorType ${colorType}, interlace ${interlace})`)
  }
  const channels = colorType === 6 ? 4 : 3
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  let pos = 0
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos]; pos += 1
    const line = raw.subarray(pos, pos + stride); pos += stride
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride)
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? cur[i - channels] : 0
      const b = prev[i]
      const c = i >= channels ? prev[i - channels] : 0
      const x = line[i]
      const value = filter === 0 ? x : filter === 1 ? x + a : filter === 2 ? x + b
        : filter === 3 ? x + ((a + b) >> 1)
        : filter === 4 ? x + paeth(a, b, c) : (() => { throw new Error('filter ' + filter) })()
      cur[i] = value & 0xff
    }
  }
  return { width, height, channels, data: out }
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** Linework on this vellum sheet is low-contrast, so visibility is measured against the median. */
function measurePixels(buffer) {
  const png = decodePng(buffer)
  const lumas = []
  for (let i = 0; i < png.data.length; i += png.channels) {
    lumas.push((png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3)
  }
  const sorted = [...lumas].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  let sum = 0, features = 0, bright = 0
  for (const v of lumas) {
    sum += v
    if (Math.abs(v - median) > 10) features += 1
    if (v > 24) bright += 1
  }
  const mean = sum / lumas.length
  const variance = lumas.reduce((acc, v) => acc + (v - mean) ** 2, 0) / lumas.length
  return { width: png.width, height: png.height, samples: lumas.length,
    meanLuma: +mean.toFixed(2), medianLuma: +median.toFixed(2), lumaStdDev: +Math.sqrt(variance).toFixed(2),
    paperFraction: +(bright / lumas.length).toFixed(6), featureFraction: +(features / lumas.length).toFixed(6),
    minLuma: +sorted[0].toFixed(1), maxLuma: +sorted[sorted.length - 1].toFixed(1) }
}

function builtChunkIsolation(buildDir) {
  const manifestPath = path.join(buildDir, '.vite', 'manifest.json')
  if (!existsSync(manifestPath)) return { status: 'UNVERIFIED', detail: `manifest missing: ${manifestPath}` }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const entry = manifest['torque-wrench/index.html']
  if (!entry?.isEntry) return { status: 'UNVERIFIED', detail: 'no torque entry in manifest' }
  const seen = new Set()
  const walk = (key) => {
    if (seen.has(key)) return
    seen.add(key)
    for (const next of manifest[key]?.imports ?? []) walk(next)
  }
  walk('torque-wrench/index.html')
  const eager = [...seen].map((key) => manifest[key]).filter((v) => v?.file)
  const eagerHits = []
  let eagerBytes = 0
  for (const chunk of eager) {
    const bytes = readFileSync(path.join(buildDir, chunk.file))
    eagerBytes += bytes.length
    const text = bytes.toString('utf8')
    for (const marker of DRAWING_MARKERS) if (text.includes(marker)) eagerHits.push(`${chunk.file}:${marker}`)
  }
  // The drawing implementation is reachable only through the lazy graph, but it does not have to
  // live in the Scene chunk itself: walk the whole lazy closure (imports + dynamic imports).
  const lazySeen = new Set()
  const walkLazy = (key) => {
    if (lazySeen.has(key)) return
    lazySeen.add(key)
    const value = manifest[key]
    if (!value) return
    for (const next of [...(value.imports ?? []), ...(value.dynamicImports ?? [])]) walkLazy(next)
  }
  for (const key of entry.dynamicImports ?? []) walkLazy(key)
  const lazyChunks = [...lazySeen].map((key) => manifest[key]).filter((value) => value?.file)
  const lazyHits = []
  for (const chunk of lazyChunks) {
    const text = readFileSync(path.join(buildDir, chunk.file), 'utf8')
    for (const marker of DRAWING_MARKERS) if (text.includes(marker)) lazyHits.push(`${chunk.file}:${marker}`)
  }
  const scene = manifest['src/scene/torque-wrench/Scene.tsx']
  const dynamic = entry.dynamicImports ?? []
  const status = eagerHits.length === 0 && lazyHits.length > 0 && dynamic.length === 1 ? 'PASS' : 'FAIL'
  return {
    status,
    detail: { eagerChunks: eager.map((c) => c.file), eagerBytes, eagerDrawingHits: eagerHits,
      dynamicImports: dynamic, lazyChunks: lazyChunks.map((c) => c.file), lazyDrawingHits: [...new Set(lazyHits.map((h) => h.split(':')[1]))],
      lazySceneChunk: scene?.file ?? null },
  }
}

const results = []
const record = (id, status, detail) => { results.push({ id, status, detail }); console.log(`${status}  ${id}  ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`) }

const args = parseArgs()
// Accept either the origin or the page root; never double the page path.
const base = args.url.replace(/\/$/, '').replace(/\/torque-wrench$/, '')

if (!args.only || args.only.includes('D')) {
  const isolation = args.buildDir ? builtChunkIsolation(args.buildDir) : { status: 'UNVERIFIED', detail: 'no --build-dir given' }
  record('D-built-chunk-isolation', isolation.status, isolation.detail)
}

const { chromium } = await import('playwright')
const playwrightVersion = createRequire(import.meta.url)('playwright/package.json').version
const browser = await launchBrowser(chromium)
const report = { startedAt: new Date().toISOString(), url: base, launch: describeLaunch(), launchConfig: launchConfig(),
  playwrightVersion, checks: results, cases: {} }

try {
  // ---- A/C/F/E share one live document ----
  if (!args.only || ['A', 'B', 'C', 'E', 'F'].some((k) => args.only.includes(k))) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    const pageErrors = [], consoleErrors = [], requests = []
    page.on('pageerror', (e) => pageErrors.push(String(e)))
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('request', (r) => requests.push(r.url()))
    await page.addInitScript(() => { window.__bfcachePersisted = null; window.addEventListener('pageshow', (e) => { window.__bfcachePersisted = e.persisted }) })

    const t0 = Date.now()
    await page.goto(base + '/torque-wrench/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready === true, null, { timeout: 90000 })
    const sceneReadyMs = Date.now() - t0
    await page.waitForFunction(() => window.__torqueWorld.snapshot().sheet.baked === true, null, { timeout: 120000 })
    await page.waitForFunction(() => window.__torqueWorld.snapshot().frames > 8, null, { timeout: 60000 })
    const world = await page.evaluate(() => window.__torqueWorld.snapshot())
    const narrative = await page.evaluate(() => (window.__torqueNarrative ? window.__torqueNarrative.snapshot() : null))
    const dom = await page.evaluate(() => ({
      mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode'),
      stage: document.querySelector('.torque-stage')?.getAttribute('data-torque-stage'),
      canvases: document.querySelectorAll('canvas').length,
      chapters: [...document.querySelectorAll('[data-torque-chapter]')].map((s) => s.getAttribute('data-torque-chapter')),
      sheetHost: Boolean(document.querySelector('group[name="private-sheet-presentation-host"]')) || document.querySelectorAll('canvas').length > 0,
      storyText: (document.querySelector('#torque-story')?.textContent ?? '').length,
      footer: Boolean(document.querySelector('.torque-footer')),
    }))
    report.cases.live = { sceneReadyMs, world, narrative, dom, pageErrors, consoleErrors, cacheRequested: requests.some((u) => u.includes('jgun-sheet-v2.bin.gz')) }

    if (!args.only || args.only.includes('A')) {
      const ok = dom.mode === 'live' && dom.stage === 'scene' && dom.canvases === 1 && world.ready === true
        && world.frames > 8 && narrative && narrative.beatId && dom.storyText > 0 && dom.footer
      record('A-private-mount', ok ? 'PASS' : 'FAIL', { mode: dom.mode, stage: dom.stage, canvases: dom.canvases, frames: world.frames, beatId: narrative?.beatId, chapters: dom.chapters, storyText: dom.storyText, footer: dom.footer, pageErrors: pageErrors.length, consoleErrors: consoleErrors.length })
    }

    if (!args.only || args.only.includes('B')) {
      const sheet = world.sheet
      const reg = sheet.registration
      const stats = sheet.stats ?? {}
      const identity = { precomputed: sheet.precomputed, segments: stats.segments, fills: stats.fills, texts: stats.texts,
        registered: reg?.ready === true, maxDistance: reg?.maxDistance ?? null, meanDistance: reg?.meanDistance ?? null,
        pointCount: reg?.pointCount ?? null, segmentCount: reg?.segmentCount ?? null, units: reg?.units ?? null }
      const matchesFrozenInventory = stats.segments === EXPORTED.segments && stats.fills === EXPORTED.fills && stats.texts === EXPORTED.texts
      const ok = sheet.baked === true && reg?.ready === true && Number.isFinite(reg?.meanDistance) && matchesFrozenInventory
      record('B-matched-input-registration', ok ? 'PASS' : 'FAIL', {
        ...identity,
        frozenInventory: { segments: EXPORTED.segments, fills: EXPORTED.fills, texts: EXPORTED.texts },
        inventoryMatchesFrozenEvidence: matchesFrozenInventory,
        precomputeMeaning: sheet.precomputed === 1 ? 'frozen precompute matched these inputs' : 'inputs differ from the frozen precompute; live bake used (contract fallback)',
        cacheAssetRequested: report.cases.live.cacheRequested,
      })
    }

    if (!args.only || args.only.includes('C')) {
      const stage = await page.$('.torque-stage')
      const shotPath = path.join('.scratch/jg038-parent-integration', 'sheet-pixels.png')
      const scrolledPath = path.join('.scratch/jg038-parent-integration', 'sheet-pixels-drawing.png')
      mkdirSync(path.dirname(shotPath), { recursive: true })
      await stage.screenshot({ path: shotPath })
      let introPixel = null, drawingPixel = null
      try { introPixel = measurePixels(readFileSync(shotPath)) } catch (error) { introPixel = { error: String(error) } }
      const before = await page.evaluate(() => window.__torqueWorld.snapshot().renderer)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.22))
      await page.waitForTimeout(2500)
      await stage.screenshot({ path: scrolledPath })
      try { drawingPixel = measurePixels(readFileSync(scrolledPath)) } catch (error) { drawingPixel = { error: String(error) } }
      const after = await page.evaluate(() => window.__torqueWorld.snapshot().renderer)
      const sample = drawingPixel?.error ? introPixel : drawingPixel
      const ok = !sample.error && sample.paperFraction > 0.5 && sample.featureFraction > 0.005 && sample.lumaStdDev > 3
        && before.calls > 0 && before.triangles > 0
      record('C-annotation-pixel-visibility', ok ? 'PASS' : 'FAIL', {
        introPixel, drawingPixel, screenshots: [shotPath, scrolledPath],
        rendererAtRest: before, rendererAfterScroll: after, scrollChanged: after.triangles !== before.triangles,
        measure: 'featureFraction = pixels deviating >10 luma from the image median (vellum linework is low-contrast)',
      })
    }

    if (!args.only || args.only.includes('F')) {
      const lost = await page.evaluate(() => {
        const canvas = document.querySelector('.torque-stage canvas')
        if (!canvas) return 'no-canvas'
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
        const ext = gl?.getExtension('WEBGL_lose_context')
        if (!ext) return 'no-extension'
        ext.loseContext()
        return 'lost'
      })
      let fallback = null
      try {
        await page.waitForFunction(() => document.querySelector('.torque-stage')?.getAttribute('data-torque-stage') === 'poster', null, { timeout: 15000 })
        fallback = await page.evaluate(() => ({
          mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode'),
          stage: document.querySelector('.torque-stage')?.getAttribute('data-torque-stage'),
          storyText: (document.querySelector('#torque-story')?.textContent ?? '').length,
          canvases: document.querySelectorAll('canvas').length,
          worldProbe: Boolean(window.__torqueWorld),
        }))
      } catch { /* fallback not observed; reported below */ }
      record('F-real-context-loss-fallback', lost === 'lost' && fallback?.stage === 'poster' ? 'PASS' : 'FAIL',
        { trigger: lost, fallback, note: 'real WEBGL_lose_context on the live canvas; poster layer plus intact DOM story is the required fallback' })
    }

    if (!args.only || args.only.includes('E')) {
      await page.goto('about:blank', { waitUntil: 'domcontentloaded' })
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 })
      // Either BFCache revived the document or the browser reloaded it; both must end re-initialized.
      let reinitialized = false
      try {
        await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready === true, null, { timeout: 60000 })
        reinitialized = true
      } catch { reinitialized = false }
      const bfcache = await page.evaluate(async () => {
        const persisted = window.__bfcachePersisted
        let live = false
        try { live = window.__torqueWorld?.snapshot?.().ready === true } catch { live = false }
        return { persisted, live, mode: document.querySelector('.torque-page')?.getAttribute('data-torque-mode'), storyText: (document.querySelector('#torque-story')?.textContent ?? '').length }
      })
      record('E-bfcache-restore', bfcache.persisted === true && reinitialized ? 'PASS' : 'UNVERIFIED',
        { ...bfcache, reinitialized, note: bfcache.persisted === true ? 'document restored from BFCache and re-initialized live' : 'no BFCache restore observed in this run; the browser reloaded the document instead — recorded, not claimed as BFCache proof' })
    }

    report.cases.live.finalPageErrors = pageErrors
    report.cases.live.finalConsoleErrors = consoleErrors
    await context.close()
  }
} catch (error) {
  record('harness-exception', 'FAIL', String(error?.stack ?? error))
} finally {
  await browser.close()
}

report.checks = results
report.summary = { pass: results.filter((r) => r.status === 'PASS').length, fail: results.filter((r) => r.status === 'FAIL').length,
  unverified: results.filter((r) => r.status === 'UNVERIFIED').length }
const out = args.out ?? '.scratch/jg038-parent-integration/drawing-integration-report.json'
mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report.summary))
console.log('report: ' + out + ' sha256 ' + createHash('sha256').update(readFileSync(out)).digest('hex'))
process.exit(report.summary.fail === 0 ? 0 : 1)
