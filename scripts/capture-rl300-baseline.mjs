/**
 * JG-033 W1 — "Freeze and measure" baseline capture.
 *
 * Records the CURRENT measured cost and state of the whole scroll sequence so the
 * RL300 "Quiet Machine" rebuild has real numbers to diff against. The plan's perf
 * targets are explicitly provisional ("not current measurements"); this replaces
 * them with observations.
 *
 * READ-ONLY against the app: it drives the existing telemetry surface
 * (window.__drawingProof.scrollToProgress / window.__telemetry / window.__threeScene)
 * and changes no application state beyond scroll position and the lite-tier toggle.
 *
 *   BASE_URL=http://localhost:4173 OUT=<dir> node scripts/capture-rl300-baseline.mjs
 *
 * Run AFTER `npm run build` and AFTER restarting the :4173 preview — a stale server
 * with rotated hashes never mounts the canvas (AGENTS.md hard rule).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    'file:///C:/Users/Markimus/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs'
)

const BASE = process.env.BASE_URL || 'http://localhost:4173'
const OUT = process.env.OUT || 'project/work/evidence/rl300-quiet-machine'
const SHOTS = path.join(OUT, 'baseline-frames')
fs.mkdirSync(SHOTS, { recursive: true })

const VIEWPORTS = [
  { label: 'desktop-1440x900', width: 1440, height: 900, shots: true },
  { label: 'tablet-768x1024', width: 768, height: 1024, shots: false },
  { label: 'phone-390x844', width: 390, height: 844, shots: false },
]

/** Progress stops: a uniform sweep plus the beats named in the plan / stageWindows. */
const SWEEP = Array.from({ length: 21 }, (_, i) => +(i * 0.05).toFixed(3))
const NAMED = {
  0.0: 'ch01-drawing-intro',
  0.177: 'ch01-hero-transit-start',
  0.416: 'jgun-explode-complete',
  0.458: 'ch01-hero-transit-end',
  0.47: 'jgun-explode-probed',
  0.525: 'lcd-dwell-end / wrench-out start',
  0.565: 'enclosure-in complete',
  0.575: 'rl300-assembled',
  0.65: 'rl300-hold (yellow-at-hold frame)',
  0.72: 'enclosure-out start',
  0.76: 'm249-pointcloud in',
  0.85: 'jgun-visual-gates probe point',
  1.0: 'page end',
}
const STOPS = [...new Set([...SWEEP, ...Object.keys(NAMED).map(Number)])].sort((a, b) => a - b)

/** Which scroll band each station owns — from src/scene/stages/stageWindows.ts. */
function stationAt(p) {
  if (p < 0.525) return 'JGUN (CH.01-02)'
  if (p < 0.72) return 'RL300 enclosure (CH.03)'
  if (p < 0.9) return 'M249 point cloud (CH.04)'
  return 'outro'
}

const pct = (arr, q) => {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(3)
}

const report = {
  meta: {
    capturedAt: new Date().toISOString(),
    baseUrl: BASE,
    node: process.version,
    note: 'Measured baseline for JG-033. Draw calls/triangles are deterministic for a given build+viewport; frame timings are machine-dependent and reported as percentiles.',
  },
  host: {},
  viewports: {},
  errors: [],
}

/**
 * The npx-cached playwright is newer than the browsers downloaded under
 * ms-playwright, so its bundled headless shell is absent. Fall back through
 * installed Chrome, then any local chromium build, rather than downloading.
 */
