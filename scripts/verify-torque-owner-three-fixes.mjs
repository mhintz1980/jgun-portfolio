// Native-scroll runtime proof for the three owner corrections of 2026-10-24.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { launchBrowser, describeLaunch } from './lib/browser-launch.mjs'

const args = Object.fromEntries(process.argv.slice(2).map(x => x.replace(/^--/, '').split('=')))
const url = args.url ?? 'http://localhost:5352/torque-wrench/'
const out = args.out ?? 'output/playwright/owner-three-fixes-2026-10-24'
mkdirSync(out, { recursive: true })
const report = { url, launch: describeLaunch(), errors: [], opening: [], housing: null, alloys: [], gates: [] }
const save = () => writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
const browser = await launchBrowser(chromium)
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' })).newPage()
page.on('pageerror', e => report.errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()) })
const gate = (name, pass, detail) => report.gates.push({ name, pass: Boolean(pass), detail })
async function seek(p) {
  await page.evaluate(p => window.scrollTo(0, window.__torqueNarrative.scrollFraction(p) * (document.documentElement.scrollHeight - innerHeight)), p)
  await page.waitForFunction(p => {
    const w = window.__torqueWorld.snapshot()
    return Math.abs(w.progress - p) < 5e-5 && (p < .56 || p > .855 || w.inspection.ready)
  }, p, { timeout: 90000, polling: 200 })
  await page.waitForTimeout(250)
}
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => {
    const w = window.__torqueWorld?.snapshot()
    return w?.ready && w.sheet.baked && w.sheet.stats.annotationsReady === 1 && w.sheet.stats.shaderWarmReady === 1
  }, null, { timeout: 180000, polling: 500 })
  report.renderer = await page.evaluate(() => window.__torqueWorld.snapshot().renderer)
  for (const p of [.42, .424, .428, .432, .436, .44, .444, .448, .452, .454, .456, .458, .459, .46]) {
    await seek(p)
    const opening = await page.evaluate(() => window.__torqueWorld.snapshot().opening)
    report.opening.push({ p, ...opening })
    if ([.428, .44, .452, .456, .46].includes(p)) await page.screenshot({ path: `${out}/ascent-${p}.png`, timeout: 60000 })
    save()
  }
  const start = report.opening[0], final = report.opening.at(-1)
  const delta = final.modelMatrix.slice(12, 15).map((v, i) => v - start.modelMatrix[12 + i])
  const distance = Math.hypot(...delta), direction = delta.map(v => v / distance)
  const along = s => s.modelMatrix.slice(12, 15).reduce((n, v, i) => n + v * direction[i], 0)
  const steps = report.opening.slice(1).map((s, i) => along(s) - along(report.opening[i]))
  gate('model keeps ascending to full endpoint', distance > .001 && steps.every(x => x > 1e-8), { distance, minimumStep: Math.min(...steps) })
  gate('endpoint world transform is identity', final.modelMatrix.every((v, i) => Math.abs(v - (i % 5 === 0 ? 1 : 0)) < 1e-8), final.modelMatrix)
  await seek(.515)
  report.housing = await page.evaluate(() => window.__torqueWorld.snapshot().housingMaterials)
  gate('live black oxide shaders have no lathe stripes', report.housing.length > 0 && report.housing.every(x => x.programs.every(k => k.endsWith('-base'))), report.housing)
  await page.screenshot({ path: `${out}/smooth-housings.png`, timeout: 60000 })
  for (const [name, p, expected] of [['4140', .73328, .55], ['4340', .73792, .72], ['C300', .74314, .9]]) {
    await seek(p)
    const sample = await page.evaluate(() => ({ probe: window.__torqueWorld.stressProbe(), pixels: window.__torqueWorld.stressCapture(), time: window.__torqueWorld.snapshot().inspection.subjectTime }))
    const png = await page.screenshot({ path: `${out}/fea-${name}.png`, timeout: 60000 })
    sample.hues = await page.evaluate(async data => {
      const bitmap = await createImageBitmap(await (await fetch(data)).blob())
      const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')
      ctx.drawImage(bitmap, 0, 0)
      // Shaft-only central region; excludes the FOS legend and caption panels.
      const pixels = ctx.getImageData(480, 230, 750, 500).data
      const counts = { red: 0, orange: 0, yellow: 0, green: 0, cyan: 0, blue: 0 }
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
        if (d < .15 || max < .2) continue
        let h = (max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60
        if (h < 0) h += 360
        if (h < 12 || h > 345) counts.red++
        else if (h < 45) counts.orange++
        else if (h < 75) counts.yellow++
        else if (h < 165) counts.green++
        else if (h < 205) counts.cyan++
        else if (h < 260) counts.blue++
      }
      bitmap.close()
      return counts
    }, `data:image/png;base64,${png.toString('base64')}`)
    report.alloys.push({ name, p, ...sample })
    gate(`${name} exact minimum and shader active`, sample.probe.some(x => x.shaderReady && x.uniformMix > .9 && Math.abs(x.hotspotFos - expected) < .001), sample.probe)
    gate(`${name} rendered FEA gradient`, sample.pixels.coloredPixels > 10 && ['yellow', 'green', 'cyan', 'blue'].every(k => sample.hues[k] > 10), { pixels: sample.pixels, hues: sample.hues })
    save()
  }
  gate('no browser errors', report.errors.length === 0, report.errors)
} catch (error) {
  report.failure = String(error)
  gate('runtime completed', false, report.failure)
} finally {
  save()
  await browser.close()
}
for (const g of report.gates) console.log(`${g.pass ? 'PASS' : 'FAIL'} ${g.name}`)
console.log(`Report: ${out}/report.json`)
if (report.failure || report.gates.some(g => !g.pass)) process.exitCode = 1
