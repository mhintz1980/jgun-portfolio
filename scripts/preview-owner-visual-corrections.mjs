/** Owner proposal only. Run against the final integrated tree; never a verifier.
 * node scripts/preview-owner-visual-corrections.mjs --url=http://localhost:5199/torque-wrench/?quality=full --out=output/playwright/owner-visual-preview-2026-10-28/integrated-preview --mode=all --video=1
 * --mode=video skips stills. Video requires ffmpeg + ffprobe on PATH (or FFMPEG_PATH / FFPROBE_PATH).
 */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { describeLaunch, launchBrowser } from './lib/browser-launch.mjs'
import { checkPreviewVideoTools, encodePreviewVideo, renderPreviewVideo } from './lib/preview-video.mjs'

// Slice at the FIRST '=': URL query values may contain more '=' characters.
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const at = arg.indexOf('=')
  if (!arg.startsWith('--') || at < 3) throw new Error(`Expected --name=value: ${arg}`)
  return [arg.slice(2, at), arg.slice(at + 1)]
}))
for (const key of Object.keys(args)) {
  if (!['url', 'out', 'mode', 'video', 'width', 'height'].includes(key)) throw new Error(`Unknown option: --${key}`)
}
const mode = args.mode ?? 'all'
if (!['camera', 'tool', 'pacing', 'all', 'video','focus'].includes(mode)) throw new Error('Use --mode=camera|tool|pacing|all|video|focus')
if (args.video !== undefined && !['0', '1'].includes(args.video)) throw new Error('Use --video=0|1')
const url = new URL(args.url ?? 'http://localhost:5199/torque-wrench/?quality=full').href
const out = path.resolve(args.out ?? 'output/playwright/owner-visual-preview-2026-10-28/integrated-preview')
const root = fileURLToPath(new URL('../', import.meta.url))
const viewport = { width: Number(args.width??1440), height: Number(args.height??900) }
if(!Number.isInteger(viewport.width)||!Number.isInteger(viewport.height)||viewport.width<200||viewport.height<200)throw new Error('Invalid preview viewport')
const baseline = path.join(path.dirname(out), 'before-camera')
const localLink = file => path.relative(out, file).split(path.sep).map(encodeURIComponent).join('/')
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
mkdirSync(out, { recursive: true })
const report = {
  status: 'PREVIEW_ONLY', completion: 'NOT_STARTED', error: null,
  purpose: 'Owner visual proposal; owner acceptance OPEN; no engineering or verification claim',
  url, mode, viewport, launch: describeLaunch(), startedAt: new Date().toISOString(),
  baseline: { directory: baseline, exists: existsSync(baseline) },
  toolCaveat: '60-tooth presentation preview only; no certified dimensions, clearance, meshing or manufacturing claim.',
  samples: [], errors: [], video: null,
}
let browser
let phase = 'setup'

function listen(page) {
  page.on('pageerror', error => report.errors.push({ type: 'pageerror', message: String(error) }))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({ type: 'console', message: message.text() })
  })
  page.on('requestfailed', request => report.errors.push({ type: 'requestfailed', url: request.url(), message: request.failure()?.errorText }))
}

async function open(page) {
  listen(page)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__torqueWorld?.snapshot().ready && window.__torqueNarrative, null, { timeout: 120000 })
}

async function scrollToProgress(page, progress) {
  return page.evaluate(p => {
    const range = document.documentElement.scrollHeight - innerHeight
    const fraction = window.__torqueNarrative.scrollFraction(p)
    const requestedY = fraction * range
    window.scrollTo({ top: requestedY, behavior: 'instant' })
    return { requestedY, fraction, range }
  }, progress)
}