const LAUNCH = { args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] }
let browser = null
const attempts = []
for (const opt of [
  { ...LAUNCH, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' },
  { ...LAUNCH, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined },
  LAUNCH,
]) {
  if ('executablePath' in opt && !opt.executablePath) continue
  try {
    browser = await chromium.launch(opt)
    report.meta.browserLaunch = opt.channel ? `channel:${opt.channel}` : opt.executablePath ? `executablePath:${opt.executablePath}` : 'bundled'
    break
  } catch (e) {
    attempts.push(`${opt.channel || opt.executablePath || 'bundled'}: ${String(e).split('\n')[0]}`)
  }
}
if (!browser) {
  console.error('BASELINE_FAIL could not launch a browser:\n  ' + attempts.join('\n  '))
  process.exit(1)
}

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()

  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300))
  })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 300)))

  // --- network accounting: what each asset costs on a cold load ---
  const transfers = []
  page.on('response', async (res) => {
    try {
      const h = res.headers()
      const len = Number(h['content-length'] || 0)
      const u = new URL(res.url())
      transfers.push({ path: u.pathname, status: res.status(), bytes: len, type: h['content-type'] || '' })
    } catch { /* ignore */ }
  })

  const t0 = Date.now()
  await page.goto(BASE + '/?chapter=0', { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => Boolean(window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady),
    null,
    { timeout: 60000 },
  ).catch(() => report.errors.push(`${vp.label}: drawingProof never became ready`))
  const loadMs = Date.now() - t0

  if (!report.host.ua) {
    report.host = await page.evaluate(() => {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl')
      const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info')
      return {
        ua: navigator.userAgent,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory ?? null,
        devicePixelRatio: window.devicePixelRatio,
        webglVendor: dbg && gl ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : null,
        webglRenderer: dbg && gl ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : null,
        maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null,
      }
    })
  }

  const vpRec = {
    viewport: { width: vp.width, height: vp.height },
    loadMs,
    documentHeightPx: await page.evaluate(() => document.documentElement.scrollHeight),
    innerHeightPx: await page.evaluate(() => window.innerHeight),
    tier: await page.evaluate(() => window.__telemetry?.performance?.tier ?? null),
    stops: [],
    perfHolds: {},
    consoleErrors: [],
  }
  vpRec.totalScrollableHeightPx = vpRec.documentHeightPx - vpRec.innerHeightPx

  await page.evaluate(() => { window.__scrollCommitDisabled = true })

  /**
   * The app exposes no WebGLRenderer global (window.__rig is the JGUN node map),
   * so draw calls come from two independent sources:
   *   1. R3F's internal store on the scene, when reachable — gives renderer.info.
   *   2. A wrapped WebGL context that counts real draw commands per frame.
   * (2) is authoritative and needs no app cooperation; (1) is reported alongside
   * it as a cross-check. Wrapping is additive and removed with the page.
   */
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const gl = canvas && (canvas.__ctx || null)
    const findRenderer = () => {
      const s = window.__threeScene
      const root = s && (s.__r3f?.root || s.__r3f?.store)
      const st = root?.getState?.()
      return st?.gl || null
    }
    let counted = { calls: 0, elements: 0, arrays: 0, instanced: 0 }
    let frameCounted = null
    const ctxs = []
    for (const c of document.querySelectorAll('canvas')) {
      const g = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) || c.getContext('webgl')
      if (g && !g.__rl300Wrapped) ctxs.push(g)
    }
    for (const g of ctxs) {
      g.__rl300Wrapped = true
      for (const [fn, key] of [['drawElements', 'elements'], ['drawArrays', 'arrays'], ['drawElementsInstanced', 'instanced'], ['drawArraysInstanced', 'instanced']]) {
        const orig = g[fn]
        if (typeof orig !== 'function') continue
        g[fn] = function (...a) { counted.calls++; counted[key]++; return orig.apply(this, a) }
      }
    }
    window.__rl300Probe = {
      wrappedContexts: ctxs.length,
      async sampleRenderer() {
        // measure exactly one animation frame's worth of draw commands
        counted = { calls: 0, elements: 0, arrays: 0, instanced: 0 }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        frameCounted = { ...counted }
        const r = findRenderer()
        const info = r?.info
          ? {
              calls: r.info.render.calls,
              triangles: r.info.render.triangles,
              points: r.info.render.points,
              lines: r.info.render.lines,
              geometries: r.info.memory.geometries,
              textures: r.info.memory.textures,
              programs: r.info.programs?.length ?? null,
            }
          : null
        return {
          source: info ? 'renderer.info + gl-counter' : 'gl-counter only',
          rendererInfo: info,
          glDrawCalls: frameCounted.calls,
          glBreakdown: frameCounted,
          wrappedContexts: ctxs.length,
        }
      },
    }
    return { wrappedContexts: ctxs.length, rendererReachable: Boolean(findRenderer()) }
  })

  for (const p of STOPS) {
    await page.evaluate((prog) => window.__drawingProof.scrollToProgress(prog), p)
    await page.waitForTimeout(120)

    const sample = await page.evaluate(() => {
      const scene = window.__threeScene
      const tele = window.__telemetry || {}
      const info = tele.renderer || tele.info || null

      let visibleMeshes = 0
      let visibleTris = 0
      let totalMeshes = 0
      const materialsInUse = {}
      if (scene) {
        scene.traverse((o) => {
          if (!o.isMesh) return
          totalMeshes++
          let vis = o.visible
          let par = o.parent
          while (vis && par) { vis = par.visible; par = par.parent }
          if (!vis) return
          visibleMeshes++
          const g = o.geometry
          if (g) {
            const n = g.index ? g.index.count / 3 : (g.attributes?.position?.count ?? 0) / 3
            visibleTris += Math.floor(n)
          }
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          for (const m of mats) if (m?.name) materialsInUse[m.name] = (materialsInUse[m.name] || 0) + 1
        })
      }
      return {
        sceneAlive: Boolean(scene),
        tier: tele.performance?.tier ?? null,
        rendererInfo: info,
        visibleMeshes,
        visibleTris,
        totalMeshes,
        materialsInUse,
        scrollY: window.scrollY,
      }
    })

    const rinfo = await page.evaluate(() => window.__rl300Probe.sampleRenderer())

    vpRec.stops.push({
      progress: p,
      beat: NAMED[p] || null,
      station: stationAt(p),
      scrollY: sample.scrollY,
      sceneAlive: sample.sceneAlive,
      tier: sample.tier,
      visibleMeshes: sample.visibleMeshes,
      visibleTris: sample.visibleTris,
      totalMeshes: sample.totalMeshes,
      distinctMaterialsVisible: Object.keys(sample.materialsInUse).length,
      rendererInfo: rinfo,
      telemetryRenderer: sample.rendererInfo,
    })

    if (vp.shots && NAMED[p]) {
      const safe = String(p).replace('.', '_')
      await page.screenshot({ path: path.join(SHOTS, `p${safe}.png`), fullPage: false })
    }
  }

  // --- frame-time percentiles at the beats that matter ---
  for (const hold of [0.416, 0.575, 0.65, 0.85]) {
    await page.evaluate((prog) => window.__drawingProof.scrollToProgress(prog), hold)
    await page.waitForTimeout(400)
    const perf = await page.evaluate(async () => {
      const frames = []
      let last = performance.now()
      await new Promise((resolve) => {
        let n = 0
        const tick = () => {
          const now = performance.now()
          frames.push(now - last)
          last = now
          if (++n >= 120) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      return frames.slice(5)
    })
    vpRec.perfHolds[hold] = {
      samples: perf.length,
      p50: pct(perf, 0.5),
      p95: pct(perf, 0.95),
      p99: pct(perf, 0.99),
      max: +Math.max(...perf).toFixed(3),
      impliedFps_p50: +(1000 / pct(perf, 0.5)).toFixed(1),
    }
  }

  // --- lite tier cost, for the lower-tier budget ---
  await page.evaluate(() => window.__drawingProof.setTier?.('lite'))
  await page.waitForTimeout(400)
  await page.evaluate((prog) => window.__drawingProof.scrollToProgress(prog), 0.65)
  await page.waitForTimeout(300)
  vpRec.liteTierAtHold = await page.evaluate(() => {
    const scene = window.__threeScene
    let meshes = 0, tris = 0
    scene?.traverse((o) => {
      if (!o.isMesh || !o.visible) return
      meshes++
      const g = o.geometry
      if (g) tris += Math.floor(g.index ? g.index.count / 3 : (g.attributes?.position?.count ?? 0) / 3)
    })
    return {
      tier: window.__telemetry?.performance?.tier ?? null,
      visibleMeshes: meshes,
      visibleTris: tris,
    }
  })
  vpRec.liteTierAtHold.renderer = await page.evaluate(() => window.__rl300Probe.sampleRenderer())

  vpRec.consoleErrors = consoleErrors

  /**
   * Resource Timing is the accurate transfer source. The preview server sends
   * most /assets responses chunked with no content-length, so the response-header
   * tally alone under-reports; it is kept only as a cross-check.
   */
  vpRec.network = await page.evaluate(() => {
    const ents = performance.getEntriesByType('resource')
    const byKind = {}
    let transfer = 0
    let decoded = 0
    const rows = []
    for (const e of ents) {
      const p = new URL(e.name, location.href).pathname
      const k = p.startsWith('/models') ? 'models'
        : p.includes('draco') ? 'draco'
        : p.startsWith('/assets') ? 'app-bundle'
        : 'other'
      const t = e.transferSize || 0
      const d = e.decodedBodySize || 0
      byKind[k] = (byKind[k] || 0) + t
      transfer += t
      decoded += d
      rows.push({ path: p, transferSize: t, decodedBodySize: d, durationMs: +e.duration.toFixed(1), initiatorType: e.initiatorType })
    }
    return {
      source: 'PerformanceResourceTiming',
      totalTransferBytes: transfer,
      totalDecodedBytes: decoded,
      byKind,
      requestCount: ents.length,
      largest: rows.sort((a, b) => b.transferSize - a.transferSize).slice(0, 15),
    }
  })
  vpRec.networkHeaderTally = {
    note: 'content-length only; under-reports chunked responses. Cross-check for the Resource Timing figures above.',
    totalBytes: transfers.reduce((a, t) => a + t.bytes, 0),
    requestCount: transfers.length,
  }

  report.viewports[vp.label] = vpRec
  await ctx.close()
}

await browser.close()

// --- asset hashes, so the baseline is reproducible ---
const hashDirs = ['public/models', 'public/draco', 'dist/assets', 'dist/models']
report.assets = {}
for (const d of hashDirs) {
  if (!fs.existsSync(d)) continue
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f)
    if (!fs.statSync(fp).isFile()) continue
    const b = fs.readFileSync(fp)
    report.assets[fp.replace(/\\/g, '/')] = {
      bytes: b.length,
      sha256: crypto.createHash('sha256').update(b).digest('hex').slice(0, 32),
    }
  }
}

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, '00-baseline.json'), JSON.stringify(report, null, 1))

