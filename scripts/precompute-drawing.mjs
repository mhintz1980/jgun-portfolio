// Run against a fresh Vite development server: node scripts/precompute-drawing.mjs [URL]
// Uses the actual rest-pose snapshot and actual WebGL HLR; never transforms the source GLB.
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { cpus, platform, release } from 'node:os'
import { encodeDrawingPrecompute } from '../src/scene/drawing/sheet/drawingCodec.ts'

const url = new URL(process.argv[2] ?? 'http://localhost:5173')
url.searchParams.delete('drawingCache')
const liveUrl = new URL(url)
liveUrl.searchParams.set('drawingCache', 'bypass')
const options = { viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 }
// Real GPU first (repo verifier convention). Bundled headless Chromium falls back to SwiftShader,
// whose software render loop starves the page's main thread: the 25 MB asset fetch then outlives
// the loader's timeout and every precomputed measurement reads as a live-bake fallback.
const args = ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
let channel = 'chrome'
let browser
try {
  browser = await chromium.launch({ headless: true, channel, args })
} catch (chromeError) {
  console.warn('Installed Chrome failed; trying bundled Chromium (software GL, may time out):', chromeError.message)
  channel = 'bundled-chromium'
  try {
    browser = await chromium.launch({ headless: true, args })
  } catch (bundledError) {
    throw new AggregateError([chromeError, bundledError], 'Neither installed Chrome nor bundled Chromium could launch')
  }
}

// Capture the first stats publication inside the page, not time spent later exporting JSON.
// This is drawing-bake readiness, not proof that fonts/GPU/first visible frame are ready.
async function makePage(context) {
  const page = await context.newPage()
  await page.addInitScript(() => {
    const poll = () => {
      if (window.__sheetStats?.segments > 0) {
        window.__precomputeReady = { navigationToSheetStatsMs: performance.now(), stats: { ...window.__sheetStats } }
      } else requestAnimationFrame(poll)
    }
    requestAnimationFrame(poll)
  })
  return page
}
async function measure(page, target, expectedPrecomputed, reload = false) {
  if (reload) await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 })
  else await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => !!window.__precomputeReady, null, { timeout: 120000 })
  const result = await page.evaluate(() => ({ ...window.__precomputeReady, devicePixelRatio }))
  if (result.stats.precomputed !== expectedPrecomputed) {
    throw new Error(`Expected precomputed=${expectedPrecomputed}, got ${result.stats.precomputed}; check server asset freshness`)
  }
  if (!expectedPrecomputed && result.stats.cacheHit) throw new Error('Live baseline unexpectedly reused an in-memory sheet')
  return result
}
async function verifyInstalled(page, asset) {
  return page.evaluate(async (expected) => {
    const cache = await import('/src/scene/drawing/sheet/drawingCache.ts')
    const source = cache.drawingPrecomputeSource()
    if (!source) return false
    const { data, layout } = source
    const sheet = cache.cachedSheet(data, layout)
    return sheet?.stats.precomputed === 1
      && await cache.drawingCacheKey(data, layout) === expected.key
      && JSON.stringify(sheet.ink.segs) === JSON.stringify(expected.segs)
      && JSON.stringify(sheet.ink.fills) === JSON.stringify(expected.fills)
      && JSON.stringify(sheet.ink.texts) === JSON.stringify(expected.texts)
      && JSON.stringify(sheet.marks) === JSON.stringify(expected.marks)
      && JSON.stringify(cache.cachedProfile(data, layout)) === JSON.stringify(expected.profile)
  }, asset)
}

try {
  const liveContext = await browser.newContext(options)
  const livePage = await makePage(liveContext)
  const coldLive = await measure(livePage, liveUrl.href, 0)
  const asset = await livePage.evaluate(async () => {
    const cache = await import('/src/scene/drawing/sheet/drawingCache.ts')
    if (!cache.drawingCacheBypassed()) throw new Error('Generator bypass is not active')
    return cache.exportDrawingPrecompute()
  })
  // Encode the captured immutable bake with the site's exact codec. Avoid a second
  // development-page import/export, which can be invalidated by a Vite reload.
  const container = encodeDrawingPrecompute(asset)
  await liveContext.close()

  const gzip = gzipSync(container, { level: 9 })
  // Publish before testing so cold/warm runs exercise the real HTTP gzip/decompression path.
  // A later failed check leaves the candidate asset on disk, but never writes success evidence.
  const output = new URL('../public/drawing/', import.meta.url)
  await mkdir(output, { recursive: true })
  // Invalidate previous evidence before replacing its asset, including if verification fails.
  await writeFile(new URL('jgun-sheet-v2.evidence.json', output), JSON.stringify({ status: 'pending', key: asset.key }) + '\n')
  await writeFile(new URL('jgun-sheet-v2.bin.gz', output), gzip)

  const cachedContext = await browser.newContext(options)
  const cachedPage = await makePage(cachedContext)
  const coldPrecomputed = await measure(cachedPage, url.href, 1)
  if (!await verifyInstalled(cachedPage, asset)) throw new Error('Cold precompute HTTP roundtrip differs from live bake')
  const warmReload = await measure(cachedPage, url.href, 1, true)
  if (!await verifyInstalled(cachedPage, asset)) throw new Error('Warm precompute HTTP roundtrip differs from live bake')
  await cachedContext.close()
  const evidence = {
    status: 'verified', generatedAt: new Date().toISOString(), url: url.href,
    key: asset.key, cacheVersion: asset.version, containerVersion: 3,
    environment: { channel, browserVersion: browser.version(), platform: platform(), osRelease: release(), cpu: cpus()[0]?.model, ...options },
    method: 'One sample each: fresh-context live bake with cache bypass; fresh-context precompute load; same-context precompute reload. Timing ends at first sheet-stats publication (not first visible frame). Browser/GPU process and Vite server are shared and may be warm. HTTP cache behavior on reload is server-dependent. No claim of OS/disk/GPU-cold timing.',
    coldLive, coldPrecomputed, warmReload,
    exact: true,
    containerBytes: container.length, gzipBytes: gzip.length,
    // Legacy full-asset JSON size, serialized only for the evidence comparison line.
    legacyJsonBytesForComparison: Buffer.byteLength(JSON.stringify(asset)),
  }
  await writeFile(new URL('jgun-sheet-v2.evidence.json', output), JSON.stringify(evidence, null, 2) + '\n')
  console.log(JSON.stringify(evidence, null, 2))
} finally {
  await browser.close()
}