async function seek(page, progress) {
  const target = await scrollToProgress(page, progress)
  // Native scrolling rounds to CSS pixels. This is a reachability wait only.
  await page.waitForFunction(p => Math.abs(window.__torqueNarrative.snapshot().progress - p) <= .00005, progress, { timeout: 30000 })
  if (progress >= .62 && progress < .845) {
    await page.waitForFunction(() => window.__torqueWorld.snapshot().inspection?.ready, null, { timeout: 120000 })
  }
  await page.waitForTimeout(1600)
  return target
}

async function observe(page) {
  return page.evaluate(() => {
    const world = window.__torqueWorld.snapshot()
    const narrative = window.__torqueNarrative.snapshot()
    const motion = window.__torqueWorld.motionSample?.()
    const visible = element => {
      if(!element)return false
      for(let node=element;node;node=node.parentElement){
        const style=getComputedStyle(node)
        if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.01)return false
      }
      return true
    }
    return {
      narrative, progress: world.progress,
      cameraTime: world.inspection?.cameraTime ?? null,
      subjectTime: world.inspection?.subjectTime ?? null,
      camera: world.camera, inspection: world.inspection, motion,
      renderer: world.renderer, rendererTier: world.mechanical?.tier ?? null,
      journey: world.journey, isolation: world.isolation,
      callouts:[...document.querySelectorAll('[data-torque-hotspot]')].map(element=>({
        id:element.getAttribute('data-torque-hotspot'),visible:visible(element),
      })),
      leaders:[...document.querySelectorAll('[data-torque-leader]')].map(element=>({
        id:element.getAttribute('data-torque-leader'),
        visible:[...element.querySelectorAll('polyline,.torque-callout-reticle')].some(visible),
      })),
      nativeScroll: { x: scrollX, y: scrollY, range: document.documentElement.scrollHeight - innerHeight,
        fraction: scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) },
    }
  })
}

async function capture(page, point) {
  const row = { ...point, completion: 'PENDING', error: null }
  report.samples.push(row)
  try {
    row.scrollTarget = await seek(page, point.requestedProgress)
    Object.assign(row, await observe(page))
    row.progressError = row.narrative.progress - point.requestedProgress
    row.subjectTimeError = point.requestedTime === undefined ? null : row.subjectTime - point.requestedTime
    row.image = `${point.kind}-${point.requestedProgress.toFixed(5)}.png`
    await page.screenshot({ path: path.join(out, row.image) })
    row.completion = 'CAPTURED'
  } catch (error) {
    row.completion = 'ERROR'
    row.error = String(error.stack ?? error)
    report.errors.push({ type: 'capture', kind: point.kind, progress: point.requestedProgress, message: row.error })
    // Retain actual landing telemetry even if the reachability wait timed out.
    try { Object.assign(row, await observe(page)) } catch { /* page may have closed */ }
  }
  console.log(JSON.stringify({ kind: row.kind, requestedProgress: row.requestedProgress,
    progress: row.progress, cameraTime: row.cameraTime, subjectTime: row.subjectTime,
    nativeScroll: row.nativeScroll, rendererTier: row.rendererTier, completion: row.completion, error: row.error }))
}

