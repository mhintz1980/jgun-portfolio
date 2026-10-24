import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire('C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine/package.json')('playwright')
const [base, out, label] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
const errors = []
const result = {}
async function seek(page, u) {
  const frame = await page.evaluate(u => { const q = window.__quietMachine; const f = q.frame; q.seek(u); return f }, u)
  await page.waitForFunction(f => window.__quietMachine.frame > f, frame)
  await page.waitForFunction(u => Number(document.querySelector('input[type=range]').value) === Math.round(u * 1000), u)
}
for (const [name, w, h, quality] of [['full', 390, 844, 'full'], ['lite', 390, 844, 'lite']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`${base}/quiet-machine/?quality=${quality}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  result[name] = {}
  for (const u of [0, .2, .51, .8]) {
    await seek(page, u)
    if (name === 'lite') await page.screenshot({ path: path.join(out, `${label}-lite-u${String(Math.round(u * 1000)).padStart(3, '0')}.png`) })
    const t = await page.evaluate(() => JSON.parse(JSON.stringify(window.__quietMachine)))
    result[name][u] = { counts: t.counts, drawCalls: t.drawCalls, capTarget: t.capTarget }
  }
  await page.close()
}
await browser.close()
const c = u => k => result.lite[u].counts[k]
console.log(JSON.stringify({ label, errors, lite: result.lite[0].counts, full: result.full[0].counts,
  liteDraw: Object.fromEntries(Object.entries(result.lite).map(([u, v]) => [u, v.drawCalls])),
  capEqual: Object.keys(result.lite).map(u => [u, result.lite[u].counts.cappedTriangles, result.full[u].counts.cappedTriangles]) }, null, 1))
