// Scratch proof: at every closed u, caps on vs caps off must be pixel-identical (threshold 0).
// usage: node closed-proof.mjs <base> <outdir>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const REPO = 'C:/Users/Markimus/.buzz/REPOS/jgun-quiet-machine'
const { chromium } = createRequire(REPO + '/package.json')('playwright')
const { compare } = await import('file:///' + REPO + '/scripts/lib/preview-pixels.mjs')
const base = process.argv[2], out = process.argv[3]
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'] })
async function seek(page, u) {
  const frame = await page.evaluate(u => { const q = window.__quietMachine; const f = q.frame; q.seek(u); return f }, u)
  await page.waitForFunction(f => window.__quietMachine.frame > f, frame)
}
async function setCaps(page, on) {
  const frame = await page.evaluate(on => { const q = window.__quietMachine; const f = q.frame; q.setCaps(on); return f }, on)
  await page.waitForFunction(f => window.__quietMachine.frame > f, frame)
}
const result = {}
for (const [name, width, height, quality] of [['desktop', 1440, 900, 'full'], ['portrait', 390, 844, 'full'], ['tablet', 768, 1024, 'full'], ['lite', 390, 844, 'lite']]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  await page.goto(`${base}/quiet-machine/?quality=${quality}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__quietMachine?.ready, { timeout: 60000 })
  // closed spans from data
  const planes = []
  for (let i = 0; i <= 100; i++) {
    const u = i / 100
    await seek(page, u)
    planes.push([u, await page.evaluate(() => window.__quietMachine.cutPlane)])
  }
  const closed = planes.filter(([, c]) => c >= .85 - 1e-6).map(([u]) => u)
  // boundary: closed u next to an open u
  const edge = planes.filter(([u, c], i) => c >= .85 - 1e-6 && ((planes[i - 1] && planes[i - 1][1] < .85 - 1e-6) || (planes[i + 1] && planes[i + 1][1] < .85 - 1e-6))).map(([u]) => u)
  const picks = [...new Set([...closed.filter((_, i) => i % 7 === 0), ...edge, closed[0], closed[closed.length - 1]])].sort((a, b) => a - b)
  const rows = []
  for (const u of picks) {
    await seek(page, u)
    await setCaps(page, true)
    const a = await page.locator('.qm-stage').screenshot()
    const t = await page.evaluate(() => { const q = window.__quietMachine; return { drawCalls: q.drawCalls, triangles: q.triangles, cutPlane: q.cutPlane, caps: q.caps } })
    await setCaps(page, false)
    const b = await page.locator('.qm-stage').screenshot()
    await setCaps(page, true)
    const c = await page.locator('.qm-stage').screenshot()   // control: caps-on again
    const onOff = compare(a, b, 0), onOn = compare(a, c, 0)
    const tOff = await page.evaluate(() => null)
    rows.push({ u, cutPlane: t.cutPlane, drawCallsOn: t.drawCalls, trianglesOn: t.triangles, onVsOff: onOff, onVsOn: onOn })
    if (onOff.changed) fs.writeFileSync(path.join(out, `${name}-u${u}-on.png`), a), fs.writeFileSync(path.join(out, `${name}-u${u}-off.png`), b)
  }
  result[name] = { closedCount: closed.length, closedSpan: [closed[0], closed[closed.length - 1]], edge, rows, errors }
  await page.close()
}
await browser.close()
fs.writeFileSync(path.join(out, 'closed-proof.json'), JSON.stringify(result, null, 1))
for (const [n, r] of Object.entries(result)) {
  const max = Math.max(...r.rows.map(x => x.onVsOff.changed)), ctl = Math.max(...r.rows.map(x => x.onVsOn.changed))
  console.log(n, 'closed u count', r.closedCount, 'span', r.closedSpan.join('..'), 'edge', r.edge.join(','), 'tested', r.rows.length, 'max on-vs-off changed', max, 'control on-vs-on', ctl, 'errors', r.errors.length,
    'draw/tri@first', r.rows[0].drawCallsOn, r.rows[0].trianglesOn)
}