const d = report.viewports['desktop-1440x900']
console.log('BASELINE_OK')
console.log(`host: ${report.host.webglRenderer || 'unknown GPU'} | dpr=${report.host.devicePixelRatio} | cores=${report.host.hardwareConcurrency}`)
for (const [label, v] of Object.entries(report.viewports)) {
  console.log(`${label}: docHeight=${v.documentHeightPx}px scrollable=${v.totalScrollableHeightPx}px tier=${v.tier} loadMs=${v.loadMs} consoleErrors=${v.consoleErrors.length}`)
}
if (d) {
  console.log('desktop stops (progress | station | visibleMeshes | visibleTris | drawCalls):')
  for (const s of d.stops) {
    if (!s.beat && Math.round(s.progress * 100) % 10 !== 0) continue
    console.log(`  ${s.progress.toFixed(3)} ${s.station.padEnd(24)} meshes=${String(s.visibleMeshes).padStart(5)} tris=${String(s.visibleTris).padStart(7)} calls=${s.rendererInfo?.glDrawCalls ?? 'n/a'}${s.beat ? '  <- ' + s.beat : ''}`)
  }
  console.log('perf holds:', JSON.stringify(d.perfHolds))
  console.log('lite at hold:', JSON.stringify(d.liteTierAtHold))
  console.log('network:', JSON.stringify(d.network.byKind), 'totalTransfer=', d.network.totalTransferBytes, 'totalDecoded=', d.network.totalDecodedBytes)
}
if (report.errors.length) console.log('ERRORS:', report.errors.join(' ; '))
