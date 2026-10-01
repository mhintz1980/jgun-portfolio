import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')] }))
const url = args.url || 'http://localhost:5199'
const out = args.out || 'project/work/evidence/JG-035-opening-drafting-table/pre-pulse-shift-2026-09-30'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--use-angle=d3d11', '--enable-gpu'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
const samples = []
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__drawingProof?.ready && window.__telemetry?.drawing?.annotationsReady, null, { timeout: 90000 })
  await page.evaluate(() => {
    const scene = window.__threeScene
    const paper = scene.getObjectByName('engineering-drawing-Z0')
    const frame = scene.getObjectByName('engineering-drawing-plane-frame')
    const line = frame.children.find(m => m.geometry?.getAttribute('aSeg'))
    const seg = line.geometry.getAttribute('aSeg'), timing = line.geometry.getAttribute('aStyle')
    const ink = []
    for (let i = 0; i < seg.count && ink.length < 32; i += Math.max(1, Math.floor(seg.count / 300))) {
      if (timing && timing.getY(i) !== 12) continue
      ink.push([(seg.getX(i) + seg.getZ(i)) / 2, (seg.getY(i) + seg.getW(i)) / 2])
    }
    if (ink.length < 5) {
      ink.length = 0
      for (let i = 0; i < seg.count && ink.length < 32; i += Math.max(1, Math.floor(seg.count / 32))) ink.push([(seg.getX(i) + seg.getZ(i)) / 2, (seg.getY(i) + seg.getW(i)) / 2])
    }
    window.__shiftPatches = { ink, paper: [[-.10,.10],[-.02,.10],[.06,.10],[.14,.10],[-.10,-.08],[-.02,-.08],[.06,-.08],[.14,-.08]] }
    window.__shiftNull = 'normal'
    const previous = paper.onBeforeRender
    const saved = paper.material.uniforms.uLamp.value.clone()
    paper.onBeforeRender = function (...values) {
      previous.apply(this, values)
      saved.copy(this.material.uniforms.uLamp.value)
      if (window.__shiftNull === 'no-pool') this.material.uniforms.uLamp.value.set(-2, -2, .01)
    }
    paper.onAfterRender = function () { this.material.uniforms.uLamp.value.copy(saved) }
  })
  for (const t of (args.points || '.30,.32,.34,.36,.38,.40,.42,.46,.50,.54').split(',').map(Number)) {
    await page.evaluate(t => window.__drawingProof.setProgress(t * .12), t)
    await page.waitForTimeout(1000)
    for (const mode of ['normal', 'no-pool']) {
      await page.evaluate(m => { window.__shiftNull = m }, mode)
      await page.waitForTimeout(100)
      const measurement = await page.evaluate(() => {
        if (!window.__threeScene || !document.querySelector('canvas')) throw new Error('LIVE_CANVAS_MISSING')
        const frame = window.__threeScene.getObjectByName('engineering-drawing-plane-frame')
        const u = window.__threeScene.getObjectByName('engineering-drawing-Z0').material.uniforms
        const canvas = document.querySelector('canvas'), rect = canvas.getBoundingClientRect()
        const project = ([x, y]) => {
          const p = frame.position.clone().set(x, y, .0003).applyMatrix4(frame.matrixWorld).project(window.__threeCamera)
          return { sheet: [x, y], x: rect.x + (p.x + 1) * rect.width / 2, y: rect.y + (1 - p.y) * rect.height / 2 }
        }
        const patches = Object.fromEntries(Object.entries(window.__shiftPatches).map(([k, ps]) => [k, ps.map(project)]))
        const uniforms = Object.fromEntries(['uLamp','uKey','uContrast','uOpacity','uPulse','uVellum','uFlexAmplitude','uContact','uLampPower','uReadingPool'].filter(k => u[k]).map(k => [k, u[k].value?.toArray?.() ?? u[k].value]))
        return { patches, uniforms, drawing: structuredClone(window.__telemetry.drawing), stats: structuredClone(window.__sheetStats), tier: window.__telemetry.performance.tier }
      })
      const file = `t${t.toFixed(2)}-${mode}.png`
      const png = await page.screenshot({ path: path.join(out, file) })
      const pixels = await page.evaluate(async ({ b64, patches }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0)
        const result = {}
        for (const [kind, ps] of Object.entries(patches)) {
          result[kind] = ps.map(p => {
            const x = Math.round(p.x), y = Math.round(p.y)
            if (x < 4 || y < 4 || x >= img.width - 4 || y >= img.height - 4) return { ...p, valid: false }
            const rgba = ctx.getImageData(x - 3, y - 3, 7, 7).data, lum = []
            for (let i = 0; i < rgba.length; i += 4) lum.push(.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2])
            lum.sort((a,b) => a-b)
            return { ...p, valid: true, mean: lum.reduce((a,b) => a+b, 0)/lum.length, low: lum[4], median: lum[24], high: lum[44] }
          })
        }
        return result
      }, { b64: png.toString('base64'), patches: measurement.patches })
      samples.push({ t, mode, file, ...measurement, pixels })
      await writeFile(path.join(out, 'samples.json'), JSON.stringify({ url, errors, samples }, null, 2))
      const mean = key => { const valid = pixels[key].filter(p => p.valid); return valid.reduce((s,p) => s+p.mean,0)/valid.length }
      console.log(JSON.stringify({ t, mode, paper: mean('paper'), inkPatch: mean('ink'), uniforms: measurement.uniforms, tier: measurement.tier }))
    }
  }
} finally { await browser.close() }
if (errors.length) { console.error(errors); process.exitCode = 1 }
