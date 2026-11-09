// Diagnostic only: request initiators, a main-thread trace and observed study entry.
// No GPU-time inference and no product instrumentation or source mutations.
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
const options = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const match = /^--(base|identity|out)=(.+)$/.exec(arg)
    if (!match) throw new Error(`Unknown option ${arg}`)
    return [match[1], match[2]]
  }),
)
if (!options.base || !options.identity || !options.out) throw new Error('--base --identity --out required')
const identity = JSON.parse(readFileSync(options.identity, 'utf8'))
if (
  !/^[a-f0-9]{40}$/.test(identity.source) ||
  !/^[a-f0-9]{64}$/.test(identity.artifactManifestSha256) ||
  !identity.routes?.torque?.entry ||
  !identity.files?.length
)
  throw new Error('Incomplete source/artifact identity')
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const servedIdentity = []
for (const file of [identity.routes.torque.entry, identity.routes.torque.scene, '/models/Default.glb']) {
  const expected = identity.files.find((f) => '/' + f.path === file)
  if (!expected) throw new Error(`Missing artifact identity for ${file}`)
  const served = await fetch(new URL(file, options.base))
  if (served.status !== 200 || hash(Buffer.from(await served.arrayBuffer())) !== expected.sha256)
    throw new Error(`Served byte mismatch: ${file}`)
  servedIdentity.push({ path: file, sha256: expected.sha256 })
}
mkdirSync(options.out, { recursive: true })
const browser = await chromium.launch({ headless: true, timeout: 15000, args: ['--use-angle=d3d11', '--enable-gpu'] })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()
const cdp = await context.newCDPSession(page)
const report = {
  source: identity.source,
  artifact: identity.artifactManifestSha256,
  browser: browser.version(),
  launch: 'bundled Chromium, headless, ANGLE D3D11 requested',
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  throttled: false,
  preflightIdentity: servedIdentity,
  requests: [],
  errors: [],
  checkpoints: [],
  windows: [],
  limitations: [
    'Trace is diagnostic and perturbs timing; not a primary performance comparison.',
    'No isolated GLTF decode/preparation spans: loader/prepare attribution unresolved.',
    'GPU execution time, power, physical device and hidden-tab behavior unresolved.',
  ],
}
const requests = new Map()
const trace = []
let origin = null
let tracing = false
const clock = () => page.evaluate(() => performance.now())
const snapshot = () =>
  page.evaluate(() => {
    const s = window.__torqueWorld?.snapshot?.()
    return {
      ready: s?.ready,
      inspectionReady: s?.inspection?.ready,
      progress: s?.progress,
      tier: s?.mechanical?.tier,
      renderer: (() => {
        const canvas = document.querySelector('canvas'),
          gl = canvas?.getContext('webgl2')
        const ext = gl?.getExtension('WEBGL_debug_renderer_info')
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null
      })(),
      draws: window.__WEBGL_TELEMETRY__ ?? null,
    }
  })
const checkpoint = async (label) => report.checkpoints.push({ label, at: await clock(), ...(await snapshot()) })
const seek = async (progress) => {
  await page.evaluate(
    (p) =>
      scrollTo(0, window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight)),
    progress,
  )
  await page.waitForFunction(
    (p) => Math.abs((window.__torqueNarrative?.snapshot?.().progress ?? -1) - p) < 0.01,
    progress,
    { timeout: 15000, polling: 100 },
  )
  await page.waitForTimeout(150)
}
cdp.on('Network.requestWillBeSent', (event) => {
  if (event.type === 'Document' && origin === null) origin = event.timestamp
  requests.set(event.requestId, {
    url: event.request.url,
    type: event.type,
    start: event.timestamp,
    initiator: event.initiator,
  })
})
cdp.on('Network.responseReceived', (event) => {
  const r = requests.get(event.requestId)
  if (r)
    Object.assign(r, {
      status: event.response.status,
      fromDiskCache: event.response.fromDiskCache,
      fromServiceWorker: event.response.fromServiceWorker,
      timing: event.response.timing,
      cacheControl: event.response.headers['Cache-Control'] ?? event.response.headers['cache-control'],
    })
})
cdp.on('Network.loadingFinished', (event) => {
  const r = requests.get(event.requestId)
  if (r) Object.assign(r, { finish: event.timestamp, encodedBytes: event.encodedDataLength })
})
cdp.on('Tracing.dataCollected', (event) => trace.push(...event.value))
page.on('pageerror', (error) => report.errors.push(error.message))
try {
  await cdp.send('Network.enable')
  await cdp.send('Tracing.start', {
    categories: 'devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline',
    transferMode: 'ReportEvents',
  })
  tracing = true
  const response = await page.goto(new URL('/torque-wrench/', options.base).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  const html = await response.text()
  if (
    response.status() !== 200 ||
    new URL(page.url()).pathname !== identity.routes.torque.path ||
    !html.includes(identity.routes.torque.entry)
  )
    throw new Error('Identity/route mismatch')
  if (hash(html) !== identity.routes.torque.htmlSha256) throw new Error('Served HTML hash mismatch')
  await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().ready === true, null, {
    timeout: 60000,
    polling: 1000,
  })
  await checkpoint('scene-ready')
  const idleStart = await clock()
  await page.waitForTimeout(3000)
  report.windows.push({ name: 'stationary-at-opening', start: idleStart, end: await clock() })
  await checkpoint('before-study-input')
  const scrollStart = await clock()
  for (const p of [0.3, 0.6, 0.62, 0.65, 0.72, 0.8, 0.825]) {
    await seek(p)
    if (p === 0.72)
      await page.waitForFunction(() => window.__torqueWorld?.snapshot?.().inspection?.ready === true, null, {
        timeout: 30000,
        polling: 1000,
      })
    await checkpoint(`forward-${p}`)
  }
  for (const p of [0.8, 0.72, 0.65, 0.62, 0.3, 0]) {
    await seek(p)
    await checkpoint(`reverse-${p}`)
  }
  report.windows.push({ name: 'forward-reverse-input', start: scrollStart, end: await clock() })
  report.valid = report.checkpoints.some((c) => c.inspectionReady === true) && report.errors.length === 0
} catch (error) {
  report.valid = false
  report.errors.push(String(error.stack ?? error))
} finally {
  if (tracing) {
    const finished = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve))
    await cdp.send('Tracing.end').catch(() => {})
    await Promise.race([finished, new Promise((resolve) => setTimeout(resolve, 10000))])
  }
  report.requests = [...requests.values()].map((r) => ({
    ...r,
    startMs: origin === null ? null : (r.start - origin) * 1000,
    finishMs: origin === null || r.finish === undefined ? null : (r.finish - origin) * 1000,
  }))
  const tasks = trace.filter((e) => e.ph === 'X' && e.name === 'RunTask' && e.dur >= 50000)
  report.traceSummary = {
    events: trace.length,
    longRunTasks: tasks.length,
    longRunTaskMs: tasks.reduce((sum, e) => sum + e.dur / 1000, 0),
    note: 'All traced RunTask events; not a unique main-thread total or CPU/GPU attribution.',
  }
  writeFileSync(path.join(options.out, 'attribution-trace.json'), JSON.stringify({ traceEvents: trace }))
  writeFileSync(path.join(options.out, 'attribution.json'), JSON.stringify(report, null, 2) + '\n')
  await context.close()
  await browser.close()
}
console.log(
  JSON.stringify({
    valid: report.valid,
    errors: report.errors,
    checkpoints: report.checkpoints.map(({ draws, ...c }) => c),
    traceSummary: report.traceSummary,
  }),
)
process.exitCode = report.valid ? 0 : 1
