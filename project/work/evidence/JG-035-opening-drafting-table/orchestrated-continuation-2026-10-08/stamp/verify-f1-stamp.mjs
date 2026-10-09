import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const args = new Map(process.argv.slice(2).map(argument => {
  const match = /^--([^=]+)=(.*)$/.exec(argument)
  return match ? [match[1], match[2]] : [argument.slice(2), true]
}))
const url = String(args.get('url') ?? 'http://localhost:5199')
const targetTime = Number(args.get('time') ?? 16.25)
const outputPath = resolve(here, String(args.get('out') ?? 'runtime-proof.json'))
const harnessPath = '/project/work/evidence/JG-035-opening-drafting-table/orchestrated-continuation-2026-10-08/stamp/shaft-stamp-harness.js'
const browserLaunchArgs = ['--disable-gpu']
const sourcePaths = {
  component: '../../../../../../src/components/ShaftStoryLayer.tsx',
  stylesheet: '../../../../../../src/components/ShaftStoryLayer.css',
  sampler: '../../../../../../src/scene/inspection/shaft/script.ts',
}

if (!Number.isFinite(targetTime)) throw new Error('--time must be a finite number')
if (new URL(url).hostname === '127.0.0.1') {
  throw new Error('Use http://localhost:5199; this project’s Vite server refuses 127.0.0.1')
}

const proofPageUrl = new URL('/__shaft-stamp-proof', url).href
let browser
let result
try {
  const sourceHashes = Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([key, path]) => {
    const bytes = await readFile(resolve(here, path))
    return [key, createHash('sha256').update(bytes).digest('hex')]
  })))
  browser = await chromium.launch({ headless: true, args: browserLaunchArgs })
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } })
  const requests = []
  let canvasContextCalls = 0
  page.on('request', request => requests.push(request.url()))
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    window.__shaftCanvasContextCalls = 0
    HTMLCanvasElement.prototype.getContext = function(...arguments_) {
      window.__shaftCanvasContextCalls += 1
      return original.apply(this, arguments_)
    }
  })
  await page.route(proofPageUrl, route => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: `<!doctype html><html><head><meta charset="utf-8"><title>Shaft stamp proof</title>
      <script type="module">import { injectIntoGlobalHook } from "/@react-refresh"; injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type;</script>
      <script type="module" src="/@vite/client"></script></head><body></body></html>`,
  }))
  await page.goto(proofPageUrl, { waitUntil: 'domcontentloaded' })
  await page.evaluate(async path => {
    const module = await import(path)
    await module.installShaftStampHarness()
  }, harnessPath)
  await page.waitForFunction(() => Boolean(window.__shaftStampHarness))
  const harness = await page.evaluateHandle(() => window.__shaftStampHarness)

  const direct = await harness.evaluate((api, value) => api.sample(value, false, 'direct-seek'), targetTime)
  const reverseAway = await harness.evaluate((api, value) => api.sample(22, false, 'reverse-away'), targetTime)
  const reverse = await harness.evaluate((api, value) => api.sample(value, false, 'reverse-return'), targetTime)
  const pauseOne = await harness.evaluate((api, value) => api.sample(value, false, 'paused-frame-1'), targetTime)
  const pauseTwo = await harness.evaluate((api, value) => api.sample(value, false, 'paused-frame-2'), targetTime)
  const pauseThree = await harness.evaluate((api, value) => api.sample(value, false, 'paused-frame-3'), targetTime)
  const reduced = await harness.evaluate((api, value) => api.sample(value, true, 'reduced-motion'), targetTime)
  const disposed = await harness.evaluate(api => api.dispose().then(() => true))
  canvasContextCalls = await page.evaluate(() => window.__shaftCanvasContextCalls ?? 0)
  const glbRequests = requests.filter(url => /\.glb(?:\?|$)/i.test(url))
  if (glbRequests.length) failures.push(`isolated DOM harness unexpectedly loaded GLB assets: ${glbRequests.join(', ')}`)
  if (canvasContextCalls !== 0) failures.push(`isolated DOM harness unexpectedly created ${canvasContextCalls} canvas context(s)`)

  const pauseRows = [pauseOne, pauseTwo, pauseThree]
  const failures = []
  for (const row of [direct, reverse, ...pauseRows, reduced]) {
    if (!row.match) failures.push(`${row.label}: displayed stamp did not match the sampler`)
  }
  if (!direct.stampPresent || !reverse.stampPresent) failures.push('expected the FAILED stamp at the proof timestamp')
  if (direct.inlineTransform !== reverse.inlineTransform) failures.push('direct-seek and reverse-return inline transforms differ')
  if (Math.abs(direct.scaleDelta - reverse.scaleDelta) > 1e-9) failures.push('direct-seek and reverse-return computed scales differ')
  if (pauseRows.some(row => row.inlineTransform !== pauseOne.inlineTransform)) failures.push('paused stamp inline transform drifted')
  if (pauseRows.some(row => Math.abs(row.computedScale - pauseOne.computedScale) > 1e-9)) failures.push('paused stamp computed scale drifted')
  if (reduced.expectedScale !== 1 || Math.abs(reduced.computedScale - 1) > 1e-3) failures.push('reduced-motion scale is not fixed at 1')
  if ([direct, reverse, ...pauseRows, reduced].some(row => row.animations !== 0)) failures.push('a CSS animation remains on the stamp')

  result = {
    schema: 1,
    status: failures.length ? 'FAIL' : 'PASS',
    mode: 'isolated DOM component harness; not site end-to-end',
    recordedAt: new Date().toISOString(),
    url,
    proofPageUrl,
    harnessPath,
    targetTime,
    browser: browser.version(),
    browserLaunchArgs,
    sourceHashes,
    isolation: { requestCount: requests.length, glbRequests, canvasContextCalls },
    frameBarrier: direct.frameBarrier,
    cases: { direct, reverseAway, reverse, pauseOne, pauseTwo, pauseThree, reduced },
    disposed,
    failures,
  }
} catch (error) {
  result = {
    schema: 1,
    status: 'FAIL',
    recordedAt: new Date().toISOString(),
    url,
    proofPageUrl,
    harnessPath,
    targetTime,
    error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  }
} finally {
  await browser?.close()
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(result, null, 2))
if (result.status !== 'PASS') process.exitCode = 1
