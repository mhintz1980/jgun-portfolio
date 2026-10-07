import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback
const out = path.resolve(arg('out', 'project/work/evidence/JG-035-opening-drafting-table/portal-correction-2026-10-02/capture'))
const url = arg('url', 'http://localhost:4173')
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--use-angle=d3d11', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'] })
const pixelTimes = [0.8405, 0.845, 0.855, 0.865, 0.88, 0.92]
const pressureAt = t => { const u = Math.max(0, Math.min(1, (t - .79) / .05)); return u * u * (3 - 2 * u) }
const report = { url, pixelTimes, pixelContract: 'same-frame normal versus portal/model/desk hidden; profile mask, unchanged controls, zero visible desk', cases: [], pass: true }
try {
  for (const viewport of [{name:'desktop', width:1600,height:900},{name:'narrow',width:390,height:844}].filter(v => !arg('case','') || v.name === arg('case',''))) {
    const dir = path.join(out, viewport.name)
    fs.mkdirSync(dir, { recursive:true })
    const context = await browser.newContext({ viewport, recordVideo: { dir: path.join(dir,'video'), size: {width:viewport.width,height:viewport.height} } })
    const page = await context.newPage(), errors = [], failures = []
    await page.addInitScript(() => { window.__scrollCommitDisabled = true })
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', m => { if(m.type()==='error') errors.push(m.text()) })
    await page.goto(url, { waitUntil:'domcontentloaded', timeout:120000 })
    await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, {timeout:150000})
    const steps = [0.59,0.72,0.79,0.825,0.84,0.8405,0.845,0.855,0.865,0.88,0.895,0.905,0.92,0.97,1]
    const samples = []
    const take = async (t, reverse = false) => {
      await page.evaluate(t => window.__drawingProof.setProgress(t * .12), t)
      await page.waitForFunction(t => Math.abs(window.__telemetry.drawing.phase - t)<1e-8, t)
      await page.waitForTimeout(900)
      const sample = await page.evaluate(() => ({ drawing:window.__telemetry.drawing, stats:window.__sheetStats,
        tier:window.__telemetry.performance.tier, proof:window.__drawingProof.captureBreakthrough(),
        pixels:window.__drawingProof.captureLightningPixels(),
        portal: (() => { const p = window.__drawingProof.capturePortal?.(); if (!p) return null; const { profile, ...evidence } = p; return evidence })(),
        live: [...document.querySelectorAll('canvas')].some(c => c.width>1 && c.height>1 && c.isConnected) }))
      if (!sample.live) failures.push(`t=${t}: no live canvas`)
      if (sample.stats.paperOpacity !== 1 || sample.proof.opacity !== 1) failures.push(`t=${t}: paper lost opacity`)
      if (Math.abs(sample.proof.area-sample.proof.fragmentArea)>sample.proof.area*1e-6) failures.push(`t=${t}: partition area mismatch`)
      if (t > .79 && !sample.proof.modelMoving) failures.push(`t=${t}: causal push absent`)
      if (t >= .84 && sample.drawing.pbr !== 1) failures.push(`t=${t}: first gap must reveal resolved metal`)
      if (t >= .84 && t <= .96 && sample.drawing.illumination !== 0) failures.push(`t=${t}: studio light must stay off through blue-lit rupture`)
      if (sample.proof.openingClear !== (t >= .88 ? 1 : 0)) failures.push(`t=${t}: fracture clearance boundary changed`)
      if (t >= .79 && t <= .84 && sample.proof.maxZ > .012 * pressureAt(t) + 1e-6) failures.push(`t=${t}: model top exceeds the pressure bulge`)
      if (sample.proof.minZ < -.001 && sample.proof.maxZ > .001 && sample.proof.outsideOpening > 0) failures.push(`t=${t}: barrier collision ${sample.proof.outsideOpening}`)
      if (t >= .84 && (!sample.portal?.active || sample.portal.opacity !== 1 || sample.portal.depthTest !== true ||
        sample.portal.depthWrite !== true || sample.portal.capBehindInitialModel !== true || sample.portal.deskProfileDiscard !== true)) failures.push(`t=${t}: opaque portal depth/desk exclusion missing`)
      if (t>.79 && t<.84 && sample.pixels.changedBrightPixels === 0) failures.push(`t=${t}: closed profile glow absent`)
      if (pixelTimes.includes(t) && !reverse) {
        sample.portalPixels = await page.evaluate(() => {
          const capture = window.__drawingProof?.capturePortalPixels
          if (typeof capture !== 'function') return { available: false }
          try { return { available: true, ...capture() } } catch (error) { return { available: true, error: String(error) } }
        })
        const p = sample.portalPixels
        const demand = (condition, message) => { if (!condition) failures.push(`t=${t}: ${message}`) }
        demand(p.available && !p.error, `capturePortalPixels unavailable or failed (${p.error ?? 'missing hook'})`)
        if (p.available && !p.error) {
          demand(p.fixedCamera === true, 'null comparisons moved the camera')
          demand(p.portalActive === true && p.modelVisible === true && p.shaderValid === true, 'portal/model inactive or shader invalid')
          demand(Number.isInteger(p.sampledInsidePixels) && p.sampledInsidePixels > 0, 'visible opening mask has no measured pixels')
          demand(Number.isInteger(p.portalChangedPixels) && p.portalChangedPixels >= 0, 'portal pixel measurement invalid')
          // The emerging shell may fill the visible aperture mid-fracture. Once
          // fragments clear, the surrounding portal must contribute real pixels.
          if (t >= .88) demand(p.portalChangedPixels > 0, 'portal depth absent in the cleared opening')
          demand(Number.isInteger(p.modelChangedPixels) && p.modelChangedPixels > 0, 'immediate metal contributes no pixels in the rupture')
          demand(p.deskChangedInsidePixels === 0, `wooden desk contributes ${p.deskChangedInsidePixels} pixels inside the opening`)
          demand(Array.isArray(p.controls) && p.controls.length >= 2 && p.controls.every(c =>
            Number.isInteger(c.pixels) && c.pixels > 0 && Array.isArray(c.rect) && c.rect.length === 4 &&
            c.portalChangedPixels === 0 && c.modelChangedPixels === 0 && Number.isInteger(c.deskChangedPixels)),
          'portal/model control rectangles missing or changed')
          const rect = p.sampleClipRect
          demand(rect && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0 &&
            rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= p.width && rect.y + rect.height <= p.height, 'portal clip rectangle unavailable or outside render target')
        }
        fs.writeFileSync(path.join(dir, `portal-pixels-${String(t).replace('.', '_')}.json`), JSON.stringify(p, null, 2))
      }
      const {profile,...proof} = sample.proof
      samples.push({t,reverse,...sample,proof})
      if (!reverse) await page.screenshot({path:path.join(dir,`t-${String(t).replace('.','_')}.png`)})
      return sample
    }
    for(const t of steps) await take(t)
    for(const t of [.865,.825,.72]) {
      const reversed=await take(t,true), forward=samples.find(s=>s.t===t&&!s.reverse)
      for(const key of ['fracture','openingClear','crackGlow','crackWeb','flexAmplitude','paperOpacity']) {
        if(Math.abs(reversed.stats[key]-forward.stats[key])>1e-9) failures.push(`t=${t}: reverse ${key}`)
      }
      if(JSON.stringify(reversed.proof.fragments)!==JSON.stringify(forward.proof.fragments)) failures.push(`t=${t}: reverse fragment transforms`)
    }
    await page.evaluate(() => window.__drawingProof.setProgress(.72*.12))
    await page.waitForTimeout(1000)
    const motion = await page.evaluate(async () => {
      const samples = [], begin = performance.now(), duration = 9500
      await new Promise(resolve => { function frame() {
        const u=Math.min(1,(performance.now()-begin)/duration), t=.72+.28*u
        window.__drawingProof.setProgress(t*.12)
        if(samples.length===0 || performance.now()-samples.at(-1).at>120) samples.push({at:performance.now(),t,drawing:structuredClone(window.__telemetry.drawing),stats:structuredClone(window.__sheetStats)})
        if(u<1) requestAnimationFrame(frame); else resolve()
      } requestAnimationFrame(frame) })
      return samples
    })
    await page.waitForTimeout(1200)
    const video = page.video()
    await context.close()
    const videoPath = path.join(dir,'breakthrough.webm')
    await video.saveAs(videoPath)
    const entry = {viewport,errors,failures,samples,motion,video:videoPath,pass:!errors.length&&!failures.length}
    fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(entry,null,2))
    report.cases.push({name:viewport.name,pass:entry.pass,errors,failures,video:videoPath})
    report.pass &&= entry.pass
    console.log(JSON.stringify(report.cases.at(-1)))
  }
} catch (error) {
  report.pass = false
  report.error = String(error)
  throw error
} finally {await browser.close();fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(report,null,2))}
process.exitCode = report.pass ? 0 : 1
