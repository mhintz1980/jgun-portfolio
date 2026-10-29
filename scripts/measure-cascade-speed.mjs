/** Native pacing and real-time rendered angular evidence; no scene mutation. */
import { chromium } from 'playwright'
import { buildSync } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { launchConfig } from './lib/browser-launch.mjs'

const out = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) ?? 'output/playwright/owner-corrections/56-speed-baseline')
mkdirSync(out, { recursive: true })
const load = async entry => {
  const bytes = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' }).outputFiles[0].contents
  return import(`data:text/javascript;base64,${Buffer.from(bytes).toString('base64')}`)
}
const clock = await load('src/scene/torque-wrench/InspectionDirector.ts')
function pageAt(time, aspect) {
  if (time >= 58) return .825
  let lo = .735, hi = .94
  const scratch = clock.createPrivateInspectionSample()
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (clock.samplePrivateInspection(mid, aspect, scratch).subjectTime < time) lo = mid; else hi = mid
  }
  return .62 + (lo + hi) / 2 - .735
}
const browser = await chromium.launch({ ...launchConfig(), headless: !process.argv.includes('--headed') })
const results = []
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1,
      ...(process.argv.includes('--no-video') ? {} : { recordVideo: { dir: path.join(out, String(viewport.width)), size: viewport } }) })
    const page = await context.newPage()
    await page.goto('http://localhost:5292/torque-wrench/?quality=full', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__torqueWorld?.snapshot().ready && window.__torqueWorld.snapshot().sheet?.stats?.shaderWarmReady === 1, null, { timeout: 180000 })
    const installation = await page.evaluate(() => {
      const w = window.__torqueWorld.snapshot()
      return { renderer: w.renderer.backend, tier: w.sheet.tier,
        modules: performance.getEntriesByType('resource').map(r => r.name).filter(name => /\/assets\/[^/]+\.js$/.test(name)) }
    })
    installation.modules = await Promise.all(installation.modules.map(async url => {
      const served = Buffer.from(await (await fetch(url)).arrayBuffer()), filename = path.basename(new URL(url).pathname)
      const sha = bytes => createHash('sha256').update(bytes).digest('hex')
      const servedSha256 = sha(served), localSha256 = sha((await import('node:fs')).readFileSync(path.join('dist/assets', filename)))
      if (servedSha256 !== localSha256) throw new Error('Measurement loaded stale production module: ' + filename)
      return { filename, servedSha256, localSha256 }
    }))
    const pacing = await page.evaluate(() => ({ ...window.__torqueNarrative.pacing(), height: innerHeight,
      fractions: Array.from({ length: 601 }, (_, i) => { const p = .815 + .01 * i / 600; return { p, f: window.__torqueNarrative.scrollFraction(p) } }) }))
    const scratch = clock.createPrivateInspectionSample(), aspect = viewport.width / viewport.height
    const samples = pacing.fractions.map(v => ({ ...v, time: clock.samplePrivateInspection(v.p + .115, aspect, scratch).subjectTime, y: v.f * pacing.actualRange }))
    const clockRates = samples.slice(1).map((s, i) => (s.time - samples[i].time) / (s.y - samples[i].y) * viewport.height)
    const native = { viewport, installation, headed: process.argv.includes('--headed'), pacing: { ...pacing, fractions: undefined }, nativePixels: samples.at(-1).y - samples[0].y,
      nominalPixelsPerSecond: viewport.height, nominalSeconds: (samples.at(-1).y - samples[0].y) / viewport.height,
      minPlayheadSecondsPerWallSecond: Math.min(...clockRates), maxPlayheadSecondsPerWallSecond: Math.max(...clockRates), samples }
    const nominal = process.argv.includes('--nominal')
    const pathPoints = Array.from({ length: 1781 }, (_, i) => ({ time: 40.2 + i / 100, p: pageAt(40.2 + i / 100, aspect) }))
    const nativePath = await page.evaluate(points => points.map(s => ({ ...s,
      y: window.__torqueNarrative.scrollFraction(s.p) * (document.documentElement.scrollHeight - innerHeight) })), pathPoints)
    // Warm every actual reveal before recording, including Draco clones and PBR programs.
    for (const p of [.825, .822, .820, .818, .815]) {
      await page.evaluate(p => window.scrollTo({ top: window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), p)
      await page.waitForTimeout(1200)
    }
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), samples[0].y)
    await page.waitForTimeout(1800)
    native.nominal = nominal ? { method: 'Authored 1x: one study second per elapsed second, inverted through native scroll pacing', durationSeconds: 17.8,
      minPixelsPerSecond: Math.min(...nativePath.slice(1).map((s,i)=>(s.y-nativePath[i].y)*100)),
      maxPixelsPerSecond: Math.max(...nativePath.slice(1).map((s,i)=>(s.y-nativePath[i].y)*100)) } : null
    if (nominal) {
      // A complete unrecorded native traversal warms partial-alpha programs too.
      await page.evaluate(async points => new Promise(resolve => {
        let start
        const tick = now => {
          start ??= now
          const u = Math.min(1780, (now - start) / 10), i = Math.min(1779, Math.floor(u))
          window.scrollTo({ top: points[i].y + (points[i + 1].y - points[i].y) * (u - i), behavior: 'instant' })
          if (u < 1780) requestAnimationFrame(tick); else resolve()
        }
        requestAnimationFrame(tick)
      }), nativePath)
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), samples[0].y)
      await page.waitForTimeout(1800)
    }
    native.frames = await page.evaluate(async ({ from, to, speed, nativePath, nominal }) => new Promise(resolve => {
      const frames = []; let start
      function tick(now) {
        start ??= now
        const elapsed = (now - start) / 1000, index = Math.min(1779, Math.floor(elapsed * 100))
        const blend = Math.min(1, elapsed * 100 - index)
        const y = nominal ? nativePath[index].y + (nativePath[index + 1].y - nativePath[index].y) * blend : Math.min(to, from + elapsed * speed)
        window.scrollTo({ top: y, behavior: 'instant' })
        const w = window.__torqueWorld.motionSample()
        frames.push({ now, y: scrollY, progress: w.progress, time: w.time, renderFrame: w.frames,
          sun: w.sun, carriers: w.carriers, localPlanet: w.localPlanet, inputRpm: w.inputRpm, meshPhaseError: w.meshPhaseError })
        if (nominal ? elapsed < 18.8 : y < to) requestAnimationFrame(tick); else resolve(frames)
      }
      requestAnimationFrame(tick)
    }), { from: samples[0].y, to: samples.at(-1).y, speed: viewport.height, nativePath, nominal })
    native.video = page.video() ? await page.video().path() : null
    await page.screenshot({ path: path.join(out, `end-${viewport.width}.png`) })
    await context.close()
    const steps = native.frames.slice(1).flatMap((f, i) => Number.isFinite(f.sun) && Number.isFinite(native.frames[i].sun) ? [{ dt: f.now - native.frames[i].now, sun: Math.abs(f.sun - native.frames[i].sun) * 180 / Math.PI }] : [])
    native.summary = { frames: native.frames.length, maxSunDegreesPerFrame: Math.max(...steps.map(s => s.sun)), maxGapMs: Math.max(...steps.map(s => s.dt)),
      medianFrameMs: steps.map(s => s.dt).sort((a,b)=>a-b)[Math.floor(steps.length/2)] }
    results.push(native)
    writeFileSync(path.join(out, 'measurement.json'), JSON.stringify(results))
    console.log(JSON.stringify({ ...native, samples: undefined, frames: undefined }))
  }
} finally { await browser.close() }