async function recordVideo() {
  const directory = path.join(out, 'video', `screenshots-${Date.now()}-${randomUUID().slice(0, 8)}`)
  mkdirSync(directory, { recursive: true })
  const fps = 12.5
  report.video = { completion: 'PENDING', error: null, file: null, sweeps: [],
    source: 'Playwright page.screenshot PNG sequence; native scroll; no recordVideo/ANGLE screencast',
    fps, directory: localLink(directory), browserPlayback: 'NOT_CHECKED',
    note: 'Tool, carrier reveal, exploded camera. 51 screenshots per sweep, encoded at 12.5 fps (80ms/frame). Readiness/seek/startup and cuts are excluded. Capture wall time is slower than encoded time; this is a sampled scroll preview, not real-time playback or narrative-clock verification.' }
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  let frameCount = 0
  try {
    const page = await context.newPage()
    await open(page)
    for (const [start, end] of [[.665, .717], [.815, .825], [.855, .995]]) {
      await seek(page, start)
      const sweep = { start, end, before: await observe(page), frames: [] }
      report.video.sweeps.push(sweep)
      const began = performance.now()
      for (let i = 0; i <= 50; i++) {
        const progress = start + (end - start) * i / 50
        const scrollTarget = await scrollToProgress(page, progress)
        await page.waitForFunction(p => Math.abs(window.__torqueNarrative.snapshot().progress - p) <= .00005,
          progress, { timeout: 30000 })
        await page.waitForTimeout(80)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const actual = await observe(page)
        if (Math.abs(actual.narrative.progress - progress) > .00005) throw new Error(`Video frame missed native scroll progress ${progress}`)
        const image = `frame-${String(frameCount).padStart(5, '0')}.png`
        await page.screenshot({ path: path.join(directory, image) })
        sweep.frames.push({ index: frameCount, image, requestedProgress: progress, scrollTarget,
          progressError: actual.narrative.progress - progress, ...actual,
          elapsedMs: performance.now() - began, encodedTimeSeconds: frameCount / fps })
        frameCount++
      }
      sweep.after = await observe(page)
      console.log(JSON.stringify({ videoSweep: [start, end], screenshots: sweep.frames.length }))
    }
    report.video.servedSource = await page.evaluate(() => ({
      documentURL: location.href,
      assets: performance.getEntriesByType('resource').map(entry => entry.name)
        .filter(name => /\/assets\/[^?]+\.js(?:\?|$)/.test(name)),
    }))
  } catch (error) {
    report.video.completion = 'ERROR'
    report.video.error = String(error.stack ?? error)
    throw error
  } finally { await context.close() }
  try {
    const encoded = await encodePreviewVideo({ directory, fps, frameCount })
    Object.assign(report.video, encoded, { mp4: localLink(encoded.mp4), webm: localLink(encoded.webm),
      poster: localLink(encoded.poster), file: localLink(encoded.mp4), frameCount, completion: 'DECODE_CHECKED' })
  } catch (error) {
    report.video.completion = 'ERROR'
    report.video.error = String(error.stack ?? error)
    report.video.checks = error.videoChecks ?? null
    throw error
  }
}

