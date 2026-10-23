import fs from 'node:fs'
import { createRequire } from 'node:module'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const base = process.argv[2]
const rows = [['desktop-full', 1440, 900, 'full', 1], ['desktop-lite', 1440, 900, 'lite', 1], ['phone-size-full', 390, 844, 'full', 2], ['phone-size-lite', 390, 844, 'lite', 2]]
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))] }
const out = {}
for (const [name, w, h, quality, dpr] of rows) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  await page.goto(`${base}/quiet-machine/?quality=${quality}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  const r = await page.evaluate(async () => {
    const q = window.__quietMachine, N = 600, dts = [], tri = [], dc = []
    let last = performance.now()
    for (let i = 0; i <= N; i++) {
      const f = q.frame
      q.seek(i / N)
      while (q.frame === f) await new Promise(res => requestAnimationFrame(res))
      const now = performance.now(); dts.push(now - last); last = now
      tri.push(q.triangles); dc.push(q.drawCalls)
    }
    const gl = (() => { const c = document.createElement('canvas'); const g = c.getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : null })()
    return { dts: dts.slice(5), maxTri: Math.max(...tri), maxDc: Math.max(...dc), gl }
  })
  out[name] = { n: r.dts.length, p50: +pct(r.dts, .5).toFixed(2), p95: +pct(r.dts, .95).toFixed(2), p99: +pct(r.dts, .99).toFixed(2), max: +Math.max(...r.dts).toFixed(2), maxTriangles: r.maxTri, maxDrawCalls: r.maxDc, renderer: r.gl }
  await page.close()
}
await browser.close()
console.log(JSON.stringify(out, null, 1))
