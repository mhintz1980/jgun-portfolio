// Doc 45 §5 checkpoint captures: one screenshot + runtime telemetry per owner item.
// Usage: node scripts/capture-45-checkpoints.mjs [--url=...] [--out=...] [--points=0.18,0.48]
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const args = Object.fromEntries(process.argv.slice(2).map(x => x.replace(/^--/, '').split('=')))
const url = args.url ?? 'http://localhost:5341/torque-wrench/'
const out = args.out ?? 'output/playwright/doc45-checkpoints'
mkdirSync(out, { recursive: true })
// [label, page progress]. Shaft subject times map to page p via JourneyDirector (p = ip - 0.115).
const all = [
  ['check1-3-sheet-p0.18', .18], ['check1-3-sheet-p0.28', .28], ['check1-3-sheet-p0.35', .35],
  ['check4-5-ring-isolated-p0.480', .48], ['check6-blue-shift0-p0.515', .515], ['check5-p0.520', .52],
  ['check5-p0.545', .545], ['check6-red-shift1-p0.550', .55], ['check5-shaft-p0.590', .59],
  ['check7-4140-t16.5', .73328], ['check7-4340-t19.0', .73792], ['check7-C300-t21.5', .74314],
  ['check8-midwipe-t23.8', .74976], ['check5-p0.900', .9], ['check5-stage2-p0.920', .92], ['check9-collapse-p0.955', .955], ['check9-collapse-p0.965', .965],
]
const wanted = args.points ? args.points.split(',').map(Number) : null
const points = wanted ? all.filter(([, p]) => wanted.some(w => Math.abs(w - p) < 1e-6)) : all
const browser = await launchBrowser(chromium)
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' })).newPage()
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
const report = { launch: describeLaunch(), url, capturedAt: new Date().toISOString(), errors, samples: [] }
const save = () => writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1))
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => {
    const w = window.__torqueWorld?.snapshot?.()
    return w?.ready && w.sheet?.baked && w.sheet.stats?.annotationsReady === 1 && w.sheet.stats?.shaderWarmReady === 1 && window.__torqueNarrative
  }, null, { timeout: 600000, polling: 1000 })
  for (const [label, p] of points) {
    const t0 = Date.now()
    await page.evaluate(p => window.scrollTo(0, window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight)), p)
    await page.waitForFunction(p => {
      const n = window.__torqueNarrative.snapshot(), w = window.__torqueWorld.snapshot()
      if (Math.abs(n.progress - p) > 5e-5) return false
      const j = w.journey
      if (j && (j.pending || (typeof j.effectiveProgress === 'number' && Math.abs(j.effectiveProgress - p) > 5e-5))) return false
      return p < .56 || p > .855 || !w.inspection || w.inspection.ready !== false
    }, p, { timeout: 300000, polling: 500 })
    await page.waitForTimeout(3000)
    const sample = await page.evaluate(() => {
      const w = window.__torqueWorld.snapshot()
      const callouts = [...document.querySelectorAll('[data-torque-hotspot]')].map(x => {
        const r = x.getBoundingClientRect()
        return { id: x.getAttribute('data-torque-hotspot'), visible: r.width > 0 && getComputedStyle(x).visibility !== 'hidden' && Number(getComputedStyle(x).opacity) > .01 }
      })
      return { narrative: window.__torqueNarrative.snapshot(), camera: w.camera, shift: w.mechanical?.channels?.shift,
        overlay: window.__torqueWorld.overlaySample?.(), callouts, fos: [...document.querySelectorAll('[data-shaft-fos-model]')].map(x => x.textContent),
        inspection: w.inspection, journey: w.journey }
    })
    if ([.48, .515, .55].includes(p) && await page.evaluate(() => !!window.__torqueWorld.grooveCapture)) {
      sample.groovePixels = await page.evaluate(async () => {
        const proof = window.__torqueWorld.grooveCapture()
        const decode = async url => { const b = await createImageBitmap(await (await fetch(url)).blob()); const c = new OffscreenCanvas(b.width, b.height).getContext('2d'); c.drawImage(b, 0, 0); return c.getImageData(0, 0, b.width, b.height).data }
        const beauty = await decode(proof.beauty), result = {}
        for (const [id, u] of Object.entries(proof.without)) {
          const hidden = await decode(u); let changed = 0, colored = 0
          for (let i = 0; i < beauty.length; i += 4) {
            if (Math.max(Math.abs(beauty[i]-hidden[i]), Math.abs(beauty[i+1]-hidden[i+1]), Math.abs(beauty[i+2]-hidden[i+2])) > 3) {
              changed++
              if (id === 'red' ? beauty[i] > beauty[i+2]*1.2 && beauty[i] > beauty[i+1]*1.2 : beauty[i+2] > beauty[i]*1.2) colored++
            }
          }
          result[id] = { changed, colored }
        }
        return result
      })
    }
    sample.label = label; sample.requested = p; sample.seconds = (Date.now() - t0) / 1000
    await page.screenshot({ path: `${out}/${label}.png`, timeout: 300000 })
    report.samples.push(sample); save()
    console.log(label, p, `${sample.seconds}s`, 'callouts:', sample.callouts.filter(c => c.visible).map(c => c.id).join('|') || '-', sample.groovePixels ? JSON.stringify(sample.groovePixels) : '')
  }
} catch (e) { report.failure = String(e); console.error(e) } finally { save(); await browser.close() }