function gallery() {
  const figure = (href, label) => `<figure><a href="${escape(href)}"><img loading="lazy" src="${escape(href)}" alt="${escape(label)}"></a><figcaption>${escape(label)}</figcaption></figure>`
  const captured = report.samples.filter(row => row.completion === 'CAPTURED')
  // Four storyboard picks; every requested camera point remains in the gallery.
  const styleframes = captured.filter(row => row.kind === 'camera' && [.865, .89, .915, .985].includes(row.requestedProgress))
  const comparisons = captured.filter(row => row.kind === 'camera').map(row => {
    const before = path.join(baseline, `p-${row.requestedProgress.toFixed(5)}.png`)
    return `<section><h3>p=${row.requestedProgress}</h3><div class="grid">${existsSync(before) ? figure(localLink(before), 'Before: historical camera baseline') : '<p>No matching baseline image.</p>'}${figure(row.image, 'Current integrated capture')}</div></section>`
  }).join('')
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Owner visual preview</title>
<style>body{background:#17191c;color:#eee;font:16px system-ui;margin:24px}a{color:#b6d9ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}figure{margin:0}img,video{width:100%}video{aspect-ratio:1440/900;object-fit:contain;background:#090b0f}figcaption{padding:8px 0}section{margin:24px 0}pre{white-space:pre-wrap}</style>
<h1>Owner visual proposal — PREVIEW_ONLY</h1><p>Owner appearance and pacing acceptance: <strong>OPEN</strong>. Capture completion: ${escape(report.completion)}. This gallery does not close runtime, beauty, HUD or engineering gates.</p>
<p>${escape(report.toolCaveat)}</p><p><a href="report.json">Captured telemetry / errors</a> · <a href="${escape(localLink(baseline))}/">Existing before-camera baseline</a> · <a href="${escape(localLink(path.join(baseline, 'report.json')))}">Baseline telemetry</a></p>
<h2>Styleframes</h2><div class="grid">${styleframes.map(row => figure(row.image, `p=${row.progress}, camera=${row.cameraTime}s, subject=${row.subjectTime}s`)).join('') || '<p>Camera mode not captured.</p>'}</div>
<h2>Camera comparisons</h2>${comparisons || '<p>No camera captures.</p>'}
<h2>Tool and pacing captures</h2><div class="grid">${captured.filter(row => row.kind !== 'camera').map(row => figure(row.image, `${row.kind}: requested ${row.requestedTime === undefined ? 'p=' + row.requestedProgress : row.requestedTime + 's'}, actual subject=${row.subjectTime}s, camera=${row.cameraTime}s`)).join('')}</div>
<h2>Short native-scroll preview</h2>${renderPreviewVideo(report.video)}
<h2>Capture errors</h2><pre>${escape(JSON.stringify({ error: report.error, errors: report.errors }, null, 2))}</pre></html>`
}

try {
  // Fail before acquiring the parent's browser resource if media tools are absent.
  const wantsVideo = args.video === '1' || mode === 'video'
  if (wantsVideo) report.mediaTools = await checkPreviewVideoTools()
  const points = []
  if(mode==='focus')points.push(...[.52,.665,.685,.701,.717,.915,.99].map(requestedProgress=>({kind:requestedProgress<.56||requestedProgress>.85?'callout':'tool',requestedProgress})))
  if (mode === 'camera' || mode === 'all') {
    points.push(...[.865, .89, .915, .94, .985].map(requestedProgress => ({ kind: 'camera', requestedProgress })))
  }
  if (mode === 'tool' || mode === 'all') {
    points.push(...[.665, .685, .701, .717].map(requestedProgress => ({ kind: 'tool', requestedProgress })))
  }
  if (mode === 'pacing' || mode === 'all') {
    // Compile in memory at RUN time, after the parent finishes integrating source.
    const source = buildSync({ entryPoints: [path.join(root, 'src/scene/torque-wrench/InspectionDirector.ts')],
      bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' }).outputFiles[0].text
    const clock = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
    points.push(...[44.4, 45.3, 46.2, 54.9, 58.7, 63.8].map(requestedTime => ({ kind: 'pacing', requestedTime,
      // InspectionDirector uses the study domain; JourneyDirector adds .115 to page progress.
      requestedProgress: clock.cascadeProgressAtTime(requestedTime) - .115 })))
  }
  phase = 'browser launch'
  browser = await launchBrowser(chromium)
  if (points.length) {
    phase = 'stills'
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
    try {
      const page = await context.newPage()
      await open(page)
      for (const point of points.sort((a, b) => a.requestedProgress - b.requestedProgress)) await capture(page, point)
    } finally { await context.close() }
  }
  if (wantsVideo) { phase = 'video'; await recordVideo() }
  report.completion = report.samples.some(row => row.completion === 'ERROR') ? 'PARTIAL' : 'CAPTURED'
} catch (error) {
  report.completion = 'ERROR'
  report.error = { phase, message: String(error.stack ?? error) }
} finally {
  try { await browser?.close() } catch (error) {
    report.errors.push({ type: 'browser-close', message: String(error) })
  }
  report.finishedAt = new Date().toISOString()
  writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2))
  writeFileSync(path.join(out, 'index.html'), gallery())
  console.log(JSON.stringify({ status: report.status, completion: report.completion, error: report.error,
    errors: report.errors.length, report: path.join(out, 'report.json'), gallery: path.join(out, 'index.html') }))
  if (report.completion !== 'CAPTURED' || report.errors.length) process.exitCode = 1
}
